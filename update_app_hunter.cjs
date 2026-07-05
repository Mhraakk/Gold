const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add Crosshair import
code = code.replace(/import \{/, 'import { Crosshair,');

// 2. Add MazanehHunter import
code = code.replace(/import LiveMarketSources from "\.\/components\/LiveMarketSources";/, 'import LiveMarketSources from "./components/LiveMarketSources";\nimport MazanehHunter from "./components/MazanehHunter";');

// 3. Add hunter to activeTab type
code = code.replace(/\| "market_wall"/, '| "market_wall"\n    | "hunter"');

// 4. Add hunter to sidebar tabs (after market_wall)
const sidebarTab = `
                <button
                  onClick={() => setActiveTab("hunter")}
                  className={\`w-full flex flex-row items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 \${
                    activeTab === "hunter"
                      ? "bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] font-bold shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-heavy)]"
                  }\`}
                >
                  <div className="flex flex-row items-center gap-3">
                    <Crosshair className="h-4 w-4 shrink-0 text-[#D4AF37]" />
                    <span className="font-sans font-black text-[#D4AF37]">اتاق شکار مظنه</span>
                  </div>
                  <span className="text-[9px] bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 px-1.5 py-0.5 rounded font-bold animate-pulse">
                    PRO
                  </span>
                </button>`;
code = code.replace(/                  <\/span>\n                <\/button>\n              <\/div>/, '                  </span>\n                </button>' + sidebarTab + '\n              </div>');

// 5. Add hunter rendering
const renderComponent = `
            {activeTab === "hunter" && (
              <MazanehHunter prices={prices} assetStats={assetStats} />
            )}
`;
code = code.replace(/            \{activeTab === "terminal" && \(/, renderComponent + '            {activeTab === "terminal" && (');

// 6. Add to mobile dock
const mobileTab = `
        <button
          onClick={() => setActiveTab("hunter")}
          className={\`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 \${
            activeTab === "hunter" ? "text-[#D4AF37] bg-white/5 font-bold" : "text-gray-400 hover:text-white"
          }\`}
          style={{ width: '52px', height: '48px' }}
        >
          <Crosshair className="h-4 w-4" />
          <span className="text-[9px] font-sans mt-0.5">شکار</span>
        </button>`;

code = code.replace(/          <span className="text-\[9px\] font-sans mt-0\.5">دیوار<\/span>\n        <\/button>/, '          <span className="text-[9px] font-sans mt-0.5">دیوار</span>\n        </button>' + mobileTab);

fs.writeFileSync('src/App.tsx', code);
