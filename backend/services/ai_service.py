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


class AIService:
    def __init__(self):
        self._cache = {}

    async def _call_llm(
        self,
        prompt: str,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ) -> str:
        """
        Executa a chamada para Gemini API ou Ollama local, com diagnóstico preciso de erros.
        """
        effective_key = (api_key or settings.gemini_api_key or "").strip()
        effective_model = (model or settings.gemini_model or "gemini-3.6-flash").strip()

        # 1. Tenta Google Gemini API se houver chave configurada
        if effective_key:
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"responseMimeType": "application/json"},
            }
            emit_log(f"Disparando inferência no modelo {effective_model} via Gemini API...", level="INFO", source="GEMINI")

            # Lista oficial de modelos modernos (Família Gemini 3 e Gemini 2.5)
            candidate_models = [effective_model]
            for alt in ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.7-flash", "gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.5-pro"]:
                if alt not in candidate_models:
                    candidate_models.append(alt)

            for target_model in candidate_models:
                clean_model = target_model.replace("models/", "").strip()
                endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{clean_model}:generateContent?key={effective_key}"
                headers = {
                    "Content-Type": "application/json",
                    "x-goog-api-key": effective_key,
                }
                try:
                    async with httpx.AsyncClient(timeout=35.0) as client:
                        resp = await client.post(endpoint, json=payload, headers=headers)
                        if resp.status_code == 200:
                            data = resp.json()
                            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text")
                            if text:
                                emit_log(f"Resposta estruturada recebida da API Gemini [{clean_model}] ({len(text)} chars).", level="SUCCESS", source="GEMINI")
                                return text
                        elif resp.status_code == 404:
                            err_detail = ""
                            try:
                                err_detail = resp.json().get("error", {}).get("message", resp.text[:180])
                            except Exception:
                                err_detail = resp.text[:180]
                            emit_log(f"Modelo {clean_model} retornou 404 ({err_detail}). Tentando modelo alternativo...", level="WARN", source="GEMINI")
                            continue
                        elif resp.status_code == 400:
                            resp_text = resp.text
                            emit_log(f"Gemini retornou status 400 [{clean_model}]: {resp_text[:150]}", level="WARN", source="GEMINI")
                            if "API key not valid" in resp_text or "INVALID_ARGUMENT" in resp_text:
                                raise AIServiceError(
                                    "A chave da API Gemini fornecida não é válida ou foi recusada pelo Google (Erro 400: API key not valid). Verifique ou gere uma nova chave no Google AI Studio (https://aistudio.google.com/app/apikey).",
                                    error_type="api_key_error",
                                    status_code=400,
                                )
                            break
                        elif resp.status_code == 403:
                            emit_log(f"Gemini retornou status 403 [{clean_model}]: {resp.text[:150]}", level="WARN", source="GEMINI")
                            raise AIServiceError(
                                "Acesso negado para esta chave de API do Gemini (Erro 403). Verifique se a Generative Language API está habilitada no projeto.",
                                error_type="api_key_error",
                                status_code=403,
                            )
                        elif resp.status_code == 429:
                            emit_log(f"Gemini retornou status 429 [{clean_model}]: {resp.text[:150]}", level="WARN", source="GEMINI")
                            raise AIServiceError(
                                "Cota de requisições por minuto do Gemini excedida (Erro 429 RESOURCE_EXHAUSTED). Aguarde 30 a 60 segundos ou alterne o modelo.",
                                error_type="quota_exceeded",
                                status_code=429,
                            )
                        else:
                            emit_log(f"Gemini retornou status {resp.status_code} [{clean_model}]: {resp.text[:150]}", level="WARN", source="GEMINI")
                except AIServiceError:
                    raise
                except Exception as e:
                    emit_log(f"Falha na requisição Gemini [{clean_model}] ({e}).", level="WARN", source="GEMINI")

            # Se todos os modelos estáticos falharam com 404, consulta os modelos autorizados para esta chave
            try:
                emit_log("Consultando modelos autorizados para esta chave (ListModels)...", level="INFO", source="GEMINI")
                async with httpx.AsyncClient(timeout=12.0) as client:
                    list_resp = await client.get(
                        f"https://generativelanguage.googleapis.com/v1beta/models?key={effective_key}",
                        headers={"x-goog-api-key": effective_key},
                    )
                    if list_resp.status_code == 200:
                        raw_models = list_resp.json().get("models", [])
                        discovered = [
                            m.get("name", "").replace("models/", "").strip()
                            for m in raw_models
                            if "generateContent" in m.get("supportedGenerationMethods", [])
                        ]
                        if discovered:
                            emit_log(f"Modelos autorizados encontrados na sua conta: {', '.join(discovered[:4])}", level="INFO", source="GEMINI")
                            for disc_model in discovered:
                                if disc_model not in candidate_models:
                                    alt_endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{disc_model}:generateContent?key={effective_key}"
                                    alt_resp = await client.post(
                                        alt_endpoint,
                                        json=payload,
                                        headers={"Content-Type": "application/json", "x-goog-api-key": effective_key},
                                    )
                                    if alt_resp.status_code == 200:
                                        alt_text = alt_resp.json().get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text")
                                        if alt_text:
                                            emit_log(f"Sucesso gerando com o modelo descoberto [{disc_model}]!", level="SUCCESS", source="GEMINI")
                                            return alt_text
                    else:
                        err_text = list_resp.text
                        try:
                            err_text = list_resp.json().get("error", {}).get("message", err_text)
                        except Exception:
                            pass
                        emit_log(f"Diagnóstico do Google para esta chave ({list_resp.status_code}): {err_text}", level="WARN", source="GEMINI")
            except Exception as disc_err:
                emit_log(f"Falha ao executar diagnóstico de modelos: {disc_err}", level="WARN", source="GEMINI")
        else:
            emit_log("Chave Gemini não configurada. Tentando Ollama local...", level="INFO", source="STAGE")

        # 2. Tenta Ollama local se configurado
        if settings.ollama_url:
            endpoint = f"{settings.ollama_url.rstrip('/')}/api/generate"
            payload = {
                "model": settings.ollama_model,
                "prompt": prompt,
                "stream": False,
                "format": "json",
            }
            try:
                async with httpx.AsyncClient(timeout=40.0) as client:
                    resp = await client.post(endpoint, json=payload)
                    if resp.status_code == 200:
                        emit_log(f"Resposta recebida do Ollama local ({settings.ollama_model}).", level="SUCCESS", source="BACKEND")
                        return resp.json().get("response", "{}")
            except Exception as e:
                print(f"[AIService] Ollama API error: {e}")

        # Se não há chave e nem Ollama respondeu
        if not effective_key:
            raise AIServiceError(
                "Chave de API do Gemini não configurada. Acesse as Configurações para inserir sua chave gratuita do Google AI Studio.",
                error_type="api_key_error",
                status_code=401,
            )

        raise AIServiceError(
            "Nenhum provedor de IA (Gemini ou Ollama) respondeu. Verifique sua conexão e chave nas Configurações.",
            error_type="generation_error",
            status_code=500,
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
            raw = await self._call_llm(prompt, api_key=api_key, model=model)
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
            raw = await self._call_llm(prompt, api_key=api_key, model=model)
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
            raw = await self._call_llm(prompt, api_key=api_key, model=model)
            cleaned = clean_json_response(raw)
            data = json.loads(cleaned)
            emit_log(f"Raio-X IA gerado com sucesso para '{word}'!", level="SUCCESS", source="STAGE")
            return data
        except Exception as e:
            emit_log(f"Falha ao gerar Raio-X via IA ({e}). Usando síntese estruturada de fallback.", level="WARN", source="STAGE")
            fallback = profile.get_deep_dive_fallback(word, proficiency, native_lang=native_lang)
            return fallback


ai_service = AIService()
