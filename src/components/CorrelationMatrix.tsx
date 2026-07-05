import React, { useMemo } from 'react';
import { Activity, ShieldAlert, ArrowRightLeft } from 'lucide-react';

export default function CorrelationMatrix() {
  // Using static realistic correlation data for demonstration
  // In a real app, this would be computed from historical price arrays
  const assets = [
    { id: 'GOLD_18K', label: 'طلای ۱۸ عیار' },
    { id: 'XAUUSD', label: 'اونس جهانی' },
    { id: 'USDTIRT', label: 'تتر (دلار)' }
  ];

  const correlationData = {
    'GOLD_18K': { 'GOLD_18K': 1.0, 'XAUUSD': 0.82, 'USDTIRT': 0.94 },
    'XAUUSD': { 'GOLD_18K': 0.82, 'XAUUSD': 1.0, 'USDTIRT': -0.12 },
    'USDTIRT': { 'GOLD_18K': 0.94, 'XAUUSD': -0.12, 'USDTIRT': 1.0 }
  };

  const getHeatmapColor = (value: number) => {
    if (value === 1) return 'bg-gray-800 text-gray-400 border-gray-700'; // Self
    if (value > 0.8) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'; // Strong positive
    if (value > 0.5) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'; // Moderate positive
    if (value > 0) return 'bg-gray-500/10 text-gray-300 border-gray-500/20'; // Weak positive
    if (value > -0.5) return 'bg-red-500/10 text-red-300 border-red-500/20'; // Weak negative
    return 'bg-red-500/20 text-red-400 border-red-500/30'; // Strong negative
  };

  return (
    <div className="glass-panel lux-card rounded-2xl p-6 flex flex-col gap-4 text-right direction-rtl overflow-hidden relative">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
        <h3 className="font-display font-semibold text-xl lux-gradient-text tracking-wide flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-[var(--accent-gold)]" />
          ماتریس همبستگی (Correlation Matrix)
        </h3>
        <div className="text-[10px] bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] px-2 py-1 rounded border border-[var(--accent-gold)]/20 font-bold uppercase tracking-widest">
          Hedging Analysis
        </div>
      </div>
      
      <p className="text-sm text-[var(--text-secondary)] font-sans leading-relaxed max-w-2xl">
        بررسی همبستگی تاریخی بین طلای داخلی، اونس جهانی و نرخ ارز برای کشف فرصت‌های پوشش ریسک (Hedging). همبستگی نزدیک به ۱ نشان‌دهنده حرکت کاملاً همسو و همبستگی منفی نشان‌دهنده حرکت معکوس است.
      </p>

      <div className="overflow-x-auto mt-2">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-[11px] font-sans text-gray-500 border-b border-[var(--border-subtle)] font-medium">دارایی</th>
              {assets.map(a => (
                <th key={a.id} className="p-3 text-[11px] font-sans text-gray-300 border-b border-[var(--border-subtle)] font-semibold whitespace-nowrap text-center">
                  {a.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map(rowAsset => (
              <tr key={rowAsset.id}>
                <td className="p-3 text-sm font-sans text-white border-b border-[var(--border-subtle)]/50 whitespace-nowrap font-medium">
                  {rowAsset.label}
                  <span className="block text-[9px] text-gray-500 font-mono mt-0.5">{rowAsset.id}</span>
                </td>
                {assets.map(colAsset => {
                  const val = correlationData[rowAsset.id as keyof typeof correlationData][colAsset.id as keyof typeof correlationData];
                  return (
                    <td key={colAsset.id} className="p-2 border-b border-[var(--border-subtle)]/50">
                      <div className={`w-full flex items-center justify-center p-2 rounded-lg border font-mono text-sm font-bold transition-all duration-300 hover:scale-105 cursor-default ${getHeatmapColor(val)}`}>
                        {val.toFixed(2)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-[10px] leading-relaxed text-blue-200/80 font-sans">
          <strong className="text-blue-300 block mb-1">نتیجه‌گیری سیستمی پوشش ریسک:</strong>
          طلای ۱۸ عیار همبستگی بسیار بالایی (۰.۹۴) با تتر دارد. در مواقع افت اونس جهانی (مانند همبستگی منفی -۰.۱۲)، طلای داخلی عمدتاً به دلیل حفظ ارزش دلار، از ریزش شدید در امان می‌ماند. برای هجینگ پورتفوی طلای داخلی، پوزیشن‌های شورت استراتژیک روی تتر توصیه نمی‌شود مگر در سناریوهای افت همزمان اونس و دلار.
        </div>
      </div>
    </div>
  );
}
