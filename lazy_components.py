import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Reverse the previous bad replaces if any
content = content.replace('{activeTab === "markets" && (<React.Suspense fallback={<div className="flex items-center justify-center h-full w-full min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-gold)]"></div></div>}>', '{activeTab === "markets" && (')
content = content.replace('activeTab === "portfolio" && (<React.Suspense fallback={<div className="flex items-center justify-center h-full w-full min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-gold)]"></div></div>}>', 'activeTab === "portfolio" && (')
content = content.replace('activeTab === "terminal" && (<React.Suspense fallback={<div className="flex items-center justify-center h-full w-full min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-gold)]"></div></div>}>', 'activeTab === "terminal" && (')
content = content.replace('activeTab === "ai" && (<React.Suspense fallback={<div className="flex items-center justify-center h-full w-full min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-gold)]"></div></div>}>', 'activeTab === "ai" && (')


# Ensure Suspense wrapper around the main active views
# The views are inside <main className="...">
suspense_wrapper_start = """
          <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center h-full w-full min-h-[60vh] space-y-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-gray-900 border-t-[var(--accent-gold)] animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 bg-[var(--accent-gold)]/20 rounded-full blur-xl"></div>
              </div>
              <p className="font-display text-[var(--accent-gold)] tracking-widest text-xs animate-pulse">در حال بارگذاری ماژول کوانت...</p>
            </div>
          }>
"""

content = content.replace('          {/* ACTIVE TAB VIEWS */}', '          {/* ACTIVE TAB VIEWS */}' + suspense_wrapper_start)
content = content.replace('        </main>', '          </React.Suspense>\n        </main>')

with open("src/App.tsx", "w") as f:
    f.write(content)

