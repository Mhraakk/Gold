const fs = require('fs');
let code = fs.readFileSync('src/utils/__tests__/dataValidation.test.ts', 'utf8');

const newCode = `import { validateAndNormalizePrice, parseAbshdhMessage } from '../dataValidation';
import { describe, it, expect } from 'vitest';

describe('Telegram Parsing (@abshdh)', () => {
  it('correctly parses raw Persian Melted Gold strings', () => {
    const rawText = 'قیمت ها امروز:\\n#ابشده 79,600,000\\n#گرم‌طلا 18,375,000';
    const parsed = parseAbshdhMessage(rawText);
    expect(parsed.meltedGold).toBe(79600000);
    expect(parsed.gold18k).toBe(18375000);
  });

  it('correctly parses raw Persian Melted Gold strings with different spacing', () => {
    const rawText = '#ابشـده‌حواله 76,000,000\\n#گرم‌طلا: 17,545,074';
    const parsed = parseAbshdhMessage(rawText);
    expect(parsed.meltedGold).toBe(76000000);
    expect(parsed.gold18k).toBe(17545074);
  });

  it('correctly parses raw Persian numbers', () => {
    const rawText = '#ابشده ۷۹,۶۰۰,۰۰۰\\n#گرم‌طلا ۱۸,۳۷۵,۰۰۰';
    const parsed = parseAbshdhMessage(rawText);
    expect(parsed.meltedGold).toBe(79600000);
    expect(parsed.gold18k).toBe(18375000);
  });
});

describe('Data Validation & Canonicalization', () => {
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

fs.writeFileSync('src/utils/__tests__/dataValidation.test.ts', newCode);
