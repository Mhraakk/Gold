const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                            <div className="text-[10px] text-gray-500 font-mono mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {sourceTimestamps[meta.id] ? (
                                <span className={Math.floor((currentTimeMs - sourceTimestamps[meta.id]) / 1000) < 60 ? "text-emerald-400" : "text-amber-400"}>
                                  {Math.floor((currentTimeMs - sourceTimestamps[meta.id]) / 1000)} ثانیه پیش
                                </span>
                              ) : "بدون دیتا"}
                            </div>`;

const replacement = `                            <div className="text-[10px] text-gray-500 font-mono mt-1 flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {sourceTimestamps[meta.id] ? (
                                  <span className={Math.floor((currentTimeMs - sourceTimestamps[meta.id]) / 1000) < 60 ? "text-emerald-400" : "text-amber-400"}>
                                    {Math.floor((currentTimeMs - sourceTimestamps[meta.id]) / 1000)} ثانیه پیش
                                  </span>
                                ) : "بدون دیتا"}
                              </div>
                              <div className="text-[9px] text-gray-600 font-sans">
                                منبع: {meta.id === 'MELTED_GOLD' || meta.id === 'GOLD_18K' ? 'Telegram @abshdh' : 'TGJU'}
                              </div>
                            </div>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
