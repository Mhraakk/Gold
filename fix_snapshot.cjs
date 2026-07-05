const fs = require('fs');

const path = 'server.ts';
let code = fs.readFileSync(path, 'utf8');

const promptFixed = '  "jalaliGeneratedAt": "${new Intl.DateTimeFormat(\"fa-IR\", { year: \"numeric\", month: \"2-digit\", day: \"2-digit\", hour: \"2-digit\", minute: \"2-digit\", timeZone: \"Asia/Tehran\" }).format(new Date())}",';

code = code.replace('  "jalaliGeneratedAt": "${snapshot.jalaliGeneratedAt}",', promptFixed);

fs.writeFileSync(path, code);
