import re

with open("src/components/LoginScreen.tsx", "r") as f:
    content = f.read()

# Add try-catch around usersDB parsing
content = content.replace("      const usersDBStr = localStorage.getItem('gold_terminal_users') || '{}';\n      const usersDB = JSON.parse(usersDBStr);",
"""      let usersDB = {};
      try {
        const usersDBStr = localStorage.getItem('gold_terminal_users') || '{}';
        usersDB = JSON.parse(usersDBStr);
        if (typeof usersDB !== 'object' || Array.isArray(usersDB)) usersDB = {};
      } catch (e) {
        usersDB = {};
      }""")

# Add hasOwnProperty check
content = content.replace("        if (usersDB[normalizedEmail]) {",
"        if (Object.prototype.hasOwnProperty.call(usersDB, normalizedEmail)) {")

content = content.replace("        const existingUser = usersDB[normalizedEmail];",
"""        const existingUser = Object.prototype.hasOwnProperty.call(usersDB, normalizedEmail) ? usersDB[normalizedEmail] : null;""")

with open("src/components/LoginScreen.tsx", "w") as f:
    f.write(content)
