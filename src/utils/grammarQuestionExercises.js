// Sentence Construction exercises for Unit 4: questions derived from declaratives (see sentenceBuilder grammar_question).

import sentenceTemplates from '../sentence_templates.json';
import { buildSentence } from './sentenceBuilder';
import { shuffle } from './helpers';
import { PARTICLE_KE, PARTICLE_KO_WHO, PARTICLE_KAHA, KO_LE, findVocabByTerm } from './questionParticles';

function copulaAsWord(copulaStr, vocabulary) {
  const found = vocabulary.find(w => w.term === copulaStr);
  if (found) return found;
  const tr =
    copulaStr === 'छ'
      ? 'cha'
      : copulaStr === 'छैन'
        ? 'chhaina'
        : copulaStr === 'हो'
          ? 'ho'
          : copulaStr === 'होइन'
            ? 'hoina'
            : copulaStr;
  return {
    term: copulaStr,
    gloss: copulaStr,
    definition: copulaStr,
    transliteration: tr,
    part_of_speech: 'verb',
  };
}

function nounFromComp(comp, vocabulary) {
  if (!comp?.nepali) return null;
  return (
    findVocabByTerm(vocabulary, comp.nepali) || {
      term: comp.nepali,
      gloss: comp.english || comp.nepali,
      definition: comp.english || comp.nepali,
      transliteration: comp.transliteration || comp.nepali,
      part_of_speech: 'noun',
    }
  );
}

/**
 * Ordered word chips for SentenceConstruction (must match buildGrammarQuestionSentence output).
 */
export function buildRequiredWordsList(sentence, vocabulary) {
  const k = sentence.question_kind;
  const base = sentence.base_sentence_type;
  const ke = findVocabByTerm(vocabulary, 'के') || { ...PARTICLE_KE };
  const kaha = findVocabByTerm(vocabulary, 'कहाँ') || { ...PARTICLE_KAHA };
  const le = findVocabByTerm(vocabulary, 'ले');
  const sanga =
    findVocabByTerm(vocabulary, 'सङ्ग') ||
    ({ term: 'सङ्ग', transliteration: 'sanga', gloss: 'with', part_of_speech: 'postposition' });

  if (k === 'yes_no') {
    if (base === 'possession') {
      const { possessor, object, copula } = sentence.components;
      return [
        ke,
        nounFromComp(possessor, vocabulary),
        sanga,
        nounFromComp(object, vocabulary),
        copulaAsWord(copula, vocabulary),
      ].filter(Boolean);
    }
    if (base === 'existence') {
      const { object, copula } = sentence.components;
      return [ke, nounFromComp(object, vocabulary), copulaAsWord(copula, vocabulary)].filter(Boolean);
    }
    if (base === 'identity_noun') {
      const { subject, identityNoun, copula } = sentence.components;
      return [
        ke,
        nounFromComp(subject, vocabulary),
        nounFromComp(identityNoun, vocabulary),
        copulaAsWord(copula, vocabulary),
      ].filter(Boolean);
    }
    if (base === 'identity_adj') {
      const { subject, adjective, copula } = sentence.components;
      const adjW =
        findVocabByTerm(vocabulary, adjective.nepali) ||
        nounFromComp(adjective, vocabulary);
      return [ke, nounFromComp(subject, vocabulary), adjW, copulaAsWord(copula, vocabulary)].filter(Boolean);
    }
    if (base === 'action') {
      const { subject, object, verb, uses_ergative, verb_finite, location_phrase } = sentence.components;
      const v =
        findVocabByTerm(vocabulary, (verb_finite || verb).nepali) ||
        {
          term: (verb_finite || verb).nepali,
          gloss: (verb_finite || verb).english || (verb_finite || verb).gloss,
          transliteration: (verb_finite || verb).transliteration,
          part_of_speech: 'verb',
        };
      if (uses_ergative === false && location_phrase?.nepali) {
        const locW =
          findVocabByTerm(vocabulary, location_phrase.nepali) ||
          {
            term: location_phrase.nepali,
            gloss: location_phrase.english || location_phrase.nepali,
            transliteration: location_phrase.transliteration || location_phrase.nepali,
            part_of_speech: 'noun',
          };
        return [ke, nounFromComp(subject, vocabulary), locW, v].filter(Boolean);
      }
      const leW = le || { term: 'ले', gloss: 'ergative', transliteration: 'le', part_of_speech: 'postposition' };
      return [
        ke,
        nounFromComp(subject, vocabulary),
        leW,
        nounFromComp(object, vocabulary),
        v,
      ].filter(Boolean);
    }
    if (base === 'identity_location') {
      const { subject, location, copula } = sentence.components;
      const locW =
        findVocabByTerm(vocabulary, location.nepali) ||
        (location.nepali
          ? {
              term: location.nepali,
              gloss: location.english || location.nepali,
              transliteration: location.transliteration || location.nepali,
              part_of_speech: 'noun',
            }
          : null);
      return [ke, nounFromComp(subject, vocabulary), locW, copulaAsWord(copula, vocabulary)].filter(Boolean);
    }
    return null;
  }

  if (k === 'wh_what') {
    if (base === 'identity_noun') {
      const { subject, copula } = sentence.components;
      return [nounFromComp(subject, vocabulary), ke, copulaAsWord(copula, vocabulary)].filter(Boolean);
    }
    if (base === 'possession') {
      const { possessor, copula } = sentence.components;
      return [nounFromComp(possessor, vocabulary), sanga, ke, copulaAsWord(copula, vocabulary)].filter(Boolean);
    }
    if (base === 'action') {
      const { subject, verb, uses_ergative, verb_finite } = sentence.components;
      const v =
        findVocabByTerm(vocabulary, (verb_finite || verb).nepali) ||
        {
          term: (verb_finite || verb).nepali,
          gloss: (verb_finite || verb).english || (verb_finite || verb).gloss,
          transliteration: (verb_finite || verb).transliteration,
          part_of_speech: 'verb',
        };
      if (uses_ergative === false) {
        return null;
      }
      const leW = le || { term: 'ले', gloss: 'ergative', transliteration: 'le', part_of_speech: 'postposition' };
      return [nounFromComp(subject, vocabulary), leW, ke, v].filter(Boolean);
    }
    return null;
  }

  if (k === 'wh_who') {
    if (base === 'identity_noun') {
      const { subject, copula } = sentence.components;
      const koWho = { ...PARTICLE_KO_WHO };
      return [nounFromComp(subject, vocabulary), koWho, copulaAsWord(copula, vocabulary)].filter(Boolean);
    }
    if (base === 'action') {
      if (sentence.components.uses_ergative === false) {
        return null;
      }
      const { object, verb, verb_finite } = sentence.components;
      const v =
        findVocabByTerm(vocabulary, (verb_finite || verb).nepali) ||
        {
          term: (verb_finite || verb).nepali,
          gloss: (verb_finite || verb).english || (verb_finite || verb).gloss,
          transliteration: (verb_finite || verb).transliteration,
          part_of_speech: 'verb',
        };
      return [{ ...KO_LE }, nounFromComp(object, vocabulary), v].filter(Boolean);
    }
    return null;
  }

  if (k === 'wh_where') {
    if (base === 'identity_location') {
      const { subject, copula } = sentence.components;
      return [nounFromComp(subject, vocabulary), kaha, copulaAsWord(copula, vocabulary)].filter(Boolean);
    }
    if (base === 'action' && sentence.components.uses_ergative === false) {
      const { subject, verb, verb_finite } = sentence.components;
      const v =
        findVocabByTerm(vocabulary, (verb_finite || verb).nepali) ||
        {
          term: (verb_finite || verb).nepali,
          gloss: (verb_finite || verb).english || (verb_finite || verb).gloss,
          transliteration: (verb_finite || verb).transliteration,
          part_of_speech: 'verb',
        };
      return [nounFromComp(subject, vocabulary), kaha, v].filter(Boolean);
    }
    return null;
  }

  return null;
}

/** Unit 4 Build: 15 items, ≥3 per question type; three types get 4, one gets 3 (wh_where has fewer templates). */
export const GRAMMAR_UNIT4_QUESTION_QUOTAS = {
  yes_no: 4,
  wh_what: 4,
  wh_who: 4,
  wh_where: 3,
};

/** Chip order uses separate possessor + सङ्ग; surface string has possessorसङ्ग. */
function chipJoinMatchesNepali(sent, requiredWords) {
  const terms = requiredWords.map(w => w.term);
  const target = sent.nepali.replace(/\?/g, '').replace(/।/g, '').replace(/\s+/g, ' ').trim();
  if (sent.base_sentence_type === 'possession') {
    if (sent.question_kind === 'yes_no' && terms[0] === 'के' && terms[2] === 'सङ्ग') {
      const joined = ['के', `${terms[1]}सङ्ग`, ...terms.slice(3)].join(' ');
      return joined === target;
    }
    if (sent.question_kind === 'wh_what' && terms[1] === 'सङ्ग' && terms[2] === 'के') {
      const joined = [`${terms[0]}सङ्ग`, 'के', terms[3]].join(' ');
      return joined === target;
    }
  }
  return terms.join(' ') === target;
}

function tryPushExercise(tmpl, vocabulary, seenNepali, out, counts, kind, allowDuplicateNepali) {
  const sent = buildSentence(tmpl, vocabulary, 4);
  if (!sent) return false;
  const requiredWords = buildRequiredWordsList(sent, vocabulary);
  if (!requiredWords || requiredWords.length < 2) return false;
  if (!chipJoinMatchesNepali(sent, requiredWords)) return false;

  const normNepali = sent.nepali.replace(/\?/g, '').replace(/।/g, '').replace(/\s+/g, ' ').trim();
  if (!allowDuplicateNepali && seenNepali.has(normNepali)) return false;
  seenNepali.add(normNepali);

  const pool = vocabulary.filter(w => !requiredWords.some(r => r.term === w.term));
  const distractors = shuffle(pool).slice(0, 5);

  counts[kind] += 1;
  out.push({
    id: `gq_${kind}_${tmpl.id}_${out.length}_${counts[kind]}`,
    template: tmpl,
    requiredWords,
    hintParts: requiredWords.map(w => w.term || w.gloss).filter(Boolean),
    distractors,
    targetNepali: sent.nepali.replace(/\?$/, '').trim(),
    targetTransliteration: sent.transliteration,
    questionEnglishPrompt: sent.english,
    questionKind: kind,
  });
  return true;
}

/**
 * @param {Object} [quotas] - per question_kind targets (default: 4+4+4+3 = 15)
 */
export function generateGrammarQuestionExercises(vocabulary, quotas = GRAMMAR_UNIT4_QUESTION_QUOTAS) {
  const templates = sentenceTemplates.filter(t => t.unit === 4 && t.type === 'grammar_question');
  if (templates.length === 0) return [];

  const byKind = {};
  for (const t of templates) {
    const k = t.question_kind;
    if (!byKind[k]) byKind[k] = [];
    byKind[k].push(t);
  }

  const kinds = Object.keys(quotas).filter(k => byKind[k]?.length);
  const counts = {};
  kinds.forEach(k => {
    counts[k] = 0;
    byKind[k] = shuffle([...byKind[k]]);
  });

  const out = [];
  const seenNepali = new Set();
  let attempts = 0;
  const maxAttempts = 2000;

  while (attempts < maxAttempts) {
    const need = kinds.filter(k => counts[k] < quotas[k]);
    if (need.length === 0) break;
    attempts++;
    const kind = need[Math.floor(Math.random() * need.length)];
    const pool = byKind[kind];
    const tmpl = pool[Math.floor(Math.random() * pool.length)];
    tryPushExercise(tmpl, vocabulary, seenNepali, out, counts, kind, false);
  }

  // Fill short buckets (allow duplicate Nepali if needed)
  for (const kind of kinds) {
    let fillAttempts = 0;
    while (counts[kind] < quotas[kind] && fillAttempts < 400) {
      fillAttempts++;
      const pool = byKind[kind];
      const tmpl = pool[Math.floor(Math.random() * pool.length)];
      tryPushExercise(tmpl, vocabulary, seenNepali, out, counts, kind, true);
    }
  }

  return shuffle(out);
}
