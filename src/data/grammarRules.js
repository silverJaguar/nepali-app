// Grammar rules for True/False question generation
// Extracted from grammarPathwayData.js and expanded for quiz use

export const GRAMMAR_RULES = {
  1: [ // Unit 1: Basic Sentences
    {
      feature: 'identity_copula',
      statement: 'The copula हो (ho) is used for identity sentences where the subject is identified as a noun',
      true: true,
      explanation: 'हो is the identity copula used when stating "A is B" where B is a noun (e.g., "He is a teacher").',
      falseVersion: 'The copula छ (chha) is used for identity sentences where the subject is identified as a noun',
      falseExplanation: 'छ is used for adjectives and existence, not identity with nouns. हो is used for identity.',
    },
    {
      feature: 'adjective_copula',
      statement: 'The copula छ (chha) is used with adjectives to describe qualities or states',
      true: true,
      explanation: 'छ is used when describing a quality or state with an adjective (e.g., "The boy is tall").',
      falseVersion: 'The copula हो (ho) is used with adjectives to describe qualities or states',
      falseExplanation: 'हो is for identity with nouns, not adjectives. छ is used with adjectives.',
    },
    {
      feature: 'possession_particle',
      statement: 'The postposition सङ्ग (sanga) means "with" and is used to express possession',
      true: true,
      explanation: 'सङ्ग attaches to the possessor and with छ creates possession: "A-with B exists" = "A has B".',
      falseVersion: 'The postposition ले (le) means "with" and is used to express possession',
      falseExplanation: 'ले is the ergative case marker for transitive subjects, not possession. सङ्ग is used for possession.',
    },
    {
      feature: 'possession_structure',
      statement: 'In possession sentences, the postposition सङ्ग comes after the possessor',
      true: true,
      explanation: 'Possession structure is: [Possessor]सङ्ग [Object] छ (e.g., "केटासङ्ग किताब छ").',
      falseVersion: 'In possession sentences, the postposition सङ्ग comes after the object',
      falseExplanation: 'सङ्ग attaches to the possessor, not the object.',
    },
    {
      feature: 'existence_copula',
      statement: 'The copula छ (chha) is used for existence sentences meaning "there is"',
      true: true,
      explanation: 'छ alone with a noun indicates existence: [Object] छ = "There is [object]".',
      falseVersion: 'The copula हो (ho) is used for existence sentences meaning "there is"',
      falseExplanation: 'हो is for identity, not existence. छ is used for existence.',
    },
    {
      feature: 'identity_vs_adjective',
      statement: 'Identity sentences use हो with nouns, while adjective sentences use छ',
      true: true,
      explanation: 'हो identifies (A is B-noun), छ describes qualities (A is adjective).',
      falseVersion: 'Identity sentences use छ with nouns, while adjective sentences use हो',
      falseExplanation: 'This is backwards. हो is for identity with nouns, छ is for adjectives.',
    },
  ],
  
  2: [ // Unit 2: Action Sentences
    {
      feature: 'ergative_case',
      statement: 'The postposition ले (le) marks the subject of transitive verbs',
      true: true,
      explanation: 'ले is the ergative case marker that attaches to the subject when the verb has a direct object.',
      falseVersion: 'The postposition ले (le) marks the object of transitive verbs',
      falseExplanation: 'ले marks the subject (doer), not the object. The object has no marker in basic sentences.',
    },
    {
      feature: 'sov_order',
      statement: 'Nepali follows Subject-Object-Verb (SOV) word order',
      true: true,
      explanation: 'Standard word order places the verb at the end: Subject + Object + Verb.',
      falseVersion: 'Nepali follows Subject-Verb-Object (SVO) word order',
      falseExplanation: 'Nepali is SOV, not SVO like English. The verb comes at the end.',
    },
    {
      feature: 'transitive_marker',
      statement: 'In transitive sentences, the ergative marker ले attaches directly to the subject',
      true: true,
      explanation: 'ले attaches to the subject noun: [Subject]ले [Object] [Verb].',
      falseVersion: 'In transitive sentences, the ergative marker ले is placed after the verb',
      falseExplanation: 'ले comes immediately after the subject, not after the verb.',
    },
    {
      feature: 'ergative_requirement',
      statement: 'All transitive verbs in present tense require the ergative marker ले on the subject',
      true: true,
      explanation: 'When a verb has a direct object (is transitive), the subject must have ले.',
      falseVersion: 'Only some transitive verbs require the ergative marker ले on the subject',
      falseExplanation: 'All transitive verbs require ले. It is not optional.',
    },
    {
      feature: 'intransitive_no_le',
      statement: 'Intransitive verbs (verbs without objects) do not use the ergative marker ले',
      true: true,
      explanation: 'ले is only used with transitive verbs. Intransitive subjects have no marker.',
      falseVersion: 'Intransitive verbs (verbs without objects) require the ergative marker ले',
      falseExplanation: 'Intransitive verbs do not take ले. Only transitive verbs use it.',
    },
    {
      feature: 'verb_final_position',
      statement: 'In Nepali sentences, the verb always comes at the end',
      true: true,
      explanation: 'Nepali is a verb-final language (SOV order). The verb is always last.',
      falseVersion: 'In Nepali sentences, the verb can appear anywhere in the sentence',
      falseExplanation: 'The verb position is fixed at the end of the sentence in standard Nepali.',
    },
  ],
  
  3: [ // Unit 3: Negation
    {
      feature: 'negation_identity',
      statement: 'The negative form of हो (identity copula) is होइन (hoina)',
      true: true,
      explanation: 'हो → होइन for identity sentences: "He is a teacher" → "He is not a teacher".',
      falseVersion: 'The negative form of हो (identity copula) is छैन (chhaina)',
      falseExplanation: 'छैन negates छ, not हो. होइन is the negative of हो.',
    },
    {
      feature: 'negation_existence',
      statement: 'The negative form of छ (existence/adjective copula) is छैन (chhaina)',
      true: true,
      explanation: 'छ → छैन for existence and adjectives: "There is" → "There is not", "is tall" → "is not tall".',
      falseVersion: 'The negative form of छ (existence/adjective copula) is होइन (hoina)',
      falseExplanation: 'होइन negates हो, not छ. छैन is the negative of छ.',
    },
    {
      feature: 'negation_action_suffix',
      statement: 'Present tense action verbs are negated by replacing the ending with -दैन (-daina)',
      true: true,
      explanation: 'Verb negation changes the suffix: खान्छ → खाँदैन, पिउँछ → पिउँदैन.',
      falseVersion: 'Present tense action verbs are negated by adding छैन after the verb',
      falseExplanation: 'Verbs negate internally with -दैन suffix, not by adding छैन separately.',
    },
    {
      feature: 'possession_negation',
      statement: 'Possession sentences are negated using सङ्ग + छैन',
      true: true,
      explanation: 'Negative possession: [Possessor]सङ्ग [Object] छैन = "[Possessor] does not have [Object]".',
      falseVersion: 'Possession sentences are negated using सङ्ग + होइन',
      falseExplanation: 'Possession uses छ/छैन, not हो/होइन. छैन is correct for negative possession.',
    },
    {
      feature: 'negation_consistency',
      statement: 'Negative forms maintain the same word order as their affirmative counterparts',
      true: true,
      explanation: 'Only the copula or verb changes to negative; word order stays the same.',
      falseVersion: 'Negative sentences require different word order than affirmative sentences',
      falseExplanation: 'Word order remains the same in negative sentences. Only the copula/verb changes.',
    },
    {
      feature: 'honorific_negation',
      statement: 'The honorific form हुन् (hun) negates to हुनुहुन्न (hunuhunna)',
      true: true,
      explanation: 'Honorific forms have their own negative forms maintaining respect level.',
      falseVersion: 'The honorific form हुन् (hun) negates to होइन (hoina)',
      falseExplanation: 'Honorific forms maintain their level. हुन् → हुनुहुन्न, not होइन.',
    },
  ],
};

// Helper to get a random true/false grammar question for a unit
export function getRandomGrammarRuleTF(unitId) {
  const rules = GRAMMAR_RULES[unitId];
  
  if (!rules || rules.length === 0) {
    console.warn(`[Grammar Rules] No rules found for unit ${unitId}, using unit 1`);
    return getRandomGrammarRuleTF(1);
  }
  
  const randomRule = rules[Math.floor(Math.random() * rules.length)];
  
  // 50% chance to use true statement, 50% chance to use false version
  const useTrue = Math.random() < 0.5;
  
  if (useTrue) {
    return {
      type: 'true_false',
      question: randomRule.statement,
      answer: true,
      explanation: randomRule.explanation,
      feature: randomRule.feature,
      unitId: unitId, // Add unit ID for verification
    };
  } else {
    return {
      type: 'true_false',
      question: randomRule.falseVersion,
      answer: false,
      explanation: randomRule.falseExplanation,
      feature: randomRule.feature,
      unitId: unitId, // Add unit ID for verification
    };
  }
}

// Get grammar features available for a unit (for MC grammar identification questions)
export function getGrammarFeaturesForUnit(unitId) {
  const features = {
    1: [
      { id: 'identity_copula', label: 'Identity copula', description: 'A is B (noun)' },
      { id: 'adjective_copula', label: 'Adjective copula', description: 'A is [adjective]' },
      { id: 'existence', label: 'Existence', description: 'There is...' },
      { id: 'possession', label: 'Possession', description: 'A has B' },
    ],
    2: [
      { id: 'ergative_case', label: 'Ergative case', description: 'Marks transitive subject' },
      { id: 'sov_order', label: 'SOV word order', description: 'Subject-Object-Verb' },
      { id: 'transitive_verb', label: 'Transitive verb', description: 'Verb with direct object' },
      { id: 'present_tense', label: 'Present tense action', description: 'Habitual/present action' },
    ],
    3: [
      { id: 'negation_identity', label: 'Identity negation', description: 'A is not B (noun)' },
      { id: 'negation_existence', label: 'Existence negation', description: 'There is not...' },
      { id: 'negation_action', label: 'Action negation', description: 'Does not [verb]' },
      { id: 'negative_possession', label: 'Negative possession', description: 'Does not have' },
    ],
  };
  
  return features[unitId] || features[1];
}

