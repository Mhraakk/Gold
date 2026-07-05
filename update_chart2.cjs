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

fs.writeFileSync('src/components/ChartTerminal.tsx', code);
console.log("Updated active overlays and toggles");
