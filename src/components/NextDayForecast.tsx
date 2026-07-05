import React, { useState, useEffect, useCallback } from "react";
import { parseForecastText, generateForecast, saveForecast, getForecastHistory, evaluateForecasts } from "../services/forecastEngine";
import { BarChart, Brain, Calculator, Target, Info, Crosshair, CheckCircle2, History, AlertTriangle, Activity, TrendingUp, TrendingDown } from "lucide-react";
import ShamsiDateDisplay from "./ShamsiDateDisplay";
import LiveMarketSources from "./LiveMarketSources";
import { validateAndNormalizePrice } from "../utils/dataValidation";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export interface ForecastInput {
  meltedGold: number;
  usdIrt: number;
  usdtIrt: number;
  xauusd: number;
  gold18k: number;
  emamiCoin: number;
  todayChangePercent: number;
  todayHigh: number;
  todayLow: number;
  volume?: number;
  timestamp: string;
  notes?: string;
}

export interface ForecastResult {
  jalaliGeneratedAt?: string;
  generatedAt?: string;
  dataQuality?: string;
  confidence?: string;
  tomorrowForecast?: {
    low?: string;
    centralEstimate?: string;
    high?: string;
  };
  marketSummary?: string;
  alternateScenario?: string;
  supportLevels?: number[];
  resistanceLevels?: number[];
  invalidationLevel?: number;
  sourcesUsed?: string[];

  id: string;
  date: string; // ISO String
  input: ForecastInput;
  closePrice: number;
  rangeLow: number;
  rangeHigh: number;
  midPoint: number;
  bullishProb: number;
  neutralProb: number;
  bearishProb: number;
  primaryScenario: string;
  bullishScenario: string;
  bearishScenario: string;
  impacts: {
    usd: string;
    usdt: string;
    xauusd: string;
    coin: string;
    trend: string;
    news: string;
  };
  levels: {
    sup1: number;
    sup2: number;
    res1: number;
    res2: number;
    invalidation: number;
  };
  confidenceString: "Low" | "Medium" | "High";
  confidenceScore: number;
  actualData?: {
    high: number;
    low: number;
    close: number;
    direction: "bullish" | "bearish" | "neutral";
  };
}


const AutofillMeta = ({ fieldKey, autofillData }: { fieldKey: string, autofillData: any }) => {
  if (!autofillData || !autofillData[fieldKey]) return null;
  const meta = autofillData[fieldKey];
  const time = new Date(meta.sourceTimestamp).toLocaleTimeString("fa-IR", { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="text-[10px] text-emerald-400/80 mt-1.5 flex flex-col gap-1 p-1.5 bg-emerald-500/5 rounded border border-emerald-500/10">
      <div className="flex justify-between items-center">
        <span className="truncate font-medium text-emerald-300">منبع: {meta.source}</span>
        <span className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
          {meta.validationStatus === 'verified' ? 'تأیید شده' : meta.validationStatus}
        </span>
      </div>
      <div className="flex justify-between items-center text-emerald-500/70">
        <span>مقدار خام: {meta.displayValue}</span>
        <span>زمان: {time}</span>
      </div>
    </div>
  );
};

const NextDayForecast = function NextDayForecast({ aiConfig }: { aiConfig: any }) {
  const [activeTab, setActiveTab] = useState<"input" | "history">("input");
  const [rawText, setRawText] = useState("");
  const [inputData, setInputData] = useState<Partial<ForecastInput>>({
    timestamp: new Date().toISOString(),
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [marketSnapshotId, setMarketSnapshotId] = useState<string | null>(null);
  const [workflowState, setWorkflowState] = useState<"IDLE" | "FETCHING_SOURCES" | "VALIDATING" | "FIELDS_READY" | "ANALYZING" | "FORECAST_READY" | "SOURCE_FAILED" | "VALIDATION_FAILED" | "ANALYSIS_FAILED" | "MODEL_QUOTA_FAILED" | "NETWORK_FAILED">("IDLE");
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [autofillData, setAutofillData] = useState<any>(null);
  const [autofillError, setAutofillError] = useState<string | null>(null);
  const [currentForecast, setCurrentForecast] = useState<ForecastResult | null>(null);
  const [history, setHistory] = useState<ForecastResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [liveData, setLiveData] = useState<any>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const data = getForecastHistory();
    setHistory(data);
  };

  const handleDataUpdate = useCallback((data: any) => {
    setLiveData(data);
  }, []);

  const handleFillFromLive = async () => {
    if (isAutofilling) return;
    try {
      setWorkflowState("FETCHING_SOURCES");
      setIsAutofilling(true);
      setAutofillError(null);
      
      const response = await fetch("/api/forecast/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      setWorkflowState("VALIDATING");
      const data = await response.json();
      if (!data.success || !data.marketSnapshotId) {
        setWorkflowState("SOURCE_FAILED");
        throw new Error(data.error || "دریافت اطلاعات با خطا مواجه شد.");
      }
      
      setAutofillData(data.fields);
      setMarketSnapshotId(data.marketSnapshotId);
      
      // Update form values
      setInputData(prev => ({
        ...prev,
        meltedGold: data.fields.meltedGoldMazaneh?.value ? Number(data.fields.meltedGoldMazaneh.value) : prev.meltedGold,
        gold18k: data.fields.gold18k?.value ? Number(data.fields.gold18k.value) : prev.gold18k,
        xauusd: data.fields.xauusd?.value ? Number(data.fields.xauusd.value) : prev.xauusd,
        usdIrt: data.fields.usdIrt?.value ? Number(data.fields.usdIrt.value) : prev.usdIrt,
        usdtIrt: data.fields.usdtIrt?.value ? Number(data.fields.usdtIrt.value) : prev.usdtIrt,
        emamiCoin: data.fields.emamiCoin?.value ? Number(data.fields.emamiCoin.value) : prev.emamiCoin,
      }));
      
      if (data.missingFields && data.missingFields.length > 0) {
        setWorkflowState("VALIDATION_FAILED");
        setAutofillError("تحلیل اجرا نشد؛ یکی از داده‌های ضروری هنوز اعتبار کافی ندارد: " + data.missingFields.join(", "));
        return;
      }
      
      setWorkflowState("FIELDS_READY");
      // Automatically trigger analysis
      handleAnalyze(data.marketSnapshotId);
      
    } catch (err: any) {
      if (workflowState === "FETCHING_SOURCES") setWorkflowState("SOURCE_FAILED");
      setAutofillError(err.message || "دریافت خودکار داده کامل نشد. هیچ عدد حدسی وارد نشده است؛ وضعیت هر منبع را بررسی کنید.");
    } finally {
      setIsAutofilling(false);
    }
  };


  const handleParse = async () => {
    if (!rawText.trim()) return;
    try {
      setIsAnalyzing(true);
      setError(null);
      const parsed = await parseForecastText(rawText, aiConfig);
      setInputData(prev => ({ ...prev, ...parsed }));
    } catch (err: any) {
      setError(err.message || "خطا در پردازش متن.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = async (snapshotId?: string) => {
    const activeSnapshotId = snapshotId || marketSnapshotId || "manual";
    
    try {
      setIsAnalyzing(true);
      setError(null);
      setWorkflowState("ANALYZING");
      
      const res = await fetch("/api/forecast/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketSnapshotId: activeSnapshotId, customInputs: inputData })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 404 && data.error && data.error.includes("snapshot not found")) {
          setMarketSnapshotId(null);
          setWorkflowState("ANALYSIS_FAILED");
          throw new Error("داده‌های بازار منقضی شده‌اند. لطفاً دوباره 'تکمیل خودکار از منابع زنده' را اجرا کنید.");
        }
        if (res.status === 429) setWorkflowState("MODEL_QUOTA_FAILED");
        else setWorkflowState("ANALYSIS_FAILED");
        throw new Error(data.error || "خطا در ارتباط با سرور");
      }
      
      if (!data.success) {
        setWorkflowState("ANALYSIS_FAILED");
        throw new Error(data.error || "خطا در تحلیل داده‌ها");
      }
      
      setCurrentForecast(data);
      setWorkflowState("FORECAST_READY");
      
      // Auto scroll to results if on mobile/smaller screens or just in general
      setTimeout(() => {
        const resultsEl = document.getElementById("forecast-results");
        if (resultsEl) resultsEl.scrollIntoView({ behavior: "smooth" });
      }, 100);
      
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("سهمیه مدل هوش مصنوعی")) {
        setWorkflowState("MODEL_QUOTA_FAILED");
        setError("تحلیل اجرا نشد؛ سهمیه مدل هوش مصنوعی فعلاً در دسترس نیست. داده‌های بازار ذخیره شده‌اند و با تلاش بعدی دوباره تحلیل می‌شوند.");
      } else {
        if (workflowState !== "MODEL_QUOTA_FAILED") setWorkflowState("ANALYSIS_FAILED");
        setError(err.message || "ارتباط تحلیل برقرار نشد؛ داده‌های معتبر حفظ شده‌اند. دوباره تلاش کنید.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const stats = evaluateForecasts(history);

  const chartData = history.slice(-30).map((item) => {
    const d = new Date(item.date);
    const dateLabel = new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(d);
    
    return {
      dateLabel,
      predicted: item.midPoint,
      actual: item.actualData ? item.actualData.close : null,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl" dir="rtl">
          <p className="text-gray-300 mb-2 text-xs">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm" style={{ color: entry.color }}>
              <span className="font-bold">{entry.name}:</span>
              <span>{entry.value ? entry.value.toLocaleString() : "-"} تومان</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] text-white p-4 lg:p-6 overflow-y-auto custom-scrollbar" dir="rtl">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-amber-500" />
            پیش‌بینی مظنه فردا
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            برآورد احتمالاتی و تحلیل سناریو محور برای بازار فردای طلای آبشده (آموزشی)
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab("input")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "input" ? "bg-amber-500/20 text-amber-500 border border-amber-500/50" : "bg-gray-800/50 text-gray-400 hover:bg-gray-800"}`}
          >
            پیش‌بینی جدید
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === "history" ? "bg-amber-500/20 text-amber-500 border border-amber-500/50" : "bg-gray-800/50 text-gray-400 hover:bg-gray-800"}`}
          >
            <History className="w-4 h-4" />
            دقت پیش‌بینی‌ها
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg mb-6 flex flex-col">
          <span className="font-bold flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4" /> خطا:</span>
          <span>{error}</span>
        </div>
      )}

      {activeTab === "input" && (
        <>
          <LiveMarketSources onDataUpdate={handleDataUpdate} />
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-20">
            
            {/* Data Entry Panel */}
          <div className="xl:col-span-5 space-y-4">
            
            <div className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-5">
              <div className="flex justify-between items-center mb-4 relative">
                <h3 className="text-sm font-bold text-white">ورود داده‌های امشب (ضروری)</h3>
                
                {workflowState !== "IDLE" && (
                  <div className="text-[10px] text-gray-400 absolute left-0 -top-6 flex items-center gap-2">
                     وضعیت: 
                     {workflowState === "FETCHING_SOURCES" && <span className="text-blue-400">دریافت داده از منابع...</span>}
                     {workflowState === "VALIDATING" && <span className="text-purple-400">راستی‌آزمایی واحد و قیمت...</span>}
                     {workflowState === "FIELDS_READY" && <span className="text-emerald-400">تکمیل فیلدهای پیش‌بینی ✓</span>}
                     {workflowState === "ANALYZING" && <span className="text-amber-400 animate-pulse">داده‌های تأییدشده دریافت شد؛ تحلیل بازار در حال انجام است…</span>}
                     {workflowState === "FORECAST_READY" && <span className="text-emerald-400">تحلیل و پیش‌بینی آماده است ✓</span>}
                  </div>
                )}
                
                {autofillError && (
                  <div className="absolute top-full mt-2 left-0 w-64 p-2 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400 z-10 shadow-xl backdrop-blur-md">
                    {autofillError}
                  </div>
                )}
                <button 
                  onClick={handleFillFromLive} 
                  disabled={isAutofilling || isAnalyzing}
                  className="text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3 py-1 rounded-full transition-colors font-medium border border-emerald-500/30 disabled:opacity-50 relative flex items-center gap-2"
                >
                  {isAutofilling ? 'در حال دریافت...' : 'تکمیل خودکار از منابع زنده'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">مظنه فعلی آبشده (ریال) *</label>
                  <input type="number" className="w-full bg-black/40 border border-gray-700/50 rounded-lg p-2.5 text-sm text-white" 
                    value={inputData.meltedGold || ""} onChange={e => setInputData({...inputData, meltedGold: e.target.valueAsNumber})} />
                  <AutofillMeta fieldKey="meltedGoldMazaneh" autofillData={autofillData} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">اونس جهانی طلا (دلار) *</label>
                  <input type="number" className="w-full bg-black/40 border border-gray-700/50 rounded-lg p-2.5 text-sm text-white" 
                    value={inputData.xauusd || ""} onChange={e => setInputData({...inputData, xauusd: e.target.valueAsNumber})} />
                  <AutofillMeta fieldKey="xauusd" autofillData={autofillData} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">دلار آزاد (ریال) *</label>
                  <input type="number" className="w-full bg-black/40 border border-gray-700/50 rounded-lg p-2.5 text-sm text-white" 
                    value={inputData.usdIrt || ""} onChange={e => setInputData({...inputData, usdIrt: e.target.valueAsNumber})} />
                  <AutofillMeta fieldKey="usdIrt" autofillData={autofillData} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">تتر (USDT)</label>
                  <input type="number" className="w-full bg-black/40 border border-gray-700/50 rounded-lg p-2.5 text-sm text-white" 
                    value={inputData.usdtIrt || ""} onChange={e => setInputData({...inputData, usdtIrt: e.target.valueAsNumber})} />
                  <AutofillMeta fieldKey="usdtIrt" autofillData={autofillData} />
                </div>
              </div>
              
              <h3 className="text-sm font-bold text-white mb-4 mt-6">داده‌های تکمیلی بازار</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">طلای ۱۸ عیار</label>
                  <input type="number" className="w-full bg-black/40 border border-gray-700/50 rounded-lg p-2.5 text-sm text-white" 
                    value={inputData.gold18k || ""} onChange={e => setInputData({...inputData, gold18k: e.target.valueAsNumber})} />
                  <AutofillMeta fieldKey="gold18k" autofillData={autofillData} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">سکه امامی</label>
                  <input type="number" className="w-full bg-black/40 border border-gray-700/50 rounded-lg p-2.5 text-sm text-white" 
                    value={inputData.emamiCoin || ""} onChange={e => setInputData({...inputData, emamiCoin: e.target.valueAsNumber})} />
                  <AutofillMeta fieldKey="emamiCoin" autofillData={autofillData} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">سقف امروز</label>
                  <input type="number" className="w-full bg-black/40 border border-gray-700/50 rounded-lg p-2.5 text-sm text-white" 
                    value={inputData.todayHigh || ""} onChange={e => setInputData({...inputData, todayHigh: e.target.valueAsNumber})} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">کف امروز</label>
                  <input type="number" className="w-full bg-black/40 border border-gray-700/50 rounded-lg p-2.5 text-sm text-white" 
                    value={inputData.todayLow || ""} onChange={e => setInputData({...inputData, todayLow: e.target.valueAsNumber})} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">درصد تغییر امروز</label>
                  <input type="number" step="0.01" className="w-full bg-black/40 border border-gray-700/50 rounded-lg p-2.5 text-sm text-white" 
                    value={inputData.todayChangePercent || ""} onChange={e => setInputData({...inputData, todayChangePercent: e.target.valueAsNumber})} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">حجم معاملات (اختیاری)</label>
                  <input type="number" className="w-full bg-black/40 border border-gray-700/50 rounded-lg p-2.5 text-sm text-white" 
                    value={inputData.volume || ""} onChange={e => setInputData({...inputData, volume: e.target.valueAsNumber})} />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-1">یادداشت یا خبر مهم بازار</label>
                <input type="text" className="w-full bg-black/40 border border-gray-700/50 rounded-lg p-2.5 text-sm text-white" 
                  value={inputData.notes || ""} onChange={e => setInputData({...inputData, notes: e.target.value})} 
                  placeholder="مثال: تنش‌های منطقه‌ای افزایش یافت..." />
              </div>

              {/* Analyze button is hidden in auto-fill mode, but keeping for manual override if marketSnapshotId is present */}
                <button 
                  onClick={() => handleAnalyze()}
                  disabled={isAnalyzing || !marketSnapshotId}
                  className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-black py-3 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? "در حال پردازش هوش مصنوعی..." : "تحلیل و پیش‌بینی فردا"}
                  {!isAnalyzing && <Calculator className="w-4 h-4" />}
                </button>
            </div>
          </div>

{/* Results Panel */}
          <div id="forecast-results" className="xl:col-span-7 space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col items-start gap-3">
                <p className="text-sm text-red-400">{error}</p>
                {marketSnapshotId && (
                  <button onClick={() => handleAnalyze()} className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg transition-colors border border-red-500/30">
                    اجرای دوباره تحلیل
                  </button>
                )}
              </div>
            )}
            
            {currentForecast ? (
              <div className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Brain className="w-32 h-32 text-amber-500" />
                </div>
                
                {/* Header Section */}
                <div className="flex items-start justify-between mb-8 relative">
                  <div>
                    <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-l from-amber-400 to-amber-200">
                      تحلیل و پیش‌بینی فردا
                    </h2>
                    <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                       زمان ایجاد: {currentForecast.jalaliGeneratedAt || currentForecast.generatedAt || new Date().toISOString()}
                       <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                       کیفیت داده: {currentForecast.dataQuality === 'high' ? 'بالا' : currentForecast.dataQuality === 'medium' ? 'متوسط' : 'پایین'}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20 font-medium">
                      هوش مصنوعی (Deep Analysis)
                    </span>
                    {currentForecast.confidence && (
                      <span className="text-[10px] text-gray-400">
                        اطمینان: {currentForecast.confidence}
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary Data Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-black/40 border border-gray-800/60 rounded-xl p-4">
                    <span className="text-xs text-gray-500 block mb-1">کف پیش‌بینی شده</span>
                    <span className="text-lg font-bold text-red-400">{currentForecast.tomorrowForecast?.low || currentForecast.rangeLow?.toLocaleString()}</span>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                    <span className="text-xs text-amber-500/70 block mb-1">محدوده مرکزی (محور)</span>
                    <span className="text-2xl font-black text-amber-400">{currentForecast.tomorrowForecast?.centralEstimate || currentForecast.midPoint?.toLocaleString()}</span>
                  </div>
                  <div className="bg-black/40 border border-gray-800/60 rounded-xl p-4">
                    <span className="text-xs text-gray-500 block mb-1">سقف پیش‌بینی شده</span>
                    <span className="text-lg font-bold text-emerald-400">{currentForecast.tomorrowForecast?.high || currentForecast.rangeHigh?.toLocaleString()}</span>
                  </div>
                </div>

                {/* Main Content Sections */}
                <div className="space-y-6">
                  {currentForecast.marketSummary && (
                     <div>
                       <h4 className="text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
                         <Activity className="w-4 h-4 text-blue-400" />
                         خلاصه وضعیت فعلی بازار
                       </h4>
                       <p className="text-sm text-gray-400 leading-relaxed text-justify bg-black/20 p-4 rounded-lg border border-gray-800/40">
                         {currentForecast.marketSummary}
                       </p>
                     </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-5">
                      <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        سناریوی اصلی
                      </h4>
                      <p className="text-sm text-gray-400 leading-relaxed text-justify">
                        {currentForecast.primaryScenario || currentForecast.bullishScenario}
                      </p>
                    </div>
                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-5">
                      <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        سناریوی جایگزین
                      </h4>
                      <p className="text-sm text-gray-400 leading-relaxed text-justify">
                        {currentForecast.alternateScenario || currentForecast.bearishScenario}
                      </p>
                    </div>
                  </div>
                  
                  {/* Levels */}
                  <div className="bg-black/30 border border-gray-800/50 rounded-xl p-5">
                     <h4 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                        <Target className="w-4 h-4 text-purple-400" />
                        سطوح کلیدی فردا
                     </h4>
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div>
                           <span className="block text-[10px] text-gray-500 mb-1">حمایت ۱</span>
                           <span className="text-xs font-medium text-emerald-400">{currentForecast.supportLevels?.[0] || "-"}</span>
                        </div>
                        <div>
                           <span className="block text-[10px] text-gray-500 mb-1">حمایت ۲</span>
                           <span className="text-xs font-medium text-emerald-400/70">{currentForecast.supportLevels?.[1] || "-"}</span>
                        </div>
                        <div>
                           <span className="block text-[10px] text-gray-500 mb-1">مقاومت ۱</span>
                           <span className="text-xs font-medium text-red-400">{currentForecast.resistanceLevels?.[0] || "-"}</span>
                        </div>
                        <div>
                           <span className="block text-[10px] text-gray-500 mb-1">مقاومت ۲</span>
                           <span className="text-xs font-medium text-red-400/70">{currentForecast.resistanceLevels?.[1] || "-"}</span>
                        </div>
                     </div>
                     {currentForecast.invalidationLevel && (
                        <div className="mt-4 pt-4 border-t border-gray-800/50 text-center">
                           <span className="text-[10px] text-gray-500">حد ابطال سناریو (تغییر روند): </span>
                           <span className="text-xs font-bold text-amber-500">{currentForecast.invalidationLevel}</span>
                        </div>
                     )}
                  </div>
                  
                  {currentForecast.sourcesUsed && currentForecast.sourcesUsed.length > 0 && (
                     <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-800/50">
                        <span className="text-[10px] text-gray-500 py-1">منابع معتبر استفاده شده:</span>
                        {currentForecast.sourcesUsed.map((s: string, i: number) => (
                           <span key={i} className="text-[10px] bg-gray-800/60 text-gray-400 px-2 py-1 rounded">
                              {s}
                           </span>
                        ))}
                     </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-12 flex flex-col items-center justify-center text-center">
                <Brain className="w-12 h-12 text-gray-700 mb-4" />
                <h3 className="text-lg font-bold text-gray-500 mb-2">هنوز تحلیلی برای فردا انجام نشده است</h3>
                <p className="text-sm text-gray-600 max-w-sm">
                  پس از دریافت خودکار داده‌های بازار امشب، سیستم به صورت هوشمند بازار را برای فردا تحلیل خواهد کرد.
                </p>
              </div>
            )}
          </div>
        </div>
        </>
      )}

      {activeTab === "history" && (
        <div className="max-w-5xl mx-auto w-full pb-20">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 text-center">
              <div className="text-xs text-gray-400 mb-1">تعداد پیش‌بینی‌ها</div>
              <div className="text-3xl font-light text-white">{stats.total}</div>
            </div>
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 text-center">
              <div className="text-xs text-gray-400 mb-1">دقت جهت بازار</div>
              <div className="text-3xl font-light text-[#10b981]">{stats.directionAccuracy}%</div>
            </div>
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 text-center">
              <div className="text-xs text-gray-400 mb-1">دقت ۳۰ روز اخیر</div>
              <div className="text-3xl font-light text-amber-500">{stats.accuracy30d}%</div>
            </div>
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 text-center">
              <div className="text-xs text-gray-400 mb-1">میانگین خطای قیمت</div>
              <div className="text-3xl font-light text-white">{stats.avgPriceError.toLocaleString()} <span className="text-sm text-gray-500">ت</span></div>
            </div>
          </div>

          <div className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-6 mb-6">
            <h3 className="text-sm font-bold text-gray-300 mb-6 flex items-center gap-2">
              <BarChart className="w-4 h-4 text-amber-500" />
              مقایسه پیش‌بینی با قیمت واقعی (۳۰ روز اخیر)
            </h3>
            
            {chartData.length > 0 ? (
              <div className="h-72 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="dateLabel" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                    <YAxis 
                      stroke="#666" 
                      tick={{ fill: '#888', fontSize: 12 }} 
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => (value / 1000000).toFixed(1) + 'm'}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      name="پیش‌بینی (میانی)" 
                      stroke="#f59e0b" 
                      strokeWidth={2} 
                      dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }} 
                      activeDot={{ r: 6 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      name="واقعی" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }} 
                      connectNulls 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-gray-500 text-sm">
                داده کافی برای نمایش نمودار وجود ندارد.
              </div>
            )}
          </div>

          <div className="bg-gray-900/40 border border-gray-800/60 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-right">
              <thead className="bg-black/50 text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="p-4 font-medium">تاریخ</th>
                  <th className="p-4 font-medium">مظنه پایانی</th>
                  <th className="p-4 font-medium">پیش‌بینی میانی فردا</th>
                  <th className="p-4 font-medium">محدوده پیش‌بینی</th>
                  <th className="p-4 font-medium">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">هیچ سابقه پیش‌بینی ثبت نشده است.</td>
                  </tr>
                ) : (
                  history.slice().reverse().map((item, i) => (
                    <tr key={item.id || i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4"><ShamsiDateDisplay date={item.date} /></td>
                      <td className="p-4 text-gray-300">{item.closePrice.toLocaleString()}</td>
                      <td className="p-4 text-amber-500">{item.midPoint.toLocaleString()}</td>
                      <td className="p-4 text-gray-400 text-xs">{item.rangeLow.toLocaleString()} - {item.rangeHigh.toLocaleString()}</td>
                      <td className="p-4">
                        {item.actualData ? (
                           <div className="flex items-center gap-2 text-[#10b981]">
                             <CheckCircle2 className="w-4 h-4" />
                             بررسی شده
                           </div>
                        ) : (
                          <div className="text-gray-500">در انتظار بازار...</div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
}

export default React.memo(NextDayForecast);
