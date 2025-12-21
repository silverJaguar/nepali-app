import React, { useState, useEffect } from "react";
import { FiChevronLeft } from "react-icons/fi";
import { getSettings, updateSetting } from "./utils/settings";

const SettingsPage = ({ onBack }) => {
  const [settings, setSettings] = useState(getSettings());
  const [voices, setVoices] = useState([]);
  const [notificationPermission, setNotificationPermission] = useState('default');

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const filtered = allVoices.filter(v => v.lang === 'ne-NP' || v.lang === 'hi-IN');
      setVoices(filtered);
      
      // If no voice is set, set default
      if (!settings.selectedVoiceURI && filtered.length > 0) {
        const defaultVoice = filtered.find(v => v.lang === 'ne-NP')
          || filtered.find(v => v.lang === 'hi-IN');
        if (defaultVoice) {
          const updated = updateSetting('selectedVoiceURI', defaultVoice.voiceURI);
          setSettings(updated);
        }
      }
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleVoiceChange = (voiceURI) => {
    const updated = updateSetting('selectedVoiceURI', voiceURI);
    setSettings(updated);
  };

  const handleShowTransliterationChange = (show) => {
    const updated = updateSetting('showTransliteration', show);
    setSettings(updated);
  };

  const handleNotificationToggle = async (enabled) => {
    if (enabled && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission !== 'granted') {
          alert('Notifications are disabled. Please enable them in your browser settings.');
          return;
        }
      }
      if (Notification.permission === 'granted') {
        const updated = updateSetting('notificationsEnabled', true);
        setSettings(updated);
        
        // Schedule notification (basic implementation)
        scheduleNotification(updated.notificationTime);
      }
    } else {
      const updated = updateSetting('notificationsEnabled', false);
      setSettings(updated);
    }
  };

  const handleNotificationTimeChange = (time) => {
    const updated = updateSetting('notificationTime', time);
    setSettings(updated);
    if (updated.notificationsEnabled) {
      scheduleNotification(time);
    }
  };

  const scheduleNotification = (time) => {
    // Cancel existing notifications
    if (window.notificationIds) {
      window.notificationIds.forEach(id => clearInterval(id));
    }
    
    if (!window.notificationIds) {
      window.notificationIds = [];
    }

    // Simple daily notification scheduling
    // Note: This is a basic implementation. For production, consider using a service worker
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const scheduled = new Date();
    scheduled.setHours(hours, minutes, 0, 0);
    
    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
    
    const msUntilNotification = scheduled - now;
    
    const timeoutId = setTimeout(() => {
      const currentSettings = getSettings();
      if (currentSettings.notificationsEnabled && Notification.permission === 'granted') {
        new Notification('Time to practice!', {
          body: 'Keep up your Nepali learning streak!',
          icon: '/favicon.ico'
        });
        
        // Schedule next day
        scheduleNotification(time);
      }
    }, msUntilNotification);
    
    window.notificationIds.push(timeoutId);
  };

  return (
    <div className="p-4 border rounded-lg shadow" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <button
          onClick={onBack}
          className="minimal-btn"
          style={{
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1.5px solid #222',
            borderRadius: '8px',
            background: 'none',
            marginRight: '1rem',
            cursor: 'pointer',
          }}
          aria-label="Back"
        >
          <FiChevronLeft size={28} />
        </button>
        <h2 className="text-xl font-bold">Settings</h2>
      </div>

      {/* Voice Selection */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', color: '#db7093' }}>
          Pronunciation Voice
        </h3>
        <div className="voice-selector" style={{ marginBottom: '0.5rem' }}>
          <label htmlFor="settings-voice-select" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            Voice for word and letter pronunciation:
          </label>
          <select
            id="settings-voice-select"
            value={settings.selectedVoiceURI}
            onChange={e => handleVoiceChange(e.target.value)}
            disabled={voices.length === 0}
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '1rem',
              border: '2px solid #a6c1ee',
              borderRadius: '8px',
              background: '#f7faff',
            }}
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
      </div>

      {/* Show/Hide Transliteration */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', color: '#db7093' }}>
          Display Options
        </h3>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.showTransliteration}
            onChange={e => handleShowTransliterationChange(e.target.checked)}
            style={{
              width: '20px',
              height: '20px',
              marginRight: '0.75rem',
              cursor: 'pointer',
            }}
          />
          <span style={{ fontSize: '1rem', fontWeight: 500 }}>
            Show transliteration (e.g., "namaste")
          </span>
        </label>
      </div>

      {/* Daily Practice Reminders */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', color: '#db7093' }}>
          Daily Practice Reminders
        </h3>
        <label style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.notificationsEnabled}
            onChange={e => handleNotificationToggle(e.target.checked)}
            disabled={notificationPermission === 'denied'}
            style={{
              width: '20px',
              height: '20px',
              marginRight: '0.75rem',
              cursor: notificationPermission === 'denied' ? 'not-allowed' : 'pointer',
            }}
          />
          <span style={{ fontSize: '1rem', fontWeight: 500 }}>
            Enable daily practice reminders
          </span>
        </label>
        {notificationPermission === 'denied' && (
          <p style={{ color: '#d32f2f', fontSize: '0.9rem', marginTop: '0.5rem', marginLeft: '2rem' }}>
            Notifications are blocked. Please enable them in your browser settings.
          </p>
        )}
        {settings.notificationsEnabled && (
          <div style={{ marginLeft: '2rem', marginTop: '0.75rem' }}>
            <label htmlFor="notification-time" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Reminder time:
            </label>
            <input
              id="notification-time"
              type="time"
              value={settings.notificationTime}
              onChange={e => handleNotificationTimeChange(e.target.value)}
              style={{
                padding: '0.5rem',
                fontSize: '1rem',
                border: '2px solid #a6c1ee',
                borderRadius: '8px',
                background: '#f7faff',
              }}
            />
          </div>
        )}
      </div>

      {/* Credits */}
      <div>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', color: '#db7093' }}>
          Credits
        </h3>
        <p style={{ color: '#888', fontStyle: 'italic' }}>
          Credits section coming soon...
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;

