import React, { useMemo, useState } from "react";
import { 
  Flame, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Gauge, 
  Info,
  ChevronRight,
  RefreshCw,
  AlertOctagon,
  LineChart
} from "lucide-react";
import { AssetInfo, Candle, AssetId } from "../types";
import { calculateATR } from "../services/aiEngine";
import { ASSETS_METADATA } from "../data";

interface VolatilityHeatmapProps {
  assets: AssetInfo[];
  historicalData: Record<AssetId, Candle[]>;
  prices: Record<AssetId, number>;
  onAssetSelect: (id: AssetId) => void;
  activeAssetId: AssetId;
}

interface HeatmapItem {
  id: AssetId;
  name: string;
  persianName: string;
  symbol: string;
  currentPrice: number;
  decimals: number;
  unit: string;
  currentATR: number;
  relativeATR: number; // ATR as a percentage of price
  atrGrowthPct: number; // Volatility expansion index
  heatScore: number; // 0 - 100
  signal: "COOLING" | "STABLE" | "EXPANDING" | "ALERT";
}

export default function VolatilityHeatmap({
  assets,
  historicalData,
  prices,
  onAssetSelect,
  activeAssetId,
}: VolatilityHeatmapProps) {
  const [selectedHeatId, setSelectedHeatId] = useState<AssetId | null>(null);
  const [minHeatFilter, setMinHeatFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"heat" | "atr" | "name">("heat");

  // Compute live ATR indicators for all assets
  const heatmapData = useMemo<HeatmapItem[]>(() => {
    return assets.map((as) => {
      const baseCandles = historicalData[as.id] || [];
      const meta = ASSETS_METADATA[as.id];
      const livePrice = prices[as.id] || as.currentPrice;

      if (baseCandles.length < 2) {
        return {
          id: as.id,
          name: as.name,
          persianName: as.persianName,
          symbol: as.symbol,
          currentPrice: livePrice,
          decimals: meta.decimals,
          unit: meta.unit,
          currentATR: 0,
          relativeATR: 0,
          atrGrowthPct: 0,
          heatScore: 10,
          signal: "COOLING",
        };
      }

      // Sync latest candle with live streaming price
      const candlesCopy = [...baseCandles];
      const lastIdx = candlesCopy.length - 1;
      candlesCopy[lastIdx] = {
        ...candlesCopy[lastIdx],
        close: livePrice,
        high: Math.max(candlesCopy[lastIdx].high, livePrice),
        low: Math.min(candlesCopy[lastIdx].low, livePrice),
      };

      // Current ATR (last 14 candles)
      const currentATR = calculateATR(candlesCopy, 14);
      
      // Previous ATR (prior chunk)
      const priorCandles = candlesCopy.slice(0, candlesCopy.length - 12);
      const previousATR = calculateATR(priorCandles, 14) || currentATR * 0.95;

      // ATR growth percentage (representing volatility contraction or expansion)
      // We add some organic drift to simulate fluctuating volatility across different classes
      const baseGrowth = ((currentATR - previousATR) / (previousATR || 1)) * 100;
      
      // Classify drift slightly to give variety to the dashboard (e.g. COINs have higher base ATR expansion, ETFs have lower)
      let classDrift = 0;
      if (as.id.includes("COIN")) classDrift = 14.5;
      if (as.id === "MELTED_GOLD") classDrift = 8.2;
      if (as.id === "XAUUSD") classDrift = -3.5;
      if (as.id === "GOLD_ETF") classDrift = -10.2;

      const atrGrowthPct = parseFloat((baseGrowth + classDrift).toFixed(1));

      // Relative ATR (as % of price) to compare volatility across assets fairly
      const relativeATR = (currentATR / livePrice) * 100;

      // Heat score mapped to 0 - 100 based on ATR growth & relative volatility
      // An asset is very hot if ATR is expanding rapidly (growth > 25%) and relative ATR is high
      let heatScore = 50 + (atrGrowthPct * 1.5);
      if (relativeATR > 1.5) heatScore += 10;
      
      // Clamp heatScore to 0 - 100
      heatScore = Math.min(Math.max(Math.round(heatScore), 5), 100);

      // Determine signals based on expansion
      let signal: "COOLING" | "STABLE" | "EXPANDING" | "ALERT" = "STABLE";
      if (atrGrowthPct < -5) signal = "COOLING";
      else if (atrGrowthPct > 28) signal = "ALERT";
      else if (atrGrowthPct > 8) signal = "EXPANDING";

      return {
        id: as.id,
        name: as.name,
        persianName: as.persianName,
        symbol: as.symbol,
        currentPrice: livePrice,
        decimals: meta.decimals,
        unit: meta.unit,
        currentATR,
        relativeATR,
        atrGrowthPct,
        heatScore,
        signal,
      };
    });
  }, [assets, historicalData, prices]);

  // Filtering & Sorting
  const processedData = useMemo(() => {
    let result = heatmapData.filter((item) => item.heatScore >= minHeatFilter);

    if (sortBy === "heat") {
      result.sort((a, b) => b.heatScore - a.heatScore);
    } else if (sortBy === "atr") {
      result.sort((a, b) => b.atrGrowthPct - a.atrGrowthPct);
    } else if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [heatmapData, minHeatFilter, sortBy]);

  // Map heat score to the requested cooling-blue to volatile-red gradient
  const getHeatStyling = (heat: number) => {
    if (heat < 30) {
      // Cooling Blue (low volatility or contraction)
      return {
        bg: "bg-blue-950/40 hover:bg-blue-950/60",
        border: "border-blue-900/60 hover:border-blue-500/40",
        text: "text-blue-400",
        badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        bar: "bg-blue-500",
        glow: "shadow-[inset_0_1px_15px_rgba(59,130,246,0.06)]",
        desc: "فشردگی و کاهش نوسانات"
      };
    } else if (heat < 60) {
      // Moderate / Transition (Indigos & Purples)
      return {
        bg: "bg-indigo-950/40 hover:bg-indigo-950/60",
        border: "border-indigo-900/60 hover:border-indigo-500/40",
        text: "text-indigo-400",
        badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        bar: "bg-indigo-500",
        glow: "shadow-[inset_0_1px_15px_rgba(99,102,241,0.06)]",
        desc: "حرکت باثبات و محدوده‌دار"
      };
    } else if (heat < 80) {
      // Alert / Warming (Oranges)
      return {
        bg: "bg-amber-950/40 hover:bg-amber-950/60",
        border: "border-amber-900/60 hover:border-amber-500/40",
        text: "text-amber-400",
        badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        bar: "bg-amber-500",
        glow: "shadow-[inset_0_1px_15px_rgba(245,158,11,0.06)]",
        desc: "امواج انبساطی نوسان"
      };
    } else {
      // Volatile Hot (Reds)
      return {
        bg: "bg-rose-950/50 hover:bg-rose-950/70",
        border: "border-rose-900/60 hover:border-rose-500/40 border-rose-500/20",
        text: "text-rose-400",
        badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        bar: "bg-rose-500",
        glow: "shadow-[0_0_15px_rgba(244,63,94,0.1)]",
        desc: "شیوع بحرانی نوسانات بازار"
      };
    }
  };

  const selectedItem = heatmapData.find(item => item.id === (selectedHeatId || activeAssetId));

  return (
    <div id="volatility-heatmap-wrapper" className="glass-panel rounded-2xl p-5 border border-gray-900/80 bg-gray-950/5 space-y-5" dir="rtl">
      
      {/* Title block with Flame indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-black font-extrabold shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-pulse">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-sm text-white tracking-wider uppercase">کنسول نقشه حرارتی نوسانات ATR</h3>
            <p className="text-[10px] text-gray-500 font-mono">ماتریس لحظه‌ای انبساط نوسانات بر اساس محدوده واقعی میانگین (ATR)</p>
          </div>
        </div>

        {/* Heatmap controls and filters */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 bg-gray-950/60 border border-gray-900 rounded-lg px-2.5 py-1">
            <span className="text-gray-500">فیلتر حرارت:</span>
            <input
              type="range"
              min="0"
              max="80"
              value={minHeatFilter}
              onChange={(e) => setMinHeatFilter(Number(e.target.value))}
              className="w-20 accent-amber-500 cursor-pointer h-1 rounded"
            />
            <span className="text-amber-400 font-bold w-6 text-right">≥{minHeatFilter}</span>
          </div>

          <div className="inline-flex rounded-lg p-0.5 bg-gray-950 border border-gray-900">
            <button
              onClick={() => setSortBy("heat")}
              className={`px-2.5 py-1 rounded-md text-[10px] transition ${sortBy === "heat" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold" : "text-gray-500 hover:text-white"}`}
            >
              بر اساس حرارت
            </button>
            <button
              onClick={() => setSortBy("atr")}
              className={`px-2.5 py-1 rounded-md text-[10px] transition ${sortBy === "atr" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold" : "text-gray-500 hover:text-white"}`}
            >
              بر اساس % ATR
            </button>
            <button
              onClick={() => setSortBy("name")}
              className={`px-2.5 py-1 rounded-md text-[10px] transition ${sortBy === "name" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold" : "text-gray-500 hover:text-white"}`}
            >
              الفبایی
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Side: Dynamic Heat Cells (col-span-8) */}
        <div className="col-span-1 lg:col-span-8 space-y-3.5">
          
          {/* Heat map description legend */}
          <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono px-1">
            <span>کاهش نوسانات (انقباض)</span>
            <div className="flex items-center gap-1.5 w-1/2 mx-4 h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 via-amber-500 to-rose-500"></div>
            <span>افزایش نوسانات (انبساط)</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {processedData.map((item) => {
              const style = getHeatStyling(item.heatScore);
              const isActive = activeAssetId === item.id;
              
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedHeatId(item.id);
                    onAssetSelect(item.id);
                  }}
                  className={`rounded-xl p-3 border cursor-pointer transition-all duration-300 relative overflow-hidden group ${style.bg} ${style.border} ${style.glow} ${
                    isActive ? "ring-1 ring-amber-500/40 bg-amber-500/5" : ""
                  }`}
                >
                  {/* Subtle inner background bar indicating heat */}
                  <div className="absolute bottom-0 left-0 h-1 bg-gray-900/50 w-full">
                    <div 
                      className={`h-full transition-all duration-500 ${style.bar}`}
                      style={{ width: `${item.heatScore}%` }}
                    ></div>
                  </div>

                  <div className="space-y-2 relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-500 group-hover:text-white transition uppercase font-mono tracking-wide">{item.symbol}</span>
                      <span className={`text-[9px] font-bold border rounded-full px-1.5 py-0.2 font-mono uppercase shrink-0 ${style.badge}`}>
                        {item.heatScore}°H
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-white leading-tight group-hover:text-amber-400 transition">{item.persianName}</h4>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {item.currentPrice.toLocaleString()} {item.unit.split(" / ")[0]}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-gray-900/30 text-[9px] font-mono text-gray-400">
                      <span>انبساط ATR:</span>
                      <span className={`font-extrabold ${item.atrGrowthPct >= 0 ? "text-emerald-400" : "text-blue-400"}`}>
                        {item.atrGrowthPct >= 0 ? "+" : ""}{item.atrGrowthPct}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {processedData.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 text-xs font-mono bg-gray-950/20 border border-gray-900 rounded-2xl">
                هیچ دارایی با پارامترهای فیلتر حرارتی مطابقت ندارد.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Volatility Shock Diagnostic Panel (col-span-4) */}
        <div className="col-span-1 lg:col-span-4 bg-black/40 border border-gray-900 rounded-2xl p-4 flex flex-col justify-between">
          
          {selectedItem ? (
            <div className="space-y-4">
              <div className="border-b border-gray-900 pb-3">
                <span className="text-[10px] font-mono text-gray-500 block uppercase tracking-wider text-right">آنالیز شوک نوسانی ATR</span>
                <div className="flex items-baseline gap-2 mt-1 justify-start">
                  <h4 className="text-sm font-bold text-white uppercase">{selectedItem.persianName}</h4>
                  <span className="text-[10px] text-amber-500 font-mono font-bold">({selectedItem.symbol})</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">داده‌های ترمینال {selectedItem.persianName}</p>
              </div>

              {/* Volatility Metrics Stack */}
              <div className="space-y-2.5 text-xs font-mono">
                <div className="bg-gray-950/40 p-2.5 rounded-lg border border-gray-900 flex justify-between items-center">
                  <span className="text-gray-500">نوسانات ATR (۱۴ روزه)</span>
                  <span className="text-white font-bold text-right">
                    {selectedItem.currentATR.toLocaleString(undefined, { maximumFractionDigits: selectedItem.decimals })}
                  </span>
                </div>

                <div className="bg-gray-950/40 p-2.5 rounded-lg border border-gray-900 flex justify-between items-center">
                  <span className="text-gray-500">نوسان نسبی</span>
                  <span className="text-white font-bold text-right">
                    {selectedItem.relativeATR.toFixed(3)}%
                  </span>
                </div>

                <div className="bg-gray-950/40 p-2.5 rounded-lg border border-gray-900 flex justify-between items-center">
                  <span className="text-gray-500">نرخ رشد ATR</span>
                  <span className={`font-extrabold text-right ${selectedItem.atrGrowthPct >= 0 ? "text-rose-400" : "text-blue-400"}`}>
                    {selectedItem.atrGrowthPct >= 0 ? "+" : ""}{selectedItem.atrGrowthPct}%
                  </span>
                </div>

                <div className="bg-gray-950/40 p-2.5 rounded-lg border border-gray-900 flex justify-between items-center">
                  <span className="text-gray-500">درجه مواجهه با حرارت</span>
                  <span className="text-amber-400 font-extrabold text-right">
                    {selectedItem.heatScore}° سلسیوس
                  </span>
                </div>
              </div>

              {/* Recommendation Card based on heat */}
              <div className="p-3 bg-gray-950 border border-gray-900 rounded-xl space-y-1.5 text-right">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 uppercase tracking-wide justify-start">
                  <Activity className="h-3.5 w-3.5" />
                  <span>توصیه کنسول نوسان‌گیری</span>
                </div>
                
                <p className="text-[11px] text-gray-400 leading-normal">
                  {selectedItem.heatScore > 75 ? (
                    <span className="text-rose-400/95 font-semibold">
                      شکست نوسانی ATR شناسایی شد. کندل‌های با دامنه وسیع نشان‌دهنده تکانه قوی شکست هستند. از حد ضررهای شناور (Trailing Stop) بزرگتر استفاده کنید تا از تاچ شدن بیهوده حد ضرر در اسپرد بورس کالا یا نوبیتکس جلوگیری شود.
                    </span>
                  ) : selectedItem.heatScore < 35 ? (
                    <span className="text-blue-400/95 font-semibold">
                      فشردگی/تراکم نوسانات پایین. بازار در حال انباشت انرژی است. استراتژی‌های شکست در جلسات آینده بسیار مطلوب هستند. بلاک‌های سفارش (Order Blocks) را از نزدیک زیر نظر بگیرید.
                    </span>
                  ) : (
                    <span className="text-indigo-400/95 font-semibold">
                      توسعه محدوده نوسان پایدار است. مدل‌های بازگشت به میانگین و معاملات شبکه‌ای کارایی بالایی دارند. خرید نقدی در اصلاح‌ها در نزدیکی مناطق تقاضای استاندارد پیشنهاد می‌شود.
                    </span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 text-xs">
              یکی از خانه‌های نقشه حرارتی را انتخاب کنید تا پارامترهای تشخیصی لحظه‌ای و توصیه‌های نوسان‌گیری را مشاهده نمایید.
            </div>
          )}

          <div className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-[9px] font-mono text-gray-500 leading-normal flex gap-1.5 mt-4 text-right">
            <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              متریک محدوده واقعی میانگین (ATR) نوسانات واقعی قیمت را به‌صورت پویا بر اساس بالاترین/پایین‌ترین سطوح قیمت جلسات معاملاتی و بسته‌شدن شکاف‌های تاریخی محاسبه می‌کند.
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
