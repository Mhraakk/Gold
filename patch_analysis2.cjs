const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const anchor = `      if (forceRefresh) {
        url = "/api/analysis/refresh";
        method = "POST";
      }
      
      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": \`Bearer \${session?.access_token}\`
        }
      });`;

const replace = `      let body = undefined;
      if (forceRefresh) {
        url = "/api/analysis/refresh";
        method = "POST";
        body = JSON.stringify({
          assetId: activeAssetId,
          currentPrice: prices[activeAssetId]
        });
      }
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": \`Bearer \${session?.access_token}\`
        },
        body
      });`;

code = code.replace(anchor, replace);
fs.writeFileSync('src/App.tsx', code);
