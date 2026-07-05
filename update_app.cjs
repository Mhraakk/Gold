const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  /                  <\/div>\n                <\/div>\n\n                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">/,
  `                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  <VolatilityDistribution />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">`
);
fs.writeFileSync('src/App.tsx', code);
