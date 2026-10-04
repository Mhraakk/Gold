import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, ShieldAlert, CheckCircle2, TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import { analyzeMazanehLongTerm } from '../lib/analysis/mazanehLongTerm';
import type { AnalysisInput, MazanehAnalysisResult, VerifiedTick } from '../lib/analysis/mazanehLongTerm/types';

export default function MazanehDealerDecisionDesk() {
  const [result, setResult] = useState<MazanehAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hourly melted-gold closes recorded by the server from live TGJU quotes
    // (Toman), converted to IRR ticks for the deterministic engine.
    const runAnalysis = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/market/history?asset=mesghal&days=7&bucketMinutes=60");
        const history = await res.json();
        const ticks: VerifiedTick[] = (history.points || []).map((p: { t: number; v: number }, i: number) => ({
          id: `tick_${i}`,
          timestamp: p.t,
          priceString: Math.round(p.v * 10).toString(),
          assetKey: "melted_gold",
          isCash: true
        }));

        const input: AnalysisInput = {
          horizon: "1W",
          mazannehTicks: ticks,
          driverSeries: {
            GOLD_18K: []
          }
        };

        setResult(analyzeMazanehLongTerm(input));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    runAnalysis();
  }, []);

  if (loading) {
    return (
      <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl p-6 flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-gold)]"></div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl p-6 text-right direction-rtl font-sans text-gray-200">
      <div className="flex items-center justify-between mb-6 border-b border-[var(--border-subtle)] pb-4">
        <h2 className="text-xl font-bold text-[var(--accent-gold)] flex items-center gap-2">
          <Target className="w-6 h-6" />
          میز تصمیم‌گیری دیلر مظنه (لانگ‌ترم)
        </h2>
        {result.isEligible ? (
          <div className="text-xs bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 font-mono text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            تایید شده (Verified Cash)
          </div>
        ) : (
          <div className="text-xs bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-500/20 font-mono text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            رد صلاحیت شده
          </div>
        )}
      </div>

      {!result.isEligible ? (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <div className="font-bold mb-1">عدم دسترسی به تحلیل (Ineligible)</div>
            <div className="text-xs">
              {result.ineligibilityReason?.startsWith("Insufficient verified history")
                ? "تاریخچه کافی ثبت نشده است: این تحلیل به حداقل ۱۰ قیمت ساعتی آبشده نیاز دارد که سرور از داده زنده ثبت می‌کند. چند ساعت پس از روشن ماندن سرور در دسترس خواهد بود."
                : result.ineligibilityReason}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-black/30 rounded-xl p-4 border border-white/5">
              <span className="text-xs text-gray-500 block mb-1">ساختار بازار</span>
              <span className="text-sm font-bold text-white flex items-center gap-2">
                {result.marketStructure === 'Bullish' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                {result.marketStructure === 'Bearish' && <TrendingDown className="w-4 h-4 text-red-400" />}
                {result.marketStructure === 'Ranging' && <Minus className="w-4 h-4 text-gray-400" />}
                {result.marketStructure}
              </span>
            </div>
            <div className="bg-black/30 rounded-xl p-4 border border-white/5">
              <span className="text-xs text-gray-500 block mb-1">قدرت روند</span>
              <span className="text-sm font-bold text-white">{result.trend}</span>
            </div>
            <div className="bg-black/30 rounded-xl p-4 border border-white/5">
              <span className="text-xs text-gray-500 block mb-1">نوسان محاسبه شده</span>
              <span className="text-sm font-bold text-white font-mono">{result.volatility.toFixed(2)}%</span>
            </div>
            <div className="bg-black/30 rounded-xl p-4 border border-white/5">
              <span className="text-xs text-gray-500 block mb-1">هم‌گرایی درایورها</span>
              <span className="text-sm font-bold text-white">{result.driversAlignment}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
               <h3 className="text-sm font-bold text-gray-300">سطوح کلیدی (فیبوناچی)</h3>
               <div className="bg-black/20 rounded-xl p-4 border border-white/5 space-y-2 font-mono text-xs">
                 {Object.entries(result.fibonacciLevels).map(([level, val]) => (
                   <div key={level} className="flex justify-between border-b border-white/5 pb-1">
                     <span className="text-gray-500">Fib {level}</span>
                     <span className="text-[var(--accent-gold)]">
                       {(Number(val) / 10).toLocaleString()} تومان
                     </span>
                   </div>
                 ))}
               </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-300">احتمالات بلندمدت</h3>
              <div className="space-y-3 bg-black/20 rounded-xl p-4 border border-white/5">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-emerald-400">صعودی (Target: {(Number(result.scenarios.bullishTarget)/10).toLocaleString()})</span>
                    <span className="font-mono">{result.scenarios.bullishProbability}%</span>
                  </div>
                  <div className="h-2 bg-black rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${result.scenarios.bullishProbability}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">خنثی / بدون مزیت</span>
                    <span className="font-mono">{result.scenarios.neutralProbability}%</span>
                  </div>
                  <div className="h-2 bg-black rounded-full overflow-hidden">
                    <div className="h-full bg-gray-500" style={{ width: `${result.scenarios.neutralProbability}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-red-400">نزولی (Target: {(Number(result.scenarios.bearishTarget)/10).toLocaleString()})</span>
                    <span className="font-mono">{result.scenarios.bearishProbability}%</span>
                  </div>
                  <div className="h-2 bg-black rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: `${result.scenarios.bearishProbability}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 bg-black/50 border border-white/5 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-gray-400 mb-2">مدارک تایید اعتبار داده‌ها (Evidence)</div>
            <ul className="list-disc list-inside text-xs text-gray-500 space-y-1">
              {result.evidence.map((ev, i) => (
                <li key={i}>{ev}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mt-6 bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[10px] leading-relaxed text-blue-200/80">
          <strong>سلب مسئولیت (Disclaimer):</strong> این موتور هیچ‌گونه سیگنال تضمینی تولید نمی‌کند و فقط مبتنی بر کشف گپ‌ها، شکست ساختار و سطوح قطعی ریاضی از طریق تیک‌های ریالی تایید شده (Cash) مظنه عمل می‌کند.
        </p>
      </div>
    </div>
  );
}
