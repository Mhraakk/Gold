const fs = require('fs');

const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace marketStructure fallback
const oldMarketStructure = `marketStructure={
                        marketStructure || {
                          trend: "NEUTRAL",
                          orderBlocks: [],
                          fvgs: [],
                          waves: [],
                          liquidityZones: [],
                          supportLines: [],
                          resistanceLines: [],
                        }
                      }`;
const newMarketStructure = `marketStructure={marketStructure}`; // Let ChartTerminal handle the default or just pass it null. Wait, ChartTerminal expects MarketStructure.

code = code.replace(oldMarketStructure, newMarketStructure);

fs.writeFileSync(path, code);
