import { LanguageCode, ProficiencyLevel } from '../types';

export interface ProficiencyInfo {
  level: ProficiencyLevel;
  shortLabel: string;
  badgeLabel: string;
  fullLabel: string;
  nativeScaleName: string;
  description: string;
  color: string;
}

export const PROFICIENCY_LEVELS: ProficiencyLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

export function getProficiencyNativeInfo(
  lang: LanguageCode,
  level: ProficiencyLevel,
  uiLanguage: 'pt' | 'en' = 'pt'
): ProficiencyInfo {
  const isEn = uiLanguage === 'en';

  const descriptions: Record<ProficiencyLevel, string> = isEn
    ? {
        A1: 'Essential daily vocabulary and short everyday phrases.',
        A2: 'Simple dialogues, shopping, directions and familiar routines.',
        B1: 'Connected narratives, multiple tenses and personal opinions.',
        B2: 'More complex texts, abstract ideas and nuances of language.',
        C1: 'Fluent immersion, rich grammatical structures and literary style.',
      }
    : {
        A1: 'Vocabulário essencial e frases curtas do dia a dia.',
        A2: 'Diálogos simples, compras, direções e rotinas familiares.',
        B1: 'Narrativas conectadas, múltiplos tempos verbais e opiniões.',
        B2: 'Textos mais complexos, ideias abstratas e nuances de linguagem.',
        C1: 'Imersão fluente, estruturas gramaticais ricas e estilo literário.',
      };

  const colors: Record<ProficiencyLevel, string> = {
    A1: '#10b981', // Emerald
    A2: '#3b82f6', // Blue
    B1: '#f59e0b', // Amber
    B2: '#ea580c', // Orange/Terracotta
    C1: '#8b5cf6', // Violet
  };

  if (lang === 'zh') {
    const zhMap: Record<ProficiencyLevel, { short: string; badge: string; full: string }> = isEn
      ? {
          A1: { short: 'HSK 1', badge: 'HSK 1 (A1)', full: 'HSK 1 • A1 (Beginner)' },
          A2: { short: 'HSK 2', badge: 'HSK 2 (A2)', full: 'HSK 2 • A2 (Elementary)' },
          B1: { short: 'HSK 3', badge: 'HSK 3 (B1)', full: 'HSK 3 • B1 (Intermediate)' },
          B2: { short: 'HSK 4', badge: 'HSK 4 (B2)', full: 'HSK 4 • B2 (Advanced)' },
          C1: { short: 'HSK 5', badge: 'HSK 5 (C1)', full: 'HSK 5 • C1 (Proficient)' },
        }
      : {
          A1: { short: 'HSK 1', badge: 'HSK 1 (A1)', full: 'HSK 1 • A1 (Iniciante)' },
          A2: { short: 'HSK 2', badge: 'HSK 2 (A2)', full: 'HSK 2 • A2 (Básico)' },
          B1: { short: 'HSK 3', badge: 'HSK 3 (B1)', full: 'HSK 3 • B1 (Intermediário)' },
          B2: { short: 'HSK 4', badge: 'HSK 4 (B2)', full: 'HSK 4 • B2 (Avançado)' },
          C1: { short: 'HSK 5', badge: 'HSK 5 (C1)', full: 'HSK 5 • C1 (Proficiente)' },
        };
    const info = zhMap[level] || zhMap['A2'];
    return {
      level,
      shortLabel: info.short,
      badgeLabel: info.badge,
      fullLabel: info.full,
      nativeScaleName: 'HSK',
      description: descriptions[level],
      color: colors[level],
    };
  }

  if (lang === 'ja') {
    const jaMap: Record<ProficiencyLevel, { short: string; badge: string; full: string }> = isEn
      ? {
          A1: { short: 'JLPT N5', badge: 'N5 (A1)', full: 'JLPT N5 • A1 (Beginner)' },
          A2: { short: 'JLPT N4', badge: 'N4 (A2)', full: 'JLPT N4 • A2 (Elementary)' },
          B1: { short: 'JLPT N3', badge: 'N3 (B1)', full: 'JLPT N3 • B1 (Intermediate)' },
          B2: { short: 'JLPT N2', badge: 'N2 (B2)', full: 'JLPT N2 • B2 (Advanced)' },
          C1: { short: 'JLPT N1', badge: 'N1 (C1)', full: 'JLPT N1 • C1 (Proficient)' },
        }
      : {
          A1: { short: 'JLPT N5', badge: 'N5 (A1)', full: 'JLPT N5 • A1 (Iniciante)' },
          A2: { short: 'JLPT N4', badge: 'N4 (A2)', full: 'JLPT N4 • A2 (Básico)' },
          B1: { short: 'JLPT N3', badge: 'N3 (B1)', full: 'JLPT N3 • B1 (Intermediário)' },
          B2: { short: 'JLPT N2', badge: 'N2 (B2)', full: 'JLPT N2 • B2 (Avançado)' },
          C1: { short: 'JLPT N1', badge: 'N1 (C1)', full: 'JLPT N1 • C1 (Proficiente)' },
        };
    const info = jaMap[level] || jaMap['A2'];
    return {
      level,
      shortLabel: info.short,
      badgeLabel: info.badge,
      fullLabel: info.full,
      nativeScaleName: 'JLPT',
      description: descriptions[level],
      color: colors[level],
    };
  }

  // European / CEFR Languages
  const cefrMap: Record<ProficiencyLevel, { short: string; badge: string; full: string }> = isEn
    ? {
        A1: { short: 'A1', badge: 'A1 (Beginner)', full: 'A1 • Beginner' },
        A2: { short: 'A2', badge: 'A2 (Elementary)', full: 'A2 • Elementary' },
        B1: { short: 'B1', badge: 'B1 (Intermediate)', full: 'B1 • Intermediate' },
        B2: { short: 'B2', badge: 'B2 (Advanced)', full: 'B2 • Advanced' },
        C1: { short: 'C1', badge: 'C1 (Fluent)', full: 'C1 • Fluent / Literary' },
      }
    : {
        A1: { short: 'A1', badge: 'A1 (Iniciante)', full: 'A1 • Iniciante' },
        A2: { short: 'A2', badge: 'A2 (Básico)', full: 'A2 • Básico' },
        B1: { short: 'B1', badge: 'B1 (Intermediário)', full: 'B1 • Intermediário' },
        B2: { short: 'B2', badge: 'B2 (Avançado)', full: 'B2 • Avançado' },
        C1: { short: 'C1', badge: 'C1 (Fluente)', full: 'C1 • Fluente / Literário' },
      };
  const info = cefrMap[level] || cefrMap['A2'];
  return {
    level,
    shortLabel: info.short,
    badgeLabel: info.badge,
    fullLabel: info.full,
    nativeScaleName: 'CEFR',
    description: descriptions[level],
    color: colors[level],
  };
}

export function getProficiencyOptions(
  lang: LanguageCode,
  uiLanguage: 'pt' | 'en' = 'pt'
): ProficiencyInfo[] {
  return PROFICIENCY_LEVELS.map((level) => getProficiencyNativeInfo(lang, level, uiLanguage));
}
