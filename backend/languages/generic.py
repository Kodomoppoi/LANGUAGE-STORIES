from typing import Any, Dict, List
from .base import LanguageProfile

VOICE_MAP = {
    "ja": "ja-JP-NanamiNeural",
    "es": "es-ES-ElviraNeural",
    "fr": "fr-FR-DeniseNeural",
    "de": "de-DE-KatjaNeural",
    "it": "it-IT-ElsaNeural",
    "ko": "ko-KR-SunHiNeural",
    "ar": "ar-SA-ZariyahNeural",
    "ru": "ru-RU-SvetlanaNeural",
    "pt": "pt-BR-FranciscaNeural",
    "en": "en-US-JennyNeural",
}

LANG_NAME_MAP = {
    "ja": "Japanese",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "ko": "Korean",
    "ar": "Arabic",
    "ru": "Russian",
    "pt": "Portuguese",
    "en": "English",
}


class GenericLanguageProfile(LanguageProfile):
    def __init__(self, lang_code: str):
        self._code = lang_code.lower()
        self._name = LANG_NAME_MAP.get(self._code, "Target Language")
        self._voice = VOICE_MAP.get(self._code, "en-US-JennyNeural")

    @property
    def language_code(self) -> str:
        return self._code

    @property
    def language_name(self) -> str:
        return self._name

    @property
    def default_tts_voice(self) -> str:
        return self._voice

    def build_curation_prompt(
        self,
        theme: str,
        proficiency: str,
        target_count: int,
        pinned_words: List[str],
        review_words: List[str],
        native_lang: str = "Portuguese",
    ) -> str:
        pinned_str = ", ".join(pinned_words) if pinned_words else "None"
        review_str = ", ".join(review_words) if review_words else "None"

        return f"""You are an expert language curriculum designer for {self._name}.
Proficiency Level: {proficiency}.
Theme: "{theme}".
Native Translation Language: {native_lang}.

Select {target_count} target vocabulary words for this lesson.
Include these pinned words if relevant: {pinned_str}.
Reinforce these review words if appropriate: {review_str}.

Return strictly valid JSON only:
{{
  "vocabulary": [
    {{
      "word": "word in {self._name}",
      "lemma": "dictionary form",
      "ruby": "phonetic reading if applicable, else null",
      "part_of_speech": "NOUN/VERB/ADJ/etc",
      "context_translation": "meaning in {native_lang}",
      "example_sentence": "sentence in {self._name}",
      "example_translation": "translation in {native_lang}"
    }}
  ]
}}
"""

    def build_story_prompt(
        self,
        curated_vocab: List[Dict[str, Any]],
        theme: str,
        proficiency: str,
        story_length: str,
        repetition_density: str,
        native_lang: str = "Portuguese",
    ) -> str:
        vocab_list = "\n".join(
            [f"- {v.get('word')} ({v.get('part_of_speech')}): {v.get('context_translation')}"
             for v in curated_vocab]
        )

        return f"""Write an engaging story in {self._name} for proficiency level {proficiency}.
Theme: "{theme}".
Native Language for Translations: {native_lang}.
Repetition Density: {repetition_density}.

TARGET WORDS TO WEAVE INTO STORY:
{vocab_list}

MANDATORY OUTPUT REQUIREMENTS:
1. "title": Story title in {self._name}.
2. "title_translation": Story title translated into {native_lang}.
3. "sentences": Array of SentencePair objects. Each sentence MUST have its sentence-level translation:
   [
     {{ "id": 1, "target_text": "Sentence in {self._name}", "translation_text": "Translation in {native_lang}" }}
   ]
4. "story_dictionary": List of important words in the story with part of speech and context translation.
5. "story_translated_dictionary": Mapping of translated Portuguese terms back to the original words.

Return strictly valid JSON only matching:
{{
  "title": "...",
  "title_translation": "...",
  "sentences": [
    {{ "id": 1, "target_text": "...", "translation_text": "..." }}
  ],
  "story_dictionary": [
    {{
      "word": "...",
      "lemma": "...",
      "ruby": "...",
      "part_of_speech": "NOUN",
      "context_translation": "..."
    }}
  ],
  "story_translated_dictionary": [
    {{
      "translated_term": "...",
      "original_word": "...",
      "context_note": "..."
    }}
  ]
}}
"""

    def build_lookup_prompt(
        self,
        word: str,
        sentence_context: str,
        native_lang: str = "Portuguese",
    ) -> str:
        return f"""Analyze the following word in {self._name} in context:
Word: "{word}"
Context: "{sentence_context}"
Native Translation Language: {native_lang}

Return strictly valid JSON only:
{{
  "word": "{word}",
  "lemma": "{word}",
  "ruby": null,
  "part_of_speech": "NOUN/VERB/ADJ/etc",
  "context_translation": "meaning in {native_lang}",
  "explanation": "usage note"
}}
"""

    def extract_traits(self, word_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "ruby": word_data.get("ruby"),
            "part_of_speech": word_data.get("part_of_speech", "NOUN"),
        }

    def get_sample_data(self, proficiency: str, theme: str, native_lang: str = "Portuguese") -> Dict[str, Any]:
        is_en = str(native_lang).lower().startswith("eng")

        if is_en:
            return {
                "title": f"Story in {self._name}",
                "title_translation": f"Story in {self._name}",
                "sentences": [
                    {
                        "id": 1,
                        "target_text": f"Sample sentence 1 in {self._name}.",
                        "translation_text": "Sample translated sentence 1 in English.",
                    },
                    {
                        "id": 2,
                        "target_text": f"Sample sentence 2 in {self._name}.",
                        "translation_text": "Sample translated sentence 2 in English.",
                    },
                ],
                "story_dictionary": [
                    {
                        "word": "sample",
                        "lemma": "sample",
                        "part_of_speech": "NOUN",
                        "context_translation": "sample / example",
                    }
                ],
                "story_translated_dictionary": [
                    {
                        "translated_term": "sample / example",
                        "original_word": "sample",
                        "context_note": "Demonstration vocabulary",
                    }
                ],
            }

        return {
            "title": f"Story in {self._name}",
            "title_translation": f"História em {self._name}",
            "sentences": [
                {
                    "id": 1,
                    "target_text": f"Sample sentence 1 in {self._name}.",
                    "translation_text": "Frase de exemplo 1 traduzida em Português.",
                },
                {
                    "id": 2,
                    "target_text": f"Sample sentence 2 in {self._name}.",
                    "translation_text": "Frase de exemplo 2 traduzida em Português.",
                },
            ],
            "story_dictionary": [
                {
                    "word": "sample",
                    "lemma": "sample",
                    "part_of_speech": "NOUN",
                    "context_translation": "exemplo",
                }
            ],
            "story_translated_dictionary": [
                {
                    "translated_term": "exemplo",
                    "original_word": "sample",
                    "context_note": "Termo de demonstração",
                }
            ],
        }
