// Test file for content filtering functionality
import { checkContentSafety, filterSafeExercises } from './contentFilter';

// Test cases for content filtering
const testCases = [
  // Safe content
  { sentence: "The student reads a book", expected: false },
  { sentence: "The teacher has a pen", expected: false },
  { sentence: "There is a table in the room", expected: false },
  { sentence: "The boy is tall", expected: false },
  
  // NSFW content that should be blocked
  { sentence: "An engineer does not have pants", expected: true },
  { sentence: "A singer (female) does not have clothes", expected: true },
  { sentence: "The student does not have clothes", expected: true },
  { sentence: "The teacher has no pants", expected: true },
  { sentence: "The student is naked", expected: true },
  { sentence: "There is a gun on the table", expected: true },
  { sentence: "The teacher is drunk", expected: true },
  { sentence: "The boy is fucking tall", expected: true },
  
  // More contextual inappropriate combinations
  { sentence: "The female singer has no clothes", expected: true },
  { sentence: "The male dancer does not have pants", expected: true },
  { sentence: "The young girl has no dress", expected: true },
  { sentence: "The old man does not have shirt", expected: true },
  { sentence: "The teacher in the bedroom has no clothes", expected: true },
  { sentence: "The student at night does not have pants", expected: true },
  
  // Questionable content
  { sentence: "The student is in a war", expected: true },
  { sentence: "There is a police officer", expected: true },
  { sentence: "The teacher has money", expected: true }
];

console.log('Testing content filter...\n');

testCases.forEach((testCase, index) => {
  const result = checkContentSafety(testCase.sentence);
  const passed = result.isNSFW === testCase.expected;
  
  console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Sentence: "${testCase.sentence}"`);
  console.log(`  Expected NSFW: ${testCase.expected}, Got: ${result.isNSFW}`);
  if (result.reason) {
    console.log(`  Reason: ${result.reason}`);
  }
  console.log('');
});

// Test exercise filtering
const testExercises = [
  {
    id: 'safe_exercise',
    template: { english: 'The student reads a book' },
    requiredWords: [
      { term: 'केटा', definition: 'boy' },
      { term: 'किताब', definition: 'book' }
    ]
  },
  {
    id: 'unsafe_exercise',
    template: { english: 'The engineer does not have pants' },
    requiredWords: [
      { term: 'इन्जिनियर', definition: 'engineer' },
      { term: 'प्यान्ट', definition: 'pants' }
    ]
  }
];

console.log('Testing exercise filtering...\n');
const safeExercises = filterSafeExercises(testExercises);
console.log(`Original exercises: ${testExercises.length}`);
console.log(`Safe exercises: ${safeExercises.length}`);
console.log(`Filtered out: ${testExercises.length - safeExercises.length} inappropriate exercises`);
