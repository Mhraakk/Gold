const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/import \{ Crosshair, ConnectorsTerminal \} from '\.\/components\/ConnectorsTerminal';/, "import ConnectorsTerminal from './components/ConnectorsTerminal';");
code = code.replace(/import \{/, 'import { Crosshair,'); // Wait, the first one is now import React.

fs.writeFileSync('src/App.tsx', code);
