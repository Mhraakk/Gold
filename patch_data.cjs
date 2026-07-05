const fs = require('fs');
let code = fs.readFileSync('src/data.ts', 'utf8');

code = code.replace(
  '  GOLD_24K: { name: "24K Gold Gram", persianName: "طلای ۲۴ عیار", symbol: "GOLD_24K", decimals: 0, unit: "تومان / گرم" },',
  '  GOLD_24K: { name: "24K Gold Gram", persianName: "طلای ۲۴ عیار", symbol: "GOLD_24K", decimals: 0, unit: "تومان / گرم" },\n  MESGHAL: { name: "Gold Mesghal", persianName: "مثقال طلا", symbol: "MESGHAL", decimals: 0, unit: "تومان / مثقال" },'
);

code = code.replace(
  '    {',
  `    {
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
    {`
);

fs.writeFileSync('src/data.ts', code);
