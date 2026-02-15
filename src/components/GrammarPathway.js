import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  FiInfo, 
  FiPlay, 
  FiX
} from 'react-icons/fi';

// DEV MODE: Set to true to unlock all activities for development/testing
const DEV_MODE = true; // TODO: Disabled for development - set to false for production

// Custom icons as simple SVG components
const HammerIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 12l-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 010-3L12 9" />
    <path d="M17.64 15L22 10.64" />
    <path d="M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 00-3.94-1.64H9l.92.82A6.18 6.18 0 0112 8.4v1.56l2 2h2.47l2.26 1.91" />
  </svg>
);

const QuizIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8" cy="9" r="1.5" fill={color} />
    <line x1="12" y1="9" x2="18" y2="9" />
    <circle cx="8" cy="15" r="1.5" fill={color} />
    <line x1="12" y1="15" x2="18" y2="15" />
  </svg>
);

const MagnifyIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const PencilIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const StarIcon = ({ filled, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#fbbf24' : 'none'} stroke={filled ? '#fbbf24' : '#d1d5db'} strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// Activity types with their icons
const ACTIVITY_TYPES = {
  sentence_building: {
    icon: HammerIcon,
    label: 'Build',
    color: '#f59e0b',
    bgColor: '#fef3c7',
  },
  quiz: {
    icon: QuizIcon,
    label: 'Quiz',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
  },
  identify_grammar: {
    icon: MagnifyIcon,
    label: 'Identify',
    color: '#3b82f6',
    bgColor: '#dbeafe',
  },
  fill_blank: {
    icon: PencilIcon,
    label: 'Fill Blank',
    color: '#10b981',
    bgColor: '#d1fae5',
  },
};

export const UnitInfoModal = ({ unit, onClose }) => {
  const openedAtRef = useRef(Date.now());
  const handleOverlayClick = () => {
    const elapsed = Date.now() - openedAtRef.current;
    if (elapsed < 300) return; // Ignore overlay clicks for 300ms
    onClose();
  };
  return (
    <div
      className="pathway-modal-overlay"
      onClick={handleOverlayClick}
    >
      <div
        className="pathway-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="pathway-modal-close" onClick={onClose}>
          <FiX size={20} />
        </button>
        <h3 className="pathway-modal-title">{unit.name}</h3>
        <p className="pathway-modal-description">{unit.description}</p>
        <div className="pathway-modal-rules">
          <h4>Grammar Rules:</h4>
          {unit.rules?.map((rule, idx) => (
            <div key={idx} className="pathway-modal-rule">
              <strong>{rule.title}</strong>
              <code>{rule.rule}</code>
              {rule.examples?.slice(0, 2).map((ex, exIdx) => (
                <div key={exIdx} className="pathway-modal-example">
                  <span className="nepali">{ex.nepali}</span>
                  <span className="english">{ex.natural}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const GrammarPathway = ({ 
  unit, 
  activities, 
  progress, 
  onSelectActivity,
  onNextUnit,
  hasNextUnit 
}) => {
  const [showInfo, setShowInfo] = useState(false);
  
  // Calculate which activities are unlocked
  const getActivityState = (activityIndex) => {
    const activityProgress = progress?.activities?.[activityIndex];
    const isCompleted = activityProgress?.completed || false;
    const stars = activityProgress?.stars || 0;
    
    // DEV_MODE: Unlock all activities for development/testing
    if (DEV_MODE) {
      return { isLocked: false, isCompleted, stars, isActive: !isCompleted };
    }
    
    if (activityIndex === 0) {
      return { isLocked: false, isCompleted, stars, isActive: !isCompleted };
    }
    
    const prevProgress = progress?.activities?.[activityIndex - 1];
    const prevCompleted = prevProgress?.completed || false;
    
    return {
      isLocked: !prevCompleted,
      isCompleted,
      stars,
      isActive: prevCompleted && !isCompleted
    };
  };
  
  // Reverse for bottom-to-top display
  const reversedActivities = [...activities].reverse();
  
  // Check if all activities are completed for the "Next Unit" button
  // DEV_MODE: Allow skipping to next unit without completing all activities
  const allCompleted = DEV_MODE ? true : activities.every((_, idx) => getActivityState(idx).isCompleted);

  return (
    <div className="pathway-container">
      {/* Header */}
      <div className="pathway-header">
        <button 
          type="button"
          className="pathway-info-btn"
          onClick={(e) => { e.stopPropagation(); setTimeout(() => setShowInfo(true), 0); }}
          aria-label="Unit information"
        >
          <FiInfo size={20} />
        </button>
        <h2 className="pathway-unit-name">{unit.name}</h2>
      </div>
      
      {/* Pathway Track */}
      <div className="pathway-track">
        {reversedActivities.map((activity, displayIndex) => {
          const actualIndex = activities.length - 1 - displayIndex;
          const state = getActivityState(actualIndex);
          const config = ACTIVITY_TYPES[activity.type];
          const IconComponent = config?.icon || QuizIcon;
          const isLeft = displayIndex % 2 === 0;
          
          return (
            <div 
              key={activity.id}
              className={`pathway-node ${isLeft ? 'pathway-node-left' : 'pathway-node-right'}`}
            >
              {/* Connector line */}
              {displayIndex < activities.length - 1 && (
                <div 
                  className="pathway-connector-line"
                  style={{
                    background: state.isCompleted ? 'linear-gradient(180deg, #db7093, #b48bbd)' : '#e0e7ff'
                  }}
                />
              )}
              
              {/* Node circle button */}
              <button
                className={`pathway-node-btn ${state.isActive ? 'active' : ''} ${state.isCompleted ? 'completed' : ''} ${state.isLocked ? 'locked' : ''}`}
                style={{
                  '--activity-color': config?.color || '#888',
                  '--activity-bg': config?.bgColor || '#f3f4f6',
                  borderColor: state.isLocked ? '#d1d5db' : config?.color,
                  background: state.isCompleted ? config?.color : config?.bgColor,
                }}
                onClick={() => !state.isLocked && onSelectActivity(activity, actualIndex)}
                disabled={state.isLocked}
              >
                <IconComponent 
                  size={28} 
                  color={state.isLocked ? '#9ca3af' : (state.isCompleted ? 'white' : config?.color)} 
                />
              </button>
              
              {/* Stars */}
              <div className="pathway-stars">
                {[0, 1, 2].map(starIdx => (
                  <StarIcon key={starIdx} filled={starIdx < state.stars} size={16} />
                ))}
              </div>
              
              {/* Label */}
              <span className={`pathway-node-label ${state.isLocked ? 'locked' : ''}`}>
                {config?.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Next Unit Button */}
      {hasNextUnit && (
        <div className="pathway-next-unit">
          <button 
            className="pathway-next-btn"
            onClick={onNextUnit}
            disabled={!allCompleted}
          >
            <span>Next Unit</span>
            <FiPlay size={18} />
          </button>
        </div>
      )}
      
      {/* Info Modal - rendered via portal to document.body (no AnimatePresence - was preventing modal from showing) */}
      {showInfo &&
        ReactDOM.createPortal(
          <UnitInfoModal unit={unit} onClose={() => setShowInfo(false)} />,
          document.body
        )}
    </div>
  );
};

export default GrammarPathway;
