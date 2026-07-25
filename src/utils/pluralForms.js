// Plural morphology helpers for Unit 5 (हरू, छन्, हुन्, verb -न्, etc.)

export const PLURAL_SUFFIX = 'हरू';
export const PLURAL_VERB_SUFFIX = 'न्';

const NON_PLURAL_CATEGORIES = new Set([
  'currency',
  'liquid',
  'concept',
  'time',
  'emotion',
  'music',
  'number',
]);

const MASS_FOOD_TERMS = new Set(['भात', 'चामल', 'मासु', 'नुन']);

const PLURAL_COPULA_MAP = {
  छ: 'छन्',
  हो: 'हुन्',
  छैन: 'छैनन्',
  होइन: 'होइनन्',
};

/** Whether this vocab item can take हरू / English plural in Unit 5. */
export function canTakePlural(word) {
  if (!word) return false;
  if (word.can_plural === true) return true;
  if (word.can_plural === false) return false;
  if (word.no_plural === true || word.plural === true || word.mass_noun === true) return false;
  const cat = word.category || '';
  if (NON_PLURAL_CATEGORIES.has(cat)) return false;
  if (cat === 'food' && MASS_FOOD_TERMS.has(word.term)) return false;
  return true;
}

/** @deprecated use canTakePlural */
export function shouldSkipPluralSuffix(word) {
  return !canTakePlural(word);
}

export function toPluralNoun(term, word = null) {
  if (!term) return term;
  if (word && !canTakePlural(word)) return term;
  if (term.endsWith(PLURAL_SUFFIX)) return term;
  return `${term}${PLURAL_SUFFIX}`;
}

/** Present / negative-present finite verb → plural (खान्छ → खान्छन्, खाँदैन → खाँदैनन्). */
export function toPluralVerb(term) {
  if (!term) return term;
  if (term.endsWith(PLURAL_VERB_SUFFIX)) return term;
  if (term.endsWith('दैन')) return `${term}${PLURAL_VERB_SUFFIX}`;
  if (term.endsWith('छ')) return `${term}${PLURAL_VERB_SUFFIX}`;
  return `${term}${PLURAL_VERB_SUFFIX}`;
}

/** Strip plural verb ending (खान्छन् → खान्छ). */
export function toSingularVerb(term) {
  if (!term?.endsWith(PLURAL_VERB_SUFFIX)) return null;
  return term.slice(0, -PLURAL_VERB_SUFFIX.length);
}

export function toPluralCopula(copula) {
  return PLURAL_COPULA_MAP[copula] || copula;
}

/** Existence/possession: छ/छन् agree with the thing that exists or is possessed, not the possessor. */
export function copulaAgreesWithNoun(baseCopula, nounSurface, nounMeta = null) {
  if (!nounSurface) return baseCopula;
  const nounIsPlural =
    nounSurface.endsWith(PLURAL_SUFFIX) && (!nounMeta || canTakePlural(nounMeta));
  return nounIsPlural ? toPluralCopula(baseCopula) : baseCopula;
}

export function attachErgativeToPlural(pluralNoun) {
  return `${pluralNoun}ले`;
}

export function attachSangaToPlural(pluralNoun) {
  return `${pluralNoun}सँग`;
}

/**
 * Collapse spaced Unit 5 chips into natural Nepali surface form.
 * e.g. आमा + हरू + सँग + किताब + हरू + छन् → आमाहरूसँग किताबहरू छन्
 */
export function normalizePluralChipJoin(terms) {
  const result = terms.filter(Boolean).map(t => String(t));

  let i = 0;
  while (i < result.length - 1) {
    if (result[i + 1] === PLURAL_SUFFIX) {
      result[i] = `${result[i]}${PLURAL_SUFFIX}`;
      result.splice(i + 1, 1);
      continue;
    }
    i += 1;
  }

  i = 0;
  while (i < result.length - 1) {
    if (result[i + 1] === 'सँग' || result[i + 1] === 'सङ्ग') {
      result[i] = `${result[i]}${result[i + 1]}`;
      result.splice(i + 1, 1);
      continue;
    }
    i += 1;
  }

  i = 0;
  while (i < result.length - 1) {
    if (result[i + 1] === 'ले' && result[i].endsWith(PLURAL_SUFFIX)) {
      result[i] = `${result[i]}ले`;
      result.splice(i + 1, 1);
      continue;
    }
    i += 1;
  }

  i = 0;
  while (i < result.length - 1) {
    if (result[i + 1] === 'मा') {
      result[i] = `${result[i]}मा`;
      result.splice(i + 1, 1);
      continue;
    }
    i += 1;
  }

  return result.join(' ');
}

function primaryGloss(text) {
  if (!text) return '';
  return String(text).trim().split(/\s*\/\s*/)[0].trim();
}

function pluralizeEnglishHead(head) {
  if (!head) return '';
  // Already plural (books, cars) — but a singular ending in -s/-ss (illness, bus) still needs -es
  if (/(ss|ch|sh|x|z)$/i.test(head)) return `${head}es`;
  if (/s$/i.test(head)) return head;
  if (/[^aeiou]y$/i.test(head)) return `${head.slice(0, -1)}ies`;
  return `${head}s`;
}

function pluralizeEnglish(text, word = null) {
  if (word && !canTakePlural(word)) return primaryGloss(text);
  const primary = primaryGloss(text);
  if (!primary) return '';
  // Keep trailing parentheticals intact: "drum (madal)" → "drums (madal)"
  const withParen = primary.match(/^(.*?)(\s*\(.*\))\s*$/);
  if (withParen) {
    return `${pluralizeEnglishHead(withParen[1].trim())}${withParen[2]}`;
  }
  return pluralizeEnglishHead(primary);
}

/** Merge sentence component with vocabulary metadata (for can_plural checks). */
export function mergeCompWithVocab(comp, vocabulary) {
  if (!comp?.nepali) return null;
  const bare = comp.nepali.replace(/हरू$/, '').replace(/(सँग|सङ्ग|ले)$/, '');
  const card = vocabulary?.find(w => w.term === bare || w.term === comp.nepali);
  return {
    ...(card || {}),
    term: comp.nepali,
    gloss: comp.english || card?.gloss || card?.definition,
    definition: comp.english || card?.definition || card?.gloss,
    transliteration: comp.transliteration || card?.transliteration,
  };
}

/** Build a flashcard-like object with plural surface form when allowed. */
export function asPluralWord(word, { force = false } = {}) {
  if (!word) return word;
  if (!force && !canTakePlural(word)) {
    return { ...word, plural: false };
  }
  const term = toPluralNoun(word.term, word);
  const pluralized = term !== word.term;
  return {
    ...word,
    term,
    plural: pluralized,
    singular_term: word.term,
    gloss: pluralized ? pluralizeEnglish(word.gloss || word.definition, word) : primaryGloss(word.gloss || word.definition),
    definition: pluralized ? pluralizeEnglish(word.definition || word.gloss, word) : primaryGloss(word.definition || word.gloss),
  };
}

/** English label for a noun slot in plural exercises. */
export function englishPluralLabel(word) {
  const base = word?.gloss || word?.definition || '';
  if (!canTakePlural(word)) return primaryGloss(base).toLowerCase();
  return pluralizeEnglish(base, word).toLowerCase();
}

/** English prompt helpers for plural subjects/objects. */
export function buildEnglishPluralSubjectPhrase(word) {
  if (!word) return '';
  const plural = englishPluralLabel(word);
  return `The ${plural}`;
}

export function buildEnglishPluralObjectPhrase(word) {
  return englishPluralLabel(word);
}
