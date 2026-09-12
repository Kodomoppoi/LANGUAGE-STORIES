import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Comprehensive Hiragana/Katakana to Hepburn Romaji Map
KANA_DIGRAPHS = {
    # Hiragana digraphs
    "きゃ": "kya", "きゅ": "kyu", "きょ": "kyo",
    "ぎゃ": "gya", "ぎゅ": "gyu", "ぎょ": "gyo",
    "しゃ": "sha", "しゅ": "shu", "しょ": "sho",
    "じゃ": "ja", "じゅ": "ju", "じょ": "jo",
    "ちゃ": "cha", "ちゅ": "chu", "ちょ": "cho",
    "ぢゃ": "ja", "ぢゅ": "ju", "ぢょ": "jo",
    "にゃ": "nya", "にゅ": "nyu", "にょ": "nyo",
    "ひゃ": "hya", "ひゅ": "hyu", "ひょ": "hyo",
    "びゃ": "bya", "びゅ": "byu", "びょ": "byo",
    "ぴゃ": "pya", "ぴゅ": "pyu", "ぴょ": "pyo",
    "みゃ": "mya", "みゅ": "myu", "みょ": "myo",
    "りゃ": "rya", "りゅ": "ryu", "りょ": "ryo",
    # Katakana digraphs
    "キャ": "kya", "キュ": "kyu", "キョ": "kyo",
    "ギャ": "gya", "ギュ": "gyu", "ギョ": "gyo",
    "シャ": "sha", "シュ": "shu", "ショ": "sho",
    "ジャ": "ja", "ジュ": "ju", "ジョ": "jo",
    "チャ": "cha", "チュ": "chu", "チョ": "cho",
    "ヂャ": "ja", "ヂュ": "ju", "ヂョ": "jo",
    "ニャ": "nya", "ニュ": "nyu", "ニョ": "nyo",
    "ヒャ": "hya", "ヒュ": "hyu", "ヒョ": "hyo",
    "ビャ": "bya", "ビュ": "byu", "ビョ": "byo",
    "ピャ": "pya", "ピュ": "pyu", "ピョ": "pyo",
    "ミャ": "mya", "ミュ": "myu", "ミョ": "myo",
    "リャ": "rya", "リュ": "ryu", "リョ": "ryo",
    "ファ": "fa", "フィ": "fi", "フェ": "fe", "フォ": "fo",
    "ティ": "ti", "ディ": "di", "トゥ": "tu", "ドゥ": "du",
    "チェ": "che", "シェ": "she", "ジェ": "je",
    "ウィ": "wi", "ウェ": "we", "ウォ": "wo",
    "ヴァ": "va", "ヴィ": "vi", "ヴ": "vu", "ヴェ": "ve", "ヴォ": "vo",
}

KANA_MONOGRAPHS = {
    # Hiragana
    "あ": "a", "い": "i", "う": "u", "え": "e", "お": "o",
    "か": "ka", "き": "ki", "く": "ku", "け": "ke", "こ": "ko",
    "さ": "sa", "し": "shi", "す": "su", "せ": "se", "そ": "so",
    "た": "ta", "ち": "chi", "つ": "tsu", "て": "te", "と": "to",
    "な": "na", "に": "ni", "ぬ": "nu", "ね": "ne", "の": "no",
    "は": "ha", "ひ": "hi", "ふ": "fu", "へ": "he", "ほ": "ho",
    "ま": "ma", "み": "mi", "む": "mu", "め": "me", "も": "mo",
    "や": "ya", "ゆ": "yu", "よ": "yo",
    "ら": "ra", "り": "ri", "る": "ru", "れ": "re", "ろ": "ro",
    "わ": "wa", "ゐ": "wi", "ゑ": "we", "を": "o", "ん": "n",
    "が": "ga", "ぎ": "gi", "ぐ": "gu", "げ": "ge", "ご": "go",
    "ざ": "za", "じ": "ji", "ず": "zu", "ぜ": "ze", "ぞ": "zo",
    "だ": "da", "ぢ": "ji", "づ": "zu", "で": "de", "ど": "do",
    "ば": "ba", "び": "bi", "ぶ": "bu", "べ": "be", "ぼ": "bo",
    "ぱ": "pa", "ぴ": "pi", "ぷ": "pu", "ぺ": "pe", "ぽ": "po",
    "ぁ": "a", "ぃ": "i", "ぅ": "u", "ぇ": "e", "ぉ": "o",

    # Katakana
    "ア": "a", "イ": "i", "ウ": "u", "エ": "e", "オ": "o",
    "カ": "ka", "キ": "ki", "ク": "ku", "ケ": "ke", "コ": "ko",
    "サ": "sa", "シ": "shi", "ス": "su", "セ": "se", "ソ": "so",
    "タ": "ta", "チ": "chi", "ツ": "tsu", "テ": "te", "ト": "to",
    "ナ": "na", "ニ": "ni", "ヌ": "nu", "ネ": "ne", "ノ": "no",
    "ハ": "ha", "ヒ": "hi", "フ": "fu", "ヘ": "he", "ホ": "ho",
    "マ": "ma", "ミ": "mi", "ム": "mu", "メ": "me", "モ": "mo",
    "ヤ": "ya", "ユ": "yu", "ヨ": "yo",
    "ラ": "ra", "リ": "ri", "ル": "ru", "レ": "re", "ロ": "ro",
    "ワ": "wa", "ヰ": "wi", "ヱ": "we", "ヲ": "o", "ン": "n",
    "ガ": "ga", "ギ": "gi", "グ": "gu", "ゲ": "ge", "ゴ": "go",
    "ザ": "za", "ジ": "ji", "ズ": "zu", "ゼ": "ze", "ゾ": "zo",
    "ダ": "da", "ヂ": "ji", "ヅ": "zu", "デ": "de", "ド": "do",
    "バ": "ba", "ビ": "bi", "ブ": "bu", "ベ": "be", "ボ": "bo",
    "パ": "pa", "ピ": "pi", "プ": "pu", "ペ": "pe", "ポ": "po",
    "ァ": "a", "ィ": "i", "ゥ": "u", "ェ": "e", "ォ": "o",
}

MACRON_MAP = {
    "a": "ā",
    "i": "ī",
    "u": "ū",
    "e": "ē",
    "o": "ō",
}

def to_romaji(text: str) -> str:
    if not text:
        return ""
    
    # Se o texto já for alfabeto latino/ocidental com ou sem macrons (ex: 'ohayō gozaimasu')
    if re.search(r"[a-zA-ZāēīōūĀĒĪŌŪ]", text) and not re.search(r"[\u3040-\u30ff\u4e00-\u9faf]", text):
        return text.strip()

    i = 0
    n = len(text)
    syllables = []
    
    while i < n:
        # 1. Chōonpu (ー)
        if text[i] == "ー":
            if syllables:
                last = syllables[-1]
                if last:
                    last_char = last[-1]
                    if last_char in MACRON_MAP:
                        syllables[-1] = last[:-1] + MACRON_MAP[last_char]
            i += 1
            continue

        # 2. Sokuon (っ / ッ)
        if text[i] in ("っ", "ッ"):
            # Olha para a próxima sílaba
            if i + 1 < n:
                # Checa digrafo
                next2 = text[i+1:i+3]
                next1 = text[i+1]
                next_rom = KANA_DIGRAPHS.get(next2) or KANA_MONOGRAPHS.get(next1)
                if next_rom:
                    first_cons = next_rom[0]
                    if first_cons in "aiueo":
                        syllables.append("t")
                    elif next_rom.startswith("ch"):
                        syllables.append("t")
                    elif next_rom.startswith("sh"):
                        syllables.append("s")
                    else:
                        syllables.append(first_cons)
                    i += 1
                    continue
            syllables.append("t")
            i += 1
            continue

        # 3. Digraphs (2 chars)
        if i + 1 < n:
            pair = text[i:i+2]
            if pair in KANA_DIGRAPHS:
                syllables.append(KANA_DIGRAPHS[pair])
                i += 2
                continue

        # 4. Monographs (1 char)
        char = text[i]
        if char in KANA_MONOGRAPHS:
            syllables.append(KANA_MONOGRAPHS[char])
            i += 1
            continue

        # Outros caracteres (pontuação, espaço, etc.)
        syllables.append(char)
        i += 1

    # Regras de vogais longas do Hepburn com traço
    # e.g., ou -> ō, uu -> ū, oo -> ō
    result = "".join(syllables)
    
    # Substituições de vogais longas comuns
    # ou -> ō (ex: toukyou -> tōkyō, ohayou -> ohayō, arigatou -> arigatō)
    result = re.sub(r"([a-z])ou\b", r"\1ō", result)
    result = re.sub(r"([ksthmyrwbpgdznj])ou", r"\1ō", result)
    result = re.sub(r"([ksthmyrwbpgdznj])uu", r"\1ū", result)
    result = re.sub(r"([ksthmyrwbpgdznj])oo", r"\1ō", result)
    # Palavras comuns
    result = result.replace("ohayou", "ohayō")
    result = result.replace("arigatou", "arigatō")
    result = result.replace("toukyou", "tōkyō")
    result = result.replace("kyouto", "kyōto")
    result = result.replace("oosaka", "ōsaka")
    result = result.replace("kouhii", "kōhī")
    result = result.replace("koohii", "kōhī")

    return result

test_cases = [
    ("おはようございます", "ohayō gozaimasu"),
    ("とうきょう", "tōkyō"),
    ("東京", "esperado via dict"),
    ("コーヒー", "kōhī"),
    ("ちょっと待って", "chotto"),
    ("カフェ", "kafe"),
    ("ありがとう", "arigatō"),
    ("きっさてん", "kissaten"),
    ("ちゅうもん", "chūmon"),
]

for inp, expected in test_cases:
    out = to_romaji(inp)
    print(f"{inp:15} -> {out:20} (esperado: {expected})")
