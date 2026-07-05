const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                          ) : meta.id === "GOLD_18K" ? (
                            <div className="w-full text-left direction-ltr">
                              <div className="text-2xl font-bold text-white data-value tracking-wider mb-1">
                                {prices[meta.id].toLocaleString()} ریال
                              </div>
                              <div className="text-xs text-gray-400 font-sans mt-1 text-right w-full">
                                معادل {(prices[meta.id] / 10).toLocaleString()} تومان / گرم
                              </div>
                            </div>
                          ) : (
                            <div className="text-2xl font-bold text-white data-value tracking-wider direction-ltr text-left w-full">
                              {meta.prefix}
                              {prices[meta.id].toLocaleString(undefined, {
                                maximumFractionDigits: meta.decimals,
                              })}
                            </div>
                          )}`;

const replacementStr = `                          ) : meta.id === "GOLD_18K" ? (
                            <div className="w-full text-left direction-ltr">
                              <div className="text-2xl font-bold text-white data-value tracking-wider mb-1">
                                {prices[meta.id].toLocaleString()} ریال
                              </div>
                              <div className="text-xs text-gray-400 font-sans mt-1 text-right w-full">
                                معادل {(prices[meta.id] / 10).toLocaleString()} تومان / گرم
                              </div>
                            </div>
                          ) : meta.id === "USDIRT" || meta.id === "USDTIRT" ? (
                            <div className="w-full text-left direction-ltr">
                              <div className="text-2xl font-bold text-white data-value tracking-wider mb-1">
                                {prices[meta.id].toLocaleString()} ریال
                              </div>
                              <div className="text-xs text-gray-400 font-sans mt-1 text-right w-full">
                                معادل {(prices[meta.id] / 10).toLocaleString()} تومان
                              </div>
                            </div>
                          ) : meta.id.includes("COIN") ? (
                            <div className="w-full text-left direction-ltr">
                              <div className="text-2xl font-bold text-white data-value tracking-wider mb-1">
                                {(prices[meta.id] / 10).toLocaleString()} تومان
                              </div>
                              <div className="text-xs text-gray-400 font-sans mt-1 text-right w-full">
                                {prices[meta.id].toLocaleString()} ریال
                              </div>
                            </div>
                          ) : meta.id === "XAUUSD" ? (
                            <div className="w-full text-left direction-ltr">
                              <div className="text-2xl font-bold text-white data-value tracking-wider mb-1">
                                $ {prices[meta.id].toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </div>
                              <div className="text-xs text-gray-400 font-sans mt-1 text-right w-full">
                                دلار به ازای هر اونس تروا
                              </div>
                            </div>
                          ) : (
                            <div className="text-2xl font-bold text-white data-value tracking-wider direction-ltr text-left w-full">
                              {meta.prefix}
                              {prices[meta.id].toLocaleString(undefined, {
                                maximumFractionDigits: meta.decimals,
                              })}
                            </div>
                          )}`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/App.tsx', code);
