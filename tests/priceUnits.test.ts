import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { executeAndParseSource } from '../src/utils/sourceRegistry';
import {
  connectorPriceUnit,
  formatAssetAmount,
  formatAssetPrice,
  formatMazaneh,
  fromDisplayUnit,
  toDisplayUnit,
} from '../src/utils/priceDisplay';

const telegramPage = (text: string) => ({
  ok: true,
  text: async () =>
    `<div class="tgme_widget_message"><div class="tgme_widget_message_text">${text}</div></div>`,
});

describe('price display (stored IRR → shown Toman)', () => {
  it('shows Iranian prices in Toman and global ones in USD', () => {
    expect(formatAssetPrice('MELTED_GOLD', 1154020000, { withUnit: true })).toBe('115,402,000 تومان');
    expect(formatAssetPrice('USDIRT', 2711800)).toBe('271,180');
    expect(formatAssetPrice('XAUUSD', 4140.19, { withUnit: true })).toBe('4,140.19 دلار');
    expect(formatAssetPrice('GOLD_18K', 0)).toBe('در حال دریافت…');
    expect(formatAssetAmount('COIN_EMAMI', -25000000)).toBe('-2,500,000');
    expect(formatMazaneh(1153500000)).toBe('115.35');
  });

  it('round-trips typed Toman values to stored IRR', () => {
    expect(fromDisplayUnit('GOLD_18K', 26639500)).toBe(266395000);
    expect(toDisplayUnit('GOLD_18K', 266395000)).toBe(26639500);
    expect(fromDisplayUnit('XAUUSD', 4140)).toBe(4140);
  });

  it('declares connector units explicitly instead of guessing from size', () => {
    expect(connectorPriceUnit({ providerType: 'TelegramScraper', targetAssetId: 'MELTED_GOLD' })).toBe('TOMAN');
    expect(connectorPriceUnit({ providerType: 'REST', targetAssetId: 'USDIRT' })).toBe('IRR');
    expect(connectorPriceUnit({ providerType: 'REST', targetAssetId: 'XAUUSD' })).toBe('USD');
    expect(connectorPriceUnit({ providerType: 'REST', targetAssetId: 'USDIRT', priceUnit: 'TOMAN' })).toBe('TOMAN');
  });
});

describe('source registry', () => {
  it('stores the Telegram Toman quote as IRR', async () => {
    const fetchFn = async () => telegramPage('🔻 #ابشـده‌حواله 115,350,000 🔻 #گرم‌طلا : 26,629,267');
    const source = await executeAndParseSource('telegram_abshdh', cheerio.load, fetchFn);
    const melted = source.parsedAssets.find((a) => a.assetKey === 'melted_gold')!;
    expect(melted.canonicalIrrValue).toBe(1153500000);
    expect(melted.displayTomanValue).toBe(115350000);
    expect(melted.sourceNativeUnit).toBe('TOMAN');
    expect(melted.marketNotation).toBe('مظنه: 115.35');
  });

  it('reports no data (never simulated prices) when a source is unreachable', async () => {
    const failing = async () => { throw new Error('blocked'); };
    for (const id of ['telegram_abshdh', 'arzdigital_tether', 'tgju_tether', 'moj3']) {
      const source = await executeAndParseSource(id, cheerio.load, failing);
      expect(source.parsedAssets).toHaveLength(0);
      expect(source.health).toBe('failing');
    }
  });

  it('does not invent prices for sources without a parser', async () => {
    const ok = async () => ({ ok: true, text: async () => '<html>moj3 page</html>' });
    const source = await executeAndParseSource('moj3', cheerio.load, ok);
    expect(source.parsedAssets).toHaveLength(0);
    expect(source.rawTextPreview).toContain('پیاده‌سازی نشده');
  });
});
