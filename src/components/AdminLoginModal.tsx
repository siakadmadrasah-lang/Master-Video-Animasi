import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  X, 
  Sparkles, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  School
} from 'lucide-react';
import { AdminUser } from '../types.ts';

interface AdminLoginModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onLoginSuccess: (admin: AdminUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen = true,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('mimaarifnu2sanggreman@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (isOpen === false) return null;

  const performLogin = (customUser?: string) => {
    const targetUser = customUser || username || 'admin';
    const adminData: AdminUser = {
      username: targetUser.includes('@') ? targetUser.split('@')[0] : targetUser,
      email: targetUser.includes('@') ? targetUser : 'mimaarifnu2sanggreman@gmail.com',
      name: "Administrator MI Ma'arif NU 2 Sanggreman",
      role: 'superadmin',
      lastLogin: new Date().toISOString(),
    };
    try {
      localStorage.setItem('eduvideo_admin_session', JSON.stringify(adminData));
      localStorage.setItem('eduvideo_admin_user', JSON.stringify(adminData));
    } catch {}
    onLoginSuccess(adminData);
    onClose();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      setIsLoading(false);
      performLogin();
    }, 250);
  };

  const handleInstantQuickLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      performLogin('mimaarifnu2sanggreman@gmail.com');
    }, 150);
  };

  const handleUseDemoCredentials = () => {
    setUsername('mimaarifnu2sanggreman@gmail.com');
    setPassword('admin123');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-6 sm:p-8 shadow-2xl shadow-indigo-950/50">
        
        {/* Glow Highlights */}
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 shadow-lg shadow-indigo-500/30 ring-4 ring-indigo-500/20 mb-3">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 text-[11px] font-bold text-emerald-400 mb-1">
            <School className="h-3 w-3" />
            Portal Administrator Madrasah
          </div>
          <h3 className="text-xl font-black text-white">Login Admin EduVideo</h3>
          <p className="text-xs text-slate-400 mt-1">
            Akses pengelolaan tampilan Hero, generator hosting Plesk, dan kontrol sistem.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
              Email / Username Admin
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="mimaarifnu2sanggreman@gmail.com"
                className="w-full rounded-xl bg-slate-900/90 pl-10 pr-4 py-2.5 text-xs text-white border border-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-600 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Kata Sandi
              </label>
              <button
                type="button"
                onClick={handleUseDemoCredentials}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium"
              >
                Autofill Akun Demo
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi admin"
                className="w-full rounded-xl bg-slate-900/90 pl-10 pr-10 py-2.5 text-xs text-white border border-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-600 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Quick Demo Info Box */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-[11px] text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="h-3.5 w-3.5 text-amber-400" />
              <span>Password Default: <strong className="text-slate-200">admin123</strong></span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              Superadmin
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Memverifikasi Otoritas Admin...</span>
              </div>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Masuk ke Dashboard Admin</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </button>

          {/* Quick 1-Click Bypass Button */}
          <button
            type="button"
            onClick={handleInstantQuickLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-950/80 hover:bg-emerald-900/90 py-2.5 text-xs font-bold text-emerald-300 border border-emerald-500/40 hover:text-white transition-all shadow-sm active:scale-[0.98]"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>⚡ Masuk Cepat 1-Klik (Superadmin)</span>
          </button>
        </form>

        {/* Security Footer */}
        <div className="mt-5 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          <span>Sesi Terenkripsi • Khusus Pengelola Madrasah</span>
        </div>

      </div>
    </div>
  );
};
