import { validateAndNormalizePrice, parseAbshdhMessage } from '../dataValidation';
import { describe, it, expect } from 'vitest';

describe('Telegram Parsing (@abshdh)', () => {
  it('correctly parses raw Persian Melted Gold strings', () => {
    const rawText = 'قیمت ها امروز:\n#ابشده 79,600,000\n#گرم‌طلا 18,375,000';
    const parsed = parseAbshdhMessage(rawText);
    expect(parsed.meltedGold).toBe(79600000);
    expect(parsed.gold18k).toBe(18375000);
  });

  it('correctly parses raw Persian Melted Gold strings with different spacing', () => {
    const rawText = '#ابشـده‌حواله 76,000,000\n#گرم‌طلا: 17,545,074';
    const parsed = parseAbshdhMessage(rawText);
    expect(parsed.meltedGold).toBe(76000000);
    expect(parsed.gold18k).toBe(17545074);
  });

  it('correctly parses raw Persian numbers', () => {
    const rawText = '#ابشده ۷۹,۶۰۰,۰۰۰\n#گرم‌طلا ۱۸,۳۷۵,۰۰۰';
    const parsed = parseAbshdhMessage(rawText);
    expect(parsed.meltedGold).toBe(79600000);
    expect(parsed.gold18k).toBe(18375000);
  });
});

describe('Data Validation & Canonicalization', () => {
  // @abshdh quotes Toman: "آبشده 79,600,000" = 796,000,000 IRR = مظنه 79.60
  it('converts a Telegram Toman quote to IRR and keeps the mazaneh notation', () => {
    const normalized = validateAndNormalizePrice('MELTED_GOLD', 79600000, 'TOMAN', '@abshdh');
    expect(normalized.validationStatus).toBe('valid');
    expect(normalized.canonicalValue).toBe(796000000);
    expect(normalized.canonicalCurrency).toBe('IRR');
    expect(normalized.displayValue).toBe('79.60');
    expect(normalized.displayUnit).toBe('میلیون تومان');
    expect(normalized.marketNotation).toBe('مظنه 79.60');
  });

  it('accepts current live prices in IRR (TGJU, Oct 2026)', () => {
    expect(validateAndNormalizePrice('MELTED_GOLD', 1154020000, 'IRR', 'TGJU').displayValue).toBe('115.40');
    expect(validateAndNormalizePrice('MELTED_GOLD', 1154020000, 'IRR', 'TGJU').validationStatus).toBe('valid');
    expect(validateAndNormalizePrice('USDIRT', 2711800, 'IRR', 'TGJU').displayValue).toBe('271,180');
    expect(validateAndNormalizePrice('GOLD_18K', 266395000, 'IRR', 'TGJU').validationStatus).toBe('valid');
    expect(validateAndNormalizePrice('GOLD_24K', 355190000, 'IRR', 'TGJU').validationStatus).toBe('valid');
  });

  it('rejects a Toman figure mislabelled as IRR', () => {
    // 115,350,000 is the Telegram Toman quote; as IRR it would be a 10x-too-low mesghal
    expect(validateAndNormalizePrice('MELTED_GOLD', 115350000, 'IRR', 'Test').validationStatus).toBe('malformed');
    expect(validateAndNormalizePrice('USDIRT', 27118, 'TOMAN', 'Test').validationStatus).toBe('malformed');
  });

  it('formats 1740000000 IRR for COIN_EMAMI correctly', () => {
    const normalized = validateAndNormalizePrice('COIN_EMAMI', 1740000000, 'IRR', 'Test');
    expect(normalized.validationStatus).toBe('valid');
    expect(normalized.canonicalValue).toBe(1740000000);
    expect(normalized.displayValue).toBe('174,000,000');
    expect(normalized.displayUnit).toBe('تومان');
  });

  it('rejects UNKNOWN units', () => {
    const normalized = validateAndNormalizePrice('MELTED_GOLD', 79600, 'UNKNOWN', 'Manual');
    expect(normalized.validationStatus).toBe('invalid_unit');
  });
});
