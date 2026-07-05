const fs = require('fs');
const path = 'src/components/ChartTerminal.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(`marketStructure?: MarketStructure | null;`, `marketStructure: MarketStructure;`);
code = code.replace(`marketStructure = { trend: "NEUTRAL", orderBlocks: [], fvgs: [], waves: [], liquidityZones: [], supportLines: [], resistanceLines: [] },`, `marketStructure,`);

fs.writeFileSync(path, code);
