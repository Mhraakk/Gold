const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/import ConnectorsTerminal from '\.\/components\/ConnectorsTerminal';/, "import { ConnectorsTerminal } from './components/ConnectorsTerminal';");

fs.writeFileSync('src/App.tsx', code);
