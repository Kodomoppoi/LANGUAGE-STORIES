from typing import Any, Dict, List
from .base import LanguageProfile


class ChineseProfile(LanguageProfile):
    @property
    def language_code(self) -> str:
        return "zh"

    @property
    def language_name(self) -> str:
        return "Mandarin Chinese"

    @property
    def default_tts_voice(self) -> str:
        return "zh-CN-XiaoxiaoNeural"

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

        return f"""You are an expert curriculum designer for Mandarin Chinese (HSK framework).
Target Proficiency: {proficiency} (HSK 1-6).
Theme: "{theme}".
Native Translation Language: {native_lang}.

Task:
Select exactly {target_count} target vocabulary items for this lesson.
MANDATORY:
1. Include these pinned words if relevant: {pinned_str}.
2. Prioritize reinforcement of these review/critical words: {review_str}.
3. Every word must include:
   - "word": Hanzi (Simplified Chinese characters, e.g. 咖啡馆)
   - "lemma": Dictionary form
   - "pinyin": Full tone marks (e.g. kā fēi guǎn)
   - "part_of_speech": Grammatical role (NOUN, VERB, ADJ, ADV, etc.)
   - "context_translation": Clear translation in {native_lang} (e.g. cafeteria)
   - "radicals": Structural key radical with meaning (e.g. 口 - boca)
   - "hsk_level": Corresponding HSK level integer (1 to 6)
   - "example_sentence": Short natural sentence in Chinese
   - "example_translation": Sentence translation in {native_lang}

OUTPUT FORMAT:
Return strictly valid JSON only:
{{
  "vocabulary": [
    {{
      "word": "咖啡馆",
      "lemma": "咖啡馆",
      "pinyin": "kā fēi guǎn",
      "part_of_speech": "NOUN",
      "context_translation": "cafeteria / café",
      "radicals": "口 (boca)",
      "hsk_level": 1,
      "example_sentence": "我们在咖啡馆见面。",
      "example_translation": "Nos encontramos na cafeteria."
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
            [f"- {v.get('word')} ({v.get('pinyin')}, {v.get('part_of_speech')}): {v.get('context_translation')}"
             for v in curated_vocab]
        )

        num_sentences = {
            "standard": 8,
            "medium": 12,
            "extended": 16,
            "epic": 20,
        }.get(story_length, 8)

        return f"""You are a master storyteller and Mandarin pedagogy author.
Write an engaging, culturally authentic story in Simplified Mandarin Chinese tailored for proficiency level {proficiency}.
Theme: "{theme}".
Target Length: Approximately {num_sentences} sentence pairs.
Native Language for Translations: {native_lang}.
Repetition Density: {repetition_density} (Each target word MUST appear naturally 2 to 4 times across the text).

TARGET VOCABULARY TO WEAVE INTO THE STORY:
{vocab_list_str}

MANDATORY OUTPUT REQUIREMENTS:
1. "title": Catchy title in Chinese.
2. "title_translation": Translation of title in {native_lang}.
3. "sentences": Array of SentencePair objects. Every Chinese sentence MUST have its natural, accurate sentence-level translation directly below it:
   [
     {{
       "id": 1,
       "target_text": "在一条安静的小巷里，有一家小咖啡馆。",
       "translation_text": "Em um beco tranquilo, havia uma pequena cafeteria."
     }}
   ]
4. "story_dictionary": Comprehensive list of all important vocabulary in the story with Hanzi, Pinyin, Part of Speech, Radicals, and HSK level.
5. "story_translated_dictionary": Reverse mapping of translated terms back to original Chinese words with brief notes:
   [
     {{
       "translated_term": "cafeteria",
       "original_word": "咖啡馆",
       "context_note": "Termo para estabelecimento onde se toma café"
     }}
   ]

Return strictly valid JSON only matching:
{{
  "title": "...",
  "title_translation": "...",
  "sentences": [
    {{ "id": 1, "target_text": "...", "translation_text": "..." }}
  ],
  "story_dictionary": [
    {{
      "word": "咖啡馆",
      "lemma": "咖啡馆",
      "pinyin": "kā fēi guǎn",
      "part_of_speech": "NOUN",
      "context_translation": "cafeteria",
      "radicals": "口 (boca)",
      "hsk_level": 1
    }}
  ],
  "story_translated_dictionary": [
    {{
      "translated_term": "cafeteria",
      "original_word": "咖啡馆",
      "context_note": "Lugar acolhedor para tomar bebidas quentes"
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
        return f"""Analyze the following Mandarin word in this specific sentence context for an instant popover dictionary card.
Word: "{word}"
Context: "{sentence_context}"
Native Language: {native_lang}

Return strictly valid JSON only:
{{
  "word": "{word}",
  "lemma": "{word}",
  "pinyin": "pinyin with tone marks",
  "part_of_speech": "NOUN/VERB/ADJ/etc",
  "context_translation": "exact meaning in this context in {native_lang}",
  "radicals": "main radical char and meaning",
  "hsk_level": 1,
  "explanation": "brief contextual grammar or usage tip"
}}
"""

    def extract_traits(self, word_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "hanzi": word_data.get("word") or word_data.get("lemma") or "",
            "pinyin": word_data.get("pinyin") or word_data.get("ruby") or "",
            "radicals": word_data.get("radicals") or "",
            "hsk_level": word_data.get("hsk_level") or word_data.get("hskLevel") or 1,
            "part_of_speech": word_data.get("part_of_speech") or "NOUN",
        }

    def get_sample_data(self, proficiency: str, theme: str, native_lang: str = "Portuguese") -> Dict[str, Any]:
        is_en = str(native_lang).lower().startswith("eng")

        if is_en:
            return {
                "title": "雨后茶馆里的温暖阳光",
                "title_translation": "Warm Sunlight in the Teahouse After the Rain",
                "sentences": [
                    {
                        "id": 1,
                        "target_text": "在一条安静的小巷里，有一家温暖的茶馆。",
                        "translation_text": "In a quiet alley, there was a warm teahouse.",
                    },
                    {
                        "id": 2,
                        "target_text": "窗外的雨渐渐停了，柔和的阳光洒在木桌上。",
                        "translation_text": "The rain outside gradually stopped, and soft sunlight bathed the wooden table.",
                    },
                    {
                        "id": 3,
                        "target_text": "店主微笑着端来一杯热茶，茶香在屋里飘荡。",
                        "translation_text": "The owner smiled and served a cup of hot tea, its fragrance wafting through the room.",
                    },
                    {
                        "id": 4,
                        "target_text": "客人们静静地看书，享受着这惬意的时光。",
                        "translation_text": "Guests read quietly, enjoying this pleasant moment.",
                    },
                ],
                "story_dictionary": [
                    {
                        "word": "茶馆",
                        "lemma": "茶馆",
                        "pinyin": "chá guǎn",
                        "part_of_speech": "NOUN",
                        "context_translation": "teahouse",
                        "radicals": "艹 (plant) / 饣 (food)",
                        "hsk_level": 2,
                    },
                    {
                        "word": "温暖",
                        "lemma": "温暖",
                        "pinyin": "wēn nuǎn",
                        "part_of_speech": "ADJ",
                        "context_translation": "warm / cozy",
                        "radicals": "氵 (water) / 日 (sun)",
                        "hsk_level": 2,
                    },
                    {
                        "word": "阳光",
                        "lemma": "阳光",
                        "pinyin": "yáng guāng",
                        "part_of_speech": "NOUN",
                        "context_translation": "sunlight",
                        "radicals": "日 (sun)",
                        "hsk_level": 2,
                    },
                    {
                        "word": "茶香",
                        "lemma": "茶香",
                        "pinyin": "chá xiāng",
                        "part_of_speech": "NOUN",
                        "context_translation": "tea fragrance",
                        "radicals": "香 (fragrance)",
                        "hsk_level": 3,
                    },
                ],
                "story_translated_dictionary": [
                    {
                        "translated_term": "teahouse",
                        "original_word": "茶馆",
                        "context_note": "Traditional Chinese teahouse establishment",
                    },
                    {
                        "translated_term": "warm / cozy",
                        "original_word": "温暖",
                        "context_note": "Feeling of comfort and warmth",
                    },
                ],
            }

        return {
            "title": "雨后茶馆里的温暖阳光",
            "title_translation": "Luz Quente do Sol na Casa de Chá Após a Chuva",
            "sentences": [
                {
                    "id": 1,
                    "target_text": "在一条安静的小巷里，有一家温暖的茶馆。",
                    "translation_text": "Em um beco tranquilo, havia uma casa de chá acolhedora.",
                },
                {
                    "id": 2,
                    "target_text": "窗外的雨渐渐停了，柔和的阳光洒在木桌上。",
                    "translation_text": "A chuva lá fora parou aos poucos, e a luz suave do sol banhou a mesa de madeira.",
                },
                {
                    "id": 3,
                    "target_text": "店主微笑着端来一杯热茶，茶香在屋里飘荡。",
                    "translation_text": "O proprietário sorriu e serviu uma xícara de chá quente, cujo aroma se espalhou pelo ambiente.",
                },
                {
                    "id": 4,
                    "target_text": "客人们静静地看书，享受着这惬意的时光。",
                    "translation_text": "Os clientes liam em silêncio, aproveitando este momento agradável.",
                },
            ],
            "story_dictionary": [
                {
                    "word": "茶馆",
                    "lemma": "茶馆",
                    "pinyin": "chá guǎn",
                    "part_of_speech": "NOUN",
                    "context_translation": "casa de chá",
                    "radicals": "艹 (planta) / 饣 (comida)",
                    "hsk_level": 2,
                },
                {
                    "word": "温暖",
                    "lemma": "温暖",
                    "pinyin": "wēn nuǎn",
                    "part_of_speech": "ADJ",
                    "context_translation": "acolhedor / morno",
                    "radicals": "氵 (água) / 日 (sol)",
                    "hsk_level": 2,
                },
                {
                    "word": "阳光",
                    "lemma": "阳光",
                    "pinyin": "yáng guāng",
                    "part_of_speech": "NOUN",
                    "context_translation": "luz do sol",
                    "radicals": "日 (sol)",
                    "hsk_level": 2,
                },
                {
                    "word": "茶香",
                    "lemma": "茶香",
                    "pinyin": "chá xiāng",
                    "part_of_speech": "NOUN",
                    "context_translation": "aroma de chá",
                    "radicals": "香 (fragrância)",
                    "hsk_level": 3,
                },
            ],
            "story_translated_dictionary": [
                {
                    "translated_term": "casa de chá",
                    "original_word": "茶馆",
                    "context_note": "Estabelecimento tradicional chinês para degustar chás",
                },
                {
                    "translated_term": "acolhedor",
                    "original_word": "温暖",
                    "context_note": "Sensação de conforto e temperatura agradável",
                },
            ],
        }
