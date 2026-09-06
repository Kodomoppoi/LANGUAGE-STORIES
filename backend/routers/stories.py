import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.ai_service import ai_service


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


def _enrich_story_response(story_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Garante máxima compatibilidade de contratos entre frontend legado e
    nova arquitetura interlinear (sentences, paragraphs, dictionary, full_text).
    """
    sentences = story_data.get("sentences", [])
    story_dict = story_data.get("story_dictionary", [])

    # Cria parágrafos estruturados caso o frontend utilize tokens diretamente
    paragraphs = []
    sentences_objects = []
    translations = []

    for idx, s in enumerate(sentences):
        target_text = s.get("target_text", "")
        translation_text = s.get("translation_text", "")
        translations.append(translation_text)

        # Tokenização defensiva por caracteres (CJK) ou palavras
        tokens = []
        is_cjk = any("\u4e00" <= c <= "\u9fff" for c in target_text)
        units = list(target_text) if is_cjk else target_text.split()

        for c_idx, unit in enumerate(units):
            matched = next((d for d in story_dict if unit in d.get("word", "")), None)
            tokens.append({
                "id": f"t-{idx}-{c_idx}",
                "text": unit,
                "ruby": matched.get("ruby") if matched else None,
                "translation": matched.get("context_translation") if matched else None,
                "partOfSpeech": matched.get("part_of_speech") if matched else None,
                "isTargetWord": bool(matched),
                "masteryScore": round(matched.get("mastery_score", 0.25) * 100) if matched else 25,
                "statusColor": matched.get("status_color", "orange") if matched else "orange",
                "traits": matched.get("traits", {}) if matched else {},
            })

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

    enriched = dict(story_data)
    enriched["paragraphs"] = paragraphs
    enriched["dictionary"] = story_dict
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

    if gemini_key:
        from ..config import settings
        settings.gemini_api_key = gemini_key
        if gemini_model:
            settings.gemini_model = gemini_model

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
    )

    return _enrich_story_response(story_data)


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

    if gemini_key:
        from ..config import settings
        settings.gemini_api_key = gemini_key
        if gemini_model:
            settings.gemini_model = gemini_model

    async def sse_event_generator():
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
        )

        # 3. Validação e Traços
        yield f"event: stage_start\ndata: {json.dumps({'stage': 'validation', 'message': 'Validando gramática e hidratação de traços linguísticos...'})}\n\n"

        enriched = _enrich_story_response(story_data)

        # 4. Finalização
        yield f"event: stage_done\ndata: {json.dumps({'story': enriched})}\n\n"

    return StreamingResponse(sse_event_generator(), media_type="text/event-stream")
