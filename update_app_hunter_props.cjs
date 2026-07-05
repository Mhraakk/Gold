const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/<MazanehHunter prices=\{prices\} assetStats=\{assetStats\} \/>/, '<MazanehHunter assets={assets} assetsMeta={ASSETS_METADATA} />');
fs.writeFileSync('src/App.tsx', code);
