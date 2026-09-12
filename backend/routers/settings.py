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
    api_provider: Optional[str] = None
    apiProvider: Optional[str] = None

    def resolved_key(self) -> str:
        return (self.gemini_api_key or self.geminiApiKey or "").strip()

    def resolved_model(self) -> str:
        return (self.gemini_model or self.geminiModel or "").strip()

    def resolved_provider(self) -> str:
        return (self.api_provider or self.apiProvider or "").strip()


class OpenRouterSettingsRequest(BaseModel):
    openrouter_api_key: Optional[str] = None
    openRouterApiKey: Optional[str] = None
    openrouter_model: Optional[str] = None
    openRouterModel: Optional[str] = None
    api_provider: Optional[str] = None
    apiProvider: Optional[str] = None

    def resolved_key(self) -> str:
        return (self.openrouter_api_key or self.openRouterApiKey or "").strip()

    def resolved_model(self) -> str:
        return (self.openrouter_model or self.openRouterModel or "").strip()

    def resolved_provider(self) -> str:
        return (self.api_provider or self.apiProvider or "").strip()


def _save_env_file(
    gemini_key: Optional[str] = None,
    gemini_model: Optional[str] = None,
    openrouter_key: Optional[str] = None,
    openrouter_model: Optional[str] = None,
    api_provider: Optional[str] = None,
) -> None:
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

            updates = {}
            if gemini_key is not None:
                updates["GEMINI_API_KEY"] = gemini_key
            if gemini_model is not None:
                updates["GEMINI_MODEL"] = gemini_model
            if openrouter_key is not None:
                updates["OPENROUTER_API_KEY"] = openrouter_key
            if openrouter_model is not None:
                updates["OPENROUTER_MODEL"] = openrouter_model
            if api_provider is not None:
                updates["API_PROVIDER"] = api_provider

            new_lines = []
            seen = set()
            for line in lines:
                matched = False
                for k, v in updates.items():
                    if line.startswith(f"{k}="):
                        new_lines.append(f"{k}={v}")
                        seen.add(k)
                        matched = True
                        break
                if not matched:
                    new_lines.append(line)

            for k, v in updates.items():
                if k not in seen:
                    new_lines.append(f"{k}={v}")

            p.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
        except Exception as e:
            emit_log(f"Aviso ao persistir .env em {p}: {e}", level="WARN", source="SYSTEM")


@router.get("")
def get_settings() -> Dict[str, Any]:
    """Retorna o estado atual das integrações no backend."""
    return {
        "gemini_configured": bool(settings.gemini_api_key),
        "gemini_model": settings.gemini_model,
        "openrouter_configured": bool(settings.openrouter_api_key),
        "openrouter_model": settings.openrouter_model,
        "api_provider": settings.api_provider,
        "ollama_configured": bool(settings.ollama_url),
        "ollama_url": settings.ollama_url,
        "ollama_model": settings.ollama_model,
    }


@router.post("/gemini")
def update_gemini_settings(req: GeminiSettingsRequest) -> Dict[str, Any]:
    """Sincroniza a chave do Gemini do frontend para a memória do backend e persiste em .env."""
    key = req.resolved_key()
    model = req.resolved_model() or settings.gemini_model or "gemini-3.6-flash"
    provider = req.resolved_provider()

    if key:
        settings.gemini_api_key = key
    if req.resolved_model():
        settings.gemini_model = model
    if provider:
        settings.api_provider = provider

    _save_env_file(
        gemini_key=settings.gemini_api_key,
        gemini_model=settings.gemini_model,
        api_provider=settings.api_provider,
    )

    masked_key = f"{key[:6]}...{key[-4:]}" if len(key) >= 12 else ("configurada" if key else "removida")
    emit_log(f"Chave Gemini sincronizada com o backend ({masked_key}). Modelo: {settings.gemini_model}", level="SUCCESS", source="GEMINI")

    return {
        "status": "ok",
        "message": "Configurações do Gemini salvas e sincronizadas com sucesso.",
        "gemini_configured": bool(settings.gemini_api_key),
        "gemini_model": settings.gemini_model,
        "api_provider": settings.api_provider,
    }


@router.post("/openrouter")
def update_openrouter_settings(req: OpenRouterSettingsRequest) -> Dict[str, Any]:
    """Sincroniza as configurações do OpenRouter com o backend e persiste em .env."""
    key = req.resolved_key()
    model = req.resolved_model() or settings.openrouter_model or "openrouter/free"
    provider = req.resolved_provider()

    if key:
        settings.openrouter_api_key = key
    if req.resolved_model():
        settings.openrouter_model = model
    if provider:
        settings.api_provider = provider

    _save_env_file(
        openrouter_key=settings.openrouter_api_key,
        openrouter_model=settings.openrouter_model,
        api_provider=settings.api_provider,
    )

    masked_key = f"{key[:6]}...{key[-4:]}" if len(key) >= 12 else ("configurada" if key else "inalterada")
    emit_log(f"Configurações OpenRouter sincronizadas ({masked_key}). Modelo: {settings.openrouter_model}", level="SUCCESS", source="OPENROUTER")

    return {
        "status": "ok",
        "message": "Configurações do OpenRouter salvas com sucesso.",
        "openrouter_configured": bool(settings.openrouter_api_key),
        "openrouter_model": settings.openrouter_model,
        "api_provider": settings.api_provider,
    }


class ProviderSettingsRequest(BaseModel):
    api_provider: Optional[str] = None
    apiProvider: Optional[str] = None

    def resolved_provider(self) -> str:
        return (self.api_provider or self.apiProvider or "hybrid").strip()


@router.post("/provider")
def update_provider_settings(req: ProviderSettingsRequest) -> Dict[str, Any]:
    """Sincroniza o modo de provedor de IA (hybrid, gemini, openrouter, mock) com o backend e persiste em .env."""
    provider = req.resolved_provider()
    settings.api_provider = provider
    _save_env_file(api_provider=provider)
    emit_log(f"Modo de provedor IA atualizado para '{provider}'.", level="INFO", source="SYSTEM")
    return {
        "status": "ok",
        "api_provider": provider,
    }


@router.post("/gemini/test")
async def test_gemini_connection(req: GeminiSettingsRequest) -> Dict[str, Any]:
    """Testa a conectividade da chave contra a Google Generative Language API em tempo real."""
    key = req.resolved_key() or settings.gemini_api_key
    model = req.resolved_model() or settings.gemini_model or "gemini-3.6-flash"

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


@router.post("/openrouter/test")
async def test_openrouter_connection(req: OpenRouterSettingsRequest) -> Dict[str, Any]:
    """Testa a conectividade da chave contra a OpenRouter API em tempo real."""
    key = req.resolved_key() or settings.openrouter_api_key
    model = req.resolved_model() or settings.openrouter_model or "openrouter/free"

    if not key or not key.strip():
        emit_log("Teste OpenRouter cancelado: nenhuma chave fornecida.", level="WARN", source="OPENROUTER")
        return {
            "success": False,
            "message": "Nenhuma chave de API OpenRouter foi fornecida. Digite sua chave no campo correspondente.",
        }

    clean_key = key.strip()
    emit_log(f"Testando conexão com a OpenRouter API (modelo {model})...", level="INFO", source="OPENROUTER")

    headers = {
        "Authorization": f"Bearer {clean_key}",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Language Stories",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get("https://openrouter.ai/api/v1/auth/key", headers=headers)
            if resp.status_code == 200:
                data = resp.json().get("data", {})
                label = data.get("label", "Chave válida")
                rate_limit = data.get("rate_limit", {})
                limit_requests = rate_limit.get("requests", 20)

                # Persiste a chave validada com sucesso
                settings.openrouter_api_key = clean_key
                if req.resolved_model():
                    settings.openrouter_model = model
                if req.resolved_provider():
                    settings.api_provider = req.resolved_provider()

                _save_env_file(
                    openrouter_key=settings.openrouter_api_key,
                    openrouter_model=settings.openrouter_model,
                    api_provider=settings.api_provider,
                )

                free_models = [
                    "openrouter/free",
                    "google/gemma-4-26b-a4b-it:free",
                    "google/gemma-4-31b-it:free",
                    "nvidia/nemotron-3.5-lightning:free",
                    "liquid/lfm-2.5-2.6b:free",
                ]

                emit_log(
                    f"Conexão com OpenRouter validada com sucesso! (Chave: {label}). Free tier ativo.",
                    level="SUCCESS",
                    source="OPENROUTER",
                )
                return {
                    "success": True,
                    "message": f"Conexão OpenRouter validada com sucesso! Chave: {label}.",
                    "models": free_models,
                    "active_model": settings.openrouter_model,
                    "rate_limit_requests": limit_requests,
                }
            else:
                err_text = resp.text[:180]
                emit_log(f"OpenRouter recusou a chave de API ({resp.status_code}): {err_text}", level="ERROR", source="OPENROUTER")
                return {
                    "success": False,
                    "message": f"OpenRouter recusou a chave de API ({resp.status_code}): {err_text}",
                }
    except Exception as e:
        emit_log(f"Erro de rede ao conectar à OpenRouter API ({e})", level="ERROR", source="OPENROUTER")
        return {
            "success": False,
            "message": f"Falha de comunicação de rede: {str(e)}",
        }

