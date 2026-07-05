const fs = require('fs');
let code = fs.readFileSync('src/components/NextDayForecast.tsx', 'utf8');

// 1. Add Helper Component
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
if (!code.includes('AutofillMeta')) {
  code = code.replace('export default function NextDayForecast() {', helperComponent + '\nexport default function NextDayForecast() {');
}

// 2. Fix the autofill button section
code = code.replace(
  /<button onClick={handleFillFromLive}.*?>\s*تکمیل خودکار از منابع زنده\s*<\/button>/g,
  `{autofillError && (
                  <div className="absolute top-full mt-2 right-0 w-64 p-2 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400 z-10">
                    {autofillError}
                  </div>
                )}
                <button 
                  onClick={handleFillFromLive} 
                  disabled={isAutofilling}
                  className="text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3 py-1 rounded-full transition-colors font-medium border border-emerald-500/30 disabled:opacity-50 relative"
                >
                  {isAutofilling ? 'در حال دریافت...' : 'تکمیل خودکار از منابع زنده'}
                </button>`
);

// 3. Inject AutofillMeta below inputs
code = code.replace(
  /value={inputData.meltedGold \|\| ""} onChange={e => setInputData\(\{\.\.\.inputData, meltedGold: e\.target\.valueAsNumber\}\)} \/>/g,
  `value={inputData.meltedGold || ""} onChange={e => setInputData({...inputData, meltedGold: e.target.valueAsNumber})} />
                  <AutofillMeta fieldKey="meltedGoldMazaneh" autofillData={autofillData} />`
);

code = code.replace(
  /value={inputData.xauusd \|\| ""} onChange={e => setInputData\(\{\.\.\.inputData, xauusd: e\.target\.valueAsNumber\}\)} \/>/g,
  `value={inputData.xauusd || ""} onChange={e => setInputData({...inputData, xauusd: e.target.valueAsNumber})} />
                  <AutofillMeta fieldKey="xauusd" autofillData={autofillData} />`
);

code = code.replace(
  /value={inputData.usdIrt \|\| ""} onChange={e => setInputData\(\{\.\.\.inputData, usdIrt: e\.target\.valueAsNumber\}\)} \/>/g,
  `value={inputData.usdIrt || ""} onChange={e => setInputData({...inputData, usdIrt: e.target.valueAsNumber})} />
                  <AutofillMeta fieldKey="usdIrt" autofillData={autofillData} />`
);

code = code.replace(
  /value={inputData.usdtIrt \|\| ""} onChange={e => setInputData\(\{\.\.\.inputData, usdtIrt: e\.target\.valueAsNumber\}\)} \/>/g,
  `value={inputData.usdtIrt || ""} onChange={e => setInputData({...inputData, usdtIrt: e.target.valueAsNumber})} />
                  <AutofillMeta fieldKey="usdtIrt" autofillData={autofillData} />`
);

code = code.replace(
  /value={inputData.gold18k \|\| ""} onChange={e => setInputData\(\{\.\.\.inputData, gold18k: e\.target\.valueAsNumber\}\)} \/>/g,
  `value={inputData.gold18k || ""} onChange={e => setInputData({...inputData, gold18k: e.target.valueAsNumber})} />
                  <AutofillMeta fieldKey="gold18k" autofillData={autofillData} />`
);

code = code.replace(
  /value={inputData.emamiCoin \|\| ""} onChange={e => setInputData\(\{\.\.\.inputData, emamiCoin: e\.target\.valueAsNumber\}\)} \/>/g,
  `value={inputData.emamiCoin || ""} onChange={e => setInputData({...inputData, emamiCoin: e.target.valueAsNumber})} />
                  <AutofillMeta fieldKey="emamiCoin" autofillData={autofillData} />`
);

fs.writeFileSync('src/components/NextDayForecast.tsx', code);
