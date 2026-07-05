const fs = require('fs');
let code = fs.readFileSync('src/utils/dataValidation.ts', 'utf8');

code += `\n
export function parseAbshdhMessage(text: string): { meltedGold: number | null; gold18k: number | null } {
  let meltedGold: number | null = null;
  let gold18k: number | null = null;

  // Convert Persian numbers to English
  const persianToEnglish = (str: string) => {
     return str.replace(/[۰-۹]/g, d => '0123456789'[d.charCodeAt(0) - 1776]);
  };
  
  const normalizedText = persianToEnglish(text);

  // Usually format is: #ابشده 79,600,000 or #ابشده_حواله 79,600,000 or similar
  const abshMatch = normalizedText.match(/#ابشـ?د?ه.*?([\\d,]+)/);
  if (abshMatch) {
    const digits = abshMatch[1].replace(/[,\\u066C]/g, '');
    const num = parseFloat(digits);
    if (!isNaN(num)) {
       meltedGold = num;
    }
  } else {
    // fallback
    const fallbackMatch = normalizedText.match(/(?:مظنه|آبشده).*?([\\d,]{6,})/);
    if (fallbackMatch) {
       const digits = fallbackMatch[1].replace(/[,\\u066C]/g, '');
       const num = parseFloat(digits);
       if (!isNaN(num)) {
          meltedGold = num;
       }
    }
  }

  const gramMatch = normalizedText.match(/#گرم‌?طلا.*?([\\d,]+)/);
  if (gramMatch) {
    const digits = gramMatch[1].replace(/[,\\u066C]/g, '');
    const num = parseFloat(digits);
    if (!isNaN(num)) {
       gold18k = num;
    }
  }

  return { meltedGold, gold18k };
}
`;

fs.writeFileSync('src/utils/dataValidation.ts', code);
