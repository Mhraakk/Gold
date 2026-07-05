export type DataQualityStatus = "تأیید متقابل" | "نیازمند بررسی" | "در حال ارزیابی" | "تایید نشده";

export interface DataQualityResult {
  status: DataQualityStatus;
  score: number;
  divergencePercent: number;
  referencePrice: number | null;
}

export async function checkDataQuality(assetId: string, currentPrice: number): Promise<DataQualityResult> {
  let tgjuAsset = "";
  if (assetId === "MELTED_GOLD") tgjuAsset = "abshodeh_naghdi"; // TGJU abshodeh
  else if (assetId === "GOLD_18K") tgjuAsset = "gold_18k";
  else if (assetId === "USDIRT") tgjuAsset = "dollar_azad";
  else if (assetId === "USDTIRT") tgjuAsset = "tether";
  else if (assetId === "COIN_EMAMI") tgjuAsset = "emami";
  else if (assetId === "XAUUSD") tgjuAsset = "xauusd";
  
  if (!tgjuAsset) {
    return { status: "در حال ارزیابی", score: 0, divergencePercent: 0, referencePrice: null };
  }

  try {
    const res = await fetch(`/api/market/tgju/latest?asset=${tgjuAsset}`);
    if (!res.ok) throw new Error("Fetch failed");
    const data = await res.json();
    if (!data || !data.value) throw new Error("Invalid data");
    
    // Convert TGJU value to standard canonical value matching prices object
    let refPrice = data.value;
    
    // Adjust reference price scale if it's off by factor of 10 or 1000
    // This handles discrepancies between Toman and Rial formats from different sources
    let adjustedRef = refPrice;
    
    // Check divergence across different scales (1x, 10x, 0.1x, etc.)
    const possibleRefs = [refPrice, refPrice * 10, refPrice / 10, refPrice * 1000, refPrice / 1000];
    let bestRef = refPrice;
    let minDivergence = Infinity;
    
    for (const pr of possibleRefs) {
      if (pr === 0) continue;
      const div = Math.abs(currentPrice - pr) / pr;
      if (div < minDivergence) {
        minDivergence = div;
        bestRef = pr;
      }
    }
    
    const divergencePercent = minDivergence * 100;
    
    let status: DataQualityStatus = "نیازمند بررسی";
    let score = 50;
    
    // Usually less than 1.0% divergence means they match closely
    if (divergencePercent < 1.0) { 
      status = "تأیید متقابل";
      score = 100;
    } else if (divergencePercent > 5.0) {
      status = "تایید نشده";
      score = 0;
    }
    
    return { status, score, divergencePercent, referencePrice: bestRef };
  } catch (error) {
    return { status: "در حال ارزیابی", score: 0, divergencePercent: 0, referencePrice: null };
  }
}
