const fs = require('fs');

function memoize(file, componentName) {
  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes(`export default React.memo(${componentName})`)) {
    code = code.replace(`export default function ${componentName}`, `const ${componentName} = function ${componentName}`);
    code = code.replace(`export function ${componentName}`, `const ${componentName} = function ${componentName}`);
    
    // Sometimes it's exported at the bottom, sometimes inline
    if (code.includes(`export default ${componentName}`)) {
        code = code.replace(`export default ${componentName}`, `export default React.memo(${componentName})`);
    } else {
        code += `\nexport default React.memo(${componentName});\n`;
    }
    fs.writeFileSync(file, code);
    console.log(`Memoized ${componentName}`);
  }
}

memoize('src/components/ChartTerminal.tsx', 'ChartTerminal');
memoize('src/components/MazanehHunter.tsx', 'MazanehHunter');
memoize('src/components/NextDayForecast.tsx', 'NextDayForecast');
memoize('src/components/LiveMarketSources.tsx', 'LiveMarketSources');
memoize('src/components/ConnectorsTerminal.tsx', 'ConnectorsTerminal');
memoize('src/components/StrategyBuilder.tsx', 'StrategyBuilder');
memoize('src/components/MarketReplayEngine.tsx', 'MarketReplayEngine');
