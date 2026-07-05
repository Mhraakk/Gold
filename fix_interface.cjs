const fs = require('fs');
let code = fs.readFileSync('src/components/NextDayForecast.tsx', 'utf8');

const newProps = `  jalaliGeneratedAt?: string;
  generatedAt?: string;
  dataQuality?: string;
  confidence?: string;
  tomorrowForecast?: string;
  marketSummary?: string;
  alternateScenario?: string;
  supportLevels?: number[];
  resistanceLevels?: number[];
  invalidationLevel?: number;
  sourcesUsed?: string[];
`;

code = code.replace(/export interface ForecastResult \{/, 'export interface ForecastResult {\n' + newProps);

fs.writeFileSync('src/components/NextDayForecast.tsx', code);
