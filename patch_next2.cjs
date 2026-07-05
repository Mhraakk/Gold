const fs = require('fs');
let code = fs.readFileSync('src/components/NextDayForecast.tsx', 'utf8');

code = code.replace(
  /disabled=\{isAnalyzing \|\| !inputData\.meltedGold \|\| !inputData\.usdIrt\}/,
  'disabled={isAnalyzing || !inputData.meltedGold || !inputData.usdIrt || !inputData.xauusd}'
);

fs.writeFileSync('src/components/NextDayForecast.tsx', code);
