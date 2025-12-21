// Settings management utility
const SETTINGS_KEY = 'nepaliAppSettings';

const defaultSettings = {
  selectedVoiceURI: '', // Will be set from available voices
  showTransliteration: true, // Controls regular transliteration (e.g., "namaste"), not phonetic
  notificationsEnabled: false,
  notificationTime: '09:00' // Default 9 AM
};

export const getSettings = () => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error loading settings:', e);
  }
  return defaultSettings;
};

export const saveSettings = (settings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
};

export const updateSetting = (key, value) => {
  const current = getSettings();
  const updated = { ...current, [key]: value };
  saveSettings(updated);
  // Dispatch custom event for same-tab updates
  window.dispatchEvent(new CustomEvent('settingsChanged', { detail: updated }));
  return updated;
};

