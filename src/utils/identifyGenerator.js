// Identify exercises: generated from vocabulary + templates + sentenceBuilder, then content-filtered.
// Unit 4: classify grammar_question sentences (and declarative statements) by question type.

import sentenceTemplates from '../sentence_templates.json';
import { shuffle } from './helpers';
import { buildSentence } from './sentenceBuilder';
import { filterSafeExercises } from './contentFilter';
import { buildRequiredWordsList } from './grammarQuestionExercises';

export const UNIT_4_QUESTION_OPTIONS = [
  { id: 'yn_question', label: 'Yes/no question' },
  { id: 'wh_what', label: 'What is (noun) question' },
  { id: 'wh_who', label: 'Who is (person) question' },
  { id: 'wh_where', label: 'Where is (place) question' },
  { id: 'statement', label: 'Statement (not a question)' },
];

const KIND_TO_ANSWER = {
  yes_no: 'yn_question',
  wh_what: 'wh_what',
  wh_who: 'wh_who',
  wh_where: 'wh_where',
};

const HINTS = {
  yn_question: 'Listen for के at the very beginning of the sentence.',
  wh_what: 'Ask yourself what noun or thing is being asked about.',
  wh_who: 'Ask yourself who the sentence is about.',
  wh_where: 'Ask yourself where something is or where someone is going.',
  statement: 'There is no question word — this is a plain declarative.',
};

function normalizeNepali(nepali) {
  return (nepali || '').replace(/[?।]/g, '').replace(/\s+/g, ' ').trim();
}

function buildExplanation(sentence, correctAnswer) {
  if (correctAnswer === 'yn_question') {
    return 'Yes/no questions prepend के to an otherwise unchanged statement.';
  }
  if (correctAnswer === 'wh_what') {
    return 'A what-question uses के in the slot of the noun being asked about.';
  }
  if (correctAnswer === 'wh_who') {
    return 'A who-question uses को (or कोले for a transitive doer) in the person slot.';
  }
  if (correctAnswer === 'wh_where') {
    return 'A where-question uses कहाँ in the place or destination slot.';
  }
  if (correctAnswer === 'statement') {
    return 'This sentence makes a statement; it does not ask a question.';
  }
  return 'Review the question patterns for this unit.';
}

function tryPushExercise(template, vocabulary, correctAnswer, seen, out) {
  const unitForBuild = template.type === 'grammar_question' ? 4 : template.unit;
  const sentence = buildSentence(template, vocabulary, unitForBuild);
  if (!sentence?.nepali) return false;

  const norm = normalizeNepali(sentence.nepali);
  if (seen.has(norm)) return false;
  seen.add(norm);

  const exercise = {
    sentence: sentence.nepali,
    transliteration: sentence.transliteration,
    correctAnswer,
    options: UNIT_4_QUESTION_OPTIONS,
    hint: HINTS[correctAnswer],
    explanation: buildExplanation(sentence, correctAnswer),
    template,
    questionEnglishPrompt: sentence.english,
    targetNepali: sentence.nepali,
  };

  if (sentence.type === 'grammar_question') {
    exercise.requiredWords = buildRequiredWordsList(sentence, vocabulary);
  }

  out.push(exercise);
  return true;
}

/**
 * Generate identify exercises for a grammar unit.
 * @param {number} unitId
 * @param {Array} vocabulary - from getAvailableVocabulary
 * @param {Array} templates - from getTemplatesForUnit (unit 4 grammar_question templates)
 * @param {number} count - target exercise count (default 7)
 */
export function generateIdentifyExercises(unitId, vocabulary, templates, count = 7) {
  const unit = Number(unitId);
  if (unit !== 4) return [];

  const questionTemplates = templates.filter(t => t.unit === unit && t.type === 'grammar_question');
  if (questionTemplates.length === 0) return [];

  const declarativeTemplates = sentenceTemplates.filter(
    t => t.unit <= 2 && t.type !== 'grammar_question' && !t.negation_type
  );

  const buckets = [
    { answer: 'yn_question', kind: 'yes_no', target: 2, pool: questionTemplates.filter(t => t.question_kind === 'yes_no') },
    { answer: 'wh_what', kind: 'wh_what', target: 2, pool: questionTemplates.filter(t => t.question_kind === 'wh_what') },
    { answer: 'wh_who', kind: 'wh_who', target: 1, pool: questionTemplates.filter(t => t.question_kind === 'wh_who') },
    { answer: 'wh_where', kind: 'wh_where', target: 1, pool: questionTemplates.filter(t => t.question_kind === 'wh_where') },
    { answer: 'statement', kind: null, target: 1, pool: declarativeTemplates },
  ].filter(b => b.pool.length > 0);

  const counts = Object.fromEntries(buckets.map(b => [b.answer, 0]));
  const raw = [];
  const seen = new Set();
  let attempts = 0;
  const maxAttempts = 400;

  while (attempts < maxAttempts) {
    const need = buckets.filter(b => counts[b.answer] < b.target);
    if (need.length === 0) break;
    attempts++;
    const bucket = need[Math.floor(Math.random() * need.length)];
    const pool = shuffle([...bucket.pool]);
    const tmpl = pool[0];
    const answer = bucket.answer;
    if (tryPushExercise(tmpl, vocabulary, answer, seen, raw)) {
      counts[answer] += 1;
    }
  }

  // Top up any short bucket
  for (const bucket of buckets) {
    let fillAttempts = 0;
    while (counts[bucket.answer] < bucket.target && fillAttempts < 80) {
      fillAttempts++;
      const tmpl = bucket.pool[Math.floor(Math.random() * bucket.pool.length)];
      if (tryPushExercise(tmpl, vocabulary, bucket.answer, seen, raw)) {
        counts[bucket.answer] += 1;
      }
    }
  }

  // Fill remaining slots with any question type
  while (raw.length < count && attempts < maxAttempts + 200) {
    attempts++;
    const tmpl = questionTemplates[attempts % questionTemplates.length];
    const answer = KIND_TO_ANSWER[tmpl.question_kind];
    if (answer) tryPushExercise(tmpl, vocabulary, answer, seen, raw);
  }

  const safe = filterSafeExercises(raw);
  return shuffle(safe).slice(0, count);
}
