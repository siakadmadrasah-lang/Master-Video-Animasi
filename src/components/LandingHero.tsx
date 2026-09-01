import React, { useState } from 'react';
import { 
  Sparkles, 
  Wand2, 
  ArrowRight, 
  CheckCircle2, 
  BookOpen, 
  Layers, 
  Mic, 
  FileText, 
  HelpCircle,
  Play,
  Zap,
  GraduationCap
} from 'lucide-react';
import { SubjectCategory, GradeLevel, VisualStyle, HeroConfig } from '../types.ts';

interface LandingHeroProps {
  onStartCreate: () => void;
  onUseTemplate: (template: {
    title: string;
    subject: SubjectCategory;
    grade: GradeLevel;
    material: string;
    style: VisualStyle;
  }) => void;
  totalVideosCount: number;
  heroConfig?: HeroConfig;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartCreate,
  onUseTemplate,
  totalVideosCount,
  heroConfig,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const badgeText = heroConfig?.badgeText || 'AI Video Generator untuk Guru MI & Tenaga Pendidik';
  const headlineMain = heroConfig?.headlineMain || 'Ubah Teks & Materi Pelajaran Menjadi';
  const headlineHighlight = heroConfig?.headlineHighlight || 'Video Animasi Interaktif & Kuis';
  const description = heroConfig?.description || 'Cukup ketik judul dan materi, AI otomatis menyusun 7-scene storyboard, teks narasi suara Indonesia alami, subtitle bergerak, visual animasi, musik latar, serta kuis evaluasi pemahaman siswa siap tayang.';
  const ctaButtonText = heroConfig?.ctaButtonText || 'Buat Video Baru dengan AI';
  const pill1 = heroConfig?.featurePill1 || '7-Scene Storyboard';
  const pill2 = heroConfig?.featurePill2 || 'TTS Suara Guru';
  const pill3 = heroConfig?.featurePill3 || 'Subtitle Karaoke';
  const pill4 = heroConfig?.featurePill4 || 'Kuis Interaktif';

  const defaultTemplates = [
    {
      id: 'tmpl-1',
      title: 'Tata Cara Berwudhu yang Benar',
      subject: 'Fikih' as SubjectCategory,
      grade: 'Kelas 1 MI' as GradeLevel,
      style: 'Kartun 2D' as VisualStyle,
      desc: '6 rukun wudhu, doa bersuci & hal yang membatalkan.',
      material: 'Halo adik-adik Kelas 1 MI! Wudhu adalah cara bersuci dari hadats kecil sebelum melaksanakan shalat. Rukun wudhu ada 6: niat saat membasuh muka, membasuh seluruh wajah, membasuh tangan sampai siku, mengusap sebagian kepala, membasuh kaki sampai mata kaki, dan tertib berurutan.',
      badge: 'Kelas 1 MI • Fikih',
      iconColor: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'tmpl-2',
      title: 'Adab Berbakti kepada Orang Tua & Guru',
      subject: 'Akidah Akhlak' as SubjectCategory,
      grade: 'Kelas 2 MI' as GradeLevel,
      style: 'Kartun 2D' as VisualStyle,
      desc: 'Sikap santun, salam santun & mendoakan kebaikan.',
      material: 'Anak yang saleh dan salehah di Kelas 2 MI selalu menghormati orang tua dan guru. Kita bertutur kata sopan, mengucapkan salam, mencium tangan, serta rajin mendoakan kebaikan bagi mereka.',
      badge: 'Kelas 2 MI • Akhlak',
      iconColor: 'from-amber-500 to-orange-600',
    },
    {
      id: 'tmpl-3',
      title: 'Hukum Gerak Newton dalam Kehidupan',
      subject: 'Fisika' as SubjectCategory,
      grade: 'SMP' as GradeLevel,
      style: 'Animasi 3D' as VisualStyle,
      desc: 'Inersia, rumus F=m.a & aksi-reaksi peluncuran roket.',
      material: 'Sir Isaac Newton merumuskan 3 hukum gerak: Hukum I Kelembaman, Hukum II Percepatan gaya F=m.a, dan Hukum III Aksi-Reaksi. Menjelaskan dinamika gerak di bumi dan angkasa.',
      badge: 'SMP • Fisika',
      iconColor: 'from-cyan-500 to-blue-600',
    },
    {
      id: 'tmpl-4',
      title: 'Kecerdasan Buatan & Masa Depan',
      subject: 'Informatika' as SubjectCategory,
      grade: 'SMA' as GradeLevel,
      style: 'Cinematic' as VisualStyle,
      desc: 'Machine Learning, etika AI & inovasi generasi muda.',
      material: 'Kecerdasan Buatan (AI) adalah simulasi kecerdasan manusia dalam mesin. Meliputi Machine Learning, model bahasa besar, visi komputer, dan dampaknya pada masa depan generasi muda.',
      badge: 'SMA • AI Skills',
      iconColor: 'from-purple-500 to-indigo-600',
    },
  ];

  const templates = heroConfig?.templates && heroConfig.templates.length > 0 
    ? heroConfig.templates 
    : defaultTemplates;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 p-6 sm:p-8 lg:p-9 text-left shadow-2xl shadow-indigo-950/30 backdrop-blur-xl">
      
      {/* Sleek Radial Glow Effects */}
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

      {/* Main Grid: Streamlined 2-Column Hierarchy */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Iconic Title, Refined Badge & Direct CTA */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Iconic Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3.5 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-md shadow-inner">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span className="truncate max-w-[280px] sm:max-w-none">{badgeText}</span>
          </div>

          {/* High-Contrast Iconic Headline */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {headlineMain}{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
              {headlineHighlight}
            </span>
          </h1>

          {/* Streamlined Description */}
          <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed max-w-xl font-normal">
            {description}
          </p>

          {/* Compact Feature Micro-Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-slate-300">
              <Layers className="h-3 w-3 text-indigo-400" />
              {pill1}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-slate-300">
              <Mic className="h-3 w-3 text-emerald-400" />
              {pill2}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-slate-300">
              <FileText className="h-3 w-3 text-sky-400" />
              {pill3}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-slate-300">
              <HelpCircle className="h-3 w-3 text-pink-400" />
              {pill4}
            </span>
          </div>

          {/* Primary Action & Quick Stats */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={onStartCreate}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-95 transition-all ring-1 ring-white/20"
            >
              <Wand2 className="h-4 w-4" />
              <span>{ctaButtonText}</span>
              <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium pl-1">
              <GraduationCap className="h-4 w-4 text-emerald-400" />
              <span>
                <strong className="text-slate-200 font-semibold">{totalVideosCount} Video</strong> di Studio
              </span>
            </div>
          </div>

        </div>

        {/* Right Column: Sleek 2x2 Template Quick-Launcher Card Matrix */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-2.5">
          
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>Inspirasi Template Cepat</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
              1-Klik Generate
            </span>
          </div>

          {/* Clean 2x2 Grid of Elegant Quick-Start Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {templates.slice(0, 4).map((tmpl, idx) => (
              <div
                key={tmpl.id || idx}
                onClick={() => onUseTemplate(tmpl)}
                className="group relative cursor-pointer rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3 hover:border-indigo-500/50 hover:bg-slate-800/80 hover:shadow-md transition-all text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="rounded-md bg-indigo-500/15 px-2 py-0.5 text-[9px] font-bold text-indigo-300 border border-indigo-500/20 truncate">
                      {tmpl.badge || `${tmpl.grade} • ${tmpl.subject}`}
                    </span>
                    <span className="text-[9px] font-medium text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/60">
                      {tmpl.style}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {tmpl.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                    {tmpl.desc}
                  </p>
                </div>

                <div className="mt-2.5 flex items-center justify-between pt-1 border-t border-slate-800/50 text-[10px] text-indigo-400 font-medium group-hover:text-indigo-300">
                  <span className="flex items-center gap-1">
                    <Play className="h-2.5 w-2.5 fill-indigo-400 group-hover:fill-indigo-300" />
                    Pakai Template
                  </span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};
