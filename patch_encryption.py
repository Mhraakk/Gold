import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Add import
content = content.replace('import ChartTerminal from', 'import { encryptData, decryptData } from "./utils/crypto";\nimport ChartTerminal from')

# Patch init state for aiConfig
init_state_aiconfig = """  const [aiConfig, setAiConfig] = useState<AIProviderConfig>(() => {
    try {
      const saved = localStorage.getItem("gold_terminal_ai_config");
      if (saved) return JSON.parse(decryptData(saved));
    } catch(e) {}
"""
content = re.sub(r'  const \[aiConfig, setAiConfig\] = useState<AIProviderConfig>\(\(\) => \{\n    try \{\n      const saved = localStorage.getItem\("gold_terminal_ai_config"\);\n      if \(saved\) return JSON.parse\(saved\);\n    \} catch \(e\) \{\}', init_state_aiconfig, content, flags=re.DOTALL)

# Patch handleSaveAIConfig
handle_save_aiconfig = """  const handleSaveAIConfig = (newCfg: AIProviderConfig) => {
    setAiConfig(newCfg);
    localStorage.setItem("gold_terminal_ai_config", encryptData(JSON.stringify(newCfg)));
  };"""
content = re.sub(r'  const handleSaveAIConfig = \(newCfg: AIProviderConfig\) => \{\n    setAiConfig\(newCfg\);\n    localStorage.setItem\("gold_terminal_ai_config", JSON.stringify\(newCfg\)\);\n  \};', handle_save_aiconfig, content)

# Patch auth init
auth_init = """  const [user, setUser] = useState<{ name: string; email: string } | null>(() => {
    try {
      const saved = localStorage.getItem("gold_terminal_auth");
      if (saved) return JSON.parse(decryptData(saved));
    } catch(e) {}
    return null;
  });"""
content = re.sub(r'  const \[user, setUser\] = useState<\{ name: string; email: string \} \| null>\(\(\) => \{\n    const saved = localStorage.getItem\("gold_terminal_auth"\);\n    return saved \? JSON.parse\(saved\) : null;\n  \}\);', auth_init, content)

with open("src/App.tsx", "w") as f:
    f.write(content)
