import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Replace the first instance of alerts
content = content.replace('const [alerts, setAlerts] = useState<AlertConfig[]>([]);\n  const [aiConfig, setAiConfig] = useState<AIProviderConfig>', 'const [aiConfig, setAiConfig] = useState<AIProviderConfig>')

with open("src/App.tsx", "w") as f:
    f.write(content)
