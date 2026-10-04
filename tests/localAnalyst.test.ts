import { describe, it, expect } from 'vitest';
import {
  MarketMemory,
  MarketSnapshot,
  EngineContext,
  alignScale,
  answerChat,
  buildDailyForecast,
  buildMazanehForecast,
  buildSharedAnalysis,
  computeFundamentals,
  parseMarketText,
  seriesStats,
} from '../src/services/localAnalyst';

const NOW = Date.now();

// Live market values (Toman / USD) observed while building the engine.
function makeSnapshot(): MarketSnapshot {
  const q = (value: number) => ({ value, source: 'TGJU', fetchedAt: NOW });
  return {
    quotes: {
      xauusd: q(4140.19),
      usd: q(271180),
      gold18: q(26639500),
      gold24: q(35519000),
      mesghal: q(115402000),
      emami: q(275315000),
      nim: q(142960000),
      rob: q(78990000),
      gerami: q(38000000),
      brent: q(102.25),
    },
    crossChecks: {
      mesghal: { value: 115350000, source: 'Telegram @abshdh', fetchedAt: NOW },
      gold18: { value: 26629267, source: 'Telegram @abshdh', fetchedAt: NOW },
    },
    takenAt: NOW,
  };
}

// 60 points over ~30 hours with a steady upward drift.
function makeContext(withHistory = true): EngineContext {
  const memory = new MarketMemory();
  if (withHistory) {
    for (let i = 0; i < 60; i++) {
      const t = NOW - (60 - i) * 30 * 60_000;
      const f = 1 + (i - 59) * 0.0004 + (i % 3 === 0 ? 0.001 : 0);
      const snap = makeSnapshot();
      for (const quote of Object.values(snap.quotes)) {
        quote!.value = quote!.value * f;
        quote!.fetchedAt = t;
      }
      memory.record(snap);
    }
  }
  return { snapshot: makeSnapshot(), memory };
}

describe('localAnalyst: text parsing', () => {
  it('reads the @abshdh Telegram format (Toman, tatweel, ZWNJ)', () => {
    const r = parseMarketText('🔻 #ابشـده‌حواله 115,000,000 🔻 #گرم‌طلا : 26,548,468 Just In Time 12:44:36');
    expect(r.meltedGold).toBe(115000000);
    expect(r.gold18k).toBe(26548468);
  });

  it('reads coin, dollar, tether and ounce with Persian digits', () => {
    expect(parseMarketText('#سکه‌حواله : 🔻 274,900,000 🔻').emamiCoin).toBe(274900000);
    const r = parseMarketText('دلار ۲۷۱,۱۸۰ تومان، تتر ۲۷۳,۵۰۰ و انس ۴۱۴۰ دلار');
    expect(r.usdIrt).toBe(271180);
    expect(r.usdtIrt).toBe(273500);
    expect(r.xauusd).toBe(4140);
  });

  it('understands "میلیون و ... هزار" amounts and ignores half coins', () => {
    expect(parseMarketText('مظنه ۱۱۵ میلیون و ۳۵۰ هزار').meltedGold).toBe(115350000);
    expect(parseMarketText('قیمت نیم سکه 142,960,000').emamiCoin).toBeUndefined();
  });
});

describe('localAnalyst: math', () => {
  it('aligns Rial and Toman scales', () => {
    expect(alignScale(2711800, 271180)).toBe(0.1);
    expect(alignScale(271180, 271180)).toBe(1);
    expect(alignScale(5, 271180)).toBeNull();
  });

  it('computes intrinsic value and bubble from ounce × dollar', () => {
    const fu = computeFundamentals(makeSnapshot());
    // 18k gram = ounce / 31.1035 × 0.75 × dollar ≈ 27.07M Toman
    expect(fu.theoretical.gold18!).toBeGreaterThan(27_000_000);
    expect(fu.theoretical.gold18!).toBeLessThan(27_150_000);
    expect(fu.bubblePct.gold18!).toBeGreaterThan(-3);
    expect(fu.bubblePct.gold18!).toBeLessThan(0);
    expect(fu.bubblePct.emami!).toBeGreaterThan(0); // coins trade above gold content
    expect(fu.impliedUsd!).toBeLessThan(271180);
  });

  it('measures trend and volatility from recorded history', () => {
    const stats = seriesStats(makeContext().memory.get('gold18'))!;
    expect(stats.points).toBe(60);
    expect(stats.slopePctPerDay!).toBeGreaterThan(0);
    expect(stats.dailyVolPct!).toBeGreaterThan(0);
  });

  it('memory skips duplicate quotes and survives a save/load round trip', () => {
    const memory = new MarketMemory();
    memory.record(makeSnapshot());
    memory.record(makeSnapshot()); // same fetchedAt → ignored
    expect(memory.get('usd')).toHaveLength(1);
    const restored = new MarketMemory();
    restored.load({ ...JSON.parse(JSON.stringify(memory.toJSON())), usd: [{ t: 1, v: -5 }, { t: 2, v: 10 }] });
    expect(restored.get('gold18')).toHaveLength(1);
    expect(restored.get('usd')).toEqual([{ t: 2, v: 10 }]);
  });
});

describe('localAnalyst: endpoint contracts', () => {
  it('shared analysis matches AnalysisResponse and keeps the app price scale', () => {
    const a = buildSharedAnalysis({ assetId: 'GOLD_18K', currentPrice: 266395000, ctx: makeContext() });
    expect(['BULLISH', 'BEARISH', 'CONSOLIDATION']).toContain(a.trend);
    expect(a.supportLevels).toHaveLength(2);
    expect(a.resistanceLevels).toHaveLength(2);
    expect(Math.max(...a.supportLevels)).toBeLessThan(266395000);
    expect(Math.min(...a.resistanceLevels)).toBeGreaterThan(266395000);
    expect(a.tradeSetup.riskRewardRatio).toBeGreaterThan(0);
    expect(a.confidenceScore).toBeGreaterThanOrEqual(30);
    // App sends Rial: numbers stay in Rial (chart scale), text is written in Toman
    expect(a.detailedAnalysisMarkdown).toContain('تومان');
    expect(a.detailedAnalysisMarkdown).not.toContain('ریال');
    expect(a.tradeSetup.entry).toBeGreaterThan(200_000_000); // still IRR
    expect(a.orderBlocks[0].volume).toContain('در دسترس نیست'); // no invented volume
  });

  it('range-market trade setup buys support with a sensible risk/reward', () => {
    const a = buildSharedAnalysis({ assetId: 'COIN_EMAMI', currentPrice: 0, ctx: makeContext(false) });
    expect(a.trend).toBe('CONSOLIDATION');
    expect(a.tradeSetup.entry).toBe(a.supportLevels[0]);
    expect(a.tradeSetup.stopLoss).toBeLessThan(a.supportLevels[1]);
    expect(a.tradeSetup.riskRewardRatio).toBeGreaterThanOrEqual(1.4);
  });

  it('daily forecast is internally consistent', () => {
    const f = buildDailyForecast({
      input: { meltedGold: 115402000, usdIrt: 2711800, usdtIrt: 2735000, xauusd: 4140, todayChangePercent: 0.4, todayHigh: 116000000, todayLow: 114800000 },
      ctx: makeContext(),
    });
    expect(f.bullishProb + f.neutralProb + f.bearishProb).toBe(100);
    expect(f.rangeLow).toBeLessThan(f.midPoint);
    expect(f.midPoint).toBeLessThan(f.rangeHigh);
    const l = f.levels;
    expect(l.sup2).toBeLessThan(l.sup1);
    expect(l.sup1).toBeLessThan(115402000);
    expect(l.res1).toBeGreaterThan(115402000);
    expect(l.res2).toBeGreaterThan(l.res1);
    expect(f.impacts.usdt).toContain('تتر');
  });

  it('strong signals with a narrow intraday range stay coherent and calibrated', () => {
    // Input that once produced a range above the close and 67/5 odds.
    const f = buildDailyForecast({
      input: { meltedGold: 114850000, usdIrt: 2711800, usdtIrt: 2735000, xauusd: 4140.19, emamiCoin: 2753150000, todayChangePercent: 0.4, todayHigh: 115500000, todayLow: 114200000 },
      ctx: makeContext(false),
    });
    expect(f.rangeLow).toBeLessThan(f.closePrice);
    expect(f.rangeHigh).toBeGreaterThan(f.closePrice);
    expect(f.bearishProb).toBeGreaterThanOrEqual(10);
    expect(f.bullishProb).toBeLessThanOrEqual(70);
    if (f.midPoint >= f.levels.res1) expect(f.primaryScenario).toContain('عبور از مقاومت');
  });

  it('mazaneh forecast returns the shape the forecast desk renders', () => {
    const f = buildMazanehForecast({
      fields: {
        meltedGoldMazaneh: { value: '115402000', unit: 'IRR', source: 'TGJU', freshness: 'verified_live' },
        xauusd: { value: '4140.19', unit: 'USD', source: 'TGJU', freshness: 'verified_live' },
        usdIrt: { value: '2711800', unit: 'IRR', source: 'TGJU', freshness: 'verified_live' },
      },
      snapshotId: 'snap_1',
      ctx: makeContext(),
    });
    expect(f.success).toBe(true);
    expect(f.dataQuality).toBe('high');
    expect(f.tomorrowForecast.low).toMatch(/^[\d,]+$/);
    expect(f.supportLevels).toHaveLength(2);
    expect(['بالا', 'متوسط', 'پایین']).toContain(f.confidence);
  });
});

describe('localAnalyst: chat', () => {
  const ask = (content: string, history: { role: string; content: string }[] = []) =>
    answerChat({ messages: [...history, { role: 'user', content }], ctx: makeContext() });

  it('answers live prices', () => {
    expect(ask('قیمت سکه امامی چنده؟')).toContain('275,315,000');
  });

  it('explains bubble / intrinsic value', () => {
    expect(ask('حباب طلا چقدره')).toContain('ارزش ذاتی');
  });

  it('runs a dollar what-if scenario', () => {
    const reply = ask('اگر دلار ۳۰۰ هزار تومان بشه طلا چند میشه؟');
    expect(reply).toContain('300,000');
    // headings must stay plain: the chat renderer shows "**" literally there
    expect(reply.split('\n').filter((l) => l.startsWith('#')).join('')).not.toContain('**');
  });

  it('computes the value of a quantity', () => {
    expect(ask('۵ گرم طلا چند میشه')).toContain(new Intl.NumberFormat('en-US').format(5 * 26639500));
  });

  it('handles a DXY scenario', () => {
    expect(ask('اگر شاخص دلار ۱.۵ درصد رشد کنه چی میشه؟')).toContain('DXY');
  });

  it('analyses, forecasts and suggests entries', () => {
    expect(ask('طلای ۱۸ عیار رو تحلیل کن')).toContain('## تحلیل');
    expect(ask('پیش‌بینی فردای آبشده')).toContain('چشم‌انداز روز بعد');
    expect(ask('بهترین نقطه ورود برای خرید سکه')).toContain('حد ضرر');
    expect(ask('سکه بخرم یا طلا؟')).toContain('مقایسه');
  });

  it('remembers the asset from earlier in the conversation', () => {
    const reply = ask('تحلیلش کن', [
      { role: 'user', content: 'قیمت ربع سکه' },
      { role: 'assistant', content: '...' },
    ]);
    expect(reply).toContain('ربع سکه');
  });

  it('is honest about off-topic questions and greets', () => {
    expect(ask('پایتخت فرانسه کجاست')).toContain('متوجه نشدم');
    expect(ask('هوای تهران فردا چطوره؟')).toContain('متوجه نشدم');
    expect(ask('ساعت چنده؟')).toContain('متوجه نشدم');
    expect(ask('قیمت‌ها')).toContain('قیمت‌های لحظه‌ای'); // market term alone still works
    expect(ask('سلام')).toContain('سلام!');
  });
});
