const fs = require('fs');

const path = 'server.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(`    }
    const { customInputs } = req.body;
    
    // Override fields with custom inputs if provided`, 
`    }
    
    // Override fields with custom inputs if provided`);

fs.writeFileSync(path, code);
