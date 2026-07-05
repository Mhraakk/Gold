const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const lines = content.split('\n');
let insideApp = false;
let depth = 0;
let errors = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('export default function App()')) {
    insideApp = true;
  }
  
  if (insideApp) {
    if (line.match(/\bif\b|\bfor\b|\bwhile\b|\bswitch\b/)) {
      // Very naive, just checking if a use* is inside
    }
    
    // We just want to see the sequence of hooks and their indentations.
    if (line.match(/\buse[A-Z]/) || line.match(/useState|useEffect|useRef|useCallback|useMemo/)) {
      console.log((i+1) + ": " + line);
    }
  }
}
