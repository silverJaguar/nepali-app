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
import { buildEnglishSubjectPhrase, buildEnglishObjectPhrase, getEnglishArticle } from './postpositionMapper';
import { PARTICLE_KE, PARTICLE_KO_WHO, PARTICLE_KAHA, KO_LE, findVocabByTerm } from './questionParticles';

/** Use first gloss before " / " so English is not "shop / store". */
function primaryGlossFromWord(word) {
  if (!word) return '';
  const raw = String(word.gloss || word.definition || '').trim();
  if (!raw) return '';
  return raw.split(/\s*\/\s*/)[0].trim();
}

/** Subjects that can plausibly "be" at a physical location (exclude time, abstract, genitive-linked). */
function canBeLocatedEntity(n) {
  if (!n?.can_be?.includes('subject')) return false;
  if (n.category === 'time' || n.category === 'number' || n.category === 'concept') return false;
  if (n.requires_genitive_link) return false;
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
    return buildGrammarQuestionSentence(template, vocabulary);
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
    if (isNegative) {
      if (!verbGloss.includes('does not')) {
        verbGloss = `does not ${verbGloss.replace(/s$/, '')}`;
      }
    }
    const objectPhrase = buildEnglishObjectPhrase(object, verb);
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
 * Location as predicate: [subject] [place]मा [copula] (e.g. किताब टेबलमा छ)
 */
function buildIdentityLocationSentence(template, vocabByPos, unitId) {
  if (unitId === 2) return null;

  let subjects = vocabByPos['noun']?.filter(canBeLocatedEntity) || [];
  if (subjects.length === 0) {
    subjects = vocabByPos['noun']?.filter(n => n.can_be?.includes('subject') && n.category !== 'time') || [];
  }
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

  const subject = subjects[Math.floor(Math.random() * subjects.length)];
  const place = placeNouns[Math.floor(Math.random() * placeNouns.length)];
  const locationNepali = `${place.term}मा`;
  const locationTranslit = `${place.transliteration || place.term}ma`;

  const isNegative = template.negation_type === 'identity_location';
  const copula = isNegative ? 'छैन' : 'छ';
  const copulaTrans = copula === 'छ' ? 'cha' : 'chhaina';

  const nepali = `${subject.term} ${locationNepali} ${copula}।`;
  const transliteration = `${subject.transliteration || subject.term} ${locationTranslit} ${copulaTrans}`;

  const subjectPhrase = buildEnglishSubjectPhrase(subject);
  const placeWord = primaryGlossFromWord(place).toLowerCase() || 'there';
  const english = `${subjectPhrase} is ${isNegative ? 'not ' : ''}in the ${placeWord}.`;

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

function asWord(c) {
  if (!c) return null;
  return { ...c, gloss: c.gloss || c.english, definition: c.definition || c.english };
}

function yesNoQuestionEnglish(decl) {
  const t = decl.type;
  if (t === 'possession') {
    const poss = asWord(decl.components.possessor);
    const obj = asWord(decl.components.object);
    const subj = buildEnglishSubjectPhrase(poss);
    const objEn = (obj.gloss || '').toLowerCase();
    const article = getEnglishArticle(objEn, obj);
    const objPhrase = article ? `${article} ${objEn}` : objEn;
    const neg = decl.components.copula === 'छैन';
    return neg ? `Does ${subj} not have ${objPhrase}?` : `Does ${subj} have ${objPhrase}?`;
  }
  if (t === 'identity_noun') {
    const sub = asWord(decl.components.subject);
    const idn = asWord(decl.components.identityNoun);
    const subj = buildEnglishSubjectPhrase(sub);
    const nounEn = idn.gloss || idn.definition || '';
    const article = getEnglishArticle(nounEn, idn);
    const np = article ? `${article} ${nounEn.toLowerCase()}` : nounEn.toLowerCase();
    const neg = decl.components.copula === 'होइन';
    return neg ? `Is it not true that ${subj} is ${np}?` : `Is ${subj} ${np}?`;
  }
  if (t === 'identity_adj') {
    const sub = asWord(decl.components.subject);
    const adj = asWord(decl.components.adjective);
    const subj = buildEnglishSubjectPhrase(sub);
    const adjEn = (adj.gloss || adj.definition || '').toLowerCase();
    const neg = decl.components.copula === 'छैन';
    return neg ? `Is ${subj} not ${adjEn}?` : `Is ${subj} ${adjEn}?`;
  }
  if (t === 'existence') {
    const obj = asWord(decl.components.object);
    const o = (obj.gloss || obj.definition || 'something').toLowerCase();
    const article = getEnglishArticle(o, obj);
    const op = article ? `${article} ${o}` : o;
    const neg = decl.components.copula === 'छैन';
    return neg ? `Is there not ${op}?` : `Is there ${op}?`;
  }
  if (t === 'action') {
    const sub = asWord(decl.components.subject);
    const obj = asWord(decl.components.object);
    const verbLemma = decl.components.verb;
    const vf = decl.components.verb_finite || verbLemma;
    const subj = buildEnglishSubjectPhrase(sub);
    let verbGloss = vf?.english || vf?.gloss || verbLemma?.english || verbLemma?.definition || 'verb';
    const neg = (vf?.nepali || '').includes('दैन') || decl.nepali.includes('दैन');
    if (neg && !String(verbGloss).toLowerCase().includes('does not')) {
      verbGloss = `does not ${String(verbGloss).replace(/s$/i, '')}`;
    } else if (!neg) {
      verbGloss = String(verbGloss).replace(/^does not\s+/i, '');
    }
    const objectPhrase = buildEnglishObjectPhrase(asWord(obj), verbLemma);
    return neg ? `Does ${subj} not ${verbGloss} ${objectPhrase}?` : `Does ${subj} ${verbGloss} ${objectPhrase}?`;
  }
  if (t === 'identity_location') {
    const sub = asWord(decl.components.subject);
    const subj = buildEnglishSubjectPhrase(sub);
    const neg = decl.components.copula === 'छैन';
    const placeWord = (decl.components.location?.english || 'there').toLowerCase();
    return neg ? `Is ${subj} not in the ${placeWord}?` : `Is ${subj} in the ${placeWord}?`;
  }
  return `Question: (${decl.english})`;
}

function whatQuestionEnglish(decl) {
  if (decl.type === 'identity_noun') {
    const sub = asWord(decl.components.subject);
    return `What is ${buildEnglishSubjectPhrase(sub)}?`;
  }
  if (decl.type === 'possession') {
    const poss = asWord(decl.components.possessor);
    return `What does ${buildEnglishSubjectPhrase(poss)} have?`;
  }
  if (decl.type === 'action') {
    const sub = asWord(decl.components.subject);
    const vf = decl.components.verb_finite || decl.components.verb;
    let stem = (vf?.gloss || vf?.english || 'do').toLowerCase();
    stem = stem.replace(/^does not\s+/i, '').replace(/s$/, '');
    return `What does ${buildEnglishSubjectPhrase(sub)} ${stem}?`;
  }
  return `What? (related to: ${decl.english})`;
}

function whoQuestionEnglish(decl) {
  if (decl.type === 'identity_noun') {
    const sub = asWord(decl.components.subject);
    return `Who is ${buildEnglishSubjectPhrase(sub)}?`;
  }
  if (decl.type === 'action') {
    const obj = asWord(decl.components.object);
    const v = decl.components.verb;
    const vf = decl.components.verb_finite || v;
    const objectPhrase = buildEnglishObjectPhrase(obj, asWord(v));
    const gloss = vf?.gloss || vf?.english || v?.gloss || v?.english || 'do';
    return `Who ${gloss} ${objectPhrase}?`;
  }
  return `Who? (related to: ${decl.english})`;
}

function whereQuestionEnglish(decl) {
  const sub = asWord(decl.components.subject);
  const thing = buildEnglishSubjectPhrase(sub);
  return `Where is ${thing}?`;
}

/** Where-questions for intransitive motion (जानु / आउनु): कहाँ + verb, no ले. */
function motionWhereQuestionEnglish(decl) {
  const sub = asWord(decl.components.subject);
  const thing = buildEnglishSubjectPhrase(sub);
  const vf = decl.components.verb_finite || decl.components.verb;
  const neg = (vf?.nepali || '').includes('दैन') || (decl.nepali || '').includes('दैन');
  let stem = (vf?.gloss || vf?.english || 'go').toLowerCase();
  stem = stem.replace(/^does not\s+/i, '').replace(/s$/, '');
  return neg ? `Where does ${thing} not ${stem}?` : `Where does ${thing} ${stem}?`;
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
