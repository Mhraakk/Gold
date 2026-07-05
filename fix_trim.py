import re

with open("src/components/LoginScreen.tsx", "r") as f:
    content = f.read()

content = content.replace("const handleSubmit = (e: React.FormEvent) => {", "const handleSubmit = (e: React.FormEvent) => {\n    const normalizedEmail = email.trim().toLowerCase();\n    const normalizedPassword = password.trim();")
content = content.replace("!email", "!normalizedEmail")
content = content.replace("usersDB[email]", "usersDB[normalizedEmail]")
content = content.replace(", email,", ", email: normalizedEmail,")
content = content.replace("email === 'admin@example.com'", "normalizedEmail === 'admin@example.com'")
content = content.replace("email === 'admin'", "normalizedEmail === 'admin'")
content = content.replace("email !== 'admin@example.com'", "normalizedEmail !== 'admin@example.com'")
content = content.replace("{ name: 'مدیر سیستم', email }", "{ name: 'مدیر سیستم', email: normalizedEmail }")
content = content.replace("{ name: existingUser.name, email }", "{ name: existingUser.name, email: normalizedEmail }")
content = content.replace("{ name: newUser.name, email }", "{ name: newUser.name, email: normalizedEmail }")

with open("src/components/LoginScreen.tsx", "w") as f:
    f.write(content)
