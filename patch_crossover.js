const fs = require('fs');

const path = 'src/components/ChartTerminal.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldBlock = `      // 4.5 Draw Moving Average if active
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
      }`;

const newBlock = `      // 4.5 Draw Moving Average if active
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

      // 4.6 Calculate and Draw Crossovers (EMA 9 and EMA 21 or SMA 9 / SMA 21)
      if (activeOverlays.has("crossover") && candles.length > 21) {
        const calculateSMA = (period) => {
          const sma = [];
          let sum = 0;
          for (let i = 0; i < candles.length; i++) {
            sum += candles[i].close;
            if (i >= period) {
              sum -= candles[i - period].close;
            }
            if (i >= period - 1) {
              sma.push(sum / period);
            } else {
              sma.push(null);
            }
          }
          return sma;
        };

        const sma9 = calculateSMA(9);
        const sma21 = calculateSMA(21);

        // Draw SMA 9
        ctx.strokeStyle = "rgba(52, 211, 153, 0.8)"; // Emerald
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        let started9 = false;
        visibleCandles.forEach((c, idx) => {
          const globalIdx = startIdx + idx;
          const val = sma9[globalIdx];
          if (val !== null) {
            const mx = getX(idx);
            const my = getY(val);
            if (!started9) {
              ctx.moveTo(mx, my);
              started9 = true;
            } else {
              ctx.lineTo(mx, my);
            }
          }
        });
        ctx.stroke();

        // Draw SMA 21
        ctx.strokeStyle = "rgba(251, 191, 36, 0.8)"; // Amber
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        let started21 = false;
        visibleCandles.forEach((c, idx) => {
          const globalIdx = startIdx + idx;
          const val = sma21[globalIdx];
          if (val !== null) {
            const mx = getX(idx);
            const my = getY(val);
            if (!started21) {
              ctx.moveTo(mx, my);
              started21 = true;
            } else {
              ctx.lineTo(mx, my);
            }
          }
        });
        ctx.stroke();

        // Find crossovers and draw markers
        for (let i = 1; i < visibleCandles.length; i++) {
          const globalIdx = startIdx + i;
          const prev9 = sma9[globalIdx - 1];
          const curr9 = sma9[globalIdx];
          const prev21 = sma21[globalIdx - 1];
          const curr21 = sma21[globalIdx];

          if (prev9 !== null && curr9 !== null && prev21 !== null && curr21 !== null) {
            const mx = getX(i);
            if (prev9 <= prev21 && curr9 > curr21) {
              // Bullish Golden Cross
              const my = getY(visibleCandles[i].low) + 15;
              ctx.fillStyle = "rgba(16, 185, 129, 0.2)";
              ctx.beginPath();
              ctx.arc(mx, my, 8, 0, Math.PI * 2);
              ctx.fill();
              
              ctx.fillStyle = "#10B981"; // Emerald
              ctx.beginPath();
              ctx.moveTo(mx, my - 4);
              ctx.lineTo(mx - 4, my + 4);
              ctx.lineTo(mx + 4, my + 4);
              ctx.fill();
            } else if (prev9 >= prev21 && curr9 < curr21) {
              // Bearish Death Cross
              const my = getY(visibleCandles[i].high) - 15;
              ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
              ctx.beginPath();
              ctx.arc(mx, my, 8, 0, Math.PI * 2);
              ctx.fill();
              
              ctx.fillStyle = "#EF4444"; // Red
              ctx.beginPath();
              ctx.moveTo(mx, my + 4);
              ctx.lineTo(mx - 4, my - 4);
              ctx.lineTo(mx + 4, my - 4);
              ctx.fill();
            }
          }
        }
      }`;

if (code.includes('// 4.5 Draw Moving Average if active')) {
  code = code.replace(oldBlock, newBlock);
  fs.writeFileSync(path, code);
  console.log("Successfully patched crossovers");
} else {
  console.log("Could not find the block to replace.");
}

