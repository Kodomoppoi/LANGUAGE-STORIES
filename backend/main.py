from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import logging
from .config import settings
from .database import init_db
from .routers import stories, vocabulary, tts, logs


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicializa tabelas SQLite e diretórios de cache na inicialização
    init_db()
    # Anexa o interceptor de logs para alimentar o buffer do terminal em tempo real
    root_logger = logging.getLogger()
    root_logger.addHandler(logs.system_log_handler)
    logging.getLogger("uvicorn").addHandler(logs.system_log_handler)
    logging.getLogger("uvicorn.access").addHandler(logs.system_log_handler)
    logs.emit_log("Servidor FastAPI iniciado com sucesso e pronto para processamento.", level="SUCCESS", source="SYSTEM")
    yield


app = FastAPI(
    title="Language Stories Backend API",
    version="1.0.0",
    description="Pipeline de IA de 2 Estágios, Schemas de Línguas e Algoritmo SRS Contínuo.",
    lifespan=lifespan,
)

# Configuração robusta de CORS para o frontend Vite/React
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins if settings.cors_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de Rotas da API
app.include_router(stories.router)
app.include_router(vocabulary.router)
app.include_router(tts.router)
app.include_router(logs.router)


@app.get("/health")
def health_check():
    """
    Health check consumido pelo frontend (apiService e SettingsModal) para verificar conectividade.
    """
    return {
        "status": "ok",
        "service": "language-stories-backend",
        "version": "1.0.0",
        "database": "sqlite_ready",
        "gemini_configured": bool(settings.gemini_api_key),
        "ollama_configured": bool(settings.ollama_url),
    }


@app.get("/")
def root():
    return {
        "message": "Language Stories API está ativa e operando.",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.host, port=settings.port, reload=True)
