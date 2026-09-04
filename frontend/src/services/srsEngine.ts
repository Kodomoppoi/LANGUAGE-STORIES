import { SRSMetrics, SRSStage, SRSStatusColor, DictionaryEntry } from '../types';

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm Implementation
 * Quality scale:
 * 5: Perfect recall without hesitation
 * 4: Correct recall after a moment of thought
 * 3: Correct recall with serious difficulty
 * 2: Incorrect response; but upon seeing the answer it felt familiar
 * 1: Incorrect response; remembered nothing
 * 0: Complete blackout
 */
export function calculateSM2(
  currentMetrics: SRSMetrics,
  quality: number // 0 to 5
): SRSMetrics {
  const q = Math.max(0, Math.min(5, quality));
  let { repetition, interval, easeFactor, totalReviews, correctReviews } = currentMetrics;

  totalReviews += 1;

  if (q >= 3) {
    correctReviews += 1;
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
  } else {
    // Failed recall: reset repetition chain
    repetition = 0;
    interval = 1;
  }

  // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  // Determine stage
  let stage: SRSStage = 'new';
  if (repetition === 0) {
    stage = 'new';
  } else if (repetition === 1 || repetition === 2) {
    stage = 'learning';
  } else if (repetition === 3 || repetition === 4 || interval < 21) {
    stage = 'review';
  } else {
    stage = 'mastered';
  }

  // Calculate next review due date
  const now = new Date();
  const nextDueDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  return {
    repetition,
    interval,
    easeFactor: Number(easeFactor.toFixed(2)),
    nextReviewDate: nextDueDate.toISOString(),
    lastReviewedDate: now.toISOString(),
    stage,
    totalReviews,
    correctReviews,
  };
}

export function createDefaultSRSMetrics(): SRSMetrics {
  return {
    repetition: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: new Date().toISOString(),
    stage: 'new',
    totalReviews: 0,
    correctReviews: 0,
  };
}

export function isReviewDue(nextReviewDate: string): boolean {
  return new Date(nextReviewDate) <= new Date();
}

// ---------------------------------------------------------------------------
// Algoritmo da Curva do Esquecimento (SRS), Pontuação Contínua, Cores e Pesos
// ---------------------------------------------------------------------------

/**
 * 4.2. Mapeamento Visual de Cores:
 * - 0% a 35% (Crítico / Pouco Sabida): Cor Laranja Forte / Âmbar Escuro -> Peso de repetição máximo (3 a 4x)
 * - 36% a 70% (Em Aprendizado / Transição): Cor Amarelo / Âmbar Claro -> Peso de repetição moderado (2x)
 * - 71% a 100% (Dominada / Sabida): Cor Verde -> Peso de repetição baixo (aparição esporádica)
 */
export function getStatusColor(score: number): SRSStatusColor {
  if (score <= 35) return 'orange';
  if (score <= 70) return 'yellow';
  return 'green';
}

/**
 * Peso de repetição para a seleção e geração de histórias:
 * - Palavras fixadas (⭐): prioridade máxima (4)
 * - Palavras frágeis (laranja): peso alto (3 a 4)
 * - Palavras em transição (amarelo): peso moderado (2)
 * - Palavras dominadas (verde): checagem esporádica (1)
 */
export function getRepetitionWeight(score: number, isPinned?: boolean): number {
  if (isPinned) return 4;
  if (score <= 35) return 4;
  if (score <= 70) return 2;
  return 1;
}

/**
 * 4.1. Cálculo da Pontuação de Saber (mastery_score):
 * Score = f(Acertos no Quiz, Consultas no Leitor, Decaimento Temporal de Ebbinghaus)
 * Retorna uma pontuação contínua de 0% a 100%.
 */
export function calculateMasteryScore(
  metrics: SRSMetrics,
  lookedUpCount: number = 0,
  lastSeenDate?: string
): number {
  let score = 20; // Pontuação base inicial

  if (metrics.totalReviews > 0) {
    const accuracy = metrics.correctReviews / metrics.totalReviews;
    // Até 50 pontos por precisão em revisões/quiz
    score += accuracy * 50;
    // Até 30 pontos pela cadeia de repetição e intervalo SM-2
    score += Math.min(30, metrics.repetition * 10);
  }

  // Penalidade por consultas no leitor:
  // Se o usuário clica na palavra durante a leitura para ver a tradução,
  // penaliza a pontuação recente e sinaliza necessidade de reforço.
  const lookupPenalty = Math.min(35, lookedUpCount * 8);
  score -= lookupPenalty;

  // Decaimento temporal de Ebbinghaus:
  // Conforme os dias passam sem contato com a palavra, a retenção teórica decai suavemente.
  if (lastSeenDate) {
    const daysSince = Math.max(0, (Date.now() - new Date(lastSeenDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 1) {
      // Decaimento exponencial suave (meia-vida aproximada de 10 dias)
      const decayFactor = Math.exp(-0.06 * (daysSince - 1));
      score = score * Math.max(0.3, decayFactor);
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Registra consulta no leitor para uma entrada de vocabulário,
 * aplicando penalidade imediata na pontuação de saber e atualizando cor e peso.
 */
export function recordWordLookup(entry: DictionaryEntry): DictionaryEntry {
  const lookedUpCount = (entry.lookedUpCount || 0) + 1;
  const masteryScore = calculateMasteryScore(entry.srsMetrics, lookedUpCount, entry.lastSeenDate);
  const statusColor = getStatusColor(masteryScore);
  const repetitionWeight = getRepetitionWeight(masteryScore, entry.isStarred || entry.isPinned);

  return {
    ...entry,
    lookedUpCount,
    masteryScore,
    statusColor,
    repetitionWeight,
    lastSeenDate: new Date().toISOString(),
  };
}

/**
 * Atualiza vocabulário pós-quiz com novo score contínuo, cor e peso.
 */
export function recordWordQuizReview(entry: DictionaryEntry, quality: number): DictionaryEntry {
  const updatedMetrics = calculateSM2(entry.srsMetrics, quality);
  // Reduz progressivamente o peso de penalidades anteriores se acertar com qualidade >= 4
  const lookedUpCount = quality >= 4 ? Math.max(0, (entry.lookedUpCount || 0) - 1) : (entry.lookedUpCount || 0);
  const masteryScore = calculateMasteryScore(updatedMetrics, lookedUpCount, new Date().toISOString());
  const statusColor = getStatusColor(masteryScore);
  const repetitionWeight = getRepetitionWeight(masteryScore, entry.isStarred || entry.isPinned);

  return {
    ...entry,
    srsMetrics: updatedMetrics,
    lookedUpCount,
    masteryScore,
    statusColor,
    repetitionWeight,
    lastSeenDate: new Date().toISOString(),
  };
}

