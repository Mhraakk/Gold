with open("server.ts", "r") as f:
    content = f.read()

content = content.replace('.join("\n");', '.join("\\n");')

with open("server.ts", "w") as f:
    f.write(content)
