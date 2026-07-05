const fs = require('fs');
let code = fs.readFileSync('src/components/NextDayForecast.tsx', 'utf8');

const injection = `      // Update form values
      setInputData(prev => ({
        ...prev,
        meltedGold: data.fields.meltedGoldMazaneh?.value ? Number(data.fields.meltedGoldMazaneh.value) : prev.meltedGold,
        gold18k: data.fields.gold18k?.value ? Number(data.fields.gold18k.value) : prev.gold18k,
        xauusd: data.fields.xauusd?.value ? Number(data.fields.xauusd.value) : prev.xauusd,
        usdIrt: data.fields.usdIrt?.value ? Number(data.fields.usdIrt.value) : prev.usdIrt,
        usdtIrt: data.fields.usdtIrt?.value ? Number(data.fields.usdtIrt.value) : prev.usdtIrt,
        emamiCoin: data.fields.emamiCoin?.value ? Number(data.fields.emamiCoin.value) : prev.emamiCoin,
      }));
      
      if (data.missingFields && data.missingFields.length > 0) {
        setAutofillError("عدم دریافت مقادیر معتبر برای: " + data.missingFields.join(", "));
      }`;

code = code.replace(
  /      \/\/ Update form values[\s\S]*?emamiCoin: data.fields.emamiCoin\?.value \? Number\(data.fields.emamiCoin.value\) : prev.emamiCoin,\n      \}\)\);/,
  injection
);

fs.writeFileSync('src/components/NextDayForecast.tsx', code);
