import re

with open("src/components/LoginScreen.tsx", "r") as f:
    content = f.read()

content = content.replace('import { User, Lock, Mail, ArrowRight, ShieldCheck, Activity, Cpu } from "lucide-react";', 'import { User, Lock, Mail, ArrowRight, ShieldCheck, Activity, Cpu } from "lucide-react";\nimport { encryptData } from "../utils/crypto";')

content = content.replace("localStorage.setItem('gold_terminal_auth', JSON.stringify({ name: email.split('@')[0], email }));", "localStorage.setItem('gold_terminal_auth', encryptData(JSON.stringify({ name: email.split('@')[0], email })));")
content = content.replace("localStorage.setItem('gold_terminal_auth', JSON.stringify({ name, email }));", "localStorage.setItem('gold_terminal_auth', encryptData(JSON.stringify({ name, email })));")

with open("src/components/LoginScreen.tsx", "w") as f:
    f.write(content)

