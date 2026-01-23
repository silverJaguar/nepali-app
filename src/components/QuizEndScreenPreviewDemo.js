import React, { useState } from 'react';
import QuizEndScreenPreview from './QuizEndScreenPreview';

/**
 * DEMO PAGE - For previewing the quiz end screen
 * 
 * NOTE: This is ONLY for testing/preview purposes!
 * The actual quiz end screen (QuizEndScreenPreview) does NOT have sliders.
 * It only displays the actual score passed to it from the quiz.
 * 
 * This demo allows you to preview different scenarios:
 * - Different scores (0/5, 3/5, 5/5)
 * - Different star counts (0, 1, 2, 3)
 * - Different units (1, 2, 3)
 */

const QuizEndScreenPreviewDemo = () => {
  const [correctCount, setCorrectCount] = useState(4);
  const [totalQuestions] = useState(5);
  const [stars, setStars] = useState(2);
  const [unitId, setUnitId] = useState(1);
  
  const calculateStarsFromScore = (correct, total) => {
    const percentage = (correct / total) * 100;
    if (percentage >= 80) return 3;
    if (percentage >= 60) return 2;
    if (percentage >= 40) return 1;
    return 0;
  };
  
  const handleScoreChange = (newScore) => {
    setCorrectCount(newScore);
    setStars(calculateStarsFromScore(newScore, totalQuestions));
  };
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '2em',
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '16px',
        padding: '2em',
        marginBottom: '2em',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '3px solid #fbbf24',
      }}>
        <div style={{
          background: '#fef3c7',
          padding: '1em',
          borderRadius: '8px',
          marginBottom: '1.5em',
          border: '1px solid #fbbf24',
        }}>
          <strong>⚠️ PREVIEW MODE ONLY</strong>
          <p style={{ margin: '0.5em 0 0 0', fontSize: '0.9rem' }}>
            These controls are ONLY for testing/preview. The actual quiz end screen will show the player's real score - no sliders or controls.
          </p>
        </div>
        <h2 style={{ marginBottom: '1em' }}>Quiz End Screen Preview Controls</h2>
        
        <div style={{ marginBottom: '1.5em' }}>
          <label style={{ display: 'block', marginBottom: '0.5em', fontWeight: '600' }}>
            Score: {correctCount} / {totalQuestions}
          </label>
          <input
            type="range"
            min="0"
            max="5"
            value={correctCount}
            onChange={(e) => handleScoreChange(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666', marginTop: '0.5em' }}>
            <span>0</span>
            <span>5</span>
          </div>
        </div>
        
        <div style={{ marginBottom: '1.5em' }}>
          <label style={{ display: 'block', marginBottom: '0.5em', fontWeight: '600' }}>
            Unit: {unitId}
          </label>
          <div style={{ display: 'flex', gap: '1em' }}>
            {[1, 2, 3].map(id => (
              <button
                key={id}
                onClick={() => setUnitId(id)}
                style={{
                  flex: 1,
                  padding: '0.8em',
                  border: unitId === id ? '2px solid #db7093' : '2px solid #ddd',
                  borderRadius: '8px',
                  background: unitId === id ? '#fff8fa' : 'white',
                  color: unitId === id ? '#db7093' : '#333',
                  fontWeight: unitId === id ? '700' : '400',
                  cursor: 'pointer',
                }}
              >
                Unit {id}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{
          padding: '1em',
          background: '#f0f9ff',
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: '#0369a1',
        }}>
          <strong>Current Preview:</strong> {correctCount}/{totalQuestions} correct = {stars} star{stars !== 1 ? 's' : ''} | Unit {unitId}
        </div>
      </div>
      
      <QuizEndScreenPreview
        correctCount={correctCount}
        totalQuestions={totalQuestions}
        stars={stars}
        unitId={unitId}
        onProceed={() => alert('Proceed to Pathway clicked!')}
      />
    </div>
  );
};

export default QuizEndScreenPreviewDemo;
