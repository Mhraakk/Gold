import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Add SystemEvolutionAgent lazy import
content = content.replace('const MarketReplayEngine = React.lazy', 'const SystemEvolutionAgent = React.lazy(() => import("./components/SystemEvolutionAgent"));\nconst MarketReplayEngine = React.lazy')

# Add button to nav (Group 3)
nav_button = """                <button
                  onClick={() => setActiveTab("evolution")}
                  className={`w-full flex flex-row items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                    activeTab === "evolution" ? "bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] font-bold shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-heavy)]"
                  }`}
                >
                  <div className="flex flex-row items-center gap-3">
                    <Cpu className="h-4 w-4 shrink-0" />
                    <span className="font-sans">عامل تکامل سیستم (Evolution)</span>
                  </div>
                  <span className="text-[9px] bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded font-bold data-value text-[11px] animate-pulse">Auto</span>
                </button>
"""

content = content.replace('              {/* Group 3 */}', nav_button + '              {/* Group 3 */}')

# Add view rendering
view_render = """          {activeTab === "evolution" && (
            <SystemEvolutionAgent />
          )}
"""
content = content.replace('          {activeTab === "connectors" && (', view_render + '          {activeTab === "connectors" && (')

# Add 'evolution' to activeTab type
content = content.replace('activeTab, setActiveTab] = useState<"markets" | "terminal" | "ai" | "portfolio" | "alerts" | "calendar" | "news" | "journal" | "connectors" | "replay">', 'activeTab, setActiveTab] = useState<"markets" | "terminal" | "ai" | "portfolio" | "alerts" | "calendar" | "news" | "journal" | "connectors" | "replay" | "evolution">')

with open("src/App.tsx", "w") as f:
    f.write(content)
