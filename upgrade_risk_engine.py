import re

with open("src/components/PortfolioAnalytics.tsx", "r") as f:
    content = f.read()

# Let's add advanced metrics calculation in the useMemo block
new_metrics = """
    // Advanced Risk Engine & Kelly Criterion
    const wins = filteredEntries.filter((e) => e.pnl > 0);
    const losses = filteredEntries.filter((e) => e.pnl <= 0);
    
    const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
    const avgWin = wins.length > 0 ? wins.reduce((sum, e) => sum + e.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, e) => sum + e.pnl, 0) / losses.length) : 0;
    
    const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
    const expectedValue = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss;
    
    // Kelly Criterion % = W - [(1 - W) / R]
    const W = winRate / 100;
    const R = riskRewardRatio;
    let kellyPct = 0;
    if (R > 0) {
      kellyPct = (W - ((1 - W) / R)) * 100;
      if (kellyPct < 0) kellyPct = 0;
      if (kellyPct > 100) kellyPct = 100; // Cap
    }
    
    // Drawdown Calculation
    let maxDrawdown = 0;
    let peak = INITIAL_BALANCE;
    let currentEq = INITIAL_BALANCE;
    for (const e of filteredEntries) {
        currentEq += e.pnl;
        if (currentEq > peak) peak = currentEq;
        const dd = ((peak - currentEq) / peak) * 100;
        if (dd > maxDrawdown) maxDrawdown = dd;
    }

    // Existing stats mapped
"""

content = re.sub(
    r'const wins = filteredEntries\.filter\(\(e\) => e\.pnl > 0\);.*?const maxDrawdown = 0; // Simplified',
    new_metrics,
    content,
    flags=re.DOTALL
)

# And expose them in the UI:
advanced_risk_ui = """
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="glass-panel lux-card p-3 rounded-xl bg-black/20 border-white/5 space-y-1">
               <span className="text-[9px] data-value text-[11px] text-gray-500 uppercase font-semibold">ملاک کلی (Kelly)</span>
               <p className="text-lg data-value text-[11px] font-extrabold text-[var(--accent-gold)]">{kellyPct.toFixed(1)}%</p>
               <p className="text-[8px] text-gray-600">حجم بهینه تخصیص ریسک</p>
            </div>
            <div className="glass-panel lux-card p-3 rounded-xl bg-black/20 border-white/5 space-y-1">
               <span className="text-[9px] data-value text-[11px] text-gray-500 uppercase font-semibold">ارزش مورد انتظار (EV)</span>
               <p className={`text-lg data-value text-[11px] font-extrabold ${expectedValue >= 0 ? "text-[var(--accent-emerald)]" : "text-[var(--accent-crimson)]"}`}>
                  {expectedValue > 0 ? "+" : ""}{expectedValue.toLocaleString(undefined, {maximumFractionDigits: 0})}
               </p>
               <p className="text-[8px] text-gray-600">میانگین بازدهی هر معامله</p>
            </div>
            <div className="glass-panel lux-card p-3 rounded-xl bg-black/20 border-white/5 space-y-1">
               <span className="text-[9px] data-value text-[11px] text-gray-500 uppercase font-semibold">بیشترین افت سرمایه (MDD)</span>
               <p className="text-lg data-value text-[11px] font-extrabold text-[var(--accent-crimson)]">{maxDrawdown.toFixed(2)}%</p>
               <p className="text-[8px] text-gray-600">حداکثر دراوداون تجربه شده</p>
            </div>
            <div className="glass-panel lux-card p-3 rounded-xl bg-black/20 border-white/5 space-y-1">
               <span className="text-[9px] data-value text-[11px] text-gray-500 uppercase font-semibold">نسبت ریسک به ریوارد (R:R)</span>
               <p className="text-lg data-value text-[11px] font-extrabold text-white">1 : {riskRewardRatio.toFixed(2)}</p>
               <p className="text-[8px] text-gray-600">میانگین سود به زیان</p>
            </div>
          </div>
"""

content = content.replace(
    '          {/* Interactive Chart Canvas Panel */}',
    advanced_risk_ui + '\n          {/* Interactive Chart Canvas Panel */}'
)

with open("src/components/PortfolioAnalytics.tsx", "w") as f:
    f.write(content)
