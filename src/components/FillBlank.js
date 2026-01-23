import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiVolume2, FiCheck, FiX } from 'react-icons/fi';
import { useVoiceManager } from '../hooks/useVoiceManager';
import MinimalButton from './MinimalButton';

// Fill in the blank exercises - picking the correct word to complete the sentence
const generateFillBlankExercises = (unitId) => {
  const exerciseBanks = {
    1: [ // Unit 1: Basic Sentences - Copulas and particles
      {
        sentence: 'ऊ शिक्षक ___।',
        transliteration: 'U shikshak ___.',
        translation: 'He is a teacher.',
        blank: 'हो',
        options: ['हो', 'छ', 'छैन', 'होइन'],
        hint: 'Identity sentences (A is B noun) use this copula.',
        explanation: 'हो (ho) is used for identity - stating what someone IS (a noun).',
        fullSentence: 'ऊ शिक्षक हो।',
      },
      {
        sentence: 'केटो अग्लो ___।',
        transliteration: 'Keto aglo ___.',
        translation: 'The boy is tall.',
        blank: 'छ',
        options: ['हो', 'छ', 'सङ्ग', 'ले'],
        hint: 'Adjective sentences (describing a quality) use this copula.',
        explanation: 'छ (chha) is used with adjectives to describe qualities or states.',
        fullSentence: 'केटो अग्लो छ।',
      },
      {
        sentence: 'केटा___ किताब छ।',
        transliteration: 'Keta___ kitab chha.',
        translation: 'The boy has a book.',
        blank: 'सङ्ग',
        options: ['ले', 'सङ्ग', 'मा', 'को'],
        hint: 'This particle means "with" and creates possession.',
        explanation: 'सङ्ग (sanga) = "with". Boy-with book exists → Boy has book.',
        fullSentence: 'केटासङ्ग किताब छ।',
      },
      {
        sentence: 'यो घर ___।',
        transliteration: 'Yo ghar ___.',
        translation: 'This is a house.',
        blank: 'हो',
        options: ['छ', 'हो', 'थियो', 'हुन्छ'],
        hint: 'We\'re identifying WHAT something is, not describing it.',
        explanation: 'हो is used for identification: "This IS a house" (identity, not quality).',
        fullSentence: 'यो घर हो।',
      },
      {
        sentence: 'टेबलमा किताब ___।',
        transliteration: 'Tebalma kitab ___.',
        translation: 'There is a book on the table.',
        blank: 'छ',
        options: ['हो', 'छ', 'होइन', 'सङ्ग'],
        hint: 'Existence sentences use this copula.',
        explanation: 'छ is used for existence: stating that something exists somewhere.',
        fullSentence: 'टेबलमा किताब छ।',
      },
    ],
    2: [ // Unit 2: Action Sentences - Ergative case and verbs
      {
        sentence: 'राम___ भात खान्छ।',
        transliteration: 'Ram___ bhat khancha.',
        translation: 'Ram eats rice.',
        blank: 'ले',
        options: ['ले', 'सङ्ग', 'को', 'मा'],
        hint: 'This particle marks the subject of a transitive verb.',
        explanation: 'ले (le) is the ergative marker - used on subjects of transitive verbs.',
        fullSentence: 'रामले भात खान्छ।',
      },
      {
        sentence: 'सीताले चिया ___।',
        transliteration: 'Sitale chiya ___.',
        translation: 'Sita drinks tea.',
        blank: 'पिउँछ',
        options: ['खान्छ', 'पिउँछ', 'पकाउँछ', 'पढ्छ'],
        hint: 'What verb goes with tea (चिया)?',
        explanation: 'पिउँछ (piuncha) means "drinks" - the appropriate verb for tea.',
        fullSentence: 'सीताले चिया पिउँछ।',
      },
      {
        sentence: 'आमाले खाना ___।',
        transliteration: 'Amale khana ___.',
        translation: 'Mother cooks food.',
        blank: 'पकाउँछ',
        options: ['पकाउँछ', 'खान्छ', 'पिउँछ', 'हेर्छ'],
        hint: 'What do you do with food (खाना) in the kitchen?',
        explanation: 'पकाउँछ (pakauncha) means "cooks" - mother cooks food.',
        fullSentence: 'आमाले खाना पकाउँछ।',
      },
      {
        sentence: 'विद्यार्थी___ किताब पढ्छ।',
        transliteration: 'Bidyarthi___ kitab padhcha.',
        translation: 'The student reads a book.',
        blank: 'ले',
        options: ['ले', 'मा', 'सङ्ग', 'को'],
        hint: 'Transitive verbs require this marker on the subject.',
        explanation: 'पढ्छ (reads) is transitive, so the subject needs ले.',
        fullSentence: 'विद्यार्थीले किताब पढ्छ।',
      },
      {
        sentence: 'शिक्षकले पाठ ___।',
        transliteration: 'Shikshakle paath ___.',
        translation: 'The teacher teaches the lesson.',
        blank: 'सिकाउँछ',
        options: ['सिकाउँछ', 'पढ्छ', 'लेख्छ', 'खान्छ'],
        hint: 'What does a teacher do with a lesson?',
        explanation: 'सिकाउँछ (sikauncha) means "teaches".',
        fullSentence: 'शिक्षकले पाठ सिकाउँछ।',
      },
    ],
    3: [ // Unit 3: Negation
      {
        sentence: 'ऊ शिक्षक ___।',
        transliteration: 'U shikshak ___.',
        translation: 'He is not a teacher.',
        blank: 'होइन',
        options: ['हो', 'छ', 'होइन', 'छैन'],
        hint: 'What is the negative of हो (identity)?',
        explanation: 'होइन (hoina) negates identity sentences: हो → होइन.',
        fullSentence: 'ऊ शिक्षक होइन।',
      },
      {
        sentence: 'गाडी ___।',
        transliteration: 'Gadi ___.',
        translation: 'There is no car.',
        blank: 'छैन',
        options: ['छ', 'छैन', 'हो', 'होइन'],
        hint: 'What is the negative of छ (existence)?',
        explanation: 'छैन (chhaina) negates existence: छ → छैन.',
        fullSentence: 'गाडी छैन।',
      },
      {
        sentence: 'रामले भात ___।',
        transliteration: 'Ramle bhat ___.',
        translation: 'Ram does not eat rice.',
        blank: 'खाँदैन',
        options: ['खान्छ', 'खाँदैन', 'छ', 'छैन'],
        hint: 'What is the negative form of खान्छ?',
        explanation: 'खाँदैन (khandaina) is the negative of खान्छ.',
        fullSentence: 'रामले भात खाँदैन।',
      },
      {
        sentence: 'केटासङ्ग पैसा ___।',
        transliteration: 'Ketasanga paisa ___.',
        translation: 'The boy does not have money.',
        blank: 'छैन',
        options: ['छ', 'छैन', 'होइन', 'हो'],
        hint: 'Possession uses सङ्ग + what negative copula?',
        explanation: 'Negative possession: सङ्ग + छैन = "does not have".',
        fullSentence: 'केटासङ्ग पैसा छैन।',
      },
      {
        sentence: 'यो मिठो ___।',
        transliteration: 'Yo mitho ___.',
        translation: 'This is not tasty.',
        blank: 'छैन',
        options: ['हो', 'छ', 'होइन', 'छैन'],
        hint: 'Adjective sentences use छ, so the negative is...',
        explanation: 'Adjectives use छ for positive, छैन for negative.',
        fullSentence: 'यो मिठो छैन।',
      },
    ],
  };
  
  return exerciseBanks[unitId] || exerciseBanks[1];
};

const FillBlank = ({ unitId, onComplete, onBack }) => {
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const { speakText } = useVoiceManager();
  
  useEffect(() => {
    setExercises(generateFillBlankExercises(unitId));
  }, [unitId]);
  
  if (exercises.length === 0) {
    return <div className="fillblank-loading">Loading exercises...</div>;
  }
  
  const currentExercise = exercises[currentIndex];
  
  const handleSelect = (option) => {
    if (showResult) return;
    setSelectedAnswer(option);
    setShowResult(true);
    
    if (option === currentExercise.blank) {
      setCorrectCount(prev => prev + 1);
    }
  };
  
  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
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
    
    return (
      <motion.div 
        className="fillblank-complete"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h2>{passed ? '✏️ Well Done!' : 'Keep Practicing!'}</h2>
        <div className="fillblank-score">
          <span className="score-number">{correctCount}</span>
          <span className="score-divider">/</span>
          <span className="score-total">{exercises.length}</span>
        </div>
        <div className="fillblank-stars">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className={`fillblank-star ${i < stars ? 'filled' : ''}`}
            >
              ★
            </motion.span>
          ))}
        </div>
        <p className="fillblank-message">
          {stars === 3 && 'Perfect! You know your grammar particles!'}
          {stars === 2 && 'Good job! A bit more practice and you\'ll master it.'}
          {stars === 1 && 'Nice effort! Review the copulas and particles.'}
          {stars === 0 && 'Keep studying the grammar rules!'}
        </p>
        <div className="fillblank-actions">
          <button className="fillblank-btn secondary" onClick={onBack}>
            Back to Pathway
          </button>
          <button 
            className="fillblank-btn primary" 
            onClick={() => onComplete(stars, passed)}
          >
            {passed ? 'Continue' : 'Try Again'}
          </button>
        </div>
      </motion.div>
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fillblank-card"
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
          <p className="fillblank-transliteration">{currentExercise.transliteration}</p>
          <p className="fillblank-translation">"{currentExercise.translation}"</p>
        </div>
        
        {!showResult && (
          <p className="fillblank-hint">💡 {currentExercise.hint}</p>
        )}
        
        <div className="fillblank-options">
          {currentExercise.options.map(option => {
            const isSelected = selectedAnswer === option;
            const isCorrect = showResult && option === currentExercise.blank;
            const isWrong = showResult && isSelected && option !== currentExercise.blank;
            
            return (
              <motion.button
                key={option}
                whileHover={!showResult ? { scale: 1.05 } : {}}
                whileTap={!showResult ? { scale: 0.95 } : {}}
                className={`fillblank-option ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                onClick={() => handleSelect(option)}
                disabled={showResult}
              >
                {option}
                {showResult && isCorrect && <FiCheck className="option-icon" />}
                {showResult && isWrong && <FiX className="option-icon" />}
              </motion.button>
            );
          })}
        </div>
        
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`fillblank-explanation ${selectedAnswer === currentExercise.blank ? 'correct' : 'wrong'}`}
            >
              <p>{currentExercise.explanation}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {showResult && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fillblank-next-btn"
          onClick={handleNext}
        >
          {currentIndex < exercises.length - 1 ? 'Next' : 'See Results'}
        </motion.button>
      )}
    </div>
  );
};

export default FillBlank;


