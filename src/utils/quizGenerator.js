// Dynamic Quiz Generator Utility
// Generates grammar quiz questions from vocabulary and templates

import { shuffle } from './helpers';
import { getRandomGrammarRuleTF, getGrammarFeaturesForUnit } from '../data/grammarRules';
import { buildSentence } from './sentenceBuilder';

/**
 * Main function: Generate a complete quiz with 3 MC + 2 TF questions
 * @param {number} unitId - The grammar unit (1, 2, or 3)
 * @param {Array} vocabulary - Filtered vocabulary for the unit
 * @param {Array} templates - Sentence templates for the unit
 * @returns {Array} Array of 5 question objects
 */
export function generateQuiz(unitId, vocabulary, templates) {
  const questions = [];
  
  console.log(`[Quiz Generator] Generating quiz for unit ${unitId}`);
  
  // Generate 2 Multiple Choice questions
  questions.push(generateWordOrderMC(templates, vocabulary, unitId));
  questions.push(generateGrammarFeatureMC(templates, vocabulary, unitId));
  
  // Generate 3 True/False questions
  questions.push(generateValidityTF(templates, vocabulary, unitId));
  questions.push(generateValidityTF(templates, vocabulary, unitId)); // Second validity question
  
  const grammarRuleQuestion = getRandomGrammarRuleTF(unitId);
  console.log(`[Quiz Generator] Grammar rule question for unit ${unitId}:`, grammarRuleQuestion.question.substring(0, 50));
  questions.push(grammarRuleQuestion);
  
  // Shuffle the questions
  const shuffled = shuffle(questions);
  console.log(`[Quiz Generator] Generated ${shuffled.length} questions for unit ${unitId}`);
  return shuffled;
}

/**
 * Generate a random valid sentence from vocabulary
 * Uses shared sentence builder to ensure consistency with SentenceConstruction
 * Retries multiple times with different templates/words if generation fails
 */
function generateValidSentence(templates, vocabulary, unitId) {
  // Get appropriate templates for the unit
  const validTemplates = templates.filter(t => t.unit === unitId);
  if (validTemplates.length === 0) {
    console.error('[Quiz Generator] No templates found for unit', unitId);
    return null;
  }
  
  // Shuffle templates for variety
  const shuffledTemplates = shuffle([...validTemplates]);
  
  // Try up to 10 times with different templates/combinations
  for (let attempt = 0; attempt < 10; attempt++) {
    const template = shuffledTemplates[attempt % shuffledTemplates.length];
    
    try {
      // Use shared sentence builder - ensures same validation rules as SentenceConstruction
      const sentence = buildSentence(template, vocabulary, unitId);
      
      // If we got a valid sentence, return it
      if (sentence) {
        return sentence;
      }
    } catch (error) {
      console.error('[Quiz Generator] Error building sentence (attempt', attempt + 1, '):', error);
      // Continue to next attempt
    }
  }
  
  console.error('[Quiz Generator] Failed to generate sentence after 10 attempts for unit', unitId);
  return null;
}

/**
 * Build action sentence (transitive verb with subject and object)
 */
function buildActionSentence(template, vocabByPos, unitId) {
  // Only for unit 2
  if (unitId !== 2) return null;
  
  const subjects = vocabByPos['noun']?.filter(n => n.can_be?.includes('subject')) || [];
  const verbs = vocabByPos['verb']?.filter(v => !v.term?.includes('दैन') && !v.term?.includes('छैन')) || [];
  const objects = vocabByPos['noun']?.filter(n => n.can_be?.includes('object')) || [];
  
  if (subjects.length === 0 || verbs.length === 0 || objects.length === 0) return null;
  
  // Use semantic validation like sentence construction
  const subject = subjects[Math.floor(Math.random() * subjects.length)];
  
  // Filter verbs to find ones with compatible objects
  const compatibleVerbs = verbs.filter(verb => {
    return objects.some(obj => isValidVerbObjectPair(verb, obj));
  });
  
  if (compatibleVerbs.length === 0) return null;
  
  const verb = compatibleVerbs[Math.floor(Math.random() * compatibleVerbs.length)];
  
  // Filter objects to only compatible ones for this verb
  const compatibleObjects = objects.filter(obj => isValidVerbObjectPair(verb, obj));
  
  if (compatibleObjects.length === 0) return null;
  
  const object = compatibleObjects[Math.floor(Math.random() * compatibleObjects.length)];
  
  const isNegative = template.negation_type === 'action_present';
  
  // Build Nepali sentence
  const nepaliParts = [
    subject.term + 'ले',
    object.term,
    isNegative ? (verb.negative_present || verb.term) : verb.term
  ];
  
  const nepali = nepaliParts.join(' ') + '।';
  
  // Build English
  const englishParts = [
    'The ' + (subject.definition || subject.gloss || 'one'),
    isNegative ? 'does not' : '',
    (verb.definition || verb.gloss || 'acts').toLowerCase(),
    (object.definition || object.gloss || 'something')
  ];
  
  const components = {
    subject: { nepali: subject.term, english: subject.definition || subject.gloss, transliteration: subject.transliteration },
    verb: { nepali: verb.term, english: verb.definition || verb.gloss, transliteration: verb.transliteration },
    object: { nepali: object.term, english: object.definition || object.gloss, transliteration: object.transliteration },
    ergative: 'ले'
  };
  
  return {
    nepali: nepali,
    transliteration: `${subject.transliteration || subject.term}le ${object.transliteration || object.term} ${verb.transliteration || verb.term}`,
    english: englishParts.filter(p => p).join(' ') + '.',
    type: template.type,
    template: template.id,
    components: components
  };
}

/**
 * Build existence sentence
 */
function buildExistenceSentence(template, vocabByPos, unitId) {
  // Only for unit 1 or 3 (negation)
  if (unitId === 2) return null;
  
  // Filter objects like sentence construction - only allow inanimate objects
  const allObjects = vocabByPos['noun']?.filter(n => n.can_be?.includes('object')) || [];
  
  const objects = allObjects.filter(word => {
    // Exclude animate nouns (people and animals)
    const isPerson = word.category === 'person' || word.category === 'family_member';
    const isAnimate = word.animacy === 'animate' || isPerson;
    const isAnimal = word.category === 'animal';
    // Block body-whole nouns (grammatically correct but semantically disturbing)
    const bodyWholeTerms = ['शरीर', 'छाल', 'रगत', 'हड्डी']; // body, skin, blood, bone
    const isBodyWhole = bodyWholeTerms.includes(word.term);
    // Block numbers (pedagogically weird - "seven exists" doesn't make sense)
    const isNumber = word.category === 'number';
    return !isAnimate && !isAnimal && !isBodyWhole && !isNumber;
  });
  
  if (objects.length === 0) return null;
  
  const object = objects[Math.floor(Math.random() * objects.length)];
  const isNegative = template.negation_type === 'existence';
  const copula = isNegative ? 'छैन' : 'छ';
  
  const nepali = `${object.term} ${copula}।`;
  
  const copulaTrans = copula === 'छ' ? 'cha' : 'chhaina';
  
  return {
    nepali: nepali,
    transliteration: `${object.transliteration || object.term} ${copulaTrans}`,
    english: `There is ${isNegative ? 'not ' : ''}a ${(object.definition || object.gloss || 'thing').toLowerCase()}.`,
    type: template.type,
    template: template.id,
    components: {
      object: { nepali: object.term, english: object.definition || object.gloss, transliteration: object.transliteration },
      copula: copula
    }
  };
}

/**
 * Build possession sentence
 */
function buildPossessionSentence(template, vocabByPos, unitId) {
  // Only for unit 1 or 3 (negation)
  if (unitId === 2) return null;
  
  // Filter possessors - must be animate (people/animals)
  const possessors = vocabByPos['noun']?.filter(n => {
    return n.can_be?.includes('subject') && (n.animacy === 'animate' || n.category === 'person' || n.category === 'family_member');
  }) || [];
  
  // Filter objects - must have possessable: true (like sentence construction)
  const allObjects = vocabByPos['noun']?.filter(n => n.can_be?.includes('object')) || [];
  const objects = allObjects.filter(word => {
    // Only allow objects marked as possessable
    if (word.possessable !== true) return false;
    // Also filter out numbers - they don't make semantic sense
    if (word.category === 'number') return false;
    return true;
  });
  
  if (possessors.length === 0 || objects.length === 0) return null;
  
  const possessor = possessors[Math.floor(Math.random() * possessors.length)];
  const object = objects[Math.floor(Math.random() * objects.length)];
  const isNegative = template.negation_type === 'possession';
  const copula = isNegative ? 'छैन' : 'छ';
  
  const nepali = `${possessor.term}सङ्ग ${object.term} ${copula}।`;
  const copulaTrans = copula === 'छ' ? 'cha' : 'chhaina';
  
  return {
    nepali: nepali,
    transliteration: `${possessor.transliteration || possessor.term}sanga ${object.transliteration || object.term} ${copulaTrans}`,
    english: `The ${(possessor.definition || possessor.gloss || 'one').toLowerCase()} ${isNegative ? 'does not have' : 'has'} a ${(object.definition || object.gloss || 'thing').toLowerCase()}.`,
    type: template.type,
    template: template.id,
    components: {
      possessor: { nepali: possessor.term, english: possessor.definition || possessor.gloss, transliteration: possessor.transliteration },
      object: { nepali: object.term, english: object.definition || object.gloss, transliteration: object.transliteration },
      particle: 'सङ्ग',
      copula: copula
    }
  };
}

/**
 * Build identity sentence with noun
 */
function buildIdentityNounSentence(template, vocabByPos, unitId) {
  // Only for unit 1 or 3 (negation)
  if (unitId === 2) return null;
  
  const subjects = vocabByPos['noun']?.filter(n => n.can_be?.includes('subject')) || [];
  const identityNouns = vocabByPos['noun']?.filter(n => n.can_be?.includes('identity_noun') || n.category === 'profession') || [];
  
  if (subjects.length === 0 || identityNouns.length === 0) return null;
  
  const subject = subjects[Math.floor(Math.random() * subjects.length)];
  const identityNoun = identityNouns[Math.floor(Math.random() * identityNouns.length)];
  const isNegative = template.negation_type === 'identity';
  const copula = isNegative ? 'होइन' : 'हो';
  
  const nepali = `${subject.term} ${identityNoun.term} ${copula}।`;
  const copulaTrans = copula === 'हो' ? 'ho' : 'hoina';
  
  return {
    nepali: nepali,
    transliteration: `${subject.transliteration || subject.term} ${identityNoun.transliteration || identityNoun.term} ${copulaTrans}`,
    english: `The ${(subject.definition || subject.gloss || 'one').toLowerCase()} is ${isNegative ? 'not ' : ''}a ${(identityNoun.definition || identityNoun.gloss || 'person').toLowerCase()}.`,
    type: template.type,
    template: template.id,
    components: {
      subject: { nepali: subject.term, english: subject.definition || subject.gloss, transliteration: subject.transliteration },
      identityNoun: { nepali: identityNoun.term, english: identityNoun.definition || identityNoun.gloss, transliteration: identityNoun.transliteration },
      copula: copula
    }
  };
}

/**
 * Build identity sentence with adjective
 */
function buildIdentityAdjSentence(template, vocabByPos, unitId) {
  // Only for unit 1 or 3 (negation)
  if (unitId === 2) return null;
  
  const subjects = vocabByPos['noun']?.filter(n => n.can_be?.includes('subject')) || [];
  const adjectives = vocabByPos['adjective'] || [];
  
  if (subjects.length === 0 || adjectives.length === 0) return null;
  
  const subject = subjects[Math.floor(Math.random() * subjects.length)];
  
  // Use semantic validation like sentence construction - filter adjectives compatible with this subject
  const compatibleAdjectives = adjectives.filter(adj => isValidAdjectiveSubjectPair(adj, subject));
  
  if (compatibleAdjectives.length === 0) return null;
  
  const adjective = compatibleAdjectives[Math.floor(Math.random() * compatibleAdjectives.length)];
  const isNegative = template.negation_type === 'identity_adj';
  const copula = isNegative ? 'छैन' : 'छ';
  
  const nepali = `${subject.term} ${adjective.term} ${copula}।`;
  const copulaTrans = copula === 'छ' ? 'cha' : 'chhaina';
  
  return {
    nepali: nepali,
    transliteration: `${subject.transliteration || subject.term} ${adjective.transliteration || adjective.term} ${copulaTrans}`,
    english: `The ${(subject.definition || subject.gloss || 'one').toLowerCase()} is ${isNegative ? 'not ' : ''}${(adjective.definition || adjective.gloss || 'nice').toLowerCase()}.`,
    type: template.type,
    template: template.id,
    components: {
      subject: { nepali: subject.term, english: subject.definition || subject.gloss, transliteration: subject.transliteration },
      adjective: { nepali: adjective.term, english: adjective.definition || adjective.gloss, transliteration: adjective.transliteration },
      copula: copula
    }
  };
}

/**
 * MC Question Type 1: Word Order
 * Given English, find correct Nepali word order
 */
function generateWordOrderMC(templates, vocabulary, unitId) {
  // Try multiple times to generate a sentence
  let sentence = null;
  for (let i = 0; i < 5; i++) {
    sentence = generateValidSentence(templates, vocabulary, unitId);
    if (sentence) break;
  }
  
  if (!sentence) {
    throw new Error('Failed to generate word order MC question after multiple attempts');
  }
  
  const correctNepali = sentence.nepali;
  const english = sentence.english;
  
  // Generate wrong word orders
  const distractors = generateWrongWordOrders(sentence);
  
  // Build options
  const options = shuffle([
    correctNepali,
    ...distractors.slice(0, 3)
  ]);
  
  const correctAnswer = options.indexOf(correctNepali);
  
  return {
    type: 'multiple_choice',
    question: `"${english}" - Which Nepali sentence is grammatically correct?`,
    options: options,
    answer: correctAnswer,
    explanation: getWordOrderExplanation(sentence),
    nepali: correctNepali,
    transliteration: sentence.transliteration,
  };
}

/**
 * Generate wrong word order variations
 */
function generateWrongWordOrders(sentence) {
  const distractors = [];
  const parts = sentence.nepali.replace('।', '').split(' ');
  
  if (sentence.type === 'action') {
    // Wrong orders for action sentences
    // Correct: Subject+ले Object Verb
    const subj = parts[0]; // includes ले
    const obj = parts[1];
    const verb = parts[2];
    
    distractors.push(`${obj} ${subj} ${verb}।`); // OSV
    distractors.push(`${verb} ${subj} ${obj}।`); // VSO
    
    // Misplaced ergative marker
    const subjWithoutLe = subj.replace('ले', '');
    distractors.push(`${subjWithoutLe} ${obj} ले ${verb}।`);
    
  } else if (sentence.type === 'possession') {
    // Wrong orders for possession
    // Correct: Possessor+सङ्ग Object Copula
    const poss = parts[0]; // includes सङ्ग
    const obj = parts[1];
    const copula = parts[2];
    
    distractors.push(`${obj} ${poss} ${copula}।`); // Object first
    
    // Misplaced सङ्ग
    const possWithoutSanga = poss.replace('सङ्ग', '');
    distractors.push(`${possWithoutSanga} ${obj}सङ्ग ${copula}।`);
    distractors.push(`${possWithoutSanga} ${obj} ${copula} सङ्ग।`);
    
  } else if (sentence.type === 'identity_noun' || sentence.type === 'identity_adj') {
    // Wrong orders for identity/adjective
    // Correct: Subject Modifier Copula
    const subj = parts[0];
    const modifier = parts[1];
    const copula = parts[2];
    
    distractors.push(`${modifier} ${subj} ${copula}।`); // Modifier first
    distractors.push(`${copula} ${subj} ${modifier}।`); // Copula first
    distractors.push(`${subj} ${copula} ${modifier}।`); // Copula before modifier
    
  } else if (sentence.type === 'existence' || sentence.type === 'existence_animate') {
    // Wrong orders for existence
    // Correct: Object Copula
    const obj = parts[0];
    const copula = parts[1];
    
    distractors.push(`${copula} ${obj}।`); // Copula first
    distractors.push(`${obj} ${copula} ${copula}।`); // Duplicate copula
    distractors.push(`${copula} ${obj} ${copula}।`); // Copula on both sides
    
  } else {
    // Generic scrambling for other types
    const shuffled1 = shuffle([...parts]).join(' ') + '।';
    const shuffled2 = shuffle([...parts]).join(' ') + '।';
    const shuffled3 = shuffle([...parts]).join(' ') + '।';
    distractors.push(shuffled1, shuffled2, shuffled3);
  }
  
  // Ensure distractors are different from correct answer
  return distractors.filter(d => d !== sentence.nepali);
}

/**
 * MC Question Type 2: Translation Options
 * Given Nepali, find correct English translation
 */
function generateTranslationMC(templates, vocabulary, unitId) {
  const sentence = generateValidSentence(templates, vocabulary, unitId);
  if (!sentence) return generateFallbackTranslationMC(unitId);
  
  const nepali = sentence.nepali;
  const correctEnglish = sentence.english;
  
  // Generate wrong translations
  const distractors = generateWrongTranslations(sentence, vocabulary);
  
  // Build options
  const options = shuffle([
    correctEnglish,
    ...distractors.slice(0, 3)
  ]);
  
  const correctAnswer = options.indexOf(correctEnglish);
  
  return {
    type: 'multiple_choice',
    question: `"${nepali}" means:`,
    options: options,
    answer: correctAnswer,
    explanation: getTranslationExplanation(sentence),
    nepali: nepali,
  };
}

/**
 * Generate wrong translation options
 */
function generateWrongTranslations(sentence, vocabulary) {
  const distractors = [];
  const comp = sentence.components;
  
  if (sentence.type === 'action') {
    // Wrong verb interpretation
    distractors.push(`The ${comp.subject.english.toLowerCase()} is ${comp.object.english.toLowerCase()}.`);
    distractors.push(`The ${comp.subject.english.toLowerCase()} has ${comp.object.english.toLowerCase()}.`);
    distractors.push(`There is ${comp.object.english.toLowerCase()} with the ${comp.subject.english.toLowerCase()}.`);
    
  } else if (sentence.type === 'possession') {
    // Wrong sentence type
    distractors.push(`The ${comp.possessor.english.toLowerCase()} is a ${comp.object.english.toLowerCase()}.`);
    distractors.push(`The ${comp.possessor.english.toLowerCase()} ${comp.object.english.toLowerCase()}s.`);
    distractors.push(`There is ${comp.object.english.toLowerCase()} with the ${comp.possessor.english.toLowerCase()}.`);
    
  } else if (sentence.type === 'identity_noun') {
    // Wrong copula interpretation
    distractors.push(`The ${comp.subject.english.toLowerCase()} has a ${comp.identityNoun.english.toLowerCase()}.`);
    distractors.push(`There is a ${comp.identityNoun.english.toLowerCase()} with the ${comp.subject.english.toLowerCase()}.`);
    distractors.push(`The ${comp.subject.english.toLowerCase()} sees a ${comp.identityNoun.english.toLowerCase()}.`);
    
  } else if (sentence.type === 'identity_adj') {
    // Wrong copula interpretation
    distractors.push(`The ${comp.subject.english.toLowerCase()} is a ${comp.adjective.english.toLowerCase()}.`);
    distractors.push(`The ${comp.subject.english.toLowerCase()} has ${comp.adjective.english.toLowerCase()}.`);
    distractors.push(`There is ${comp.adjective.english.toLowerCase()} ${comp.subject.english.toLowerCase()}.`);
    
  } else if (sentence.type === 'existence') {
    distractors.push(`The ${comp.object.english.toLowerCase()} is here.`);
    distractors.push(`It is a ${comp.object.english.toLowerCase()}.`);
    distractors.push(`The ${comp.object.english.toLowerCase()} exists.`);
  }
  
  return distractors.filter(d => d !== sentence.english && d.trim());
}

/**
 * MC Question Type 3: Grammar Feature Identification
 * Identify which grammar feature a sentence uses
 */
function generateGrammarFeatureMC(templates, vocabulary, unitId) {
  // Try multiple times to generate a sentence
  let sentence = null;
  for (let i = 0; i < 5; i++) {
    sentence = generateValidSentence(templates, vocabulary, unitId);
    if (sentence) break;
  }
  
  if (!sentence) {
    throw new Error('Failed to generate grammar feature MC question after multiple attempts');
  }
  
  const features = getGrammarFeaturesForUnit(unitId);
  
  // Determine correct feature based on sentence type
  let correctFeatureId = '';
  if (sentence.type === 'action') {
    correctFeatureId = 'ergative_case';
  } else if (sentence.type === 'possession') {
    correctFeatureId = 'possession';
  } else if (sentence.type === 'identity_noun') {
    correctFeatureId = 'identity_copula';
  } else if (sentence.type === 'identity_adj') {
    correctFeatureId = 'adjective_copula';
  } else if (sentence.type === 'existence') {
    correctFeatureId = 'existence';
  }
  
  // Find correct feature and get distractors
  const correctFeature = features.find(f => f.id === correctFeatureId);
  if (!correctFeature) {
    console.error('[Quiz Generator] Correct feature not found:', correctFeatureId, 'for unit', unitId);
    throw new Error('Invalid sentence type for unit ' + unitId);
  }
  
  // Get all distractors (exclude correct feature)
  const allDistractors = features.filter(f => f.id !== correctFeatureId);
  
  // Shuffle distractors to get random selection
  const shuffledDistractors = shuffle([...allDistractors]);
  
  // Build options array ensuring uniqueness by label
  const options = [correctFeature.label];
  const usedLabels = new Set([correctFeature.label]);
  
  // Add up to 3 unique distractors
  for (const distractor of shuffledDistractors) {
    if (options.length >= 4) break;
    if (!usedLabels.has(distractor.label)) {
      options.push(distractor.label);
      usedLabels.add(distractor.label);
    }
  }
  
  // If we don't have 4 options yet, we have fewer features than needed - that's okay
  // Just use what we have
  const shuffledOptions = shuffle(options);
  const correctAnswer = shuffledOptions.indexOf(correctFeature.label);
  
  // Debug: Log to verify no duplicates
  if (shuffledOptions.length !== new Set(shuffledOptions).size) {
    console.error('[Quiz Generator] Duplicate options detected:', shuffledOptions);
  }
  
  return {
    type: 'multiple_choice',
    question: `What grammatical feature does "${sentence.nepali}" demonstrate?`,
    options: shuffledOptions,
    answer: correctAnswer,
    explanation: `This sentence uses ${correctFeature.label}: ${correctFeature.description}.`,
    nepali: sentence.nepali,
    transliteration: sentence.transliteration,
  };
}

/**
 * TF Question Type 1: Sentence Validity
 * Is this Nepali sentence grammatically correct?
 */
function generateValidityTF(templates, vocabulary, unitId) {
  const isCorrect = Math.random() < 0.5;
  
  // Try multiple times to generate a sentence
  let sentence = null;
  for (let i = 0; i < 5; i++) {
    sentence = generateValidSentence(templates, vocabulary, unitId);
    if (sentence) break;
  }
  
  if (!sentence) {
    throw new Error('Failed to generate validity TF question after multiple attempts');
  }
  
  let questionSentence = sentence.nepali;
  let questionTransliteration = sentence.transliteration || '';
  let explanation = '';
  
  if (isCorrect) {
    // Use correct sentence
    explanation = getCorrectSentenceExplanation(sentence);
  } else {
    // Introduce an error
    const errorResult = introduceGrammaticalError(sentence, unitId);
    questionSentence = errorResult.sentence;
    questionTransliteration = errorResult.transliteration || generateTransliterationFromNepali(questionSentence);
    explanation = errorResult.explanation;
  }
  
  return {
    type: 'true_false',
    question: `"${questionSentence}" is grammatically correct.`,
    answer: isCorrect,
    explanation: explanation,
    nepali: questionSentence,
    transliteration: questionTransliteration,
  };
}

/**
 * Generate transliteration from Nepali sentence
 * Simple helper that updates transliteration when sentence is modified
 */
function generateTransliterationFromNepali(nepali) {
  // Map common Nepali words to transliteration
  const transliterationMap = {
    'छ': 'cha',
    'छैन': 'chhaina',
    'हो': 'ho',
    'होइन': 'hoina',
    'सङ्ग': 'sanga',
    'ले': 'le',
  };
  
  // Split sentence and try to transliterate each part
  const parts = nepali.replace('।', '').split(' ');
  const transliterated = parts.map(part => {
    // Check if part ends with सङ्ग or ले
    if (part.endsWith('सङ्ग')) {
      const base = part.replace('सङ्ग', '');
      return `${base}sanga`;
    } else if (part.endsWith('ले')) {
      const base = part.replace('ले', '');
      return `${base}le`;
    } else if (transliterationMap[part]) {
      return transliterationMap[part];
    }
    // For unknown words, try to get from components if available
    return part;
  });
  
  return transliterated.join(' ');
}

/**
 * Introduce grammatical errors based on unit
 */
function introduceGrammaticalError(sentence, unitId) {
  const parts = sentence.nepali.replace('।', '').split(' ');
  
  if (unitId === 1) {
    // Unit 1 errors: wrong copula, missing सङ्ग
    if (sentence.type === 'identity_noun') {
      // Use छ instead of हो
      const wrong = sentence.nepali.replace(' हो।', ' छ।').replace(' होइन।', ' छैन।');
      const wrongTrans = sentence.transliteration?.replace(' ho', ' cha').replace(' hoina', ' chhaina') || generateTransliterationFromNepali(wrong);
      return {
        sentence: wrong,
        transliteration: wrongTrans,
        explanation: 'Identity sentences with nouns use हो, not छ. छ is for adjectives and existence.'
      };
    } else if (sentence.type === 'identity_adj') {
      // Use हो instead of छ
      const wrong = sentence.nepali.replace(' छ।', ' हो।').replace(' छैन।', ' होइन।');
      const wrongTrans = sentence.transliteration?.replace(' cha', ' ho').replace(' chhaina', ' hoina') || generateTransliterationFromNepali(wrong);
      return {
        sentence: wrong,
        transliteration: wrongTrans,
        explanation: 'Adjective sentences use छ, not हो. हो is for identity with nouns.'
      };
    } else if (sentence.type === 'possession') {
      // Remove सङ्ग
      const wrong = sentence.nepali.replace('सङ्ग', '');
      // Update transliteration: remove "sanga" from the transliteration
      const wrongTrans = sentence.transliteration?.replace('sanga ', '').replace('sanga', '') || generateTransliterationFromNepali(wrong);
      return {
        sentence: wrong,
        transliteration: wrongTrans.trim(),
        explanation: 'Possession requires सङ्ग (with) after the possessor: [Possessor]सङ्ग [Object] छ.'
      };
    } else if (sentence.type === 'existence') {
      // For existence sentences, use wrong word order (copula first)
      // Note: Changing छ to हो would be grammatically correct (identity), just different meaning
      // So we use wrong word order instead
      const parts = sentence.nepali.replace('।', '').split(' ');
      if (parts.length === 2) {
        // Swap: Object Copula -> Copula Object
        const wrong = `${parts[1]} ${parts[0]}।`;
        const transParts = sentence.transliteration?.split(' ') || [];
        const wrongTrans = transParts.length === 2 ? `${transParts[1]} ${transParts[0]}` : generateTransliterationFromNepali(wrong);
        return {
          sentence: wrong,
          transliteration: wrongTrans,
          explanation: 'Existence sentences follow the order: [Object] छ. The copula छ comes after the object, not before.'
        };
      }
    }
    
  } else if (unitId === 2) {
    // Unit 2 errors: missing/misplaced ले, wrong word order
    if (sentence.type === 'action') {
      const errorType = Math.random();
      if (errorType < 0.5) {
        // Remove ले
        const wrong = sentence.nepali.replace('ले', '');
        const wrongTrans = sentence.transliteration?.replace('le ', '').replace('le', '') || generateTransliterationFromNepali(wrong);
        return {
          sentence: wrong,
          transliteration: wrongTrans.trim(),
          explanation: 'Transitive verbs require the ergative marker ले on the subject.'
        };
      } else {
        // Move ले to wrong position
        const subjWithLe = parts[0];
        const subjWithoutLe = subjWithLe.replace('ले', '');
        const wrong = `${subjWithoutLe} ${parts[1]} ले ${parts[2]}।`;
        const transParts = sentence.transliteration?.split(' ') || [];
        const wrongTrans = transParts.length >= 3 
          ? `${transParts[0].replace('le', '')} ${transParts[1]} le ${transParts[2]}`
          : generateTransliterationFromNepali(wrong);
        return {
          sentence: wrong,
          transliteration: wrongTrans,
          explanation: 'The ergative marker ले must attach directly to the subject, not be placed elsewhere.'
        };
      }
    }
    
  } else if (unitId === 3) {
    // Unit 3 errors: wrong negative form
    if (sentence.nepali.includes('होइन')) {
      // Use छैन instead of होइन
      const wrong = sentence.nepali.replace('होइन', 'छैन');
      const wrongTrans = sentence.transliteration?.replace('hoina', 'chhaina') || generateTransliterationFromNepali(wrong);
      return {
        sentence: wrong,
        transliteration: wrongTrans,
        explanation: 'Identity negation uses होइन, not छैन. छैन is for existence/adjectives.'
      };
    } else if (sentence.nepali.includes('छैन')) {
      // Use होइन instead of छैन
      const wrong = sentence.nepali.replace('छैन', 'होइन');
      const wrongTrans = sentence.transliteration?.replace('chhaina', 'hoina') || generateTransliterationFromNepali(wrong);
      return {
        sentence: wrong,
        transliteration: wrongTrans,
        explanation: 'Existence/adjective negation uses छैन, not होइन. होइन is for identity.'
      };
    }
  }
  
  // Default: wrong word order
  const shuffled = shuffle([...parts]).join(' ') + '।';
  const transParts = sentence.transliteration?.split(' ') || [];
  const shuffledTrans = transParts.length > 0 
    ? shuffle([...transParts]).join(' ')
    : generateTransliterationFromNepali(shuffled);
  return {
    sentence: shuffled,
    transliteration: shuffledTrans,
    explanation: 'The word order is incorrect for Nepali grammar.'
  };
}

/**
 * Explanation helpers
 */
function getWordOrderExplanation(sentence) {
  if (sentence.type === 'action') {
    return 'Correct SOV order with ergative marker: [Subject]ले [Object] [Verb].';
  } else if (sentence.type === 'possession') {
    return 'Correct possession structure: [Possessor]सङ्ग [Object] छ.';
  } else if (sentence.type === 'identity_noun' || sentence.type === 'identity_adj') {
    return 'Correct structure: [Subject] [Modifier] [Copula].';
  }
  return 'This follows correct Nepali word order.';
}

function getTranslationExplanation(sentence) {
  if (sentence.type === 'action') {
    return `${sentence.components.ergative} marks the subject doing the transitive action.`;
  } else if (sentence.type === 'possession') {
    return 'सङ्ग + छ creates possession meaning "has".';
  } else if (sentence.type === 'identity_noun') {
    return 'हो is the identity copula for nouns.';
  } else if (sentence.type === 'identity_adj') {
    return 'छ is used with adjectives.';
  }
  return 'This is the correct translation.';
}

function getCorrectSentenceExplanation(sentence) {
  if (sentence.type === 'action') {
    return 'Correct: Uses ergative marker ले and SOV word order.';
  } else if (sentence.type === 'possession') {
    return 'Correct: Uses सङ्ग for possession with proper structure.';
  } else if (sentence.type === 'identity_noun') {
    return 'Correct: Uses हो for identity with a noun.';
  } else if (sentence.type === 'identity_adj') {
    return 'Correct: Uses छ with an adjective.';
  }
  return 'This sentence is grammatically correct.';
}

/**
 * Fallback questions if generation fails
 */
function generateFallbackQuestions(unitId) {
  return [
    generateFallbackWordOrderMC(unitId),
    generateFallbackGrammarFeatureMC(unitId),
    generateFallbackValidityTF(unitId),
    generateFallbackValidityTF(unitId),
    getRandomGrammarRuleTF(unitId),
  ];
}

function generateFallbackWordOrderMC(unitId) {
  const examples = {
    1: {
      nepali: 'ऊ शिक्षक हो।',
      english: 'He is a teacher.',
      options: ['शिक्षक ऊ हो।', 'ऊ शिक्षक हो।', 'हो ऊ शिक्षक।', 'ऊ हो शिक्षक।'],
      answer: 1
    },
    2: {
      nepali: 'केटाले भात खान्छ।',
      english: 'The boy eats rice.',
      options: ['भात केटाले खान्छ।', 'केटाले भात खान्छ।', 'खान्छ केटाले भात।', 'केटा भात ले खान्छ।'],
      answer: 1
    },
    3: {
      nepali: 'ऊ शिक्षक होइन।',
      english: 'He is not a teacher.',
      options: ['शिक्षक ऊ होइन।', 'ऊ शिक्षक होइन।', 'होइन ऊ शिक्षक।', 'ऊ होइन शिक्षक।'],
      answer: 1
    }
  };
  
  const ex = examples[unitId] || examples[1];
  return {
    type: 'multiple_choice',
    question: `"${ex.english}" - Which is correct?`,
    options: ex.options,
    answer: ex.answer,
    explanation: 'This follows correct Nepali word order.',
    nepali: ex.nepali,
  };
}

function generateFallbackTranslationMC(unitId) {
  const examples = {
    1: {
      nepali: 'केटासङ्ग किताब छ।',
      options: ['The boy is a book.', 'The boy has a book.', 'The boy reads a book.', 'There is a book with the boy.'],
      answer: 1
    },
    2: {
      nepali: 'रामले भात खान्छ।',
      options: ['Ram is rice.', 'Ram eats rice.', 'Ram has rice.', 'There is rice with Ram.'],
      answer: 1
    },
    3: {
      nepali: 'गाडी छैन।',
      options: ['The car is here.', 'There is not a car.', 'It is not a car.', 'The car is not.'],
      answer: 1
    }
  };
  
  const ex = examples[unitId] || examples[1];
  return {
    type: 'multiple_choice',
    question: `"${ex.nepali}" means:`,
    options: ex.options,
    answer: ex.answer,
    explanation: 'This is the correct translation.',
    nepali: ex.nepali,
  };
}

function generateFallbackGrammarFeatureMC(unitId) {
  const examples = {
    1: {
      nepali: 'केटो अग्लो छ।',
      options: ['Identity copula', 'Adjective copula', 'Possession', 'Existence'],
      answer: 1
    },
    2: {
      nepali: 'रामले भात खान्छ।',
      options: ['Possession', 'Ergative case', 'Identity copula', 'Negation'],
      answer: 1
    },
    3: {
      nepali: 'ऊ शिक्षक होइन।',
      options: ['Possession', 'Ergative case', 'Identity negation', 'Existence'],
      answer: 2
    }
  };
  
  const ex = examples[unitId] || examples[1];
  return {
    type: 'multiple_choice',
    question: `What grammatical feature does "${ex.nepali}" demonstrate?`,
    options: ex.options,
    answer: ex.answer,
    explanation: 'This sentence demonstrates the selected grammatical feature.',
    nepali: ex.nepali,
  };
}

function generateFallbackValidityTF(unitId) {
  const examples = {
    1: {
      sentence: 'ऊ शिक्षक हो।',
      answer: true,
      explanation: 'Correct: Uses हो for identity with a noun.'
    },
    2: {
      sentence: 'केटा भात खान्छ।',
      answer: false,
      explanation: 'Missing ergative marker ले. Should be: केटाले भात खान्छ।'
    },
    3: {
      sentence: 'गाडी छैन।',
      answer: true,
      explanation: 'Correct: Uses छैन for existence negation.'
    }
  };
  
  const ex = examples[unitId] || examples[1];
  return {
    type: 'true_false',
    question: `"${ex.sentence}" is grammatically correct.`,
    answer: ex.answer,
    explanation: ex.explanation,
    nepali: ex.sentence,
  };
}

