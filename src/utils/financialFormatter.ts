// Financial Formatter Utility
// Manages precise conversion between IRR (Iranian Rial), Toman, and Mazaneh notation.
// Includes dual parsing for Persian/Arabic/English digits and strict metadata generation.

export function parsePersianDigits(text: string): string {
  if (!text) return "";
  let out = text;
  out = out.replace(/[۰-۹]/g, w => String.fromCharCode(w.charCodeAt(0) - 1728));
  out = out.replace(/[٠-٩]/g, w => String.fromCharCode(w.charCodeAt(0) - 1584));
  return out;
}

/**
 * Parses any string containing Persian, Arabic, or English digits, ignoring commas and spaces.
 * Ensures Persian and English digits parse identically.
 */
export function parseFinancialValue(text: string): number {
  if (!text) return 0;
  const englishDigitsText = parsePersianDigits(text);
  // Remove thousands separators and keep only numbers and potential decimal points
  const cleanText = englishDigitsText.replace(/,/g, '').replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleanText);
  return isNaN(parsed) ? 0 : parsed;
}

export interface FormattedPriceResult {
  primary: string; // The primary display (e.g. "174,000,000 Toman" or "Mazaneh 75.00")
  secondary: string; // The secondary conversion display
  rawIrr: number;
  toman: number;
  mazaneh?: string;
  source: string;
  timestamp: string;
  assetNameFa: string;
  unit: string;
}

/**
 * Formats IRR values strictly complying with financial guidelines:
 * - Iranian money is stored as integer IRR.
 * - Toman is only IRR divided by 10 at display time.
 * - Mazaneh notation is IRR divided by 1,000,000 and shown separately.
 * - Never use generic formatting for all assets.
 * - Never guess Rial/Toman from number size.
 * - Never drop zeros.
 * - Every displayed price must show source, timestamp, asset, and unit.
 */
export function formatFinancialValue(
  irrValue: number,
  assetId: string,
  assetNameFa: string,
  source: string,
  timestampStr: string,
  usdValue?: number
): FormattedPriceResult {
  const tomanValue = Math.floor(irrValue / 10);
  
  if (assetId === "MELTED_GOLD") {
    // 75,000,000 IRR melted gold → Mazaneh 75.00, 7,500,000 Toman
    const mazanehNum = irrValue / 1000000;
    // Keep exact decimals (e.g., 75.00) without dropping zeros
    const mazanehStr = mazanehNum.toFixed(2);
    return {
      primary: `مظنه ${mazanehStr}`,
      secondary: `${tomanValue.toLocaleString("fa-IR")} تومان`,
      rawIrr: irrValue,
      toman: tomanValue,
      mazaneh: mazanehStr,
      source,
      timestamp: timestampStr,
      assetNameFa,
      unit: "مثقال طلا (Mazaneh / Toman)"
    };
  }

  if (assetId === "XAUUSD" || assetId === "GOLD_FUTURES" || assetId === "GOLD_CFD" || assetId === "GOLD_ETF") {
    const priceVal = usdValue !== undefined ? usdValue : irrValue;
    return {
      primary: `$ ${priceVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      secondary: "دلار آمریکا (USD)",
      rawIrr: irrValue,
      toman: 0,
      source,
      timestamp: timestampStr,
      assetNameFa,
      unit: "دلار (USD)"
    };
  }

  // Standard Iranian Asset (e.g., 1,740,000,000 IRR → 174,000,000 Toman)
  return {
    primary: `${tomanValue.toLocaleString("fa-IR")} تومان`,
    secondary: `معادل ${irrValue.toLocaleString("fa-IR")} ریال`,
    rawIrr: irrValue,
    toman: tomanValue,
    source,
    timestamp: timestampStr,
    assetNameFa,
    unit: "تومان (Toman)"
  };
}
