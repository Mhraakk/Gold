import React, { useState, useEffect, useRef } from 'react';
import { tgjuAssets } from '../config/tgju-assets';
import { AssetId, APIConnector } from '../types';
import { 
  Settings, 
  RefreshCw, 
  Plus, 
  Clock, 
  ExternalLink, 
  Play, 
  Database, 
  Check, 
  AlertTriangle, 
  Download, 
  Upload, 
  Trash2, 
  Shield, 
  Activity, 
  Code, 
  Key, 
  Eye, 
  EyeOff, 
  AlertCircle 
} from 'lucide-react';

interface ConnectorStatus {
  lastChecked: number | null;
  status: 'online' | 'error' | 'pending';
  errorMsg?: string;
  rawValue?: number;
  rawText?: string;
  latency?: number;
}

interface ConnectorsTerminalProps {
  connectors?: APIConnector[];
  setConnectors?: React.Dispatch<React.SetStateAction<APIConnector[]>> | ((conns: APIConnector[]) => void);
}

const ConnectorsTerminal = function ConnectorsTerminal({ connectors, setConnectors }: ConnectorsTerminalProps) {
  // Use local state if props are not supplied (fallback)
  const [localConnectors, setLocalConnectors] = useState<APIConnector[]>(() => {
    const saved = localStorage.getItem("gold_terminal_connectors");
    return saved ? JSON.parse(saved) : [];
  });

  const activeConnectors = connectors || localConnectors;

  const updateConnectors = (newConns: APIConnector[]) => {
    if (setConnectors) {
      setSetStateAction(newConns);
    } else {
      setLocalConnectors(newConns);
      localStorage.setItem("gold_terminal_connectors", JSON.stringify(newConns));
    }
  };

  const setSetStateAction = (newConns: APIConnector[]) => {
    if (setConnectors) setConnectors(newConns);
  };

  const [statuses, setStatuses] = useState<Record<string, ConnectorStatus>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSecretMap, setShowSecretMap] = useState<Record<string, boolean>>({});

  // Form states
  const [formData, setFormData] = useState<Omit<APIConnector, 'id'>>({
    name: '',
    providerType: 'REST',
    endpoint: '',
    apiKey: '',
    apiKeyHeader: 'Authorization',
    mappingPrice: 'price',
    mappingHigh: 'high',
    mappingLow: 'low',
    mappingChange: 'change_percent',
    mappingVolume: 'volume',
    isActive: true,
    targetAssetId: 'MELTED_GOLD',
    priority: 'High'
  });

  // Sandbox Tester states
  const [testerPayload, setTesterPayload] = useState<string>(
    `{\n  "status": "success",\n  "data": {\n    "price": 18450000,\n    "high": 18600000,\n    "low": 18180000,\n    "change_percent": 1.42,\n    "volume": 14850\n  }\n}`
  );
  const [testerMapping, setTesterMapping] = useState<string>("data.price");
  const [testerResult, setTesterResult] = useState<any>(null);
  const [testerError, setTesterError] = useState<string | null>(null);

  // File Upload Ref for Import Backup
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resolveJSONPath = (obj: any, path: string): any => {
    if (!path) return undefined;
    return path.split(".").reduce((acc, part) => {
      if (acc === null || acc === undefined) return undefined;
      return acc[part];
    }, obj);
  };

  const handleTestSandboxMapping = () => {
    setTesterError(null);
    setTesterResult(null);
    try {
      const parsedObj = JSON.parse(testerPayload);
      const val = resolveJSONPath(parsedObj, testerMapping);
      if (val === undefined) {
        throw new Error(`مسیر جستجو "${testerMapping}" در سند JSON یافت نشد.`);
      }
      setTesterResult(val);
    } catch (err: any) {
      setTesterError(err.message || "خطا در تحلیل ساختار JSON");
    }
  };

  const checkSingleConnector = async (conn: APIConnector) => {
    const keyOrId = conn.id;
    setStatuses(prev => ({ ...prev, [keyOrId]: { ...prev[keyOrId], status: 'pending' } }));
    const startTime = Date.now();
    try {
      let url = conn.endpoint;
      // Handle local scraping routes
      if (conn.providerType === 'TelegramScraper' || url === '/api/market/abshdh') {
        url = '/api/market/abshdh';
      } else if (url.startsWith('/api/')) {
        url = url; // preserve local API proxies
      } else {
        // Bypass CORS using absolute paths or proxies
        url = `/api/market/tgju/latest?asset=${conn.targetAssetId.toLowerCase()}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      const latency = Date.now() - startTime;

      if (data.error) {
        throw new Error(data.error);
      }

      let value: number | null = null;
      let rawText = "";

      if (conn.providerType === 'TelegramScraper' && data.success) {
        value = data.data.MELTED_GOLD;
        rawText = data.rawText || "Telegram Feed OK";
      } else if (data.value !== undefined) {
        value = data.value;
        rawText = String(data.value);
      } else if (conn.mappingPrice) {
        value = resolveJSONPath(data, conn.mappingPrice);
        rawText = JSON.stringify(data);
      }

      if (value === null || value === undefined || isNaN(Number(value))) {
        throw new Error("خطا در تطابق و استخراج مقدار قیمت نهایی");
      }

      setStatuses(prev => ({
        ...prev,
        [keyOrId]: {
          lastChecked: Date.now(),
          status: 'online',
          rawValue: Number(value),
          rawText: rawText.substring(0, 100),
          latency
        }
      }));
    } catch (e: any) {
      setStatuses(prev => ({
        ...prev,
        [keyOrId]: {
          lastChecked: Date.now(),
          status: 'error',
          errorMsg: e.message || 'اتصال ناموفق'
        }
      }));
    }
  };

  const checkAll = async () => {
    setIsChecking(true);
    for (const c of activeConnectors) {
      await checkSingleConnector(c);
      await new Promise(r => setTimeout(r, 400)); // Gentle pacing
    }
    setIsChecking(false);
  };

  useEffect(() => {
    if (activeConnectors.length > 0) {
      checkAll();
    }
  }, [activeConnectors.length]);

  // Export Backups (Positions, Connectors, Journal, Forecasts, Configs)
  const handleExportBackup = () => {
    const backupKeys = [
      "gold_terminal_connectors",
      "simulated_positions",
      "trade_journal",
      "ai_config_terminal",
      "next_day_forecasts"
    ];
    const backupData: Record<string, string | null> = {};
    backupKeys.forEach(k => {
      backupData[k] = localStorage.getItem(k);
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `gold_terminal_private_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const backupObj = JSON.parse(event.target?.result as string);
          let count = 0;
          Object.keys(backupObj).forEach(k => {
            if (backupObj[k] !== null && backupObj[k] !== undefined) {
              localStorage.setItem(k, backupObj[k]);
              count++;
            }
          });
          if (count > 0) {
            alert("پشتیبان‌گیری با موفقیت بازیابی شد! سامانه مجدداً بارگذاری می‌شود.");
            window.location.reload();
          } else {
            alert("فایل پشتیبان معتبر یافت نشد.");
          }
        } catch (error) {
          alert("خطا در پردازش فایل پشتیبان. قالب فایل JSON نامعتبر است.");
        }
      };
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.endpoint) {
      alert("لطفاً تمامی فیلدهای اجباری را تکمیل فرمایید.");
      return;
    }

    let updatedList: APIConnector[];
    if (editingId) {
      updatedList = activeConnectors.map(c => c.id === editingId ? { ...formData, id: editingId } : c);
      setEditingId(null);
    } else {
      const newConn: APIConnector = {
        ...formData,
        id: 'conn_' + Date.now().toString()
      };
      updatedList = [...activeConnectors, newConn];
    }

    updateConnectors(updatedList);
    setShowAddForm(false);
    setFormData({
      name: '',
      providerType: 'REST',
      endpoint: '',
      apiKey: '',
      apiKeyHeader: 'Authorization',
      mappingPrice: 'price',
      mappingHigh: 'high',
      mappingLow: 'low',
      mappingChange: 'change_percent',
      mappingVolume: 'volume',
      isActive: true,
      targetAssetId: 'MELTED_GOLD',
      priority: 'High'
    });
  };

  const handleEditClick = (conn: APIConnector) => {
    setEditingId(conn.id);
    setFormData({
      name: conn.name,
      providerType: conn.providerType,
      endpoint: conn.endpoint,
      apiKey: conn.apiKey || '',
      apiKeyHeader: conn.apiKeyHeader || 'Authorization',
      mappingPrice: conn.mappingPrice || 'price',
      mappingHigh: conn.mappingHigh || 'high',
      mappingLow: conn.mappingLow || 'low',
      mappingChange: conn.mappingChange || 'change_percent',
      mappingVolume: conn.mappingVolume || 'volume',
      isActive: conn.isActive,
      targetAssetId: conn.targetAssetId,
      priority: conn.priority || 'High'
    });
    setShowAddForm(true);
  };

  const handleDeleteClick = (id: string) => {
    if (confirm("آیا مایل به حذف دائم این اتصال‌دهنده داده هستید؟")) {
      const updated = activeConnectors.filter(c => c.id !== id);
      updateConnectors(updated);
    }
  };

  const toggleActive = (id: string) => {
    const updated = activeConnectors.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c);
    updateConnectors(updated);
  };

  const toggleSecretVisible = (id: string) => {
    setShowSecretMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Separate connectors based on user instructions:
  // "Sources that are temporarily down or failing validation must not be silently ignored—they must be explicitly displayed under a dedicate group: «منابع نیازمند بررسی»"
  const failedOrInactiveSources = activeConnectors.filter(c => !c.isActive || statuses[c.id]?.status === 'error');
  const healthyActiveSources = activeConnectors.filter(c => c.isActive && statuses[c.id]?.status !== 'error');

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* 1. TERMINAL HEADER */}
      <div className="glass-panel lux-card p-6 rounded-2xl border-white/5 bg-black/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-[var(--accent-gold)] flex items-center gap-3">
            <Database className="w-6 h-6 text-[var(--accent-gold)]" />
            مرکز منابع، اتصال‌دهنده‌ها و راستی‌آزمایی
          </h2>
          <p className="text-xs text-gray-400 mt-2">
            محیط مدیریت انحصاری تک‌کاربره (Owner Terminal) برای کنترل، عیب‌یابی و پایش لحظه‌ای کانال‌ها و وب‌سایت‌های مرجع قیمت‌دهی
          </p>
        </div>

        {/* Action Controls for Backups */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={checkAll}
            disabled={isChecking}
            className="flex items-center gap-2 bg-black/40 border border-white/10 hover:border-[var(--accent-gold)] text-gray-300 px-3 py-1.5 rounded-xl text-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            آزمون کانال‌ها
          </button>
          
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 bg-[var(--accent-gold-soft)]/20 text-[var(--accent-gold)] border border-[var(--accent-gold)]/30 hover:bg-[var(--accent-gold-soft)]/30 px-3 py-1.5 rounded-xl text-xs transition font-bold"
          >
            <Download className="w-3.5 h-3.5" />
            پشتیبان‌گیری کامل
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-black/50 border border-gray-700 text-gray-300 hover:border-gray-500 px-3 py-1.5 rounded-xl text-xs transition"
          >
            <Upload className="w-3.5 h-3.5" />
            بازیابی فایل پشتیبان
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportBackup} 
            accept=".json" 
            className="hidden" 
          />

          <button
            onClick={() => {
              setEditingId(null);
              setShowAddForm(!showAddForm);
            }}
            className="flex items-center gap-2 bg-[var(--accent-gold)] text-black px-4 py-1.5 rounded-xl text-xs font-extrabold hover:bg-yellow-500 transition shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          >
            <Plus className="w-3.5 h-3.5" />
            افزودن منبع جدید
          </button>
        </div>
      </div>

      {/* 2. LIVE SYSTEM DATA STATISTICS BENTO GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl bg-black/10 border-white/5 flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 uppercase font-semibold">تعداد کل اتصال‌دهنده‌ها</span>
          <p className="text-2xl font-extrabold text-white mt-1">{activeConnectors.length}</p>
          <span className="text-[8px] text-gray-600 mt-1">تعداد سورس‌های فعال ثبت شده در کوانتوم‌ساید</span>
        </div>
        <div className="glass-panel p-4 rounded-xl bg-black/10 border-white/5 flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 uppercase font-semibold">منابع فعال و معتبر</span>
          <p className="text-2xl font-extrabold text-[var(--accent-emerald)] mt-1">{healthyActiveSources.length}</p>
          <span className="text-[8px] text-gray-600 mt-1">پروتکل‌های متصل بدون خطا و در جریان لایو</span>
        </div>
        <div className="glass-panel p-4 rounded-xl bg-black/10 border-white/5 flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 uppercase font-semibold">منابع نیازمند بررسی</span>
          <p className="text-2xl font-extrabold text-[var(--accent-crimson)] mt-1">{failedOrInactiveSources.length}</p>
          <span className="text-[8px] text-gray-600 mt-1">اتصال‌دهنده‌های متوقف یا دارای خطای عدم تطابق</span>
        </div>
        <div className="glass-panel p-4 rounded-xl bg-black/10 border-white/5 flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 uppercase font-semibold">شاخص کل پایداری شبکه</span>
          <p className="text-2xl font-extrabold text-[var(--accent-gold)] mt-1">
            {activeConnectors.length > 0 
              ? `${Math.round((healthyActiveSources.length / activeConnectors.length) * 100)}%`
              : '100%'}
          </p>
          <span className="text-[8px] text-gray-600 mt-1">تراکم پایداری و سلامت اتصالات</span>
        </div>
      </div>

      {/* 3. DYNAMIC ADD / EDIT CONNECTOR FORM CONTAINER */}
      {showAddForm && (
        <form onSubmit={handleSaveForm} className="glass-panel lux-breathe border border-[var(--accent-gold)]/20 p-5 rounded-2xl bg-[#090e22]/90 space-y-4 animate-fade-in">
          <div className="border-b border-white/5 pb-2 flex justify-between items-center">
            <h3 className="font-display font-extrabold text-sm text-[var(--accent-gold)] flex items-center gap-2">
              <Settings className="w-4 h-4 animate-spin-slow" />
              {editingId ? "ویرایش و بازپیکربندی اتصال‌دهنده" : "افزودن پروتکل اتصال‌دهنده داده جدید"}
            </h3>
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)} 
              className="text-gray-500 hover:text-white transition text-xs font-bold"
            >
              بستن پنل
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
            {/* Name */}
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">نام و توصیف منبع (اجباری)</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white" 
                placeholder="مثلاً: ابوریحان لایو تیکر" 
                required
              />
            </div>

            {/* Target Asset ID */}
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">دارایی هدف برای تغذیه نرخ</label>
              <select 
                value={formData.targetAssetId} 
                onChange={(e) => setFormData({ ...formData, targetAssetId: e.target.value as AssetId })}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white"
              >
                <option value="MELTED_GOLD">آبشده نقدی طلا</option>
                <option value="GOLD_18K">طلای ۱۸ عیار</option>
                <option value="GOLD_24K">طلای ۲۴ عیار</option>
                <option value="MESGHAL">مثقال طلا</option>
                <option value="COIN_EMAMI">سکه امامی</option>
                <option value="COIN_HALF">نیم سکه</option>
                <option value="COIN_QUARTER">ربع سکه</option>
                <option value="USDIRT">دلار آزاد</option>
                <option value="USDTIRT">تتر ریالی</option>
                <option value="XAUUSD">انس طلا جهانی</option>
              </select>
            </div>

            {/* Provider Type */}
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">پروتکل ارتباطی (Protocol Type)</label>
              <select 
                value={formData.providerType} 
                onChange={(e) => setFormData({ ...formData, providerType: e.target.value as any })}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white"
              >
                <option value="REST">REST API (آبشاری)</option>
                <option value="JSON">JSON Feed (فایل وب)</option>
                <option value="TelegramScraper">TelegramScraper (تلگرام)</option>
                <option value="WebScraping">WebScraping (خزش صفحه وب)</option>
                <option value="WebSocket">WebSocket (جریان زنده پیوسته)</option>
                <option value="Manual">Manual API (دستی/آزمایشی)</option>
              </select>
            </div>

            {/* Endpoint / URL */}
            <div className="md:col-span-2">
              <label className="text-[10px] text-gray-400 block mb-1">آدرس نقطه اتصال پایانی (Endpoint Endpoint/URL)</label>
              <input 
                type="text" 
                value={formData.endpoint} 
                onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-left direction-ltr font-mono text-white" 
                placeholder="https://api.example.com/rates" 
                required
              />
            </div>

            {/* Priority */}
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">اولویت منبع (Priority Score)</label>
              <select 
                value={formData.priority || 'High'} 
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white"
              >
                <option value="High">بالا (مبنای مرجع)</option>
                <option value="Medium">متوسط (بک‌آپ اول)</option>
                <option value="Low">پایین (پایش تناقضات)</option>
              </select>
            </div>

            {/* Key-Path Pricing parser mapping */}
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">مسیر استخراج قیمت (JSON Keypath Price)</label>
              <input 
                type="text" 
                value={formData.mappingPrice} 
                onChange={(e) => setFormData({ ...formData, mappingPrice: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-left direction-ltr font-mono text-white" 
                placeholder="data.price" 
              />
            </div>

            {/* API Key Header */}
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">هدر امنیتی (API Auth Header)</label>
              <input 
                type="text" 
                value={formData.apiKeyHeader} 
                onChange={(e) => setFormData({ ...formData, apiKeyHeader: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-left direction-ltr font-mono text-white" 
                placeholder="Authorization" 
              />
            </div>

            {/* API Key Value - Masked in input but editable */}
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">کلید توکن محرمانه (API Secret Token)</label>
              <input 
                type="password" 
                value={formData.apiKey} 
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-left direction-ltr font-mono text-white" 
                placeholder="api_secret_key_..." 
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => {
                setShowAddForm(false);
                setEditingId(null);
              }} 
              className="px-4 py-2 text-xs text-gray-400 hover:text-white transition"
            >
              انصراف
            </button>
            <button 
              type="submit" 
              className="bg-[var(--accent-gold)] text-black font-extrabold px-6 py-2 rounded-xl text-xs hover:bg-yellow-500 transition"
            >
              {editingId ? "ذخیره تغییرات" : "ایجاد اتصال‌دهنده جدید"}
            </button>
          </div>
        </form>
      )}

      {/* 4. GROUP 1: منابع نیازمند بررسی (Sources Requiring Investigation) */}
      <div className="space-y-3">
        <h3 className="font-display font-extrabold text-sm text-[var(--accent-crimson)] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[var(--accent-crimson)]" />
          منابع نیازمند بررسی (Sources Requiring Investigation)
        </h3>

        {failedOrInactiveSources.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-emerald-500/30 rounded-xl bg-emerald-500/5 text-emerald-400 text-xs flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            تمام کانال‌ها و اتصال‌دهنده‌های قیمت با سلامت کامل در حال دریافت اطلاعات هستند.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {failedOrInactiveSources.map((c) => {
              const st = statuses[c.id];
              const isVisible = showSecretMap[c.id];
              return (
                <div key={c.id} className="bg-red-500/5 border border-red-900/30 rounded-2xl p-5 hover:border-red-900/50 transition-colors relative">
                  
                  {/* Priority and Key */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[8px] font-bold bg-red-900/40 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded uppercase">
                        {c.priority || 'High'} PRIORITY
                      </span>
                      <h4 className="font-bold text-red-200 mt-1.5">{c.name}</h4>
                      <p className="text-[9px] text-gray-500 font-mono" dir="ltr">{c.targetAssetId}</p>
                    </div>
                    <span className="text-[9px] bg-red-900/20 text-red-400 font-sans border border-red-900/50 px-2 py-0.5 rounded-full font-bold">
                      {c.isActive ? 'خطای اتصال' : 'غیرفعال'}
                    </span>
                  </div>

                  {/* Settings details */}
                  <div className="space-y-2.5 border-t border-red-950/40 pt-3 text-xs text-gray-400">
                    <div className="flex justify-between items-center">
                      <span>پروتکل:</span>
                      <span className="font-mono font-bold text-gray-300">{c.providerType}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>لینک منبع:</span>
                      <a href={c.endpoint} target="_blank" rel="noreferrer" className="text-blue-400 flex items-center gap-1 font-mono text-[10px] overflow-hidden truncate max-w-[150px]">
                        {c.endpoint}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    {c.apiKey && (
                      <div className="flex justify-between items-center">
                        <span>توکن امنیتی:</span>
                        <div className="flex items-center gap-1 font-mono text-[10px]">
                          <span>{isVisible ? c.apiKey : '••••••••'}</span>
                          <button onClick={() => toggleSecretVisible(c.id)} className="text-gray-500 hover:text-white transition">
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                    {st?.errorMsg && (
                      <div className="text-[10px] text-red-300 bg-red-950/40 border border-red-900/40 p-2.5 rounded-lg mt-2 flex items-start gap-1.5 leading-relaxed">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400 mt-0.5" />
                        <span>{st.errorMsg}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="flex justify-between items-center border-t border-red-950/40 pt-3 mt-3">
                    <span className="text-[9px] text-gray-500 font-mono">
                      {st?.lastChecked ? `بررسی: ${new Date(st.lastChecked).toLocaleTimeString('fa-IR')}` : 'هرگز مانیتور نشده'}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => toggleActive(c.id)} 
                        className="text-gray-500 hover:text-white text-[10px] bg-black/40 border border-white/5 px-2.5 py-1 rounded-lg transition"
                      >
                        {c.isActive ? 'خاموش کن' : 'روشن کن'}
                      </button>
                      <button onClick={() => checkSingleConnector(c)} className="text-gray-400 hover:text-[var(--accent-gold)] p-1 transition">
                        <Play className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEditClick(c)} className="text-gray-400 hover:text-white p-1 transition">
                        <Settings className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteClick(c.id)} className="text-gray-500 hover:text-red-400 p-1 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. GROUP 2: منابع فعال و معتبر (Valid & Active Sources) */}
      <div className="space-y-3">
        <h3 className="font-display font-extrabold text-sm text-[var(--accent-emerald)] flex items-center gap-2">
          <Check className="w-4 h-4 text-[var(--accent-emerald)]" />
          منابع فعال و معتبر (Valid & Active Sources)
        </h3>

        {healthyActiveSources.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-red-500/20 rounded-xl bg-red-500/5 text-gray-500 text-xs">
            هیچ اتصالی در حال حاضر فعال یا سالم نیست. مانیتورینگ متوقف است.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthyActiveSources.map((c) => {
              const st = statuses[c.id];
              const isVisible = showSecretMap[c.id];
              return (
                <div key={c.id} className="bg-emerald-500/5 border border-emerald-950/30 rounded-2xl p-5 hover:border-emerald-500/30 transition-colors relative">
                  
                  {/* Pulsing indicator */}
                  <span className="absolute top-4 left-4 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>

                  {/* Priority & Name */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[8px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase">
                        {c.priority || 'High'} PRIORITY
                      </span>
                      <h4 className="font-bold text-gray-100 mt-1.5">{c.name}</h4>
                      <p className="text-[9px] text-gray-500 font-mono" dir="ltr">{c.targetAssetId}</p>
                    </div>
                  </div>

                  {/* Dynamic stats */}
                  <div className="space-y-2.5 border-t border-emerald-950/40 pt-3 text-xs text-gray-400">
                    <div className="flex justify-between items-center">
                      <span>آخرین ارزش خام دریافتی:</span>
                      <strong className="text-white font-mono">{st?.rawValue ? st.rawValue.toLocaleString() : 'درحال بارگذاری...'}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>میزان تاخیر اتصال (Latency):</span>
                      <span className="text-emerald-400 font-mono font-semibold">{st?.latency ? `${st.latency}ms` : '---'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>لینک منبع:</span>
                      <a href={c.endpoint} target="_blank" rel="noreferrer" className="text-blue-400 flex items-center gap-1 font-mono text-[10px] overflow-hidden truncate max-w-[150px]">
                        {c.endpoint}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    {c.apiKey && (
                      <div className="flex justify-between items-center">
                        <span>توکن امنیتی:</span>
                        <div className="flex items-center gap-1 font-mono text-[10px]">
                          <span>{isVisible ? c.apiKey : '••••••••'}</span>
                          <button onClick={() => toggleSecretVisible(c.id)} className="text-gray-500 hover:text-white transition">
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer control actions */}
                  <div className="flex justify-between items-center border-t border-emerald-950/40 pt-3 mt-3">
                    <span className="text-[9px] text-gray-500 font-mono">
                      {st?.lastChecked ? `بررسی: ${new Date(st.lastChecked).toLocaleTimeString('fa-IR')}` : 'بررسی زنده'}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => toggleActive(c.id)} 
                        className="text-gray-500 hover:text-white text-[10px] bg-black/40 border border-white/5 px-2.5 py-1 rounded-lg transition"
                      >
                        خاموش کن
                      </button>
                      <button onClick={() => checkSingleConnector(c)} className="text-gray-400 hover:text-emerald-400 p-1 transition">
                        <Play className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEditClick(c)} className="text-gray-400 hover:text-white p-1 transition">
                        <Settings className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteClick(c.id)} className="text-gray-500 hover:text-red-400 p-1 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. INTERACTIVE JSON RESOLVER AND PARSING SANDBOX */}
      <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/25 space-y-4">
        <div>
          <h3 className="text-sm font-display font-extrabold text-[var(--accent-gold)] flex items-center gap-2">
            <Code className="w-4.5 h-4.5 text-[var(--accent-gold)]" />
            جعبه شبیه‌ساز تست پردازش و کلیدهای نگاشت (JSON Parsing Sandbox)
          </h3>
          <p className="text-[10px] text-gray-500 mt-1">
            یک شبیه‌ساز مستقل به منظور راستی‌آزمایی کلیدها و دریافت نتیجه پکیج پاسخ از وب‌سرویس‌ها بدون اثرگذاری بر روی دیتابیس لایو
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] text-gray-400 block font-semibold">پکیج داده دریافتی شبیه‌سازی (Raw JSON Payload)</label>
            <textarea 
              value={testerPayload}
              onChange={(e) => setTesterPayload(e.target.value)}
              rows={8}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-mono text-left direction-ltr text-gray-300 focus:border-[var(--accent-gold)]/50 focus:outline-none"
            />
          </div>

          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 block font-semibold">مسیر کلید نگاشت تستر (JSON Path Selector)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={testerMapping}
                  onChange={(e) => setTesterMapping(e.target.value)}
                  placeholder="data.price"
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-left direction-ltr text-white"
                />
                <button 
                  onClick={handleTestSandboxMapping}
                  className="bg-black/80 hover:bg-black border border-white/10 hover:border-[var(--accent-gold)] text-[var(--accent-gold)] px-4 rounded-xl text-xs font-extrabold transition"
                >
                  اجرا
                </button>
              </div>
            </div>

            {/* Parsing result displaying */}
            <div className="flex-1 bg-black/20 border border-white/5 rounded-xl p-4 flex flex-col justify-center items-center text-center">
              {testerResult !== null ? (
                <div>
                  <span className="text-[10px] text-gray-500">مقدار استخراج شده:</span>
                  <p className="text-xl font-mono font-extrabold text-[var(--accent-emerald)] mt-1">{testerResult.toLocaleString()}</p>
                </div>
              ) : testerError ? (
                <div className="text-red-400 text-xs flex items-center gap-1.5 justify-center">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{testerError}</span>
                </div>
              ) : (
                <span className="text-[10px] text-gray-600">یک مسیر کلید انتخاب نموده و بر روی دکمه اجرا کلیک فرمایید.</span>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default React.memo(ConnectorsTerminal);
