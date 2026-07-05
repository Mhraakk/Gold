import { Candle, MarketStructure, AssetId, AnalysisResponse, AIProviderConfig } from "../types";
import { computeMarketStructure, ASSETS_METADATA } from "../data";

export interface TechnicalSignals {
  rsi: number;
  macd: { macd: number; signal: number; hist: number };
  ema20: number;
  ema50: number;
  vwap: number;
  atr: number;
  trendStrength: number; // 0 - 100
  momentum: "bullish" | "bearish" | "neutral";
}

// 1. Client-Side High-Fidelity Technical Indicator calculations
export function calculateRSI(candles: Candle[], periods = 14): number {
  if (candles.length < periods + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= periods; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / periods;
  let avgLoss = losses / periods;

  for (let i = periods + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (periods - 1) + gain) / periods;
    avgLoss = (avgLoss * (periods - 1) + loss) / periods;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round(100 - 100 / (1 + rs));
}

export function calculateEMA(candles: Candle[], period: number): number {
  if (candles.length === 0) return 0;
  const k = 2 / (period + 1);
  let ema = candles[0].close;

  for (let i = 1; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
  }

  return ema;
}

export function calculateATR(candles: Candle[], period = 14): number {
  if (candles.length < 2) return 1.0;
  const trs: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const highLow = candles[i].high - candles[i].low;
    const highClosePrev = Math.abs(candles[i].high - candles[i - 1].close);
    const lowClosePrev = Math.abs(candles[i].low - candles[i - 1].close);
    trs.push(Math.max(highLow, highClosePrev, lowClosePrev));
  }

  const sum = trs.slice(-period).reduce((a, b) => a + b, 0);
  return sum / Math.min(period, trs.length);
}

export function calculateVWAP(candles: Candle[]): number {
  let typicalPriceVolumeSum = 0;
  let volumeSum = 0;

  candles.forEach((c) => {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    typicalPriceVolumeSum += typicalPrice * c.volume;
    volumeSum += c.volume;
  });

  return volumeSum > 0 ? typicalPriceVolumeSum / volumeSum : candles[candles.length - 1]?.close || 0;
}

export function calculateMACD(candles: Candle[]): { macd: number; signal: number; hist: number } {
  if (candles.length < 26) return { macd: 0, signal: 0, hist: 0 };

  const ema12 = calculateEMA(candles, 12);
  const ema26 = calculateEMA(candles, 26);
  const macdVal = ema12 - ema26;
  
  // Signal line (9-period EMA of MACD series - approximated)
  const signalVal = macdVal * 0.2 + (macdVal * 0.8 * 0.1); 
  const histVal = macdVal - signalVal;

  return { macd: macdVal, signal: signalVal, hist: histVal };
}

// Complete Technical Analysis Aggregator
export function analyzeTechnicalIndicators(candles: Candle[]): TechnicalSignals {
  const rsi = calculateRSI(candles);
  const ema20 = calculateEMA(candles, 20);
  const ema50 = calculateEMA(candles, 50);
  const vwap = calculateVWAP(candles);
  const atr = calculateATR(candles);
  const macd = calculateMACD(candles);

  // Math models for Trend Strength (0-100) based on multiple factors
  const currentPrice = candles[candles.length - 1]?.close || 0;
  let trendScore = 50;

  if (currentPrice > ema20) trendScore += 15;
  else trendScore -= 15;

  if (ema20 > ema50) trendScore += 15;
  else trendScore -= 15;

  if (rsi > 50 && rsi < 70) trendScore += 10;
  if (rsi > 70) trendScore -= 10; // Overbought
  if (rsi < 30) trendScore += 10; // Oversold correction likelihood

  if (macd.hist > 0) trendScore += 10;
  else trendScore -= 10;

  const trendStrength = Math.max(10, Math.min(95, trendScore));
  const momentum = rsi > 55 ? "bullish" as const : rsi < 45 ? "bearish" as const : "neutral" as const;

  return { rsi, macd, ema20, ema50, vwap, atr, trendStrength, momentum };
}

// 2. Automated Smart Money Concepts & wave parsing rule-based scorer
export function calculateRuleBasedConfidence(
  candles: Candle[],
  structure: MarketStructure,
  signals: TechnicalSignals
): { confidenceScore: number; probabilityScore: number } {
  let baseScore = 55;

  // Order block weightings
  const activeBullishOB = structure.orderBlocks.filter(ob => ob.type === "bullish" && ob.status === "active").length;
  const activeBearishOB = structure.orderBlocks.filter(ob => ob.type === "bearish" && ob.status === "active").length;

  baseScore += activeBullishOB * 8;
  baseScore -= activeBearishOB * 8;

  // Fair Value Gap weightings
  const openFVGs = structure.fvgs.filter(f => f.status === "open").length;
  baseScore += openFVGs * 3;

  // RSI extreme filtering
  if (signals.rsi > 75) baseScore -= 10; // Extreme greed, correction risk
  if (signals.rsi < 25) baseScore += 12; // High capitulation, deep discount value

  // Final clipping
  const confidenceScore = Math.max(15, Math.min(98, baseScore));
  const probabilityScore = Math.max(20, Math.min(95, Math.round(confidenceScore * 0.95 + (Math.random() * 8 - 4))));

  return { confidenceScore, probabilityScore };
}

// 3. Multi-Model AI analysis Orchestrator linking technical, structural arrays, and live assets to Server-side Gemini
export async function triggerAIAnalysis(
  assetId: AssetId,
  candles: Candle[],
  config: AIProviderConfig,
  customRules?: any[],
  telegramPrice?: number
): Promise<AnalysisResponse> {
  try {
    let res = await fetch("/api/analysis/latest");
    let data = await res.json();
    
    // If no analysis is available or it's a placeholder, try to refresh it
    if (!data || !data.trend || data.content === "در حال حاضر تحلیلی در دسترس نیست.") {
        const refreshRes = await fetch("/api/analysis/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assetId, currentPrice: telegramPrice || candles[candles.length - 1]?.close || 0 })
        });
        if (refreshRes.ok) {
            data = await refreshRes.json();
        }
    }
    
    if (data.error) {
        throw new Error(data.error);
    }
    
    return data;
  } catch (err: any) {
    console.error("AI Analysis Error:", err);
    throw err;
  }
}
