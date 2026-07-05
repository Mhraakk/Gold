const fs = require('fs');
let code = fs.readFileSync('src/components/NextDayForecast.tsx', 'utf8');

code = code.replace(
  'req.usdIrt = vUsd.canonicalValue;',
  'req.usdIrt = vUsd.canonicalValue;\n      const vXau = validateAndNormalizePrice("XAUUSD", req.xauusd, "USD", "Manual");\n      if (vXau.validationStatus !== "valid") throw new Error("مبلغ اونس نامعتبر است.");\n      req.xauusd = vXau.canonicalValue;'
);

fs.writeFileSync('src/components/NextDayForecast.tsx', code);
