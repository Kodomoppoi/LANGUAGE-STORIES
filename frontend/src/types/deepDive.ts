export interface CharacterAnatomyItem {
  char: string;
  radical?: string;
  components?: string;
  meaning: string;
}

export interface SharedWordItem {
  word: string;
  pinyin?: string;
  ruby?: string;
  meaning: string;
}

export interface PhoneticsHomophones {
  pinyin_tone_tip?: string;
  tip?: string;
  homophones?: string[];
}

export interface SynonymItem {
  synonym: string;
  difference: string;
}

export interface CommonCollocationItem {
  phrase: string;
  meaning: string;
}

export interface WordDeepDiveData {
  word: string;
  ruby?: string;
  pinyin?: string;
  level?: string;
  hsk_level?: string;
  part_of_speech?: string;
  context_meaning?: string;
  // CJK specific
  character_anatomy?: CharacterAnatomyItem[];
  shared_characters?: SharedWordItem[];
  phonetics_homophones?: PhoneticsHomophones;
  // Alphabetical specific
  etymology_roots?: string;
  common_collocations?: CommonCollocationItem[];
  false_friends_or_homophones?: string;
  // Shared
  synonyms_and_nuances?: SynonymItem[];
}
