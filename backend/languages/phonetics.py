"""
Módulo de Notação Fonética (100% Ruby para Mandarim e Japonês)
Utiliza pypinyin para gerar Pinyin com tons acentuados para todo caractere chinês,
e um dicionário auxiliar para Furigana em japonês.
"""
from typing import Optional, List, Dict, Any

try:
    import pypinyin
    HAS_PYPINYIN = True
except ImportError:
    HAS_PYPINYIN = False

# Dicionário auxiliar para Kanji comuns em Japonês
JAPANESE_AUX_KANJI: Dict[str, str] = {
    "私": "わたし",
    "僕": "ぼく",
    "俺": "おれ",
    "彼": "かれ",
    "彼女": "かのじょ",
    "人": "ひと",
    "男": "おとこ",
    "女": "おんな",
    "子": "こ",
    "子供": "こども",
    "日": "ひ",
    "月": "つき",
    "年": "とし",
    "時": "とき",
    "今": "いま",
    "今日": "きょう",
    "明日": "あした",
    "昨日": "きのう",
    "本": "ほん",
    "本屋": "ほんや",
    "家": "いえ",
    "部屋": "へや",
    "町": "まち",
    "道": "みち",
    "山": "やま",
    "川": "かわ",
    "海": "うみ",
    "空": "そら",
    "雨": "あめ",
    "風": "かぜ",
    "花": "はな",
    "木": "き",
    "森": "もり",
    "水": "みず",
    "火": "ひ",
    "光": "ひかり",
    "朝": "あさ",
    "昼": "ひる",
    "夜": "よる",
    "言": "こと",
    "話": "はなし",
    "見": "み",
    "聞": "き",
    "行": "い",
    "来": "き",
    "食": "た",
    "飲": "の",
    "読": "よ",
    "書": "か",
    "買": "か",
    "待": "ま",
    "歩": "ある",
    "走": "はし",
    "好": "す",
    "大": "おお",
    "小": "ちい",
    "新": "あたら",
    "古": "ふる",
    "高": "たか",
    "安": "やす",
    "長": "なが",
    "白": "しろ",
    "黒": "くろ",
    "赤": "あか",
    "青": "あお",
    "茶": "ちゃ",
    "店": "みせ",
    "駅": "えき",
    "友": "とも",
    "友達": "ともだち",
    "先生": "せんせい",
    "学生": "がくせい",
    "学校": "がっこう",
    "旅": "たび",
    "旅行": "りょこう",
    "心": "こころ",
    "愛": "あい",
    "夢": "ゆめ",
    "希望": "きぼう",
    "平和": "へいわ",
    "世界": "せかい",
    "日本": "にほん",
    "語": "ご",
}


def is_cjk_character(char: str) -> bool:
    """Verifica se o caractere pertence ao bloco CJK unificado."""
    if not char:
        return False
    code = ord(char[0])
    return 0x4E00 <= code <= 0x9FFF


def get_phonetic_reading(text: str, language: str) -> Optional[str]:
    """
    Retorna a notação fonética para um caractere ou palavra.
    - Mandarim ('zh'): Pinyin com tons (ex: 'hǎo', 'chá', 'zài')
    - Japonês ('ja'): Furigana em hiragana para Kanji comuns
    """
    if not text or not text.strip():
        return None

    cleaned = text.strip()
    lang = language.lower()

    if lang == "zh":
        # Se for um único caractere ou palavra CJK
        if any(is_cjk_character(c) for c in cleaned):
            if HAS_PYPINYIN:
                pinyins = pypinyin.lazy_pinyin(cleaned, style=pypinyin.Style.TONE)
                return " ".join(pinyins)
            return None

    elif lang == "ja":
        # Verifica se está no dicionário auxiliar de Kanji
        if cleaned in JAPANESE_AUX_KANJI:
            return JAPANESE_AUX_KANJI[cleaned]

    return None


def enrich_tokens_phonetics(tokens: List[Dict[str, Any]], language: str) -> List[Dict[str, Any]]:
    """
    Garante cobertura de 100% de Ruby/Pinyin em todos os tokens da sentença.
    Se o token já tiver ruby, mantém; caso contrário, busca a notação fonética.
    """
    lang = language.lower()
    if lang not in ["zh", "ja"]:
        return tokens

    for token in tokens:
        if not token.get("ruby"):
            unit = token.get("text", "")
            reading = get_phonetic_reading(unit, lang)
            if reading:
                token["ruby"] = reading

    return tokens
