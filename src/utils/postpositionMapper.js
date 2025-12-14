// Postposition mapper: handles conversion between Nepali postpositions and English prepositions
// This ensures grammatically correct English prompts in the grammar section

// Mapping table: Nepali postposition → English prepositions
export const POSTPOSITION_MAP = {
  'मा': {
    nepali: 'मा',
    transliteration: 'mā',
    meaning: 'in, at, to (location)',
    english_prepositions: {
      motion: 'to',      // for motion verbs (go, come)
      location: 'at',    // for location/static (is, sits)
      default: 'in'      // fallback
    }
  },
  'बाट': {
    nepali: 'बाट',
    transliteration: 'bāṭa',
    meaning: 'from (source/origin)',
    english_prepositions: {
      default: 'from'
    }
  },
  'सँग': {
    nepali: 'सँग',
    transliteration: 'sanga',
    meaning: 'with (accompaniment/possession)',
    english_prepositions: {
      default: 'with'
    }
  },
  'लाई': {
    nepali: 'लाई',
    transliteration: 'lāī',
    meaning: 'to, for (dative/indirect object)',
    english_prepositions: {
      default: 'to'
    }
  },
  'को': {
    nepali: 'को',
    transliteration: 'ko',
    meaning: 'of, \'s (possessive/genitive)',
    english_prepositions: {
      default: 'of'
    }
  },
  'बिना': {
    nepali: 'बिना',
    transliteration: 'binā',
    meaning: 'without',
    english_prepositions: {
      default: 'without'
    }
  },
  'अघि': {
    nepali: 'अघि',
    transliteration: 'aghi',
    meaning: 'before',
    english_prepositions: {
      default: 'before'
    }
  },
  'पछि': {
    nepali: 'पछि',
    transliteration: 'pachi',
    meaning: 'after',
    english_prepositions: {
      default: 'after'
    }
  },
  'माथि': {
    nepali: 'माथि',
    transliteration: 'māthi',
    meaning: 'on, above',
    english_prepositions: {
      default: 'on'
    }
  },
  'तल': {
    nepali: 'तल',
    transliteration: 'tala',
    meaning: 'under, below',
    english_prepositions: {
      default: 'under'
    }
  },
  'भित्र': {
    nepali: 'भित्र',
    transliteration: 'bhitra',
    meaning: 'inside',
    english_prepositions: {
      default: 'inside'
    }
  },
  'बाहिर': {
    nepali: 'बाहिर',
    transliteration: 'bāhira',
    meaning: 'outside',
    english_prepositions: {
      default: 'outside'
    }
  }
};

// Verb semantic types that indicate motion
const MOTION_VERB_TYPES = ['go_action', 'come_action', 'motion_action'];

/**
 * Extract postposition from a Nepali word (usually suffixed to objects)
 * @param {string} nepaliWord - The Nepali word that may contain a postposition
 * @returns {object|null} - { base: string, postposition: string } or null
 */
export function extractPostposition(nepaliWord) {
  if (!nepaliWord) return null;
  
  // Check each postposition to see if the word ends with it
  for (const [postposition, data] of Object.entries(POSTPOSITION_MAP)) {
    if (nepaliWord.endsWith(postposition)) {
      const base = nepaliWord.slice(0, -postposition.length);
      return {
        base,
        postposition,
        postpositionData: data
      };
    }
  }
  
  return null;
}

/**
 * Get the appropriate English preposition for a Nepali postposition
 * @param {string} postposition - The Nepali postposition
 * @param {object} verb - The verb object (for context)
 * @returns {string} - The English preposition
 */
export function getEnglishPreposition(postposition, verb = null) {
  const mapping = POSTPOSITION_MAP[postposition];
  if (!mapping) return '';
  
  // Check if verb is a motion verb for context-specific prepositions
  if (verb && verb.semantic_type && MOTION_VERB_TYPES.includes(verb.semantic_type)) {
    return mapping.english_prepositions.motion || mapping.english_prepositions.default;
  }
  
  return mapping.english_prepositions.default || '';
}

/**
 * Determine appropriate article for an English noun
 * @param {string} noun - The English noun
 * @param {object} nounData - The noun object with metadata
 * @returns {string} - 'the', 'a', or '' (empty)
 */
export function getEnglishArticle(noun, nounData = {}) {
  if (!noun) return '';
  
  // No article for proper nouns (capitalized)
  if (noun[0] === noun[0].toUpperCase() && noun !== noun.toUpperCase()) {
    return '';
  }
  
  // No article for plural or mass nouns (check for -s ending or plural flag)
  if (nounData.plural || nounData.mass_noun || noun.toLowerCase().endsWith('s')) {
    return '';
  }
  
  // No article for abstract concepts
  if (nounData.category === 'concept' || nounData.category === 'emotion') {
    return '';
  }
  
  // Use "the" for definite contexts (family members, specific things)
  if (nounData.category === 'family_member' || nounData.definite) {
    return 'the';
  }
  
  // Check for vowel start for "a" vs "an"
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  const firstChar = noun[0].toLowerCase();
  
  if (vowels.includes(firstChar)) {
    return 'an';
  }
  
  return 'a';
}

/**
 * Build grammatically correct English object phrase with preposition and article
 * @param {object} objectWord - The object word data
 * @param {object} verb - The verb object (for context)
 * @returns {string} - The complete English object phrase
 */
export function buildEnglishObjectPhrase(objectWord, verb = null) {
  if (!objectWord) return '';
  
  const objectEnglish = objectWord.gloss || objectWord.definition || '';
  const objectNepali = objectWord.term || '';
  
  // Extract postposition from the Nepali term if present
  const postpositionInfo = extractPostposition(objectNepali);
  
  // Get article
  const article = getEnglishArticle(objectEnglish, objectWord);
  
  // Build base phrase with article (proper capitalization)
  let phrase = article ? `${article} ${objectEnglish.toLowerCase()}` : objectEnglish.toLowerCase();
  
  // Add preposition if postposition was found
  if (postpositionInfo) {
    const preposition = getEnglishPreposition(postpositionInfo.postposition, verb);
    phrase = preposition ? `${preposition} ${phrase}` : phrase;
  } else if (verb && verb.default_postposition) {
    // Use verb's default postposition if object doesn't have one
    const preposition = getEnglishPreposition(verb.default_postposition, verb);
    phrase = preposition ? `${preposition} ${phrase}` : phrase;
  }
  
  return phrase;
}

/**
 * Build grammatically correct English subject phrase with article
 * @param {object} subjectWord - The subject word data
 * @returns {string} - The complete English subject phrase
 */
export function buildEnglishSubjectPhrase(subjectWord) {
  if (!subjectWord) return '';
  
  const subjectEnglish = subjectWord.gloss || subjectWord.definition || '';
  
  // Get article
  const article = getEnglishArticle(subjectEnglish, subjectWord);
  
  // Build phrase with proper capitalization (only first letter capitalized)
  const phrase = article ? `${article} ${subjectEnglish.toLowerCase()}` : subjectEnglish.toLowerCase();
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

