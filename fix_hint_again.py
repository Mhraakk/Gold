import re

with open("src/components/LoginScreen.tsx", "r") as f:
    content = f.read()

hint = """          </form>
          {mode === 'login' && (
            <div className="mt-8 text-center text-xs text-gray-500 tracking-wide font-mono">
              <p>Demo: admin@example.com | Pass: admin</p>
            </div>
          )}
"""

content = content.replace("          </form>", hint)

with open("src/components/LoginScreen.tsx", "w") as f:
    f.write(content)
