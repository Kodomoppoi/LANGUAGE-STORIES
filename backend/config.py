import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent
TTS_CACHE_DIR = BASE_DIR / "cache" / "tts"
TTS_CACHE_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    app_name: str = "Language Stories Backend"
    database_url: str = f"sqlite:///{BASE_DIR / 'language_stories.db'}"
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = "gemini-2.5-flash"
    ollama_url: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
    ollama_model: str = "llama3.2"
    tts_cache_dir: str = str(TTS_CACHE_DIR)
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
