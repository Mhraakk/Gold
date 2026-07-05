const fs = require('fs');
let code = fs.readFileSync('src/components/NextDayForecast.tsx', 'utf8');

const helperComponentNew = `
const AutofillMeta = ({ fieldKey, autofillData }: { fieldKey: string, autofillData: any }) => {
  if (!autofillData || !autofillData[fieldKey]) return null;
  const meta = autofillData[fieldKey];
  const time = new Date(meta.sourceTimestamp).toLocaleTimeString("fa-IR", { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="text-[10px] text-emerald-400/80 mt-1.5 flex flex-col gap-1 p-1.5 bg-emerald-500/5 rounded border border-emerald-500/10">
      <div className="flex justify-between items-center">
        <span className="truncate font-medium text-emerald-300">منبع: {meta.source}</span>
        <span className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
          {meta.validationStatus === 'verified' ? 'تأیید شده' : meta.validationStatus}
        </span>
      </div>
      <div className="flex justify-between items-center text-emerald-500/70">
        <span>مقدار خام: {meta.displayValue}</span>
        <span>زمان: {time}</span>
      </div>
    </div>
  );
};
`;

code = code.replace(/const AutofillMeta = \([\s\S]*?\};/, helperComponentNew.trim());
fs.writeFileSync('src/components/NextDayForecast.tsx', code);
