const fs = require('fs');
let code = fs.readFileSync('src/components/NextDayForecast.tsx', 'utf8');

code = code.replace(/  tomorrowForecast\?: string;/, `  tomorrowForecast?: {
    low?: string;
    centralEstimate?: string;
    high?: string;
  };`);

fs.writeFileSync('src/components/NextDayForecast.tsx', code);
