import { useState, useEffect } from 'react';

export const useVoiceManager = () => {
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');

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

  const speakText = (text) => {
    if (window.speechSynthesis) {
      const voice = voices.find(v => v.voiceURI === selectedVoiceURI);
      if (!voice) {
        alert('No suitable voice found for text-to-speech.');
        return;
      }
      const utter = new window.SpeechSynthesisUtterance(text);
      utter.voice = voice;
      utter.lang = voice.lang;
      utter.rate = 0.85;
      window.speechSynthesis.speak(utter);
    }
  };

  return {
    voices,
    selectedVoiceURI,
    setSelectedVoiceURI,
    speakText
  };
};
