const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `    const { getSourcesStatus } = await import('./src/server/sourceEngine.js').catch(() => ({ getSourcesStatus: () => [] }));
    let assets: any[] = [];
    try {
      const allSources = getSourcesStatus();
      assets = allSources.flatMap((s: any) => s.parsedAssets || []).filter((a: any) => a.assetKey === 'gold_18k' && a.validationStatus === 'valid');
    } catch(e) {}`,
  `    let assets: any[] = [];
    try {
      const allSources = getSourcesStatus();
      assets = allSources.flatMap((s: any) => s.parsedAssets || []).filter((a: any) => a.assetKey === 'gold_18k' && a.validationStatus === 'valid');
    } catch(e) {}`
);

fs.writeFileSync('server.ts', code);
