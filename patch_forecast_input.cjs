const fs = require('fs');
let code = fs.readFileSync('src/components/NextDayForecast.tsx', 'utf8');

const target1 = `    setInputData(prev => ({
      ...prev,
      meltedGold: liveData.abshdh?.MELTED_GOLD || prev.meltedGold,
      gold18k: liveData.tgju?.gold_18k?.value || liveData.abshdh?.GOLD_18K || prev.gold18k,
      xauusd: liveData.tgju?.xauusd?.value || prev.xauusd,
      usdIrt: liveData.tgju?.dollar_azad?.value || prev.usdIrt,
      usdtIrt: liveData.tgju?.tether?.value || prev.usdtIrt,
      emamiCoin: liveData.tgju?.emami?.value || prev.emamiCoin,
    }));`;

const replacement1 = `    setInputData(prev => ({
      ...prev,
      meltedGold: liveData.abshdh?.MELTED_GOLD ? liveData.abshdh.MELTED_GOLD * 10 : prev.meltedGold,
      gold18k: liveData.tgju?.gold_18k?.value || (liveData.abshdh?.GOLD_18K ? liveData.abshdh.GOLD_18K * 10 : prev.gold18k),
      xauusd: liveData.tgju?.xauusd?.value || prev.xauusd,
      usdIrt: liveData.tgju?.dollar_azad?.value || prev.usdIrt,
      usdtIrt: liveData.tgju?.tether?.value || prev.usdtIrt,
      emamiCoin: liveData.tgju?.emami?.value || prev.emamiCoin,
    }));`;

code = code.replace(target1, replacement1);

code = code.replace('مظنه فعلی آبشده *', 'مظنه فعلی آبشده (ریال) *');
code = code.replace('اونس جهانی طلا *', 'اونس جهانی طلا (دلار) *');
code = code.replace('دلار آزاد (تهران) *', 'دلار آزاد (ریال) *');

fs.writeFileSync('src/components/NextDayForecast.tsx', code);
