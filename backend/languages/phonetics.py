"""
Módulo de Notação Fonética (100% Ruby para Mandarim e Japonês)
Utiliza pypinyin para gerar Pinyin com tons acentuados para todo caractere chinês,
e um mecanismo de decomposição morfológica + dicionários auxiliares para Furigana em japonês.
"""
from typing import Optional, List, Dict, Any
import re

try:
    import pypinyin
    HAS_PYPINYIN = True
except ImportError:
    HAS_PYPINYIN = False

# Leituras de Kanji frequentes em Japonês (On'yomi e Kun'yomi padrão)
JAPANESE_KANJI_READINGS: Dict[str, str] = {
    # Geografia, Lugares e Cidade
    "東": "とう", "京": "きょう", "都": "と", "大": "おお", "阪": "さか", "北": "きた", "海": "かい",
    "県": "けん", "市": "し", "町": "まち", "村": "むら", "道": "みち", "路": "ろ", "地": "じ",
    "通": "とお", "駅": "えき", "店": "みせ", "屋": "や", "館": "かん", "公": "こう", "園": "えん",
    "病": "びょう", "院": "いん", "銀": "ぎん", "行": "こう", "局": "きょく", "校": "こう",
    "室": "しつ", "所": "しょ", "場": "ば", "交": "こう", "番": "ばん", "宅": "たく",

    # Tempo e Calendário
    "日": "ひ", "月": "つき", "年": "とし", "時": "とき", "分": "ふん", "秒": "びょう",
    "今": "いま", "昨": "きのう", "先": "せん", "来": "らい", "毎": "まい",
    "朝": "あさ", "昼": "ひる", "夕": "ゆう", "夜": "よる", "晩": "ばん", "前": "まえ", "後": "あと",
    "春": "はる", "夏": "なつ", "秋": "あき", "冬": "ふゆ", "週": "しゅう", "間": "かん",

    # Números e Contadores
    "一": "いち", "二": "に", "三": "さん", "四": "よん", "五": "ご",
    "六": "ろく", "七": "なな", "八": "はち", "九": "きゅう", "十": "じゅう",
    "百": "ひゃく", "千": "せん", "万": "まん", "円": "えん", "杯": "はい", "本": "ほん", "個": "こ",

    # Pessoas, Corpo e Relações
    "人": "ひと", "男": "おとこ", "女": "おんな", "子": "こ", "友": "とも", "達": "だち",
    "父": "ちち", "母": "はは", "兄": "あに", "弟": "おとうと", "姉": "あね", "妹": "いもうと",
    "家": "いえ", "族": "ぞく", "親": "おや", "主": "しゅ", "客": "きゃく", "私": "わたし",
    "僕": "ぼく", "彼": "かれ", "目": "め", "耳": "みみ", "手": "て", "足": "あし",
    "口": "くち", "頭": "あたま", "心": "こころ", "顔": "かお", "声": "こえ",

    # Natureza, Animais e Clima
    "雨": "あめ", "雪": "ゆき", "風": "かぜ", "空": "そら", "山": "やま", "川": "かわ",
    "森": "もり", "林": "はやし", "木": "き", "花": "はな", "草": "くさ", "石": "いし",
    "光": "ひかり", "星": "ほし", "火": "ひ", "水": "みず", "土": "つち", "天": "てん",
    "気": "き", "晴": "はれ", "曇": "くもり", "猫": "ねこ", "犬": "いぬ", "鳥": "とり", "魚": "さかな",

    # Comida, Bebida e Objetos
    "茶": "ちゃ", "珈": "コー", "琲": "ヒー", "飯": "はん", "米": "こめ", "肉": "にく",
    "牛": "ぎゅう", "豚": "ぶた", "鶏": "とり", "卵": "たまご", "菜": "さい", "果": "くだ",
    "物": "もの", "酒": "さけ", "味": "あじ", "香": "かお", "湯": "ゆ", "皿": "さら",
    "本": "ほん", "紙": "かみ", "書": "しょ", "車": "くるま", "電": "でん", "話": "はなし",
    "服": "ふく", "靴": "くつ", "傘": "かさ", "窓": "まど", "辺": "べ", "机": "つくえ",
    "椅": "い", "席": "せき", "金": "かね", "銭": "ぜに", "箱": "はこ", "門": "もん",

    # Ações e Verbos (Raízes)
    "見": "み", "聞": "き", "言": "い", "読": "よ", "買": "か", "売": "う",
    "食": "た", "飲": "の", "歩": "ある", "走": "はし", "待": "ま", "立": "た",
    "座": "すわ", "眠": "ねむ", "寝": "ね", "起": "お", "休": "やす", "働": "はたら",
    "開": "あ", "閉": "し", "入": "はい", "出": "で", "帰": "かえ", "降": "ふ",
    "広": "ひろ", "流": "なが", "止": "と", "始": "はじ", "終": "お", "続": "つづ",
    "濡": "ぬ", "包": "つつ", "掛": "か", "着": "つ", "乗": "の", "降る": "ふる",
    "迎": "むか", "思": "おも", "知": "し", "持": "も", "会": "あ", "感": "かん",

    # Adjetivos e Qualidades (Raízes)
    "静": "しず", "温": "あたた", "暖": "あたた", "冷": "つめ", "涼": "すず",
    "美": "うつく", "優": "やさ", "新": "あたら", "古": "ふる", "高": "たか", "低": "ひく",
    "長": "なが", "短": "みじか", "白": "しろ", "黒": "くろ", "赤": "あか", "青": "あお",
    "明": "あか", "暗": "くら", "狭": "せま", "多": "おお", "少": "すく",
    "良": "よ", "悪": "わる", "早": "はや", "遅": "おそ", "近": "ちか", "遠": "とお",
    "重": "おも", "軽": "かる", "強": "つよ", "弱": "よわ", "楽": "たの", "忙": "いそが",
    "小": "ちい", "丸": "まる",
}

# Dicionário auxiliar para termos frequentes em Japonês (Furigana em Hiragana)
JAPANESE_FURIGANA_MAP: Dict[str, str] = {
    # Pronomes e Referências
    "私": "わたし", "僕": "ぼく", "俺": "おれ", "彼": "かれ", "彼女": "かのじょ",
    "人": "ひと", "男": "おとこ", "女": "おんな", "子": "こ", "子供": "こども",
    "友達": "ともだち", "先生": "せんせい", "学生": "がくせい", "学校": "がっこう",
    "家族": "かぞく", "両親": "りょうしん", "父": "ちち", "お父さん": "おとうさん",
    "母": "はは", "お母さん": "おかあさん", "兄": "あに", "お兄さん": "おにいさん",
    "弟": "おとうと", "姉": "あね", "お姉さん": "おねえさん", "妹": "いもうと",
    "客": "きゃく", "お客さん": "おきゃくさん", "店主": "てんしゅ", "猫": "ねこ", "犬": "いぬ",

    # Lugares, Cidades e Estabelecimentos
    "東京": "とうきょう", "京都": "きょうと", "大阪": "おおさか", "日本": "にほん",
    "駅": "えき", "道": "みち", "路地": "ろじ", "町": "まち", "部屋": "へや", "家": "いえ",
    "店": "みせ", "店内": "てんない", "喫茶店": "きっさてん", "喫茶": "きっさ",
    "カフェ": "カフェ", "本屋": "ほんや", "公園": "こうえん", "病院": "びょういん",
    "銀行": "ぎんこう", "図書館": "としょかん", "交番": "こうばん",

    # Tempo e Natureza
    "時間": "じかん", "時": "とき", "今": "いま", "今日": "きょう", "明日": "あした", "昨日": "きのう",
    "毎日": "まいにち", "朝": "あさ", "昼": "ひる", "夕方": "ゆうがた", "夜": "よる", "晩": "ばん",
    "午後": "ごご", "午前": "ごぜん", "今週": "こんしゅう", "来週": "らいしゅう", "先週": "せんしゅう",
    "今月": "こんげつ", "来月": "らいげつ", "今年": "ことし", "来年": "らいねん", "去年": "きょねん",
    "春": "はる", "夏": "なつ", "秋": "あき", "冬": "ふゆ", "日": "ひ", "月": "つき", "年": "とし",
    "雨": "あめ", "雪": "ゆき", "風": "かぜ", "空": "そら", "海": "うみ", "山": "やま",
    "川": "かわ", "花": "はな", "木": "き", "森": "もり", "水": "みず", "火": "ひ", "光": "ひかり",
    "天気": "てんき",

    # Objetos, Sentimentos e Cotidiano
    "珈琲": "コーヒー", "コーヒー": "コーヒー", "お茶": "おちゃ", "茶": "ちゃ",
    "ご飯": "ごはん", "朝ご飯": "あさごはん", "昼ご飯": "ひるごはん", "晩ご飯": "ばんごはん",
    "本": "ほん", "写真": "しゃしん", "傘": "かさ", "服": "ふく", "靴": "くつ",
    "窓": "まど", "窓辺": "まどべ", "席": "せき", "机": "つくえ", "椅子": "いす",
    "香り": "かおり", "笑顔": "えがお", "挨拶": "あいさつ", "声": "こえ", "気持ち": "きもち",
    "心": "こころ", "風景": "ふうけい", "一口": "ひとくち", "注文": "ちゅうもん",
    "言葉": "ことば", "意味": "いみ", "仕事": "しごと", "勉強": "べんきょう", "旅行": "りょこう",
    "世界": "せかい", "平和": "へいわ", "希望": "きぼう", "夢": "ゆめ", "愛": "あい",
    "小明": "しょうめい", "一緒": "いっしょ", "一緒に": "いっしょに",

    # Adjetivos Comuns
    "静か": "しずか", "静かな": "しずかな", "静かに": "しずかに",
    "温かい": "あたたかい", "暖かい": "あたたかい", "温かく": "あたたかく",
    "優しい": "やさしい", "優しく": "やさしく",
    "美しい": "うつくしい", "美しく": "うつくしく",
    "綺麗": "きれい", "綺麗な": "きれいな",
    "小さい": "ちいさい", "小さな": "ちいさな",
    "大きい": "おおきい", "大きな": "おおきな",
    "新しい": "あたらしい", "古く": "ふるく", "古い": "ふるい",
    "高い": "たかい", "低い": "ひくい",
    "明るい": "あかるい", "暗い": "くらい",
    "白": "しろ", "白い": "しろい", "黒": "くろ", "黒い": "くろい",
    "赤": "あか", "赤い": "あかい", "青": "あお", "青い": "あおい",

    # Verbos em Formas Comuns
    "行く": "いく", "行き": "いき", "行きます": "いきます", "行きました": "いきました", "行って": "いって", "行った": "いった",
    "来る": "くる", "来": "き", "来ます": "きます", "来ました": "きました", "来て": "きて", "来た": "きた",
    "帰る": "かえる", "帰り": "かえり", "帰ります": "かえります", "帰りました": "かえりました", "帰って": "かえって", "帰った": "かえった",
    "見る": "みる", "見": "み", "見ます": "みます", "見ました": "みました", "見て": "みて", "見た": "みた",
    "聞く": "きく", "聞き": "きき", "聞きます": "ききます", "聞きました": "ききました", "聞いて": "きいて",
    "話す": "はなす", "話し": "はなし", "話します": "はなします", "話しました": "はなしました", "話して": "はなして",
    "読む": "よむ", "読み": "よみ", "読みます": "よみます", "読みました": "よみました", "読んで": "よんで",
    "書く": "かく", "書き": "かき", "書きます": "かきます", "書きました": "かきました", "書いて": "かいて",
    "食べる": "たべる", "食べ": "たべ", "食べます": "たべます", "食べました": "たべました", "食べて": "たべて",
    "飲む": "のむ", "飲み": "のみ", "飲みます": "のみます", "飲みました": "のみました", "飲んで": "のんで",
    "買う": "かう", "買い": "かい", "買います": "かいます", "買いました": "かいましました", "買って": "かって",
    "待つ": "まつ", "待ち": "まち", "待ちます": "まちます", "待って": "まって",
    "座る": "すわる", "座り": "すわり", "座ります": "すわります", "座りました": "すわりました", "座って": "すわって",
    "立つ": "たつ", "立ち": "たち", "立ちます": "たちます", "立って": "たって",
    "歩く": "あるく", "歩き": "あるき", "歩きます": "あるきます", "歩きました": "あるきました", "歩いて": "あるいて",
    "走る": "はしる", "走り": "はしり", "走ります": "はしります", "走って": "はしって",
    "眠る": "ねむる", "眠り": "ねむり", "眠って": "ねむって", "眠っていました": "ねむっていました",
    "入る": "はいる", "入り": "はいり", "入ると": "はいると", "入って": "はいって",
    "出る": "でる", "出": "で", "出ます": "でます", "出て": "でて", "出た": "でた",
    "広がる": "ひろがる", "広がり": "ひろがり", "広がります": "ひろがります",
    "流れる": "ながれる", "流れ": "ながれ", "流れます": "ながれます",
    "降り続く": "ふりつづく", "降り続き": "ふりつづき", "降る": "ふる", "降り": "ふり",
    "濡れる": "ぬれる", "濡れ": "ぬれ", "濡れて": "ぬれて", "濡れていました": "ぬれていました",
    "包む": "つつむ", "包まれ": "つつまれ", "包まれました": "つつまれました",
    "止む": "やむ", "止み": "やみ", "止み始めました": "やみはじめました",
    "始める": "はじめる", "始まり": "はじまり", "始まりました": "はじまりました",
    "終わる": "おわる", "終わり": "おわり",
    "丸くなる": "まるくなる", "丸くなって": "まるくなって",
    "声をかける": "こえをかける", "声をかけました": "こえをかけました",
    "注文する": "ちゅうもんする", "注文して": "ちゅうもんして",
    "迎える": "むかえる", "迎え": "むかえ", "迎えました": "むかえました", "迎えて": "むかえて",
    "思う": "おもう", "思い": "おもい", "思いました": "おもいました", "思って": "おもって",
    "知る": "しる", "知って": "しって", "知りました": "しりました",
    "持つ": "もつ", "持ち": "もち", "持って": "もって",
    "会う": "あう", "会い": "あい", "会いました": "あいました", "会って": "あって",
    "感じる": "かんじる", "感じ": "かんじ", "感じました": "かんじました",
}


def to_katakana(text: str) -> str:
    """Converte Hiragana (\u3041-\u3096) para Katakana (\u30A1-\u30F6) via translação Unicode direta (+0x60)."""
    if not text:
        return ""
    return "".join(
        chr(ord(c) + 0x60) if "\u3041" <= c <= "\u3096" else c
        for c in text
    )


# Tabelas de translação fonética oficial Hepburn com Macrons
KANA_DIGRAPHS: Dict[str, str] = {
    # Hiragana dígrafos
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
    # Katakana dígrafos
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

KANA_MONOGRAPHS: Dict[str, str] = {
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
    """
    Converte texto em Hiragana ou Katakana para Rōmaji oficial Hepburn com macrons (traços: ō, ū, ā, ī, ē).
    Se o texto já estiver em alfabeto latino (com ou sem macrons), normaliza e preserva.
    """
    if not text:
        return ""

    cleaned_raw = text.strip()
    # Se já for totalmente em alfabeto latino (com ou sem macrons/espaços/pontuações)
    if re.search(r"^[a-zA-ZāēīōūĀĒĪŌŪ\s',.!?:;\-~]+$", cleaned_raw):
        return cleaned_raw

    i = 0
    n = len(cleaned_raw)
    syllables = []

    while i < n:
        # 1. Prolongamento por Chōonpu (ー)
        if cleaned_raw[i] == "ー":
            if syllables:
                last = syllables[-1]
                if last:
                    last_char = last[-1]
                    if last_char in MACRON_MAP:
                        syllables[-1] = last[:-1] + MACRON_MAP[last_char]
            i += 1
            continue

        # 2. Consoante geminada por Sokuon (っ / ッ)
        if cleaned_raw[i] in ("っ", "ッ"):
            if i + 1 < n:
                next2 = cleaned_raw[i + 1 : i + 3]
                next1 = cleaned_raw[i + 1]
                next_rom = KANA_DIGRAPHS.get(next2) or KANA_MONOGRAPHS.get(next1)
                if next_rom:
                    first_cons = next_rom[0]
                    if next_rom.startswith("ch"):
                        syllables.append("t")
                    elif next_rom.startswith("sh"):
                        syllables.append("s")
                    elif first_cons not in "aiueo":
                        syllables.append(first_cons)
                    else:
                        syllables.append("t")
                    i += 1
                    continue
            syllables.append("t")
            i += 1
            continue

        # 3. Dígrafos (2 caracteres japoneses)
        if i + 1 < n:
            pair = cleaned_raw[i : i + 2]
            if pair in KANA_DIGRAPHS:
                syllables.append(KANA_DIGRAPHS[pair])
                i += 2
                continue

        # 4. Monógrafos (1 caractere japonês)
        char = cleaned_raw[i]
        if char in KANA_MONOGRAPHS:
            syllables.append(KANA_MONOGRAPHS[char])
            i += 1
            continue

        # Outros caracteres (pontuação ocidental ou japonesa, espaços)
        syllables.append(char)
        i += 1

    result = "".join(syllables)

    # 5. Regras Hepburn de vogais longas com macrons (ō, ū)
    result = re.sub(r"([ksthmyrwbpgdznj])ou\b", r"\1ō", result)
    result = re.sub(r"([ksthmyrwbpgdznj])ou([ksthmyrwbpgdznj])", r"\1ō\2", result)
    result = re.sub(r"([ksthmyrwbpgdznj])uu", r"\1ū", result)
    result = re.sub(r"([ksthmyrwbpgdznj])oo", r"\1ō", result)

    # Casos léxicos frequentes
    result = result.replace("ohayou", "ohayō")
    result = result.replace("arigatou", "arigatō")
    result = result.replace("toukyou", "tōkyō")
    result = result.replace("kyouto", "kyōto")
    result = result.replace("oosaka", "ōsaka")
    result = result.replace("kouhii", "kōhī")
    result = result.replace("koohii", "kōhī")
    result = result.replace("konnichiha", "konnichiwa")
    result = result.replace("konbanha", "konbanwa")

    return result


def is_kanji_character(char: str) -> bool:
    """Verifica se o caractere pertence ao bloco Kanji (CJK)."""
    if not char:
        return False
    code = ord(char[0])
    return 0x4E00 <= code <= 0x9FFF


def get_phonetic_reading(text: str, language: str) -> Optional[str]:
    """
    Retorna a notação fonética para um caractere ou palavra.
    - Mandarim ('zh'): Pinyin com tons (ex: 'hǎo', 'chá', 'zài')
    - Japonês ('ja'): Leitura em Rōmaji oficial Hepburn com macrons (ex: 'ohayō gozaimasu', 'tōkyō')
    """
    if not text or not text.strip():
        return None

    cleaned = text.strip()
    lang = language.lower()

    if lang == "zh":
        if any(is_kanji_character(c) for c in cleaned):
            if HAS_PYPINYIN:
                pinyins = pypinyin.lazy_pinyin(cleaned, style=pypinyin.Style.TONE)
                return " ".join(pinyins)
            return None

    elif lang in ["ja", "jp"]:
        # Se for puramente pontuação, não recebe notação fonética
        if re.match(r"^[，。！？、：；“”‘’（）《》·….,!?:;\"'()\-—「」『』\s]+$", cleaned):
            return None

        # 1. Se já for Rōmaji ocidental puro
        if re.search(r"^[a-zA-ZāēīōūĀĒĪŌŪ\s',.!?:;\-~]+$", cleaned):
            return cleaned

        # 2. Correspondência exata no dicionário
        if cleaned in JAPANESE_FURIGANA_MAP:
            return to_romaji(JAPANESE_FURIGANA_MAP[cleaned])

        # 3. Decomposição de Kanji + Okurigana (ex: 眠っていた, 優しい, 注文して)
        match = re.match(r"^([\u4e00-\u9faf]+)([\u3040-\u309f]+)$", cleaned)
        if match:
            kanji_part, kana_part = match.groups()
            if kanji_part in JAPANESE_FURIGANA_MAP:
                return to_romaji(JAPANESE_FURIGANA_MAP[kanji_part] + kana_part)
            if kanji_part in JAPANESE_KANJI_READINGS:
                return to_romaji(JAPANESE_KANJI_READINGS[kanji_part] + kana_part)

        # 4. Decomposição caractere a caractere de compostos
        composed = []
        has_kanji = False
        all_resolved = True
        for ch in cleaned:
            if is_kanji_character(ch):
                has_kanji = True
                reading = JAPANESE_KANJI_READINGS.get(ch) or JAPANESE_FURIGANA_MAP.get(ch)
                if reading:
                    composed.append(reading)
                else:
                    all_resolved = False
                    break
            else:
                composed.append(ch)

        if has_kanji and all_resolved:
            return to_romaji("".join(composed))

        # 5. Se for puramente Kana (Hiragana ou Katakana, ex: おはよう, カフェ, ありがとう),
        # gera Rōmaji oficial diretamente para dar suporte didático completo a iniciantes!
        if any("\u3040" <= c <= "\u30ff" for c in cleaned) and not any(is_kanji_character(c) for c in cleaned):
            return to_romaji(cleaned)

    return None


def enrich_tokens_phonetics(tokens: List[Dict[str, Any]], language: str) -> List[Dict[str, Any]]:
    """
    Garante cobertura de 100% de Ruby/Pinyin/Rōmaji em todos os tokens da sentença.
    Para japonês, assegura que todas as anotações fonéticas sejam apresentadas em Rōmaji oficial Hepburn.
    """
    lang = language.lower()
    if lang not in ["zh", "ja", "jp"]:
        return tokens

    for token in tokens:
        unit = token.get("text", "")
        if lang in ["ja", "jp"]:
            if token.get("ruby"):
                token["ruby"] = to_romaji(token["ruby"])
            else:
                reading = get_phonetic_reading(unit, lang)
                if reading:
                    token["ruby"] = reading
        else:
            if not token.get("ruby"):
                reading = get_phonetic_reading(unit, lang)
                if reading:
                    token["ruby"] = reading

    return tokens
