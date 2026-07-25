// English verb form helpers for generated prompts.
// Nepali glosses are stored in 3rd-person singular ("goes", "eats"), so plural
// subjects and "does not …" frames need the bare form ("go", "eat").

const IRREGULAR_BARE_FORMS = {
  is: 'are',
  are: 'are',
  was: 'were',
  has: 'have',
  have: 'have',
  does: 'do',
  do: 'do',
  goes: 'go',
  go: 'go',
};

// -es (not just -s) is dropped after these endings: watches, washes, kisses, boxes, buzzes, goes
const ES_ENDINGS = /(ch|sh|ss|x|z|o)es$/i;

/**
 * Third-person singular → bare form, for one word.
 * "goes" → "go", "studies" → "study", "watches" → "watch", "eats" → "eat".
 */
function bareFormOfWord(word) {
  if (!word) return word;
  const lower = word.toLowerCase();
  if (IRREGULAR_BARE_FORMS[lower]) return IRREGULAR_BARE_FORMS[lower];
  if (/[^aeiou]ies$/i.test(word)) return `${word.slice(0, -3)}y`;
  if (ES_ENDINGS.test(word)) return word.slice(0, -2);
  if (/ss$/i.test(word)) return word;
  if (/s$/i.test(word)) return word.slice(0, -1);
  return word;
}

/**
 * Convert a verb gloss to the bare form used after a plural subject or "does not"/"do not".
 * Only the first word is inflected so multi-word glosses stay intact ("feels bad" → "feel bad").
 */
export function toBareEnglishVerb(gloss) {
  if (!gloss) return gloss;
  const cleaned = String(gloss).replace(/^(does not|do not)\s+/i, '').trim();
  if (!cleaned) return cleaned;
  const [first, ...rest] = cleaned.split(/\s+/);
  return [bareFormOfWord(first), ...rest].join(' ');
}

// English verbs that need "to" before their object where Nepali needs no postposition.
const VERBS_NEEDING_TO = new Set(['listen', 'listens']);

export function verbNeedsToBeforeObject(gloss) {
  const first = String(gloss || '')
    .replace(/^(does|do) not\s+/i, '')
    .trim()
    .split(/\s+/)[0]
    .toLowerCase();
  return VERBS_NEEDING_TO.has(first);
}

/** Verb phrase for a plural subject: "goes" → "go", negated → "do not go". */
export function pluralEnglishVerbPhrase(gloss, isNegative) {
  const bare = toBareEnglishVerb(gloss);
  return isNegative ? `do not ${bare}` : bare;
}

/** Verb phrase for a singular subject: negated → "does not go". */
export function singularEnglishVerbPhrase(gloss, isNegative) {
  if (!isNegative) return String(gloss || '').replace(/^does not\s+/i, '');
  return `does not ${toBareEnglishVerb(gloss)}`;
}
