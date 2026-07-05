const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add import
if (!code.includes('ConnectorsTerminal')) {
  code = code.replace(
    "import { AIChat } from './components/AIChat';",
    "import { AIChat } from './components/AIChat';\nimport { ConnectorsTerminal } from './components/ConnectorsTerminal';"
  );
}

// Add the rendering block
const renderBlock = `
            {activeTab === "connectors" && (
              <ConnectorsTerminal />
            )}
`;
// insert it right before `{activeTab === "alerts" && (`
code = code.replace(
  '{activeTab === "alerts" && (',
  renderBlock + '\n            {activeTab === "alerts" && ('
);

fs.writeFileSync('src/App.tsx', code);
