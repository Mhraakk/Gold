const fs = require('fs');

const path = 'src/components/ChartTerminal.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'marketStructure,', 
  'marketStructure = { trend: "NEUTRAL", orderBlocks: [], fvgs: [], waves: [], liquidityZones: [], supportLines: [], resistanceLines: [] },'
);

fs.writeFileSync(path, code);
