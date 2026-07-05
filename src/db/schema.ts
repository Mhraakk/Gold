// Database Schema Definition
// Production-grade schema designed for PostgreSQL or similar relational DB.

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // BCrypt hashed
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  role: 'admin' | 'trader';
};

export type MarketData = {
  id: string;
  assetId: string; // e.g. "MELTED_GOLD", "USD_TEHRAN"
  timestamp: string;
  price: number;
  volume?: number;
  source: string; // e.g. "telegram", "binance"
};

export type AnalysisReport = {
  id: string;
  assetId: string;
  timestamp: string;
  provider: string; // "gemini", "openai", etc
  trend: 'BULLISH' | 'BEARISH' | 'CONSOLIDATION';
  confidenceScore: number;
  probabilityScore: number;
  supportLevels: number[];
  resistanceLevels: number[];
  scenarios: {
    primary: string;
    alternative: string;
    invalidation: string;
  };
  risks: {
    political: number;
    inflation: number;
    volatility: number;
    globalImpact: number;
  };
  tradeSetup: {
    entry: number;
    stopLoss: number;
    takeProfit1: number;
    takeProfit2: number;
    riskRewardRatio: number;
  };
  detailedAnalysisMarkdown: string;
};

export type AISettings = {
  id: string;
  userId: string;
  defaultProvider: string;
  defaultModel: string;
  temperature: number;
  systemPrompt: string;
  customEndpoint?: string;
};

export type ApiKeys = {
  id: string;
  userId: string;
  provider: string; // "openai", "gemini", etc
  encryptedKey: string; // AES-256-GCM encrypted
  iv: string; // Initialization vector for decryption
  lastTestedAt: string;
  isValid: boolean;
};
