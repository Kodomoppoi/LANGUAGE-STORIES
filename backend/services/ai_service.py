import asyncio
import json
import re
import uuid
from typing import Any, AsyncGenerator, Callable, Dict, List, Optional
import httpx
from sqlalchemy.orm import Session

from ..config import settings
from ..database import StoryModel, VocabularyModel
from ..languages.registry import registry
from .srs_engine import get_status_info
from ..routers.logs import emit_log


import time


def clean_json_response(raw_text: str) -> str:
    """Extrai bloco JSON caso a LLM retorne envolto em ```json ... ```."""
    pattern = r"```(?:json)?\s*([\s\S]*?)\s*```"
    match = re.search(pattern, raw_text)
    if match:
        return match.group(1).strip()
    return raw_text.strip()


class AIServiceError(Exception):
    """Exceção estruturada para falhas de provedores de IA e cotas."""
    def __init__(self, message: str, error_type: str = "generation_error", status_code: int = 500):
        super().__init__(message)
        self.error_type = error_type
        self.status_code = status_code


class ProviderRateLimiter:
    """
    Controlador de cadência por janela deslizante (sliding window) e intervalo mínimo
    forçando as requisições a operarem em no MÁXIMO 80% da capacidade nominal (RPM).
    - Gemini Free: 15 RPM nominal -> 80% = 12 RPM (mínimo 5.0s entre chamadas consecutivas)
    - OpenRouter Free: 20 RPM nominal -> 80% = 16 RPM (mínimo 3.75s entre chamadas consecutivas)
    """
    def __init__(self, provider_name: str, max_rpm: int, target_utilization: float = 0.80):
        self.provider_name = provider_name
        self.max_rpm = max_rpm
        self.effective_rpm = max(1.0, max_rpm * target_utilization)
        self.min_interval = 60.0 / self.effective_rpm
        self.timestamps: List[float] = []
        self._lock = asyncio.Lock()

    async def acquire(self):
        async with self._lock:
            now = time.monotonic()
            self.timestamps = [t for t in self.timestamps if now - t < 60.0]

            # 1. Se atingiu 80% da cota nominal por minuto, aguarda janela rolar
            if len(self.timestamps) >= self.effective_rpm:
                oldest = self.timestamps[0]
                sleep_needed = 60.0 - (now - oldest) + 0.15
                if sleep_needed > 0:
                    emit_log(
                        f"Pacing de proteção [{self.provider_name}]: atingiu 80% da capacidade ({len(self.timestamps)}/{self.max_rpm} RPM). Pausando {sleep_needed:.1f}s para evitar cota 429...",
                        level="INFO",
                        source=self.provider_name.upper(),
                    )
                    await asyncio.sleep(sleep_needed)
                    now = time.monotonic()
                    self.timestamps = [t for t in self.timestamps if now - t < 60.0]

            # 2. Espaçamento mínimo entre chamadas consecutivas
            if self.timestamps:
                last_req = self.timestamps[-1]
                elapsed = now - last_req
                if elapsed < self.min_interval:
                    delay = self.min_interval - elapsed
                    await asyncio.sleep(delay)
                    now = time.monotonic()

            self.timestamps.append(now)


gemini_limiter = ProviderRateLimiter("GEMINI", max_rpm=15, target_utilization=0.80)
openrouter_limiter = ProviderRateLimiter("OPENROUTER", max_rpm=20, target_utilization=0.80)


class AIService:
    def __init__(self):
        self._cache = {}

    async def _call_gemini(
        self,
        prompt: str,
        api_key: str,
        model: str,
    ) -> str:
        """Executa chamada direta para o Google Gemini com pacing de no máximo 80% da capacidade."""
        effective_key = api_key.strip()
        effective_model = model.strip() or "gemini-3.6-flash"

        # Pacing: máximo 80% da capacidade (12 RPM, mín 5.0s entre reqs)
        await gemini_limiter.acquire()

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"},
        }
        emit_log(f"Disparando inferência no modelo {effective_model} via Gemini API (pacing 80% ativo)...", level="INFO", source="GEMINI")

        candidate_models = [effective_model]
        fallback_model = "gemini-3.7-flash" if effective_model != "gemini-3.7-flash" else "gemini-3.6-flash"
        if fallback_model not in candidate_models:
            candidate_models.append(fallback_model)

        for target_model in candidate_models:
            clean_model = target_model.replace("models/", "").strip()
            endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{clean_model}:generateContent?key={effective_key}"
            headers = {
                "Content-Type": "application/json",
                "x-goog-api-key": effective_key,
            }

            async with httpx.AsyncClient(timeout=18.0) as client:
                for attempt in range(2):
                    try:
                        resp = await client.post(endpoint, json=payload, headers=headers)
                        if resp.status_code == 200:
                            data = resp.json()
                            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text")
                            if text:
                                emit_log(f"Resposta estruturada recebida da API Gemini [{clean_model}] ({len(text)} chars).", level="SUCCESS", source="GEMINI")
                                return text

                        elif resp.status_code == 503:
                            emit_log(f"Gemini 503 (Servidores em alta demanda) [{clean_model}].", level="WARN", source="GEMINI")
                            if attempt == 0:
                                await asyncio.sleep(2.5)
                                continue
                            break

                        elif resp.status_code == 404:
                            err_detail = ""
                            try:
                                err_detail = resp.json().get("error", {}).get("message", resp.text[:180])
                            except Exception:
                                err_detail = resp.text[:180]
                            emit_log(f"Modelo {clean_model} retornou 404 ({err_detail}).", level="WARN", source="GEMINI")
                            break

                        elif resp.status_code == 400:
                            resp_text = resp.text
                            emit_log(f"Gemini retornou status 400 [{clean_model}]: {resp_text[:150]}", level="WARN", source="GEMINI")
                            if "API key not valid" in resp_text or "INVALID_ARGUMENT" in resp_text:
                                raise AIServiceError(
                                    "A chave da API Gemini fornecida não é válida ou foi recusada pelo Google (Erro 400).",
                                    error_type="api_key_error",
                                    status_code=400,
                                )
                            break

                        elif resp.status_code == 403:
                            emit_log(f"Gemini retornou status 403 [{clean_model}]: {resp.text[:150]}", level="WARN", source="GEMINI")
                            raise AIServiceError(
                                "Acesso negado para esta chave de API do Gemini (Erro 403).",
                                error_type="api_key_error",
                                status_code=403,
                            )

                        elif resp.status_code == 429:
                            resp_text = resp.text
                            emit_log(f"Gemini retornou status 429 [{clean_model}]: {resp_text[:150]}", level="WARN", source="GEMINI")
                            if "billing details" in resp_text or "plan and billing" in resp_text:
                                raise AIServiceError(
                                    "Cota diária ou plano gratuito do Gemini esgotado no Google AI Studio (Erro 429). Utilize o OpenRouter (Free Tier) ou adicione outra chave.",
                                    error_type="quota_exceeded",
                                    status_code=429,
                                )
                            raise AIServiceError(
                                "Cota de requisições por minuto do Gemini excedida (Erro 429 RESOURCE_EXHAUSTED).",
                                error_type="quota_exceeded",
                                status_code=429,
                            )

                        else:
                            emit_log(f"Gemini retornou status {resp.status_code} [{clean_model}]: {resp.text[:150]}", level="WARN", source="GEMINI")
                            break

                    except AIServiceError:
                        raise
                    except httpx.TimeoutException:
                        emit_log(f"Timeout (18s) na requisição Gemini [{clean_model}].", level="WARN", source="GEMINI")
                        break
                    except Exception as e:
                        emit_log(f"Falha na requisição Gemini [{clean_model}] ({e}).", level="WARN", source="GEMINI")
                        break

        raise AIServiceError(
            "Os servidores do Google Gemini estão enfrentando alta demanda temporária (Erro 503).",
            error_type="service_unavailable",
            status_code=503,
        )

    async def _call_openrouter(
        self,
        prompt: str,
        api_key: str,
        model: str,
    ) -> str:
        """Executa chamada para o OpenRouter (Free Tier) com pacing de no máximo 80% da capacidade."""
        effective_key = api_key.strip()
        effective_model = model.strip() or "openrouter/free"

        # Pacing: máximo 80% da capacidade (16 RPM, mín 3.75s entre reqs)
        await openrouter_limiter.acquire()

        emit_log(f"Disparando inferência no OpenRouter [{effective_model}] (pacing 80% ativo)...", level="INFO", source="OPENROUTER")
        endpoint = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {effective_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "Language Stories",
        }
        payload = {
            "model": effective_model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are an expert language pedagogue creating interactive graded reader content. You must output ONLY valid parseable JSON adhering strictly to the user schema without any commentary or markdown outside the JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "response_format": {"type": "json_object"},
        }

        async with httpx.AsyncClient(timeout=35.0) as client:
            try:
                resp = await client.post(endpoint, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices:
                        content = choices[0].get("message", {}).get("content", "")
                        if content:
                            emit_log(f"Resposta estruturada recebida do OpenRouter [{effective_model}] ({len(content)} chars).", level="SUCCESS", source="OPENROUTER")
                            return content
                    raise AIServiceError("OpenRouter retornou resposta sem conteúdo de texto.", error_type="empty_response", status_code=500)

                elif resp.status_code in (401, 403):
                    err_msg = resp.text[:150]
                    emit_log(f"OpenRouter retornou status {resp.status_code}: {err_msg}", level="ERROR", source="OPENROUTER")
                    raise AIServiceError(
                        f"Chave de API do OpenRouter inválida ou recusada ({resp.status_code}). Verifique sua chave no painel do OpenRouter.",
                        error_type="api_key_error",
                        status_code=resp.status_code,
                    )

                elif resp.status_code == 429:
                    emit_log(f"OpenRouter 429 (Cota de requisições excedida): {resp.text[:150]}", level="WARN", source="OPENROUTER")
                    raise AIServiceError(
                        "Cota de requisições do OpenRouter excedida (Erro 429).",
                        error_type="quota_exceeded",
                        status_code=429,
                    )

                elif resp.status_code == 503:
                    emit_log(f"OpenRouter 503 (Serviço temporariamente indisponível): {resp.text[:150]}", level="WARN", source="OPENROUTER")
                    raise AIServiceError(
                        "OpenRouter temporariamente indisponível (Erro 503).",
                        error_type="service_unavailable",
                        status_code=503,
                    )

                else:
                    emit_log(f"OpenRouter retornou status {resp.status_code}: {resp.text[:150]}", level="WARN", source="OPENROUTER")
                    raise AIServiceError(
                        f"OpenRouter retornou status {resp.status_code}: {resp.text[:150]}",
                        error_type="generation_error",
                        status_code=resp.status_code,
                    )
            except AIServiceError:
                raise
            except httpx.TimeoutException:
                emit_log(f"Timeout (35s) na requisição ao OpenRouter [{effective_model}].", level="WARN", source="OPENROUTER")
                raise AIServiceError("Timeout na requisição ao OpenRouter.", error_type="timeout", status_code=504)
            except Exception as e:
                emit_log(f"Falha de conexão com OpenRouter [{effective_model}]: {e}", level="ERROR", source="OPENROUTER")
                raise AIServiceError(f"Falha na comunicação com OpenRouter: {e}", error_type="connection_error", status_code=500)

    async def _call_llm(
        self,
        prompt: str,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        openrouter_key: Optional[str] = None,
        openrouter_model: Optional[str] = None,
        api_provider: Optional[str] = None,
    ) -> str:
        """
        Executa a chamada para Gemini, OpenRouter ou Ollama, com auto-fallback inteligente
        e respeito rigoroso ao teto de 80% da capacidade por provedor.
        """
        gemini_key = (api_key or settings.gemini_api_key or "").strip()
        gemini_model = (model or settings.gemini_model or "gemini-3.6-flash").strip()
        or_key = (openrouter_key or settings.openrouter_api_key or "").strip()
        or_model = (openrouter_model or settings.openrouter_model or "openrouter/free").strip()
        provider = (api_provider or settings.api_provider or "hybrid").lower().strip()

        # 1. Provedor explicitamente OpenRouter
        if provider == "openrouter":
            if not or_key:
                raise AIServiceError(
                    "Chave de API do OpenRouter não configurada. Insira sua chave gratuita nas Configurações.",
                    error_type="api_key_error",
                    status_code=401,
                )
            return await self._call_openrouter(prompt, or_key, or_model)

        # 2. Provedor explicitamente Gemini
        elif provider == "gemini":
            if not gemini_key:
                raise AIServiceError(
                    "Chave de API do Gemini não configurada. Insira sua chave do Google AI Studio nas Configurações.",
                    error_type="api_key_error",
                    status_code=401,
                )
            return await self._call_gemini(prompt, gemini_key, gemini_model)

        # 3. Modo Híbrido (Auto-Fallback de ambos os provedores)
        else:
            # Prioriza Gemini se configurado com fallback transparente para OpenRouter
            if gemini_key:
                try:
                    return await self._call_gemini(prompt, gemini_key, gemini_model)
                except AIServiceError as e:
                    if e.status_code in (503, 429) and or_key:
                        emit_log(f"Gemini retornou status {e.status_code}. Acionando Auto-Fallback inteligente para OpenRouter Free Tier [{or_model}]...", level="WARN", source="STAGE")
                        return await self._call_openrouter(prompt, or_key, or_model)
                    elif or_key:
                        emit_log(f"Gemini falhou ({e.message}). Tentando OpenRouter...", level="WARN", source="STAGE")
                        return await self._call_openrouter(prompt, or_key, or_model)
                    raise
            elif or_key:
                return await self._call_openrouter(prompt, or_key, or_model)
            elif settings.ollama_url:
                endpoint = f"{settings.ollama_url.rstrip('/')}/api/generate"
                payload = {"model": settings.ollama_model, "prompt": prompt, "stream": False, "format": "json"}
                try:
                    async with httpx.AsyncClient(timeout=40.0) as client:
                        resp = await client.post(endpoint, json=payload)
                        if resp.status_code == 200:
                            emit_log(f"Resposta recebida do Ollama local ({settings.ollama_model}).", level="SUCCESS", source="BACKEND")
                            return resp.json().get("response", "{}")
                except Exception as e:
                    print(f"[AIService] Ollama API error: {e}")

            raise AIServiceError(
                "Nenhum provedor de IA (Gemini ou OpenRouter) está configurado. Acesse as Configurações para inserir sua chave gratuita.",
                error_type="api_key_error",
                status_code=401,
            )

    async def curate_vocabulary_stage1(
        self,
        language: str,
        proficiency: str,
        theme: str,
        target_count: int,
        db: Session,
        native_lang: str = "Portuguese",
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        openrouter_key: Optional[str] = None,
        openrouter_model: Optional[str] = None,
        api_provider: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        ETAPA 1: Curadoria de vocabulário alvo e traços linguísticos.
        """
        profile = registry.get(language)

        pinned_entries = (
            db.query(VocabularyModel)
            .filter(VocabularyModel.language == language, VocabularyModel.is_pinned == True)
            .limit(4)
            .all()
        )
        pinned_words = [e.word for e in pinned_entries]

        review_entries = (
            db.query(VocabularyModel)
            .filter(VocabularyModel.language == language, VocabularyModel.status_color == "orange")
            .order_by(VocabularyModel.looked_up_count.desc())
            .limit(3)
            .all()
        )
        review_words = [e.word for e in review_entries]

        prompt = profile.build_curation_prompt(
            theme=theme,
            proficiency=proficiency,
            target_count=target_count,
            pinned_words=pinned_words,
            review_words=review_words,
            native_lang=native_lang,
        )

        theme_desc = f'"{theme}"' if theme and theme.strip() else 'Automático (mais didático)'
        emit_log(f"Iniciando Etapa 1: Curadoria de vocabulário ({language.upper()} | {proficiency} | Tema: {theme_desc})", level="INFO", source="STAGE")

        try:
            raw = await self._call_llm(
                prompt,
                api_key=api_key,
                model=model,
                openrouter_key=openrouter_key,
                openrouter_model=openrouter_model,
                api_provider=api_provider,
            )
            data = json.loads(clean_json_response(raw))
            vocab = data.get("vocabulary", [])
            if isinstance(vocab, list) and len(vocab) > 0:
                emit_log(f"Etapa 1 Concluída: {len(vocab)} termos alvo curados com sucesso.", level="SUCCESS", source="STAGE")
                return vocab
        except AIServiceError:
            raise
        except Exception as e:
            emit_log(f"Erro na Etapa 1 ({e}).", level="ERROR", source="STAGE")
            raise AIServiceError(f"Erro durante a curadoria de vocabulário: {e}", error_type="generation_error", status_code=500)

        raise AIServiceError("A IA não retornou um vocabulário estruturado válido.", error_type="generation_error", status_code=500)

    async def generate_interlinear_story_stage2(
        self,
        curated_vocab: List[Dict[str, Any]],
        language: str,
        proficiency: str,
        theme: str,
        story_length: str,
        repetition_density: str,
        db: Session,
        native_lang: str = "Portuguese",
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        openrouter_key: Optional[str] = None,
        openrouter_model: Optional[str] = None,
        api_provider: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        ETAPA 2: Geração da narrativa interlinear, duplo dicionário e hidratação SQLite.
        """
        emit_log(f"Iniciando Etapa 2: Redigindo narrativa interlinear com {len(curated_vocab)} termos alvo...", level="INFO", source="STAGE")
        profile = registry.get(language)
        prompt = profile.build_story_prompt(
            curated_vocab=curated_vocab,
            theme=theme,
            proficiency=proficiency,
            story_length=story_length,
            repetition_density=repetition_density,
            native_lang=native_lang,
        )

        story_payload = None
        try:
            raw = await self._call_llm(
                prompt,
                api_key=api_key,
                model=model,
                openrouter_key=openrouter_key,
                openrouter_model=openrouter_model,
                api_provider=api_provider,
            )
            data = json.loads(clean_json_response(raw))
            if "sentences" in data and len(data["sentences"]) > 0:
                emit_log(f"Etapa 2 Concluída: História redigida com {len(data['sentences'])} pares de sentenças!", level="SUCCESS", source="STAGE")
                story_payload = data
        except AIServiceError:
            raise
        except Exception as e:
            emit_log(f"Erro na Etapa 2 ({e}).", level="ERROR", source="STAGE")
            raise AIServiceError(f"Erro durante a redação da narrativa: {e}", error_type="generation_error", status_code=500)

        if not story_payload or not story_payload.get("sentences"):
            raise AIServiceError("A IA não retornou sentenças válidas para a narrativa.", error_type="generation_error", status_code=500)

        # Normaliza sentences (SentencePair: id, target_text, translation_text)
        sentences_normalized = []
        for idx, s in enumerate(story_payload.get("sentences", [])):
            sentences_normalized.append({
                "id": s.get("id") or (idx + 1),
                "target_text": s.get("target_text") or s.get("text") or "",
                "translation_text": s.get("translation_text") or s.get("translation") or "",
            })

        # Hidratação inteligente com a tabela vocabulary (Cofre Local SQLite)
        raw_dict = story_payload.get("story_dictionary", [])
        hydrated_dictionary = []

        for item in raw_dict:
            word_str = item.get("word") or item.get("lemma") or ""
            if not word_str:
                continue

            # Busca no SQLite pelo termo no idioma
            db_entry = (
                db.query(VocabularyModel)
                .filter(VocabularyModel.language == language, VocabularyModel.word == word_str)
                .first()
            )

            traits = profile.extract_traits(item)

            if db_entry:
                color, label, weight, stage = get_status_info(db_entry.mastery_score, db_entry.is_pinned)
                hydrated_dictionary.append({
                    "id": db_entry.id,
                    "word": db_entry.word,
                    "lemma": db_entry.lemma or word_str,
                    "ruby": db_entry.ruby or item.get("pinyin") or item.get("ruby"),
                    "part_of_speech": db_entry.part_of_speech,
                    "context_translation": item.get("context_translation") or db_entry.translation,
                    "traits": traits,
                    "mastery_score": db_entry.mastery_score,
                    "status_label": label,
                    "status_color": color,
                    "repetition_weight": weight,
                    "in_vault": True,
                    "is_pinned": db_entry.is_pinned,
                })
            else:
                # Palavra nova catalogada pela IA
                default_score = 0.25
                color, label, weight, stage = get_status_info(default_score, is_pinned=False)

                new_vocab = VocabularyModel(
                    language=language,
                    word=word_str,
                    lemma=item.get("lemma", word_str),
                    ruby=item.get("pinyin") or item.get("ruby") or "",
                    translation=item.get("context_translation", ""),
                    part_of_speech=item.get("part_of_speech", "NOUN"),
                    traits_json=traits,
                    mastery_score=default_score,
                    status_label=label,
                    status_color=color,
                    repetition_weight=weight,
                    looked_up_count=0,
                    is_pinned=False,
                    is_starred=False,
                )
                db.add(new_vocab)
                db.flush()

                hydrated_dictionary.append({
                    "id": new_vocab.id,
                    "word": new_vocab.word,
                    "lemma": new_vocab.lemma,
                    "ruby": new_vocab.ruby,
                    "part_of_speech": new_vocab.part_of_speech,
                    "context_translation": item.get("context_translation", ""),
                    "traits": traits,
                    "mastery_score": default_score,
                    "status_label": label,
                    "status_color": color,
                    "repetition_weight": weight,
                    "in_vault": False,
                    "is_pinned": False,
                })

        db.commit()

        # Constrói o texto completo concatenado com parágrafos literários naturais
        para_chunks = []
        c_size = 2 if len(sentences_normalized) <= 6 else 3
        for i in range(0, len(sentences_normalized), c_size):
            chunk_s = sentences_normalized[i:i + c_size]
            join_char = "" if any("\u4e00" <= c <= "\u9fff" for c in "".join(s["target_text"] for s in chunk_s)) else " "
            para_chunks.append(join_char.join([s["target_text"] for s in chunk_s]))
        full_text = "\n\n".join(para_chunks)

        # Regra de ciclo de vida: Ao gerar uma nova história, todas as histórias anteriores
        # (textos, traduções e glossários temporários) são apagadas do banco.
        # A ÚNICA coisa preservada e acumulada é o vocabulário global (VocabularyModel).
        db.query(StoryModel).delete()
        db.commit()

        story_record = StoryModel(
            title=story_payload.get("title", "História"),
            title_translation=story_payload.get("title_translation", ""),
            language=language,
            proficiency=proficiency,
            theme=theme,
            story_length=story_length,
            repetition_density=repetition_density,
            full_text=full_text,
            sentences_json=sentences_normalized,
            story_dictionary_json=hydrated_dictionary,
            story_translated_dict_json=story_payload.get("story_translated_dictionary", []),
            quiz_json=[],
        )
        db.add(story_record)
        db.commit()
        db.refresh(story_record)

        return {
            "id": story_record.id,
            "title": story_record.title,
            "title_translation": story_record.title_translation,
            "language": story_record.language,
            "proficiency": story_record.proficiency,
            "theme": story_record.theme,
            "story_length": story_record.story_length,
            "repetition_density": story_record.repetition_density,
            "sentences": sentences_normalized,
            "story_dictionary": hydrated_dictionary,
            "story_translated_dictionary": story_record.story_translated_dict_json,
            "full_text": story_record.full_text,
            "created_at": story_record.created_at.isoformat(),
        }

    async def lookup_word_dynamic(
        self,
        word: str,
        sentence_context: str,
        language: str,
        db: Session,
        native_lang: str = "Portuguese",
    ) -> Dict[str, Any]:
        """
        Lookup ultra-rápido para popover de palavras fora do dicionário pré-carregado.
        """
        profile = registry.get(language)

        # 1. Verifica se já está no cofre SQLite
        existing = (
            db.query(VocabularyModel)
            .filter(VocabularyModel.language == language, VocabularyModel.word == word)
            .first()
        )
        if existing:
            color, label, weight, stage = get_status_info(existing.mastery_score, existing.is_pinned)
            return {
                "id": existing.id,
                "word": existing.word,
                "lemma": existing.lemma or word,
                "ruby": existing.ruby,
                "part_of_speech": existing.part_of_speech,
                "context_translation": existing.translation,
                "traits": existing.traits_json or {},
                "mastery_score": existing.mastery_score,
                "status_label": label,
                "status_color": color,
                "repetition_weight": weight,
                "in_vault": True,
                "is_pinned": existing.is_pinned,
            }

        # 2. Chama a IA para análise no contexto exato
        prompt = profile.build_lookup_prompt(word, sentence_context, native_lang=native_lang)
        data = {}
        try:
            raw = await self._call_llm(prompt)
            data = json.loads(clean_json_response(raw))
        except Exception:
            data = {
                "word": word,
                "lemma": word,
                "ruby": "",
                "part_of_speech": "NOUN",
                "context_translation": "Tradução contextual",
                "explanation": f"Uso de {word} no texto.",
            }

        traits = profile.extract_traits(data)
        default_score = 0.20
        color, label, weight, stage = get_status_info(default_score, is_pinned=False)

        new_entry = VocabularyModel(
            language=language,
            word=word,
            lemma=data.get("lemma", word),
            ruby=data.get("pinyin") or data.get("ruby") or "",
            translation=data.get("context_translation", ""),
            part_of_speech=data.get("part_of_speech", "NOUN"),
            traits_json=traits,
            mastery_score=default_score,
            status_label=label,
            status_color=color,
            repetition_weight=weight,
            looked_up_count=1,
            is_pinned=False,
            is_starred=False,
        )
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)

        return {
            "id": new_entry.id,
            "word": new_entry.word,
            "lemma": new_entry.lemma,
            "ruby": new_entry.ruby,
            "part_of_speech": new_entry.part_of_speech,
            "context_translation": new_entry.translation,
            "traits": traits,
            "mastery_score": default_score,
            "status_label": label,
            "status_color": color,
            "repetition_weight": weight,
            "in_vault": True,
            "is_pinned": False,
        }

    async def explain_word_deep_dive(
        self,
        word: str,
        language: str,
        sentence_context: str = "",
        proficiency: str = "A2",
        native_lang: str = "Portuguese",
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        openrouter_key: Optional[str] = None,
        openrouter_model: Optional[str] = None,
        api_provider: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Gera uma explicação aprofundada (Raio-X) sob demanda com anatomia de caracteres,
        radicais, fonética, homófonos e sinônimos com limites rígidos de caracteres.
        """
        profile = registry.get(language)
        emit_log(f"Iniciando Raio-X IA para o termo: '{word}' ({language.upper()} | {proficiency})", level="INFO", source="STAGE")

        prompt = profile.build_deep_dive_prompt(
            word=word,
            sentence_context=sentence_context,
            proficiency=proficiency,
            native_lang=native_lang,
        )

        try:
            raw = await self._call_llm(
                prompt,
                api_key=api_key,
                model=model,
                openrouter_key=openrouter_key,
                openrouter_model=openrouter_model,
                api_provider=api_provider,
            )
            cleaned = clean_json_response(raw)
            data = json.loads(cleaned)
            emit_log(f"Raio-X IA gerado com sucesso para '{word}'!", level="SUCCESS", source="STAGE")
            return data
        except Exception as e:
            emit_log(f"Falha ao gerar Raio-X via IA ({e}). Usando síntese estruturada de fallback.", level="WARN", source="STAGE")
            fallback = profile.get_deep_dive_fallback(word, proficiency, native_lang=native_lang)
            return fallback


ai_service = AIService()
