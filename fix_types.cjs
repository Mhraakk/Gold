const fs = require('fs');

// Fix types in forecastEngine.ts
let engineCode = fs.readFileSync('src/services/forecastEngine.ts', 'utf8');
if (!engineCode.includes('jalaliGeneratedAt?:')) {
  engineCode = engineCode.replace(
    /export interface ForecastResult \{/,
    `export interface ForecastResult {
  jalaliGeneratedAt?: string;
  generatedAt?: string;
  dataQuality?: string;
  confidence?: string;
  tomorrowForecast?: { low: string | number; high: string | number; centralEstimate: string | number; unit?: string; confidence?: string; };
  marketSummary?: string;
  alternateScenario?: string;
  supportLevels?: string[];
  resistanceLevels?: string[];
  invalidationLevel?: string;
  sourcesUsed?: string[];`
  );
  fs.writeFileSync('src/services/forecastEngine.ts', engineCode);
}

// Add imports in NextDayForecast.tsx
let nextCode = fs.readFileSync('src/components/NextDayForecast.tsx', 'utf8');
if (!nextCode.includes('Activity')) {
  nextCode = nextCode.replace(
    /import \{ BarChart, Brain, Calculator, Target, Info, Crosshair, CheckCircle2, History, AlertTriangle \} from "lucide-react";/,
    'import { BarChart, Brain, Calculator, Target, Info, Crosshair, CheckCircle2, History, AlertTriangle, Activity, TrendingUp, TrendingDown } from "lucide-react";'
  );
  fs.writeFileSync('src/components/NextDayForecast.tsx', nextCode);
}

