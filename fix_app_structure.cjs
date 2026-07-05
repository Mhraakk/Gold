const fs = require('fs');

const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

const stableStructure = `const DEFAULT_MARKET_STRUCTURE: MarketStructure = {
  trend: "NEUTRAL",
  orderBlocks: [],
  fvgs: [],
  waves: [],
  liquidityZones: [],
  supportLines: [],
  resistanceLines: [],
};
`;

code = code.replace(`export default function App() {`, stableStructure + `\nexport default function App() {`);

code = code.replace(`marketStructure={marketStructure}`, `marketStructure={marketStructure || DEFAULT_MARKET_STRUCTURE}`);

fs.writeFileSync(path, code);
