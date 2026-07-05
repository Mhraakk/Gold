const { validateAndNormalizePrice } = require('./src/utils/dataValidation.ts');

const testCases = [
  { asset: 'COIN_EMAMI', raw: 1740000000, unit: 'IRR' },
  { asset: 'MELTED_GOLD', raw: 75000000, unit: 'IRR' },
  { asset: 'MELTED_GOLD', raw: 7500000, unit: 'TOMAN' },
  { asset: 'GOLD_18K', raw: 158000000, unit: 'IRR' },
];

for (const tc of testCases) {
  console.log(validateAndNormalizePrice(tc.asset, tc.raw, tc.unit, 'Test'));
}
