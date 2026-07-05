const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '{activeTab === "forecast" && (\n              <NextDayForecast aiConfig={aiConfig} />\n            )}',
  '{activeTab === "forecast" && (\n              <div className="space-y-6">\n                <Gold18ForecastPanel />\n                <NextDayForecast aiConfig={aiConfig} />\n              </div>\n            )}'
);

fs.writeFileSync('src/App.tsx', code);
