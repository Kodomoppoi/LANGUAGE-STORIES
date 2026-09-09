import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.ai_service import ai_service, AIServiceError
from ..languages.phonetics import enrich_tokens_phonetics, get_phonetic_reading
from ..languages.lexicon import get_auxiliary_translation, get_auxiliary_pos, is_invalid_translation
from .logs import emit_log


router = APIRouter(prefix="/api/stories", tags=["Stories"])


class GenerateStoryRequest(BaseModel):
    language: str = "zh"
    proficiency: str = "A2"
    theme: Optional[str] = None
    contextTheme: Optional[str] = None
    target_vocab_count: Optional[int] = None
    targetVocabCount: Optional[int] = None
    story_length: Optional[str] = None
    storyLength: Optional[str] = None
    repetition_density: Optional[str] = None
    repetitionDensity: Optional[str] = None
    native_lang: Optional[str] = None
    nativeLanguage: Optional[str] = None

    gemini_api_key: Optional[str] = None
    geminiApiKey: Optional[str] = None
    gemini_model: Optional[str] = None
    geminiModel: Optional[str] = None

    openrouter_api_key: Optional[str] = None
    openRouterApiKey: Optional[str] = None
    openrouter_model: Optional[str] = None
    openRouterModel: Optional[str] = None

    api_provider: Optional[str] = None
    apiProvider: Optional[str] = None

    def resolved_theme(self) -> str:
        val = (self.theme or self.contextTheme or "").strip()
        if not val or val.lower() in ["general", "auto", "none", "automatic", "automático"]:
            return ""
        return val

    def resolved_target_count(self) -> int:
        return self.target_vocab_count or self.targetVocabCount or 8

    def resolved_story_length(self) -> str:
        return self.story_length or self.storyLength or "standard"

    def resolved_repetition_density(self) -> str:
        return self.repetition_density or self.repetitionDensity or "high"

    def resolved_native_lang(self) -> str:
        return self.native_lang or self.nativeLanguage or "Portuguese"

    def resolved_gemini_key(self) -> str:
        return (self.gemini_api_key or self.geminiApiKey or "").strip()

    def resolved_gemini_model(self) -> str:
        return (self.gemini_model or self.geminiModel or "").strip()

    def resolved_openrouter_key(self) -> str:
        return (self.openrouter_api_key or self.openRouterApiKey or "").strip()

    def resolved_openrouter_model(self) -> str:
        return (self.openrouter_model or self.openRouterModel or "").strip()

    def resolved_api_provider(self) -> str:
        return (self.api_provider or self.apiProvider or "").strip()


def _enrich_story_response(story_data: Dict[str, Any], language: Optional[str] = None) -> Dict[str, Any]:
    """
    Garante máxima compatibilidade de contratos entre frontend legado e
    nova arquitetura interlinear (sentences, paragraphs, dictionary, targetVocabulary, full_text).
    Aplica enriquecimento fonético para 100% de cobertura de Ruby em Mandarim e Japonês.
    """
    sentences = story_data.get("sentences", [])
    story_dict = story_data.get("story_dictionary", [])
    lang = (language or story_data.get("language") or "zh").lower()

    # Cria índice de termos conhecidos da história para segmentação precisa de palavras compostas
    known_dict = {}
    for d in story_dict:
        w = d.get("word")
        if w and isinstance(w, str) and w.strip():
            w_clean = w.strip()
            known_dict[w_clean] = {
                "ruby": d.get("ruby") or d.get("pinyin"),
                "context_translation": d.get("context_translation") or d.get("translation"),
                "part_of_speech": d.get("part_of_speech") or d.get("partOfSpeech"),
                "isTargetWord": True,
                "mastery_score": d.get("mastery_score", 0.25),
                "status_color": d.get("status_color", "orange"),
                "traits": d.get("traits", {}),
            }

    # Cria parágrafos estruturados caso o frontend utilize tokens diretamente
    paragraphs = []
    sentences_objects = []
    translations = []

    for idx, s in enumerate(sentences):
        target_text = s.get("target_text", "")
        translation_text = s.get("translation_text", "")
        translations.append(translation_text)

        tokens = []
        is_cjk = any("\u4e00" <= c <= "\u9fff" for c in target_text)

        if is_cjk:
            i = 0
            n = len(target_text)
            max_len = 6
            c_idx = 0

            while i < n:
                char = target_text[i]
                # Preserva pontuações e espaçamentos como tokens de pontuação
                if char in " ，。！？、“”‘’：；（）…—\t\r\n,.!?:;\"'()[]{}":
                    tokens.append({
                        "id": f"t-{idx}-{c_idx}",
                        "text": char,
                        "ruby": None,
                        "translation": None,
                        "partOfSpeech": "Punctuation",
                        "isTargetWord": False,
                        "masteryScore": 100,
                        "statusColor": "green",
                        "traits": {},
                    })
                    i += 1
                    c_idx += 1
                    continue

                matched_word = None
                matched_meta = None

                # Tenta casar a maior palavra conhecida (de 6 até 2 caracteres)
                for l in range(min(max_len, n - i), 1, -1):
                    sub = target_text[i : i + l]
                    if sub in known_dict:
                        matched_word = sub
                        matched_meta = known_dict[sub]
                        break
                    aux_trans = get_auxiliary_translation(sub, lang, native_lang="Portuguese")
                    if aux_trans:
                        matched_word = sub
                        matched_meta = {
                            "ruby": None,
                            "context_translation": aux_trans,
                            "part_of_speech": get_auxiliary_pos(sub, lang),
                            "isTargetWord": False,
                            "mastery_score": 0.25,
                            "status_color": "orange",
                            "traits": {},
                        }
                        break

                if matched_word and matched_meta:
                    trans_val = matched_meta.get("context_translation")
                    if is_invalid_translation(trans_val, matched_word):
                        aux_trans = get_auxiliary_translation(matched_word, lang, native_lang="Portuguese")
                        trans_val = aux_trans or "Vocábulo no contexto"

                    tokens.append({
                        "id": f"t-{idx}-{c_idx}",
                        "text": matched_word,
                        "ruby": matched_meta.get("ruby"),
                        "translation": trans_val,
                        "partOfSpeech": matched_meta.get("part_of_speech") or get_auxiliary_pos(matched_word, lang),
                        "isTargetWord": matched_meta.get("isTargetWord", False),
                        "masteryScore": round(matched_meta.get("mastery_score", 0.25) * 100),
                        "statusColor": matched_meta.get("status_color", "orange"),
                        "traits": matched_meta.get("traits", {}),
                    })
                    i += len(matched_word)
                    c_idx += 1
                else:
                    single_char = target_text[i]
                    single_meta = known_dict.get(single_char, {})
                    trans_val = single_meta.get("context_translation")
                    if is_invalid_translation(trans_val, single_char):
                        aux_trans = get_auxiliary_translation(single_char, lang, native_lang="Portuguese")
                        trans_val = aux_trans or "Vocábulo no contexto"

                    tokens.append({
                        "id": f"t-{idx}-{c_idx}",
                        "text": single_char,
                        "ruby": single_meta.get("ruby"),
                        "translation": trans_val,
                        "partOfSpeech": single_meta.get("part_of_speech") or get_auxiliary_pos(single_char, lang),
                        "isTargetWord": bool(single_meta),
                        "masteryScore": round(single_meta.get("mastery_score", 0.25) * 100) if single_meta else 25,
                        "statusColor": single_meta.get("status_color", "orange") if single_meta else "orange",
                        "traits": single_meta.get("traits", {}),
                    })
                    i += 1
                    c_idx += 1
        else:
            # Tokenização alfabética por palavras
            units = target_text.split()
            for c_idx, unit in enumerate(units):
                clean_unit = unit.strip(" ,.!?;:\"'()[]{}")
                matched = next((d for d in story_dict if clean_unit.lower() == d.get("word", "").lower()), None)
                trans_val = matched.get("context_translation") if matched else None
                pos_val = matched.get("part_of_speech") if matched else None

                if is_invalid_translation(trans_val, clean_unit):
                    aux_trans = get_auxiliary_translation(clean_unit, lang, native_lang="Portuguese")
                    trans_val = aux_trans or "Vocábulo no contexto"
                if not pos_val:
                    pos_val = get_auxiliary_pos(clean_unit, lang)

                tokens.append({
                    "id": f"t-{idx}-{c_idx}",
                    "text": unit,
                    "ruby": None,
                    "translation": trans_val,
                    "partOfSpeech": pos_val or "Word",
                    "isTargetWord": bool(matched),
                    "masteryScore": round(matched.get("mastery_score", 0.25) * 100) if matched else 25,
                    "statusColor": matched.get("status_color", "orange") if matched else "orange",
                    "traits": matched.get("traits", {}) if matched else {},
                })

        # 100% Ruby: Preenche fonética para todos os tokens restantes no idioma
        tokens = enrich_tokens_phonetics(tokens, lang)

        sentences_objects.append({
            "id": f"s-{idx + 1}",
            "text": target_text,
            "target_text": target_text,
            "translation": translation_text,
            "translation_text": translation_text,
            "tokens": tokens,
        })

    # Agrupa sentenças em parágrafos literários naturais (2 a 3 sentenças por bloco)
    chunk_size = 2 if len(sentences_objects) <= 6 else 3
    paragraphs = []
    for p_idx in range(0, len(sentences_objects), chunk_size):
        chunk = sentences_objects[p_idx:p_idx + chunk_size]
        paragraphs.append({
            "id": f"p-{(p_idx // chunk_size) + 1}",
            "sentences": chunk,
        })

    # Constrói targetVocabulary estritamente compatível com DictionaryEntry do frontend
    target_vocabulary = []
    for idx, item in enumerate(story_dict):
        traits = item.get("traits", {})
        word_val = item.get("word") or item.get("lemma") or f"Term-{idx}"
        ruby_val = item.get("ruby") or item.get("pinyin") or get_phonetic_reading(word_val, lang)

        raw_trans = item.get("context_translation") or item.get("translation")
        if not raw_trans or str(raw_trans).strip() in ["Termo em contexto", "Contextual translation", ""]:
            raw_trans = get_auxiliary_translation(word_val, lang, "Portuguese") or "Vocabulário"

        target_vocabulary.append({
            "id": str(item.get("id") or f"dict-{idx}"),
            "word": word_val,
            "ruby": ruby_val,
            "phonetic": ruby_val,
            "translation": raw_trans,
            "partOfSpeech": item.get("part_of_speech") or traits.get("part_of_speech") or get_auxiliary_pos(word_val, lang) or "Noun",
            "definition": raw_trans,
            "exampleSentence": item.get("example_sentence") or word_val,
            "exampleTranslation": item.get("example_translation") or raw_trans or "",
            "language": lang,
            "proficiency": story_data.get("proficiency", "A2"),
            "isStarred": bool(item.get("is_pinned")),
            "isPinned": bool(item.get("is_pinned")),
            "masteryScore": round(item.get("mastery_score", 0.25) * 100),
            "statusColor": item.get("status_color", "orange"),
            "repetitionWeight": item.get("repetition_weight", 1.0),
            "traits": traits,
        })

    enriched = dict(story_data)
    enriched["paragraphs"] = paragraphs
    enriched["dictionary"] = story_dict
    enriched["targetVocabulary"] = target_vocabulary
    enriched["translations"] = translations
    enriched["paragraph_translations"] = translations
    enriched["titleTranslation"] = story_data.get("title_translation", "")
    enriched["fullText"] = story_data.get("full_text", "")
    enriched["content"] = story_data.get("full_text", "")
    return enriched


@router.post("/generate")
async def generate_story(
    req: GenerateStoryRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Geração direta de história narrativa interlinear com pipeline de 2 estágios.
    """
    theme = req.resolved_theme()
    count = req.resolved_target_count()
    length = req.resolved_story_length()
    rep = req.resolved_repetition_density()
    native = req.resolved_native_lang()
    gemini_key = req.resolved_gemini_key()
    gemini_model = req.resolved_gemini_model()
    or_key = req.resolved_openrouter_key()
    or_model = req.resolved_openrouter_model()
    provider = req.resolved_api_provider()

    from ..config import settings
    if gemini_key:
        settings.gemini_api_key = gemini_key
        if gemini_model:
            settings.gemini_model = gemini_model
    if or_key:
        settings.openrouter_api_key = or_key
        if or_model:
            settings.openrouter_model = or_model
    if provider:
        settings.api_provider = provider

    try:
        # Estágio 1: Curadoria
        curated_vocab = await ai_service.curate_vocabulary_stage1(
            language=req.language,
            proficiency=req.proficiency,
            theme=theme,
            target_count=count,
            db=db,
            native_lang=native,
            api_key=gemini_key,
            model=gemini_model,
            openrouter_key=or_key,
            openrouter_model=or_model,
            api_provider=provider,
        )

        # Estágio 2: Geração Interlinear e Hidratação SQLite
        story_data = await ai_service.generate_interlinear_story_stage2(
            curated_vocab=curated_vocab,
            language=req.language,
            proficiency=req.proficiency,
            theme=theme,
            story_length=length,
            repetition_density=rep,
            db=db,
            native_lang=native,
            api_key=gemini_key,
            model=gemini_model,
            openrouter_key=or_key,
            openrouter_model=or_model,
            api_provider=provider,
        )

        return _enrich_story_response(story_data, language=req.language)
    except AIServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {e}")


@router.get("/current")
def get_current_story(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Retorna a história ativa atual salva no banco.
    """
    from ..database import StoryModel
    story = db.query(StoryModel).order_by(StoryModel.created_at.desc()).first()
    if not story:
        raise HTTPException(status_code=404, detail="Nenhuma história ativa encontrada")

    story_data = {
        "id": story.id,
        "title": story.title,
        "title_translation": story.title_translation,
        "language": story.language,
        "proficiency": story.proficiency,
        "theme": story.theme,
        "story_length": story.story_length,
        "repetition_density": story.repetition_density,
        "full_text": story.full_text,
        "sentences": story.sentences_json,
        "story_dictionary": story.story_dictionary_json,
        "story_translated_dictionary": story.story_translated_dict_json,
    }
    return _enrich_story_response(story_data)


@router.delete("")
def delete_all_stories(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Apaga todas as histórias do banco, preservando integralmente o vocabulário global (VocabularyModel).
    """
    from ..database import StoryModel
    deleted_count = db.query(StoryModel).delete()
    db.commit()
    return {
        "status": "ok",
        "deleted_count": deleted_count,
        "message": "Histórias temporárias apagadas com sucesso. O vocabulário global foi mantido intacto."
    }


@router.post("/generate/stream")
async def generate_story_stream(
    req: GenerateStoryRequest,
    db: Session = Depends(get_db),
):
    """
    Streaming Server-Sent Events (SSE) para atualização em tempo real do mascote.
    Eventos emitidos:
      - stage_start: curation
      - stage_curation_done: vocabulário selecionado
      - stage_start: generation
      - stage_start: validation
      - stage_done: história completa
    """
    theme = req.resolved_theme()
    count = req.resolved_target_count()
    length = req.resolved_story_length()
    rep = req.resolved_repetition_density()
    native = req.resolved_native_lang()
    gemini_key = req.resolved_gemini_key()
    gemini_model = req.resolved_gemini_model()
    or_key = req.resolved_openrouter_key()
    or_model = req.resolved_openrouter_model()
    provider = req.resolved_api_provider()

    from ..config import settings
    if gemini_key:
        settings.gemini_api_key = gemini_key
        if gemini_model:
            settings.gemini_model = gemini_model
    if or_key:
        settings.openrouter_api_key = or_key
        if or_model:
            settings.openrouter_model = or_model
    if provider:
        settings.api_provider = provider

    async def sse_event_generator():
        try:
            # 1. Início da Curadoria
            yield f"event: stage_start\ndata: {json.dumps({'stage': 'curation', 'message': 'Analisando histórico e selecionando vocabulário crítico...'})}\n\n"

            curated_vocab = await ai_service.curate_vocabulary_stage1(
                language=req.language,
                proficiency=req.proficiency,
                theme=theme,
                target_count=count,
                db=db,
                native_lang=native,
                api_key=gemini_key,
                model=gemini_model,
                openrouter_key=or_key,
                openrouter_model=or_model,
                api_provider=provider,
            )

            words_list = [v.get("word") or v.get("lemma") for v in curated_vocab if v.get("word") or v.get("lemma")]
            yield f"event: stage_curation_done\ndata: {json.dumps({'count': len(words_list), 'words': words_list})}\n\n"

            # 2. Início da Geração
            yield f"event: stage_start\ndata: {json.dumps({'stage': 'generation', 'message': 'Criando narrativa interlinear com repetições calculadas...'})}\n\n"

            story_data = await ai_service.generate_interlinear_story_stage2(
                curated_vocab=curated_vocab,
                language=req.language,
                proficiency=req.proficiency,
                theme=theme,
                story_length=length,
                repetition_density=rep,
                db=db,
                native_lang=native,
                api_key=gemini_key,
                model=gemini_model,
                openrouter_key=or_key,
                openrouter_model=or_model,
                api_provider=provider,
            )

            # 3. Validação e Traços
            yield f"event: stage_start\ndata: {json.dumps({'stage': 'validation', 'message': 'Validando gramática e hidratação de traços linguísticos...'})}\n\n"

            enriched = _enrich_story_response(story_data, language=req.language)

            # 4. Finalização
            yield f"event: stage_done\ndata: {json.dumps({'story': enriched})}\n\n"
        except Exception as e:
            error_type = getattr(e, "error_type", "generation_error")
            status_code = getattr(e, "status_code", 500)
            err_msg = str(e)
            emit_log(f"Falha no fluxo SSE da história ({error_type} {status_code}): {err_msg}", level="ERROR", source="STAGE")
            yield f"event: error\ndata: {json.dumps({'error_type': error_type, 'error_message': err_msg, 'message': err_msg, 'status_code': status_code})}\n\n"

    return StreamingResponse(sse_event_generator(), media_type="text/event-stream")
