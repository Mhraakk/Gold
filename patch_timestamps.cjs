const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('tgjuTimestamps')) {
  code = code.replace(
    'const [prices, setPrices] = useState<Partial<Record<AssetId, number>>>({});',
    'const [prices, setPrices] = useState<Partial<Record<AssetId, number>>>({});\n  const [sourceTimestamps, setSourceTimestamps] = useState<Record<string, number>>({});\n  const [currentTimeMs, setCurrentTimeMs] = useState<number>(Date.now());\n\n  useEffect(() => {\n    const int = setInterval(() => setCurrentTimeMs(Date.now()), 1000);\n    return () => clearInterval(int);\n  }, []);'
  );

  code = code.replace(
    "return { ...prev, [assetId]: validateAndNormalizePrice(assetId, json.value, unit, 'TGJU').canonicalValue };",
    "setSourceTimestamps(prev => ({...prev, [assetId]: json.fetchedAt || Date.now()}));\n                            return { ...prev, [assetId]: validateAndNormalizePrice(assetId, json.value, unit, 'TGJU').canonicalValue };"
  );
  
  code = code.replace(
    "next['MELTED_GOLD'] = validateAndNormalizePrice('MELTED_GOLD', abshdhJson.data.MELTED_GOLD, 'IRR', 'Telegram @abshdh').canonicalValue;",
    "setSourceTimestamps(prev => ({...prev, ['MELTED_GOLD']: abshdhJson.timestamp || Date.now()}));\n        next['MELTED_GOLD'] = validateAndNormalizePrice('MELTED_GOLD', abshdhJson.data.MELTED_GOLD, 'IRR', 'Telegram @abshdh').canonicalValue;"
  );

  code = code.replace(
    "next['GOLD_18K'] = validateAndNormalizePrice('GOLD_18K', abshdhJson.data.GOLD_18K, 'IRR', 'Telegram @abshdh').canonicalValue;",
    "setSourceTimestamps(prev => ({...prev, ['GOLD_18K']: abshdhJson.timestamp || Date.now()}));\n        next['GOLD_18K'] = validateAndNormalizePrice('GOLD_18K', abshdhJson.data.GOLD_18K, 'IRR', 'Telegram @abshdh').canonicalValue;"
  );

  fs.writeFileSync('src/App.tsx', code);
}
