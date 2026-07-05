const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "next['MELTED_GOLD'] = validateAndNormalizePrice('MELTED_GOLD', abshdhJson.data.MELTED_GOLD, 'TOMAN', 'Telegram @abshdh').canonicalValue;",
  "next['MELTED_GOLD'] = validateAndNormalizePrice('MELTED_GOLD', abshdhJson.data.MELTED_GOLD, 'IRR', 'Telegram @abshdh').canonicalValue;"
);
code = code.replace(
  "next['GOLD_18K'] = validateAndNormalizePrice('GOLD_18K', abshdhJson.data.GOLD_18K, 'TOMAN', 'Telegram @abshdh').canonicalValue;",
  "next['GOLD_18K'] = validateAndNormalizePrice('GOLD_18K', abshdhJson.data.GOLD_18K, 'IRR', 'Telegram @abshdh').canonicalValue;"
);

fs.writeFileSync('src/App.tsx', code);

let nextDayCode = fs.readFileSync('src/components/NextDayForecast.tsx', 'utf8');
nextDayCode = nextDayCode.replace(
  "meltedGold: liveData.abshdh?.MELTED_GOLD ? liveData.abshdh.MELTED_GOLD * 10 : prev.meltedGold,",
  "meltedGold: liveData.abshdh?.MELTED_GOLD ? liveData.abshdh.MELTED_GOLD : prev.meltedGold,"
);
nextDayCode = nextDayCode.replace(
  "gold18k: liveData.tgju?.gold_18k?.value || (liveData.abshdh?.GOLD_18K ? liveData.abshdh.GOLD_18K * 10 : prev.gold18k),",
  "gold18k: liveData.tgju?.gold_18k?.value || (liveData.abshdh?.GOLD_18K ? liveData.abshdh.GOLD_18K : prev.gold18k),"
);
fs.writeFileSync('src/components/NextDayForecast.tsx', nextDayCode);

