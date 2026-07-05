const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/    \| "admin"\n/g, '');

const adminButtonRegex = /                \{\(user\?\.email[\s\S]*?\}\)\}\n/g;
code = code.replace(adminButtonRegex, '');

code = code.replace(/            \{activeTab === "admin" && <AdminPanel \/>\}\n/g, '');

// Also remove the profile card
const profileRegex = /            <div className="flex flex-row justify-between items-center bg-\[var\(--bg-panel-heavy\)\] p-3 rounded-xl border border-\[var\(--border-subtle\)\] mb-2 shadow-sm transition-all duration-300 hover:border-\[var\(--accent-gold\)\]\/30">[\s\S]*?<\/div>\n            <\/div>\n/g;
code = code.replace(profileRegex, '');

fs.writeFileSync('src/App.tsx', code);
