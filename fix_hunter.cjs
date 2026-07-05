const fs = require('fs');
let code = fs.readFileSync('src/components/MazanehHunter.tsx', 'utf8');

code = code.replace(/\\`/g, '`');
code = code.replace(/\\\$/g, '$');

fs.writeFileSync('src/components/MazanehHunter.tsx', code);
