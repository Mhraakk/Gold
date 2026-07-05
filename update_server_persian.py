import re

with open("server.ts", "r") as f:
    content = f.read()

# Replace generateBackupAnalysis content
replacement = """  let rulesMd = "";
  if (customRules && customRules.length > 0) {
    rulesMd = `\\n\\n4. **سیگنال‌های اتوماسیون استراتژی شخصی:**\\n` + 
      customRules.map((r: any) => {
        const trig = r.isTriggered ? "🔴 **فعال شده**" : "⚪ در انتظار";
        const conds = `${r.cond1Metric} ${r.cond1Op} ${r.cond1Value}` + 
          (r.cond2Metric !== "none" ? ` ${r.conditionType.toUpperCase()} ${r.cond2Metric} ${r.cond2Op} ${r.cond2Value}` : "");
        return `- **${r.name}** [${trig}]: اگر \\`${conds}\\` → سیگنال **${r.actionSignal}**`;
      }).join("\\n");
  }

  return {
    assetId,
    timestamp: new Date().toISOString(),
    trend: "محدوده نوسانی (RANGING)",
    marketPhase: "فاز تثبیت و انباشت مجدد",
    confidenceScore: 72,
    probabilityScore: 68,
    supportLevels: supports,
    resistanceLevels: resistances,
    orderBlocks: obs.slice(0, 3).map((ob: any) => ({
      type: ob.type === "bullish" ? "صعودی" : "نزولی",
      range: `${(ob.priceStart || lastPrice * 0.99).toFixed(1)} - ${(ob.priceEnd || lastPrice * 0.995).toFixed(1)}`,
      volume: (ob.volume || 1000).toFixed(0),
    })),
    scenarios: {
      primary: `قیمت در کانال ساختاری خود به سمت مقاومت اصلی در محدوده ${sellZoneStart.toLocaleString()} حرکت خواهد کرد.`,
      alternative: `در صورت از دست رفتن حمایت ${buyZoneStart.toLocaleString()}، قیمت برای جمع‌آوری نقدینگی به سطوح پایین‌تر سقوط می‌کند.`,
      invalidation: `بسته شدن کندل ساعتی زیر سطح حمایتی ${(supports[1] || lastPrice * 0.97).toLocaleString()}، سناریوی صعودی را باطل می‌کند.`
    },
    tradeSetup: {
      entry: parseFloat(lastPrice.toFixed(2)),
      stopLoss: parseFloat((lastPrice * 0.988).toFixed(2)),
      takeProfit1: parseFloat((lastPrice * 1.012).toFixed(2)),
      takeProfit2: parseFloat((lastPrice * 1.025).toFixed(2)),
      riskRewardRatio: 2.2
    },
    risks: {
      political: 45,
      inflation: 60,
      volatility: 55,
      globalImpact: 30
    },
    detailedAnalysisMarkdown: `### 🤖 گزارش تحلیل موتور کوانت پشتیبان سرور\\n\\nکلید API هوش مصنوعی در حال حاضر معتبر نیست (در تنظیمات وارد نشده یا منقضی شده). برای فعال‌سازی تحلیل‌های پیشرفته هوش مصنوعی، کلید API معتبر وارد کنید.\\n\\nدر همین حین، موتور کوانت پشتیبان این گزارش ساختاری را تهیه کرده است:\\n\\n1. **مفاهیم پول هوشمند (SMC):**\\n   - **اوردربلاک‌ها (OB):** ${obs.length} ناحیه فعال در نمودار تشخیص داده شد.\\n   - **گپ‌های ارزش (FVG):** ${marketStructure?.fvgs?.length || 0} گپ فعال.\\n\\n2. **ماتریس حمایت و مقاومت:**\\n   - **تقاضای اصلی (حمایت):** \\`${supports[0]?.toLocaleString()}\\`\\n   - **عرضه اصلی (مقاومت):** \\`${resistances[0]?.toLocaleString()}\\`\\n\\n3. **وضعیت روند:**\\n   - الگوی امواج همچنان فعال است. ساختار فعلی نشانگر فاز انباشت است. ریسک خود را کنترل کنید.${rulesMd}`
  };"""

content = re.sub(
    r'  let rulesMd = "";.*?Adjust risk profile using the Risk Control module\.\$\{rulesMd\}`\n  };\n',
    replacement,
    content,
    flags=re.DOTALL
)

with open("server.ts", "w") as f:
    f.write(content)
