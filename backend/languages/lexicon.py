"""
Léxico Auxiliar Bilíngue para Enriquecimento de Tokens e Vocabulário
Fornece traduções contextuais e classes gramaticais para termos de alta frequência
em Mandarim (zh) e Japonês (ja) em Português e Inglês.
"""
from typing import Dict, Optional, Tuple
import re

CHINESE_LEXICON: Dict[str, Dict[str, str]] = {
    # Pronomes e Demonstrativos
    "我": {"pt": "eu / mim", "en": "I / me", "pos": "PRON"},
    "你": {"pt": "você / tu", "en": "you", "pos": "PRON"},
    "您": {"pt": "o senhor / a senhora", "en": "you (polite)", "pos": "PRON"},
    "他": {"pt": "ele", "en": "he / him", "pos": "PRON"},
    "她": {"pt": "ela", "en": "she / her", "pos": "PRON"},
    "它": {"pt": "ele / ela (objeto ou animal)", "en": "it", "pos": "PRON"},
    "们": {"pt": "sufixo de plural (ex: nós, vocês)", "en": "plural suffix", "pos": "PART"},
    "我们": {"pt": "nós", "en": "we / us", "pos": "PRON"},
    "你们": {"pt": "vocês", "en": "you all / you", "pos": "PRON"},
    "他们": {"pt": "eles", "en": "they / them (male/mixed)", "pos": "PRON"},
    "她们": {"pt": "elas", "en": "they / them (female)", "pos": "PRON"},
    "这": {"pt": "este / esta / isto", "en": "this", "pos": "PRON"},
    "这里": {"pt": "aqui", "en": "here", "pos": "PRON"},
    "这儿": {"pt": "aqui", "en": "here", "pos": "PRON"},
    "这个": {"pt": "este / esta", "en": "this one", "pos": "PRON"},
    "那": {"pt": "aquele / aquela / aquilo", "en": "that", "pos": "PRON"},
    "那里": {"pt": "lá / ali", "en": "there", "pos": "PRON"},
    "那儿": {"pt": "lá / ali", "en": "there", "pos": "PRON"},
    "那个": {"pt": "aquele / aquela", "en": "that one", "pos": "PRON"},
    "哪": {"pt": "qual / que", "en": "which", "pos": "PRON"},
    "哪里": {"pt": "onde / aonde", "en": "where", "pos": "PRON"},
    "哪儿": {"pt": "onde / aonde", "en": "where", "pos": "PRON"},
    "谁": {"pt": "quem", "en": "who", "pos": "PRON"},
    "什么": {"pt": "o que / qual", "en": "what", "pos": "PRON"},
    "怎么": {"pt": "como / de que maneira", "en": "how", "pos": "ADV"},
    "怎么样": {"pt": "como está? / o que acha?", "en": "how about? / how is it?", "pos": "ADJ"},
    "为什么": {"pt": "por que", "en": "why", "pos": "ADV"},
    "多少": {"pt": "quanto / quantos", "en": "how much / how many", "pos": "PRON"},
    "几": {"pt": "quantos (número pequeno)", "en": "how many / several", "pos": "NUM"},

    # Preposições, Conjunções e Partículas Fundamentais
    "给": {"pt": "dar / para / a", "en": "to give / for / to", "pos": "VERB/PREP"},
    "在": {"pt": "em / estar em", "en": "at / in / to be located at", "pos": "PREP/VERB"},
    "的": {"pt": "partícula de posse / modificadora (de)", "en": "possessive or descriptive particle", "pos": "PART"},
    "得": {"pt": "partícula de modo/grau após verbo", "en": "structural particle after verb", "pos": "PART"},
    "地": {"pt": "partícula adverbial (-mente)", "en": "adverbial particle (-ly)", "pos": "PART"},
    "了": {"pt": "partícula de ação completada ou mudança", "en": "completed action / change of state marker", "pos": "PART"},
    "着": {"pt": "partícula de ação contínua ou estado", "en": "continuous action marker", "pos": "PART"},
    "过": {"pt": "partícula de experiência passada", "en": "past experience particle", "pos": "PART"},
    "和": {"pt": "e / com", "en": "and / with", "pos": "CONJ"},
    "跟": {"pt": "com / acompanhar", "en": "with / to follow", "pos": "PREP/VERB"},
    "对": {"pt": "para / em relação a / correto", "en": "to / towards / correct", "pos": "PREP/ADJ"},
    "从": {"pt": "a partir de / desde / de", "en": "from / since", "pos": "PREP"},
    "到": {"pt": "chegar a / até", "en": "to arrive / until / to", "pos": "VERB/PREP"},
    "比": {"pt": "comparado a / do que", "en": "compared to / than", "pos": "PREP"},
    "把": {"pt": "partícula de antecipação do objeto direto", "en": "pretransitive particle", "pos": "PREP"},
    "被": {"pt": "partícula de voz passiva (por / levado a)", "en": "passive voice particle", "pos": "PREP"},
    "为": {"pt": "por / para / em favor de", "en": "for / on behalf of", "pos": "PREP"},
    "因为": {"pt": "porque / já que", "en": "because", "pos": "CONJ"},
    "所以": {"pt": "por isso / portanto", "en": "so / therefore", "pos": "CONJ"},
    "但是": {"pt": "mas / porém", "en": "but / however", "pos": "CONJ"},
    "可是": {"pt": "mas / contudo", "en": "but / yet", "pos": "CONJ"},
    "如果": {"pt": "se / caso", "en": "if", "pos": "CONJ"},
    "虽然": {"pt": "embora / apesar de", "en": "although", "pos": "CONJ"},

    # Verbos Essenciais e Auxiliares
    "是": {"pt": "ser / é / são", "en": "to be (is/are/am)", "pos": "VERB"},
    "有": {"pt": "ter / haver / existir", "en": "to have / there is", "pos": "VERB"},
    "没有": {"pt": "não ter / não haver", "en": "not have / there is not", "pos": "VERB"},
    "不": {"pt": "não", "en": "no / not", "pos": "ADV"},
    "没": {"pt": "não (passado ou ter)", "en": "not (past/have)", "pos": "ADV"},
    "很": {"pt": "muito", "en": "very / quite", "pos": "ADV"},
    "太": {"pt": "demais / muito", "en": "too / extremely", "pos": "ADV"},
    "都": {"pt": "todos / ambos / já", "en": "all / both", "pos": "ADV"},
    "也": {"pt": "também", "en": "also / too", "pos": "ADV"},
    "真": {"pt": "realmente / verdadeiramente", "en": "really / truly", "pos": "ADV"},
    "最": {"pt": "o mais / superlativo", "en": "most / -est", "pos": "ADV"},
    "想": {"pt": "querer / pensar / sentir falta", "en": "to want / to think / to miss", "pos": "VERB"},
    "要": {"pt": "querer / precisar / vai (futuro)", "en": "to want / need / will", "pos": "VERB"},
    "能": {"pt": "poder / ser capaz de", "en": "can / able to", "pos": "VERB"},
    "会": {"pt": "saber (habilidade) / vai (futuro)", "en": "can (skill) / will", "pos": "VERB"},
    "可以": {"pt": "poder / permissão", "en": "may / can / acceptable", "pos": "VERB"},
    "去": {"pt": "ir", "en": "to go", "pos": "VERB"},
    "来": {"pt": "vir", "en": "to come", "pos": "VERB"},
    "看": {"pt": "olhar / ver / ler", "en": "to see / look / read", "pos": "VERB"},
    "见": {"pt": "encontrar / ver", "en": "to see / meet", "pos": "VERB"},
    "看见": {"pt": "ver / enxergar", "en": "to see / catch sight of", "pos": "VERB"},
    "听": {"pt": "ouvir / escutar", "en": "to listen / hear", "pos": "VERB"},
    "说": {"pt": "falar / dizer", "en": "to speak / say", "pos": "VERB"},
    "读": {"pt": "ler", "en": "to read", "pos": "VERB"},
    "写": {"pt": "escrever", "en": "to write", "pos": "VERB"},
    "吃": {"pt": "comer", "en": "to eat", "pos": "VERB"},
    "喝": {"pt": "beber", "en": "to drink", "pos": "VERB"},
    "买": {"pt": "comprar", "en": "to buy", "pos": "VERB"},
    "卖": {"pt": "vender", "en": "to sell", "pos": "VERB"},
    "做": {"pt": "fazer", "en": "to do / make", "pos": "VERB"},
    "坐": {"pt": "sentar / viajar de (transporte)", "en": "to sit / take (vehicle)", "pos": "VERB"},
    "住": {"pt": "morar / residir", "en": "to live / dwell", "pos": "VERB"},
    "工作": {"pt": "trabalhar / trabalho", "en": "to work / job", "pos": "VERB/NOUN"},
    "学习": {"pt": "estudar / aprender", "en": "to study / learn", "pos": "VERB"},
    "学": {"pt": "estudar / aprender", "en": "to study / learn", "pos": "VERB"},
    "点": {"pt": "fazer pedido (no restaurante) / ponto / hora", "en": "to order (food) / dot / o'clock", "pos": "VERB/NOUN"},
    "叫": {"pt": "chamar-se / chamar / pedir", "en": "to be called / to call", "pos": "VERB"},
    "问": {"pt": "perguntar", "en": "to ask", "pos": "VERB"},
    "请": {"pt": "por favor / convidar", "en": "please / to invite", "pos": "VERB"},
    "谢谢": {"pt": "obrigado / agradecer", "en": "thank you", "pos": "VERB"},
    "对不起": {"pt": "desculpe / sinto muito", "en": "sorry / excuse me", "pos": "EXCL"},
    "再见": {"pt": "tchau / até logo", "en": "goodbye", "pos": "EXCL"},

    # Substantivos e Alimentos
    "人": {"pt": "pessoa / ser humano", "en": "person / people", "pos": "NOUN"},
    "朋友": {"pt": "amigo(a)", "en": "friend", "pos": "NOUN"},
    "老师": {"pt": "professor(a)", "en": "teacher", "pos": "NOUN"},
    "学生": {"pt": "estudante / aluno", "en": "student", "pos": "NOUN"},
    "家": {"pt": "casa / família", "en": "home / family", "pos": "NOUN"},
    "钱": {"pt": "dinheiro", "en": "money", "pos": "NOUN"},
    "水": {"pt": "água", "en": "water", "pos": "NOUN"},
    "茶": {"pt": "chá", "en": "tea", "pos": "NOUN"},
    "米饭": {"pt": "arroz cozido", "en": "cooked rice", "pos": "NOUN"},
    "饭": {"pt": "refeição / comida", "en": "meal / food", "pos": "NOUN"},
    "菜": {"pt": "prato / comida / verduras", "en": "dish / vegetable / cuisine", "pos": "NOUN"},
    "菜单": {"pt": "cardápio / menu", "en": "menu", "pos": "NOUN"},
    "服务员": {"pt": "garçom / atendente", "en": "waiter / waitress / server", "pos": "NOUN"},
    "客": {"pt": "hóspede / cliente / convidado", "en": "guest / customer / visitor", "pos": "NOUN"},
    "客人": {"pt": "hóspede / cliente / convidado", "en": "guest / customer / visitor", "pos": "NOUN"},
    "筷子": {"pt": "pauzinhos / hashi", "en": "chopsticks", "pos": "NOUN"},
    "觉得": {"pt": "achar / sentir", "en": "to feel / to think", "pos": "VERB"},
    "好吃": {"pt": "gostoso / delicioso", "en": "delicious / tasty", "pos": "ADJ"},
    "好喝": {"pt": "gostoso de beber", "en": "tasty to drink", "pos": "ADJ"},
    "清凉": {"pt": "fresco / refrescante", "en": "cool / refreshing", "pos": "ADJ"},
    "旁边": {"pt": "ao lado / por perto", "en": "beside / next to", "pos": "NOUN"},
    "端": {"pt": "servir / segurar com as mãos", "en": "to hold / to serve", "pos": "VERB"},
    "夹": {"pt": "pegar (com pauzinhos) / prender", "en": "to pick up with chopsticks / to clip", "pos": "VERB"},
    "享用": {"pt": "desfrutar / saborear", "en": "to enjoy (food/experience)", "pos": "VERB"},
    "大家": {"pt": "todos / todo mundo", "en": "everyone / all", "pos": "PRON"},
    "米": {"pt": "arroz (grão) / metro", "en": "rice (grain) / meter", "pos": "NOUN"},
    "米饭": {"pt": "arroz cozido / arroz", "en": "cooked rice / rice", "pos": "NOUN"},
    "饭": {"pt": "refeição / comida / arroz", "en": "meal / food / cooked rice", "pos": "NOUN"},
    "水": {"pt": "água", "en": "water", "pos": "NOUN"},
    "茶": {"pt": "chá", "en": "tea", "pos": "NOUN"},
    "点": {"pt": "pedir (comida) / ponto / hora", "en": "to order (food) / point / o'clock", "pos": "VERB/NOUN"},
    "点菜": {"pt": "fazer o pedido / pedir pratos", "en": "to order dishes", "pos": "VERB"},
    "想": {"pt": "querer / pensar / sentir falta", "en": "to want / to think", "pos": "VERB"},
    "要": {"pt": "querer / precisar / dever", "en": "to want / to need", "pos": "VERB"},
    "用": {"pt": "usar / utilizar", "en": "to use", "pos": "VERB"},
    "使用": {"pt": "usar / utilizar", "en": "to use / employ", "pos": "VERB"},
    "并且": {"pt": "além disso / e também", "en": "and also / moreover", "pos": "CONJ"},
    "而且": {"pt": "além do mais / e também", "en": "moreover / furthermore", "pos": "CONJ"},
    "碗": {"pt": "tigela / bowl", "en": "bowl", "pos": "NOUN"},
    "盘": {"pt": "prato", "en": "plate", "pos": "NOUN"},
    "盘子": {"pt": "prato", "en": "plate", "pos": "NOUN"},
    "杯子": {"pt": "copo / xícara", "en": "cup / glass", "pos": "NOUN"},
    "汤": {"pt": "sopa", "en": "soup", "pos": "NOUN"},
    "面": {"pt": "macarrão / superfície", "en": "noodles / surface", "pos": "NOUN"},
    "面条": {"pt": "macarrão", "en": "noodles", "pos": "NOUN"},
    "肉": {"pt": "carne", "en": "meat", "pos": "NOUN"},
    "鱼": {"pt": "peixe", "en": "fish", "pos": "NOUN"},
    "吃": {"pt": "comer", "en": "to eat", "pos": "VERB"},
    "喝": {"pt": "beber", "en": "to drink", "pos": "VERB"},
    "饭馆": {"pt": "restaurante", "en": "restaurant", "pos": "NOUN"},
    "餐馆": {"pt": "restaurante", "en": "restaurant", "pos": "NOUN"},
    "买单": {"pt": "pagar a conta", "en": "pay the bill", "pos": "VERB"},
    "结账": {"pt": "fechar a conta / pagar", "en": "settle the bill", "pos": "VERB"},
    "餐厅": {"pt": "restaurante", "en": "restaurant", "pos": "NOUN"},
    "饭店": {"pt": "restaurante / hotel", "en": "restaurant / hotel", "pos": "NOUN"},
    "咖啡": {"pt": "café", "en": "coffee", "pos": "NOUN"},
    "咖啡馆": {"pt": "cafeteria / café", "en": "café / coffee shop", "pos": "NOUN"},
    "杯": {"pt": "xícara / copo (classificador)", "en": "cup / glass", "pos": "NOUN"},
    "个": {"pt": "classificador geral (unidade)", "en": "general measure word", "pos": "MEAS"},
    "条": {"pt": "classificador para objetos compridos", "en": "measure word for long objects", "pos": "MEAS"},
    "只": {"pt": "classificador para animais / apenas", "en": "measure word for animals / only", "pos": "MEAS/ADV"},
    "本": {"pt": "classificador para livros", "en": "measure word for books", "pos": "MEAS"},
    "书": {"pt": "livro", "en": "book", "pos": "NOUN"},
    "天": {"pt": "dia / céu", "en": "day / sky", "pos": "NOUN"},
    "年": {"pt": "ano", "en": "year", "pos": "NOUN"},
    "月": {"pt": "mês / lua", "en": "month / moon", "pos": "NOUN"},
    "现在": {"pt": "agora", "en": "now", "pos": "NOUN"},
    "今天": {"pt": "hoje", "en": "today", "pos": "NOUN"},
    "明天": {"pt": "amanhã", "en": "tomorrow", "pos": "NOUN"},
    "昨天": {"pt": "ontem", "en": "yesterday", "pos": "NOUN"},
    "路": {"pt": "rua / caminho", "en": "road / street", "pos": "NOUN"},
    "门": {"pt": "porta / portão", "en": "door / gate", "pos": "NOUN"},
    "桌子": {"pt": "mesa", "en": "table / desk", "pos": "NOUN"},
    "椅子": {"pt": "cadeira", "en": "chair", "pos": "NOUN"},
    "里": {"pt": "dentro / no interior", "en": "inside / in", "pos": "PREP"},
    "上": {"pt": "em cima / sobre / subir", "en": "on / above / up", "pos": "PREP/VERB"},
    "下": {"pt": "embaixo / descer / próximo", "en": "under / below / down", "pos": "PREP/VERB"},
    "前": {"pt": "frente / antes", "en": "front / before", "pos": "PREP"},
    "后": {"pt": "atrás / depois", "en": "behind / after", "pos": "PREP"},

    # Adjetivos Comuns
    "大": {"pt": "grande", "en": "big / large", "pos": "ADJ"},
    "小": {"pt": "pequeno", "en": "small / little", "pos": "ADJ"},
    "多": {"pt": "muito / muitos", "en": "many / much", "pos": "ADJ"},
    "少": {"pt": "pouco / poucos", "en": "few / little", "pos": "ADJ"},
    "好": {"pt": "bom / bem", "en": "good / well", "pos": "ADJ"},
    "好吃": {"pt": "gostoso / saboroso (comida)", "en": "delicious / tasty (food)", "pos": "ADJ"},
    "好喝": {"pt": "gostoso / saboroso (bebida)", "en": "delicious / tasty (drink)", "pos": "ADJ"},
    "热": {"pt": "quente / calor", "en": "hot", "pos": "ADJ"},
    "冷": {"pt": "frio", "en": "cold", "pos": "ADJ"},
    "高兴": {"pt": "feliz / alegre", "en": "happy / pleased", "pos": "ADJ"},
    "快": {"pt": "rápido / logo", "en": "fast / quick / soon", "pos": "ADJ"},
    "慢": {"pt": "devagar / lento", "en": "slow", "pos": "ADJ"},
    "新": {"pt": "novo", "en": "new", "pos": "ADJ"},
    "旧": {"pt": "velho / usado", "en": "old / used", "pos": "ADJ"},
    "贵": {"pt": "caro / nobre", "en": "expensive / noble", "pos": "ADJ"},
    "便宜": {"pt": "barato", "en": "cheap / inexpensive", "pos": "ADJ"},
    "漂亮": {"pt": "bonito(a) / lindo(a)", "en": "beautiful / pretty", "pos": "ADJ"},
    "好看": {"pt": "bonito / bom de ver", "en": "good-looking / nice to watch", "pos": "ADJ"},
    "好听": {"pt": "bom de ouvir / melódico", "en": "pleasant to hear", "pos": "ADJ"},
    "方便": {"pt": "conveniente / prático", "en": "convenient", "pos": "ADJ"},
    "重要": {"pt": "importante", "en": "important", "pos": "ADJ"},
    "干净": {"pt": "limpo / asseado", "en": "clean", "pos": "ADJ"},
    "简单": {"pt": "simples / fácil", "en": "simple / easy", "pos": "ADJ"},
    "容易": {"pt": "fácil", "en": "easy", "pos": "ADJ"},
    "难": {"pt": "difícil", "en": "difficult / hard", "pos": "ADJ"},
    "累": {"pt": "cansado", "en": "tired", "pos": "ADJ"},
    "忙": {"pt": "ocupado", "en": "busy", "pos": "ADJ"},
    "饿": {"pt": "com fome / faminto", "en": "hungry", "pos": "ADJ"},
    "饱": {"pt": "saciado / satisfeito", "en": "full (from eating)", "pos": "ADJ"},
    "渴": {"pt": "com sede", "en": "thirsty", "pos": "ADJ"},
    "高": {"pt": "alto", "en": "tall / high", "pos": "ADJ"},
    "低": {"pt": "baixo", "en": "low", "pos": "ADJ"},
    "长": {"pt": "comprido / longo", "en": "long", "pos": "ADJ"},
    "短": {"pt": "curto / breve", "en": "short", "pos": "ADJ"},
    "远": {"pt": "longe / distante", "en": "far / distant", "pos": "ADJ"},
    "近": {"pt": "perto / próximo", "en": "near / close", "pos": "ADJ"},
    "早": {"pt": "cedo / matutino", "en": "early", "pos": "ADJ"},
    "晚": {"pt": "tarde / noite", "en": "late", "pos": "ADJ"},

    # Verbos Adicionais de Alta Frequência
    "喜欢": {"pt": "gostar / ter apreço", "en": "to like / to enjoy", "pos": "VERB"},
    "爱": {"pt": "amar / gostar muito", "en": "to love", "pos": "VERB"},
    "知道": {"pt": "saber / ter conhecimento", "en": "to know / to be aware", "pos": "VERB"},
    "认识": {"pt": "conhecer (pessoas) / reconhecer", "en": "to know / to recognize", "pos": "VERB"},
    "明白": {"pt": "entender / compreender", "en": "to understand / clear", "pos": "VERB/ADJ"},
    "懂": {"pt": "entender / compreender", "en": "to understand", "pos": "VERB"},
    "希望": {"pt": "esperar / desejar", "en": "to hope / wish", "pos": "VERB"},
    "帮助": {"pt": "ajudar / auxílio", "en": "to help / assistance", "pos": "VERB/NOUN"},
    "帮忙": {"pt": "dar uma ajuda / ajudar", "en": "to help out", "pos": "VERB"},
    "准备": {"pt": "preparar / planejamento", "en": "to prepare", "pos": "VERB"},
    "开始": {"pt": "começar / início", "en": "to begin / start", "pos": "VERB"},
    "结束": {"pt": "terminar / fim", "en": "to end / finish", "pos": "VERB"},
    "介绍": {"pt": "apresentar / introduzir", "en": "to introduce", "pos": "VERB"},
    "欢迎": {"pt": "dar as boas-vindas / acolher", "en": "to welcome", "pos": "VERB"},
    "找": {"pt": "procurar / buscar / dar troco", "en": "to look for / to seek", "pos": "VERB"},
    "等": {"pt": "esperar / aguardar", "en": "to wait", "pos": "VERB"},
    "洗": {"pt": "lavar", "en": "to wash", "pos": "VERB"},
    "穿": {"pt": "vestir / calçar", "en": "to wear / put on", "pos": "VERB"},
    "玩": {"pt": "brincar / passear / divertir-se", "en": "to play / have fun", "pos": "VERB"},
    "旅游": {"pt": "viajar / turismo", "en": "to travel / tour", "pos": "VERB"},
    "睡觉": {"pt": "dormir", "en": "to sleep", "pos": "VERB"},
    "起床": {"pt": "levantar-se da cama", "en": "to get out of bed", "pos": "VERB"},
    "回家": {"pt": "voltar para casa", "en": "to go home", "pos": "VERB"},
    "走": {"pt": "andar / caminhar / ir embora", "en": "to walk / leave", "pos": "VERB"},
    "跑": {"pt": "correr", "en": "to run", "pos": "VERB"},
    "回": {"pt": "voltar / retornar", "en": "to return", "pos": "VERB"},
    "开": {"pt": "abrir / dirigir / ligar", "en": "to open / drive / turn on", "pos": "VERB"},
    "关": {"pt": "fechar / desligar", "en": "to close / turn off", "pos": "VERB"},

    # Advérbios e Conectores Adicionais
    "非常": {"pt": "extremamente / muito", "en": "extremely / very", "pos": "ADV"},
    "特别": {"pt": "especialmente / particular", "en": "especially / special", "pos": "ADV/ADJ"},
    "经常": {"pt": "frequentemente / com frequência", "en": "often / frequently", "pos": "ADV"},
    "常常": {"pt": "frequentemente / sempre", "en": "often", "pos": "ADV"},
    "总是": {"pt": "sempre / a todo momento", "en": "always", "pos": "ADV"},
    "有时候": {"pt": "às vezes / por vezes", "en": "sometimes", "pos": "ADV"},
    "一起": {"pt": "juntos / conjuntamente", "en": "together", "pos": "ADV"},
    "再": {"pt": "de novo / outra vez / depois", "en": "again / once more", "pos": "ADV"},
    "又": {"pt": "novamente / além de", "en": "again (past/completed)", "pos": "ADV"},
    "就": {"pt": "logo / já / precisamente", "en": "just / then / at once", "pos": "ADV"},
    "才": {"pt": "apenas então / somente agora", "en": "only then / just now", "pos": "ADV"},
    "先": {"pt": "primeiro / antes", "en": "first / in advance", "pos": "ADV"},
    "然后": {"pt": "depois / em seguida", "en": "then / afterwards", "pos": "CONJ"},
    "最后": {"pt": "por fim / finalmente", "en": "finally / last", "pos": "ADV"},
    "不过": {"pt": "porém / contudo / no entanto", "en": "however / but", "pos": "CONJ"},
    "其实": {"pt": "na verdade / de fato", "en": "actually / in fact", "pos": "ADV"},
    "当然": {"pt": "certamente / com certeza", "en": "of course / naturally", "pos": "ADV"},
    "一定": {"pt": "com certeza / definitivamente", "en": "definitely / must", "pos": "ADV"},
    "也许": {"pt": "talvez / possivelmente", "en": "maybe / perhaps", "pos": "ADV"},
    "或者": {"pt": "ou (em afirmações)", "en": "or", "pos": "CONJ"},
    "还是": {"pt": "ou (em perguntas) / ainda assim", "en": "or (in questions) / still", "pos": "CONJ/ADV"},
    "一点儿": {"pt": "um pouco / um bocadinho", "en": "a little bit", "pos": "NOUN/ADV"},
    "一下": {"pt": "uma vez / um instante (após verbo)", "en": "a bit / briefly", "pos": "ADV"},

    # Substantivos Cotidianos
    "时间": {"pt": "tempo / horário", "en": "time", "pos": "NOUN"},
    "时候": {"pt": "momento / ocasião", "en": "time / moment", "pos": "NOUN"},
    "事情": {"pt": "assunto / fato / coisa", "en": "matter / thing", "pos": "NOUN"},
    "东西": {"pt": "coisa / objeto", "en": "thing / stuff", "pos": "NOUN"},
    "问题": {"pt": "pergunta / questão / problema", "en": "question / problem", "pos": "NOUN"},
    "意思": {"pt": "significado / sentido / intenção", "en": "meaning / idea", "pos": "NOUN"},
    "名字": {"pt": "nome", "en": "name", "pos": "NOUN"},
    "电话": {"pt": "telefone / chamada", "en": "telephone / phone call", "pos": "NOUN"},
    "手机": {"pt": "celular / telemóvel", "en": "mobile phone", "pos": "NOUN"},
    "电脑": {"pt": "computador", "en": "computer", "pos": "NOUN"},
    "爸爸": {"pt": "pai / papai", "en": "father / dad", "pos": "NOUN"},
    "妈妈": {"pt": "mãe / mamãe", "en": "mother / mom", "pos": "NOUN"},
    "哥哥": {"pt": "irmão mais velho", "en": "older brother", "pos": "NOUN"},
    "弟弟": {"pt": "irmão mais novo", "en": "younger brother", "pos": "NOUN"},
    "姐姐": {"pt": "irmã mais velha", "en": "older sister", "pos": "NOUN"},
    "妹妹": {"pt": "irmã mais nova", "en": "younger sister", "pos": "NOUN"},
    "医生": {"pt": "médico(a)", "en": "doctor", "pos": "NOUN"},
    "商店": {"pt": "loja / comércio", "en": "shop / store", "pos": "NOUN"},
    "超市": {"pt": "supermercado", "en": "supermarket", "pos": "NOUN"},
    "机场": {"pt": "aeroporto", "en": "airport", "pos": "NOUN"},
    "火车站": {"pt": "estação de trem", "en": "train station", "pos": "NOUN"},
    "车站": {"pt": "ponto de ônibus / estação", "en": "station / bus stop", "pos": "NOUN"},
    "城市": {"pt": "cidade", "en": "city", "pos": "NOUN"},
    "国家": {"pt": "país / nação", "en": "country / nation", "pos": "NOUN"},
    "中国": {"pt": "China", "en": "China", "pos": "NOUN"},
    "早上": {"pt": "manhã cedo", "en": "early morning", "pos": "NOUN"},
    "上午": {"pt": "manhã (antes do meio-dia)", "en": "morning", "pos": "NOUN"},
    "中午": {"pt": "meio-dia", "en": "noon / midday", "pos": "NOUN"},
    "下午": {"pt": "tarde (após o meio-dia)", "en": "afternoon", "pos": "NOUN"},
    "晚上": {"pt": "noite", "en": "evening / night", "pos": "NOUN"},
    "小时": {"pt": "hora (duração)", "en": "hour", "pos": "NOUN"},
    "分钟": {"pt": "minuto", "en": "minute", "pos": "NOUN"},
    "苹果": {"pt": "maçã", "en": "apple", "pos": "NOUN"},
    "水果": {"pt": "fruta(s)", "en": "fruit", "pos": "NOUN"},
    "蔬菜": {"pt": "vegetais / verduras", "en": "vegetable", "pos": "NOUN"},
    "鸡蛋": {"pt": "ovo de galinha / ovo", "en": "egg", "pos": "NOUN"},
    "鸡肉": {"pt": "carne de frango", "en": "chicken meat", "pos": "NOUN"},
    "牛肉": {"pt": "carne bovina", "en": "beef", "pos": "NOUN"},
    "猪肉": {"pt": "carne de porco", "en": "pork", "pos": "NOUN"},
    "面包": {"pt": "pão", "en": "bread", "pos": "NOUN"},
    "包子": {"pt": "pão recheado cozido no vapor", "en": "steamed stuffed bun", "pos": "NOUN"},
    "饺子": {"pt": "guioza / pastel chinês", "en": "dumpling / jiaozi", "pos": "NOUN"},
}

JAPANESE_LEXICON: Dict[str, Dict[str, str]] = {
    "私": {"pt": "eu", "en": "I / me", "pos": "PRON"},
    "僕": {"pt": "eu (casual/masculino)", "en": "I (male/casual)", "pos": "PRON"},
    "あなた": {"pt": "você", "en": "you", "pos": "PRON"},
    "彼": {"pt": "ele / namorado", "en": "he / boyfriend", "pos": "PRON"},
    "彼女": {"pt": "ela / namorada", "en": "she / girlfriend", "pos": "PRON"},
    "これ": {"pt": "isto / este", "en": "this", "pos": "PRON"},
    "それ": {"pt": "isso / esse", "en": "that", "pos": "PRON"},
    "あれ": {"pt": "aquilo / aquele", "en": "that over there", "pos": "PRON"},
    "どれ": {"pt": "qual", "en": "which", "pos": "PRON"},
    "ここ": {"pt": "aqui", "en": "here", "pos": "PRON"},
    "そこ": {"pt": "aí / ali", "en": "there", "pos": "PRON"},
    "あそこ": {"pt": "lá adiante", "en": "over there", "pos": "PRON"},
    "どこ": {"pt": "onde", "en": "where", "pos": "PRON"},
    "は": {"pt": "partícula de tópico", "en": "topic marker particle", "pos": "PART"},
    "が": {"pt": "partícula de sujeito", "en": "subject marker particle", "pos": "PART"},
    "を": {"pt": "partícula de objeto direto", "en": "direct object marker particle", "pos": "PART"},
    "に": {"pt": "partícula de direção, tempo ou lugar", "en": "target/time/direction particle", "pos": "PART"},
    "で": {"pt": "partícula de local de ação ou meio", "en": "location/means particle", "pos": "PART"},
    "へ": {"pt": "partícula de direção (em direção a)", "en": "direction particle (toward)", "pos": "PART"},
    "と": {"pt": "e / com", "en": "and / with", "pos": "PART"},
    "も": {"pt": "também", "en": "also / too", "pos": "PART"},
    "の": {"pt": "partícula de posse / modificação", "en": "possessive particle", "pos": "PART"},
    "から": {"pt": "a partir de / desde / porque", "en": "from / because", "pos": "PART"},
    "まで": {"pt": "até", "en": "until / as far as", "pos": "PART"},
    "です": {"pt": "ser / estar (formal)", "en": "to be (polite)", "pos": "VERB"},
    "だ": {"pt": "ser / estar (casual)", "en": "to be (casual)", "pos": "VERB"},
    "ある": {"pt": "haver / ter (inanimado)", "en": "there is / have (inanimate)", "pos": "VERB"},
    "いる": {"pt": "haver / estar (animado)", "en": "there is / be (animate)", "pos": "VERB"},
    "する": {"pt": "fazer", "en": "to do", "pos": "VERB"},
    "行く": {"pt": "ir", "en": "to go", "pos": "VERB"},
    "来る": {"pt": "vir", "en": "to come", "pos": "VERB"},
    "見る": {"pt": "ver / olhar", "en": "to see / look", "pos": "VERB"},
    "食べる": {"pt": "comer", "en": "to eat", "pos": "VERB"},
    "飲む": {"pt": "beber", "en": "to drink", "pos": "VERB"},
    "話す": {"pt": "falar / conversar", "en": "to speak / talk", "pos": "VERB"},
    "聞く": {"pt": "ouvir / perguntar", "en": "to listen / ask", "pos": "VERB"},
    "読む": {"pt": "ler", "en": "to read", "pos": "VERB"},
    "書く": {"pt": "escrever", "en": "to write", "pos": "VERB"},
    "人": {"pt": "pessoa", "en": "person", "pos": "NOUN"},
    "本": {"pt": "livro", "en": "book", "pos": "NOUN"},
    "水": {"pt": "água", "en": "water", "pos": "NOUN"},
    "お茶": {"pt": "chá", "en": "tea", "pos": "NOUN"},
    "ご飯": {"pt": "refeição / arroz cozido", "en": "meal / cooked rice", "pos": "NOUN"},
    "友達": {"pt": "amigo(a)", "en": "friend", "pos": "NOUN"},
    "先生": {"pt": "professor(a)", "en": "teacher", "pos": "NOUN"},
    "学生": {"pt": "estudante", "en": "student", "pos": "NOUN"},
    "学校": {"pt": "escola", "en": "school", "pos": "NOUN"},
    "家": {"pt": "casa", "en": "house / home", "pos": "NOUN"},
}


def is_invalid_translation(
    translation: Optional[str],
    original_word: str = ""
) -> bool:
    """
    Determina com precisão e segurança se uma string de tradução é inválida, nula,
    mera repetição da palavra original ou ideograma CJK sem tradução real para a língua nativa.
    """
    if not translation:
        return True
    clean = str(translation).strip()
    if not clean:
        return True

    clean_lower = clean.lower()
    orig_clean = str(original_word or "").strip().lower()

    # 1. Repetição exata da palavra original
    if orig_clean and (clean_lower == orig_clean or clean == str(original_word).strip()):
        return True

    # 2. Placeholders genéricos e resquícios de prompts antigos
    invalid_placeholders = {
        "termo em contexto",
        "contextual translation",
        "termo da história",
        "termo da historia",
        "target word",
        "palavra da história",
        "palavra da historia",
        "palavra alvo",
        "palavra-alvo",
        "palavra",
        "word",
        "termo",
        "vocábulo",
        "vocabulo",
        "unknown",
        "n/a",
    }

    if clean_lower in invalid_placeholders:
        return True

    prefixes = (
        "termo da ",
        "termo em ",
        "usado em:",
        "usado em :",
        "usado em \"",
        "used in:",
        "used in \"",
        "usage of ",
        "uso de ",
        "exemplo:",
        "example:",
    )
    if any(clean_lower.startswith(p) for p in prefixes):
        return True

    # 3. Critério CJK estrito: se a tradução for composta unicamente de ideogramas CJK/Kana/símbolos
    # sem nenhuma letra latina (a-z, á, etc.), é apenas o ideograma sem tradução real
    has_latin = bool(re.search(r"[a-zA-Z\u00C0-\u00FF]", clean))
    is_pure_cjk = bool(re.match(r"^[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af\s\d\W]+$", clean))
    if is_pure_cjk and not has_latin:
        return True

    return False


def get_auxiliary_translation(
    word: str,
    language: str = "zh",
    native_lang: str = "Portuguese"
) -> Optional[str]:
    """
    Retorna a tradução auxiliar no idioma nativo do usuário (pt ou en)
    com decomposição morfológica resiliente para palavras compostas.
    """
    if not word:
        return None
    clean = word.strip()
    target_key = "en" if native_lang.lower().startswith("en") else "pt"

    lang_code = language.lower()
    if lang_code in ["zh", "chinese", "mandarin"]:
        entry = CHINESE_LEXICON.get(clean)
        if entry:
            return entry.get(target_key) or entry.get("pt")

        # Decomposição morfológica para palavras com 2 ou mais caracteres
        if len(clean) >= 2:
            parts = []
            matched = 0
            for char in clean:
                char_entry = CHINESE_LEXICON.get(char)
                if char_entry:
                    gloss = (char_entry.get(target_key) or char_entry.get("pt") or "").split("/")[0].strip()
                    if gloss:
                        matched += 1
                        parts.append(f"{char}: {gloss}")
            if matched > 0 and parts:
                return " | ".join(parts)

    elif lang_code in ["ja", "japanese"]:
        entry = JAPANESE_LEXICON.get(clean)
        if entry:
            return entry.get(target_key) or entry.get("pt")

        if len(clean) >= 2:
            parts = []
            matched = 0
            for char in clean:
                char_entry = JAPANESE_LEXICON.get(char)
                if char_entry:
                    gloss = (char_entry.get(target_key) or char_entry.get("pt") or "").split("/")[0].strip()
                    if gloss:
                        matched += 1
                        parts.append(f"{char}: {gloss}")
            if matched > 0 and parts:
                return " | ".join(parts)

    return None


def get_auxiliary_pos(word: str, language: str = "zh") -> Optional[str]:
    """
    Retorna a classe gramatical auxiliar se disponível.
    """
    if not word:
        return None
    clean = word.strip()
    lang_code = language.lower()

    if lang_code in ["zh", "chinese", "mandarin"]:
        entry = CHINESE_LEXICON.get(clean)
        if entry:
            return entry.get("pos")
    elif lang_code in ["ja", "japanese"]:
        entry = JAPANESE_LEXICON.get(clean)
        if entry:
            return entry.get("pos")

    return None
