// Singular ↔ plural agreement pairs for Unit 5 (user must pick the correct form).

import { PLURAL_VERB_SUFFIX, toSingularVerb } from './pluralForms';

const COPULA_PAIRS = {
  छन्: 'छ',
  हुन्: 'हो',
  छैनन्: 'छैन',
  होइनन्: 'होइन',
};

const TRANSLIT = {
  छ: 'cha',
  छन्: 'chan',
  हो: 'ho',
  हुन्: 'hun',
  छैन: 'chhaina',
  छैनन्: 'chainan',
  होइन: 'hoina',
  होइनन्: 'hoinan',
};

function variantEntry(term) {
  return { term, transliteration: TRANSLIT[term] || term };
}

/** Dropdown options for a copula (singular listed first when plural is correct). */
export function getCopulaAgreementVariants(correctTerm) {
  const singular = COPULA_PAIRS[correctTerm];
  if (singular) {
    return [variantEntry(singular), variantEntry(correctTerm)];
  }
  const plural = Object.entries(COPULA_PAIRS).find(([, sing]) => sing === correctTerm)?.[0];
  if (plural) {
    return [variantEntry(correctTerm), variantEntry(plural)];
  }
  return null;
}

/** Dropdown options for a plural finite verb. */
export function getVerbAgreementVariants(correctTerm) {
  const singular = toSingularVerb(correctTerm);
  if (!singular) return null;
  return [
    { term: singular, transliteration: TRANSLIT[singular] || singular },
    { term: correctTerm, transliteration: TRANSLIT[correctTerm] || correctTerm },
  ];
}

/**
 * Attach agreement_variants to a copula or verb chip for Unit 5.
 * word.term stays the correct answer. The chip always DISPLAYS the singular form by
 * default (variants[0]) — never the "wrong" option — so the learner must consciously
 * choose. When the singular form is itself the correct answer, no change is needed.
 */
export function attachAgreementVariants(chip) {
  if (!chip?.term) return chip;

  let variants = getCopulaAgreementVariants(chip.term);
  if (!variants && (chip.part_of_speech === 'verb' || chip.part_of_speech === 'copula')) {
    variants = getVerbAgreementVariants(chip.term);
  }
  if (!variants || variants.length < 2) return chip;

  return {
    ...chip,
    agreement_variants: variants,
    agreement_required: true,
    // variants[0] is always the singular form (see getCopulaAgreementVariants / getVerbAgreementVariants)
    display_default: variants[0].term,
    verb_forms: undefined,
  };
}

/** Remove standalone distractors that duplicate agreement dropdown options. */
export function filterAgreementDistractors(requiredWords, distractors) {
  const requiredTerms = new Set(requiredWords.map(w => w.term));
  const alternateTerms = new Set();
  requiredWords.forEach(w => {
    if (!w.agreement_variants) return;
    w.agreement_variants.forEach(v => {
      if (v.term !== w.term) alternateTerms.add(v.term);
    });
  });
  return distractors.filter(d => {
    if (requiredTerms.has(d.term)) return false;
    if (alternateTerms.has(d.term)) return false;
    return true;
  });
}
