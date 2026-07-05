import re

with open("src/index.css", "r") as f:
    content = f.read()

content = content.replace(
    "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');",
    "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');"
)

content += """
.font-display {
  font-family: 'Playfair Display', serif;
}
.lux-gradient-text {
  background: linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
"""

with open("src/index.css", "w") as f:
    f.write(content)
