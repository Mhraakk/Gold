const fs = require('fs');
let chat = fs.readFileSync('src/components/AIChat.tsx', 'utf8');
chat = chat.replace(/جهت برقراری ارتباط، از پیکربندی صحیح کلید API در بخش تنظیمات ترمینال اطمینان حاصل کنید\./g, 'متاسفانه در حال حاضر به دلیل ترافیک بالا، سرور قادر به پاسخگویی نیست. لطفاً دقایقی دیگر تلاش کنید.');
fs.writeFileSync('src/components/AIChat.tsx', chat);
