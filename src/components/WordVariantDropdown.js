import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { getSettings } from '../utils/settings';

/**
 * WordVariantDropdown component for selecting verb forms or gender variants
 * 
 * @param {Object} word - The word object with variants
 * @param {Function} onSelectVariant - Callback when a variant is selected (variant, originalWord)
 * @param {Function} onSelectWord - Callback when word is clicked/selected
 * @param {string} selectedVariant - Currently selected variant term
 * @param {boolean} isSelected - Whether the word is currently selected
 */
const WordVariantDropdown = ({ word, onSelectVariant, onSelectWord, selectedVariant, isSelected }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTransliteration, setShowTransliteration] = useState(() => getSettings().showTransliteration);
  const dropdownRef = useRef(null);

  // Update transliteration display when settings change
  useEffect(() => {
    const checkSettings = () => {
      setShowTransliteration(getSettings().showTransliteration);
    };
    checkSettings();
    window.addEventListener('settingsChanged', checkSettings);
    window.addEventListener('storage', checkSettings);
    return () => {
      window.removeEventListener('settingsChanged', checkSettings);
      window.removeEventListener('storage', checkSettings);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Get the display term (selected variant or default)
  const displayTerm = selectedVariant || word.term;
  
  // Find transliteration for selected variant
  let displayTransliteration = word.transliteration;
  if (selectedVariant && word.verb_forms) {
    Object.values(word.verb_forms).forEach(forms => {
      const found = forms.find(f => f.term === selectedVariant);
      if (found && found.transliteration) displayTransliteration = found.transliteration;
    });
  }
  if (selectedVariant && word.gender_variants) {
    const found = word.gender_variants.find(v => v.term === selectedVariant);
    if (found && found.transliteration) displayTransliteration = found.transliteration;
  }

  // Check if word has variants
  const hasVerbForms = word.verb_forms && Object.keys(word.verb_forms).length > 0;
  const hasGenderVariants = word.gender_variants && word.gender_variants.length > 0;
  
  if (!hasVerbForms && !hasGenderVariants) {
    return null; // No variants, don't show dropdown
  }

  const handleButtonClick = (e) => {
    e.stopPropagation();
    if (!isSelected) {
      // First click: select word and open dropdown
      if (onSelectWord) {
        onSelectWord(word);
      }
      setIsOpen(true);
    } else if (isOpen) {
      // If dropdown is open, close it
      setIsOpen(false);
    } else {
      // If selected but dropdown closed, click again to deselect (like regular buttons)
      if (onSelectWord) {
        onSelectWord(word);
      }
    }
  };

  const handleVariantSelect = (variant) => {
    if (onSelectVariant) {
      onSelectVariant(variant.term, word);
    }
    setIsOpen(false);
  };

  // Render verb forms grouped by tense/aspect
  const renderVerbForms = () => {
    if (!hasVerbForms) return null;

    return Object.entries(word.verb_forms).map(([group, forms]) => (
      <div key={group}>
        <div className="text-xs font-semibold text-gray-600 px-3 py-1.5 bg-gray-50 border-b border-gray-200">
          {group}
        </div>
        {forms.map((form, idx) => (
          <button
            key={idx}
            onClick={() => handleVariantSelect(form)}
            className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 transition-colors ${
              selectedVariant === form.term ? 'bg-blue-50 font-semibold' : ''
            }`}
          >
            <div className="font-medium">{form.term}</div>
            {form.transliteration && showTransliteration && (
              <div className="text-xs text-gray-600">{form.transliteration}</div>
            )}
          </button>
        ))}
      </div>
    ));
  };

  // Render gender variants (including base word)
  const renderGenderVariants = () => {
    if (!hasGenderVariants) return null;

    return (
      <>
        {/* Base word option */}
        <button
          onClick={() => handleVariantSelect({ term: word.term, transliteration: word.transliteration })}
          className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 transition-colors ${
            (!selectedVariant || selectedVariant === word.term) ? 'bg-blue-50 font-semibold' : ''
          }`}
        >
          <div className="font-medium">{word.term}</div>
          {word.transliteration && showTransliteration && (
            <div className="text-xs text-gray-600">{word.transliteration}</div>
          )}
        </button>
        {/* Gender variant options */}
        {word.gender_variants.map((variant, idx) => (
          <button
            key={idx}
            onClick={() => handleVariantSelect(variant)}
            className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 transition-colors ${
              selectedVariant === variant.term ? 'bg-blue-50 font-semibold' : ''
            }`}
          >
            <div className="font-medium">{variant.term}</div>
            {variant.transliteration && showTransliteration && (
              <div className="text-xs text-gray-600">{variant.transliteration}</div>
            )}
          </button>
        ))}
      </>
    );
  };

  return (
    <div ref={dropdownRef} style={{ display: 'inline-block', position: 'relative' }}>
      <button
        onClick={handleButtonClick}
        className={`p-3 border rounded text-sm transition-colors ${
          isSelected
            ? 'bg-blue-100 border-blue-300'
            : 'bg-white border-gray-300 hover:bg-gray-50'
        }`}
        style={{
          display: 'inline-block',
          width: 'auto',
          fontWeight: 600,
          marginBottom: '0.5em',
          padding: '0.42em 0.75em',
          paddingRight: '1.4em',
          cursor: 'pointer',
          transition: 'background 0.18s, border 0.18s, color 0.18s',
          textAlign: 'center',
          verticalAlign: 'middle',
          whiteSpace: 'nowrap',
          position: 'relative'
        }}
      >
        <div className="font-medium">{displayTerm}</div>
        {showTransliteration && (
          <div className="text-xs text-gray-600">{displayTransliteration}</div>
        )}
        <FiChevronDown 
          style={{ 
            position: 'absolute',
            width: '8px',
            height: '8px',
            right: '0.25em',
            bottom: '0.15em',
            color: '#999',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            pointerEvents: 'none'
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            minWidth: '100px',
            maxHeight: '180px',
            overflowY: 'auto',
            top: '100%',
            left: 0,
            marginTop: '2px',
            zIndex: 10000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          {renderVerbForms()}
          {renderGenderVariants()}
        </div>
      )}
    </div>
  );
};

export default WordVariantDropdown;

