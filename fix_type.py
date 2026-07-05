import re

with open("src/components/LoginScreen.tsx", "r") as f:
    content = f.read()

content = content.replace("<button onClick=", "<button type=\"button\" onClick=")

with open("src/components/LoginScreen.tsx", "w") as f:
    f.write(content)
