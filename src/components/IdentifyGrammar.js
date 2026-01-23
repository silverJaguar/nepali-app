import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiVolume2, FiCheck, FiX, FiHelpCircle } from 'react-icons/fi';
import { useVoiceManager } from '../hooks/useVoiceManager';
import MinimalButton from './MinimalButton';

// Exercise data for identifying grammar structures
const generateIdentifyExercises = (unitId) => {
  const exerciseBanks = {
    1: [ // Unit 1: Basic Sentences - Identity, Adjective, Existence, Possession
      {
        sentence: 'ऊ शिक्षक हो।',
        transliteration: 'U shikshak ho.',
        translation: 'He is a teacher.',
        correctAnswer: 'identity',
        options: [
          { id: 'identity', label: 'Identity (A is B)', description: 'Uses हो/हुन्' },
          { id: 'adjective', label: 'Adjective (A is [adj])', description: 'Uses छ' },
          { id: 'existence', label: 'Existence (There is...)', description: 'Uses छ' },
          { id: 'possession', label: 'Possession (A has B)', description: 'Uses सङ्ग + छ' },
        ],
        hint: 'Look at the copula at the end. हो is used for identity sentences.',
        explanation: 'This is an identity sentence because it tells us WHO someone is (a teacher). Identity uses हो.',
      },
      {
        sentence: 'केटो अग्लो छ।',
        transliteration: 'Keto aglo chha.',
        translation: 'The boy is tall.',
        correctAnswer: 'adjective',
        options: [
          { id: 'identity', label: 'Identity (A is B)', description: 'Uses हो/हुन्' },
          { id: 'adjective', label: 'Adjective (A is [adj])', description: 'Uses छ' },
          { id: 'existence', label: 'Existence (There is...)', description: 'Uses छ' },
          { id: 'possession', label: 'Possession (A has B)', description: 'Uses सङ्ग + छ' },
        ],
        hint: 'अग्लो means "tall" - an adjective describing a quality.',
        explanation: 'This is an adjective sentence describing a quality (tall). It uses छ with an adjective.',
      },
      {
        sentence: 'गाडी छ।',
        transliteration: 'Gadi chha.',
        translation: 'There is a car.',
        correctAnswer: 'existence',
        options: [
          { id: 'identity', label: 'Identity (A is B)', description: 'Uses हो/हुन्' },
          { id: 'adjective', label: 'Adjective (A is [adj])', description: 'Uses छ' },
          { id: 'existence', label: 'Existence (There is...)', description: 'Uses छ' },
          { id: 'possession', label: 'Possession (A has B)', description: 'Uses सङ्ग + छ' },
        ],
        hint: 'No सङ्ग and no adjective - just stating something exists.',
        explanation: 'This is an existence sentence - simply stating that something (a car) exists.',
      },
      {
        sentence: 'केटासङ्ग किताब छ।',
        transliteration: 'Ketasanga kitab chha.',
        translation: 'The boy has a book.',
        correctAnswer: 'possession',
        options: [
          { id: 'identity', label: 'Identity (A is B)', description: 'Uses हो/हुन्' },
          { id: 'adjective', label: 'Adjective (A is [adj])', description: 'Uses छ' },
          { id: 'existence', label: 'Existence (There is...)', description: 'Uses छ' },
          { id: 'possession', label: 'Possession (A has B)', description: 'Uses सङ्ग + छ' },
        ],
        hint: 'Notice the सङ्ग particle attached to केटा.',
        explanation: 'सङ्ग (with) + छ creates possession: "The boy with book exists" → "The boy has a book".',
      },
      {
        sentence: 'उनी डाक्टर हुन्।',
        transliteration: 'Uni daktar hun.',
        translation: 'She is a doctor.',
        correctAnswer: 'identity',
        options: [
          { id: 'identity', label: 'Identity (A is B)', description: 'Uses हो/हुन्' },
          { id: 'adjective', label: 'Adjective (A is [adj])', description: 'Uses छ' },
          { id: 'existence', label: 'Existence (There is...)', description: 'Uses छ' },
          { id: 'possession', label: 'Possession (A has B)', description: 'Uses सङ्ग + छ' },
        ],
        hint: 'हुन् is the honorific form of हो - both are identity copulas.',
        explanation: 'हुन् is the respectful form of हो, used for identity with respected persons.',
      },
    ],
    2: [ // Unit 2: Action Sentences
      {
        sentence: 'रामले भात खान्छ।',
        transliteration: 'Ramle bhat khancha.',
        translation: 'Ram eats rice.',
        correctAnswer: 'transitive_present',
        options: [
          { id: 'transitive_present', label: 'Transitive Present', description: 'Subject + ले + Object + Verb' },
          { id: 'intransitive_present', label: 'Intransitive Present', description: 'Subject + Verb (no object)' },
          { id: 'identity', label: 'Identity Sentence', description: 'A is B (uses हो)' },
          { id: 'adjective', label: 'Adjective Sentence', description: 'A is [adj] (uses छ)' },
        ],
        hint: 'Notice the ले on राम - this marks the subject of a transitive verb.',
        explanation: 'रामले has ले (ergative marker). खान्छ needs an object (भात), so it\'s transitive present.',
      },
      {
        sentence: 'सीताले चिया पिउँछ।',
        transliteration: 'Sitale chiya piuncha.',
        translation: 'Sita drinks tea.',
        correctAnswer: 'transitive_present',
        options: [
          { id: 'transitive_present', label: 'Transitive Present', description: 'Subject + ले + Object + Verb' },
          { id: 'intransitive_present', label: 'Intransitive Present', description: 'Subject + Verb (no object)' },
          { id: 'identity', label: 'Identity Sentence', description: 'A is B (uses हो)' },
          { id: 'possession', label: 'Possession Sentence', description: 'A has B (uses सङ्ग + छ)' },
        ],
        hint: 'Look for ले on the subject and an object before the verb.',
        explanation: 'सीताले (with ergative ले) + चिया (object) + पिउँछ (verb) = transitive present.',
      },
      {
        sentence: 'आमाले खाना पकाउँछ।',
        transliteration: 'Amale khana pakauncha.',
        translation: 'Mother cooks food.',
        correctAnswer: 'transitive_present',
        options: [
          { id: 'transitive_present', label: 'Transitive Present', description: 'Subject + ले + Object + Verb' },
          { id: 'intransitive_present', label: 'Intransitive Present', description: 'Subject + Verb (no object)' },
          { id: 'existence', label: 'Existence Sentence', description: 'There is... (uses छ)' },
          { id: 'adjective', label: 'Adjective Sentence', description: 'A is [adj] (uses छ)' },
        ],
        hint: 'आमाले has ले, and there\'s an object (खाना) before the verb.',
        explanation: 'Standard transitive structure: Subject+ले + Object + Verb.',
      },
      {
        sentence: 'केटा स्कुल जान्छ।',
        transliteration: 'Keta school jancha.',
        translation: 'The boy goes to school.',
        correctAnswer: 'intransitive_present',
        options: [
          { id: 'transitive_present', label: 'Transitive Present', description: 'Subject + ले + Object + Verb' },
          { id: 'intransitive_present', label: 'Intransitive Present', description: 'Subject + Verb (no object)' },
          { id: 'identity', label: 'Identity Sentence', description: 'A is B (uses हो)' },
          { id: 'possession', label: 'Possession Sentence', description: 'A has B (uses सङ्ग + छ)' },
        ],
        hint: 'No ले on the subject - जान्छ (goes) is an intransitive verb.',
        explanation: 'जान्छ (goes) doesn\'t take a direct object - स्कुल is a destination, not an object.',
      },
      {
        sentence: 'विद्यार्थीले किताब पढ्छ।',
        transliteration: 'Bidyarthile kitab padhcha.',
        translation: 'The student reads a book.',
        correctAnswer: 'transitive_present',
        options: [
          { id: 'transitive_present', label: 'Transitive Present', description: 'Subject + ले + Object + Verb' },
          { id: 'intransitive_present', label: 'Intransitive Present', description: 'Subject + Verb (no object)' },
          { id: 'identity', label: 'Identity Sentence', description: 'A is B (uses हो)' },
          { id: 'existence', label: 'Existence Sentence', description: 'There is... (uses छ)' },
        ],
        hint: 'विद्यार्थीले has the ergative marker ले.',
        explanation: 'पढ्छ (reads) is transitive - it needs an object (किताब).',
      },
    ],
    3: [ // Unit 3: Negation
      {
        sentence: 'ऊ शिक्षक होइन।',
        transliteration: 'U shikshak hoina.',
        translation: 'He is not a teacher.',
        correctAnswer: 'negative_identity',
        options: [
          { id: 'negative_identity', label: 'Negative Identity', description: 'A is not B (uses होइन)' },
          { id: 'negative_adjective', label: 'Negative Adjective', description: 'A is not [adj] (uses छैन)' },
          { id: 'negative_existence', label: 'Negative Existence', description: 'There is not... (uses छैन)' },
          { id: 'negative_action', label: 'Negative Action', description: 'Does not [verb] (uses -दैन)' },
        ],
        hint: 'होइन negates identity statements (हो → होइन).',
        explanation: 'Identity negation: हो becomes होइन. "He is a teacher" → "He is not a teacher".',
      },
      {
        sentence: 'गाडी छैन।',
        transliteration: 'Gadi chhaina.',
        translation: 'There is no car.',
        correctAnswer: 'negative_existence',
        options: [
          { id: 'negative_identity', label: 'Negative Identity', description: 'A is not B (uses होइन)' },
          { id: 'negative_adjective', label: 'Negative Adjective', description: 'A is not [adj] (uses छैन)' },
          { id: 'negative_existence', label: 'Negative Existence', description: 'There is not... (uses छैन)' },
          { id: 'negative_possession', label: 'Negative Possession', description: 'Does not have (uses सङ्ग + छैन)' },
        ],
        hint: 'छैन is the negative of छ for existence/state.',
        explanation: 'Existence negation: छ becomes छैन. "There is a car" → "There is no car".',
      },
      {
        sentence: 'केटासङ्ग पैसा छैन।',
        transliteration: 'Ketasanga paisa chhaina.',
        translation: 'The boy does not have money.',
        correctAnswer: 'negative_possession',
        options: [
          { id: 'negative_identity', label: 'Negative Identity', description: 'A is not B (uses होइन)' },
          { id: 'negative_existence', label: 'Negative Existence', description: 'There is not... (uses छैन)' },
          { id: 'negative_possession', label: 'Negative Possession', description: 'Does not have (uses सङ्ग + छैन)' },
          { id: 'negative_action', label: 'Negative Action', description: 'Does not [verb] (uses -दैन)' },
        ],
        hint: 'सङ्ग indicates possession, छैन is the negative.',
        explanation: 'Possession negation uses सङ्ग + छैन: "with-not-exists" → "does not have".',
      },
      {
        sentence: 'रामले भात खाँदैन।',
        transliteration: 'Ramle bhat khandaina.',
        translation: 'Ram does not eat rice.',
        correctAnswer: 'negative_action',
        options: [
          { id: 'negative_identity', label: 'Negative Identity', description: 'A is not B (uses होइन)' },
          { id: 'negative_existence', label: 'Negative Existence', description: 'There is not... (uses छैन)' },
          { id: 'negative_possession', label: 'Negative Possession', description: 'Does not have (uses सङ्ग + छैन)' },
          { id: 'negative_action', label: 'Negative Action', description: 'Does not [verb] (uses -दैन)' },
        ],
        hint: 'खाँदैन is the negative form of खान्छ.',
        explanation: 'Action verbs negate with -दैन suffix: खान्छ → खाँदैन.',
      },
      {
        sentence: 'यो मिठो छैन।',
        transliteration: 'Yo mitho chhaina.',
        translation: 'This is not tasty.',
        correctAnswer: 'negative_adjective',
        options: [
          { id: 'negative_identity', label: 'Negative Identity', description: 'A is not B (uses होइन)' },
          { id: 'negative_adjective', label: 'Negative Adjective', description: 'A is not [adj] (uses छैन)' },
          { id: 'negative_existence', label: 'Negative Existence', description: 'There is not... (uses छैन)' },
          { id: 'negative_action', label: 'Negative Action', description: 'Does not [verb] (uses -दैन)' },
        ],
        hint: 'मिठो is an adjective meaning "tasty".',
        explanation: 'Adjective negation: A + adjective + छैन. "This tasty is-not" → "This is not tasty".',
      },
    ],
  };
  
  return exerciseBanks[unitId] || exerciseBanks[1];
};

const IdentifyGrammar = ({ unitId, onComplete, onBack }) => {
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const { speakText } = useVoiceManager();
  
  useEffect(() => {
    setExercises(generateIdentifyExercises(unitId));
  }, [unitId]);
  
  if (exercises.length === 0) {
    return <div className="identify-loading">Loading exercises...</div>;
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
      <motion.div 
        className="identify-complete"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h2>{passed ? '🔍 Grammar Expert!' : 'Keep Studying!'}</h2>
        <div className="identify-score">
          <span className="score-number">{correctCount}</span>
          <span className="score-divider">/</span>
          <span className="score-total">{exercises.length}</span>
        </div>
        <div className="identify-stars">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className={`identify-star ${i < stars ? 'filled' : ''}`}
            >
              ★
            </motion.span>
          ))}
        </div>
        <p className="identify-message">
          {stars === 3 && 'You can identify grammar patterns like a pro!'}
          {stars === 2 && 'Good eye! Keep practicing to master all patterns.'}
          {stars === 1 && 'You\'re learning! Review the sentence types.'}
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
      </motion.div>
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="identify-card"
      >
        <div className="identify-sentence-block">
          <p className="identify-instruction">What type of sentence is this?</p>
          
          <div className="identify-sentence">
            <span className="sentence-nepali">{currentExercise.sentence}</span>
            <button 
              className="identify-speak-btn"
              onClick={() => speakText(currentExercise.sentence)}
            >
              <FiVolume2 size={20} />
            </button>
          </div>
          
          <p className="sentence-transliteration">{currentExercise.transliteration}</p>
          <p className="sentence-translation">"{currentExercise.translation}"</p>
        </div>
        
        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
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
                <span className="option-desc">{option.description}</span>
                {showResult && isCorrect && <FiCheck className="option-icon correct" />}
                {showResult && isWrong && <FiX className="option-icon wrong" />}
              </motion.button>
            );
          })}
        </div>
        
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
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


