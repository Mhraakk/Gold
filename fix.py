with open("src/App.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if i == 1380: # start replacing from line 1381 (index 1380)
        skip = True
        new_lines.append("""                  {/* Left Column: Metric scores & Setup Targets */}
                  <div className="space-y-4 col-span-1">
                    
                    {/* Score dials */}
                    <div className="glass-panel rounded-xl p-4 space-y-4 text-center">
                      <span className="text-[10px] font-sans text-gray-500 tracking-wider">معیارهای ارزیابی کوانت</span>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border border-gray-900 rounded-lg p-3 bg-gray-950/40">
                          <p className="text-2xl font-mono font-extrabold text-amber-400">{aiAnalysis.confidenceScore}%</p>
                          <p className="text-[10px] text-gray-500 font-sans mt-1">ضریب اطمینان مدل</p>
                        </div>
                        <div className="border border-gray-900 rounded-lg p-3 bg-gray-950/40">
                          <p className="text-2xl font-mono font-extrabold text-emerald-400">{aiAnalysis.probabilityScore}%</p>
                          <p className="text-[10px] text-gray-500 font-sans mt-1">شاخص احتمال پیروزی</p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="text-[10px] text-gray-500 font-sans block">فاز چرخه بازار شناسایی‌شده</span>
                        <span className="text-xs font-sans font-semibold text-white mt-1 bg-gray-900 px-3 py-1.5 rounded-full inline-block border border-gray-800">
                          {aiAnalysis.marketPhase}
                        </span>
                      </div>
                    </div>

                    {/* Trade Setup Targets */}
                    <div className="glass-panel rounded-xl p-4 space-y-3.5 text-right">
                      <span className="text-[10px] font-sans text-amber-500 tracking-wider uppercase block">تنظیمات پیشنهادی معامله سازمانی</span>
                      
                      <div className="space-y-2">
                        <div className="flex flex-row justify-between text-xs font-sans">
                          <span className="text-gray-400">قیمت ورود پیشنهادی:</span>
                          <span className="font-mono font-bold text-white">{aiAnalysis.tradeSetup.entry.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-row justify-between text-xs font-sans">
                          <span className="text-rose-400 font-semibold">حد ضرر (SL):</span>
                          <span className="font-mono font-bold text-rose-400">{aiAnalysis.tradeSetup.stopLoss.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-row justify-between text-xs font-sans">
                          <span className="text-emerald-400 font-semibold">حد سود اول (TP1):</span>
                          <span className="font-mono font-bold text-emerald-400">{aiAnalysis.tradeSetup.takeProfit1.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-row justify-between text-xs font-sans">
                          <span className="text-emerald-400 font-semibold">حد سود دوم (TP2):</span>
                          <span className="font-mono font-bold text-emerald-400">{aiAnalysis.tradeSetup.takeProfit2.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-gray-900 pt-2.5 flex flex-row justify-between text-xs font-sans">
                          <span className="text-gray-400">نسبت ریسک به ریوارد:</span>
                          <span className="font-mono font-bold text-amber-400">{aiAnalysis.tradeSetup.riskRewardRatio} : ۱</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setPositionInput({
                            type: "buy",
                            entryPrice: aiAnalysis.tradeSetup.entry,
                            stopLoss: aiAnalysis.tradeSetup.stopLoss,
                            takeProfit: aiAnalysis.tradeSetup.takeProfit1,
                            quantity: activeAssetId === "MELTED_GOLD" ? 5 : 10,
                          });
                          setActiveTab("portfolio");
                        }}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded-lg transition mt-2 font-sans"
                      >
                        پیاده‌سازی معامله پیشنهادی در سبد آزمایشی
                      </button>
                    </div>

                    {/* Scenario forecasts */}
                    <div className="glass-panel rounded-xl p-4 space-y-3 text-right">
                      <span className="text-[10px] font-sans text-gray-500 tracking-wider uppercase block font-semibold">شبیه‌ساز سناریوهای بازار</span>
                      
                      <div className="space-y-2.5 text-xs font-sans">
                        <div className="space-y-1">
                          <p className="text-emerald-400 font-semibold text-right">مسیر حرکتی اصلی (Primary Pathway):</p>
                          <p className="text-gray-300 bg-gray-950/30 p-2 rounded border border-gray-900 text-[11px] leading-relaxed text-right">{aiAnalysis.scenarios.primary}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-amber-400 font-semibold text-right">مسیر حرکتی جایگزین (Alternative Pathway):</p>
                          <p className="text-gray-300 bg-gray-950/30 p-2 rounded border border-gray-900 text-[11px] leading-relaxed text-right">{aiAnalysis.scenarios.alternative}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-rose-400 font-semibold text-right">شرایط ابطال سناریو (Invalidation Threshold):</p>
                          <p className="text-gray-300 bg-gray-950/30 p-2 rounded border border-gray-900 text-[11px] leading-relaxed text-right">{aiAnalysis.scenarios.invalidation}</p>
                        </div>
                      </div>
                    </div>

                    {/* Risk Engine */}
                    {aiAnalysis.risks && (
                      <div className="glass-panel rounded-xl p-4 space-y-4 text-right col-span-1 md:col-span-2">
                        <span className="text-[10px] font-sans text-gray-500 tracking-wider uppercase block font-semibold">موتور ارزیابی ریسک سیستمی (Risk Engine)</span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: "ریسک سیاسی-ژئوپلیتیک", val: aiAnalysis.risks.political },
                            { label: "فشار تورم داخلی", val: aiAnalysis.risks.inflation },
                            { label: "نوسانات دلار (USD/IRR)", val: aiAnalysis.risks.volatility },
                            { label: "تاثیر اونس جهانی", val: aiAnalysis.risks.globalImpact }
                          ].map((r, idx) => (
                            <div key={idx} className="space-y-2">
                              <div className="flex justify-between text-[10px] font-sans">
                                <span className="text-gray-400">{r.label}</span>
                                <span className={r.val > 70 ? "text-rose-400" : r.val > 40 ? "text-amber-400" : "text-emerald-400"}>{r.val}%</span>
                              </div>
                              <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full ${r.val > 70 ? "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : r.val > 40 ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"}`} 
                                  style={{ width: f"{r.val}%" }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
""")
    elif i == 1481: # stop skipping at line 1482
        skip = False
    
    if not skip:
        new_lines.append(line)

with open("src/App.tsx", "w") as f:
    f.writelines(new_lines)
