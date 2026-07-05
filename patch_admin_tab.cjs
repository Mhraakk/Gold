const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const anchor = `{activeTab === "markets" && (`;
const injection = `{activeTab === "admin" && <AdminPanel />}
            {activeTab === "markets" && (`;

code = code.replace(anchor, injection);
fs.writeFileSync('src/App.tsx', code);
