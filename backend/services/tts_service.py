import hashlib
import os
from pathlib import Path
from typing import Optional
import edge_tts
from ..config import settings
from ..languages.registry import registry


class TTSService:
    def __init__(self, cache_dir: Optional[str] = None):
        self.cache_dir = Path(cache_dir or settings.tts_cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _get_cache_path(self, text: str, voice: str, rate: str) -> Path:
        raw_key = f"{text.strip()}|{voice}|{rate}"
        file_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
        return self.cache_dir / f"{file_hash}.mp3"

    async def synthesize(
        self,
        text: str,
        language: str = "zh",
        voice: Optional[str] = None,
        rate: str = "+0%",
    ) -> Path:
        """
        Sintetiza áudio neural com Edge-TTS.
        Se já existir em cache no disco, retorna o caminho instantaneamente (0ms).
        """
        clean_text = text.strip()
        if not clean_text:
            raise ValueError("Texto para síntese de áudio não pode estar vazio.")

        if not voice:
            profile = registry.get(language)
            voice = profile.default_tts_voice

        cache_path = self._get_cache_path(clean_text, voice, rate)

        # Retorno ultra-rápido do cache local
        if cache_path.exists() and cache_path.stat().st_size > 0:
            return cache_path

        # Gera novo áudio neural
        communicate = edge_tts.Communicate(clean_text, voice, rate=rate)
        await communicate.save(str(cache_path))
        return cache_path


tts_service = TTSService()
