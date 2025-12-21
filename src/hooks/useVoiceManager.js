import { useState, useEffect } from 'react';
import { getSettings } from '../utils/settings';

export const useVoiceManager = () => {
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');

  useEffect(() => {
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
    
    // Listen for storage changes (when settings are updated)
    const handleStorageChange = () => {
      loadVoices();
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const speakText = (text) => {
    if (window.speechSynthesis) {
      // Get latest settings in case they changed
      const settings = getSettings();
      const voiceURI = settings.selectedVoiceURI || selectedVoiceURI;
      const voice = voices.find(v => v.voiceURI === voiceURI);
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

  return {
    voices,
    selectedVoiceURI,
    setSelectedVoiceURI,
    speakText
  };
};
