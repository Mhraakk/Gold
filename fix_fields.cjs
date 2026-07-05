const fs = require('fs');

const path = 'server.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(`        let fields = {};`, `        let fields: any = {};`);
code = code.replace(`    let fields = {};`, `    let fields: any = {};`);

fs.writeFileSync(path, code);
