import React, { useState, useEffect } from "react";
import { FiVolume2, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const Flashcards = ({ unit, lessonData, onComplete, type }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const currentCard = lessonData[currentIndex];

  // Load voices on mount
  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      // Only Nepali or Hindi voices
      const filtered = allVoices.filter(v => v.lang === 'ne-NP' || v.lang === 'hi-IN');
      setVoices(filtered);
      let defaultVoice = filtered.find(v => v.lang === 'ne-NP')
        || filtered.find(v => v.lang === 'hi-IN');
      if (defaultVoice) setSelectedVoiceURI(defaultVoice.voiceURI);
      else setSelectedVoiceURI('');
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Text-to-speech for letter (if available)
  const speakText = (text) => {
    if (window.speechSynthesis) {
      const voice = voices.find(v => v.voiceURI === selectedVoiceURI);
      const utter = new window.SpeechSynthesisUtterance(text);
      if (voice) {
        utter.voice = voice;
        utter.lang = voice.lang;
      }
      utter.rate = 0.85;
      window.speechSynthesis.speak(utter);
    }
  };

  const nextCard = () => {
    if (currentIndex < lessonData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <>
      {/* Unit name above the card */}
      <div style={{ textAlign: 'center', marginBottom: '0.5em' }}>
        <span style={{ fontSize: '1.1em', color: '#b48bbd', fontWeight: 500 }}>{unit}</span>
      </div>
      <div
        className="p-4 border rounded-lg shadow"
        style={{
          minHeight: '270px',
          width: '370px',
          maxWidth: '100%',
          margin: '0 auto',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          {/* Letter row: letter center, play right */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.7em', marginBottom: '0.2em' }}>
            <p className="font-bold text-3xl" style={{ margin: 0 }}>{currentCard.letter}</p>
            <button
              aria-label="Play pronunciation"
              onClick={() => speakText(currentCard.letter)}
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
          {currentCard.transliteration && (
            <p className="transliteration" style={{ textAlign: 'center', margin: 0 }}>{currentCard.transliteration}</p>
          )}
          {currentCard.description && (
            <p className="definition" style={{ textAlign: 'center', margin: '0.6em 0 0 0' }}>{currentCard.description}</p>
          )}
          {/* Voice selector below main content, centered */}
          <div className="voice-selector" style={{ alignSelf: 'center', marginTop: '0.5em', marginBottom: '0.5em' }}>
            <label htmlFor="voice-select">Voice:</label>
            <select
              id="voice-select"
              value={selectedVoiceURI}
              onChange={e => setSelectedVoiceURI(e.target.value)}
              disabled={voices.length === 0}
            >
              {voices.length === 0 ? (
                <option>No Nepali or Hindi voices available</option>
              ) : (
                voices.map(v => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))
              )}
            </select>
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
      </div>
    </>
  );
};

export default Flashcards;
