const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'validateAndNormalizePrice("MELTED_GOLD", mGold, "Connector")',
  'validateAndNormalizePrice("MELTED_GOLD", mGold, "IRR", "Connector")'
);

code = code.replace(
  'validateAndNormalizePrice("GOLD_18K", g18k, "Connector")',
  'validateAndNormalizePrice("GOLD_18K", g18k, "IRR", "Connector")'
);

code = code.replace(
  'validateAndNormalizePrice(conn.targetAssetId, price, "Connector")',
  'validateAndNormalizePrice(conn.targetAssetId, price, "IRR", "Connector")'
);

code = code.replace(
  'validateAndNormalizePrice(activeAssetId, currentPrice, "Live Feed")',
  'validateAndNormalizePrice(activeAssetId, currentPrice, "IRR", "Live Feed")'
);

code = code.replace(
  'validateAndNormalizePrice("MELTED_GOLD", prices["MELTED_GOLD"], "Live Feed")',
  'validateAndNormalizePrice("MELTED_GOLD", prices["MELTED_GOLD"], "IRR", "Live Feed")'
);

fs.writeFileSync('src/App.tsx', code);

let nextCode = fs.readFileSync('src/components/NextDayForecast.tsx', 'utf8');
nextCode = nextCode.replace(
  'validateAndNormalizePrice("MELTED_GOLD", req.meltedGold, "Manual")',
  'validateAndNormalizePrice("MELTED_GOLD", req.meltedGold, "IRR", "Manual")'
);
nextCode = nextCode.replace(
  'validateAndNormalizePrice("USDIRT", req.usdIrt, "Manual")',
  'validateAndNormalizePrice("USDIRT", req.usdIrt, "IRR", "Manual")'
);
fs.writeFileSync('src/components/NextDayForecast.tsx', nextCode);

