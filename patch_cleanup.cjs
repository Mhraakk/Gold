const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove terminal-settings-console section
const settingsRegex = /            \{\/\* DYNAMIC SETTINGS CONSOLE AT BOTTOM \*\/\}[\s\S]*?<\/section>/;
code = code.replace(settingsRegex, '');

// Remove connectors tab content
// It starts with `{activeTab === "connectors" && (` and ends right before `          </React.Suspense>` 
// Actually wait, let's just find where it starts and use a regex to match until a known string that comes after it.
// The next section after connectors could be the closing tags or `terminal-settings-console` (which we just removed).
// Wait, the settings console is outside any activeTab check? No, it's at the bottom of the main content area.
const connectorsRegex = /          \{activeTab === "connectors" && \([\s\S]*?\}\)\}\n/g;
// That might be dangerous if there are other `)}` that are not the end.
// Let's replace by finding the exact start and end.
