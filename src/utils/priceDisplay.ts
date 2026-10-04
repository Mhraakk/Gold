import { APIConnector, AssetId } from "../types";

/**
 * Display helpers for the app-wide price convention:
 * - Iranian prices are stored as Rial (IRR) everywhere in the app.
 * - Users read them in Toman (IRR / 10).
 * - Global instruments (ounce, futures, CFD, ETF) are in USD.
 * - Melted-gold "mazaneh" notation is the Toman price in millions (e.g. 115.35).
 */

const USD_ASSETS: AssetId[] = ["XAUUSD", "GOLD_FUTURES", "GOLD_CFD", "GOLD_ETF"];

export const isUsdAsset = (assetId: AssetId): boolean => USD_ASSETS.includes(assetId);

export const irrToToman = (irr: number): number => irr / 10;

export const tomanToIrr = (toman: number): number => toman * 10;

export function priceUnitLabel(assetId: AssetId): string {
  return isUsdAsset(assetId) ? "دلار" : "تومان";
}

/** Formats a stored price for display: Toman for Iranian assets, USD otherwise. */
export function formatAssetPrice(assetId: AssetId, value: number, options: { withUnit?: boolean } = {}): string {
  if (!Number.isFinite(value) || value <= 0) return "در حال دریافت…";
  const text = isUsdAsset(assetId)
    ? value.toLocaleString("en-US", { maximumFractionDigits: 2 })
    : Math.round(irrToToman(value)).toLocaleString("en-US");
  return options.withUnit ? `${text} ${priceUnitLabel(assetId)}` : text;
}

/** Mazaneh notation of a melted-gold price stored in IRR: Toman in millions. */
export function formatMazaneh(irr: number): string {
  return (irrToToman(irr) / 1_000_000).toFixed(2);
}

/** Declared unit of a connector's price; defaults match the built-in sources. */
export function connectorPriceUnit(conn: Pick<APIConnector, "priceUnit" | "providerType" | "targetAssetId">): "IRR" | "TOMAN" | "USD" {
  if (conn.priceUnit) return conn.priceUnit;
  if (conn.providerType === "TelegramScraper") return "TOMAN"; // @abshdh quotes Toman
  return isUsdAsset(conn.targetAssetId) ? "USD" : "IRR";
}

/** Stored price → the unit users read and type (Toman, or USD for global assets). */
export function toDisplayUnit(assetId: AssetId, stored: number): number {
  return isUsdAsset(assetId) ? stored : irrToToman(stored);
}

/** Value typed by the user (Toman, or USD) → stored price unit (IRR, or USD). */
export function fromDisplayUnit(assetId: AssetId, shown: number): number {
  return isUsdAsset(assetId) ? shown : tomanToIrr(shown);
}

/** Formats a signed amount (P&L, ATR, differences) in the display unit. */
export function formatAssetAmount(assetId: AssetId, value: number): string {
  if (!Number.isFinite(value)) return "—";
  return isUsdAsset(assetId)
    ? value.toLocaleString("en-US", { maximumFractionDigits: 2 })
    : Math.round(irrToToman(value)).toLocaleString("en-US");
}
