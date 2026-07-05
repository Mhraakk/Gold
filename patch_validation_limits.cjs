const fs = require('fs');
let code = fs.readFileSync('src/utils/dataValidation.ts', 'utf8');

code = code.replace(
  'if (canonicalValue < 300000 || canonicalValue > 1500000)',
  'if (canonicalValue < 300000 || canonicalValue > 3000000)'
);
fs.writeFileSync('src/utils/dataValidation.ts', code);
