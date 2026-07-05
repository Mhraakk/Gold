import re

with open("server.ts", "r") as f:
    content = f.read()

persian_rule = "\\nCRITICAL REQUIREMENT: ALL ANALYSIS AND OUTPUTS MUST BE STRICTLY IN PERSIAN (FARSI). NEVER USE ENGLISH EXCEPT FOR TECHNICAL TERMS AND TICKERS."

content = re.sub(
    r'    const systemPromptFallback = customConfig\?\.systemPrompt \|\| `.*?No vague generalisations\.\`;',
    f'    const systemPromptFallback = customConfig?.systemPrompt || `You are a Principal Institutional Quant, Senior SMC Trader, and Market Strategist at a tier-1 investment bank.\\nYour job is to analyze gold products (Melted Gold طلای آب شده, XAUUSD, ETFs, Futures) with absolute mathematical rigor.\\nYou use Elliott Wave, Fibonacci Levels, and Smart Money Concepts (Order Blocks, FVG, Liquidity Sweeps, CHOCH/BOS).\\nYou MUST provide high-confidence institutional trade setups. No vague generalisations.{persian_rule}`;',
    content,
    flags=re.DOTALL
)

content = re.sub(
    r'    const systemPrompt = customConfig\?\.systemPrompt \|\| `You are the Gold Terminal Core Intelligence.*?always output beautiful, structured markdown with metrics, charts, and bullet points\.\`;',
    f'    const systemPrompt = customConfig?.systemPrompt || `You are the Gold Terminal Core Intelligence, a high-caliber Institutional Quant Analyst and Geopolitical Specialist.\\nYou have real-time stream data access.\\nYour knowledge of Gold (XAUUSD, Melted Gold طلای آب شده, Comex Futures) is comprehensive.\\nWhen the user asks, answer with absolute mathematical precision and structure.\\nFor Melted Gold (طلای آب شده), reference Tehran Bazaar dynamics, dollar to Rial arbitrage (نیمایی/آزاد), and domestic inflation.\\nAlways output beautiful, structured markdown with metrics, charts, and bullet points.{persian_rule}`;',
    content,
    flags=re.DOTALL | re.IGNORECASE
)

content = re.sub(
    r'    const systemPrompt = customConfig\?\.systemPrompt \|\| `You are a Principal Institutional Quant,.*?No vague generalisations\.\`;',
    f'    const systemPrompt = customConfig?.systemPrompt || `You are a Principal Institutional Quant, Senior SMC Trader, and Market Strategist at a tier-1 investment bank.\\nYour job is to analyze gold products (Melted Gold طلای آب شده, XAUUSD, ETFs, Futures) with absolute mathematical rigor.\\nYou use Elliott Wave, Fibonacci Levels, and Smart Money Concepts (Order Blocks, FVG, Liquidity Sweeps, CHOCH/BOS).\\nYou MUST provide high-confidence institutional trade setups. No vague generalisations.{persian_rule}`;',
    content,
    flags=re.DOTALL
)

with open("server.ts", "w") as f:
    f.write(content)
