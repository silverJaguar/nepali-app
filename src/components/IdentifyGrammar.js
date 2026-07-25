import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiVolume2, FiCheck, FiX, FiHelpCircle } from 'react-icons/fi';
import { useVoiceManager } from '../hooks/useVoiceManager';
import { getSettings } from '../utils/settings';
import MinimalButton from './MinimalButton';
import { getAvailableVocabulary, getTemplatesForUnit } from '../utils/grammarVocabulary';
import { generateIdentifyExercises } from '../utils/identifyGenerator';

// Identify: phased by unit — only ask what the grammar has already revealed.
// Full plan: see docs/IDENTIFY_PHASED_ROLLOUT.md. Unit 4+ uses dynamic generation + content filter.

const getInstructionForUnit = (unitId) => {
  if (Number(unitId) === 4) return 'What kind of question is this?';
  if (Number(unitId) === 5) return 'Is this about one or many?';
  return 'What type of sentence is this?';
};

const IdentifyGrammar = ({ unitId, onComplete, onBack }) => {
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showTransliteration, setShowTransliteration] = useState(() => getSettings().showTransliteration);
  const { speakText } = useVoiceManager();

  useEffect(() => {
    try {
      const vocabulary = getAvailableVocabulary(unitId);
      const templates = getTemplatesForUnit(unitId);
      if (vocabulary.length === 0 || templates.length === 0) {
        setExercises([]);
        return;
      }
      const generated = generateIdentifyExercises(unitId, vocabulary, templates, 7);
      setExercises(generated || []);
    } catch (err) {
      console.error('[IdentifyGrammar] Failed to generate exercises:', err);
      setExercises([]);
    }
  }, [unitId]);

  useEffect(() => {
    const onSettingsChange = () => setShowTransliteration(getSettings().showTransliteration);
    window.addEventListener('settingsChanged', onSettingsChange);
    window.addEventListener('storage', onSettingsChange);
    return () => {
      window.removeEventListener('settingsChanged', onSettingsChange);
      window.removeEventListener('storage', onSettingsChange);
    };
  }, []);

  if (exercises.length === 0) {
    return (
      <div className="identify-container" style={{ padding: '2em', textAlign: 'center' }}>
        <MinimalButton onClick={onBack} aria-label="Back">
          <FiArrowLeft size={24} />
        </MinimalButton>
        <div className="identify-loading" style={{ marginTop: '2em' }}>
          <p>Generating exercises...</p>
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5em' }}>
            If this persists, there may not be enough vocabulary or templates for this unit.
          </p>
        </div>
      </div>
    );
  }

  const currentExercise = exercises[currentIndex];

  const handleSelect = (optionId) => {
    if (showResult) return;
    setSelectedAnswer(optionId);
  };

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    setShowResult(true);
    if (selectedAnswer === currentExercise.correctAnswer) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowHint(false);
    } else {
      setIsComplete(true);
    }
  };

  const calculateStars = () => {
    const percentage = (correctCount / exercises.length) * 100;
    if (percentage >= 80) return 3;
    if (percentage >= 60) return 2;
    if (percentage >= 40) return 1;
    return 0;
  };

  if (isComplete) {
    const stars = calculateStars();
    const passed = stars >= 1;

    return (
      <div className="identify-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '2em' }}>
        <div
          className="identify-complete"
          style={{
            textAlign: 'center',
            padding: '1.5em',
            background: '#fff8fa',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(219, 112, 147, 0.15)',
            maxWidth: '500px',
            margin: '0 auto',
            opacity: 1,
            display: 'block',
          }}
        >
          <h2 style={{ fontSize: '1.5rem', color: '#db7093', marginBottom: '0.3em', marginTop: 0 }}>
            {passed ? '🔍 Grammar Expert!' : 'Keep Studying!'}
          </h2>
          <div className="identify-score">
            <span className="score-number">{correctCount}</span>
            <span className="score-divider">/</span>
            <span className="score-total">{exercises.length}</span>
          </div>
          <div className="identify-stars" style={{ fontSize: '2rem', margin: '0.3em 0 0.8em 0' }}>
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className={`identify-star ${i < stars ? 'filled' : ''}`}
                style={{ color: i < stars ? '#fbbf24' : '#ddd', margin: '0 0.15em' }}
              >
                ★
              </span>
            ))}
          </div>
          <p className="identify-message">
            {stars === 3 && 'You can identify grammar patterns like a pro!'}
            {stars === 2 && 'Good eye! Keep practicing to master all patterns.'}
            {stars === 1 && 'You\'re learning! Review the question types.'}
            {stars === 0 && 'Take your time with the grammar rules.'}
          </p>
          <div className="identify-actions">
            <button className="identify-btn secondary" onClick={onBack}>
              Back to Pathway
            </button>
            <button
              className="identify-btn primary"
              onClick={() => onComplete(stars, passed)}
            >
              {passed ? 'Continue' : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="identify-container">
      <div className="identify-header">
        <MinimalButton onClick={onBack} aria-label="Back">
          <FiArrowLeft size={24} />
        </MinimalButton>
        <div className="identify-progress">
          <span>{currentIndex + 1} / {exercises.length}</span>
          <div className="identify-progress-bar">
            <motion.div
              className="identify-progress-fill"
              animate={{ width: `${((currentIndex + 1) / exercises.length) * 100}%` }}
            />
          </div>
        </div>
        <button
          className="identify-hint-btn"
          onClick={() => setShowHint(!showHint)}
          aria-label="Show hint"
        >
          <FiHelpCircle size={22} />
        </button>
      </div>

      <motion.div
        key={currentIndex}
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        className="identify-card"
        style={{ marginTop: '1.5em', minHeight: '280px', display: 'block' }}
      >
        <div className="identify-sentence-block">
          <p className="identify-instruction">{getInstructionForUnit(unitId)}</p>

          <div className="identify-sentence">
            <span className="sentence-nepali">{currentExercise.sentence}</span>
            <button
              className="identify-speak-btn"
              onClick={() => speakText(currentExercise.sentence)}
            >
              <FiVolume2 size={20} />
            </button>
          </div>

          {showTransliteration && currentExercise.transliteration && (
            <p className="sentence-transliteration">{currentExercise.transliteration}</p>
          )}
        </div>

        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              className="identify-hint"
            >
              💡 {currentExercise.hint}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="identify-options">
          {currentExercise.options.map(option => {
            const isSelected = selectedAnswer === option.id;
            const isCorrect = showResult && option.id === currentExercise.correctAnswer;
            const isWrong = showResult && isSelected && option.id !== currentExercise.correctAnswer;

            return (
              <motion.button
                key={option.id}
                whileHover={!showResult ? { scale: 1.02 } : {}}
                whileTap={!showResult ? { scale: 0.98 } : {}}
                className={`identify-option ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                onClick={() => handleSelect(option.id)}
                disabled={showResult}
              >
                <span className="option-label">{option.label}</span>
                {showResult && isCorrect && <FiCheck className="option-icon correct" />}
                {showResult && isWrong && <FiX className="option-icon wrong" />}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              className={`identify-explanation ${selectedAnswer === currentExercise.correctAnswer ? 'correct' : 'wrong'}`}
            >
              <p>{currentExercise.explanation}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="identify-actions-bottom">
        {!showResult ? (
          <button
            className="identify-submit-btn"
            onClick={handleSubmit}
            disabled={!selectedAnswer}
          >
            Check Answer
          </button>
        ) : (
          <button className="identify-next-btn" onClick={handleNext}>
            {currentIndex < exercises.length - 1 ? 'Next' : 'See Results'}
          </button>
        )}
      </div>
    </div>
  );
};

export default IdentifyGrammar;
