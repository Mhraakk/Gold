export type Horizon = "1W" | "1M" | "6M" | "1Y";

export interface VerifiedTick {
  id: string;
  timestamp: number;
  priceString: string; // BigInt-safe IRR string
  assetKey: string;
  isCash: boolean;
}

export interface AnalysisInput {
  horizon: Horizon;
  mazannehTicks: VerifiedTick[];
  driverSeries: {
    GOLD_18K?: VerifiedTick[];
    MESGHAL?: VerifiedTick[];
    USD_IRR?: VerifiedTick[];
    IRANIAN_TETHER?: VerifiedTick[];
    XAUUSD?: VerifiedTick[];
  };
}

export interface MazanehAnalysisResult {
  isEligible: boolean;
  ineligibilityReason?: string;
  marketStructure: "Bullish" | "Bearish" | "Ranging" | "No-Edge";
  trend: "Strong Up" | "Up" | "Neutral" | "Down" | "Strong Down";
  volatility: number;
  supportLevels: string[]; // BigInt string
  resistanceLevels: string[]; // BigInt string
  fibonacciLevels: Record<string, string>;
  fairValueGaps: { price: string; type: "Bullish" | "Bearish" }[];
  scenarios: {
    bullishProbability: number;
    bearishProbability: number;
    neutralProbability: number;
    bullishTarget: string;
    bearishTarget: string;
  };
  driversAlignment: "Aligned" | "Divergent" | "Mixed";
  evidence: string[];
}
