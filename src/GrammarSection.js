import React, { useState, useEffect } from 'react';
import SentenceConstruction from './SentenceConstruction';
import { FiArrowLeft } from "react-icons/fi";
import MinimalButton from './components/MinimalButton';

const grammarUnits = [
  {
    id: 1,
    name: 'Unit 1: Basic Sentences',
    description: 'Simple identity, adjective, possession, and existence sentences.',
    rules: [
      {
        title: 'Identity (A is B, noun)',
        rule: 'A B हो (A B ho)',
        examples: [
          { nepali: 'ऊ शिक्षक हो।', literal: 'He teacher is', natural: 'He is a teacher.' },
          { nepali: 'यो घर हो।', literal: 'This house is', natural: 'This is a house.' },
          { nepali: 'उनी डाक्टर हुन्।', literal: 'She doctor is', natural: 'She is a doctor.' }
        ]
      },
      {
        title: 'Adjective (A is [adjective])',
        rule: 'A [adjective] छ (A [adjective] cha)',
        examples: [
          { nepali: 'केटो अग्लो छ।', literal: 'Boy tall is', natural: 'The boy is tall.' },
          { nepali: 'केटी राम्री छ।', literal: 'Girl beautiful is', natural: 'The girl is beautiful.' },
          { nepali: 'यो मिठो छ।', literal: 'This tasty is', natural: 'This is tasty.' }
        ]
      },
      {
        title: 'Existence (There is [object])',
        rule: '[object] छ, [animate thing] [location] छ or [location] [animate thing] छ ([object] chha)',
        examples: [
          { nepali: 'गाडी छ।', literal: 'Car is', natural: 'There is a car.' },
          { nepali: 'किताब छ।', literal: 'Book is', natural: 'There is a book.' }
        ]
      },
      {
        title: 'Possession (A has B)',
        rule: 'A सङ्ग B छ (A sanga B cha)',
        examples: [
          { nepali: 'केटासङ्ग गाडी छ।', literal: 'Boy-with car is', natural: 'The boy has a car.' },
          { nepali: 'केटीसङ्ग किताब छ।', literal: 'Girl-with book is', natural: 'The girl has a book.' }
        ]
      }
    ]
  },
  {
    id: 2,
    name: 'Unit 2: Action Sentences',
    description: 'Present tense action sentences with ergative case.',
    rules: [
      {
        title: 'Present Tense Action (Transitive)',
        rule: 'A ले B [verb-present]',
        examples: [
          { nepali: 'रामले भात खान्छ।', literal: 'Ram-le rice eats', natural: 'Ram eats rice.' },
          { nepali: 'सिताले चिया पिउँछ।', literal: 'Sita-le tea drinks', natural: 'Sita drinks tea.' }
        ]
      }
    ]
  },
  {
    id: 3,
    name: 'Unit 3: Negation',
    description: 'How to form negative sentences.',
    rules: [
      {
        title: 'Negation (not)',
        rule: 'A B होइन (A B hoina)',
        examples: [
          { nepali: 'ऊ शिक्षक होइन।', literal: 'He teacher not-is', natural: 'He is not a teacher.' },
          { nepali: 'उनी डाक्टर होइनन्।', literal: 'She doctor not-is', natural: 'She is not a doctor.' }
        ]
      }
    ]
  }
];

const GrammarMenu = ({ onSelectUnit }) => (
  <div className="p-4 border rounded-lg shadow" style={{ maxWidth: 600, margin: '2em auto', background: '#fff8fa' }}>
    <h2 className="text-xl font-bold mb-4">Grammar Units</h2>
    {grammarUnits.map(unit => (
      <button
        key={unit.id}
        className="pastel-button block w-full my-2"
        onClick={() => onSelectUnit(unit.id)}
      >
        {unit.name}
        <div className="text-xs text-gray-600">{unit.description}</div>
      </button>
    ))}
  </div>
);

const GrammarUnitCard = ({ unit, onStart, onBack }) => (
  <div className="p-4 border rounded-lg shadow" style={{ maxWidth: 600, margin: '2em auto', background: '#fff8fa', position: 'relative' }}>
    {/* Minimalist back button in top-left inside card */}
    <MinimalButton
      onClick={onBack}
      aria-label="Back"
      style={{
        position: 'absolute',
        top: 18,
        left: 18,
        zIndex: 2,
      }}
    >
      <FiArrowLeft size={28} />
    </MinimalButton>
    <h2 className="text-xl font-bold mb-2">{unit.name}</h2>
    <p className="mb-4 text-gray-700">{unit.description}</p>
    <div>
      {unit.rules.map((rule, idx) => (
        <div key={idx} className="grammar-rule-section" style={{ borderTop: idx !== 0 ? '1.5px solid #f3e6f7' : 'none', marginTop: idx !== 0 ? '2.2em' : 0, paddingTop: idx !== 0 ? '1.2em' : 0 }}>
          <h3 className="text-lg font-semibold mb-1">{rule.title}</h3>
          <div className="font-mono mb-1">{rule.rule}</div>
          <div className="text-xs text-gray-600 mb-1">Examples:</div>
          <table className="grammar-rule-table w-full text-sm mb-2">
            <thead>
              <tr>
                <th>Nepali</th>
                <th>Literal</th>
                <th>Natural</th>
              </tr>
            </thead>
            <tbody>
              {rule.examples.map((ex, exIdx) => (
                <tr key={exIdx}>
                  <td>{ex.nepali}</td>
                  <td>{ex.literal}</td>
                  <td>{ex.natural}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
    <div className="text-center mt-4">
      <button
        onClick={onStart}
        className="pastel-button"
        style={{ fontSize: '1.1em', padding: '1em 2em' }}
      >
        Start Sentence Construction
      </button>
    </div>
  </div>
);

const GrammarSection = ({ onComplete }) => {
  const [currentMode, setCurrentMode] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);

  if (!currentMode && !selectedUnit) {
    return <GrammarMenu onSelectUnit={setSelectedUnit} />;
  }

  if (!currentMode && selectedUnit) {
    const unit = grammarUnits.find(u => u.id === selectedUnit);
    return <GrammarUnitCard unit={unit} onStart={() => setCurrentMode('construction')} onBack={() => setSelectedUnit(null)} />;
  }

  return <SentenceConstruction currentUnit={selectedUnit} onComplete={onComplete} />;
};

export default GrammarSection; 