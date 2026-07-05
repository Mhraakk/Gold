const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const injection = `              </div>
            </nav>
          </div>

          <div className="pt-6 border-t border-[var(--border-subtle)] space-y-3 text-[10px] text-[var(--text-secondary)] font-sans text-right mt-4">
            <div className="flex flex-row justify-between items-center px-1">
              <span>تاخیر اتصال شبکه:</span>
              <span className="text-[var(--accent-emerald)] font-bold data-value text-[11px] tracking-wider">
                {latency} ms
              </span>
            </div>
            <div className="flex flex-row justify-between items-center px-1">
              <span>وضعیت موتور کوانت:</span>
              <span className="flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-gold)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-gold)]"></span>
                </span>
                <span className="text-[var(--accent-gold)] font-bold tracking-wider">
                  آماده کار
                </span>
              </span>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 h-screen overflow-y-auto p-4 md:p-8 bg-[var(--bg-base)] custom-scrollbar pb-24 md:pb-8 text-right" dir="rtl">
          <React.Suspense
            fallback={
              <div className="flex flex-col items-center justify-center h-full w-full min-h-[60vh] space-y-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-gray-900 border-t-[var(--accent-gold)] animate-spin"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 bg-[var(--accent-gold)]/20 rounded-full blur-xl"></div>
                </div>
                <p className="font-display text-[var(--accent-gold)] tracking-widest text-xs animate-pulse">
                  در حال بارگذاری ماژول کوانت...
                </p>
              </div>
            }
          >
            {activeTab === "markets" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
                  <div className="glass-panel lux-card lux-breathe rounded-2xl p-6 flex flex-row items-center justify-between col-span-1 md:col-span-2 relative overflow-hidden group">
                    <div className="space-y-3 z-10">
                      <span className="text-[10px] font-sans bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] border border-[var(--accent-gold)]/20 px-3 py-1 rounded-full uppercase tracking-widest font-semibold inline-block mb-1 shadow-sm">
                        شاخص اختلاف قیمت تهران و بازار جهانی
                      </span>
                      <h3 className="font-display font-semibold text-2xl lux-gradient-text tracking-wide">
                        محاسبه آربیتراژ داخلی طلا
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] max-w-xl leading-loose font-sans">
                        قیمت طلای آب‌شده داخلی به صورت روزانه بر اساس نرخ ارز
                        بازار تهران و انس جهانی طلا محاسبه می‌شود. در حال حاضر
                        قیمت انس جهانی در سطح{" "}
                        <strong className="data-value text-[11px] text-[var(--text-primary)]">
                          \${prices.XAUUSD.toLocaleString()}
                        </strong>{" "}
                        با نرخ دلار بازار تطبیق یافته و حباب ضمنی طلا در بازار
                        تهران در حال رصد است.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {assetsMeta.map((meta) => {
                    const as = assetStats[meta.id];
                    return (
                      <div
                        key={meta.id}
                        className={\`glass-panel rounded-2xl p-5 border cursor-pointer transition-all duration-300 \${
                          activeAssetId === meta.id
                            ? "border-[var(--accent-gold)]/50 bg-[var(--accent-gold)]/5 shadow-[0_0_20px_rgba(212,175,55,0.05)]"
                            : "border-[var(--border-subtle)] hover:border-[var(--accent-gold)]/30 hover:bg-[var(--bg-panel-heavy)]"
                        }\`}
                        onClick={() => setActiveAssetId(meta.id)}
                      >
                        <div className="flex flex-row justify-between items-start mb-4 text-right">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-[10px] text-[var(--text-secondary)] font-sans uppercase tracking-widest">
                              {meta.symbol}
                            </span>
                            <h4 className="font-semibold text-white font-sans text-sm">
                              {meta.name}
                            </h4>
                          </div>
                          <div
                            className={\`p-2 rounded-xl \${
                              activeAssetId === meta.id
                                ? "bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]"
                                : "bg-[var(--bg-base)] text-[var(--text-secondary)]"
                            }\`}
                          >
                            <TrendingUp className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="flex flex-col items-start gap-2 border-t border-[var(--border-subtle)] pt-4 mt-2">
                          <div className="text-2xl font-bold text-white data-value tracking-wider direction-ltr text-left w-full">
                            {meta.prefix}
                            {prices[meta.id].toLocaleString(undefined, {
                              maximumFractionDigits: meta.decimals,
                            })}
                          </div>
                          <div className="flex items-center justify-between w-full">
                            <span
                              className={\`text-[11px] font-bold font-sans flex items-center gap-1 \${
                                as.changePercent >= 0
                                  ? "text-[var(--accent-emerald)]"
                                  : "text-[var(--accent-crimson)]"
                              }\`}
                            >
                              {as.changePercent >= 0 ? "+" : ""}
                              {as.changePercent.toFixed(2)}%
                            </span>
                            <div className="text-right">
                              <span className="text-gray-600">
                                بیشترین (۲۴ساعت):
                              </span>{" "}
                              <span className="text-gray-300 font-semibold data-value text-[11px]">
                                {as.high24h.toLocaleString(undefined, {
                                  maximumFractionDigits: meta.decimals,
                                })}
                              </span>
`;

code = code.replace(
`                  </div>
                </button>

                            </span>`,
`                  </div>
                </button>
` + injection + `                            </span>`
);

fs.writeFileSync('src/App.tsx', code);
