// Grammar Pathway Unit Data
// Each unit has a pathway with different activity types

export const grammarPathwayUnits = [
  {
    id: 1,
    name: 'Unit 1: Basic Sentences',
    description: 'Learn the four fundamental sentence types in Nepali: identity, adjective, existence, and possession.',
    rules: [
      {
        title: 'Identity (A is B)',
        rule: 'A B हो (A B ho)',
        examples: [
          { nepali: 'ऊ शिक्षक हो।', literal: 'He teacher is', natural: 'He is a teacher.' },
          { nepali: 'यो घर हो।', literal: 'This house is', natural: 'This is a house.' },
        ]
      },
      {
        title: 'Adjective (A is [adjective])',
        rule: 'A [adjective] छ (A [adjective] cha)',
        examples: [
          { nepali: 'केटो अग्लो छ।', literal: 'Boy tall is', natural: 'The boy is tall.' },
          { nepali: 'यो मिठो छ।', literal: 'This tasty is', natural: 'This is tasty.' },
        ]
      },
      {
        title: 'Existence (There is...)',
        rule: '[object] छ ([object] chha)',
        examples: [
          { nepali: 'गाडी छ।', literal: 'Car is', natural: 'There is a car.' },
          { nepali: 'किताब छ।', literal: 'Book is', natural: 'There is a book.' },
        ]
      },
      {
        title: 'Possession (A has B)',
        rule: 'A सङ्ग B छ (A sanga B cha)',
        examples: [
          { nepali: 'केटासङ्ग गाडी छ।', literal: 'Boy-with car is', natural: 'The boy has a car.' },
          { nepali: 'केटीसङ्ग किताब छ।', literal: 'Girl-with book is', natural: 'The girl has a book.' },
        ]
      },
    ],
    activities: [
      { type: 'sentence_building', id: 'u1_build' },
      { type: 'quiz', id: 'u1_quiz' },
      { type: 'identify_grammar', id: 'u1_identify' },
      { type: 'fill_blank', id: 'u1_fill' },
    ]
  },
  {
    id: 2,
    name: 'Unit 2: Action Sentences',
    description: 'Learn to construct present tense action sentences with transitive verbs using the ergative case (ले).',
    rules: [
      {
        title: 'Present Tense Transitive',
        rule: 'Subject + ले + Object + Verb',
        examples: [
          { nepali: 'रामले भात खान्छ।', literal: 'Ram-le rice eats', natural: 'Ram eats rice.' },
          { nepali: 'सिताले चिया पिउँछ।', literal: 'Sita-le tea drinks', natural: 'Sita drinks tea.' },
        ]
      },
      {
        title: 'Ergative Case (ले)',
        rule: 'The doer of a transitive action takes ले',
        examples: [
          { nepali: 'आमाले खाना पकाउँछ।', literal: 'Mother-le food cooks', natural: 'Mother cooks food.' },
          { nepali: 'शिक्षकले पाठ सिकाउँछ।', literal: 'Teacher-le lesson teaches', natural: 'The teacher teaches the lesson.' },
        ]
      },
      {
        title: 'Word Order (SOV)',
        rule: 'Subject + Object + Verb',
        examples: [
          { nepali: 'केटाले किताब पढ्छ।', literal: 'Boy-le book reads', natural: 'The boy reads a book.' },
          { nepali: 'दिदीले गीत गाउँछ।', literal: 'Sister-le song sings', natural: 'Sister sings a song.' },
        ]
      },
    ],
    activities: [
      { type: 'sentence_building', id: 'u2_build' },
      { type: 'quiz', id: 'u2_quiz' },
      { type: 'identify_grammar', id: 'u2_identify' },
      { type: 'fill_blank', id: 'u2_fill' },
    ]
  },
  {
    id: 3,
    name: 'Unit 3: Negation',
    description: 'Learn to form negative sentences - negating identity, existence, adjectives, and actions.',
    rules: [
      {
        title: 'Negative Identity',
        rule: 'A B होइन (A B hoina)',
        examples: [
          { nepali: 'ऊ शिक्षक होइन।', literal: 'He teacher is-not', natural: 'He is not a teacher.' },
          { nepali: 'यो घर होइन।', literal: 'This house is-not', natural: 'This is not a house.' },
        ]
      },
      {
        title: 'Negative Existence/Adjective',
        rule: 'A छैन (A chhaina)',
        examples: [
          { nepali: 'गाडी छैन।', literal: 'Car is-not', natural: 'There is no car.' },
          { nepali: 'यो मिठो छैन।', literal: 'This tasty is-not', natural: 'This is not tasty.' },
        ]
      },
      {
        title: 'Negative Possession',
        rule: 'A सङ्ग B छैन (A sanga B chhaina)',
        examples: [
          { nepali: 'केटासङ्ग पैसा छैन।', literal: 'Boy-with money is-not', natural: 'The boy does not have money.' },
        ]
      },
      {
        title: 'Negative Action',
        rule: 'Subject + ले + Object + Verb-दैन',
        examples: [
          { nepali: 'रामले भात खाँदैन।', literal: 'Ram-le rice eats-not', natural: 'Ram does not eat rice.' },
          { nepali: 'सिताले चिया पिउँदैन।', literal: 'Sita-le tea drinks-not', natural: 'Sita does not drink tea.' },
        ]
      },
    ],
    activities: [
      { type: 'sentence_building', id: 'u3_build' },
      { type: 'quiz', id: 'u3_quiz' },
      { type: 'identify_grammar', id: 'u3_identify' },
      { type: 'fill_blank', id: 'u3_fill' },
    ]
  },
];

// Helper to get initial progress state
export const getInitialProgress = () => {
  const progress = {};
  grammarPathwayUnits.forEach(unit => {
    progress[unit.id] = {
      activities: unit.activities.reduce((acc, activity, index) => {
        acc[index] = { completed: false, stars: 0 };
        return acc;
      }, {}),
      completed: false,
    };
  });
  return progress;
};

// Load progress from localStorage
export const loadProgress = () => {
  try {
    const saved = localStorage.getItem('grammarPathwayProgress');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load grammar progress:', e);
  }
  return getInitialProgress();
};

// Save progress to localStorage
export const saveProgress = (progress) => {
  try {
    localStorage.setItem('grammarPathwayProgress', JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save grammar progress:', e);
  }
};


