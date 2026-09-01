import React from 'react';
import { Sparkles, Video, Play, ArrowRight, Wand2, Clock, CheckCircle2, BookOpen, Music, Subtitles, HelpCircle, School } from 'lucide-react';
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
  const badgeText = heroConfig?.badgeText || 'AI Video Generator untuk Guru MI & Tenaga Pendidik';
  const headlineMain = heroConfig?.headlineMain || 'Ubah Teks & Materi Pelajaran Menjadi';
  const headlineHighlight = heroConfig?.headlineHighlight || 'Video Animasi Interaktif & Kuis';
  const description = heroConfig?.description || 'Cukup ketik judul dan materi, AI otomatis menyusun 7-scene storyboard, teks narasi suara Indonesia alami, subtitle bergerak, visual animasi, musik latar, serta kuis evaluasi pemahaman siswa siap tayang.';
  const ctaButtonText = heroConfig?.ctaButtonText || 'Buat Video Baru dengan AI';
  const pill1 = heroConfig?.featurePill1 || '7-Scene Storyboard';
  const pill2 = heroConfig?.featurePill2 || 'Text to Speech Suara Guru';
  const pill3 = heroConfig?.featurePill3 || 'Subtitle Karaoke Otomatis';
  const pill4 = heroConfig?.featurePill4 || 'Kuis Evaluasi Siswa';

  const templates = heroConfig?.templates && heroConfig.templates.length > 0 ? heroConfig.templates : [
    {
      id: 'tmpl-1',
      title: 'Tata Cara Berwudhu yang Benar & Tertib',
      subject: 'Fikih' as SubjectCategory,
      grade: 'Kelas 1 MI' as GradeLevel,
      style: 'Kartun 2D' as VisualStyle,
      desc: 'Membahas 6 rukun wudhu, sunnah bersuci, doa menghadap kiblat, & hal yang membatalkan.',
      material: 'Halo adik-adik Kelas 1 MI! Wudhu adalah cara bersuci dari hadats kecil sebelum melaksanakan shalat. Rukun wudhu ada 6: niat saat membasuh muka, membasuh seluruh wajah, membasuh tangan sampai siku, mengusap sebagian kepala, membasuh kaki sampai mata kaki, dan tertib berurutan.',
      badge: 'Kelas 1 MI • Fikih',
    },
    {
      id: 'tmpl-2',
      title: 'Adab Berbakti kepada Orang Tua dan Guru',
      subject: 'Akidah Akhlak' as SubjectCategory,
      grade: 'Kelas 2 MI' as GradeLevel,
      style: 'Kartun 2D' as VisualStyle,
      desc: 'Sikap santun, mencium tangan, mendengarkan nasihat, dan mendoakan kebaikan.',
      material: 'Anak yang saleh dan salehah di Kelas 2 MI selalu menghormati orang tua dan guru. Kita bertutur kata sopan, mengucapkan salam, mencium tangan, serta rajin mendoakan kebaikan bagi mereka.',
      badge: 'Kelas 2 MI • Akhlak',
    },
    {
      id: 'tmpl-3',
      title: 'Hukum Gerak Newton dalam Kehidupan',
      subject: 'Fisika' as SubjectCategory,
      grade: 'SMP' as GradeLevel,
      style: 'Animasi 3D' as VisualStyle,
      desc: 'Membahas inersia bus mengerem, rumus F=m.a, dan aksi-reaksi peluncuran roket.',
      material: 'Sir Isaac Newton merumuskan 3 hukum gerak: Hukum I Kelembaman, Hukum II Percepatan gaya F=m.a, dan Hukum III Aksi-Reaksi. Menjelaskan dinamika gerak di bumi dan angkasa.',
      badge: 'SMP Kelas 8',
    },
    {
      id: 'tmpl-4',
      title: 'Pengenalan Artificial Intelligence & Masa Depan',
      subject: 'Informatika' as SubjectCategory,
      grade: 'SMA' as GradeLevel,
      style: 'Cinematic' as VisualStyle,
      desc: 'Konsep dasar AI, Machine Learning, Deep Learning, serta etika penggunaan teknologi.',
      material: 'Kecerdasan Buatan (AI) adalah simulasi kecerdasan manusia dalam mesin. Meliputi Machine Learning, model bahasa besar, visi komputer, dan dampaknya pada masa depan generasi muda.',
      badge: 'SMA / Umum',
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-slate-900/95 via-slate-950 to-slate-950 p-6 sm:p-10 text-center sm:text-left shadow-2xl shadow-indigo-950/40 ring-1 ring-white/10">
      
      {/* Background Decorative Mesh & Glows */}
      <div className="absolute top-0 right-1/4 h-80 w-80 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* Left Content */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-gradient-to-r from-indigo-500/20 via-emerald-500/15 to-indigo-500/20 px-4 py-1.5 text-xs font-bold text-indigo-300 mb-5 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
            <span>{badgeText}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.18]">
            {headlineMain}{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-300 bg-clip-text text-transparent drop-shadow-sm">
              {headlineHighlight}
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            {description}
          </p>

          {/* Quick Feature Pills */}
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-300 font-medium">
            <span className="flex items-center gap-1.5 rounded-xl bg-slate-900/90 px-3 py-1.5 border border-slate-800 shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              {pill1}
            </span>
            <span className="flex items-center gap-1.5 rounded-xl bg-slate-900/90 px-3 py-1.5 border border-slate-800 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              {pill2}
            </span>
            <span className="flex items-center gap-1.5 rounded-xl bg-slate-900/90 px-3 py-1.5 border border-slate-800 shadow-sm">
              <Subtitles className="h-3.5 w-3.5 text-sky-400" />
              {pill3}
            </span>
            <span className="flex items-center gap-1.5 rounded-xl bg-slate-900/90 px-3 py-1.5 border border-slate-800 shadow-sm">
              <HelpCircle className="h-3.5 w-3.5 text-pink-400" />
              {pill4}
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={onStartCreate}
              className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-600 px-7 py-4 text-sm font-extrabold text-white shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-95 transition-all ring-1 ring-white/20"
            >
              <Wand2 className="h-4 w-4" />
              <span>{ctaButtonText}</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Right Starter Cards */}
        <div className="w-full lg:w-96 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
              Mulai Cepat dengan Template:
            </p>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              {templates.length} Topik
            </span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {templates.map((tmpl, idx) => (
              <div
                key={tmpl.id || idx}
                onClick={() => onUseTemplate(tmpl)}
                className="group relative cursor-pointer rounded-2xl border border-slate-800/90 bg-slate-900/80 p-3.5 hover:border-indigo-500/50 hover:bg-slate-900 transition-all text-left shadow-md"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                    {tmpl.badge || `${tmpl.grade} • ${tmpl.subject}`}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    {tmpl.style}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                  {tmpl.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {tmpl.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

