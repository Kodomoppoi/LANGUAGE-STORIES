from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel

from ..services.tts_service import tts_service


router = APIRouter(prefix="/api/tts", tags=["Text-to-Speech"])


class TTSRequest(BaseModel):
    text: str
    language: str = "zh"
    voice: Optional[str] = None
    rate: str = "+0%"


@router.get("/synthesize")
async def synthesize_get(
    text: str = Query(..., min_length=1),
    language: str = Query("zh"),
    voice: Optional[str] = Query(None),
    rate: str = Query("+0%"),
):
    """
    Síntese de áudio neural via GET (para tags <audio src="..."> e reprodução direta).
    Retorna áudio MP3 de 0ms se já estiver em cache.
    """
    try:
        audio_path = await tts_service.synthesize(
            text=text,
            language=language,
            voice=voice,
            rate=rate,
        )
        return FileResponse(
            str(audio_path),
            media_type="audio/mpeg",
            filename="pronunciation.mp3",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha na síntese de voz: {e}")


@router.post("/synthesize")
async def synthesize_post(req: TTSRequest):
    """
    Síntese de áudio neural via POST com corpo JSON.
    """
    try:
        audio_path = await tts_service.synthesize(
            text=req.text,
            language=req.language,
            voice=req.voice,
            rate=req.rate,
        )
        return FileResponse(
            str(audio_path),
            media_type="audio/mpeg",
            filename="pronunciation.mp3",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha na síntese de voz: {e}")
