import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter
import httpx
from pydantic import BaseModel

from ..config import settings, BASE_DIR
from .logs import emit_log

router = APIRouter(prefix="/api/settings", tags=["Settings"])


class GeminiSettingsRequest(BaseModel):
    gemini_api_key: Optional[str] = None
    geminiApiKey: Optional[str] = None
    gemini_model: Optional[str] = None
    geminiModel: Optional[str] = None

    def resolved_key(self) -> str:
        return (self.gemini_api_key or self.geminiApiKey or "").strip()

    def resolved_model(self) -> str:
        return (self.gemini_model or self.geminiModel or "").strip()


def _save_env_file(key: str, model: str) -> None:
    """Persiste as credenciais no arquivo .env para sobreviver a reinicializações."""
    env_paths = [
        BASE_DIR / ".env",
        BASE_DIR.parent / ".env",
    ]
    for p in env_paths:
        try:
            lines = []
            if p.exists():
                lines = p.read_text(encoding="utf-8").splitlines()

            new_lines = []
            key_set = False
            model_set = False
            for line in lines:
                if line.startswith("GEMINI_API_KEY="):
                    new_lines.append(f"GEMINI_API_KEY={key}")
                    key_set = True
                elif line.startswith("GEMINI_MODEL="):
                    new_lines.append(f"GEMINI_MODEL={model}")
                    model_set = True
                else:
                    new_lines.append(line)

            if not key_set:
                new_lines.append(f"GEMINI_API_KEY={key}")
            if not model_set:
                new_lines.append(f"GEMINI_MODEL={model}")

            p.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
        except Exception as e:
            emit_log(f"Aviso ao persistir .env em {p}: {e}", level="WARN", source="SYSTEM")


@router.get("")
def get_settings() -> Dict[str, Any]:
    """Retorna o estado atual das integrações no backend."""
    return {
        "gemini_configured": bool(settings.gemini_api_key),
        "gemini_model": settings.gemini_model,
        "ollama_configured": bool(settings.ollama_url),
        "ollama_url": settings.ollama_url,
        "ollama_model": settings.ollama_model,
    }


@router.post("/gemini")
def update_gemini_settings(req: GeminiSettingsRequest) -> Dict[str, Any]:
    """Sincroniza a chave do Gemini do frontend para a memória do backend e persiste em .env."""
    key = req.resolved_key()
    model = req.resolved_model() or settings.gemini_model or "gemini-2.0-flash"
    if model == "gemini-3.6-flash":
        model = "gemini-2.0-flash"

    if key:
        settings.gemini_api_key = key
    if req.resolved_model():
        settings.gemini_model = model

    _save_env_file(settings.gemini_api_key, settings.gemini_model)

    masked_key = f"{key[:6]}...{key[-4:]}" if len(key) >= 12 else ("configurada" if key else "removida")
    emit_log(f"Chave Gemini sincronizada com o backend ({masked_key}). Modelo: {settings.gemini_model}", level="SUCCESS", source="GEMINI")

    return {
        "status": "ok",
        "message": "Configurações do Gemini salvas e sincronizadas com sucesso.",
        "gemini_configured": bool(settings.gemini_api_key),
        "gemini_model": settings.gemini_model,
    }


@router.post("/gemini/test")
async def test_gemini_connection(req: GeminiSettingsRequest) -> Dict[str, Any]:
    """Testa a conectividade da chave contra a Google Generative Language API em tempo real."""
    key = req.resolved_key() or settings.gemini_api_key
    model = req.resolved_model() or settings.gemini_model or "gemini-2.0-flash"
    if model == "gemini-3.6-flash":
        model = "gemini-2.0-flash"

    if not key or not key.strip():
        emit_log("Teste Gemini cancelado: nenhuma chave fornecida ou configurada.", level="WARN", source="GEMINI")
        return {
            "success": False,
            "message": "Nenhuma chave de API Gemini foi fornecida. Digite sua chave no campo correspondente.",
        }

    emit_log(f"Testando conexão com a Google Gemini API (modelo {model})...", level="INFO", source="GEMINI")

    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models?key={key.strip()}"
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.get(endpoint)
            if resp.status_code == 200:
                data = resp.json()
                raw_models = data.get("models", [])
                model_names = [
                    m.get("name", "").replace("models/", "")
                    for m in raw_models
                    if "generateContent" in m.get("supportedGenerationMethods", [])
                ]

                # Sincroniza a chave testada com sucesso
                settings.gemini_api_key = key.strip()
                if req.resolved_model():
                    settings.gemini_model = model
                _save_env_file(settings.gemini_api_key, settings.gemini_model)

                emit_log(
                    f"Conexão com a Google Gemini API validada com sucesso! ({len(model_names)} modelos disponíveis)",
                    level="SUCCESS",
                    source="GEMINI",
                )
                return {
                    "success": True,
                    "message": f"Conexão validada com sucesso! {len(model_names)} modelos de IA disponíveis.",
                    "models": model_names,
                    "active_model": settings.gemini_model,
                }
            else:
                err_text = resp.text
                try:
                    err_json = resp.json()
                    err_text = err_json.get("error", {}).get("message", err_text)
                except Exception:
                    pass

                emit_log(f"Validação da chave Gemini falhou ({resp.status_code}): {err_text[:180]}", level="ERROR", source="GEMINI")
                return {
                    "success": False,
                    "message": f"Google Gemini API recusou a chave ({resp.status_code}): {err_text}",
                }
    except Exception as e:
        emit_log(f"Erro de rede ao conectar à Gemini API ({e})", level="ERROR", source="GEMINI")
        return {
            "success": False,
            "message": f"Falha de comunicação de rede: {str(e)}",
        }
