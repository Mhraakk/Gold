const fs = require('fs');
let code = fs.readFileSync('src/components/ChartTerminal.tsx', 'utf8');

// Add crossover to default active overlays
code = code.replace(
  /const \[activeOverlays, setActiveOverlays\] = useState<Set<string>>\(new Set\(\["structure", "volume", "verified_price"\]\)\);/,
  'const [activeOverlays, setActiveOverlays] = useState<Set<string>>(new Set(["structure", "volume", "verified_price", "crossover"]));'
);

// Add crossover to the buttons list
code = code.replace(
  /\{ id: "ma", label: "MA" \}/,
  '{ id: "ma", label: "MA" },\n              { id: "crossover", label: "کراس‌اور" }'
);

// We need to inject the MA crossover calculation before the actual drawing.
// Look for where we start drawing lines.
const drawWavesRegex = /\/\/ 6\. Draw Elliott Wave counts/;

// The MA logic starts around "// 4.5 Draw Moving Average if active"
// We will replace that whole block or add after it. Let's look at the dump.
