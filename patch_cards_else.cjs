const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                            <div className="w-full text-right">
                              <div className="text-xl font-bold text-white data-value tracking-wider mb-1 direction-ltr text-left">
                                {prices[meta.id] ? prices[meta.id].toLocaleString() : "---"}
                              </div>
                              <div className="text-xs text-gray-500 font-sans mt-1">
                                {meta.unit}
                              </div>
                            </div>
                          )}`;

const replacement = `                            <div className="w-full text-right">
                              <div className="text-xl font-bold text-white data-value tracking-wider mb-1 direction-ltr text-left">
                                {prices[meta.id] ? (meta.id === 'XAUUSD' || meta.id === 'GOLD_ETF' || meta.id === 'GOLD_FUTURES' || meta.id === 'GOLD_CFD' ? prices[meta.id].toLocaleString() : (prices[meta.id] / 10).toLocaleString()) : "---"}
                              </div>
                              <div className="text-xs text-gray-500 font-sans mt-1">
                                {meta.unit}
                              </div>
                            </div>
                          )}`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
