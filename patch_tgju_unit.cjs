const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const unit = assetId === 'XAUUSD' ? 'USD' : 'TOMAN';",
  "const unit = assetId === 'XAUUSD' ? 'USD' : 'IRR';"
);
code = code.replace(
  "next['MELTED_GOLD'] = validateAndNormalizePrice('MELTED_GOLD', abshdhJson.data.MELTED_GOLD, 'IRR', 'Telegram @abshdh').canonicalValue;",
  "next['MELTED_GOLD'] = validateAndNormalizePrice('MELTED_GOLD', abshdhJson.data.MELTED_GOLD, 'TOMAN', 'Telegram @abshdh').canonicalValue;"
);
code = code.replace(
  "next['GOLD_18K'] = validateAndNormalizePrice('GOLD_18K', abshdhJson.data.GOLD_18K, 'IRR', 'Telegram @abshdh').canonicalValue;",
  "next['GOLD_18K'] = validateAndNormalizePrice('GOLD_18K', abshdhJson.data.GOLD_18K, 'TOMAN', 'Telegram @abshdh').canonicalValue;"
);

fs.writeFileSync('src/App.tsx', code);
