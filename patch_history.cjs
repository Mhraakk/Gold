const fs = require('fs');
let code = fs.readFileSync('src/services/forecastEngine.ts', 'utf8');

const targetStr = `export function getForecastHistory(): ForecastResult[] {
  try {
    const data = localStorage.getItem("next_day_forecasts");
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}`;

const replacementStr = `import { validateAndNormalizePrice } from '../utils/dataValidation';

export function getForecastHistory(): ForecastResult[] {
  try {
    const data = localStorage.getItem("next_day_forecasts");
    if (!data) return [];
    const parsed: ForecastResult[] = JSON.parse(data);
    
    // Validate historical records
    const validHistory = parsed.filter(record => {
       // Check melted gold
       if (!record.inputs?.meltedGold) return false;
       const vMelted = validateAndNormalizePrice("MELTED_GOLD", record.inputs.meltedGold, "IRR", "History");
       if (vMelted.validationStatus !== "valid") return false;

       // Check USD
       if (!record.inputs?.usdIrt) return false;
       const vUsd = validateAndNormalizePrice("USDIRT", record.inputs.usdIrt, "IRR", "History");
       if (vUsd.validationStatus !== "valid") return false;

       // Check XAUUSD
       if (!record.inputs?.xauusd) return false;
       const vXau = validateAndNormalizePrice("XAUUSD", record.inputs.xauusd, "USD", "History");
       if (vXau.validationStatus !== "valid") return false;
       
       return true;
    });
    
    return validHistory;
  } catch (e) {
    return [];
  }
}`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/services/forecastEngine.ts', code);
