const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '"GOLD_24K",',
  '"GOLD_24K",\n                        "MESGHAL",'
);

const fetchTarget = `        await handleTgju(tetherRes, 'USDTIRT');
        await handleTgju(gold24kRes, 'GOLD_24K');
        await handleTgju(halfCoinRes, 'COIN_HALF');
        await handleTgju(quarterCoinRes, 'COIN_QUARTER');`;

const fetchReplacement = `        await handleTgju(tetherRes, 'USDTIRT');
        await handleTgju(gold24kRes, 'GOLD_24K');
        await handleTgju(halfCoinRes, 'COIN_HALF');
        await handleTgju(quarterCoinRes, 'COIN_QUARTER');
        
        const mesghalRes = await fetch('/api/market/tgju/latest?asset=mesghal');
        await handleTgju(mesghalRes, 'MESGHAL' as any);`;

code = code.replace(fetchTarget, fetchReplacement);

fs.writeFileSync('src/App.tsx', code);
