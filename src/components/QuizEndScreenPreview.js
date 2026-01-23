import React from 'react';
import { motion } from 'framer-motion';
import { getGrammarFeaturesForUnit } from '../data/grammarRules';

/**
 * QUIZ END SCREEN COMPONENT
 * 
 * This displays the quiz results when a quiz is completed.
 * It shows the player's actual score - no sliders or controls.
 * 
 * Props:
 * - correctCount: number of correct answers (from quiz)
 * - totalQuestions: total number of questions (from quiz)
 * - stars: number of stars earned (0-3, calculated from score)
 * - unitId: the grammar unit ID (1, 2, or 3)
 * - onProceed: callback when "Proceed to Pathway" is clicked
 */

const QuizEndScreenPreview = ({ 
  correctCount,
  totalQuestions,
  stars,
  unitId,
  onProceed
}) => {
  // Validate props
  if (correctCount === undefined || totalQuestions === undefined || stars === undefined || unitId === undefined) {
    console.error('[QuizEndScreenPreview] Missing required props');
    return (
      <div style={{ padding: '2em', textAlign: 'center', background: '#fee2e2', borderRadius: '12px' }}>
        <h2>Error: Missing props</h2>
        <p>Please check the console for details.</p>
      </div>
    );
  }
  
  const features = getGrammarFeaturesForUnit(unitId);
  
  return (
    <div 
      className="quiz-container" 
      style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        padding: '2em',
        position: 'relative',
        zIndex: 1000,
      }}
    >
      <div 
        className="quiz-complete"
        style={{
          textAlign: 'center',
          padding: '1.5em',
          background: '#fff8fa',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(219, 112, 147, 0.15)',
          opacity: 1,
          visibility: 'visible',
          display: 'block',
          position: 'relative',
          zIndex: 1000,
          maxWidth: '500px',
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <h2 style={{ 
          fontSize: '1.5rem', 
          color: '#db7093', 
          marginBottom: '0.3em',
          marginTop: '0',
        }}>
          {stars >= 1 ? '🎉 Great job!' : 'Keep practicing!'}
        </h2>
        
        {/* Score Display */}
        <div style={{
          fontSize: '2.5rem',
          fontWeight: '900',
          color: '#333',
          margin: '0.3em 0',
        }}>
          <span style={{ color: '#333' }}>{correctCount}</span>
          <span style={{ color: '#ccc', margin: '0 0.1em' }}>/</span>
          <span style={{ color: '#888' }}>{totalQuestions}</span>
        </div>
        
        {/* Stars Display */}
        <div style={{
          fontSize: '2rem',
          margin: '0.3em 0 0.8em 0',
        }}>
          {[0, 1, 2].map(i => (
            <span
              key={i}
              style={{
                color: i < stars ? '#fbbf24' : '#ddd',
                margin: '0 0.15em',
              }}
            >
              ★
            </span>
          ))}
        </div>
        
        {/* Skills Tested Section */}
        <div style={{
          marginTop: '1em',
          padding: '1em',
          background: '#f9fafb',
          borderRadius: '12px',
          textAlign: 'left',
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '700',
            color: '#333',
            marginBottom: '0.8em',
            textAlign: 'center',
          }}>
            Skills Tested
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5em',
          }}>
            {features.map((feature) => (
              <div
                key={feature.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5em',
                  padding: '0.5em',
                  background: 'white',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                }}
              >
                <span style={{
                  fontSize: '1rem',
                  color: '#10b981',
                  flexShrink: 0,
                }}>✓</span>
                <div style={{ 
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  <div style={{
                    fontWeight: '600',
                    color: '#333',
                  }}>
                    {feature.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Message */}
        <p style={{
          color: '#666',
          margin: '1em 0 0.8em 0',
          lineHeight: '1.4',
          fontSize: '0.9rem',
        }}>
          {stars === 3 && 'Perfect! You mastered this topic!'}
          {stars === 2 && 'Good work! A little more practice and you\'ll master it.'}
          {stars === 1 && 'Nice try! Review the material and try again.'}
          {stars === 0 && 'Don\'t give up! Review the grammar rules and try again.'}
        </p>
        
        {/* Proceed Button */}
        <button
          onClick={onProceed}
          style={{
            width: '100%',
            maxWidth: '280px',
            margin: '0.8em auto 0',
            background: 'linear-gradient(135deg, #db7093 0%, #b48bbd 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '30px',
            padding: '0.9em 1.8em',
            fontSize: '0.95rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(219, 112, 147, 0.3)',
            transition: 'all 0.25s',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 24px rgba(219, 112, 147, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(219, 112, 147, 0.3)';
          }}
        >
          Proceed to Pathway
        </button>
      </div>
    </div>
  );
};

export default QuizEndScreenPreview;
