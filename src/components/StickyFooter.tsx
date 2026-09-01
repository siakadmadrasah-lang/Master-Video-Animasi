import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Plus, 
  Video, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  School,
  Zap,
  CheckCircle2,
  Cpu,
  GraduationCap,
  PenTool
} from 'lucide-react';
import { AdminUser } from '../types.ts';

interface StickyFooterProps {
  onQuickCreate: () => void;
  onOpenAdminLogin: () => void;
  adminUser: AdminUser | null;
  totalProjects: number;
  hasApiKey: boolean;
}

export const StickyFooter: React.FC<StickyFooterProps> = ({
  onQuickCreate,
  onOpenAdminLogin,
  adminUser,
  totalProjects,
  hasApiKey,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  // Animated writing / typewriter state for "Dev Jaenal Maskun"
  const fullDevName = 'Dev Jaenal Maskun';
  const [typedName, setTypedName] = useState('');
  const [isWriting, setIsWriting] = useState(true);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Auto-hide when typing into any input/textarea to never block mobile forms
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      setIsKeyboardOpen(false);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  useEffect(() => {
    let charIndex = 0;
    let isDeleting = false;
    let timer: any = null;

    const tick = () => {
      if (!isDeleting) {
        charIndex++;
        setTypedName(fullDevName.substring(0, charIndex));
        setIsWriting(true);

        if (charIndex >= fullDevName.length) {
          // Completed writing, pause for 3.5 seconds
          setIsWriting(false);
          timer = setTimeout(() => {
            isDeleting = true;
            tick();
          }, 3500);
          return;
        }
        timer = setTimeout(tick, 110);
      } else {
        charIndex--;
        setTypedName(fullDevName.substring(0, charIndex));
        setIsWriting(true);

        if (charIndex <= 0) {
          isDeleting = false;
          timer = setTimeout(tick, 500);
          return;
        }
        timer = setTimeout(tick, 45);
      }
    };

    timer = setTimeout(tick, 400);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (isKeyboardOpen) {
    return null;
  }

  return (
    <footer className="sticky bottom-0 z-40 w-full transition-all duration-300 pointer-events-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-3">
        
        {/* Minimized Dock Button */}
        {isMinimized ? (
          <div className="flex justify-end pointer-events-auto">
            <button
              onClick={() => setIsMinimized(false)}
              className="flex items-center gap-2 rounded-full bg-slate-900/95 border border-indigo-500/40 px-4 py-2 text-xs font-bold text-slate-200 shadow-2xl backdrop-blur-lg hover:border-indigo-400 hover:text-white transition-all active:scale-95"
            >
              <div className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-emerald-300">
                EduVideo Dock
              </span>
              <ChevronUp className="h-3.5 w-3.5 text-indigo-400" />
            </button>
          </div>
        ) : (
          /* Full Iconic Glass Sticky Footer Bar */
          <div className="pointer-events-auto relative overflow-hidden rounded-2xl sm:rounded-3xl border border-indigo-500/30 bg-slate-950/90 p-2.5 sm:p-3.5 shadow-2xl shadow-black/80 backdrop-blur-xl ring-1 ring-white/10">
            
            {/* Top Ambient Glow Line */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500 via-emerald-400 to-transparent opacity-80" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-4">
              
              {/* Left Branding & Animated Developer Writing Badge */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-emerald-500 shadow-lg shadow-indigo-500/25 ring-2 ring-white/15 shrink-0">
                    <Video className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white tracking-tight">
                        EduVideo Studio AI
                      </span>
                      <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-300 border border-emerald-500/30">
                        MI 1-6 Pro
                      </span>
                    </div>
                    
                    {/* Animated Handwriting Developer Badge */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-300 mt-0.5">
                      <span className="text-amber-400 font-bold">Karya:</span>
                      <div className="inline-flex items-center gap-1 font-mono font-bold text-amber-300 bg-amber-950/40 px-2 py-0.2 rounded-md border border-amber-500/30">
                        <span>{typedName}</span>
                        {isWriting ? (
                          <span className="inline-block h-3 w-1.5 bg-amber-400 animate-pulse" />
                        ) : (
                          <span className="text-sky-400 font-sans font-black text-[9px]">✓</span>
                        )}
                        <span className="text-[11px] animate-bounce">✍️</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Pill on Mobile */}
                <div className="flex md:hidden items-center gap-1.5 rounded-full bg-slate-900/90 px-2.5 py-1 text-[10px] text-slate-300 border border-slate-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-emerald-300">Gemini 3.7</span>
                </div>
              </div>

              {/* Center Iconic Status Telemetry (Desktop) */}
              <div className="hidden lg:flex items-center gap-2.5 text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5 rounded-xl bg-slate-900/90 px-3 py-1.5 border border-slate-800/90 shadow-inner">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-slate-400">AI Engine:</span>
                  <strong className="text-emerald-300 font-bold">Gemini 3.7 Flash</strong>
                </div>

                <div className="flex items-center gap-1.5 rounded-xl bg-slate-900/90 px-3 py-1.5 border border-slate-800/90 shadow-inner">
                  <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="text-slate-400">Kurikulum:</span>
                  <strong className="text-indigo-200 font-bold">Madrasah & Merdeka</strong>
                </div>

                <div className="flex items-center gap-1.5 rounded-xl bg-slate-900/90 px-3 py-1.5 border border-slate-800/90 shadow-inner">
                  <Layers className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-slate-400">Proyek:</span>
                  <strong className="text-amber-300 font-bold">{totalProjects} Video</strong>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap sm:flex-nowrap">
                
                {/* Admin Portal Button */}
                <button
                  onClick={onOpenAdminLogin}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 border shadow-sm ${
                    adminUser
                      ? 'bg-emerald-950/80 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/40'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                  }`}
                >
                  <ShieldCheck className={`h-3.5 w-3.5 ${adminUser ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{adminUser ? 'Panel Admin' : 'Login Admin'}</span>
                  {adminUser && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                </button>

                {/* Quick Create AI Video */}
                <button
                  onClick={onQuickCreate}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>Buat Video AI</span>
                </button>

                {/* Minimize Toggle */}
                <button
                  onClick={() => setIsMinimized(true)}
                  title="Kecilkan footer dock"
                  className="rounded-xl bg-slate-900/90 hover:bg-slate-800 p-2 text-slate-400 hover:text-white border border-slate-800 transition-all ml-1"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

              </div>

            </div>

          </div>
        )}

      </div>
    </footer>
  );
};
