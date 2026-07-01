export interface Candle {
  time: string; // ISO or date string
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type AssetId = "MELTED_GOLD" | "GOLD_18K" | "GOLD_24K" | "COIN_EMAMI" | "COIN_HALF" | "COIN_QUARTER" | "GOLD_GRAM" | "USDIRT" | "USDTIRT" | "XAUUSD" | "GOLD_FUTURES" | "GOLD_CFD" | "GOLD_ETF";

export interface AssetInfo {
  id: AssetId;
  name: string;
  persianName: string;
  symbol: string;
  currentPrice: number;
  change: number; // percentage
  changeNominal: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  provider: string;
}

export interface IndicatorConfig {
  id: string;
  name: string;
  enabled: boolean;
  color: string;
  params: Record<string, number>;
}

export interface OrderBlock {
  type: "bullish" | "bearish";
  priceStart: number;
  priceEnd: number;
  volume: number;
  status: "active" | "mitigated";
  time: string;
}

export interface FairValueGap {
  type: "bullish" | "bearish";
  highPrice: number;
  lowPrice: number;
  status: "open" | "filled";
}

export interface ElliottWaveCount {
  label: string; // (1), (2), (3), (4), (5), (A), (B), (C)
  price: number;
  index: number;
}

export interface MarketStructure {
  orderBlocks: OrderBlock[];
  fvgs: FairValueGap[];
  waves: ElliottWaveCount[];
  liquidityZones: { type: "buy" | "sell"; price: number; strength: number }[];
  resistanceLines: number[];
  supportLines: number[];
}

export interface CalendarEvent {
  id: string;
  time: string;
  currency: string;
  event: string;
  impact: "low" | "medium" | "high";
  previous: string;
  forecast: string;
  actual?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  sentiment: "bullish" | "bearish" | "neutral";
  summary: string;
  url: string;
}

export interface PortfolioPosition {
  id: string;
  assetId: AssetId;
  type: "buy" | "sell";
  entryPrice: number;
  quantity: number;
  leverage: number;
  stopLoss: number;
  takeProfit: number;
  pnl: number;
  pnlPercent: number;
  timestamp: string;
}

export interface TradeJournalEntry {
  id: string;
  date: string;
  assetId: AssetId;
  type: "buy" | "sell";
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  duration: string;
  notes: string;
  confidenceScore: number;
}

export interface AlertConfig {
  id: string;
  assetId: AssetId;
  condition: "above" | "below";
  value: number;
  channel: "telegram" | "email" | "webhook" | "discord" | "browser";
  enabled: boolean;
}

export interface AIProviderConfig {
  provider: "gemini" | "openai" | "claude" | "deepseek" | "grok" | "openrouter" | "custom";
  apiKey: string;
  model: string;
  temperature: number;
  systemPrompt: string;
  customEndpoint?: string;
}

export interface AnalysisResponse {
  assetId: AssetId;
  timestamp: string;
  trend: "BULLISH" | "BEARISH" | "CONSOLIDATION";
  marketPhase: string;
  confidenceScore: number; // 0-100
  probabilityScore: number; // 0-100
  supportLevels: number[];
  resistanceLevels: number[];
  orderBlocks: { type: string; range: string; volume: string }[];
  scenarios: {
    primary: string;
    alternative: string;
    invalidation: string;
  };
  tradeSetup: {
    entry: number;
    stopLoss: number;
    takeProfit1: number;
    takeProfit2: number;
    riskRewardRatio: number;
  };
  detailedAnalysisMarkdown: string;
}
