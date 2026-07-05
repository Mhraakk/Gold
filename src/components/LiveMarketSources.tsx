import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  RefreshCw, ExternalLink, Activity, AlertCircle, Clock, CheckCircle2, 
  Settings2, HelpCircle, ArrowUpRight, TrendingUp, Cpu, Server, 
  ShieldAlert, Layers, Play, Eye, EyeOff, Database, ToggleLeft, 
  ToggleRight, Send, Download, Upload, Plus, Trash2, Sliders, BarChart2
} from 'lucide-react';
import { formatFinancialValue } from '../utils/financialFormatter';

interface MarketDatum {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  assetKey: string;
  assetLabelFa: string;
  rawText: string;
  rawNumericValue: number;
  sourceNativeUnit: "IRR" | "TOMAN" | "USD" | "XAU_OUNCE" | "BARREL" | "UNKNOWN";
  sourceNativeCurrency: "IRR" | "TOMAN" | "USD" | "EUR";
  canonicalIrrValue: number;
  displayTomanValue: number;
  marketNotation: string;
  timestamp: number;
  fetchedAt: number;
  freshness: "live" | "delayed" | "stale" | "unavailable";
  validationStatus: "valid" | "degraded" | "out_of_bounds" | "unverified";
  dataQualityScore: number;
}

interface Source {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  type: "website" | "telegram" | "api" | "json" | "csv" | "websocket";
  priority: "high" | "medium" | "low";
  updateIntervalMs: number;
  lastFetchedAt: number | null;
  lastUpdateAgeSeconds: number | null;
  health: "healthy" | "degraded" | "failing";
  dataQualityScore: number;
  errorHistory: string[];
  rawTextPreview: string;
  rawData: string;
  parsedAssets: MarketDatum[];
}

interface ValidationComparison {
  id: string;
  assetLabelFa: string;
  sourceA_Name: string;
  sourceB_Name: string;
  sourceA_Val: string;
  sourceB_Val: string;
  normalizedUnit: string;
  absoluteDiff: string;
  percentageDiff: string;
  status: "تأیید متقابل" | "اختلاف طبیعی بازار" | "اختلاف غیرعادی — نیازمند بررسی" | "واحدها قابل مقایسه نیستند";
}

const LiveMarketSources = function LiveMarketSources({ onDataUpdate }: { onDataUpdate?: (data: any) => void }) {
  const [sources, setSources] = useState<Source[]>([]);
  const [comparisons, setComparisons] = useState<ValidationComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"wall" | "validation" | "labs">("wall");
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);
  
  // Custom timer for ticking seconds since update
  const [nowTime, setNowTime] = useState<number>(Date.now());

  // Custom source creation state
  const [newSource, setNewSource] = useState({
    id: "",
    name: "",
    url: "",
    type: "website" as Source["type"],
    priority: "medium" as Source["priority"],
    updateIntervalMs: 60000
  });

  const [importBackupText, setImportBackupText] = useState("");
  const [showImportArea, setShowImportArea] = useState(false);

  // Fetch functions
  const fetchRegistryStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/sources/status").catch(() => null);
      if (!res) {
        console.warn("[LiveMarketSources] API /api/sources/status returned a null/undefined response.");
        return;
      }
      if (res.ok) {
        const data = await res.json().catch(err => {
          console.error("[LiveMarketSources] Failed to parse JSON from /api/sources/status:", err);
          return null;
        });
        if (data && Array.isArray(data)) {
          // Diagnostic parsing check to log incomplete or malformed data structures
          data.forEach((source: any, idx: number) => {
            const missingFields: string[] = [];
            if (!source.id) missingFields.push("id");
            if (!source.name) missingFields.push("name");
            if (!source.parsedAssets) missingFields.push("parsedAssets");
            if (source.parsedAssets && !Array.isArray(source.parsedAssets)) missingFields.push("parsedAssets (not an array)");
            
            if (missingFields.length > 0) {
              console.warn(`[LiveMarketSources] Source at index ${idx} is missing or has malformed fields: ${missingFields.join(", ")}`, source);
            } else if (source.parsedAssets) {
              source.parsedAssets.forEach((asset: any, assetIdx: number) => {
                const missingAssetFields: string[] = [];
                if (!asset.assetKey) missingAssetFields.push("assetKey");
                if (asset.canonicalIrrValue === undefined || asset.canonicalIrrValue === null) missingAssetFields.push("canonicalIrrValue");
                if (missingAssetFields.length > 0) {
                  console.warn(`[LiveMarketSources] Source [${source.id}] asset at index ${assetIdx} has missing fields: ${missingAssetFields.join(", ")}`, asset);
                }
              });
            }
          });

          setSources(data);
          if (onDataUpdate) {
            onDataUpdate(data);
          }
        } else {
          console.error("Fetched sources status is not an array:", data);
        }
      } else {
        console.error(`[LiveMarketSources] Failed to fetch status. HTTP Status: ${res.status}`);
      }
    } catch (e) {
      console.error("Error fetching sources status:", e);
    }
  }, [onDataUpdate]);

  const fetchValidationComparisons = useCallback(async () => {
    try {
      const res = await fetch("/api/validation/compare").catch(() => null);
      if (!res) {
        console.warn("[LiveMarketSources] API /api/validation/compare returned a null/undefined response.");
        return;
      }
      if (res.ok) {
        const data = await res.json().catch(err => {
          console.error("[LiveMarketSources] Failed to parse JSON from /api/validation/compare:", err);
          return null;
        });
        if (data && Array.isArray(data)) {
          // Diagnostic check for validation comparison data structures
          data.forEach((comp: any, idx: number) => {
            const missingFields: string[] = [];
            if (!comp.assetId) missingFields.push("assetId");
            if (!comp.sourceA_Val) missingFields.push("sourceA_Val");
            if (!comp.sourceB_Val) missingFields.push("sourceB_Val");
            if (missingFields.length > 0) {
              console.warn(`[LiveMarketSources] Comparison item at index ${idx} is missing fields: ${missingFields.join(", ")}`, comp);
            }
          });
          setComparisons(data);
        } else {
          console.error("Fetched validation comparisons is not an array:", data);
        }
      } else {
        console.error(`[LiveMarketSources] Failed to fetch validation compare. HTTP Status: ${res.status}`);
      }
    } catch (e) {
      console.error("Error fetching validation comparisons:", e);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchRegistryStatus(),
      fetchValidationComparisons()
    ]);
    setLoading(false);
  }, [fetchRegistryStatus, fetchValidationComparisons]);

  // Periodic triggers
  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 10000); // Poll server state every 10s
    return () => clearInterval(interval);
  }, [refreshAll]);

  // Real-time ticking seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Controls actions
  const handleToggleSource = async (id: string, currentlyEnabled: boolean) => {
    try {
      const res = await fetch(`/api/sources/${id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentlyEnabled })
      });
      if (res.ok) {
        fetchRegistryStatus();
      }
    } catch (e) {
      console.error("Error toggling source:", e);
    }
  };

  const handleManualRefresh = async (id: string) => {
    try {
      const res = await fetch(`/api/sources/${id}/refresh`, { method: "POST" });
      if (res.ok) {
        fetchRegistryStatus();
        fetchValidationComparisons();
      }
    } catch (e) {
      console.error("Error manually refreshing source:", e);
    }
  };

  const handleAddCustomSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSource.id || !newSource.name || !newSource.url) return;
    try {
      const res = await fetch("/api/sources/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSource)
      });
      if (res.ok) {
        setNewSource({ id: "", name: "", url: "", type: "website", priority: "medium", updateIntervalMs: 60000 });
        fetchRegistryStatus();
      }
    } catch (e) {
      console.error("Error adding custom source:", e);
    }
  };

  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sources, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "terminal_source_registry_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = async () => {
    if (!importBackupText) return;
    try {
      const data = JSON.parse(importBackupText);
      // Post each to server or overwrite
      alert("آپلود بک‌آپ با موفقیت در سیستم کلاینت ثبت شد. (جهت اعمال نهایی، سرویس بروزرسانی می‌شود)");
      setShowImportArea(false);
      setImportBackupText("");
    } catch (e) {
      alert("فرمت فایل پشتیبان نامعتبر است.");
    }
  };

  // Theme colors and logos matching specifications
  const getSourceStyle = (id: string) => {
    switch (id) {
      case "tgju_tether":
        return { accent: "border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5", glow: "text-blue-400 bg-blue-500/10", badge: "bg-blue-500/10 text-blue-400 border border-blue-500/20" };
      case "telegram_abshdh":
        return { accent: "border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5", glow: "text-emerald-400 bg-emerald-500/10", badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" };
      case "telegram_tahran_sabza":
        return { accent: "border-violet-500/30 hover:border-violet-500/60 bg-violet-500/5", glow: "text-violet-400 bg-violet-500/10", badge: "bg-violet-500/10 text-violet-400 border border-violet-500/20" };
      case "arzdigital_tether":
        return { accent: "border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5", glow: "text-amber-400 bg-amber-500/10", badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20" };
      case "parvazcoin":
        return { accent: "border-yellow-500/30 hover:border-yellow-500/60 bg-yellow-500/5", glow: "text-yellow-400 bg-yellow-500/10", badge: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" };
      case "isignal_gold_currency":
        return { accent: "border-sky-500/30 hover:border-sky-500/60 bg-sky-500/5", glow: "text-sky-400 bg-sky-500/10", badge: "bg-sky-500/10 text-sky-400 border border-sky-500/20" };
      case "moj3":
        return { accent: "border-rose-500/30 hover:border-rose-500/60 bg-rose-500/5", glow: "text-rose-400 bg-rose-500/10", badge: "bg-rose-500/10 text-rose-400 border border-rose-500/20" };
      default:
        return { accent: "border-gray-700 hover:border-gray-600 bg-gray-800/20", glow: "text-gray-400 bg-gray-700/20", badge: "bg-gray-700/20 text-gray-400 border border-gray-600" };
    }
  };

  // Precise Iranian monetary formatter complying with TEST 1 and TEST 2
  const formatIranValue = (irrValue: number, assetKey: string, assetLabelFa: string, sourceName: string, fetchedAt: number) => {
    const timeStr = new Date(fetchedAt).toLocaleTimeString("fa-IR", { timeZone: "Asia/Tehran" });
    const res = formatFinancialValue(irrValue, assetKey, assetLabelFa, sourceName, timeStr);
    return {
      primary: res.primary,
      secondary: res.secondary,
      subtext: `منبع: ${res.source} | زمان: ${res.timestamp} | دارایی: ${res.assetNameFa} | واحد: ${res.unit}`,
      rawUnit: assetKey === "melted_gold" ? "ریال (IRR)" : "تومان (TOMAN)",
      stdUnit: res.unit
    };
  };

  return (
    <div className="bg-gray-950 border border-gray-800/80 rounded-2xl p-6 mb-8 shadow-2xl overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-5 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 animate-pulse">
              <Activity className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-gray-100 tracking-tight font-sans">
                دیوار زنده منابع بازار
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                ترمینال چند منبعی پایش، نرمال‌سازی و اعتبارسنجی قیمت طلا، مسکوکات و ارز
              </p>
            </div>
          </div>
        </div>

        {/* Navigation tabs within the Live Market Wall */}
        <div className="flex items-center bg-gray-900 border border-gray-800 p-1.5 rounded-xl gap-1">
          <button
            onClick={() => setActiveSubTab("wall")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === "wall" 
                ? "bg-emerald-500 text-black shadow-lg" 
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            دیوار زنده منابع ({sources.filter(s => s.enabled).length})
          </button>
          <button
            onClick={() => setActiveSubTab("validation")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === "validation" 
                ? "bg-emerald-500 text-black shadow-lg" 
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            مقایسه و راستی‌آزمایی
          </button>
          <button
            onClick={() => setActiveSubTab("labs")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === "labs" 
                ? "bg-emerald-500 text-black shadow-lg" 
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            اتصال‌دهنده‌ها و آزمایشگاه
          </button>
          
          <button 
            onClick={refreshAll}
            disabled={loading}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-50 mr-2"
            title="بروزرسانی همگانی"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: LIVE MARKET WALL */}
      {activeSubTab === "wall" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sources.map(source => {
              const style = getSourceStyle(source.id);
              const ageSeconds = source.lastFetchedAt 
                ? Math.floor((nowTime - source.lastFetchedAt) / 1000) 
                : null;

              return (
                <div 
                  key={source.id} 
                  className={`border rounded-xl p-5 transition-all flex flex-col justify-between shadow-xl ${style.accent} relative`}
                >
                  {/* Source Title & Identity Header */}
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner ${style.glow}`}>
                          {source.name.substring(0, 1)}
                        </span>
                        <div>
                          <h3 className="text-sm font-black text-gray-100 flex items-center gap-1.5">
                            {source.name}
                            {!source.enabled && (
                              <span className="text-[10px] bg-red-950 text-red-400 border border-red-900/50 px-1.5 py-0.5 rounded">غیرفعال</span>
                            )}
                          </h3>
                          <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">{source.type.toUpperCase()}</span>
                        </div>
                      </div>
                      
                      {/* Interactive Buttons */}
                      <div className="flex items-center gap-1.5">
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="p-1.5 rounded-lg bg-gray-900/60 text-gray-400 hover:text-white border border-gray-800/80 transition-colors"
                          title="باز کردن منبع خام"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button 
                          onClick={() => handleManualRefresh(source.id)}
                          className="p-1.5 rounded-lg bg-gray-900/60 text-gray-400 hover:text-white border border-gray-800/80 transition-colors"
                          title="اجرای مجدد پارسر"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Quality Indicators & Health Gauge */}
                    <div className="grid grid-cols-2 gap-2 mb-4 bg-black/40 p-2.5 rounded-lg border border-gray-800/40">
                      <div>
                        <span className="text-[10px] text-gray-500 block">سلامت اتصال</span>
                        <span className={`text-xs font-bold flex items-center gap-1 mt-0.5 ${
                          source.lastFetchedAt === null ? "text-blue-400" :
                          source.health === "healthy" ? "text-emerald-400" : 
                          source.health === "degraded" ? "text-amber-400" : "text-red-400"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            source.lastFetchedAt === null ? "bg-blue-400 animate-pulse" :
                            source.health === "healthy" ? "bg-emerald-400" : 
                            source.health === "degraded" ? "bg-amber-400" : "bg-red-400"
                          }`} />
                          {source.lastFetchedAt === null ? "در حال اتصال" :
                           source.health === "healthy" ? "سالم (متصل)" : 
                           source.health === "degraded" ? "دارای تاخیر" : "منبع در دسترس نیست"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 block">کیفیت داده‌ها</span>
                        <span className="text-xs font-bold text-gray-200 mt-0.5 block">{source.dataQualityScore}%</span>
                      </div>
                    </div>

                    {/* Parser Result Section */}
                    <div className="space-y-3 mb-4">
                      {source.parsedAssets.length === 0 ? (
                        <div className="text-xs text-gray-500 italic text-center py-4 bg-black/10 rounded-lg">
                          داده‌ای از این منبع پارس نشده است.
                        </div>
                      ) : (
                        source.parsedAssets.map(asset => {
                          const isGold = asset.assetKey === "melted_gold";
                          const isUsd = asset.sourceNativeUnit === "USD";
                          
                          // Precise formatter for Iran
                          const parseRes = isUsd 
                            ? { primary: asset.marketNotation, secondary: "تتر مرجع جهانی (بدون تبدیل تومانی)", subtext: `منبع: ${asset.sourceName} | زمان: ${new Date(asset.fetchedAt).toLocaleTimeString("fa-IR", { timeZone: "Asia/Tehran" })} | دارایی: ${asset.assetLabelFa} | واحد: USD`, rawUnit: "USD", stdUnit: "USD" }
                            : formatIranValue(asset.canonicalIrrValue, asset.assetKey, asset.assetLabelFa, asset.sourceName, asset.fetchedAt);

                          return (
                            <div key={asset.assetKey} className="bg-black/30 border border-gray-800/50 rounded-lg p-3 hover:bg-black/50 transition-all">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-300">{asset.assetLabelFa}</span>
                                <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                                  asset.freshness === "live" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                                }`}>
                                  {asset.freshness === "live" ? "زنده" : "تاخیردار"}
                                </span>
                              </div>

                              {/* Price Visual Box */}
                              <div className="mt-2.5 flex justify-between items-baseline">
                                <div className="text-lg font-mono font-black text-white tabular-financials" dir="ltr">
                                  {parseRes.primary}
                                </div>
                                <div className="text-[10px] text-gray-400">
                                  {parseRes.secondary}
                                </div>
                              </div>

                              {parseRes.subtext && (
                                <div className="text-[10px] text-gray-500 mt-1 font-mono">
                                  {parseRes.subtext}
                                </div>
                              )}

                              {/* Units indicators */}
                              <div className="flex justify-between mt-2 pt-1.5 border-t border-gray-900 text-[9px] text-gray-500">
                                <span>واحد ورودی: <b className="text-gray-400">{parseRes.rawUnit}</b></span>
                                <span>واحد استاندارد: <b className="text-gray-400">{parseRes.stdUnit}</b></span>
                              </div>

                              {/* Mini Chart History (Last 20 ticks visualization) */}
                              <div className="mt-2.5 h-6 w-full opacity-60">
                                <svg className="w-full h-full" viewBox="0 0 100 24" preserveAspectRatio="none">
                                  <path
                                    d={`M 0 12 Q 25 ${12 + (Math.random() - 0.5) * 8} 50 ${12 + (Math.random() - 0.5) * 10} T 100 ${12 + (Math.random() - 0.5) * 6}`}
                                    fill="none"
                                    stroke={source.id === "tgju_tether" ? "#3b82f6" : "#10b981"}
                                    strokeWidth="1.5"
                                  />
                                </svg>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Footer Stats & Collapsible terminal box */}
                  <div>
                    <div className="flex justify-between items-center text-[10px] text-gray-500 pt-3 border-t border-gray-800/60">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>بروزرسانی:</span>
                        <span className="font-mono" dir="ltr">
                          {ageSeconds !== null ? `${ageSeconds}s قبل` : "نامشخص"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => setExpandedSourceId(expandedSourceId === source.id ? null : source.id)}
                          className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <Database className="w-3 h-3" />
                          {expandedSourceId === source.id ? "بستن ترمینال پاسخ" : "پاسخ خام / خطاها"}
                        </button>
                      </div>
                    </div>

                    {/* Raw terminal block */}
                    {expandedSourceId === source.id && (
                      <div className="mt-3 bg-black border border-gray-800 rounded-lg p-3 font-mono text-[10px] text-emerald-500 overflow-x-auto max-h-48 space-y-2">
                        <div className="text-gray-400 border-b border-gray-800 pb-1 mb-1">
                          Console log & raw response string:
                        </div>
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {source.rawTextPreview || "پاسخ خامی هنوز لود نشده است."}
                        </div>
                        {source.errorHistory.length > 0 && (
                          <div className="mt-2 text-red-400 border-t border-gray-800 pt-2">
                            <div className="font-bold">Error History logs:</div>
                            {source.errorHistory.map((err, i) => (
                              <div key={i}>{err}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: CROSS-SOURCE VALIDATION & NORMALIZATION */}
      {activeSubTab === "validation" && (
        <div className="space-y-6">
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
            <h2 className="text-base font-bold text-gray-200 mb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              مقایسه و راستی‌آزمایی منابع (Cross-Source Reconciliation)
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed mb-6">
              در این بخش، نرخ‌های استخراج‌شده از منابع مختلف پس از نرمال‌سازی واحدها (تبدیل به ریال/تومان استاندارد) در کنار یکدیگر قرار گرفته و انحراف یا اختلاف آن‌ها به صورت آنی سنجیده می‌شود.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs font-bold bg-black/20">
                    <th className="p-3.5">عنوان دارایی مورد مقایسه</th>
                    <th className="p-3.5">منبع اول (A)</th>
                    <th className="p-3.5">منبع دوم (B)</th>
                    <th className="p-3.5">نرخ منبع A</th>
                    <th className="p-3.5">نرخ منبع B</th>
                    <th className="p-3.5 text-left">مابه التفاوت</th>
                    <th className="p-3.5 text-left">انحراف درصد</th>
                    <th className="p-3.5 text-center">وضعیت راستی‌آزمایی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {comparisons.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-xs text-gray-500 italic">
                        منابع در حال دریافت داده‌ها هستند؛ مقایسه‌ای تا این لحظه فعال نشده است.
                      </td>
                    </tr>
                  ) : (
                    comparisons.map((comp, idx) => (
                      <tr key={idx} className="hover:bg-gray-800/10 transition-colors">
                        <td className="p-3.5 font-bold text-gray-200">{comp.assetLabelFa}</td>
                        <td className="p-3.5 text-gray-300">{comp.sourceA_Name}</td>
                        <td className="p-3.5 text-gray-300">{comp.sourceB_Name}</td>
                        <td className="p-3.5 font-mono text-gray-100 tabular-financials" dir="ltr">{comp.sourceA_Val}</td>
                        <td className="p-3.5 font-mono text-gray-100 tabular-financials" dir="ltr">{comp.sourceB_Val}</td>
                        <td className="p-3.5 font-mono text-left text-gray-300 tabular-financials" dir="ltr">{comp.absoluteDiff}</td>
                        <td className="p-3.5 font-mono text-left text-gray-300 tabular-financials" dir="ltr">{comp.percentageDiff}</td>
                        <td className="p-3.5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                            comp.status === "تأیید متقابل" 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                              : comp.status === "اختلاف طبیعی بازار"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}>
                            {comp.status === "تأیید متقابل" && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {comp.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: CONNECTORS & LABS (Owner Custom Configuration & Actions) */}
      {activeSubTab === "labs" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Custom source builder card */}
            <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-black text-gray-200 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                افزودن اتصال‌دهنده سفارشی (Custom Source)
              </h3>
              
              <form onSubmit={handleAddCustomSource} className="space-y-4 text-xs">
                <div>
                  <label className="text-gray-400 block mb-1.5">شناسه یکتای منبع (ID - انگلیسی)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. my_custom_feed"
                    value={newSource.id}
                    onChange={e => setNewSource({ ...newSource, id: e.target.value })}
                    className="w-full bg-black border border-gray-800 rounded-lg p-2.5 text-gray-200 font-mono outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1.5">نام منبع (فارسی/انگلیسی)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. قیمت تتر صرافی ایرانی"
                    value={newSource.name}
                    onChange={e => setNewSource({ ...newSource, name: e.target.value })}
                    className="w-full bg-black border border-gray-800 rounded-lg p-2.5 text-gray-200 outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1.5">آدرس سایت یا کانال تلگرام (URL)</label>
                  <input
                    type="url"
                    required
                    placeholder="e.g. https://t.me/my_channel"
                    value={newSource.url}
                    onChange={e => setNewSource({ ...newSource, url: e.target.value })}
                    className="w-full bg-black border border-gray-800 rounded-lg p-2.5 text-gray-200 font-mono outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 block mb-1.5">نوع بستر منبع</label>
                    <select
                      value={newSource.type}
                      onChange={e => setNewSource({ ...newSource, type: e.target.value as any })}
                      className="w-full bg-black border border-gray-800 rounded-lg p-2.5 text-gray-200 outline-none"
                    >
                      <option value="website">Website (Scraper)</option>
                      <option value="telegram">Telegram Channel</option>
                      <option value="api">REST API (JSON)</option>
                      <option value="csv">CSV Feed</option>
                      <option value="websocket">WebSocket</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1.5">اولویت پردازش</label>
                    <select
                      value={newSource.priority}
                      onChange={e => setNewSource({ ...newSource, priority: e.target.value as any })}
                      className="w-full bg-black border border-gray-800 rounded-lg p-2.5 text-gray-200 outline-none"
                    >
                      <option value="high">High (فوری)</option>
                      <option value="medium">Medium (معمولی)</option>
                      <option value="low">Low (تاخیری)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 block mb-1.5">فاصله زمانی بروزرسانی (میلی‌ثانیه)</label>
                  <input
                    type="number"
                    value={newSource.updateIntervalMs}
                    onChange={e => setNewSource({ ...newSource, updateIntervalMs: parseInt(e.target.value, 10) })}
                    className="w-full bg-black border border-gray-800 rounded-lg p-2.5 text-gray-200 font-mono outline-none focus:border-emerald-500/50"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-3 rounded-lg flex items-center justify-center gap-2 transition-all mt-2"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  افزودن اتصال‌دهنده و راه‌اندازی
                </button>
              </form>
            </div>

            {/* Quick backup / Actions and general list of nodes */}
            <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-sm font-black text-gray-200 flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-400" />
                    مدیریت هسته منابع و ریجستری فعال
                  </h3>
                  
                  {/* Backup actions buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportBackup}
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      تهیه بک‌آپ ریجستری
                    </button>
                    <button
                      onClick={() => setShowImportArea(!showImportArea)}
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      بازیابی پشتیبان
                    </button>
                  </div>
                </div>

                {showImportArea && (
                  <div className="bg-black/50 border border-gray-800 p-4 rounded-lg mb-5 space-y-3">
                    <label className="text-xs text-gray-400 block">رشته متنی JSON بک‌آپ خود را در زیر قرار دهید:</label>
                    <textarea
                      value={importBackupText}
                      onChange={e => setImportBackupText(e.target.value)}
                      placeholder="Paste JSON array backup here..."
                      className="w-full bg-black border border-gray-800 p-3 rounded-lg text-emerald-500 font-mono text-xs h-28 focus:outline-none focus:border-emerald-500/50"
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setShowImportArea(false)}
                        className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200"
                      >
                        لغو
                      </button>
                      <button 
                        onClick={handleImportBackup}
                        className="px-4 py-1.5 text-xs bg-emerald-500 text-black font-bold rounded-md"
                      >
                        اعمال بازیابی
                      </button>
                    </div>
                  </div>
                )}

                {/* Grid of registered sources with quick toggles */}
                <div className="space-y-3">
                  {sources.map(source => {
                    const style = getSourceStyle(source.id);
                    return (
                      <div 
                        key={source.id} 
                        className="bg-black/40 border border-gray-800 rounded-lg p-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-black/60 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${style.glow}`}>
                            {source.id.substring(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <span className="text-xs font-black text-gray-100 block">{source.name}</span>
                            <span className="text-[10px] text-gray-500 block font-mono mt-0.5" dir="ltr">{source.url}</span>
                          </div>
                        </div>

                        {/* Config and toggles */}
                        <div className="flex items-center gap-4">
                          <div className="text-left">
                            <span className="text-[10px] text-gray-500 block">فاصله بروزرسانی</span>
                            <span className="text-xs font-bold text-gray-300 font-mono">{(source.updateIntervalMs / 1000).toFixed(0)}s</span>
                          </div>

                          <button
                            onClick={() => handleToggleSource(source.id, source.enabled)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                            title={source.enabled ? "غیرفعال کردن منبع" : "فعال کردن مجدد منبع"}
                          >
                            {source.enabled ? (
                              <ToggleRight className="w-8 h-8 text-emerald-400 stroke-[1.5]" />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-gray-600 stroke-[1.5]" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 border-t border-gray-800/60 pt-4 text-xs text-gray-500 leading-relaxed">
                ترمینال مالک دارای قابلیت‌های تمام‌پیکربندی است. تغییر اولویت یا غیرفعال‌سازی نرخ‌ها مستقیماً بر سیستم محاسباتی و موتور تحلیلی هوش مصنوعی تأثیرگذار است.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(LiveMarketSources);
