import { StoryToken, DictionaryEntry, LanguageCode } from '../types';
import { getAuxiliaryTranslation, getAuxiliaryPOS, isInvalidTranslation } from './auxiliaryLexicon';
import { getAuxiliaryRuby } from './auxiliaryPhonetics';

/**
 * Verifica com segurança se um texto consiste apenas de pontuação, símbolos ou espaços.
 */
export function isPunctuationToken(text: string): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (!trimmed) return true;
  return /^[\p{P}\p{S}\s]+$/u.test(trimmed);
}

/**
 * Verifica se um texto contém qualquer caractere de pontuação ou símbolo.
 */
export function containsPunctuation(text: string): boolean {
  if (!text) return false;
  return /[\p{P}\p{S}]/u.test(text);
}

/**
 * Mapeia o código de idioma para a localidade correspondente usada pelo Intl.Segmenter.
 */
export function getLocaleForLanguage(language: string): string {
  const code = (language || '').toLowerCase().trim();
  switch (code) {
    case 'zh':
      return 'zh-CN';
    case 'ja':
      return 'ja-JP';
    case 'ko':
      return 'ko-KR';
    case 'es':
      return 'es-ES';
    case 'de':
      return 'de-DE';
    case 'fr':
      return 'fr-FR';
    case 'it':
      return 'it-IT';
    case 'en':
      return 'en-US';
    default:
      return code || 'en-US';
  }
}

export interface SegmentSentenceParams {
  sentenceText: string;
  language: string;
  targetVocabulary?: DictionaryEntry[];
  uiLang?: 'pt' | 'en';
  idPrefix?: string;
  rawTokensHint?: Array<{
    text: string;
    ruby?: string;
    translation?: string;
    partOfSpeech?: string;
    isTargetWord?: boolean;
  }>;
}

interface IntervalMatch {
  start: number;
  end: number;
  text: string;
  targetEntry?: DictionaryEntry;
}

/**
 * Segmenta uma frase em StoryTokens precisos utilizando Intl.Segmenter com suporte nativo
 * para Mandarim (zh) e Japonês (ja).
 * Preserva termos compostos do vocabulário alvo da lição como tokens únicos
 * e identifica símbolos e pontuações como tokens estáticos (isPunctuation = true).
 */
export function segmentSentenceIntoTokens(params: SegmentSentenceParams): StoryToken[] {
  const {
    sentenceText,
    language,
    targetVocabulary = [],
    uiLang = 'pt',
    idPrefix = 't-0-0',
    rawTokensHint = [],
  } = params;

  if (!sentenceText || sentenceText.trim().length === 0) {
    return [];
  }

  const locale = getLocaleForLanguage(language);
  let tokenIndex = 1;
  const result: StoryToken[] = [];

  // 1. Priorização do Vocabulário Alvo: Localiza termos alvo (do mais longo para o mais curto)
  const sortedVocab = [...targetVocabulary]
    .filter((v) => v?.word && v.word.trim().length > 0)
    .sort((a, b) => b.word.trim().length - a.word.trim().length);

  const intervals: IntervalMatch[] = [];

  for (const entry of sortedVocab) {
    const word = entry.word.trim();
    let pos = 0;
    while ((pos = sentenceText.indexOf(word, pos)) !== -1) {
      const end = pos + word.length;
      const overlaps = intervals.some(
        (inv) => pos < inv.end && end > inv.start
      );
      if (!overlaps) {
        intervals.push({
          start: pos,
          end,
          text: word,
          targetEntry: entry,
        });
      }
      pos = end;
    }
  }

interface SegmentData {
  segment: string;
  index: number;
  input: string;
  isWordLike?: boolean;
}

interface SegmenterInstance {
  segment(input: string): Iterable<SegmentData>;
}

  // Ordena os intervalos cronologicamente pela posição inicial na frase
  intervals.sort((a, b) => a.start - b.start);

  // Inicializa o segmentador nativo se disponível
  let segmenter: SegmenterInstance | null = null;
  const intlAny = Intl as any;
  if (typeof intlAny !== 'undefined' && typeof intlAny.Segmenter === 'function') {
    try {
      segmenter = new intlAny.Segmenter(locale, { granularity: 'word' });
    } catch {
      segmenter = null;
    }
  }

  const helperProcessWord = (
    text: string,
    isPunct: boolean,
    targetEntry?: DictionaryEntry
  ): StoryToken => {
    const tokenId = `${idPrefix}-${tokenIndex++}`;
    const cleanText = text;

    if (isPunct || isPunctuationToken(cleanText)) {
      return {
        id: tokenId,
        text: cleanText,
        isPunctuation: true,
      };
    }

    // Se for palavra do vocabulário alvo da lição
    if (targetEntry) {
      const targetRuby = targetEntry.ruby || getAuxiliaryRuby(cleanText, language as LanguageCode);
      return {
        id: tokenId,
        text: cleanText,
        ruby: targetRuby,
        translation: targetEntry.translation,
        partOfSpeech: targetEntry.partOfSpeech || getAuxiliaryPOS(cleanText, language),
        isTargetWord: true,
        isPunctuation: false,
      };
    }

    // Verifica se coincide com alguma palavra do vocabulário alvo mesmo não capturada no intervalo
    const matchedVocab = targetVocabulary.find((v) => v.word.trim() === cleanText);
    if (matchedVocab) {
      const vRuby = matchedVocab.ruby || getAuxiliaryRuby(cleanText, language as LanguageCode);
      return {
        id: tokenId,
        text: cleanText,
        ruby: vRuby,
        translation: matchedVocab.translation,
        partOfSpeech: matchedVocab.partOfSpeech || getAuxiliaryPOS(cleanText, language),
        isTargetWord: true,
        isPunctuation: false,
      };
    }

    // Tenta obter do rawTokensHint se o LLM tiver fornecido tradução válida e sem pontuação
    const hint = rawTokensHint.find(
      (h) => h.text.trim() === cleanText && !isInvalidTranslation(h.translation, cleanText)
    );

    const hintRuby = hint?.ruby && !isPunctuationToken(hint.ruby) ? hint.ruby : undefined;
    const resolvedRuby = hintRuby || getAuxiliaryRuby(cleanText, language as LanguageCode);

    const safeHintTrans = hint?.translation && !isInvalidTranslation(hint.translation, cleanText)
      ? hint.translation
      : undefined;

    const resolvedTrans = safeHintTrans
      || getAuxiliaryTranslation(cleanText, language, uiLang)
      || (uiLang === 'en' ? 'Term in context' : 'Vocábulo no contexto');

    const resolvedPos = hint?.partOfSpeech || getAuxiliaryPOS(cleanText, language);

    return {
      id: tokenId,
      text: cleanText,
      ruby: resolvedRuby,
      translation: resolvedTrans,
      partOfSpeech: resolvedPos,
      isTargetWord: false,
      isPunctuation: false,
    };
  };

  const processGap = (gapText: string) => {
    if (!gapText) return;

    if (segmenter) {
      for (const seg of segmenter.segment(gapText)) {
        const segText = seg.segment;
        if (!segText) continue;
        const isPunct = !seg.isWordLike || isPunctuationToken(segText);
        result.push(helperProcessWord(segText, isPunct));
      }
    } else {
      // Fallback simples caso Intl.Segmenter não esteja disponível no ambiente
      const isCJK = language === 'zh' || language === 'ja';
      if (isCJK) {
        for (const ch of Array.from(gapText)) {
          const isPunct = isPunctuationToken(ch);
          result.push(helperProcessWord(ch, isPunct));
        }
      } else {
        const parts = gapText.split(/(\s+|[.,!?;:()"]+)/).filter(Boolean);
        for (const p of parts) {
          const isPunct = isPunctuationToken(p);
          result.push(helperProcessWord(p, isPunct));
        }
      }
    }
  };

  let currentIndex = 0;
  for (const inv of intervals) {
    if (currentIndex < inv.start) {
      processGap(sentenceText.slice(currentIndex, inv.start));
    }
    result.push(helperProcessWord(inv.text, false, inv.targetEntry));
    currentIndex = inv.end;
  }

  if (currentIndex < sentenceText.length) {
    processGap(sentenceText.slice(currentIndex));
  }

  return result;
}

/**
 * Sanitiza e desmembra tokens vindos de provedores de IA (Gemini, OpenRouter, Backend).
 * Se um token da IA estiver colado com pontuação (ex: "下午，小明和"), ele é desmembrado
 * nos tokens individuais corretos sem perder nenhum caractere.
 */
export function sanitizeOrUnpackTokens(
  rawTokens: any[],
  sentenceText: string,
  language: string,
  targetVocabulary: DictionaryEntry[],
  uiLang: 'pt' | 'en' = 'pt',
  idPrefix: string = 't-0-0'
): StoryToken[] {
  // Se não houver tokens brutos ou estiverem vazios, faz segmentação direta da frase
  if (!Array.isArray(rawTokens) || rawTokens.length === 0) {
    return segmentSentenceIntoTokens({
      sentenceText,
      language,
      targetVocabulary,
      uiLang,
      idPrefix,
    });
  }

  // Normaliza lista de rawTokens para extrair texto, ruby e tradução
  const parsedRaw = rawTokens.map((t) => {
    if (Array.isArray(t)) {
      return {
        text: String(t[0] || '').trim(),
        ruby: t[1] ? String(t[1]).trim() : undefined,
        translation: t[2] ? String(t[2]).trim() : undefined,
      };
    } else if (typeof t === 'object' && t !== null) {
      return {
        text: String(t.text || t.word || '').trim(),
        ruby: t.ruby || t.phonetic || t.pinyin,
        translation: t.translation || t.meaning,
        partOfSpeech: t.partOfSpeech,
      };
    }
    return {
      text: String(t || '').trim(),
      ruby: undefined,
      translation: undefined,
    };
  });

  // Detecta se há tokens colados com pontuação (ex: "下午，小明和")
  const hasClumpedTokens = parsedRaw.some((item) => {
    if (!item.text) return false;
    // Se contém pontuação mas não é APENAS pontuação
    return containsPunctuation(item.text) && !isPunctuationToken(item.text);
  });

  // Se houver tokens colados com pontuação, resegmenta com Intl.Segmenter usando os rawTokens como guia
  if (hasClumpedTokens) {
    return segmentSentenceIntoTokens({
      sentenceText,
      language,
      targetVocabulary,
      uiLang,
      idPrefix,
      rawTokensHint: parsedRaw,
    });
  }

  // Caso contrário, processa os tokens individuais garantindo marcação de pontuação
  let tokenIdx = 1;
  return parsedRaw
    .filter((item) => item.text && item.text.length > 0)
    .map((item) => {
      const isPunct = isPunctuationToken(item.text);
      if (isPunct) {
        return {
          id: `${idPrefix}-${tokenIdx++}`,
          text: item.text,
          isPunctuation: true,
        };
      }

      const matchedVocab = targetVocabulary.find((v) => v.word.trim() === item.text);
      const isInvalid = isInvalidTranslation(item.translation, item.text);
      const safeMatchedTrans =
        matchedVocab && !isInvalidTranslation(matchedVocab.translation, item.text)
          ? matchedVocab.translation
          : null;

      const tokenTrans =
        (!isInvalid ? item.translation : null) ||
        safeMatchedTrans ||
        getAuxiliaryTranslation(item.text, language, uiLang) ||
        (uiLang === 'en' ? 'Term in context' : 'Vocábulo no contexto');

      const resolvedRuby =
        item.ruby ||
        matchedVocab?.ruby ||
        getAuxiliaryRuby(item.text, language as LanguageCode);

      return {
        id: `${idPrefix}-${tokenIdx++}`,
        text: item.text,
        ruby: resolvedRuby,
        translation: tokenTrans,
        partOfSpeech: matchedVocab?.partOfSpeech || item.partOfSpeech || getAuxiliaryPOS(item.text, language),
        isTargetWord: Boolean(matchedVocab),
        isPunctuation: false,
      };
    });
}
