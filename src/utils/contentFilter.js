// Content filter for NSFW and inappropriate content
// This helps ensure the learning app remains appropriate for all users

const NSFW_PATTERNS = [
  // Clothing-related inappropriate content
  /\b(underwear|panties|bra|lingerie|intimate wear)\b/i,
  /\b(naked|nude|undressed|exposed)\b/i,
  /\b(sexual|sex|intimate|private parts)\b/i,
  /\b(genital|genitals|penis|vagina|breast|breasts)\b/i,
  
  // Violence and harmful content
  /\b(kill|killing|murder|suicide)\b/i,
  /\b(violent|violence|fight|fighting|attack|attacking)\b/i,
  /\b(weapon|gun|knife|bomb|explosive)\b/i,
  /\b(racist|discrimination)\b/i,
  // Removed "hate|hatred|death|die|dying" as these are normal concepts/emotions
  
  // Drugs and alcohol
  /\b(drug|drugs|marijuana|cocaine|heroin|meth)\b/i,
  /\b(alcohol|drunk|drinking|intoxicated)\b/i,
  /\b(smoking|smoke|cigarette|cigar)\b/i,
  
  // Profanity and offensive language
  /\b(fuck|shit|damn|hell|bitch|asshole|bastard)\b/i,
  /\b(crap|piss|pissed|fucking|shitty|damned)\b/i,
  
  // Other inappropriate content
  /\b(porn|pornography|adult|mature|explicit)\b/i,
  /\b(prostitute|prostitution|escort|stripper)\b/i,
  /\b(gambling|casino|betting|lottery)\b/i
];

// Simple comprehensive pattern: any person + lack of clothing (excluding accessories)
const CONTEXTUAL_NSFW_PATTERNS = [
  // Block: does not have + (optional article) + clothing
  /does not have (a |an |the )?(pants|shirt|dress|clothes|clothing|attire|outfit|uniform|garment|trousers|jeans|blouse|skirt|suit|jacket|coat|sweater|top|bottom|underwear|panties|bra|lingerie)/i,
  /doesn't have (a |an |the )?(pants|shirt|dress|clothes|clothing|attire|outfit|uniform|garment|trousers|jeans|blouse|skirt|suit|jacket|coat|sweater|top|bottom|underwear|panties|bra|lingerie)/i,
  /has no (pants|shirt|dress|clothes|clothing|attire|outfit|uniform|garment|trousers|jeans|blouse|skirt|suit|jacket|coat|sweater|top|bottom|underwear|panties|bra|lingerie)/i,
  /have no (pants|shirt|dress|clothes|clothing|attire|outfit|uniform|garment|trousers|jeans|blouse|skirt|suit|jacket|coat|sweater|top|bottom|underwear|panties|bra|lingerie)/i,
  /without (a |an |the )?(pants|shirt|dress|clothes|clothing|attire|outfit|uniform|garment|trousers|jeans|blouse|skirt|suit|jacket|coat|sweater|top|bottom|underwear|panties|bra|lingerie)/i,
  /wearing no (pants|shirt|dress|clothes|clothing|attire|outfit|uniform|garment|trousers|jeans|blouse|skirt|suit|jacket|coat|sweater|top|bottom|underwear|panties|bra|lingerie)/i,
  // Block: negative existence with body parts (gruesome/inappropriate)
  /there is no (head|body|arm|leg|hand|foot|eye|ear|nose|mouth|neck)/i,
  /there are no (heads|bodies|arms|legs|hands|feet|eyes|ears)/i,
  /there is not (a |an |the )?(head|body|arm|leg|hand|foot|eye|ear|nose|mouth|neck)/i,
  // Block: "feels body" - semantically inappropriate (should only feel emotions/sensations)
  /feels (body|bodies)/i,
  /feel (body|bodies)/i,
  /feeling (body|bodies)/i,
  // Block: existence sentences with body-whole nouns
  /there is (a |an |the )?(body|bodies|skin|blood|bone|bones)/i,
  /there are (bodies|bones)/i
];

// No general pants blocking - only block pants in negative contexts

const QUESTIONABLE_PATTERNS = [
  // Only block truly problematic content, not everyday vocabulary
  /\b(war|battle|conflict)\b/i,
  /\b(arrest|jail|prison|crime)\b/i,
  // Removed money, politics, religion as these are normal topics
];

/**
 * Check if a sentence contains NSFW or inappropriate content
 * @param {string} sentence - The sentence to check
 * @returns {Object} - { isNSFW: boolean, reason?: string, severity: 'high'|'medium'|'low' }
 */
export function checkContentSafety(sentence) {
  if (!sentence || typeof sentence !== 'string') {
    return { isNSFW: false, severity: 'low' };
  }

  const lowerSentence = sentence.toLowerCase();

  // Check for contextual inappropriate combinations
  for (const pattern of CONTEXTUAL_NSFW_PATTERNS) {
    if (pattern.test(lowerSentence)) {
      return {
        isNSFW: true,
        reason: 'Contains inappropriate contextual combination',
        severity: 'high'
      };
    }
  }

  // Check for high-severity NSFW content
  for (const pattern of NSFW_PATTERNS) {
    if (pattern.test(lowerSentence)) {
      return {
        isNSFW: true,
        reason: 'Contains inappropriate content',
        severity: 'high'
      };
    }
  }

  // Check for medium-severity questionable content
  for (const pattern of QUESTIONABLE_PATTERNS) {
    if (pattern.test(lowerSentence)) {
      return {
        isNSFW: true,
        reason: 'Contains potentially sensitive content',
        severity: 'medium'
      };
    }
  }

  return { isNSFW: false, severity: 'low' };
}

/**
 * Build a simple English sentence from exercise to check for content safety
 * This is a simplified version just for filtering - doesn't need full grammar rules
 */
function buildEnglishSentenceForFilter(exercise) {
  if (!exercise || !exercise.template || !exercise.requiredWords) return '';
  
  const template = exercise.template;
  const words = exercise.requiredWords;
  
  // For possession sentences: [possessor] does/does not have [object]
  if (template.type === 'possession') {
    const possessor = words[0];
    const object = words[2];
    const hasNegation = template.negation_type;
    const possessorText = (possessor?.gloss || possessor?.definition || 'person').toLowerCase();
    const objectText = (object?.gloss || object?.definition || 'thing').toLowerCase();
    // Use article handling for object
    const article = objectText.match(/^(a|an|the)\s/) ? '' : 'a ';
    return hasNegation ? `the ${possessorText} does not have ${article}${objectText}` : `the ${possessorText} has ${article}${objectText}`;
  }
  
  // For existence sentences: There is/is not/is no [object]
  if (template.type === 'existence') {
    const object = words[0];
    const hasNegation = template.negation_type;
    const objectText = (object?.gloss || object?.definition || 'thing').toLowerCase();
    if (hasNegation) {
      return `there is no ${objectText}`;
    }
    // Check if plural
    const isPlural = object?.plural || objectText.endsWith('s');
    if (isPlural) {
      return `there are ${objectText}`;
    }
    return `there is a ${objectText}`;
  }
  
  // For other types, return empty - we'll check template pattern
  return '';
}

/**
 * Filter out inappropriate exercises from a list
 * @param {Array} exercises - Array of exercise objects
 * @returns {Array} - Filtered array of safe exercises
 */
export function filterSafeExercises(exercises) {
  if (!Array.isArray(exercises)) {
    return [];
  }

  return exercises.filter(exercise => {
    // First, try to build and check the actual English sentence
    const builtSentence = buildEnglishSentenceForFilter(exercise);
    if (builtSentence) {
      const builtCheck = checkContentSafety(builtSentence);
      if (builtCheck.isNSFW) {
        console.log(`[CONTENT FILTER] Blocked exercise: "${builtSentence}" - ${builtCheck.reason}`);
        return false;
      }
    }
    
    // Check the English sentence template
    if (exercise.template && exercise.template.english) {
      const englishCheck = checkContentSafety(exercise.template.english);
      if (englishCheck.isNSFW) {
        console.log(`[CONTENT FILTER] Blocked exercise: "${exercise.template.english}" - ${englishCheck.reason}`);
        return false;
      }
    }

    // Check the Nepali sentence if available
    if (exercise.targetNepali) {
      const nepaliCheck = checkContentSafety(exercise.targetNepali);
      if (nepaliCheck.isNSFW) {
        console.log(`[CONTENT FILTER] Blocked exercise: "${exercise.targetNepali}" - ${nepaliCheck.reason}`);
        return false;
      }
    }

    // Check individual words in required words
    if (exercise.requiredWords && Array.isArray(exercise.requiredWords)) {
      for (const word of exercise.requiredWords) {
        if (word.term) {
          const wordCheck = checkContentSafety(word.term);
          if (wordCheck.isNSFW) {
            console.log(`[CONTENT FILTER] Blocked exercise due to word: "${word.term}" - ${wordCheck.reason}`);
            return false;
          }
        }
        if (word.definition || word.gloss) {
          const definitionCheck = checkContentSafety(word.definition || word.gloss);
          if (definitionCheck.isNSFW) {
            console.log(`[CONTENT FILTER] Blocked exercise due to definition: "${word.definition || word.gloss}" - ${definitionCheck.reason}`);
            return false;
          }
        }
      }
    }

    return true;
  });
}

/**
 * Check if a vocabulary word is safe to use
 * @param {Object} word - Vocabulary word object
 * @returns {Object} - { isSafe: boolean, reason?: string }
 */
export function checkWordSafety(word) {
  if (!word || typeof word !== 'object') {
    return { isSafe: true };
  }

  // Check the term itself
  if (word.term) {
    const termCheck = checkContentSafety(word.term);
    if (termCheck.isNSFW) {
      return { isSafe: false, reason: `Term "${word.term}" contains inappropriate content` };
    }
  }

  // Check definitions and glosses
  const textFields = ['definition', 'gloss', 'english', 'transliteration'];
  for (const field of textFields) {
    if (word[field]) {
      const fieldCheck = checkContentSafety(word[field]);
      if (fieldCheck.isNSFW) {
        return { isSafe: false, reason: `${field} "${word[field]}" contains inappropriate content` };
      }
    }
  }

  return { isSafe: true };
}

/**
 * Get a safe replacement exercise when content is blocked
 * @param {string} originalType - The type of exercise that was blocked
 * @returns {Object} - Safe replacement exercise template
 */
export function getSafeReplacementExercise(originalType) {
  const safeReplacements = {
    'possession': {
      id: 'safe_possession',
      type: 'possession',
      english: 'The student has a book',
      nepali_structure: '[possessor] सङ्ग [object] छ',
      required_parts: ['possessor', 'possession_postposition', 'object', 'copula']
    },
    'existence': {
      id: 'safe_existence',
      type: 'existence',
      english: 'There is a table',
      nepali_structure: '[object] छ',
      required_parts: ['object', 'copula']
    },
    'identity_noun': {
      id: 'safe_identity_noun',
      type: 'identity_noun',
      english: 'The person is a student',
      nepali_structure: '[subject] [identity_noun] हो',
      required_parts: ['subject', 'identity_noun', 'identity_copula']
    },
    'identity_adj': {
      id: 'safe_identity_adj',
      type: 'identity_adj',
      english: 'The student is happy',
      nepali_structure: '[subject] [adjective] छ',
      required_parts: ['subject', 'adjective', 'copula']
    },
    'action': {
      id: 'safe_action',
      type: 'action',
      english: 'The student reads a book',
      nepali_structure: '[subject] ले [object] [verb]',
      required_parts: ['subject', 'ergative_marker', 'object', 'verb']
    }
  };

  return safeReplacements[originalType] || safeReplacements['existence'];
}