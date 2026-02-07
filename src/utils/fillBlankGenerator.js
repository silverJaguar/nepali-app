// Fill-in-the-Blank generator: builds exercises from the same sentence builder and vocabulary as Quiz/SentenceConstruction.
// Blank is always a grammar word (copula, particle); options are grammar-relevant distractors.

import { shuffle } from './helpers';
import { buildSentence } from './sentenceBuilder';

const GRAMMAR_WORDS = {
  हो: 'ho',
  छ: 'chha',
  होइन: 'hoina',
  छैन: 'chhaina',
  सङ्ग: 'sanga',
  ले: 'le',
  मा: 'ma',
  को: 'ko',
};

function getTransliteration(word) {
  return GRAMMAR_WORDS[word] || word;
}

/** Replace the blank word's transliteration with ___ so the answer isn't revealed. Collapses extra spaces. */
function replaceBlankInTransliteration(fullTransliteration, blankTranslit) {
  if (!blankTranslit) return fullTransliteration;
  let out = fullTransliteration;
  // Sentence builder uses "cha" for छ; we use "chha" in options. Mask both so the answer isn't revealed.
  if (blankTranslit === 'chha') {
    out = out.replace(/\bchha\b/gi, ' ___ ').replace(/\bcha\b/gi, ' ___ ');
  } else {
    const escaped = blankTranslit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(escaped, 'gi'), ' ___ ');
  }
  return out.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Generate fill-in-the-blank exercises for a unit.
 * @param {number} unitId - 1, 2, or 3
 * @param {Array} vocabulary - from getAvailableVocabulary(unitId)
 * @param {Array} templates - from getTemplatesForUnit(unitId)
 * @param {number} count - number of exercises (default 5)
 * @returns {Array} exercises with sentence, transliteration, translation, fullSentence, blank, options, hint, explanation
 */
export function generateFillBlankExercises(unitId, vocabulary, templates, count = 6) {
  const exercises = [];
  const validTemplates = templates.filter(t => t.unit === unitId);
  if (validTemplates.length === 0) return exercises;

  const shuffledTemplates = shuffle([...validTemplates]);
  let attempts = 0;
  const maxAttempts = 60;

  while (exercises.length < count && attempts < maxAttempts) {
    attempts++;
    const template = shuffledTemplates[(exercises.length + attempts) % shuffledTemplates.length];
    const sentence = buildSentence(template, vocabulary, unitId);
    if (!sentence || !sentence.components) continue;

    const built = buildExerciseFromSentence(sentence, unitId, template);
    if (!built) continue;
    exercises.push(built);
  }

  return exercises.slice(0, count);
}

function buildExerciseFromSentence(sentence, unitId, template) {
  const { nepali, transliteration, english, type, components } = sentence;
  const fullSentence = nepali;
  const fullTransliteration = transliteration;

  // Choose blank word and build sentence with ___
  let blank = null;
  let sentenceWithBlank = null;
  let transliterationWithBlank = null;
  let options = [];
  let hint = '';
  let explanation = '';

  if (type === 'identity_noun' && components.copula) {
    blank = components.copula;
    const parts = nepali.replace(/।\s*$/, '').split(' ');
    const idx = parts.indexOf(blank);
    if (idx === -1) return null;
    parts[idx] = '___';
    sentenceWithBlank = parts.join(' ') + '।';
    transliterationWithBlank = replaceBlankInTransliteration(fullTransliteration, getTransliteration(blank));
    options = makeOptions(['हो', 'छ', 'होइन', 'छैन']);
    hint = 'Talking about who someone is (identity)';
    explanation = blank === 'हो' ? 'हो (ho) is used for identity - stating what someone IS (a noun).' : 'होइन (hoina) negates identity: हो → होइन.';
  } else if (type === 'identity_adj' && components.copula) {
    blank = components.copula;
    const parts = nepali.replace(/।\s*$/, '').split(' ');
    const idx = parts.indexOf(blank);
    if (idx === -1) return null;
    parts[idx] = '___';
    sentenceWithBlank = parts.join(' ') + '।';
    transliterationWithBlank = replaceBlankInTransliteration(fullTransliteration, getTransliteration(blank));
    options = makeOptions(['हो', 'छ', 'होइन', 'छैन']);
    hint = 'Describing a quality or characteristic';
    explanation = blank === 'छ' ? 'छ (chha) is used with adjectives to describe qualities or states.' : 'Adjectives use छ for positive, छैन for negative.';
  } else if (type === 'existence' && components.copula) {
    blank = components.copula;
    sentenceWithBlank = nepali.replace(blank, '___');
    transliterationWithBlank = replaceBlankInTransliteration(fullTransliteration, getTransliteration(blank));
    options = makeOptions(['हो', 'छ', 'होइन', 'छैन', 'सङ्ग']);
    hint = 'Saying that something exists';
    explanation = blank === 'छ' ? 'छ is used for existence: stating that something exists.' : 'छैन (chhaina) negates existence: छ → छैन.';
  } else if (type === 'possession') {
    // Blank the particle सङ्ग (transliteration may be concatenated e.g. "didisanga")
    blank = 'सङ्ग';
    sentenceWithBlank = nepali.replace('सङ्ग', '___');
    transliterationWithBlank = replaceBlankInTransliteration(fullTransliteration, 'sanga');
    options = makeOptions(['ले', 'सङ्ग', 'मा', 'को']);
    hint = 'Talking about what someone has';
    explanation = 'सङ्ग (sanga) = "with". Possessor-with object exists → has.';
  } else if (type === 'action' && components.ergative && !template.negation_type) {
    blank = 'ले';
    sentenceWithBlank = nepali.replace(' ले ', ' ___ ');
    transliterationWithBlank = replaceBlankInTransliteration(fullTransliteration, 'le');
    options = makeOptions(['ले', 'सङ्ग', 'मा', 'को']);
    hint = 'Saying who does the action (the doer)';
    explanation = 'ले (le) is the ergative marker - used on subjects of transitive verbs.';
  } else if (type === 'action' && template.negation_type === 'action_present' && components.verb) {
    // Negative action: blank the verb (sentence uses negative form)
    const parts = nepali.replace(/।\s*$/, '').split(' ');
    const verbPart = parts[parts.length - 1];
    if (!verbPart || !verbPart.includes('दैन')) return null;
    blank = verbPart;
    parts[parts.length - 1] = '___';
    sentenceWithBlank = parts.join(' ') + '।';
    const verbTrans = components.verb.transliteration || verbPart;
    transliterationWithBlank = fullTransliteration.replace(new RegExp(verbTrans.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), ' ___ ').replace(/\s{2,}/g, ' ').trim();
    const positiveVerb = components.verb.nepali || verbPart.replace(/दैन$/, 'छ');
    options = [
      { value: blank, transliteration: verbTrans },
      { value: positiveVerb, transliteration: components.verb.transliteration || positiveVerb },
      { value: 'छ', transliteration: 'chha' },
      { value: 'छैन', transliteration: 'chhaina' },
    ];
    hint = 'Saying someone doesn\'t do something';
    explanation = `Negative action: ${blank} is the negative form.`;
  }

  if (!blank || !sentenceWithBlank || options.length < 2) return null;

  return {
    sentence: sentenceWithBlank,
    transliteration: transliterationWithBlank,
    translation: english,
    fullSentence,
    fullTransliteration,
    blank,
    options: ensureFourOptions(options, blank),
    hint,
    explanation,
  };
}

function makeOptions(words) {
  return words.map(w => ({
    value: w,
    transliteration: GRAMMAR_WORDS[w] || w,
  })).filter(o => o.value);
}

function ensureFourOptions(options, correctValue) {
  const copulaPool = [
    { value: 'हो', transliteration: 'ho' },
    { value: 'छ', transliteration: 'chha' },
    { value: 'होइन', transliteration: 'hoina' },
    { value: 'छैन', transliteration: 'chhaina' },
  ];
  const particlePool = [
    { value: 'ले', transliteration: 'le' },
    { value: 'सङ्ग', transliteration: 'sanga' },
    { value: 'मा', transliteration: 'ma' },
    { value: 'को', transliteration: 'ko' },
  ];
  const hasCorrect = options.some(o => o.value === correctValue);
  if (!hasCorrect) {
    options = [{ value: correctValue, transliteration: getTransliteration(correctValue) }, ...options];
  }
  const set = new Set(options.map(o => o.value));
  if (set.size >= 4) {
    const correctOption = options.find(o => o.value === correctValue);
    const others = shuffle(options.filter(o => o.value !== correctValue)).slice(0, 3);
    return shuffle([correctOption, ...others]);
  }
  const pool = options.some(o => ['हो', 'छ', 'होइन', 'छैन'].includes(o.value)) ? copulaPool : particlePool;
  for (const o of pool) {
    if (set.size >= 4) break;
    if (!set.has(o.value)) {
      set.add(o.value);
      options.push(o);
    }
  }
  const correctOption = options.find(o => o.value === correctValue);
  const others = shuffle(options.filter(o => o.value !== correctValue)).slice(0, 3);
  return shuffle([correctOption, ...others]);
}
