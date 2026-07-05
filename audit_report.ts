import { validateAndNormalizePrice } from './src/utils/dataValidation';

async function run() {
  const assets = [
    { id: 'MELTED_GOLD', source: 'Telegram @abshdh', url: 'http://localhost:3000/api/market/abshdh' },
    { id: 'GOLD_18K', source: 'Telegram @abshdh', url: 'http://localhost:3000/api/market/abshdh' },
    { id: 'COIN_EMAMI', source: 'TGJU', url: 'http://localhost:3000/api/market/tgju/latest?asset=emami' },
    { id: 'USDIRT', source: 'TGJU', url: 'http://localhost:3000/api/market/tgju/latest?asset=dollar_azad' },
    { id: 'XAUUSD', source: 'TGJU', url: 'http://localhost:3000/api/market/tgju/latest?asset=xauusd' },
  ];

  console.log("=== INTERNAL AUDIT REPORT ===");

  for (const asset of assets) {
    let rawText = "";
    let rawValue = 0;
    let nativeUnit = "UNKNOWN";

    try {
      const res = await fetch(asset.url);
      const json = await res.json();
      
      if (asset.source === 'Telegram @abshdh') {
         rawValue = json.data[asset.id];
         rawText = json.rawText;
         nativeUnit = "IRR";
      } else {
         rawValue = json.value;
         rawText = String(json.value);
         nativeUnit = asset.id === 'XAUUSD' ? 'USD' : 'IRR';
      }

      const normalized = validateAndNormalizePrice(
        asset.id as any, 
        rawValue, 
        nativeUnit as any, 
        asset.source, 
        rawText
      );

      console.log(`\nAsset: ${asset.id}`);
      console.log(`Raw source text: ${normalized.rawText.substring(0, 50).replace(/\n/g, ' ')}...`);
      console.log(`Raw number: ${normalized.rawValue}`);
      console.log(`Source native unit: ${nativeUnit}`);
      console.log(`Canonical stored value: ${normalized.canonicalValue} ${normalized.canonicalCurrency}`);
      console.log(`Display value: ${normalized.displayValue} ${normalized.displayUnit}`);
      console.log(`Market notation: ${normalized.marketNotation}`);
      console.log(`Validation result: ${normalized.validationStatus}`);

    } catch (e: any) {
      console.error(`Error auditing ${asset.id}:`, e.message);
    }
  }
}
run();
