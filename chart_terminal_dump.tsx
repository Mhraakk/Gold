import React, { useRef, useEffect, useState } from "react";
import { Candle, MarketStructure, AssetId } from "../types";
import { ASSETS_METADATA } from "../data";
import { Eye, EyeOff, ZoomIn, ZoomOut, Move, TrendingUp, Sparkles, RefreshCw } from "lucide-react";

interface ChartTerminalProps {
  assetId: AssetId;
  candles: Candle[];
  marketStructure: MarketStructure;
  showAIOverlay: boolean;
  onToggleAIOverlay: () => void;
  aiAnalysis?: import('../types').AnalysisResponse | null;
}

export default function ChartTerminal({
  assetId,
  candles,
  marketStructure,
  showAIOverlay,
  onToggleAIOverlay,
  aiAnalysis,
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

  // Analysis Layer States
  const [activeOverlays, setActiveOverlays] = useState<Set<string>>(new Set(["structure", "volume", "verified_price"]));
  const [timeframe, setTimeframe] = useState<string>("1H");

  const toggleOverlay = (id: string) => {
    setActiveOverlays(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const meta = ASSETS_METADATA[assetId];

  // Force redrawing when candles, zoom, or markers change
  useEffect(() => {
    let animationFrameId: number;

    const renderChart = () => {
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
      ctx.clearRect(0, 0, width, height);

      // Draw ambient trading grid lines
      ctx.strokeStyle = "rgba(134, 134, 139, 0.05)";
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
      
      const isLiveEdge = effectivePan === 0;
      const futureCandlesCount = (showAIOverlay && aiAnalysis && isLiveEdge && aiAnalysis.assetId === assetId) ? 12 : 0;
      const totalRenderCount = visibleCandles.length + futureCandlesCount;

      if (futureCandlesCount > 0 && aiAnalysis) {
        const { entry, takeProfit1, stopLoss } = aiAnalysis.tradeSetup;
        minPrice = Math.min(minPrice, entry, takeProfit1, stopLoss);
        maxPrice = Math.max(maxPrice, entry, takeProfit1, stopLoss);
      }
      
      // Add 10% breathing room top and bottom
      const priceDiff = maxPrice - minPrice || 1;
      minPrice -= priceDiff * 0.1;
      maxPrice += priceDiff * 0.15;

      // Conversion helper coordinate maps
      const getX = (idx: number) => {
        const candleWidth = (width - 70) / totalRenderCount;
        return idx * candleWidth + candleWidth / 2 + 10;
      };
      const getY = (price: number) => {
        const scaleHeight = height - 80;
        return scaleHeight - ((price - minPrice) / (maxPrice - minPrice)) * scaleHeight + 30;
      };

      // 1. Draw SMC Order Blocks if overlay active
      if (activeOverlays.has("structure") && marketStructure.orderBlocks) {
        marketStructure.orderBlocks.forEach((ob) => {
          const yStart = getY(ob.priceStart);
          const yEnd = getY(ob.priceEnd);
          const yMin = Math.min(yStart, yEnd);
          const yMax = Math.max(yStart, yEnd);

          if (ob.type === "bullish") {
            ctx.fillStyle = "rgba(16, 185, 129, 0.06)";
            ctx.strokeStyle = "rgba(16, 185, 129, 0.2)";
          } else {
            ctx.fillStyle = "rgba(239, 68, 68, 0.06)";
            ctx.strokeStyle = "rgba(239, 68, 68, 0.2)";
          }

          ctx.fillRect(0, yMin, width - 70, yMax - yMin);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, yMin);
          ctx.lineTo(width - 70, yMin);
          ctx.moveTo(0, yMax);
          ctx.lineTo(width - 70, yMax);
          ctx.stroke();

          ctx.fillStyle = ob.type === "bullish" ? "rgba(16, 185, 129, 0.6)" : "rgba(239, 68, 68, 0.6)";
          ctx.font = "bold 8px 'JetBrains Mono', monospace";
          ctx.fillText(`${ob.type === "bullish" ? "+" : "-"}OB`, 8, yMin + 10);
        });
      }

      // 2. Draw FVG (Fair Value Gaps) if overlay active
      if (activeOverlays.has("fvg") && marketStructure.fvgs) {
        marketStructure.fvgs.slice(0, 3).forEach((fvg) => {
          const yHigh = getY(fvg.highPrice);
          const yLow = getY(fvg.lowPrice);
          const yMin = Math.min(yHigh, yLow);
          const yMax = Math.max(yHigh, yLow);

          ctx.fillStyle = fvg.type === "bullish" 
            ? "rgba(212, 175, 55, 0.04)" 
            : "rgba(99, 102, 241, 0.04)";
          ctx.strokeStyle = fvg.type === "bullish" 
            ? "rgba(212, 175, 55, 0.12)" 
            : "rgba(99, 102, 241, 0.12)";
          
          ctx.fillRect(40, yMin, width - 110, yMax - yMin);
          ctx.beginPath();
          ctx.rect(40, yMin, width - 110, yMax - yMin);
          ctx.stroke();

          ctx.fillStyle = fvg.type === "bullish" ? "#D4AF37" : "#6366f1";
          ctx.font = "7px 'JetBrains Mono', monospace";
          ctx.fillText("FVG", width - 95, yMin + 8);
        });
      }

      // 3. Draw Fibonacci retracement levels if overlay active
      if (activeOverlays.has("fib") && visibleCandles.length > 5) {
        const fibLevels = [0.236, 0.382, 0.5, 0.618, 0.786];
        const maxL = Math.max(...visibleCandles.map(c => c.high));
        const minL = Math.min(...visibleCandles.map(c => c.low));
        const diffL = maxL - minL;

        fibLevels.forEach((level) => {
          const pLevel = maxL - diffL * level;
          const yL = getY(pLevel);

          const isKeyLevel = level === 0.618 || level === 0.5;
          ctx.strokeStyle = `rgba(212, 175, 55, ${isKeyLevel ? 0.4 : 0.15})`;
          ctx.lineWidth = isKeyLevel ? 1.2 : 0.8;
          ctx.setLineDash(isKeyLevel ? [] : [4, 4]);
          ctx.beginPath();
          ctx.moveTo(0, yL);
          ctx.lineTo(width - 70, yL);
          ctx.stroke();
          ctx.setLineDash([]); 

          ctx.fillStyle = isKeyLevel ? "#D4AF37" : "rgba(212, 175, 55, 0.5)";
          ctx.font = `${isKeyLevel ? "bold" : ""} 8px 'JetBrains Mono', monospace`;
          const fibPct = (level * 100).toFixed(1);
          ctx.fillText(`${fibPct}%`, width - 66, yL + 3);
        });
      }

      // 4. Draw volume bar charts
      if (activeOverlays.has("volume")) {
        const volHeightMax = 40;
        visibleCandles.forEach((c, idx) => {
          const vx = getX(idx);
          const vy = height - 40;
          const volRatio = c.volume / Math.max(...visibleCandles.map(vc => vc.volume));
          const vh = volRatio * volHeightMax;
          
          ctx.fillStyle = c.close >= c.open ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)";
          const barWidth = ((width - 70) / totalRenderCount) * 0.8;
          ctx.fillRect(vx - barWidth / 2, vy + (volHeightMax - vh), barWidth, vh);
        });
      }

      // 4.5 Draw Moving Average if active
      if (activeOverlays.has("ma") && visibleCandles.length > 20) {
        ctx.strokeStyle = "rgba(99, 102, 241, 0.8)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        
        const maPeriod = 20;
        visibleCandles.forEach((c, idx) => {
          if (idx >= maPeriod) {
            const slice = visibleCandles.slice(idx - maPeriod, idx);
            const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
            const ma = sum / maPeriod;
            const mx = getX(idx);
            const my = getY(ma);
            
            if (idx === maPeriod) ctx.moveTo(mx, my);
            else ctx.lineTo(mx, my);
          }
        });
        ctx.stroke();

        // MA Label
        ctx.fillStyle = "rgba(99, 102, 241, 1)";
        ctx.font = "8px 'JetBrains Mono', monospace";
        ctx.fillText("MA (20)", width - 110, height - 15);
      }

      // 5. Draw Japanese Candlesticks (body and wicks)
      visibleCandles.forEach((c, idx) => {
        const cx = getX(idx);
        const cyOpen = getY(c.open);
        const cyClose = getY(c.close);
        const cyHigh = getY(c.high);
        const cyLow = getY(c.low);

        const isBullish = c.close >= c.open;
        ctx.strokeStyle = isBullish ? "#50c878" : "#ff6b6b";
        ctx.fillStyle = isBullish ? "#50c878" : "#ff6b6b";
        ctx.lineWidth = 1.5;

        // Draw Wick lines
        ctx.beginPath();
        ctx.moveTo(cx, cyHigh);
        ctx.lineTo(cx, cyLow);
        ctx.stroke();

        // Draw Candlestick solid Body rectangle
        const rectWidth = Math.max(2, ((width - 70) / totalRenderCount) * 0.7);
        const rectY = Math.min(cyOpen, cyClose);
        const rectHeight = Math.max(1, Math.abs(cyOpen - cyClose));
        
        ctx.fillRect(cx - rectWidth / 2, rectY, rectWidth, rectHeight);
      });

      // 6. Draw Elliott Wave counts
      if (activeOverlays.has("waves") && marketStructure.waves) {
        marketStructure.waves.forEach((wv) => {
          if (wv.index >= startIdx && wv.index < endIdx) {
            const relativeIdx = wv.index - startIdx;
            const wx = getX(relativeIdx);
            const wy = getY(wv.price);

            // Refined small markers
            ctx.beginPath();
            ctx.arc(wx, wy, 8, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(5, 5, 6, 0.8)";
            ctx.fill();
            ctx.strokeStyle = "#D4AF37";
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = "#D4AF37";
            ctx.font = "bold 8px 'JetBrains Mono', monospace";
            ctx.textAlign = "center";
            ctx.fillText(wv.label, wx, wy + 3);
            ctx.textAlign = "start"; 
          }
        });
      }

      // 6.7 Draw Verified Current Price Line (Layer 1)
      if (activeOverlays.has("verified_price") && candles.length > 0) {
        const lastCandle = candles[candles.length - 1];
        const lastY = getY(lastCandle.close);
        ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(0, lastY);
        ctx.lineTo(width - 70, lastY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 6.5 Draw AI Forecast Pathways
      if (activeOverlays.has("structure") && aiAnalysis && aiAnalysis.assetId === assetId && visibleCandles.length > 0) {
        const lastIdx = visibleCandles.length - 1;
        const lastX = getX(lastIdx);
        const lastPrice = visibleCandles[lastIdx].close;
        const lastY = getY(lastPrice);

        const entryPrice = aiAnalysis.tradeSetup.entry;
        const slPrice = aiAnalysis.tradeSetup.stopLoss;
        const tpPrice = aiAnalysis.tradeSetup.takeProfit1;

        const entryY = getY(entryPrice);
        const slY = getY(slPrice);
        const tpY = getY(tpPrice);

        const candleWidth = (width - 70) / totalRenderCount;
        
        // Draw Primary Pathway (to TP)
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        const entryX = lastX + candleWidth * 5;
        ctx.lineTo(entryX, entryY);
        const tpX = entryX + candleWidth * 10;
        ctx.lineTo(tpX, tpY);
        
        ctx.strokeStyle = aiAnalysis.trend === "BULLISH" ? "rgba(16, 185, 129, 0.8)" : "rgba(239, 68, 68, 0.8)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();

        ctx.fillStyle = ctx.strokeStyle;
        ctx.font = "10px var(--font-sans)";
        ctx.fillText(aiAnalysis.trend === "BULLISH" ? "مسیر صعودی اصلی" : "مسیر نزولی اصلی", tpX + 5, tpY);

        // Draw Alternative Pathway (to SL)
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(entryX, entryY);
        const slX = entryX + candleWidth * 8;
        ctx.lineTo(slX, slY);
        
        ctx.strokeStyle = "rgba(245, 158, 11, 0.8)";
        ctx.stroke();

        ctx.fillStyle = ctx.strokeStyle;
        ctx.fillText("مسیر جایگزین", slX + 5, slY);

        ctx.setLineDash([]);
      }

      // 7. Render Price axis and Labels on Right Sidebar (width - 70 to width)
      ctx.fillStyle = "#050506";
      ctx.fillRect(width - 70, 0, 70, height);
      ctx.strokeStyle = "rgba(212, 175, 55, 0.1)";
      ctx.beginPath();
      ctx.moveTo(width - 70, 0);
      ctx.lineTo(width - 70, height);
      ctx.stroke();

      // Price grids marking right panel
      ctx.fillStyle = "rgba(180, 180, 190, 0.6)";
      ctx.font = "9px 'JetBrains Mono', monospace";
      const priceGrids = [minPrice, minPrice + priceDiff * 0.25, minPrice + priceDiff * 0.5, minPrice + priceDiff * 0.75, maxPrice];
      priceGrids.forEach((pg) => {
        const yGrid = getY(pg);
        ctx.fillText(pg.toLocaleString(undefined, { maximumFractionDigits: meta.decimals }), width - 64, yGrid + 3);
      });

      // Highlight current active price on right bar
      if (candles.length > 0) {
        const lastCandle = candles[candles.length - 1];
        const cyLastPrice = getY(lastCandle.close);
        
        // Draw subtle gold glow container
        ctx.fillStyle = "rgba(212, 175, 55, 0.12)";
        ctx.fillRect(width - 70, cyLastPrice - 10, 70, 18);
        ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
        ctx.lineWidth = 1;
        ctx.strokeRect(width - 70, cyLastPrice - 10, 70, 18);

        ctx.fillStyle = "#D4AF37";
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.fillText(
          lastCandle.close.toLocaleString(undefined, { maximumFractionDigits: meta.decimals }),
          width - 66,
          cyLastPrice + 2
        );
      }

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
        ctx.fillStyle = "#0d0d10";
        ctx.fillRect(width - 70, crosshair.y - 8, 70, 16);
        ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
        ctx.lineWidth = 1;
        ctx.strokeRect(width - 70, crosshair.y - 8, 70, 16);
        ctx.fillStyle = "#D4AF37";
        ctx.font = "bold 8px 'JetBrains Mono', monospace";
        ctx.fillText(
          crosshairPrice.toLocaleString(undefined, { maximumFractionDigits: meta.decimals }),
          width - 66,
          crosshair.y + 4
        );
      }
    };

    animationFrameId = requestAnimationFrame(renderChart);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [candles, marketStructure, zoomFactor, panOffset, crosshair, activeOverlays, drawnLines, activeDrawStart, selectedTool, assetId, aiAnalysis]);

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
    
    const isLiveEdge = effectivePan === 0;
    const futureCandlesCount = (showAIOverlay && aiAnalysis && isLiveEdge && aiAnalysis.assetId === assetId) ? 12 : 0;
    const totalRenderCount = visibleCandles.length + futureCandlesCount;
    
    const candleWidth = (rect.width - 70) / totalRenderCount;
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

  const handleMouseUp = () => {
    // Placeholder for drag-end logic if needed in future
  };

  const clearDrawings = () => {
    setDrawnLines([]);
    setActiveDrawStart(null);
  };

  return (
    <div ref={containerRef} id="gold-terminal-chart" className="flex flex-col h-full lux-card lux-breathe border border-[var(--accent-gold)]/20 glass-panel-heavy lux-card rounded-2xl overflow-hidden relative">
      
      {/* 1. PROFESSIONAL CONTROL BAR */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-white/5 bg-[#0a0a0c] backdrop-blur-xl z-20 gap-4">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-pulse"></div>
            <span className="font-sans font-bold tracking-[0.2em] text-[#D4AF37] uppercase text-xs">{meta.symbol}</span>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
            {["1m", "5m", "15m", "1H", "4H", "1D"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-sans transition-all duration-200 ${
                  timeframe === tf ? "bg-[#D4AF37] text-black font-bold" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Analysis Toggles */}
          <div className="flex items-center gap-1.5 border-l border-white/10 pl-5">
            {[
              { id: "structure", label: "ساختار" },
              { id: "fib", label: "فیبو" },
              { id: "fvg", label: "FVG" },
              { id: "waves", label: "الیوت" },
              { id: "volume", label: "حجم" },
              { id: "ma", label: "MA" }
            ].map((tool) => (
              <button
                key={tool.id}
                onClick={() => toggleOverlay(tool.id)}
                className={`px-3 py-1 rounded-full text-[10px] border transition-all duration-300 ${
                  activeOverlays.has(tool.id)
                    ? "bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.05)]"
                    : "bg-transparent border-white/5 text-gray-500 hover:border-white/20"
                }`}
              >
                {tool.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tool selectors */}
          <div className="flex items-center bg-black/40 border border-white/5 rounded-lg p-0.5">
            <button
              onClick={() => { setSelectedTool("cursor"); setActiveDrawStart(null); }}
              className={`p-1.5 rounded-md transition-all ${selectedTool === "cursor" ? "text-[#D4AF37] bg-white/5" : "text-gray-500"}`}
            >
              <Move className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setSelectedTool("trendline")}
              className={`p-1.5 rounded-md transition-all ${selectedTool === "trendline" ? "text-[#D4AF37] bg-white/5" : "text-gray-500"}`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-white/10"></div>

          {/* View Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setZoomFactor(prev => Math.min(4, prev + 0.2))}
              className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setZoomFactor(prev => Math.max(0.4, prev - 0.2))}
              className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPanOffset(0)}
              className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] border border-emerald-500/20 hover:bg-emerald-500/20 transition-all font-sans font-bold"
            >
              LIVE
            </button>
          </div>
        </div>
      </div>

      {/* 2. OHLC DATA RIBBON (Layer 1 Always Visible) */}
      <div className="flex items-center gap-6 px-4 py-1.5 bg-[#08080a] border-b border-white/5 text-[10px] font-sans text-gray-500">
        {hoveredCandle ? (
          <>
            <div className="flex gap-4">
              <span>O: <span className="text-gray-300 tabular-nums">{hoveredCandle.open.toLocaleString()}</span></span>
              <span>H: <span className="text-emerald-500 tabular-nums">{hoveredCandle.high.toLocaleString()}</span></span>
              <span>L: <span className="text-rose-500 tabular-nums">{hoveredCandle.low.toLocaleString()}</span></span>
              <span>C: <span className="text-gray-300 tabular-nums">{hoveredCandle.close.toLocaleString()}</span></span>
            </div>
            <div className="h-3 w-[1px] bg-white/10"></div>
            <span>V: <span className="text-gray-400 tabular-nums">{hoveredCandle.volume.toLocaleString()}</span></span>
          </>
        ) : (
          <span className="italic opacity-60">مشاهده جزئیات نرخ: مکان‌نما را روی نمودار حرکت دهید</span>
        )}
      </div>

      {/* 3. PRIMARY interactive Canvas element */}
      <div className="flex-grow w-full relative min-h-[300px]">
        {candles.length === 0 && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-[var(--accent-gold)] animate-spin opacity-50" />
              <span className="text-xs text-gray-400 font-sans animate-pulse">در حال دریافت داده‌های نمودار...</span>
            </div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className="w-full h-full cursor-crosshair block"
        />
      </div>

      {/* 4. MARKET DECISION PANEL (Layer 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-[#0a0a0c] border-t border-white/5">
        <div className="space-y-1">
          <span className="text-[9px] text-gray-500 uppercase tracking-tighter">ساختار بازار</span>
          <div className={`text-[11px] font-bold ${marketStructure.trend === "BULLISH" ? "text-emerald-400" : "text-rose-400"}`}>
            {marketStructure.trend === "BULLISH" ? "صعودی (Bullish)" : "نزولی (Bearish)"}
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[9px] text-gray-500 uppercase tracking-tighter">محدوده بحرانی</span>
          <div className="text-[11px] font-bold text-gray-200 tabular-nums">
            {marketStructure.fvgs?.[0]?.highPrice.toLocaleString() || "---"}
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[9px] text-gray-500 uppercase tracking-tighter">اطمینان تحلیل</span>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#D4AF37]" style={{ width: "75%" }}></div>
            </div>
            <span className="text-[10px] text-[#D4AF37] font-bold">۷۵٪</span>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[9px] text-gray-500 uppercase tracking-tighter">وضعیت داده</span>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] text-emerald-500 font-medium">زنده (LIVE)</span>
          </div>
        </div>
      </div>
      
    </div>
  );
}
