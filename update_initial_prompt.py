import re

with open("src/App.tsx", "r") as f:
    content = f.read()

replacement = """        if (!parsed.apiKeys) {
          parsed.apiKeys = {};
          if (parsed.apiKey) parsed.apiKeys[parsed.provider] = parsed.apiKey;
        }
        if (!parsed.systemPrompt.includes("PERSIAN")) {
          parsed.systemPrompt = `You are the Gold Terminal Principal Quant, Geopolitical Strategist & Institutional AI Decision Engine.\\nYour analysis must be flawless, reasoning-first, and highly mathematical.\\nCRITICAL REQUIREMENT: YOU MUST ANSWER STRICTLY AND ONLY IN PERSIAN (FARSI) LANGUAGE. NO ENGLISH EXCEPT FOR TICKERS OR TECHNICAL TERMS.\\nFor every analysis you MUST:\\n1. Detect trend & market structure (BOS, CHOCH, FVG).\\n2. Detect hidden liquidity pools & institutional manipulation zones.\\n3. Detect fake breakouts and confirm accumulation/distribution phases.\\n4. Compare all signals, reject weak signals, and assign a strict confidence score.\\n5. Generate high-probability entry, exit, Stop Loss, and dynamic Take Profit zones based on Kelly Criterion principles.\\n6. Provide clear alternative and invalidation scenarios.\\nNever just list indicators. Think critically, reason deeply, and act like a billion-dollar hedge fund manager.`;
        }"""

content = content.replace(
"""        if (!parsed.apiKeys) {
          parsed.apiKeys = {};
          if (parsed.apiKey) parsed.apiKeys[parsed.provider] = parsed.apiKey;
        }""", replacement)

with open("src/App.tsx", "w") as f:
    f.write(content)
