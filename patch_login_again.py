import re

with open("src/components/LoginScreen.tsx", "r") as f:
    content = f.read()

# Add import if missing
if "encryptData" not in content:
    content = content.replace("import { Mail, Key, User, ArrowRight, Layers, AlertCircle } from 'lucide-react';", "import { Mail, Key, User, ArrowRight, Layers, AlertCircle } from 'lucide-react';\nimport { encryptData } from '../utils/crypto';")

# Replace setItem
content = content.replace("localStorage.setItem('gold_terminal_auth', JSON.stringify(sessionUser));", "localStorage.setItem('gold_terminal_auth', encryptData(JSON.stringify(sessionUser)));")

with open("src/components/LoginScreen.tsx", "w") as f:
    f.write(content)
