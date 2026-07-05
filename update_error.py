import re

with open("src/components/LoginScreen.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "if (!existingUser || existingUser.password !== normalizedPassword) {\n          setError('ایمیل یا رمز عبور اشتباه است');\n          return;\n        }",
    "if (!existingUser) {\n          setError('حسابی با این ایمیل یافت نشد. لطفاً ابتدا ثبت‌نام کنید.');\n          return;\n        }\n        if (existingUser.password !== normalizedPassword) {\n          setError('رمز عبور اشتباه است.');\n          return;\n        }"
)

with open("src/components/LoginScreen.tsx", "w") as f:
    f.write(content)
