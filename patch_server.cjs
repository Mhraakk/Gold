const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `    let meltedGoldStr = null;
    let gold18kStr = null;
    let rawText = "";
    
    const messages: string[] = [];
    $('.tgme_widget_message_text').each((i, el) => messages.push($(el).text()));
    
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (!meltedGoldStr) {
        const abshMatch = msg.match(/#ابشـ?د?ه.*?([\\d,]+)/);
        if (abshMatch) {
          meltedGoldStr = abshMatch[1].replace(/,/g, '');
          rawText = msg;
        }
      }
      if (!gold18kStr) {
        const gramMatch = msg.match(/#گرم‌طلا.*?([\\d,]+)/);
        if (gramMatch) gold18kStr = gramMatch[1].replace(/,/g, '');
      }
      if (meltedGoldStr && gold18kStr) break;
    }
    
    const MELTED_GOLD = meltedGoldStr ? parseFloat(meltedGoldStr) : null;
    const GOLD_18K = gold18kStr ? parseFloat(gold18kStr) : null;`;

const replacementStr = `    let MELTED_GOLD: number | null = null;
    let GOLD_18K: number | null = null;
    let rawText = "";
    
    const messages: string[] = [];
    $('.tgme_widget_message_text').each((i, el) => messages.push($(el).text()));
    
    const { parseAbshdhMessage } = await import('./src/utils/dataValidation.ts');

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const parsed = parseAbshdhMessage(msg);
      
      if (!MELTED_GOLD && parsed.meltedGold) {
        MELTED_GOLD = parsed.meltedGold;
        rawText = msg;
      }
      if (!GOLD_18K && parsed.gold18k) {
        GOLD_18K = parsed.gold18k;
      }
      if (MELTED_GOLD && GOLD_18K) break;
    }`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('server.ts', code);
