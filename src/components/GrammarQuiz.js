import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiX, FiArrowLeft, FiVolume2 } from 'react-icons/fi';
import { useVoiceManager } from '../hooks/useVoiceManager';
import MinimalButton from './MinimalButton';
import { generateQuiz } from '../utils/quizGenerator';
import lessons from '../lessons.json';
import sentenceTemplates from '../sentence_templates.json';
import { checkContentSafety } from '../utils/contentFilter';
import { getSettings } from '../utils/settings';
import QuizEndScreenPreview from './QuizEndScreenPreview';

/**
 * Get filtered vocabulary for the unit (reuses logic from SentenceConstruction)
 */
const getAvailableVocabulary = (currentUnit = 1) => {
  // Get all vocabulary from lessons.json
  const allVocabulary = Object.values(lessons).flatMap(unitLessons => 
    unitLessons.flatMap(lesson => lesson.flashcards)
  );
  
  // Apply content filtering
  const safeVocabulary = allVocabulary.filter(word => {
    const safetyCheck = checkContentSafety(word.term || '');
    if (safetyCheck.isNSFW) return false;
    
    const definitionCheck = checkContentSafety(word.definition || word.gloss || '');
    if (definitionCheck.isNSFW) return false;
    
    return true;
  });
  
  // Filter vocabulary based on current unit
  let filteredVocabulary = safeVocabulary;
  
  // For Units 1 and 2, filter out negation verbs (Unit 3 will include them)
  if (currentUnit === 1 || currentUnit === 2) {
    filteredVocabulary = safeVocabulary.filter(word => {
      if (word.unit_min && word.unit_min > currentUnit) {
        return false;
      }
      
      if (word.visible_in_vocab === false) {
        return false;
      }
      
      // Filter out negation verbs for Units 1 and 2
      if (word.part_of_speech === 'verb') {
        const term = word.term || '';
        const isNegation = term.includes('दैन') || term.includes('छैन') || term.includes('होइन') || term.includes('हैन') || term.includes('हुँदैन');
        const hasNegativeProperty = word.can_be && word.can_be.some(type => type.includes('negative') || type.includes('verb_negative'));
        
        if (isNegation || hasNegativeProperty) {
          return false;
        }
      }
      return true;
    });
  }
  
  return filteredVocabulary;
};

/**
 * Get templates for the unit
 */
const getTemplatesForUnit = (currentUnit) => {
  return sentenceTemplates.filter(tmpl => tmpl.unit === currentUnit);
};

/**
 * Generate quiz questions dynamically
 */
const generateQuizQuestions = (unitId) => {
  try {
    const vocabulary = getAvailableVocabulary(unitId);
    const templates = getTemplatesForUnit(unitId);
    
    console.log('[Quiz Generator] Generating quiz for unit', unitId);
    console.log('[Quiz Generator] Vocabulary count:', vocabulary.length);
    console.log('[Quiz Generator] Templates count:', templates.length);
    
    if (vocabulary.length === 0 || templates.length === 0) {
      console.error('[Quiz Generator] Insufficient data - vocabulary:', vocabulary.length, 'templates:', templates.length);
      throw new Error('Insufficient vocabulary or templates for unit ' + unitId);
    }
    
    const questions = generateQuiz(unitId, vocabulary, templates);
    
    if (!questions || questions.length === 0) {
      console.error('[Quiz Generator] No questions generated');
      throw new Error('Failed to generate questions for unit ' + unitId);
    }
    
    console.log('[Quiz Generator] Successfully generated', questions.length, 'questions');
    return questions;
  } catch (error) {
    console.error('[Quiz Generator] Error generating quiz:', error);
    // Re-throw error instead of using fallbacks
    throw error;
  }
};

// Fallback questions in case generation fails
function generateFallbackQuestions(unitId) {
  const fallbacks = {
    1: [
      {
        type: 'multiple_choice',
        question: '"He is a teacher" - Which is correct?',
        options: ['शिक्षक ऊ हो।', 'ऊ शिक्षक हो।', 'हो ऊ शिक्षक।', 'ऊ हो शिक्षक।'],
        answer: 1,
        explanation: 'Identity sentences follow: Subject + Identity Noun + हो',
        nepali: 'ऊ शिक्षक हो।',
      },
      {
        type: 'multiple_choice',
        question: 'What grammatical feature does "केटो अग्लो छ" demonstrate?',
        options: ['Identity copula', 'Adjective copula', 'Possession', 'Existence'],
        answer: 1,
        explanation: 'छ is used with adjectives to describe qualities.',
        nepali: 'केटो अग्लो छ',
      },
      {
        type: 'true_false',
        question: '"ऊ शिक्षक हो।" is grammatically correct.',
        answer: true,
        explanation: 'Correct: Uses हो for identity with a noun.',
        nepali: 'ऊ शिक्षक हो।',
      },
      {
        type: 'true_false',
        question: '"गाडी छ" expresses possession.',
        answer: false,
        explanation: 'Without सङ्ग, this is existence: "There is a car."',
        nepali: 'गाडी छ',
      },
      {
        type: 'true_false',
        question: 'The copula छ is used for identity sentences with nouns.',
        answer: false,
        explanation: 'हो is used for identity with nouns. छ is for adjectives and existence.',
      },
    ],
    2: [
      {
        type: 'multiple_choice',
        question: '"The boy eats rice" - Which is correct?',
        options: ['भात केटाले खान्छ।', 'केटाले भात खान्छ।', 'खान्छ केटाले भात।', 'केटा भात ले खान्छ।'],
        answer: 1,
        explanation: 'Correct SOV order with ergative marker: [Subject]ले [Object] [Verb].',
        nepali: 'केटाले भात खान्छ।',
      },
      {
        type: 'multiple_choice',
        question: 'What grammatical feature does "रामले भात खान्छ" demonstrate?',
        options: ['Possession', 'Ergative case', 'Identity copula', 'Negation'],
        answer: 1,
        explanation: 'ले marks the subject of transitive verbs (ergative case).',
        nepali: 'रामले भात खान्छ',
      },
      {
        type: 'true_false',
        question: '"केटा भात खान्छ" is grammatically correct.',
        answer: false,
        explanation: 'Missing ergative marker ले. Should be: केटाले भात खान्छ',
        nepali: 'केटा भात खान्छ',
      },
      {
        type: 'true_false',
        question: '"रामले भात खान्छ" is correct for "Ram eats rice".',
        answer: true,
        explanation: 'Correct: Transitive verbs use the ergative marker ले on the subject.',
        nepali: 'रामले भात खान्छ',
      },
      {
        type: 'true_false',
        question: 'Nepali follows Subject-Object-Verb (SOV) word order.',
        answer: true,
        explanation: 'Nepali is an SOV language - the verb always comes at the end.',
      },
    ],
    3: [
      {
        type: 'multiple_choice',
        question: '"He is not a teacher" - Which is correct?',
        options: ['शिक्षक ऊ होइन।', 'ऊ शिक्षक होइन।', 'होइन ऊ शिक्षक।', 'ऊ होइन शिक्षक।'],
        answer: 1,
        explanation: 'Negative identity: Subject + Identity Noun + होइन',
        nepali: 'ऊ शिक्षक होइन।',
      },
      {
        type: 'multiple_choice',
        question: 'What grammatical feature does "ऊ शिक्षक होइन" demonstrate?',
        options: ['Possession', 'Ergative case', 'Identity negation', 'Existence'],
        answer: 2,
        explanation: 'होइन negates identity sentences (हो → होइन).',
        nepali: 'ऊ शिक्षक होइन',
      },
      {
        type: 'true_false',
        question: '"गाडी छैन।" is grammatically correct.',
        answer: true,
        explanation: 'Correct: छैन is the negative of छ for existence.',
        nepali: 'गाडी छैन।',
      },
      {
        type: 'true_false',
        question: '"केटो अग्लो होइन" is the correct negation of "केटो अग्लो छ".',
        answer: false,
        explanation: 'Adjectives negate with छैन, not होइन. Should be: केटो अग्लो छैन',
        nepali: 'केटो अग्लो होइन',
      },
      {
        type: 'true_false',
        question: 'The negative form of हो (identity copula) is होइन.',
        answer: true,
        explanation: 'हो → होइन for identity sentences.',
      },
    ],
  };
  
  return fallbacks[unitId] || fallbacks[1];
}

const GrammarQuiz = ({ unitId, onComplete, onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [showTransliteration, setShowTransliteration] = useState(() => getSettings().showTransliteration);
  const { speakText } = useVoiceManager();
  
  // Update transliteration display when settings change
  useEffect(() => {
    const checkSettings = () => {
      setShowTransliteration(getSettings().showTransliteration);
    };
    window.addEventListener('settingsChanged', checkSettings);
    window.addEventListener('storage', checkSettings);
    return () => {
      window.removeEventListener('settingsChanged', checkSettings);
      window.removeEventListener('storage', checkSettings);
    };
  }, []);
  
  useEffect(() => {
    try {
      const generatedQuestions = generateQuizQuestions(unitId);
      console.log('[GrammarQuiz] Generated questions:', generatedQuestions);
      setQuestions(generatedQuestions);
    } catch (error) {
      console.error('[GrammarQuiz] Failed to generate questions:', error);
      // Show error state instead of using fallbacks
      setQuestions([]);
    }
  }, [unitId]);
  
  // Debug: Track quizComplete state changes
  useEffect(() => {
    console.log('[GrammarQuiz] quizComplete state changed to:', quizComplete);
    console.log('[GrammarQuiz] Current state:', {
      currentIndex,
      questionsLength: questions.length,
      correctCount,
      quizComplete
    });
  }, [quizComplete, currentIndex, questions.length, correctCount]);
  
  if (questions.length === 0) {
    return (
      <div className="quiz-container" style={{ padding: '2em', textAlign: 'center' }}>
        <MinimalButton onClick={onBack} aria-label="Back" style={{ marginBottom: '1em' }}>
          <FiArrowLeft size={24} />
        </MinimalButton>
        <div className="quiz-loading">
          <p>Generating questions...</p>
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5em' }}>
            If this persists, check the console for errors
          </p>
        </div>
      </div>
    );
  }
  
  const currentQuestion = questions[currentIndex];
  
  if (!currentQuestion) {
    console.error('[GrammarQuiz] Current question is undefined, index:', currentIndex);
    return <div className="quiz-loading">Error loading question...</div>;
  }
  
  console.log('[GrammarQuiz] Current question:', currentQuestion);
  
  // Debug: Show raw question data
  if (!currentQuestion.question) {
    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <MinimalButton onClick={onBack} aria-label="Back">
            <FiArrowLeft size={24} />
          </MinimalButton>
          <div className="quiz-progress">
            <span>{currentIndex + 1} / {questions.length}</span>
          </div>
        </div>
        <div style={{ padding: '2em', background: 'white', margin: '2em', borderRadius: '12px' }}>
          <h3>Debug: Question Data</h3>
          <pre>{JSON.stringify(currentQuestion, null, 2)}</pre>
          <button onClick={() => setCurrentIndex(0)}>Reset</button>
        </div>
      </div>
    );
  }
  
  const handleAnswer = (answer) => {
    if (showResult) return;
    
    console.log('[GrammarQuiz] Answer selected:', answer);
    setSelectedAnswer(answer);
    setShowResult(true);
    console.log('[GrammarQuiz] showResult set to true');
    
    const isCorrect = currentQuestion.type === 'true_false'
      ? answer === currentQuestion.answer
      : answer === currentQuestion.answer;
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }
  };
  
  const handleNext = () => {
    console.log('[GrammarQuiz] handleNext called');
    console.log('[GrammarQuiz] currentIndex:', currentIndex, 'questions.length:', questions.length);
    if (currentIndex < questions.length - 1) {
      console.log('[GrammarQuiz] Moving to next question');
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      console.log('[GrammarQuiz] Last question - setting quizComplete to true');
      console.log('[GrammarQuiz] correctCount:', correctCount, 'totalQuestions:', questions.length);
      setQuizComplete(true);
      console.log('[GrammarQuiz] quizComplete set to true');
    }
  };
  
  const calculateStars = () => {
    const percentage = (correctCount / questions.length) * 100;
    if (percentage >= 80) return 3;
    if (percentage >= 60) return 2;
    if (percentage >= 40) return 1;
    return 0;
  };
  
  if (quizComplete) {
    console.log('[GrammarQuiz] quizComplete is true - rendering end screen');
    const stars = calculateStars();
    const passed = stars >= 1;
    
    console.log('[GrammarQuiz] End screen props:', {
      correctCount,
      totalQuestions: questions.length,
      stars,
      unitId,
      passed
    });
    
    // Check if QuizEndScreenPreview is imported
    if (!QuizEndScreenPreview) {
      console.error('[GrammarQuiz] QuizEndScreenPreview is not imported or is undefined');
      return (
        <div style={{ padding: '2em', textAlign: 'center' }}>
          <h2>Error: QuizEndScreenPreview component not found</h2>
          <p>correctCount: {correctCount}</p>
          <p>totalQuestions: {questions.length}</p>
          <p>stars: {stars}</p>
          <button onClick={() => onComplete(stars, passed)}>Continue</button>
        </div>
      );
    }
    
    return (
      <QuizEndScreenPreview
        correctCount={correctCount}
        totalQuestions={questions.length}
        stars={stars}
        unitId={unitId}
        onProceed={() => {
          console.log('[GrammarQuiz] onProceed called');
          onComplete(stars, passed);
        }}
      />
    );
  }
  
  const isCorrectAnswer = (answer) => {
    if (currentQuestion.type === 'true_false') {
      return answer === currentQuestion.answer;
    }
    return answer === currentQuestion.answer;
  };

  return (
    <div className="quiz-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '2em' }}>
      <div className="quiz-header">
        <MinimalButton onClick={onBack} aria-label="Back">
          <FiArrowLeft size={24} />
        </MinimalButton>
        <div className="quiz-progress">
          <span>{currentIndex + 1} / {questions.length}</span>
          <div className="quiz-progress-bar">
            <motion.div 
              className="quiz-progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      <motion.div
        key={currentIndex}
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        className="quiz-question-card"
        style={{ 
          background: '#fff8fa', 
          padding: '2em', 
          borderRadius: '20px', 
          marginTop: '2em',
          minHeight: '300px',
          display: 'block'
        }}
      >
        {currentQuestion.nepali && currentQuestion.question && !currentQuestion.question.includes('Which Nepali sentence is grammatically correct?') && (
          <div className="quiz-nepali-sentence">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3em' }}>
              <span className="nepali-text" style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                {currentQuestion.nepali}
              </span>
              {showTransliteration && currentQuestion.transliteration && (
                <span className="transliteration" style={{ fontSize: '0.95rem', color: '#a6c1ee' }}>
                  {currentQuestion.transliteration}
                </span>
              )}
            </div>
            <button 
              className="quiz-speak-btn"
              onClick={() => speakText(currentQuestion.nepali)}
              aria-label="Play audio"
            >
              <FiVolume2 size={20} />
            </button>
          </div>
        )}
        
        <h3 className="quiz-question" style={{ fontSize: '1.2rem', marginBottom: '1.5em', color: '#333' }}>
          {currentQuestion.question}
        </h3>
        
        {currentQuestion.type === 'true_false' ? (
          <div className="quiz-options true-false">
            {[true, false].map(value => {
              const isSelected = selectedAnswer === value;
              const isCorrect = showResult && value === currentQuestion.answer;
              const isWrong = showResult && isSelected && !isCorrectAnswer(value);
              
              return (
                <motion.button
                  key={String(value)}
                  whileHover={!showResult ? { scale: 1.02 } : {}}
                  whileTap={!showResult ? { scale: 0.98 } : {}}
                  className={`quiz-option ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                  onClick={() => handleAnswer(value)}
                  disabled={showResult}
                >
                  {value ? 'True' : 'False'}
                  {showResult && isCorrect && <FiCheck className="option-icon" />}
                  {showResult && isWrong && <FiX className="option-icon" />}
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="quiz-options multiple-choice">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrect = showResult && idx === currentQuestion.answer;
              const isWrong = showResult && isSelected && idx !== currentQuestion.answer;
              
              return (
                <motion.button
                  key={idx}
                  whileHover={!showResult ? { scale: 1.02 } : {}}
                  whileTap={!showResult ? { scale: 0.98 } : {}}
                  className={`quiz-option ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                  onClick={() => handleAnswer(idx)}
                  disabled={showResult}
                >
                  <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                  <span className="option-text">{option}</span>
                  {showResult && isCorrect && <FiCheck className="option-icon" />}
                  {showResult && isWrong && <FiX className="option-icon" />}
                </motion.button>
              );
            })}
          </div>
        )}
        
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`quiz-explanation ${isCorrectAnswer(selectedAnswer) ? 'correct' : 'wrong'}`}
            >
              <p>{currentQuestion.explanation}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Debug: Always show button for testing */}
      <div style={{ 
        marginTop: '2em', 
        padding: '1em', 
        background: '#f0f0f0', 
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '0.9rem', margin: '0 0 0.5em 0' }}>
          Debug: showResult = {String(showResult)}, selectedAnswer = {String(selectedAnswer)}
        </p>
        <button
          onClick={handleNext}
          style={{
            background: 'linear-gradient(135deg, #db7093 0%, #b48bbd 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '30px',
            padding: '1em 2em',
            fontSize: '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            opacity: showResult ? 1 : 0.5,
          }}
          disabled={!showResult}
        >
          {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
        </button>
      </div>
      
      {showResult && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="quiz-next-btn"
          onClick={handleNext}
          style={{
            display: 'block',
            width: '100%',
            maxWidth: '300px',
            margin: '1.5em auto 0',
            background: 'linear-gradient(135deg, #db7093 0%, #b48bbd 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '30px',
            padding: '1em 2em',
            fontSize: '1rem',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
        </motion.button>
      )}
    </div>
  );
};

export default GrammarQuiz;


