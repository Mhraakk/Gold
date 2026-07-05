const fs = require('fs');

// Patch AIChat.tsx
let aiChat = fs.readFileSync('src/components/AIChat.tsx', 'utf8');
aiChat = aiChat.replace(/import \{ supabase \} from "\.\.\/lib\/supabase";\n/g, '');
aiChat = aiChat.replace(/      const \{ data: \{ session \} \} = await supabase\.auth\.getSession\(\);\n/g, '');
aiChat = aiChat.replace(/          "Authorization": `Bearer \$\{session\?\.access_token\}`\n/g, '');
fs.writeFileSync('src/components/AIChat.tsx', aiChat);

// Patch forecastEngine.ts
let forecast = fs.readFileSync('src/services/forecastEngine.ts', 'utf8');
forecast = forecast.replace(/import \{ supabase \} from '\.\.\/lib\/supabase';\n/g, '');
forecast = forecast.replace(/    const \{ data: \{ session \} \} = await supabase\.auth\.getSession\(\);\n/g, '');
forecast = forecast.replace(/        'Authorization': `Bearer \$\{session\?\.access_token\}`\n/g, '');
fs.writeFileSync('src/services/forecastEngine.ts', forecast);
