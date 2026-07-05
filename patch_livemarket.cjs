const fs = require('fs');
let code = fs.readFileSync('src/components/LiveMarketSources.tsx', 'utf8');

code = code.replace(
  "fetchTgjuData('tether'),",
  "fetchTgjuData('tether'),\n      fetchTgjuData('gold_24k'),\n      fetchTgjuData('mesghal'),\n      fetchTgjuData('nim_sekeh'),\n      fetchTgjuData('rob_sekeh'),"
);

code = code.replace(
  "{/* Emami Coin */}",
  `
        {/* 24k Gold */}
        <TgjuCard assetKey="gold_24k" data={data['gold_24k']} />
        
        {/* Mesghal */}
        <TgjuCard assetKey="mesghal" data={data['mesghal']} />

        {/* Emami Coin */}
`
);

code = code.replace(
  "{/* Tether */}",
  `
        {/* Half Coin */}
        <TgjuCard assetKey="nim_sekeh" data={data['nim_sekeh']} />
        
        {/* Quarter Coin */}
        <TgjuCard assetKey="rob_sekeh" data={data['rob_sekeh']} />

        {/* Tether */}
`
);

fs.writeFileSync('src/components/LiveMarketSources.tsx', code);
