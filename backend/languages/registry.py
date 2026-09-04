from typing import Dict
from .base import LanguageProfile
from .chinese import ChineseProfile
from .generic import GenericLanguageProfile


class LanguageRegistry:
    def __init__(self):
        self._profiles: Dict[str, LanguageProfile] = {
            "zh": ChineseProfile(),
        }

    def register(self, profile: LanguageProfile):
        self._profiles[profile.language_code.lower()] = profile

    def get(self, lang_code: str) -> LanguageProfile:
        code = (lang_code or "zh").lower()
        if code in self._profiles:
            return self._profiles[code]
        # Cria ou reutiliza perfil genérico
        generic_profile = GenericLanguageProfile(code)
        self._profiles[code] = generic_profile
        return generic_profile


registry = LanguageRegistry()
