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


def clean_json_response(raw_text: str) -> str:
    """Extrai bloco JSON caso a LLM retorne envolto em ```json ... ```."""
    pattern = r"```(?:json)?\s*([\s\S]*?)\s*```"
    match = re.search(pattern, raw_text)
    if match:
        return match.group(1).strip()
    return raw_text.strip()


class AIService:
    async def _call_llm(self, prompt: str) -> str:
        """
        Executa a chamada para Gemini API ou Ollama local, com fallback defensivo.
        """
        # 1. Tenta Google Gemini API se houver chave configurada
        if settings.gemini_api_key:
            endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"responseMimeType": "application/json"},
            }
            try:
                async with httpx.AsyncClient(timeout=35.0) as client:
                    resp = await client.post(endpoint, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text")
                        if text:
                            return text
            except Exception as e:
                print(f"[AIService] Gemini API error: {e}. Trying Ollama fallback...")

        # 2. Tenta Ollama local
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
                        return resp.json().get("response", "{}")
            except Exception as e:
                print(f"[AIService] Ollama API error: {e}")

        # Se nenhum provedor LLM estiver configurado ou online, lança erro para acionar fallback
        raise RuntimeError("Nenhum provedor de IA (Gemini ou Ollama) respondeu.")

    async def curate_vocabulary_stage1(
        self,
        language: str,
        proficiency: str,
        theme: str,
        target_count: int,
        db: Session,
        native_lang: str = "Portuguese",
    ) -> List[Dict[str, Any]]:
        """
        ETAPA 1: Curadoria de vocabulário alvo e traços linguísticos.
        """
        profile = registry.get(language)

        # Busca palavras fixadas (⭐) e palavras em alerta no cofre do SQLite
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

        try:
            raw = await self._call_llm(prompt)
            data = json.loads(clean_json_response(raw))
            vocab = data.get("vocabulary", [])
            if isinstance(vocab, list) and len(vocab) > 0:
                return vocab
        except Exception as e:
            print(f"[AIService] Erro na Etapa 1 ({e}), usando fallback inteligente do perfil.")

        sample = profile.get_sample_data(proficiency, theme, native_lang=native_lang)
        return sample.get("story_dictionary", [])

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
    ) -> Dict[str, Any]:
        """
        ETAPA 2: Geração da narrativa interlinear, duplo dicionário e hidratação SQLite.
        """
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
            raw = await self._call_llm(prompt)
            data = json.loads(clean_json_response(raw))
            if "sentences" in data and len(data["sentences"]) > 0:
                story_payload = data
        except Exception as e:
            print(f"[AIService] Erro na Etapa 2 ({e}), usando modelo de fallback garantido.")

        if not story_payload:
            story_payload = profile.get_sample_data(proficiency, theme, native_lang=native_lang)

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

        # Constrói o texto completo concatenado para exibição/fallback
        full_text = "\n\n".join([s["target_text"] for s in sentences_normalized])

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


ai_service = AIService()
