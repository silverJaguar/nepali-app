// Shared vocabulary and template access for grammar activities (Quiz, Fill-in-the-Blank)
// Keeps the same filtering as SentenceConstruction so generated sentences stay consistent

import lessons from '../lessons.json';
import sentenceTemplates from '../sentence_templates.json';
import { checkContentSafety } from './contentFilter';

/**
 * Get filtered vocabulary for the unit (reuses logic from SentenceConstruction)
 */
export function getAvailableVocabulary(currentUnit = 1) {
  const allVocabulary = Object.values(lessons).flatMap(unitLessons =>
    unitLessons.flatMap(lesson => lesson.flashcards)
  );

  const safeVocabulary = allVocabulary.filter(word => {
    const safetyCheck = checkContentSafety(word.term || '');
    if (safetyCheck.isNSFW) return false;
    const definitionCheck = checkContentSafety(word.definition || word.gloss || '');
    if (definitionCheck.isNSFW) return false;
    return true;
  });

  let filteredVocabulary = safeVocabulary;

  if (currentUnit === 1 || currentUnit === 2) {
    filteredVocabulary = safeVocabulary.filter(word => {
      if (word.unit_min && word.unit_min > currentUnit) return false;
      if (word.visible_in_vocab === false) return false;
      if (word.part_of_speech === 'verb') {
        const term = word.term || '';
        const isNegation = term.includes('दैन') || term.includes('छैन') || term.includes('होइन') || term.includes('हैन') || term.includes('हुँदैन');
        const hasNegativeProperty = word.can_be && word.can_be.some(type => type.includes('negative') || type.includes('verb_negative'));
        if (isNegation || hasNegativeProperty) return false;
      }
      return true;
    });
  }

  return filteredVocabulary;
}

/**
 * Get sentence templates for the unit
 */
export function getTemplatesForUnit(currentUnit) {
  return sentenceTemplates.filter(tmpl => tmpl.unit === currentUnit);
}
