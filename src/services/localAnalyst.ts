// Built-in market analyst: a deterministic, data-driven engine that answers the
// app's AI requests without any external API. Every number it reports is
// computed from live quotes and the recorded price history; when a value cannot
// be measured, the engine says so instead of inventing it.

// ---------------------------------------------------------------------------
// Market data model
// ---------------------------------------------------------------------------

export type MarketKey =
  | "xauusd" | "usd" | "gold18" | "gold24" | "mesghal"
  | "emami" | "nim" | "rob" | "gerami" | "brent";

export interface MarketQuote {
  value: number;
  source: string;
  fetchedAt: number;
}

// Iranian prices are in Toman; xauusd and brent are in USD.
export interface MarketSnapshot {
  quotes: Partial<Record<MarketKey, MarketQuote>>;
  // Second, independent source for the same instrument (used to cross-check).
  crossChecks: Partial<Record<MarketKey, MarketQuote>>;
  takenAt: number;
}

export interface HistoryPoint {
  t: number;
  v: number;
}

export interface EngineContext {
  snapshot: MarketSnapshot;
  memory: MarketMemory;
}

export const MARKET_INFO: Record<MarketKey, { fa: string; unit: "تومان" | "دلار"; defaultDailyVolPct: number }> = {
  xauusd: { fa: "انس جهانی طلا", unit: "دلار", defaultDailyVolPct: 1.0 },
  usd: { fa: "دلار آزاد", unit: "تومان", defaultDailyVolPct: 1.5 },
  gold18: { fa: "طلای ۱۸ عیار (هر گرم)", unit: "تومان", defaultDailyVolPct: 1.4 },
  gold24: { fa: "طلای ۲۴ عیار (هر گرم)", unit: "تومان", defaultDailyVolPct: 1.4 },
  mesghal: { fa: "مثقال طلا (آبشده)", unit: "تومان", defaultDailyVolPct: 1.4 },
  emami: { fa: "سکه امامی", unit: "تومان", defaultDailyVolPct: 1.6 },
  nim: { fa: "نیم سکه", unit: "تومان", defaultDailyVolPct: 1.8 },
  rob: { fa: "ربع سکه", unit: "تومان", defaultDailyVolPct: 2.0 },
  gerami: { fa: "سکه گرمی", unit: "تومان", defaultDailyVolPct: 2.0 },
  brent: { fa: "نفت برنت", unit: "دلار", defaultDailyVolPct: 2.0 },
};

export const ASSET_ID_TO_KEY: Record<string, MarketKey> = {
  MELTED_GOLD: "mesghal",
  MESGHAL: "mesghal",
  GOLD_18K: "gold18",
  GOLD_GRAM: "gold18",
  GOLD_24K: "gold24",
  COIN_EMAMI: "emami",
  COIN_HALF: "nim",
  COIN_QUARTER: "rob",
  USDIRT: "usd",
  USDTIRT: "usd",
  XAUUSD: "xauusd",
  GOLD_FUTURES: "xauusd",
  GOLD_CFD: "xauusd",
  GOLD_ETF: "xauusd",
};

const OUNCE_GRAMS = 31.1035;
// Market convention: price of one mesghal of melted gold = 18k gram price × 4.3318
const MESGHAL_PER_GRAM18 = 4.3318;
// Pure gold content (grams) of Bank Markazi coins: weight × 0.900 fineness
const COIN_PURE_GOLD_GRAMS: Partial<Record<MarketKey, number>> = {
  emami: 8.133 * 0.9,
  nim: 4.0665 * 0.9,
  rob: 2.03325 * 0.9,
  gerami: 1.01 * 0.9,
};

const DISCLAIMER =
  "> این پاسخ را موتور تحلیلگر داخلی برنامه (بدون API خارجی) از روی داده‌های زنده محاسبه کرده است و توصیه سرمایه‌گذاری نیست.";

// ---------------------------------------------------------------------------
// Price memory
// ---------------------------------------------------------------------------

export class MarketMemory {
  private series: Partial<Record<MarketKey, HistoryPoint[]>> = {};

  constructor(private readonly maxPoints = 5000) {}

  record(snapshot: MarketSnapshot): void {
    for (const key of Object.keys(snapshot.quotes) as MarketKey[]) {
      const quote = snapshot.quotes[key];
      if (!quote || !(quote.value > 0) || !Number.isFinite(quote.value)) continue;
      const list = this.series[key] || (this.series[key] = []);
      const last = list[list.length - 1];
      const t = quote.fetchedAt;
      if (last) {
        if (t <= last.t) continue; // same quote seen again (cached)
        if (t - last.t < 50_000) continue;
        if (last.v === quote.value && t - last.t < 10 * 60_000) continue;
      }
      list.push({ t, v: quote.value });
      if (list.length > this.maxPoints) list.splice(0, list.length - this.maxPoints);
    }
  }

  get(key: MarketKey): HistoryPoint[] {
    return this.series[key] || [];
  }

  toJSON(): Partial<Record<MarketKey, HistoryPoint[]>> {
    return this.series;
  }

  load(data: unknown): void {
    if (!data || typeof data !== "object") return;
    for (const key of Object.keys(MARKET_INFO) as MarketKey[]) {
      const raw = (data as Record<string, unknown>)[key];
      if (!Array.isArray(raw)) continue;
      const points = raw
        .filter((p): p is HistoryPoint =>
          !!p && typeof p === "object" &&
          Number.isFinite((p as HistoryPoint).t) && Number.isFinite((p as HistoryPoint).v) && (p as HistoryPoint).v > 0)
        .sort((a, b) => a.t - b.t)
        .slice(-this.maxPoints);
      if (points.length) this.series[key] = points;
    }
  }
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

export interface SeriesStats {
  points: number;
  spanHours: number;
  first: number;
  last: number;
  changePct: number;
  high: number;
  low: number;
  dailyVolPct: number | null;
  slopePctPerDay: number | null;
  rsi: number | null;
  emaFast: number | null;
  emaSlow: number | null;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function ema(values: number[], period: number): number {
  const k = 2 / (period + 1);
  let out = values[0];
  for (let i = 1; i < values.length; i++) out = values[i] * k + out * (1 - k);
  return out;
}

export function rsi(values: number[], period = 14): number | null {
  if (values.length < period + 1) return null;
  const slice = values.slice(-(period + 1));
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < slice.length; i++) {
    const d = slice[i] - slice[i - 1];
    if (d > 0) gain += d;
    else loss -= d;
  }
  if (gain === 0 && loss === 0) return 50;
  if (loss === 0) return 100;
  const rs = gain / loss;
  return 100 - 100 / (1 + rs);
}

export function seriesStats(points: HistoryPoint[]): SeriesStats | null {
  if (points.length < 2) return null;
  const values = points.map((p) => p.v);
  const first = values[0];
  const last = values[values.length - 1];
  const spanHours = (points[points.length - 1].t - points[0].t) / 3_600_000;

  // Realized volatility per unit of wall-clock time, scaled to one day.
  let sumSq = 0;
  let hours = 0;
  for (let i = 1; i < points.length; i++) {
    const dtH = (points[i].t - points[i - 1].t) / 3_600_000;
    if (dtH <= 0) continue;
    const r = Math.log(points[i].v / points[i - 1].v);
    sumSq += r * r;
    hours += dtH;
  }
  const dailyVolPct = points.length >= 8 && spanHours >= 1 && hours > 0
    ? clamp(Math.sqrt((sumSq / hours) * 24) * 100, 0.2, 8)
    : null;

  // Log-linear regression slope over the most recent 72 hours.
  const lastT = points[points.length - 1].t;
  const recent = points.filter((p) => lastT - p.t <= 72 * 3_600_000);
  let slopePctPerDay: number | null = null;
  const recentSpanH = recent.length > 1 ? (recent[recent.length - 1].t - recent[0].t) / 3_600_000 : 0;
  if (recent.length >= 6 && recentSpanH >= 1) {
    const xs = recent.map((p) => (p.t - recent[0].t) / 86_400_000);
    const ys = recent.map((p) => Math.log(p.v));
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const my = ys.reduce((a, b) => a + b, 0) / ys.length;
    let cov = 0;
    let varX = 0;
    for (let i = 0; i < xs.length; i++) {
      cov += (xs[i] - mx) * (ys[i] - my);
      varX += (xs[i] - mx) ** 2;
    }
    if (varX > 0) slopePctPerDay = (Math.exp(cov / varX) - 1) * 100;
  }

  return {
    points: points.length,
    spanHours,
    first,
    last,
    changePct: (last / first - 1) * 100,
    high: Math.max(...values),
    low: Math.min(...values),
    dailyVolPct,
    slopePctPerDay,
    rsi: rsi(values),
    emaFast: values.length >= 10 ? ema(values, Math.min(12, values.length)) : null,
    emaSlow: values.length >= 10 ? ema(values, Math.min(26, values.length)) : null,
  };
}

function swingLevels(values: number[]): { lows: number[]; highs: number[] } {
  const lows: number[] = [];
  const highs: number[] = [];
  if (values.length < 15) return { lows, highs };
  const w = Math.max(2, Math.floor(values.length / 25));
  for (let i = w; i < values.length - w; i++) {
    const win = values.slice(i - w, i + w + 1);
    if (values[i] === Math.min(...win)) lows.push(values[i]);
    if (values[i] === Math.max(...win)) highs.push(values[i]);
  }
  return { lows, highs };
}

// ---------------------------------------------------------------------------
// Fundamentals (intrinsic value vs. market price)
// ---------------------------------------------------------------------------

export interface Fundamentals {
  pureGramUsd: number | null;
  theoretical: Partial<Record<MarketKey, number>>;
  bubblePct: Partial<Record<MarketKey, number>>;
  impliedUsd: number | null;
  usdGapPct: number | null;
}

export function computeFundamentals(snapshot: MarketSnapshot): Fundamentals {
  const q = snapshot.quotes;
  const xau = q.xauusd?.value;
  const usd = q.usd?.value;
  const result: Fundamentals = { pureGramUsd: null, theoretical: {}, bubblePct: {}, impliedUsd: null, usdGapPct: null };
  if (!(xau && xau > 0)) return result;
  const pureGramUsd = xau / OUNCE_GRAMS;
  result.pureGramUsd = pureGramUsd;

  if (q.gold18?.value) {
    result.impliedUsd = q.gold18.value / (pureGramUsd * 0.75);
    if (usd) result.usdGapPct = (result.impliedUsd / usd - 1) * 100;
  }
  if (!(usd && usd > 0)) return result;

  const pureGramToman = pureGramUsd * usd;
  const theoretical: Partial<Record<MarketKey, number>> = {
    gold24: pureGramToman,
    gold18: pureGramToman * 0.75,
    mesghal: pureGramToman * 0.75 * MESGHAL_PER_GRAM18,
  };
  for (const [key, grams] of Object.entries(COIN_PURE_GOLD_GRAMS) as [MarketKey, number][]) {
    theoretical[key] = pureGramToman * grams;
  }
  result.theoretical = theoretical;
  for (const [key, value] of Object.entries(theoretical) as [MarketKey, number][]) {
    const market = q[key]?.value;
    if (market) result.bubblePct[key] = (market / value - 1) * 100;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Formatting & units
// ---------------------------------------------------------------------------

export function formatNumber(n: number, maxFractionDigits = 0): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: maxFractionDigits });
}

export function formatPct(p: number, digits = 2): string {
  return `${p >= 0 ? "+" : ""}${p.toFixed(digits)}٪`;
}

export function niceRound(v: number): number {
  if (!Number.isFinite(v) || v === 0) return v;
  const mag = Math.floor(Math.log10(Math.abs(v)));
  const step = Math.pow(10, Math.max(0, mag - 3));
  return Math.round(v / step) * step;
}

const SCALE_FACTORS = [1, 0.1, 10, 0.01, 100];

/**
 * Returns the power-of-ten factor that brings `value` closest to `reference`
 * (e.g. 0.1 when `value` is in Rial and `reference` in Toman), or null when no
 * factor lands within `tolerance` of the reference.
 */
export function alignScale(value: number, reference: number, tolerance = 1.6): number | null {
  if (!(value > 0) || !(reference > 0)) return null;
  let best: number | null = null;
  let bestDist = Infinity;
  for (const f of SCALE_FACTORS) {
    const d = Math.abs(Math.log((value * f) / reference));
    if (d < bestDist) {
      bestDist = d;
      best = f;
    }
  }
  return bestDist <= Math.log(tolerance) ? best : null;
}

function formatPrice(value: number, key: MarketKey): string {
  const info = MARKET_INFO[key];
  return `${formatNumber(value, info.unit === "دلار" ? 2 : 0)} ${info.unit}`;
}

function ageText(fetchedAt: number, now: number): string {
  const s = Math.max(0, Math.round((now - fetchedAt) / 1000));
  if (s < 90) return "لحظاتی پیش";
  if (s < 3600) return `${Math.round(s / 60)} دقیقه پیش`;
  return `${Math.round(s / 3600)} ساعت پیش`;
}

// ---------------------------------------------------------------------------
// Persian text helpers
// ---------------------------------------------------------------------------

export function normalizeFa(text: string): string {
  return String(text || "")
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[آأإ]/g, "ا")
    .replace(/ـ/g, "")
    .replace(/‌/g, " ")
    .replace(/٬/g, ",")
    .replace(/(\d)،(\d)/g, "$1,$2")
    .replace(/٫/g, ".")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

interface NumberToken {
  value: number;
  index: number;
}

function extractNumbers(text: string): NumberToken[] {
  const re = /(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(?:\s*(میلیارد|میلیون|هزار))?(?:\s*و\s*(\d{1,3}(?:,\d{3})*|\d+)\s*هزار)?/g;
  const out: NumberToken[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    let value = parseFloat(m[1].replace(/,/g, "") + (m[2] ? `.${m[2]}` : ""));
    const mult = m[3] === "میلیارد" ? 1e9 : m[3] === "میلیون" ? 1e6 : m[3] === "هزار" ? 1e3 : 1;
    value *= mult;
    if (m[4] && mult >= 1e6) value += parseFloat(m[4].replace(/,/g, "")) * 1e3;
    if (Number.isFinite(value)) out.push({ value, index: m.index });
  }
  return out;
}

function hasWord(text: string, word: string): number {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = new RegExp(`(^|[^\\p{L}])${escaped}(?=[^\\p{L}]|$)`, "u").exec(text);
  return m ? m.index + m[1].length : -1;
}

// ---------------------------------------------------------------------------
// Text parsing (replaces /api/forecast/parse)
// ---------------------------------------------------------------------------

export type ParsedMarketFields = Partial<
  Record<"meltedGold" | "gold18k" | "emamiCoin" | "usdtIrt" | "usdIrt" | "xauusd", number>
>;

const PARSE_FIELDS: { field: keyof ParsedMarketFields; keywords: string[]; valid: (n: number) => boolean }[] = [
  { field: "meltedGold", keywords: ["ابشده", "اب شده", "مظنه", "مثقال", "ذوب"], valid: (n) => n >= 1000 },
  { field: "gold18k", keywords: ["گرم طلا", "18 عیار", "طلای 18", "طلا 18", "گرم 18"], valid: (n) => n >= 1000 },
  { field: "emamiCoin", keywords: ["سکه امامی", "امامی", "سکه تمام", "سکه حواله", "سکه"], valid: (n) => n >= 1000 },
  { field: "usdtIrt", keywords: ["تتر", "usdt"], valid: (n) => n >= 1000 },
  { field: "usdIrt", keywords: ["دلار"], valid: (n) => n >= 1000 },
  { field: "xauusd", keywords: ["انس", "اونس", "xau", "ounce"], valid: (n) => n >= 500 && n <= 20000 },
];

export function parseMarketText(text: string): ParsedMarketFields {
  const norm = normalizeFa(text);
  const numbers = extractNumbers(norm);

  type Hit = { field: keyof ParsedMarketFields; start: number; end: number };
  const hits: Hit[] = [];
  for (const { field, keywords } of PARSE_FIELDS) {
    for (const kw of keywords) {
      let from = 0;
      let idx: number;
      while ((idx = norm.indexOf(kw, from)) !== -1) {
        from = idx + kw.length;
        const before = norm.slice(Math.max(0, idx - 6), idx);
        if (field === "emamiCoin" && kw === "سکه" && /(نیم|ربع|گرمی)\s*$/.test(before)) continue;
        if (field === "emamiCoin" && kw === "سکه" && /^سکه\s*(نیم|ربع|گرمی)/.test(norm.slice(idx))) continue;
        if (field === "usdIrt" && /شاخص\s*$/.test(before)) continue;
        hits.push({ field, start: idx, end: idx + kw.length });
      }
    }
  }
  // Drop hits nested inside a longer hit (e.g. "سکه" inside "سکه امامی").
  const kept = hits
    .filter((h) => !hits.some((o) => o !== h && o.start <= h.start && o.end >= h.end && o.end - o.start > h.end - h.start))
    .sort((a, b) => a.start - b.start);

  const result: ParsedMarketFields = {};
  kept.forEach((hit, i) => {
    if (result[hit.field] !== undefined) return;
    const limit = Math.min(hit.end + 60, kept[i + 1]?.start ?? Infinity);
    const spec = PARSE_FIELDS.find((f) => f.field === hit.field)!;
    const num = numbers.find((n) => n.index >= hit.end && n.index < limit && spec.valid(n.value));
    if (num) result[hit.field] = num.value;
  });
  return result;
}

// ---------------------------------------------------------------------------
// Asset analysis core
// ---------------------------------------------------------------------------

export type Trend = "BULLISH" | "BEARISH" | "CONSOLIDATION";

export interface AssetView {
  key: MarketKey;
  label: string;
  price: number;
  unitLabel: string;
  stats: SeriesStats | null;
  volPct: number;
  volIsMeasured: boolean;
  trend: Trend;
  score: number;
  reasons: string[];
  supports: number[];
  resistances: number[];
  bubblePct: number | null;
  confidence: number;
  sourceAgreementPct: number | null;
}

export function analyzeAsset(key: MarketKey, price: number, unitLabel: string, ctx: EngineContext): AssetView {
  const history = ctx.memory.get(key);
  const stats = seriesStats(history);
  const volIsMeasured = stats?.dailyVolPct != null;
  const volPct = stats?.dailyVolPct ?? MARKET_INFO[key].defaultDailyVolPct;
  const fundamentals = computeFundamentals(ctx.snapshot);
  const bubblePct = fundamentals.bubblePct[key] ?? null;
  const reasons: string[] = [];
  let score = 0;

  if (stats?.slopePctPerDay != null) {
    score += 40 * clamp(stats.slopePctPerDay / volPct, -1, 1);
    reasons.push(`شیب روند ثبت‌شده: **${formatPct(stats.slopePctPerDay)} در روز** (بر پایه ${stats.points} نقطه قیمت در ${stats.spanHours.toFixed(1)} ساعت)`);
  } else {
    reasons.push("تاریخچه قیمت هنوز برای محاسبه شیب روند کافی نیست؛ با ادامه کار سرور دقیق‌تر می‌شود.");
  }
  if (stats?.emaFast != null && stats.emaSlow != null) {
    const gapPct = (stats.emaFast / stats.emaSlow - 1) * 100;
    score += 20 * clamp(gapPct / volPct, -1, 1);
    reasons.push(`میانگین متحرک کوتاه‌مدت ${gapPct >= 0 ? "بالای" : "زیر"} میانگین بلندمدت است (${formatPct(gapPct)}).`);
  }
  if (stats?.rsi != null) {
    if (stats.rsi > 70) {
      score -= 10;
      reasons.push(`RSI برابر **${stats.rsi.toFixed(0)}**: محدوده اشباع خرید، احتمال اصلاح کوتاه‌مدت.`);
    } else if (stats.rsi < 30) {
      score += 10;
      reasons.push(`RSI برابر **${stats.rsi.toFixed(0)}**: محدوده اشباع فروش، احتمال برگشت کوتاه‌مدت.`);
    } else {
      reasons.push(`RSI برابر **${stats.rsi.toFixed(0)}**: در محدوده خنثی.`);
    }
  }
  if (bubblePct != null) {
    score += 20 * clamp(-bubblePct / 5, -1, 1);
    reasons.push(
      `فاصله قیمت بازار تا ارزش ذاتی (انس × دلار): **${formatPct(bubblePct)}** — ` +
        (bubblePct > 3 ? "گران‌تر از ارزش جهانی؛ فشار اصلاحی." : bubblePct < -2 ? "ارزان‌تر از ارزش جهانی؛ پتانسیل جبران." : "نزدیک به ارزش منطقی."),
    );
  }
  score = clamp(score, -100, 100);
  const trend: Trend = score > 20 ? "BULLISH" : score < -20 ? "BEARISH" : "CONSOLIDATION";

  // Support / resistance: swing levels from history (in the requested price
  // scale) completed with volatility bands.
  const supports: number[] = [];
  const resistances: number[] = [];
  const scale = history.length ? alignScale(history[history.length - 1].v, price) : null;
  if (scale != null) {
    const { lows, highs } = swingLevels(history.map((p) => p.v * scale));
    supports.push(...lows.filter((v) => v < price * 0.999).sort((a, b) => b - a));
    resistances.push(...highs.filter((v) => v > price * 1.001).sort((a, b) => a - b));
  }
  const minGap = price * (volPct / 100) * 0.4;
  const pushDistinct = (list: number[], v: number) => {
    if (list.every((x) => Math.abs(x - v) >= minGap)) list.push(v);
  };
  const s: number[] = [];
  const r: number[] = [];
  for (const v of supports) pushDistinct(s, v);
  for (const v of resistances) pushDistinct(r, v);
  for (let k = 1; s.length < 2 && k <= 3; k++) pushDistinct(s, price * (1 - (k * volPct) / 100));
  for (let k = 1; r.length < 2 && k <= 3; k++) pushDistinct(r, price * (1 + (k * volPct) / 100));
  s.sort((a, b) => b - a);
  r.sort((a, b) => a - b);

  const cross = ctx.snapshot.crossChecks[key]?.value;
  const own = ctx.snapshot.quotes[key]?.value;
  const sourceAgreementPct = cross && own ? Math.abs(own / cross - 1) * 100 : null;

  let confidence = 35;
  if (stats) confidence += Math.min(20, stats.points / 5);
  if (stats && stats.spanHours >= 24) confidence += 10;
  if (bubblePct != null) confidence += 10;
  if (sourceAgreementPct != null && sourceAgreementPct < 1.5) confidence += 10;
  confidence = Math.round(clamp(confidence, 30, 85));

  return {
    key,
    label: MARKET_INFO[key].fa,
    price,
    unitLabel,
    stats,
    volPct,
    volIsMeasured,
    trend,
    score,
    reasons,
    supports: s.slice(0, 2).map(niceRound),
    resistances: r.slice(0, 2).map(niceRound),
    bubblePct,
    confidence,
    sourceAgreementPct,
  };
}

function trendFa(trend: Trend): string {
  return trend === "BULLISH" ? "صعودی" : trend === "BEARISH" ? "نزولی" : "خنثی / رنج";
}

function marketPhase(view: AssetView): string {
  const rsiValue = view.stats?.rsi ?? 50;
  if (view.trend === "BULLISH") return rsiValue > 70 ? "صعودی در محدوده اشباع خرید" : "فاز صعودی";
  if (view.trend === "BEARISH") return rsiValue < 30 ? "نزولی در محدوده اشباع فروش" : "فاز اصلاحی / نزولی";
  return view.volPct < 1 ? "فاز تثبیت و نوسان محدود" : "فاز رنج";
}

function tradeSetup(view: AssetView) {
  const p = view.price;
  const sigma = (p * view.volPct) / 100;
  const [s1, s2] = view.supports;
  const [r1, r2] = view.resistances;
  const round2 = (x: number) => Math.round(x * 100) / 100;
  if (view.trend === "BEARISH") {
    // Sell / exit on a bounce, stop above resistance 1.
    const entry = niceRound(Math.min(r1, p + 0.5 * sigma));
    const stopLoss = niceRound(r1 + 0.5 * sigma);
    const rr = (entry - s1) / (stopLoss - entry);
    return { direction: "sell" as const, entry, stopLoss, takeProfit1: s1, takeProfit2: s2, riskRewardRatio: round2(rr) };
  }
  // Uptrend: buy a pullback with the stop under support 1.
  // Range: buy at support 1 with the stop under support 2.
  const entry = niceRound(view.trend === "BULLISH" ? Math.max(s1, p - 0.5 * sigma) : s1);
  const stopLoss = niceRound(view.trend === "BULLISH" ? s1 - 0.5 * sigma : s2 - 0.25 * sigma);
  const rr = (r1 - entry) / (entry - stopLoss);
  return { direction: "buy" as const, entry, stopLoss, takeProfit1: r1, takeProfit2: r2, riskRewardRatio: round2(rr) };
}

function riskScores(view: AssetView, ctx: EngineContext) {
  const usdStats = seriesStats(ctx.memory.get("usd"));
  const xauStats = seriesStats(ctx.memory.get("xauusd"));
  return {
    // Baseline only: the engine has no news feed to measure political risk.
    political: 60,
    inflation: Math.round(clamp(55 + (usdStats?.slopePctPerDay ?? 0) * 20, 20, 95)),
    volatility: Math.round(clamp((view.volPct / 3) * 100, 5, 95)),
    globalImpact: Math.round(clamp(40 + (xauStats?.dailyVolPct ?? MARKET_INFO.xauusd.defaultDailyVolPct) * 15, 20, 90)),
  };
}

function fmtLevel(v: number, unitLabel: string): string {
  return `${formatNumber(v)}${unitLabel ? ` ${unitLabel}` : ""}`;
}

export function renderAnalysisMarkdown(view: AssetView): string {
  const setup = tradeSetup(view);
  const u = view.unitLabel;
  const lines: string[] = [];
  lines.push(`## تحلیل ${view.label}`);
  lines.push(`**قیمت مرجع:** ${fmtLevel(view.price, u)} — **روند:** ${trendFa(view.trend)} — **فاز:** ${marketPhase(view)} — **اطمینان:** ${view.confidence}٪`);
  lines.push("");
  lines.push("### دلایل و شواهد");
  for (const reason of view.reasons) lines.push(`- ${reason}`);
  lines.push(
    `- نوسان روزانه ${view.volIsMeasured ? "اندازه‌گیری‌شده" : "فرضی (تاریخچه کافی نیست)"}: **${view.volPct.toFixed(2)}٪**`,
  );
  if (view.sourceAgreementPct != null) {
    lines.push(`- اختلاف دو منبع قیمت (TGJU و تلگرام): ${view.sourceAgreementPct.toFixed(2)}٪ ${view.sourceAgreementPct < 1.5 ? "(هم‌خوان)" : "(اختلاف قابل توجه)"}`);
  }
  lines.push("");
  lines.push("### سطوح کلیدی");
  lines.push(`- حمایت ۱: **${fmtLevel(view.supports[0], u)}**`);
  lines.push(`- حمایت ۲: **${fmtLevel(view.supports[1], u)}**`);
  lines.push(`- مقاومت ۱: **${fmtLevel(view.resistances[0], u)}**`);
  lines.push(`- مقاومت ۲: **${fmtLevel(view.resistances[1], u)}**`);
  lines.push("");
  lines.push("### سناریوها");
  for (const line of scenarioTexts(view)) lines.push(`- ${line}`);
  lines.push("");
  lines.push(`### طرح معامله (${setup.direction === "buy" ? "خرید" : "فروش / خروج"})`);
  lines.push(`- ورود: ${fmtLevel(setup.entry, u)}`);
  lines.push(`- حد ضرر: ${fmtLevel(setup.stopLoss, u)}`);
  lines.push(`- هدف ۱: ${fmtLevel(setup.takeProfit1, u)} — هدف ۲: ${fmtLevel(setup.takeProfit2, u)}`);
  lines.push(`- نسبت سود به ریسک تا هدف ۱: **${setup.riskRewardRatio}**`);
  lines.push("");
  lines.push("### محدودیت‌ها");
  lines.push("- اخبار سیاسی و رویدادهای پیش‌بینی‌نشده در محاسبه نیستند (خوراک خبری در دسترس نیست).");
  lines.push("- شمارش امواج الیوت و الگوهای SMC به داده کندل و حجم نیاز دارد و حدس زده نمی‌شود؛ سطوح از نقاط چرخش واقعی و نوسان محاسبه شده‌اند.");
  lines.push("");
  lines.push(DISCLAIMER);
  return lines.join("\n");
}

function scenarioTexts(view: AssetView): [string, string, string] {
  const u = view.unitLabel;
  const [s1, s2] = view.supports;
  const [r1, r2] = view.resistances;
  if (view.trend === "BULLISH") {
    return [
      `اصلی (صعودی): حفظ ${fmtLevel(s1, u)} و حرکت به سمت ${fmtLevel(r1, u)}؛ در صورت تثبیت بالای آن، هدف بعدی ${fmtLevel(r2, u)}.`,
      `جایگزین: اصلاح تا ${fmtLevel(s1, u)} و تثبیت پیش از ادامه رشد.`,
      `ابطال: بسته شدن زیر ${fmtLevel(s2, u)} سناریوی صعودی را باطل می‌کند.`,
    ];
  }
  if (view.trend === "BEARISH") {
    return [
      `اصلی (نزولی): ناتوانی در عبور از ${fmtLevel(r1, u)} و افت به سمت ${fmtLevel(s1, u)}؛ در صورت شکست، ${fmtLevel(s2, u)}.`,
      `جایگزین: برگشت تا ${fmtLevel(r1, u)} و ادامه نوسان.`,
      `ابطال: تثبیت بالای ${fmtLevel(r2, u)} سناریوی نزولی را باطل می‌کند.`,
    ];
  }
  return [
    `اصلی (رنج): نوسان بین ${fmtLevel(s1, u)} و ${fmtLevel(r1, u)}.`,
    `جایگزین: شکست ${fmtLevel(r1, u)} مسیر را به سمت ${fmtLevel(r2, u)} باز می‌کند؛ شکست ${fmtLevel(s1, u)} مسیر ${fmtLevel(s2, u)} را.`,
    `ابطال رنج: بسته شدن بیرون از محدوده ${fmtLevel(s2, u)} تا ${fmtLevel(r2, u)}.`,
  ];
}

// ---------------------------------------------------------------------------
// /api/analysis/refresh
// ---------------------------------------------------------------------------

function resolvePrice(key: MarketKey, appPrice: number, ctx: EngineContext): { price: number; unitLabel: string } {
  const live = ctx.snapshot.quotes[key]?.value;
  const unit = MARKET_INFO[key].unit;
  if (appPrice > 0) {
    if (!live) return { price: appPrice, unitLabel: "" };
    const f = alignScale(appPrice, live);
    if (f === 1) return { price: appPrice, unitLabel: unit };
    if (f === 0.1 && unit === "تومان") return { price: appPrice, unitLabel: "ریال" };
    return { price: appPrice, unitLabel: "" };
  }
  if (live) return { price: live, unitLabel: unit };
  throw new Error("قیمت معتبری برای این دارایی در دسترس نیست.");
}

export function buildSharedAnalysis(params: { assetId: string; currentPrice: number; ctx: EngineContext }) {
  const { assetId, currentPrice, ctx } = params;
  const key = ASSET_ID_TO_KEY[assetId] ?? "gold18";
  const { price, unitLabel } = resolvePrice(key, currentPrice, ctx);
  const view = analyzeAsset(key, price, unitLabel, ctx);
  const setup = tradeSetup(view);
  const [primary, alternative, invalidation] = scenarioTexts(view);
  const sigma = (price * view.volPct) / 100;
  return {
    assetId,
    timestamp: new Date().toISOString(),
    trend: view.trend,
    marketPhase: marketPhase(view),
    confidenceScore: view.confidence,
    probabilityScore: Math.round(clamp(50 + Math.abs(view.score) / 2, 50, 85)),
    supportLevels: view.supports,
    resistanceLevels: view.resistances,
    orderBlocks: [
      { type: "bullish", range: `${formatNumber(niceRound(view.supports[0] - 0.25 * sigma))}-${formatNumber(view.supports[0])}`, volume: "داده حجم در دسترس نیست" },
      { type: "bearish", range: `${formatNumber(view.resistances[0])}-${formatNumber(niceRound(view.resistances[0] + 0.25 * sigma))}`, volume: "داده حجم در دسترس نیست" },
    ],
    scenarios: { primary, alternative, invalidation },
    tradeSetup: {
      entry: setup.entry,
      stopLoss: setup.stopLoss,
      takeProfit1: setup.takeProfit1,
      takeProfit2: setup.takeProfit2,
      riskRewardRatio: setup.riskRewardRatio,
    },
    risks: riskScores(view, ctx),
    detailedAnalysisMarkdown: renderAnalysisMarkdown(view),
  };
}

// ---------------------------------------------------------------------------
// Next-day forecast core (shared by /api/forecast/generate and /analyze)
// ---------------------------------------------------------------------------

export interface DailyForecastInput {
  meltedGold: number;
  usdIrt?: number;
  usdtIrt?: number;
  xauusd?: number;
  gold18k?: number;
  emamiCoin?: number;
  todayChangePercent?: number;
  todayHigh?: number;
  todayLow?: number;
  notes?: string;
}

interface Signal {
  label: string;
  effectPct: number;
  text: string;
}

export interface DailyForecastCore {
  close: number;
  mid: number;
  low: number;
  high: number;
  sigmaPct: number;
  driftPct: number;
  bullishProb: number;
  neutralProb: number;
  bearishProb: number;
  confidenceScore: number;
  confidenceString: "Low" | "Medium" | "High";
  signals: Signal[];
  bubblePct: number | null;
  closeToman: number | null;
  usdToman: number | null;
  coinBubblePct: number | null;
  levels: { sup1: number; sup2: number; res1: number; res2: number; invalidation: number };
  warnings: string[];
}

const num = (v: unknown): number => {
  const n = typeof v === "string" ? parseFloat(v.replace(/,/g, "")) : Number(v);
  return Number.isFinite(n) ? n : 0;
};

function plausibleUsdToman(value: number, liveUsd?: number): { toman: number; factor: number } | null {
  if (!(value > 0)) return null;
  if (liveUsd) {
    const f = alignScale(value, liveUsd);
    if (f != null) return { toman: value * f, factor: f };
  }
  for (const f of [0.1, 1, 0.01]) {
    const t = value * f;
    if (t >= 50_000 && t <= 2_000_000) return { toman: t, factor: f };
  }
  return null;
}

export function directionProbabilities(z: number): { bullishProb: number; neutralProb: number; bearishProb: number } {
  const bullishProb = Math.round(clamp(35 + 30 * Math.tanh(z), 10, 70));
  const bearishProb = Math.round(clamp(35 - 30 * Math.tanh(z), 10, 70));
  return { bullishProb, neutralProb: 100 - bullishProb - bearishProb, bearishProb };
}

export function forecastNextDay(rawInput: DailyForecastInput, ctx: EngineContext): DailyForecastCore {
  const close = num(rawInput.meltedGold);
  if (!(close > 0)) throw new Error("قیمت آبشده (مظنه) معتبر نیست.");
  const q = ctx.snapshot.quotes;
  const warnings: string[] = [];
  const signals: Signal[] = [];

  const xau = num(rawInput.xauusd) || q.xauusd?.value || 0;
  const xauValid = xau >= 500 && xau <= 20000;
  if (!num(rawInput.xauusd) && q.xauusd) warnings.push("انس وارد نشده بود؛ از قیمت زنده استفاده شد.");

  const usdAligned = plausibleUsdToman(num(rawInput.usdIrt), q.usd?.value) ??
    (q.usd ? { toman: q.usd.value, factor: 1 } : null);
  if (usdAligned && num(rawInput.usdIrt) && usdAligned.factor !== 1 && usdAligned.factor !== 0.1) {
    warnings.push(`واحد ورودی دلار با داده زنده هم‌خوان نبود؛ ضریب ${usdAligned.factor} اعمال شد.`);
  }
  const usdToman = usdAligned?.toman ?? null;

  // Theoretical mesghal in Toman, then express the input close in Toman.
  let bubblePct: number | null = null;
  let closeToman: number | null = null;
  let theoMesghal: number | null = null;
  if (xauValid && usdToman) theoMesghal = (xau / OUNCE_GRAMS) * 0.75 * usdToman * MESGHAL_PER_GRAM18;
  const mesghalRef = q.mesghal?.value ?? theoMesghal ?? undefined;
  const closeFactor = mesghalRef ? alignScale(close, mesghalRef) : null;
  if (closeFactor != null) closeToman = close * closeFactor;
  else if (mesghalRef) warnings.push("واحد قیمت آبشده با داده زنده هم‌خوان نیست؛ مقایسه با ارزش ذاتی انجام نشد.");

  if (closeToman && theoMesghal) {
    bubblePct = (closeToman / theoMesghal - 1) * 100;
    signals.push({
      label: "ارزش ذاتی",
      effectPct: clamp(-bubblePct * 0.1, -1, 1),
      text: `قیمت آبشده ${formatPct(bubblePct)} نسبت به ارزش ذاتی (انس × دلار) است؛ ${bubblePct > 2 ? "گرانی نسبی، فشار اصلاحی" : bubblePct < -2 ? "ارزانی نسبی، پتانسیل جبران" : "نزدیک به ارزش منطقی"}.`,
    });
    if (Math.abs(bubblePct) > 8) warnings.push(`فاصله غیرعادی ${formatPct(bubblePct)} از ارزش ذاتی؛ داده‌ها را بررسی کنید.`);
  } else {
    warnings.push("برای محاسبه ارزش ذاتی، انس و دلار معتبر لازم است.");
  }

  const usdtAligned = usdToman ? (() => {
    const v = num(rawInput.usdtIrt);
    if (!v) return null;
    const f = alignScale(v, usdToman);
    return f == null ? null : v * f;
  })() : null;
  if (usdtAligned && usdToman) {
    const premium = (usdtAligned / usdToman - 1) * 100;
    signals.push({
      label: "تتر",
      effectPct: clamp(premium * 0.5, -1, 1),
      text: `اختلاف تتر و دلار: ${formatPct(premium)} — ${premium > 0.3 ? "تقاضای پنهان ارزی، حمایت از قیمت" : premium < -0.3 ? "فشار عرضه ارزی" : "هم‌تراز با دلار"}.`,
    });
  }

  const change = num(rawInput.todayChangePercent);
  if (change) {
    signals.push({
      label: "مومنتوم امروز",
      effectPct: clamp(change * 0.25, -0.6, 0.6),
      text: `تغییر امروز ${formatPct(change)}؛ بخشی از مومنتوم معمولاً به روز بعد منتقل می‌شود.`,
    });
  }

  const mesghalStats = seriesStats(ctx.memory.get("mesghal"));
  if (mesghalStats?.slopePctPerDay != null) {
    signals.push({
      label: "روند ثبت‌شده",
      effectPct: clamp(mesghalStats.slopePctPerDay * 0.3, -0.6, 0.6),
      text: `روند ثبت‌شده آبشده: ${formatPct(mesghalStats.slopePctPerDay)} در روز.`,
    });
  }
  const xauStats = seriesStats(ctx.memory.get("xauusd"));
  if (xauStats?.slopePctPerDay != null) {
    signals.push({
      label: "انس",
      effectPct: clamp(xauStats.slopePctPerDay * 0.5, -0.5, 0.5),
      text: `روند انس جهانی: ${formatPct(xauStats.slopePctPerDay)} در روز.`,
    });
  }
  const usdStats = seriesStats(ctx.memory.get("usd"));
  if (usdStats?.slopePctPerDay != null) {
    signals.push({
      label: "دلار",
      effectPct: clamp(usdStats.slopePctPerDay * 0.5, -0.5, 0.5),
      text: `روند دلار آزاد: ${formatPct(usdStats.slopePctPerDay)} در روز.`,
    });
  }

  // Volatility: today's high/low range (Parkinson) > recorded history > default.
  const hi = num(rawInput.todayHigh);
  const lo = num(rawInput.todayLow);
  let sigmaPct = mesghalStats?.dailyVolPct ?? MARKET_INFO.mesghal.defaultDailyVolPct;
  let sigmaFromRange = false;
  if (hi > lo && lo > 0) {
    const rangePct = ((hi - lo) / close) * 100;
    if (rangePct >= 0.1 && rangePct <= 15) {
      sigmaPct = Math.max(rangePct / 1.665, 0.6 * MARKET_INFO.mesghal.defaultDailyVolPct);
      sigmaFromRange = true;
    }
  }

  // Heuristic signals cannot justify a move larger than ~¾ of a normal day.
  const driftPct = clamp(signals.reduce((a, s) => a + s.effectPct, 0), -0.75 * sigmaPct, 0.75 * sigmaPct);
  const { bullishProb, neutralProb, bearishProb } = directionProbabilities(driftPct / sigmaPct);

  const at = (pct: number) => niceRound(close * (1 + pct / 100));
  let sup1 = at(-0.6 * sigmaPct);
  if (lo > 0 && lo < close && lo >= close * (1 - sigmaPct / 100)) sup1 = niceRound(lo);
  let sup2 = at(-1.4 * sigmaPct);
  if (sup2 >= sup1) sup2 = niceRound(sup1 * (1 - sigmaPct / 200));
  let res1 = at(0.6 * sigmaPct);
  if (hi > close && hi <= close * (1 + sigmaPct / 100)) res1 = niceRound(hi);
  let res2 = at(1.4 * sigmaPct);
  if (res2 <= res1) res2 = niceRound(res1 * (1 + sigmaPct / 200));
  const invalidation = driftPct >= 0 ? at(-1.8 * sigmaPct) : at(1.8 * sigmaPct);

  let confidenceScore = 40 + 5 * Math.min(signals.length, 4) +
    (sigmaFromRange || mesghalStats?.dailyVolPct != null ? 5 : 0) + (closeToman ? 5 : 0) +
    (mesghalStats && mesghalStats.spanHours >= 24 ? 10 : 0);
  confidenceScore = Math.round(clamp(confidenceScore, 35, 80));
  const confidenceString = confidenceScore >= 70 ? "High" : confidenceScore >= 50 ? "Medium" : "Low";

  let coinBubblePct: number | null = null;
  const emamiIn = num(rawInput.emamiCoin);
  if (emamiIn && xauValid && usdToman) {
    const intrinsic = (xau / OUNCE_GRAMS) * COIN_PURE_GOLD_GRAMS.emami! * usdToman;
    const f = alignScale(emamiIn, intrinsic, 2);
    if (f != null) coinBubblePct = ((emamiIn * f) / intrinsic - 1) * 100;
  }

  return {
    close,
    mid: at(driftPct),
    low: at(driftPct - sigmaPct),
    high: at(driftPct + sigmaPct),
    sigmaPct,
    driftPct,
    bullishProb,
    neutralProb,
    bearishProb,
    confidenceScore,
    confidenceString,
    signals,
    bubblePct,
    closeToman,
    usdToman,
    coinBubblePct,
    levels: { sup1, sup2, res1, res2, invalidation },
    warnings,
  };
}

function forecastScenarios(core: DailyForecastCore) {
  const f = (n: number) => formatNumber(n);
  const { levels } = core;
  const direction = core.driftPct > 0.15 ? "up" : core.driftPct < -0.15 ? "down" : "flat";
  const primary =
    direction === "up"
      ? core.mid >= levels.res1
        ? `برآیند سیگنال‌ها مثبت است (${formatPct(core.driftPct)}): انتظار عبور از مقاومت ${f(levels.res1)} و حرکت به سمت ${f(core.mid)}؛ مقاومت بعدی ${f(levels.res2)}.`
        : `برآیند سیگنال‌ها مثبت است (${formatPct(core.driftPct)}): انتظار حرکت به سمت ${f(core.mid)} و آزمون مقاومت ${f(levels.res1)}.`
      : direction === "down"
        ? core.mid <= levels.sup1
          ? `برآیند سیگنال‌ها منفی است (${formatPct(core.driftPct)}): انتظار شکست حمایت ${f(levels.sup1)} و اصلاح تا حدود ${f(core.mid)}؛ حمایت بعدی ${f(levels.sup2)}.`
          : `برآیند سیگنال‌ها منفی است (${formatPct(core.driftPct)}): انتظار اصلاح تا حدود ${f(core.mid)} و آزمون حمایت ${f(levels.sup1)}.`
        : `سیگنال‌ها هم‌دیگر را خنثی می‌کنند: انتظار نوسان بین ${f(levels.sup1)} و ${f(levels.res1)} با مرکز ${f(core.mid)}.`;
  return {
    primary,
    bullish: `در صورت عبور از ${f(levels.res1)} (مثلاً با جهش دلار یا انس)، هدف بعدی ${f(levels.res2)} است.`,
    bearish: `در صورت شکست ${f(levels.sup1)} (مثلاً با افت انس یا خبر سیاسی مثبت)، امکان افت تا ${f(levels.sup2)} وجود دارد.`,
  };
}

function marketSummaryText(core: DailyForecastCore): string {
  const parts: string[] = [];
  if (core.closeToman) parts.push(`مظنه فعلی معادل ${formatNumber(core.closeToman)} تومان برای هر مثقال است.`);
  if (core.bubblePct != null) parts.push(`فاصله از ارزش ذاتی: ${formatPct(core.bubblePct)}.`);
  if (core.usdToman) parts.push(`دلار مبنای محاسبه: ${formatNumber(core.usdToman)} تومان.`);
  parts.push(`نوسان مورد انتظار روز بعد: ±${core.sigmaPct.toFixed(2)}٪؛ برآیند سیگنال‌ها: ${formatPct(core.driftPct)}.`);
  return parts.join(" ");
}

// /api/forecast/generate
export function buildDailyForecast(params: { input: DailyForecastInput; ctx: EngineContext }) {
  const core = forecastNextDay(params.input, params.ctx);
  const sc = forecastScenarios(core);
  const sig = (label: string) => core.signals.find((s) => s.label === label)?.text;
  return {
    closePrice: core.close,
    rangeLow: core.low,
    rangeHigh: core.high,
    midPoint: core.mid,
    bullishProb: core.bullishProb,
    neutralProb: core.neutralProb,
    bearishProb: core.bearishProb,
    primaryScenario: sc.primary,
    bullishScenario: sc.bullish,
    bearishScenario: sc.bearish,
    impacts: {
      usd: sig("دلار") ?? (core.usdToman ? `دلار مبنا ${formatNumber(core.usdToman)} تومان؛ روند آن هنوز ثبت نشده.` : "داده دلار در دسترس نیست."),
      usdt: sig("تتر") ?? "قیمت تتر وارد نشده است.",
      xauusd: sig("انس") ?? sig("ارزش ذاتی") ?? "داده انس در دسترس نیست.",
      coin: core.coinBubblePct != null
        ? `حباب سکه امامی نسبت به ارزش طلای آن: ${formatPct(core.coinBubblePct)}.`
        : "قیمت سکه وارد نشده است.",
      trend: sig("مومنتوم امروز") ?? sig("روند ثبت‌شده") ?? "داده روند امروز وارد نشده است.",
      news: params.input.notes
        ? `یادداشت شما ثبت شد: «${params.input.notes}» (موتور داخلی متن خبر را وزن‌دهی نمی‌کند).`
        : "خوراک خبری در دسترس نیست؛ اثر اخبار لحاظ نشده است.",
    },
    levels: core.levels,
    confidenceString: core.confidenceString,
    confidenceScore: core.confidenceScore,
    marketSummary: marketSummaryText(core),
    warnings: core.warnings,
  };
}

// /api/forecast/analyze
export function buildMazanehForecast(params: {
  fields: Record<string, { value?: string; unit?: string; source?: string; sourceTimestamp?: string; freshness?: string } | undefined>;
  snapshotId: string;
  ctx: EngineContext;
}) {
  const { fields, snapshotId, ctx } = params;
  const input: DailyForecastInput = {
    meltedGold: num(fields.meltedGoldMazaneh?.value),
    xauusd: num(fields.xauusd?.value),
    usdIrt: num(fields.usdIrt?.value),
    usdtIrt: num(fields.usdtIrt?.value),
    gold18k: num(fields.gold18k?.value),
    emamiCoin: num(fields.emamiCoin?.value),
  };
  const core = forecastNextDay(input, ctx);
  const sc = forecastScenarios(core);
  const now = new Date();
  const requiredLive = ["meltedGoldMazaneh", "xauusd", "usdIrt"].every((k) => fields[k]?.freshness === "verified_live");
  const dataQuality = core.closeToman && core.bubblePct != null ? (requiredLive ? "high" : "medium") : "low";
  const confidenceFa = core.confidenceString === "High" ? "بالا" : core.confidenceString === "Medium" ? "متوسط" : "پایین";
  const f = (n: number) => formatNumber(n);
  const sources = Array.from(new Set(Object.values(fields).map((x) => x?.source).filter((x): x is string => !!x)));

  return {
    success: true,
    analysisId: `${snapshotId}_analysis`,
    generatedAt: now.toISOString(),
    jalaliGeneratedAt: new Intl.DateTimeFormat("fa-IR", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tehran",
    }).format(now),
    dataQuality,
    sourcesUsed: sources.length ? sources : ["ورود دستی"],
    marketSummary: marketSummaryText(core),
    currentMazaneh: {
      value: f(core.close),
      unit: fields.meltedGoldMazaneh?.unit || "IRR",
      source: fields.meltedGoldMazaneh?.source || "ورود دستی",
      timestamp: fields.meltedGoldMazaneh?.sourceTimestamp || now.toISOString(),
    },
    tomorrowForecast: {
      low: f(core.low),
      high: f(core.high),
      centralEstimate: f(core.mid),
      unit: fields.meltedGoldMazaneh?.unit || "IRR",
      confidence: confidenceFa,
    },
    confidence: confidenceFa,
    rangeLow: core.low,
    rangeHigh: core.high,
    midPoint: core.mid,
    bullishProb: core.bullishProb,
    neutralProb: core.neutralProb,
    bearishProb: core.bearishProb,
    primaryScenario: sc.primary,
    alternateScenario: core.driftPct >= 0 ? sc.bearish : sc.bullish,
    bullishScenario: sc.bullish,
    bearishScenario: sc.bearish,
    supportLevels: [f(core.levels.sup1), f(core.levels.sup2)],
    resistanceLevels: [f(core.levels.res1), f(core.levels.res2)],
    invalidationLevel: f(core.levels.invalidation),
    warnings: core.warnings,
  };
}

// ---------------------------------------------------------------------------
// Chat (replaces /api/ai/chat)
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ChatMarketContext {
  assetId?: string;
  currentPrice?: number;
}

const ASSET_WORDS: { key: MarketKey; words: string[] }[] = [
  { key: "nim", words: ["نیم سکه", "نیم"] },
  { key: "rob", words: ["ربع سکه", "ربع"] },
  { key: "gerami", words: ["سکه گرمی", "گرمی"] },
  { key: "emami", words: ["سکه امامی", "امامی", "سکه تمام", "سکه"] },
  { key: "mesghal", words: ["ابشده", "اب شده", "مظنه", "مثقال", "ذوب"] },
  { key: "gold24", words: ["24 عیار", "طلای 24"] },
  { key: "gold18", words: ["18 عیار", "طلای 18", "گرم طلا", "طلای", "طلا"] },
  { key: "xauusd", words: ["انس", "اونس", "جهانی", "xau", "xauusd", "ounce"] },
  { key: "usd", words: ["دلار", "ارز", "تتر"] },
  { key: "brent", words: ["نفت", "برنت"] },
];

export function detectAssets(text: string): MarketKey[] {
  const norm = normalizeFa(text);
  const found: { key: MarketKey; index: number; word: string }[] = [];
  for (const { key, words } of ASSET_WORDS) {
    for (const word of words) {
      const idx = hasWord(norm, word);
      if (idx === -1) continue;
      if (key === "usd" && /(شاخص دلار|dxy)/.test(norm) && !/دلار (ازاد|بازار|تهران)/.test(norm)) continue;
      if (key === "emami" && word === "سکه" && /(نیم|ربع) سکه|سکه گرمی/.test(norm) && !/امامی|تمام/.test(norm)) continue;
      found.push({ key, index: idx, word });
      break;
    }
  }
  let keys = found.sort((a, b) => a.index - b.index).map((f) => f.key);
  // "طلا" next to "انس/جهانی" means the global price, not the 18k gram.
  const generic18 = found.find((f) => f.key === "gold18" && (f.word === "طلا" || f.word === "طلای"));
  if (generic18 && keys.includes("xauusd")) keys = keys.filter((k) => k !== "gold18");
  if (generic18 && (keys.includes("mesghal") || keys.includes("gold24"))) keys = keys.filter((k) => k !== "gold18");
  return Array.from(new Set(keys));
}

const MARKET_TERMS = /(بازار|قیمت|نرخ|معامله|خرید|فروش|روند|تحلیل|نمودار|حمایت|مقاومت|پیش ?بینی|سرمایه|نوسان|ریزش|سود|ضرر|حباب|اربیتراژ|ارزش ذاتی)/;

function firstPercent(text: string): number | null {
  const m = /(-?\d+(?:\.\d+)?)\s*(٪|%|درصد)/.exec(text);
  return m ? parseFloat(m[1]) : null;
}

function pickAsset(messages: ChatMessage[], marketContext: ChatMarketContext | undefined): MarketKey {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role !== "user") continue;
    const keys = detectAssets(messages[i].content);
    if (keys.length) return keys[0];
  }
  return (marketContext?.assetId && ASSET_ID_TO_KEY[marketContext.assetId]) || "gold18";
}

function livePriceView(key: MarketKey, ctx: EngineContext, marketContext?: ChatMarketContext): { price: number; unitLabel: string } | null {
  const live = ctx.snapshot.quotes[key]?.value;
  if (live) return { price: live, unitLabel: MARKET_INFO[key].unit };
  if (marketContext?.assetId && ASSET_ID_TO_KEY[marketContext.assetId] === key && (marketContext.currentPrice ?? 0) > 0) {
    return { price: marketContext.currentPrice!, unitLabel: "" };
  }
  return null;
}

function unavailable(key: MarketKey): string {
  return `قیمت زنده **${MARKET_INFO[key].fa}** در این لحظه از منابع دریافت نشد؛ لطفاً چند دقیقه دیگر دوباره بپرسید.`;
}

function priceReply(keys: MarketKey[], ctx: EngineContext): string {
  const now = Date.now();
  const list = keys.length ? keys : (["gold18", "mesghal", "emami", "usd", "xauusd"] as MarketKey[]);
  const lines = ["### قیمت‌های لحظه‌ای"];
  for (const key of list) {
    const q = ctx.snapshot.quotes[key];
    if (!q) {
      lines.push(`- **${MARKET_INFO[key].fa}:** در دسترس نیست`);
      continue;
    }
    const stats = seriesStats(ctx.memory.get(key));
    const change = stats && stats.spanHours >= 0.5 ? ` — تغییر در ${stats.spanHours.toFixed(1)} ساعت ثبت‌شده: ${formatPct(stats.changePct)}` : "";
    lines.push(`- **${MARKET_INFO[key].fa}:** ${formatPrice(q.value, key)} (منبع ${q.source}، ${ageText(q.fetchedAt, now)})${change}`);
    const cross = ctx.snapshot.crossChecks[key];
    if (cross) lines.push(`  - منبع دوم (${cross.source}): ${formatPrice(cross.value, key)}`);
  }
  if (list.includes("usd") && ctx.snapshot.quotes.usd) {
    lines.push("- قیمت ریالی تتر از منابع فعلی در دسترس نیست؛ دلار آزاد نمایش داده شد.");
  }
  return lines.join("\n");
}

function bubbleReply(ctx: EngineContext): string {
  const fu = computeFundamentals(ctx.snapshot);
  const q = ctx.snapshot.quotes;
  if (!fu.pureGramUsd || !q.usd) {
    return "برای محاسبه ارزش ذاتی به قیمت زنده انس و دلار نیاز است که الان در دسترس نیستند.";
  }
  const lines = ["### ارزش ذاتی و حباب (آربیتراژ انس و بازار داخلی)"];
  lines.push(`- مبنا: انس **${formatPrice(q.xauusd!.value, "xauusd")}** و دلار آزاد **${formatPrice(q.usd.value, "usd")}**`);
  lines.push(`- ارزش هر گرم طلای خالص: ${formatNumber(fu.pureGramUsd * q.usd.value)} تومان`);
  for (const key of ["gold18", "mesghal", "emami", "nim", "rob", "gerami"] as MarketKey[]) {
    const theo = fu.theoretical[key];
    const market = q[key]?.value;
    if (!theo) continue;
    const bubble = fu.bubblePct[key];
    lines.push(
      `- **${MARKET_INFO[key].fa}:** ارزش ذاتی ${formatNumber(niceRound(theo))} تومان` +
        (market != null && bubble != null ? ` — بازار ${formatNumber(market)} تومان — حباب **${formatPct(bubble)}**` : ""),
    );
  }
  if (fu.impliedUsd && fu.usdGapPct != null) {
    lines.push(`- دلار ضمنی از قیمت طلای ۱۸ عیار: **${formatNumber(niceRound(fu.impliedUsd))} تومان** (${formatPct(fu.usdGapPct)} نسبت به دلار آزاد)`);
  }
  lines.push("");
  lines.push("**تفسیر:** حباب مثبت یعنی بازار داخلی گران‌تر از معادل جهانی است و در صورت آرام شدن هیجان، فشار اصلاحی دارد؛ حباب منفی یعنی بازار داخلی از انس و دلار عقب مانده است. حباب سکه معمولاً به دلیل هزینه ضرب و تقاضای سرمایه‌ای بالاتر از طلای خام است.");
  return lines.join("\n");
}

function whatIfReply(text: string, ctx: EngineContext): string | null {
  const norm = normalizeFa(text);
  const q = ctx.snapshot.quotes;
  const numbers = extractNumbers(norm);
  if (!numbers.length || !q.xauusd || !q.usd) return null;
  const usdIdx = hasWord(norm, "دلار");
  const xauIdx = Math.max(hasWord(norm, "انس"), hasWord(norm, "اونس"));
  const after = (idx: number) => numbers.find((n) => n.index > idx);
  let newUsd = q.usd.value;
  let newXau = q.xauusd.value;
  const changes: string[] = [];
  if (usdIdx !== -1) {
    const n = after(usdIdx);
    const aligned = n ? plausibleUsdToman(n.value, q.usd.value) : null;
    if (aligned) {
      newUsd = aligned.toman;
      changes.push(`دلار از ${formatNumber(q.usd.value)} به **${formatNumber(newUsd)} تومان**`);
    }
  }
  if (xauIdx !== -1) {
    const n = after(xauIdx);
    if (n && n.value >= 500 && n.value <= 20000) {
      newXau = n.value;
      changes.push(`انس از ${formatNumber(q.xauusd.value, 2)} به **${formatNumber(newXau, 2)} دلار**`);
    }
  }
  if (!changes.length) return null;
  const ratio = (newUsd / q.usd.value) * (newXau / q.xauusd.value);
  // Chat headings are rendered without inline formatting, so keep them plain.
  const lines = [`### سناریو: ${changes.join(" و ").replace(/\*\*/g, "")}`];
  lines.push(`ضریب تغییر ارزش ذاتی طلا: **${formatPct((ratio - 1) * 100)}** (با فرض ثابت ماندن حباب فعلی هر بازار)`);
  for (const key of ["gold18", "mesghal", "emami", "nim", "rob"] as MarketKey[]) {
    const cur = q[key]?.value;
    if (!cur) continue;
    lines.push(`- **${MARKET_INFO[key].fa}:** ${formatNumber(cur)} ← **${formatNumber(niceRound(cur * ratio))} تومان**`);
  }
  lines.push("");
  lines.push("این محاسبه اثر مستقیم قیمت‌گذاری است؛ در عمل حباب‌ها در شوک‌های ارزی معمولاً موقتاً بزرگ‌تر می‌شوند.");
  return lines.join("\n");
}

function dxyReply(text: string, ctx: EngineContext): string {
  const norm = normalizeFa(text);
  const pct = firstPercent(norm) ?? 1;
  const q = ctx.snapshot.quotes;
  const lines = [`### سناریو: تغییر ${formatPct(pct, 1)} شاخص دلار آمریکا (DXY)`];
  lines.push("همبستگی کوتاه‌مدت انس و DXY منفی است؛ کشش تاریخی معمولاً بین **۰٫۵ تا ۱٫۵** برابر است (فرض مرکزی: ۱).");
  for (const beta of [0.5, 1, 1.5]) {
    const xauChange = -beta * pct;
    const xauLine = q.xauusd ? ` → انس حدود ${formatNumber(niceRound(q.xauusd.value * (1 + xauChange / 100)))} دلار` : "";
    lines.push(`- کشش ${beta}: تغییر انس **${formatPct(xauChange, 2)}**${xauLine}`);
  }
  if (q.gold18) {
    lines.push("");
    lines.push(`با ثابت ماندن دلار آزاد، طلای ۱۸ عیار تقریباً به همان نسبت انس تغییر می‌کند: از ${formatNumber(q.gold18.value)} به حدود **${formatNumber(niceRound(q.gold18.value * (1 - pct / 100)))} تومان** (فرض مرکزی).`);
  }
  lines.push("دلار آزاد ایران عمدتاً از عوامل داخلی اثر می‌گیرد و معمولاً با DXY هم‌جهت حرکت نمی‌کند؛ اگر هم‌زمان رشد کند، اثر کاهشی انس را خنثی می‌کند.");
  return lines.join("\n");
}

function quantityReply(text: string, ctx: EngineContext): string | null {
  const norm = normalizeFa(text);
  const m = /(\d+(?:\.\d+)?)\s*(گرم|مثقال|عدد|تا|سکه)/.exec(norm);
  if (!m) return null;
  const qty = parseFloat(m[1]);
  if (!(qty > 0)) return null;
  const keys = detectAssets(norm);
  let key: MarketKey;
  if (m[2] === "مثقال") key = "mesghal";
  else if (m[2] === "گرم") key = keys.includes("gold24") ? "gold24" : "gold18";
  else key = keys.find((k) => ["emami", "nim", "rob", "gerami"].includes(k)) ?? "emami";
  const quote = ctx.snapshot.quotes[key];
  if (!quote) return unavailable(key);
  const total = quote.value * qty;
  const unitWord = m[2] === "گرم" ? "گرم" : m[2] === "مثقال" ? "مثقال" : "عدد";
  return [
    `### ارزش ${formatNumber(qty, 3)} ${unitWord} ${MARKET_INFO[key].fa}`,
    `- قیمت واحد: ${formatPrice(quote.value, key)}`,
    `- ارزش کل: **${formatNumber(total)} تومان**`,
    key === "gold18"
      ? "- این قیمت طلای خام است؛ برای طلای ساخته‌شده اجرت ساخت، سود فروشنده و مالیات بر ارزش افزوده اضافه می‌شود."
      : "- قیمت بر اساس نرخ بازار است و ممکن است با قیمت خرید/فروش صرافی‌ها کمی فرق کند.",
  ].join("\n");
}

function forecastReply(key: MarketKey, ctx: EngineContext, marketContext?: ChatMarketContext): string {
  const pv = livePriceView(key, ctx, marketContext);
  if (!pv) return unavailable(key);
  const view = analyzeAsset(key, pv.price, pv.unitLabel, ctx);
  const driftPct = clamp((view.score / 100) * view.volPct * 0.5, -2, 2);
  const at = (pct: number) => fmtLevel(niceRound(pv.price * (1 + pct / 100)), pv.unitLabel);
  const { bullishProb: up, bearishProb: down } = directionProbabilities(driftPct / view.volPct);
  return [
    `### چشم‌انداز روز بعد: ${view.label}`,
    `- قیمت فعلی: ${fmtLevel(pv.price, pv.unitLabel)}`,
    `- مرکز انتظار: **${at(driftPct)}** (برآیند ${formatPct(driftPct)})`,
    `- محدوده محتمل (یک انحراف معیار): **${at(driftPct - view.volPct)}** تا **${at(driftPct + view.volPct)}**`,
    `- احتمال‌ها: صعود ${up}٪ — خنثی ${100 - up - down}٪ — نزول ${down}٪`,
    `- روند فعلی: ${trendFa(view.trend)} — اطمینان ${view.confidence}٪`,
    "",
    "**مبنای محاسبه:**",
    ...view.reasons.map((r) => `- ${r}`),
    `- نوسان روزانه ${view.volIsMeasured ? "اندازه‌گیری‌شده" : "فرضی"}: ${view.volPct.toFixed(2)}٪`,
  ].join("\n");
}

function entryReply(key: MarketKey, ctx: EngineContext, marketContext?: ChatMarketContext): string {
  const pv = livePriceView(key, ctx, marketContext);
  if (!pv) return unavailable(key);
  const view = analyzeAsset(key, pv.price, pv.unitLabel, ctx);
  const setup = tradeSetup(view);
  const u = pv.unitLabel;
  return [
    `### نقاط ورود و مدیریت ریسک: ${view.label}`,
    `- قیمت فعلی: ${fmtLevel(pv.price, u)} — روند: **${trendFa(view.trend)}**`,
    setup.direction === "buy"
      ? `- محدوده ورود خرید: نزدیک **${fmtLevel(setup.entry, u)}** (حمایت ۱: ${fmtLevel(view.supports[0], u)})`
      : `- روند نزولی است؛ برای خرید عجله نکنید. محدوده مناسب خروج/فروش: **${fmtLevel(setup.entry, u)}**`,
    `- حد ضرر: **${fmtLevel(setup.stopLoss, u)}**`,
    `- هدف ۱: ${fmtLevel(setup.takeProfit1, u)} — هدف ۲: ${fmtLevel(setup.takeProfit2, u)}`,
    `- نسبت سود به ریسک: **${setup.riskRewardRatio}** ${setup.riskRewardRatio < 1.5 ? "(کمتر از ۱٫۵؛ معامله جذاب نیست)" : "(قابل قبول)"}`,
    "",
    "**قواعد مدیریت سرمایه:** بیش از ۱ تا ۲ درصد کل سرمایه را در یک معامله ریسک نکنید و خرید را پله‌ای انجام دهید.",
  ].join("\n");
}

function compareReply(ctx: EngineContext): string {
  const fu = computeFundamentals(ctx.snapshot);
  const rows = (["gold18", "mesghal", "emami", "nim", "rob", "gerami"] as MarketKey[])
    .filter((k) => fu.bubblePct[k] != null)
    .sort((a, b) => fu.bubblePct[a]! - fu.bubblePct[b]!);
  if (!rows.length) return "برای مقایسه، قیمت زنده انس و دلار لازم است که الان در دسترس نیست.";
  const lines = ["### مقایسه گزینه‌های طلا بر اساس فاصله از ارزش ذاتی"];
  rows.forEach((k, i) => lines.push(`${i + 1}. **${MARKET_INFO[k].fa}:** حباب ${formatPct(fu.bubblePct[k]!)}`));
  lines.push("");
  lines.push(`کمترین حباب فعلاً مربوط به **${MARKET_INFO[rows[0]].fa}** است؛ یعنی قیمت آن به ارزش واقعی طلای درونش نزدیک‌تر است.`);
  lines.push("- **آبشده/طلای خام:** بدون اجرت، نزدیک به ارزش ذاتی، مناسب نگهداری.");
  lines.push("- **سکه:** نقدشوندگی بالا، ولی حباب آن نوسان بیشتری دارد و در هیجان‌ها سریع بزرگ یا کوچک می‌شود.");
  lines.push("- **طلای زینتی:** اجرت و مالیات هنگام فروش برنمی‌گردد؛ برای سرمایه‌گذاری کم‌بازده‌تر است.");
  return lines.join("\n");
}

function helpReply(ctx: EngineContext, greeting: boolean): string {
  const lines: string[] = [];
  if (greeting) lines.push("سلام! من تحلیلگر داخلی ترمینال طلا هستم و بدون اینترنت جهانی و API خارجی، با داده‌های زنده بازار کار می‌کنم.");
  lines.push("### از من بپرسید:");
  lines.push("- «قیمت سکه امامی چنده؟» یا «قیمت‌ها»");
  lines.push("- «طلای ۱۸ عیار رو تحلیل کن» / «روند آبشده چطوره؟»");
  lines.push("- «بهترین نقطه ورود برای خرید سکه؟»");
  lines.push("- «حباب سکه و طلا چقدره؟» / «آربیتراژ انس و آبشده»");
  lines.push("- «اگر دلار ۳۰۰ هزار تومان بشه طلا چند می‌شه؟»");
  lines.push("- «اگر شاخص دلار ۱.۵ درصد رشد کنه چی می‌شه؟»");
  lines.push("- «۵ گرم طلا چند می‌شه؟» / «پیش‌بینی فردای آبشده»");
  lines.push("- «سکه بخرم یا طلا؟»");
  const q = ctx.snapshot.quotes;
  if (q.gold18 && q.usd) {
    lines.push("");
    lines.push(`وضعیت لحظه‌ای: طلای ۱۸ عیار ${formatPrice(q.gold18.value, "gold18")} و دلار آزاد ${formatPrice(q.usd.value, "usd")}.`);
  }
  return lines.join("\n");
}

export function answerChat(params: { messages: ChatMessage[]; marketContext?: ChatMarketContext; ctx: EngineContext }): string {
  const { messages, marketContext, ctx } = params;
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const text = lastUser?.content ?? "";
  const norm = normalizeFa(text);
  const assets = detectAssets(norm);
  const key = assets[0] ?? pickAsset(messages, marketContext);
  const isGreeting = /^(سلام|درود|hi|hello|وقت بخیر|صبح بخیر|عصر بخیر)/.test(norm);
  // Market intents need market context, so "هوای فردا" is not read as a gold forecast.
  const priorAsset = messages.some((m) => m !== lastUser && m.role === "user" && detectAssets(m.content).length > 0);
  const isMarket = assets.length > 0 || priorAsset || MARKET_TERMS.test(norm);

  let body: string | null = null;
  if (/(ممنون|مرسی|متشکر|سپاس|دمت گرم)/.test(norm) && norm.length < 30) {
    return "خواهش می‌کنم! هر وقت سؤالی درباره بازار داشتید در خدمتم.";
  }
  if (/(اگر|اگه|فرض کن|چنانچه|در صورتی که)/.test(norm) && !/(شاخص دلار|dxy)/.test(norm)) body = whatIfReply(text, ctx);
  if (!body && /(شاخص دلار|dxy)/.test(norm)) body = dxyReply(text, ctx);
  if (!body && /\d/.test(norm) && /(چند|قیمت|ارزش|میشه|می شود|می شه)/.test(norm)) body = quantityReply(text, ctx);
  if (!body && isMarket && /(حباب|اربیتراژ|ارزش ذاتی|ذاتی|گرونه|ارزونه|گران است|ارزان است|منطقی)/.test(norm)) body = bubbleReply(ctx);
  if (!body && isMarket && /(ورود|بخرم|خرید|فروش|بفروشم|حد ضرر|استاپ|هدف قیمتی|تارگت|حد سود)/.test(norm) && !/(کدام|کدوم|یا سکه|یا طلا)/.test(norm)) {
    body = entryReply(key, ctx, marketContext);
  }
  if (!body && isMarket && /(پیش ?بینی|فردا|اینده|اتی|هفته بعد|چه میشه|چی میشه|چه می شود)/.test(norm)) body = forecastReply(key, ctx, marketContext);
  if (!body && isMarket && /(کدام|کدوم|بهتر|سرمایه ?گذاری|مقایسه|یا سکه|یا طلا)/.test(norm)) body = compareReply(ctx);
  if (!body && isMarket && /(تحلیل|smc|الیوت|روند|بررسی|وضعیت|ساختار|تکنیکال|نمودار)/.test(norm)) {
    const pv = livePriceView(key, ctx, marketContext);
    body = pv ? renderAnalysisMarkdown(analyzeAsset(key, pv.price, pv.unitLabel, ctx)) : unavailable(key);
    return body;
  }
  if (!body && isMarket && (/(قیمت|چنده|چند|نرخ|الان|امروز|قیمتها)/.test(norm) || (assets.length && norm.length < 40))) {
    body = priceReply(assets, ctx);
  }
  if (!body) {
    if (isGreeting || /(کمک|راهنما|چه کار|چیکار|چی بلدی|قابلیت)/.test(norm) || !norm) return helpReply(ctx, isGreeting);
    return [
      "این سؤال را دقیق متوجه نشدم. من روی داده‌های بازار طلا و ارز کار می‌کنم و به سؤال‌های عمومی خارج از بازار پاسخ نمی‌دهم.",
      "",
      helpReply(ctx, false),
    ].join("\n");
  }
  return [isGreeting ? "سلام!" : "", body, "", DISCLAIMER].filter((s, i) => i > 0 || s).join("\n");
}
