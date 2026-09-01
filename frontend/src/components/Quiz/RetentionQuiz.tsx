import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
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

export const RetentionQuiz: React.FC = () => {
  const {
    currentStory,
    isQuizOpen,
    setIsQuizOpen,
    submitQuiz,
    speakSingleToken,
  } = useApp();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [scoreQuality, setScoreQuality] = useState<number>(4);

  if (!isQuizOpen || !currentStory.quiz?.length) return null;

  const currentQ = currentStory.quiz[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === currentStory.quiz.length - 1;

  const handleSelectOption = (option: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(option);
    setIsAnswerSubmitted(true);
  };

  const handleSM2Rating = (rating: number) => {
    setScoreQuality(rating);
    finishQuiz(rating);
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

    const targetWordIds = currentStory.targetVocabulary.map((v) => v.id);
    submitQuiz(finalQuality, targetWordIds);
  };

  const handleClose = () => {
    setIsQuizOpen(false);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setQuizFinished(false);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: 560 }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Sparkles size={18} color="var(--flower-500)" />
            <span>Story Retention & SRS Calibration</span>
          </div>
          <button className="tts-btn-icon" onClick={handleClose}>
            <X size={17} />
          </button>
        </div>

        {!quizFinished ? (
          <div className="quiz-question-box">
            {/* Progress Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="quiz-badge">
                Question {currentQuestionIndex + 1} of {currentStory.quiz.length}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Target: <strong>{currentQ.targetWord}</strong>
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
                  How easily did you recall this target vocabulary during the narrative?
                </p>
                <div className="sm2-rating-grid">
                  <div
                    className="sm2-rate-btn"
                    onClick={() => handleSM2Rating(1)}
                  >
                    <span className="rate-num" style={{ color: '#ef4444' }}>1</span>
                    <span className="rate-label">Blackout</span>
                  </div>
                  <div
                    className="sm2-rate-btn"
                    onClick={() => handleSM2Rating(3)}
                  >
                    <span className="rate-num" style={{ color: '#ff7b60' }}>3</span>
                    <span className="rate-label">Hard</span>
                  </div>
                  <div
                    className="sm2-rate-btn"
                    onClick={() => handleSM2Rating(4)}
                  >
                    <span className="rate-num" style={{ color: '#ffb703' }}>4</span>
                    <span className="rate-label">Good</span>
                  </div>
                  <div
                    className="sm2-rate-btn"
                    onClick={() => handleSM2Rating(5)}
                  >
                    <span className="rate-num" style={{ color: '#22c55e' }}>5</span>
                    <span className="rate-label">Instant</span>
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
                <strong style={{ color: 'var(--flower-500)' }}>Explanation: </strong>
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
                <span>{isLastQuestion ? 'Complete Quiz & Update SRS Curve' : 'Next Question'}</span>
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
              Retention Mini-Quiz Complete! 🌸
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Memory curves for these words have been updated and will be intelligently scheduled into your next story generations.
            </p>

            <button
              className="btn-primary"
              style={{ marginTop: '12px' }}
              onClick={handleClose}
            >
              Return to Story & Dictionary
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
