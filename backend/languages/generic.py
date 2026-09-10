from typing import Any, Dict, List
from .base import LanguageProfile

VOICE_MAP = {
    "ja": "ja-JP-NanamiNeural",
    "jp": "ja-JP-NanamiNeural",
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
    "jp": "Japanese",
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
   CRITICAL: For EVERY entry in "story_dictionary", "context_translation" in {native_lang} is MANDATORY. You MUST include every word from the TARGET WORDS list with its clear translation in {native_lang}. DO NOT leave "context_translation" blank or generic.
5. "story_translated_dictionary": Mapping of translated terms back to original words in {self._name}.

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
        is_pt = str(native_lang).lower().startswith("port")

        if is_japanese:
            return f"""You are an elite linguistic scholar and pedagogue of Japanese.
Create a comprehensive, deep educational dossier for the Japanese word/kanji: "{word}".
Target Learner Level: JLPT {proficiency}.
Sentence Context: "{sentence_context or 'N/A'}"
Explanation Language: {native_lang}.

TASK:
Produce a dense, high-value, organized Markdown study dossier with pedagogical depth. DO NOT cut corners or use placeholder text.

The dossier MUST contain these exact sections in clean Markdown:
# 📖 {word} [Furigana/Reading] • [Part of Speech] • [JLPT Level]

## 🎯 1. Significado Contextual & Nuance
Detailed explanation of what this word means in the context of the story, its register (casual, polite keigo, literary), and emotional nuance.

## 🧩 2. Anatomia dos Kanji, Radicais & Etimologia
- **Radical Principal (部首):** Name and meaning of the main kanji radical.
- **Decomposição dos Ideogramas:** Meaning of individual components and how they fit together.
- **Origem Histórica:** Pictographic origin or historical concept behind the kanji.

## 🧠 3. Mnemônica Visual & Dica Mental de Fixação
A memorable visual story, mental anchor, or vivid association to permanently memorize this word.

## 🌳 4. Família de Palavras & Compostos (熟語)
List 3 to 5 real high-frequency compound words formed with these kanji, with reading and translation in {native_lang}.

## ⚠️ 5. Cuidados, Fonética & Homófonos
Pronunciation advice, pitch accent tips, homophones (同音異義語) or near-synonym contrasts.

## 📝 6. Frases Práticas de Exemplo
2 natural sentences featuring this word with Kanji, Furigana, and translation in {native_lang}.

OUTPUT FORMAT:
Return strictly valid JSON with the full Markdown text in "markdown_content":
{{
  "word": "{word}",
  "ruby": "furigana/kana",
  "level": "JLPT {proficiency}",
  "part_of_speech": "Substantivo / Verbo / etc",
  "context_meaning": "Significado contextual resumido",
  "markdown_content": "# 📖 {word} ... (full markdown dossier)"
}}
"""

        # Línguas Alfabéticas (Espanhol, Francês, Alemão, etc.)
        return f"""You are an elite linguistic pedagogue of {self._name}.
Create a comprehensive, deep educational dossier for the word: "{word}".
Target Learner Level: CEFR {proficiency}.
Sentence Context: "{sentence_context or 'N/A'}"
Explanation Language: {native_lang}.

TASK:
Produce a dense, high-value, organized Markdown study dossier with pedagogical depth. DO NOT cut corners or use placeholder text.

The dossier MUST contain these exact sections in clean Markdown:
# 📖 {word} • [Part of Speech] • [CEFR Level]

## 🎯 1. Significado Contextual & Nuance
Detailed explanation of what this word means in the context of the story, its register (formal, informal, colloquial), and emotional nuance.

## 🧩 2. Origem, Raízes & Etimologia
- **Raízes / Prefixos / Sufixos:** Etymological breakdown, Latin/Greek/Germanic roots.
- **Evolução do Significado:** How the original meaning evolved into modern usage.

## 🧠 3. Mnemônica & Dica de Fixação
A memorable association, mental trigger, or cognate connection to permanently remember this word.

## 🌳 4. Família de Palavras & Colocações Essenciais
List 3 to 5 real high-frequency collocations and related words, with translation in {native_lang}.

## ⚠️ 5. Cuidados, Falsos Cognatos & Armadilhas
False friends alert, pronunciation traps, preposition pairings, or near-synonym contrasts.

## 📝 6. Frases Práticas de Exemplo
2 natural sentences featuring this word with translation in {native_lang}.

OUTPUT FORMAT:
Return strictly valid JSON with the full Markdown text in "markdown_content":
{{
  "word": "{word}",
  "level": "{proficiency}",
  "part_of_speech": "Substantivo / Verbo / etc",
  "context_meaning": "Significado contextual resumido",
  "markdown_content": "# 📖 {word} ... (full markdown dossier)"
}}
"""

    def get_deep_dive_fallback(
        self,
        word: str,
        proficiency: str,
        native_lang: str = "Portuguese",
    ) -> Dict[str, Any]:
        is_japanese = self._code == "ja"
        is_pt = str(native_lang).lower().startswith("port")

        if is_japanese:
            md_content = f"""# 📖 {word} [ことば] • Substantivo / Termo Lexical • JLPT {proficiency}

## 🎯 1. Significado Contextual & Nuance
{'No contexto da narrativa, refere-se ao termo em uso natural, denotando sua aplicação prática e polidez adequada.' if is_pt else 'In the story narrative, this word is used in its natural everyday pedagogical sense.'}

## 🧩 2. Anatomia dos Kanji, Radicais & Etimologia
- **Radical Principal (部首):** {'Radical semântico que expressa a ideia nuclear do ideograma.' if is_pt else 'Core semantic radical representing the central concept of the kanji.'}
- **Decomposição:** {'Composição equilibrada de traços tradicionais orientais.' if is_pt else 'Harmonious composition of traditional oriental brush strokes.'}
- **Conceito Original:** {'Evolução histórica do ideograma que simboliza a ação ou objeto.' if is_pt else 'Historical ideographic development symbolizing the action or object.'}

## 🧠 3. Mnemônica Visual & Dica de Fixação
{'Conecte a forma visual dos traços à imagem mental do significado para acelerar o reconhecimento automático.' if is_pt else 'Connect the visual stroke pattern to a memorable mental image to accelerate automatic recognition.'}

## 🌳 4. Família de Palavras & Compostos (熟語)
- **{word}** — {'Vocábulo principal' if is_pt else 'Main word'}
- **言語** (げんご) — {'Linguagem / idioma' if is_pt else 'Language'}
- **単語** (たんご) — {'Palavra / vocábulo' if is_pt else 'Word / vocabulary'}

## ⚠️ 5. Cuidados, Fonética & Homófonos
{'Preste atenção à modulação de pitch accent e à distinção clara de sons longos e pausados (sokuon).' if is_pt else 'Pay close attention to pitch accent modulation and clean differentiation of long vowels.'}

## 📝 6. Frases Práticas de Exemplo
1. これはとても面白い本です。
   - {'Este é um livro muito interessante.' if is_pt else 'This is a very interesting book.'}
2. 毎日新しい言葉を学びます。
   - {'Todos os dias aprendo novas palavras.' if is_pt else 'Every day I learn new words.'}
"""
            return {
                "word": word,
                "ruby": "ことば",
                "level": f"JLPT {proficiency}",
                "part_of_speech": "Substantivo",
                "context_meaning": f"Uso contextual de '{word}' na história.",
                "markdown_content": md_content,
            }

        md_content = f"""# 📖 {word} • Substantivo / Termo Lexical • CEFR {proficiency}

## 🎯 1. Significado Contextual & Nuance
{'No contexto da narrativa, o vocábulo é empregado em sua forma natural e comunicativa do dia a dia.' if is_pt else 'In the narrative context, this word is employed in its natural, communicative everyday sense.'}

## 🧩 2. Origem, Raízes & Etimologia
- **Raízes / Origem:** {'Vocábulo consolidado na tradição linguística do idioma ' + self._name if is_pt else 'Established vocabulary in ' + self._name + '.'}
- **Estrutura:** {'Formação morfológica regular com padrões clássicos de afixação.' if is_pt else 'Regular morphological formation following classic affixation patterns.'}

## 🧠 3. Mnemônica & Dica de Fixação
{'Associe o som ou a grafia a termos familiares da sua língua materna para criar uma âncora duradoura.' if is_pt else 'Associate the phonetic rhythm or spelling to familiar cognates to create a durable mental anchor.'}

## 🌳 4. Família de Palavras & Colocações Essenciais
- **{word}** — {'Termo fundamental' if is_pt else 'Key term'}
- **Uso comum:** {'Combinação diária frequente em conversação e leitura' if is_pt else 'Frequent daily pairing in conversation and reading'}

## ⚠️ 5. Cuidados, Falsos Cognatos & Armadilhas
{'Verifique sempre o contexto e a regência verbal/preposicional para evitar traduções literais equivocadas.' if is_pt else 'Always verify prepositions and context to avoid literal translation traps.'}

## 📝 6. Frases Práticas de Exemplo
1. Frase de demonstração no idioma {self._name}.
   - {'Tradução prática e clara em contexto.' if is_pt else 'Clear practical translation in context.'}
2. Exemplo de aplicação conversacional diária.
   - {'Frase em contexto real.' if is_pt else 'Everyday natural sentence.'}
"""
        return {
            "word": word,
            "ruby": "",
            "level": proficiency,
            "part_of_speech": "Palavra",
            "context_meaning": f"Significado contextual de '{word}' no texto.",
            "markdown_content": md_content,
        }
