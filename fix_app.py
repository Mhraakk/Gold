import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Fix logout redirect
content = content.replace('localStorage.removeItem("gold_terminal_auth");\n                  setUser(null);',
'localStorage.removeItem("gold_terminal_auth");\n                  window.location.reload();')

# Add storage listener for Auth state mismatch / session race conditions
listener_code = """  // Handle Cross-Tab Session Sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "gold_terminal_auth") {
        if (!e.newValue) {
          window.location.reload();
        } else {
          try {
            setUser(JSON.parse(decryptData(e.newValue)));
          } catch (err) {
            try {
              setUser(JSON.parse(e.newValue));
            } catch (err2) {
              window.location.reload();
            }
          }
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // --- INITIALIZATION ---"""

content = content.replace("  // --- INITIALIZATION ---", listener_code)

with open("src/App.tsx", "w") as f:
    f.write(content)
