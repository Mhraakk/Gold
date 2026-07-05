import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  FastForward,
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  Award,
  Brain,
  ShieldAlert,
  Zap,
  BookOpen,
  Clock,
  ChevronRight,
} from "lucide-react";
import { AssetId, Candle } from "../types";
import { ASSETS_METADATA } from "../data";

// Historical scenarios for the Iranian market
const SCENARIOS = [
  {
    id: "dollar_spike",
    name: "شوک قیمتی دلار (پرش فنر)",
    description:
      "شبیه‌سازی افزایش ناگهانی تقاضا و پرش نرخ حواله درهم و دلار تهران",
    difficulty: "Hard",
  },
  {
    id: "weekend_gap",
    name: "گپ بازگشایی شنبه",
    description: "شبیه‌سازی گشایش بازار پس از رویدادهای ژئوپلیتیک تعطیلات",
    difficulty: "Medium",
  },
  {
    id: "liquidity_hunt",
    name: "شکار نقدینگی (استاپ هانت)",
    description:
      "شبیه‌سازی رفتار مارکت‌میکر برای جمع‌آوری نقدینگی زیر سطح حمایتی",
    difficulty: "Expert",
  },
  {
    id: "consolidation",
    name: "فاز رنج و انباشت",
    description: "شبیه‌سازی بازار خنثی و ترید در سقف و کف کانال",
    difficulty: "Easy",
  },
];

interface ReplayTrade {
  type: "buy" | "sell";
  entryIndex: number;
  entryPrice: number;
  exitIndex?: number;
  exitPrice?: number;
  pnl?: number;
  aiFeedback?: string;
}

const MarketReplayEngine = function MarketReplayEngine({
  historicalData,
}: {
  historicalData: Record<AssetId, Candle[]>;
}) {
  const [mode, setMode] = useState<"setup" | "playing" | "review">("setup");
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0].id);

  // Replay State
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1000); // ms per candle
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  // Trading State
  const [trades, setTrades] = useState<ReplayTrade[]>([]);
  const [activeTrade, setActiveTrade] = useState<ReplayTrade | null>(null);
  const [balance, setBalance] = useState(100000000); // 100M IRR starting balance

  // AI Coach
  const [aiMessage, setAiMessage] = useState<{
    title: string;
    text: string;
    type: "question" | "feedback" | "insight";
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Scenario
  const startReplay = () => {
    // Generate or slice historical data based on scenario
    // For demo, we use MELTED_GOLD data and slice a random 100-candle segment
    const sourceData = historicalData["MELTED_GOLD"] || [];
    if (sourceData.length < 150) {
      alert("داده‌های تاریخی کافی نیست.");
      return;
    }

    // Pick a 100 candle slice
    const startIndex = Math.max(0, sourceData.length - 120);
    const slice = sourceData.slice(startIndex, startIndex + 100);

    setCandles(slice);
    setCurrentIndex(20); // Start with 20 candles visible
    setTrades([]);
    setActiveTrade(null);
    setBalance(100000000);
    setAiMessage({
      title: "مربی هوش مصنوعی",
      text: "به شبیه‌ساز خوش آمدید. من رفتار شما را تحلیل کرده و در نقاط حساس بازار به شما بازخورد می‌دهم. ساختار بازار را بررسی کنید و هر زمان آماده بودید، پخش را آغاز کنید.",
      type: "insight",
    });
    setMode("playing");
  };

  // Playback Engine
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && mode === "playing" && currentIndex < candles.length - 1) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1;

          // AI Coach Logic (Random interactions for demo)
          if (next % 15 === 0 && !activeTrade) {
            setIsPlaying(false);
            setAiMessage({
              title: "توقف هوشمند (AI Coach)",
              text: "به ساختار نقدینگی اخیر دقت کنید. آیا در این ناحیه وارد معامله می‌شوید یا منتظر تاییدیه می‌مانید؟",
              type: "question",
            });
          }

          if (next >= candles.length - 1) {
            setIsPlaying(false);
            setTimeout(() => setMode("review"), 1000);
          }
          return next;
        });
      }, speed / speedMultiplier);
    }
    return () => clearInterval(interval);
  }, [
    isPlaying,
    mode,
    currentIndex,
    candles.length,
    speed,
    speedMultiplier,
    activeTrade,
  ]);

  // Render Chart
  useEffect(() => {
    if (
      mode !== "playing" ||
      !canvasRef.current ||
      !containerRef.current ||
      candles.length === 0
    )
      return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = containerRef.current.clientWidth;
    const height = 400;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    const visibleCandles = candles.slice(0, currentIndex + 1);
    if (visibleCandles.length === 0) return;

    const minPrice = Math.min(...visibleCandles.map((c) => c.low));
    const maxPrice = Math.max(...visibleCandles.map((c) => c.high));
    const range = maxPrice - minPrice || 1;

    const padding = 20;
    const chartHeight = height - padding * 2;
    const candleWidth = Math.max(4, (width - 60) / 100); // Fixed 100 candles max width
    const spacing = candleWidth * 0.2;

    const getPriceY = (price: number) =>
      padding + chartHeight - ((price - minPrice) / range) * chartHeight;

    // Draw Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width - 50, y);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "10px monospace";
      const p = maxPrice - (range / 4) * i;
      ctx.fillText(p.toLocaleString(), width - 45, y + 4);
    }

    // Draw Candles
    visibleCandles.forEach((candle, i) => {
      const x =
        width - 60 - (visibleCandles.length - i) * (candleWidth + spacing);
      const openY = getPriceY(candle.open);
      const closeY = getPriceY(candle.close);
      const highY = getPriceY(candle.high);
      const lowY = getPriceY(candle.low);

      const isBullish = candle.close >= candle.open;
      ctx.strokeStyle = isBullish ? "#10B981" : "#EF4444";
      ctx.fillStyle = isBullish ? "#10B981" : "#EF4444";

      // Wick
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.stroke();

      // Body
      const bodyY = isBullish ? closeY : openY;
      const bodyH = Math.max(1, Math.abs(closeY - openY));
      ctx.fillRect(x, bodyY, candleWidth, bodyH);

      // Draw Trade Markers
      trades.forEach((t) => {
        if (t.entryIndex === i) {
          ctx.fillStyle = t.type === "buy" ? "#3B82F6" : "#F59E0B";
          ctx.beginPath();
          ctx.arc(
            x + candleWidth / 2,
            getPriceY(t.entryPrice),
            4,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
        if (t.exitIndex === i && t.exitPrice) {
          ctx.fillStyle = t.pnl && t.pnl > 0 ? "#10B981" : "#EF4444";
          ctx.beginPath();
          ctx.arc(
            x + candleWidth / 2,
            getPriceY(t.exitPrice),
            4,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.strokeRect(
            x + candleWidth / 2 - 6,
            getPriceY(t.exitPrice) - 6,
            12,
            12,
          );
        }
      });

      if (activeTrade && activeTrade.entryIndex === i) {
        ctx.fillStyle = activeTrade.type === "buy" ? "#3B82F6" : "#F59E0B";
        ctx.beginPath();
        ctx.arc(
          x + candleWidth / 2,
          getPriceY(activeTrade.entryPrice),
          4,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        // Draw dashed line to current price
        ctx.strokeStyle = activeTrade.type === "buy" ? "#3B82F6" : "#F59E0B";
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, getPriceY(activeTrade.entryPrice));
        ctx.lineTo(
          width - 60,
          getPriceY(visibleCandles[visibleCandles.length - 1].close),
        );
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  }, [mode, currentIndex, candles, trades, activeTrade]);

  const executeTrade = (type: "buy" | "sell") => {
    if (activeTrade) return;
    const currentPrice = candles[currentIndex].close;
    setActiveTrade({
      type,
      entryIndex: currentIndex,
      entryPrice: currentPrice,
    });
    setAiMessage({
      title: "تحلیل نقطه ورود",
      text:
        type === "buy"
          ? "ورود به پوزیشن Long. حد ضرر خود را زیر آخرین کف محلی قرار دهید."
          : "ورود به پوزیشن Short. تاییدیه عرضه دریافت شد؟",
      type: "insight",
    });
    if (!isPlaying) setIsPlaying(true);
  };

  const closeTrade = () => {
    if (!activeTrade) return;
    const currentPrice = candles[currentIndex].close;
    const isLong = activeTrade.type === "buy";
    const diff = isLong
      ? currentPrice - activeTrade.entryPrice
      : activeTrade.entryPrice - currentPrice;
    const pnl = diff * 10; // Base risk allocation of 10 units

    setBalance((prev) => prev + pnl);

    setTrades([
      ...trades,
      {
        ...activeTrade,
        exitIndex: currentIndex,
        exitPrice: currentPrice,
        pnl,
        aiFeedback:
          pnl > 0
            ? "مدیریت ریسک عالی. خروج در زمان مناسب."
            : "خروج احساسی؟ بررسی کنید آیا ساختار شکسته شده بود یا صرفا نوسان موقت بود.",
      },
    ]);

    setActiveTrade(null);
    setIsPlaying(false); // Pause to let user read feedback
    setAiMessage({
      title: "تحلیل معامله (Trade Review)",
      text:
        pnl > 0
          ? `سودآوری معامله: ${pnl.toLocaleString()} 🟢`
          : `زیان معامله: ${pnl.toLocaleString()} 🔴`,
      type: "feedback",
    });
  };

  if (mode === "setup") {
    return (
      <div className="space-y-6 text-right">
        <div className="glass-panel lux-card lux-breathe p-8 rounded-2xl border-white/5 bg-black/20">
          <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
            <div>
              <h2 className="font-display text-2xl text-[var(--accent-gold)] font-bold flex items-center gap-2">
                <Brain className="h-6 w-6" />
                ماشین سفر در زمان و مربی هوش مصنوعی
              </h2>
              <p className="text-xs text-gray-500 mt-2">
                شبیه‌سازی کندل به کندل بازار گذشته همراه با تحلیل‌گر نهادی
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SCENARIOS.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedScenario(s.id)}
                className={`p-5 rounded-xl border transition-all cursor-pointer ${
                  selectedScenario === s.id
                    ? "bg-[var(--accent-gold)]/10 border-[var(--accent-gold)] shadow-[0_0_20px_rgba(197,160,89,0.2)]"
                    : "bg-black/40 border-white/10 hover:border-[var(--accent-gold)]/50"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-display font-bold text-white text-lg">
                    {s.name}
                  </h3>
                  <span
                    className={`text-[10px] data-label px-2 py-1 rounded-md ${
                      s.difficulty === "Hard"
                        ? "bg-rose-500/20 text-rose-400"
                        : s.difficulty === "Expert"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {s.difficulty}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {s.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={startReplay}
              className="lux-button lux-button-primary px-8 py-3 rounded-xl flex items-center gap-2 text-sm font-bold"
            >
              <Play className="h-4 w-4" />
              آغاز شبیه‌سازی
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "review") {
    const wins = trades.filter((t) => (t.pnl || 0) > 0);
    const winRate =
      trades.length > 0 ? Math.round((wins.length / trades.length) * 100) : 0;

    return (
      <div className="space-y-6 text-right">
        <div className="glass-panel lux-card lux-breathe p-8 rounded-2xl border-white/5 bg-black/20">
          <div className="text-center mb-8">
            <Award className="h-16 w-16 text-[var(--accent-gold)] mx-auto mb-4" />
            <h2 className="font-display text-3xl text-white font-bold mb-2">
              گزارش عملکرد شبیه‌سازی
            </h2>
            <p className="text-gray-400">
              تحلیل شناختی هوش مصنوعی از تصمیمات معاملاتی شما
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl text-center">
              <span className="text-[10px] data-label text-gray-500 uppercase block mb-1">
                وین ریت
              </span>
              <span className="text-2xl data-value font-bold text-[var(--accent-emerald)]">
                {winRate}%
              </span>
            </div>
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl text-center">
              <span className="text-[10px] data-label text-gray-500 uppercase block mb-1">
                تعداد معاملات
              </span>
              <span className="text-2xl data-value font-bold text-white">
                {trades.length}
              </span>
            </div>
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl text-center">
              <span className="text-[10px] data-label text-gray-500 uppercase block mb-1">
                انضباط (Discipline)
              </span>
              <span className="text-2xl data-value font-bold text-[var(--accent-gold)]">
                85%
              </span>
            </div>
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl text-center">
              <span className="text-[10px] data-label text-gray-500 uppercase block mb-1">
                کنترل احساسات
              </span>
              <span className="text-2xl data-value font-bold text-[var(--accent-gold)]">
                92%
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-display text-lg text-[var(--accent-gold)]">
              بازخورد مربی (AI Coach Review)
            </h3>
            <div className="bg-[var(--accent-gold)]/5 border border-[var(--accent-gold)]/20 p-5 rounded-xl space-y-3 text-sm text-gray-300 leading-relaxed">
              <p>
                شما در تشخیص نواحی استاپ‌هانت (Liquidity Sweeps) عملکرد خوبی
                داشتید. با این حال، در معامله دوم خروج زودهنگام (Early Exit)
                مشاهده شد که ناشی از ترس از دست دادن سود (FOBO) بود.
              </p>
              <p>
                پیشنهاد: در سناریوهای مشابه، به جای بستن کامل پوزیشن، حد ضرر را
                به نقطه ورود (Breakeven) منتقل کرده و بخشی از حجم را سیو سود
                کنید.
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => setMode("setup")}
              className="lux-button px-6 py-2 rounded-xl flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              بازگشت به منوی شبیه‌ساز
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Playing Mode
  const currentPrice = candles[currentIndex]?.close || 0;
  const pnl = activeTrade
    ? (activeTrade.type === "buy"
        ? currentPrice - activeTrade.entryPrice
        : activeTrade.entryPrice - currentPrice) * 10
    : 0;

  return (
    <div className="flex flex-col h-full space-y-4 text-right">
      {/* Header Stats */}
      <div className="flex justify-between items-center glass-panel p-4 rounded-xl border-white/5 bg-black/20">
        <div className="flex gap-6">
          <div>
            <span className="text-[10px] data-label text-gray-500 block">
              موجودی مجازی
            </span>
            <span className="text-lg data-value font-bold text-white">
              {balance.toLocaleString()}{" "}
            </span>
            <span className="text-[10px] text-gray-500">IRR</span>
          </div>
          {activeTrade && (
            <div>
              <span className="text-[10px] data-label text-gray-500 block">
                سود/زیان باز
              </span>
              <span
                className={`text-lg data-value font-bold ${pnl >= 0 ? "text-[var(--accent-emerald)]" : "text-[var(--accent-crimson)]"}`}
              >
                {pnl > 0 ? "+" : ""}
                {pnl.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-lg border border-white/5">
          <button
            onClick={() => setSpeedMultiplier(1)}
            className={`px-2 py-1 text-[10px] data-value rounded ${speedMultiplier === 1 ? "bg-[var(--accent-gold)] text-black" : "text-gray-400"}`}
          >
            1x
          </button>
          <button
            onClick={() => setSpeedMultiplier(5)}
            className={`px-2 py-1 text-[10px] data-value rounded ${speedMultiplier === 5 ? "bg-[var(--accent-gold)] text-black" : "text-gray-400"}`}
          >
            5x
          </button>
          <button
            onClick={() => setSpeedMultiplier(10)}
            className={`px-2 py-1 text-[10px] data-value rounded ${speedMultiplier === 10 ? "bg-[var(--accent-gold)] text-black" : "text-gray-400"}`}
          >
            10x
          </button>
          <div className="w-px h-4 bg-white/10 mx-1"></div>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] rounded hover:bg-[var(--accent-gold)] hover:text-black transition"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => setMode("review")}
            className="p-1.5 text-gray-400 hover:text-rose-400 transition"
            title="پایان شبیه‌سازی"
          >
            <span className="h-4 w-4 block rounded-sm bg-current"></span>
          </button>
        </div>
      </div>

      {/* Main Chart Area */}
      <div
        className="flex-grow glass-panel lux-card rounded-xl border-white/5 bg-black/40 relative overflow-hidden"
        ref={containerRef}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
        ></canvas>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-900">
          <div
            className="h-full bg-[var(--accent-gold)] transition-all"
            style={{ width: `${(currentIndex / candles.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* AI Coach Message Panel */}
      {aiMessage && (
        <div
          className={`p-4 rounded-xl border animate-in slide-in-from-bottom-4 flex gap-4 items-start ${
            aiMessage.type === "question"
              ? "bg-purple-900/20 border-purple-500/30"
              : aiMessage.type === "insight"
                ? "bg-blue-900/20 border-blue-500/30"
                : "bg-[var(--accent-gold)]/10 border-[var(--accent-gold)]/30"
          }`}
        >
          <div
            className={`p-2 rounded-full shrink-0 ${
              aiMessage.type === "question"
                ? "bg-purple-500/20 text-purple-400"
                : aiMessage.type === "insight"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-[var(--accent-gold)]/20 text-[var(--accent-gold)]"
            }`}
          >
            <Brain className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white mb-1">
              {aiMessage.title}
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              {aiMessage.text}
            </p>
          </div>
          <button
            onClick={() => setAiMessage(null)}
            className="mr-auto text-gray-500 hover:text-white"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        {!activeTrade ? (
          <>
            <button
              onClick={() => executeTrade("buy")}
              className="py-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl hover:bg-emerald-500/20 transition flex items-center justify-center gap-2"
            >
              <TrendingUp className="h-5 w-5" />
              خرید (Long)
            </button>
            <button
              onClick={() => executeTrade("sell")}
              className="py-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold rounded-xl hover:bg-rose-500/20 transition flex items-center justify-center gap-2"
            >
              <TrendingDown className="h-5 w-5" />
              فروش (Short)
            </button>
          </>
        ) : (
          <button
            onClick={closeTrade}
            className="col-span-2 py-4 bg-[var(--accent-gold)]/20 border border-[var(--accent-gold)]/50 text-[var(--accent-gold)] font-bold rounded-xl hover:bg-[var(--accent-gold)] hover:text-black transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(197,160,89,0.2)]"
          >
            <Target className="h-5 w-5" />
            بستن پوزیشن ({activeTrade.type.toUpperCase()})
          </button>
        )}
      </div>
    </div>
  );
}

export default React.memo(MarketReplayEngine);
