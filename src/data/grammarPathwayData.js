// Grammar Pathway Unit Data
// Each unit has a pathway with different activity types.
//
// IDENTIFY PHASED ROLLOUT: See docs/IDENTIFY_PHASED_ROLLOUT.md for full reference.
// Principle: never ask what the grammar hasn't revealed yet. Units 1–3: NO Identify. Unit 4+: limited then expanded by unit.

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
        rule: '[Object] छ ([Object] chha)',
        examples: [
          { nepali: 'गाडी छ।', literal: 'Car is', natural: 'There is a car.' },
          { nepali: 'किताब छ।', literal: 'Book is', natural: 'There is a book.' },
        ]
      },
      {
        title: 'Possession (A has B)',
        rule: '[A] सङ्ग [B] छ ([A] sanga [B] cha)',
        examples: [
          { nepali: 'केटासङ्ग गाडी छ।', literal: 'Boy-with car is', natural: 'The boy has a car.' },
          { nepali: 'केटीसङ्ग किताब छ।', literal: 'Girl-with book is', natural: 'The girl has a book.' },
        ]
      },
    ],
    activities: [
      { type: 'sentence_building', id: 'u1_build' },
      { type: 'quiz', id: 'u1_quiz' },
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
        rule: '[Subject] + ले + [Object] + [Verb]',
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
        rule: '[Subject] + [Object] + [Verb]',
        examples: [
          { nepali: 'केटाले किताब पढ्छ।', literal: 'Boy-le book reads', natural: 'The boy reads a book.' },
          { nepali: 'दिदीले गीत गाउँछ।', literal: 'Sister-le song sings', natural: 'Sister sings a song.' },
        ]
      },
    ],
    activities: [
      { type: 'sentence_building', id: 'u2_build' },
      { type: 'quiz', id: 'u2_quiz' },
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
        rule: '[A] [B] होइन ([A] [B] hoina)',
        examples: [
          { nepali: 'ऊ शिक्षक होइन।', literal: 'He teacher is-not', natural: 'He is not a teacher.' },
          { nepali: 'यो घर होइन।', literal: 'This house is-not', natural: 'This is not a house.' },
        ]
      },
      {
        title: 'Negative Existence/Adjective',
        rule: '[A] छैन ([A] chhaina)',
        examples: [
          { nepali: 'गाडी छैन।', literal: 'Car is-not', natural: 'There is no car.' },
          { nepali: 'यो मिठो छैन।', literal: 'This tasty is-not', natural: 'This is not tasty.' },
        ]
      },
      {
        title: 'Negative Possession',
        rule: '[A] सङ्ग [B] छैन ([A] sanga [B] chhaina)',
        examples: [
          { nepali: 'केटासङ्ग पैसा छैन।', literal: 'Boy-with money is-not', natural: 'The boy does not have money.' },
        ]
      },
      {
        title: 'Negative Action',
        rule: '[Subject] ले [Object] [Verb] दैन ([Subject] le [Object] [Verb] daina)',
        examples: [
          { nepali: 'रामले भात खाँदैन।', literal: 'Ram-le rice eats-not', natural: 'Ram does not eat rice.' },
          { nepali: 'सिताले चिया पिउँदैन।', literal: 'Sita-le tea drinks-not', natural: 'Sita does not drink tea.' },
        ]
      },
    ],
    activities: [
      { type: 'sentence_building', id: 'u3_build' },
      { type: 'quiz', id: 'u3_quiz' },
      { type: 'fill_blank', id: 'u3_fill' },
    ]
  },
  {
    id: 4,
    name: 'Unit 4: Questions',
    description: 'Learn to form yes/no questions and basic information questions using question words like “what,” “who,” and “where".',
    rules: [
      {
        title: 'Yes/No Questions',
        rule: 'के [Subject] [Object] छ? (ke [Subject] [Object] [Verb]?)',
        examples: [
          { nepali: 'के तपाईंसँग किताब छ?', literal: '? You have book', natural: 'Do you have a book?' },
          { nepali: 'के ऊ विद्यालय जान्छ?', literal: '? He school goes', natural: 'Does he go to school?' },
        ]
      },
      {
        title: 'What Questions',
        rule: '[A] के हो? ([A] ke ho?)',
        examples: [
          { nepali: 'यो के हो?', literal: 'This what is?', natural: 'What is this?' },
          { nepali: 'त्यो के हो?', literal: 'That what is?', natural: 'What is that?' },
        ]
      },
      {
        title: 'Who Questions',
        rule: '[Person] को हो?',
        examples: [
          { nepali: 'ऊ को हो?', literal: 'He who is?', natural: 'Who is he?' },
          { nepali: 'उनी को हुन्?', literal: 'They who are?', natural: 'Who are they?' },
        ]
      },
      {
        title: 'Where Questions',
        rule: 'Noun कहाँ छ?',
        examples: [
          { nepali: 'किताब कहाँ छ?', literal: 'Book where is?', natural: 'Where is the book?' },
          { nepali: 'कुकुर कहाँ छ?', literal: 'Dog where is?', natural: 'Where is the dog?' },
        ]
      },
    ],
    activities: [
      { type: 'sentence_building', id: 'u4_build' },
      { type: 'quiz', id: 'u4_quiz' },
      { type: 'fill_blank', id: 'u4_fill' },
      { type: 'identify_grammar', id: 'u4_identify' },
    ]
  },
  {
    id: 5,
    name: 'Unit 5: Plurals & Agreement',
    description: 'Learn to talk about more than one person or thing. The sentence patterns stay the same as earlier units — you add the plural marker हरू to nouns and switch to the plural verb and copula forms.',
    rules: [
      {
        title: 'Plural Nouns (हरू)',
        rule: '[noun] + हरू ([noun] + haru)',
        examples: [
          { nepali: 'केटा → केटाहरू', transliteration: 'keta → ketaharu', literal: 'boy → boys', natural: 'Add हरू to a noun to make it plural.' },
          { nepali: 'किताब → किताबहरू', transliteration: 'kitab → kitabharu', literal: 'book → books', natural: 'The same suffix works for objects.' },
        ]
      },
      {
        title: 'Plural Existence & Location (छ → छन्)',
        rule: '[object]हरू छन् ([object]haru chan)',
        examples: [
          { nepali: 'किताब छ। → किताबहरू छन्।', transliteration: 'kitab cha → kitabharu chan', literal: 'book is → books are', natural: 'छ becomes छन् when the subject is plural.' },
          { nepali: 'कुकुर बगैंचामा छ। → कुकुरहरू बगैंचामा छन्।', transliteration: 'kukur bagaicha-ma cha → kukurharu bagaicha-ma chan', literal: 'dog garden-in is → dogs garden-in are', natural: 'Location works the same way.' },
        ]
      },
      {
        title: 'Plural Identity (हो → हुन्)',
        rule: '[subjects]हरू [noun] हुन् ([subjects]haru [noun] hun)',
        examples: [
          { nepali: 'ऊ शिक्षक हो। → उनीहरू शिक्षक हुन्।', transliteration: 'u shikshak ho → uniharu shikshak hun', literal: 'he teacher is → they teacher are', natural: 'Identity uses हुन् instead of हो for plural.' },
          { nepali: 'बहिनीहरू शिक्षक हुन्।', transliteration: 'bahiniharu shikshak hun', literal: 'younger-sisters teacher are', natural: 'The predicate noun does NOT take हरू — only the subject does. English still needs the plural: "The younger sisters are teachers."' },
        ]
      },
      {
        title: 'Predicate nouns stay singular after हो/हुन्',
        rule: '[subject]हरू [noun] हुन्  —  never [noun]हरू हुन्',
        examples: [
          { nepali: 'विद्यार्थीहरू शिक्षक हुन्।', transliteration: 'vidyarthiharu shikshak hun', literal: 'students teacher are', natural: 'Correct — the profession noun is left unmarked.' },
          { nepali: '✗ विद्यार्थीहरू शिक्षकहरू हुन्।', transliteration: '✗ vidyarthiharu shikshakharu hun', literal: '✗ students teachers are', natural: 'Incorrect — do not add हरू to the noun after हो/हुन्.' },
        ]
      },
      {
        title: 'Plural Action Verbs (+ न्)',
        rule: '[subject]हरूले [object] [verb]न् ([subject]haru-le [object] [verb]-n)',
        examples: [
          { nepali: 'केटाले भात खान्छ। → केटाहरूले भात खान्छन्।', transliteration: 'keta-le bhat khancha → ketaharu-le bhat khanchan', literal: 'boy-le rice eats → boys-le rice eat', natural: 'The verb adds न् to agree with a plural subject. In English the -s drops too: "eats" → "eat".' },
          { nepali: 'आमा जान्छ। → आमाहरू जान्छन्।', transliteration: 'aama jancha → aamaharu janchan', literal: 'mother goes → mothers go', natural: 'जान्छ → जान्छन्, and English "goes" → "go" (never "goes" with a plural subject).' },
        ]
      },
      {
        title: 'Location needs मा',
        rule: '[subject]हरू [place]मा छन् ([subject]haru [place]-ma chan)',
        examples: [
          { nepali: 'किताबहरू टेबलमा छन्।', transliteration: 'kitabharu tebal-ma chan', literal: 'books table-in are', natural: 'मा attaches to the place word and cannot be left out.' },
          { nepali: 'विद्यार्थीहरू विद्यालयमा छन्।', transliteration: 'vidyarthiharu vidyalaya-ma chan', literal: 'students school-in are', natural: 'Without मा the sentence has no "in/at" meaning.' },
        ]
      },
      {
        title: 'Possession: copula matches what is owned',
        rule: '[owner]हरूसँग [thing] [छ / छन्]',
        examples: [
          { nepali: 'आमाहरूसँग पैसा छ।', transliteration: 'aamaharu-sanga paisa cha', literal: 'mothers-with money is', natural: 'पैसा (money) is a mass noun, so it stays छ even though the owners are plural.' },
          { nepali: 'आमाहरूसँग किताबहरू छन्।', transliteration: 'aamaharu-sanga kitabharu chan', literal: 'mothers-with books are', natural: 'किताबहरू (books) is countable and plural, so the copula becomes छन्.' },
        ]
      },
      {
        title: 'Plural Negatives (छैन → छैनन्, होइन → होइनन्)',
        rule: 'छैन → छैनन् (existence/location), होइन → होइनन् (identity)',
        examples: [
          { nepali: 'केटाहरू यहाँ छैनन्।', transliteration: 'ketaharu yaha chainan', literal: 'boys here are-not', natural: 'छैन becomes छैनन् for plural existence and location.' },
          { nepali: 'उनीहरू शिक्षक होइनन्।', transliteration: 'uniharu shikshak hoinan', literal: 'they teacher are-not', natural: 'होइन becomes होइनन् for plural identity.' },
        ]
      },
    ],
    activities: [
      { type: 'sentence_building', id: 'u5_build' },
      { type: 'quiz', id: 'u5_quiz' },
      { type: 'fill_blank', id: 'u5_fill' },
      { type: 'identify_grammar', id: 'u5_identify' },
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

// Migrate progress when Identify was removed from units 1–3 (was activity index 2; fill_blank was 3)
function migrateProgressIfNeeded(progress) {
  grammarPathwayUnits.forEach(unit => {
    const unitProgress = progress[unit.id];
    if (!unitProgress?.activities) return;
    const acts = unitProgress.activities;
    const currentCount = unit.activities.length;
    // Old layout had 4 activities (build, quiz, identify, fill_blank); now 3 (build, quiz, fill_blank)
    if (currentCount === 3 && (acts['3'] !== undefined || acts[3] !== undefined)) {
      const fillData = acts['3'] ?? acts[3];
      unitProgress.activities = {
        0: acts['0'] ?? acts[0] ?? { completed: false, stars: 0 },
        1: acts['1'] ?? acts[1] ?? { completed: false, stars: 0 },
        2: fillData,
      };
    }
  });
  return progress;
}

// Load progress from localStorage
export const loadProgress = () => {
  try {
    const saved = localStorage.getItem('grammarPathwayProgress');
    if (saved) {
      const progress = JSON.parse(saved);
      return migrateProgressIfNeeded(progress);
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


