const fs = require('fs');

const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldTimeAgo2 = `{sourceTimestamps[meta.id] ? (
                                  <div className="flex flex-col gap-1">
                                    <span className={Math.floor((currentTimeMs - sourceTimestamps[meta.id]) / 1000) < 60 ? "text-emerald-400/80" : "text-amber-400/80"}>
                                      {Math.floor((currentTimeMs - sourceTimestamps[meta.id]) / 1000)} ثانیه پیش
                                    </span>
                                    {Math.floor((currentTimeMs - sourceTimestamps[meta.id]) / 1000) > 300 && (
                                      <span className="text-[9px] text-amber-500/90 font-sans leading-tight">
                                        «داده تازه از منبع دریافت نشد؛ آخرین داده معتبر با زمان ثبت مشخص نمایش داده میشود.»
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-600">بروزرسانی خودکار</span>
                                )}`;

const newTimeAgo2 = `<TimeAgoStyled timestamp={sourceTimestamps[meta.id]} />`;

code = code.replace(oldTimeAgo2, newTimeAgo2);

fs.writeFileSync(path, code);
