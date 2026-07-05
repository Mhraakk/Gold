import re

with open("src/components/LoginScreen.tsx", "r") as f:
    content = f.read()

# Add a hint
hint = """          <div className="mt-8 text-center text-xs text-[var(--text-secondary)] tracking-wide">
            {mode === 'login' ? (
              <>
                <p className="mb-2">ایمیل پیش‌فرض: admin@example.com | رمز: admin</p>
                <p>حساب کاربری ندارید؟ <button onClick={() => { setMode('signup'); setError(''); }} className="text-[var(--accent-gold)] font-bold hover:text-[#f5d76e] transition-colors">ثبت‌نام کنید</button></p>
              </>
            ) : mode === 'signup' ? (
              <p>حساب کاربری دارید؟ <button onClick={() => { setMode('login'); setError(''); }} className="text-[var(--accent-gold)] font-bold hover:text-[#f5d76e] transition-colors">وارد شوید</button></p>
            ) : (
              <p>بازگشت به <button onClick={() => { setMode('login'); setError(''); }} className="text-[var(--accent-gold)] font-bold hover:text-[#f5d76e] transition-colors">صفحه ورود</button></p>
            )}
          </div>"""

content = re.sub(
    r'          <div className="mt-8 text-center text-xs text-\[var\(--text-secondary\)\] tracking-wide">.*?</div>',
    hint,
    content,
    flags=re.DOTALL
)

with open("src/components/LoginScreen.tsx", "w") as f:
    f.write(content)
