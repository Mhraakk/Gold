const fs = require('fs');
let code = fs.readFileSync('src/utils/__tests__/dataValidation.test.ts', 'utf8');

const newTests = `describe('Data Validation & Canonicalization', () => {
  it('formats 79,600,000 IRR correctly', () => {
    const normalized = validateAndNormalizePrice('MELTED_GOLD', 79600000, 'IRR', '@abshdh');
    expect(normalized.validationStatus).toBe('valid');
    expect(normalized.canonicalValue).toBe(79600000);
    expect(normalized.canonicalCurrency).toBe('IRR');
    expect(normalized.displayValue).toBe('79.60');
    expect(normalized.marketNotation).toBe('مظنه 79.60');
  });

  it('formats 1740000000 IRR for COIN_EMAMI correctly', () => {
    const normalized = validateAndNormalizePrice('COIN_EMAMI', 1740000000, 'IRR', 'Test');
    expect(normalized.validationStatus).toBe('valid');
    expect(normalized.canonicalValue).toBe(1740000000);
    expect(normalized.displayValue).toBe('174,000,000');
    expect(normalized.displayUnit).toBe('تومان');
  });

  it('converts TOMAN to IRR correctly', () => {
    const normalized = validateAndNormalizePrice('MELTED_GOLD', 7960000, 'TOMAN', 'Manual');
    expect(normalized.validationStatus).toBe('valid');
    expect(normalized.canonicalValue).toBe(79600000);
    expect(normalized.canonicalCurrency).toBe('IRR');
  });

  it('rejects UNKNOWN units', () => {
    const normalized = validateAndNormalizePrice('MELTED_GOLD', 79600, 'UNKNOWN', 'Manual');
    expect(normalized.validationStatus).toBe('invalid_unit');
  });
});`;

code = code.replace(/describe\('Data Validation & Canonicalization', \(\) => {[\s\S]*?}\);/, newTests);
fs.writeFileSync('src/utils/__tests__/dataValidation.test.ts', code);
