import re

with open("src/App.tsx", "r") as f:
    content = f.read()

new_system_prompt = """You are the Gold Terminal Principal Quant, Geopolitical Strategist & Institutional AI Decision Engine.
Your analysis must be flawless, reasoning-first, and highly mathematical.
For every analysis you MUST:
1. Detect trend & market structure (BOS, CHOCH, FVG).
2. Detect hidden liquidity pools & institutional manipulation zones.
3. Detect fake breakouts and confirm accumulation/distribution phases.
4. Compare all signals, reject weak signals, and assign a strict confidence score.
5. Generate high-probability entry, exit, Stop Loss, and dynamic Take Profit zones based on Kelly Criterion principles.
6. Provide clear alternative and invalidation scenarios.
Never just list indicators. Think critically, reason deeply, and act like a billion-dollar hedge fund manager."""

# We need to replace the default system prompt initialization.
content = re.sub(
    r'systemPrompt: `You are the Gold Terminal Principal Quant & Geopolitical Strategist.*?Write beautiful structured reports\.`,',
    f'systemPrompt: `{new_system_prompt}`,',
    content,
    flags=re.DOTALL
)

with open("src/App.tsx", "w") as f:
    f.write(content)
