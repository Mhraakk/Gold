import React, { useState, useEffect } from "react";
import { Info, TrendingUp, TrendingDown, Activity, AlertCircle, RefreshCw, Save, Clock, ChevronRight, BarChart2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart, ComposedChart } from "recharts";

export default function MeltedGoldForecast() {
  const [activeSubTab, setActiveSubTab] = useState<"auto" | "custom">("auto");
  const [horizon, setHorizon] = useState<number>(7);
  const [customHorizon, setCustomHorizon] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoData, setAutoData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [forecastResult, setForecastResult] = useState<any>(null);

  // Custom scenario state
  const [customInputs, setCustomInputs] = useState({
    currentMazaneh: "",
    usdRate: "",
    ounceRate: "",
    usdChangePercent: "",
    ounceChangePercent: "",
    marketState: "normal" as "calm" | "normal" | "volatile" | "shock",
    userNote: ""
  });

  useEffect(() => {
    fetchAutoData();
  }, []);

  const fetchAutoData = async () => {
    try {
      setError(null);
      const res = await fetch("/api/forecast/autofill", { method: "POST" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "خطا در دریافت اطلاعات مبنا");
      setAutoData(data);
      if (data.fields) {
        setCustomInputs(prev => ({
          ...prev,
          currentMazaneh: data.fields.meltedGoldMazaneh?.value || "",
          usdRate: data.fields.usdIrt?.value || "",
          ounceRate: data.fields.xauusd?.value || ""
        }));
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleRunForecast = async (type: "auto" | "custom") => {
    setIsLoading(true);
    setError(null);
    try {
      const finalHorizon = horizon === -1 ? parseInt(customHorizon || "7") : horizon;
      if (isNaN(finalHorizon) || finalHorizon < 1 || finalHorizon > 90) {
        throw new Error("بازه پیش‌بینی باید بین ۱ تا ۹۰ روز باشد.");
      }

      const endpoint = type === "auto" ? "/api/forecast/mazaneh/run" : "/api/forecast/mazaneh/custom";
      const body = type === "auto" ? { horizon: finalHorizon, autoData } : { horizon: finalHorizon, customInputs };
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "خطا در اجرای پیش‌بینی");
      
      setForecastResult(data.result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderDataQuality = (status: string) => {
    switch (status) {
      case "verified": return <span className="text-green-400 bg-green-400/10 px-2 py-0.5 rounded text-xs">معتبر</span>;
      case "suspicious": return <span className="text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded text-xs">مشکوک</span>;
      case "stale": return <span className="text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded text-xs">قدیمی</span>;
      default: return <span className="text-red-400 bg-red-400/10 px-2 py-0.5 rounded text-xs">ناکافی</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--bg-panel)] p-6 rounded-2xl border border-[var(--border-light)]">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <BarChart2 className="w-7 h-7 text-[#D4AF37]" />
            پیش‌بینی مظنه آبشده
          </h2>
          <p className="text-[var(--text-secondary)] mt-2">
            برآورد هوشمند روند قیمت مظنه آبشده نقدی با استفاده از مدل‌های سری زمانی و فاکتورهای کلان
          </p>
        </div>
        <div className="flex bg-[var(--bg-card)] rounded-lg p-1 border border-[var(--border-light)]">
          <button
            onClick={() => setActiveSubTab("auto")}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${
              activeSubTab === "auto" ? "bg-[#D4AF37] text-black shadow-sm" : "text-gray-400 hover:text-white"
            }`}
          >
            پیش‌بینی خودکار
          </button>
          <button
            onClick={() => setActiveSubTab("custom")}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${
              activeSubTab === "custom" ? "bg-indigo-500 text-white shadow-sm" : "text-gray-400 hover:text-white"
            }`}
          >
            سناریوی سفارشی
          </button>
        </div>
      </div>

      <div className="bg-[var(--bg-panel)] rounded-2xl border border-[var(--border-light)] overflow-hidden">
        {activeSubTab === "auto" ? (
          <div className="p-6 space-y-8">
            {/* Auto Data Info */}
            <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-light)]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  آخرین داده‌های مبنا
                </h3>
                <button onClick={fetchAutoData} className="text-gray-400 hover:text-white transition-colors" title="به‌روزرسانی">
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
              
              {autoData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">مظنه فعلی (آبشده نقدی)</div>
                    <div className="text-lg font-bold text-white flex items-center gap-2">
                      {autoData.fields?.meltedGoldMazaneh ? parseFloat(autoData.fields.meltedGoldMazaneh.value).toLocaleString() : "---"} تومان
                      {autoData.fields?.meltedGoldMazaneh && renderDataQuality(autoData.fields.meltedGoldMazaneh.validationStatus)}
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">دلار بازار آزاد</div>
                    <div className="text-lg font-bold text-white flex items-center gap-2">
                      {autoData.fields?.usdIrt ? parseFloat(autoData.fields.usdIrt.value).toLocaleString() : "---"} تومان
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">اونس جهانی</div>
                    <div className="text-lg font-bold text-white flex items-center gap-2">
                      {autoData.fields?.xauusd ? parseFloat(autoData.fields.xauusd.value).toLocaleString() : "---"} USD
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">آخرین به‌روزرسانی</div>
                    <div className="text-sm font-medium text-gray-300 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {autoData.jalaliGeneratedAt || "---"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">در حال دریافت داده‌های بازار...</div>
              )}
            </div>

            {/* Horizon Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">بازه پیش‌بینی را انتخاب کنید</label>
              <div className="flex flex-wrap gap-3">
                {[7, 10, 14, 30].map(days => (
                  <button
                    key={days}
                    onClick={() => setHorizon(days)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                      horizon === days
                        ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {days} روزه
                  </button>
                ))}
                <button
                  onClick={() => setHorizon(-1)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border flex items-center gap-2 ${
                    horizon === -1
                      ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  بازه دلخواه
                  {horizon === -1 && (
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={customHorizon}
                      onChange={e => setCustomHorizon(e.target.value)}
                      placeholder="روز..."
                      className="w-16 bg-black/30 border border-white/20 rounded px-2 py-1 text-white text-center"
                      onClick={e => e.stopPropagation()}
                    />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              onClick={() => handleRunForecast("auto")}
              disabled={isLoading || !autoData?.fields?.meltedGoldMazaneh}
              className="w-full bg-[#D4AF37] hover:bg-[#C5A028] disabled:opacity-50 disabled:cursor-not-allowed text-black py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/20"
            >
              {isLoading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <BarChart2 className="w-6 h-6" />}
              {isLoading ? "در حال پردازش مدل..." : "اجرای پیش‌بینی مظنه"}
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <p className="text-sm text-indigo-300">
                در این بخش می‌توانید مقادیر فعلی بازار را تغییر دهید یا فرضیات خود را (مانند درصد رشد دلار در روزهای آینده) وارد کنید تا خروجی مدل بر اساس سناریوی شما محاسبه شود.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-bold text-white border-b border-white/10 pb-2">مقادیر پایه</h4>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">مظنه فعلی (تومان)</label>
                  <input type="number" value={customInputs.currentMazaneh} onChange={e => setCustomInputs({...customInputs, currentMazaneh: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" />
                  <div className="text-[10px] text-gray-500 mt-1">آخرین مقدار: {autoData?.fields?.meltedGoldMazaneh?.value || "---"}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">دلار بازار آزاد (تومان)</label>
                    <input type="number" value={customInputs.usdRate} onChange={e => setCustomInputs({...customInputs, usdRate: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">اونس جهانی (دلار)</label>
                    <input type="number" value={customInputs.ounceRate} onChange={e => setCustomInputs({...customInputs, ounceRate: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">بازه پیش‌بینی (روز)</label>
                  <input type="number" min="1" max="90" value={horizon === -1 ? customHorizon : horizon} onChange={e => { setHorizon(-1); setCustomHorizon(e.target.value); }} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-white border-b border-white/10 pb-2">فرضیات سناریو</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">تغییر احتمالی دلار (%)</label>
                    <input type="number" placeholder="مثال: 5 یا -2" value={customInputs.usdChangePercent} onChange={e => setCustomInputs({...customInputs, usdChangePercent: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">تغییر احتمالی اونس (%)</label>
                    <input type="number" placeholder="مثال: 1" value={customInputs.ounceChangePercent} onChange={e => setCustomInputs({...customInputs, ounceChangePercent: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">وضعیت کلی بازار</label>
                  <select value={customInputs.marketState} onChange={e => setCustomInputs({...customInputs, marketState: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none appearance-none">
                    <option value="calm">آرام و باثبات (نوسان کم)</option>
                    <option value="normal">عادی</option>
                    <option value="volatile">نوسانی (اخبار سیاسی/اقتصادی)</option>
                    <option value="shock">شوک ناگهانی</option>
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              onClick={() => handleRunForecast("custom")}
              disabled={isLoading || !customInputs.currentMazaneh}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              {isLoading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
              {isLoading ? "در حال محاسبه..." : "اجرای سناریوی سفارشی"}
            </button>
          </div>
        )}

        {/* Forecast Result Panel */}
        {forecastResult && (
          <div className="border-t border-[var(--border-light)] bg-black/20 p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-[#D4AF37] rounded-full"></div>
              <h3 className="text-xl font-bold text-white">نتایج پیش‌بینی</h3>
              <span className="text-sm text-gray-400 mr-auto">مدل منتخب: {forecastResult.modelUsed}</span>
            </div>

            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
              <div>
                <div className="text-gray-400 mb-1">بازه انتخابی</div>
                <div className="text-white font-bold">{forecastResult.horizon} روزه</div>
              </div>
              <div>
                <div className="text-gray-400 mb-1">تاریخ نهایی پیش‌بینی</div>
                <div className="text-white font-bold">{forecastResult.targetDate}</div>
              </div>
              <div>
                <div className="text-gray-400 mb-1">کیفیت داده</div>
                <div className="text-white font-bold">{forecastResult.dataQuality}</div>
              </div>
              <div>
                <div className="text-gray-400 mb-1">تاریخ و ساعت مبنا</div>
                <div className="text-white font-bold">{forecastResult.baseDate}</div>
              </div>
              <div className="col-span-2 md:col-span-4 border-t border-white/10 pt-3 mt-1">
                <div className="text-gray-400 mb-1">عوامل اثرگذار اصلی</div>
                <div className="text-white">{forecastResult.keyFactors}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 blur-3xl rounded-full"></div>
                <div className="text-sm text-gray-400 mb-2">پیش‌بینی مرکزی (محتمل‌ترین)</div>
                <div className="text-3xl font-black text-white tracking-tight">
                  {forecastResult.centralForecast.toLocaleString()} <span className="text-lg font-normal text-gray-400">تومان</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-gray-400">تغییر نسبت به مبنا:</span>
                  <span className={`font-bold ${forecastResult.changeValue > 0 ? "text-emerald-400" : forecastResult.changeValue < 0 ? "text-red-400" : "text-gray-400"}`}>
                    {forecastResult.changeValue > 0 ? "+" : ""}{forecastResult.changeValue.toLocaleString()} ({forecastResult.changePercent}%)
                  </span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-center space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">بازه ۸۰٪ (محتمل)</span>
                    <span className="text-gray-300">
                      {forecastResult.band80.low.toLocaleString()} تا {forecastResult.band80.high.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-black/50 rounded-full h-1.5">
                    <div className="bg-blue-400 h-1.5 rounded-full mx-auto" style={{ width: "60%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">بازه ۹۵٪ (حداکثر نوسان)</span>
                    <span className="text-gray-300">
                      {forecastResult.band95.low.toLocaleString()} تا {forecastResult.band95.high.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-black/50 rounded-full h-1.5">
                    <div className="bg-indigo-400 h-1.5 rounded-full mx-auto" style={{ width: "80%" }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-400 mb-1">جهت روند</div>
                  <div className="text-lg font-bold flex items-center gap-1">
                    {forecastResult.trend === "bullish" ? <span className="text-emerald-400 flex items-center"><TrendingUp className="w-5 h-5 mr-1" /> صعودی</span> :
                     forecastResult.trend === "bearish" ? <span className="text-red-400 flex items-center"><TrendingDown className="w-5 h-5 mr-1" /> نزولی</span> :
                     <span className="text-gray-400 flex items-center"><ChevronRight className="w-5 h-5 mr-1" /> خنثی</span>}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">درصد اطمینان (Confidence)</div>
                  <div className="text-lg font-bold text-white">{forecastResult.confidenceScore}%</div>
                </div>
                <div className="col-span-2 pt-2 border-t border-white/10">
                  <div className="text-xs text-gray-400 mb-1">خطای تاریخی مدل (MAE)</div>
                  <div className="text-sm font-bold text-gray-300">{forecastResult.historicalError || "در حال کالیبراسیون"}</div>
                </div>
              </div>
            </div>

            {/* Chart Area */}
            {forecastResult.chartData && forecastResult.chartData.length > 0 && (
              <div className="bg-black/30 border border-white/10 rounded-2xl p-6 mt-6">
                <h4 className="text-sm font-bold text-gray-300 mb-6">مسیر پیش‌بینی</h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={forecastResult.chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                      <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.2)" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} tickFormatter={(val) => (val/1000000).toFixed(1) + 'm'} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: any, name: string) => [value.toLocaleString(), name === 'price' ? 'قیمت' : name]}
                      />
                      <Area type="monotone" dataKey="band95" stroke="none" fill="#4f46e5" fillOpacity={0.1} />
                      <Area type="monotone" dataKey="band80" stroke="none" fill="#3b82f6" fillOpacity={0.15} />
                      <Line type="monotone" dataKey="price" stroke="#D4AF37" strokeWidth={2} dot={false} />
                      {forecastResult.chartData.findIndex((d:any) => d.isForecast) > 0 && (
                        <ReferenceLine x={forecastResult.chartData.find((d:any) => d.isForecast)?.date} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-500/80 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>این خروجی یک برآورد آماری بر پایه‌ مدل‌های سری زمانی و داده‌های موجود است و صرفاً جهت تحلیل ارائه شده است. هیچ تضمینی بر تحقق قیمت‌های اعلام شده وجود ندارد و این سامانه هیچ‌گونه توصیه‌ای به خرید یا فروش طلا ندارد.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
