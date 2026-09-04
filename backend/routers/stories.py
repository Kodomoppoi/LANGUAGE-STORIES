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

    def resolved_theme(self) -> str:
        return self.theme or self.contextTheme or "General"

    def resolved_target_count(self) -> int:
        return self.target_vocab_count or self.targetVocabCount or 8

    def resolved_story_length(self) -> str:
        return self.story_length or self.storyLength or "standard"

    def resolved_repetition_density(self) -> str:
        return self.repetition_density or self.repetitionDensity or "high"

    def resolved_native_lang(self) -> str:
        return self.native_lang or self.nativeLanguage or "Portuguese"


def _enrich_story_response(story_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Garante máxima compatibilidade de contratos entre frontend legado e
    nova arquitetura interlinear (sentences, paragraphs, dictionary, full_text).
    """
    sentences = story_data.get("sentences", [])
    story_dict = story_data.get("story_dictionary", [])

    # Cria parágrafos estruturados caso o frontend utilize tokens diretamente
    paragraphs = []
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

        paragraphs.append({
            "id": f"p-{idx + 1}",
            "sentences": [
                {
                    "id": f"s-{idx + 1}-1",
                    "text": target_text,
                    "target_text": target_text,
                    "translation": translation_text,
                    "translation_text": translation_text,
                    "tokens": tokens,
                }
            ],
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

    # Estágio 1: Curadoria
    curated_vocab = await ai_service.curate_vocabulary_stage1(
        language=req.language,
        proficiency=req.proficiency,
        theme=theme,
        target_count=count,
        db=db,
        native_lang=native,
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
    )

    return _enrich_story_response(story_data)


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
        )

        # 3. Validação e Traços
        yield f"event: stage_start\ndata: {json.dumps({'stage': 'validation', 'message': 'Validando gramática e hidratação de traços linguísticos...'})}\n\n"

        enriched = _enrich_story_response(story_data)

        # 4. Finalização
        yield f"event: stage_done\ndata: {json.dumps({'story': enriched})}\n\n"

    return StreamingResponse(sse_event_generator(), media_type="text/event-stream")
