const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `        const [xauusdRes, usdIrtRes, emamiRes, tetherRes] = await Promise.all([
          fetch('/api/market/tgju/latest?asset=xauusd'),
          fetch('/api/market/tgju/latest?asset=dollar_azad'),
          fetch('/api/market/tgju/latest?asset=emami'),
          fetch('/api/market/tgju/latest?asset=tether')
        ]);`;

const replacement = `        const [xauusdRes, usdIrtRes, emamiRes, tetherRes, gold24kRes, halfCoinRes, quarterCoinRes] = await Promise.all([
          fetch('/api/market/tgju/latest?asset=xauusd'),
          fetch('/api/market/tgju/latest?asset=dollar_azad'),
          fetch('/api/market/tgju/latest?asset=emami'),
          fetch('/api/market/tgju/latest?asset=tether'),
          fetch('/api/market/tgju/latest?asset=gold_24k'),
          fetch('/api/market/tgju/latest?asset=nim_sekeh'),
          fetch('/api/market/tgju/latest?asset=rob_sekeh')
        ]);`;

code = code.replace(target, replacement);

const target2 = `        await handleTgju(xauusdRes, 'XAUUSD');
        await handleTgju(usdIrtRes, 'USDIRT');
        await handleTgju(emamiRes, 'COIN_EMAMI');
        await handleTgju(tetherRes, 'USDTIRT');`;

const replacement2 = `        await handleTgju(xauusdRes, 'XAUUSD');
        await handleTgju(usdIrtRes, 'USDIRT');
        await handleTgju(emamiRes, 'COIN_EMAMI');
        await handleTgju(tetherRes, 'USDTIRT');
        await handleTgju(gold24kRes, 'GOLD_24K');
        await handleTgju(halfCoinRes, 'COIN_HALF');
        await handleTgju(quarterCoinRes, 'COIN_QUARTER');`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/App.tsx', code);
