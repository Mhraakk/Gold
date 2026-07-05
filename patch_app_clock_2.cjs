const fs = require('fs');

const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/<span className=\{Math\.floor\(\(currentTimeMs - sourceTimestamps\[meta\.id\]\) \/ 1000\) < 60 \? "text-emerald-400\/80" : "text-amber-400\/80"\}>\s*\{Math\.floor\(\(currentTimeMs - sourceTimestamps\[meta\.id\]\) \/ 1000\)\} ثانیه پیش\s*<\/span>\s*\{Math\.floor\(\(currentTimeMs - sourceTimestamps\[meta\.id\]\) \/ 1000\) > 300 && \(\s*<span className="text-\[9px\] text-rose-500 font-bold px-1\.5 py-0\.5 bg-rose-500\/10 rounded animate-pulse">\s*هشدار تاخیر\s*<\/span>\s*\)\}/g, 
  '<TimeAgoStyled timestamp={sourceTimestamps[meta.id]} />');

code = code.replace(/const currentTimeMs = currentTime\.getTime\(\);\s*/g, '');

fs.writeFileSync(path, code);
