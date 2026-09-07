import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent
TTS_CACHE_DIR = BASE_DIR / "cache" / "tts"
TTS_CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Pré-carrega de .env se existir em backend/ ou na raiz do projeto
_candidate_envs = [BASE_DIR / ".env", BASE_DIR.parent / ".env"]
for _env_path in _candidate_envs:
    if _env_path.exists():
        try:
            for _line in _env_path.read_text(encoding="utf-8").splitlines():
                _line = _line.strip()
                if _line and not _line.startswith("#") and "=" in _line:
                    _k, _v = _line.split("=", 1)
                    _k = _k.strip()
                    _v = _v.strip().strip("'\"")
                    if _k not in os.environ and _v:
                        os.environ[_k] = _v
        except Exception:
            pass

class Settings(BaseSettings):
    app_name: str = "Language Stories Backend"
    database_url: str = f"sqlite:///{BASE_DIR / 'language_stories.db'}"
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
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
        env_file = [str(BASE_DIR / ".env"), str(BASE_DIR.parent / ".env"), ".env"]
        extra = "ignore"

settings = Settings()
