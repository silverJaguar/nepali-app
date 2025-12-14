import React, { useState } from "react";
import { shuffle } from "../utils/helpers";

const UnifiedMatchingSection = ({ flashcards, onComplete, type = 'vocab' }) => {
  // Prepare pairs based on type
  const pairs = type === 'alphabet' 
    ? flashcards.map(card => ({
        left: card.letter,
        right: `${card.transliteration} — ${card.description}`,
        key: card.letter
      }))
    : flashcards.map(card => ({
        left: card.term,
        right: card.definition,
        key: card.term,
        transliteration: card.transliteration
      }));

  const [left, setLeft] = useState(pairs);
  const [right, setRight] = useState(() => shuffle(pairs.map(p => p.right)));
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [matches, setMatches] = useState([]);

  const handleLeftClick = idx => {
    setSelectedLeft(idx);
    if (selectedRight !== null) {
      checkMatch(idx, selectedRight);
    }
  };

  const handleRightClick = idx => {
    setSelectedRight(idx);
    if (selectedLeft !== null) {
      checkMatch(selectedLeft, idx);
    }
  };

  const checkMatch = (leftIdx, rightIdx) => {
    const leftItem = left[leftIdx];
    const rightItem = right[rightIdx];
    if (leftItem.right === rightItem) {
      setMatches([...matches, leftItem.right]);
      setSelectedLeft(null);
      setSelectedRight(null);
      if (matches.length + 1 === left.length && onComplete) {
        setTimeout(onComplete, 600);
      }
    } else {
      setTimeout(() => {
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 700);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow" style={{ maxWidth: 500, margin: '2em auto', background: '#fff8fa' }}>
      <h2 className="text-xl font-bold mb-2" style={{ color: '#b48bbd' }}>Matching</h2>
      <div style={{ display: 'flex', gap: '2em', justifyContent: 'center' }}>
        <div style={{ flex: 1 }}>
          {left.map((item, idx) => (
            <button
              key={item.key}
              className="pastel-button"
              style={{
                margin: '0.3em 0',
                width: '100%',
                background: matches.includes(item.right) ? '#d1ffd6' : selectedLeft === idx ? '#a6c1ee' : undefined,
                color: '#222',
                fontWeight: 500
              }}
              disabled={matches.includes(item.right)}
              onClick={() => handleLeftClick(idx)}
            >
              <span style={{ fontSize: '1.15em', fontWeight: 700 }}>{item.left}</span>
              {type === 'vocab' && item.transliteration && (
                <span style={{ fontSize: '0.95em', color: '#888', marginLeft: 8 }}>({item.transliteration})</span>
              )}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          {right.map((rightItem, idx) => (
            <button
              key={rightItem}
              className="pastel-button"
              style={{
                margin: '0.3em 0',
                width: '100%',
                background: matches.includes(rightItem) ? '#d1ffd6' : selectedRight === idx ? '#a6c1ee' : undefined,
                color: '#222',
                fontWeight: 500
              }}
              disabled={matches.includes(rightItem)}
              onClick={() => handleRightClick(idx)}
            >
              {rightItem}
            </button>
          ))}
        </div>
      </div>
      {matches.length === left.length && (
        <div style={{ marginTop: '1.5em', color: '#2e7d32', fontWeight: 600, fontSize: '1.1em' }}>
          All matched! 🎉
        </div>
      )}
    </div>
  );
};

export default UnifiedMatchingSection;
