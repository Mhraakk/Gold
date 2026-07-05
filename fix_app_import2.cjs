const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/import \{ Crosshair, useTheme \} from "\.\/contexts\/ThemeContext";/, 'import { useTheme } from "./contexts/ThemeContext";');

// Find the lucide-react import
code = code.replace(/import \{\n  Sparkles,/, 'import {\n  Crosshair,\n  Sparkles,');

fs.writeFileSync('src/App.tsx', code);
