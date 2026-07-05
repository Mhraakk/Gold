import { ASSETS_METADATA } from "../data";
import { AssetId } from "../types";

export interface NormalizedMarketData {
  asset: AssetId;
  rawValue: number;
  rawText: string;
  canonicalValue: number;
  canonicalCurrency: string;
  displayValue: string;
  displayUnit: string;
  marketNotation: string;
  source: string;
  sourceUrl: string;
  fetchedAt: number;
  sourceUpdatedAt: number;
  freshness: "live" | "stale" | "unavailable";
  validationStatus: "valid" | "invalid_unit" | "digit_loss" | "malformed";
  dataQualityScore: number;
}

export function validateAndNormalizePrice(
  assetId: AssetId,
  rawPrice: number,
  sourceNativeUnit: "IRR" | "TOMAN" | "USD" | "UNKNOWN",
  source: string,
  rawText: string = ""
): NormalizedMarketData {
  const meta = ASSETS_METADATA[assetId] || { unit: "نامشخص", name: assetId, decimals: 0, prefix: "" };
  let canonicalValue = rawPrice;
  let validationStatus: NormalizedMarketData["validationStatus"] = "valid";
  let canonicalCurrency = "IRR";
  let displayValue = "";
  let displayUnit = meta.unit;
  let marketNotation = "";
  const now = Date.now();
  
  if (sourceNativeUnit === "UNKNOWN") {
    return {
      asset: assetId,
      rawValue: rawPrice,
      rawText,
      canonicalValue: rawPrice,
      canonicalCurrency: "UNKNOWN",
      displayValue: "نامشخص",
      displayUnit: "واحد داده منبع تأیید نشده است",
      marketNotation: "واحد داده منبع تأیید نشده است",
      source,
      sourceUrl: "",
      fetchedAt: now,
      sourceUpdatedAt: now,
      freshness: "stale",
      validationStatus: "invalid_unit",
      dataQualityScore: 0
    };
  }

  // Convert to IRR if it's Toman
  if (sourceNativeUnit === "TOMAN") {
    canonicalValue = rawPrice * 10;
  } else if (sourceNativeUnit === "USD") {
    canonicalCurrency = "USD";
    canonicalValue = rawPrice;
  } else {
    canonicalValue = rawPrice;
  }

  const tomanDisplay = (canonicalValue / 10);

  // Hard validation rules for MELTED_GOLD
  if (assetId === "MELTED_GOLD") {
    if (canonicalValue < 30000000 || canonicalValue > 250000000) {
      validationStatus = "malformed";
    }
    const mazaneh = canonicalValue / 1000000;
    displayValue = mazaneh.toFixed(2);
    displayUnit = "میلیون ریال";
    marketNotation = `مظنه ${displayValue}`;
  }
  // Hard validation for USDIRT
  else if (assetId === "USDIRT" || assetId === "USDTIRT") {
    if (canonicalValue < 300000 || canonicalValue > 3000000) {
      validationStatus = "malformed";
    }
    displayValue = tomanDisplay.toLocaleString();
    displayUnit = "تومان";
    marketNotation = `دلار ${displayValue}`;
  }
  // Hard validation for Gold 18K
  else if (assetId === "GOLD_18K" || assetId === "GOLD_24K" || assetId === "GOLD_GRAM") {
     if (canonicalValue < 10000000 || canonicalValue > 500000000) {
       validationStatus = "malformed";
     }
     displayValue = tomanDisplay.toLocaleString();
     displayUnit = "تومان / گرم";
     marketNotation = `گرم ${displayValue}`;
  }
  // Hard validation for Coins
  else if (assetId.includes("COIN")) {
     displayValue = tomanDisplay.toLocaleString();
     displayUnit = "تومان";
     marketNotation = `سکه ${displayValue}`;
  }
  // Default fallback
  else {
     displayValue = canonicalValue.toLocaleString();
     marketNotation = displayValue;
  }

  return {
    asset: assetId,
    rawValue: rawPrice,
    rawText,
    canonicalValue,
    canonicalCurrency,
    displayValue,
    displayUnit,
    marketNotation,
    source,
    sourceUrl: "",
    fetchedAt: now,
    sourceUpdatedAt: now,
    freshness: "live",
    validationStatus,
    dataQualityScore: validationStatus === "valid" ? 100 : 0
  };
}


export function parseAbshdhMessage(text: string): { meltedGold: number | null; gold18k: number | null } {
  if (!text) return { meltedGold: null, gold18k: null };
  let meltedGold: number | null = null;
  let gold18k: number | null = null;

  // Convert Persian numbers to English
  const persianToEnglish = (str: string) => {
     return str.replace(/[۰-۹]/g, d => '0123456789'[d.charCodeAt(0) - 1776]);
  };
  
  const normalizedText = persianToEnglish(text);

  // Usually format is: #ابشده 79,600,000 or #ابشده_حواله 79,600,000 or similar
  const abshMatch = normalizedText.match(/#ابشـ?د?ه.*?([\d,]+)/);
  if (abshMatch) {
    const digits = abshMatch[1].replace(/[,\u066C]/g, '');
    const num = parseFloat(digits);
    if (!isNaN(num)) {
       meltedGold = num;
    }
  } else {
    // fallback
    const fallbackMatch = normalizedText.match(/(?:مظنه|آبشده).*?([\d,]{6,})/);
    if (fallbackMatch) {
       const digits = fallbackMatch[1].replace(/[,\u066C]/g, '');
       const num = parseFloat(digits);
       if (!isNaN(num)) {
          meltedGold = num;
       }
    }
  }

  const gramMatch = normalizedText.match(/#گرم‌?طلا.*?([\d,]+)/);
  if (gramMatch) {
    const digits = gramMatch[1].replace(/[,\u066C]/g, '');
    const num = parseFloat(digits);
    if (!isNaN(num)) {
       gold18k = num;
    }
  }

  return { meltedGold, gold18k };
}
