// Question words and particles for Unit 4 (Nepali questions). Used when building exercises and sentences.

export const PARTICLE_KE = {
  term: 'के',
  gloss: 'what / (yes-no marker)',
  definition: 'what; yes/no question marker',
  transliteration: 'ke',
  part_of_speech: 'particle',
  can_be: ['question_particle'],
};

/** Interrogative "who" (homograph with genitive को in writing; distinct in pedagogy). */
export const PARTICLE_KO_WHO = {
  term: 'को',
  gloss: 'who',
  definition: 'who (question)',
  transliteration: 'ko',
  part_of_speech: 'particle',
  can_be: ['question_particle'],
};

export const PARTICLE_KAHA = {
  term: 'कहाँ',
  gloss: 'where',
  definition: 'where',
  transliteration: 'kahaan',
  part_of_speech: 'adverb',
  can_be: ['question_word'],
};

/** Ergative after को → कोले (who as subject of transitive clause). */
export const KO_LE = {
  term: 'कोले',
  gloss: 'who (subject)',
  definition: 'who (with ergative)',
  transliteration: 'kole',
  part_of_speech: 'particle',
  can_be: ['question_particle'],
};

export function findVocabByTerm(vocabulary, term) {
  return vocabulary.find(w => w.term === term) || null;
}
