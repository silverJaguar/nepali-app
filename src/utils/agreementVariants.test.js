import {
  attachAgreementVariants,
  filterAgreementDistractors,
  getCopulaAgreementVariants,
  getVerbAgreementVariants,
} from './agreementVariants';

describe('agreementVariants', () => {
  it('builds copula singular/plural pairs', () => {
    expect(getCopulaAgreementVariants('छन्')).toEqual([
      { term: 'छ', transliteration: 'cha' },
      { term: 'छन्', transliteration: 'chan' },
    ]);
    expect(getCopulaAgreementVariants('हुन्')).toEqual([
      { term: 'हो', transliteration: 'ho' },
      { term: 'हुन्', transliteration: 'hun' },
    ]);
  });

  it('builds verb singular/plural pairs', () => {
    expect(getVerbAgreementVariants('खान्छन्')).toEqual([
      { term: 'खान्छ', transliteration: 'खान्छ' },
      { term: 'खान्छन्', transliteration: 'खान्छन्' },
    ]);
  });

  it('attaches agreement metadata to copula chips', () => {
    const chip = attachAgreementVariants({
      term: 'छन्',
      transliteration: 'chan',
      part_of_speech: 'copula',
    });
    expect(chip.agreement_required).toBe(true);
    expect(chip.display_default).toBe('छ');
    expect(chip.agreement_variants).toHaveLength(2);
  });

  it('always defaults the chip display to the singular form', () => {
    // Even when the SINGULAR form is the correct answer (e.g. mass-noun possession),
    // the chip still shows the singular by default — it never defaults to the wrong plural form.
    const chip = attachAgreementVariants({
      term: 'छ',
      transliteration: 'cha',
      part_of_speech: 'copula',
    });
    expect(chip.agreement_required).toBe(true);
    expect(chip.display_default).toBe('छ');
    expect(chip.agreement_variants).toEqual([
      { term: 'छ', transliteration: 'cha' },
      { term: 'छन्', transliteration: 'chan' },
    ]);
  });

  it('filters alternate agreement forms from distractors', () => {
    const required = [
      attachAgreementVariants({ term: 'छन्', part_of_speech: 'copula' }),
    ];
    const pool = [
      { term: 'छ' },
      { term: 'कुकुर' },
      { term: 'छन्' },
    ];
    const filtered = filterAgreementDistractors(required, pool);
    expect(filtered.map(w => w.term)).toEqual(['कुकुर']);
  });
});
