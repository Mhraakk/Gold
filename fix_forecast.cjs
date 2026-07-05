const fs = require('fs');
let forecast = fs.readFileSync('src/services/forecastEngine.ts', 'utf8');

forecast = forecast.replace(/        "Authorization": `Bearer \$\{session\?\.access_token\}`\n/g, '');
forecast = forecast.replace(/        'Authorization': `Bearer \$\{session\?\.access_token\}`\n/g, '');
forecast = forecast.replace(/const \{ data: \{ session \} \} = await supabase\.auth\.getSession\(\);\n/g, '');
fs.writeFileSync('src/services/forecastEngine.ts', forecast);
