// Shared Sentence Builder Utility
// Builds grammatically correct sentences using the same validation rules as SentenceConstruction
// Used by both SentenceConstruction and QuizGenerator

import { isValidVerbObjectPair, isValidAdjectiveSubjectPair, generatePossessiveConstruction } from './helpers';
import { buildEnglishSubjectPhrase, buildEnglishObjectPhrase, getEnglishArticle } from './postpositionMapper';

/**
 * Build a sentence from a template and vocabulary
 * Uses the same filtering and validation rules as SentenceConstruction
 * 
 * @param {Object} template - Sentence template
 * @param {Array} vocabulary - Filtered vocabulary array
 * @param {number} unitId - Grammar unit (1, 2, or 3)
 * @returns {Object|null} Sentence object with nepali, english, transliteration, type, components, or null if generation fails
 */
export function buildSentence(template, vocabulary, unitId) {
  // Group vocabulary by part of speech
  const vocabByPos = {};
  vocabulary.forEach(word => {
    if (!vocabByPos[word.part_of_speech]) {
      vocabByPos[word.part_of_speech] = [];
    }
    vocabByPos[word.part_of_speech].push(word);
  });

  switch (template.type) {
    case 'action':
      return buildActionSentence(template, vocabByPos, unitId, vocabulary);
    case 'existence':
      return buildExistenceSentence(template, vocabByPos, unitId);
    case 'possession':
      return buildPossessionSentence(template, vocabByPos, unitId);
    case 'identity_noun':
      return buildIdentityNounSentence(template, vocabByPos, unitId);
    case 'identity_adj':
      return buildIdentityAdjSentence(template, vocabByPos, unitId);
    default:
      return null;
  }
}

/**
 * Build action sentence (transitive verb with subject and object)
 * Uses same validation as SentenceConstruction
 */
function buildActionSentence(template, vocabByPos, unitId, vocabulary) {
  // Only for unit 2 (or unit 3 for negation)
  if (unitId === 2 || (unitId === 3 && template.negation_type === 'action_present')) {
    // Filter verbs - must be action verbs, not infinitive
    const verbs = vocabByPos['verb']?.filter(word => {
      if (word.verb_type !== 'action') return false;
      // Block infinitive verbs (ending with नु) - sentences must use finite forms
      const term = word.term || '';
      const isInfinitive = term.endsWith('नु') && !term.includes('हुन्छ');
      return !isInfinitive;
    }) || [];

    // Filter subjects - must be animate
    const subjects = vocabByPos['noun']?.filter(word => {
      return word.can_be && word.can_be.includes('subject') && 
        (word.animacy === 'animate' || word.category === 'person' || word.category === 'family_member');
    }) || [];

    const objects = vocabByPos['noun']?.filter(word => word.can_be && word.can_be.includes('object')) || [];

    if (subjects.length === 0 || verbs.length === 0 || objects.length === 0) return null;

    // Find ergative marker
    const leErgative = vocabulary.find(w => w.term === 'ले' && w.can_be && w.can_be.includes('ergative_marker'));
    if (!leErgative) return null;

    // Pick subject first
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
    const verbTerm = isNegative ? (verb.negative_present || verb.term) : verb.term;

    // Check if object requires possession (e.g., body parts)
    const objectTerm = object.requires_possession ? 
      generatePossessiveConstruction(object, subject) : object.term;

    // Build Nepali sentence
    const nepali = `${subject.term} ${leErgative.term} ${objectTerm} ${verbTerm}।`;

    // Build transliteration
    const transliteration = [
      subject.transliteration || subject.term,
      'le',
      object.transliteration || object.term,
      verb.transliteration || verb.term
    ].join(' ');

    // Build English using same logic as SentenceConstruction
    const subjectPhrase = buildEnglishSubjectPhrase(subject);
    let verbGloss = verb?.gloss || verb?.definition || 'does';
    if (isNegative) {
      if (verbGloss.includes('does not')) {
        verbGloss = verbGloss;
      } else {
        verbGloss = `does not ${verbGloss.replace(/s$/, '')}`;
      }
    }
    const objectPhrase = buildEnglishObjectPhrase(object, verb);
    const english = `${subjectPhrase} ${verbGloss} ${objectPhrase}`;

    return {
      nepali,
      transliteration,
      english,
      type: template.type,
      template: template.id,
      components: {
        subject: { nepali: subject.term, english: subject.definition || subject.gloss, transliteration: subject.transliteration },
        verb: { nepali: verb.term, english: verb.definition || verb.gloss, transliteration: verb.transliteration },
        object: { nepali: object.term, english: object.definition || object.gloss, transliteration: object.transliteration },
        ergative: 'ले'
      }
    };
  }

  return null;
}

/**
 * Build existence sentence
 * Uses same filtering as SentenceConstruction
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
  const copulaTrans = copula === 'छ' ? 'cha' : 'chhaina';

  const nepali = `${object.term} ${copula}।`;
  const transliteration = `${object.transliteration || object.term} ${copulaTrans}`;
  const english = `There is ${isNegative ? 'not ' : ''}a ${(object.definition || object.gloss || 'thing').toLowerCase()}.`;

  return {
    nepali,
    transliteration,
    english,
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
 * Uses same validation as SentenceConstruction (possessable: true)
 */
function buildPossessionSentence(template, vocabByPos, unitId) {
  // Only for unit 1 or 3 (negation)
  if (unitId === 2) return null;

  // Filter possessors - must be animate (people/animals) - same as SentenceConstruction
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
  const copulaTrans = copula === 'छ' ? 'cha' : 'chhaina';

  const nepali = `${possessor.term}सङ्ग ${object.term} ${copula}।`;
  const transliteration = `${possessor.transliteration || possessor.term}sanga ${object.transliteration || object.term} ${copulaTrans}`;
  
  // Build English using same logic as SentenceConstruction
  const possessorPhrase = buildEnglishSubjectPhrase(possessor);
  const objectEnglish = object?.gloss || object?.definition || '';
  const article = getEnglishArticle(objectEnglish, object);
  const objectPhrase = article ? `${article} ${objectEnglish.toLowerCase()}` : objectEnglish.toLowerCase();
  const hasVerb = isNegative ? 'does not have' : 'has';
  const english = `${possessorPhrase} ${hasVerb} ${objectPhrase}`;

  return {
    nepali,
    transliteration,
    english,
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
  const copulaTrans = copula === 'हो' ? 'ho' : 'hoina';

  const nepali = `${subject.term} ${identityNoun.term} ${copula}।`;
  const transliteration = `${subject.transliteration || subject.term} ${identityNoun.transliteration || identityNoun.term} ${copulaTrans}`;
  
  // Build English using same logic as SentenceConstruction
  const subjectPhrase = buildEnglishSubjectPhrase(subject);
  const nounEnglish = identityNoun?.gloss || identityNoun?.definition || '';
  const article = getEnglishArticle(nounEnglish, identityNoun);
  const nounPhrase = article ? `${article} ${nounEnglish}` : nounEnglish;
  const isVerb = isNegative ? 'is not' : 'is';
  const english = `${subjectPhrase} ${isVerb} ${nounPhrase}`;

  return {
    nepali,
    transliteration,
    english,
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
 * Uses same validation as SentenceConstruction (isValidAdjectiveSubjectPair)
 */
function buildIdentityAdjSentence(template, vocabByPos, unitId) {
  // Only for unit 1 or 3 (negation)
  if (unitId === 2) return null;

  const subjects = vocabByPos['noun']?.filter(n => n.can_be?.includes('subject')) || [];
  const adjectives = vocabByPos['adjective'] || [];

  if (subjects.length === 0 || adjectives.length === 0) return null;

  // Pick subject first, then filter adjectives that work with it (same as SentenceConstruction)
  const subject = subjects[Math.floor(Math.random() * subjects.length)];
  const compatibleAdjectives = adjectives.filter(adj => isValidAdjectiveSubjectPair(adj, subject));

  if (compatibleAdjectives.length === 0) return null;

  const adjective = compatibleAdjectives[Math.floor(Math.random() * compatibleAdjectives.length)];
  const isNegative = template.negation_type === 'identity_adj';
  const copula = isNegative ? 'छैन' : 'छ';
  const copulaTrans = copula === 'छ' ? 'cha' : 'chhaina';

  const nepali = `${subject.term} ${adjective.term} ${copula}।`;
  const transliteration = `${subject.transliteration || subject.term} ${adjective.transliteration || adjective.term} ${copulaTrans}`;
  
  // Build English
  const subjectPhrase = buildEnglishSubjectPhrase(subject);
  const adjEnglish = adjective?.gloss || adjective?.definition || '';
  const isVerb = isNegative ? 'is not' : 'is';
  const english = `${subjectPhrase} ${isVerb} ${adjEnglish.toLowerCase()}`;

  return {
    nepali,
    transliteration,
    english,
    type: template.type,
    template: template.id,
    components: {
      subject: { nepali: subject.term, english: subject.definition || subject.gloss, transliteration: subject.transliteration },
      adjective: { nepali: adjective.term, english: adjective.definition || adjective.gloss, transliteration: adjective.transliteration },
      copula: copula
    }
  };
}
