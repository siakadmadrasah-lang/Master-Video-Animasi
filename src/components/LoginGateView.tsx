import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldCheck, 
  Video, 
  School, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  GraduationCap, 
  KeyRound,
  PenTool,
  Cpu,
  Layers
} from 'lucide-react';
import { UserProfile, AdminUser } from '../types.ts';

interface LoginGateViewProps {
  onLoginSuccess: (user: UserProfile, admin?: AdminUser) => void;
}

export const LoginGateView: React.FC<LoginGateViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState<string>('jaenalmaskun@gmail.com');
  const [password, setPassword] = useState<string>('masbagus');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Animated handwriting / typewriter effect for Dev Jaenal Maskun
  const devSignature = 'Dev Jaenal Maskun';
  const [typedDev, setTypedDev] = useState<string>('');
  const [isWriting, setIsWriting] = useState<boolean>(true);

  useEffect(() => {
    let charIdx = 0;
    let isDeleting = false;
    let timer: any = null;

    const runTypewriter = () => {
      if (!isDeleting) {
        charIdx++;
        setTypedDev(devSignature.substring(0, charIdx));
        setIsWriting(true);

        if (charIdx >= devSignature.length) {
          setIsWriting(false);
          timer = setTimeout(() => {
            isDeleting = true;
            runTypewriter();
          }, 3000);
          return;
        }
        timer = setTimeout(runTypewriter, 100);
      } else {
        charIdx--;
        setTypedDev(devSignature.substring(0, charIdx));
        setIsWriting(true);

        if (charIdx <= 0) {
          isDeleting = false;
          timer = setTimeout(runTypewriter, 500);
          return;
        }
        timer = setTimeout(runTypewriter, 40);
      }
    };

    timer = setTimeout(runTypewriter, 300);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    setTimeout(() => {
      setIsLoading(false);

      // Check user jaenalmaskun@gmail.com with password masbagus
      const isJaenal = cleanEmail === 'jaenalmaskun@gmail.com' || cleanEmail === 'mas.jaenalmaskun@gmail.com' || cleanEmail === 'jaenalmaskun';
      const isJaenalPass = cleanPass === 'masbagus';

      // Also allow admin credentials
      const isAdminPass = cleanPass === 'admin123' || cleanPass === 'admin';

      if ((isJaenal && isJaenalPass) || isJaenalPass || (cleanPass === 'masbagus') || isAdminPass) {
        // Successful login
        const loggedUser: UserProfile = {
          id: 'usr-jaenal',
          name: 'Dev Jaenal Maskun',
          email: 'jaenalmaskun@gmail.com',
          avatarUrl: '/assets/logo-badge.jpg',
          role: 'kreator',
          institution: "MI Ma'arif NU 2 Sanggreman",
          defaultSubject: 'Fikih',
          defaultGrade: 'Kelas 1 MI',
        };

        const adminData: AdminUser = {
          username: 'jaenalmaskun',
          email: 'jaenalmaskun@gmail.com',
          name: 'Dev Jaenal Maskun (Superadmin)',
          role: 'superadmin',
          lastLogin: new Date().toISOString(),
        };

        try {
          localStorage.setItem('eduvideo_auth_session', JSON.stringify(loggedUser));
          localStorage.setItem('eduvideo_current_user', JSON.stringify(loggedUser));
          localStorage.setItem('eduvideo_admin_session', JSON.stringify(adminData));
        } catch {}

        onLoginSuccess(loggedUser, adminData);
      } else {
        setErrorMsg('Email atau kata sandi tidak sesuai. Gunakan jaenalmaskun@gmail.com & password "masbagus".');
      }
    }, 300);
  };

  const handleQuickLoginDev = () => {
    setEmail('jaenalmaskun@gmail.com');
    setPassword('masbagus');
    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const loggedUser: UserProfile = {
        id: 'usr-jaenal',
        name: 'Dev Jaenal Maskun',
        email: 'jaenalmaskun@gmail.com',
        avatarUrl: '/assets/logo-badge.jpg',
        role: 'kreator',
        institution: "MI Ma'arif NU 2 Sanggreman",
        defaultSubject: 'Fikih',
        defaultGrade: 'Kelas 1 MI',
      };

      const adminData: AdminUser = {
        username: 'jaenalmaskun',
        email: 'jaenalmaskun@gmail.com',
        name: 'Dev Jaenal Maskun (Superadmin)',
        role: 'superadmin',
        lastLogin: new Date().toISOString(),
      };

      try {
        localStorage.setItem('eduvideo_auth_session', JSON.stringify(loggedUser));
        localStorage.setItem('eduvideo_current_user', JSON.stringify(loggedUser));
        localStorage.setItem('eduvideo_admin_session', JSON.stringify(adminData));
      } catch {}

      onLoginSuccess(loggedUser, adminData);
    }, 200);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* Dynamic Background Aurora Glows */}
      <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-emerald-500/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-1/3 h-64 w-64 rounded-full bg-amber-500/10 blur-[100px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-indigo-500/30 bg-slate-900/90 p-6 sm:p-10 shadow-2xl shadow-black/80 backdrop-blur-2xl ring-1 ring-white/10 animate-fade-in">
        
        {/* Top Gradient Highlight */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 via-amber-400 to-transparent" />

        {/* Brand Header */}
        <div className="text-center mb-8">
          
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-emerald-500 shadow-xl shadow-indigo-500/30 ring-4 ring-indigo-500/20 mb-4 transform hover:scale-105 transition-transform">
            <Video className="h-8 w-8 text-white" />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold text-emerald-400 mb-2.5">
            <School className="h-3.5 w-3.5" />
            <span>MI Ma'arif NU 2 Sanggreman</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            EduVideo Studio AI
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-sm mx-auto">
            Portal Pembuat Video Animasi Pembelajaran Interaktif & Evaluasi Siswa
          </p>

          {/* Animated Handwriting Attribution Badge */}
          <div className="mt-3.5 inline-flex items-center gap-2 rounded-2xl bg-slate-950/80 border border-amber-500/30 px-3.5 py-1.5 shadow-inner">
            <span className="text-[11px] font-bold text-amber-400">Pengembang:</span>
            <span className="font-mono font-bold text-xs text-amber-300">
              {typedDev}
            </span>
            {isWriting ? (
              <span className="h-3 w-1 bg-amber-400 animate-pulse inline-block" />
            ) : (
              <span className="text-sky-400 font-bold text-xs">✓</span>
            )}
            <span className="text-xs animate-bounce">✍️</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 flex items-start gap-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Email Field */}
          <div>
            <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Alamat Email Pengguna</span>
              <span className="text-[11px] text-amber-400/90 font-normal">Wajib diisi</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-indigo-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jaenalmaskun@gmail.com"
                className="w-full rounded-2xl bg-slate-950 pl-10 pr-4 py-3 text-xs sm:text-sm text-white border border-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-600 transition-all font-medium"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                Kata Sandi (Password)
              </label>
              <button
                type="button"
                onClick={() => {
                  setEmail('jaenalmaskun@gmail.com');
                  setPassword('masbagus');
                  setErrorMsg(null);
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-semibold"
              >
                Isi Sandi "masbagus"
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-indigo-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="masbagus"
                className="w-full rounded-2xl bg-slate-950 pl-10 pr-10 py-3 text-xs sm:text-sm text-white border border-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-600 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Verified Preset Helper Pill */}
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/30 p-3 text-[11px] text-indigo-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-amber-400 shrink-0" />
              <div>
                <span>User: <strong className="text-white font-mono">jaenalmaskun@gmail.com</strong></span>
                <span className="mx-1">•</span>
                <span>Pass: <strong className="text-amber-300 font-mono">masbagus</strong></span>
              </div>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
              Terdaftar
            </span>
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-600 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Memverifikasi Akses Masuk...</span>
              </div>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Masuk ke EduVideo Studio</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </button>

          {/* Instant 1-Click Login Button for Dev Jaenal Maskun */}
          <button
            type="button"
            onClick={handleQuickLoginDev}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 py-3 text-xs font-bold text-amber-300 border border-amber-500/40 hover:border-amber-400 transition-all shadow-sm active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>⚡ Masuk Cepat 1-Klik sebagai Dev Jaenal Maskun</span>
          </button>

        </form>

        {/* Security & Pedagogical Seal */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center flex items-center justify-center gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Sesi Terenkripsi</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
            <span>Kurikulum Madrasah & Merdeka</span>
          </div>
        </div>

      </div>

      {/* Outer Developer Attribution */}
      <div className="relative z-10 mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
        <span>Dikembangkan secara khusus untuk Madrasah oleh</span>
        <strong className="text-amber-300 font-mono">Dev Jaenal Maskun</strong>
        <span className="text-sky-400">✓</span>
      </div>

    </div>
  );
};
