import React, { useState, useRef, useEffect } from "react";
import { AssetInfo, MarketStructure } from "../types";
import { Send, Sparkles, Bot, User, Trash2, ArrowRight, ShieldAlert, Cpu, Zap } from "lucide-react";
import { getHermesConfig } from "../services/hermesAgent";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatProps {
  activeAsset: AssetInfo;
  marketStructure: MarketStructure;
  customConfig: {
    provider: string;
    model: string;
    temperature: number;
    apiKey: string;
    systemPrompt: string;
  };
}

export default function AIChat({ activeAsset, marketStructure, customConfig }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHermesMode, setIsHermesMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Sync welcome message on mount and when activeAsset changes
  useEffect(() => {
    if (activeAsset) {
      setMessages([
        {
          role: "assistant",
          content: `### هوش مصنوعی ترمینال طلا فعال شد.
من به عنوان **تحلیل‌گر تخصصی کوانت و استراتژیست بازار** در خدمت شما هستم.

داده‌های لحظه‌ای و ساختار بازار (SMC) برای **${activeAsset.persianName} (${activeAsset.symbol})** با قیمت فعلی **${activeAsset.currentPrice.toLocaleString()} تومان** در دسترس است.

یکی از گزینه‌های پیشنهادی زیر را انتخاب کنید یا سوال خود را مطرح کنید:`,
        },
      ]);
    }
  }, [activeAsset?.id]);

  // Auto-scroll when messages are appended
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setError(null);
    const userMsg: Message = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Build market context payload to send along with the query
      const marketContext = {
        assetId: activeAsset.id,
        currentPrice: activeAsset.currentPrice,
        supports: marketStructure.supportLines,
        resistances: marketStructure.resistanceLines,
      };

      const finalConfig = isHermesMode ? getHermesConfig(customConfig) : customConfig;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          marketContext,
          customConfig: finalConfig,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status} Server Error`);
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Network request failed. Please check backend server log.");
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: `### تاریخچه گفتگو پاکسازی شد.
وضعیت ترمینال مجدداً با داده‌های زنده **${activeAsset.persianName}** همگام‌سازی شد. از من بپرسید!`,
      },
    ]);
  };

  // Pre-configured quantitative query chips
  const promptSuggestions = [
    { label: "تحلیل طلا", query: `تحلیل عمیق SMC و امواج الیوت را برای ${activeAsset.persianName} در قیمت فعلی ${activeAsset.currentPrice} انجام بده.` },
    { label: "یافتن بهترین نقطه ورود", query: `بهترین محدوده‌های ورود برای خرید، ریسک‌های احتمالی و اهداف قیمتی را برای ${activeAsset.persianName} با قیمت ${activeAsset.currentPrice} مشخص کن.` },
    { label: "آربیتراژ طلای آب‌شده", query: "مقایسه انس جهانی طلا (XAUUSD) و طلای آب شده ایران. توضیح بده که چگونه آربیتراژ فعلی دلار (USDIRR آزاد) بر حباب بازار تاثیر می‌گذارد." },
    { label: "اثر رشد شاخص دلار", query: "سناریویی را ارزیابی کن که شاخص دلار آمریکا (DXY) 1.5% رشد کند. همبستگی تاریخی و تاثیر آن بر طلای جهانی در مقابل طلای آب شده را شرح بده." },
  ];

  // Lightweight custom markdown-to-React elements parser to prevent HTML injection and run smoothly on React 19
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith("### ")) {
        return <h4 key={idx} className="text-sm font-display font-semibold text-[var(--accent-gold)] mt-3 mb-1.5">{line.replace("### ", "")}</h4>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={idx} className="text-base font-display font-bold text-[var(--accent-gold)] mt-4 mb-2 border-b border-white/10 pb-1">{line.replace("## ", "")}</h3>;
      }
      if (line.startsWith("# ")) {
        return <h2 key={idx} className="text-lg font-display font-extrabold text-white mt-5 mb-2.5">{line.replace("# ", "")}</h2>;
      }

      // Blockquotes / Warnings
      if (line.startsWith("> ")) {
        return (
          <blockquote key={idx} className="border-l-2 border-amber-500 pl-3 py-1 my-2 text-gray-400 italic bg-[var(--accent-gold)]/5 text-xs">
            {line.replace("> ", "")}
          </blockquote>
        );
      }

      // Bullet points
      if (line.startsWith("- ") || line.startsWith("* ")) {
        const content = line.substring(2);
        return (
          <ul key={idx} className="list-disc pl-5 my-1 text-gray-300">
            <li>{parseInlineFormatting(content)}</li>
          </ul>
        );
      }

      // Check for codeblocks starting
      if (line.trim().startsWith("```")) {
        return null; // Skip code blocks boundary for simplicity, or we can group them
      }

      // Regular paragraph
      return <p key={idx} className="text-gray-300 text-xs leading-relaxed my-1.5">{parseInlineFormatting(line)}</p>;
    });
  };

  // Safe helper to parse bold text (**word**) and code marks (`code`)
  const parseInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="text-white font-medium">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={i} className="bg-white/5 border border-white/10 px-1 py-0.5 rounded text-[var(--accent-gold)] data-value text-[11px] text-[10px]">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  if (!activeAsset) {
    return (
      <div id="ai-chat-widget" className="flex flex-col h-full bg-[#030303]/90 lux-card backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-2xl relative p-6 justify-center items-center text-gray-400 data-value text-[11px] text-xs">
        <Bot className="h-6 w-6 text-[var(--accent-gold)] animate-pulse mb-2" />
        Syncing live data feed...
      </div>
    );
  }

  return (
    <div id="ai-chat-widget" className={`flex flex-col h-full backdrop-blur-md rounded-xl border overflow-hidden shadow-2xl relative ${isHermesMode ? "bg-[#130a1e]/80 border-purple-800/50" : "bg-[#030303]/90 lux-card border-white/10"}`} dir="rtl">
      
      {/* Widget Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isHermesMode ? "border-purple-800/50 bg-purple-950/20" : "border-white/10 bg-black/20"}`}>
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded border ${isHermesMode ? "bg-purple-500/10 border-purple-500/20" : "bg-[var(--accent-gold)]/10 border-[var(--accent-gold)]/20"}`}>
            <Sparkles className={`h-4 w-4 animate-pulse ${isHermesMode ? "text-purple-400" : "text-[var(--accent-gold)]"}`} />
          </div>
          <div>
            <h3 className="text-xs font-display font-bold text-white tracking-wider flex items-center gap-2">
              دستیار هوش مصنوعی ترمینال طلا
              <span className={`px-1.5 py-0.5 rounded text-[9px] data-value text-[11px] ${isHermesMode ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-gray-800 text-gray-400 border border-gray-700"}`}>
                {isHermesMode ? "HERMES" : "STANDARD"}
              </span>
            </h3>
            <p className="text-[10px] text-gray-500 flex items-center gap-1 data-value text-[11px]">
              <Cpu className="h-3 w-3" /> {isHermesMode ? "Hermes Agent Mode" : customConfig.model} @ {isHermesMode ? "0.7" : customConfig.temperature}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHermesMode(!isHermesMode)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition ${
              isHermesMode
                ? "bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
            title="Toggle Hermes Elite Agent Mode"
          >
            <Zap className="h-3 w-3" />
            HERMES
          </button>
          <button
            onClick={clearChat}
            className="p-1.5 rounded text-gray-500 hover:text-[var(--accent-crimson)] hover:bg-[var(--accent-crimson)]/10 transition"
            title="پاک کردن تاریخچه گفتگو"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Message Output Log */}
      <div className="flex-grow p-4 overflow-y-auto space-y-4 max-h-[calc(100vh-250px)] text-right">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 max-w-[88%] ${msg.role === "user" ? "mr-auto flex-row" : "ml-auto"}`}
          >
            {/* Avatar */}
            <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 border ${
              msg.role === "user" 
                ? "bg-[var(--accent-gold)]/10 border-[var(--accent-gold)]/20 text-[var(--accent-gold)]" 
                : isHermesMode
                  ? "bg-purple-900 border-purple-800 text-purple-400"
                  : "bg-white/5 border-white/10 text-gray-400"
            }`}>
              {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : (isHermesMode ? <Zap className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />)}
            </div>

            {/* Bubble content */}
            <div className={`p-3 rounded-lg text-xs leading-relaxed ${
              msg.role === "user"
                ? "bg-[var(--accent-gold)]/10 text-gray-100 border border-[var(--accent-gold)]/20"
                : isHermesMode
                  ? "bg-purple-900/30 text-gray-200 border border-purple-900"
                  : "bg-white/5/60 text-gray-300 border border-white/5"
            }`}>
              {renderMarkdown(msg.content)}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-[80%] ml-auto items-center">
            <div className="h-7 w-7 rounded-full bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/20 flex items-center justify-center shrink-0">
              <Bot className="h-3.5 w-3.5 text-[var(--accent-gold)] animate-spin" />
            </div>
            <div className="bg-white/5/40 border border-gray-950 px-4 py-2.5 rounded-lg flex items-center gap-2">
              <span className="text-[11px] text-gray-400">در حال دریافت جریان داده‌ها و پردازش ساختار بازار (SMC)...</span>
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 bg-[var(--accent-gold)] rounded-full animate-bounce"></span>
                <span className="h-1.5 w-1.5 bg-[var(--accent-gold)] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="h-1.5 w-1.5 bg-[var(--accent-gold)] rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-950/20 border border-rose-900/40 p-3 rounded-lg text-xs text-rose-300 flex items-start gap-2 max-w-[90%]">
            <ShieldAlert className="h-4 w-4 shrink-0 text-[var(--accent-crimson)] mt-0.5" />
            <div>
              <p className="font-semibold">پردازش پرسش با خطا مواجه شد</p>
              <p className="opacity-80">{error}</p>
              <p className="mt-1 text-[10px] text-gray-500">
                متاسفانه در حال حاضر به دلیل ترافیک بالا، سرور قادر به پاسخگویی نیست. لطفاً دقایقی دیگر تلاش کنید.
              </p>
            </div>
          </div>
        )}
        <div ref={scrollRef}></div>
      </div>

      {/* Suggestion Chips */}
      {messages.length <= 2 && !loading && (
        <div className="px-4 py-2 bg-black/5 border-t border-white/5">
          <p className="text-[10px] text-gray-500 mb-1.5 data-value text-[11px]">عملیات‌های معاملاتی هوشمند پیشنهادی:</p>
          <div className="grid grid-cols-2 gap-1.5">
            {promptSuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s.query)}
                className="text-right text-[11px] text-gray-400 hover:text-white hover:bg-white/5 bg-black/40/50 p-2 rounded border border-white/10 transition flex items-center justify-between group"
              >
                <span>{s.label}</span>
                <ArrowRight className="h-3 w-3 text-[var(--accent-gold)] opacity-0 group-hover:opacity-100 transition-all shrink-0 mr-1 rotate-180" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-3 border-t border-white/10 bg-black/40/60 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`درباره ساختار ${activeAsset.symbol} یا رویدادهای ماکرو طلا بپرسید...`}
          disabled={loading}
          className="flex-grow bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 transition font-sans disabled:opacity-50 text-right"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2 bg-[var(--accent-gold)] hover:bg-amber-600 disabled:bg-gray-800 disabled:text-gray-600 text-black rounded-lg transition shrink-0 rotate-180"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
