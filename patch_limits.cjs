const fs = require('fs');
let code = fs.readFileSync('src/utils/dataValidation.ts', 'utf8');

code = code.replace(
  'if (canonicalValue < 10000000 || canonicalValue > 100000000)',
  'if (canonicalValue < 10000000 || canonicalValue > 500000000)'
);

fs.writeFileSync('src/utils/dataValidation.ts', code);
