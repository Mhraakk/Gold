import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, ChevronDown, ChevronUp, Activity, BarChart2, CheckCircle2 } from 'lucide-react';
import type { ForecastResult, ForecastHorizon } from '../gold18Forecast';

const HORIZONS: { id: ForecastHorizon; label: string }[] = [
  { id: '1H', label: '۱ ساعته' },
  { id: '3H', label: '۳ ساعته' },
  { id: '6H', label: '۶ ساعته' },
  { id: 'today_close', label: 'بسته شدن امروز' },
  { id: 'tomorrow_open', label: 'گشایش فردا' },
  { id: 'tomorrow_close', label: 'بسته شدن فردا' }
];

export default function Gold18ForecastPanel() {
  const [activeHorizon, setActiveHorizon] = useState<ForecastHorizon>('1H');
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);

  useEffect(() => {
    fetchForecast();
  }, [activeHorizon]);

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/forecast/gold18?horizon=${activeHorizon}`);
      const data = await res.json();
      if (data.success) {
        setForecast(data.result);
      } else {
        setError(data.error || 'خطا در دریافت پیش‌بینی');
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl p-6 text-right direction-rtl font-sans text-gray-200">
      <div className="flex items-center justify-between mb-6 border-b border-[var(--border-subtle)] pb-4">
        <h2 className="text-xl font-bold text-[var(--accent-gold)] flex items-center gap-2">
          <Activity className="w-6 h-6" />
          موتور پیش‌بینی طلای ۱۸ عیار
        </h2>
        <div className="text-xs bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 font-mono text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          منبع داده تایید شده (Verified Live)
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 mb-6 pb-2 custom-scrollbar direction-rtl">
        {HORIZONS.map(h => (
          <button
            key={h.id}
            onClick={() => setActiveHorizon(h.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeHorizon === h.id
                ? 'bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] border border-[var(--accent-gold)]/50'
                : 'bg-black/20 text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            {h.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-gold)]"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {forecast && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 bg-black/30 rounded-xl p-5 border border-white/5">
              <span className="text-sm text-gray-400 block mb-1">تخمین مرکزی</span>
              <span className="text-3xl font-mono font-bold text-white">
                {forecast.centralEstimate.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500 mr-2">ریال / گرم</span>
            </div>
            
            <div className="md:col-span-2 bg-black/30 rounded-xl p-5 border border-white/5 flex flex-col justify-center">
              <span className="text-sm text-gray-400 block mb-2">محدوده نوسان مورد انتظار</span>
              <div className="flex items-center gap-4">
                <div className="flex-1 text-center">
                  <span className="text-sm font-mono text-red-400">{forecast.range.low.toLocaleString()}</span>
                  <div className="text-[10px] text-gray-500 mt-1">کف (حمایت)</div>
                </div>
                <div className="h-px bg-gradient-to-r from-red-500/20 via-gray-500 to-emerald-500/20 flex-1"></div>
                <div className="flex-1 text-center">
                  <span className="text-sm font-mono text-emerald-400">{forecast.range.high.toLocaleString()}</span>
                  <div className="text-[10px] text-gray-500 mt-1">سقف (مقاومت)</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                احتمالات روند
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-emerald-400">صعودی</span>
                    <span className="font-mono">{forecast.probabilities.up}%</span>
                  </div>
                  <div className="h-2 bg-black rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${forecast.probabilities.up}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">خنثی / رنج</span>
                    <span className="font-mono">{forecast.probabilities.neutral}%</span>
                  </div>
                  <div className="h-2 bg-black rounded-full overflow-hidden">
                    <div className="h-full bg-gray-500" style={{ width: `${forecast.probabilities.neutral}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-red-400">نزولی</span>
                    <span className="font-mono">{forecast.probabilities.down}%</span>
                  </div>
                  <div className="h-2 bg-black rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: `${forecast.probabilities.down}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-4">
                <div className="flex-1 bg-black/20 rounded-lg p-3 border border-white/5 text-center">
                  <div className="text-[10px] text-gray-500 mb-1">ضریب اطمینان مدل</div>
                  <div className="text-lg font-mono font-bold text-[var(--accent-gold)]">{forecast.confidence}%</div>
                </div>
                <div className="flex-1 bg-black/20 rounded-lg p-3 border border-white/5 text-center">
                  <div className="text-[10px] text-gray-500 mb-1">کیفیت داده‌ها</div>
                  <div className="text-lg font-mono font-bold text-blue-400">{forecast.dataQuality}%</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-300">سناریوهای حرکتی</h3>
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-lg text-xs leading-relaxed">
                <span className="text-emerald-400 font-bold block mb-1">سناریو صعودی (Bull):</span>
                {forecast.scenarios.bull}
              </div>
              <div className="bg-gray-500/5 border border-gray-500/20 p-3 rounded-lg text-xs leading-relaxed">
                <span className="text-gray-400 font-bold block mb-1">سناریو پایه (Base):</span>
                {forecast.scenarios.base}
              </div>
              <div className="bg-red-500/5 border border-red-500/20 p-3 rounded-lg text-xs leading-relaxed">
                <span className="text-red-400 font-bold block mb-1">سناریو نزولی (Bear):</span>
                {forecast.scenarios.bear}
              </div>
              <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-lg text-xs leading-relaxed">
                <span className="text-amber-400 font-bold block mb-1">نقطه ابطال تحلیل (Invalidation):</span>
                {forecast.invalidation}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
            <button 
              onClick={() => setShowEvidence(!showEvidence)}
              className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
            >
              {showEvidence ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              مدارک داده‌های ورودی (Evidence Drawer)
            </button>
            
            {showEvidence && (
              <div className="mt-3 bg-black/50 border border-white/5 rounded-xl p-4 space-y-2">
                <div className="text-xs font-mono text-gray-500 mb-2">Snapshot ID: {forecast.sourceSnapshotId}</div>
                <ul className="list-disc list-inside text-xs text-gray-400 space-y-1">
                  {forecast.evidence.map((ev, i) => (
                    <li key={i}>{ev}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[10px] leading-relaxed text-blue-200/80">
          <strong>سلب مسئولیت (Disclaimer):</strong> این یک ابزار تحلیل آماری و ریاضی است که صرفاً بر اساس داده‌های تایید شده تاریخی، نوسانات و محاسبات قطعی عمل می‌کند. هیچ‌گونه مداخله هوش مصنوعی در تولید اعداد قیمتی وجود ندارد و مدل‌های زبانی صرفاً برای تفسیر و توضیح نتایج در لایه‌های دیگر استفاده می‌شوند. این پیش‌بینی به هیچ وجه پیشنهاد خرید، فروش یا نگهداری دارایی نیست و مسئولیت هرگونه تصمیم‌گیری مالی بر عهده شخص کاربر می‌باشد.
        </p>
      </div>
    </div>
  );
}
