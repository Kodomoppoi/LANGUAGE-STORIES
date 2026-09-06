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

        has_custom_theme = bool(theme and theme.strip() and theme.strip().lower() not in ["general", "auto", "none", "automatic", "automático"])
        if has_custom_theme:
            theme_instruction = f'Specific Theme: "{theme.strip()}". The vocabulary and pedagogical focus MUST strictly center around this theme.'
        else:
            theme_instruction = f'Theme: AUTOMATIC & HIGHLY DIDACTIC. Choose the most practical, pedagogically effective, and engaging everyday theme for a {proficiency} language learner (e.g. daily routine, introducing oneself, asking for help/directions, café/restaurant, hobbies, or community life).'

        return f"""You are an expert language curriculum designer for {self._name}.
Proficiency Level: {proficiency}.
{theme_instruction}
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

        has_custom_theme = bool(theme and theme.strip() and theme.strip().lower() not in ["general", "auto", "none", "automatic", "automático"])
        if has_custom_theme:
            theme_instruction = f'Specific Theme: "{theme.strip()}". The entire story plot, characters, and setting MUST strictly revolve around this theme.'
        else:
            theme_instruction = f'Story Theme: AUTOMATIC & HIGHLY DIDACTIC. Pick the most natural, immersive, and didactic scenario for a {proficiency} learner.'

        return f"""Write an engaging story in {self._name} for proficiency level {proficiency}.
{theme_instruction}
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

    def build_deep_dive_prompt(
        self,
        word: str,
        sentence_context: str,
        proficiency: str,
        native_lang: str = "Portuguese",
    ) -> str:
        is_japanese = self._code == "ja"

        if is_japanese:
            return f"""Analyze the Japanese word/kanji "{word}" in deep pedagogical detail for a learner (Level: JLPT {proficiency}).
Sentence Context: "{sentence_context or 'N/A'}"
Target Explanation Language: {native_lang}

CRITICAL RULES:
1. EXTREME BREVITY: Max 1-2 direct lines per section. Total under 500 characters.
2. Provide Japanese CJK structural breakdown:
   - Meaning in this specific sentence context.
   - Kanji Anatomy & Radicais (部首/Kanji components).
   - Shared Kanji / Compounds (熟語 - 2 high-frequency words).
   - Phonetics & Homophones (Furigana / pitch / similar sounding kanji).
   - Synonyms & practical nuances.
3. Return STRICTLY valid JSON ONLY:

{{
  "word": "{word}",
  "ruby": "furigana/kana",
  "level": "JLPT {proficiency}",
  "part_of_speech": "Substantivo / Verbo / etc",
  "context_meaning": "Significado exato no contexto (máx 120 caracteres)",
  "character_anatomy": [
    {{
      "char": "漢字",
      "radical": "radical / kanji component",
      "components": "decomposição",
      "meaning": "significado da parte"
    }}
  ],
  "shared_characters": [
    {{
      "word": "熟語",
      "ruby": "じゅくご",
      "meaning": "tradução"
    }}
  ],
  "phonetics_homophones": {{
    "tip": "dica de pronúncia ou tom",
    "homophones": ["同音異義語"]
  }},
  "synonyms_and_nuances": [
    {{
      "synonym": "類義語",
      "difference": "diferença prática de uso"
    }}
  ]
}}
"""

        # Línguas Alfabéticas (Espanhol, Francês, Alemão, etc.)
        return f"""Analyze the word "{word}" ({self._name}) in deep pedagogical detail for a learner (CEFR: {proficiency}).
Sentence Context: "{sentence_context or 'N/A'}"
Target Explanation Language: {native_lang}

CRITICAL RULES:
1. EXTREME BREVITY: Max 1-2 direct lines per section. Total under 500 characters.
2. Breakdown hierarchy:
   - Contextual meaning & register (formal/informal).
   - Roots & Etymology (prefix/suffix/origin).
   - Common collocations (2 natural word partnerships).
   - False friends or confusable homophones alert.
   - Synonyms and practical difference.
3. Return STRICTLY valid JSON ONLY:

{{
  "word": "{word}",
  "ruby": "",
  "level": "{proficiency}",
  "part_of_speech": "Substantivo / Verbo / etc",
  "context_meaning": "Significado exato no contexto (máx 120 caracteres)",
  "etymology_roots": "Origem / raiz / prefixo relevante",
  "common_collocations": [
    {{
      "phrase": "colocação comum",
      "meaning": "tradução"
    }}
  ],
  "false_friends_or_homophones": "Alerta de falso amigo ou som parecido (se houver)",
  "synonyms_and_nuances": [
    {{
      "synonym": "sinônimo",
      "difference": "diferença prática de uso"
    }}
  ]
}}
"""

    def get_deep_dive_fallback(
        self,
        word: str,
        proficiency: str,
        native_lang: str = "Portuguese",
    ) -> Dict[str, Any]:
        is_japanese = self._code == "ja"
        if is_japanese:
            return {
                "word": word,
                "ruby": "ことば",
                "level": f"JLPT {proficiency}",
                "part_of_speech": "Substantivo",
                "context_meaning": f"Uso contextual de '{word}' na história.",
                "character_anatomy": [
                    {
                        "char": word[0] if word else "言",
                        "radical": "言 (palavra)",
                        "components": "Radical de fala + elemento sonoro",
                        "meaning": "Componente principal do kanji",
                    }
                ],
                "shared_characters": [
                    {
                        "word": f"{word[0]}語" if word else "言語",
                        "ruby": "げんご",
                        "meaning": "Linguagem / idioma",
                    }
                ],
                "phonetics_homophones": {
                    "tip": "Observe o alongamento vocálico e entonação de pitch.",
                    "homophones": [],
                },
                "synonyms_and_nuances": [
                    {
                        "synonym": "単語",
                        "difference": "Refere-se a vocábulo individual no estudo gramatical.",
                    }
                ],
            }

        return {
            "word": word,
            "ruby": "",
            "level": proficiency,
            "part_of_speech": "Palavra",
            "context_meaning": f"Significado contextual de '{word}' no texto.",
            "etymology_roots": f"Termo usual no idioma {self._name}.",
            "common_collocations": [
                {
                    "phrase": f"usar {word}",
                    "meaning": "Combinação frequente no dia a dia",
                }
            ],
            "false_friends_or_homophones": "Atenção ao contexto para evitar falsos cognatos.",
            "synonyms_and_nuances": [
                {
                    "synonym": "Termo equivalente",
                    "difference": "Variação de registro ou intensidade.",
                }
            ],
        }
