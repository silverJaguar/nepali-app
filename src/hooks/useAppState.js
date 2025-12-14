import { useState, useCallback } from 'react';
import lessons from '../lessons.json';

export const useAppState = () => {
  const [currentSection, setCurrentSection] = useState(null);
  const [unitIndex, setUnitIndex] = useState(null);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [showTransition, setShowTransition] = useState(false);
  const [showMatching, setShowMatching] = useState(false);
  const [showGrammar, setShowGrammar] = useState(false);
  const [cultureCategory, setCultureCategory] = useState(null);

  const goHome = useCallback(() => {
    setCurrentSection(null);
    setUnitIndex(null);
    setLessonIndex(0);
    setShowTransition(false);
    setShowMatching(false);
    setShowGrammar(false);
    setCultureCategory(null);
  }, []);

  const goToNextLesson = useCallback(() => {
    setShowTransition(true);
  }, []);

  const continueToNext = useCallback((unitNames, currentUnit) => {
    setShowTransition(false);
    if (
      currentSection === "Vocab" &&
      currentUnit &&
      lessonIndex < lessons[currentUnit].length - 1
    ) {
      setLessonIndex(lessonIndex + 1);
    } else if (
      currentSection === "Vocab" &&
      currentUnit &&
      lessonIndex === lessons[currentUnit].length - 1
    ) {
      setShowMatching(true);
    } else if (
      currentSection === "Read/Write"
    ) {
      setShowMatching(true);
    } else if (unitIndex < unitNames.length - 1) {
      setUnitIndex(unitIndex + 1);
      setLessonIndex(0);
      setShowMatching(false);
    } else {
      alert("All lessons completed!");
    }
  }, [currentSection, lessonIndex, unitIndex]);

  const handleMatchingComplete = useCallback((unitNames) => {
    setShowMatching(false);
    if (unitIndex < unitNames.length - 1) {
      setUnitIndex(unitIndex + 1);
      setLessonIndex(0);
    } else {
      alert("All lessons completed!");
    }
  }, [unitIndex]);

  const handleGrammarComplete = useCallback(() => {
    setShowGrammar(false);
    alert("Grammar practice completed!");
  }, []);

  return {
    // State
    currentSection,
    unitIndex,
    lessonIndex,
    showTransition,
    showMatching,
    showGrammar,
    cultureCategory,
    
    // Setters
    setCurrentSection,
    setUnitIndex,
    setLessonIndex,
    setCultureCategory,
    
    // Actions
    goHome,
    goToNextLesson,
    continueToNext,
    handleMatchingComplete,
    handleGrammarComplete
  };
};
