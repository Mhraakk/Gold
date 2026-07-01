import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Check if a given string is empty or a placeholder key
function isPlaceholderOrEmpty(key?: string): boolean {
  if (!key) return true;
  const cleaned = key.trim().toLowerCase();
  if (
    cleaned === "" || 
    cleaned === "undefined" || 
    cleaned === "null" ||
    cleaned === "my_gemini_api_key" ||
    cleaned === "your_api_key" ||
    cleaned.includes("your_api_key") ||
    cleaned.includes("your_gemini") ||
    cleaned.includes("placeholder") ||
    cleaned.includes("enter_") ||
    cleaned.includes("key_here")
  ) {
    return true;
  }
  return false;
}

// Lazy initialiser for Gemini API clients
function getGeminiClient(customKey?: string) {
  // If the client passed a customKey but it's a placeholder, ignore it
  const finalKey = isPlaceholderOrEmpty(customKey) ? process.env.GEMINI_API_KEY : customKey;
  
  if (isPlaceholderOrEmpty(finalKey)) {
    throw new Error("GEMINI_API_KEY is not configured on this server or in terminal settings.");
  }
  
  return new GoogleGenAI({
    apiKey: finalKey!,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Generate server-side backup rule-based analysis if Gemini API is missing or fails
function generateBackupAnalysis(assetId: string, symbol: string, currentPrice: number, marketStructure: any, customRules?: any[]) {
  const lastPrice = currentPrice || 1000;
  const supports = marketStructure?.supportLines || [lastPrice * 0.985, lastPrice * 0.965];
  const resistances = marketStructure?.resistanceLines || [lastPrice * 1.015, lastPrice * 1.035];
  const obs = marketStructure?.orderBlocks || [];

  const buyZoneStart = supports[0] || lastPrice * 0.985;
  const sellZoneStart = resistances[0] || lastPrice * 1.015;

  let rulesMd = "";
  if (customRules && customRules.length > 0) {
    rulesMd = `\n\n4. **Custom Automation Strategy Rules:**\n` + 
      customRules.map((r: any) => {
        const trig = r.isTriggered ? "🔴 **TRIGGERED**" : "⚪ WAITING";
        const conds = `${r.cond1Metric} ${r.cond1Op} ${r.cond1Value}` + 
          (r.cond2Metric !== "none" ? ` ${r.conditionType.toUpperCase()} ${r.cond2Metric} ${r.cond2Op} ${r.cond2Value}` : "");
        return `- **${r.name}** [${trig}]: If \`${conds}\` → Signal **${r.actionSignal}**`;
      }).join("\n");
  }

  return {
    assetId,
    timestamp: new Date().toISOString(),
    trend: "CONSOLIDATION",
    marketPhase: "Consolidation Re-accumulation",
    confidenceScore: 72,
    probabilityScore: 68,
    supportLevels: supports,
    resistanceLevels: resistances,
    orderBlocks: obs.slice(0, 3).map((ob: any) => ({
      type: ob.type || "bullish",
      range: `${(ob.priceStart || lastPrice * 0.99).toFixed(1)} - ${(ob.priceEnd || lastPrice * 0.995).toFixed(1)}`,
      volume: (ob.volume || 1000).toFixed(0),
    })),
    scenarios: {
      primary: `Price will continue within its structural channel towards the major resistance zone around ${sellZoneStart.toLocaleString()}.`,
      alternative: `Failure to maintain support near the ${buyZoneStart.toLocaleString()} breaker block will trigger liquidity mitigation down to lower levels.`,
      invalidation: `A decisive hourly close below the structural support pivot of ${(supports[1] || lastPrice * 0.97).toLocaleString()} invalidates the bullish setup.`
    },
    tradeSetup: {
      entry: parseFloat(lastPrice.toFixed(2)),
      stopLoss: parseFloat((lastPrice * 0.988).toFixed(2)),
      takeProfit1: parseFloat((lastPrice * 1.012).toFixed(2)),
      takeProfit2: parseFloat((lastPrice * 1.025).toFixed(2)),
      riskRewardRatio: 2.2
    },
    detailedAnalysisMarkdown: `### 🤖 Server-Side Quant Engine Backup Analysis Report
    
The Gemini API key is currently missing, invalid, or expired. To enable complete deep-learning predictive analytics, please set up a valid Gemini API key in the **Settings > Secrets** panel of AI Studio.

In the meantime, the server-side backup quant engine has generated this structural SMC report:

1. **Smart Money Concepts (SMC):**
   - **Order Blocks (OB):** ${obs.length} active zones detected on the chart.
   - **Fair Value Gaps (FVG):** ${marketStructure?.fvgs?.length || 0} active gaps parsed.
   
2. **Support & Resistance Matrix:**
   - **Primary Demand (Support):** \`${supports[0]?.toLocaleString()}\`
   - **Primary Supply (Resistance):** \`${resistances[0]?.toLocaleString()}\`
   
3. **Elliott Wave Context:**
   - Impulse wave pattern remains active. Current structure points to an accumulation phase leading into wave (3) or (5) expansion. Adjust risk profile using the Risk Control module.${rulesMd}`
  };
}

// 1. Health endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 2. AI Market Analysis Endpoint
app.post("/api/analyze-market", async (req, res) => {
  try {
    const { assetId, symbol, currentPrice, lastCandles, marketStructure, customConfig, customRules, telegramPrice } = req.body;
    
    // Extract key elements from client-provided state
    const candlesContext = lastCandles?.slice(-15).map((c: any) => 
      `H:${c.high}, L:${c.low}, C:${c.close}, V:${c.volume}`
    ).join(" | ") || "No candle data available.";

    const obContext = marketStructure?.orderBlocks?.map((ob: any) => 
      `${ob.type.toUpperCase()} OB at [${ob.priceStart.toFixed(1)} - ${ob.priceEnd.toFixed(1)}] Vol:${ob.volume.toFixed(0)}`
    ).join(", ") || "None";

    const fvgContext = marketStructure?.fvgs?.map((fvg: any) => 
      `${fvg.type.toUpperCase()} FVG at [${fvg.highPrice.toFixed(1)} - ${fvg.lowPrice.toFixed(1)}]`
    ).join(", ") || "None";

    let rulesPromptContext = "";
    if (customRules && customRules.length > 0) {
      rulesPromptContext = `\n--- CUSTOM AUTOMATION STRATEGY RULES ---
The user has created custom automation conditions in their Strategy Builder:
${customRules.map((rule: any) => {
  const c2 = rule.cond2Metric !== "none" ? ` ${rule.conditionType.toUpperCase()} ${rule.cond2Metric} ${rule.cond2Op} ${rule.cond2Value}` : "";
  const condString = `${rule.cond1Metric} ${rule.cond1Op} ${rule.cond1Value}${c2}`;
  return `- Rule "${rule.name}" (${rule.isActive ? "ACTIVE" : "DISABLED"}): If ${condString}, trigger ${rule.actionSignal} Signal. Current evaluated status: ${rule.isTriggered ? "TRIGGERED (MATCHED)" : "WAITING (UNMATCHED)"}.`;
}).join("\n")}

Please review these user-defined automation rules. Incorporate their trigger states into your overall recommendation and mention them explicitly in your detailed analysis markdown report where relevant.`;
    }

    let telegramPriceContext = "";
    if (telegramPrice) {
      telegramPriceContext = `\n--- VERIFIED LIVE TELEGRAM PRICE ---
NOTE: The actual real-time Melted Gold (طلای آب شده) rate fetched directly from the Telegram scraper channel is: ${telegramPrice.toLocaleString()} Toman (تومان / مثقال).
Please perform all technical analysis and trade setups based on this actual current price of ${telegramPrice.toLocaleString()} Toman as the primary pricing input for Melted Gold.`;
    }

    const systemPrompt = customConfig?.systemPrompt || `You are a Principal Institutional Quant, Senior SMC Trader, and Market Strategist at a tier-1 investment bank.
Your job is to analyze gold products (Melted Gold طلای آب شده, XAUUSD, ETFs, Futures) with absolute mathematical rigor.
You use Elliott Wave, Fibonacci Levels, and Smart Money Concepts (Order Blocks, FVG, Liquidity Sweeps, CHOCH/BOS).
You MUST provide high-confidence institutional trade setups. No vague generalisations.`;

    const temperature = customConfig?.temperature ?? 0.2;
    const selectedModel = customConfig?.model || "gemini-3.5-flash";

    const prompt = `Perform complete market analysis for ${assetId} (${symbol}).
Current price is: ${telegramPrice && assetId === "MELTED_GOLD" ? telegramPrice : currentPrice}
${telegramPriceContext}

--- MARKET CONTEXT DATA ---
Recent Candle states (latest first):
${candlesContext}

Market Structure SMC Indicators:
- Order Blocks (OB): ${obContext}
- Fair Value Gaps (FVG): ${fvgContext}
- Support lines: ${marketStructure?.supportLines?.join(", ") || "N/A"}
- Resistance lines: ${marketStructure?.resistanceLines?.join(", ") || "N/A"}
- Liquidity Zones: ${JSON.stringify(marketStructure?.liquidityZones || [])}
${rulesPromptContext}

Perform Elliott Wave wave parsing, check SMC mitigation, estimate trend, and return a complete professional trading outlook.
Output must fit the designated JSON format exactly.`;

    let jsonText = "";

    if (customConfig?.provider === "openai" || customConfig?.provider === "openrouter" || customConfig?.provider === "custom" || customConfig?.provider === "deepseek" || customConfig?.provider === "grok" || customConfig?.provider === "claude") {
      let baseURL = "https://api.openai.com/v1";
      if (customConfig.provider === "openrouter") baseURL = "https://openrouter.ai/api/v1";
      else if (customConfig.provider === "deepseek") baseURL = "https://api.deepseek.com/v1";
      else if (customConfig.provider === "grok") baseURL = "https://api.x.ai/v1";
      else if (customConfig.provider === "custom" && customConfig.customEndpoint) baseURL = customConfig.customEndpoint;
      // Claude is a bit different, but we can assume OpenAI compatibility if they use standard wrappers, or we just fallback to the base logic. We'll use OpenAI compatible endpoints for simplicity here.

      const res = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${customConfig.apiKey}`
        },
        body: JSON.stringify({
          model: selectedModel,
          temperature,
          messages: [
            { role: "system", content: systemPrompt + "\nYou MUST output your response strictly as a JSON object matching the required structure." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        })
      });
      if (!res.ok) {
         const errBody = await res.text();
         throw new Error(`API error (${customConfig.provider}): ${res.status} ${errBody}`);
      }
      const data = await res.json();
      jsonText = data.choices[0].message.content;
    } else {
      const ai = getGeminiClient(customConfig?.apiKey);
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: [
              "assetId",
              "timestamp",
              "trend",
              "marketPhase",
              "confidenceScore",
              "probabilityScore",
              "supportLevels",
              "resistanceLevels",
              "orderBlocks",
              "scenarios",
              "tradeSetup",
              "detailedAnalysisMarkdown"
            ],
            properties: {
              assetId: { type: Type.STRING },
              timestamp: { type: Type.STRING },
              trend: { type: Type.STRING, description: "BULLISH, BEARISH, or CONSOLIDATION" },
              marketPhase: { type: Type.STRING, description: "e.g. Accumulation, Mark-Up, Distribution, Re-Accumulation, Elliott Wave 3 Impulsive" },
              confidenceScore: { type: Type.INTEGER, description: "0-100 score of AI conviction" },
              probabilityScore: { type: Type.INTEGER, description: "0-100 probability of price reaching Targets before Stop Loss" },
              supportLevels: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER },
                description: "Top 3 key technical support prices"
              },
              resistanceLevels: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER },
                description: "Top 3 key technical resistance prices"
              },
              orderBlocks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    range: { type: Type.STRING },
                    volume: { type: Type.STRING }
                  }
                }
              },
              scenarios: {
                type: Type.OBJECT,
                properties: {
                  primary: { type: Type.STRING, description: "Highly likely forecast outcome" },
                  alternative: { type: Type.STRING, description: "Secondary path if primary triggers failure" },
                  invalidation: { type: Type.STRING, description: "Price coordinate/event that cancels primary hypothesis" }
                }
              },
              tradeSetup: {
                type: Type.OBJECT,
                properties: {
                  entry: { type: Type.NUMBER },
                  stopLoss: { type: Type.NUMBER },
                  takeProfit1: { type: Type.NUMBER },
                  takeProfit2: { type: Type.NUMBER },
                  riskRewardRatio: { type: Type.NUMBER }
                }
              },
              detailedAnalysisMarkdown: {
                type: Type.STRING,
                description: "Full institutional markdown report including Elliott Wave sub-waves, liquidity sweeps details, volume profile analysis, and geopolitical drivers (for Iranian Gold specifically)."
              }
            }
          }
        }
      });
      jsonText = response.text || "{}";
    }

    res.json(JSON.parse(jsonText || "{}"));
  } catch (error: any) {
    console.log("Analysis API Error:", error.message || error);
    
    const { assetId, symbol, currentPrice, marketStructure, customRules, customConfig } = req.body;
    const systemPromptFallback = customConfig?.systemPrompt || `You are a Principal Institutional Quant, Senior SMC Trader, and Market Strategist at a tier-1 investment bank.
Your job is to analyze gold products (Melted Gold طلای آب شده, XAUUSD, ETFs, Futures) with absolute mathematical rigor.
You use Elliott Wave, Fibonacci Levels, and Smart Money Concepts (Order Blocks, FVG, Liquidity Sweeps, CHOCH/BOS).
You MUST provide high-confidence institutional trade setups. No vague generalisations.`;
    const promptFallback = `Perform complete market analysis for ${assetId} (${symbol}).
Current price is: ${currentPrice}

Market Structure:
${JSON.stringify(marketStructure, null, 2)}

Provide full JSON output.`;
    const tempFallback = customConfig?.temperature ?? 0.2;
    
    if (customConfig?.provider !== "openrouter" && process.env.OPENROUTER_API_KEY) {
      try {
        console.log("Attempting OpenRouter Fallback...");
        const fallbackRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-free",
            temperature: tempFallback,
            messages: [
              { role: "system", content: systemPromptFallback + "\nYou MUST output your response strictly as a JSON object matching the required structure." },
              { role: "user", content: promptFallback }
            ],
            response_format: { type: "json_object" }
          })
        });
        
        if (fallbackRes.ok) {
           const fallbackData = await fallbackRes.json();
           const fallbackJsonText = fallbackData.choices[0].message.content;
           return res.json(JSON.parse(fallbackJsonText || "{}"));
        }
      } catch (fallbackErr: any) {
        console.log("OpenRouter fallback failed:", fallbackErr.message || fallbackErr);
      }
    }
    
    console.log("Applying Server-Side Mock Fallback");
    const backupData = generateBackupAnalysis(assetId, symbol, currentPrice, marketStructure, customRules);
    res.json(backupData);
  }
});

// 3. Telegram Scraping Fallback Route for Iranian Gold
app.get("/api/market/abshdh", async (req, res) => {
  try {
    const response = await fetch("https://t.me/s/abshdh", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Telegram Web return status: ${response.status}`);
    }
    const html = await response.text();
    
    // Extract all message texts
    const messages = [...html.matchAll(/<div class="tgme_widget_message_text[^>]*>(.*?)<\/div>/gs)];
    
    let meltedGold: number | null = null;
    let gold18k: number | null = null;
    
    // Process from the newest messages (bottom) to the oldest
    for (let i = messages.length - 1; i >= 0; i--) {
      // Replace breaks with spaces and strip tags
      let text = messages[i][1].replace(/<br\s*\/?>/gi, ' \n ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      
      // Convert Persian and Arabic digits to English digits
      text = text.replace(/[۰-۹]/g, w => String.fromCharCode(w.charCodeAt(0) - 1728));
      text = text.replace(/[٠-٩]/g, w => String.fromCharCode(w.charCodeAt(0) - 1584));
      
      // Look for مظنه or آبشده
      if (!meltedGold && (text.includes("مظنه") || text.includes("آبشده"))) {
         const match = text.match(/(?:مظنه|آبشده)[^0-9]*([0-9,]{5,})/);
         if (match) {
           let val = parseInt(match[1].replace(/,/g, ''));
           if (val < 100000) val = val * 1000; // Tomans scaling if abbreviated
           meltedGold = val;
         }
      }
      
      // Look for گرم 18 عیار or similar
      if (!gold18k) {
         const match = text.match(/18[^0-9]*([0-9,]{5,})/);
         if (match) {
           let val = parseInt(match[1].replace(/,/g, ''));
           if (val < 100000) val = val * 1000; // Tomans scaling
           gold18k = val;
         } else {
           // Fallback matching for "گرم" or "گرمی" with numeric values
           const fallbackMatch = text.match(/(?:گرم|گرمی)[^0-9]*([0-9,]{5,})/);
           if (fallbackMatch) {
             let val = parseInt(fallbackMatch[1].replace(/,/g, ''));
             if (val < 100000) val = val * 1000;
             gold18k = val;
           }
         }
      }
      
      if (meltedGold && gold18k) break;
    }
    
    if (!meltedGold) {
      throw new Error("داده لحظه‌ای در دسترس نیست");
    }
    
    res.json({
      success: true,
      data: {
        MELTED_GOLD: meltedGold,
        GOLD_18K: gold18k || Math.floor(meltedGold / 4.3318), // fallback approximation
      },
      timestamp: Date.now()
    });
    
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. AI Interactive Chat Endpoint
app.post("/api/chat-terminal", async (req, res) => {
  try {
    const { messages, marketContext, customConfig } = req.body;

    const systemPrompt = customConfig?.systemPrompt || `You are the Gold Terminal Core Intelligence, a high-caliber Institutional Quant Analyst and Geopolitical Specialist.
You have real-time stream data access.
Your knowledge of Gold (XAUUSD, Melted Gold طلای آب شده, Comex Futures) is comprehensive.
When the user asks, answer with absolute mathematical precision and structure.
For Melted Gold (طلای آب شده), reference Tehran Bazaar dynamics, dollar to Rial arbitrage (نیمایی/آزاد), and domestic inflation.
Always output beautiful, structured markdown with metrics, charts, and bullet points.`;

    const temperature = customConfig?.temperature ?? 0.3;
    const selectedModel = customConfig?.model || "gemini-3.5-flash";

    // Format chat history
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));
    
    // Format for OpenAI-compatible APIs
    const openAIMessages = [
      { role: "system", content: systemPrompt }
    ];
    for (const m of messages) {
       openAIMessages.push({ role: m.role === "assistant" ? "assistant" : "user", content: m.content });
    }

    // Inject live market context to the latest message as background
    if (marketContext && contents.length > 0) {
      const lastMessageIndex = contents.length - 1;
      const originalText = contents[lastMessageIndex].parts[0].text;
      const injectedContext = `[Live Terminal Context: Active Asset ${marketContext.assetId}, Current Price: ${marketContext.currentPrice}, Trend: ${marketContext.trend || "Analyzing"}, Support: ${marketContext.supports?.join(", ")}, Resistance: ${marketContext.resistances?.join(", ")}]

User Question: ${originalText}`;
      contents[lastMessageIndex].parts[0].text = injectedContext;
      
      const lastOaiIndex = openAIMessages.length - 1;
      openAIMessages[lastOaiIndex].content = injectedContext;
    }

    let responseText = "";

    if (customConfig?.provider === "openai" || customConfig?.provider === "openrouter" || customConfig?.provider === "custom" || customConfig?.provider === "deepseek" || customConfig?.provider === "grok" || customConfig?.provider === "claude") {
      let baseURL = "https://api.openai.com/v1";
      if (customConfig.provider === "openrouter") baseURL = "https://openrouter.ai/api/v1";
      else if (customConfig.provider === "deepseek") baseURL = "https://api.deepseek.com/v1";
      else if (customConfig.provider === "grok") baseURL = "https://api.x.ai/v1";
      else if (customConfig.provider === "custom" && customConfig.customEndpoint) baseURL = customConfig.customEndpoint;

      const apiRes = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${customConfig.apiKey}`
        },
        body: JSON.stringify({
          model: selectedModel,
          temperature,
          messages: openAIMessages
        })
      });
      if (!apiRes.ok) {
         const errBody = await apiRes.text();
         throw new Error(`Chat API error (${customConfig.provider}): ${apiRes.status} ${errBody}`);
      }
      const data = await apiRes.json();
      responseText = data.choices[0].message.content;
    } else {
      const ai = getGeminiClient(customConfig?.apiKey);
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature,
        }
      });
      responseText = response.text || "I was unable to generate an analysis. Please verify your data and keys.";
    }

    res.json({
      role: "assistant",
      content: responseText
    });
  } catch (error: any) {
    console.warn("Chat API Error (Applying Server-Side Fallback):", error.message || error);
    const { marketContext, customConfig, messages } = req.body;
    
    // OPENROUTER FALLBACK logic
    if (customConfig?.provider !== "openrouter" && process.env.OPENROUTER_API_KEY) {
      try {
        console.log("Attempting OpenRouter Fallback for Chat...");
        const systemPrompt = customConfig?.systemPrompt || `You are the Gold Terminal Core Intelligence.`;
        
        const openAIMessages = [
          { role: "system", content: systemPrompt }
        ];
        for (const m of messages) {
           openAIMessages.push({ role: m.role === "assistant" ? "assistant" : "user", content: m.content });
        }
        
        if (marketContext && openAIMessages.length > 1) {
          const lastOaiIndex = openAIMessages.length - 1;
          const originalText = openAIMessages[lastOaiIndex].content;
          openAIMessages[lastOaiIndex].content = `[Live Terminal Context: Active Asset ${marketContext.assetId}, Current Price: ${marketContext.currentPrice}, Trend: ${marketContext.trend || "Analyzing"}, Support: ${marketContext.supports?.join(", ")}, Resistance: ${marketContext.resistances?.join(", ")}]

User Question: ${originalText}`;
        }
        
        const fallbackRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-free",
            temperature: 0.3,
            messages: openAIMessages
          })
        });
        
        if (fallbackRes.ok) {
           const fallbackData = await fallbackRes.json();
           const fallbackJsonText = fallbackData.choices[0].message.content;
           return res.json({
             role: "assistant",
             content: fallbackJsonText
           });
        }
      } catch (fallbackErr: any) {
        console.log("OpenRouter chat fallback failed:", fallbackErr.message || fallbackErr);
      }
    }
    
    // Graceful fallback response
    res.json({
      role: "assistant",
      content: `### 🤖 Gold Terminal Assistant (Backup Mode)

The API is currently experiencing issues or invalid keys. Please check your **Settings** to ensure valid API keys are configured.

**Live Market Quick Report:**
- **Active Asset:** ${marketContext?.assetId || "Gold Spot"}
- **Current Spot Price:** $${marketContext?.currentPrice?.toLocaleString() || "N/A"}
- **Identified Support Levels:** ${marketContext?.supports?.join(", ") || "N/A"}
- **Identified Resistance Levels:** ${marketContext?.resistances?.join(", ") || "N/A"}

Please feel free to use the manual charts, the Kelly Criterion calculator, the Volatility Heatmap, and the risk manager features in the trading console while the AI connection is being updated!`
    });
  }
});

// Setup Vite Dev server middleware or Production Static file serving
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Gold Terminal Server] running securely on http://localhost:${PORT}`);
  });
}

initServer();
