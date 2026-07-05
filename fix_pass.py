import re

with open("src/components/LoginScreen.tsx", "r") as f:
    content = f.read()

content = content.replace("existingUser.password !== password", "existingUser.password !== normalizedPassword")
content = content.replace("password === 'admin'", "normalizedPassword === 'admin'")
content = content.replace("!password", "!normalizedPassword")
content = content.replace("password };", "password: normalizedPassword };")

with open("src/components/LoginScreen.tsx", "w") as f:
    f.write(content)
