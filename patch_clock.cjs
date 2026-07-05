const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `            </div>

            {/* NAVIGATION MODULES */}`;

const replacement = `            </div>

            {/* LIVE CLOCK */}
            <div className="flex flex-col items-center justify-center p-4 bg-black/20 border border-[var(--border-subtle)] rounded-xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--accent-gold)]/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
               <span className="text-[10px] text-[var(--accent-gold)] tracking-[0.2em] font-sans font-bold uppercase mb-2 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                 سیستم زنده
               </span>
               <div className="text-3xl font-mono text-white tracking-widest flex items-baseline gap-1" dir="ltr">
                 {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
               </div>
               <div className="text-xs text-gray-500 font-sans mt-2">
                 {new Intl.DateTimeFormat('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(currentTime)}
               </div>
            </div>

            {/* NAVIGATION MODULES */}`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
