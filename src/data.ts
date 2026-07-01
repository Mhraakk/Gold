import { AssetInfo, Candle, CalendarEvent, NewsItem, MarketStructure, AssetId } from "./types";

// Base prices for reference (No hardcoded prices for Iranian assets as per requirements)
export const getPrice = (id: AssetId) => {
  // If we have a cached last valid price in localStorage, use it to avoid crashing the app
  const cached = localStorage.getItem(`gold_terminal_last_price_${id}`);
  if (cached && !isNaN(parseFloat(cached))) return parseFloat(cached);

  const defaultPrices: Partial<Record<AssetId, number>> = {
    USDIRT: 61450,
    USDTIRT: 61850,
    XAUUSD: 2348.50,
    GOLD_FUTURES: 2362.10,
    GOLD_CFD: 2349.00,
    GOLD_ETF: 216.80,
  };
  return defaultPrices[id] || 0;
};

export const ASSETS_METADATA: Record<AssetId, { name: string; persianName: string; symbol: string; decimals: number; unit: string }> = {
  MELTED_GOLD: { name: "Iranian Melted Gold", persianName: "طلای آب شده ایران", symbol: "MELT_IRT", decimals: 0, unit: "تومان / مثقال" },
  GOLD_18K: { name: "18K Gold Gram", persianName: "طلای آب شده گرمی (۱۸ عیار)", symbol: "GOLD_18K", decimals: 0, unit: "تومان / گرم" },
  GOLD_24K: { name: "24K Gold Gram", persianName: "طلای ۲۴ عیار", symbol: "GOLD_24K", decimals: 0, unit: "تومان / گرم" },
  COIN_EMAMI: { name: "Emami Gold Coin", persianName: "سکه امامی", symbol: "COIN_EMAMI", decimals: 0, unit: "تومان / عدد" },
  COIN_HALF: { name: "Half Gold Coin", persianName: "نیم سکه بهار آزادی", symbol: "COIN_HALF", decimals: 0, unit: "تومان / عدد" },
  COIN_QUARTER: { name: "Quarter Gold Coin", persianName: "ربع سکه بهار آزادی", symbol: "COIN_QUARTER", decimals: 0, unit: "تومان / عدد" },
  GOLD_GRAM: { name: "1 Gram Ingot", persianName: "هر گرم شمش طلا", symbol: "GOLD_GRAM", decimals: 0, unit: "تومان / گرم" },
  USDIRT: { name: "USD/IRT Free Rate", persianName: "دلار به تومان", symbol: "USD_IRT", decimals: 0, unit: "تومان / دلار" },
  USDTIRT: { name: "USDT/IRT Free Rate", persianName: "تتر به تومان", symbol: "USDT_IRT", decimals: 0, unit: "تومان / تتر" },
  XAUUSD: { name: "Gold Spot", persianName: "انس جهانی طلا", symbol: "XAUUSD", decimals: 2, unit: "USD / Ounce" },
  GOLD_FUTURES: { name: "Gold Futures", persianName: "آتی طلا کامکس", symbol: "GCJ6", decimals: 1, unit: "USD / Contract" },
  GOLD_CFD: { name: "Gold CFD", persianName: "سی‌اف‌دی طلا", symbol: "XAUUSD_CFD", decimals: 2, unit: "USD / Lot" },
  GOLD_ETF: { name: "SPDR Gold Shares", persianName: "صندوق طلا (ETF)", symbol: "GLD", decimals: 2, unit: "USD / Share" },
};

// Generate high-fidelity candles mimicking waves and SMC concepts
export function generateHistoricalCandles(assetId: AssetId, count = 100): Candle[] {
  const candles: Candle[] = [];
  const basePrice = getPrice(assetId);
  const decimals = ASSETS_METADATA[assetId].decimals;
  
  let currentPrice = basePrice * 0.95; // Start slightly lower
  let currentTime = new Date();
  currentTime.setHours(currentTime.getHours() - count);

  // Math models for Elliott Wave (5 waves up, 3 waves down)
  const getWaveFactor = (i: number) => {
    const cyclePos = i % 80;
    if (cyclePos < 10) return 0.003 * cyclePos; // wave 1
    if (cyclePos < 18) return 0.03 - 0.0015 * (cyclePos - 10); // wave 2 retracement
    if (cyclePos < 35) return 0.018 + 0.005 * (cyclePos - 18); // wave 3 extension (impulsive)
    if (cyclePos < 45) return 0.103 - 0.002 * (cyclePos - 35); // wave 4 consolidation
    if (cyclePos < 60) return 0.083 + 0.004 * (cyclePos - 45); // wave 5 climax
    if (cyclePos < 70) return 0.143 - 0.005 * (cyclePos - 60); // wave A drop
    if (cyclePos < 75) return 0.093 + 0.0025 * (cyclePos - 70); // wave B correction
    return 0.1055 - 0.006 * (cyclePos - 75); // wave C capitulation
  };

  for (let i = 0; i < count; i++) {
    const waveFactor = getWaveFactor(i);
    const noise = (Math.sin(i * 0.4) + Math.cos(i * 0.9)) * 0.0015;
    
    const trendPrice = basePrice * (0.94 + waveFactor + noise);
    const spread = trendPrice * 0.0035;

    const open = trendPrice + (Math.random() - 0.5) * spread * 0.2;
    const close = trendPrice + (Math.random() - 0.5) * spread * 0.5;
    const high = Math.max(open, close) + Math.random() * spread * 0.4;
    const low = Math.min(open, close) - Math.random() * spread * 0.4;
    const volume = Math.floor(1000 + Math.random() * 5000 + (Math.abs(close - open) / spread) * 8000);

    const timeStr = currentTime.toISOString();
    currentTime.setHours(currentTime.getHours() + 1);

    const round = (num: number) => parseFloat(num.toFixed(decimals));

    candles.push({
      time: timeStr,
      open: round(open),
      high: round(high),
      low: round(low),
      close: round(close),
      volume: Math.floor(volume),
    });
  }

  return candles;
}

// Compute SMC Concepts on generated historical candles
export function computeMarketStructure(assetId: AssetId, candles: Candle[]): MarketStructure {
  const orderBlocks: MarketStructure["orderBlocks"] = [];
  const fvgs: MarketStructure["fvgs"] = [];
  const waves: MarketStructure["waves"] = [];
  const supportLines: number[] = [];
  const resistanceLines: number[] = [];

  // Support & Resistance (Pivot highs and lows)
  for (let i = 5; i < candles.length - 5; i++) {
    const p = candles[i];
    const leftHighs = candles.slice(i - 4, i).every(c => c.high <= p.high);
    const rightHighs = candles.slice(i + 1, i + 5).every(c => c.high <= p.high);
    if (leftHighs && rightHighs) {
      resistanceLines.push(p.high);
    }

    const leftLows = candles.slice(i - 4, i).every(c => c.low >= p.low);
    const rightLows = candles.slice(i + 1, i + 5).every(c => c.low >= p.low);
    if (leftLows && rightLows) {
      supportLines.push(p.low);
    }
  }

  // Fair Value Gaps (FVG)
  for (let i = 2; i < candles.length; i++) {
    const prev = candles[i - 2];
    const curr = candles[i - 1];
    const next = candles[i];

    // Bullish FVG: Low of candle 3 is above high of candle 1
    if (next.low > prev.high) {
      fvgs.push({
        type: "bullish",
        highPrice: next.low,
        lowPrice: prev.high,
        status: i > candles.length - 10 ? "open" : "filled",
      });
    }

    // Bearish FVG: High of candle 3 is below low of candle 1
    if (next.high < prev.low) {
      fvgs.push({
        type: "bearish",
        highPrice: prev.low,
        lowPrice: next.high,
        status: i > candles.length - 10 ? "open" : "filled",
      });
    }
  }

  // Order Blocks (OB)
  // Bullish OB: Last down candle before an explosive move up
  for (let i = 2; i < candles.length - 4; i++) {
    const candle = candles[i];
    const isDownCandle = candle.close < candle.open;
    const explosiveUp = candles[i + 1].close > candles[i + 1].open * 1.008;

    if (isDownCandle && explosiveUp) {
      orderBlocks.push({
        type: "bullish",
        priceStart: candle.low,
        priceEnd: candle.high,
        volume: candle.volume * 2.5,
        status: "active",
        time: candle.time,
      });
    }

    // Bearish OB: Last up candle before an explosive move down
    const isUpCandle = candle.close > candle.open;
    const explosiveDown = candles[i + 1].close < candles[i + 1].open * 0.992;

    if (isUpCandle && explosiveDown) {
      orderBlocks.push({
        type: "bearish",
        priceStart: candle.low,
        priceEnd: candle.high,
        volume: candle.volume * 2.5,
        status: "active",
        time: candle.time,
      });
    }
  }

  // Wave labels - Elliot 5 wave marker
  const skip = Math.floor(candles.length / 8);
  const labels = ["(1)", "(2)", "(3)", "(4)", "(5)", "(A)", "(B)", "(C)"];
  labels.forEach((lbl, index) => {
    const targetIdx = Math.min(candles.length - 1, (index + 1) * skip - Math.floor(Math.random() * 4));
    waves.push({
      label: lbl,
      price: lbl.includes("2") || lbl.includes("4") || lbl.includes("C") ? candles[targetIdx].low : candles[targetIdx].high,
      index: targetIdx,
    });
  });

  // Take the strongest 3 support / resistance
  const sortedSupports = supportLines.slice(-3);
  const sortedResistances = resistanceLines.slice(-3);

  const liquidityZones = [
    { type: "buy" as const, price: sortedSupports[0] || (candles[candles.length - 1].close * 0.98), strength: 85 },
    { type: "buy" as const, price: sortedSupports[1] || (candles[candles.length - 1].close * 0.97), strength: 95 },
    { type: "sell" as const, price: sortedResistances[0] || (candles[candles.length - 1].close * 1.02), strength: 78 },
    { type: "sell" as const, price: sortedResistances[1] || (candles[candles.length - 1].close * 1.03), strength: 92 },
  ];

  return {
    orderBlocks: orderBlocks.slice(-4), // keep latest 4
    fvgs: fvgs.slice(-4),
    waves,
    liquidityZones,
    supportLines: sortedSupports,
    resistanceLines: sortedResistances,
  };
}

export function generateLiveAssets(currentPrices?: Record<AssetId, number>): AssetInfo[] {
  const getAssetPrice = (id: AssetId) => currentPrices?.[id] || getPrice(id);
  return [
    {
      id: "MELTED_GOLD",
      name: "Iranian Melted Gold",
      persianName: "طلای آب شده ایران",
      symbol: "MELT_IRT",
      currentPrice: getAssetPrice("MELTED_GOLD"),
      change: 0,
      changeNominal: 0,
      high24h: getAssetPrice("MELTED_GOLD") * 1.01,
      low24h: getAssetPrice("MELTED_GOLD") * 0.99,
      volume24h: "در حال دریافت...",
      provider: "در حال دریافت...",
    },
    {
      id: "GOLD_18K",
      name: "18K Gold Gram",
      persianName: "طلای ۱۸ عیار",
      symbol: "GOLD_18K",
      currentPrice: getAssetPrice("GOLD_18K"),
      change: 0,
      changeNominal: 0,
      high24h: getAssetPrice("GOLD_18K") * 1.01,
      low24h: getAssetPrice("GOLD_18K") * 0.99,
      volume24h: "در حال دریافت...",
      provider: "در حال دریافت...",
    },
    {
      id: "GOLD_24K",
      name: "24K Gold Gram",
      persianName: "طلای ۲۴ عیار",
      symbol: "GOLD_24K",
      currentPrice: getAssetPrice("GOLD_24K"),
      change: 0,
      changeNominal: 0,
      high24h: getAssetPrice("GOLD_24K") * 1.01,
      low24h: getAssetPrice("GOLD_24K") * 0.99,
      volume24h: "در حال دریافت...",
      provider: "در حال دریافت...",
    },
    {
      id: "COIN_EMAMI",
      name: "Emami Gold Coin",
      persianName: "سکه امامی",
      symbol: "COIN_EMAMI",
      currentPrice: getAssetPrice("COIN_EMAMI"),
      change: -0.45,
      changeNominal: -190000,
      high24h: 42900000,
      low24h: 42310000,
      volume24h: "5,420 عدد",
      provider: "بانک مرکزی ایران (CBI)",
    },
    {
      id: "COIN_HALF",
      name: "Half Gold Coin",
      persianName: "نیم سکه بهار آزادی",
      symbol: "COIN_HALF",
      currentPrice: getAssetPrice("COIN_HALF"),
      change: -0.21,
      changeNominal: -50000,
      high24h: 23950000,
      low24h: 23750000,
      volume24h: "3,820 عدد",
      provider: "بانک مرکزی ایران (CBI)",
    },
    {
      id: "COIN_QUARTER",
      name: "Quarter Gold Coin",
      persianName: "ربع سکه بهار آزادی",
      symbol: "COIN_QUARTER",
      currentPrice: getAssetPrice("COIN_QUARTER"),
      change: 0.65,
      changeNominal: 100000,
      high24h: 15550000,
      low24h: 15300000,
      volume24h: "6,110 عدد",
      provider: "بانک مرکزی ایران (CBI)",
    },
    {
      id: "GOLD_GRAM",
      name: "1 Gram Ingot",
      persianName: "هر گرم شمش طلا",
      symbol: "GOLD_GRAM",
      currentPrice: getAssetPrice("GOLD_GRAM"),
      change: 0.94,
      changeNominal: 45000,
      high24h: 4850000,
      low24h: 4740000,
      volume24h: "1,240 شمش",
      provider: "بازار طلای تهران",
    },
    {
      id: "USDIRT",
      name: "USD/IRT Free Rate",
      persianName: "دلار بازار آزاد به تومان",
      symbol: "USD_IRT",
      currentPrice: getAssetPrice("USDIRT"),
      change: 1.82,
      changeNominal: 1100,
      high24h: 61750,
      low24h: 60350,
      volume24h: "125M USD",
      provider: "بازار ارز تهران",
    },
    {
      id: "USDTIRT",
      name: "USDT/IRT Free Rate",
      persianName: "تتر بازار آزاد به تومان",
      symbol: "USDT_IRT",
      currentPrice: getAssetPrice("USDTIRT"),
      change: 1.73,
      changeNominal: 1050,
      high24h: 62100,
      low24h: 60800,
      volume24h: "412M USDT",
      provider: "بازار نقدی نوبیتکس",
    },
    {
      id: "XAUUSD",
      name: "Gold Spot",
      persianName: "انس جهانی طلا",
      symbol: "XAUUSD",
      currentPrice: getAssetPrice("XAUUSD"),
      change: 0.85,
      changeNominal: 19.80,
      high24h: 2355.20,
      low24h: 2326.10,
      volume24h: "312.4K Ounces",
      provider: "نرخ نقدی OANDA",
    },
    {
      id: "GOLD_FUTURES",
      name: "Gold Futures",
      persianName: "آتی طلا کامکس",
      symbol: "GCJ6",
      currentPrice: getAssetPrice("GOLD_FUTURES"),
      change: 0.92,
      changeNominal: 21.50,
      high24h: 2370.00,
      low24h: 2340.20,
      volume24h: "85,420 Contracts",
      provider: "صرافی کامکس بورس نیویورک",
    },
    {
      id: "GOLD_CFD",
      name: "Gold CFD",
      persianName: "سی‌اف‌دی طلا",
      symbol: "XAUUSD_CFD",
      currentPrice: getAssetPrice("GOLD_CFD"),
      change: 0.84,
      changeNominal: 19.50,
      high24h: 2354.50,
      low24h: 2325.80,
      volume24h: "42,100 Lots",
      provider: "متاتریدر ۵",
    },
    {
      id: "GOLD_ETF",
      name: "SPDR Gold Shares",
      persianName: "صندوق طلا (ETF)",
      symbol: "GLD",
      currentPrice: getAssetPrice("GOLD_ETF"),
      change: 0.79,
      changeNominal: 1.70,
      high24h: 217.20,
      low24h: 214.80,
      volume24h: "6.8M Shares",
      provider: "کیتکو (Kitco)",
    },
  ];
}

export const MOCK_CALENDAR: CalendarEvent[] = [
  {
    id: "cal_1",
    time: "2026-07-01T15:30:00Z",
    currency: "USD",
    event: "شاخص قیمت پایه PCE (ماهانه)",
    impact: "high",
    previous: "0.1%",
    forecast: "0.2%",
  },
  {
    id: "cal_2",
    time: "2026-07-01T17:00:00Z",
    currency: "USD",
    event: "شاخص مدیران خرید بخش تولیدی ISM",
    impact: "high",
    previous: "48.7",
    forecast: "49.1",
  },
  {
    id: "cal_3",
    time: "2026-07-02T13:30:00Z",
    currency: "IRR",
    event: "بررسی نرخ تورم بانک مرکزی ج.ا.ا",
    impact: "medium",
    previous: "38.2%",
    forecast: "37.5%",
  },
  {
    id: "cal_4",
    time: "2026-07-03T15:30:00Z",
    currency: "USD",
    event: "تغییرات اشتغال بخش غیرکشاورزی (NFP)",
    impact: "high",
    previous: "272K",
    forecast: "185K",
  },
];

export const MOCK_NEWS: NewsItem[] = [
  {
    id: "news_1",
    title: "افزایش شدید تقاضای طلای آب شده در بازار تهران تحت تأثیر تحولات ژئوپلیتیک منطقه",
    source: "شبکه خبری بازار طلا",
    time: "۲ ساعت پیش",
    sentiment: "bullish",
    summary: "خروج سرمایه از ریال باعث افزایش ۱۲ درصدی حجم معاملات مثقال طلای آب شده در بازار امروز شد. حباب مثقال کاهش یافته و بازاریان بنکدار در حال تأمین سنگین طلای آب شده هستند.",
    url: "#",
  },
  {
    id: "news_2",
    title: "صورتجلسه فدرال رزرو آمریکا حاکی از ماندگاری طولانی‌تر نرخ بهره بالا است",
    source: "بلومبرگ",
    time: "۴ ساعت پیش",
    sentiment: "bearish",
    summary: "نظرات محافظه‌کارانه اعضای کمیته بازار باز فدرال (FOMC) درباره مهار تورم سبب تقویت موقت شاخص دلار و تست مجدد سطح حمایتی ۲۳۳۰ دلار در انس جهانی طلا شد.",
    url: "#",
  },
  {
    id: "news_3",
    title: "پس از چهار فصل متوالی، جریان ورودی به صندوق‌های ETF طلا مثبت شد",
    source: "شورای جهانی طلا",
    time: "۱ روز پیش",
    sentiment: "bullish",
    summary: "خرید سنگین بانک‌های مرکزی در کنار رشد تقاضای خرده‌فروشی برای واحدهای ETF طلا در اروپا، بستر فنی مستحکمی برای صعود به تارگت‌های میان‌مدت ۲۴۰۰ دلار ایجاد کرده است.",
    url: "#",
  },
];
