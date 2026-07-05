import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Add AlertEngine lazy import
content = content.replace('const VolatilityHeatmap = React.lazy', 'const AlertEngine = React.lazy(() => import("./components/AlertEngine"));\nconst VolatilityHeatmap = React.lazy')

# Add alerts state
content = content.replace('const [aiConfig, setAiConfig] = useState<AIProviderConfig>', 'const [alerts, setAlerts] = useState<AlertConfig[]>([]);\n  const [aiConfig, setAiConfig] = useState<AIProviderConfig>')

# Add button to nav
nav_button = """                <button
                  onClick={() => setActiveTab("alerts")}
                  className={`w-full flex flex-row items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                    activeTab === "alerts" ? "bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] font-bold shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-heavy)]"
                  }`}
                >
                  <div className="flex flex-row items-center gap-3">
                    <BellRing className="h-4 w-4 shrink-0" />
                    <span className="font-sans">موتور هشدارها (Alerts)</span>
                  </div>
                </button>
"""

content = content.replace('              {/* Group 3 */}', nav_button + '              {/* Group 3 */}')

# Add import for BellRing if not present
if "BellRing" not in content:
    content = content.replace('Bell,', 'Bell, BellRing,')
    content = content.replace('Briefcase,', 'Briefcase, BellRing,') # Just in case

# Add view rendering
view_render = """          {activeTab === "alerts" && (
            <AlertEngine alerts={alerts} setAlerts={setAlerts} />
          )}
"""
content = content.replace('          {activeTab === "journal" && (', view_render + '          {activeTab === "journal" && (')

with open("src/App.tsx", "w") as f:
    f.write(content)
