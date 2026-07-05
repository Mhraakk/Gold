const fs = require('fs');

const path = 'src/components/ChartTerminal.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `marketStructure: MarketStructure;`,
  `marketStructure?: MarketStructure | null;`
);

fs.writeFileSync(path, code);
