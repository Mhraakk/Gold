import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Add connection state
content = content.replace(
    'const [isAnalyzing, setIsAnalyzing] = useState(false);',
    'const [isAnalyzing, setIsAnalyzing] = useState(false);\n  const [connectionStatus, setConnectionStatus] = useState<"connected" | "reconnecting" | "offline">("connected");'
)

# Update Live Data Engine logic
live_data_effect = """
  // Enterprise Live Data Engine with Auto-Recovery
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;
    let retryCount = 0;
    
    const startLiveDataEngine = () => {
      setConnectionStatus("connected");
      pollingInterval = setInterval(() => {
        try {
          const now = Date.now();
          const p = { ...prices };
          let changed = false;

          for (const asset of assets) {
            // Intelligent Volatility Simulation (Replace with actual WebSocket)
            const meta = ASSETS_METADATA[asset.id];
            const volatility = meta.volatility * (1 + Math.random() * 0.5); // Dynamic volatility injection
            const change = (Math.random() - 0.5) * volatility * p[asset.id];
            p[asset.id] += change;
            
            // Detect abnormal movements (Flash crash / Pump)
            if (Math.abs(change) > p[asset.id] * 0.02) {
               console.warn(`[Risk Engine] Flash Movement Detected on ${asset.symbol}: ${change.toFixed(2)}`);
            }

            if (historicalData[asset.id]) {
              const hist = historicalData[asset.id];
              const lastCandle = hist[hist.length - 1];
              
              if (now - lastCandle.timestamp > 3600000) { // New 1H candle
                hist.push({
                  timestamp: now,
                  open: p[asset.id],
                  high: p[asset.id],
                  low: p[asset.id],
                  close: p[asset.id],
                  volume: Math.floor(Math.random() * 5000),
                });
                if (hist.length > 200) hist.shift(); // Memory Optimization
                changed = true;
              } else {
                lastCandle.close = p[asset.id];
                if (p[asset.id] > lastCandle.high) lastCandle.high = p[asset.id];
                if (p[asset.id] < lastCandle.low) lastCandle.low = p[asset.id];
                lastCandle.volume += Math.floor(Math.random() * 10);
                changed = true;
              }
            }
          }
          
          if (changed) {
             setPrices(p);
             setHistoricalData({ ...historicalData });
          }
          retryCount = 0; // reset on success
        } catch (error) {
          console.error("Live Data Engine Error:", error);
          setConnectionStatus("reconnecting");
          clearInterval(pollingInterval);
          // Exponential backoff
          retryCount++;
          setTimeout(startLiveDataEngine, Math.min(1000 * Math.pow(2, retryCount), 30000));
        }
      }, 1000); // High frequency 1-second refresh rate
    };

    startLiveDataEngine();
    
    // Offline detection
    const handleOffline = () => setConnectionStatus("offline");
    const handleOnline = () => {
      setConnectionStatus("reconnecting");
      setTimeout(() => startLiveDataEngine(), 1000);
    };
    
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      clearInterval(pollingInterval);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [prices, assets, historicalData]);
"""

# Replace the old simulation interval with the new one
content = re.sub(
    r'// Real-time price simulation.*?return \(\) => clearInterval\(interval\);\n  \}, \[prices, assets, historicalData\]\);',
    live_data_effect,
    content,
    flags=re.DOTALL
)

with open("src/App.tsx", "w") as f:
    f.write(content)

