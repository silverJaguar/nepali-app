import lessons from '../lessons.json';
import { checkContentSafety, filterSafeExercises } from './contentFilter';
import { buildSentence } from './sentenceBuilder';
import {
  buildPluralRequiredWordsList,
  generatePluralGrammarExercises,
} from './grammarPluralExercises';
import { normalizePluralChipJoin } from './pluralForms';
import sentenceTemplates from '../sentence_templates.json';

function getVocab(unit = 5) {
  const all = Object.values(lessons).flatMap(u => u.flatMap(l => l.flashcards));
  return all.filter(w => {
    if (checkContentSafety(w.term || '').isNSFW) return false;
    if (checkContentSafety(w.definition || w.gloss || '').isNSFW) return false;
    if ((unit === 1 || unit === 2) && w.unit_min && w.unit_min > unit) return false;
    return true;
  });
}

describe('grammarPluralExercises', () => {
  it('diagnoses unit 5 generation', () => {
    const vocabulary = getVocab(5);
    const templates = sentenceTemplates.filter(t => t.unit === 5);
    expect(templates.length).toBeGreaterThan(0);

    let built = 0;
    let chipsOk = 0;
    let joinFail = 0;
    const joinFails = [];

    for (const tmpl of templates) {
      for (let i = 0; i < 30; i++) {
        const sent = buildSentence(tmpl, vocabulary, 5);
        if (!sent?.nepali) continue;
        built++;
        const rw = buildPluralRequiredWordsList(sent, vocabulary);
        if (!rw || rw.length < 2) continue;
        chipsOk++;
        const terms = rw.map(w => w?.term).filter(Boolean);
        const target = sent.nepali.replace(/\?/g, '').replace(/।/g, '').replace(/\s+/g, ' ').trim();
        const joined = terms.join(' ');
        if (normalizePluralChipJoin(terms) !== target && !target.startsWith('के ')) {
          joinFail++;
          if (joinFails.length < 5) {
            joinFails.push({ id: tmpl.id, target, terms: joined, nepali: sent.nepali });
          }
        }
      }
    }

    const exercises = generatePluralGrammarExercises(vocabulary);
    const safe = filterSafeExercises(exercises);
    console.log('vocab', vocabulary.length, 'built', built, 'chipsOk', chipsOk, 'joinFail', joinFail);
    console.log('joinFails sample', joinFails);
    console.log('exercises', exercises.length, 'after filter', safe.length);

    expect(exercises.length).toBeGreaterThan(0);
    expect(exercises.length).toBeLessThanOrEqual(12);
    expect(safe.length).toBeGreaterThan(0);
  });

  it('does not pluralize mass nouns like money', () => {
    const vocabulary = getVocab(5);
    const existence = sentenceTemplates.find(t => t.id === 'u5_existence');
    let sawMoney = false;
    for (let i = 0; i < 50; i++) {
      const sent = buildSentence(existence, vocabulary, 5);
      if (!sent) continue;
      if (sent.english.toLowerCase().includes('money') || sent.nepali.includes('पैसा')) {
        sawMoney = true;
        expect(sent.english.toLowerCase()).not.toContain('moneys');
        expect(sent.nepali).not.toContain('पैसाहरू');
      }
    }
    // money may not appear in existence at all now — that's correct
    expect(sawMoney).toBe(false);
  });

  it('attaches agreement dropdowns to copulas and verbs', () => {
    const vocabulary = getVocab(5);
    const exercises = generatePluralGrammarExercises(vocabulary);
    const withAgreement = exercises.filter(ex =>
      ex.requiredWords.some(w => w.agreement_required)
    );
    expect(withAgreement.length).toBeGreaterThan(0);

    const copulaChip = withAgreement[0].requiredWords.find(w => w.agreement_required);
    expect(copulaChip.display_default).toBeTruthy();
    expect(copulaChip.agreement_variants.some(v => v.term === copulaChip.term)).toBe(true);
    expect(copulaChip.agreement_variants.some(v => v.term === copulaChip.display_default)).toBe(true);
  });

  it('keeps हरू as a separate chip from plural nouns', () => {
    const vocabulary = getVocab(5);
    const exercises = generatePluralGrammarExercises(vocabulary);
    const possession = exercises.find(ex => ex.template.type === 'possession');
    expect(possession).toBeTruthy();

    const terms = possession.requiredWords.map(w => w.term);
    expect(terms).toContain('हरू');
    expect(terms.some(t => t.endsWith('हरू') && t !== 'हरू')).toBe(false);

    const target = possession.targetNepali.replace(/[।?]/g, '').replace(/\s+/g, ' ').trim();
    expect(normalizePluralChipJoin(terms)).toBe(target);
  });

  it('uses singular copula when a plural possessor has a mass noun object', () => {
    const vocabulary = getVocab(5);
    const possession = sentenceTemplates.find(t => t.id === 'u5_possession');
    let sawMassPossession = false;

    for (let i = 0; i < 200; i++) {
      const sent = buildSentence(possession, vocabulary, 5);
      if (!sent?.nepali) continue;
      const isMassObject = /पैसा|रुपैयाँ/.test(sent.nepali);
      if (!isMassObject) continue;
      sawMassPossession = true;
      expect(sent.nepali).toMatch(/(पैसा|रुपैयाँ) छ।/);
      expect(sent.nepali).not.toMatch(/(पैसा|रुपैयाँ) छन्।/);
      expect(sent.components.copula).toBe('छ');
    }

    expect(sawMassPossession).toBe(true);
  });

  it('uses plural "Are there" for plural existence yes/no questions', () => {
    const vocabulary = getVocab(5);
    const ynExistence = sentenceTemplates.find(t => t.id === 'u5_yn_existence');
    let sawQuestion = false;

    for (let i = 0; i < 100; i++) {
      const sent = buildSentence(ynExistence, vocabulary, 5);
      if (!sent?.english) continue;
      sawQuestion = true;
      expect(sent.english).not.toMatch(/^Is there /);
      expect(sent.english).toMatch(/^Are there /);
    }

    expect(sawQuestion).toBe(true);
  });

  it('never produces mangled English verbs like "goe"', () => {
    const vocabulary = getVocab(5);
    const templates = sentenceTemplates.filter(t => t.unit === 5);
    let checked = 0;

    for (const tmpl of templates) {
      for (let i = 0; i < 40; i++) {
        const sent = buildSentence(tmpl, vocabulary, 5);
        if (!sent?.english) continue;
        checked++;
        expect(sent.english).not.toMatch(/\bgoe\b/);
        expect(sent.english).not.toMatch(/\b\w+(che|she|sse|xe|ze)\b/);
        // plural subjects never take a 3rd-person singular verb
        expect(sent.english).not.toMatch(/^The \w+s (goes|eats|drinks|comes|does|listens|sees)\b/);
      }
    }

    expect(checked).toBeGreaterThan(0);
  });

  it('keeps predicate nouns after हो/हुन् singular but plural in English', () => {
    const vocabulary = getVocab(5);
    const identity = sentenceTemplates.find(t => t.id === 'u5_identity_noun');
    let checked = 0;

    for (let i = 0; i < 100; i++) {
      const sent = buildSentence(identity, vocabulary, 5);
      if (!sent?.nepali) continue;
      checked++;
      const predicate = sent.components.identityNoun.nepali;
      expect(predicate).not.toMatch(/हरू$/);
      // subject keeps हरू, predicate does not
      expect(sent.nepali).toMatch(/हरू /);
      expect(sent.english).toMatch(/ are (not )?\w+s\b/);
      // and the subject is never also the predicate
      expect(sent.components.subject.nepali.replace(/हरू$/, '')).not.toBe(predicate);
    }

    expect(checked).toBeGreaterThan(0);
  });

  it('makes मा a separate chip so learners must place the postposition', () => {
    const vocabulary = getVocab(5);
    const location = sentenceTemplates.find(t => t.id === 'u5_identity_location');
    let checked = 0;

    for (let i = 0; i < 60; i++) {
      const sent = buildSentence(location, vocabulary, 5);
      if (!sent?.nepali) continue;
      const chips = buildPluralRequiredWordsList(sent, vocabulary);
      const terms = chips.map(w => w.term);
      checked++;
      expect(terms).toContain('मा');
      // the place appears bare, with मा as its own chip (आमा legitimately ends in मा)
      const place = sent.components.location.nepali.replace(/मा$/, '');
      expect(terms).toContain(place);
      expect(terms).not.toContain(`${place}मा`);
      const target = sent.nepali.replace(/[।?]/g, '').replace(/\s+/g, ' ').trim();
      expect(normalizePluralChipJoin(terms)).toBe(target);
    }

    expect(checked).toBeGreaterThan(0);
  });

  it('keeps whole phrases out of the word bank', () => {
    const vocabulary = getVocab(5);
    const exercises = generatePluralGrammarExercises(vocabulary);
    expect(exercises.length).toBeGreaterThan(0);

    exercises.forEach(ex => {
      [...ex.requiredWords, ...ex.distractors].forEach(w => {
        expect(w.part_of_speech).not.toBe('phrase');
        expect(w.part_of_speech).not.toBe('interjection');
        expect(w.term).not.toMatch(/[?।]/);
        expect(w.term.trim().split(/\s+/).length).toBeLessThanOrEqual(2);
      });
    });
  });

  it('keeps gender variants available on predicate noun chips', () => {
    const vocabulary = getVocab(5);
    const identity = sentenceTemplates.find(t => t.id === 'u5_identity_noun');
    let sawTeacher = false;

    for (let i = 0; i < 200 && !sawTeacher; i++) {
      const sent = buildSentence(identity, vocabulary, 5);
      if (!sent?.nepali || !sent.nepali.includes('शिक्षक')) continue;
      sawTeacher = true;
      const chips = buildPluralRequiredWordsList(sent, vocabulary);
      const teacher = chips.find(w => w.term === 'शिक्षक');
      expect(teacher).toBeTruthy();
      expect(teacher.gender_variants?.some(v => v.term === 'शिक्षिका')).toBe(true);
    }

    expect(sawTeacher).toBe(true);
  });

  it('does not place buildings or body parts inside other places', () => {
    const vocabulary = getVocab(5);
    const locationTemplates = sentenceTemplates.filter(
      t => t.id === 'u5_identity_location' || t.id === 'u5_identity_location_negative'
    );
    let checked = 0;

    for (const tmpl of locationTemplates) {
      for (let i = 0; i < 80; i++) {
        const sent = buildSentence(tmpl, vocabulary, 5);
        if (!sent?.nepali) continue;
        checked++;
        // घर (house) / अस्पताल (hospital) / पेट (stomach) / कम्पनी (company)
        expect(sent.nepali).not.toMatch(/^घरहरू/);
        expect(sent.nepali).not.toMatch(/^पेटहरू/);
        expect(sent.nepali).not.toMatch(/^अस्पतालहरू/);
        expect(sent.nepali).not.toMatch(/^कम्पनीहरू/);
      }
    }

    expect(checked).toBeGreaterThan(0);
  });
});
