// Shared Sentence Builder Utility
// Builds grammatically correct sentences using the same validation rules as SentenceConstruction
// Used by both SentenceConstruction and QuizGenerator

import sentenceTemplates from '../sentence_templates.json';
import {
  isValidVerbObjectPair,
  isValidAdjectiveSubjectPair,
  generatePossessiveConstruction,
  buildTermToFlashcardMap,
  isFiniteActionLemmaVerb,
  verbUsesErgativeConstruction,
} from './helpers';
import {
  buildEnglishSubjectPhrase,
  buildEnglishObjectPhrase,
  getEnglishArticle,
  getEnglishPreposition,
} from './postpositionMapper';
import { PARTICLE_KE, PARTICLE_KO_WHO, PARTICLE_KAHA, KO_LE, findVocabByTerm } from './questionParticles';
import {
  asPluralWord,
  toPluralCopula,
  toPluralVerb,
  attachErgativeToPlural,
  attachSangaToPlural,
  buildEnglishPluralSubjectPhrase,
  buildEnglishPluralObjectPhrase,
  mergeCompWithVocab,
  canTakePlural,
  copulaAgreesWithNoun,
  englishPluralLabel,
} from './pluralForms';
import {
  toBareEnglishVerb,
  pluralEnglishVerbPhrase,
  singularEnglishVerbPhrase,
  verbNeedsToBeforeObject,
} from './englishVerbForms';

/** Use first gloss before " / " so English is not "shop / store". */
function primaryGlossFromWord(word) {
  if (!word) return '';
  return primaryGlossText(word.gloss || word.definition || '');
}

/** "House / Home" → "House" so slashed glosses never reach the learner. */
function primaryGlossText(text) {
  const raw = String(text || '').trim();
  if (!raw) return '';
  return raw.split(/\s*\/\s*/)[0].trim();
}

/** Subjects that can plausibly "be" at a physical location (exclude time, abstract, genitive-linked). */
// Things that can't sensibly be said to sit "in/on" a place in this beginner grammar.
// Body parts need a possessor (मेरो पेट), and buildings/places aren't located inside other places.
const NOT_LOCATABLE_CATEGORIES = new Set([
  'time',
  'number',
  'concept',
  'emotion',
  'body',
  'body_part',
  'health',
  'appearance',
  'quality',
  'size',
  'taste',
  'price',
  'direction',
  'location',
  'place',
  'accommodation',
  'nature',
  'music',
  'household_activity',
  'work',
  'work_activity',
  'work_process',
  'work_material',
  'time_management',
  'time_state',
]);

// Abstract or body-related nouns make nonsense existence claims ("Are there noses?").
const NOT_EXISTABLE_CATEGORIES = new Set([
  'body',
  'body_part',
  'appearance',
  'concept',
  'emotion',
  'health',
  'direction',
  'household_activity',
  'work',
  'work_activity',
  'work_process',
  'time_management',
  'time_state',
]);

// Only small, portable things belong "on" a piece of furniture.
const TOO_BIG_FOR_FURNITURE = new Set([
  'person',
  'family_member',
  'transportation',
  'place',
  'accommodation',
  'household_space',
]);

function canBeLocatedEntity(n) {
  if (!n?.can_be?.includes('subject')) return false;
  if (NOT_LOCATABLE_CATEGORIES.has(n.category)) return false;
  if (n.requires_possession) return false;
  if (n.requires_genitive_link) return false;
  return true;
}

/** Reject nonsense pairs like "the stomachs are in the company" or "the car is on the table". */
function isValidSubjectPlacePair(subject, place) {
  if (!subject || !place) return false;
  if (subject.term === place.term) return false;
  const placeIsFurniture = place.category === 'furniture';
  if (placeIsFurniture && TOO_BIG_FOR_FURNITURE.has(subject.category)) return false;
  return true;
}

/**
 * Build a sentence from a template and vocabulary
 * Uses the same filtering and validation rules as SentenceConstruction
 *
 * @param {Object} template - Sentence template
 * @param {Array} vocabulary - Filtered vocabulary array
 * @param {number} unitId - Grammar unit (1–4+)
 * @returns {Object|null} Sentence object with nepali, english, transliteration, type, components, or null if generation fails
 */
export function buildSentence(template, vocabulary, unitId) {
  if (template.type === 'grammar_question') {
    if (template.unit === 5 || template.plural) {
      return buildPluralGrammarQuestionSentence(template, vocabulary);
    }
    return buildGrammarQuestionSentence(template, vocabulary);
  }

  if (template.unit === 5 && template.plural) {
    return buildPluralDeclarativeSentence(template, vocabulary);
  }

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
    case 'identity_location':
      return buildIdentityLocationSentence(template, vocabByPos, unitId);
    default:
      return null;
  }
}

/**
 * Build action sentence (transitive: ले + object + verb; intransitive motion: location+postposition + verb)
 * Uses same validation as SentenceConstruction
 */
function buildActionSentence(template, vocabByPos, unitId, vocabulary) {
  // Only for unit 2 (or unit 3 for negation)
  if (unitId === 2 || (unitId === 3 && template.negation_type === 'action_present')) {
    const termMap = buildTermToFlashcardMap(vocabulary);
    // Filter verbs - must be action lemmas (not standalone negative conjugations), not infinitive
    const verbs = vocabByPos['verb']?.filter(word => isFiniteActionLemmaVerb(word)) || [];

    // Filter subjects - must be animate
    const subjects = vocabByPos['noun']?.filter(word => {
      return word.can_be && word.can_be.includes('subject') && 
        (word.animacy === 'animate' || word.category === 'person' || word.category === 'family_member');
    }) || [];

    const objects = vocabByPos['noun']?.filter(word => word.can_be && word.can_be.includes('object')) || [];

    if (subjects.length === 0 || verbs.length === 0 || objects.length === 0) return null;

    const leErgative = vocabulary.find(w => w.term === 'ले' && w.can_be && w.can_be.includes('ergative_marker'));

    // Pick subject first
    const subject = subjects[Math.floor(Math.random() * subjects.length)];

    // Filter verbs to find ones with compatible objects
    const compatibleVerbs = verbs.filter(verb => {
      return objects.some(obj => isValidVerbObjectPair(verb, obj, termMap));
    });

    if (compatibleVerbs.length === 0) return null;

    const verb = compatibleVerbs[Math.floor(Math.random() * compatibleVerbs.length)];

    const usesErg = verbUsesErgativeConstruction(verb, termMap);
    if (usesErg && !leErgative) return null;

    // Filter objects to only compatible ones for this verb
    const compatibleObjects = objects.filter(obj => isValidVerbObjectPair(verb, obj, termMap));

    if (compatibleObjects.length === 0) return null;

    const object = compatibleObjects[Math.floor(Math.random() * compatibleObjects.length)];

    const isNegative = template.negation_type === 'action_present';
    const verbTerm = isNegative ? (verb.negative_present || verb.term) : verb.term;
    const finiteCard = vocabulary.find(w => w.term === verbTerm);
    const verb_finite = {
      nepali: verbTerm,
      english: finiteCard?.definition || verb.definition || verb.gloss,
      gloss: finiteCard?.gloss || finiteCard?.definition || verb.gloss,
      transliteration: finiteCard?.transliteration || verb.transliteration,
    };

    const objectBase = object.requires_possession
      ? generatePossessiveConstruction(object, subject)
      : object.term;
    const pp = verb.default_postposition || 'मा';
    const ppTranslit = pp === 'मा' ? 'ma' : pp;

    let nepali;
    let transliteration;
    const subjectPhrase = buildEnglishSubjectPhrase(subject);
    let verbGloss = verb?.gloss || verb?.definition || 'does';
    if (isNegative && !verbGloss.includes('does not')) {
      verbGloss = singularEnglishVerbPhrase(verbGloss, true);
    }
    const objGloss = primaryGlossFromWord(object);
    let objectPhrase = buildEnglishObjectPhrase(
      { ...object, gloss: objGloss, definition: objGloss },
      verb
    );
    if (verbNeedsToBeforeObject(verbGloss)) objectPhrase = `to ${objectPhrase}`;
    const english = `${subjectPhrase} ${verbGloss} ${objectPhrase}`;

    const subjectComp = {
      nepali: subject.term,
      english: subject.definition || subject.gloss,
      transliteration: subject.transliteration,
    };
    const objectComp = {
      nepali: object.term,
      english: object.definition || object.gloss,
      transliteration: object.transliteration,
    };
    const verbComp = {
      nepali: verb.term,
      english: verb.definition || verb.gloss,
      transliteration: verb.transliteration,
    };

    if (usesErg) {
      nepali = `${subject.term} ${leErgative.term} ${objectBase} ${verbTerm}।`;
      transliteration = [
        subject.transliteration || subject.term,
        'le',
        object.transliteration || object.term,
        verb_finite.transliteration || verbTerm,
      ].join(' ');
      return {
        nepali,
        transliteration,
        english,
        type: template.type,
        template: template.id,
        components: {
          subject: subjectComp,
          verb: verbComp,
          verb_finite,
          object: objectComp,
          uses_ergative: true,
          ergative: 'ले',
        },
      };
    }

    const locPhrase = object.requires_possession ? `${objectBase}${pp}` : `${object.term}${pp}`;
    const locTranslit = `${object.transliteration || object.term}${ppTranslit}`;
    nepali = `${subject.term} ${locPhrase} ${verbTerm}।`;
    transliteration = [
      subject.transliteration || subject.term,
      locTranslit,
      verb_finite.transliteration || verbTerm,
    ].join(' ');
    return {
      nepali,
      transliteration,
      english,
      type: template.type,
      template: template.id,
      components: {
        subject: subjectComp,
        verb: verbComp,
        verb_finite,
        object: objectComp,
        location_phrase: {
          nepali: locPhrase,
          english: objectPhrase,
          // Bare place gloss + preposition, so plural rewrites can rebuild the phrase
          place_english: primaryGlossFromWord(object).toLowerCase(),
          preposition: getEnglishPreposition(pp, verb) || 'in',
          basePlace: object,
          transliteration: locTranslit,
        },
        uses_ergative: false,
      },
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
    if (NOT_EXISTABLE_CATEGORIES.has(word.category)) return false;
    return !isAnimate && !isAnimal && !isBodyWhole && !isNumber;
  });

  if (objects.length === 0) return null;

  const object = objects[Math.floor(Math.random() * objects.length)];
  const isNegative = template.negation_type === 'existence';
  const copula = isNegative ? 'छैन' : 'छ';
  const copulaTrans = copula === 'छ' ? 'cha' : 'chhaina';

  const nepali = `${object.term} ${copula}।`;
  const transliteration = `${object.transliteration || object.term} ${copulaTrans}`;
  const objectEnglish = primaryGlossFromWord(object).toLowerCase() || 'thing';
  const article = /^[aeiou]/.test(objectEnglish) ? 'an' : 'a';
  const english = `There is ${isNegative ? 'not ' : ''}${article} ${objectEnglish}.`;

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
 * Location as predicate: [subject] [place]मा [copula] (e.g. किताब टेबलमा छ)
 */
function buildIdentityLocationSentence(template, vocabByPos, unitId) {
  if (unitId === 2) return null;

  const subjects = vocabByPos['noun']?.filter(canBeLocatedEntity) || [];
  const placeNouns =
    vocabByPos['noun']?.filter(
      n =>
        n.can_be?.includes('object') &&
        (n.category === 'place' ||
          n.category === 'accommodation' ||
          n.category === 'furniture' ||
          n.semantic_type === 'place')
    ) || [];

  if (subjects.length === 0 || placeNouns.length === 0) return null;

  const validPairs = [];
  subjects.forEach(s => {
    placeNouns.forEach(p => {
      if (isValidSubjectPlacePair(s, p)) validPairs.push([s, p]);
    });
  });
  if (validPairs.length === 0) return null;

  const [subject, place] = validPairs[Math.floor(Math.random() * validPairs.length)];
  const locationNepali = `${place.term}मा`;
  const locationTranslit = `${place.transliteration || place.term}ma`;

  const isNegative = template.negation_type === 'identity_location';
  const copula = isNegative ? 'छैन' : 'छ';
  const copulaTrans = copula === 'छ' ? 'cha' : 'chhaina';

  const nepali = `${subject.term} ${locationNepali} ${copula}।`;
  const transliteration = `${subject.transliteration || subject.term} ${locationTranslit} ${copulaTrans}`;

  const subjectPhrase = buildEnglishSubjectPhrase(subject);
  const placeWord = primaryGlossFromWord(place).toLowerCase() || 'there';
  const preposition = place.category === 'furniture' ? 'on' : 'in';
  const english = `${subjectPhrase} is ${isNegative ? 'not ' : ''}${preposition} the ${placeWord}.`;

  return {
    nepali,
    transliteration,
    english,
    type: 'identity_location',
    template: template.id,
    components: {
      subject: { nepali: subject.term, english: subject.definition || subject.gloss, transliteration: subject.transliteration },
      location: {
        nepali: locationNepali,
        english: placeWord,
        preposition,
        transliteration: locationTranslit,
        basePlace: place,
      },
      copula,
    },
  };
}

/**
 * Build identity sentence with noun
 */
function buildIdentityNounSentence(template, vocabByPos, unitId) {
  // Only for unit 1 or 3 (negation)
  if (unitId === 2) return null;

  const subjects = vocabByPos['noun']?.filter(n => {
    if (!n.can_be?.includes('subject')) return false;
    const isPerson = n.category === 'person' || n.category === 'family_member';
    const isAnimate = n.animacy === 'animate' || isPerson;
    return isAnimate && n.category !== 'time' && n.category !== 'number';
  }) || [];
  const identityNouns = vocabByPos['noun']?.filter(n =>
    n.can_be?.includes('identity_noun') ||
    n.category === 'profession' ||
    (n.category === 'person' && n.animacy === 'animate')
  ) || [];

  if (subjects.length === 0 || identityNouns.length === 0) return null;

  const subject = subjects[Math.floor(Math.random() * subjects.length)];
  // "The students are not students" is a useless exercise
  const distinctNouns = identityNouns.filter(n => n.term !== subject.term);
  if (distinctNouns.length === 0) return null;
  const identityNoun = distinctNouns[Math.floor(Math.random() * distinctNouns.length)];
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

  const subjects = vocabByPos['noun']?.filter(n => {
    if (!n.can_be?.includes('subject')) return false;
    const isPerson = n.category === 'person' || n.category === 'family_member';
    const isAnimate = n.animacy === 'animate' || isPerson;
    return isAnimate && n.category !== 'time' && n.category !== 'number';
  }) || [];
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

/**
 * Unit 5: pluralize a declarative built from a base template (units 1–3 patterns).
 */
function buildPluralDeclarativeSentence(template, vocabulary) {
  const base = sentenceTemplates.find(t => t.id === template.base_template_id);
  if (!base) return null;

  const decl = buildSentence(base, vocabulary, base.unit);
  if (!decl) return null;

  return applyPluralTransform(decl, template, vocabulary);
}

/** True for both singular and plural negative copulas (छैन/छैनन्, होइन/होइनन्). */
function isNegativeCopula(cop) {
  return cop === 'छैन' || cop === 'छैनन्' || cop === 'होइन' || cop === 'होइनन्';
}

function applyPluralTransform(decl, template, vocabulary = []) {
  const type = decl.type;
  const pluralCopula = cop => toPluralCopula(cop);

  if (type === 'identity_noun') {
    const sub = decl.components.subject;
    const idn = decl.components.identityNoun;
    const subMeta = mergeCompWithVocab(sub, vocabulary);
    if (!subMeta || !canTakePlural(subMeta)) return null;
    const cop = pluralCopula(decl.components.copula);
    const subP = asPluralWord(subMeta);
    // A predicate noun after हो/हुन् stays SINGULAR in Nepali (उनीहरू शिक्षक हुन्),
    // so strip any हरू rather than adding one.
    const idnTerm = (idn.nepali || '').replace(/हरू$/, '');
    const idnMeta = mergeCompWithVocab({ ...idn, nepali: idnTerm }, vocabulary);
    const transIdn = (idn.transliteration || idnTerm).replace(/haru$/i, '');
    const nepali = `${subP.term} ${idnTerm} ${cop}।`;
    const transliteration = `${subP.transliteration || subP.term} ${transIdn} ${cop === 'हुन्' ? 'hun' : cop === 'होइनन्' ? 'hoinan' : 'chan'}`;
    const subjEn = buildEnglishPluralSubjectPhrase(subP);
    // English DOES need the plural predicate: "The sisters are teachers."
    const nounEn = englishPluralLabel(
      idnMeta || { gloss: primaryGlossText(idn.english || idn.gloss) }
    ).toLowerCase();
    const isNeg = cop === 'होइनन्';
    const english = `${subjEn} ${isNeg ? 'are not' : 'are'} ${nounEn}.`;
    return {
      ...decl,
      nepali,
      transliteration,
      english,
      template: template.id,
      plural: true,
      components: {
        ...decl.components,
        subject: { ...sub, nepali: subP.term, english: subP.gloss },
        identityNoun: { ...idn, nepali: idnTerm },
        copula: cop,
      },
    };
  }

  if (type === 'identity_location') {
    const sub = decl.components.subject;
    const loc = decl.components.location;
    const subMeta = mergeCompWithVocab(sub, vocabulary);
    if (!subMeta || !canTakePlural(subMeta)) return null;
    const cop = pluralCopula(decl.components.copula);
    const subP = asPluralWord(subMeta);
    const locNepali = loc.nepali || '';
    const nepali = `${subP.term} ${locNepali} ${cop}।`;
    const transliteration = `${subP.transliteration || subP.term} ${loc.transliteration || locNepali} ${cop === 'छन्' ? 'chan' : 'chainan'}`;
    const subjEn = buildEnglishPluralSubjectPhrase(subP);
    const placeWord = primaryGlossText(loc.english || 'there').toLowerCase();
    const isNeg = isNegativeCopula(cop);
    const english = `${subjEn} ${isNeg ? 'are not' : 'are'} ${loc.preposition || 'in'} the ${placeWord}.`;
    return {
      ...decl,
      nepali,
      transliteration,
      english,
      template: template.id,
      plural: true,
      components: {
        ...decl.components,
        subject: { ...sub, nepali: subP.term, english: subP.gloss },
        copula: cop,
      },
    };
  }

  if (type === 'existence') {
    const obj = decl.components.object;
    const objMeta = mergeCompWithVocab(obj, vocabulary);
    if (!objMeta || !canTakePlural(objMeta)) return null;
    const cop = pluralCopula(decl.components.copula);
    const objP = asPluralWord(objMeta);
    const nepali = `${objP.term} ${cop}।`;
    const transliteration = `${objP.transliteration || objP.term} ${cop === 'छन्' ? 'chan' : 'chainan'}`;
    const isNeg = isNegativeCopula(cop);
    const objEn = buildEnglishPluralObjectPhrase(objP);
    const english = isNeg ? `There are no ${objEn}.` : `There are ${objEn}.`;
    return {
      ...decl,
      nepali,
      transliteration,
      english,
      template: template.id,
      plural: true,
      components: {
        ...decl.components,
        object: { ...obj, nepali: objP.term, english: objP.gloss },
        copula: cop,
      },
    };
  }

  if (type === 'possession') {
    const poss = decl.components.possessor;
    const obj = decl.components.object;
    const possMeta = mergeCompWithVocab(poss, vocabulary);
    const objMeta = mergeCompWithVocab(obj, vocabulary);
    if (!possMeta || !canTakePlural(possMeta)) return null;
    const possP = asPluralWord(possMeta);
    const objP = canTakePlural(objMeta) ? asPluralWord(objMeta) : objMeta;
    const objSurface = objP.term;
    const cop = copulaAgreesWithNoun(decl.components.copula, objSurface, objMeta);
    const nepali = `${possP.term}सँग ${objSurface} ${cop}।`;
    const transliteration = `${possP.transliteration || possP.term}sanga ${objP.transliteration || objSurface} ${cop === 'छन्' || cop === 'छैनन्' ? (cop === 'छैनन्' ? 'chainan' : 'chan') : cop === 'छैन' ? 'chhaina' : 'cha'}`;
    const possEn = buildEnglishPluralSubjectPhrase(possP);
    const objEn = englishPluralLabel(objMeta);
    const isNeg = isNegativeCopula(cop);
    const english = isNeg
      ? `${possEn} do not have ${objEn}.`
      : `${possEn} have ${objEn}.`;
    return {
      ...decl,
      nepali,
      transliteration,
      english,
      template: template.id,
      plural: true,
      components: {
        ...decl.components,
        possessor: { ...poss, nepali: possP.term, english: possP.gloss },
        object: { ...obj, nepali: objSurface, english: objMeta.gloss || objMeta.definition },
        copula: cop,
      },
    };
  }

  if (type === 'action') {
    const sub = decl.components.subject;
    const obj = decl.components.object;
    const vf = decl.components.verb_finite || decl.components.verb;
    const verbLemma = decl.components.verb;
    const usesErg = decl.components.uses_ergative !== false;
    const subMeta = mergeCompWithVocab(sub, vocabulary);
    if (!subMeta || !canTakePlural(subMeta)) return null;
    const subP = asPluralWord(subMeta);
    const objTerm = obj.nepali;
    const verbTerm = toPluralVerb(vf.nepali || vf.term);
    const isNeg = (vf.nepali || '').includes('दैन') || decl.nepali.includes('दैन');

    let nepali;
    let transliteration;
    if (usesErg) {
      const subErg = attachErgativeToPlural(subP.term);
      nepali = `${subErg} ${objTerm} ${verbTerm}।`;
      transliteration = `${subP.transliteration || subP.term}le ${obj.transliteration || objTerm} ${verbTerm}`;
    } else {
      const loc = decl.components.location_phrase;
      const locNepali = loc?.nepali || '';
      nepali = `${subP.term} ${locNepali} ${verbTerm}।`;
      transliteration = `${subP.transliteration || subP.term} ${loc?.transliteration || locNepali} ${verbTerm}`;
    }

    const subjEn = buildEnglishPluralSubjectPhrase(subP);
    // Plural subjects take the bare English verb: "goes" → "go", never "goe"
    const verbGloss = pluralEnglishVerbPhrase(
      vf?.english || vf?.gloss || verbLemma?.english || 'do',
      isNeg
    );
    let objectPhrase;
    if (usesErg) {
      const objGloss = primaryGlossText(obj.english);
      objectPhrase = buildEnglishObjectPhrase(
        { term: objTerm, gloss: objGloss, definition: objGloss },
        verbLemma
      );
      if (verbNeedsToBeforeObject(verbGloss)) objectPhrase = `to ${objectPhrase}`;
    } else {
      // Motion verbs need their preposition: "go to the shop", not "go shop"
      const loc = decl.components.location_phrase;
      const place = (loc?.place_english || primaryGlossText(loc?.english) || 'there').toLowerCase();
      objectPhrase = `${loc?.preposition || 'in'} the ${place}`;
    }
    const english = `${subjEn} ${verbGloss} ${objectPhrase}.`;

    return {
      ...decl,
      nepali,
      transliteration,
      english,
      template: template.id,
      plural: true,
      components: {
        ...decl.components,
        subject: { ...sub, nepali: subP.term, english: subP.gloss },
        object: { ...obj, nepali: objTerm },
        verb_finite: { ...vf, nepali: verbTerm },
        uses_ergative: usesErg,
      },
    };
  }

  return null;
}

function buildPluralGrammarQuestionSentence(template, vocabulary) {
  const baseDeclTemplate = sentenceTemplates.find(t => t.id === template.base_template_id);
  if (!baseDeclTemplate) return null;

  const singular = buildSentence(baseDeclTemplate, vocabulary, baseDeclTemplate.unit);
  if (!singular) return null;

  const decl = applyPluralTransform(singular, {
    ...template,
    plural: true,
    unit: 5,
    type: baseDeclTemplate.type,
    id: template.id,
  }, vocabulary);
  if (!decl) return null;

  const kind = template.question_kind;
  const core = decl.nepali.replace(/।\s*$/, '').replace(/\?\s*$/, '').trim();
  const coreTrans = decl.transliteration.replace(/\.?\s*$/, '').trim();

  let nepali = '';
  let transliteration = '';
  let english = '';

  if (kind === 'yes_no') {
    nepali = `के ${core}?`;
    transliteration = `ke ${coreTrans}`;
    english = yesNoQuestionEnglish(decl);
  } else if (kind === 'wh_where' && decl.type === 'identity_location') {
    const { subject, copula } = decl.components;
    nepali = `${subject.nepali} ${PARTICLE_KAHA.term} ${copula}?`;
    transliteration = `${subject.transliteration || subject.nepali} kahaan ${copula === 'छन्' ? 'chan' : 'chainan'}`;
    english = whereQuestionEnglish(decl);
  } else {
    return null;
  }

  return {
    nepali,
    transliteration,
    english,
    type: 'grammar_question',
    question_kind: kind,
    base_sentence_type: decl.type,
    declarative_nepali: decl.nepali,
    declarative_english: decl.english,
    template: template.id,
    plural: true,
    components: {
      ...decl.components,
      declarative: { nepali: decl.nepali, english: decl.english, transliteration: decl.transliteration },
    },
  };
}

function asWord(c) {
  if (!c) return null;
  return { ...c, gloss: c.gloss || c.english, definition: c.definition || c.english };
}

const ENGLISH_PRONOUNS = new Set(['i', 'you', 'he', 'she', 'it', 'we', 'they']);

/**
 * Subject phrase for use *inside* a question, where it is no longer sentence-initial:
 * "Are the mothers …?" rather than "Are Mothers …?".
 */
function questionSubjectPhrase(sub, isPlural) {
  const phrase = isPlural
    ? buildEnglishPluralSubjectPhrase(sub)
    : buildEnglishSubjectPhrase(sub);
  if (!phrase) return '';
  if (ENGLISH_PRONOUNS.has(phrase.toLowerCase())) {
    return phrase.toLowerCase() === 'i' ? 'I' : phrase.toLowerCase();
  }
  const lowered = phrase.charAt(0).toLowerCase() + phrase.slice(1);
  return /^(the|a|an|my|your|his|her|our|their)\b/i.test(lowered) ? lowered : `the ${lowered}`;
}

function yesNoQuestionEnglish(decl) {
  const t = decl.type;
  const isPlural = decl.plural === true;
  const negCopula = isNegativeCopula;
  if (t === 'possession') {
    const poss = asWord(decl.components.possessor);
    const obj = asWord(decl.components.object);
    const subj = questionSubjectPhrase(poss, isPlural);
    const objEn = (obj.gloss || '').toLowerCase();
    const article = getEnglishArticle(objEn, obj);
    const objPhrase = article ? `${article} ${objEn}` : objEn;
    const neg = negCopula(decl.components.copula);
    const doWord = isPlural ? 'Do' : 'Does';
    return neg ? `${doWord} ${subj} not have ${objPhrase}?` : `${doWord} ${subj} have ${objPhrase}?`;
  }
  if (t === 'identity_noun') {
    const sub = asWord(decl.components.subject);
    const idn = asWord(decl.components.identityNoun);
    const subj = questionSubjectPhrase(sub, isPlural);
    const nounEn = primaryGlossText(idn.gloss || idn.definition || '');
    const article = getEnglishArticle(nounEn, idn) || (isPlural ? '' : 'a');
    const np = article ? `${article} ${nounEn.toLowerCase()}` : nounEn.toLowerCase();
    const neg = negCopula(decl.components.copula);
    if (isPlural) {
      return neg ? `Are ${subj} not ${np}?` : `Are ${subj} ${np}?`;
    }
    return neg ? `Is it not true that ${subj} is ${np}?` : `Is ${subj} ${np}?`;
  }
  if (t === 'identity_adj') {
    const sub = asWord(decl.components.subject);
    const adj = asWord(decl.components.adjective);
    const subj = questionSubjectPhrase(sub, isPlural);
    const adjEn = (adj.gloss || adj.definition || '').toLowerCase();
    const neg = negCopula(decl.components.copula);
    const be = isPlural ? 'Are' : 'Is';
    return neg ? `${be} ${subj} not ${adjEn}?` : `${be} ${subj} ${adjEn}?`;
  }
  if (t === 'existence') {
    const obj = asWord(decl.components.object);
    const o = (obj.gloss || obj.definition || 'something').toLowerCase();
    const neg = negCopula(decl.components.copula);
    if (isPlural) {
      // o is already the plural gloss (e.g. "schools"); no article needed
      return neg ? `Are there no ${o}?` : `Are there ${o}?`;
    }
    const article = getEnglishArticle(o, obj);
    const op = article ? `${article} ${o}` : o;
    return neg ? `Is there not ${op}?` : `Is there ${op}?`;
  }
  if (t === 'action') {
    const sub = asWord(decl.components.subject);
    const obj = asWord(decl.components.object);
    const verbLemma = decl.components.verb;
    const vf = decl.components.verb_finite || verbLemma;
    const subj = questionSubjectPhrase(sub, isPlural);
    const rawGloss = vf?.english || vf?.gloss || verbLemma?.english || verbLemma?.definition || 'verb';
    const neg = (vf?.nepali || '').includes('दैन') || decl.nepali.includes('दैन');
    const doWord = isPlural ? 'Do' : 'Does';
    // "Does the boy eat …?" — after do/does the verb is always bare
    const verbGloss = toBareEnglishVerb(rawGloss);
    const loc = decl.components.location_phrase;
    let objectPhrase;
    if (decl.components.uses_ergative === false && loc) {
      const place = (loc.place_english || primaryGlossText(loc.english) || 'there').toLowerCase();
      objectPhrase = `${loc.preposition || 'in'} the ${place}`;
    } else {
      const objGloss = primaryGlossText(obj?.gloss || obj?.definition || obj?.english);
      objectPhrase = buildEnglishObjectPhrase(
        { ...asWord(obj), gloss: objGloss, definition: objGloss },
        verbLemma
      );
      if (verbNeedsToBeforeObject(verbGloss)) objectPhrase = `to ${objectPhrase}`;
    }
    return neg ? `${doWord} ${subj} not ${verbGloss} ${objectPhrase}?` : `${doWord} ${subj} ${verbGloss} ${objectPhrase}?`;
  }
  if (t === 'identity_location') {
    const sub = asWord(decl.components.subject);
    const subj = questionSubjectPhrase(sub, isPlural);
    const neg = negCopula(decl.components.copula);
    const placeWord = primaryGlossText(decl.components.location?.english || 'there').toLowerCase();
    const prep = decl.components.location?.preposition || 'in';
    const be = isPlural ? 'Are' : 'Is';
    return neg ? `${be} ${subj} not ${prep} the ${placeWord}?` : `${be} ${subj} ${prep} the ${placeWord}?`;
  }
  return `Question: (${decl.english})`;
}

function whatQuestionEnglish(decl) {
  const isPlural = decl.plural === true;
  if (decl.type === 'identity_noun') {
    const sub = asWord(decl.components.subject);
    return `What ${isPlural ? 'are' : 'is'} ${questionSubjectPhrase(sub, isPlural)}?`;
  }
  if (decl.type === 'possession') {
    const poss = asWord(decl.components.possessor);
    return `What ${isPlural ? 'do' : 'does'} ${questionSubjectPhrase(poss, isPlural)} have?`;
  }
  if (decl.type === 'action') {
    const sub = asWord(decl.components.subject);
    const vf = decl.components.verb_finite || decl.components.verb;
    const stem = toBareEnglishVerb((vf?.gloss || vf?.english || 'do').toLowerCase());
    const doWord = isPlural ? 'do' : 'does';
    return `What ${doWord} ${questionSubjectPhrase(sub, isPlural)} ${stem}?`;
  }
  return `What? (related to: ${decl.english})`;
}

function whoQuestionEnglish(decl) {
  const isPlural = decl.plural === true;
  if (decl.type === 'identity_noun') {
    const sub = asWord(decl.components.subject);
    return `Who ${isPlural ? 'are' : 'is'} ${questionSubjectPhrase(sub, isPlural)}?`;
  }
  if (decl.type === 'action') {
    const obj = asWord(decl.components.object);
    const v = decl.components.verb;
    const vf = decl.components.verb_finite || v;
    const objGloss = primaryGlossText(obj?.gloss || obj?.definition || obj?.english);
    const gloss = vf?.gloss || vf?.english || v?.gloss || v?.english || 'do';
    let objectPhrase = buildEnglishObjectPhrase(
      { ...obj, gloss: objGloss, definition: objGloss },
      asWord(v)
    );
    if (verbNeedsToBeforeObject(gloss)) objectPhrase = `to ${objectPhrase}`;
    return `Who ${gloss} ${objectPhrase}?`;
  }
  return `Who? (related to: ${decl.english})`;
}

function whereQuestionEnglish(decl) {
  const sub = asWord(decl.components.subject);
  const isPlural = decl.plural === true;
  const thing = questionSubjectPhrase(sub, isPlural);
  return `Where ${isPlural ? 'are' : 'is'} ${thing}?`;
}

/** Where-questions for intransitive motion (जानु / आउनु): कहाँ + verb, no ले. */
function motionWhereQuestionEnglish(decl) {
  const sub = asWord(decl.components.subject);
  const isPlural = decl.plural === true;
  const thing = questionSubjectPhrase(sub, isPlural);
  const vf = decl.components.verb_finite || decl.components.verb;
  const neg = (vf?.nepali || '').includes('दैन') || (decl.nepali || '').includes('दैन');
  const stem = toBareEnglishVerb((vf?.gloss || vf?.english || 'go').toLowerCase());
  const doWord = isPlural ? 'do' : 'does';
  return neg
    ? `Where ${doWord} ${thing} not ${stem}?`
    : `Where ${doWord} ${thing} ${stem}?`;
}

/**
 * Unit 4: questions formed only by transforming a declarative (see developer rules).
 */
function buildGrammarQuestionSentence(template, vocabulary) {
  const base = sentenceTemplates.find(t => t.id === template.base_template_id);
  if (!base || base.unit === 99) return null;

  const decl = buildSentence(base, vocabulary, base.unit);
  if (!decl) return null;

  const kind = template.question_kind;
  const core = decl.nepali.replace(/।\s*$/, '').replace(/\?\s*$/, '').trim();
  const coreTrans = decl.transliteration.replace(/\.?\s*$/, '').trim();

  let nepali = '';
  let transliteration = '';
  let english = '';

  if (kind === 'yes_no') {
    nepali = `के ${core}?`;
    transliteration = `ke ${coreTrans}`;
    english = yesNoQuestionEnglish(decl);
  } else if (kind === 'wh_what') {
    if (decl.type === 'identity_noun') {
      const { subject, identityNoun, copula } = decl.components;
      nepali = `${subject.nepali} के ${copula}?`;
      transliteration = `${subject.transliteration || subject.nepali} ke ${copula === 'हो' ? 'ho' : copula === 'होइन' ? 'hoina' : 'hun'}`;
      english = whatQuestionEnglish(decl);
    } else if (decl.type === 'possession') {
      const { possessor, copula } = decl.components;
      nepali = `${possessor.nepali}सङ्ग के ${copula}?`;
      transliteration = `${possessor.transliteration || possessor.nepali}sanga ke ${copula === 'छ' ? 'cha' : 'chhaina'}`;
      english = whatQuestionEnglish(decl);
    } else if (decl.type === 'action') {
      if (decl.components.uses_ergative === false) {
        return null;
      }
      const { subject, verb } = decl.components;
      const le = findVocabByTerm(vocabulary, 'ले')?.term || 'ले';
      const vf = decl.components.verb_finite || verb;
      // SOV: [Subject]ले के [Verb] — के replaces the object slot (transitive only)
      nepali = `${subject.nepali}${le} के ${vf.nepali}?`;
      const vtr = vf.transliteration || vf.nepali;
      transliteration = `${subject.transliteration || subject.nepali}le ke ${vtr}`;
      english = whatQuestionEnglish(decl);
    } else {
      return null;
    }
  } else if (kind === 'wh_who') {
    if (decl.type === 'identity_noun') {
      const { subject, copula } = decl.components;
      nepali = `${subject.nepali} ${PARTICLE_KO_WHO.term} ${copula}?`;
      transliteration = `${subject.transliteration || subject.nepali} ko ${copula === 'हो' ? 'ho' : 'hoina'}`;
      english = whoQuestionEnglish(decl);
    } else if (decl.type === 'action') {
      if (decl.components.uses_ergative === false) {
        return null;
      }
      const { object, verb } = decl.components;
      const vf = decl.components.verb_finite || verb;
      nepali = `${KO_LE.term} ${object.nepali} ${vf.nepali}?`;
      transliteration = `kole ${object.transliteration || object.nepali} ${vf.transliteration || vf.nepali}`;
      english = whoQuestionEnglish(decl);
    } else {
      return null;
    }
  } else if (kind === 'wh_where') {
    if (decl.type === 'identity_location') {
      const { subject, location, copula } = decl.components;
      nepali = `${subject.nepali} ${PARTICLE_KAHA.term} ${copula}?`;
      transliteration = `${subject.transliteration || subject.nepali} kahaan ${copula === 'छ' ? 'cha' : 'chhaina'}`;
      english = whereQuestionEnglish(decl);
    } else if (decl.type === 'action' && decl.components.uses_ergative === false) {
      const { subject } = decl.components;
      const vf = decl.components.verb_finite || decl.components.verb;
      nepali = `${subject.nepali} ${PARTICLE_KAHA.term} ${vf.nepali}?`;
      transliteration = `${subject.transliteration || subject.nepali} kahaan ${vf.transliteration || vf.nepali}`;
      english = motionWhereQuestionEnglish(decl);
    } else {
      return null;
    }
  } else {
    return null;
  }

  return {
    nepali,
    transliteration,
    english,
    type: 'grammar_question',
    question_kind: kind,
    base_sentence_type: decl.type,
    declarative_nepali: decl.nepali,
    declarative_english: decl.english,
    template: template.id,
    components: {
      ...decl.components,
      declarative: { nepali: decl.nepali, english: decl.english, transliteration: decl.transliteration },
    },
  };
}
