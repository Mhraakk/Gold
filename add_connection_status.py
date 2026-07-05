import re

with open("src/App.tsx", "r") as f:
    content = f.read()

status_indicator = """
            <div className="flex flex-row justify-between items-center px-1">
              <span>وضعیت اتصال موتور داده:</span>
              {connectionStatus === "connected" ? (
                 <span className="text-[var(--accent-emerald)] font-bold data-value text-[11px] tracking-wider flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--accent-emerald)] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> آنلاین (60FPS)</span>
              ) : connectionStatus === "reconnecting" ? (
                 <span className="text-[var(--accent-gold)] font-bold data-value text-[11px] tracking-wider flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--accent-gold)] animate-spin"></span> در حال بازیابی</span>
              ) : (
                 <span className="text-[var(--accent-crimson)] font-bold data-value text-[11px] tracking-wider flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--accent-crimson)]"></span> آفلاین</span>
              )}
            </div>
"""

content = content.replace(
    '<div className="flex flex-row justify-between items-center px-1">\n              <span>نرخ بروزرسانی:</span>',
    status_indicator + '\n            <div className="flex flex-row justify-between items-center px-1">\n              <span>نرخ بروزرسانی:</span>'
)

with open("src/App.tsx", "w") as f:
    f.write(content)
