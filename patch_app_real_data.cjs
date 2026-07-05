const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetToRemove = `    // Simulate small noise for non-connected assets
    const tickInterval = setInterval(() => {
      setPrices((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          const assetKey = key as AssetId;
          const meta = ASSETS_METADATA[assetKey];

          const activeConn = connectors.find(
            (c) => c.isActive && c.targetAssetId === assetKey,
          );
          if (!activeConn && next[assetKey] !== 0) {
            // Apply small noise only for fallback assets that don't have an active connector
            const noiseRange =
              assetKey === "MELTED_GOLD"
                ? 5000
                : assetKey.includes("COIN")
                  ? 20000
                  : 0.95;
            const delta = (Math.random() - 0.5) * noiseRange * 0.4;
            next[assetKey] = parseFloat(
              (next[assetKey] + delta).toFixed(meta.decimals),
            );
          }
        });
        return next;
      });
    }, 2500);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(tickInterval);
    };`;

const replacement = `    const fetchLiveSources = async () => {
      try {
        const [abshdhRes, xauusdRes, usdIrtRes, emamiRes] = await Promise.all([
          fetch('/api/market/abshdh').catch(() => null),
          fetch('/api/market/tgju/latest?asset=xauusd').catch(() => null),
          fetch('/api/market/tgju/latest?asset=dollar_azad').catch(() => null),
          fetch('/api/market/tgju/latest?asset=emami').catch(() => null)
        ]);

        if (abshdhRes && abshdhRes.ok) {
          const abshdhJson = await abshdhRes.json();
          if (abshdhJson.success && abshdhJson.data) {
             setPrices(prev => {
                const next = { ...prev };
                const hasCustomMelted = connectors.find(c => c.isActive && c.targetAssetId === 'MELTED_GOLD');
                if (!hasCustomMelted && abshdhJson.data.MELTED_GOLD) {
                   next['MELTED_GOLD'] = validateAndNormalizePrice('MELTED_GOLD', abshdhJson.data.MELTED_GOLD, 'IRR', 'Telegram @abshdh').canonicalValue;
                }
                const hasCustom18k = connectors.find(c => c.isActive && c.targetAssetId === 'GOLD_18K');
                if (!hasCustom18k && abshdhJson.data.GOLD_18K) {
                   next['GOLD_18K'] = validateAndNormalizePrice('GOLD_18K', abshdhJson.data.GOLD_18K, 'IRR', 'Telegram @abshdh').canonicalValue;
                }
                return next;
             });
          }
        }

        const handleTgju = async (res, assetId) => {
            if (res && res.ok) {
                const json = await res.json();
                if (json.value) {
                    setPrices(prev => {
                        const hasCustom = connectors.find(c => c.isActive && c.targetAssetId === assetId);
                        if (!hasCustom) {
                            // TGJU native unit is TOMAN for Iranian assets, USD for xauusd
                            const unit = assetId === 'XAUUSD' ? 'USD' : 'TOMAN';
                            return { ...prev, [assetId]: validateAndNormalizePrice(assetId, json.value, unit, 'TGJU').canonicalValue };
                        }
                        return prev;
                    });
                }
            }
        };

        await handleTgju(xauusdRes, 'XAUUSD');
        await handleTgju(usdIrtRes, 'USDIRT');
        await handleTgju(emamiRes, 'COIN_EMAMI');

      } catch (err) {
        console.warn("Live source fetch error:", err);
      }
    };

    fetchLiveSources();
    const liveInterval = setInterval(fetchLiveSources, 60000);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(liveInterval);
    };`;

code = code.replace(targetToRemove, replacement);
fs.writeFileSync('src/App.tsx', code);
