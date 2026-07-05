// Trigger HMR reload
import ConnectorsTerminal from './components/ConnectorsTerminal';
import DataTruthCenter from './components/DataTruthCenter';
import Gold18ForecastPanel from './components/Gold18ForecastPanel';
import MazanehDealerDecisionDesk from './components/MazanehDealerDecisionDesk';
import CorrelationMatrix from './components/CorrelationMatrix';
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "./contexts/ThemeContext";
import {
  AssetId,
  AssetInfo,
  Candle,
  MarketStructure,
  CalendarEvent,
  NewsItem,
  PortfolioPosition,
  TradeJournalEntry,
  AlertConfig,
  AIProviderConfig,
  AnalysisResponse,
  APIConnector,
} from "./types";
import {
  generateLiveAssets,
  generateHistoricalCandles,
  computeMarketStructure,
  ASSETS_METADATA,
  MACRO_CALENDAR,
  MARKET_NEWS,
} from "./data";
import {
  analyzeTechnicalIndicators,
  triggerAIAnalysis,
  TechnicalSignals,
} from "./services/aiEngine";
import { validateAndNormalizePrice, NormalizedMarketData } from "./utils/dataValidation";
import { checkDataQuality, DataQualityResult } from "./utils/dataQualityEngine";
import { encryptData, decryptData } from "./utils/crypto";
import ChartTerminal from "./components/ChartTerminal";
import AIChat from "./components/AIChat";
import PortfolioAnalytics from "./components/PortfolioAnalytics";
import VolatilityHeatmap from "./components/VolatilityHeatmap";
import StrategyBuilder, {
  StrategyRule,
  evaluateStrategyRule,
} from "./components/StrategyBuilder";
import AlertEngine from "./components/AlertEngine";
import MarketReplayEngine from "./components/MarketReplayEngine";
import NextDayForecast from "./components/NextDayForecast";
import MeltedGoldForecast from "./components/MeltedGoldForecast";
import LiveMarketSources from "./components/LiveMarketSources";
import MazanehHunter from "./components/MazanehHunter";
import {
  formatToShamsi,
  gregorianToJalali,
  jalaliToGregorian,
  PERSIAN_MONTH_NAMES,
  PERSIAN_MONTH_PHONETIC,
} from "./utils/shamsi";
import VolatilityDistribution from "./components/VolatilityDistribution";
import {
  Crosshair,
  Sparkles,
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  Settings,
  Calendar,
  Newspaper,
  Calculator,
  AlertTriangle,
  Bell,
  RefreshCw,
  Sliders,
  Key,
  CheckCircle,
  Lock,
  Activity,
  DollarSign,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Clock,
  Play,
  Layers,
  Heart,
  Plus,
  BarChart2,
  User,
  Sun,
  Moon,
  History,
  BellRing,
  Cpu,
  BrainCircuit,
  Database,
} from "lucide-react";



// --- Extracted Components to prevent App re-renders ---
const LiveClock = React.memo(() => {
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="flex flex-col items-end">
      <span className="text-xs text-[var(--text-secondary)] font-sans font-medium mb-1">
        {formatToShamsi(currentTime, { includeTime: false, formatStyle: "verbose" })}
      </span>
      <span className="text-2xl font-mono font-extrabold text-white tracking-widest bg-[var(--bg-panel-heavy)] px-4 py-1.5 rounded-xl border border-[var(--border-subtle)] shadow-inner">
        {currentTime.toLocaleTimeString('fa-IR', { hour12: false, timeZone: 'Asia/Tehran' })}
      </span>
    </div>
  );
});

const TimeAgo = React.memo(({ timestamp }: { timestamp: number | undefined }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  if (!timestamp) return <>بروزرسانی لایو</>;
  const seconds = Math.floor((now - timestamp) / 1000);
  return <>{seconds} ثانیه پیش</>;
});

const TimeAgoStyled = React.memo(({ timestamp }: { timestamp: number | undefined }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  if (!timestamp) return <span className="text-emerald-400/80">بروزرسانی لایو</span>;
  const seconds = Math.floor((now - timestamp) / 1000);
  return (
    <div className="flex items-center gap-2">
      <span className={seconds < 60 ? "text-emerald-400/80" : "text-amber-400/80"}>
        {seconds} ثانیه پیش
      </span>
      {seconds > 300 && (
        <span className="text-[9px] text-rose-500 font-bold px-1.5 py-0.5 bg-rose-500/10 rounded animate-pulse">
          هشدار تاخیر
        </span>
      )}
    </div>
  );
});
// -----------------------------------------------------

const DEFAULT_MARKET_STRUCTURE: MarketStructure = {
  trend: "NEUTRAL",
  orderBlocks: [],
  fvgs: [],
  waves: [],
  liquidityZones: [],
  supportLines: [],
  resistanceLines: [],
};

export default function App() {
  const { theme, toggleTheme } = useTheme();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<
    | "markets"
    | "terminal"
    | "ai"
    | "portfolio"
    | "alerts"
    | "calendar"
    | "news"
    | "journal"
    | "connectors"
    | "replay"
    | "forecast"
    | "market_wall"
    | "hunter"
    | "data_truth"
    | "mazaneh_forecast"
  >("terminal");
  const [activeAssetId, setActiveAssetId] = useState<AssetId>("MELTED_GOLD");
  const [aiSubTab, setAiSubTab] = useState<"forecast" | "strategy">("forecast");
  const [user, setUser] = useState<{ email: string; name?: string } | null>(() => {
    const saved = localStorage.getItem("terminal_user");
    return saved ? { email: saved } : { email: "medosaseven@gmail.com" };
  });

  // Custom Provider Selection
  const [provider, setProvider] = useState<string>("نرخ نقدی OANDA");
  const providersList = [
    "بازار طلای تهران",
    "نرخ نقدی OANDA",
    "متاتریدر ۵",
    "صرافی کامکس بورس نیویورک",
    "API تعاملی بروکرها",
    "کیتکو (Kitco)",
  ];

  // Dynamic Live Asset Price state
  const [prices, setPrices] = useState<Record<AssetId, number>>({
    MELTED_GOLD: 18450000,
    GOLD_18K: 4003000,
    GOLD_24K: 5337000,
    MESGHAL: 7500000,
    COIN_EMAMI: 42500000,
    COIN_HALF: 23800000,
    COIN_QUARTER: 15400000,
    GOLD_GRAM: 4800000,
    USDIRT: 61450,
    USDTIRT: 61850,
    XAUUSD: 2348.5,
    GOLD_FUTURES: 2362.1,
    GOLD_CFD: 2349.0,
    GOLD_ETF: 216.8,
  });

  const [dataQuality, setDataQuality] = useState<Record<string, DataQualityResult>>({});
  const [sourceTimestamps, setSourceTimestamps] = useState<Record<string, number>>({});

  const [assets, setAssets] = useState<AssetInfo[]>(() =>
    generateLiveAssets({
      MELTED_GOLD: 18450000,
      GOLD_18K: 4003000,
      GOLD_24K: 5337000,
      MESGHAL: 7500000,
      COIN_EMAMI: 42500000,
      COIN_HALF: 23800000,
      COIN_QUARTER: 15400000,
      GOLD_GRAM: 4800000,
      USDIRT: 61450,
      USDTIRT: 61850,
      XAUUSD: 2348.5,
      GOLD_FUTURES: 2362.1,
      GOLD_CFD: 2349.0,
      GOLD_ETF: 216.8,
    }),
  );
  const [historicalData, setHistoricalData] = useState<
    Record<AssetId, Candle[]>
  >({
    MELTED_GOLD: [],
    GOLD_18K: [],
    GOLD_24K: [],
    MESGHAL: [],
    COIN_EMAMI: [],
    COIN_HALF: [],
    COIN_QUARTER: [],
    GOLD_GRAM: [],
    USDIRT: [],
    USDTIRT: [],
    XAUUSD: [],
    GOLD_FUTURES: [],
    GOLD_CFD: [],
    GOLD_ETF: [],
  });

  // Active technical analysis metrics
  const [technicalSignals, setTechnicalSignals] =
    useState<TechnicalSignals | null>(null);
  const [marketStructure, setMarketStructure] =
    useState<MarketStructure | null>(null);

  // AI Configuration Setup (Saved in LocalStorage)
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>(() => {
    const saved = localStorage.getItem("ai_config_terminal");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.apiKeys) {
          parsed.apiKeys = {};
          if (parsed.apiKey) parsed.apiKeys[parsed.provider] = parsed.apiKey;
        }
        if (!parsed.systemPrompt.includes("PERSIAN")) {
          parsed.systemPrompt = `You are the Gold Terminal Principal Quant, Geopolitical Strategist & Institutional AI Decision Engine.\nYour analysis must be flawless, reasoning-first, and highly mathematical.\nCRITICAL REQUIREMENT: YOU MUST ANSWER STRICTLY AND ONLY IN PERSIAN (FARSI) LANGUAGE. NO ENGLISH EXCEPT FOR TICKERS OR TECHNICAL TERMS.\nFor every analysis you MUST:\n1. Detect trend & market structure (BOS, CHOCH, FVG).\n2. Detect hidden liquidity pools & institutional manipulation zones.\n3. Detect fake breakouts and confirm accumulation/distribution phases.\n4. Compare all signals, reject weak signals, and assign a strict confidence score.\n5. Generate high-probability entry, exit, Stop Loss, and dynamic Take Profit zones based on Kelly Criterion principles.\n6. Provide clear alternative and invalidation scenarios.\nNever just list indicators. Think critically, reason deeply, and act like a billion-dollar hedge fund manager.`;
        }
        return parsed;
      } catch (e) {
        console.error("Failed to parse AI Config", e);
      }
    }
    return {
      provider: "gemini",
      apiKeys_REMOVED: {},
      model: "gemini-3.5-flash",
      temperature: 0.15,
      systemPrompt: `You are the Gold Terminal Principal Quant, Geopolitical Strategist & Institutional AI Decision Engine.
Your analysis must be flawless, reasoning-first, and highly mathematical.
CRITICAL REQUIREMENT: YOU MUST ANSWER STRICTLY AND ONLY IN PERSIAN (FARSI) LANGUAGE. NO ENGLISH EXCEPT FOR TICKERS OR TECHNICAL TERMS.
For every analysis you MUST:
1. Detect trend & market structure (BOS, CHOCH, FVG).
2. Detect hidden liquidity pools & institutional manipulation zones.
3. Detect fake breakouts and confirm accumulation/distribution phases.
4. Compare all signals, reject weak signals, and assign a strict confidence score.
5. Generate high-probability entry, exit, Stop Loss, and dynamic Take Profit zones based on Kelly Criterion principles.
6. Provide clear alternative and invalidation scenarios.
Never just list indicators. Think critically, reason deeply, and act like a billion-dollar hedge fund manager.`,
    };
  });

  // Active AI Forecast Output state
  const [aiAnalysis, setAiAnalysis] = useState<AnalysisResponse | null>(null);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "reconnecting" | "offline"
  >("connected");
  const [showAIOverlay, setShowAIOverlay] = useState(true);
  const handleToggleAIOverlay = useCallback(() => setShowAIOverlay(prev => !prev), []);

  // Portfolio Simulations state (Saved in LocalStorage)
  const [positions, setPositions] = useState<PortfolioPosition[]>(() => {
    const saved = localStorage.getItem("simulated_positions");
    return saved ? JSON.parse(saved) : [];
  });

  // Risk Calculator parameters
  const [accountBalance, setAccountBalance] = useState(50000); // simulation equity
  const [riskPercent, setRiskPercent] = useState(2); // 2% risk tolerance
  const [leverage, setLeverage] = useState(10); // 10x leverage
  const [positionInput, setPositionInput] = useState({
    type: "buy" as "buy" | "sell",
    entryPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    quantity: 1,
  });

  // Trade Journal state
  const [journalEntries, setJournalEntries] = useState<TradeJournalEntry[]>(
    () => {
      const saved = localStorage.getItem("trade_journal");
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: "j_1",
              date: "2026-06-28",
              assetId: "MELTED_GOLD",
              type: "buy",
              entryPrice: 18150000,
              exitPrice: 18450000,
              quantity: 5,
              pnl: 1500000,
              duration: "4 hours",
              notes:
                "Elliott Wave (3) impulsive markup breakout. Successfully hit primary FVG target.",
              confidenceScore: 85,
            },
            {
              id: "j_2",
              date: "2026-06-29",
              assetId: "XAUUSD",
              type: "buy",
              entryPrice: 2331.2,
              exitPrice: 2345.5,
              quantity: 10,
              pnl: 143,
              duration: "1 day",
              notes:
                "Support sweep confirmation on liquidity block. Exited cleanly prior to PCE announcement volatility.",
              confidenceScore: 90,
            },
          ];
    },
  );
  const [newJournalEntry, setNewJournalEntry] = useState({
    notes: "",
    entryPrice: "",
    exitPrice: "",
    quantity: "",
    confidence: 85,
  });

  // Connector errors tracking
  const [connectorErrors, setConnectorErrors] = useState<
    Record<string, string>
  >({});

  // Alerts configuration state
  const [alerts, setAlerts] = useState<AlertConfig[]>([
    {
      id: "al_1",
      assetId: "MELTED_GOLD",
      condition: "above",
      value: 18700000,
      channel: "telegram",
      enabled: true,
    },
    {
      id: "al_2",
      assetId: "XAUUSD",
      condition: "below",
      value: 2320.0,
      channel: "email",
      enabled: false,
    },
  ]);
  const [injectTelegramPrice, setInjectTelegramPrice] = useState<boolean>(true);

  // Custom API pricing connectors state (Persisted in LocalStorage)
  const [connectors, setConnectors] = useState<APIConnector[]>(() => {
    const saved = localStorage.getItem("gold_terminal_connectors");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "conn_1",
        name: "Abshده Live Provider (@abshdh)",
        providerType: "TelegramScraper",
        endpoint: "/api/market/abshdh",
        apiKey: "",
        apiKeyHeader: "",
        mappingPrice: "data.MELTED_GOLD",
        mappingHigh: "",
        mappingLow: "",
        mappingChange: "",
        mappingVolume: "",
        isActive: true,
        targetAssetId: "MELTED_GOLD",
      },
      {
        id: "conn_2",
        name: "Nobitex USDT/Toman Orderbook API",
        providerType: "JSON",
        endpoint: "https://api.nobitex.ir/v2/orderbook/USDTIRT",
        apiKey: "",
        apiKeyHeader: "X-API-KEY",
        mappingPrice: "lastTradePrice",
        mappingHigh: "stats.24h.high",
        mappingLow: "stats.24h.low",
        mappingChange: "stats.24h.change_percent",
        mappingVolume: "volume",
        isActive: true,
        targetAssetId: "USDTIRT",
      },
      {
        id: "conn_3",
        name: "Bonbast Free Market FX Scraper",
        providerType: "WebScraping",
        endpoint: "https://www.bonbast.com/api/v2/rates",
        apiKey: "",
        apiKeyHeader: "",
        mappingPrice: "usd.sell",
        mappingHigh: "usd.high",
        mappingLow: "usd.low",
        mappingChange: "usd.change",
        mappingVolume: "usd.volume",
        isActive: false,
        targetAssetId: "USDIRT",
      },
      {
        id: "conn_4",
        name: "Mizanna Gold Iran Live Portal Feed",
        providerType: "REST",
        endpoint: "https://tgju.amirhossein.info/api/v1/live/mazaneh",
        apiKey: "",
        apiKeyHeader: "X-Mizanna-Token",
        mappingPrice: "rates.mazaneh.value",
        mappingHigh: "rates.mazaneh.high",
        mappingLow: "rates.mazaneh.low",
        mappingChange: "rates.mazaneh.change",
        mappingVolume: "rates.mazaneh.volume",
        isActive: false,
        targetAssetId: "MELTED_GOLD",
      },
      {
        id: "conn_5",
        name: "TGJU Free Dollar",
        providerType: "REST",
        endpoint: "/api/market/tgju/latest?asset=dollar_azad",
        apiKey: "",
        apiKeyHeader: "",
        mappingPrice: "value",
        mappingHigh: "",
        mappingLow: "",
        mappingChange: "",
        mappingVolume: "",
        isActive: true,
        targetAssetId: "USDIRT",
      },
      {
        id: "conn_6",
        name: "TGJU Emami Coin",
        providerType: "REST",
        endpoint: "/api/market/tgju/latest?asset=emami",
        apiKey: "",
        apiKeyHeader: "",
        mappingPrice: "value",
        mappingHigh: "",
        mappingLow: "",
        mappingChange: "",
        mappingVolume: "",
        isActive: true,
        targetAssetId: "COIN_EMAMI",
      },
    ];
  });

  const [newConnector, setNewConnector] = useState<Omit<APIConnector, "id">>({
    name: "",
    providerType: "REST",
    endpoint: "",
    apiKey: "",
    apiKeyHeader: "Authorization",
    mappingPrice: "price",
    mappingHigh: "high",
    mappingLow: "low",
    mappingChange: "change",
    mappingVolume: "volume",
    isActive: false,
    targetAssetId: "MELTED_GOLD",
  });

  const [editingConnectorId, setEditingConnectorId] = useState<string | null>(
    null,
  );

  // Testing Sandbox variables
  const [testPayload, setTestPayload] = useState<string>(
    `{\n  "status": "success",\n  "data": {\n    "price": 18450000,\n    "high": 18600000,\n    "low": 18180000,\n    "change_percent": 1.42,\n    "volume_mithqal": 14850\n  }\n}`,
  );
  const [testResult, setTestResult] = useState<{
    resolvedPrice: number;
    resolvedHigh: number | null;
    resolvedLow: number | null;
    resolvedChange: number | null;
    resolvedVolume: string | null;
  } | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Simple nested key-path JSON resolver
  const resolveJSONPath = (obj: any, path: string): any => {
    if (!path) return undefined;
    return path.split(".").reduce((acc, part) => {
      if (acc === null || acc === undefined) return undefined;
      return acc[part];
    }, obj);
  };

  const handleTestMapping = () => {
    setTestError(null);
    setTestResult(null);
    try {
      const parsedObj = JSON.parse(testPayload);
      const price = resolveJSONPath(parsedObj, newConnector.mappingPrice);
      const high = resolveJSONPath(parsedObj, newConnector.mappingHigh);
      const low = resolveJSONPath(parsedObj, newConnector.mappingLow);
      const change = resolveJSONPath(parsedObj, newConnector.mappingChange);
      const volume = resolveJSONPath(parsedObj, newConnector.mappingVolume);

      if (price === undefined) {
        throw new Error(
          `Price path "${newConnector.mappingPrice}" resolved to undefined.`,
        );
      }

      setTestResult({
        resolvedPrice: Number(price) || 0,
        resolvedHigh: high !== undefined ? Number(high) : null,
        resolvedLow: low !== undefined ? Number(low) : null,
        resolvedChange: change !== undefined ? Number(change) : null,
        resolvedVolume: volume !== undefined ? String(volume) : null,
      });
    } catch (err: any) {
      setTestError(
        err.message || "Failed to parse test JSON or resolve paths.",
      );
    }
  };

  // System status parameters
  const [fps, setFps] = useState(60.0);
  const [latency, setLatency] = useState(14);
  

  // Shamsi calendar toggle and conversion state
  const [shamsiEnabled, setShamsiEnabled] = useState<boolean>(true);
  const [persianDigitsEnabled, setPersianDigitsEnabled] =
    useState<boolean>(false);

  // Portfolio Performance Analytics overlay state
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<boolean>(false);

  // Custom manual date converter state
  const [convType, setConvType] = useState<"g2s" | "s2g">("g2s");
  const [gregInput, setGregInput] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [shamsiYear, setShamsiYear] = useState<string>("1405");
  const [shamsiMonth, setShamsiMonth] = useState<string>("4");
  const [shamsiDay, setShamsiDay] = useState<string>("10");
  const [convResult, setConvResult] = useState<string>("");

  // Live converter result calculation
  useEffect(() => {
    if (convType === "g2s") {
      if (!gregInput) {
        setConvResult("Please enter a valid Gregorian date.");
        return;
      }
      const parts = gregInput.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          // Use UTC parameters to avoid local timezone offset shifting the date
          const utcDate = new Date(Date.UTC(y, m - 1, d));
          const res = formatToShamsi(utcDate, {
            includeTime: false,
            usePersianDigits: persianDigitsEnabled,
            formatStyle: "both",
          });
          setConvResult(res);
          return;
        }
      }
      setConvResult("Invalid date components.");
    } else {
      const jy = parseInt(shamsiYear, 10);
      const jm = parseInt(shamsiMonth, 10);
      const jd = parseInt(shamsiDay, 10);
      if (isNaN(jy) || isNaN(jm) || isNaN(jd)) {
        setConvResult("Please enter valid Shamsi numeric fields.");
        return;
      }
      if (jm < 1 || jm > 12 || jd < 1 || jd > 31) {
        setConvResult("Month must be 1-12 and Day must be 1-31.");
        return;
      }
      try {
        const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
        const dateStr = `${gy}/${String(gm).padStart(2, "0")}/${String(gd).padStart(2, "0")}`;
        const d = new Date(Date.UTC(gy, gm - 1, gd));
        const weekday = d.toLocaleDateString("en-US", {
          weekday: "long",
          timeZone: "UTC",
        });
        setConvResult(`${dateStr} (${weekday})`);
      } catch (err) {
        setConvResult("Error converting Shamsi date.");
      }
    }
  }, [
    convType,
    gregInput,
    shamsiYear,
    shamsiMonth,
    shamsiDay,
    persianDigitsEnabled,
  ]);

  // Handle Cross-Tab Session Sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "gold_terminal_auth") {
        if (!e.newValue) {
          window.location.reload();
        } else {
          try {
            setUser(JSON.parse(decryptData(e.newValue)));
          } catch (err) {
            try {
              setUser(JSON.parse(e.newValue));
            } catch (err2) {
              window.location.reload();
            }
          }
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // --- INITIALIZATION ---
  useEffect(() => {
    // Generate base datasets
    const baseHistorical: Record<AssetId, Candle[]> = {
      MELTED_GOLD: generateHistoricalCandles("MELTED_GOLD", 110),
      GOLD_18K: generateHistoricalCandles("GOLD_18K", 110),
      GOLD_24K: generateHistoricalCandles("GOLD_24K", 110),
      MESGHAL: generateHistoricalCandles("MESGHAL", 110),
      COIN_EMAMI: generateHistoricalCandles("COIN_EMAMI", 110),
      COIN_HALF: generateHistoricalCandles("COIN_HALF", 110),
      COIN_QUARTER: generateHistoricalCandles("COIN_QUARTER", 110),
      GOLD_GRAM: generateHistoricalCandles("GOLD_GRAM", 110),
      USDIRT: generateHistoricalCandles("USDIRT", 110),
      USDTIRT: generateHistoricalCandles("USDTIRT", 110),
      XAUUSD: generateHistoricalCandles("XAUUSD", 110),
      GOLD_FUTURES: generateHistoricalCandles("GOLD_FUTURES", 110),
      GOLD_CFD: generateHistoricalCandles("GOLD_CFD", 110),
      GOLD_ETF: generateHistoricalCandles("GOLD_ETF", 110),
    };
    setHistoricalData(baseHistorical);

    // Initial asset array setup
    const initialAssets = generateLiveAssets(prices);
    setAssets(initialAssets);

    // Default trade setup entry price to matching active asset
    const activeMeta = ASSETS_METADATA[activeAssetId];
    const initialPrice = prices[activeAssetId];
    setPositionInput((prev) => ({
      ...prev,
      entryPrice: initialPrice,
      stopLoss: parseFloat((initialPrice * 0.99).toFixed(activeMeta.decimals)),
      takeProfit: parseFloat(
        (initialPrice * 1.025).toFixed(activeMeta.decimals),
      ),
    }));

    


    return () => {
            
    };
  }, []);

  // Sync pricing updates on assets
  useEffect(() => {
    const updated = generateLiveAssets(prices).map((asset) => {
      let conn = connectors.find(
        (c) => c.targetAssetId === asset.id && c.isActive,
      );

      // Special: map GOLD_18K to use MELTED_GOLD's Telegram scraper info if direct connector isn't set up
      if (!conn && asset.id === "GOLD_18K") {
        conn = connectors.find(
          (c) =>
            c.targetAssetId === "MELTED_GOLD" &&
            c.providerType === "TelegramScraper" &&
            c.isActive,
        );
      }

      if (conn) {
        const hasError =
          connectorErrors[conn.targetAssetId] ||
          (asset.id === "GOLD_18K" && connectorErrors["MELTED_GOLD"]);
        if (hasError) {
          return {
            ...asset,
            provider: "خطا در بروزرسانی (داده لحظه‌ای در دسترس نیست)",
          };
        }
        return { ...asset, provider: conn.name };
      }
      return asset;
    });
    setAssets(updated);

    // Recalculate indicators for the active asset when prices change
    const activeCandles = historicalData[activeAssetId];
    if (activeCandles && activeCandles.length > 0) {
      // Append current live price as latest candle's close
      const candlesCopy = [...activeCandles];
      const lastIdx = candlesCopy.length - 1;
      candlesCopy[lastIdx] = {
        ...candlesCopy[lastIdx],
        close: prices[activeAssetId],
        high: Math.max(candlesCopy[lastIdx].high, prices[activeAssetId]),
        low: Math.min(candlesCopy[lastIdx].low, prices[activeAssetId]),
      };

      const signals = analyzeTechnicalIndicators(candlesCopy);
      const structure = computeMarketStructure(activeAssetId, candlesCopy);
      setTechnicalSignals(signals);
      setMarketStructure(structure);
    }
  }, [prices, activeAssetId, historicalData, connectors, connectorErrors]);

  const connectorBackoff = useRef<
    Record<string, { attempts: number; nextFetchTime: number }>
  >({});

  // Real-time Tick Streaming & Connector Fetching
  useEffect(() => {
    // We will poll active connectors
    const fetchConnectors = async () => {
      const activeConnectors = connectors.filter((c) => c.isActive);
      const now = Date.now();

      for (const conn of activeConnectors) {
        const tracker = connectorBackoff.current[conn.id] || {
          attempts: 0,
          nextFetchTime: 0,
        };

        // Skip if we are still within the backoff period
        if (now < tracker.nextFetchTime) {
          continue;
        }

        try {
          const url =
            conn.providerType === "TelegramScraper"
              ? "/api/market/abshdh"
              : conn.endpoint;
          const headers: Record<string, string> = {};
          if (conn.apiKey && conn.apiKeyHeader) {
            headers[conn.apiKeyHeader] = conn.apiKey;
          }

          const res = await fetch(url, { headers }).catch(() => null);
          if (!res) throw new Error("Fetch returned null or undefined response");
          if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
          
          let json;
          try {
            const rawText = await res.text();
            if (!rawText) throw new Error("Empty response body");
            try {
              json = JSON.parse(rawText);
            } catch (pErr) {
              // Try regex if JSON fails
              const match = rawText.match(/([\d.,]+)/);
              if (match) {
                json = { value: parseFloat(match[1].replace(/,/g, '')) };
              } else {
                throw pErr;
              }
            }
          } catch (jsonErr) {
            throw new Error(`Data parsing failed: ${jsonErr instanceof Error ? jsonErr.message : String(jsonErr)}`);
          }

          if (
            conn.providerType === "TelegramScraper" &&
            json &&
            (json.success || json.data)
          ) {
            const data = json.data || json;
            const mGold = data.MELTED_GOLD;
            const g18k = data.GOLD_18K;

            if (mGold && typeof mGold === "number" && !isNaN(mGold)) {
              connectorBackoff.current[conn.id] = {
                attempts: 0,
                nextFetchTime: 0,
              };
              setConnectorErrors((prev) => ({
                ...prev,
                MELTED_GOLD: "",
                GOLD_18K: "",
              }));
              
              const normalizedMelted = validateAndNormalizePrice("MELTED_GOLD", mGold, "IRR", "Connector").canonicalValue;

              setPrices((prev) => {
                const finalGramPrice =
                  g18k && typeof g18k === "number" && !isNaN(g18k)
                    ? validateAndNormalizePrice("GOLD_18K", g18k, "IRR", "Connector").canonicalValue
                    : Math.floor(normalizedMelted / 4.3318);
                const updated = {
                  ...prev,
                  MELTED_GOLD: normalizedMelted,
                  GOLD_18K: finalGramPrice,
                };
                localStorage.setItem(
                  `gold_terminal_last_price_MELTED_GOLD`,
                  normalizedMelted.toString(),
                );
                localStorage.setItem(
                  `gold_terminal_last_price_GOLD_18K`,
                  finalGramPrice.toString(),
                );
                return updated;
              });
            }
          } else {
            let price = json;
            if (conn.mappingPrice) {
              const parts = conn.mappingPrice.split(".");
              for (const p of parts) {
                if (price && typeof price === "object") price = price[p];
              }
            }

            if (typeof price === "number" && !isNaN(price)) {
              const normalizedPrice = validateAndNormalizePrice(conn.targetAssetId, price, "IRR", "Connector").canonicalValue;
              
              // Success: reset backoff tracker
              connectorBackoff.current[conn.id] = {
                attempts: 0,
                nextFetchTime: 0,
              };

              setConnectorErrors((prev) => ({
                ...prev,
                [conn.targetAssetId]: "",
              }));
              setPrices((prev) => {
                const updated = { ...prev, [conn.targetAssetId]: normalizedPrice };
                // Cache it to local storage to prevent starting at 0
                localStorage.setItem(
                  `gold_terminal_last_price_${conn.targetAssetId}`,
                  normalizedPrice.toString(),
                );
                return updated;
              });
            }
          }
        } catch (err) {
          console.warn("Connector fetch error:", err);

          // Apply exponential backoff
          tracker.attempts += 1;
          // Base polling is 10s. For errors, we exponentially backoff up to 2 minutes
          // Delays: attempt 1 -> 15s, attempt 2 -> 22.5s, attempt 3 -> 33.7s, etc.
          const delayMs = Math.min(
            120000,
            10000 * Math.pow(1.5, tracker.attempts),
          );
          tracker.nextFetchTime = now + delayMs;
          connectorBackoff.current[conn.id] = tracker;

          setConnectorErrors((prev) => ({
            ...prev,
            [conn.targetAssetId]: "خطا در اتصال",
          }));
        }
      }
    };

    // Initial fetch
    fetchConnectors();
    // Poll every 10 seconds
    const fetchInterval = setInterval(fetchConnectors, 10000);

    const fetchLiveSources = async () => {
      try {
        const [abshdhRes, xauusdRes, usdIrtRes, emamiRes, tetherRes, gold24kRes, halfCoinRes, quarterCoinRes] = await Promise.all([
          fetch('/api/market/abshdh').catch(() => null),
          fetch('/api/market/tgju/latest?asset=xauusd').catch(() => null),
          fetch('/api/market/tgju/latest?asset=dollar_azad').catch(() => null),
          fetch('/api/market/tgju/latest?asset=emami').catch(() => null),
          fetch('/api/market/tgju/latest?asset=tether').catch(() => null),
          fetch('/api/market/tgju/latest?asset=gold_24k').catch(() => null),
          fetch('/api/market/tgju/latest?asset=nim_sekeh').catch(() => null),
          fetch('/api/market/tgju/latest?asset=rob_sekeh').catch(() => null)
        ]);

        if (abshdhRes && abshdhRes.ok) {
          try {
            const abshdhJson = await abshdhRes.json();
            if (abshdhJson && abshdhJson.data) {
               setPrices(prev => {
                  const next = { ...prev };
                  const data = abshdhJson.data;
                  
                  const hasCustomMelted = connectors.find(c => c.isActive && c.targetAssetId === 'MELTED_GOLD');
                  if (!hasCustomMelted && data.MELTED_GOLD) {
                     try {
                        const normalized = validateAndNormalizePrice('MELTED_GOLD', data.MELTED_GOLD, 'IRR', 'Telegram @abshdh');
                        if (normalized && normalized.validationStatus === 'valid') {
                           setSourceTimestamps(ts => ({...ts, ['MELTED_GOLD']: abshdhJson.timestamp || Date.now()}));
                           next['MELTED_GOLD'] = normalized.canonicalValue;
                        }
                     } catch (e) {
                        console.warn("Validation failed for MELTED_GOLD from abshdh", e);
                     }
                  }
                  
                  const hasCustom18k = connectors.find(c => c.isActive && c.targetAssetId === 'GOLD_18K');
                  if (!hasCustom18k && data.GOLD_18K) {
                     try {
                        const normalized = validateAndNormalizePrice('GOLD_18K', data.GOLD_18K, 'IRR', 'Telegram @abshdh');
                        if (normalized && normalized.validationStatus === 'valid') {
                           setSourceTimestamps(ts => ({...ts, ['GOLD_18K']: abshdhJson.timestamp || Date.now()}));
                           next['GOLD_18K'] = normalized.canonicalValue;
                        }
                     } catch (e) {
                        console.warn("Validation failed for GOLD_18K from abshdh", e);
                     }
                  }
                  return next;
               });
            }
          } catch (jsonErr) {
            console.error("Error parsing abshdh JSON in fetchLiveSources:", jsonErr);
          }
        }

        const handleTgju = async (res: Response | null, assetId: AssetId) => {
            if (res && res.ok) {
                try {
                    const json = await res.json();
                    if (json && json.value !== undefined && json.value !== null) {
                        setPrices(prev => {
                            try {
                                const hasCustom = connectors.find(c => c.isActive && c.targetAssetId === assetId);
                                if (!hasCustom) {
                                    const unit = assetId === 'XAUUSD' ? 'USD' : 'IRR';
                                    const normalized = validateAndNormalizePrice(assetId, json.value, unit, 'TGJU');
                                    if (normalized && normalized.validationStatus === 'valid') {
                                        setSourceTimestamps(ts => ({...ts, [assetId]: json.fetchedAt || Date.now()}));
                                        return { ...prev, [assetId]: normalized.canonicalValue };
                                    }
                                }
                            } catch (innerErr) {
                                console.warn(`Error updating price for ${assetId}:`, innerErr);
                            }
                            return prev;
                        });
                    }
                } catch (jsonErr) {
                    console.error(`Error parsing TGJU JSON for ${assetId}:`, jsonErr);
                }
            }
        };

        await handleTgju(xauusdRes, 'XAUUSD');
        await handleTgju(usdIrtRes, 'USDIRT');
        await handleTgju(emamiRes, 'COIN_EMAMI');
        await handleTgju(tetherRes, 'USDTIRT');
        await handleTgju(gold24kRes, 'GOLD_24K');
        await handleTgju(halfCoinRes, 'COIN_HALF');
        await handleTgju(quarterCoinRes, 'COIN_QUARTER');
        
        const mesghalRes = await fetch('/api/market/tgju/latest?asset=mesghal').catch(() => null);
        await handleTgju(mesghalRes, 'MESGHAL');

      } catch (err) {
        console.warn("Live source fetch error:", err);
      }
    };

    fetchLiveSources();
    const liveInterval = setInterval(fetchLiveSources, 60000);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(liveInterval);
    };
  }, [connectors]);

  const pricesRef = useRef(prices);
  useEffect(() => {
    pricesRef.current = prices;
  }, [prices]);

  // Data Quality Polling
  useEffect(() => {
    const fetchQuality = async () => {
      const keysToCheck = ["MELTED_GOLD", "GOLD_18K", "USDIRT", "USDTIRT", "COIN_EMAMI", "XAUUSD"];
      const newQuality: Record<string, DataQualityResult> = {};
      
      for (const key of keysToCheck) {
        const currentPrice = pricesRef.current[key as AssetId];
        if (currentPrice) {
          const result = await checkDataQuality(key, currentPrice);
          newQuality[key] = result;
        }
      }
      setDataQuality(newQuality);
    };

    fetchQuality();
    const interval = setInterval(fetchQuality, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Monitor prices for alerts
  useEffect(() => {
    alerts.forEach((alert) => {
      if (!alert.enabled) return;

      const currentPrice = prices[alert.assetId];
      if (!currentPrice) return;

      let triggered = false;
      if (alert.condition === "above" && currentPrice >= alert.value) {
        triggered = true;
      } else if (alert.condition === "below" && currentPrice <= alert.value) {
        triggered = true;
      }

      if (triggered) {
        // Find asset info
        const meta = ASSETS_METADATA[alert.assetId];
        const assetName = meta ? meta.persianName : alert.assetId;
        const conditionText =
          alert.condition === "above" ? "بالاتر از" : "پایین‌تر از";

        // Trigger browser notification
        if (
          alert.channel === "browser" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification("هشدار سیستم هوشمند معاملاتی", {
            body: `قیمت ${assetName} ${conditionText} ${alert.value.toLocaleString()} قرار گرفت. قیمت فعلی: ${currentPrice.toLocaleString()}`,
            icon: "/favicon.ico",
          });
        }

        // Disable the alert after it's triggered
        setAlerts((prev) =>
          prev.map((a) => (a.id === alert.id ? { ...a, enabled: false } : a)),
        );
      }
    });
  }, [prices, alerts]); // Re-run whenever prices or alerts change

  // Save changes to localStorage helper
  const saveLocalStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // --- ACTIONS ---
  const handleAssetSwitch = (id: AssetId) => {
    setActiveAssetId(id);
    const activePrice = prices[id] || 0;
    const activeMeta = ASSETS_METADATA[id] || { decimals: 0 };

    setPositionInput({
      type: "buy",
      entryPrice: activePrice,
      stopLoss: parseFloat((activePrice * 0.99).toFixed(activeMeta.decimals)),
      takeProfit: parseFloat((activePrice * 1.02).toFixed(activeMeta.decimals)),
      quantity: id === "MELTED_GOLD" ? 5 : 10,
    });
  };

  // Trigger Comprehensive AI analysis forecast
  const handleAIAnalysisTrigger = async () => {
    setIsAnalyzing(true);
    setAiAnalysisError(null);

    const activeCandles = historicalData[activeAssetId];
    if (!activeCandles) {
      setIsAnalyzing(false);
      return;
    }

    try {
      // Validate data before passing to AI
      const currentPrice = prices[activeAssetId];
      const validatedData = validateAndNormalizePrice(activeAssetId, currentPrice, "IRR", "Live Feed");
      
      if (validatedData.validationStatus !== "valid") {
        setAiAnalysisError("خطا در اعتبار‌سنجی داده‌های بازار. لطفاً از درستی قیمت‌ها اطمینان حاصل کنید. از ارسال داده‌های نامعتبر به هوش مصنوعی جلوگیری شد.");
        setIsAnalyzing(false);
        return;
      }

      let customRulesEvaluated: any[] = [];
      const savedRulesStr = localStorage.getItem(
        "gold_terminal_strategy_rules",
      );
      if (savedRulesStr) {
        try {
          const parsedRules = JSON.parse(savedRulesStr) as StrategyRule[];
          customRulesEvaluated = parsedRules.map((rule) => {
            const evalResult = evaluateStrategyRule(
              rule,
              activeCandles,
              prices[activeAssetId] || 0,
            );
            return {
              ...rule,
              isTriggered: evalResult.isTriggered,
              val1: evalResult.val1,
              val2: evalResult.val2,
            };
          });
        } catch (err) {
          console.error(
            "Error reading strategy rules for AI prompt context",
            err,
          );
        }
      }

      const response = await triggerAIAnalysis(
        activeAssetId,
        activeCandles,
        aiConfig,
        customRulesEvaluated,
        injectTelegramPrice ? validateAndNormalizePrice("MELTED_GOLD", prices["MELTED_GOLD"], "IRR", "Live Feed").canonicalValue : undefined,
      );
      setAiAnalysis(response);
    } catch (e: any) {
      console.error(e);
      setAiAnalysisError(e.message || "خطا در برقراری ارتباط با هوش مصنوعی.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run AI analysis on tab mounting
  useEffect(() => {
    if (activeTab === "ai" && !aiAnalysis && !isAnalyzing) {
      handleAIAnalysisTrigger();
    }
  }, [activeTab, activeAssetId]);

  // Place Simulation Contract Trade
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const meta = ASSETS_METADATA[activeAssetId];

    const newPosition: PortfolioPosition = {
      id: "pos_" + Date.now(),
      assetId: activeAssetId,
      type: positionInput.type,
      entryPrice: positionInput.entryPrice,
      quantity: positionInput.quantity,
      leverage,
      stopLoss: positionInput.stopLoss,
      takeProfit: positionInput.takeProfit,
      pnl: 0,
      pnlPercent: 0,
      timestamp: new Date().toISOString(),
    };

    const updated = [newPosition, ...positions];
    setPositions(updated);
    saveLocalStorage("simulated_positions", updated);

    // Reset quantity
    setPositionInput((prev) => ({
      ...prev,
      quantity: activeAssetId === "MELTED_GOLD" ? 5 : 10,
    }));
  };

  // Remove simulated position
  const handleClosePosition = (id: string) => {
    const updated = positions.filter((p) => p.id !== id);
    setPositions(updated);
    saveLocalStorage("simulated_positions", updated);
  };

  // Journal entry trigger
  const handleAddJournal = (e: React.FormEvent) => {
    e.preventDefault();
    const entryPriceNum =
      parseFloat(newJournalEntry.entryPrice) || prices[activeAssetId];
    const exitPriceNum =
      parseFloat(newJournalEntry.exitPrice) || prices[activeAssetId] * 1.01;
    const quantityNum = parseFloat(newJournalEntry.quantity) || 1;

    // Simple PNL math
    const multiplier = positionInput.type === "buy" ? 1 : -1;
    const isMelted = activeAssetId === "MELTED_GOLD";
    const delta = (exitPriceNum - entryPriceNum) * multiplier;
    const pnl = isMelted ? delta * quantityNum : delta * quantityNum * 100; // Contract sizes

    const newEntry: TradeJournalEntry = {
      id: "j_" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      assetId: activeAssetId,
      type: positionInput.type,
      entryPrice: entryPriceNum,
      exitPrice: exitPriceNum,
      quantity: quantityNum,
      pnl,
      duration: "Intraday (Terminal System)",
      notes:
        newJournalEntry.notes ||
        "Executed via institutional manual terminal interface.",
      confidenceScore: newJournalEntry.confidence,
    };

    const updated = [newEntry, ...journalEntries];
    setJournalEntries(updated);
    saveLocalStorage("trade_journal", updated);
    setNewJournalEntry({
      notes: "",
      entryPrice: "",
      exitPrice: "",
      quantity: "",
      confidence: 85,
    });
  };

  // Save AI Config modifications
  const handleSaveAIConfig = (newCfg: AIProviderConfig) => {
    setAiConfig(newCfg);
    saveLocalStorage("ai_config_terminal", newCfg);
  };

  const activeAssetInfo =
    assets.find((a) => a.id === activeAssetId) || assets[0];


  const assetsMeta = Object.entries(ASSETS_METADATA).map(([id, val]) => ({
    id: id as AssetId,
    ...val,
  }));

  const assetStats = assets.reduce((acc, asset) => {
    acc[asset.id] = {
      changePercent: asset.change,
      high24h: asset.high24h,
      low24h: asset.low24h,
      volume24h: asset.volume24h,
    };
    return acc;
  }, {} as Record<AssetId, { changePercent: number; high24h: number; low24h: number; volume24h: string }>);

  return (
    <div
      className={`min-h-screen ${theme === "light" ? "light-mode" : "dark"} bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col font-sans selection:bg-[var(--accent-gold-soft)] selection:text-[var(--accent-gold)] transition-colors duration-700`}
    >
      {/* CORE LAYOUT CHAMBER */}
      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        {/* SIDE NAV-BAR */}
        <aside className="w-full lg:w-72 bg-[var(--bg-panel)] backdrop-blur-2xl border-b lg:border-b-0 lg:border-l border-[var(--border-subtle)] shrink-0 flex flex-col justify-between p-6 gap-6 z-20 overflow-y-auto custom-scrollbar transition-all duration-700">
          <div className="space-y-8">
            {/* TERMINAL HEADER BRAND */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#C5A059] to-[#d4af37] shadow-[0_0_20px_rgba(197,160,89,0.3)] lux-breathe flex items-center justify-center shadow-[0_4px_16px_rgba(212,175,55,0.25)] transition-transform duration-500 hover:scale-105">
                  <Layers className="h-5 w-5 text-[#1c1c1e] font-extrabold" />
                </div>
                <div>
                  <h1 className="font-display font-semibold text-lg lux-gradient-text tracking-wide">
                    ترمینال هوشمند طلا
                  </h1>
                  <p className="text-[10px] text-[var(--text-secondary)] font-sans font-medium tracking-widest mt-0.5">
                    ترمینال معاملاتی کوانت
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--accent-gold)] transition-all duration-300 active:scale-95"
                title={
                  theme === "dark"
                    ? "تغییر به قالب روشن"
                    : "تغییر به قالب تاریک"
                }
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* WATCHLIST QUICK CARDS */}
            <div className="space-y-3 text-right mt-8">
              <span className="text-[10px] font-sans text-[var(--text-secondary)] px-2 tracking-widest uppercase font-semibold">
                دیده‌بان بازار
              </span>
              <div className="grid grid-cols-1 gap-2">
                {assets.map((as) => (
                  <button
                    key={as.id}
                    onClick={() => handleAssetSwitch(as.id)}
                    className={`w-full text-right px-4 py-3 rounded-xl transition-all duration-500 flex flex-row justify-between items-center group ${
                      activeAssetId === as.id
                        ? "bg-[var(--accent-gold-soft)] border border-[var(--border-subtle)] text-[var(--text-primary)] shadow-[0_4px_24px_-8px_rgba(212,175,55,0.2)]"
                        : "hover:bg-[var(--bg-panel-heavy)] border border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-subtle)]"
                    }`}
                  >
                    <div className="text-right">
                      <p
                        className={`text-xs font-semibold font-sans transition-colors duration-300 ${activeAssetId === as.id ? "text-[var(--accent-gold)]" : ""}`}
                      >
                        {as.persianName}
                      </p>
                      <p className="text-[10px] data-value text-[11px] opacity-60 mt-1">
                        {as.symbol} • {as.provider.split(" ")[0]}
                      </p>
                    </div>
                    <div className="text-left data-value text-[11px]">
                      <p
                        className={`text-xs data-value text-[11px] font-medium transition-colors duration-300 ${activeAssetId === as.id ? (as.change >= 0 ? "text-[var(--accent-emerald)]" : "text-[var(--accent-crimson)]") : ""}`}
                      >
                        {as.currentPrice.toLocaleString(undefined, {
                          maximumFractionDigits:
                            ASSETS_METADATA[as.id].decimals,
                        })}
                      </p>
                      <p
                        className={`text-[10px] data-value text-[11px] mt-0.5 text-right ${as.change >= 0 ? "text-[var(--accent-emerald)]" : "text-[var(--accent-crimson)]"}`}
                      >
                        {as.change >= 0 ? "+" : ""}
                        {as.change}%
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* DYNAMIC SYSTEM MENU TABS */}
            <nav className="space-y-6 text-right">
              {/* Group 1 */}
              <div className="space-y-1">
                <span className="text-[10px] font-sans text-[var(--text-secondary)] px-3 tracking-widest mb-2 block font-semibold uppercase">
                  رصد بازار
                </span>
                <button
                  onClick={() => setActiveTab("markets")}
                  className={`w-full flex flex-row items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                    activeTab === "markets"
                      ? "bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] font-bold shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-heavy)]"
                  }`}
                >
                  <div className="flex flex-row items-center gap-3">
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                    <span className="font-sans">داشبورد بازارها</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("terminal")}
                  className={`w-full flex flex-row items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                    activeTab === "terminal"
                      ? "bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] font-bold shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-heavy)]"
                  }`}
                >
                  <div className="flex flex-row items-center gap-3">
                    <TrendingUp className="h-4 w-4 shrink-0" />
                    <span className="font-sans">چارت ترمینال طلا</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("market_wall")}
                  className={`w-full flex flex-row items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                    activeTab === "market_wall"
                      ? "bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] font-bold shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-heavy)]"
                  }`}
                >
                  <div className="flex flex-row items-center gap-3">
                    <Activity className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span className="font-sans font-black">دیوار زنده منابع بازار</span>
                  </div>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold animate-pulse">
                    زنده
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("hunter")}
                  className={`w-full flex flex-row items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                    activeTab === "hunter"
                      ? "bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] font-bold shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-heavy)]"
                  }`}
                >
                  <div className="flex flex-row items-center gap-3">
                    <Crosshair className="h-4 w-4 shrink-0 text-[#D4AF37]" />
                    <span className="font-sans font-black text-[#D4AF37]">اتاق شکار مظنه</span>
                  </div>
                  <span className="text-[9px] bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 px-1.5 py-0.5 rounded font-bold animate-pulse">
                    PRO
                  </span>
                </button>
              </div>

              {/* Group 2 */}
              <div className="space-y-1">
                <span className="text-[10px] font-sans text-[var(--text-secondary)] px-3 tracking-widest mb-2 mt-4 block font-semibold uppercase">
                  هوش مصنوعی و معاملات
                </span>
                <button
                  onClick={() => setActiveTab("replay")}
                  className={`w-full flex flex-row items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                    activeTab === "replay"
                      ? "bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] font-bold shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-heavy)]"
                  }`}
                >
                  <div className="flex flex-row items-center gap-3">
                    <History className="h-4 w-4 shrink-0" />
                    <span className="font-sans">شبیه‌ساز و مربی معاملات</span>
                  </div>
                  <span className="text-[9px] bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] border border-[var(--accent-gold)]/20 px-1.5 py-0.5 rounded font-bold data-value text-[11px] animate-pulse">
                    جدید
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("mazaneh_forecast")}
                  className={`w-full flex flex-row items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                    activeTab === "mazaneh_forecast"
                      ? "bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] font-bold shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-heavy)]"
                  }`}
                >
                  <div className="flex flex-row items-center gap-3">
                    <BarChart2 className="h-4 w-4 shrink-0 text-indigo-400" />
                    <span className="font-sans">پیش‌بینی مظنه آبشده</span>
                  </div>
                  <span className="text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded font-bold data-value text-[11px]">
                    جدید
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("forecast")}
                  className={`w-full flex flex-row items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                    activeTab === "forecast"
                      ? "bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] font-bold shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-heavy)]"
                  }`}
                >
                  <div className="flex flex-row items-center gap-3">
                    <BrainCircuit className="h-4 w-4 shrink-0 text-amber-500" />
                    <span className="font-sans">میز تصمیم‌گیری و پیش‌بینی</span>
                  </div>
                  <span className="text-[9px] bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] border border-[var(--accent-gold)]/20 px-1.5 py-0.5 rounded font-bold data-value text-[11px]">
                    ویژه
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("ai")}
                  className={`w-full flex flex-row items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                    activeTab === "ai"
                      ? "bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] font-bold shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-heavy)]"
                  }`}
                >
                  <div className="flex flex-row items-center gap-3">
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span className="font-sans">تحلیل هوش مصنوعی</span>
                  </div>
                  <span className="text-[9px] bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] border border-[var(--accent-gold)]/20 px-1.5 py-0.5 rounded font-bold data-value text-[11px]">
                    زنده
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("portfolio")}
                  className={`w-full flex flex-row items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                    activeTab === "portfolio"
                      ? "bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] font-bold shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-heavy)]"
                  }`}
                >
                  <div className="flex flex-row items-center gap-3">
                    <Briefcase className="h-4 w-4 shrink-0" />
                    <span className="font-sans">سبد معاملاتی من</span>
                  </div>
                  {positions.length > 0 && (
                    <span className="text-[9px] bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)] data-value text-[11px] px-1.5 py-0.5 rounded-full font-bold">
                      {positions.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("journal")}
                  className={`w-full flex flex-row items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                    activeTab === "journal"
                      ? "bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] font-bold shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-heavy)]"
                  }`}
                >
                  <div className="flex flex-row items-center gap-3">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="font-sans">دفترچه یادداشت معاملات</span>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setActiveTab("alerts")}
                className={`w-full flex flex-row items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                  activeTab === "alerts"
                    ? "bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] font-bold shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-heavy)]"
                }`}
              >
                <div className="flex flex-row items-center gap-3">
                  <BellRing className="h-4 w-4 shrink-0" />
                  <span className="font-sans">موتور هشدارها (Alerts)</span>
                </div>
              </button>

              {/* Group 3 */}
              <div className="space-y-1">
                <span className="text-[10px] font-sans text-[var(--text-secondary)] px-3 tracking-widest mb-2 mt-4 block font-semibold uppercase">
                  ابزارهای تحلیلی
                </span>
                <button
                  onClick={() => setActiveTab("news")}
                  className={`w-full flex flex-row items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                    activeTab === "news"
                      ? "bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] font-bold shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-heavy)]"
                  }`}
                >
                  <div className="flex flex-row items-center gap-3">
                    <Newspaper className="h-4 w-4 shrink-0" />
                    <span className="font-sans">اخبار و احساسات بازار</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("calendar")}
                  className={`w-full flex flex-row items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                    activeTab === "calendar"
                      ? "bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] font-bold shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-heavy)]"
                  }`}
                >
                  <div className="flex flex-row items-center gap-3">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span className="font-sans">تقویم اقتصادی</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("alerts")}
                  className={`w-full flex flex-row items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                    activeTab === "alerts"
                      ? "bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] font-bold shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-heavy)]"
                  }`}
                >
                  <div className="flex flex-row items-center gap-3">
                    <Bell className="h-4 w-4 shrink-0" />
                    <span className="font-sans">سیستم هشدار قیمت</span>
                  </div>
                  {alerts.filter((a) => a.enabled).length > 0 && (
                    <span className="text-[9px] bg-[var(--accent-crimson)]/10 text-[var(--accent-crimson)] data-value text-[11px] px-1.5 py-0.5 rounded-full font-bold">
                      {alerts.filter((a) => a.enabled).length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("connectors")}
                  className={`w-full flex flex-row items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                    activeTab === "connectors"
                      ? "bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] font-bold shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-heavy)]"
                  }`}
                >
                  <div className="flex flex-row items-center gap-3">
                    <Sliders className="h-4 w-4 shrink-0" />
                    <span className="font-sans">اتصال‌دهنده‌های داده</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("data_truth")}
                  className={`w-full flex flex-row items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                    activeTab === "data_truth"
                      ? "bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] font-bold shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-heavy)]"
                  }`}
                >
                  <div className="flex flex-row items-center gap-3">
                    <Database className="h-4 w-4 shrink-0" />
                    <span className="font-sans">مرکز حقیقت داده و منابع</span>
                  </div>
                </button>

              </div>
            </nav>
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
              <div className="space-y-8 animate-fade-in">
                {/* ABOVE-THE-FOLD MAJESTIC SWISS-WATCH ENTRANCE HEADER */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center border-b border-[var(--border-subtle)] pb-6 mb-2">
                  {/* Right Column: Institutional Greeting */}
                  <div className="flex items-center gap-4 text-right">
                    <div className="h-12 w-12 rounded-2xl bg-[var(--bg-panel-heavy)] border border-[var(--accent-gold)]/20 flex items-center justify-center text-[var(--accent-gold)] relative shadow-inner">
                      <Cpu className="h-5 w-5" />
                      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[var(--bg-base)] animate-pulse" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-lg text-white leading-tight">اتاق معاملاتی آوروم پرو</h2>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <p className="text-[10px] text-[var(--text-secondary)] font-sans tracking-widest font-semibold uppercase">
                          AURUM PLATINUM MEMBER PORTAL
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Active Heartbeat & Market Sentinel */}
                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[var(--bg-panel-heavy)]/40 border border-[var(--border-subtle)]/40 text-center gap-1">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400 font-sans tracking-wide uppercase">همگرایی خودکار مظنه با اونس جهانی</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans max-w-sm">
                      «مظنه بازار طلا بر اساس تلاقی هوشمند نرخ صنف تهران و اونس جهانی در هماهنگی کامل قرار دارد.»
                    </p>
                  </div>

                  {/* Left Column: Swiss-Watch Shamsi Clock & Date */}
                  <div className="flex flex-row items-center justify-end gap-4 text-left">
                    <LiveClock />
                    <div className="h-10 w-px bg-gradient-to-b from-transparent via-[var(--border-subtle)] to-transparent" />
                    <div className="text-right">
                      <span className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] font-mono block">سیستم مرکزی</span>
                      <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5 block">همگام‌سازی فعال</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
                  {/* ARBITRAGE CARD - LUXURIOUS & PRECISE */}
                  <div className="glass-panel lux-card rounded-2xl p-6 flex flex-row items-center justify-between col-span-1 md:col-span-3 relative overflow-hidden group">
                    <div className="space-y-3 z-10 w-full">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[10px] font-sans bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] border border-[var(--accent-gold)]/20 px-3 py-1 rounded-full uppercase tracking-widest font-semibold inline-block shadow-sm">
                          شاخص اختلاف قیمت تهران و بازار جهانی
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                          <Activity className="w-3.5 h-3.5" />
                          <span>بازار دارای آربیتراژ مثبت خفیف است</span>
                        </div>
                      </div>
                      <h3 className="font-display font-semibold text-xl lux-gradient-text tracking-wide">
                        محاسبه آربیتراژ داخلی طلا
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] max-w-3xl leading-loose font-sans">
                        قیمت طلای آب‌شده داخلی به صورت روزانه بر اساس نرخ ارز
                        بازار تهران و انس جهانی طلا محاسبه می‌شود. در حال حاضر
                        قیمت انس جهانی در سطح{" "}
                        <strong className="data-value text-[11px] text-[var(--text-primary)]">
                          ${prices.XAUUSD.toLocaleString()}
                        </strong>{" "}
                        با نرخ دلار بازار تطبیق یافته و حباب ضمنی طلا در بازار
                        تهران در حال رصد است.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <VolatilityDistribution />
                  <CorrelationMatrix />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {assetsMeta.map((meta) => {
                    const as = assetStats[meta.id];
                    const isPrimary = ["GOLD_18K", "USDIRT", "USDTIRT", "COIN_EMAMI"].includes(meta.id);
                    
                    if (meta.id === "MELTED_GOLD") {
                      return (
                        <div
                          key={meta.id}
                          className={`glass-panel rounded-3xl p-6 md:p-8 border cursor-pointer transition-all duration-500 col-span-1 md:col-span-2 xl:col-span-4 relative overflow-hidden group ${
                            activeAssetId === meta.id
                              ? "border-[var(--accent-gold)] bg-gradient-to-br from-[var(--bg-panel-heavy)] to-[var(--bg-panel)] shadow-[0_0_40px_rgba(212,175,55,0.08)] ring-1 ring-[var(--accent-gold)]/30"
                              : "border-[var(--border-subtle)] hover:border-[var(--accent-gold)]/20 hover:bg-[var(--bg-panel-heavy)]"
                          }`}
                          onClick={() => setActiveAssetId(meta.id)}
                        >
                          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[var(--accent-gold)]/2 rounded-full blur-[120px] pointer-events-none group-hover:bg-[var(--accent-gold)]/4 transition-colors duration-700" />
                          
                          <div className="relative z-10 flex flex-col md:flex-row justify-between items-stretch gap-6 h-full">
                            <div className="flex flex-col justify-between items-start text-right md:w-1/2">
                              <div>
                                <div className="flex items-center gap-3 mb-3">
                                  <span className="text-[10px] text-[var(--accent-gold)] font-mono uppercase tracking-widest font-extrabold bg-[var(--accent-gold-soft)] border border-[var(--accent-gold)]/20 px-2.5 py-1 rounded-full shadow-sm">
                                    {meta.symbol}
                                  </span>
                                  {dataQuality[meta.id] && (
                                    <span className={`text-[10px] font-sans px-2.5 py-1 rounded-full font-bold border ${
                                      dataQuality[meta.id].status === "تأیید متقابل"
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    }`}>
                                      {dataQuality[meta.id].status}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-emerald-400 font-sans font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    تأیید حباب صنف
                                  </span>
                                </div>
                                <h3 className="font-display font-black text-white text-2xl md:text-3xl tracking-tight mb-2">
                                  {meta.name} (مظنه آبشده طلا)
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed max-w-md">
                                  قیمت پایه و مبنای بنکداری و معاملات طلای خام در تهران. این شاخص مبنای اصلی قیمت‌گذاری کلیه مصنوعات طلا در کشور است.
                                </p>
                              </div>

                              <div className="mt-6 md:mt-0 space-y-3 w-full">
                                <div className="flex items-center justify-between border-t border-[var(--border-subtle)]/40 pt-4 w-full">
                                  <span className="text-xs text-[var(--text-secondary)] font-sans">اعتبارسنجی مستقل داده‌ها:</span>
                                  <span className="text-xs text-white font-mono font-semibold bg-[var(--bg-panel-heavy)] border border-[var(--border-subtle)] px-2.5 py-1 rounded-lg">
                                    Telegram @abshdh
                                  </span>
                                </div>
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-xs text-[var(--text-secondary)] font-sans">فرکانس پایش کانال صنف:</span>
                                  <span className="text-xs text-emerald-400 font-mono font-medium flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    <TimeAgo timestamp={sourceTimestamps[meta.id]} />
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-[var(--border-subtle)]/40 to-transparent" />

                            <div className="flex flex-col justify-between items-start md:items-end text-left md:text-left md:w-1/2">
                              <div className="w-full text-right md:text-left">
                                <span className="text-[10px] text-[var(--text-secondary)] font-sans uppercase tracking-widest font-semibold block mb-1">
                                  آخرین نرخ همگرا شده (ریال)
                                </span>
                                <div className="text-4xl md:text-5xl font-mono font-extrabold text-white tracking-widest leading-none mb-3 select-all">
                                  {(prices[meta.id] || 0).toLocaleString()}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 justify-end">
                                  <span className="text-xs text-[var(--text-secondary)] font-sans">معادل تومانی:</span>
                                  <span className="text-base font-bold text-[var(--accent-gold)] font-sans bg-[var(--accent-gold-soft)] px-3 py-1 rounded-xl border border-[var(--accent-gold)]/20 shadow-sm">
                                    {((prices[meta.id] || 0) / 10).toLocaleString()} تومان
                                  </span>
                                  <span className="text-xs text-gray-500 font-mono font-medium">
                                    (یک مثقال طلا)
                                  </span>
                                </div>
                              </div>

                              <div className="mt-6 md:mt-0 w-full flex flex-col items-end gap-3">
                                <div className="flex items-center justify-between w-full border-t border-[var(--border-subtle)]/40 pt-4">
                                  <span className="text-xs text-[var(--text-secondary)] font-sans">تغییرات ۲۴ ساعته بازار:</span>
                                  <span className={`text-sm font-extrabold font-sans flex items-center gap-1 ${
                                    as.changePercent >= 0 ? "text-[var(--accent-emerald)]" : "text-[var(--accent-crimson)]"
                                  }`}>
                                    {as.changePercent >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                    {as.changePercent >= 0 ? "+" : ""}
                                    {as.changePercent.toFixed(2)}%
                                  </span>
                                </div>
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-xs text-[var(--text-secondary)] font-sans">دامنه نوسان روز:</span>
                                  <span className="text-xs font-mono font-semibold text-gray-300">
                                    {as.low24h.toLocaleString()} - {as.high24h.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={meta.id}
                        className={`glass-panel rounded-2xl p-5 border cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                          activeAssetId === meta.id
                            ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/5 shadow-[0_0_20px_rgba(212,175,55,0.05)]"
                            : isPrimary
                              ? "border-[var(--border-subtle)] hover:border-[var(--accent-gold)]/30 hover:bg-[var(--bg-panel-heavy)]"
                              : "border-[var(--border-subtle)]/60 opacity-85 hover:opacity-100 hover:border-[var(--accent-gold)]/20 hover:bg-[var(--bg-panel-heavy)]/30"
                        }`}
                        onClick={() => setActiveAssetId(meta.id)}
                      >
                        <div className="flex flex-col justify-between h-full gap-4 text-right relative z-10">
                          <div>
                            <div className="flex flex-row justify-between items-start mb-2.5">
                              <span className="text-[10px] text-[var(--text-secondary)] font-mono uppercase tracking-widest bg-[var(--bg-panel-heavy)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-md">
                                {meta.symbol}
                              </span>
                              {dataQuality[meta.id] && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap font-sans font-bold ${
                                  dataQuality[meta.id].status === "تأیید متقابل" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                  dataQuality[meta.id].status === "نیازمند بررسی" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                  dataQuality[meta.id].status === "تایید نشده" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                  "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                }`} title={dataQuality[meta.id].referencePrice ? `قیمت مرجع: ${dataQuality[meta.id].referencePrice?.toLocaleString()}` : 'در حال بررسی...'}>
                                  {dataQuality[meta.id].status}
                                </span>
                              )}
                            </div>
                            <h4 className={`font-semibold text-white font-sans text-sm ${isPrimary ? "text-base font-bold" : "text-xs"}`}>
                              {meta.name}
                            </h4>
                            
                            <div className="text-[10px] text-gray-500 font-mono mt-1.5 flex flex-col gap-0.5">
                              <div className="flex items-center gap-1 text-right">
                                <Clock className="w-3.5 h-3.5 text-gray-600 animate-pulse" />
                                <TimeAgoStyled timestamp={sourceTimestamps[meta.id]} />
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-[var(--border-subtle)]/40 pt-3 flex flex-col items-start gap-1">
                            {meta.id === "GOLD_18K" ? (
                              <div className="w-full text-right">
                                <div className="text-xl font-mono font-extrabold text-white tracking-wide mb-0.5 text-left font-tabular">
                                  {((prices[meta.id] || 0) / 10).toLocaleString()} تومان
                                </div>
                                <div className="text-[10px] text-gray-400 font-sans">
                                  معادل: {(prices[meta.id] || 0).toLocaleString()} ریال / گرم
                                </div>
                              </div>
                            ) : meta.id === "USDIRT" || meta.id === "USDTIRT" ? (
                              <div className="w-full text-right">
                                <div className="text-xl font-mono font-extrabold text-white tracking-wide mb-0.5 text-left font-tabular">
                                  {((prices[meta.id] || 0) / 10).toLocaleString()} تومان
                                </div>
                                <div className="text-[10px] text-gray-400 font-sans">
                                  معادل {(prices[meta.id] || 0).toLocaleString()} ریال
                                </div>
                              </div>
                            ) : meta.id.includes("COIN") ? (
                              <div className="w-full text-right">
                                <div className="text-xl font-mono font-extrabold text-white tracking-wide mb-0.5 text-left font-tabular">
                                  {((prices[meta.id] || 0) / 10).toLocaleString()} تومان
                                </div>
                                <div className="text-[10px] text-gray-400 font-sans">
                                  معادل {(prices[meta.id] || 0).toLocaleString()} ریال
                                </div>
                              </div>
                            ) : meta.id === "XAUUSD" ? (
                              <div className="w-full text-right">
                                <div className="text-xl font-mono font-extrabold text-white tracking-wide mb-0.5 text-left font-tabular">
                                  $ {(prices[meta.id] || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </div>
                                <div className="text-[10px] text-gray-400 font-sans">
                                  دلاف به ازای اونس تروا
                                </div>
                              </div>
                            ) : (
                              <div className="text-lg font-mono font-extrabold text-white tracking-wide text-left w-full font-tabular">
                                {(prices[meta.id] || 0).toLocaleString(undefined, {
                                  maximumFractionDigits: meta.decimals,
                                })} {meta.unit}
                              </div>
                            )}

                            <div className="flex items-center justify-between w-full mt-2.5 pt-2 border-t border-[var(--border-subtle)]/30">
                              <span className={`text-[10px] font-bold font-sans flex items-center gap-0.5 ${
                                as.changePercent >= 0 ? "text-[var(--accent-emerald)]" : "text-[var(--accent-crimson)]"
                              }`}>
                                {as.changePercent >= 0 ? "+" : ""}
                                {as.changePercent.toFixed(2)}%
                              </span>
                              <span className="text-[9px] text-gray-500 font-sans font-medium">
                                منبع: {(meta.id as string) === 'MELTED_GOLD' || (meta.id as string) === 'GOLD_18K' ? 'Telegram' : 'TGJU'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            {activeTab === "hunter" && (
              <MazanehHunter assets={assets} assetsMeta={ASSETS_METADATA} />
            )}
            {activeTab === "terminal" && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-stretch">
                {/* PRIMARY TRADINGVIEW GRADE CHART AREA */}
                <div className="xl:col-span-2 flex flex-col gap-4">
                  <div className="h-[520px] shrink-0">
                    <ChartTerminal
                      assetId={activeAssetId}
                      candles={historicalData[activeAssetId] || []}
                      marketStructure={marketStructure || DEFAULT_MARKET_STRUCTURE}
                      showAIOverlay={showAIOverlay}
                      onToggleAIOverlay={handleToggleAIOverlay}
                      aiAnalysis={aiAnalysis}
                    />
                  </div>

                  {/* Sub technical dashboard bar under chart */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-right">
                    <div className="glass-panel p-3 rounded-xl flex flex-col justify-between">
                      <span className="text-[10px] text-gray-500 font-sans">
                        قدرت خرید/فروش (RSI)
                      </span>
                      <div className="flex flex-row justify-between items-baseline gap-2 mt-1">
                        <span className="text-lg data-value text-[11px] font-extrabold text-white">
                          {technicalSignals?.rsi || 50}
                        </span>
                        <span
                          className={`text-[10px] font-sans ${
                            (technicalSignals?.rsi || 50) > 70
                              ? "text-[var(--accent-crimson)]"
                              : (technicalSignals?.rsi || 50) < 30
                                ? "text-[var(--accent-emerald)]"
                                : "text-gray-400"
                          }`}
                        >
                          {(technicalSignals?.rsi || 50) > 70
                            ? "اشباع خرید"
                            : (technicalSignals?.rsi || 50) < 30
                              ? "اشباع فروش"
                              : "متعادل"}
                        </span>
                      </div>
                    </div>

                    <div className="glass-panel p-3 rounded-xl flex flex-col justify-between">
                      <span className="text-[10px] text-gray-500 font-sans">
                        قدرت روند بازار
                      </span>
                      <div className="flex flex-row justify-between items-baseline gap-2 mt-1">
                        <span className="text-lg data-value text-[11px] font-extrabold text-[var(--accent-gold)]">
                          {technicalSignals?.trendStrength || 50}%
                        </span>
                        <span className="text-[10px] text-gray-400 font-sans">
                          شاخص ADX
                        </span>
                      </div>
                    </div>

                    <div className="glass-panel p-3 rounded-xl flex flex-col justify-between">
                      <span className="text-[10px] text-gray-500 font-sans">
                        شاخص نوسان (ATR)
                      </span>
                      <span className="text-sm data-value text-[11px] font-bold text-gray-300 mt-1 text-left">
                        {technicalSignals?.atr.toLocaleString(undefined, {
                          maximumFractionDigits: 1,
                        })}
                      </span>
                    </div>

                    <div className="glass-panel p-3 rounded-xl flex flex-col justify-between">
                      <span className="text-[10px] text-gray-500 font-sans">
                        تقاطع اندیکاتور (EMA)
                      </span>
                      <span className="text-sm font-sans font-bold text-gray-300 mt-1 text-left">
                        {technicalSignals
                          ? technicalSignals.ema20 > technicalSignals.ema50
                            ? "روند صعودی"
                            : "روند نزولی"
                          : "نامشخص"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* INTEGRATED CHAT AND CONSOLE PANEL */}
                <div className="flex flex-col h-[520px] xl:h-auto min-h-[500px]">
                  <AIChat
                    activeAsset={activeAssetInfo}
                    marketStructure={
                      marketStructure || {
                        trend: "NEUTRAL",
                        orderBlocks: [],
                        fvgs: [],
                        waves: [],
                        liquidityZones: [],
                        supportLines: [],
                        resistanceLines: [],
                      }
                    }
                    customConfig={aiConfig}
                  />
                </div>
              </div>
            )}

            {activeTab === "ai" && (
              <div className="space-y-4">
                {/* AI MODULE SUB-TABS */}
                <div className="flex border-b border-white/5 gap-6 pb-2 mb-4">
                  <button
                    onClick={() => setAiSubTab("forecast")}
                    className={`pb-2 text-xs data-value text-[11px] uppercase tracking-wider transition relative cursor-pointer ${
                      aiSubTab === "forecast"
                        ? "text-[var(--accent-gold)] font-extrabold"
                        : "text-gray-500 hover:text-white"
                    }`}
                  >
                    <span className="font-sans">ماتریس پیش‌بینی هوشمند</span>
                    {aiSubTab === "forecast" && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent-gold)]"></div>
                    )}
                  </button>
                  <button
                    onClick={() => setAiSubTab("strategy")}
                    className={`pb-2 text-xs font-sans uppercase tracking-wider transition relative cursor-pointer ${
                      aiSubTab === "strategy"
                        ? "text-[var(--accent-gold)] font-extrabold"
                        : "text-gray-500 hover:text-white"
                    }`}
                  >
                    <span className="font-sans">
                      قوانین اتوماسیون و استراتژی
                    </span>
                    {aiSubTab === "strategy" && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent-gold)]"></div>
                    )}
                  </button>
                </div>

                {aiSubTab === "strategy" ? (
                  <StrategyBuilder
                    activeAssetId={activeAssetId}
                    activeAssetSymbol={activeAssetInfo.symbol}
                    activeAssetPersianName={activeAssetInfo.persianName}
                    candles={historicalData[activeAssetId] || []}
                    currentPrice={prices[activeAssetId] || 0}
                  />
                ) : (
                  <>
                    {/* AI Forecast Trigger Box */}
                    <div className="glass-panel rounded-xl p-5 flex flex-wrap flex-row items-center justify-between gap-4 text-right">
                      <div className="space-y-1">
                        <div className="flex flex-row items-center gap-2">
                          <Sparkles className="h-5 w-5 text-[var(--accent-gold)]" />
                          <h2 className="text-base font-sans font-bold text-white tracking-wide">
                            تحلیلگر هوشمند هوش مصنوعی
                          </h2>
                        </div>
                        <p className="text-xs text-gray-400 max-w-xl font-sans">
                          مدل‌های هوش مصنوعی پیشرفته ما اطلاعات بازار، ساختارها
                          و روندها را بررسی می‌کنند تا سناریوهای معاملاتی و
                          گزارش‌های تحلیلی را برای شما تولید کنند.
                        </p>
                      </div>

                      <div className="flex flex-wrap flex-row items-center gap-2">
                        <button
                          onClick={() =>
                            setInjectTelegramPrice(!injectTelegramPrice)
                          }
                          className={`flex flex-row items-center gap-2 px-3.5 py-2 border rounded-lg text-xs font-semibold transition cursor-pointer font-sans ${
                            injectTelegramPrice
                              ? "bg-[var(--accent-gold)]/10 border-[var(--accent-gold)]/30 text-[var(--accent-gold)]"
                              : "bg-black/20 border-white/5 text-gray-500"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${injectTelegramPrice ? "bg-[var(--accent-gold)] animate-pulse" : "bg-gray-600"}`}
                          />
                          <span>
                            استفاده از قیمت لحظه‌ای تلگرام (
                            {prices["MELTED_GOLD"]
                              ? (prices["MELTED_GOLD"] / 10).toLocaleString()
                              : "---"}{" "}
                            تومان)
                          </span>
                        </button>

                        <button
                          onClick={handleAIAnalysisTrigger}
                          disabled={isAnalyzing}
                          className="flex flex-row items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold text-xs rounded-lg transition hover:brightness-110 disabled:opacity-50 cursor-pointer font-sans"
                        >
                          <RefreshCw
                            className={`h-4 w-4 ${isAnalyzing ? "animate-spin" : ""}`}
                          />
                          <span>
                            {isAnalyzing
                              ? "در حال تحلیل جریان‌های زنده..."
                              : "بازسازی پیش‌بینی هوشمند"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {isAnalyzing ? (
                      <div className="glass-panel rounded-xl p-12 text-center space-y-4 font-sans">
                        <RefreshCw className="h-10 w-10 text-[var(--accent-gold)] animate-spin mx-auto" />
                        <p className="text-sm text-gray-300 font-medium">
                          در حال فراخوانی الگوریتم هوش مصنوعی مستقر بر سرور...
                        </p>
                        <p className="text-xs text-gray-500">
                          تطبیق قراردادهای زنده مثقال، انس جهانی و COMEX با
                          ساختارهای SMC.
                        </p>
                      </div>
                    ) : aiAnalysisError ? (
                      <>
                        <div className="glass-panel rounded-xl p-12 text-center space-y-4 font-sans border-red-500/50 mb-4">
                          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
                          <p className="text-sm text-red-400 font-medium text-right direction-rtl">
                            {aiAnalysisError}
                          </p>
                        </div>
                        {aiAnalysis && (
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 opacity-60">
                            <div className="col-span-3 text-right text-xs text-gray-400 mb-2">نمایش آخرین تحلیل معتبر (قدیمی)</div>
                            {/* The rest of aiAnalysis will be rendered by the same logic below if we extract it, or we just let it fall through */}
                          </div>
                        )}
                      </>
                    ) : null}

                    {/* Show analysis if we have it and no error (or we can just show it below the error!) */}
                    {aiAnalysis && !isAnalyzing ? (
                      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 ${aiAnalysisError ? 'opacity-50' : ''}`}>
                        {/* Left Column: Metric scores & Setup Targets */}
                        {/* Left Column: Metric scores & Setup Targets */}
                        <div className="space-y-4 col-span-1">
                          {/* Score dials */}
                          <div className="glass-panel rounded-xl p-4 space-y-4 text-center">
                            <span className="text-[10px] font-sans text-gray-500 tracking-wider">
                              معیارهای ارزیابی کوانت
                            </span>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="border border-white/5 rounded-lg p-3 bg-black/20">
                                <p className="text-2xl data-value text-[11px] font-extrabold text-[var(--accent-gold)]">
                                  {aiAnalysis.confidenceScore}%
                                </p>
                                <p className="text-[10px] text-gray-500 font-sans mt-1">
                                  ضریب اطمینان مدل
                                </p>
                              </div>
                              <div className="border border-white/5 rounded-lg p-3 bg-black/20">
                                <p className="text-2xl data-value text-[11px] font-extrabold text-[var(--accent-emerald)]">
                                  {aiAnalysis.probabilityScore}%
                                </p>
                                <p className="text-[10px] text-gray-500 font-sans mt-1">
                                  شاخص احتمال پیروزی
                                </p>
                              </div>
                            </div>

                            <div className="pt-2">
                              <span className="text-[10px] text-gray-500 font-sans block">
                                فاز چرخه بازار شناسایی‌شده
                              </span>
                              <span className="text-xs font-sans font-semibold text-white mt-1 bg-white/5 px-3 py-1.5 rounded-full inline-block border border-white/10">
                                {aiAnalysis.marketPhase}
                              </span>
                            </div>
                          </div>

                          {/* Trade Setup Targets */}
                          <div className="glass-panel rounded-xl p-4 space-y-3.5 text-right">
                            <span className="text-[10px] font-sans text-[var(--accent-gold)] tracking-wider uppercase block">
                              تنظیمات پیشنهادی معامله سازمانی
                            </span>

                            <div className="space-y-2">
                              <div className="flex flex-row justify-between text-xs font-sans">
                                <span className="text-gray-400">
                                  قیمت ورود پیشنهادی:
                                </span>
                                <span className="data-value text-[11px] font-bold text-white">
                                  {aiAnalysis.tradeSetup.entry.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex flex-row justify-between text-xs font-sans">
                                <span className="text-[var(--accent-crimson)] font-semibold">
                                  حد ضرر (SL):
                                </span>
                                <span className="data-value text-[11px] font-bold text-[var(--accent-crimson)]">
                                  {aiAnalysis.tradeSetup.stopLoss.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex flex-row justify-between text-xs font-sans">
                                <span className="text-[var(--accent-emerald)] font-semibold">
                                  حد سود اول (TP1):
                                </span>
                                <span className="data-value text-[11px] font-bold text-[var(--accent-emerald)]">
                                  {aiAnalysis.tradeSetup.takeProfit1.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex flex-row justify-between text-xs font-sans">
                                <span className="text-[var(--accent-emerald)] font-semibold">
                                  حد سود دوم (TP2):
                                </span>
                                <span className="data-value text-[11px] font-bold text-[var(--accent-emerald)]">
                                  {aiAnalysis.tradeSetup.takeProfit2.toLocaleString()}
                                </span>
                              </div>
                              <div className="border-t border-white/5 pt-2.5 flex flex-row justify-between text-xs font-sans">
                                <span className="text-gray-400">
                                  نسبت ریسک به ریوارد:
                                </span>
                                <span className="data-value text-[11px] font-bold text-[var(--accent-gold)]">
                                  {aiAnalysis.tradeSetup.riskRewardRatio} : ۱
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setPositionInput({
                                  type: "buy",
                                  entryPrice: aiAnalysis.tradeSetup.entry,
                                  stopLoss: aiAnalysis.tradeSetup.stopLoss,
                                  takeProfit: aiAnalysis.tradeSetup.takeProfit1,
                                  quantity:
                                    activeAssetId === "MELTED_GOLD" ? 5 : 10,
                                });
                                setActiveTab("portfolio");
                              }}
                              className="w-full py-2 lux-button-primary lux-button rounded-lg mt-2 font-sans"
                            >
                              پیاده‌سازی معامله پیشنهادی در سبد آزمایشی
                            </button>
                          </div>

                          {/* Scenario forecasts */}
                          <div className="glass-panel rounded-xl p-4 space-y-3 text-right">
                            <span className="text-[9px] data-label text-gray-500 mb-3 block font-semibold">
                              شبیه‌ساز سناریوهای بازار
                            </span>

                            <div className="space-y-2.5 text-xs font-sans">
                              <div className="space-y-1">
                                <p className="text-[var(--accent-emerald)] font-semibold text-right">
                                  مسیر حرکتی اصلی (Primary Pathway):
                                </p>
                                <p className="text-gray-300 bg-black/10 p-2 rounded border border-white/5 text-[11px] leading-relaxed text-right">
                                  {aiAnalysis.scenarios.primary}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[var(--accent-gold)] font-semibold text-right">
                                  مسیر حرکتی جایگزین (Alternative Pathway):
                                </p>
                                <p className="text-gray-300 bg-black/10 p-2 rounded border border-white/5 text-[11px] leading-relaxed text-right">
                                  {aiAnalysis.scenarios.alternative}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[var(--accent-crimson)] font-semibold text-right">
                                  شرایط ابطال سناریو (Invalidation Threshold):
                                </p>
                                <p className="text-gray-300 bg-black/10 p-2 rounded border border-white/5 text-[11px] leading-relaxed text-right">
                                  {aiAnalysis.scenarios.invalidation}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Risk Engine */}
                          {aiAnalysis.risks && (
                            <div className="glass-panel rounded-xl p-4 space-y-4 text-right col-span-1 md:col-span-2">
                              <span className="text-[9px] data-label text-gray-500 mb-3 block font-semibold">
                                موتور ارزیابی ریسک سیستمی (Risk Engine)
                              </span>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                  {
                                    label: "ریسک سیاسی-ژئوپلیتیک",
                                    val: aiAnalysis.risks.political,
                                  },
                                  {
                                    label: "فشار تورم داخلی",
                                    val: aiAnalysis.risks.inflation,
                                  },
                                  {
                                    label: "نوسانات دلار (USD/IRR)",
                                    val: aiAnalysis.risks.volatility,
                                  },
                                  {
                                    label: "تاثیر اونس جهانی",
                                    val: aiAnalysis.risks.globalImpact,
                                  },
                                ].map((r, idx) => (
                                  <div key={idx} className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-sans">
                                      <span className="text-gray-400">
                                        {r.label}
                                      </span>
                                      <span
                                        className={
                                          r.val > 70
                                            ? "text-[var(--accent-crimson)]"
                                            : r.val > 40
                                              ? "text-[var(--accent-gold)]"
                                              : "text-[var(--accent-emerald)]"
                                        }
                                      >
                                        {r.val}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className={`h-full ${r.val > 70 ? "bg-[var(--accent-crimson)] shadow-[0_0_8px_rgba(239,68,68,0.5)]" : r.val > 40 ? "bg-[var(--accent-gold)] shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-[var(--accent-emerald)] shadow-[0_0_8px_rgba(16,185,129,0.5)]"}`}
                                        style={{ width: `${r.val}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Right Column: Markdown Details report */}
                        <div className="col-span-1 lg:col-span-2 space-y-4 text-right">
                          <div className="glass-panel rounded-xl p-6 space-y-4">
                            <div className="flex flex-row justify-between items-center border-b border-white/5 pb-3">
                              <h3 className="font-sans font-extrabold text-sm text-white tracking-wider">
                                گزارش جامع تحلیل الگوریتمی و هوشمند طلا
                              </h3>
                              <span className="text-[10px] data-value text-[11px] text-gray-500">
                                زمان صدور:{" "}
                                {new Date(
                                  aiAnalysis.timestamp,
                                ).toLocaleTimeString()}
                              </span>
                            </div>

                            {/* Markdown reader container */}
                            <div className="prose prose-invert max-w-none text-xs text-gray-300 leading-relaxed space-y-4 font-sans text-right">
                              {aiAnalysis.detailedAnalysisMarkdown
                                .split("\n")
                                .map((line, idx) => {
                                  if (line.startsWith("### ")) {
                                    return (
                                      <h4
                                        key={idx}
                                        className="text-sm font-display font-bold text-[var(--accent-gold)] mt-4 mb-2"
                                      >
                                        {line.replace("### ", "")}
                                      </h4>
                                    );
                                  }
                                  if (line.startsWith("## ")) {
                                    return (
                                      <h3
                                        key={idx}
                                        className="text-base font-display font-bold text-[var(--accent-gold)] mt-5 mb-2.5 border-b border-white/5 pb-1"
                                      >
                                        {line.replace("## ", "")}
                                      </h3>
                                    );
                                  }
                                  if (line.startsWith("# ")) {
                                    return (
                                      <h2
                                        key={idx}
                                        className="text-lg font-display font-extrabold text-white mt-6 mb-3"
                                      >
                                        {line.replace("# ", "")}
                                      </h2>
                                    );
                                  }
                                  if (
                                    line.startsWith("- ") ||
                                    line.startsWith("* ")
                                  ) {
                                    return (
                                      <ul
                                        key={idx}
                                        className="list-disc pl-5 space-y-1 text-gray-300"
                                      >
                                        <li>{line.substring(2)}</li>
                                      </ul>
                                    );
                                  }
                                  if (line.startsWith("> ")) {
                                    return (
                                      <blockquote
                                        key={idx}
                                        className="border-l-2 border-amber-500 pl-3 py-1 my-2 bg-[var(--accent-gold)]/5 text-gray-400 italic"
                                      >
                                        {line.replace("> ", "")}
                                      </blockquote>
                                    );
                                  }
                                  return (
                                    <p
                                      key={idx}
                                      className="text-gray-300 text-[11px] leading-relaxed"
                                    >
                                      {line}
                                    </p>
                                  );
                                })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="glass-panel rounded-xl p-8 text-center text-gray-400 font-sans">
                        هنوز خروجی تحلیلی تولید نشده است. برای فراخوانی الگوریتم
                        هوشمند، دکمه بالا را کلیک کنید.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "portfolio" && (
              <div className="space-y-4">
                {/* Portfolio Header with Analytics Console Trigger */}
                <div className="glass-panel rounded-xl p-5 relative overflow-hidden flex flex-wrap flex-row items-center justify-between gap-4 text-right">
                  <div className="space-y-2 z-10 relative">
                    <span className="text-[10px] font-sans bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] border border-[var(--accent-gold)]/20 px-2 py-0.5 rounded uppercase tracking-wider">
                      مدیریت ریسک سازمانی
                    </span>
                    <h2 className="font-sans font-extrabold text-lg text-white">
                      مدیریت سبد دارایی و معاملات شبیه‌سازی شده
                    </h2>
                    <p className="text-xs text-gray-400 max-w-3xl leading-relaxed">
                      پیگیری زنده موقعیت‌های معاملاتی باز، تخمین نسبت بهینه حجم
                      سرمایه‌گذاری بر اساس معیار کلی (Kelly) و تحلیل آماری
                      بازدهی کل معاملات.
                    </p>
                  </div>
                  <div className="z-10 shrink-0">
                    <button
                      onClick={() => setIsAnalyticsOpen(true)}
                      className="flex flex-row items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs rounded-lg transition hover:brightness-110 shadow-[0_0_20px_rgba(245,158,11,0.2)] uppercase tracking-wider cursor-pointer font-sans"
                    >
                      <BarChart2 className="h-4 w-4" />
                      <span>مشاهده عملکرد و آنالیز بازدهی</span>
                    </button>
                  </div>
                  <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none"></div>
                </div>

                {/* simulated capital details */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-right">
                  <div className="glass-panel rounded-xl p-4 space-y-1">
                    <p className="text-[10px] text-gray-500 font-sans">
                      سرمایه حساب شبیه‌سازی شده
                    </p>
                    <p className="text-2xl data-value text-[11px] font-extrabold text-white">
                      ${accountBalance.toLocaleString()}
                    </p>
                  </div>

                  <div className="glass-panel rounded-xl p-4 space-y-1">
                    <p className="text-[10px] text-gray-500 font-sans">
                      تعداد موقعیت‌های فعال
                    </p>
                    <p className="text-2xl data-value text-[11px] font-extrabold text-white">
                      {positions.length}{" "}
                      <span className="text-xs font-sans text-gray-400">
                        موقعیت فعال
                      </span>
                    </p>
                  </div>

                  <div className="glass-panel rounded-xl p-4 space-y-1">
                    <p className="text-[10px] text-gray-500 font-sans">
                      سود و زیان شناور کل
                    </p>
                    <p
                      className={`text-2xl data-value text-[11px] font-extrabold ${
                        positions.reduce((acc, curr) => acc + curr.pnl, 0) >= 0
                          ? "text-[var(--accent-emerald)]"
                          : "text-[var(--accent-crimson)]"
                      }`}
                    >
                      $
                      {positions
                        .reduce((acc, curr) => acc + curr.pnl, 0)
                        .toLocaleString()}
                    </p>
                  </div>

                  <div className="glass-panel rounded-xl p-4 space-y-1">
                    <p className="text-[10px] text-gray-500 font-sans">
                      حجم پیشنهادی معیار کلی (Kelly)
                    </p>
                    <p className="text-2xl data-value text-[11px] font-extrabold text-[var(--accent-gold)]">
                      {((riskPercent * 1.5) / leverage).toFixed(1)}%{" "}
                      <span className="text-xs font-sans text-gray-400">
                        / هر معامله
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                  {/* Kelly criterion Calculator and Trigger Order Form */}
                  <div className="space-y-4 col-span-1">
                    {/* Position Form */}
                    <div className="glass-panel rounded-xl p-5 space-y-4 text-right">
                      <h3 className="font-sans font-bold text-sm text-white border-b border-white/5 pb-2">
                        پنل ورود به معامله و مدیریت ریسک
                      </h3>

                      <form
                        onSubmit={handlePlaceOrder}
                        className="space-y-3 text-xs text-right"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setPositionInput((prev) => ({
                                ...prev,
                                type: "buy",
                              }))
                            }
                            className={`py-2 rounded font-sans font-bold transition ${positionInput.type === "buy" ? "bg-[var(--accent-emerald)] text-black shadow-[0_0_15px_rgba(16,185,129,0.25)]" : "bg-white/5 text-gray-400"}`}
                          >
                            خرید (LONG)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPositionInput((prev) => ({
                                ...prev,
                                type: "sell",
                              }))
                            }
                            className={`py-2 rounded font-sans font-bold transition ${positionInput.type === "sell" ? "bg-[var(--accent-crimson)] text-black shadow-[0_0_15px_rgba(239,68,68,0.25)]" : "bg-white/5 text-gray-400"}`}
                          >
                            فروش (SHORT)
                          </button>
                        </div>

                        <div className="space-y-1 text-right">
                          <label className="text-gray-400 font-sans">
                            قیمت ورود پیشنهادی:
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={positionInput.entryPrice}
                            onChange={(e) =>
                              setPositionInput((prev) => ({
                                ...prev,
                                entryPrice: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className="w-full bg-black/40 border border-white/5 rounded p-2 text-white data-value text-[11px] text-left"
                          />
                        </div>

                        <div className="space-y-1 text-right">
                          <label className="text-gray-400 font-sans">
                            ضریب اهرم معاملاتی ({leverage}x):
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="100"
                            value={leverage}
                            onChange={(e) =>
                              setLeverage(parseInt(e.target.value))
                            }
                            className="w-full accent-amber-500"
                          />
                          <div className="flex flex-row justify-between text-[10px] text-gray-500 font-sans">
                            <span>۱x (اسپات بدون اهرم)</span>
                            <span>۵۰x (حد کارگزاری)</span>
                            <span>۱۰۰x (حد سازمانی)</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-right">
                          <div className="space-y-1">
                            <label className="text-[var(--accent-crimson)] font-sans">
                              حد ضرر (SL):
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={positionInput.stopLoss}
                              onChange={(e) =>
                                setPositionInput((prev) => ({
                                  ...prev,
                                  stopLoss: parseFloat(e.target.value) || 0,
                                }))
                              }
                              className="w-full bg-black/40 border border-white/5 rounded p-2 text-rose-300 data-value text-[11px] text-left"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[var(--accent-emerald)] font-sans">
                              حد سود (TP):
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={positionInput.takeProfit}
                              onChange={(e) =>
                                setPositionInput((prev) => ({
                                  ...prev,
                                  takeProfit: parseFloat(e.target.value) || 0,
                                }))
                              }
                              className="w-full bg-black/40 border border-white/5 rounded p-2 text-emerald-300 data-value text-[11px] text-left"
                            />
                          </div>
                        </div>

                        <div className="space-y-1 text-right">
                          <label className="text-gray-400 font-sans">
                            حجم معامله (تعداد قرارداد):
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={positionInput.quantity}
                            onChange={(e) =>
                              setPositionInput((prev) => ({
                                ...prev,
                                quantity: parseFloat(e.target.value) || 1,
                              }))
                            }
                            className="w-full bg-black/40 border border-white/5 rounded p-2 text-white data-value text-[11px] text-left"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 lux-button-primary lux-button rounded mt-3 font-sans"
                        >
                          ثبت معامله شبیه‌سازی شده{" "}
                          {positionInput.type === "buy" ? "خرید" : "فروش"}
                        </button>
                      </form>
                    </div>

                    {/* Kelly size indicator details */}
                    <div className="glass-panel rounded-xl p-4 space-y-3 text-xs leading-relaxed text-right">
                      <div className="flex flex-row items-center gap-1 text-[var(--accent-gold)]">
                        <Calculator className="h-4 w-4" />
                        <h4 className="font-bold font-sans">
                          مدل محاسبه حجم بهینه کلی (Kelly)
                        </h4>
                      </div>
                      <p className="text-gray-400 font-sans">
                        معیار کلی به صورت ریاضی جهت مدیریت بهینه حجم معاملات بر
                        اساس احتمال برد و نسبت سود به ضرر به صورت زیر تعیین
                        می‌گردد:
                      </p>
                      <code className="block bg-black/40 border border-white/5 p-2 rounded text-center text-[var(--accent-gold)] data-value text-[11px] text-[10px]">
                        K% = W - (1 - W) / R
                      </code>
                      <p className="text-gray-400 font-sans">
                        با فرض احتمال برد ۶۵٪ (W) طبق خروجی مدل هوشمند و نسبت
                        ریوارد به ریسک متوسط ۲.۲ به ۱ (R)، معیار کلی حجم بهینه
                        را بر اساس سرمایه کل محاسبه می‌کند.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Active Simulation Positions list */}
                  <div className="col-span-1 lg:col-span-2 space-y-4 text-right">
                    <div className="glass-panel rounded-xl p-5 space-y-4">
                      <h3 className="font-sans font-bold text-sm text-white border-b border-white/5 pb-2">
                        موقعیت‌های معاملاتی باز فعال در ترمینال
                      </h3>

                      {positions.length === 0 ? (
                        <div className="py-12 text-center text-gray-500 text-xs font-sans">
                          هیچ معامله فعال شبیه‌سازی شده‌ای وجود ندارد. از طریق
                          فرم منوی کناری می‌توانید معامله ثبت کنید.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-right text-xs font-sans">
                            <thead>
                              <tr className="text-gray-500 border-b border-white/5 pb-2">
                                <th className="py-2 text-right">دارایی</th>
                                <th className="text-right">نوع</th>
                                <th className="text-right">اهرم</th>
                                <th className="text-right">حجم</th>
                                <th className="text-right">نرخ ورود</th>
                                <th className="text-right">نرخ فعلی</th>
                                <th className="text-right">اهداف حد (SL/TP)</th>
                                <th className="text-right">سود/زیان ($)</th>
                                <th className="text-left pl-2">عملیات</th>
                              </tr>
                            </thead>
                            <tbody>
                              {positions.map((p) => {
                                const meta = ASSETS_METADATA[p.assetId];
                                const currentPrice = prices[p.assetId];

                                // Real-time calculation of Simulated contracts PNL
                                const multiplier = p.type === "buy" ? 1 : -1;
                                const delta =
                                  (currentPrice - p.entryPrice) * multiplier;
                                const isMelted = p.assetId === "MELTED_GOLD";
                                const computedPnl = isMelted
                                  ? (delta / 1000) * p.quantity * p.leverage // Simulated scale factor
                                  : delta * p.quantity * p.leverage;

                                return (
                                  <tr
                                    key={p.id}
                                    className="border-b border-white/5/60 hover:bg-white/5/20"
                                  >
                                    <td className="py-3 text-right">
                                      <p className="font-semibold text-white font-sans">
                                        {meta.persianName}
                                      </p>
                                      <p className="text-[10px] text-gray-500 data-value text-[11px]">
                                        {meta.symbol}
                                      </p>
                                    </td>
                                    <td className="text-right">
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          p.type === "buy"
                                            ? "bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)]"
                                            : "bg-[var(--accent-crimson)]/10 text-[var(--accent-crimson)]"
                                        }`}
                                      >
                                        {p.type === "buy" ? "خرید" : "فروش"}
                                      </span>
                                    </td>
                                    <td className="data-value text-[11px] text-gray-300 text-right">
                                      {p.leverage}x
                                    </td>
                                    <td className="data-value text-[11px] text-gray-300 text-right">
                                      {p.quantity}
                                    </td>
                                    <td className="data-value text-[11px] text-gray-300 text-right">
                                      {p.entryPrice.toLocaleString()}
                                    </td>
                                    <td className="data-value text-[11px] text-white font-semibold text-right">
                                      {currentPrice.toLocaleString()}
                                    </td>
                                    <td className="data-value text-[11px] text-[10px] text-gray-400 text-right">
                                      <p>
                                        SL:{" "}
                                        <span className="text-[var(--accent-crimson)]">
                                          {p.stopLoss.toLocaleString()}
                                        </span>
                                      </p>
                                      <p>
                                        TP:{" "}
                                        <span className="text-[var(--accent-emerald)]">
                                          {p.takeProfit.toLocaleString()}
                                        </span>
                                      </p>
                                    </td>
                                    <td
                                      className={`data-value text-[11px] font-bold text-right ${computedPnl >= 0 ? "text-[var(--accent-emerald)]" : "text-[var(--accent-crimson)]"}`}
                                    >
                                      $
                                      {computedPnl.toLocaleString(undefined, {
                                        maximumFractionDigits: 1,
                                      })}
                                    </td>
                                    <td className="text-left pl-2">
                                      <button
                                        onClick={() =>
                                          handleClosePosition(p.id)
                                        }
                                        className="px-2.5 py-1 rounded bg-[var(--accent-crimson)]/10 hover:bg-[var(--accent-crimson)] text-[var(--accent-crimson)] hover:text-black transition text-[10px] font-sans font-medium"
                                      >
                                        بستن معامله
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Performance Analytics Modal Overlay */}
                <PortfolioAnalytics
                  isOpen={isAnalyticsOpen}
                  onClose={() => setIsAnalyticsOpen(false)}
                  journalEntries={journalEntries}
                  currentAccountBalance={accountBalance}
                  shamsiEnabled={shamsiEnabled}
                  persianDigitsEnabled={persianDigitsEnabled}
                />
              </div>
            )}

            {activeTab === "calendar" && (
              <div className="glass-panel rounded-xl p-5 space-y-4 text-right">
                <div className="flex flex-row justify-between items-center border-b border-white/5 pb-3">
                  <div className="space-y-1">
                    <h2 className="text-base font-sans font-extrabold text-white tracking-wider">
                      تقویم اقتصادی کلان
                    </h2>
                    <p className="text-xs font-sans text-gray-500">
                      مهم‌ترین کاتالیزورهای نوسان بازار زنده با قابلیت فیلتر بر
                      اساس ریسک کلان
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[var(--accent-gold)]" />
                  </div>
                </div>

                {/* Shamsi Calendar Toggle Controls */}
                <div className="flex flex-wrap flex-row items-center justify-between gap-3 p-3 rounded-lg bg-black/20 border border-white/5 text-xs">
                  <div className="flex flex-row items-center gap-2 font-sans">
                    <span className="text-gray-400 font-medium">
                      سیستم نمایش تقویم:
                    </span>
                    <div className="inline-flex flex-row rounded-md p-0.5 bg-white/5 border border-white/10">
                      <button
                        type="button"
                        onClick={() => setShamsiEnabled(false)}
                        className={`px-3 py-1 rounded text-xs transition font-semibold ${!shamsiEnabled ? "bg-[var(--accent-gold)] text-black shadow-sm" : "text-gray-400 hover:text-white"}`}
                      >
                        میلادی
                      </button>
                      <button
                        type="button"
                        onClick={() => setShamsiEnabled(true)}
                        className={`px-3 py-1 rounded text-xs transition font-semibold ${shamsiEnabled ? "bg-[var(--accent-gold)] text-black shadow-sm" : "text-gray-400 hover:text-white"}`}
                      >
                        خورشیدی
                      </button>
                    </div>
                  </div>

                  {shamsiEnabled && (
                    <div className="flex flex-row items-center gap-2">
                      <span className="text-gray-500 text-[11px] font-sans">
                        زبان اعداد:
                      </span>
                      <div className="inline-flex flex-row rounded-md p-0.5 bg-white/5 border border-white/10">
                        <button
                          type="button"
                          onClick={() => setPersianDigitsEnabled(false)}
                          className={`px-2.5 py-0.5 rounded text-[10px] data-value text-[11px] transition ${!persianDigitsEnabled ? "bg-gray-800 text-[var(--accent-gold)] font-bold" : "text-gray-500 hover:text-white"}`}
                        >
                          123
                        </button>
                        <button
                          type="button"
                          onClick={() => setPersianDigitsEnabled(true)}
                          className={`px-2.5 py-0.5 rounded text-[10px] data-value text-[11px] transition ${persianDigitsEnabled ? "bg-gray-800 text-[var(--accent-gold)] font-bold" : "text-gray-500 hover:text-white"}`}
                        >
                          ۱۲۳
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Economic Calendar Event Cards */}
                <div className="space-y-2">
                  {MACRO_CALENDAR.map((cal) => (
                    <div
                      key={cal.id}
                      className="flex flex-wrap flex-row items-center justify-between p-3 rounded-lg bg-white/5/40 border border-white/5/80 hover:border-amber-500/10 transition"
                    >
                      <div className="flex flex-row items-center gap-3.5 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cal.currency === "USD"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)] border border-emerald-500/20"
                          }`}
                        >
                          {cal.currency}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-white font-sans">
                            {cal.event}
                          </p>
                          <p className="text-[10px] text-gray-500 data-value text-[11px]">
                            {shamsiEnabled ? (
                              <span className="flex flex-row items-center gap-1.5">
                                <span className="text-[var(--accent-gold)]/90 font-bold font-sans bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/20 px-1 rounded text-[9px] uppercase tracking-wide">
                                  شمسی
                                </span>
                                <span className="text-gray-300 font-medium">
                                  {formatToShamsi(cal.time, {
                                    usePersianDigits: persianDigitsEnabled,
                                    formatStyle: "both",
                                  })}
                                </span>
                              </span>
                            ) : (
                              <span className="text-gray-400">
                                {new Date(cal.time).toLocaleString()}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-row items-center gap-6 text-xs font-sans">
                        <div>
                          <span className="text-gray-500 text-[10px]">
                            قبلی:
                          </span>{" "}
                          <span className="text-gray-300 data-value text-[11px]">
                            {cal.previous}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[10px]">
                            پیش‌بینی:
                          </span>{" "}
                          <span className="text-gray-300 data-value text-[11px]">
                            {cal.forecast}
                          </span>
                        </div>
                        <div className="flex flex-row items-center gap-2">
                          <span className="text-gray-500 text-[10px]">
                            اهمیت:
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              cal.impact === "high"
                                ? "bg-[var(--accent-crimson)]/10 text-[var(--accent-crimson)] border border-rose-500/20"
                                : "bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] border border-[var(--accent-gold)]/20"
                            }`}
                          >
                            {cal.impact === "high"
                              ? "بالا"
                              : cal.impact === "medium"
                                ? "متوسط"
                                : "پایین"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Interactive Bidirectional Calendar Converter Workbench */}
                <div className="border-t border-white/5 pt-5 mt-4 space-y-4 text-right">
                  <div className="flex flex-row items-center gap-2">
                    <Calculator className="h-4 w-4 text-[var(--accent-gold)]" />
                    <h3 className="font-sans font-bold text-xs text-white tracking-widest">
                      مبدل دوطرفه تاریخ (شمسی - میلادی)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Right Side: Converter Input Interface (col-span-7) -> Now conceptually right because RTL */}
                    <div className="col-span-1 md:col-span-7 bg-black/5 border border-white/5 rounded-xl p-4 space-y-4 text-xs">
                      <div className="flex flex-row items-center justify-between flex-wrap gap-2 border-b border-white/5/60 pb-3">
                        <div className="flex flex-row items-center gap-2">
                          <span className="text-gray-400 font-bold tracking-wider text-[10px] font-sans">
                            جهت تبدیل:
                          </span>
                          <div className="inline-flex flex-row rounded bg-white/5 p-0.5 border border-white/10">
                            <button
                              type="button"
                              onClick={() => setConvType("g2s")}
                              className={`px-3 py-1 rounded font-semibold transition text-[11px] font-sans ${convType === "g2s" ? "bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-bold border border-amber-500/25" : "text-gray-500 hover:text-white"}`}
                            >
                              میلادی ➔ شمسی
                            </button>
                            <button
                              type="button"
                              onClick={() => setConvType("s2g")}
                              className={`px-3 py-1 rounded font-semibold transition text-[11px] font-sans ${convType === "s2g" ? "bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-bold border border-amber-500/25" : "text-gray-500 hover:text-white"}`}
                            >
                              شمسی ➔ میلادی
                            </button>
                          </div>
                        </div>
                      </div>

                      {convType === "g2s" ? (
                        <div className="space-y-1.5 text-right">
                          <label className="text-gray-400 font-bold text-[10px] block tracking-wider font-sans">
                            انتخاب تاریخ میلادی:
                          </label>
                          <input
                            type="date"
                            value={gregInput}
                            onChange={(e) => setGregInput(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded p-2 text-white data-value text-[11px] text-xs focus:outline-none focus:border-amber-500/35 text-left"
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-3 text-right">
                          <div className="space-y-1.5">
                            <label className="text-gray-400 font-bold text-[10px] block tracking-wider font-sans">
                              سال شمسی:
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="3000"
                              placeholder="مثال: 1405"
                              value={shamsiYear}
                              onChange={(e) => setShamsiYear(e.target.value)}
                              className="w-full bg-black/40 border border-white/5 rounded p-2 text-white data-value text-[11px] focus:outline-none focus:border-amber-500/35 text-left"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-gray-400 font-bold text-[10px] block tracking-wider font-sans">
                              ماه شمسی (۱-۱۲):
                            </label>
                            <select
                              value={shamsiMonth}
                              onChange={(e) => setShamsiMonth(e.target.value)}
                              className="w-full bg-black/40 border border-white/5 rounded p-2 text-white text-xs font-sans text-right direction-rtl"
                              style={{ direction: "rtl" }}
                            >
                              {Array.from({ length: 12 }, (_, i) =>
                                (i + 1).toString(),
                              ).map((m) => (
                                <option key={m} value={m}>
                                  {m} - {PERSIAN_MONTH_NAMES[parseInt(m) - 1]} (
                                  {PERSIAN_MONTH_PHONETIC[parseInt(m) - 1]})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-gray-400 font-bold text-[10px] block tracking-wider font-sans">
                              روز (۱-۳۱):
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="31"
                              placeholder="مثال: 10"
                              value={shamsiDay}
                              onChange={(e) => setShamsiDay(e.target.value)}
                              className="w-full bg-black/40 border border-white/5 rounded p-2 text-white data-value text-[11px] focus:outline-none focus:border-amber-500/35 text-left"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Left Side: Conversion Output Result Card (col-span-5) */}
                    <div className="col-span-1 md:col-span-5 bg-black/40 rounded-xl border border-white/5 p-4 flex flex-col justify-between text-right">
                      <div className="space-y-2">
                        <span className="text-[10px] text-gray-500 font-sans block border-b border-white/5 pb-1 tracking-widest">
                          خروجی مبدل تقویم
                        </span>
                        <div className="py-2">
                          <p className="text-[10px] text-gray-400 font-semibold tracking-wider font-sans">
                            {convType === "g2s"
                              ? "معادل تاریخ شمسی (جلالی)"
                              : "معادل تاریخ میلادی (گرگوری)"}
                          </p>
                          <p className="text-sm font-bold text-[var(--accent-gold)] tracking-wide mt-1 bg-[var(--accent-gold)]/5 px-2.5 py-2 rounded border border-amber-500/10 inline-block w-full">
                            {convResult}
                          </p>
                        </div>
                      </div>

                      <div className="p-2 bg-[var(--accent-gold)]/5 border border-amber-500/10 rounded text-[9px] data-value text-[11px] text-gray-500 leading-normal">
                        Astronomical Solar Hijri calculations align with the
                        natural spring equinox (Nowruz).
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "news" && (
              <div className="space-y-4">
                <div className="glass-panel rounded-xl p-5 space-y-4 text-right">
                  <div className="flex flex-row justify-between items-center border-b border-white/5 pb-3">
                    <div className="space-y-1">
                      <h2 className="text-base font-sans font-extrabold text-white tracking-wider">
                        جریان اخبار و احساسات بازار
                      </h2>
                      <p className="text-xs font-sans text-gray-500">
                        پایش لحظه‌ای ژئوپلیتیک کلان و اخبار موثر بر نوسانات و
                        حباب طلا
                      </p>
                    </div>
                    <Newspaper className="h-5 w-5 text-[var(--accent-gold)]" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {MARKET_NEWS.map((n) => (
                      <div
                        key={n.id}
                        className="glass-panel rounded-xl p-4 space-y-3 flex flex-col justify-between border border-white/10/80 hover:border-amber-500/10 transition"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-row justify-between items-center">
                            <span className="text-[10px] data-value text-[11px] text-gray-500">
                              {n.source} • {n.time}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                                n.sentiment === "bullish"
                                  ? "bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)] border border-emerald-500/20"
                                  : "bg-[var(--accent-crimson)]/10 text-[var(--accent-crimson)] border border-rose-500/20"
                              }`}
                            >
                              {n.sentiment === "bullish"
                                ? "صعودی (Bullish)"
                                : "نزولی (Bearish)"}
                            </span>
                          </div>
                          <h4 className="font-sans font-bold text-xs text-white leading-snug">
                            {n.title}
                          </h4>
                          <p className="text-[11px] font-sans text-gray-400 leading-relaxed">
                            {n.summary}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-white/5 flex justify-start">
                          <a
                            href={n.url}
                            className="text-[10px] font-sans font-semibold text-[var(--accent-gold)] hover:text-amber-300"
                          >
                            &larr; مطالعه گزارش کامل
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            
            {activeTab === "connectors" && (
              <ConnectorsTerminal connectors={connectors} setConnectors={setConnectors} />
            )}

            {activeTab === "data_truth" && (
              <DataTruthCenter />
            )}

            {activeTab === "alerts" && (
              <AlertEngine alerts={alerts} setAlerts={setAlerts} />
            )}
            {activeTab === "replay" && (
              <MarketReplayEngine historicalData={historicalData} />
            )}
            
            {activeTab === "market_wall" && (
              <LiveMarketSources />
            )}


            {activeTab === "mazaneh_forecast" && (
              <MeltedGoldForecast />
            )}

            {activeTab === "forecast" && (
              <div className="space-y-6">
                <MazanehDealerDecisionDesk />
                <Gold18ForecastPanel />
                <NextDayForecast aiConfig={aiConfig} />
              </div>
            )}
            {activeTab === "journal" && (
              <div className="space-y-4">
                {/* Journal adding Console */}
                <div className="glass-panel rounded-xl p-5 space-y-4 text-right">
                  <h3 className="font-sans font-bold text-sm text-white border-b border-white/5 pb-2">
                    ثبت وقایع و ژورنال معاملاتی
                  </h3>

                  <form
                    onSubmit={handleAddJournal}
                    className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end text-xs text-right direction-rtl"
                  >
                    <div className="space-y-1">
                      <label className="text-gray-400 font-sans">
                        قیمت ورود:
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder={prices[activeAssetId].toString()}
                        value={newJournalEntry.entryPrice}
                        onChange={(e) =>
                          setNewJournalEntry((prev) => ({
                            ...prev,
                            entryPrice: e.target.value,
                          }))
                        }
                        className="w-full bg-black/40 border border-white/5 rounded p-2 text-white data-value text-[11px] text-left direction-ltr"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-400 font-sans">
                        قیمت خروج محقق شده:
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder={(prices[activeAssetId] * 1.01).toString()}
                        value={newJournalEntry.exitPrice}
                        onChange={(e) =>
                          setNewJournalEntry((prev) => ({
                            ...prev,
                            exitPrice: e.target.value,
                          }))
                        }
                        className="w-full bg-black/40 border border-white/5 rounded p-2 text-white data-value text-[11px] text-left direction-ltr"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-400 font-sans">
                        حجم معامله:
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="5"
                        value={newJournalEntry.quantity}
                        onChange={(e) =>
                          setNewJournalEntry((prev) => ({
                            ...prev,
                            quantity: e.target.value,
                          }))
                        }
                        className="w-full bg-black/40 border border-white/5 rounded p-2 text-white data-value text-[11px] text-left direction-ltr"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-gray-400 font-sans">
                        یادداشت کیفی / دلایل معامله:
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: تست سطح حمایتی، خروج امن قبل از انتشار اخبار..."
                        value={newJournalEntry.notes}
                        onChange={(e) =>
                          setNewJournalEntry((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        className="w-full bg-black/40 border border-white/5 rounded p-2 text-white font-sans text-right"
                      />
                    </div>

                    <div className="col-span-1 md:col-span-5 pt-2 flex flex-row justify-between items-center">
                      <div className="flex flex-row items-center gap-3">
                        <span className="text-gray-400 font-sans">
                          درجه اطمینان معامله:
                        </span>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={newJournalEntry.confidence}
                          onChange={(e) =>
                            setNewJournalEntry((prev) => ({
                              ...prev,
                              confidence: parseInt(e.target.value),
                            }))
                          }
                          className="accent-amber-500 w-28 direction-ltr"
                        />
                        <span className="text-[var(--accent-gold)] data-value text-[11px] font-bold">
                          {newJournalEntry.confidence}%
                        </span>
                      </div>

                      <button
                        type="submit"
                        className="px-5 py-2 lux-button-primary lux-button rounded font-sans"
                      >
                        ثبت در ژورنال
                      </button>
                    </div>
                  </form>
                </div>

                {/* Journal logs table list */}
                <div className="glass-panel rounded-xl p-5 space-y-4 text-right">
                  <h3 className="font-sans font-bold text-sm text-white border-b border-white/5 pb-2">
                    تاریخچه پایگاه داده ژورنال
                  </h3>

                  {journalEntries.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 text-xs font-sans">
                      هیچ گزارشی در پایگاه داده ثبت نشده است.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {journalEntries.map((j) => {
                        const meta = ASSETS_METADATA[j.assetId];
                        return (
                          <div
                            key={j.id}
                            className="p-3 bg-white/5/30 rounded-lg border border-white/5 flex flex-wrap flex-row items-center justify-between gap-4 text-xs font-sans text-gray-300 text-right"
                          >
                            <div className="flex flex-row items-center gap-4">
                              <div>
                                <p className="font-bold text-white font-sans">
                                  {meta.persianName}
                                </p>
                                <p className="text-[10px] text-gray-500 data-value text-[11px]">
                                  {j.date} •{" "}
                                  {j.type === "buy" ? "خرید" : "فروش"}
                                </p>
                              </div>
                            </div>

                            <div className="flex-grow max-w-md text-gray-400 italic bg-black/5 px-3 py-1.5 rounded border border-gray-950 text-right">
                              "{j.notes}"
                            </div>

                            <div className="flex flex-row items-center gap-6 font-sans text-right">
                              <div>
                                <p className="text-gray-500 text-[10px]">
                                  حجم:
                                </p>
                                <p className="text-gray-200 data-value text-[11px]">
                                  {j.quantity}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-[10px]">
                                  ورود/خروج:
                                </p>
                                <p className="text-gray-200 data-value text-[11px] direction-ltr">
                                  {j.entryPrice.toLocaleString()} &rarr;{" "}
                                  {j.exitPrice.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-[10px]">
                                  سود/زیان محقق شده:
                                </p>
                                <p
                                  className={`data-value text-[11px] font-bold direction-ltr ${j.pnl >= 0 ? "text-[var(--accent-emerald)]" : "text-[var(--accent-crimson)]"}`}
                                >
                                  {j.pnl >= 0 ? "+" : ""}
                                  {j.pnl.toLocaleString()}{" "}
                                  {meta.unit.includes("تومان") ? "تومان" : "$"}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}


          
          </React.Suspense>
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION DOCK */}
      <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50 bg-black/90 backdrop-blur-xl border border-gray-800/80 rounded-2xl px-2 py-2 flex justify-around items-center shadow-2xl max-w-md mx-auto" dir="rtl">
        <button
          onClick={() => setActiveTab("markets")}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
            activeTab === "markets" ? "text-[#D4AF37] bg-white/5 font-bold" : "text-gray-400 hover:text-white"
          }`}
          style={{ width: '52px', height: '48px' }}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="text-[9px] font-sans mt-0.5">داشبورد</span>
        </button>

        <button
          onClick={() => setActiveTab("terminal")}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
            activeTab === "terminal" ? "text-[#D4AF37] bg-white/5 font-bold" : "text-gray-400 hover:text-white"
          }`}
          style={{ width: '52px', height: '48px' }}
        >
          <TrendingUp className="h-4 w-4" />
          <span className="text-[9px] font-sans mt-0.5">چارت</span>
        </button>

        <button
          onClick={() => setActiveTab("market_wall")}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
            activeTab === "market_wall" ? "text-emerald-400 bg-white/5 font-bold" : "text-gray-400 hover:text-white"
          }`}
          style={{ width: '52px', height: '48px' }}
        >
          <div className="relative">
            <Activity className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <span className="text-[9px] font-sans mt-0.5">دیوار</span>
        </button>
        <button
          onClick={() => setActiveTab("hunter")}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
            activeTab === "hunter" ? "text-[#D4AF37] bg-white/5 font-bold" : "text-gray-400 hover:text-white"
          }`}
          style={{ width: '52px', height: '48px' }}
        >
          <Crosshair className="h-4 w-4" />
          <span className="text-[9px] font-sans mt-0.5">شکار</span>
        </button>

        <button
          onClick={() => setActiveTab("ai")}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
            activeTab === "ai" ? "text-[#D4AF37] bg-white/5 font-bold" : "text-gray-400 hover:text-white"
          }`}
          style={{ width: '52px', height: '48px' }}
        >
          <Sparkles className="h-4 w-4" />
          <span className="text-[9px] font-sans mt-0.5">هوش</span>
        </button>

        <button
          onClick={() => setActiveTab("portfolio")}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
            activeTab === "portfolio" ? "text-[#D4AF37] bg-white/5 font-bold" : "text-gray-400 hover:text-white"
          }`}
          style={{ width: '52px', height: '48px' }}
        >
          <Briefcase className="h-4 w-4" />
          <span className="text-[9px] font-sans mt-0.5">سبد من</span>
        </button>
        
        <button
          onClick={() => setActiveTab("connectors")}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
            activeTab === "connectors" ? "text-[#D4AF37] bg-white/5 font-bold" : "text-gray-400 hover:text-white"
          }`}
          style={{ width: '52px', height: '48px' }}
        >
          <Sliders className="h-4 w-4" />
          <span className="text-[9px] font-sans mt-0.5">اتصال</span>
        </button>
      </div>

      {/* 3. PREMIUM DEPLOYMENT STATS BAR */}
      <footer className="bg-black/95 border-t border-white/5 px-4 py-3.5 flex flex-wrap flex-row items-center justify-between text-[10px] text-gray-500 font-sans">
        <div className="flex flex-row items-center gap-4">
          <span className="text-gray-400">
            نشست کاربری فعال:{" "}
            <span className="data-value text-[11px] text-[var(--accent-gold)] font-medium">
              {localStorage.getItem("terminal_user") || "medosaseven@gmail.com"}
            </span>
          </span>
          <span className="text-gray-700">|</span>
          <span className="text-gray-400">
            شناسه دسترسی ارشد:{" "}
            <span className="data-value text-[11px] text-gray-300">
              AURUM-PRO-97X
            </span>
          </span>
        </div>
        <div className="flex flex-row items-center gap-4 text-left">
          <span>
            سطح دسترسی:{" "}
            <strong className="text-emerald-400 font-sans tracking-wider uppercase font-semibold">
              PREMIUM TERMINAL ACTIVE
            </strong>
          </span>
          <span className="text-gray-700">|</span>
          <span>© ۱۴۰۵ پنل اختصاصی مدیریت دارایی و بازار طلا • کلیه حقوق محفوظ است</span>
        </div>
      </footer>
    </div>
  );
}
