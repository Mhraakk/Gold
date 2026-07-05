const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "fetch('/api/market/tgju/latest?asset=emami').catch(() => null)",
  "fetch('/api/market/tgju/latest?asset=emami').catch(() => null),\n          fetch('/api/market/tgju/latest?asset=tether').catch(() => null)"
);
code = code.replace(
  "const [abshdhRes, xauusdRes, usdIrtRes, emamiRes] =",
  "const [abshdhRes, xauusdRes, usdIrtRes, emamiRes, tetherRes] ="
);
code = code.replace(
  "await handleTgju(emamiRes, 'COIN_EMAMI');",
  "await handleTgju(emamiRes, 'COIN_EMAMI');\n        await handleTgju(tetherRes, 'USDTIRT');"
);

fs.writeFileSync('src/App.tsx', code);
