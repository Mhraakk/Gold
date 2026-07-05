#!/bin/bash
# Apply patch to server.ts to add the /api/forecast/autofill endpoint
sed -i '/app.post("\/api\/forecast\/generate",/i \
app.post("/api/forecast/autofill", async (req, res) => {\
  try {\
    const { getSourcesStatus } = await import("./src/utils/sourceRegistry.ts");\
    const sources = getSourcesStatus();\
    \
    const fields: any = {};\
    const missingFields: string[] = [];\
    const warnings: string[] = [];\
    const now = Date.now();\
    \
    const getJalaliDate = () => {\
      return new Intl.DateTimeFormat("fa-IR", { \
        year: "numeric", month: "2-digit", day: "2-digit",\
        hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tehran"\
      }).format(new Date(now));\
    };\
    \
    const isFresh = (ts: number) => (now - ts) < 1800000; // 30 minutes for autofill\
    \
    const findBestRegistryAsset = (assetKeys: string[], sourcePriorities: string[]) => {\
      let bestMatch = null;\
      let bestPriority = 999;\
      \
      for (const source of sources) {\
        if (!source.enabled || source.health === "failing") continue;\
        for (const asset of source.parsedAssets) {\
          if (assetKeys.includes(asset.assetKey) && asset.validationStatus === "valid" && isFresh(asset.timestamp)) {\
            let pIdx = sourcePriorities.indexOf(source.id);\
            if (pIdx === -1) pIdx = 50;\
            if (pIdx < bestPriority) {\
              bestPriority = pIdx;\
              bestMatch = asset;\
            }\
          }\
        }\
      }\
      return bestMatch;\
    };\
    \
    const fillField = (bestMatch: any, formatFn: (val: number) => any) => {\
       if (!bestMatch) return null;\
       const { formattedValue, unit, displayValue } = formatFn(bestMatch.canonicalIrrValue || (bestMatch.rawNumericValue * (bestMatch.sourceNativeCurrency === "TOMAN" ? 10 : 1)));\
       return {\
          value: formattedValue.toString(),\
          rawValue: formattedValue.toString(),\
          unit: unit,\
          displayValue: displayValue,\
          source: bestMatch.sourceName,\
          sourceUrl: bestMatch.sourceUrl,\
          sourceTimestamp: new Date(bestMatch.timestamp).toISOString(),\
          freshness: "verified_live",\
          validationStatus: "verified"\
       };\
    };\
    \
    // 1. Melted Gold\
    const meltedBest = findBestRegistryAsset(["melted_gold"], ["telegram_abshdh", "telegram_sabze_meydun"]);\
    if (meltedBest) {\
       fields.meltedGoldMazaneh = {\
          value: meltedBest.canonicalIrrValue.toString(),\
          rawValue: meltedBest.canonicalIrrValue.toString(),\
          unit: "IRR",\
          displayValue: `مظنه ${(meltedBest.canonicalIrrValue / 1000000).toFixed(2)}`,\
          source: meltedBest.sourceName,\
          sourceUrl: meltedBest.sourceUrl,\
          sourceTimestamp: new Date(meltedBest.timestamp).toISOString(),\
          freshness: "verified_live",\
          validationStatus: "verified"\
       };\
    }\
    \
    // 2. Tether\
    const tetherBest = findBestRegistryAsset(["tether_irt", "tether_toman"], ["arzdigital_tether", "moj3"]);\
    if (tetherBest) {\
       fields.usdtIrt = {\
          value: tetherBest.canonicalIrrValue.toString(),\
          rawValue: tetherBest.canonicalIrrValue.toString(),\
          unit: "IRR",\
          displayValue: `${(tetherBest.canonicalIrrValue / 10).toLocaleString()} تومان`,\
          source: tetherBest.sourceName,\
          sourceUrl: tetherBest.sourceUrl,\
          sourceTimestamp: new Date(tetherBest.timestamp).toISOString(),\
          freshness: "verified_live",\
          validationStatus: "verified"\
       };\
    }\
    \
    // Helper to fetch from TGJU directly if not in cache\
    const fetchTgju = async (assetKey: string) => {\
      const cached = tgjuCache[assetKey];\
      if (cached && isFresh(cached.fetchedAt) && cached.validationStatus === "valid") return cached;\
      \
      const assetConfig = tgjuAssets[assetKey];\
      if (!assetConfig) return null;\
      \
      try {\
        const response = await fetch(assetConfig.sourceUrl, {\
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }\
        });\
        if (!response.ok) return null;\
        const html = await response.text();\
        const $ = cheerio.load(html);\
        let priceText = $(".value-right .price, [data-field=\'price\']").first().text().trim();\
        if (!priceText) priceText = $("td.text-left").first().text().trim();\
        if (!priceText) priceText = $("table.table-market tbody tr:first-child td.text-left").text().trim();\
        priceText = priceText.replace(/[۰-۹]/g, w => String.fromCharCode(w.charCodeAt(0) - 1728));\
        priceText = priceText.replace(/[٠-٩]/g, w => String.fromCharCode(w.charCodeAt(0) - 1584));\
        let value = parseFloat(priceText.replace(/,/g, ""));\
        if (assetKey === "tether" && value < 1000) return null;\
        if (isNaN(value)) return null;\
        \
        const result = {\
          value, unit: assetConfig.expectedUnit, fetchedAt: now,\
          sourceUpdatedAt: now, source: "TGJU", sourceUrl: assetConfig.sourceUrl,\
          freshness: "live", ageSeconds: 0, validationStatus: "valid"\
        };\
        tgjuCache[assetKey] = result;\
        return result;\
      } catch (e) {\
        return null;\
      }\
    };\
    \
    const fillFromTgju = async (tgjuKey: string, fieldName: string, unit: "IRR" | "USD") => {\
      const data = await fetchTgju(tgjuKey);\
      if (data && data.validationStatus === "valid") {\
        let val = data.value;\
        if (unit === "IRR" && data.unit.includes("IRT")) val = val * 10;\
        fields[fieldName] = {\
          value: val.toString(),\
          rawValue: val.toString(),\
          unit: unit,\
          displayValue: unit === "IRR" ? `${(val / 10).toLocaleString()} تومان` : `${val.toLocaleString()} ${unit}`,\
          source: data.source,\
          sourceUrl: data.sourceUrl,\
          sourceTimestamp: new Date(data.fetchedAt).toISOString(),\
          freshness: "verified_live",\
          validationStatus: "verified"\
        };\
      } else {\
        missingFields.push(fieldName);\
      }\
    };\
    \
    if (!fields.usdtIrt) await fillFromTgju("tether", "usdtIrt", "IRR");\
    await fillFromTgju("xauusd", "xauusd", "USD");\
    await fillFromTgju("dollar_azad", "usdIrt", "IRR");\
    \
    const gold18Best = findBestRegistryAsset(["gold_18k"], ["parvazcoin", "isignal_gold_currency", "moj3"]);\
    if (gold18Best) {\
       fields.gold18k = {\
          value: gold18Best.canonicalIrrValue.toString(),\
          rawValue: gold18Best.canonicalIrrValue.toString(),\
          unit: "IRR",\
          displayValue: `${(gold18Best.canonicalIrrValue / 10).toLocaleString()} تومان`,\
          source: gold18Best.sourceName,\
          sourceUrl: gold18Best.sourceUrl,\
          sourceTimestamp: new Date(gold18Best.timestamp).toISOString(),\
          freshness: "verified_live",\
          validationStatus: "verified"\
       };\
    } else {\
       await fillFromTgju("gold_18k", "gold18k", "IRR");\
    }\
    \
    const emamiBest = findBestRegistryAsset(["emami_coin"], ["parvazcoin", "isignal_gold_currency"]);\
    if (emamiBest) {\
       fields.emamiCoin = {\
          value: emamiBest.canonicalIrrValue.toString(),\
          rawValue: emamiBest.canonicalIrrValue.toString(),\
          unit: "IRR",\
          displayValue: `${(emamiBest.canonicalIrrValue / 10).toLocaleString()} تومان`,\
          source: emamiBest.sourceName,\
          sourceUrl: emamiBest.sourceUrl,\
          sourceTimestamp: new Date(emamiBest.timestamp).toISOString(),\
          freshness: "verified_live",\
          validationStatus: "verified"\
       };\
    } else {\
       await fillFromTgju("emami", "emamiCoin", "IRR");\
    }\
    \
    if (!fields.meltedGoldMazaneh) missingFields.push("meltedGoldMazaneh");\
    \
    res.json({\
      success: true,\
      generatedAt: new Date().toISOString(),\
      jalaliGeneratedAt: getJalaliDate(),\
      fields,\
      missingFields,\
      warnings: missingFields.length > 0 ? ["Some fields could not be filled automatically due to missing valid live data"] : []\
    });\
  } catch (err: any) {\
    console.error("Autofill error:", err);\
    res.status(500).json({ error: err.message, success: false });\
  }\
});\
' server.ts
bash patch_server.sh
