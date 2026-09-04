from abc import ABC, abstractmethod
from typing import Any, Dict, List


class LanguageProfile(ABC):
    @property
    @abstractmethod
    def language_code(self) -> str:
        """Ex: 'zh', 'ja', 'es'"""
        pass

    @property
    @abstractmethod
    def language_name(self) -> str:
        """Ex: 'Mandarin Chinese', 'Japanese'"""
        pass

    @property
    @abstractmethod
    def default_tts_voice(self) -> str:
        """Ex: 'zh-CN-XiaoxiaoNeural', 'ja-JP-NanamiNeural'"""
        pass

    @abstractmethod
    def build_curation_prompt(
        self,
        theme: str,
        proficiency: str,
        target_count: int,
        pinned_words: List[str],
        review_words: List[str],
        native_lang: str = "Portuguese",
    ) -> str:
        """Prompt da Etapa 1 para curar o vocabulário-alvo"""
        pass

    @abstractmethod
    def build_story_prompt(
        self,
        curated_vocab: List[Dict[str, Any]],
        theme: str,
        proficiency: str,
        story_length: str,
        repetition_density: str,
        native_lang: str = "Portuguese",
    ) -> str:
        """Prompt da Etapa 2 para gerar história interlinear e duplo dicionário"""
        pass

    @abstractmethod
    def build_lookup_prompt(
        self,
        word: str,
        sentence_context: str,
        native_lang: str = "Portuguese",
    ) -> str:
        """Prompt para lookup dinâmico instantâneo de uma palavra avulsa"""
        pass

    @abstractmethod
    def extract_traits(self, word_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extrai traços específicos da língua (ex: Pinyin, Radicais, HSK)"""
        pass

    @abstractmethod
    def get_sample_data(self, proficiency: str, theme: str, native_lang: str = "Portuguese") -> Dict[str, Any]:
        """Gera dados de fallback estruturados em caso de offline/teste"""
        pass
