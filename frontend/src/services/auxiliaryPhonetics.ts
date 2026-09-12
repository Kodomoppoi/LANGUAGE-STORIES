import { LanguageCode, Story, StoryParagraph, StorySentence, StoryToken } from '../types';

/**
 * Tabela fonética auxiliar para caracteres chineses mais frequentes (HSK 1-6 + literatura)
 * com marcas diacríticas de tom no padrão Pinyin oficial.
 */
export const CHINESE_PINYIN_MAP: Record<string, string> = {
  // Pronomes e partículas fundamentais
  '我': 'wǒ',
  '你': 'nǐ',
  '他': 'tā',
  '她': 'tā',
  '它': 'tā',
  '们': 'men',
  '的': 'de',
  '地': 'de',
  '得': 'de',
  '了': 'le',
  '着': 'zhe',
  '过': 'guo',
  '在': 'zài',
  '是': 'shì',
  '有': 'yǒu',
  '不': 'bù',
  '没': 'méi',
  '很': 'hěn',
  '这': 'zhè',
  '那': 'nà',
  '哪': 'nǎ',
  '么': 'me',
  '什': 'shén',
  '个': 'gè',
  '只': 'zhǐ',
  '也': 'yě',
  '都': 'dōu',
  '就': 'jiù',
  '还': 'hái',
  '把': 'bǎ',
  '被': 'bèi',
  '给': 'gěi',
  '对': 'duì',
  '从': 'cóng',
  '到': 'dào',
  '和': 'hé',
  '跟': 'gēn',
  '同': 'tóng',
  '与': 'yǔ',
  '为': 'wèi',
  '以': 'yǐ',
  '及': 'jí',

  // Verbos comuns
  '看': 'kàn',
  '见': 'jiàn',
  '听': 'tīng',
  '说': 'shuō',
  '话': 'huà',
  '读': 'dú',
  '写': 'xiě',
  '走': 'zǒu',
  '跑': 'pǎo',
  '来': 'lái',
  '去': 'qù',
  '回': 'huí',
  '出': 'chū',
  '进': 'jìn',
  '起': 'qǐ',
  '坐': 'zuò',
  '站': 'zhàn',
  '躺': 'tǎng',
  '吃': 'chī',
  '喝': 'hē',
  '笑': 'xiào',
  '哭': 'kū',
  '想': 'xiǎng',
  '要': 'yào',
  '爱': 'ài',
  '喜欢': 'xǐhuan',
  '知': 'zhī',
  '道': 'dào',
  '懂': 'dǒng',
  '会': 'huì',
  '能': 'néng',
  '可以': 'kěyǐ',
  '做': 'zuò',
  '作': 'zuò',
  '买': 'mǎi',
  '卖': 'mài',
  '用': 'yòng',
  '问': 'wèn',
  '答': 'dá',
  '教': 'jiāo',
  '学': 'xué',
  '习': 'xí',
  '住': 'zhù',
  '拿': 'ná',
  '放': 'fàng',
  '开': 'kāi',
  '关': 'guān',
  '等': 'děng',
  '带': 'dài',
  '送': 'sòng',
  '穿': 'chuān',
  '脱': 'tuō',
  '找': 'zhǎo',
  '帮': 'bāng',
  '助': 'zhù',
  '成': 'chéng',
  '长': 'zhǎng',
  '变': 'biàn',
  '感': 'gǎn',
  '觉': 'jué',
  '发': 'fā',
  '现': 'xiàn',
  '开端': 'kāiduān',
  '开始': 'kāishǐ',
  '微': 'wēi',

  // Substantivos do cotidiano e natureza
  '人': 'rén',
  '家': 'jiā',
  '天': 'tiān',
  '地球': 'dìqiú',
  '土地': 'tǔdì',
  '日': 'rì',
  '月': 'yuè',
  '年': 'nián',
  '时': 'shí',
  '候': 'hou',
  '分': 'fēn',
  '水': 'shuǐ',
  '火': 'huǒ',
  '山': 'shān',
  '川': 'chuān',
  '河': 'hé',
  '海': 'hǎi',
  '雨': 'yǔ',
  '雪': 'xuě',
  '风': 'fēng',
  '云': 'yún',
  '花': 'huā',
  '草': 'cǎo',
  '木': 'mù',
  '树': 'shù',
  '叶': 'yè',
  '鸟': 'niǎo',
  '鱼': 'yú',
  '茶': 'chá',
  '馆': 'guǎn',
  '店': 'diàn',
  '书': 'shū',
  '字': 'zì',
  '纸': 'zhǐ',
  '笔': 'bǐ',
  '心': 'xīn',
  '情': 'qíng',
  '面': 'miàn',
  '头': 'tóu',
  '手': 'shǒu',
  '眼': 'yǎn',
  '目': 'mù',
  '口': 'kǒu',
  '耳': 'ěr',
  '身': 'shēn',
  '房': 'fáng',
  '间': 'jiān',
  '门': 'mén',
  '窗': 'chuāng',
  '街': 'jiē',
  '路': 'lù',
  '城': 'chéng',
  '市': 'shì',
  '国': 'guó',
  '世': 'shì',
  '界': 'jiè',
  '声': 'shēng',
  '光': 'guāng',
  '色': 'sè',
  '气': 'qì',
  '息': 'xī',
  '事': 'shì',
  '物': 'wù',
  '钱': 'qián',
  '友': 'yǒu',
  '朋': 'péng',
  '师': 'shī',
  '生': 'shēng',
  '老': 'lǎo',
  '少年': 'shàonián',
  '男': 'nán',
  '女': 'nǚ',
  '儿': 'ér',
  '子': 'zǐ',
  '父': 'fù',
  '母': 'mǔ',
  '哥': 'gē',
  '弟': 'dì',
  '姐': 'jiě',
  '妹': 'mèi',
  '夜': 'yè',
  '晨': 'chén',
  '晚': 'wǎn',
  '春': 'chūn',
  '夏': 'xià',
  '秋': 'qiū',
  '冬': 'dōng',
  '桌': 'zhuō',
  '椅': 'yǐ',
  '床': 'chuáng',
  '米': 'mǐ',
  '米饭': 'mǐ fàn',
  '饭': 'fàn',
  '菜': 'cài',
  '肉': 'ròu',
  '汤': 'tāng',
  '筷': 'kuài',
  '筷子': 'kuài zi',
  '杯': 'bēi',
  '碗': 'wǎn',
  '盘': 'pán',
  '使用': 'shǐ yòng',
  '并且': 'bìng qiě',
  '而且': 'ér qiě',
  '香': 'xiāng',
  '味': 'wèi',
  '音': 'yīn',
  '乐': 'yuè',
  '影': 'yǐng',
  '梦': 'mèng',
  '希': 'xī',
  '望': 'wàng',
  '安': 'ān',
  '静': 'jìng',
  '美': 'měi',
  '好': 'hǎo',
  '明': 'míng',
  '亮': 'liàng',
  '暗': 'àn',
  '高': 'gāo',
  '低': 'dī',
  '大': 'dà',
  '小': 'xiǎo',
  '多': 'duō',
  '少': 'shǎo',
  '远': 'yuǎn',
  '近': 'jìn',
  '快': 'kuài',
  '慢': 'màn',
  '新': 'xīn',
  '旧': 'jiù',
  '热': 'rè',
  '冷': 'lěng',
  '暖': 'nuǎn',
  '温': 'wēn',
  '真': 'zhēn',
  '假': 'jiǎ',
  '难': 'nán',
  '易': 'yì',
  '空': 'kōng',
  '满': 'mǎn',
  '深': 'shēn',
  '浅': 'qiǎn',
  '清': 'qīng',
  '楚': 'chǔ',
  '重': 'zhòng',
  '轻': 'qīng',
  '红': 'hóng',
  '绿': 'lǜ',
  '蓝': 'lán',
  '白': 'bái',
  '黑': 'hēi',
  '黄': 'huáng',
  '金': 'jīn',
  '银': 'yín',

  // Numerais
  '一': 'yī',
  '二': 'èr',
  '三': 'sān',
  '四': 'sì',
  '五': 'wǔ',
  '六': 'liù',
  '七': 'qī',
  '八': 'bā',
  '九': 'jiǔ',
  '十': 'shí',
  '百': 'bǎi',
  '千': 'qiān',
  '万': 'wàn',
  '亿': 'yì',
  '零': 'líng',
  '半': 'bàn',
  '两': 'liǎng',
  '位': 'wèi',

  // Posições
  '上': 'shàng',
  '下': 'xià',
  '左': 'zuǒ',
  '右': 'yòu',
  '前': 'qián',
  '后': 'hòu',
  '里': 'lǐ',
  '外': 'wài',
  '中': 'zhōng',
  '中间': 'zhōngjiān',
  '边': 'biān',
  '旁': 'páng',
  '内': 'nèi',

  // Morfemas, caracteres individuais e termos de alta frequência
  '午': 'wǔ',
  '巷': 'xiàng',
  '咖': 'kā',
  '啡': 'fēi',
  '咖啡': 'kā fēi',
  '咖啡馆': 'kā fēi guǎn',
  '茶馆': 'chá guǎn',
  '下午': 'xià wǔ',
  '上午': 'shàng wǔ',
  '中午': 'zhōng wǔ',
  '晚上': 'wǎn shang',
  '小明': 'xiǎo míng',
  '朋友': 'péng you',
  '美丽': 'měi lì',
  '安静': 'ān jìng',
  '温暖': 'wēn nuǎn',
  '一起': 'yī qǐ',
};

/**
 * Tabela de leituras de Kanji frequentes em Japonês (On'yomi e Kun'yomi padrão)
 * Permite decompor e gerar Furigana para palavras compostas e verbos/adjetivos flexionados.
 */
export const JAPANESE_KANJI_READINGS: Record<string, string> = {
  // Geografia, Lugares e Cidade
  '東': 'とう', '京': 'きょう', '都': 'と', '大': 'おお', '阪': 'さか', '北': 'きた', '海': 'かい',
  '県': 'けん', '市': 'し', '町': 'まち', '村': 'むら', '道': 'みち', '路': 'ろ', '地': 'じ',
  '通': 'とお', '駅': 'えき', '店': 'みせ', '屋': 'や', '館': 'かん', '公': 'こう', '園': 'えん',
  '病': 'びょう', '院': 'いん', '銀': 'ぎん', '行': 'こう', '局': 'きょく', '校': 'こう',
  '室': 'しつ', '所': 'しょ', '場': 'ば', '交': 'こう', '番': 'ばん', '宅': 'たく',

  // Tempo e Calendário
  '日': 'ひ', '月': 'つき', '年': 'とし', '時': 'とき', '分': 'ふん', '秒': 'びょう',
  '今': 'いま', '昨': 'きのう', '先': 'せん', '来': 'らい', '毎': 'まい',
  '朝': 'あさ', '昼': 'ひる', '夕': 'ゆう', '夜': 'よる', '晩': 'ばん', '前': 'まえ', '後': 'あと',
  '春': 'はる', '夏': 'なつ', '秋': 'あき', '冬': 'ふゆ', '週': 'しゅう', '間': 'かん',

  // Pessoas, Corpo e Relações
  '人': 'ひと', '男': 'おとこ', '女': 'おんな', '子': 'こ', '友': 'とも', '達': 'だち',
  '父': 'ちち', '母': 'はは', '兄': 'あに', '弟': 'おとうと', '姉': 'あね', '妹': 'いもうと',
  '家': 'いえ', '族': 'ぞく', '親': 'おや', '主': 'しゅ', '客': 'きゃく', '私': 'わたし',
  '僕': 'ぼく', '彼': 'かれ', '目': 'め', '耳': 'みみ', '手': 'て', '足': 'あし',
  '口': 'くち', '頭': 'あたま', '心': 'こころ', '顔': 'かお', '声': 'こえ',

  // Natureza, Animais e Clima
  '雨': 'あめ', '雪': 'ゆき', '風': 'かぜ', '空': 'そら', '山': 'やま', '川': 'かわ',
  '森': 'もり', '林': 'はやし', '木': 'き', '花': 'はな', '草': 'くさ', '石': 'いし',
  '光': 'ひかり', '星': 'ほし', '火': 'ひ', '水': 'みず', '土': 'つち', '天': 'てん',
  '気': 'き', '晴': 'はれ', '曇': 'くもり', '猫': 'ねこ', '犬': 'いぬ', '鳥': 'とり', '魚': 'さかな',

  // Comida, Bebida e Objetos
  '茶': 'ちゃ', '珈': 'コー', '琲': 'ヒー', '飯': 'はん', '米': 'こめ', '肉': 'にく',
  '牛': 'ぎゅう', '豚': 'ぶた', '鶏': 'とり', '卵': 'たまご', '菜': 'さい', '果': 'くだ',
  '物': 'もの', '酒': 'さけ', '味': 'あじ', '香': 'かお', '湯': 'ゆ', '皿': 'さら',
  '本': 'ほん', '紙': 'かみ', '書': 'しょ', '車': 'くるま', '電': 'でん', '話': 'はなし',
  '服': 'ふく', '靴': 'くつ', '傘': 'かさ', '窓': 'まど', '辺': 'べ', '机': 'つくえ',
  '椅': 'い', '席': 'せき', '金': 'かね', '銭': 'ぜに', '箱': 'はこ', '門': 'もん',

  // Ações e Verbos (Raízes)
  '見': 'み', '聞': 'き', '言': 'い', '読': 'よ', '買': 'か', '売': 'う',
  '食': 'た', '飲': 'の', '歩': 'ある', '走': 'はし', '待': 'ま', '立': 'た',
  '座': 'すわ', '眠': 'ねむ', '寝': 'ね', '起': 'お', '休': 'やす', '働': 'はたら',
  '開': 'あ', '閉': 'し', '入': 'はい', '出': 'で', '帰': 'かえ', '降': 'ふ',
  '広': 'ひろ', '流': 'なが', '止': 'と', '始': 'はじ', '終': 'お', '続': 'つづ',
  '濡': 'ぬ', '包': 'つつ', '掛': 'か', '着': 'つ', '乗': 'の', '降る': 'ふる',
  '迎': 'むか', '思': 'おも', '知': 'し', '持': 'も', '会': 'あ', '感': 'かん',

  // Adjetivos e Qualidades (Raízes)
  '静': 'しず', '温': 'あたた', '暖': 'あたた', '冷': 'つめ', '涼': 'すず',
  '美': 'うつく', '優': 'やさ', '新': 'あたら', '古': 'ふる', '高': 'たか', '低': 'ひく',
  '長': 'なが', '短': 'みじか', '白': 'しろ', '黒': 'くろ', '赤': 'あか', '青': 'あお',
  '明': 'あか', '暗': 'くら', '狭': 'せま', '多': 'おお', '少': 'すく',
  '良': 'よ', '悪': 'わる', '早': 'はや', '遅': 'おそ', '近': 'ちか', '遠': 'とお',
  '重': 'おも', '軽': 'かる', '強': 'つよ', '弱': 'よわ', '楽': 'たの', '忙': 'いそが',
  '小': 'ちい', '丸': 'まる',
};

/**
 * Tabela fonética auxiliar para termos frequentes em Japonês (Furigana em Hiragana)
 */
export const JAPANESE_FURIGANA_MAP: Record<string, string> = {
  // Pronomes e Referências
  '私': 'わたし', '僕': 'ぼく', '俺': 'おれ', '彼': 'かれ', '彼女': 'かのじょ',
  '人': 'ひと', '男': 'おとこ', '女': 'おんな', '子': 'こ', '子供': 'こども',
  '友達': 'ともだち', '先生': 'せんせい', '学生': 'がくせい', '学校': 'がっこう',
  '家族': 'かぞく', '両親': 'りょうしん', '父': 'ちち', 'お父さん': 'おとうさん',
  '母': 'はは', 'お母さん': 'おかあさん', '兄': 'あに', 'お兄さん': 'おにいさん',
  '弟': 'おとうと', '姉': 'あね', 'お姉さん': 'おねえさん', '妹': 'いもうと',
  '客': 'きゃく', 'お客さん': 'おきゃくさん', '店主': 'てんしゅ', '猫': 'ねこ', '犬': 'いぬ',

  // Lugares, Cidades e Estabelecimentos
  '東京': 'とうきょう', '京都': 'きょうと', '大阪': 'おおさか', '日本': 'にほん',
  '駅': 'えき', '道': 'みち', '路地': 'ろじ', '町': 'まち', '部屋': 'へや', '家': 'いえ',
  '店': 'みせ', '店内': 'てんない', '喫茶店': 'きっさてん', '喫茶': 'きっさ',
  'カフェ': 'カフェ', '本屋': 'ほんや', '公園': 'こうえん', '病院': 'びょういん',
  '銀行': 'ぎんこう', '図書館': 'としょかん', '交番': 'こうばん',

  // Tempo e Natureza
  '時間': 'じかん', '時': 'とき', '今': 'いま', '今日': 'きょう', '明日': 'あした', '昨日': 'きのう',
  '毎日': 'まいにち', '朝': 'あさ', '昼': 'ひる', '夕方': 'ゆうがた', '夜': 'よる', '晩': 'ばん',
  '午後': 'ごご', '午前': 'ごぜん', '今週': 'こんしゅう', '来週': 'らいしゅう', '先週': 'せんしゅう',
  '今月': 'こんげつ', '来月': 'らいげつ', '今年': 'ことし', '来年': 'らいねん', '去年': 'きょねん',
  '春': 'はる', '夏': 'なつ', '秋': 'あき', '冬': 'ふゆ', '日': 'ひ', '月': 'つき', '年': 'とし',
  '雨': 'あめ', '雪': 'ゆき', '風': 'かぜ', '空': 'そら', '海': 'うみ', '山': 'やま',
  '川': 'かわ', '花': 'はな', '木': 'き', '森': 'もり', '水': 'みず', '火': 'ひ', '光': 'ひかり',
  '天気': 'てんき',

  // Objetos, Sentimentos e Cotidiano
  '珈琲': 'コーヒー', 'コーヒー': 'コーヒー', 'お茶': 'おちゃ', '茶': 'ちゃ',
  'ご飯': 'ごはん', '朝ご飯': 'あさごはん', '昼ご飯': 'ひるごはん', '晩ご飯': 'ばんごはん',
  '本': 'ほん', '写真': 'しゃしん', '傘': 'かさ', '服': 'ふく', '靴': 'くつ',
  '窓': 'まど', '窓辺': 'まどべ', '席': 'せき', '机': 'つくえ', '椅子': 'いす',
  '香り': 'かおり', '笑顔': 'えがお', '挨拶': 'あいさつ', '声': 'こえ', '気持ち': 'きもち',
  '心': 'こころ', '風景': 'ふうけい', '一口': 'ひとくち', '注文': 'ちゅうもん',
  '言葉': 'ことば', '意味': 'いみ', '仕事': 'しごと', '勉強': 'べんきょう', '旅行': 'りょこう',
  '世界': 'せかい', '平和': 'へいわ', '希望': 'きぼう', '夢': 'ゆめ', '愛': 'あい',
  '小明': 'しょうめい', '一緒': 'いっしょ', '一緒に': 'いっしょに',

  // Adjetivos Comuns (com e sem okurigana)
  '静か': 'しずか', '静かな': 'しずかな', '静かに': 'しずかに',
  '温かい': 'あたたかい', '暖かい': 'あたたかい', '温かく': 'あたたかく',
  '優しい': 'やさしい', '優しく': 'やさしく',
  '美しい': 'うつくしい', '美しく': 'うつくしく',
  '綺麗': 'きれい', '綺麗な': 'きれいな',
  '小さい': 'ちいさい', '小さな': 'ちいさな',
  '大きい': 'おおきい', '大きな': 'おおきな',
  '新しい': 'あたらしい', '古く': 'ふるく', '古い': 'ふるい',
  '高い': 'たかい', '低い': 'ひくい',
  '明るい': 'あかるい', '暗い': 'くらい',
  '白': 'しろ', '白い': 'しろい', '黒': 'くろ', '黒い': 'くろい',
  '赤': 'あか', '赤い': 'あかい', '青': 'あお', '青い': 'あおい',

  // Verbos em Formas Comuns (Dicionário, Masu, Ta, Te)
  '行く': 'いく', '行き': 'いき', '行きます': 'いきます', '行きました': 'いきました', '行って': 'いって', '行った': 'いった',
  '来る': 'くる', '来': 'き', '来ます': 'きます', '来ました': 'きました', '来て': 'きて', '来た': 'きた',
  '帰る': 'かえる', '帰り': 'かえり', '帰ります': 'かえります', '帰りました': 'かえりました', '帰って': 'かえって', '帰った': 'かえった',
  '見る': 'みる', '見': 'み', '見ます': 'みます', '見ました': 'みました', '見て': 'みて', '見た': 'みた',
  '聞く': 'きく', '聞き': 'きき', '聞きます': 'ききます', '聞きました': 'ききました', '聞いて': 'きいて',
  '話す': 'はなす', '話し': 'はなし', '話します': 'はなします', '話しました': 'はなしました', '話して': 'はなして',
  '読む': 'よむ', '読み': 'よみ', '読みます': 'よみます', '読みました': 'よみました', '読んで': 'よんで',
  '書く': 'かく', '書き': 'かき', '書きます': 'かきます', '書きました': 'かきました', '書いて': 'かいて',
  '食べる': 'たべる', '食べ': 'たべ', '食べます': 'たべます', '食べました': 'たべました', '食べて': 'たべて',
  '飲む': 'のむ', '飲み': 'のみ', '飲みます': 'のみます', '飲みました': 'のみました', '飲んで': 'のんで',
  '買う': 'かう', '買い': 'かい', '買います': 'かいます', '買いました': 'かいましました', '買って': 'かって',
  '待つ': 'まつ', '待ち': 'まち', '待ちます': 'まちます', '待って': 'まって',
  '座る': 'すわる', '座り': 'すわり', '座ります': 'すわります', '座りました': 'すわりました', '座って': 'すわって',
  '立つ': 'たつ', '立ち': 'たち', '立ちます': 'たちます', '立って': 'たって',
  '歩く': 'あるく', '歩き': 'あるき', '歩きます': 'あるきます', '歩きました': 'あるきました', '歩いて': 'あるいて',
  '走る': 'はしる', '走り': 'はしり', '走ります': 'はしります', '走って': 'はしって',
  '眠る': 'ねむる', '眠り': 'ねむり', '眠って': 'ねむって', '眠っていました': 'ねむっていました',
  '入る': 'はいる', '入り': 'はいり', '入ると': 'はいると', '入って': 'はいって',
  '出る': 'でる', '出': 'で', '出ます': 'でます', '出て': 'でて', '出た': 'でた',
  '広がる': 'ひろがる', '広がり': 'ひろがり', '広がります': 'ひろがります',
  '流れる': 'ながれる', '流れ': 'ながれ', '流れます': 'ながれます',
  '降り続く': 'ふりつづく', '降り続き': 'ふりつづき', '降る': 'ふる', '降り': 'ふり',
  '濡れる': 'ぬれる', '濡れ': 'ぬれ', '濡れて': 'ぬれて', '濡れていました': 'ぬれていました',
  '包む': 'つつむ', '包まれ': 'つつまれ', '包まれました': 'つつまれました',
  '止む': 'やむ', '止み': 'やみ', '止み始めました': 'やみはじめました',
  '始める': 'はじめる', '始まり': 'はじまり', '始まりました': 'はじまりました',
  '終わる': 'おわる', '終わり': 'おわり',
  '丸くなる': 'まるくなる', '丸くなって': 'まるくなって',
  '声をかける': 'こえをかける', '声をかけました': 'こえをかけました',
  '注文する': 'ちゅうもんする', '注文して': 'ちゅうもんして',
  '迎える': 'むかえる', '迎え': 'むかえ', '迎えました': 'むかえました', '迎えて': 'むかえて',
  '思う': 'おもう', '思い': 'おもい', '思いました': 'おもいました', '思って': 'おもって',
  '知る': 'しる', '知って': 'しって', '知りました': 'しりました',
  '持つ': 'もつ', '持ち': 'もち', '持って': 'もって',
  '会う': 'あう', '会い': 'あい', '会いました': 'あいました', '会って': 'あって',
  '感じる': 'かんじる', '感じ': 'かんじ', '感じました': 'かんじました',
};

/**
 * Converte caracteres Hiragana (\u3041-\u3096) para Katakana (\u30A1-\u30F6)
 * via translação Unicode direta (+0x60 = 96 posições).
 */
export function toKatakana(text: string): string {
  if (!text) return '';
  return text.replace(/[\u3041-\u3096]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60)
  );
}

const KANA_DIGRAPHS: Record<string, string> = {
  'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
  'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
  'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
  'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
  'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
  'ぢゃ': 'ja', 'ぢゅ': 'ju', 'ぢょ': 'jo',
  'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
  'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
  'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
  'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
  'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
  'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
  'キャ': 'kya', 'キュ': 'kyu', 'キョ': 'kyo',
  'ギャ': 'gya', 'ギュ': 'gyu', 'ギョ': 'gyo',
  'シャ': 'sha', 'シュ': 'shu', 'ショ': 'sho',
  'ジャ': 'ja', 'ジュ': 'ju', 'ジョ': 'jo',
  'チャ': 'cha', 'チュ': 'chu', 'チョ': 'cho',
  'ヂャ': 'ja', 'ヂュ': 'ju', 'ヂョ': 'jo',
  'ニャ': 'nya', 'ニュ': 'nyu', 'ニョ': 'nyo',
  'ヒャ': 'hya', 'ヒュ': 'hyu', 'ヒョ': 'hyo',
  'ビャ': 'bya', 'ビュ': 'byu', 'ビョ': 'byo',
  'ピャ': 'pya', 'ピュ': 'pyu', 'ピョ': 'pyo',
  'ミャ': 'mya', 'ミュ': 'myu', 'ミョ': 'myo',
  'リャ': 'rya', 'リュ': 'ryu', 'リョ': 'ryo',
  'ファ': 'fa', 'フィ': 'fi', 'フェ': 'fe', 'フォ': 'fo',
  'ティ': 'ti', 'ディ': 'di', 'トゥ': 'tu', 'ドゥ': 'du',
  'チェ': 'che', 'シェ': 'she', 'ジェ': 'je',
  'ウィ': 'wi', 'ウェ': 'we', 'ウォ': 'wo',
  'ヴァ': 'va', 'ヴィ': 'vi', 'ヴ': 'vu', 'ヴェ': 've', 'ヴォ': 'vo',
};

const KANA_MONOGRAPHS: Record<string, string> = {
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'ゐ': 'wi', 'ゑ': 'we', 'を': 'o', 'ん': 'n',
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
  'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
  'ぁ': 'a', 'ぃ': 'i', 'ぅ': 'u', 'ぇ': 'e', 'ぉ': 'o',
  'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
  'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
  'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
  'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
  'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
  'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
  'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
  'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
  'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
  'ワ': 'wa', 'ヰ': 'wi', 'ヱ': 'we', 'ヲ': 'o', 'ン': 'n',
  'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go',
  'ザ': 'za', 'ジ': 'ji', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo',
  'ダ': 'da', 'ヂ': 'ji', 'ヅ': 'zu', 'デ': 'de', 'ド': 'do',
  'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo',
  'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po',
  'ァ': 'a', 'ィ': 'i', 'ゥ': 'u', 'ェ': 'e', 'ォ': 'o',
};

const MACRON_MAP: Record<string, string> = {
  a: 'ā',
  i: 'ī',
  u: 'ū',
  e: 'ē',
  o: 'ō',
};

/**
 * Converte caracteres Hiragana e Katakana para Rōmaji oficial Hepburn com macrons (ō, ū, ā, ī, ē).
 * Se o texto já estiver em alfabeto latino (com ou sem macrons), normaliza e preserva.
 */
export function toRomaji(text: string): string {
  if (!text) return '';
  const cleaned = text.trim();

  // Se já for puramente em alfabeto latino com macrons
  if (/^[a-zA-ZāēīōūĀĒĪŌŪ\s',.!?:;\-~]+$/.test(cleaned)) {
    return cleaned;
  }

  let i = 0;
  const n = cleaned.length;
  const syllables: string[] = [];

  while (i < n) {
    // 1. Prolongamento por Chōonpu (ー)
    if (cleaned[i] === 'ー') {
      if (syllables.length > 0) {
        const last = syllables[syllables.length - 1];
        if (last && last.length > 0) {
          const lastChar = last[last.length - 1];
          if (MACRON_MAP[lastChar]) {
            syllables[syllables.length - 1] = last.slice(0, -1) + MACRON_MAP[lastChar];
          }
        }
      }
      i++;
      continue;
    }

    // 2. Consoante geminada por Sokuon (っ / ッ)
    if (cleaned[i] === 'っ' || cleaned[i] === 'ッ') {
      if (i + 1 < n) {
        const next2 = cleaned.slice(i + 1, i + 3);
        const next1 = cleaned[i + 1];
        const nextRom = KANA_DIGRAPHS[next2] || KANA_MONOGRAPHS[next1];
        if (nextRom) {
          const firstCons = nextRom[0];
          if (nextRom.startsWith('ch')) {
            syllables.push('t');
          } else if (nextRom.startsWith('sh')) {
            syllables.push('s');
          } else if (!'aiueo'.includes(firstCons)) {
            syllables.push(firstCons);
          } else {
            syllables.push('t');
          }
          i++;
          continue;
        }
      }
      syllables.push('t');
      i++;
      continue;
    }

    // 3. Dígrafos (2 caracteres)
    if (i + 1 < n) {
      const pair = cleaned.slice(i, i + 2);
      if (KANA_DIGRAPHS[pair]) {
        syllables.push(KANA_DIGRAPHS[pair]);
        i += 2;
        continue;
      }
    }

    // 4. Monógrafos (1 caractere)
    const ch = cleaned[i];
    if (KANA_MONOGRAPHS[ch]) {
      syllables.push(KANA_MONOGRAPHS[ch]);
      i++;
      continue;
    }

    // Outros caracteres (espaços, pontuação ocidental/oriental)
    syllables.push(ch);
    i++;
  }

  let result = syllables.join('');

  // 5. Regras Hepburn de vogais longas com macrons (ō, ū)
  result = result.replace(/([ksthmyrwbpgdznj])ou\b/g, '$1ō');
  result = result.replace(/([ksthmyrwbpgdznj])ou([ksthmyrwbpgdznj])/g, '$1ō$2');
  result = result.replace(/([ksthmyrwbpgdznj])uu/g, '$1ū');
  result = result.replace(/([ksthmyrwbpgdznj])oo/g, '$1ō');

  result = result.replace(/ohayou/g, 'ohayō');
  result = result.replace(/arigatou/g, 'arigatō');
  result = result.replace(/toukyou/g, 'tōkyō');
  result = result.replace(/kyouto/g, 'kyōto');
  result = result.replace(/oosaka/g, 'ōsaka');
  result = result.replace(/kouhii/g, 'kōhī');
  result = result.replace(/koohii/g, 'kōhī');
  result = result.replace(/konnichiha/g, 'konnichiwa');
  result = result.replace(/konbanha/g, 'konbanwa');

  return result;
}

/**
 * Retorna a notação fonética (Pinyin para Mandarim ou Rōmaji oficial para Japonês) para um token,
 * garantindo cobertura para todas as palavras da história.
 */
export function getAuxiliaryRuby(text: string, language: LanguageCode): string | undefined {
  if (!text) return undefined;
  const trimmed = text.trim();
  if (!trimmed) return undefined;

  // Pontuações comuns não recebem ruby
  if (/^[，。！？、：；“”‘’（）《》·….,!?:;"'()\-—「」『』\s]+$/.test(trimmed)) {
    return undefined;
  }

  if (language === 'zh') {
    // Busca direta na tabela
    if (CHINESE_PINYIN_MAP[trimmed]) {
      return CHINESE_PINYIN_MAP[trimmed];
    }
    // Se for uma palavra de múltiplos caracteres, tenta compor
    if (trimmed.length > 1) {
      const parts: string[] = [];
      let allFound = true;
      for (const char of trimmed) {
        if (CHINESE_PINYIN_MAP[char]) {
          parts.push(CHINESE_PINYIN_MAP[char]);
        } else {
          allFound = false;
          break;
        }
      }
      if (allFound && parts.length > 0) {
        return parts.join(' ');
      }
    }
  } else if (language === 'ja') {
    // 1. Busca direta no dicionário de Leituras
    if (JAPANESE_FURIGANA_MAP[trimmed]) {
      return toRomaji(JAPANESE_FURIGANA_MAP[trimmed]);
    }

    // 2. Decomposição de Kanji + Okurigana (ex: 眠っていた, 優しい, 注文して, 座りました)
    const kanjiOkuriganaMatch = trimmed.match(/^([\u4e00-\u9faf]+)([\u3040-\u309f]+)$/);
    if (kanjiOkuriganaMatch) {
      const kanjiPart = kanjiOkuriganaMatch[1];
      const kanaPart = kanjiOkuriganaMatch[2];

      if (JAPANESE_FURIGANA_MAP[kanjiPart]) {
        return toRomaji(JAPANESE_FURIGANA_MAP[kanjiPart] + kanaPart);
      }
      if (JAPANESE_KANJI_READINGS[kanjiPart]) {
        return toRomaji(JAPANESE_KANJI_READINGS[kanjiPart] + kanaPart);
      }
    }

    // 3. Decomposição de composto caractere a caractere (ex: 窓辺 = 窓:まど + 辺:べ)
    const chars = Array.from(trimmed);
    let hasKanji = false;
    let allResolved = true;
    let composed = '';
    for (const ch of chars) {
      if (/[\u4e00-\u9faf]/.test(ch)) {
        hasKanji = true;
        if (JAPANESE_KANJI_READINGS[ch]) {
          composed += JAPANESE_KANJI_READINGS[ch];
        } else if (JAPANESE_FURIGANA_MAP[ch]) {
          composed += JAPANESE_FURIGANA_MAP[ch];
        } else {
          allResolved = false;
          break;
        }
      } else {
        composed += ch;
      }
    }
    if (hasKanji && allResolved && composed.length > 0) {
      return toRomaji(composed);
    }

    // 4. Se for puramente Kana (Hiragana ou Katakana, ex: おはよう, カフェ, ありがとう),
    // gera Rōmaji oficial diretamente para suporte pedagógico a iniciantes
    if (/[\u3040-\u30ff]/.test(trimmed) && !/[\u4e00-\u9faf]/.test(trimmed)) {
      return toRomaji(trimmed);
    }
  }

  return undefined;
}

/**
 * Percorre uma história completa e injeta ruby em todos os tokens
 * que ainda não o possuam para línguas com suporte fonético (zh, ja).
 */
export function enrichStoryPhonetics(story: Story): Story {
  if (!story || (story.language !== 'zh' && story.language !== 'ja')) {
    return story;
  }

  const enrichedParagraphs: StoryParagraph[] = (story.paragraphs || []).map((p) => ({
    ...p,
    sentences: (p.sentences || []).map((s: StorySentence) => ({
      ...s,
      tokens: (s.tokens || []).map((t: StoryToken) => {
        if (story.language === 'ja') {
          const reading = getAuxiliaryRuby(t.text, 'ja') || (t.ruby ? toRomaji(t.ruby) : undefined);
          return reading ? { ...t, ruby: reading } : t;
        }
        if (t.ruby) return t;
        const aux = getAuxiliaryRuby(t.text, story.language);
        return aux ? { ...t, ruby: aux } : t;
      }),
    })),
  }));

  return {
    ...story,
    paragraphs: enrichedParagraphs,
  };
}
