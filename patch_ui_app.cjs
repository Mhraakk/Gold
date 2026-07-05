const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `{meta.id === "MELTED_GOLD" ? (
                            <div className="w-full text-left direction-ltr">
                              <div className="text-2xl font-bold text-white data-value tracking-wider mb-1">
                                مظنه {(prices[meta.id] / 1000000).toFixed(2)} میلیون ریال
                              </div>
                              <div className="text-xs text-gray-400 font-sans mt-1 text-right w-full">
                                معادل {(prices[meta.id] / 10).toLocaleString()} تومان
                              </div>
                            </div>
                          ) : meta.id === "GOLD_18K" ? (
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

const replacementStr = `{meta.id === "MELTED_GOLD" ? (
                            <div className="w-full text-right">
                              <div className="text-xl font-bold text-white data-value tracking-wider mb-1 direction-ltr text-left">
                                مظنه آبشده: {(prices[meta.id] / 1000000).toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-400 font-sans mt-1">
                                قیمت منبع: {prices[meta.id].toLocaleString()} ریال
                              </div>
                              <div className="text-xs text-[var(--accent-gold)] font-sans mt-1 font-semibold">
                                معادل: {(prices[meta.id] / 10).toLocaleString()} تومان
                              </div>
                            </div>
                          ) : meta.id === "GOLD_18K" ? (
                            <div className="w-full text-right">
                              <div className="text-xl font-bold text-white data-value tracking-wider mb-1 direction-ltr text-left">
                                {(prices[meta.id] / 10).toLocaleString()} تومان
                              </div>
                              <div className="text-xs text-gray-400 font-sans mt-1">
                                معادل {prices[meta.id].toLocaleString()} ریال
                              </div>
                              <div className="text-xs text-gray-500 font-sans mt-1">
                                هر گرم طلای ۱۸ عیار
                              </div>
                            </div>
                          ) : meta.id === "USDIRT" || meta.id === "USDTIRT" ? (
                            <div className="w-full text-right">
                              <div className="text-xl font-bold text-white data-value tracking-wider mb-1 direction-ltr text-left">
                                {(prices[meta.id] / 10).toLocaleString()} تومان
                              </div>
                              <div className="text-xs text-gray-400 font-sans mt-1">
                                معادل {prices[meta.id].toLocaleString()} ریال
                              </div>
                            </div>
                          ) : meta.id.includes("COIN") ? (
                            <div className="w-full text-right">
                              <div className="text-xl font-bold text-white data-value tracking-wider mb-1 direction-ltr text-left">
                                {(prices[meta.id] / 10).toLocaleString()} تومان
                              </div>
                              <div className="text-xs text-gray-400 font-sans mt-1">
                                معادل {prices[meta.id].toLocaleString()} ریال
                              </div>
                            </div>
                          ) : meta.id === "XAUUSD" ? (
                            <div className="w-full text-right">
                              <div className="text-xl font-bold text-white data-value tracking-wider mb-1 direction-ltr text-left">
                                $ {prices[meta.id].toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </div>
                              <div className="text-xs text-gray-400 font-sans mt-1">
                                دلار / اونس تروا
                              </div>
                            </div>
                          ) : (
                            <div className="text-xl font-bold text-white data-value tracking-wider direction-ltr text-left w-full">
                              {meta.prefix}
                              {prices[meta.id].toLocaleString(undefined, {
                                maximumFractionDigits: meta.decimals,
                              })}
                            </div>
                          )}`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/App.tsx', code);
