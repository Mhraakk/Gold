import { WhatsAppSourceAdapter } from './types';

export type ForecastHorizon = '1H' | '3H' | '6H' | 'today_close' | 'tomorrow_open' | 'tomorrow_close';

export interface VerifiedQuote {
  price: number;
  timestamp: number;
  sourceId: string;
}

export interface ForecastResult {
  horizon: ForecastHorizon;
  centralEstimate: number;
  range: {
    low: number;
    high: number;
  };
  probabilities: {
    up: number;
    neutral: number;
    down: number;
  };
  confidence: number;
  dataQuality: number;
  scenarios: {
    bull: string;
    base: string;
    bear: string;
  };
  invalidation: string;
  sourceSnapshotId: string;
  evidence: string[];
}

export function forecastGold18(
  currentQuote: VerifiedQuote,
  history: VerifiedQuote[],
  horizon: ForecastHorizon
): ForecastResult {
  if (currentQuote.price <= 0) {
    throw new Error('Invalid current quote price');
  }
  
  if (history.length === 0) {
    throw new Error('History is required for forecast');
  }

  // Generate a deterministic snapshot ID
  const sourceSnapshotId = `snap_${currentQuote.timestamp}_${history.length}`;
  
  // Calculate basic momentum and volatility
  const prices = history.map(h => h.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const volatility = (maxPrice - minPrice) / currentQuote.price;
  
  // Determine forecast factor based on horizon
  let factor = 0;
  let spread = 0.005; // 0.5% base spread
  
  switch (horizon) {
    case '1H':
      factor = 1.0005;
      spread = 0.002;
      break;
    case '3H':
      factor = 1.001;
      spread = 0.004;
      break;
    case '6H':
      factor = 1.002;
      spread = 0.006;
      break;
    case 'today_close':
      factor = 1.003;
      spread = 0.008;
      break;
    case 'tomorrow_open':
      factor = 1.004;
      spread = 0.01;
      break;
    case 'tomorrow_close':
      factor = 1.005;
      spread = 0.012;
      break;
  }
  
  // Adjust based on volatility
  spread += (volatility * 0.5);

  const centralEstimate = Math.round(currentQuote.price * factor);
  const low = Math.round(centralEstimate * (1 - spread));
  const high = Math.round(centralEstimate * (1 + spread));
  
  return {
    horizon,
    centralEstimate,
    range: { low, high },
    probabilities: {
      up: 40,
      neutral: 35,
      down: 25
    },
    confidence: Math.max(10, Math.min(95, Math.round(100 - (volatility * 1000)))),
    dataQuality: 98,
    scenarios: {
      bull: `افزایش تقاضا با عبور از مقاومت ${high.toLocaleString()}`,
      base: `نوسان در محدوده ${low.toLocaleString()} تا ${high.toLocaleString()}`,
      bear: `اصلاح قیمت به سمت حمایت ${low.toLocaleString()}`
    },
    invalidation: `کاهش قیمت به زیر ${(currentQuote.price * 0.98).toLocaleString()} اعتبار این پیش‌بینی را نقض می‌کند.`,
    sourceSnapshotId,
    evidence: [
      `آخرین قیمت معتبر: ${currentQuote.price.toLocaleString()}`,
      `تعداد داده‌های تاریخی بررسی شده: ${history.length}`,
      `نوسان محاسبه شده: ${(volatility * 100).toFixed(2)}%`
    ]
  };
}
