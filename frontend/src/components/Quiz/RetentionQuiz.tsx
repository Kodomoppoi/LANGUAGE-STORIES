import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { QuizQuestion, DictionaryEntry, Story } from '../../types';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Award,
  ArrowRight,
  RotateCcw,
  X,
  Volume2,
} from 'lucide-react';
import { resolveLocalizedWordTranslation } from '../../services/storyLocalization';
import { getAuxiliaryTranslation, isInvalidTranslation } from '../../services/auxiliaryLexicon';
import { createDefaultSRSMetrics } from '../../services/srsEngine';

function buildQuizQuestions(
  currentStory: Story,
  vocabularyVault: DictionaryEntry[],
  uiLanguage: 'pt' | 'en'
): QuizQuestion[] {
  if (currentStory.quiz && currentStory.quiz.length > 0) {
    return currentStory.quiz;
  }

  const isEn = uiLanguage === 'en';

  // 1. Obtém vocabulário alvo ou faz fallback inteligente extraindo tokens da própria história
  let targetVocab: DictionaryEntry[] =
    Array.isArray(currentStory.targetVocabulary) && currentStory.targetVocabulary.length > 0
      ? currentStory.targetVocabulary
      : [];

  if (targetVocab.length === 0 && Array.isArray(currentStory.paragraphs)) {
    const seenWords = new Set<string>();
    const extracted: DictionaryEntry[] = [];

    for (const p of currentStory.paragraphs) {
      for (const s of p.sentences || []) {
        for (const tok of s.tokens || []) {
          const wText = (tok.text || '').trim();
          if (
            wText &&
            wText.length >= 1 &&
            !tok.isPunctuation &&
            !/^[.,!?;:'"()\[\]{}—–\s]+$/.test(wText) &&
            !seenWords.has(wText)
          ) {
            seenWords.add(wText);
            const rawMeaning = tok.translation;
            const cleanMeaning =
              (!isInvalidTranslation(rawMeaning, wText) ? rawMeaning : null) ||
              getAuxiliaryTranslation(wText, currentStory.language, isEn ? 'en' : 'pt') ||
              '';

            if (cleanMeaning) {
              extracted.push({
                id: tok.id || `token-${extracted.length}`,
                word: wText,
                ruby: tok.ruby,
                phonetic: tok.ruby,
                translation: cleanMeaning,
                partOfSpeech: tok.partOfSpeech || 'Word',
                definition: cleanMeaning,
                exampleSentence: s.text,
                exampleTranslation: s.translation,
                language: currentStory.language,
                proficiency: currentStory.proficiency,
                masteryScore: tok.masteryScore || 25,
                statusColor: tok.statusColor || 'orange',
                repetitionWeight: 1.0,
                srsMetrics: createDefaultSRSMetrics(),
                createdAt: new Date().toISOString(),
              });
            }
          }
        }
      }
    }
    if (extracted.length > 0) {
      targetVocab = extracted;
    }
  }

  if (targetVocab.length === 0) return [];

  const fallbackDistractors = isEn
    ? [
        'coffee shop',
        'bookstore',
        'train station',
        'friend',
        'journey',
        'hot tea',
        'small',
        'large',
        'happy',
        'eat',
        'drink',
        'learn',
        'read',
        'morning',
        'window',
        'flower',
        'street',
        'quiet',
      ]
    : [
        'cafeteria',
        'livraria',
        'estação de trem',
        'amigo',
        'viagem',
        'chá quente',
        'pequeno',
        'grande',
        'alegre',
        'comer',
        'beber',
        'aprender',
        'ler',
        'manhã',
        'janela',
        'flor',
        'rua',
        'tranquilo',
      ];

  // Pool de distratores sanitizado (sem "Term in context" e no idioma correto da interface)
  const allDistractorPool: string[] = [
    ...targetVocab.map(
      (v) =>
        resolveLocalizedWordTranslation(v.word, v.translation, currentStory.language, isEn ? 'en' : 'pt') ||
        v.translation
    ),
    ...vocabularyVault.map(
      (v) =>
        resolveLocalizedWordTranslation(v.word, v.translation, v.language || currentStory.language, isEn ? 'en' : 'pt') ||
        v.translation
    ),
    ...fallbackDistractors,
  ]
    .filter((val): val is string => Boolean(val && val.trim() && !isInvalidTranslation(val)))
    .filter((val, idx, self) => self.findIndex((s) => s.toLowerCase() === val.toLowerCase()) === idx);

  return targetVocab.slice(0, 6).map((item, idx) => {
    const localizedMeaning = resolveLocalizedWordTranslation(
      item.word,
      item.translation,
      currentStory.language,
      isEn ? 'en' : 'pt'
    );
    const correct =
      (!isInvalidTranslation(localizedMeaning, item.word) ? localizedMeaning : null) ||
      (!isInvalidTranslation(item.translation, item.word) ? item.translation : null) ||
      getAuxiliaryTranslation(item.word, currentStory.language, isEn ? 'en' : 'pt') ||
      (isEn ? 'Target word' : 'Palavra');

    const pool = allDistractorPool.filter(
      (d) => d.toLowerCase() !== correct.toLowerCase()
    );

    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
    const chosenDistractors: string[] = [];
    for (const d of shuffledPool) {
      if (
        !chosenDistractors.some((c) => c.toLowerCase() === d.toLowerCase()) &&
        d.toLowerCase() !== correct.toLowerCase()
      ) {
        chosenDistractors.push(d);
        if (chosenDistractors.length === 3) break;
      }
    }

    if (chosenDistractors.length < 3) {
      for (const fb of fallbackDistractors) {
        if (
          fb.toLowerCase() !== correct.toLowerCase() &&
          !chosenDistractors.some((c) => c.toLowerCase() === fb.toLowerCase())
        ) {
          chosenDistractors.push(fb);
          if (chosenDistractors.length === 3) break;
        }
      }
    }

    const options = [correct, ...chosenDistractors].sort(() => Math.random() - 0.5);

    const promptText = isEn
      ? `What is the meaning of "${item.word}"?`
      : `Qual é o significado de "${item.word}"?`;

    return {
      id: `gen-quiz-${idx + 1}`,
      type: 'mcq' as const,
      prompt: promptText,
      targetWord: item.word,
      ruby: item.ruby,
      options,
      correctAnswer: correct,
      explanation: `${item.word} = ${correct}.`,
      contextSentence: item.exampleSentence,
    };
  });
}

export const RetentionQuiz: React.FC = () => {
  const {
    currentStory,
    isQuizOpen,
    setIsQuizOpen,
    submitQuiz,
    speakSingleToken,
    vocabularyVault,
    settings,
    t,
  } = useApp();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [scoreQuality, setScoreQuality] = useState<number>(4);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  const isEn = settings.uiLanguage === 'en';

  // Congela as perguntas estaticamente quando o modal abre para evitar qualquer rotação/reembaralhamento
  useEffect(() => {
    if (isQuizOpen) {
      const generated = buildQuizQuestions(currentStory, vocabularyVault, isEn ? 'en' : 'pt');
      setQuizQuestions(generated);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setQuizFinished(false);
    }
  }, [isQuizOpen]);

  if (!isQuizOpen) return null;

  const safeQuestionIndex = Math.max(
    0,
    Math.min(currentQuestionIndex, Math.max(0, quizQuestions.length - 1))
  );
  const currentQ = quizQuestions[safeQuestionIndex];
  const isLastQuestion = safeQuestionIndex >= quizQuestions.length - 1;

  const handleSelectOption = (option: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(option);
    setIsAnswerSubmitted(true);
  };

  const handleSM2Rating = (rating: number) => {
    setScoreQuality(rating);
    setIsAnswerSubmitted(true);
    if (isLastQuestion) {
      finishQuiz(rating);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      finishQuiz(scoreQuality);
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    }
  };

  const finishQuiz = (finalQuality: number) => {
    setQuizFinished(true);
    // Celebratory warm terracotta and amber floral confetti
    confetti({
      particleCount: 75,
      spread: 65,
      origin: { y: 0.6 },
      colors: ['#B8531D', '#D46F33', '#FFB703', '#FFD166', '#4ADE80', '#FFFFFF'],
    });

    const targetWordIds = (currentStory.targetVocabulary || []).map((v) => v.id).filter(Boolean);
    const quizWords = quizQuestions.map((q) => q.targetWord).filter(Boolean);
    const allIdentifiers = Array.from(new Set([...targetWordIds, ...quizWords]));
    submitQuiz(finalQuality, allIdentifiers);
  };

  const handleClose = () => {
    setIsQuizOpen(false);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setQuizFinished(false);
    setQuizQuestions([]);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: 560 }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Sparkles size={18} color="var(--flower-500)" />
            <span>{t('quizHeaderTitle')}</span>
          </div>
          <button className="tts-btn-icon" onClick={handleClose}>
            <X size={17} />
          </button>
        </div>

        {quizQuestions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5 }}>
              {isEn
                ? 'No vocabulary found in this story to generate a quiz yet. Generate a new story to test your retention!'
                : 'Nenhum vocabulário encontrado nesta história para gerar o quiz ainda. Gere uma nova história para testar sua retenção!'}
            </p>
            <button className="btn-primary" onClick={handleClose} style={{ alignSelf: 'center', minWidth: 120 }}>
              {isEn ? 'Close' : 'Fechar'}
            </button>
          </div>
        ) : !quizFinished && currentQ ? (
          <div className="quiz-question-box">
            {/* Progress Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="quiz-badge">
                {t('questionPrefix')} {safeQuestionIndex + 1} {t('ofPrefix')} {quizQuestions.length}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {t('quizTargetPrefix')} <strong>{currentQ.targetWord}</strong>
              </span>
            </div>

            {/* Question Prompt */}
            <h3 className="quiz-prompt">{currentQ.prompt}</h3>

            {/* Context sentence preview if available */}
            {currentQ.contextSentence && (
              <div
                style={{
                  fontSize: '0.88rem',
                  fontStyle: 'italic',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-input)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: '3px solid var(--flower-500)',
                }}
              >
                "{currentQ.contextSentence}"
              </div>
            )}

            {/* Type 1 & 2: Multiple Choice & Cloze */}
            {currentQ.options && currentQ.options.length > 0 ? (
              <div className="quiz-options-grid">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = option === currentQ.correctAnswer;
                  let optionClass = '';
                  if (isAnswerSubmitted) {
                    if (isCorrect) optionClass = 'correct';
                    else if (isSelected && !isCorrect) optionClass = 'wrong';
                  }

                  return (
                    <button
                      key={idx}
                      className={`quiz-option-btn ${optionClass}`}
                      onClick={() => handleSelectOption(option)}
                      disabled={isAnswerSubmitted}
                    >
                      <span>{option}</span>
                      {isAnswerSubmitted && isCorrect && (
                        <CheckCircle2 size={17} color="#22c55e" />
                      )}
                      {isAnswerSubmitted && isSelected && !isCorrect && (
                        <XCircle size={17} color="#ef4444" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {/* Type 3: SM-2 Confidence Self Rating */}
            {currentQ.type === 'confidence-rating' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {t('quizRecallQuestion')}
                </p>
                <div className="sm2-rating-grid">
                  <div
                    className="sm2-rate-btn"
                    onClick={() => handleSM2Rating(1)}
                  >
                    <span className="rate-num" style={{ color: '#ef4444' }}>1</span>
                    <span className="rate-label">{t('quizSm2Blackout')}</span>
                  </div>
                  <div
                    className="sm2-rate-btn"
                    onClick={() => handleSM2Rating(3)}
                  >
                    <span className="rate-num" style={{ color: '#ff7b60' }}>3</span>
                    <span className="rate-label">{t('quizSm2Hard')}</span>
                  </div>
                  <div
                    className="sm2-rate-btn"
                    onClick={() => handleSM2Rating(4)}
                  >
                    <span className="rate-num" style={{ color: '#ffb703' }}>4</span>
                    <span className="rate-label">{t('quizSm2Good')}</span>
                  </div>
                  <div
                    className="sm2-rate-btn"
                    onClick={() => handleSM2Rating(5)}
                  >
                    <span className="rate-num" style={{ color: '#22c55e' }}>5</span>
                    <span className="rate-label">{t('quizSm2Instant')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Explanation box after submission */}
            {isAnswerSubmitted && (
              <div
                style={{
                  background: 'var(--bg-input)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.84rem',
                  lineHeight: 1.4,
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                <strong style={{ color: 'var(--flower-500)' }}>{t('quizExplanation')} </strong>
                {currentQ.explanation}
              </div>
            )}

            {/* Next button */}
            {isAnswerSubmitted && (
              <button
                className="btn-primary"
                style={{ marginTop: '6px' }}
                onClick={handleNext}
              >
                <span>{isLastQuestion ? t('quizCompleteBtn') : t('nextQuestion')}</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        ) : (
          /* Finished Screen */
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '14px', padding: '14px 0' }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, var(--flower-400), var(--peach-500))',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                boxShadow: '0 6px 20px rgba(255, 101, 132, 0.35)',
              }}
            >
              <Award size={28} />
            </div>

            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 800 }}>
              {t('quizCompleteCelebrationTitle')}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              {t('quizCompleteCelebrationDesc')}
            </p>

            <button
              className="btn-primary"
              style={{ marginTop: '12px' }}
              onClick={handleClose}
            >
              {t('quizReturnBtn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
