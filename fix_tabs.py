import re

with open("src/components/LoginScreen.tsx", "r") as f:
    content = f.read()

# Add a tab switcher at the top of the form
tabs = """        <div className="p-10 bg-[var(--bg-panel-heavy)]">
          <div className="flex flex-row justify-center mb-8 bg-black/40 p-1 rounded-xl">
            <button 
              type="button" 
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-[var(--accent-gold)] text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              ورود
            </button>
            <button 
              type="button" 
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'signup' ? 'bg-[var(--accent-gold)] text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              ثبت‌نام
            </button>
          </div>
"""

content = content.replace("        <div className=\"p-10 bg-[var(--bg-panel-heavy)]\">", tabs)

# Remove the bottom text
bottom_text_regex = r'          <div className="mt-8 text-center text-xs text-\[var\(--text-secondary\)\] tracking-wide">.*?</div>'
content = re.sub(bottom_text_regex, "", content, flags=re.DOTALL)

with open("src/components/LoginScreen.tsx", "w") as f:
    f.write(content)
