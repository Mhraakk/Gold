const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<div className="pt-6 border-t border-\[var\(--border-subtle\)\] space-y-3 text-\[10px\] text-\[var\(--text-secondary\)\] font-sans text-right mt-4">[\s\S]*?<\/aside>/;
code = code.replace(regex, '</aside>');
fs.writeFileSync('src/App.tsx', code);
