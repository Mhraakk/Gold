export function parseAbshdhMessage(text: string): { meltedGold: number | null; gold18k: number | null } {
  let meltedGold: number | null = null;
  let gold18k: number | null = null;

  // Attempt to find Melted Gold (Mazaneh)
  // Usually format is: #ابشده 79,600,000 or #ابشده_حواله 79,600,000 or similar
  const abshMatch = text.match(/#ابشـ?د?ه.*?([\d,]+)/);
  if (abshMatch) {
    // extract digits
    const digits = abshMatch[1].replace(/[,\u066C]/g, '');
    const num = parseFloat(digits);
    if (!isNaN(num)) {
       meltedGold = num;
    }
  } else {
    // fallback if hashtag is different, look for "مظنه" or "آبشده"
    const fallbackMatch = text.match(/(?:مظنه|آبشده).*?([\d,]{6,})/);
    if (fallbackMatch) {
       const digits = fallbackMatch[1].replace(/[,\u066C]/g, '');
       const num = parseFloat(digits);
       if (!isNaN(num)) {
          meltedGold = num;
       }
    }
  }

  // Attempt to find 18K Gold
  const gramMatch = text.match(/#گرم‌?طلا.*?([\d,]+)/);
  if (gramMatch) {
    const digits = gramMatch[1].replace(/[,\u066C]/g, '');
    const num = parseFloat(digits);
    if (!isNaN(num)) {
       gold18k = num;
    }
  }

  // Persian digits conversion (if needed)
  const persianToEnglish = (str: string) => {
     return str.replace(/[۰-۹]/g, d => '0123456789'[d.charCodeAt(0) - 1776]);
  };

  return { meltedGold, gold18k };
}
