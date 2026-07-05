import re

with open("src/components/LoginScreen.tsx", "r") as f:
    content = f.read()

content = content.replace("if (email === 'admin@example.com' && password === 'admin')", "if ((email === 'admin@example.com' || email === 'admin') && password === 'admin')")
content = content.replace("placeholder=\"admin@example.com\"", "placeholder=\"admin@example.com\"")

with open("src/components/LoginScreen.tsx", "w") as f:
    f.write(content)
