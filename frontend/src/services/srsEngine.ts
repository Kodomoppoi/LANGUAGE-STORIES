import { SRSMetrics, SRSStage } from '../types';

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
