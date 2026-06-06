import { getAvailableVocabulary, getTemplatesForUnit } from './grammarVocabulary';
import { generateIdentifyExercises } from './identifyGenerator';

describe('identifyGenerator', () => {
  it('generates filtered unit 4 identify exercises', () => {
    const vocabulary = getAvailableVocabulary(4);
    const templates = getTemplatesForUnit(4);
    const exercises = generateIdentifyExercises(4, vocabulary, templates, 7);

    console.log('generated', exercises.length);
    exercises.forEach((ex, i) => {
      console.log(i + 1, ex.correctAnswer, ex.sentence);
    });

    expect(exercises.length).toBeGreaterThan(0);
    expect(exercises[0].sentence).toBeTruthy();
    expect(exercises[0].options.length).toBe(5);
  });
});
