const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                      [
                        "MELTED_GOLD",
                        "GOLD_18K",
                        "COIN_EMAMI",
                        "USDIRT",
                        "USDTIRT",
                        "XAUUSD",
                      ].includes(a.id),`;

const replacement = `                      [
                        "MELTED_GOLD",
                        "GOLD_18K",
                        "GOLD_24K",
                        "COIN_EMAMI",
                        "COIN_HALF",
                        "COIN_QUARTER",
                        "USDIRT",
                        "USDTIRT",
                        "XAUUSD",
                      ].includes(a.id),`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
