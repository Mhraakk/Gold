const fs = require('fs');

const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `onToggleAIOverlay={() => setShowAIOverlay(!showAIOverlay)}`,
  `onToggleAIOverlay={useCallback(() => setShowAIOverlay(prev => !prev), [])}`
);

fs.writeFileSync(path, code);
