const fs = require('fs');
let code = fs.readFileSync('src/services/aiEngine.ts', 'utf8');

const regex = /export async function triggerAIAnalysis\([\s\S]*?\}\n\}/;
const replacement = `export async function triggerAIAnalysis(
  assetId: AssetId,
  candles: Candle[],
  config: AIProviderConfig,
  customRules?: any[],
  telegramPrice?: number
): Promise<AnalysisResponse> {
  try {
    let res = await fetch("/api/analysis/latest");
    let data = await res.json();
    
    // If no analysis is available or it's a placeholder, try to refresh it
    if (!data || !data.trend || data.content === "در حال حاضر تحلیلی در دسترس نیست.") {
        const refreshRes = await fetch("/api/analysis/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assetId, currentPrice: candles[candles.length - 1]?.close || 0 })
        });
        if (refreshRes.ok) {
            data = await refreshRes.json();
        }
    }
    
    if (data.error) {
        throw new Error(data.error);
    }
    
    return data;
  } catch (err: any) {
    console.error("AI Analysis Error:", err);
    throw err;
  }
}`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/services/aiEngine.ts', code);
