// Sentence Construction exercises for Unit 5: plural declaratives (see sentenceBuilder plural transform).

import sentenceTemplates from '../sentence_templates.json';
import { buildSentence } from './sentenceBuilder';
import { shuffle } from './helpers';
import { findVocabByTerm } from './questionParticles';
import { normalizePluralChipJoin } from './pluralForms';
import { attachAgreementVariants, filterAgreementDistractors } from './agreementVariants';

// Whole-sentence phrases and interjections are never plausible sentence-building
// chips ("हाल खबर के छ?"), so they must not leak into the word bank as distractors.
const NON_CHIP_PARTS_OF_SPEECH = new Set(['phrase', 'interjection']);

export function isNonChipVocab(word) {
  if (!word) return true;
  if (NON_CHIP_PARTS_OF_SPEECH.has(word.part_of_speech)) return true;
  const term = (word.term || '').trim();
  if (/[?।]/.test(term)) return true;
  // Compound verbs like "महसुस गर्छ" are two words and legitimate; anything longer is a phrase
  return term.split(/\s+/).length > 2;
}

let haruChipCounter = 0;

function haruChip() {
  haruChipCounter += 1;
  return {
    _chipId: `haru_${haruChipCounter}`,
    term: 'हरू',
    transliteration: 'haru',
    gloss: '(plural)',
    definition: 'plural suffix',
    part_of_speech: 'suffix',
    _chipRole: 'plural_suffix',
  };
}

function copulaAsWord(copulaStr, vocabulary) {
  const found = vocabulary.find(w => w.term === copulaStr);
  if (found) return attachAgreementVariants({ ...found });
  const tr =
    copulaStr === 'छन्'
      ? 'chan'
      : copulaStr === 'छैनन्'
        ? 'chainan'
        : copulaStr === 'हुन्'
          ? 'hun'
          : copulaStr === 'होइनन्'
            ? 'hoinan'
            : copulaStr;
  return attachAgreementVariants({
    term: copulaStr,
    gloss: copulaStr,
    definition: copulaStr,
    transliteration: tr,
    part_of_speech: 'copula',
  });
}

function singularNounFromComp(comp, vocabulary) {
  if (!comp?.nepali) return null;
  const surface = comp.nepali;
  const singular = surface.replace(/हरू$/, '').replace(/(सँग|सङ्ग|ले)$/, '');
  const base =
    findVocabByTerm(vocabulary, singular) ||
    findVocabByTerm(vocabulary, surface);
  if (base) {
    return {
      ...base,
      term: singular,
      gloss: comp.english || base.gloss || base.definition,
      definition: comp.english || base.definition || base.gloss,
      transliteration: comp.transliteration || base.transliteration,
      plural: surface.includes('हरू'),
      singular_term: base.term,
    };
  }
  return {
    term: singular,
    gloss: comp.english || singular,
    definition: comp.english || singular,
    transliteration: comp.transliteration || singular,
    part_of_speech: 'noun',
    plural: surface.includes('हरू'),
  };
}

/** Singular noun chip, plus a separate हरू chip when the generated sentence uses a plural noun. */
function nounChipsFromComp(comp, vocabulary) {
  const chip = singularNounFromComp(comp, vocabulary);
  if (!chip) return [];
  if (comp.nepali?.includes('हरू')) {
    return [chip, haruChip()];
  }
  return [chip];
}

function verbFromComp(comp, vocabulary) {
  if (!comp?.nepali) return null;
  const surface = comp.nepali;
  const singular = surface.replace(/न्$/, '');
  const base =
    findVocabByTerm(vocabulary, surface) ||
    findVocabByTerm(vocabulary, singular);
  if (base) {
    return attachAgreementVariants({
      ...base,
      term: surface,
      gloss: comp.english || comp.gloss || base.gloss || base.definition,
      definition: comp.english || comp.gloss || base.definition || base.gloss,
      transliteration: comp.transliteration || base.transliteration,
    });
  }
  return attachAgreementVariants({
    term: surface,
    gloss: comp.english || comp.gloss || surface,
    definition: comp.english || comp.gloss || surface,
    transliteration: comp.transliteration || surface,
    part_of_speech: 'verb',
  });
}

/** Ordered word chips for plural sentences (must match applyPluralTransform output). */
export function buildPluralRequiredWordsList(sentence, vocabulary) {
  haruChipCounter = 0;
  const t = sentence.type;
  const sangaRaw =
    findVocabByTerm(vocabulary, 'सँग') ||
    findVocabByTerm(vocabulary, 'सङ्ग') ||
    ({ term: 'सँग', transliteration: 'sanga', gloss: 'with', part_of_speech: 'postposition' });
  const sanga =
    sangaRaw?.term === 'सङ्ग'
      ? { ...sangaRaw, term: 'सँग', transliteration: sangaRaw.transliteration || 'sanga' }
      : sangaRaw;
  const le = findVocabByTerm(vocabulary, 'ले') || {
    term: 'ले',
    gloss: 'ergative',
    transliteration: 'le',
    part_of_speech: 'postposition',
  };
  const ma = findVocabByTerm(vocabulary, 'मा') || {
    term: 'मा',
    gloss: 'in',
    transliteration: 'ma',
    part_of_speech: 'postposition',
  };

  /** Place + मा as separate chips so learners can't forget the postposition. */
  const locationChips = loc => {
    if (!loc?.nepali) return [];
    const bare = loc.nepali.replace(/मा$/, '');
    const base =
      loc.basePlace ||
      findVocabByTerm(vocabulary, bare) ||
      {
        term: bare,
        gloss: loc.english || bare,
        transliteration: (loc.transliteration || bare).replace(/ma$/, ''),
        part_of_speech: 'noun',
      };
    const placeChip = { ...base, term: bare };
    return loc.nepali.endsWith('मा') ? [placeChip, ma] : [placeChip];
  };

  if (t === 'identity_noun') {
    const { subject, identityNoun, copula } = sentence.components;
    return [
      ...nounChipsFromComp(subject, vocabulary),
      ...nounChipsFromComp(identityNoun, vocabulary),
      copulaAsWord(copula, vocabulary),
    ].filter(Boolean);
  }

  if (t === 'identity_location') {
    const { subject, location, copula } = sentence.components;
    return [
      ...nounChipsFromComp(subject, vocabulary),
      ...locationChips(location),
      copulaAsWord(copula, vocabulary),
    ].filter(Boolean);
  }

  if (t === 'existence') {
    const { object, copula } = sentence.components;
    return [
      ...nounChipsFromComp(object, vocabulary),
      copulaAsWord(copula, vocabulary),
    ].filter(Boolean);
  }

  if (t === 'possession') {
    const { possessor, object, copula } = sentence.components;
    return [
      ...nounChipsFromComp(possessor, vocabulary),
      sanga,
      ...nounChipsFromComp(object, vocabulary),
      copulaAsWord(copula, vocabulary),
    ].filter(Boolean);
  }

  if (t === 'action') {
    const { subject, object, verb_finite, verb, uses_ergative, location_phrase } = sentence.components;
    const vf = verb_finite || verb;
    const v = verbFromComp(vf, vocabulary);
    if (uses_ergative === false && location_phrase?.nepali) {
      return [
        ...nounChipsFromComp(subject, vocabulary),
        ...locationChips(location_phrase),
        v,
      ].filter(Boolean);
    }
    return [
      ...nounChipsFromComp(subject, vocabulary),
      le,
      singularNounFromComp(object, vocabulary),
      v,
    ].filter(Boolean);
  }

  if (t === 'grammar_question') {
    const ke = findVocabByTerm(vocabulary, 'के') || { term: 'के', transliteration: 'ke', gloss: 'what', part_of_speech: 'particle' };
    const kaha = findVocabByTerm(vocabulary, 'कहाँ') || { term: 'कहाँ', transliteration: 'kahaan', gloss: 'where', part_of_speech: 'adverb' };
    const base = sentence.base_sentence_type;

    if (sentence.question_kind === 'wh_where' && base === 'identity_location') {
      const { subject, copula } = sentence.components;
      return [
        ...nounChipsFromComp(subject, vocabulary),
        kaha,
        copulaAsWord(copula, vocabulary),
      ].filter(Boolean);
    }

    const inner = buildPluralRequiredWordsList(
      { ...sentence, type: base, components: sentence.components },
      vocabulary
    );
    if (!inner) return null;
    if (sentence.question_kind === 'yes_no') return [ke, ...inner];
    return null;
  }

  return null;
}

function chipJoinMatchesNepali(sent, requiredWords) {
  const terms = requiredWords.map(w => (typeof w === 'string' ? w : w?.term)).filter(Boolean);
  const target = sent.nepali.replace(/\?/g, '').replace(/।/g, '').replace(/\s+/g, ' ').trim();

  if (sent.type === 'grammar_question' && sent.question_kind === 'yes_no') {
    if (terms[0] === 'के') {
      const innerTarget = target.replace(/^के\s*/, '');
      return chipJoinMatchesNepali(
        { ...sent, type: sent.base_sentence_type, nepali: innerTarget },
        requiredWords.slice(1)
      );
    }
  }

  return normalizePluralChipJoin(terms) === target;
}

export const GRAMMAR_UNIT5_PLURAL_QUOTAS = {
  identity_noun: 2,
  identity_location: 2,
  existence: 1,
  possession: 2,
  action: 2,
  existence_negative: 1,
  identity_location_negative: 1,
  yes_no: 1,
};

function templateBucketKey(tmpl) {
  if (tmpl.type === 'grammar_question') return tmpl.question_kind;
  if (tmpl.negation_type) {
    if (tmpl.type === 'existence') return 'existence_negative';
    if (tmpl.type === 'possession') return 'possession_negative';
    if (tmpl.type === 'action') return 'action_negative';
    if (tmpl.type === 'identity_location') return 'identity_location_negative';
    if (tmpl.type === 'identity_noun') return 'identity_noun_negative';
  }
  return tmpl.type;
}

function tryPushExercise(tmpl, vocabulary, seenNepali, out, counts, bucketKey, allowDuplicateNepali) {
  const sent = buildSentence(tmpl, vocabulary, 5);
  if (!sent?.nepali) return false;

  const requiredWords = buildPluralRequiredWordsList(sent, vocabulary);
  if (!requiredWords || requiredWords.length < 2) return false;
  if (!chipJoinMatchesNepali(sent, requiredWords)) return false;

  const normNepali = sent.nepali.replace(/\?/g, '').replace(/।/g, '').replace(/\s+/g, ' ').trim();
  if (!allowDuplicateNepali && seenNepali.has(normNepali)) return false;
  seenNepali.add(normNepali);

  const pool = vocabulary.filter(
    w =>
      w.term !== 'हरू' &&
      !isNonChipVocab(w) &&
      !requiredWords.some(r => r.term === w.term)
  );
  const distractors = shuffle(filterAgreementDistractors(requiredWords, pool)).slice(0, 5);

  counts[bucketKey] = (counts[bucketKey] || 0) + 1;
  out.push({
    id: `u5_${bucketKey}_${tmpl.id}_${out.length}`,
    template: tmpl,
    requiredWords,
    hintParts: requiredWords.map(w => w.term || w.gloss).filter(Boolean),
    distractors,
    targetNepali: sent.nepali.replace(/\?$/, '').trim(),
    targetTransliteration: sent.transliteration,
    questionEnglishPrompt: sent.english,
    plural: true,
  });
  return true;
}

export function generatePluralGrammarExercises(vocabulary, quotas = GRAMMAR_UNIT5_PLURAL_QUOTAS) {
  const templates = sentenceTemplates.filter(t => t.unit === 5);
  if (templates.length === 0) return [];

  const byBucket = {};
  for (const t of templates) {
    const k = templateBucketKey(t);
    if (!byBucket[k]) byBucket[k] = [];
    byBucket[k].push(t);
  }

  const kinds = Object.keys(quotas).filter(k => byBucket[k]?.length);
  const counts = {};
  kinds.forEach(k => {
    counts[k] = 0;
    byBucket[k] = shuffle([...byBucket[k]]);
  });

  const out = [];
  const seenNepali = new Set();
  let attempts = 0;
  const maxAttempts = 2500;

  while (attempts < maxAttempts) {
    const need = kinds.filter(k => counts[k] < quotas[k]);
    if (need.length === 0) break;
    attempts++;
    const bucketKey = need[Math.floor(Math.random() * need.length)];
    const pool = byBucket[bucketKey];
    const tmpl = pool[Math.floor(Math.random() * pool.length)];
    tryPushExercise(tmpl, vocabulary, seenNepali, out, counts, bucketKey, false);
  }

  for (const bucketKey of kinds) {
    let fillAttempts = 0;
    while (counts[bucketKey] < quotas[bucketKey] && fillAttempts < 500) {
      fillAttempts++;
      const pool = byBucket[bucketKey];
      const tmpl = pool[Math.floor(Math.random() * pool.length)];
      tryPushExercise(tmpl, vocabulary, seenNepali, out, counts, bucketKey, true);
    }
  }

  return shuffle(out);
}
