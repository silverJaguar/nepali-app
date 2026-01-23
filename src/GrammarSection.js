import React, { useState, useEffect } from 'react';
import SentenceConstruction from './SentenceConstruction';
import GrammarPathway from './components/GrammarPathway';
import GrammarQuiz from './components/GrammarQuiz';
import IdentifyGrammar from './components/IdentifyGrammar';
import FillBlank from './components/FillBlank';
import { FiArrowLeft } from "react-icons/fi";
import MinimalButton from './components/MinimalButton';
import { grammarPathwayUnits, loadProgress, saveProgress } from './data/grammarPathwayData';

// DEV MODE: Set to true to unlock all units for development/testing
const DEV_MODE = true; // TODO: Disabled for development - set to false for production

// Unit selection menu - shows all grammar units
const GrammarUnitMenu = ({ units, progress, onSelectUnit }) => (
  <div className="grammar-unit-menu">
    <h2 className="grammar-menu-title">Grammar Pathway</h2>
    <p className="grammar-menu-subtitle">Master Nepali grammar step by step</p>
    <div className="grammar-unit-list">
      {units.map((unit, index) => {
        const unitProgress = progress[unit.id];
        const completedActivities = unitProgress?.activities 
          ? Object.values(unitProgress.activities).filter(a => a.completed).length 
          : 0;
        const totalActivities = unit.activities.length;
        const totalStars = unitProgress?.activities
          ? Object.values(unitProgress.activities).reduce((sum, a) => sum + (a.stars || 0), 0)
          : 0;
        const maxStars = totalActivities * 3;
        
        // Check if previous unit is completed (for locking)
        // DEV_MODE bypasses locking for development/testing
        const isLocked = DEV_MODE ? false : (index > 0 && !progress[units[index - 1].id]?.completed);
        
        return (
          <button
            key={unit.id}
            className={`grammar-unit-card ${isLocked ? 'locked' : ''}`}
            onClick={() => !isLocked && onSelectUnit(unit.id)}
            disabled={isLocked}
          >
            <div className="unit-card-header">
              <span className="unit-number">{unit.id}</span>
              <div className="unit-stars-preview">
                {totalStars}/{maxStars} ★
              </div>
            </div>
            <h3 className="unit-card-name">{unit.name}</h3>
            <p className="unit-card-desc">{unit.description}</p>
            <div className="unit-card-progress">
              <div className="unit-progress-bar">
                <div 
                  className="unit-progress-fill"
                  style={{ width: `${(completedActivities / totalActivities) * 100}%` }}
                />
              </div>
              <span className="unit-progress-text">{completedActivities}/{totalActivities} complete</span>
            </div>
            {isLocked && (
              <div className="unit-locked-overlay">
                <span>🔒</span>
                <span>Complete previous unit</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

const GrammarSection = ({ onComplete }) => {
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(null);
  const [progress, setProgress] = useState(() => loadProgress());
  
  // Save progress whenever it changes
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);
  
  const selectedUnit = grammarPathwayUnits.find(u => u.id === selectedUnitId);
  
  // Handle activity completion
  const handleActivityComplete = (stars, passed) => {
    if (!selectedUnitId || currentActivityIndex === null) return;
    
    setProgress(prev => {
      const newProgress = { ...prev };
      const unitProgress = { ...newProgress[selectedUnitId] };
      const activities = { ...unitProgress.activities };
      
      // Update this activity's progress
      activities[currentActivityIndex] = {
        completed: passed,
        stars: Math.max(activities[currentActivityIndex]?.stars || 0, stars),
      };
      
      // Check if all activities in unit are completed
      const allCompleted = Object.values(activities).every(a => a.completed);
      
      unitProgress.activities = activities;
      unitProgress.completed = allCompleted;
      newProgress[selectedUnitId] = unitProgress;
      
      return newProgress;
    });
    
    // Go back to pathway view
    setCurrentActivity(null);
    setCurrentActivityIndex(null);
  };
  
  // Handle activity selection from pathway
  const handleSelectActivity = (activity, index) => {
    setCurrentActivity(activity);
    setCurrentActivityIndex(index);
  };
  
  // Go back to pathway from activity
  const handleBackToPathway = () => {
    setCurrentActivity(null);
    setCurrentActivityIndex(null);
  };
  
  // Go to next unit
  const handleNextUnit = () => {
    const currentIndex = grammarPathwayUnits.findIndex(u => u.id === selectedUnitId);
    if (currentIndex < grammarPathwayUnits.length - 1) {
      setSelectedUnitId(grammarPathwayUnits[currentIndex + 1].id);
    }
  };
  
  // Render the current view
  // 1. Unit menu (no unit selected)
  if (!selectedUnitId) {
    return (
      <GrammarUnitMenu
        units={grammarPathwayUnits}
        progress={progress}
        onSelectUnit={setSelectedUnitId}
      />
    );
  }
  
  // 2. Activity view (unit and activity selected)
  if (currentActivity) {
    const activityProps = {
      unitId: selectedUnitId,
      onComplete: handleActivityComplete,
      onBack: handleBackToPathway,
    };
    
    switch (currentActivity.type) {
      case 'sentence_building':
        return (
          <SentenceConstruction
            currentUnit={selectedUnitId}
            onComplete={() => handleActivityComplete(2, true)} // Default 2 stars for completion
          />
        );
      case 'quiz':
        return <GrammarQuiz {...activityProps} />;
      case 'identify_grammar':
        return <IdentifyGrammar {...activityProps} />;
      case 'fill_blank':
        return <FillBlank {...activityProps} />;
      default:
        return <div>Unknown activity type</div>;
    }
  }
  
  // 3. Pathway view (unit selected, no activity)
  const currentUnitIndex = grammarPathwayUnits.findIndex(u => u.id === selectedUnitId);
  const hasNextUnit = currentUnitIndex < grammarPathwayUnits.length - 1;
  
  return (
    <div className="grammar-pathway-wrapper">
      <MinimalButton
        onClick={() => setSelectedUnitId(null)}
        aria-label="Back to units"
        style={{
          position: 'absolute',
          top: 18,
          left: 18,
          zIndex: 10,
        }}
      >
        <FiArrowLeft size={24} />
      </MinimalButton>
      
      <GrammarPathway
        unit={selectedUnit}
        activities={selectedUnit.activities}
        progress={progress[selectedUnitId]}
        onSelectActivity={handleSelectActivity}
        onNextUnit={handleNextUnit}
        hasNextUnit={hasNextUnit}
      />
    </div>
  );
};

export default GrammarSection;
