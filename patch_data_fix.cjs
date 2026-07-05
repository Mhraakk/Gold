const fs = require('fs');
let code = fs.readFileSync('src/data.ts', 'utf8');

// remove MESGHAL from the wrong place
const wrongBlock = `    {
      id: "MESGHAL",
      name: "Gold Mesghal",
      persianName: "مثقال طلا",
      symbol: "MESGHAL",
      currentPrice: getAssetPrice("MESGHAL" as any),
      change: getChange("MESGHAL" as any),
      changeNominal: getChangeNominal("MESGHAL" as any),
      high24h: getAssetPrice("MESGHAL" as any) * 1.01,
      low24h: getAssetPrice("MESGHAL" as any) * 0.99,
      volume24h: "در حال دریافت...",
      provider: "در حال دریافت...",
    },
    { type: "buy" as const`;

code = code.replace(wrongBlock, `    { type: "buy" as const`);

// add it to generateLiveAssets
const rightPlaceTarget = `      id: "GOLD_24K",
      name: "24K Gold Gram",
      persianName: "طلای ۲۴ عیار",
      symbol: "GOLD_24K",
      currentPrice: getAssetPrice("GOLD_24K"),
      change: getChange("GOLD_24K"),
      changeNominal: getChangeNominal("GOLD_24K"),
      high24h: getAssetPrice("GOLD_24K") * 1.01,
      low24h: getAssetPrice("GOLD_24K") * 0.99,
      volume24h: "در حال دریافت...",
      provider: "در حال دریافت...",
    },`;

const rightPlaceReplacement = rightPlaceTarget + `
    {
      id: "MESGHAL" as any,
      name: "Gold Mesghal",
      persianName: "مثقال طلا",
      symbol: "MESGHAL",
      currentPrice: getAssetPrice("MESGHAL" as any),
      change: getChange("MESGHAL" as any),
      changeNominal: getChangeNominal("MESGHAL" as any),
      high24h: getAssetPrice("MESGHAL" as any) * 1.01,
      low24h: getAssetPrice("MESGHAL" as any) * 0.99,
      volume24h: "در حال دریافت...",
      provider: "در حال دریافت...",
    },`;

code = code.replace(rightPlaceTarget, rightPlaceReplacement);

fs.writeFileSync('src/data.ts', code);
