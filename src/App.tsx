import React, { useState, useEffect, useRef } from "react";
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
  AnalysisResponse
} from "./types";
import { 
  generateLiveAssets, 
  generateHistoricalCandles, 
  computeMarketStructure, 
  ASSETS_METADATA, 
  MOCK_CALENDAR, 
  MOCK_NEWS 
} from "./data";
import { 
  analyzeTechnicalIndicators, 
  triggerAIAnalysis, 
  TechnicalSignals 
} from "./services/aiEngine";
import ChartTerminal from "./components/ChartTerminal";
import AIChat from "./components/AIChat";
import PortfolioAnalytics from "./components/PortfolioAnalytics";
import VolatilityHeatmap from "./components/VolatilityHeatmap";
import StrategyBuilder, { StrategyRule, evaluateStrategyRule } from "./components/StrategyBuilder";
import { formatToShamsi, gregorianToJalali, jalaliToGregorian, PERSIAN_MONTH_NAMES, PERSIAN_MONTH_PHONETIC } from "./utils/shamsi";
import { 
  Sparkles, 
  LayoutDashboard, 
  TrendingUp, 
  Briefcase, 
  Settings, 
  Calendar, 
  Newspaper, 
  Calculator, 
  AlertTriangle, Bell, 
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
  User
} from "lucide-react";

import LoginScreen from "./components/LoginScreen";

export default function App() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(() => {
    const saved = localStorage.getItem('gold_terminal_auth');
    return saved ? JSON.parse(saved) : null;
  });

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<"markets" | "terminal" | "ai" | "portfolio" | "alerts" | "calendar" | "news" | "journal" | "connectors">("terminal");
  const [activeAssetId, setActiveAssetId] = useState<AssetId>("MELTED_GOLD");
  const [aiSubTab, setAiSubTab] = useState<"forecast" | "strategy">("forecast");
  
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
    COIN_EMAMI: 42500000,
    COIN_HALF: 23800000,
    COIN_QUARTER: 15400000,
    GOLD_GRAM: 4800000,
    USDIRT: 61450,
    USDTIRT: 61850,
    XAUUSD: 2348.50,
    GOLD_FUTURES: 2362.10,
    GOLD_CFD: 2349.00,
    GOLD_ETF: 216.80,
  });

  const [assets, setAssets] = useState<AssetInfo[]>(() => generateLiveAssets({
    MELTED_GOLD: 18450000,
    GOLD_18K: 4003000,
    GOLD_24K: 5337000,
    COIN_EMAMI: 42500000,
    COIN_HALF: 23800000,
    COIN_QUARTER: 15400000,
    GOLD_GRAM: 4800000,
    USDIRT: 61450,
    USDTIRT: 61850,
    XAUUSD: 2348.50,
    GOLD_FUTURES: 2362.10,
    GOLD_CFD: 2349.00,
    GOLD_ETF: 216.80,
  }));
  const [historicalData, setHistoricalData] = useState<Record<AssetId, Candle[]>>({
    MELTED_GOLD: [],
    GOLD_18K: [],
    GOLD_24K: [],
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
  const [technicalSignals, setTechnicalSignals] = useState<TechnicalSignals | null>(null);
  const [marketStructure, setMarketStructure] = useState<MarketStructure | null>(null);

  // AI Configuration Setup (Saved in LocalStorage)
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>(() => {
    const saved = localStorage.getItem("ai_config_terminal");
    if (saved) return JSON.parse(saved);
    return {
      provider: "gemini",
      apiKey: "",
      model: "gemini-3.5-flash",
      temperature: 0.15,
      systemPrompt: `You are the Gold Terminal Principal Quant & Geopolitical Strategist.
Use Elliott Wave, Fibonacci, and SMC (Order Blocks, CHOCH/BOS, FVG) with high mathematical rigor.
Provide high-confidence trade targets. Write beautiful structured reports.`,
    };
  });

  // Active AI Forecast Output state
  const [aiAnalysis, setAiAnalysis] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAIOverlay, setShowAIOverlay] = useState(true);

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
  const [journalEntries, setJournalEntries] = useState<TradeJournalEntry[]>(() => {
    const saved = localStorage.getItem("trade_journal");
    return saved ? JSON.parse(saved) : [
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
        notes: "Elliott Wave (3) impulsive markup breakout. Successfully hit primary FVG target.",
        confidenceScore: 85,
      },
      {
        id: "j_2",
        date: "2026-06-29",
        assetId: "XAUUSD",
        type: "buy",
        entryPrice: 2331.20,
        exitPrice: 2345.50,
        quantity: 10,
        pnl: 143,
        duration: "1 day",
        notes: "Support sweep confirmation on liquidity block. Exited cleanly prior to PCE announcement volatility.",
        confidenceScore: 90,
      }
    ];
  });
  const [newJournalEntry, setNewJournalEntry] = useState({
    notes: "",
    entryPrice: "",
    exitPrice: "",
    quantity: "",
    confidence: 85,
  });

  // Connector errors tracking
  const [connectorErrors, setConnectorErrors] = useState<Record<string, string>>({});

  // Alerts configuration state
  const [alerts, setAlerts] = useState<AlertConfig[]>([
    { id: "al_1", assetId: "MELTED_GOLD", condition: "above", value: 18700000, channel: "telegram", enabled: true },
    { id: "al_2", assetId: "XAUUSD", condition: "below", value: 2320.00, channel: "email", enabled: false },
  ]);
  const [newAlert, setNewAlert] = useState({ condition: "above" as "above" | "below", value: "", channel: "telegram" as any });
  const [injectTelegramPrice, setInjectTelegramPrice] = useState<boolean>(true);

  // Custom API pricing connectors state (Persisted in LocalStorage)
  interface APIConnector {
    id: string;
    name: string;
    providerType: "REST" | "GraphQL" | "WebSocket" | "JSON" | "CSV" | "WebScraping" | "Manual";
    endpoint: string;
    apiKey: string;
    apiKeyHeader: string;
    mappingPrice: string;
    mappingHigh: string;
    mappingLow: string;
    mappingChange: string;
    mappingVolume: string;
    isActive: boolean;
    targetAssetId: AssetId;
  }

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
        apiKey: "nobitex_pub_338a0f",
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
        apiKey: "mizanna_sec_88421b",
        apiKeyHeader: "X-Mizanna-Token",
        mappingPrice: "rates.mazaneh.value",
        mappingHigh: "rates.mazaneh.high",
        mappingLow: "rates.mazaneh.low",
        mappingChange: "rates.mazaneh.change",
        mappingVolume: "rates.mazaneh.volume",
        isActive: true,
        targetAssetId: "MELTED_GOLD",
      }
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

  const [editingConnectorId, setEditingConnectorId] = useState<string | null>(null);

  // Testing Sandbox variables
  const [testPayload, setTestPayload] = useState<string>(
    `{\n  "status": "success",\n  "data": {\n    "price": 18450000,\n    "high": 18600000,\n    "low": 18180000,\n    "change_percent": 1.42,\n    "volume_mithqal": 14850\n  }\n}`
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
    return path.split('.').reduce((acc, part) => {
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
        throw new Error(`Price path "${newConnector.mappingPrice}" resolved to undefined.`);
      }

      setTestResult({
        resolvedPrice: Number(price) || 0,
        resolvedHigh: high !== undefined ? Number(high) : null,
        resolvedLow: low !== undefined ? Number(low) : null,
        resolvedChange: change !== undefined ? Number(change) : null,
        resolvedVolume: volume !== undefined ? String(volume) : null,
      });
    } catch (err: any) {
      setTestError(err.message || "Failed to parse test JSON or resolve paths.");
    }
  };

  // System status parameters
  const [fps, setFps] = useState(60.0);
  const [latency, setLatency] = useState(14);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Shamsi calendar toggle and conversion state
  const [shamsiEnabled, setShamsiEnabled] = useState<boolean>(true);
  const [persianDigitsEnabled, setPersianDigitsEnabled] = useState<boolean>(false);
  
  // Portfolio Performance Analytics overlay state
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<boolean>(false);
  
  // Custom manual date converter state
  const [convType, setConvType] = useState<"g2s" | "s2g">("g2s");
  const [gregInput, setGregInput] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
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
            formatStyle: "both"
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
        const dateStr = `${gy}/${String(gm).padStart(2, '0')}/${String(gd).padStart(2, '0')}`;
        const d = new Date(Date.UTC(gy, gm - 1, gd));
        const weekday = d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
        setConvResult(`${dateStr} (${weekday})`);
      } catch (err) {
        setConvResult("Error converting Shamsi date.");
      }
    }
  }, [convType, gregInput, shamsiYear, shamsiMonth, shamsiDay, persianDigitsEnabled]);

  // --- INITIALIZATION ---
  useEffect(() => {
    // Generate base datasets
    const baseHistorical: Record<AssetId, Candle[]> = {
      MELTED_GOLD: generateHistoricalCandles("MELTED_GOLD", 110),
      GOLD_18K: generateHistoricalCandles("GOLD_18K", 110),
      GOLD_24K: generateHistoricalCandles("GOLD_24K", 110),
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
    setPositionInput(prev => ({
      ...prev,
      entryPrice: initialPrice,
      stopLoss: parseFloat((initialPrice * 0.99).toFixed(activeMeta.decimals)),
      takeProfit: parseFloat((initialPrice * 1.025).toFixed(activeMeta.decimals)),
    }));

    // Start FPS counter simulation
    const fpsInterval = setInterval(() => {
      setFps(parseFloat((59.2 + Math.random() * 0.8).toFixed(1)));
      setLatency(Math.floor(11 + Math.random() * 6));
    }, 2000);

    // Clock
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(fpsInterval);
      clearInterval(clockInterval);
    };
  }, []);

  // Sync pricing updates on assets
  useEffect(() => {
    const updated = generateLiveAssets(prices).map(asset => {
      let conn = connectors.find(c => c.targetAssetId === asset.id && c.isActive);
      
      // Special: map GOLD_18K to use MELTED_GOLD's Telegram scraper info if direct connector isn't set up
      if (!conn && asset.id === "GOLD_18K") {
        conn = connectors.find(c => c.targetAssetId === "MELTED_GOLD" && c.providerType === "TelegramScraper" && c.isActive);
      }

      if (conn) {
        const hasError = connectorErrors[conn.targetAssetId] || (asset.id === "GOLD_18K" && connectorErrors["MELTED_GOLD"]);
        if (hasError) {
          return { ...asset, provider: "خطا در بروزرسانی (داده لحظه‌ای در دسترس نیست)" };
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

  const connectorBackoff = useRef<Record<string, { attempts: number, nextFetchTime: number }>>({});

  // Real-time Tick Streaming & Connector Fetching
  useEffect(() => {
    // We will poll active connectors
    const fetchConnectors = async () => {
      const activeConnectors = connectors.filter(c => c.isActive);
      const now = Date.now();

      for (const conn of activeConnectors) {
        const tracker = connectorBackoff.current[conn.id] || { attempts: 0, nextFetchTime: 0 };
        
        // Skip if we are still within the backoff period
        if (now < tracker.nextFetchTime) {
          continue;
        }

        try {
          const url = conn.providerType === "TelegramScraper" ? "/api/market/abshdh" : conn.endpoint;
          const headers: Record<string, string> = {};
          if (conn.apiKey && conn.apiKeyHeader) {
            headers[conn.apiKeyHeader] = conn.apiKey;
          }
          
          const res = await fetch(url, { headers });
          if (!res.ok) throw new Error("Fetch failed");
          const json = await res.json();
          
          if (conn.providerType === "TelegramScraper" && json && json.success && json.data) {
            const mGold = json.data.MELTED_GOLD;
            const g18k = json.data.GOLD_18K;
            
            if (mGold && typeof mGold === 'number' && !isNaN(mGold)) {
              connectorBackoff.current[conn.id] = { attempts: 0, nextFetchTime: 0 };
              setConnectorErrors(prev => ({ ...prev, MELTED_GOLD: "", GOLD_18K: "" }));
              setPrices((prev) => {
                const finalGramPrice = g18k && typeof g18k === 'number' && !isNaN(g18k) ? g18k : Math.floor(mGold / 4.3318);
                const updated = { 
                  ...prev, 
                  MELTED_GOLD: mGold,
                  GOLD_18K: finalGramPrice
                };
                localStorage.setItem(`gold_terminal_last_price_MELTED_GOLD`, mGold.toString());
                localStorage.setItem(`gold_terminal_last_price_GOLD_18K`, finalGramPrice.toString());
                return updated;
              });
            }
          } else {
            let price = json;
            if (conn.mappingPrice) {
              const parts = conn.mappingPrice.split('.');
              for (const p of parts) {
                if (price && typeof price === 'object') price = price[p];
              }
            }
            
            if (typeof price === 'number' && !isNaN(price)) {
              // Success: reset backoff tracker
              connectorBackoff.current[conn.id] = { attempts: 0, nextFetchTime: 0 };
              
              setConnectorErrors(prev => ({ ...prev, [conn.targetAssetId]: "" }));
              setPrices((prev) => {
                const updated = { ...prev, [conn.targetAssetId]: price };
                // Cache it to local storage to prevent starting at 0
                localStorage.setItem(`gold_terminal_last_price_${conn.targetAssetId}`, price.toString());
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
           const delayMs = Math.min(120000, 10000 * Math.pow(1.5, tracker.attempts));
           tracker.nextFetchTime = now + delayMs;
           connectorBackoff.current[conn.id] = tracker;
           
           setConnectorErrors(prev => ({ ...prev, [conn.targetAssetId]: "خطا در اتصال" }));
        }
      }
    };

    // Initial fetch
    fetchConnectors();
    // Poll every 10 seconds
    const fetchInterval = setInterval(fetchConnectors, 10000);

    // Simulate small noise for non-connected assets
    const tickInterval = setInterval(() => {
      setPrices((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          const assetKey = key as AssetId;
          const meta = ASSETS_METADATA[assetKey];
          
          const activeConn = connectors.find(c => c.isActive && c.targetAssetId === assetKey);
          if (!activeConn && next[assetKey] !== 0) {
            // Apply small noise only for fallback assets that don't have an active connector
            const noiseRange = assetKey === "MELTED_GOLD" ? 5000 : assetKey.includes("COIN") ? 20000 : 0.95;
            const delta = (Math.random() - 0.5) * noiseRange * 0.4;
            next[assetKey] = parseFloat((next[assetKey] + delta).toFixed(meta.decimals));
          }
        });
        return next;
      });
    }, 4500);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(tickInterval);
    };
  }, [connectors]);

  // Monitor prices for alerts
  useEffect(() => {
    alerts.forEach(alert => {
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
        const conditionText = alert.condition === "above" ? "بالاتر از" : "پایین‌تر از";
        
        // Trigger browser notification
        if (alert.channel === "browser" && "Notification" in window && Notification.permission === "granted") {
          new Notification("هشدار سیستم هوشمند معاملاتی", {
            body: `قیمت ${assetName} ${conditionText} ${alert.value.toLocaleString()} قرار گرفت. قیمت فعلی: ${currentPrice.toLocaleString()}`,
            icon: "/favicon.ico"
          });
        }
        
        // Disable the alert after it's triggered
        setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, enabled: false } : a));
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
    const activePrice = prices[id];
    const activeMeta = ASSETS_METADATA[id];
    
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
    setAiAnalysis(null);

    const activeCandles = historicalData[activeAssetId];
    if (!activeCandles) return;

    try {
      let customRulesEvaluated: any[] = [];
      const savedRulesStr = localStorage.getItem("gold_terminal_strategy_rules");
      if (savedRulesStr) {
        try {
          const parsedRules = JSON.parse(savedRulesStr) as StrategyRule[];
          customRulesEvaluated = parsedRules.map(rule => {
            const evalResult = evaluateStrategyRule(rule, activeCandles, prices[activeAssetId] || 0);
            return {
              ...rule,
              isTriggered: evalResult.isTriggered,
              val1: evalResult.val1,
              val2: evalResult.val2
            };
          });
        } catch (err) {
          console.error("Error reading strategy rules for AI prompt context", err);
        }
      }

      const response = await triggerAIAnalysis(
        activeAssetId, 
        activeCandles, 
        aiConfig, 
        customRulesEvaluated, 
        injectTelegramPrice ? prices["MELTED_GOLD"] : undefined
      );
      setAiAnalysis(response);
    } catch (e) {
      console.error(e);
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
    setPositionInput(prev => ({ ...prev, quantity: activeAssetId === "MELTED_GOLD" ? 5 : 10 }));
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
    const entryPriceNum = parseFloat(newJournalEntry.entryPrice) || prices[activeAssetId];
    const exitPriceNum = parseFloat(newJournalEntry.exitPrice) || prices[activeAssetId] * 1.01;
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
      notes: newJournalEntry.notes || "Executed via institutional manual terminal interface.",
      confidenceScore: newJournalEntry.confidence,
    };

    const updated = [newEntry, ...journalEntries];
    setJournalEntries(updated);
    saveLocalStorage("trade_journal", updated);
    setNewJournalEntry({ notes: "", entryPrice: "", exitPrice: "", quantity: "", confidence: 85 });
  };

  // Alert builder trigger
  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlert.value) return;

    if (newAlert.channel === "browser" && "Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }

    const alertItem: AlertConfig = {
      id: "al_" + Date.now(),
      assetId: activeAssetId,
      condition: newAlert.condition,
      value: parseFloat(newAlert.value),
      channel: newAlert.channel,
      enabled: true,
    };

    setAlerts([alertItem, ...alerts]);
    setNewAlert({ condition: "above", value: "", channel: "telegram" });
  };

  // Delete alert config
  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter(al => al.id !== id));
  };

  // Toggle single alert config status
  const handleToggleAlert = (id: string) => {
    setAlerts(alerts.map(al => al.id === id ? { ...al, enabled: !al.enabled } : al));
  };

  // Save AI Config modifications
  const handleSaveAIConfig = (newCfg: AIProviderConfig) => {
    setAiConfig(newCfg);
    saveLocalStorage("ai_config_terminal", newCfg);
  };

  const activeAssetInfo = assets.find((a) => a.id === activeAssetId) || assets[0];

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-[#030611] text-gray-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-white">
      
      {/* 1. INSTITUTIONAL TOP TICKER STREAM */}
      <div className="bg-black/90 border-b border-gray-900 px-4 py-2.5 flex flex-wrap items-center justify-between text-[11px] font-mono select-none gap-3">
        <div className="flex items-center gap-4 overflow-x-auto py-1 scrollbar-none scroll-smooth">
          {assets.map((as) => (
            <button
              key={as.id}
              onClick={() => handleAssetSwitch(as.id)}
              className={`flex items-center gap-2 px-2.5 py-1 rounded transition duration-200 shrink-0 ${
                activeAssetId === as.id 
                  ? "bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold" 
                  : "hover:bg-gray-900 border border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <span>{as.persianName}</span>
              <span className="font-sans font-normal opacity-60">({as.symbol})</span>
              <span className={`font-semibold ${as.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {as.currentPrice.toLocaleString(undefined, { maximumFractionDigits: ASSETS_METADATA[as.id].decimals })}
              </span>
              <span className={`text-[10px] flex items-center ${as.change >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                {as.change >= 0 ? <ArrowUpRight className="h-3 w-3 inline" /> : <ArrowDownRight className="h-3 w-3 inline" />}
                {as.change}%
              </span>
            </button>
          ))}
        </div>

        {/* Global Connection & Server Parameters */}
        <div className="flex items-center gap-4 text-gray-500 shrink-0 font-sans flex-row">
          <div className="hidden md:flex items-center gap-1.5 bg-gray-900 px-2 py-0.5 rounded border border-gray-800 text-[10px]">
            <span className="text-gray-500">تامین‌کننده قیمت:</span>
            <select 
              value={provider} 
              onChange={(e) => setProvider(e.target.value)}
              className="bg-transparent border-none text-amber-400 focus:outline-none font-semibold cursor-pointer font-sans"
            >
              {providersList.map((pr, i) => (
                <option key={i} value={pr} className="bg-gray-950 text-white">{pr}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-gray-400 font-sans">بروزرسانی زنده</span>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-300 font-semibold font-mono">{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* 2. CORE LAYOUT CHAMBER */}
      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        
        {/* SIDE NAV-BAR */}
        <aside className="w-full lg:w-64 bg-[#050915] border-b lg:border-b-0 lg:border-r border-gray-900 shrink-0 flex flex-col justify-between p-4 gap-4 z-20">
          <div className="space-y-6">
            
            {/* TERMINAL HEADER BRAND */}
            <div className="flex items-center gap-2.5 px-2">
              <div className="h-8 w-8 rounded bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <Layers className="h-4.5 w-4.5 text-black font-extrabold" />
              </div>
              <div>
                <h1 className="font-sans font-extrabold text-sm text-white tracking-wide">سامانه محاسباتی طلا</h1>
                <p className="text-[9px] text-amber-500 font-sans font-medium tracking-wider">ترمینال هوشمند کوانت v4.1</p>
              </div>
            </div>

            {/* WATCHLIST QUICK CARDS */}
            <div className="space-y-1.5 text-right">
              <span className="text-[10px] font-sans text-gray-500 px-2 tracking-wider">دیده‌بان فعال بازار</span>
              <div className="grid grid-cols-1 gap-1">
                {assets.map((as) => (
                  <button
                    key={as.id}
                    onClick={() => handleAssetSwitch(as.id)}
                    className={`w-full text-right px-3 py-2 rounded-lg transition-all flex flex-row justify-between items-center ${
                      activeAssetId === as.id 
                        ? "bg-amber-500/10 border border-amber-500/20 text-white" 
                        : "hover:bg-gray-900/50 border border-transparent text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <div className="text-right">
                      <p className="text-xs font-semibold font-sans">{as.persianName}</p>
                      <p className="text-[10px] font-mono text-gray-500">{as.symbol} • {as.provider.split(" ")[0]}</p>
                    </div>
                    <div className="text-left font-mono">
                      <p className={`text-xs font-mono font-bold ${as.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {as.currentPrice.toLocaleString(undefined, { maximumFractionDigits: ASSETS_METADATA[as.id].decimals })}
                      </p>
                      <p className={`text-[10px] font-mono ${as.change >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {as.change >= 0 ? "+" : ""}{as.change}%
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* DYNAMIC SYSTEM MENU TABS */}
            <nav className="space-y-1 text-right">
              <span className="text-[10px] font-sans text-gray-500 px-2 tracking-wider">منوهای ناوبری سیستم</span>
              
              <button
                onClick={() => setActiveTab("markets")}
                className={`w-full flex flex-row items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  activeTab === "markets" ? "bg-amber-500/10 text-amber-400 font-bold border-r-2 border-amber-500" : "text-gray-400 hover:text-white hover:bg-gray-900/30"
                }`}
              >
                <div className="flex flex-row items-center gap-3">
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  <span className="font-sans">داشبورد بازارها</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("terminal")}
                className={`w-full flex flex-row items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  activeTab === "terminal" ? "bg-amber-500/10 text-amber-400 font-bold border-r-2 border-amber-500" : "text-gray-400 hover:text-white hover:bg-gray-900/30"
                }`}
              >
                <div className="flex flex-row items-center gap-3">
                  <TrendingUp className="h-4 w-4 shrink-0" />
                  <span className="font-sans">چارت ترمینال طلا</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("ai")}
                className={`w-full flex flex-row items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  activeTab === "ai" ? "bg-amber-500/10 text-amber-400 font-bold border-r-2 border-amber-500" : "text-gray-400 hover:text-white hover:bg-gray-900/30"
                }`}
              >
                <div className="flex flex-row items-center gap-3">
                  <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
                  <span className="font-sans">پیش‌بینی هوشمند عمیق</span>
                </div>
                <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 py-0.2 rounded font-bold font-mono">زنده</span>
              </button>

              <button
                onClick={() => setActiveTab("portfolio")}
                className={`w-full flex flex-row items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  activeTab === "portfolio" ? "bg-amber-500/10 text-amber-400 font-bold border-r-2 border-amber-500" : "text-gray-400 hover:text-white hover:bg-gray-900/30"
                }`}
              >
                <div className="flex flex-row items-center gap-3">
                  <Briefcase className="h-4 w-4 shrink-0" />
                  <span className="font-sans">سبد دارایی و مدیریت ریسک</span>
                </div>
                {positions.length > 0 && (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-mono px-1.5 py-0.2 rounded-full font-bold">
                    {positions.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("alerts")}
                className={`w-full flex flex-row items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  activeTab === "alerts" ? "bg-amber-500/10 text-amber-400 font-bold border-r-2 border-amber-500" : "text-gray-400 hover:text-white hover:bg-gray-900/30"
                }`}
              >
                <div className="flex flex-row items-center gap-3">
                  <Bell className="h-4 w-4 shrink-0" />
                  <span className="font-sans">سیستم هشدارهای قیمت</span>
                </div>
                {alerts.filter(a => a.enabled).length > 0 && (
                  <span className="text-[9px] bg-rose-500/20 text-rose-400 font-mono px-1.5 py-0.2 rounded-full font-bold">
                    {alerts.filter(a => a.enabled).length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("calendar")}
                className={`w-full flex flex-row items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  activeTab === "calendar" ? "bg-amber-500/10 text-amber-400 font-bold border-r-2 border-amber-500" : "text-gray-400 hover:text-white hover:bg-gray-900/30"
                }`}
              >
                <div className="flex flex-row items-center gap-3">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span className="font-sans">تقویم اقتصادی جهان</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("news")}
                className={`w-full flex flex-row items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  activeTab === "news" ? "bg-amber-500/10 text-amber-400 font-bold border-r-2 border-amber-500" : "text-gray-400 hover:text-white hover:bg-gray-900/30"
                }`}
              >
                <div className="flex flex-row items-center gap-3">
                  <Newspaper className="h-4 w-4 shrink-0" />
                  <span className="font-sans">اخبار و احساسات بازار</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("journal")}
                className={`w-full flex flex-row items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  activeTab === "journal" ? "bg-amber-500/10 text-amber-400 font-bold border-r-2 border-amber-500" : "text-gray-400 hover:text-white hover:bg-gray-900/30"
                }`}
              >
                <div className="flex flex-row items-center gap-3">
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="font-sans">دفترچه یادداشت معاملات</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("connectors")}
                className={`w-full flex flex-row items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  activeTab === "connectors" ? "bg-amber-500/10 text-amber-400 font-bold border-r-2 border-amber-500" : "text-gray-400 hover:text-white hover:bg-gray-900/30"
                }`}
              >
                <div className="flex flex-row items-center gap-3">
                  <Sliders className="h-4 w-4 shrink-0 text-amber-500" />
                  <span className="font-sans">اتصال‌دهنده‌های داده (API)</span>
                </div>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded font-bold font-mono">جدید</span>
              </button>
            </nav>
          </div>

          {/* ASSETS SYSTEM FOOTER DECORATION */}
          <div className="pt-4 border-t border-gray-900 space-y-1.5 text-[10px] text-gray-500 font-sans text-right">
            <div className="flex flex-row justify-between items-center bg-gray-950 p-2 rounded border border-gray-900 mb-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 bg-gray-800 rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 text-amber-500" />
                </div>
                <span className="text-gray-300 font-bold truncate max-w-[100px]">{user.name}</span>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('gold_terminal_auth');
                  setUser(null);
                }}
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-1 rounded transition"
              >
                خروج
              </button>
            </div>
            <div className="flex flex-row justify-between">
              <span>تاخیر اتصال:</span>
              <span className="text-emerald-400 font-bold font-mono">{latency} ms</span>
            </div>
            <div className="flex flex-row justify-between">
              <span>نرخ فریم:</span>
              <span className="text-emerald-400 font-bold font-mono">{fps} FPS</span>
            </div>
            <div className="flex flex-row justify-between">
              <span>پایگاه داده:</span>
              <span className="text-gray-300">محلی + سرور ابری</span>
            </div>
          </div>
        </aside>

        {/* MAIN DYNAMIC CHAIR ORCHESTRATOR */}
        <main className="flex-grow p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-42px)]">
          
          {/* ACTIVE TAB VIEWS */}
          {activeTab === "markets" && (
            <div className="space-y-4">
              
              {/* Tehran Gold Bazaar vs global arbitrage overview card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                <div className="glass-panel rounded-xl p-4 flex flex-row items-center justify-between col-span-1 md:col-span-2 relative overflow-hidden">
                  <div className="space-y-2 z-10">
                    <span className="text-[10px] font-sans bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">شاخص اختلاف قیمت تهران و بازار جهانی</span>
                    <h3 className="font-sans font-extrabold text-lg text-white">محاسبه آربیتراژ داخلی طلا</h3>
                    <p className="text-xs text-gray-400 max-w-lg leading-relaxed font-sans">
                      قیمت طلای آب‌شده داخلی به صورت روزانه بر اساس نرخ ارز بازار تهران و انس جهانی طلا محاسبه می‌شود. در حال حاضر قیمت انس جهانی در سطح <strong className="font-mono">${prices.XAUUSD.toLocaleString()}</strong> با نرخ دلار بازار تطبیق یافته و حباب ضمنی طلا در بازار داخلی معادل <strong className="text-emerald-400 font-mono">+۱.۲۴٪</strong> برآورد می‌گردد.
                    </p>
                  </div>
                  <Coins className="h-16 w-16 text-amber-500/10 absolute left-4 top-4" />
                </div>

                <div className="glass-panel-gold rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-sans text-amber-500 uppercase tracking-wider">فرمول تبدیل مثقال به گرم ۱۸ عیار</p>
                    <h2 className="text-2xl font-mono font-extrabold text-white mt-1">
                      {Math.round(prices.MELTED_GOLD / 4.608).toLocaleString()} <span className="text-xs font-sans text-gray-400">تومان / گرم</span>
                    </h2>
                  </div>
                  <div className="text-[11px] text-gray-400 border-t border-amber-500/10 pt-2 font-sans leading-normal">
                    مبنای محاسبه استاندارد: هر مثقال طلا معادل ۴.۶۰۸۳ گرم طلای ۱۷ عیار (با عیار ۷۰۵) می‌باشد.
                  </div>
                </div>
              </div>

              {/* Volatility Heatmap Utility Block */}
              <VolatilityHeatmap
                assets={assets}
                historicalData={historicalData}
                prices={prices}
                onAssetSelect={handleAssetSwitch}
                activeAssetId={activeAssetId}
              />

              {/* Bento grid containing live market parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-right">
                {assets.map((as) => {
                  const meta = ASSETS_METADATA[as.id];
                  return (
                    <div 
                      key={as.id} 
                      onClick={() => handleAssetSwitch(as.id)}
                      className="glass-panel hover:bg-gray-900/30 rounded-xl p-4 space-y-3 transition duration-200 cursor-pointer border border-gray-800/80 hover:border-amber-500/20 flex flex-col justify-between"
                    >
                      <div className="flex flex-row justify-between items-start">
                        <div className="text-right">
                          <h4 className="font-sans font-bold text-sm text-white">{as.persianName}</h4>
                          <span className="text-[10px] font-mono text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded">{as.symbol}</span>
                        </div>
                        <span className="text-[10px] font-sans text-gray-500">{as.provider}</span>
                      </div>

                      <div className="pt-2 flex flex-row justify-between items-end">
                        <div className="text-right">
                          <p className="text-[10px] text-gray-500 font-sans">آخرین نرخ بازار</p>
                          <p className="text-xl font-mono font-extrabold text-white">
                            {as.currentPrice.toLocaleString(undefined, { maximumFractionDigits: meta.decimals })} <span className="text-xs font-sans text-gray-400 font-normal">{meta.unit.split("/")[0]}</span>
                          </p>
                        </div>
                        <div className="text-left font-mono">
                          <p className={`text-xs font-bold ${as.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {as.change >= 0 ? "+" : ""}{as.change}%
                          </p>
                          <p className="text-[10px] text-gray-500 font-sans">
                            {as.changeNominal >= 0 ? "+" : ""}{as.changeNominal.toLocaleString()} {meta.unit.includes("تومان") ? "تومان" : "USD"}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-900/60 grid grid-cols-2 gap-2 text-[10px] font-sans text-gray-400 flex-row">
                        <div className="text-right">
                          <span className="text-gray-600">بیشترین (۲۴ساعت):</span>{" "}
                          <span className="text-gray-300 font-semibold font-mono">{as.high24h.toLocaleString(undefined, { maximumFractionDigits: meta.decimals })}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-600">کمترین (۲۴ساعت):</span>{" "}
                          <span className="text-gray-300 font-semibold font-mono">{as.low24h.toLocaleString(undefined, { maximumFractionDigits: meta.decimals })}</span>
                        </div>
                        <div className="col-span-2 text-right">
                          <span className="text-gray-600">حجم معاملات (۲۴ساعت):</span>{" "}
                          <span className="text-gray-300 font-semibold font-mono">{as.volume24h}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {activeTab === "terminal" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-stretch">
              
              {/* PRIMARY TRADINGVIEW GRADE CHART AREA */}
              <div className="xl:col-span-2 flex flex-col gap-4">
                <div className="h-[520px] shrink-0">
                  <ChartTerminal
                    assetId={activeAssetId}
                    candles={historicalData[activeAssetId] || []}
                    marketStructure={marketStructure || { orderBlocks: [], fvgs: [], waves: [], liquidityZones: [], supportLines: [], resistanceLines: [] }}
                    showAIOverlay={showAIOverlay}
                    onToggleAIOverlay={() => setShowAIOverlay(!showAIOverlay)}
                  />
                </div>

                {/* Sub technical dashboard bar under chart */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-right">
                  <div className="glass-panel p-3 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] text-gray-500 font-sans">شاخص مومنتوم (RSI)</span>
                    <div className="flex flex-row justify-between items-baseline gap-2 mt-1">
                      <span className="text-lg font-mono font-extrabold text-white">{technicalSignals?.rsi || 50}</span>
                      <span className={`text-[10px] font-sans ${
                        (technicalSignals?.rsi || 50) > 70 ? "text-rose-400" : (technicalSignals?.rsi || 50) < 30 ? "text-emerald-400" : "text-gray-400"
                      }`}>
                        {(technicalSignals?.rsi || 50) > 70 ? "اشباع خرید" : (technicalSignals?.rsi || 50) < 30 ? "اشباع فروش" : "متعادل"}
                      </span>
                    </div>
                  </div>

                  <div className="glass-panel p-3 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] text-gray-500 font-sans">قدرت روند بازار</span>
                    <div className="flex flex-row justify-between items-baseline gap-2 mt-1">
                      <span className="text-lg font-mono font-extrabold text-amber-400">{technicalSignals?.trendStrength || 50}%</span>
                      <span className="text-[10px] text-gray-400 font-sans">کوانت ADX</span>
                    </div>
                  </div>

                  <div className="glass-panel p-3 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] text-gray-500 font-sans">نوسان‌پذیری ATR</span>
                    <span className="text-sm font-mono font-bold text-gray-300 mt-1 text-left">
                      {technicalSignals?.atr.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </span>
                  </div>

                  <div className="glass-panel p-3 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] text-gray-500 font-sans">ماتریس تلاقی EMA</span>
                    <span className="text-sm font-sans font-bold text-gray-300 mt-1 text-left">
                      {technicalSignals ? (technicalSignals.ema20 > technicalSignals.ema50 ? "تلاقی صعودی" : "تلاقی نزولی") : "نامشخص"}
                    </span>
                  </div>
                </div>
              </div>

              {/* INTEGRATED CHAT AND CONSOLE PANEL */}
              <div className="flex flex-col h-[520px] xl:h-auto min-h-[500px]">
                <AIChat
                  activeAsset={activeAssetInfo}
                  marketStructure={marketStructure || { orderBlocks: [], fvgs: [], waves: [], liquidityZones: [], supportLines: [], resistanceLines: [] }}
                  customConfig={aiConfig}
                />
              </div>

            </div>
          )}

          {activeTab === "ai" && (
            <div className="space-y-4">
              
              {/* AI MODULE SUB-TABS */}
              <div className="flex border-b border-gray-900 gap-6 pb-2 mb-4">
                <button
                  onClick={() => setAiSubTab("forecast")}
                  className={`pb-2 text-xs font-mono uppercase tracking-wider transition relative cursor-pointer ${
                    aiSubTab === "forecast" 
                      ? "text-amber-400 font-extrabold" 
                      : "text-gray-500 hover:text-white"
                  }`}
                >
                  <span className="font-sans">ماتریس پیش‌بینی هوشمند</span>
                  {aiSubTab === "forecast" && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500"></div>
                  )}
                </button>
                <button
                  onClick={() => setAiSubTab("strategy")}
                  className={`pb-2 text-xs font-sans uppercase tracking-wider transition relative cursor-pointer ${
                    aiSubTab === "strategy" 
                      ? "text-amber-400 font-extrabold" 
                      : "text-gray-500 hover:text-white"
                  }`}
                >
                  <span className="font-sans">قوانین اتوماسیون و استراتژی</span>
                  {aiSubTab === "strategy" && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500"></div>
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
                        <Sparkles className="h-5 w-5 text-amber-400" />
                        <h2 className="text-base font-sans font-bold text-white tracking-wide">موتور مدل‌سازی هوشمند عمیق طلا</h2>
                      </div>
                      <p className="text-xs text-gray-400 max-w-xl font-sans">
                        مدل‌های هوش مصنوعی اختصاصی ما ساختارهای نقدینگی، اوردربلاک‌ها و الگوهای امواج الیوت را جهت استخراج گزارش‌های معاملاتی تحلیل می‌کنند. انتخاب مدل محاسباتی فعال در تنظیمات سیستم قابل دسترسی است.
                      </p>
                    </div>

                    <div className="flex flex-wrap flex-row items-center gap-2">
                      <button
                        onClick={() => setInjectTelegramPrice(!injectTelegramPrice)}
                        className={`flex flex-row items-center gap-2 px-3.5 py-2 border rounded-lg text-xs font-semibold transition cursor-pointer font-sans ${
                          injectTelegramPrice 
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-400" 
                            : "bg-gray-950/40 border-gray-900 text-gray-500"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${injectTelegramPrice ? "bg-amber-500 animate-pulse" : "bg-gray-600"}`} />
                        <span>تزریق نرخ زنده تلگرام ({prices["MELTED_GOLD"] ? prices["MELTED_GOLD"].toLocaleString() : "---"} تومان)</span>
                      </button>

                      <button
                        onClick={handleAIAnalysisTrigger}
                        disabled={isAnalyzing}
                        className="flex flex-row items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold text-xs rounded-lg transition hover:brightness-110 disabled:opacity-50 cursor-pointer font-sans"
                      >
                        <RefreshCw className={`h-4 w-4 ${isAnalyzing ? "animate-spin" : ""}`} />
                        <span>{isAnalyzing ? "در حال تحلیل جریان‌های زنده..." : "بازسازی پیش‌بینی هوشمند"}</span>
                      </button>
                    </div>
                  </div>

              {isAnalyzing ? (
                <div className="glass-panel rounded-xl p-12 text-center space-y-4 font-sans">
                  <RefreshCw className="h-10 w-10 text-amber-400 animate-spin mx-auto" />
                  <p className="text-sm text-gray-300 font-medium">در حال فراخوانی الگوریتم هوش مصنوعی مستقر بر سرور...</p>
                  <p className="text-xs text-gray-500">تطبیق قراردادهای زنده مثقال، انس جهانی و COMEX با ساختارهای SMC.</p>
                </div>
              ) : aiAnalysis ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  
                  {/* Left Column: Metric scores & Setup Targets */}
                  <div className="space-y-4 col-span-1">
                    
                    {/* Score dials */}
                    <div className="glass-panel rounded-xl p-4 space-y-4 text-center">
                      <span className="text-[10px] font-sans text-gray-500 tracking-wider">معیارهای ارزیابی کوانت</span>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border border-gray-900 rounded-lg p-3 bg-gray-950/40">
                          <p className="text-2xl font-mono font-extrabold text-amber-400">{aiAnalysis.confidenceScore}%</p>
                          <p className="text-[10px] text-gray-500 font-sans mt-1">ضریب اطمینان مدل</p>
                        </div>
                        <div className="border border-gray-900 rounded-lg p-3 bg-gray-950/40">
                          <p className="text-2xl font-mono font-extrabold text-emerald-400">{aiAnalysis.probabilityScore}%</p>
                          <p className="text-[10px] text-gray-500 font-sans mt-1">شاخص احتمال پیروزی</p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="text-[10px] text-gray-500 font-sans block">فاز چرخه بازار شناسایی‌شده</span>
                        <span className="text-xs font-sans font-semibold text-white mt-1 bg-gray-900 px-3 py-1.5 rounded-full inline-block border border-gray-800">
                          {aiAnalysis.marketPhase}
                        </span>
                      </div>
                    </div>

                    {/* Trade Setup Targets */}
                    <div className="glass-panel rounded-xl p-4 space-y-3.5 text-right">
                      <span className="text-[10px] font-sans text-amber-500 tracking-wider uppercase block">تنظیمات پیشنهادی معامله سازمانی</span>
                      
                      <div className="space-y-2">
                        <div className="flex flex-row justify-between text-xs font-sans">
                          <span className="text-gray-400">قیمت ورود پیشنهادی:</span>
                          <span className="font-mono font-bold text-white">{aiAnalysis.tradeSetup.entry.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-row justify-between text-xs font-sans">
                          <span className="text-rose-400 font-semibold">حد ضرر (SL):</span>
                          <span className="font-mono font-bold text-rose-400">{aiAnalysis.tradeSetup.stopLoss.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-row justify-between text-xs font-sans">
                          <span className="text-emerald-400 font-semibold">حد سود اول (TP1):</span>
                          <span className="font-mono font-bold text-emerald-400">{aiAnalysis.tradeSetup.takeProfit1.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-row justify-between text-xs font-sans">
                          <span className="text-emerald-400 font-semibold">حد سود دوم (TP2):</span>
                          <span className="font-mono font-bold text-emerald-400">{aiAnalysis.tradeSetup.takeProfit2.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-gray-900 pt-2.5 flex flex-row justify-between text-xs font-sans">
                          <span className="text-gray-400">نسبت ریسک به ریوارد:</span>
                          <span className="font-mono font-bold text-amber-400">{aiAnalysis.tradeSetup.riskRewardRatio} : ۱</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setPositionInput({
                            type: "buy",
                            entryPrice: aiAnalysis.tradeSetup.entry,
                            stopLoss: aiAnalysis.tradeSetup.stopLoss,
                            takeProfit: aiAnalysis.tradeSetup.takeProfit1,
                            quantity: activeAssetId === "MELTED_GOLD" ? 5 : 10,
                          });
                          setActiveTab("portfolio");
                        }}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded-lg transition mt-2 font-sans"
                      >
                        پیاده‌سازی معامله پیشنهادی در سبد آزمایشی
                      </button>
                    </div>

                    {/* Scenario forecasts */}
                    <div className="glass-panel rounded-xl p-4 space-y-3 text-right">
                      <span className="text-[10px] font-sans text-gray-500 tracking-wider uppercase block font-semibold">شبیه‌ساز سناریوهای بازار</span>
                      
                      <div className="space-y-2.5 text-xs font-sans">
                        <div className="space-y-1">
                          <p className="text-emerald-400 font-semibold text-right">مسیر حرکتی اصلی (Primary Pathway):</p>
                          <p className="text-gray-300 bg-gray-950/30 p-2 rounded border border-gray-900 text-[11px] leading-relaxed text-right">{aiAnalysis.scenarios.primary}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-amber-400 font-semibold text-right">مسیر حرکتی جایگزین (Alternative Pathway):</p>
                          <p className="text-gray-300 bg-gray-950/30 p-2 rounded border border-gray-900 text-[11px] leading-relaxed text-right">{aiAnalysis.scenarios.alternative}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-rose-400 font-semibold text-right">شرایط ابطال سناریو (Invalidation Threshold):</p>
                          <p className="text-gray-300 bg-gray-950/30 p-2 rounded border border-gray-900 text-[11px] leading-relaxed text-right">{aiAnalysis.scenarios.invalidation}</p>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Markdown Details report */}
                  <div className="col-span-1 lg:col-span-2 space-y-4 text-right">
                    <div className="glass-panel rounded-xl p-6 space-y-4">
                      <div className="flex flex-row justify-between items-center border-b border-gray-900 pb-3">
                        <h3 className="font-sans font-extrabold text-sm text-white tracking-wider">گزارش جامع تحلیل الگوریتمی و هوشمند طلا</h3>
                        <span className="text-[10px] font-mono text-gray-500">زمان صدور: {new Date(aiAnalysis.timestamp).toLocaleTimeString()}</span>
                      </div>
                      
                      {/* Markdown reader container */}
                      <div className="prose prose-invert max-w-none text-xs text-gray-300 leading-relaxed space-y-4 font-sans text-right">
                        {aiAnalysis.detailedAnalysisMarkdown.split("\n").map((line, idx) => {
                          if (line.startsWith("### ")) {
                            return <h4 key={idx} className="text-sm font-display font-bold text-amber-400 mt-4 mb-2">{line.replace("### ", "")}</h4>;
                          }
                          if (line.startsWith("## ")) {
                            return <h3 key={idx} className="text-base font-display font-bold text-amber-500 mt-5 mb-2.5 border-b border-gray-900 pb-1">{line.replace("## ", "")}</h3>;
                          }
                          if (line.startsWith("# ")) {
                            return <h2 key={idx} className="text-lg font-display font-extrabold text-white mt-6 mb-3">{line.replace("# ", "")}</h2>;
                          }
                          if (line.startsWith("- ") || line.startsWith("* ")) {
                            return (
                              <ul key={idx} className="list-disc pl-5 space-y-1 text-gray-300">
                                <li>{line.substring(2)}</li>
                              </ul>
                            );
                          }
                          if (line.startsWith("> ")) {
                            return <blockquote key={idx} className="border-l-2 border-amber-500 pl-3 py-1 my-2 bg-amber-500/5 text-gray-400 italic">{line.replace("> ", "")}</blockquote>;
                          }
                          return <p key={idx} className="text-gray-300 text-[11px] leading-relaxed">{line}</p>;
                        })}
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="glass-panel rounded-xl p-8 text-center text-gray-400 font-sans">
                  هنوز خروجی تحلیلی تولید نشده است. برای فراخوانی الگوریتم هوشمند، دکمه بالا را کلیک کنید.
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
                  <span className="text-[10px] font-sans bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                    مدیریت ریسک سازمانی
                  </span>
                  <h2 className="font-sans font-extrabold text-lg text-white">مدیریت سبد دارایی و معاملات شبیه‌سازی شده</h2>
                  <p className="text-xs text-gray-400 max-w-3xl leading-relaxed">
                    پیگیری زنده موقعیت‌های معاملاتی باز، تخمین نسبت بهینه حجم سرمایه‌گذاری بر اساس معیار کلی (Kelly) و تحلیل آماری بازدهی کل معاملات.
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
                  <p className="text-[10px] text-gray-500 font-sans">سرمایه حساب شبیه‌سازی شده</p>
                  <p className="text-2xl font-mono font-extrabold text-white">${accountBalance.toLocaleString()}</p>
                </div>
                
                <div className="glass-panel rounded-xl p-4 space-y-1">
                  <p className="text-[10px] text-gray-500 font-sans">تعداد موقعیت‌های فعال</p>
                  <p className="text-2xl font-mono font-extrabold text-white">
                    {positions.length} <span className="text-xs font-sans text-gray-400">موقعیت فعال</span>
                  </p>
                </div>

                <div className="glass-panel rounded-xl p-4 space-y-1">
                  <p className="text-[10px] text-gray-500 font-sans">سود و زیان شناور کل</p>
                  <p className={`text-2xl font-mono font-extrabold ${
                    positions.reduce((acc, curr) => acc + curr.pnl, 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    ${positions.reduce((acc, curr) => acc + curr.pnl, 0).toLocaleString()}
                  </p>
                </div>

                <div className="glass-panel rounded-xl p-4 space-y-1">
                  <p className="text-[10px] text-gray-500 font-sans">حجم پیشنهادی معیار کلی (Kelly)</p>
                  <p className="text-2xl font-mono font-extrabold text-amber-400">
                    {((riskPercent * 1.5) / leverage).toFixed(1)}% <span className="text-xs font-sans text-gray-400">/ هر معامله</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                
                {/* Kelly criterion Calculator and Trigger Order Form */}
                <div className="space-y-4 col-span-1">
                  
                  {/* Position Form */}
                  <div className="glass-panel rounded-xl p-5 space-y-4 text-right">
                    <h3 className="font-sans font-bold text-sm text-white border-b border-gray-900 pb-2">پنل ورود به معامله و مدیریت ریسک</h3>
                    
                    <form onSubmit={handlePlaceOrder} className="space-y-3 text-xs text-right">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPositionInput(prev => ({ ...prev, type: "buy" }))}
                          className={`py-2 rounded font-sans font-bold transition ${positionInput.type === "buy" ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.25)]" : "bg-gray-900 text-gray-400"}`}
                        >
                          خرید (LONG)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPositionInput(prev => ({ ...prev, type: "sell" }))}
                          className={`py-2 rounded font-sans font-bold transition ${positionInput.type === "sell" ? "bg-rose-500 text-black shadow-[0_0_15px_rgba(239,68,68,0.25)]" : "bg-gray-900 text-gray-400"}`}
                        >
                          فروش (SHORT)
                        </button>
                      </div>

                      <div className="space-y-1 text-right">
                        <label className="text-gray-400 font-sans">قیمت ورود پیشنهادی:</label>
                        <input
                          type="number"
                          step="any"
                          value={positionInput.entryPrice}
                          onChange={(e) => setPositionInput(prev => ({ ...prev, entryPrice: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white font-mono text-left"
                        />
                      </div>

                      <div className="space-y-1 text-right">
                        <label className="text-gray-400 font-sans">ضریب اهرم معاملاتی ({leverage}x):</label>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={leverage}
                          onChange={(e) => setLeverage(parseInt(e.target.value))}
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
                          <label className="text-rose-400 font-sans">حد ضرر (SL):</label>
                          <input
                            type="number"
                            step="any"
                            value={positionInput.stopLoss}
                            onChange={(e) => setPositionInput(prev => ({ ...prev, stopLoss: parseFloat(e.target.value) || 0 }))}
                            className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-rose-300 font-mono text-left"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-emerald-400 font-sans">حد سود (TP):</label>
                          <input
                            type="number"
                            step="any"
                            value={positionInput.takeProfit}
                            onChange={(e) => setPositionInput(prev => ({ ...prev, takeProfit: parseFloat(e.target.value) || 0 }))}
                            className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-emerald-300 font-mono text-left"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 text-right">
                        <label className="text-gray-400 font-sans">حجم معامله (تعداد قرارداد):</label>
                        <input
                          type="number"
                          step="any"
                          value={positionInput.quantity}
                          onChange={(e) => setPositionInput(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))}
                          className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white font-mono text-left"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs rounded transition mt-3 font-sans"
                      >
                        ثبت معامله شبیه‌سازی شده {positionInput.type === "buy" ? "خرید" : "فروش"}
                      </button>
                    </form>
                  </div>

                  {/* Kelly size indicator details */}
                  <div className="glass-panel rounded-xl p-4 space-y-3 text-xs leading-relaxed text-right">
                    <div className="flex flex-row items-center gap-1 text-amber-500">
                      <Calculator className="h-4 w-4" />
                      <h4 className="font-bold font-sans">مدل محاسبه حجم بهینه کلی (Kelly)</h4>
                    </div>
                    <p className="text-gray-400 font-sans">
                      معیار کلی به صورت ریاضی جهت مدیریت بهینه حجم معاملات بر اساس احتمال برد و نسبت سود به ضرر به صورت زیر تعیین می‌گردد:
                    </p>
                    <code className="block bg-gray-950 border border-gray-900 p-2 rounded text-center text-amber-400 font-mono text-[10px]">
                      K% = W - (1 - W) / R
                    </code>
                    <p className="text-gray-400 font-sans">
                      با فرض احتمال برد ۶۵٪ (W) طبق خروجی مدل هوشمند و نسبت ریوارد به ریسک متوسط ۲.۲ به ۱ (R)، معیار کلی حجم بهینه را بر اساس سرمایه کل محاسبه می‌کند.
                    </p>
                  </div>

                </div>

                {/* Right Column: Active Simulation Positions list */}
                <div className="col-span-1 lg:col-span-2 space-y-4 text-right">
                  <div className="glass-panel rounded-xl p-5 space-y-4">
                    <h3 className="font-sans font-bold text-sm text-white border-b border-gray-900 pb-2">موقعیت‌های معاملاتی باز فعال در ترمینال</h3>
                    
                    {positions.length === 0 ? (
                      <div className="py-12 text-center text-gray-500 text-xs font-sans">
                        هیچ معامله فعال شبیه‌سازی شده‌ای وجود ندارد. از طریق فرم منوی کناری می‌توانید معامله ثبت کنید.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs font-sans">
                          <thead>
                            <tr className="text-gray-500 border-b border-gray-900 pb-2">
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
                              const delta = (currentPrice - p.entryPrice) * multiplier;
                              const isMelted = p.assetId === "MELTED_GOLD";
                              const computedPnl = isMelted 
                                  ? (delta / 1000) * p.quantity * p.leverage // Simulated scale factor
                                  : delta * p.quantity * p.leverage;

                              return (
                                <tr key={p.id} className="border-b border-gray-900/60 hover:bg-gray-900/20">
                                  <td className="py-3 text-right">
                                    <p className="font-semibold text-white font-sans">{meta.persianName}</p>
                                    <p className="text-[10px] text-gray-500 font-mono">{meta.symbol}</p>
                                  </td>
                                  <td className="text-right">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      p.type === "buy" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                                    }`}>
                                      {p.type === "buy" ? "خرید" : "فروش"}
                                    </span>
                                  </td>
                                  <td className="font-mono text-gray-300 text-right">{p.leverage}x</td>
                                  <td className="font-mono text-gray-300 text-right">{p.quantity}</td>
                                  <td className="font-mono text-gray-300 text-right">{p.entryPrice.toLocaleString()}</td>
                                  <td className="font-mono text-white font-semibold text-right">{currentPrice.toLocaleString()}</td>
                                  <td className="font-mono text-[10px] text-gray-400 text-right">
                                    <p>SL: <span className="text-rose-400">{p.stopLoss.toLocaleString()}</span></p>
                                    <p>TP: <span className="text-emerald-400">{p.takeProfit.toLocaleString()}</span></p>
                                  </td>
                                  <td className={`font-mono font-bold text-right ${computedPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                    ${computedPnl.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                  </td>
                                  <td className="text-left pl-2">
                                    <button
                                      onClick={() => handleClosePosition(p.id)}
                                      className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-black transition text-[10px] font-sans font-medium"
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
              <div className="flex flex-row justify-between items-center border-b border-gray-900 pb-3">
                <div className="space-y-1">
                  <h2 className="text-base font-sans font-extrabold text-white tracking-wider">تقویم اقتصادی کلان</h2>
                  <p className="text-xs font-sans text-gray-500">مهم‌ترین کاتالیزورهای نوسان بازار زنده با قابلیت فیلتر بر اساس ریسک کلان</p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-500" />
                </div>
              </div>

              {/* Shamsi Calendar Toggle Controls */}
              <div className="flex flex-wrap flex-row items-center justify-between gap-3 p-3 rounded-lg bg-gray-950/40 border border-gray-900 text-xs">
                <div className="flex flex-row items-center gap-2 font-sans">
                  <span className="text-gray-400 font-medium">سیستم نمایش تقویم:</span>
                  <div className="inline-flex flex-row rounded-md p-0.5 bg-gray-900 border border-gray-800">
                    <button
                      type="button"
                      onClick={() => setShamsiEnabled(false)}
                      className={`px-3 py-1 rounded text-xs transition font-semibold ${!shamsiEnabled ? "bg-amber-500 text-black shadow-sm" : "text-gray-400 hover:text-white"}`}
                    >
                      میلادی
                    </button>
                    <button
                      type="button"
                      onClick={() => setShamsiEnabled(true)}
                      className={`px-3 py-1 rounded text-xs transition font-semibold ${shamsiEnabled ? "bg-amber-500 text-black shadow-sm" : "text-gray-400 hover:text-white"}`}
                    >
                      خورشیدی
                    </button>
                  </div>
                </div>

                {shamsiEnabled && (
                  <div className="flex flex-row items-center gap-2">
                    <span className="text-gray-500 text-[11px] font-sans">زبان اعداد:</span>
                    <div className="inline-flex flex-row rounded-md p-0.5 bg-gray-900 border border-gray-800">
                      <button
                        type="button"
                        onClick={() => setPersianDigitsEnabled(false)}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-mono transition ${!persianDigitsEnabled ? "bg-gray-800 text-amber-400 font-bold" : "text-gray-500 hover:text-white"}`}
                      >
                        123
                      </button>
                      <button
                        type="button"
                        onClick={() => setPersianDigitsEnabled(true)}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-mono transition ${persianDigitsEnabled ? "bg-gray-800 text-amber-400 font-bold" : "text-gray-500 hover:text-white"}`}
                      >
                        ۱۲۳
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Economic Calendar Event Cards */}
              <div className="space-y-2">
                {MOCK_CALENDAR.map((cal) => (
                  <div 
                    key={cal.id}
                    className="flex flex-wrap flex-row items-center justify-between p-3 rounded-lg bg-gray-900/40 border border-gray-900/80 hover:border-amber-500/10 transition"
                  >
                    <div className="flex flex-row items-center gap-3.5 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cal.currency === "USD" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {cal.currency}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-white font-sans">{cal.event}</p>
                        <p className="text-[10px] text-gray-500 font-mono">
                          {shamsiEnabled ? (
                            <span className="flex flex-row items-center gap-1.5">
                              <span className="text-amber-500/90 font-bold font-sans bg-amber-500/10 border border-amber-500/20 px-1 rounded text-[9px] uppercase tracking-wide">شمسی</span>
                              <span className="text-gray-300 font-medium">
                                {formatToShamsi(cal.time, { usePersianDigits: persianDigitsEnabled, formatStyle: "both" })}
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
                        <span className="text-gray-500 text-[10px]">قبلی:</span>{" "}
                        <span className="text-gray-300 font-mono">{cal.previous}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-[10px]">پیش‌بینی:</span>{" "}
                        <span className="text-gray-300 font-mono">{cal.forecast}</span>
                      </div>
                      <div className="flex flex-row items-center gap-2">
                        <span className="text-gray-500 text-[10px]">اهمیت:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          cal.impact === "high" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {cal.impact === "high" ? "بالا" : cal.impact === "medium" ? "متوسط" : "پایین"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Bidirectional Calendar Converter Workbench */}
              <div className="border-t border-gray-900 pt-5 mt-4 space-y-4 text-right">
                <div className="flex flex-row items-center gap-2">
                  <Calculator className="h-4 w-4 text-amber-500" />
                  <h3 className="font-sans font-bold text-xs text-white tracking-widest">
                    مبدل دوطرفه تاریخ (شمسی - میلادی)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Right Side: Converter Input Interface (col-span-7) -> Now conceptually right because RTL */}
                  <div className="col-span-1 md:col-span-7 bg-gray-950/20 border border-gray-900 rounded-xl p-4 space-y-4 text-xs">
                    <div className="flex flex-row items-center justify-between flex-wrap gap-2 border-b border-gray-900/60 pb-3">
                      <div className="flex flex-row items-center gap-2">
                        <span className="text-gray-400 font-bold tracking-wider text-[10px] font-sans">جهت تبدیل:</span>
                        <div className="inline-flex flex-row rounded bg-gray-900 p-0.5 border border-gray-800">
                          <button
                            type="button"
                            onClick={() => setConvType("g2s")}
                            className={`px-3 py-1 rounded font-semibold transition text-[11px] font-sans ${convType === "g2s" ? "bg-amber-500/10 text-amber-400 font-bold border border-amber-500/25" : "text-gray-500 hover:text-white"}`}
                          >
                            میلادی ➔ شمسی
                          </button>
                          <button
                            type="button"
                            onClick={() => setConvType("s2g")}
                            className={`px-3 py-1 rounded font-semibold transition text-[11px] font-sans ${convType === "s2g" ? "bg-amber-500/10 text-amber-400 font-bold border border-amber-500/25" : "text-gray-500 hover:text-white"}`}
                          >
                            شمسی ➔ میلادی
                          </button>
                        </div>
                      </div>
                    </div>

                    {convType === "g2s" ? (
                      <div className="space-y-1.5 text-right">
                        <label className="text-gray-400 font-bold text-[10px] block tracking-wider font-sans">انتخاب تاریخ میلادی:</label>
                        <input
                          type="date"
                          value={gregInput}
                          onChange={(e) => setGregInput(e.target.value)}
                          className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white font-mono text-xs focus:outline-none focus:border-amber-500/35 text-left"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3 text-right">
                        <div className="space-y-1.5">
                          <label className="text-gray-400 font-bold text-[10px] block tracking-wider font-sans">سال شمسی:</label>
                          <input
                            type="number"
                            min="1"
                            max="3000"
                            placeholder="مثال: 1405"
                            value={shamsiYear}
                            onChange={(e) => setShamsiYear(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white font-mono focus:outline-none focus:border-amber-500/35 text-left"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-gray-400 font-bold text-[10px] block tracking-wider font-sans">ماه شمسی (۱-۱۲):</label>
                          <select
                            value={shamsiMonth}
                            onChange={(e) => setShamsiMonth(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white text-xs font-sans text-right direction-rtl"
                            style={{ direction: 'rtl' }}
                          >
                            {Array.from({ length: 12 }, (_, i) => (i + 1).toString()).map(m => (
                              <option key={m} value={m}>
                                {m} - {PERSIAN_MONTH_NAMES[parseInt(m) - 1]} ({PERSIAN_MONTH_PHONETIC[parseInt(m) - 1]})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-gray-400 font-bold text-[10px] block tracking-wider font-sans">روز (۱-۳۱):</label>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            placeholder="مثال: 10"
                            value={shamsiDay}
                            onChange={(e) => setShamsiDay(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white font-mono focus:outline-none focus:border-amber-500/35 text-left"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Left Side: Conversion Output Result Card (col-span-5) */}
                  <div className="col-span-1 md:col-span-5 bg-black/40 rounded-xl border border-gray-900 p-4 flex flex-col justify-between text-right">
                    <div className="space-y-2">
                      <span className="text-[10px] text-gray-500 font-sans block border-b border-gray-900 pb-1 tracking-widest">
                        خروجی مبدل تقویم
                      </span>
                      <div className="py-2">
                        <p className="text-[10px] text-gray-400 font-semibold tracking-wider font-sans">
                          {convType === "g2s" ? "معادل تاریخ شمسی (جلالی)" : "معادل تاریخ میلادی (گرگوری)"}
                        </p>
                        <p className="text-sm font-bold text-amber-400 tracking-wide mt-1 bg-amber-500/5 px-2.5 py-2 rounded border border-amber-500/10 inline-block w-full">
                          {convResult}
                        </p>
                      </div>
                    </div>

                    <div className="p-2 bg-amber-500/5 border border-amber-500/10 rounded text-[9px] font-mono text-gray-500 leading-normal">
                      Astronomical Solar Hijri calculations align with the natural spring equinox (Nowruz).
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "news" && (
            <div className="space-y-4">
              <div className="glass-panel rounded-xl p-5 space-y-4 text-right">
                <div className="flex flex-row justify-between items-center border-b border-gray-900 pb-3">
                  <div className="space-y-1">
                    <h2 className="text-base font-sans font-extrabold text-white tracking-wider">جریان اخبار و احساسات بازار</h2>
                    <p className="text-xs font-sans text-gray-500">پایش لحظه‌ای ژئوپلیتیک کلان و اخبار موثر بر نوسانات و حباب طلا</p>
                  </div>
                  <Newspaper className="h-5 w-5 text-amber-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {MOCK_NEWS.map((n) => (
                    <div 
                      key={n.id}
                      className="glass-panel rounded-xl p-4 space-y-3 flex flex-col justify-between border border-gray-800/80 hover:border-amber-500/10 transition"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-row justify-between items-center">
                          <span className="text-[10px] font-mono text-gray-500">{n.source} • {n.time}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                            n.sentiment === "bullish" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}>
                            {n.sentiment === "bullish" ? "صعودی (Bullish)" : "نزولی (Bearish)"}
                          </span>
                        </div>
                        <h4 className="font-sans font-bold text-xs text-white leading-snug">{n.title}</h4>
                        <p className="text-[11px] font-sans text-gray-400 leading-relaxed">{n.summary}</p>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-900 flex justify-start">
                        <a href={n.url} className="text-[10px] font-sans font-semibold text-amber-400 hover:text-amber-300">&larr; مطالعه گزارش کامل</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "journal" && (
            <div className="space-y-4">
              
              {/* Journal adding Console */}
              <div className="glass-panel rounded-xl p-5 space-y-4 text-right">
                <h3 className="font-sans font-bold text-sm text-white border-b border-gray-900 pb-2">ثبت وقایع و ژورنال معاملاتی</h3>
                
                <form onSubmit={handleAddJournal} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end text-xs text-right direction-rtl">
                  <div className="space-y-1">
                    <label className="text-gray-400 font-sans">قیمت ورود:</label>
                    <input
                      type="number"
                      step="any"
                      placeholder={prices[activeAssetId].toString()}
                      value={newJournalEntry.entryPrice}
                      onChange={(e) => setNewJournalEntry(prev => ({ ...prev, entryPrice: e.target.value }))}
                      className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white font-mono text-left direction-ltr"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-400 font-sans">قیمت خروج محقق شده:</label>
                    <input
                      type="number"
                      step="any"
                      placeholder={(prices[activeAssetId] * 1.01).toString()}
                      value={newJournalEntry.exitPrice}
                      onChange={(e) => setNewJournalEntry(prev => ({ ...prev, exitPrice: e.target.value }))}
                      className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white font-mono text-left direction-ltr"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-400 font-sans">حجم معامله:</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="5"
                      value={newJournalEntry.quantity}
                      onChange={(e) => setNewJournalEntry(prev => ({ ...prev, quantity: e.target.value }))}
                      className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white font-mono text-left direction-ltr"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-gray-400 font-sans">یادداشت کیفی / دلایل معامله:</label>
                    <input
                      type="text"
                      placeholder="مثال: تست سطح حمایتی، خروج امن قبل از انتشار اخبار..."
                      value={newJournalEntry.notes}
                      onChange={(e) => setNewJournalEntry(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white font-sans text-right"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-5 pt-2 flex flex-row justify-between items-center">
                    <div className="flex flex-row items-center gap-3">
                      <span className="text-gray-400 font-sans">درجه اطمینان معامله:</span>
                      <input 
                        type="range" 
                        min="10" 
                        max="100" 
                        value={newJournalEntry.confidence} 
                        onChange={(e) => setNewJournalEntry(prev => ({ ...prev, confidence: parseInt(e.target.value) }))}
                        className="accent-amber-500 w-28 direction-ltr"
                      />
                      <span className="text-amber-400 font-mono font-bold">{newJournalEntry.confidence}%</span>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded transition font-sans"
                    >
                      ثبت در ژورنال
                    </button>
                  </div>
                </form>
              </div>

              {/* Journal logs table list */}
              <div className="glass-panel rounded-xl p-5 space-y-4 text-right">
                <h3 className="font-sans font-bold text-sm text-white border-b border-gray-900 pb-2">تاریخچه پایگاه داده ژورنال</h3>
                
                {journalEntries.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-xs font-sans">هیچ گزارشی در پایگاه داده ثبت نشده است.</div>
                ) : (
                  <div className="space-y-3">
                    {journalEntries.map((j) => {
                      const meta = ASSETS_METADATA[j.assetId];
                      return (
                        <div 
                          key={j.id}
                          className="p-3 bg-gray-900/30 rounded-lg border border-gray-900 flex flex-wrap flex-row items-center justify-between gap-4 text-xs font-sans text-gray-300 text-right"
                        >
                          <div className="flex flex-row items-center gap-4">
                            <div>
                              <p className="font-bold text-white font-sans">{meta.persianName}</p>
                              <p className="text-[10px] text-gray-500 font-mono">
                                {j.date} • {j.type === "buy" ? "خرید" : "فروش"}
                              </p>
                            </div>
                          </div>

                          <div className="flex-grow max-w-md text-gray-400 italic bg-gray-950/20 px-3 py-1.5 rounded border border-gray-950 text-right">
                            "{j.notes}"
                          </div>

                          <div className="flex flex-row items-center gap-6 font-sans text-right">
                            <div>
                              <p className="text-gray-500 text-[10px]">حجم:</p>
                              <p className="text-gray-200 font-mono">{j.quantity}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-[10px]">ورود/خروج:</p>
                              <p className="text-gray-200 font-mono direction-ltr">{j.entryPrice.toLocaleString()} &rarr; {j.exitPrice.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-[10px]">سود/زیان محقق شده:</p>
                              <p className={`font-mono font-bold direction-ltr ${j.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                {j.pnl >= 0 ? "+" : ""}{j.pnl.toLocaleString()} {meta.unit.includes("تومان") ? "تومان" : "$"}
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

          {activeTab === "alerts" && (
            <div className="space-y-4">
              <div className="glass-panel rounded-xl p-5 border border-gray-800 text-right">
                <div className="flex flex-row items-center gap-2 mb-4 border-b border-gray-900 pb-2">
                  <Bell className="h-5 w-5 text-rose-500" />
                  <h3 className="font-sans font-extrabold text-white text-lg">سیستم هشدارهای قیمت (اطلاع‌رسانی مرورگر)</h3>
                </div>

                <div className="mb-6 p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg text-blue-400 text-xs font-sans text-right leading-relaxed flex flex-row items-start gap-2">
                  <span className="shrink-0">ℹ️</span>
                  <span>
                    برای دریافت هشدارها به صورت Notification روی دسکتاپ، ابتدا باید مجوز ارسال هشدار را به مرورگر خود بدهید. 
                    پس از تنظیم قیمت، به محض عبور قیمت از سطح تعیین شده، هشدار در دسکتاپ شما نمایش داده می‌شود.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-4 bg-gray-900/30 rounded-xl border border-gray-800">
                  <div className="space-y-1.5">
                    <label className="text-gray-400 text-xs font-sans">شرط هشدار</label>
                    <select
                      value={newAlert.condition}
                      onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value as "above" | "below" })}
                      className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white font-sans text-right focus:border-rose-500/50 outline-none"
                    >
                      <option value="above">قیمت بالاتر برود از</option>
                      <option value="below">قیمت پایین‌تر بیاید از</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-gray-400 text-xs font-sans">ارزش/قیمت هدف</label>
                    <input
                      type="number"
                      value={newAlert.value}
                      onChange={(e) => setNewAlert({ ...newAlert, value: e.target.value })}
                      placeholder="مثال: 18500000"
                      className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white font-mono text-left direction-ltr focus:border-rose-500/50 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-gray-400 text-xs font-sans">روش اطلاع‌رسانی</label>
                    <select
                      value={newAlert.channel}
                      onChange={(e) => setNewAlert({ ...newAlert, channel: e.target.value as any })}
                      className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white font-sans text-right focus:border-rose-500/50 outline-none"
                    >
                      <option value="browser">اطلاع‌رسانی مرورگر دسکتاپ (Browser Notification)</option>
                      <option value="telegram">ارسال به تلگرام (Telegram Bot)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleAddAlert}
                      className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-4 rounded transition flex flex-row items-center justify-center gap-2 font-sans"
                    >
                      <Plus className="h-4 w-4" />
                      افزودن هشدار
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-sans font-bold text-gray-300 mb-2">هشدارهای فعال برای {activeAssetInfo.persianName}</h4>
                  {alerts.length === 0 ? (
                    <div className="text-center p-6 text-gray-500 font-sans text-sm">هیچ هشداری ثبت نشده است.</div>
                  ) : (
                    alerts.map(alert => (
                      <div key={alert.id} className={`flex flex-row items-center justify-between p-3 rounded-lg border ${alert.enabled ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-950/30 border-gray-900 opacity-60'}`}>
                        <div className="flex flex-row items-center gap-3">
                          <button onClick={() => handleToggleAlert(alert.id)}>
                            {alert.enabled ? (
                              <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                            ) : (
                              <div className="h-3 w-3 rounded-full bg-gray-600" />
                            )}
                          </button>
                          <div>
                            <div className="flex flex-row items-center gap-2">
                              <span className="font-sans text-sm text-gray-200">
                                {alert.condition === "above" ? "بالاتر از" : "پایین‌تر از"}
                              </span>
                              <span className="font-mono text-amber-400 font-bold">{alert.value.toLocaleString()}</span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-sans block mt-1">روش: {alert.channel}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="text-gray-500 hover:text-rose-500 p-2"
                        >
                          حذف
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "connectors" && (
            <div className="space-y-4">
              
              {/* Introduction header */}
              <div className="glass-panel rounded-xl p-5 relative overflow-hidden text-right">
                <div className="space-y-2 z-10 relative">
                  <span className="text-[10px] font-sans bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded tracking-wider">
                    پروتکل اتصال به بازارهای داخلی
                  </span>
                  <h2 className="font-sans font-extrabold text-lg text-white">کانکتورهای سفارشی برای دریافت نرخ زنده بازار</h2>
                  <p className="text-xs text-gray-400 max-w-3xl leading-relaxed font-sans">
                    در این بخش می‌توانید APIهای شخصی خود را برای دریافت مستقیم قیمت‌ها از بروکرهای سفارشی، صرافی‌های داخلی (مثل نوبیتکس)، وب اسکریپرها یا سایت‌های اتحادیه طلا پیکربندی کنید. کلیدهای امنیتی (API Keys) و ساختار JSON خروجی را تعیین کنید تا داشبورد به جای نرخ جهانی، از نرخ‌های داخلی استفاده کند.
                  </p>
                </div>
                <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none"></div>
              </div>

              {/* Bento grid panels */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 direction-rtl text-right">
                
                {/* Right side: Connectors List (col-span-5) -> It was left, now visually right side */}
                <div className="col-span-1 lg:col-span-5 glass-panel rounded-xl p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-row items-center justify-between border-b border-gray-900 pb-2">
                      <h3 className="font-sans font-bold text-xs text-white">فهرست اتصالات فعال</h3>
                      <span className="text-[10px] font-mono text-gray-500">{connectors.length} مورد تعریف شده</span>
                    </div>

                    <div className="space-y-2.5 max-h-[500px] overflow-y-auto pl-1">
                      {connectors.map((conn) => {
                        const meta = ASSETS_METADATA[conn.targetAssetId];
                        return (
                          <div 
                            key={conn.id}
                            className={`p-3.5 rounded-lg border transition ${
                              conn.isActive 
                                ? "bg-amber-500/5 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.03)]" 
                                : "bg-gray-900/20 border-gray-900 hover:border-gray-800"
                            }`}
                          >
                            <div className="flex flex-row items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-xs text-white flex flex-row items-center gap-1.5 font-sans">
                                  <span>{conn.name}</span>
                                  {conn.isActive && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
                                  )}
                                </h4>
                                <span className="text-[9px] font-mono bg-gray-900 px-1.5 py-0.2 rounded text-amber-500 uppercase font-semibold">
                                  {conn.providerType} FEED
                                </span>
                                <span className="text-[9px] font-sans text-gray-500 mr-2">
                                  جایگزین شود با &larr; {meta?.persianName || conn.targetAssetId}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    const updated = connectors.map(c => 
                                      c.id === conn.id ? { ...c, isActive: !c.isActive } : c
                                    );
                                    setConnectors(updated);
                                    saveLocalStorage("gold_terminal_connectors", updated);
                                  }}
                                  className={`px-2 py-1 rounded text-[10px] font-sans font-bold transition ${
                                    conn.isActive 
                                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25" 
                                      : "bg-gray-950 text-gray-400 border border-gray-900 hover:text-white"
                                  }`}
                                >
                                  {conn.isActive ? "فعال" : "غیرفعال"}
                                </button>
                              </div>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-gray-950 text-[10px] font-mono space-y-1 text-gray-400 text-left direction-ltr">
                              <div className="truncate">
                                <span className="text-gray-600">ENDPOINT:</span> {conn.endpoint}
                              </div>
                              <div className="flex justify-between">
                                <div><span className="text-gray-600">PRICE PATH:</span> <span className="text-amber-400 font-bold">{conn.mappingPrice}</span></div>
                                <div><span className="text-gray-600">KEY:</span> {conn.apiKey ? "••••••••" : "NONE"}</div>
                              </div>
                            </div>

                            <div className="mt-3 flex justify-start gap-2 border-t border-gray-950/40 pt-2">
                              <button
                                onClick={() => {
                                  setNewConnector({
                                    name: conn.name,
                                    providerType: conn.providerType,
                                    endpoint: conn.endpoint,
                                    apiKey: conn.apiKey,
                                    apiKeyHeader: conn.apiKeyHeader,
                                    mappingPrice: conn.mappingPrice,
                                    mappingHigh: conn.mappingHigh,
                                    mappingLow: conn.mappingLow,
                                    mappingChange: conn.mappingChange,
                                    mappingVolume: conn.mappingVolume,
                                    isActive: conn.isActive,
                                    targetAssetId: conn.targetAssetId,
                                  });
                                  setEditingConnectorId(conn.id);
                                }}
                                className="text-[10px] text-amber-500 hover:text-white font-semibold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded transition font-sans"
                              >
                                ویرایش تنظیمات
                              </button>
                              <button
                                onClick={() => {
                                  const updated = connectors.filter(c => c.id !== conn.id);
                                  setConnectors(updated);
                                  saveLocalStorage("gold_terminal_connectors", updated);
                                }}
                                className="text-[10px] text-rose-400 hover:text-white font-semibold flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded transition font-sans"
                              >
                                حذف کانکتور
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-900/60 bg-gray-950/10 p-3 rounded-lg text-[10px] font-sans text-gray-500 space-y-1">
                    <span className="text-gray-400 font-bold flex flex-row items-center gap-1"><Activity className="h-3 w-3 text-emerald-400 inline" /> مکانیزم مسیردهی داده‌ها:</span>
                    <p className="leading-relaxed">
                      هر زمان که یک کانکتور فعال می‌شود، داده‌های دریافتی از این طریق جایگزین داده‌های اصلی داشبورد و نمودارها برای دارایی هدف (مانند طلای آبشده) خواهد شد. این ویژگی برای کار با بروکرهای ایرانی کاربرد دارد.
                    </p>
                  </div>
                </div>

                {/* Left side: Connector Builder & Sandbox (col-span-7) */}
                <div className="col-span-1 lg:col-span-7 space-y-4 text-right">
                  
                  {/* Configuration Form */}
                  <div className="glass-panel rounded-xl p-5 space-y-4">
                    <div className="flex flex-row justify-between items-center border-b border-gray-900 pb-2">
                      <h3 className="font-sans font-bold text-xs text-white flex flex-row items-center gap-2">
                        <Settings className="h-4 w-4 text-amber-500" />
                        <span>{editingConnectorId ? "ویرایش پیکربندی کانکتور API" : "تعریف کانکتور قیمت‌دهی API جدید"}</span>
                      </h3>
                      {editingConnectorId && (
                        <button
                          onClick={() => {
                            setEditingConnectorId(null);
                            setNewConnector({
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
                          }}
                          className="text-[10px] text-gray-400 hover:text-white font-semibold font-sans"
                        >
                          [CANCEL EDIT]
                        </button>
                      )}
                    </div>

                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newConnector.name || !newConnector.endpoint) return;

                        if (editingConnectorId) {
                          const updated = connectors.map(c => 
                            c.id === editingConnectorId 
                              ? { ...newConnector, id: editingConnectorId } 
                              : c
                          );
                          setConnectors(updated);
                          saveLocalStorage("gold_terminal_connectors", updated);
                          setEditingConnectorId(null);
                        } else {
                          const connItem: APIConnector = {
                            id: "conn_" + Date.now(),
                            ...newConnector
                          };
                          const updated = [...connectors, connItem];
                          setConnectors(updated);
                          saveLocalStorage("gold_terminal_connectors", updated);
                        }

                        setNewConnector({
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
                      }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs direction-rtl text-right"
                    >
                      <div className="space-y-1.5 col-span-1 md:col-span-2">
                        <label className="text-gray-400 font-bold font-sans">نام ارائه‌دهنده (Provider):</label>
                        <input
                          type="text"
                          required
                          placeholder="مثال: API نرخ آزاد شبکه اطلاع‌رسانی طلا"
                          value={newConnector.name}
                          onChange={(e) => setNewConnector(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white font-sans focus:outline-none focus:border-amber-500/35"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-gray-400 font-bold font-sans">دارایی هدف (جهت جایگزینی قیمت):</label>
                        <select
                          value={newConnector.targetAssetId}
                          onChange={(e) => setNewConnector(prev => ({ ...prev, targetAssetId: e.target.value as AssetId }))}
                          className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white font-sans text-right direction-rtl"
                          style={{ direction: 'rtl' }}
                        >
                          {Object.keys(ASSETS_METADATA).map((id) => (
                            <option key={id} value={id}>
                              {ASSETS_METADATA[id as AssetId].name} ({ASSETS_METADATA[id as AssetId].persianName})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-gray-400 font-bold font-sans">پروتکل ارتباطی API:</label>
                        <select
                          value={newConnector.providerType}
                          onChange={(e) => setNewConnector(prev => ({ ...prev, providerType: e.target.value as any }))}
                          className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white font-sans text-right direction-rtl"
                          style={{ direction: 'rtl' }}
                        >
                          <option value="REST">REST API (GET/POST)</option>
                          <option value="JSON">جریان داده خام JSON</option>
                          <option value="GraphQL">اندپوینت GraphQL Query</option>
                          <option value="WebSocket">استریم WebSocket</option>
                          <option value="CSV">پارسر فایل CSV</option>
                          <option value="WebScraping">وب اسکرپینگ (افزونه اختیاری)</option>
                          <option value="Manual">تغذیه دستی داده‌ها</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 col-span-1 md:col-span-2">
                        <label className="text-gray-400 font-bold font-sans">آدرس ENDPOINT (مسیر امن):</label>
                        <input
                          type="text"
                          required
                          placeholder="https://api.domain.com/v2/prices/mazaneh"
                          value={newConnector.endpoint}
                          onChange={(e) => setNewConnector(prev => ({ ...prev, endpoint: e.target.value }))}
                          className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white font-mono focus:outline-none focus:border-amber-500/35 text-left direction-ltr"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-gray-400 font-bold flex flex-row items-center gap-1 font-sans">
                          <Key className="h-3.5 w-3.5 text-amber-500" />
                          <span>کلید خصوصی API (API KEY):</span>
                        </label>
                        <input
                          type="password"
                          placeholder="مثال: bnb_sec_key_token"
                          value={newConnector.apiKey}
                          onChange={(e) => setNewConnector(prev => ({ ...prev, apiKey: e.target.value }))}
                          className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white font-mono focus:outline-none text-left direction-ltr"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-gray-400 font-bold font-sans">نام هدر احراز هویت (AUTH HEADER):</label>
                        <input
                          type="text"
                          placeholder="مثال: Authorization, X-API-KEY و..."
                          value={newConnector.apiKeyHeader}
                          onChange={(e) => setNewConnector(prev => ({ ...prev, apiKeyHeader: e.target.value }))}
                          className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white font-mono focus:outline-none text-left direction-ltr"
                        />
                      </div>

                      {/* Path mappings segment */}
                      <div className="col-span-1 md:col-span-2 pt-3 border-t border-gray-900/60 space-y-2">
                        <h4 className="text-[10px] text-amber-500 font-bold font-sans tracking-wider">مسیریابی فیلدهای خروجی JSON (JSON PATH)</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] direction-rtl">
                          <div className="space-y-1">
                            <span className="text-gray-500 font-sans">مسیر قیمت فعلی:</span>
                            <input 
                              type="text" 
                              required
                              value={newConnector.mappingPrice} 
                              onChange={(e) => setNewConnector(prev => ({ ...prev, mappingPrice: e.target.value }))}
                              className="w-full bg-gray-950 border border-gray-900 rounded p-1.5 text-white font-mono text-left direction-ltr" 
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-gray-500 font-sans">مسیر بالاترین قیمت ۲۴س:</span>
                            <input 
                              type="text" 
                              value={newConnector.mappingHigh} 
                              onChange={(e) => setNewConnector(prev => ({ ...prev, mappingHigh: e.target.value }))}
                              className="w-full bg-gray-950 border border-gray-900 rounded p-1.5 text-white font-mono text-left direction-ltr" 
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-gray-500 font-sans">مسیر پایین‌ترین قیمت ۲۴س:</span>
                            <input 
                              type="text" 
                              value={newConnector.mappingLow} 
                              onChange={(e) => setNewConnector(prev => ({ ...prev, mappingLow: e.target.value }))}
                              className="w-full bg-gray-950 border border-gray-900 rounded p-1.5 text-white font-mono text-left direction-ltr" 
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-gray-500 font-sans">مسیر تغییرات ۲۴س:</span>
                            <input 
                              type="text" 
                              value={newConnector.mappingChange} 
                              onChange={(e) => setNewConnector(prev => ({ ...prev, mappingChange: e.target.value }))}
                              className="w-full bg-gray-950 border border-gray-900 rounded p-1.5 text-white font-mono text-left direction-ltr" 
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <span className="text-gray-500 font-sans">مسیر حجم معاملات ۲۴س:</span>
                            <input 
                              type="text" 
                              value={newConnector.mappingVolume} 
                              onChange={(e) => setNewConnector(prev => ({ ...prev, mappingVolume: e.target.value }))}
                              className="w-full bg-gray-950 border border-gray-900 rounded p-1.5 text-white font-mono text-left direction-ltr" 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-2 pt-3 flex flex-row justify-between items-center border-t border-gray-900/60 font-sans">
                        <div className="flex flex-row items-center gap-2 text-gray-500">
                          <input
                            type="checkbox"
                            id="connector-isactive-checkbox"
                            checked={newConnector.isActive}
                            onChange={(e) => setNewConnector(prev => ({ ...prev, isActive: e.target.checked }))}
                            className="h-4 w-4 rounded bg-gray-950 border-gray-900 text-amber-500 focus:ring-0 cursor-pointer"
                          />
                          <label htmlFor="connector-isactive-checkbox" className="cursor-pointer select-none font-semibold">تأیید و فعال‌سازی فوری کانکتور</label>
                        </div>

                        <button
                          type="submit"
                          className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded transition font-sans"
                        >
                          {editingConnectorId ? "به‌روزرسانی کانکتور" : "ذخیره و ایجاد کانکتور"}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Sandboxed Testing Area */}
                  <div className="glass-panel rounded-xl p-5 space-y-4 text-right">
                    <div className="flex flex-row justify-between items-center border-b border-gray-900 pb-2">
                      <h3 className="font-sans font-bold text-xs text-white flex flex-row items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-amber-500 animate-spin-slow" />
                        <span>تست نقشه یابی JSON و شبیه سازی خروجی API</span>
                      </h3>
                      <button
                        onClick={handleTestMapping}
                        className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 px-3 py-1 rounded font-bold font-sans transition"
                      >
                        اجرای تست دریافت پارامترها
                      </button>
                    </div>

                    <p className="text-[11px] font-sans text-gray-400 leading-relaxed">
                      یک نمونه خام (JSON) از خروجی API خود را در کادر زیر قرار داده و روی "اجرای تست" کلیک کنید تا از صحت نقشه مسیرهای (JSON Paths) تنظیم شده برای مقادیر عددی اطمینان حاصل کنید.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 direction-rtl">
                      
                      {/* JSON editor input (col-span-7) */}
                      <div className="col-span-1 md:col-span-7 space-y-1.5">
                        <span className="text-[10px] text-gray-500 font-sans block">داده JSON نمونه آزمایشی:</span>
                        <textarea
                          rows={6}
                          value={testPayload}
                          onChange={(e) => setTestPayload(e.target.value)}
                          className="w-full bg-gray-950 border border-gray-900 rounded p-2.5 text-white font-mono text-[10.5px] focus:outline-none focus:border-amber-500/30 leading-normal text-left direction-ltr"
                        />
                      </div>

                      {/* Test outputs (col-span-5) */}
                      <div className="col-span-1 md:col-span-5 bg-black/40 rounded-lg border border-gray-900 p-3 flex flex-col justify-between min-h-[140px] text-right">
                        <div className="space-y-2">
                          <span className="text-[10px] text-gray-500 font-sans block border-b border-gray-900 pb-1">فیلدهای شناسایی شده در تست</span>
                          
                          {testError && (
                            <div className="p-2 bg-rose-500/10 rounded border border-rose-500/35 text-[11px] text-rose-400 font-sans flex flex-row items-start gap-1.5 leading-relaxed">
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400 mt-0.5" />
                              <span>{testError}</span>
                            </div>
                          )}

                          {testResult ? (
                            <div className="space-y-1 text-[11px] font-mono text-gray-300">
                              <div className="flex flex-row justify-between p-1 rounded hover:bg-gray-900/40">
                                <span className="text-gray-500 font-sans">قیمت فعلی:</span>
                                <span className="text-emerald-400 font-bold">{testResult.resolvedPrice.toLocaleString()} تومان</span>
                              </div>
                              <div className="flex flex-row justify-between p-1 rounded hover:bg-gray-900/40">
                                <span className="text-gray-500 font-sans">بالاترین قیمت ۲۴س:</span>
                                <span className="text-gray-200">{testResult.resolvedHigh ? testResult.resolvedHigh.toLocaleString() : "N/A"} تومان</span>
                              </div>
                              <div className="flex flex-row justify-between p-1 rounded hover:bg-gray-900/40">
                                <span className="text-gray-500 font-sans">پایین‌ترین قیمت ۲۴س:</span>
                                <span className="text-gray-200">{testResult.resolvedLow ? testResult.resolvedLow.toLocaleString() : "N/A"} تومان</span>
                              </div>
                              <div className="flex flex-row justify-between p-1 rounded hover:bg-gray-900/40">
                                <span className="text-gray-500 font-sans">درصد تغییرات:</span>
                                <span className={`font-bold direction-ltr inline-block ${testResult.resolvedChange && testResult.resolvedChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                  {testResult.resolvedChange ? `${testResult.resolvedChange}%` : "N/A"}
                                </span>
                              </div>
                              <div className="flex flex-row justify-between p-1 rounded hover:bg-gray-900/40">
                                <span className="text-gray-500 font-sans">شاخص حجم:</span>
                                <span className="text-gray-200 font-bold">{testResult.resolvedVolume || "N/A"}</span>
                              </div>
                            </div>
                          ) : !testError && (
                            <div className="py-6 text-center text-gray-600 text-[11px] font-sans">
                              منتظر اجرای تست...
                            </div>
                          )}
                        </div>

                        {testResult && (
                          <div className="mt-2 p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[10px] font-sans flex flex-row items-center gap-1.5">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>مپینگ فیلدها با موفقیت تأیید شد</span>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* DYNAMIC SETTINGS CONSOLE AT BOTTOM */}
          <section id="terminal-settings-console" className="glass-panel-heavy rounded-xl p-5 border border-gray-800 space-y-4 text-right">
            <div className="flex flex-row items-center justify-between border-b border-gray-900 pb-2">
              <div className="flex flex-row items-center gap-2">
                <Settings className="h-4.5 w-4.5 text-amber-500" />
                <h3 className="font-sans font-extrabold text-sm text-white">پنل تنظیمات و پیکربندی ترمینال</h3>
              </div>
              <div className="flex flex-row items-center gap-1.5 text-[10px] text-amber-500 font-sans">
                <Lock className="h-3 w-3" /> حافظه پنهان محلی ایمن
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs direction-rtl">
              
              <div className="space-y-1.5">
                <label className="text-gray-400 font-semibold flex flex-row items-center gap-1 font-sans">
                  <Key className="h-3 w-3 text-amber-500" />
                  <span>انتخاب موتور هوش مصنوعی:</span>
                </label>
                <select
                  value={aiConfig.provider}
                  onChange={(e) => handleSaveAIConfig({ ...aiConfig, provider: e.target.value as any })}
                  className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white font-sans text-right"
                  style={{ direction: 'rtl' }}
                >
                  <option value="gemini">هوش مصنوعی Google Gemini</option>
                  <option value="openai">OpenAI ChatGPT</option>
                  <option value="claude">Anthropic Claude</option>
                  <option value="deepseek">DeepSeek AI Core</option>
                  <option value="openrouter">OpenRouter Gateway</option>
                  <option value="grok">xAI Grok</option>
                  <option value="custom">سرویس دهنده سفارشی (Custom)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-400 font-semibold flex flex-row items-center gap-1 font-sans">
                  <Activity className="h-3 w-3 text-amber-500" />
                  <span>انتخاب مدل:</span>
                </label>
                <select
                  value={aiConfig.model}
                  onChange={(e) => handleSaveAIConfig({ ...aiConfig, model: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white font-mono text-left direction-ltr"
                >
                  <option value="gemini-3.5-flash">gemini-3.5-flash (Standard)</option>
                  <option value="gemini-2.5-pro">gemini-2.5-pro (High reasoning)</option>
                  <option value="gpt-4o">gpt-4o (OpenAI Model)</option>
                  <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
                  <option value="deepseek-coder">deepseek-chat</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-row justify-between font-semibold text-gray-400 font-sans">
                  <span>پارامتر خلاقیت (Temperature):</span>
                  <span className="text-amber-400 font-mono">{aiConfig.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={aiConfig.temperature}
                  onChange={(e) => handleSaveAIConfig({ ...aiConfig, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 py-1 direction-ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-400 font-semibold flex flex-row items-center gap-1 font-sans">
                  <Key className="h-3 w-3 text-amber-500" />
                  <span>کلید خصوصی امنیتی API:</span>
                </label>
                <input
                  type="password"
                  placeholder="کلید عبور یا توکن API خود را اینجا وارد کنید"
                  value={aiConfig.apiKey}
                  onChange={(e) => handleSaveAIConfig({ ...aiConfig, apiKey: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white font-mono placeholder:text-gray-700 placeholder:font-sans focus:outline-none focus:border-amber-500/35 text-left direction-ltr"
                />
              </div>

              <div className="md:col-span-4 space-y-1.5">
                {aiConfig.provider === "custom" && (
                  <div className="space-y-1.5 mb-4">
                    <label className="text-gray-400 font-semibold font-sans flex flex-row items-center gap-1">
                      <Key className="h-3 w-3 text-amber-500" />
                      <span>آدرس پایه (Base URL) سرویس‌دهنده سفارشی:</span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://your-custom-ai-endpoint.com/v1"
                      value={aiConfig.customEndpoint || ""}
                      onChange={(e) => handleSaveAIConfig({ ...aiConfig, customEndpoint: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white font-mono placeholder:text-gray-700 placeholder:font-sans focus:outline-none focus:border-amber-500/35 text-left direction-ltr"
                    />
                  </div>
                )}
                <label className="text-gray-400 font-semibold font-sans">دستورالعمل سیستم عامل هوش مصنوعی (System Prompt) - تنظیمات پیشرفته:</label>
                <textarea
                  rows={2}
                  value={aiConfig.systemPrompt}
                  onChange={(e) => handleSaveAIConfig({ ...aiConfig, systemPrompt: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-900 rounded p-2 text-white font-mono text-[11px] focus:outline-none focus:border-amber-500/35 text-left direction-ltr"
                />
              </div>

            </div>
          </section>

        </main>
      </div>

      {/* 3. PREMIUM DEPLOYMENT STATS BAR */}
      <footer className="bg-black/95 border-t border-gray-900 px-4 py-2 flex flex-wrap flex-row items-center justify-between text-[10px] text-gray-500 font-sans">
        <div className="flex flex-row items-center gap-4">
          <span className="text-gray-600">پورت زیرساخت:</span>
          <span className="text-emerald-500 font-bold font-mono">PORT 3000</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400">ایمیل نشست: <span className="font-mono">{localStorage.getItem("terminal_user") || "medosaseven@gmail.com"}</span></span>
        </div>
        <div className="flex flex-row items-center gap-4">
          <span>شتاب‌دهنده گرافیکی: <strong className="text-amber-500 font-mono">60 FPS WEBGL</strong></span>
          <span>© 1405 پنل معاملات هوشمند بازار طلای آبشده ایران</span>
        </div>
      </footer>

    </div>
  );
}
