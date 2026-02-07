import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiVolume2, FiCheck, FiX } from 'react-icons/fi';
import { useVoiceManager } from '../hooks/useVoiceManager';
import { getSettings } from '../utils/settings';
import MinimalButton from './MinimalButton';
import { getAvailableVocabulary, getTemplatesForUnit } from '../utils/grammarVocabulary';
import { generateFillBlankExercises } from '../utils/fillBlankGenerator';
import { getGrammarFeaturesForUnit } from '../data/grammarRules';

// Fill in the blank: sentences are generated like Sentence Builder and Quiz (buildSentence + vocabulary + templates).
// Blank is always a grammar word (copula or particle); options are grammar-relevant distractors.

const FillBlank = ({ unitId, onComplete, onBack, hasNextUnit = false, onNextUnit }) => {
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showTransliteration, setShowTransliteration] = useState(() => getSettings().showTransliteration);
  const [showTranslation, setShowTranslation] = useState(false);
  const { speakText } = useVoiceManager();

  useEffect(() => {
    try {
      const vocabulary = getAvailableVocabulary(unitId);
      const templates = getTemplatesForUnit(unitId);
      if (vocabulary.length === 0 || templates.length === 0) {
        setExercises([]);
        return;
      }
      const generated = generateFillBlankExercises(unitId, vocabulary, templates, 6);
      setExercises(generated || []);
    } catch (err) {
      console.error('[FillBlank] Failed to generate exercises:', err);
      setExercises([]);
    }
  }, [unitId]);

  useEffect(() => {
    setShowTranslation(false);
  }, [currentIndex]);

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
      <div className="fillblank-container" style={{ padding: '2em', textAlign: 'center' }}>
        <MinimalButton onClick={onBack} aria-label="Back">
          <FiArrowLeft size={24} />
        </MinimalButton>
        <div className="fillblank-loading" style={{ marginTop: '2em' }}>
          <p>Generating exercises...</p>
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5em' }}>
            If this persists, there may not be enough vocabulary or templates for this unit.
          </p>
        </div>
      </div>
    );
  }
  
  const currentExercise = exercises[currentIndex];
  
  const handleSelect = (optionValue) => {
    if (showResult) return;
    setSelectedAnswer(optionValue);
    setShowResult(true);
    if (optionValue === currentExercise.blank) {
      setCorrectCount(prev => prev + 1);
    }
  };
  
  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowTranslation(false);
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
  
  // Render sentence with blank highlighted
  const renderSentence = () => {
    const parts = currentExercise.sentence.split('___');
    return (
      <span className="fillblank-sentence-text">
        {parts[0]}
        <span className={`fillblank-blank ${showResult ? (selectedAnswer === currentExercise.blank ? 'correct' : 'wrong') : ''}`}>
          {showResult ? (selectedAnswer === currentExercise.blank ? selectedAnswer : `${selectedAnswer} → ${currentExercise.blank}`) : '______'}
        </span>
        {parts[1]}
      </span>
    );
  };
  
  if (isComplete) {
    const stars = calculateStars();
    const passed = stars >= 1;
    const features = getGrammarFeaturesForUnit(unitId) || [];

    return (
      <div
        className="fillblank-container"
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '2em',
          position: 'relative',
        }}
      >
        <div
          className="fillblank-complete fillblank-end-screen"
          style={{
            textAlign: 'center',
            padding: '1.5em',
            background: '#fff8fa',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(219, 112, 147, 0.15)',
            maxWidth: '500px',
            margin: '0 auto',
          }}
        >
          <h2 style={{ fontSize: '1.5rem', color: '#db7093', marginBottom: '0.3em', marginTop: 0 }}>
            {passed ? '🎉 Great job!' : 'Keep practicing!'}
          </h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#333', margin: '0.3em 0' }}>
            <span>{correctCount}</span>
            <span style={{ color: '#ccc', margin: '0 0.1em' }}>/</span>
            <span style={{ color: '#888' }}>{exercises.length}</span>
          </div>
          <div style={{ fontSize: '2rem', margin: '0.3em 0 0.8em 0' }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{ color: i < stars ? '#fbbf24' : '#ddd', margin: '0 0.15em' }}>★</span>
            ))}
          </div>
          {features.length > 0 && (
            <div style={{ marginTop: '1em', padding: '1em', background: '#f9fafb', borderRadius: '12px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#333', marginBottom: '0.8em', textAlign: 'center' }}>
                Skills Practiced
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5em' }}>
                {features.map(f => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5em', padding: '0.5em', background: 'white', borderRadius: 6, fontSize: '0.85rem' }}>
                    <span style={{ fontSize: '1rem', color: '#10b981', flexShrink: 0 }}>✓</span>
                    <span style={{ fontWeight: 600, color: '#333' }}>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p style={{ color: '#666', margin: '1em 0 0.8em 0', lineHeight: 1.4, fontSize: '0.9rem' }}>
            {stars === 3 && 'Perfect! You know your grammar particles!'}
            {stars === 2 && 'Good job! A bit more practice and you\'ll master it.'}
            {stars === 1 && 'Nice effort! Review the copulas and particles.'}
            {stars === 0 && 'Keep studying the grammar rules!'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6em', marginTop: '1em', maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
            {hasNextUnit && typeof onNextUnit === 'function' && (
              <button
                type="button"
                onClick={() => {
                  onComplete(stars, passed);
                  onNextUnit();
                }}
                style={{
                  width: '100%',
                  padding: '0.9em 1.8em',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: 30,
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #db7093 0%, #b48bbd 100%)',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(219, 112, 147, 0.3)',
                }}
              >
                Next Unit
              </button>
            )}
            <button
              type="button"
              onClick={() => onComplete(stars, passed)}
              style={{
                width: '100%',
                padding: '0.9em 1.8em',
                fontSize: '0.95rem',
                fontWeight: 700,
                border: '2px solid #db7093',
                borderRadius: 30,
                cursor: 'pointer',
                background: 'transparent',
                color: '#db7093',
              }}
            >
              {hasNextUnit ? 'Back to Pathway' : 'Proceed to Pathway'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fillblank-container">
      <div className="fillblank-header">
        <MinimalButton onClick={onBack} aria-label="Back">
          <FiArrowLeft size={24} />
        </MinimalButton>
        <div className="fillblank-progress">
          <span>{currentIndex + 1} / {exercises.length}</span>
          <div className="fillblank-progress-bar">
            <motion.div 
              className="fillblank-progress-fill"
              animate={{ width: `${((currentIndex + 1) / exercises.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      <motion.div
        key={currentIndex}
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        className="fillblank-card"
        style={{
          marginTop: '1.5em',
          minHeight: '280px',
          display: 'block',
        }}
      >
        <p className="fillblank-instruction">Fill in the blank:</p>
        
        <div className="fillblank-sentence-block">
          <div className="fillblank-sentence">
            {renderSentence()}
            {showResult && (
              <button 
                className="fillblank-speak-btn"
                onClick={() => speakText(currentExercise.fullSentence)}
              >
                <FiVolume2 size={20} />
              </button>
            )}
          </div>
          {showTransliteration && (
            <p className="fillblank-transliteration">{currentExercise.transliteration}</p>
          )}
          <div className="fillblank-translation-wrap">
            {showTranslation ? (
              <p className="fillblank-translation">"{currentExercise.translation}"</p>
            ) : (
              <button
                type="button"
                className="fillblank-translation-tap"
                onClick={() => setShowTranslation(true)}
                aria-label="Show translation"
              >
                Tap to show translation
              </button>
            )}
          </div>
        </div>
        
        {!showResult && (
          <p className="fillblank-hint">💡 {currentExercise.hint}</p>
        )}
        
        <div className="fillblank-options">
          {currentExercise.options.map(option => {
            const value = option.value;
            const isSelected = selectedAnswer === value;
            const isCorrect = showResult && value === currentExercise.blank;
            const isWrong = showResult && isSelected && value !== currentExercise.blank;
            return (
              <motion.button
                key={value}
                whileHover={!showResult ? { scale: 1.05 } : {}}
                whileTap={!showResult ? { scale: 0.95 } : {}}
                className={`fillblank-option ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                onClick={() => handleSelect(value)}
                disabled={showResult}
              >
                <span className="option-nepali">{value}</span>
                {showTransliteration && option.transliteration && (
                  <span className="option-transliteration">{option.transliteration}</span>
                )}
                {showResult && isCorrect && <FiCheck className="option-icon" />}
                {showResult && isWrong && <FiX className="option-icon" />}
              </motion.button>
            );
          })}
        </div>
        
        {showResult && (
          <div
            className={`fillblank-explanation ${selectedAnswer === currentExercise.blank ? 'correct' : 'wrong'}`}
          >
            <p>{currentExercise.explanation}</p>
          </div>
        )}
      </motion.div>
      
      {showResult && (
        <button
          type="button"
          className="fillblank-next-btn"
          onClick={handleNext}
        >
          {currentIndex < exercises.length - 1 ? 'Next' : 'See Results'}
        </button>
      )}
    </div>
  );
};

export default FillBlank;


