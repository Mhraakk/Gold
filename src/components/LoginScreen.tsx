import React, { useState } from 'react';
import { Lock, Mail, Key, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function LoginScreen({ onLogin }: { onLogin: (user: any) => void }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('ایمیل یا رمز عبور اشتباه است');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (mode === 'signup') {
        const user = { name: name || 'کاربر جدید', email };
        localStorage.setItem('gold_terminal_auth', JSON.stringify(user));
        onLogin(user);
      } else if (mode === 'login') {
        if (password.length < 4) {
          setError('ایمیل یا رمز عبور اشتباه است');
          return;
        }
        const user = { name: 'مدیر سیستم', email };
        localStorage.setItem('gold_terminal_auth', JSON.stringify(user));
        onLogin(user);
      } else if (mode === 'reset') {
        setError('لینک بازیابی رمز عبور به ایمیل شما ارسال شد.');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#030611] flex items-center justify-center p-4 font-sans text-right" dir="rtl">
      <div className="glass-panel w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.05)] border border-gray-800">
        <div className="bg-gradient-to-br from-gray-900 to-black p-8 flex flex-col items-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)] mb-4">
            <ShieldCheck className="h-8 w-8 text-black font-extrabold" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide">سامانه هوشمند طلا</h1>
          <p className="text-amber-500 text-sm mt-2 font-medium tracking-wider">احراز هویت کاربران سازمانی</p>
        </div>

        <div className="p-8 bg-black/60">
          {error && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">نام و نام خانوادگی</label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 focus:border-amber-500/50 rounded-lg py-2.5 pr-10 pl-4 text-white text-sm outline-none transition"
                    placeholder="نام کامل خود را وارد کنید"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">پست الکترونیک (ایمیل)</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 focus:border-amber-500/50 rounded-lg py-2.5 pr-10 pl-4 text-white text-sm outline-none transition text-left"
                  placeholder="admin@example.com"
                  dir="ltr"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <label className="block text-xs font-semibold text-gray-400">رمز عبور</label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => setMode('reset')} className="text-[10px] text-amber-500 hover:text-amber-400">
                      فراموشی رمز؟
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 focus:border-amber-500/50 rounded-lg py-2.5 pr-10 pl-4 text-white text-sm outline-none transition text-left"
                    placeholder="••••••••"
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-black font-extrabold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>
                    {mode === 'login' ? 'ورود به ترمینال' : mode === 'signup' ? 'ایجاد حساب سازمانی' : 'ارسال لینک بازیابی'}
                  </span>
                  <ArrowRight className="h-4 w-4 rotate-180" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            {mode === 'login' ? (
              <p>حساب کاربری ندارید؟ <button onClick={() => { setMode('signup'); setError(''); }} className="text-amber-500 font-bold hover:underline">ثبت‌نام کنید</button></p>
            ) : (
              <p>بازگشت به <button onClick={() => { setMode('login'); setError(''); }} className="text-amber-500 font-bold hover:underline">صفحه ورود</button></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
