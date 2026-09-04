from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import VocabularyModel, get_db
from ..services.ai_service import ai_service
from ..services.srs_engine import (
    calculate_sm2,
    compute_next_review_date,
    get_status_info,
    record_word_click,
)


router = APIRouter(prefix="/api/vocabulary", tags=["Vocabulary & SRS"])


class LookupRequest(BaseModel):
    word: str
    sentence_context: Optional[str] = ""
    language: str = "zh"
    native_lang: Optional[str] = None
    nativeLanguage: Optional[str] = None


class RecordClickRequest(BaseModel):
    id: Optional[str] = None
    word: Optional[str] = None
    language: Optional[str] = "zh"


class TogglePinRequest(BaseModel):
    id: Optional[str] = None
    word: Optional[str] = None
    language: Optional[str] = "zh"
    is_pinned: Optional[bool] = None


class SRSReviewRequest(BaseModel):
    id: Optional[str] = None
    word: Optional[str] = None
    language: Optional[str] = "zh"
    quality: int  # 0 to 5


class AddVaultRequest(BaseModel):
    id: Optional[str] = None
    word: str
    language: str = "zh"
    translation: Optional[str] = None
    ruby: Optional[str] = None
    part_of_speech: Optional[str] = "NOUN"
    traits: Optional[Dict[str, Any]] = None


def _format_vocab_response(vocab: VocabularyModel) -> Dict[str, Any]:
    return {
        "id": vocab.id,
        "word": vocab.word,
        "lemma": vocab.lemma or vocab.word,
        "ruby": vocab.ruby,
        "translation": vocab.translation,
        "context_translation": vocab.translation,
        "part_of_speech": vocab.part_of_speech,
        "definition": vocab.definition or vocab.translation,
        "example_sentence": vocab.example_sentence,
        "example_translation": vocab.example_translation,
        "traits": vocab.traits_json or {},
        "mastery_score": vocab.mastery_score,
        "status_label": vocab.status_label,
        "status_color": vocab.status_color,
        "repetition_weight": vocab.repetition_weight,
        "looked_up_count": vocab.looked_up_count,
        "is_pinned": vocab.is_pinned,
        "is_starred": vocab.is_pinned,
        "in_vault": True,
        "srs_stage": vocab.srs_stage,
        "srs_interval": vocab.srs_interval,
        "srs_ease_factor": vocab.srs_ease_factor,
        "srs_repetition": vocab.srs_repetition,
        "last_reviewed_at": vocab.last_reviewed_at.isoformat() if vocab.last_reviewed_at else None,
        "next_review_date": vocab.next_review_date.isoformat() if vocab.next_review_date else None,
        "created_at": vocab.created_at.isoformat() if vocab.created_at else None,
    }


@router.get("")
def list_vocabulary(
    language: Optional[str] = None,
    status_color: Optional[str] = None,
    is_pinned: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Retorna o cofre global de vocabulário do SQLite com filtros de retenção e busca.
    """
    query = db.query(VocabularyModel)
    if language:
        query = query.filter(VocabularyModel.language == language)
    if status_color:
        query = query.filter(VocabularyModel.status_color == status_color)
    if is_pinned is not None:
        query = query.filter(VocabularyModel.is_pinned == is_pinned)
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (VocabularyModel.word.ilike(search_fmt))
            | (VocabularyModel.translation.ilike(search_fmt))
            | (VocabularyModel.ruby.ilike(search_fmt))
        )

    total = query.count()
    items = query.order_by(VocabularyModel.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [_format_vocab_response(i) for i in items],
    }


@router.post("/lookup")
async def lookup_word(
    req: LookupRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Lookup instantâneo de palavra (0ms no SQLite ou análise contextual dinâmica de 1 palavra).
    """
    native = req.native_lang or req.nativeLanguage or "Portuguese"
    return await ai_service.lookup_word_dynamic(
        word=req.word.strip(),
        sentence_context=req.sentence_context or "",
        language=req.language,
        db=db,
        native_lang=native,
    )


@router.post("/record-click")
def record_click(
    req: RecordClickRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Rastreia clique silencioso no leitor e ajusta sutilmente a retenção SRS da palavra.
    """
    vocab = None
    if req.id:
        vocab = db.query(VocabularyModel).filter(VocabularyModel.id == req.id).first()
    elif req.word:
        vocab = (
            db.query(VocabularyModel)
            .filter(VocabularyModel.word == req.word, VocabularyModel.language == req.language)
            .first()
        )

    if not vocab:
        if not req.word:
            raise HTTPException(status_code=400, detail="Word ou ID obrigatório.")
        # Cria entrada nova no cofre
        color, label, weight, stage = get_status_info(0.20, False)
        vocab = VocabularyModel(
            language=req.language or "zh",
            word=req.word,
            lemma=req.word,
            mastery_score=0.20,
            status_label=label,
            status_color=color,
            repetition_weight=weight,
            looked_up_count=1,
            is_pinned=False,
        )
        db.add(vocab)
        db.commit()
        db.refresh(vocab)
        return _format_vocab_response(vocab)

    updated_metrics = record_word_click(
        looked_up_count=vocab.looked_up_count,
        current_score=vocab.mastery_score,
        is_pinned=vocab.is_pinned,
    )

    vocab.looked_up_count = updated_metrics["looked_up_count"]
    vocab.mastery_score = updated_metrics["mastery_score"]
    vocab.status_color = updated_metrics["status_color"]
    vocab.status_label = updated_metrics["status_label"]
    vocab.repetition_weight = updated_metrics["repetition_weight"]
    vocab.srs_stage = updated_metrics["srs_stage"]

    db.commit()
    db.refresh(vocab)
    return _format_vocab_response(vocab)


@router.post("/toggle-pin")
def toggle_pin(
    req: TogglePinRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Fixa / desfixa uma palavra como prioridade máxima (⭐) no cofre.
    """
    vocab = None
    if req.id:
        vocab = db.query(VocabularyModel).filter(VocabularyModel.id == req.id).first()
    elif req.word:
        vocab = (
            db.query(VocabularyModel)
            .filter(VocabularyModel.word == req.word, VocabularyModel.language == req.language)
            .first()
        )

    if not vocab:
        raise HTTPException(status_code=404, detail="Palavra não encontrada no cofre.")

    if req.is_pinned is not None:
        vocab.is_pinned = req.is_pinned
    else:
        vocab.is_pinned = not vocab.is_pinned

    vocab.is_starred = vocab.is_pinned
    # Palavras fixadas adquirem peso máximo de repetição
    color, label, weight, stage = get_status_info(vocab.mastery_score, vocab.is_pinned)
    vocab.repetition_weight = weight

    db.commit()
    db.refresh(vocab)
    return _format_vocab_response(vocab)


@router.post("/srs-review")
def srs_review(
    req: SRSReviewRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Atualiza intervalo SM-2 e pontuação contínua após revisão ou quiz.
    """
    vocab = None
    if req.id:
        vocab = db.query(VocabularyModel).filter(VocabularyModel.id == req.id).first()
    elif req.word:
        vocab = (
            db.query(VocabularyModel)
            .filter(VocabularyModel.word == req.word, VocabularyModel.language == req.language)
            .first()
        )

    if not vocab:
        raise HTTPException(status_code=404, detail="Palavra não encontrada para revisão.")

    rep, ivl, ef, score = calculate_sm2(
        repetition=vocab.srs_repetition,
        interval=vocab.srs_interval,
        ease_factor=vocab.srs_ease_factor,
        quality=req.quality,
    )

    color, label, weight, stage = get_status_info(score, vocab.is_pinned)

    vocab.srs_repetition = rep
    vocab.srs_interval = ivl
    vocab.srs_ease_factor = ef
    vocab.mastery_score = score
    vocab.status_color = color
    vocab.status_label = label
    vocab.repetition_weight = weight
    vocab.srs_stage = stage
    vocab.last_reviewed_at = datetime.utcnow()
    vocab.next_review_date = compute_next_review_date(ivl)

    db.commit()
    db.refresh(vocab)
    return _format_vocab_response(vocab)


@router.post("/add-vault")
def add_to_vault(
    req: AddVaultRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Adiciona ou confirma explicitamente uma palavra no cofre SQLite (1-clique no popover).
    """
    vocab = (
        db.query(VocabularyModel)
        .filter(VocabularyModel.word == req.word, VocabularyModel.language == req.language)
        .first()
    )
    if vocab:
        return _format_vocab_response(vocab)

    color, label, weight, stage = get_status_info(0.25, False)
    new_entry = VocabularyModel(
        language=req.language,
        word=req.word,
        lemma=req.word,
        ruby=req.ruby or "",
        translation=req.translation or "",
        part_of_speech=req.part_of_speech or "NOUN",
        traits_json=req.traits or {},
        mastery_score=0.25,
        status_label=label,
        status_color=color,
        repetition_weight=weight,
        looked_up_count=0,
        is_pinned=False,
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return _format_vocab_response(new_entry)
