const fs = require('fs');
let code = fs.readFileSync('src/components/NextDayForecast.tsx', 'utf8');

const helperComponent = `
const AutofillMeta = ({ fieldKey, autofillData }: { fieldKey: string, autofillData: any }) => {
  if (!autofillData || !autofillData[fieldKey]) return null;
  const meta = autofillData[fieldKey];
  return (
    <div className="text-[10px] text-emerald-400/80 mt-1 flex flex-col gap-0.5">
      <span className="truncate">منبع: {meta.source}</span>
      <span className="text-emerald-500/60 flex items-center gap-1">
        <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
        {meta.displayValue}
      </span>
    </div>
  );
};
`;

if (!code.includes('const AutofillMeta')) {
  code = code.replace('export default function NextDayForecast(', helperComponent + '\nexport default function NextDayForecast(');
  fs.writeFileSync('src/components/NextDayForecast.tsx', code);
}
