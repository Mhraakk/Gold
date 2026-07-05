const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "import DataTruthCenter from './components/DataTruthCenter';",
  "import DataTruthCenter from './components/DataTruthCenter';\nimport Gold18ForecastPanel from './components/Gold18ForecastPanel';"
);

code = code.replace(
  '{activeTab === "forecast" && (\n              <div className="space-y-4">',
  '{activeTab === "forecast" && (\n              <div className="space-y-6">\n                <Gold18ForecastPanel />'
);

fs.writeFileSync('src/App.tsx', code);
