const fs = require('fs');
let code = fs.readFileSync('package.json', 'utf8');
const pkg = JSON.parse(code);
pkg.scripts.dev = "tsx server.ts";
pkg.scripts.build = "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs";
pkg.scripts.start = "node dist/server.cjs";
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
