const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\/\/ Start FPS counter simulation[\s\S]*?\}, 2000\);/m;
code = code.replace(regex, '');

const regex2 = /clearInterval\(fpsInterval\);\n/m;
code = code.replace(regex2, '');

fs.writeFileSync('src/App.tsx', code);
