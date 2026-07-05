const fs = require('fs');
let code = fs.readFileSync('src/components/MazanehHunter.tsx', 'utf8');

code = code.replace(/usd\?\.currentPrice\.toLocaleString\(\)/g, 'usd?.currentPrice?.toLocaleString()');
code = code.replace(/xauusd\?\.currentPrice\.toLocaleString\(\)/g, 'xauusd?.currentPrice?.toLocaleString()');
code = code.replace(/s\.stat\?\.currentPrice\.toLocaleString\(\)/g, 's.stat?.currentPrice?.toLocaleString()');

fs.writeFileSync('src/components/MazanehHunter.tsx', code);
