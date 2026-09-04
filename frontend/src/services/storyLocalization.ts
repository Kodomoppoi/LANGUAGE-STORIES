import { Story, StorySentence, StoryToken, DictionaryEntry } from '../types';

/**
 * Dicionário de traduções bilingues (Inglês <-> Português) para as histórias base
 * e termos comuns do sistema.
 */
interface TextTranslation {
  en: string;
  pt: string;
}

const TITLE_TRANSLATIONS: Record<string, TextTranslation> = {
  // Japanese
  '雨の日の小さな喫茶店と温かい時間': {
    en: 'The Cozy Cafe on a Rainy Day and Warm Moments',
    pt: 'O Café Acolhedor em um Dia Chuvoso e Momentos de Calma',
  },
  // Chinese
  '雨后茶馆里的温暖阳光': {
    en: 'Warm Sunlight in the Teahouse After the Rain',
    pt: 'Luz Quente do Sol na Casa de Chá Após a Chuva',
  },
  // Arabic
  'نسيم الصحراء وواحة النخيل': {
    en: 'The Desert Breeze and the Palm Oasis',
    pt: 'A Brisa do Deserto e o Oásis de Palmeiras',
  },
  // Spanish
  'El aroma de la caléndula y el jardín antiguo': {
    en: 'The Scent of Marigold and the Ancient Garden',
    pt: 'O Aroma de Calêndula e o Jardim Antigo',
  },
  // French
  'La lumière ambrée de la vieille librairie': {
    en: 'The Amber Light in the Old Bookstore',
    pt: 'A Luz Âmbar na Antiga Livraria',
  },
  // German
  'Die Uhrmacherwerkstatt und das bernsteinfarbene Licht': {
    en: "The Watchmaker's Workshop and the Amber Light",
    pt: 'A Oficina do Relojoeiro e a Luz Âmbar',
  },
  // Italian
  'Il piccolo caffè nel vicolo dei fiori': {
    en: 'The Small Cafe in the Flower Alley',
    pt: 'O Pequeno Café no Beco das Flores',
  },
  // Russian
  'Уютное кафе в дождливом переулке': {
    en: 'A Cozy Cafe in a Rainy Alleyway',
    pt: 'Um Café Acolhedor em um Beco Chuvoso',
  },
  // Korean
  '오래된 카페의 호박색 불빛': {
    en: 'The Amber Light in the Old Cafe',
    pt: 'A Luz Âmbar no Antigo Café',
  },
  // Portuguese
  'O Café Acolhedor no Beco Dourado': {
    en: 'The Cozy Cafe in the Golden Alley',
    pt: 'O Café Acolhedor no Beco Dourado',
  },
  // English
  'The Golden Marigold and the Sunlit Alley': {
    en: 'The Golden Marigold and the Sunlit Alley',
    pt: 'A Calêndula Dourada e o Beco Ensolarado',
  },
};

const SENTENCE_TRANSLATIONS: Record<string, TextTranslation> = {
  // Japanese sentences
  '東京の静かな路地に、小さな喫茶店があります。': {
    en: 'In a quiet alley of Tokyo, there is a small coffee shop.',
    pt: 'Em um beco tranquilo de Tóquio, há uma pequena cafeteria.',
  },
  '雨の日には、温かい珈琲の香りが店内に広がります。': {
    en: 'On rainy days, the aroma of warm coffee spreads throughout the shop.',
    pt: 'Nos dias de chuva, o aroma do café quente espalha-se pela cafeteria.',
  },
  '店主の猫は窓辺で丸くなって眠っていました。': {
    en: "The shopkeeper's cat was curled up asleep by the window.",
    pt: 'O gato do dono estava enrolado dormindo perto da janela.',
  },
  '店に入ると、店主は優しい笑顔で挨拶をしました。': {
    en: 'When entering the shop, the owner greeted with a gentle smile.',
    pt: 'Ao entrar no café, o dono cumprimentou com um sorriso gentil.',
  },
  'お客さんは温かい珈琲を注文して、静かな席に座りました。': {
    en: 'The customer ordered warm coffee and sat at a quiet seat.',
    pt: 'O cliente pediu um café quente e sentou-se em um lugar tranquilo.',
  },
  'この喫茶店では、時間がとてもゆっくり流れます。': {
    en: 'In this coffee shop, time flows very slowly.',
    pt: 'Nesta cafeteria, o tempo passa bem devagar.',
  },
  '外の雨は静かに降り続き、路地を歩く人の傘が濡れていました。': {
    en: 'The rain outside continued to fall quietly, wetting the umbrellas of people walking the alley.',
    pt: 'A chuva lá fora continuava caindo suavemente, molhando os guardas-chuvas de quem passava pelo beco.',
  },
  '窓辺の席からは、美しい路地の風景が見えます。': {
    en: 'From the window seat, one can see the beautiful alley scenery.',
    pt: 'Do assento junto à janela, avista-se a bela paisagem do beco.',
  },
  '客は温かい珈琲を一口飲み、その香りに包まれました。': {
    en: 'The customer took a sip of warm coffee, enveloped in its aroma.',
    pt: 'O cliente tomou um gole de café quente, envolvido pelo seu aroma.',
  },
  '夕方になり、雨が止み始めました。': {
    en: 'Evening arrived, and the rain began to stop.',
    pt: 'Chegou o entardecer, e a chuva começou a parar.',
  },
  '店主は「また来てください」と優しく声をかけました。': {
    en: 'The shopkeeper gently called out, "Please come again."',
    pt: 'O dono despediu-se gentilmente: "Por favor, volte sempre."',
  },
  '客は温かい気持ちで喫茶店を出て、静かな路地を歩いて帰りました。': {
    en: 'The customer left the cafe with a warm heart and walked home through the quiet alley.',
    pt: 'O cliente saiu do café com o coração aquecido e voltou para casa caminhando pelo beco tranquilo.',
  },

  // Chinese sentences
  '在古老的胡同里，有一家安静的茶馆。': {
    en: 'In an ancient alley, there is a quiet teahouse.',
    pt: 'Em um beco antigo, há uma casa de chá tranquila.',
  },
  '每当下雨的时候，茶馆里总是飘散着龙井茶的香味。': {
    en: 'Whenever it rains, the aroma of Longjing tea always wafts through the teahouse.',
    pt: 'Sempre que chove, o aroma do chá Longjing espalha-se pela casa de chá.',
  },
  '茶馆的主人是一位和蔼的老爷爷。': {
    en: 'The master of the teahouse is a kind elderly gentleman.',
    pt: 'O dono da casa de chá é um senhor idoso e muito gentil.',
  },
  '他热情地招呼客人，为他们倒上一杯温暖的热茶。': {
    en: 'He warmly welcomes guests and pours them a cup of comforting warm tea.',
    pt: 'Ele recebe os clientes calorosamente e serve-lhes uma xícara de chá quente acolhedor.',
  },
  '这杯茶的香味让每个人都感到放松。': {
    en: 'The fragrance of this tea makes everyone feel relaxed.',
    pt: 'O aroma deste chá faz com que todos se sintam relaxados.',
  },
  '窗外的雨渐渐停了，温暖的阳光照进了安静的小院。': {
    en: 'The rain outside gradually stopped, and warm sunlight shone into the quiet courtyard.',
    pt: 'A chuva lá fora parou aos poucos, e a luz quente do sol iluminou o pequeno pátio tranquilo.',
  },
  '客人们坐在窗边，一边喝着香茶，一边欣赏着茶馆里的宁静景色。': {
    en: 'Guests sat by the window, sipping fragrant tea while appreciating the tranquil scenery in the teahouse.',
    pt: 'Os clientes sentaram-se perto da janela, bebericando o chá perfumado enquanto apreciavam a vista serena da casa de chá.',
  },
  '主人微笑着说：“欢迎常来喝茶。”': {
    en: 'The host smiled and said: "You are always welcome to come drink tea."',
    pt: 'O dono sorriu e disse: "Sejam sempre bem-vindos para tomar um chá."',
  },
  '客人们带着温暖的心情离开了茶馆，走进了阳光明媚的小巷。': {
    en: 'With warm feelings, the guests left the teahouse and walked into the sunny alley.',
    pt: 'Com o coração aquecido, os clientes deixaram a casa de chá e seguiram pelo beco ensolarado.',
  },

  // Arabic sentences
  'في قلب الصحراء الذهبية، تقع واحة نخيل هادئة.': {
    en: 'In the heart of the golden desert lies a peaceful palm oasis.',
    pt: 'No coração do deserto dourado, encontra-se um oásis sereno de palmeiras.',
  },
  'ينبع الماء العذب من عين صافية بين الرمال.': {
    en: 'Fresh water springs from a clear source among the sands.',
    pt: 'Água fresca brota de uma fonte límpida entre as areias.',
  },
  'يستريح المسافرون تحت ظلال النخيل بعد رحلة طويلة.': {
    en: 'Travelers rest under the shade of the palms after a long journey.',
    pt: 'Os viajantes descansam sob a sombra das palmeiras após uma longa jornada.',
  },
  'يهب نسيم عليل يلطف حرارة المساء في الواحة.': {
    en: 'A gentle breeze blows, cooling the evening heat in the oasis.',
    pt: 'Uma brisa suave sopra, refrescando o calor da tarde no oásis.',
  },

  // Spanish sentences
  'En un rincón secreto del antiguo pueblo, florece un jardín de caléndulas doradas.': {
    en: 'In a secret corner of the old village, a garden of golden marigolds blooms.',
    pt: 'Em um recanto secreto do antigo vilarejo, floresce um jardim de calêndulas douradas.',
  },
  'El aroma de las flores llena el aire tibio de la tarde.': {
    en: 'The scent of the flowers fills the warm afternoon air.',
    pt: 'O aroma das flores preenche o ar morno da tarde.',
  },
  'Una anciana sabia cuida cada planta con dedicación y alegría.': {
    en: 'A wise old woman tends to each plant with dedication and joy.',
    pt: 'Uma sábia anciã cuida de cada planta com dedicação e alegria.',
  },
  'Los viajeros se detienen para contemplar la belleza serena del jardín.': {
    en: 'Travelers pause to contemplate the serene beauty of the garden.',
    pt: 'Os viajantes param para contemplar a beleza serena do jardim.',
  },

  // French sentences
  'Dans une ruelle pavée de Paris, une petite librairie ancienne ouvre ses portes.': {
    en: 'In a cobblestone alley of Paris, a small ancient bookstore opens its doors.',
    pt: 'Em uma ruela de paralelepípedos de Paris, uma pequena livraria antiga abre suas portas.',
  },
  'La lumière ambrée illumine les étagères remplies de livres précieux.': {
    en: 'The amber light illuminates the shelves filled with precious books.',
    pt: 'A luz âmbar ilumina as prateleiras repletas de livros preciosos.',
  },
  'Le vieux libraire conseille les lecteurs avec passion et bienveillance.': {
    en: 'The old bookseller advises readers with passion and kindness.',
    pt: 'O velho livreiro aconselha os leitores com paixão e generosidade.',
  },
  'L’odeur du papier ancien crée une atmosphère chaleureuse et apaisante.': {
    en: 'The smell of old paper creates a warm and soothing atmosphere.',
    pt: 'O cheiro de papel antigo cria uma atmosfera acolhedora e relaxante.',
  },

  // German sentences
  'In einer engen Gasse steht die Werkstatt eines alten Uhrmachers.': {
    en: 'In a narrow alley stands the workshop of an old watchmaker.',
    pt: 'Em um beco estreito fica a oficina de um velho relojoeiro.',
  },
  'Das sanfte Ticken der Uhren erfüllt den ruhigen Raum mit Harmonie.': {
    en: 'The gentle ticking of clocks fills the quiet room with harmony.',
    pt: 'O suave tique-taque dos relógios preenche a sala tranquila com harmonia.',
  },
  'Der Meister arbeitet konzentriert an einem antiken Uhrwerk aus Messing.': {
    en: 'The master works attentively on an antique brass movement.',
    pt: 'O mestre trabalha concentrado em uma engrenagem antiga de latão.',
  },
  'Goldenes Sonnenlicht fällt durch die Werkstattfenster auf die Werkbank.': {
    en: 'Golden sunlight falls through the workshop windows onto the workbench.',
    pt: 'A luz dourada do sol entra pelas janelas da oficina sobre a bancada de trabalho.',
  },

  // Italian sentences
  'In un vicolo fiorito di Firenze, c’è un piccolo caffè accogliente.': {
    en: 'In a flowered alley of Florence, there is a cozy little cafe.',
    pt: 'Em um beco florido de Florença, há um pequeno café acolhedor.',
  },
  'Il profumo del caffè appena tostato attira i passanti felici.': {
    en: 'The aroma of freshly roasted coffee attracts happy passersby.',
    pt: 'O aroma de café recém-torrado atrai os transeuntes alegres.',
  },
  'Dalla terrazza si ammirano i colori vivaci della città storica.': {
    en: 'From the terrace, one admires the vivid colors of the historic city.',
    pt: 'Da varanda, admiram-se as cores vibrantes da cidade histórica.',
  },
  'La sera cala dolcemente mentre la musica risuona tra le vie.': {
    en: 'Evening falls softly as music echoes through the streets.',
    pt: 'A noite cai suavemente enquanto a música ecoa pelas ruas.',
  },

  // Russian sentences
  'В тихом переулке старого города светится окно уютного кафе.': {
    en: 'In a quiet alley of the old town, the window of a cozy cafe glows.',
    pt: 'Em um beco tranquilo da cidade antiga, brilha a janela de um café acolhedor.',
  },
  'За окном медленно падает мягкий вечерний дождь.': {
    en: 'Outside the window, soft evening rain slowly falls.',
    pt: 'Lá fora, uma chuva suave de fim de tarde cai lentamente.',
  },
  'Горячий чай с травами согревает каждого уставшего путника.': {
    en: 'Hot herbal tea warms every weary traveler.',
    pt: 'O chá de ervas bem quente aquece cada viajante cansado.',
  },
  'Теплая атмосфера наполняет сердце покоем и тишиной.': {
    en: 'The warm atmosphere fills the heart with peace and quiet.',
    pt: 'A atmosfera acolhedora preenche o coração de paz e silêncio.',
  },

  // Korean sentences
  '오래된 골목길 모퉁이에 따뜻한 분위기의 작은 카페가 있습니다.': {
    en: 'At the corner of an old alley, there is a small cafe with a warm atmosphere.',
    pt: 'Na esquina de um beco antigo, há um pequeno café com uma atmosfera acolhedora.',
  },
  '비 내리는 날이면 그윽한 커피 향이 거리에 퍼집니다.': {
    en: 'On rainy days, the rich aroma of coffee spreads through the street.',
    pt: 'Em dias de chuva, o aroma profundo do café espalha-se pela rua.',
  },
  '창가 자리에 앉아 조용히 책을 읽는 손님들이 보입니다.': {
    en: 'You can see guests sitting by the window reading books quietly.',
    pt: 'Veem-se clientes sentados à janela lendo livros em silêncio.',
  },
  '따스한 차 한 잔이 하루의 피로를 부드럽게 녹여줍니다.': {
    en: "A cup of warm tea gently melts away the day's fatigue.",
    pt: 'Uma xícara de chá quente derrete suavemente o cansaço do dia.',
  },

  // Portuguese sentences (learning Portuguese)
  'Num beco tranquilo da cidade histórica, havia um pequeno café acolhedor.': {
    en: 'In a quiet alley of the historic town, there was a cozy little cafe.',
    pt: 'Num beco tranquilo da cidade histórica, havia um pequeno café acolhedor.',
  },
  'O aroma do café fresco espalhava-se pelo beco tranquilo, convidando os transeuntes a entrar no café acolhedor.': {
    en: 'The aroma of fresh coffee spread through the quiet alley, inviting passersby into the cozy cafe.',
    pt: 'O aroma do café fresco espalhava-se pelo beco tranquilo, convidando os transeuntes a entrar no café acolhedor.',
  },
  'Ela saboreou o café quente enquanto admirava a tranquilidade do beco ensolarado.': {
    en: 'She savored the warm coffee while admiring the peacefulness of the sunlit alley.',
    pt: 'Ela saboreou o café quente enquanto admirava a tranquilidade do beco ensolarado.',
  },
  'Com o coração leve, saiu do café acolhedor e continuou sua caminhada pelo beco dourado.': {
    en: 'With a light heart, she left the cozy cafe and continued her walk down the golden alley.',
    pt: 'Com o coração leve, saiu do café acolhedor e continuou sua caminhada pelo beco dourado.',
  },

  // English sentences (learning English)
  'In a sunlit cobblestone alley, a little garden blooms with vibrant golden marigolds.': {
    en: 'In a sunlit cobblestone alley, a little garden blooms with vibrant golden marigolds.',
    pt: 'Em um beco ensolarado de paralelepípedos, um pequeno jardim floresce com calêndulas douradas vibrantes.',
  },
  'The delicate scent of the flowers fills the afternoon air with gentle warmth.': {
    en: 'The delicate scent of the flowers fills the afternoon air with gentle warmth.',
    pt: 'O perfume delicado das flores preenche o ar da tarde com um calor suave.',
  },
  'A friendly gardener tends to the blossoms with patient care and joy.': {
    en: 'A friendly gardener tends to the blossoms with patient care and joy.',
    pt: 'Um jardineiro amigável cuida das flores com paciência e alegria.',
  },
  'Passersby stop to appreciate the tranquil beauty and continue their day with a peaceful smile.': {
    en: 'Passersby stop to appreciate the tranquil beauty and continue their day with a peaceful smile.',
    pt: 'Quem passa para para apreciar a beleza serena e segue o seu dia com um sorriso sereno.',
  },
};

const COMMON_WORD_TRANSLATIONS: Record<string, TextTranslation> = {
  // Japanese words
  '喫茶店': { en: 'cafe / coffee shop', pt: 'cafeteria / café' },
  '静か': { en: 'quiet / peaceful', pt: 'tranquilo / calmo' },
  '路地': { en: 'alley / backstreet', pt: 'beco / ruela' },
  '温かい': { en: 'warm / gentle', pt: 'quente / acolhedor' },
  '珈琲': { en: 'coffee', pt: 'café' },
  '店主': { en: 'shopkeeper / owner', pt: 'dono / proprietário' },
  '笑顔': { en: 'smile', pt: 'sorriso' },
  '風景': { en: 'scenery / landscape', pt: 'paisagem / vista' },

  // Chinese words
  '茶馆': { en: 'teahouse', pt: 'casa de chá' },
  '胡同': { en: 'alley / lane', pt: 'beco / viela' },
  '古老': { en: 'ancient / old', pt: 'antigo / histórico' },
  '安静': { en: 'quiet / peaceful', pt: 'tranquilo / sereno' },
  '温暖': { en: 'warm / cozy', pt: 'quente / acolhedor' },
  '阳光': { en: 'sunlight', pt: 'luz do sol' },
  '香味': { en: 'aroma / scent', pt: 'aroma / perfume' },
  '客人': { en: 'guest / customer', pt: 'cliente / convidado' },
  '龙井茶': { en: 'Longjing tea', pt: 'chá Longjing' },
  '微笑': { en: 'smile', pt: 'sorriso / sorrir' },

  // Spanish words
  'caléndula': { en: 'marigold', pt: 'calêndula' },
  'jardín': { en: 'garden', pt: 'jardim' },
  'aroma': { en: 'aroma / scent', pt: 'aroma / perfume' },
  'antiguo': { en: 'ancient / old', pt: 'antigo' },
  'viajeros': { en: 'travelers', pt: 'viajantes' },

  // French words
  'librairie': { en: 'bookstore', pt: 'livraria' },
  'ambré': { en: 'amber / golden', pt: 'âmbar / dourado' },
  'lumière': { en: 'light', pt: 'luz' },
  'livres': { en: 'books', pt: 'livros' },
  'ruelle': { en: 'alley', pt: 'ruela / beco' },

  // Italian words
  'caffè': { en: 'coffee / cafe', pt: 'café / cafeteria' },
  'vicolo': { en: 'alley', pt: 'beco / viela' },
  'fiori': { en: 'flowers', pt: 'flores' },
  'profumo': { en: 'perfume / scent', pt: 'perfume / aroma' },
  'accogliente': { en: 'cozy / welcoming', pt: 'acolhedor' },

  // German words
  'Werkstatt': { en: 'workshop', pt: 'oficina' },
  'Uhrmacher': { en: 'watchmaker', pt: 'relojoeiro' },
  'Sonnenlicht': { en: 'sunlight', pt: 'luz do sol' },
  'Gasse': { en: 'alley / lane', pt: 'beco / ruela' },
};

/**
 * Localiza a história atual (título, frases, vocabulário e tokens)
 * estritamente de acordo com o idioma selecionado para a interface ('pt' ou 'en').
 */
export function localizeStory(story: Story, uiLanguage: 'en' | 'pt'): Story {
  if (!story) return story;

  const targetLang = uiLanguage === 'pt' ? 'pt' : 'en';

  // 1. Localiza Título
  let localizedTitleTranslation = story.titleTranslation;
  if (TITLE_TRANSLATIONS[story.title]) {
    localizedTitleTranslation = TITLE_TRANSLATIONS[story.title][targetLang];
  }

  // 2. Localiza Parágrafos e Sentenças
  const localizedParagraphs = story.paragraphs.map((para) => ({
    ...para,
    sentences: para.sentences.map((sentence) => {
      let sentenceTranslation = sentence.translation;

      // Busca correspondência exata da frase
      const trimmedText = sentence.text.trim();
      if (SENTENCE_TRANSLATIONS[trimmedText]) {
        sentenceTranslation = SENTENCE_TRANSLATIONS[trimmedText][targetLang];
      }

      // Localiza tokens individuais
      const localizedTokens = (sentence.tokens || []).map((token) => {
        let tokenTrans = token.translation;
        const cleanedToken = token.text.trim();

        if (COMMON_WORD_TRANSLATIONS[cleanedToken]) {
          tokenTrans = COMMON_WORD_TRANSLATIONS[cleanedToken][targetLang];
        }

        return {
          ...token,
          translation: tokenTrans,
        };
      });

      return {
        ...sentence,
        translation: sentenceTranslation,
        tokens: localizedTokens,
      };
    }),
  }));

  // 3. Localiza Vocabulário Alvo do Dicionário
  const localizedVocabulary = (story.targetVocabulary || []).map((entry) => {
    let trans = entry.translation;
    let def = entry.definition;

    const cleanedWord = entry.word.trim();
    if (COMMON_WORD_TRANSLATIONS[cleanedWord]) {
      trans = COMMON_WORD_TRANSLATIONS[cleanedWord][targetLang];
      def = `${trans} (${targetLang === 'pt' ? 'Vocabulário da história' : 'Story vocabulary'})`;
    }

    return {
      ...entry,
      translation: trans,
      definition: def,
    };
  });

  return {
    ...story,
    titleTranslation: localizedTitleTranslation,
    paragraphs: localizedParagraphs,
    targetVocabulary: localizedVocabulary,
  };
}
