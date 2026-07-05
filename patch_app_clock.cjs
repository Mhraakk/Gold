const fs = require('fs');

const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Define TimeAgo and LiveClock at the top
const newComponents = `
// --- Extracted Components to prevent App re-renders ---
const LiveClock = React.memo(() => {
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="flex flex-col items-end">
      <span className="text-xs text-[var(--text-secondary)] font-sans font-medium mb-1">
        {formatToShamsi(currentTime, { includeTime: false, formatStyle: "verbose" })}
      </span>
      <span className="text-2xl font-mono font-extrabold text-white tracking-widest bg-[var(--bg-panel-heavy)] px-4 py-1.5 rounded-xl border border-[var(--border-subtle)] shadow-inner">
        {currentTime.toLocaleTimeString('fa-IR', { hour12: false, timeZone: 'Asia/Tehran' })}
      </span>
    </div>
  );
});

const TimeAgo = React.memo(({ timestamp }: { timestamp: number | undefined }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  if (!timestamp) return <>بروزرسانی لایو</>;
  const seconds = Math.floor((now - timestamp) / 1000);
  return <>{seconds} ثانیه پیش</>;
});

const TimeAgoStyled = React.memo(({ timestamp }: { timestamp: number | undefined }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  if (!timestamp) return <span className="text-emerald-400/80">بروزرسانی لایو</span>;
  const seconds = Math.floor((now - timestamp) / 1000);
  return (
    <div className="flex items-center gap-2">
      <span className={seconds < 60 ? "text-emerald-400/80" : "text-amber-400/80"}>
        {seconds} ثانیه پیش
      </span>
      {seconds > 300 && (
        <span className="text-[9px] text-rose-500 font-bold px-1.5 py-0.5 bg-rose-500/10 rounded animate-pulse">
          هشدار تاخیر
        </span>
      )}
    </div>
  );
});
// -----------------------------------------------------
`;

// Insert after imports (around line 50-60)
// We'll just replace `export default function App() {` with the components then the export.
code = code.replace(`export default function App() {`, newComponents + `\nexport default function App() {`);

// 2. Remove currentTime from App state
code = code.replace(`  const [currentTime, setCurrentTime] = useState(new Date());\n`, ``);
code = code.replace(`  const currentTimeMs = currentTime.getTime();\n`, ``);

// 3. Remove the setInterval inside App's useEffect
const appIntervalCode = `
    // Clock
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
`;
code = code.replace(appIntervalCode, `\n`);
code = code.replace(`clearInterval(clockInterval);`, ``);


// 4. Replace the clock JSX in App.tsx
const oldClockJsx = `<div className="flex flex-col items-end">
                      <span className="text-xs text-[var(--text-secondary)] font-sans font-medium mb-1">
                        {formatToShamsi(currentTime, { includeTime: false, formatStyle: "verbose" })}
                      </span>
                      <span className="text-2xl font-mono font-extrabold text-white tracking-widest bg-[var(--bg-panel-heavy)] px-4 py-1.5 rounded-xl border border-[var(--border-subtle)] shadow-inner">
                        {currentTime.toLocaleTimeString('fa-IR', { hour12: false, timeZone: 'Asia/Tehran' })}
                      </span>
                    </div>`;

code = code.replace(oldClockJsx, `<LiveClock />`);

// 5. Replace time agos
const oldTimeAgo1 = `{sourceTimestamps[meta.id] ? (
                                      \`\${Math.floor((currentTimeMs - sourceTimestamps[meta.id]) / 1000)} ثانیه پیش\`
                                    ) : (
                                      "بروزرسانی لایو"
                                    )}`;

code = code.replace(oldTimeAgo1, `<TimeAgo timestamp={sourceTimestamps[meta.id]} />`);


const oldTimeAgo2 = `<span className={Math.floor((currentTimeMs - sourceTimestamps[meta.id]) / 1000) < 60 ? "text-emerald-400/80" : "text-amber-400/80"}>
                                      {Math.floor((currentTimeMs - sourceTimestamps[meta.id]) / 1000)} ثانیه پیش
                                    </span>
                                    {Math.floor((currentTimeMs - sourceTimestamps[meta.id]) / 1000) > 300 && (
                                      <span className="text-[9px] text-rose-500 font-bold px-1.5 py-0.5 bg-rose-500/10 rounded animate-pulse">
                                        هشدار تاخیر
                                      </span>
                                    )}`;

code = code.replace(oldTimeAgo2, `<TimeAgoStyled timestamp={sourceTimestamps[meta.id]} />`);

fs.writeFileSync(path, code);
