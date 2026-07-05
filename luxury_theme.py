import os
import re

files_to_update = [
    "src/App.tsx",
    "src/components/ChartTerminal.tsx",
    "src/components/AIChat.tsx",
    "src/components/PortfolioAnalytics.tsx",
    "src/components/StrategyBuilder.tsx"
]

replacements = [
    (r"bg-gray-950/40", "bg-black/20"),
    (r"bg-gray-950/30", "bg-black/10"),
    (r"bg-gray-950/20", "bg-black/5"),
    (r"bg-gray-950", "bg-black/40"),
    (r"bg-gray-900", "bg-white/5"),
    (r"border-gray-900", "border-white/5"),
    (r"border-gray-800", "border-white/10"),
    (r"text-amber-500", "text-[var(--accent-gold)]"),
    (r"text-amber-400", "text-[var(--accent-gold)]"),
    (r"bg-amber-500", "bg-[var(--accent-gold)]"),
    (r"bg-amber-400", "bg-[var(--accent-gold)]"),
    (r"border-amber-500/30", "border-[var(--accent-gold)]/30"),
    (r"border-amber-500/20", "border-[var(--accent-gold)]/20"),
    (r"bg-amber-500/10", "bg-[var(--accent-gold)]/10"),
    (r"text-emerald-400", "text-[var(--accent-emerald)]"),
    (r"text-emerald-500", "text-[var(--accent-emerald)]"),
    (r"bg-emerald-500", "bg-[var(--accent-emerald)]"),
    (r"text-rose-400", "text-[var(--accent-crimson)]"),
    (r"bg-rose-500", "bg-[var(--accent-crimson)]"),
    (r"font-mono", "data-value text-[11px]"),
    (r"text-xs font-sans text-gray-500 tracking-wider uppercase block font-semibold", "text-[9px] data-label text-gray-500 mb-3 block"),
    (r"text-\[10px\] font-sans text-gray-500 tracking-wider uppercase block", "text-[9px] data-label text-gray-500 mb-3 block"),
    (r"text-\[10px\] font-sans text-gray-500 tracking-wider uppercase block font-semibold", "text-[9px] data-label text-gray-500 mb-3 block"),
]

for file_path in files_to_update:
    if not os.path.exists(file_path): continue
    with open(file_path, "r") as f:
        content = f.read()
    
    for old, new in replacements:
        content = re.sub(old, new, content)
        
    with open(file_path, "w") as f:
        f.write(content)

