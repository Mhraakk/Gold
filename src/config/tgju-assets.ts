export interface TgjuAssetConfig {
  key: string;
  labelFa: string;
  sourceName: string;
  sourceUrl: string;
  expectedUnit: string;
  parser: "profilePageParser";
}

export const tgjuAssets: Record<string, TgjuAssetConfig> = {
  xauusd: {
    key: "xauusd",
    labelFa: "انس جهانی طلا",
    sourceName: "TGJU",
    sourceUrl: "https://www.tgju.org/profile/ons",
    expectedUnit: "USD per ounce",
    parser: "profilePageParser"
  },
  dollar_azad: {
    key: "dollar_azad",
    labelFa: "دلار آزاد",
    sourceName: "TGJU",
    sourceUrl: "https://www.tgju.org/profile/price_dollar_rl",
    expectedUnit: "IRT",
    parser: "profilePageParser"
  },
  gold_18k: {
    key: "gold_18k",
    labelFa: "طلای ۱۸ عیار",
    sourceName: "TGJU",
    sourceUrl: "https://www.tgju.org/profile/geram18",
    expectedUnit: "IRT per gram",
    parser: "profilePageParser"
  },
  gold_24k: {
    key: "gold_24k",
    labelFa: "طلای ۲۴ عیار",
    sourceName: "TGJU",
    sourceUrl: "https://www.tgju.org/profile/geram24",
    expectedUnit: "IRT per gram",
    parser: "profilePageParser"
  },
  mesghal: {
    key: "mesghal",
    labelFa: "مثقال طلا",
    sourceName: "TGJU",
    sourceUrl: "https://www.tgju.org/profile/mesghal",
    expectedUnit: "IRT",
    parser: "profilePageParser"
  },
  abshodeh_naghdi: {
    key: "abshodeh_naghdi",
    labelFa: "آبشده نقدی",
    sourceName: "TGJU",
    sourceUrl: "https://www.tgju.org/profile/mesghal",
    expectedUnit: "IRT",
    parser: "profilePageParser"
  },
  emami: {
    key: "emami",
    labelFa: "سکه امامی",
    sourceName: "TGJU",
    sourceUrl: "https://www.tgju.org/profile/sekee",
    expectedUnit: "IRT",
    parser: "profilePageParser"
  },
  nim_sekeh: {
    key: "nim_sekeh",
    labelFa: "نیم سکه",
    sourceName: "TGJU",
    sourceUrl: "https://www.tgju.org/profile/nim",
    expectedUnit: "IRT",
    parser: "profilePageParser"
  },
  rob_sekeh: {
    key: "rob_sekeh",
    labelFa: "ربع سکه",
    sourceName: "TGJU",
    sourceUrl: "https://www.tgju.org/profile/rob",
    expectedUnit: "IRT",
    parser: "profilePageParser"
  },
  gerami: {
    key: "gerami",
    labelFa: "سکه گرمی",
    sourceName: "TGJU",
    sourceUrl: "https://www.tgju.org/profile/gerami",
    expectedUnit: "IRT",
    parser: "profilePageParser"
  },
  brent: {
    key: "brent",
    labelFa: "نفت برنت",
    sourceName: "TGJU",
    sourceUrl: "https://www.tgju.org/profile/energy-brent-oil",
    expectedUnit: "USD",
    parser: "profilePageParser"
  },
  tether: {
    key: "tether",
    labelFa: "تتر",
    sourceName: "TGJU",
    sourceUrl: "https://www.tgju.org/profile/crypto-tether",
    expectedUnit: "USD/IRT",
    parser: "profilePageParser"
  }
};
