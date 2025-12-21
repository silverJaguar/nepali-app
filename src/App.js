import React, { useState } from "react";
import "./styles.css";
import { motion } from "framer-motion";
import AlphabetMenu from "./AlphabetMenu";
import Flashcards from "./Flashcards";
import lessons from "./lessons.json";
import alphabetLessons from "./alphabet.json";
import HomeButton from "./HomeButton";
import SettingsButton from "./SettingsButton";
import SettingsPage from "./SettingsPage";
import CultureMenu from "./CultureMenu";
import CulturePage from "./CulturePage";
import cultureData from "./culture.js";
import { FiRotateCw, FiVolume2, FiChevronLeft, FiChevronRight, FiHome } from "react-icons/fi";
import UnifiedMatchingSection from "./components/UnifiedMatchingSection";
import GrammarSection from "./GrammarSection";
import { useAppState } from "./hooks/useAppState";
import { filterVisibleVocabulary } from "./utils/helpers";
import { getSettings } from "./utils/settings";

const MainMenu = ({ onSelectSection }) => (
  <div className="p-4 border rounded-lg shadow">
    <h2 className="text-xl font-bold">Main Menu</h2>
    {["Vocab", "Read/Write", "Grammar", "Culture"].map((section) => (
      <button
        key={section}
        className="pastel-button"
        onClick={() => onSelectSection(section)}
      >
        {section}
      </button>
    ))}
  </div>
);

const Menu = ({ units, onSelect }) => (
  <div className="p-4 border rounded-lg shadow">
    <h2 className="text-xl font-bold">Select a Unit</h2>
    {units.map((unit, index) => (
      <button
        key={unit}
        className="pastel-button"
        onClick={() => onSelect(index)}
      >
        {unit}
      </button>
    ))}
  </div>
);

const Lesson = ({ unit, lesson, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [flipped, setFlipped] = useState(false);
  const [showTransliteration, setShowTransliteration] = useState(() => getSettings().showTransliteration);
  const flashcards = lesson.flashcards;

  // Load voices on mount and from settings
  React.useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      // Only Nepali or Hindi voices
      const filtered = allVoices.filter(v => v.lang === 'ne-NP' || v.lang === 'hi-IN');
      setVoices(filtered);
      
      // Load voice from settings
      const settings = getSettings();
      if (settings.selectedVoiceURI && filtered.find(v => v.voiceURI === settings.selectedVoiceURI)) {
        setSelectedVoiceURI(settings.selectedVoiceURI);
      } else {
        // Fallback to default
        let defaultVoice = filtered.find(v => v.lang === 'ne-NP')
          || filtered.find(v => v.lang === 'hi-IN');
        if (defaultVoice) setSelectedVoiceURI(defaultVoice.voiceURI);
        else setSelectedVoiceURI('');
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    // Cleanup
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const nextCard = () => {
    setFlipped(false);
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const prevCard = () => {
    setFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const currentCard = flashcards[currentIndex];

  // Update transliteration display when settings change
  React.useEffect(() => {
    const checkSettings = () => {
      setShowTransliteration(getSettings().showTransliteration);
    };
    // Check on mount and listen for settings changes
    checkSettings();
    window.addEventListener('settingsChanged', checkSettings);
    window.addEventListener('storage', checkSettings);
    return () => {
      window.removeEventListener('settingsChanged', checkSettings);
      window.removeEventListener('storage', checkSettings);
    };
  }, []);

  // Text-to-speech for Nepali term or example (uses settings)
  const speakText = (text) => {
    if (window.speechSynthesis) {
      const settings = getSettings();
      const voiceURI = settings.selectedVoiceURI || selectedVoiceURI;
      const voice = voices.find(v => v.voiceURI === voiceURI) || voices.find(v => v.voiceURI === selectedVoiceURI);
      if (!voice && voices.length > 0) {
        // Try default if selected voice not found
        const defaultVoice = voices.find(v => v.lang === 'ne-NP') || voices.find(v => v.lang === 'hi-IN');
        if (defaultVoice) {
          const utter = new window.SpeechSynthesisUtterance(text);
          utter.voice = defaultVoice;
          utter.lang = defaultVoice.lang;
          utter.rate = 0.85;
          window.speechSynthesis.speak(utter);
        }
        return;
      }
      if (!voice) {
        console.warn('No suitable voice found for text-to-speech.');
        return;
      }
      const utter = new window.SpeechSynthesisUtterance(text);
      utter.voice = voice;
      utter.lang = voice.lang;
      utter.rate = 0.85;
      window.speechSynthesis.speak(utter);
    }
  };

  // Example sentences (use currentCard.examples if present, else show a message)
  const examples = currentCard.examples || [];

  return (
    <>
      {/* Unit/Lesson name above the card */}
      <div style={{ textAlign: 'center', marginBottom: '0.5em' }}>
        <span style={{ fontSize: '1.1em', color: '#b48bbd', fontWeight: 500 }}>
          {unit} — {lesson.title}
        </span>
      </div>
      <div
        className="p-4 border rounded-lg shadow"
        style={{
          minHeight: '340px',
          width: '420px',
          maxWidth: '100%',
          margin: '0 auto',
          position: 'relative',
          perspective: '800px',
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Flip card container */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            margin: 'auto',
            width: '100%',
            height: '100%',
            minHeight: '340px',
            transition: 'transform 0.6s cubic-bezier(.4,2,.6,1)',
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'none',
            transformOrigin: '50% 50%',
          }}
        >
          {/* Card front */}
          <div
            style={{
              position: 'absolute',
              width: '420px',
              height: '100%',
              backfaceVisibility: 'hidden',
              background: '#fff8fa',
              borderRadius: '24px',
              boxShadow: '0 4px 24px rgba(219,112,147,0.08)',
              padding: '1.6em 2.2em 1.6em 2.2em',
              minHeight: '340px',
              zIndex: 1,
              display: flipped ? 'none' : 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.2em',
            }}
          >
            {/* Flip button in top-left inside card */}
            <button
              onClick={() => setFlipped(f => !f)}
              className="minimal-btn"
              style={{
                position: 'absolute',
                top: 18,
                left: 18,
                width: 44,
                height: 44,
                minWidth: 44,
                minHeight: 44,
                maxWidth: 44,
                maxHeight: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid #222',
                borderRadius: '8px',
                background: 'none',
                boxShadow: 'none',
                outline: 'none',
                padding: 0,
                cursor: 'pointer',
                zIndex: 3,
              }}
              title="Flip card"
            >
              <FiRotateCw size={28} color="#222" />
            </button>
            {/* Centered content */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              {/* Term row: term center, play right */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.7em', marginBottom: '0.2em' }}>
                <p className="font-bold text-3xl" style={{ margin: 0 }}>{currentCard.term}</p>
                <button
                  aria-label="Play pronunciation"
                  onClick={() => speakText(currentCard.term)}
                  className="minimal-btn"
                  style={{
                    width: 44,
                    height: 44,
                    minWidth: 44,
                    minHeight: 44,
                    maxWidth: 44,
                    maxHeight: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid #222',
                    borderRadius: '8px',
                    background: 'none',
                    boxShadow: 'none',
                    outline: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    marginLeft: '0.2em',
                  }}
                  title="Play pronunciation"
                >
                  <FiVolume2 size={32} color="#222" />
                </button>
              </div>
              {currentCard.transliteration && showTransliteration && (
                <p className="transliteration" style={{ textAlign: 'center', margin: 0 }}>{currentCard.transliteration}</p>
              )}
              {currentCard.phoneme && (
                <p className="phoneme" style={{ textAlign: 'center', margin: 0, marginBottom: '0.6em' }}>/{currentCard.phoneme}/</p>
              )}
              <p className="definition" style={{ textAlign: 'center', margin: 0 }}>{currentCard.definition}</p>
            </div>
            {/* Navigation buttons at the bottom, spaced apart, icons only */}
            <div style={{ display: 'flex', gap: '1.2rem', marginTop: 'auto', width: '100%', justifyContent: 'space-between' }}>
              <button
                className="minimal-btn"
                onClick={prevCard}
                disabled={currentIndex === 0}
                style={{
                  opacity: currentIndex === 0 ? 0.5 : 1,
                  width: 44,
                  height: 44,
                  minWidth: 44,
                  minHeight: 44,
                  maxWidth: 44,
                  maxHeight: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #222',
                  borderRadius: '8px',
                  background: 'none',
                  boxShadow: 'none',
                  outline: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
                aria-label="Previous"
              >
                <FiChevronLeft size={32} />
              </button>
              <button
                className="minimal-btn"
                onClick={nextCard}
                style={{
                  width: 44,
                  height: 44,
                  minWidth: 44,
                  minHeight: 44,
                  maxWidth: 44,
                  maxHeight: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #222',
                  borderRadius: '8px',
                  background: 'none',
                  boxShadow: 'none',
                  outline: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
                aria-label="Next"
              >
                <FiChevronRight size={32} />
              </button>
            </div>
          </div>
          {/* Card back (identical size/layout, flip button in same spot) */}
          <div
            style={{
              position: 'absolute',
              width: '420px',
              height: '100%',
              backfaceVisibility: 'hidden',
              background: '#fff8fa',
              borderRadius: '24px',
              boxShadow: '0 4px 24px rgba(219,112,147,0.08)',
              padding: '1.6em 2.2em 1.6em 2.2em',
              minHeight: '340px',
              zIndex: 2,
              transform: 'rotateY(180deg)',
              display: flipped ? 'flex' : 'none',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.2em',
            }}
          >
            {/* Flip button in top-left inside card (back) */}
            <button
              onClick={() => setFlipped(f => !f)}
              className="minimal-btn"
              style={{
                position: 'absolute',
                top: 18,
                left: 18,
                width: 44,
                height: 44,
                minWidth: 44,
                minHeight: 44,
                maxWidth: 44,
                maxHeight: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid #222',
                borderRadius: '8px',
                background: 'none',
                boxShadow: 'none',
                outline: 'none',
                padding: 0,
                cursor: 'pointer',
                zIndex: 3,
              }}
              title="Flip card"
            >
              <FiRotateCw size={28} color="#222" />
            </button>
            <div style={{ minHeight: '120px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', width: '100%' }}>
              <h3 style={{ color: '#db7093', fontWeight: 700, fontSize: '1.1em', marginBottom: '0.7em' }}>Example Sentences</h3>
              {examples.length === 0 ? (
                <p style={{ color: '#888', fontStyle: 'italic' }}>No example sentences available.</p>
              ) : (
                examples.map((ex, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.7em', gap: '0.5em' }}>
                    <span style={{ fontSize: '1.08em' }}>{ex}</span>
                    <button
                      aria-label={`Play example sentence ${i+1}`}
                      onClick={() => speakText(ex)}
                      className="minimal-btn"
                      style={{
                        padding: '6px',
                        border: '1.5px solid #222',
                        borderRadius: '8px',
                        background: 'none',
                        boxShadow: 'none',
                        outline: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        marginLeft: '0.2em',
                      }}
                      title="Play example sentence"
                    >
                      <FiVolume2 size={18} color="#222" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const LessonTransition = ({ message, onNext }) => (
  <div className="p-4 border rounded-lg shadow text-center">
    <h2 className="text-xl font-bold">{message}</h2>
    <button
      className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
      onClick={onNext}
    >
      Continue
    </button>
  </div>
);

const vocabUnitNames = Object.keys(lessons);
const alphabetUnitNames = alphabetLessons ? Object.keys(alphabetLessons) : [];

const App = () => {
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    currentSection,
    unitIndex,
    lessonIndex,
    showTransition,
    showMatching,
    showGrammar,
    cultureCategory,
    setCurrentSection,
    setUnitIndex,
    setLessonIndex,
    setCultureCategory,
    goHome,
    goToNextLesson,
    continueToNext,
    handleMatchingComplete,
    handleGrammarComplete
  } = useAppState();

  const unitNames =
    currentSection === "Vocab" ? vocabUnitNames : alphabetUnitNames;
  const currentUnit =
    unitIndex !== null
      ? currentSection === "Vocab"
        ? vocabUnitNames[unitIndex]
        : alphabetUnitNames[unitIndex]
      : null;
  const currentLesson = currentUnit
    ? currentSection === "Vocab"
      ? lessons[currentUnit][lessonIndex]
      : { title: currentUnit, flashcards: alphabetLessons[currentUnit] }
    : null;

  return (
    <div className="app-container p-4">
      {showSettings ? (
        <SettingsPage onBack={() => setShowSettings(false)} />
      ) : currentSection === null ? (
        <MainMenu onSelectSection={setCurrentSection} />
      ) : currentSection === "Culture" ? (
        cultureCategory === null ? (
          <CultureMenu onSelectCategory={setCultureCategory} />
        ) : (
          <CulturePage
            category={cultureCategory}
            onBack={() => setCultureCategory(null)}
          />
        )
      ) : currentSection === "Grammar" ? (
        <GrammarSection onComplete={handleGrammarComplete} />
      ) : unitIndex === null ? (
        <Menu units={unitNames} onSelect={setUnitIndex} />
      ) : showTransition ? (
        <LessonTransition
          message="Great job! Ready for the next lesson?"
          onNext={() => continueToNext(unitNames, currentUnit)}
        />
      ) : currentSection === "Vocab" && showMatching ? (
        <UnifiedMatchingSection
          flashcards={filterVisibleVocabulary(lessons[currentUnit].flatMap(l => l.flashcards))}
          onComplete={() => handleMatchingComplete(unitNames)}
          type="vocab"
        />
      ) : currentSection === "Read/Write" && showMatching ? (
        <UnifiedMatchingSection
          flashcards={alphabetLessons[currentUnit]}
          onComplete={() => handleMatchingComplete(unitNames)}
          type="alphabet"
        />
      ) : currentSection === "Vocab" ? (
        <Lesson
          unit={currentUnit}
          lesson={{...currentLesson, flashcards: filterVisibleVocabulary(currentLesson.flashcards)}}
          onComplete={goToNextLesson}
        />
      ) : (
        <Flashcards
          unit={currentUnit}
          lessonData={currentLesson.flashcards}
          onComplete={goToNextLesson}
          type="alphabet"
        />
      )}
      {showSettings ? (
        <button
          onClick={() => {
            setShowSettings(false);
            goHome();
          }}
          className="home-fab"
          aria-label="Go Home"
        >
          <FiHome size={28} />
        </button>
      ) : (
        <>
          <HomeButton currentSection={currentSection} goHome={goHome} />
          <SettingsButton 
            onClick={() => setShowSettings(true)} 
            isHomeButtonVisible={currentSection !== null}
          />
        </>
      )}
    </div>
  );
};

export default App;
