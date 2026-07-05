const fs = require('fs');
let code = fs.readFileSync('src/utils/dataValidation.ts', 'utf8');

const replacement = `export function validateAndNormalizePrice(
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
    marketNotation = \`مظنه \${displayValue}\`;
  }
  // Hard validation for USDIRT
  else if (assetId === "USDIRT" || assetId === "USDTIRT") {
    if (canonicalValue < 300000 || canonicalValue > 1500000) {
      validationStatus = "malformed";
    }
    displayValue = tomanDisplay.toLocaleString();
    displayUnit = "تومان";
    marketNotation = \`دلار \${displayValue}\`;
  }
  // Hard validation for Gold 18K
  else if (assetId === "GOLD_18K" || assetId === "GOLD_24K" || assetId === "GOLD_GRAM") {
     if (canonicalValue < 10000000 || canonicalValue > 100000000) {
       validationStatus = "malformed";
     }
     displayValue = tomanDisplay.toLocaleString();
     displayUnit = "تومان / گرم";
     marketNotation = \`گرم \${displayValue}\`;
  }
  // Hard validation for Coins
  else if (assetId.includes("COIN")) {
     displayValue = tomanDisplay.toLocaleString();
     displayUnit = "تومان";
     marketNotation = \`سکه \${displayValue}\`;
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
}`;

code = code.replace(/export function validateAndNormalizePrice[\s\S]*?return {[\s\S]*?};[\s\n]*}/, replacement);
fs.writeFileSync('src/utils/dataValidation.ts', code);
