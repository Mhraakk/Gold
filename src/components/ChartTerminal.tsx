import React, { useRef, useEffect, useState } from "react";
import { Candle, MarketStructure, AssetId } from "../types";
import { ASSETS_METADATA } from "../data";
import { Eye, EyeOff, ZoomIn, ZoomOut, Move, TrendingUp, Sparkles } from "lucide-react";

interface ChartTerminalProps {
  assetId: AssetId;
  candles: Candle[];
  marketStructure: MarketStructure;
  showAIOverlay: boolean;
  onToggleAIOverlay: () => void;
}

export default function ChartTerminal({
  assetId,
  candles,
  marketStructure,
  showAIOverlay,
  onToggleAIOverlay,
}: ChartTerminalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Chart view states
  const [zoomFactor, setZoomFactor] = useState(1); // 1 = normal, larger = zoomed in, smaller = zoomed out
  const [panOffset, setPanOffset] = useState(0); // Pan candles offset
  const [crosshair, setCrosshair] = useState<{ x: number; y: number } | null>(null);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  
  // Selected tool
  const [selectedTool, setSelectedTool] = useState<"cursor" | "trendline">("cursor");
  const [drawnLines, setDrawnLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);
  const [activeDrawStart, setActiveDrawStart] = useState<{ x: number; y: number } | null>(null);

  const meta = ASSETS_METADATA[assetId];

  // Force redrawing when candles, zoom, or markers change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set high-DPI canvas resolution
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear with premium pitch-black glass background
    ctx.fillStyle = "#030712";
    ctx.fillRect(0, 0, width, height);

    // Draw ambient trading grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
    ctx.lineWidth = 1;
    const gridCols = 10;
    for (let i = 0; i <= gridCols; i++) {
      const x = (width / gridCols) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    const gridRows = 8;
    for (let i = 0; i <= gridRows; i++) {
      const y = (height / gridRows) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (candles.length === 0) return;

    // Min-Max calculations based on visible portion
    const baseCandlesToRender = 40;
    const visibleCount = Math.max(15, Math.min(candles.length, Math.round(baseCandlesToRender / zoomFactor)));
    
    // Pan boundaries
    const maxOffset = candles.length - visibleCount;
    const effectivePan = Math.max(0, Math.min(maxOffset, Math.round(panOffset)));
    
    const startIdx = candles.length - visibleCount - effectivePan;
    const endIdx = candles.length - effectivePan;
    const visibleCandles = candles.slice(Math.max(0, startIdx), endIdx);

    let minPrice = Math.min(...visibleCandles.map(c => c.low));
    let maxPrice = Math.max(...visibleCandles.map(c => c.high));
    
    // Add 10% breathing room top and bottom
    const priceDiff = maxPrice - minPrice || 1;
    minPrice -= priceDiff * 0.1;
    maxPrice += priceDiff * 0.15;

    // Conversion helper coordinate maps
    const getX = (idx: number) => {
      const candleWidth = (width - 70) / visibleCandles.length;
      return idx * candleWidth + candleWidth / 2 + 10;
    };
    const getY = (price: number) => {
      const scaleHeight = height - 80;
      return scaleHeight - ((price - minPrice) / (maxPrice - minPrice)) * scaleHeight + 30;
    };

    // 1. Draw SMC Order Blocks if AI Overlay is turned on
    if (showAIOverlay && marketStructure.orderBlocks) {
      marketStructure.orderBlocks.forEach((ob) => {
        const yStart = getY(ob.priceStart);
        const yEnd = getY(ob.priceEnd);
        const yMin = Math.min(yStart, yEnd);
        const yMax = Math.max(yStart, yEnd);

        // Bullish OB: Elegant Emerald translucent band, Bearish: Crimson
        if (ob.type === "bullish") {
          ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
          ctx.strokeStyle = "rgba(16, 185, 129, 0.25)";
        } else {
          ctx.fillStyle = "rgba(239, 68, 68, 0.08)";
          ctx.strokeStyle = "rgba(239, 68, 68, 0.25)";
        }

        ctx.fillRect(0, yMin, width - 70, yMax - yMin);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, yMin);
        ctx.lineTo(width - 70, yMin);
        ctx.moveTo(0, yMax);
        ctx.lineTo(width - 70, yMax);
        ctx.stroke();

        // Label OB on right border
        ctx.fillStyle = ob.type === "bullish" ? "#10b981" : "#ef4444";
        ctx.font = "9px var(--font-mono)";
        ctx.fillText(`+OB (${meta.symbol})`, 15, yMin + 12);
      });
    }

    // 2. Draw FVG (Fair Value Gaps) if overlay active
    if (showAIOverlay && marketStructure.fvgs) {
      marketStructure.fvgs.forEach((fvg) => {
        const yHigh = getY(fvg.highPrice);
        const yLow = getY(fvg.lowPrice);
        const yMin = Math.min(yHigh, yLow);
        const yMax = Math.max(yHigh, yLow);

        ctx.fillStyle = fvg.type === "bullish" 
          ? "rgba(245, 158, 11, 0.06)" 
          : "rgba(99, 102, 241, 0.06)";
        ctx.strokeStyle = fvg.type === "bullish" 
          ? "rgba(245, 158, 11, 0.15)" 
          : "rgba(99, 102, 241, 0.15)";
        
        ctx.fillRect(20, yMin, width - 90, yMax - yMin);
        ctx.beginPath();
        ctx.rect(20, yMin, width - 90, yMax - yMin);
        ctx.stroke();

        ctx.fillStyle = fvg.type === "bullish" ? "#f59e0b" : "#6366f1";
        ctx.font = "8px var(--font-sans)";
        ctx.fillText(`FVG (${fvg.status})`, width - 140, yMin + 10);
      });
    }

    // 3. Draw Fibonacci retracement levels if overlay active
    if (showAIOverlay && visibleCandles.length > 5) {
      const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
      const maxL = Math.max(...visibleCandles.map(c => c.high));
      const minL = Math.min(...visibleCandles.map(c => c.low));
      const diffL = maxL - minL;

      fibLevels.forEach((level) => {
        const pLevel = maxL - diffL * level;
        const yL = getY(pLevel);

        ctx.strokeStyle = `rgba(234, 179, 8, ${level === 0.618 || level === 0.5 ? 0.3 : 0.1})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(10, yL);
        ctx.lineTo(width - 70, yL);
        ctx.stroke();
        ctx.setLineDash([]); // Reset

        ctx.fillStyle = "rgba(234, 179, 8, 0.55)";
        ctx.font = "9px var(--font-mono)";
        ctx.fillText(`FIB ${level * 100}%: ${pLevel.toLocaleString(undefined, { maximumFractionDigits: meta.decimals })}`, width - 180, yL - 4);
      });
    }

    // 4. Draw volume bar charts inside bottom panel (bottom 15%)
    const volHeightMax = 50;
    visibleCandles.forEach((c, idx) => {
      const vx = getX(idx);
      const vy = height - 50;
      const volRatio = c.volume / Math.max(...visibleCandles.map(vc => vc.volume));
      const vh = volRatio * volHeightMax;
      
      ctx.fillStyle = c.close >= c.open ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)";
      const barWidth = ((width - 70) / visibleCandles.length) * 0.75;
      ctx.fillRect(vx - barWidth / 2, vy + (volHeightMax - vh), barWidth, vh);
    });

    // 5. Draw Japanese Candlesticks (body and wicks)
    visibleCandles.forEach((c, idx) => {
      const cx = getX(idx);
      const cyOpen = getY(c.open);
      const cyClose = getY(c.close);
      const cyHigh = getY(c.high);
      const cyLow = getY(c.low);

      const isBullish = c.close >= c.open;
      ctx.strokeStyle = isBullish ? "#10b981" : "#ef4444";
      ctx.fillStyle = isBullish ? "#10b981" : "#ef4444";
      ctx.lineWidth = 1.5;

      // Draw Wick lines
      ctx.beginPath();
      ctx.moveTo(cx, cyHigh);
      ctx.lineTo(cx, cyLow);
      ctx.stroke();

      // Draw Candlestick solid Body rectangle
      const rectWidth = Math.max(2, ((width - 70) / visibleCandles.length) * 0.7);
      const rectY = Math.min(cyOpen, cyClose);
      const rectHeight = Math.max(1, Math.abs(cyOpen - cyClose));
      
      ctx.fillRect(cx - rectWidth / 2, rectY, rectWidth, rectHeight);
    });

    // 6. Draw Elliott Wave counts
    if (showAIOverlay && marketStructure.waves) {
      ctx.font = "bold 11px var(--font-display)";
      marketStructure.waves.forEach((wv) => {
        // Only draw if wave coordinate fits current zoom view index
        if (wv.index >= startIdx && wv.index < endIdx) {
          const relativeIdx = wv.index - startIdx;
          const wx = getX(relativeIdx);
          const wy = getY(wv.price);

          // Draw neon golden nodes
          ctx.beginPath();
          ctx.arc(wx, wy, 12, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(20, 16, 5, 0.9)";
          ctx.fill();
          ctx.strokeStyle = "#eab308";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = "#eab308";
          ctx.textAlign = "center";
          ctx.fillText(wv.label, wx, wy + 4);
          ctx.textAlign = "start"; // Restore default
        }
      });
    }

    // 7. Render Price axis and Labels on Right Sidebar (width - 70 to width)
    ctx.fillStyle = "#0c1020";
    ctx.fillRect(width - 70, 0, 70, height);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.moveTo(width - 70, 0);
    ctx.lineTo(width - 70, height);
    ctx.stroke();

    // Price grids marking right panel
    ctx.fillStyle = "rgba(156, 163, 175, 0.7)";
    ctx.font = "9px var(--font-mono)";
    const priceGrids = [minPrice, minPrice + priceDiff * 0.25, minPrice + priceDiff * 0.5, minPrice + priceDiff * 0.75, maxPrice];
    priceGrids.forEach((pg) => {
      const yGrid = getY(pg);
      ctx.fillText(pg.toLocaleString(undefined, { maximumFractionDigits: meta.decimals }), width - 64, yGrid + 3);
    });

    // Highlight current active price on right bar
    const lastCandle = candles[candles.length - 1];
    const cyLastPrice = getY(lastCandle.close);
    ctx.fillStyle = lastCandle.close >= lastCandle.open ? "#10b981" : "#ef4444";
    ctx.fillRect(width - 70, cyLastPrice - 10, 70, 18);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px var(--font-mono)";
    ctx.fillText(
      lastCandle.close.toLocaleString(undefined, { maximumFractionDigits: meta.decimals }),
      width - 66,
      cyLastPrice + 2
    );

    // 8. Custom user drawn lines
    drawnLines.forEach((ln) => {
      ctx.strokeStyle = "rgba(249, 115, 22, 0.75)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ln.x1, ln.y1);
      ctx.lineTo(ln.x2, ln.y2);
      ctx.stroke();
    });

    // Temp line being drawn
    if (activeDrawStart && crosshair) {
      ctx.strokeStyle = "rgba(249, 115, 22, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(activeDrawStart.x, activeDrawStart.y);
      ctx.lineTo(crosshair.x, crosshair.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 9. Interactive Crosshairs rendering
    if (crosshair) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Horizonal
      ctx.beginPath();
      ctx.moveTo(0, crosshair.y);
      ctx.lineTo(width - 70, crosshair.y);
      ctx.stroke();

      // Vertical
      ctx.beginPath();
      ctx.moveTo(crosshair.x, 0);
      ctx.lineTo(crosshair.x, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Horizonal axis marker price
      const crosshairPrice = maxPrice - ((crosshair.y - 30) / (height - 80)) * (maxPrice - minPrice);
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(width - 70, crosshair.y - 8, 70, 16);
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "9px var(--font-mono)";
      ctx.fillText(
        crosshairPrice.toLocaleString(undefined, { maximumFractionDigits: meta.decimals }),
        width - 66,
        crosshair.y + 3
      );
    }
  }, [candles, marketStructure, zoomFactor, panOffset, crosshair, showAIOverlay, drawnLines, activeDrawStart, selectedTool, assetId]);

  // Handle pointer tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x > rect.width - 70) {
      setCrosshair(null);
      return;
    }

    setCrosshair({ x, y });

    // Detect hovered candlestick index
    const baseCandlesToRender = 40;
    const visibleCount = Math.max(15, Math.min(candles.length, Math.round(baseCandlesToRender / zoomFactor)));
    const maxOffset = candles.length - visibleCount;
    const effectivePan = Math.max(0, Math.min(maxOffset, Math.round(panOffset)));
    const startIdx = candles.length - visibleCount - effectivePan;
    
    const visibleCandles = candles.slice(Math.max(0, startIdx), candles.length - effectivePan);
    const candleWidth = (rect.width - 70) / visibleCandles.length;
    const hoverIdx = Math.floor((x - 10) / candleWidth);

    if (hoverIdx >= 0 && hoverIdx < visibleCandles.length) {
      setHoveredCandle(visibleCandles[hoverIdx]);
    } else {
      setHoveredCandle(null);
    }
  };

  const handleMouseLeave = () => {
    setCrosshair(null);
    setHoveredCandle(null);
    setActiveDrawStart(null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === "trendline" && crosshair) {
      if (!activeDrawStart) {
        setActiveDrawStart({ x: crosshair.x, y: crosshair.y });
      } else {
        setDrawnLines([
          ...drawnLines,
          { x1: activeDrawStart.x, y1: activeDrawStart.y, x2: crosshair.x, y2: crosshair.y },
        ]);
        setActiveDrawStart(null);
      }
    }
  };

  const clearDrawings = () => {
    setDrawnLines([]);
    setActiveDrawStart(null);
  };

  return (
    <div ref={containerRef} id="gold-terminal-chart" className="flex flex-col h-full bg-[#030712] rounded-xl overflow-hidden border border-gray-800 shadow-2xl relative">
      
      {/* Chart Top bar metadata display */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-950/60 backdrop-blur text-xs z-10 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 live-dot"></span>
            <span className="font-display font-semibold tracking-wide text-white">{meta.symbol}</span>
          </div>
          <span className="text-gray-500 font-mono">یک‌ساعته (1H)</span>
          <div className="h-3 w-[1px] bg-gray-800"></div>
          
          {hoveredCandle ? (
            <div className="flex items-center gap-2 font-mono text-gray-400 text-[11px] flex-row">
              <span>باز: <strong className="text-white">{hoveredCandle.open.toLocaleString()}</strong></span>
              <span>بیشترین: <strong className="text-emerald-400">{hoveredCandle.high.toLocaleString()}</strong></span>
              <span>کمترین: <strong className="text-rose-400">{hoveredCandle.low.toLocaleString()}</strong></span>
              <span>بسته: <strong className="text-white">{hoveredCandle.close.toLocaleString()}</strong></span>
              <span className="hidden sm:inline">حجم: <strong className="text-blue-400">{hoveredCandle.volume.toLocaleString()}</strong></span>
            </div>
          ) : (
            <span className="text-gray-500 italic font-sans">جهت مشاهده جزئیات نرخ، مکان‌نما را روی چارت ببرید</span>
          )}
        </div>

        {/* Chart Drawing Tools & overlays controller */}
        <div className="flex items-center gap-2">
          {/* Tool selectors */}
          <div className="flex items-center bg-gray-900 border border-gray-800 rounded-md p-0.5">
            <button
              onClick={() => { setSelectedTool("cursor"); setActiveDrawStart(null); }}
              className={`p-1.5 rounded text-gray-400 hover:text-white transition ${selectedTool === "cursor" ? "bg-gray-800 text-amber-400" : ""}`}
              title="مکان‌نمای ضربدری"
            >
              <Move className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setSelectedTool("trendline")}
              className={`p-1.5 rounded text-gray-400 hover:text-white transition ${selectedTool === "trendline" ? "bg-gray-800 text-amber-400" : ""}`}
              title="ترسیم خطوط روند"
            >
              <TrendingUp className="h-3.5 w-3.5" />
            </button>
          </div>

          {drawnLines.length > 0 && (
            <button
              onClick={clearDrawings}
              className="text-[10px] text-rose-400 hover:text-rose-300 bg-rose-950/30 px-2 py-1 rounded border border-rose-900/40 font-sans"
            >
              پاک کردن ترسیمات
            </button>
          )}

          <div className="h-3 w-[1px] bg-gray-800"></div>

          {/* AI Overlay toggle */}
          <button
            onClick={onToggleAIOverlay}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-sans font-medium transition ${
              showAIOverlay
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(234,179,8,0.08)]"
                : "bg-gray-900 text-gray-400 border border-gray-800 hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>لایه‌های هوشمند SMC</span>
            {showAIOverlay ? <Eye className="h-3 w-3 ml-1" /> : <EyeOff className="h-3 w-3 ml-1" />}
          </button>

          {/* Manual Zoom buttons */}
          <div className="flex items-center bg-gray-900 border border-gray-800 rounded-md p-0.5">
            <button
              onClick={() => setZoomFactor(prev => Math.min(4, prev + 0.15))}
              className="p-1 rounded text-gray-400 hover:text-white"
              title="بزرگ‌نمایی"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setZoomFactor(prev => Math.max(0.4, prev - 0.15))}
              className="p-1 rounded text-gray-400 hover:text-white"
              title="کوچک‌نمایی"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Navigation pan controls */}
          <div className="flex items-center bg-gray-900 border border-gray-800 rounded-md p-0.5 text-[10px] font-sans text-gray-400">
            <button
              onClick={() => setPanOffset(prev => prev + 2)}
              className="px-1.5 py-0.5 hover:text-white"
              title="انتقال به چپ"
            >
              &larr;
            </button>
            <button
              onClick={() => setPanOffset(0)}
              className="px-1 py-0.5 hover:text-white border-x border-gray-800"
              title="بازنشانی نمای اصلی"
            >
              زنده
            </button>
            <button
              onClick={() => setPanOffset(prev => Math.max(0, prev - 2))}
              className="px-1.5 py-0.5 hover:text-white"
              title="انتقال به راست"
            >
              &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Primary interactive Canvas element */}
      <div className="flex-grow w-full relative min-h-[300px]">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          className="w-full h-full cursor-crosshair block"
        />
      </div>
      
    </div>
  );
}
