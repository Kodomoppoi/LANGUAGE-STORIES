from typing import Any, Dict, List
from .base import LanguageProfile


class JapaneseProfile(LanguageProfile):
    @property
    def language_code(self) -> str:
        return "ja"

    @property
    def language_name(self) -> str:
        return "Japanese"

    @property
    def default_tts_voice(self) -> str:
        return "ja-JP-NanamiNeural"

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

        has_custom_theme = bool(
            theme
            and theme.strip()
            and theme.strip().lower() not in ["general", "auto", "none", "automatic", "automático"]
        )
        if has_custom_theme:
            theme_instruction = f'Specific Theme: "{theme.strip()}". The vocabulary and pedagogical focus MUST strictly center around this theme.'
        else:
            theme_instruction = f'Theme: AUTOMATIC & HIGHLY DIDACTIC. Choose the most practical everyday theme for a {proficiency} (JLPT) learner (e.g. restaurant ordering, cafe, train station, convenience store, greeting friends, or daily life).'

        return f"""You are an expert curriculum designer for Japanese (JLPT framework).
Target Proficiency: {proficiency} (JLPT N5-N1).
{theme_instruction}
Native Translation Language: {native_lang}.

Task:
Select exactly {target_count} target vocabulary items for this lesson.
MANDATORY:
1. Include these pinned words if relevant: {pinned_str}.
2. Prioritize reinforcement of these review/critical words: {review_str}.
3. Every word must include:
   - "word": Kanji or Kana (e.g. レストラン, メニュー, 注文, お勧め, 店員)
   - "lemma": Dictionary form
   - "ruby": Official Hepburn Rōmaji with macrons (e.g. resutoran, menyū, chūmon, osusume, ten'in)
   - "part_of_speech": Grammatical role (NOUN, VERB, ADJ, ADV, etc.)
   - "context_translation": Clear, authentic pedagogical translation in {native_lang} (e.g. restaurante, cardápio, pedido, recomendação, atendente). NEVER use generic placeholders like "Term in context" or "Vocábulo no contexto".
   - "jlpt_level": JLPT level string (e.g. "N5", "N4", "N3")
   - "example_sentence": Short natural sentence in Japanese
   - "example_translation": Sentence translation in {native_lang}

OUTPUT FORMAT:
Return strictly valid JSON only:
{{
  "vocabulary": [
    {{
      "word": "レストラン",
      "lemma": "レストラン",
      "ruby": "resutoran",
      "part_of_speech": "NOUN",
      "context_translation": "restaurante",
      "jlpt_level": "N5",
      "example_sentence": "日本のレストランに行きました。",
      "example_translation": "Fui a um restaurante japonês."
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
        vocab_list_str = "\n".join(
            [
                f"- {v.get('word')} ({v.get('ruby', '')}, {v.get('part_of_speech')}): {v.get('context_translation')}"
                for v in curated_vocab
            ]
        )

        num_sentences = {
            "standard": 8,
            "medium": 12,
            "extended": 16,
            "epic": 20,
        }.get(story_length, 8)

        has_custom_theme = bool(
            theme
            and theme.strip()
            and theme.strip().lower() not in ["general", "auto", "none", "automatic", "automático"]
        )
        if has_custom_theme:
            theme_instruction = f'Specific Theme: "{theme.strip()}". The entire story plot, characters, and dialogues MUST strictly revolve around this theme.'
        else:
            theme_instruction = f'Story Theme: AUTOMATIC & HIGHLY DIDACTIC. Pick the most natural, immersive, and didactic scenario for a JLPT {proficiency} learner.'

        return f"""You are a master storyteller and Japanese pedagogy author.
Write an engaging, culturally authentic graded reader story in Japanese tailored for proficiency level {proficiency}.
{theme_instruction}
Target Length: Approximately {num_sentences} sentence pairs.
Native Language for Translations: {native_lang}.
Repetition Density: {repetition_density} (Each target word MUST appear naturally 2 to 4 times across the text).

TARGET VOCABULARY TO WEAVE INTO THE STORY:
{vocab_list_str}

MANDATORY OUTPUT REQUIREMENTS:
1. "title": Catchy title in Japanese.
2. "title_translation": Translation of title in {native_lang}.
3. "sentences": Array of SentencePair objects. Every Japanese sentence MUST have its natural, accurate sentence-level translation directly below it:
   [
     {{
       "id": 1,
       "target_text": "ケンさんは、日本のレストランに行きました。",
       "translation_text": "Ken foi a um restaurante japonês."
     }}
   ]
4. "story_dictionary": Comprehensive list of all vocabulary in the story with Kanji/Kana, Hepburn Rōmaji with macrons, Part of Speech, and context translation.
   CRITICAL: For EVERY entry in "story_dictionary", "context_translation" in {native_lang} is MANDATORY.
   NEVER use generic placeholders like "Term in context", "Vocábulo no contexto", "Palavra", or "Target word".
   Every single word MUST have its genuine, precise translation in {native_lang} (e.g. レストラン -> restaurante, メニュー -> cardápio, 料理 -> pratos/culinária, 店員 -> atendente/garçom).
5. "story_translated_dictionary": Reverse mapping of translated terms back to original Japanese words with brief notes:
   [
     {{
       "translated_term": "restaurante",
       "original_word": "レストラン",
       "context_note": "Local para fazer refeições"
     }}
   ]
6. PHONETIC NOTATION (HEPBURN RŌMAJI): For Japanese, for EVERY word/token, 'ruby' MUST strictly be written in official Hepburn Rōmaji with macrons (e.g. 東京 -> tōkyō, メニュー -> menyū, おはようございます -> ohayō gozaimasu, 注文 -> chūmon).
7. KATAKANA INTEGRITY: NEVER split the Katakana prolonged sound mark 'ー' from its word (e.g. 'メニュー', 'コーヒー', 'ビール' must remain whole tokens, never separate 'ー').

Return strictly valid JSON only matching:
{{
  "title": "...",
  "title_translation": "...",
  "sentences": [
    {{ "id": 1, "target_text": "...", "translation_text": "..." }}
  ],
  "story_dictionary": [
    {{
      "word": "レストラン",
      "lemma": "レストラン",
      "ruby": "resutoran",
      "part_of_speech": "NOUN",
      "context_translation": "restaurante",
      "jlpt_level": "N5"
    }}
  ],
  "story_translated_dictionary": [
    {{
      "translated_term": "restaurante",
      "original_word": "レストラン",
      "context_note": "Local de refeições"
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
        return f"""Analyze the following Japanese word in this specific sentence context for an instant popover dictionary card.
Word: "{word}"
Context: "{sentence_context}"
Native Language: {native_lang}

Return strictly valid JSON only:
{{
  "word": "{word}",
  "lemma": "{word}",
  "ruby": "Hepburn Rōmaji with macrons (e.g. tōkyō, menyū, resutoran)",
  "part_of_speech": "NOUN/VERB/ADJ/etc",
  "context_translation": "exact meaning in this context in {native_lang}",
  "jlpt_level": "N5",
  "explanation": "brief contextual grammar or usage tip"
}}
"""

    def extract_traits(self, word_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "kanji": word_data.get("word") or word_data.get("lemma") or "",
            "ruby": word_data.get("ruby") or "",
            "jlpt_level": word_data.get("jlpt_level") or word_data.get("jlptLevel") or "N5",
            "part_of_speech": word_data.get("part_of_speech") or "NOUN",
        }

    def get_sample_data(self, proficiency: str, theme: str, native_lang: str = "Portuguese") -> Dict[str, Any]:
        is_en = str(native_lang).lower().startswith("eng")

        if is_en:
            return {
                "title": "初めてのレストランでの注文",
                "title_translation": "Ordering at a Restaurant for the First Time",
                "sentences": [
                    {
                        "id": 1,
                        "target_text": "ケンさんは、日本のレストランに行きました。",
                        "translation_text": "Ken went to a Japanese restaurant.",
                    },
                    {
                        "id": 2,
                        "target_text": "テーブルの上にあるメニューを見ました。",
                        "translation_text": "He looked at the menu on the table.",
                    },
                    {
                        "id": 3,
                        "target_text": "メニューには、色々な料理があります。",
                        "translation_text": "On the menu, there were various dishes.",
                    },
                    {
                        "id": 4,
                        "target_text": "ケンさんは店員を呼んで、「お勧めは何ですか」と聞きました。",
                        "translation_text": "Ken called the waiter and asked, 'What do you recommend?'",
                    },
                ],
                "story_dictionary": [
                    {
                        "word": "レストラン",
                        "lemma": "レストラン",
                        "ruby": "resutoran",
                        "part_of_speech": "NOUN",
                        "context_translation": "restaurant",
                        "jlpt_level": "N5",
                    },
                    {
                        "word": "メニュー",
                        "lemma": "メニュー",
                        "ruby": "menyū",
                        "part_of_speech": "NOUN",
                        "context_translation": "menu",
                        "jlpt_level": "N5",
                    },
                    {
                        "word": "料理",
                        "lemma": "料理",
                        "ruby": "ryōri",
                        "part_of_speech": "NOUN",
                        "context_translation": "cooking / cuisine / dishes",
                        "jlpt_level": "N5",
                    },
                    {
                        "word": "店員",
                        "lemma": "店員",
                        "ruby": "ten'in",
                        "part_of_speech": "NOUN",
                        "context_translation": "clerk / waiter",
                        "jlpt_level": "N5",
                    },
                    {
                        "word": "お勧め",
                        "lemma": "お勧め",
                        "ruby": "osusume",
                        "part_of_speech": "NOUN",
                        "context_translation": "recommendation",
                        "jlpt_level": "N5",
                    },
                ],
                "story_translated_dictionary": [
                    {"translated_term": "restaurant", "original_word": "レストラン", "context_note": "Dining establishment"},
                    {"translated_term": "menu", "original_word": "メニュー", "context_note": "Food and drink list"},
                    {"translated_term": "recommendation", "original_word": "お勧め", "context_note": "Chef or staff suggestion"},
                ],
            }

        return {
            "title": "初めてのレストランでの注文",
            "title_translation": "O Primeiro Pedido no Restaurante",
            "sentences": [
                {
                    "id": 1,
                    "target_text": "ケンさんは、日本のレストランに行きました。",
                    "translation_text": "Ken foi a um restaurante japonês.",
                },
                {
                    "id": 2,
                    "target_text": "テーブルの上にあるメニューを見ました。",
                    "translation_text": "Ele olhou o cardápio em cima da mesa.",
                },
                {
                    "id": 3,
                    "target_text": "メニューには、色々な料理があります。",
                    "translation_text": "No cardápio, havia vários pratos.",
                },
                {
                    "id": 4,
                    "target_text": "ケンさんは店員を呼んで、「お勧めは何ですか」と聞きました。",
                    "translation_text": "Ken chamou o atendente e perguntou: 'Qual é a recomendação?'",
                },
            ],
            "story_dictionary": [
                {
                    "word": "レストラン",
                    "lemma": "レストラン",
                    "ruby": "resutoran",
                    "part_of_speech": "NOUN",
                    "context_translation": "restaurante",
                    "jlpt_level": "N5",
                },
                {
                    "word": "メニュー",
                    "lemma": "メニュー",
                    "ruby": "menyū",
                    "part_of_speech": "NOUN",
                    "context_translation": "cardápio",
                    "jlpt_level": "N5",
                },
                {
                    "word": "料理",
                    "lemma": "料理",
                    "ruby": "ryōri",
                    "part_of_speech": "NOUN",
                    "context_translation": "culinária / pratos",
                    "jlpt_level": "N5",
                },
                {
                    "word": "店員",
                    "lemma": "店員",
                    "ruby": "ten'in",
                    "part_of_speech": "NOUN",
                    "context_translation": "atendente / garçom",
                    "jlpt_level": "N5",
                },
                {
                    "word": "お勧め",
                    "lemma": "お勧め",
                    "ruby": "osusume",
                    "part_of_speech": "NOUN",
                    "context_translation": "recomendação / sugestão",
                    "jlpt_level": "N5",
                },
            ],
            "story_translated_dictionary": [
                {"translated_term": "restaurante", "original_word": "レストラン", "context_note": "Local para refeições"},
                {"translated_term": "cardápio", "original_word": "メニュー", "context_note": "Lista de pratos e bebidas"},
                {"translated_term": "recomendação", "original_word": "お勧め", "context_note": "Sugestão especial da casa"},
            ],
        }

    def build_deep_dive_prompt(
        self,
        word: str,
        proficiency: str,
        sentence_context: str = "",
        native_lang: str = "Portuguese",
    ) -> str:
        return f"""You are an elite linguistic scholar and pedagogue of Japanese.
Create a comprehensive, deep educational dossier for the Japanese word: "{word}".
Target Learner Level: {proficiency} (JLPT framework).
Sentence Context: "{sentence_context or 'N/A'}"
Explanation Language: {native_lang}.

TASK:
Produce a dense, high-value, organized Markdown study dossier with pedagogical depth. DO NOT use generic placeholder text.

The dossier MUST contain these exact sections in clean Markdown:
# 📖 {word} [Hepburn Rōmaji with Macrons] • [Part of Speech] • [JLPT Level]

## 🎯 1. Significado Contextual & Nuance
Detailed explanation of what this word means in the context of the story, formality register (keigo,丁寧語, casual), and usage nuance.

## 🧩 2. Anatomia dos Caracteres & Origem
- Kanji breakdown (if applicable) with radical, readings (on'yomi/kun'yomi), or Katakana loanword origin.

## 🧠 3. Mnemônica Visual & Dica Mental de Fixação
A memorable visual story or vivid association to permanently memorize this word.

## 🌳 4. Família de Palavras & Compostos de Alta Frequência
3 to 5 real high-frequency compound words or expressions formed with this word, with Rōmaji and translation in {native_lang}.

## ⚠️ 5. Cuidados, Partículas & Armadilhas
Common particle associations (e.g. を, に, で) and grammatical pitfalls.

## 📝 6. Frases Práticas de Exemplo
2 natural sentences featuring this word with Rōmaji and translation in {native_lang}.

OUTPUT FORMAT:
Return strictly valid JSON only:
{{
  "word": "{word}",
  "ruby": "Hepburn Rōmaji reading with macrons",
  "jlpt_level": "JLPT {proficiency}",
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
        from .phonetics import get_phonetic_reading
        from .lexicon import get_auxiliary_translation

        ruby = get_phonetic_reading(word, "ja") or word
        trans = get_auxiliary_translation(word, "ja", "Portuguese" if str(native_lang).lower().startswith("port") else "English") or "Significado em contexto"
        is_pt = str(native_lang).lower().startswith("port")

        md_content = f"""# 📖 {word} [{ruby}] • Substantivo / Termo Lexical • JLPT {proficiency}

## 🎯 1. Significado Contextual & Nuance
{'No contexto da narrativa, significa: ' + trans + '. Usado de forma natural e frequente no cotidiano japonês.' if is_pt else 'In the story narrative, means: ' + trans + '. Used naturally and frequently in everyday Japanese.'}

## 🧩 2. Anatomia dos Caracteres & Origem
- **Formação:** {'Termo com alta relevância pedagógica para o nível JLPT ' + proficiency + '.' if is_pt else 'Key pedagogical term for JLPT level ' + proficiency + '.'}

## 🧠 3. Mnemônica Visual & Dica de Fixação
{'Associe o som [' + ruby + '] e a imagem visual de seu uso no restaurante ou na história para ancorar a memória de longo prazo.' if is_pt else 'Associate the sound [' + ruby + '] with its everyday usage image to anchor long-term recall.'}

## 🌳 4. Família de Palavras & Expressões
- **{word}** [{ruby}] — {trans}

## ⚠️ 5. Cuidados & Partículas
{'Preste atenção nas partículas gramaticais associadas (como を, に, で, は, が) para estruturar a frase com naturalidade.' if is_pt else 'Pay attention to associated grammatical particles (like を, に, で, は, が) for natural syntax.'}

## 📝 6. Frases Práticas de Exemplo
1. レストランに行きました。
   - *Resutoran ni ikimashita.*
   - {'Fui ao restaurante.' if is_pt else 'I went to the restaurant.'}
2. メニューを見ました。
   - *Menyū o mimashita.*
   - {'Olhei o cardápio.' if is_pt else 'I looked at the menu.'}
"""
        return {
            "word": word,
            "ruby": ruby,
            "jlpt_level": f"JLPT {proficiency}",
            "part_of_speech": "Substantivo",
            "context_meaning": trans,
            "markdown_content": md_content,
        }

