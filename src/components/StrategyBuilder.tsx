import React, { useState, useEffect, useMemo } from "react";
import { 
  Cpu, 
  Plus, 
  Trash2, 
  Play, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  Info,
  Sliders,
  Power,
  Layers,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  BookOpen
} from "lucide-react";
import { Candle, AssetId } from "../types";
import { calculateRSI, calculateEMA, calculateATR } from "../services/aiEngine";

export interface StrategyRule {
  id: string;
  name: string;
  conditionType: "and" | "or";
  cond1Metric: "rsi" | "price" | "ema20" | "ema50" | "atr" | "volume";
  cond1Op: "<" | ">" | "<=" | ">=" | "==";
  cond1Value: number;
  cond2Metric: "rsi" | "price" | "ema20" | "ema50" | "atr" | "volume" | "none";
  cond2Op: "<" | ">" | "<=" | ">=" | "==";
  cond2Value: number;
  actionSignal: "BUY" | "SELL" | "NEUTRAL" | "ALERT";
  isActive: boolean;
  createdAt: string;
}

interface StrategyBuilderProps {
  activeAssetId: AssetId;
  activeAssetSymbol: string;
  activeAssetPersianName: string;
  candles: Candle[];
  currentPrice: number;
  onRulesChanged?: (rules: StrategyRule[]) => void;
}

// Helpers to compute metrics for live evaluation
export function getMetricValue(metric: string, candles: Candle[], currentPrice: number): number {
  if (candles.length === 0) return 0;
  const lastCandle = candles[candles.length - 1];
  switch (metric) {
    case "rsi":
      return calculateRSI(candles);
    case "price":
      return currentPrice || lastCandle.close;
    case "ema20":
      return calculateEMA(candles, 20);
    case "ema50":
      return calculateEMA(candles, 50);
    case "atr":
      return calculateATR(candles);
    case "volume":
      return lastCandle.volume;
    default:
      return 0;
  }
}

export function evaluateOp(left: number, op: string, right: number): boolean {
  switch (op) {
    case "<": return left < right;
    case ">": return left > right;
    case "<=": return left <= right;
    case ">=": return left >= right;
    case "==": return left === right;
    default: return false;
  }
}

export function evaluateStrategyRule(rule: StrategyRule, candles: Candle[], currentPrice: number): {
  isTriggered: boolean;
  val1: number;
  val2?: number;
} {
  const val1 = getMetricValue(rule.cond1Metric, candles, currentPrice);
  const pass1 = evaluateOp(val1, rule.cond1Op, rule.cond1Value);
  
  if (rule.cond2Metric === "none") {
    return { isTriggered: pass1, val1 };
  }
  
  const val2 = getMetricValue(rule.cond2Metric, candles, currentPrice);
  const pass2 = evaluateOp(val2, rule.cond2Op, rule.cond2Value);
  
  let isTriggered = false;
  if (rule.conditionType === "and") {
    isTriggered = pass1 && pass2;
  } else {
    isTriggered = pass1 || pass2;
  }
  
  return { isTriggered, val1, val2 };
}

// Default presets for outstanding user onboarding
const PRESET_TEMPLATES: Omit<StrategyRule, "id" | "createdAt" | "isActive">[] = [
  {
    name: "فشار صعودی اشباع فروش SMC",
    conditionType: "and",
    cond1Metric: "rsi",
    cond1Op: "<",
    cond1Value: 30,
    cond2Metric: "price",
    cond2Op: ">",
    cond2Value: 18000000,
    actionSignal: "BUY",
  },
  {
    name: "شکست صعودی انبساط نوسان ATR",
    conditionType: "and",
    cond1Metric: "atr",
    cond1Op: ">",
    cond1Value: 25000,
    cond2Metric: "price",
    cond2Op: ">",
    cond2Value: 18500000,
    actionSignal: "ALERT",
  },
  {
    name: "پولبک تقاطع طلایی EMA20",
    conditionType: "and",
    cond1Metric: "price",
    cond1Op: ">",
    cond1Value: 18200000,
    cond2Metric: "rsi",
    cond2Op: "<",
    cond2Value: 45,
    actionSignal: "BUY",
  },
  {
    name: "کاهش ریسک نزولی اشباع خرید",
    conditionType: "and",
    cond1Metric: "rsi",
    cond1Op: ">",
    cond1Value: 70,
    cond2Metric: "price",
    cond2Op: ">",
    cond2Value: 19000000,
    actionSignal: "SELL",
  }
];

const StrategyBuilder = function StrategyBuilder({
  activeAssetId,
  activeAssetSymbol,
  activeAssetPersianName,
  candles,
  currentPrice,
  onRulesChanged
}: StrategyBuilderProps) {
  const [rules, setRules] = useState<StrategyRule[]>([]);
  
  // Creation Form State
  const [newRuleName, setNewRuleName] = useState("");
  const [newCondType, setNewCondType] = useState<"and" | "or">("and");
  const [newCond1Metric, setNewCond1Metric] = useState<StrategyRule["cond1Metric"]>("rsi");
  const [newCond1Op, setNewCond1Op] = useState<StrategyRule["cond1Op"]>("<");
  const [newCond1Value, setNewCond1Value] = useState<number>(30);
  const [newCond2Metric, setNewCond2Metric] = useState<StrategyRule["cond2Metric"]>("none");
  const [newCond2Op, setNewCond2Op] = useState<StrategyRule["cond2Op"]>(">");
  const [newCond2Value, setNewCond2Value] = useState<number>(18000000);
  const [newActionSignal, setNewActionSignal] = useState<StrategyRule["actionSignal"]>("BUY");
  
  // Notification states
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load rules on mount
  useEffect(() => {
    const saved = localStorage.getItem("gold_terminal_strategy_rules");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRules(parsed);
        if (onRulesChanged) onRulesChanged(parsed);
      } catch (e) {
        console.error("Failed to load strategy rules", e);
      }
    } else {
      // Seed with some classic default rules
      const seeded: StrategyRule[] = PRESET_TEMPLATES.map((preset, index) => ({
        ...preset,
        id: `seeded-rule-${index}`,
        isActive: true,
        createdAt: new Date().toISOString()
      }));
      setRules(seeded);
      localStorage.setItem("gold_terminal_strategy_rules", JSON.stringify(seeded));
      if (onRulesChanged) onRulesChanged(seeded);
    }
  }, []);

  const saveRulesToStore = (updatedRules: StrategyRule[]) => {
    setRules(updatedRules);
    localStorage.setItem("gold_terminal_strategy_rules", JSON.stringify(updatedRules));
    if (onRulesChanged) onRulesChanged(updatedRules);
  };

  // Add rule handler
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!newRuleName.trim()) {
      setFormError("وارد کردن نام استراتژی الزامی است.");
      return;
    }

    const newRule: StrategyRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim(),
      conditionType: newCondType,
      cond1Metric: newCond1Metric,
      cond1Op: newCond1Op,
      cond1Value: Number(newCond1Value) || 0,
      cond2Metric: newCond2Metric,
      cond2Op: newCond2Op,
      cond2Value: Number(newCond2Value) || 0,
      actionSignal: newActionSignal,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const updated = [newRule, ...rules];
    saveRulesToStore(updated);
    
    // Reset Form
    setNewRuleName("");
    setSuccessMsg(`استراتژی "${newRule.name}" با موفقیت ذخیره شد!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Apply preset template
  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setNewRuleName(preset.name);
    setNewCondType(preset.conditionType);
    setNewCond1Metric(preset.cond1Metric);
    setNewCond1Op(preset.cond1Op);
    setNewCond1Value(preset.cond1Value);
    setNewCond2Metric(preset.cond2Metric);
    setNewCond2Op(preset.cond2Op);
    setNewCond2Value(preset.cond2Value);
    setNewActionSignal(preset.actionSignal);
    
    setSuccessMsg(`الگوی پیش‌فرض "${preset.name}" بارگذاری شد!`);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  // Toggle active status
  const toggleRuleActive = (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    saveRulesToStore(updated);
  };

  // Delete rule
  const handleDeleteRule = (id: string) => {
    const updated = rules.filter(r => r.id !== id);
    saveRulesToStore(updated);
  };

  // Evaluate current active rules for display
  const evaluatedRules = useMemo(() => {
    return rules.map(rule => {
      const evaluation = evaluateStrategyRule(rule, candles, currentPrice);
      return {
        ...rule,
        isTriggered: evaluation.isTriggered,
        val1: evaluation.val1,
        val2: evaluation.val2
      };
    });
  }, [rules, candles, currentPrice]);

  const activeTriggersCount = evaluatedRules.filter(r => r.isActive && r.isTriggered).length;

  // Render metric pretty values
  const formatMetricDisplay = (metric: string, val: number | undefined) => {
    if (val === undefined) return "N/A";
    if (metric === "rsi") return `${val.toFixed(1)}%`;
    if (metric === "price" || metric === "ema20" || metric === "ema50" || metric === "atr") {
      return val.toLocaleString(undefined, { maximumFractionDigits: 1 });
    }
    return val.toLocaleString();
  };

  const getSignalBadgeStyle = (signal: StrategyRule["actionSignal"]) => {
    switch (signal) {
      case "BUY":
        return "bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)] border border-emerald-500/20";
      case "SELL":
        return "bg-[var(--accent-crimson)]/10 text-[var(--accent-crimson)] border border-rose-500/20";
      case "ALERT":
        return "bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] border border-[var(--accent-gold)]/20";
      default:
        return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    }
  };

  return (
    <div id="strategy-builder-wrapper" className="space-y-6">
      
      {/* Overview stats header banner */}
      <div className="glass-panel rounded-2xl p-5 border border-white/5/80 bg-gradient-to-r from-gray-950/80 to-amber-950/10 relative overflow-hidden flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2 z-10 relative">
          <span className="text-[10px] font-sans bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] border border-[var(--accent-gold)]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            ماژول اتوماسیون کوانت SMC
          </span>
          <h2 className="font-display font-extrabold text-lg text-white flex items-center gap-2">
            <Cpu className="h-5 w-5 text-[var(--accent-gold)]" />
            <span>استراتژی‌ساز منطقی ساختار بازار</span>
          </h2>
          <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
            قوانین شرطی و ریاضی بر اساس شاخص‌های RSI زنده، اوردربلاک‌های SMC، نوسان‌پذیری ATR یا میانگین‌های متحرک بسازید. پیکربندی‌ها در مرورگر ذخیره شده و به موتور تحلیل هوش مصنوعی تزریق می‌شوند.
          </p>
        </div>
        <div className="z-10 shrink-0 bg-white/5/80 border border-white/10 rounded-xl p-3 text-right space-y-1">
          <span className="text-[10px] text-gray-500 font-sans block uppercase">وضعیت استراتژی‌های فعال</span>
          <div className="flex items-center gap-2 justify-end">
            <div className={`h-2.5 w-2.5 rounded-full ${activeTriggersCount > 0 ? "bg-[var(--accent-crimson)] animate-ping" : "bg-[var(--accent-emerald)]"}`}></div>
            <span className="text-xs data-value text-[11px] font-extrabold text-white">
              {activeTriggersCount} قانون فعال شده
            </span>
          </div>
        </div>
        <div className="absolute top-0 right-0 h-full w-1/4 bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Hand Constructor Block: Form Creation (col-span-5) */}
        <div className="col-span-1 lg:col-span-5 space-y-4">
          
          {/* Preset templates selector list */}
          <div className="glass-panel rounded-xl p-4 border border-white/5/80 space-y-3 bg-black/5">
            <div className="flex items-center gap-2 text-xs font-sans text-gray-400 font-bold border-b border-white/5 pb-2">
              <BookOpen className="h-4 w-4 text-[var(--accent-gold)]" />
              <span>بارگذاری استراتژی‌های پیش‌فرض</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_TEMPLATES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(preset)}
                  className="w-full text-right p-2.5 rounded-lg border border-white/5 bg-black/20 hover:bg-[var(--accent-gold)]/5 hover:border-[var(--accent-gold)]/30 transition text-xs data-value text-[11px] flex items-center justify-between group cursor-pointer"
                >
                  <span className="text-gray-300 group-hover:text-[var(--accent-gold)] transition font-sans font-medium">{preset.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded uppercase shrink-0 font-bold ml-2 ${getSignalBadgeStyle(preset.actionSignal)}`}>
                    {preset.actionSignal === "BUY" ? "خرید" : preset.actionSignal === "SELL" ? "فروش" : preset.actionSignal === "ALERT" ? "هشدار" : "خنثی"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Strategy Form Constructor */}
          <form onSubmit={handleAddRule} className="glass-panel rounded-xl p-5 border border-white/5/80 space-y-4 text-right">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3 justify-start">
              <Sliders className="h-4.5 w-4.5 text-[var(--accent-gold)]" />
              <h3 className="text-xs font-sans font-bold uppercase text-white">سازنده فرمول شرطی اتوماسیون</h3>
            </div>

            {formError && (
              <div className="p-3 bg-[var(--accent-crimson)]/10 border border-rose-500/20 rounded-lg text-xs text-[var(--accent-crimson)] flex items-center gap-2 data-value text-[11px]">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-[var(--accent-emerald)]/10 border border-emerald-500/20 rounded-lg text-xs text-[var(--accent-emerald)] flex items-center gap-2 data-value text-[11px]">
                <Check className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Rule Name Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-sans block uppercase">نام استراتژی</label>
              <input
                type="text"
                placeholder="مثال: فشار صعودی اشباع فروش"
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                className="w-full bg-black/40/80 border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition font-sans text-right"
              />
            </div>

            {/* Condition 1 Block */}
            <div className="space-y-2 border border-white/5 bg-black/20 p-3 rounded-xl">
              <span className="text-[9px] text-[var(--accent-gold)] font-sans uppercase block font-extrabold text-right">شرط اول (اصلی)</span>
              
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <select
                    value={newCond1Metric}
                    onChange={(e) => setNewCond1Metric(e.target.value as any)}
                    className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/40 font-sans text-right"
                  >
                    <option value="rsi">شاخص RSI</option>
                    <option value="price">قیمت (زنده)</option>
                    <option value="ema20">میانگین متحرک ۲۰ روزه (EMA)</option>
                    <option value="ema50">میانگین متحرک ۵۰ روزه (EMA)</option>
                    <option value="atr">نوسان‌پذیری ATR</option>
                    <option value="volume">حجم معاملات کندل</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <select
                    value={newCond1Op}
                    onChange={(e) => setNewCond1Op(e.target.value as any)}
                    className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-amber-500/40 data-value text-[11px] font-bold"
                  >
                    <option value="<">&lt;</option>
                    <option value=">">&gt;</option>
                    <option value="<=">&le;</option>
                    <option value=">=">&ge;</option>
                    <option value="==">&equiv;</option>
                  </select>
                </div>
                <div className="col-span-4">
                  <input
                    type="number"
                    value={newCond1Value}
                    onChange={(e) => setNewCond1Value(parseFloat(e.target.value))}
                    className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/40 data-value text-[11px] text-center"
                  />
                </div>
              </div>
            </div>

            {/* Logical Operator (AND/OR) */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-gray-500 font-sans uppercase">نوع ترکیب شرط‌ها</span>
              <div className="inline-flex rounded-lg p-0.5 bg-black/40 border border-white/5">
                <button
                  type="button"
                  onClick={() => setNewCondType("and")}
                  className={`px-3 py-1 rounded-md text-[10px] transition ${newCondType === "and" ? "bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] border border-[var(--accent-gold)]/20 font-bold" : "text-gray-500 hover:text-white"}`}
                >
                  و (AND)
                </button>
                <button
                  type="button"
                  onClick={() => setNewCondType("or")}
                  className={`px-3 py-1 rounded-md text-[10px] transition ${newCondType === "or" ? "bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] border border-[var(--accent-gold)]/20 font-bold" : "text-gray-500 hover:text-white"}`}
                >
                  یا (OR)
                </button>
              </div>
            </div>

            {/* Condition 2 Block */}
            <div className="space-y-2 border border-white/5 bg-black/20 p-3 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-[var(--accent-gold)] font-sans uppercase block font-extrabold text-right">شرط دوم (ثانویه)</span>
                <button
                  type="button"
                  onClick={() => {
                    if (newCond2Metric === "none") {
                      setNewCond2Metric("price");
                    } else {
                      setNewCond2Metric("none");
                    }
                  }}
                  className="text-[9px] font-sans text-gray-500 hover:text-white uppercase transition"
                >
                  {newCond2Metric === "none" ? "فعال کردن" : "غیرفعال کردن"}
                </button>
              </div>
              
              {newCond2Metric === "none" ? (
                <div className="text-center py-2 text-[10px] text-gray-500 data-value text-[11px] italic">
                  فرمول استراتژی بر اساس شرط اول ارزیابی می‌شود.
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <select
                      value={newCond2Metric}
                      onChange={(e) => setNewCond2Metric(e.target.value as any)}
                      className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/40 font-sans text-right"
                    >
                      <option value="rsi">شاخص RSI</option>
                      <option value="price">قیمت (زنده)</option>
                      <option value="ema20">EMA میانگین متحرک ۲۰</option>
                      <option value="ema50">EMA میانگین متحرک ۵۰</option>
                      <option value="atr">نوسان‌پذیری ATR</option>
                      <option value="volume">حجم معاملات کندل</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <select
                      value={newCond2Op}
                      onChange={(e) => setNewCond2Op(e.target.value as any)}
                      className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-amber-500/40 data-value text-[11px] font-bold"
                    >
                      <option value="<">&lt;</option>
                      <option value=">">&gt;</option>
                      <option value="<=">&le;</option>
                      <option value=">=">&ge;</option>
                      <option value="==">&equiv;</option>
                    </select>
                  </div>
                  <div className="col-span-4">
                    <input
                      type="number"
                      value={newCond2Value}
                      onChange={(e) => setNewCond2Value(parseFloat(e.target.value))}
                      className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/40 data-value text-[11px] text-center"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Target Output Signal */}
            <div className="space-y-1.5 text-right">
              <label className="text-[10px] text-gray-400 font-sans block uppercase">سیگنال اتوماسیون خروجی</label>
              <div className="grid grid-cols-4 gap-2">
                {(["BUY", "SELL", "ALERT", "NEUTRAL"] as const).map((sig) => {
                  const isSelected = newActionSignal === sig;
                  let bg = isSelected ? "bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] border-amber-500/40" : "bg-black/40 text-gray-500 border-white/5 hover:text-white";
                  if (isSelected && sig === "BUY") bg = "bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)] border-emerald-500/40";
                  if (isSelected && sig === "SELL") bg = "bg-[var(--accent-crimson)]/10 text-[var(--accent-crimson)] border-rose-500/40";
                  
                  return (
                    <button
                      key={sig}
                      type="button"
                      onClick={() => setNewActionSignal(sig)}
                      className={`py-1.5 rounded-lg border text-[10px] font-sans font-bold transition uppercase tracking-wider cursor-pointer ${bg}`}
                    >
                      {sig === "BUY" ? "خرید" : sig === "SELL" ? "فروش" : sig === "ALERT" ? "هشدار" : "خنثی"}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs rounded-lg transition hover:brightness-110 flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.15)] font-sans"
            >
              <Plus className="h-4 w-4" />
              <span>ایجاد قانون اتوماسیون جدید</span>
            </button>
          </form>

        </div>

        {/* Right Hand Live Monitoring Matrix (col-span-7) */}
        <div className="col-span-1 lg:col-span-7 space-y-4">
          
          {/* Live Indicator Feed Metrics Header */}
          <div className="glass-panel rounded-xl p-4 border border-white/5/80 bg-black/5 text-right">
            <span className="text-[9px] font-sans text-gray-500 block uppercase tracking-wider mb-2">ارزیابی زنده شاخص‌ها برای {activeAssetPersianName} ({activeAssetSymbol})</span>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 font-sans text-center">
              <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                <span className="text-[9px] text-gray-500 block">قیمت فعلی</span>
                <span className="text-white text-xs font-bold data-value text-[11px]">{currentPrice.toLocaleString()}</span>
              </div>
              <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                <span className="text-[9px] text-gray-500 block">RSI (۱۴ روزه)</span>
                <span className="text-[var(--accent-gold)] text-xs font-bold data-value text-[11px]">{formatMetricDisplay("rsi", calculateRSI(candles))}</span>
              </div>
              <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                <span className="text-[9px] text-gray-500 block">EMA (۲۰)</span>
                <span className="text-indigo-400 text-xs font-bold data-value text-[11px]">{formatMetricDisplay("ema20", calculateEMA(candles, 20))}</span>
              </div>
              <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                <span className="text-[9px] text-gray-500 block">EMA (۵۰)</span>
                <span className="text-pink-400 text-xs font-bold data-value text-[11px]">{formatMetricDisplay("ema50", calculateEMA(candles, 50))}</span>
              </div>
              <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                <span className="text-[9px] text-gray-500 block">ATR (۱۴)</span>
                <span className="text-[var(--accent-emerald)] text-xs font-bold data-value text-[11px]">{formatMetricDisplay("atr", calculateATR(candles))}</span>
              </div>
            </div>
          </div>

          {/* Active rules list evaluation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-sans font-bold text-gray-400 uppercase tracking-wider">لیست استراتژی‌های فعال ({evaluatedRules.length})</span>
              <button
                onClick={() => {
                  if (confirm("آیا تمایل دارید تمام استراتژی‌ها به حالت اولیه بازنشانی شوند؟")) {
                    localStorage.removeItem("gold_terminal_strategy_rules");
                    const seeded = PRESET_TEMPLATES.map((preset, index) => ({
                      ...preset,
                      id: `seeded-rule-${index}`,
                      isActive: true,
                      createdAt: new Date().toISOString()
                    }));
                    saveRulesToStore(seeded);
                  }
                }}
                className="text-[10px] font-sans text-gray-500 hover:text-white flex items-center gap-1 transition cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>بازنشانی پیش‌فرض‌ها</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {evaluatedRules.map((rule) => {
                const style = getSignalBadgeStyle(rule.actionSignal);
                
                return (
                  <div
                    key={rule.id}
                    className={`glass-panel rounded-xl p-4 border transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      !rule.isActive 
                        ? "border-gray-950 bg-black/5 opacity-40 hover:opacity-60" 
                        : rule.isTriggered 
                          ? "border-rose-500/20 bg-gradient-to-r from-rose-950/10 to-gray-950/80 shadow-[0_0_15px_rgba(239,68,68,0.03)]" 
                          : "border-white/5 bg-black/20"
                    }`}
                  >
                    {/* Visual glowing bar indicating trigger state */}
                    {rule.isActive && rule.isTriggered && (
                      <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-rose-500 to-amber-500"></div>
                    )}

                    <div className="space-y-2 flex-1 text-right">
                      <div className="flex items-center gap-2 justify-start">
                        <h4 className="text-xs font-extrabold text-white leading-tight font-sans">
                          {rule.name}
                        </h4>
                        <span className={`text-[8px] font-bold px-1.5 rounded data-value text-[11px] uppercase shrink-0 ${style}`}>
                          {rule.actionSignal === "BUY" ? "خرید" : rule.actionSignal === "SELL" ? "فروش" : "هشدار"}
                        </span>
                      </div>

                      {/* Mathematical logic display */}
                      <div className="text-[10px] data-value text-[11px] text-gray-500 space-y-1">
                        <div className="flex flex-wrap items-center gap-1 leading-normal justify-start">
                          <span className="text-gray-400">اگر</span>
                          <span className="text-[var(--accent-gold)] font-bold">{rule.cond1Metric.toUpperCase()}</span>
                          <span className="text-gray-400">({formatMetricDisplay(rule.cond1Metric, rule.val1)})</span>
                          <span className="font-bold text-white">{rule.cond1Op}</span>
                          <span className="text-indigo-400 font-bold">{rule.cond1Value.toLocaleString()}</span>

                          {rule.cond2Metric !== "none" && (
                            <>
                              <span className="text-[var(--accent-gold)] font-extrabold ml-1">{rule.conditionType === "and" ? "و" : "یا"}</span>
                              <span className="text-[var(--accent-gold)] font-bold">{rule.cond2Metric.toUpperCase()}</span>
                              <span className="text-gray-400">({formatMetricDisplay(rule.cond2Metric, rule.val2)})</span>
                              <span className="font-bold text-white">{rule.cond2Op}</span>
                              <span className="text-indigo-400 font-bold">{rule.cond2Value.toLocaleString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Operational control buttons */}
                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      
                      {/* Trigger status display */}
                      {rule.isActive && (
                        <div className="mr-2 data-value text-[11px] text-right">
                          {rule.isTriggered ? (
                            <span className="text-[10px] font-extrabold text-[var(--accent-crimson)] animate-pulse bg-[var(--accent-crimson)]/10 border border-rose-500/20 px-2 py-0.5 rounded uppercase">
                              فعال‌شده
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-500 bg-white/5/60 border border-white/10/80 px-2 py-0.5 rounded uppercase">
                              در انتظار شرط
                            </span>
                          )}
                        </div>
                      )}

                      {/* Active Toggle */}
                      <button
                        onClick={() => toggleRuleActive(rule.id)}
                        className={`h-7 w-7 rounded-lg border flex items-center justify-center transition cursor-pointer ${
                          rule.isActive 
                            ? "bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] border-[var(--accent-gold)]/20 hover:brightness-110" 
                            : "bg-black/40 text-gray-600 border-white/5 hover:text-white"
                        }`}
                        title={rule.isActive ? "غیرفعال کردن استراتژی" : "فعال کردن استراتژی"}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="h-7 w-7 rounded-lg border border-white/5 bg-black/40 text-gray-600 hover:text-[var(--accent-crimson)] hover:border-rose-500/20 transition flex items-center justify-center cursor-pointer"
                        title="حذف استراتژی"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                    </div>
                  </div>
                );
              })}

              {evaluatedRules.length === 0 && (
                <div className="py-12 text-center text-gray-500 text-xs font-sans bg-black/5 border border-white/5 rounded-2xl">
                  هیچ استراتژی‌ای ساخته نشده است. از بوم کناری یا الگوهای پیش‌فرض برای شروع استفاده کنید.
                </div>
              )}
            </div>

          </div>

          {/* Quick Informational Notice */}
          <div className="p-3 bg-[var(--accent-gold)]/5 border border-amber-500/10 rounded-xl text-[10px] font-sans text-gray-500 leading-normal flex gap-2 text-right">
            <Info className="h-4 w-4 text-[var(--accent-gold)] shrink-0 mt-0.5" />
            <span>
              استراتژی‌های پیکربندی‌شده بر روی این داشبورد به طور زنده با آخرین قیمت‌ها تطبیق داده می‌شوند. سیگنال‌های صادرشده جهت بهبود پیش‌بینی‌ها مستقیماً به هوش مصنوعی تحلیل‌گر تزریق می‌شوند.
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}

export default React.memo(StrategyBuilder);
