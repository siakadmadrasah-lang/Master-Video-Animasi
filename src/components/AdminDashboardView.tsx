import React, { useState } from 'react';
import { 
  ShieldCheck, 
  LayoutTemplate, 
  Download, 
  Sparkles, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Server, 
  FileCode, 
  FolderArchive, 
  Terminal, 
  Globe, 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Eye, 
  AlertTriangle,
  Code,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  HelpCircle,
  School,
  LogOut,
  RefreshCw,
  PanelTop,
  Sliders,
  Video,
  Settings
} from 'lucide-react';
import { HeroConfig, QuickTemplate, VideoProject, SubjectCategory, GradeLevel, VisualStyle, AdminUser, HeaderConfig } from '../types.ts';
import { DEFAULT_HERO_CONFIG } from '../data/defaultHeroConfig.ts';
import { DEFAULT_HEADER_CONFIG } from '../data/defaultHeaderConfig.ts';
import { generatePleskHostingZip, downloadBlob } from '../utils/pleskExporter.ts';

interface AdminDashboardViewProps {
  headerConfig: HeaderConfig;
  onUpdateHeaderConfig: (newConfig: HeaderConfig) => void;
  heroConfig: HeroConfig;
  onUpdateHeroConfig: (newConfig: HeroConfig) => void;
  projects: VideoProject[];
  adminUser: AdminUser;
  onLogoutAdmin: () => void;
  onNavigateToTab: (tab: string) => void;
  hasApiKey: boolean;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  headerConfig,
  onUpdateHeaderConfig,
  heroConfig,
  onUpdateHeroConfig,
  projects,
  adminUser,
  onLogoutAdmin,
  onNavigateToTab,
  hasApiKey,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'header' | 'hero' | 'plesk' | 'system'>('header');
  
  // Local edit states for Header
  const [draftHeader, setDraftHeader] = useState<HeaderConfig>(headerConfig);
  const [headerSaveNotice, setHeaderSaveNotice] = useState(false);

  // Local edit states for Hero
  const [draftHero, setDraftHero] = useState<HeroConfig>(heroConfig);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [editingTemplateIdx, setEditingTemplateIdx] = useState<number | null>(null);

  // Plesk Export Config
  const [targetDomain, setTargetDomain] = useState('mimaarifnu2sanggreman.sch.id');
  const [nodeVersion, setNodeVersion] = useState('20.x');
  const [includeProjectsInZip, setIncludeProjectsInZip] = useState(true);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatusText, setExportStatusText] = useState('');
  const [activePleskStep, setActivePleskStep] = useState<number>(1);

  // Handle saving header configuration
  const handleSaveHeader = () => {
    onUpdateHeaderConfig(draftHeader);
    localStorage.setItem('eduvideo_header_config', JSON.stringify(draftHeader));
    setHeaderSaveNotice(true);
    setTimeout(() => setHeaderSaveNotice(false), 3000);
  };

  // Reset Header to default
  const handleResetHeader = () => {
    if (confirm('Kembalikan konfigurasi Header & Navbar ke default awal?')) {
      setDraftHeader(DEFAULT_HEADER_CONFIG);
      onUpdateHeaderConfig(DEFAULT_HEADER_CONFIG);
      localStorage.removeItem('eduvideo_header_config');
      setHeaderSaveNotice(true);
      setTimeout(() => setHeaderSaveNotice(false), 3000);
    }
  };

  // Handle saving hero configuration
  const handleSaveHero = () => {
    onUpdateHeroConfig(draftHero);
    localStorage.setItem('eduvideo_hero_config', JSON.stringify(draftHero));
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  // Reset Hero to default
  const handleResetHero = () => {
    if (confirm('Kembalikan konfigurasi Hero Section ke default pabrik?')) {
      setDraftHero(DEFAULT_HERO_CONFIG);
      onUpdateHeroConfig(DEFAULT_HERO_CONFIG);
      localStorage.removeItem('eduvideo_hero_config');
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3000);
    }
  };

  // Template Management in Hero
  const handleAddTemplate = () => {
    const newTmpl: QuickTemplate = {
      id: `tmpl-${Date.now()}`,
      title: 'Judul Topik Pembelajaran Baru',
      subject: 'Fikih',
      grade: 'Kelas 1 MI',
      style: 'Kartun 2D',
      desc: 'Deskripsi ringkas topik pembelajaran untuk panduan guru.',
      material: 'Materi pembelajaran dasar yang akan digenerate otomatis oleh AI menjadi video interaktif.',
      badge: 'Kelas 1 MI • Fikih',
    };
    setDraftHero({
      ...draftHero,
      templates: [...draftHero.templates, newTmpl],
    });
    setEditingTemplateIdx(draftHero.templates.length);
  };

  const handleUpdateTemplate = (idx: number, updated: QuickTemplate) => {
    const updatedTemplates = [...draftHero.templates];
    updatedTemplates[idx] = updated;
    setDraftHero({
      ...draftHero,
      templates: updatedTemplates,
    });
  };

  const handleDeleteTemplate = (idx: number) => {
    const updated = draftHero.templates.filter((_, i) => i !== idx);
    setDraftHero({ ...draftHero, templates: updated });
    if (editingTemplateIdx === idx) setEditingTemplateIdx(null);
  };

  // Handle Plesk Zip Generation
  const handleDownloadPleskZip = async () => {
    try {
      setIsExportingZip(true);
      setExportProgress(10);
      setExportStatusText('Mempersiapkan berkas Plesk...');

      const zipBlob = await generatePleskHostingZip({
        domainName: targetDomain,
        nodeVersion: nodeVersion,
        projects: includeProjectsInZip ? projects : [],
        heroConfig: draftHero,
        onProgress: (percent, text) => {
          setExportProgress(percent);
          setExportStatusText(text);
        },
      });

      downloadBlob(zipBlob, `eduvideo-plesk-hosting-${targetDomain.replace(/[^a-zA-Z0-9]/g, '_')}.zip`);
      setIsExportingZip(false);
      setExportProgress(100);
      setExportStatusText('Unduhan selesai!');
      setTimeout(() => setExportStatusText(''), 4000);
    } catch (err) {
      console.error('Error generating Plesk ZIP:', err);
      setIsExportingZip(false);
      alert('Gagal membuat paket ZIP Plesk. Silakan coba lagi.');
    }
  };

  const SUBJECTS: SubjectCategory[] = [
    'Al-Qur\'an Hadis',
    'Akidah Akhlak',
    'Fikih',
    'SKI',
    'Bahasa Arab',
    'IPAS',
    'IPA',
    'Matematika',
    'Fisika',
    'Biologi',
    'Bahasa Indonesia',
    'Bahasa Inggris',
    'Informatika',
    'Pancasila & PPKn',
  ];

  const GRADES: GradeLevel[] = [
    'Kelas 1 MI',
    'Kelas 2 MI',
    'Kelas 3 MI',
    'Kelas 4 MI',
    'Kelas 5 MI',
    'Kelas 6 MI',
    'MI',
    'SD',
    'SMP',
    'SMA',
    'Kuliah',
    'Umum',
  ];

  const STYLES: VisualStyle[] = [
    'Kartun 2D',
    'Animasi 3D',
    'Infografis',
    'Presentasi',
    'Cinematic',
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Admin Header Bar */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 shadow-xl">
        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 shadow-lg shadow-indigo-500/30 ring-2 ring-white/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white">Dashboard Admin Madrasah</h1>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
                  {adminUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Login sebagai: <strong>{adminUser.name}</strong> ({adminUser.email})
              </p>
            </div>
          </div>

          {/* Quick Actions & Navigation */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => onNavigateToTab('dashboard')}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 border border-slate-700 transition-all"
            >
              <Eye className="h-3.5 w-3.5 text-indigo-400" />
              <span>Lihat Tampilan Siswa</span>
            </button>
            <button
              onClick={onLogoutAdmin}
              className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-2 text-xs font-semibold text-rose-300 border border-rose-500/30 transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar Admin</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex gap-2 border-t border-slate-800 pt-4 overflow-x-auto">
          <button
            onClick={() => setActiveAdminTab('header')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeAdminTab === 'header'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <PanelTop className="h-4 w-4" />
            <span>Kustomisasi Header &amp; Navbar</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('hero')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeAdminTab === 'hero'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <LayoutTemplate className="h-4 w-4" />
            <span>Fitur Edit Hero Section</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('plesk')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeAdminTab === 'plesk'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <FolderArchive className="h-4 w-4 text-emerald-300" />
            <span>Generator ZIP Hosting Plesk</span>
            <span className="rounded-md bg-emerald-950 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-300 border border-emerald-500/40">
              Utama
            </span>
          </button>

          <button
            onClick={() => setActiveAdminTab('system')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeAdminTab === 'system'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Server className="h-4 w-4" />
            <span>Sistem & Metrik Server</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 0: FITUR EDIT HEADER & NAVBAR */}
      {/* ======================================================== */}
      {activeAdminTab === 'header' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header Action & Notification Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PanelTop className="h-4 w-4 text-indigo-400" />
                Kustomisasi Live Header &amp; Navigasi Aplikasi
              </h3>
              <p className="text-xs text-slate-400">
                Sesuaikan nama brand, label badge, slogan madrasah, teks tombol Buat Video, dan running announcement bar atas.
              </p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetHeader}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 border border-slate-700 transition-all active:scale-95"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Awal</span>
              </button>

              <button
                type="button"
                onClick={handleSaveHeader}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-95 transition-all"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Simpan Perubahan Header</span>
              </button>
            </div>
          </div>

          {headerSaveNotice && (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs font-semibold text-emerald-300 animate-fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Konfigurasi Header &amp; Navbar berhasil disimpan dan langsung diterapkan ke seluruh aplikasi!</span>
            </div>
          )}

          {/* LIVE PREVIEW OF HEADER */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-indigo-400" />
                Live Preview Header Real-Time
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                Tampilan Langsung
              </span>
            </div>

            {/* Preview Box */}
            <div className="rounded-2xl border border-slate-800/90 bg-slate-950 overflow-hidden shadow-2xl">
              {draftHeader.showAnnouncement && draftHeader.announcementText && (
                <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-emerald-950 px-4 py-1 text-center text-[10px] sm:text-[11px] font-medium text-emerald-300 border-b border-slate-800/80 flex items-center justify-center gap-2">
                  <Sparkles className="h-3 w-3 text-amber-300 shrink-0" />
                  <span className="truncate">{draftHeader.announcementText}</span>
                </div>
              )}

              <div className="flex h-16 items-center justify-between px-4 sm:px-6">
                {/* Brand Left */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-emerald-500 shadow-md shadow-indigo-500/25 ring-2 ring-white/20 shrink-0">
                    <Video className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                        {draftHeader.brandName || 'EduVideo'}
                      </span>
                      {draftHeader.brandBadge && (
                        <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-300 border border-emerald-500/30">
                          {draftHeader.brandBadge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] text-slate-400 font-medium">
                        {draftHeader.subtitle || 'Video Edukasi Madrasah & Sekolah'}
                      </p>
                      {draftHeader.showInstitution && draftHeader.institutionName && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
                          <School className="h-2.5 w-2.5" />
                          {draftHeader.institutionName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Button Preview */}
                <div className="flex items-center gap-2">
                  <span className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md">
                    + {draftHeader.ctaText || 'Buat Video'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* EDIT FIELDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Box 1: Brand & Logo Text */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-indigo-400" />
                Identitas Brand &amp; Badge Header
              </h4>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Nama Brand / Judul Aplikasi
                </label>
                <input
                  type="text"
                  value={draftHeader.brandName}
                  onChange={(e) => setDraftHeader({ ...draftHeader, brandName: e.target.value })}
                  placeholder="Contoh: EduVideo"
                  className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 text-xs text-white border border-slate-800 focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Teks Label Badge (Sebelah Brand)
                </label>
                <input
                  type="text"
                  value={draftHeader.brandBadge}
                  onChange={(e) => setDraftHeader({ ...draftHeader, brandBadge: e.target.value })}
                  placeholder="Contoh: MI 1-6 AI"
                  className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 text-xs text-white border border-slate-800 focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Slogan / Subjudul Pendek
                </label>
                <input
                  type="text"
                  value={draftHeader.subtitle}
                  onChange={(e) => setDraftHeader({ ...draftHeader, subtitle: e.target.value })}
                  placeholder="Contoh: Video Edukasi Madrasah & Sekolah"
                  className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 text-xs text-white border border-slate-800 focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Teks Tombol Aksi Kanan (CTA)
                </label>
                <input
                  type="text"
                  value={draftHeader.ctaText}
                  onChange={(e) => setDraftHeader({ ...draftHeader, ctaText: e.target.value })}
                  placeholder="Contoh: Buat Video"
                  className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 text-xs text-white border border-slate-800 focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Box 2: Institution & Announcement Bar */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <School className="h-4 w-4 text-emerald-400" />
                Informasi Madrasah &amp; Banner Pengumuman
              </h4>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Nama Madrasah / Lembaga Pendidikan
                </label>
                <input
                  type="text"
                  value={draftHeader.institutionName}
                  onChange={(e) => setDraftHeader({ ...draftHeader, institutionName: e.target.value })}
                  placeholder="Contoh: MI Ma'arif NU 2 Sanggreman"
                  className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 text-xs text-white border border-slate-800 focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-950 p-3 border border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-white block">Tampilkan Nama Madrasah di Header</span>
                  <span className="text-[11px] text-slate-400">Menyematkan badge hijau nama madrasah di header</span>
                </div>
                <input
                  type="checkbox"
                  checked={draftHeader.showInstitution}
                  onChange={(e) => setDraftHeader({ ...draftHeader, showInstitution: e.target.checked })}
                  className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Teks Announcement Bar (Paling Atas)
                </label>
                <textarea
                  rows={2}
                  value={draftHeader.announcementText}
                  onChange={(e) => setDraftHeader({ ...draftHeader, announcementText: e.target.value })}
                  placeholder="Contoh: 🌟 Generator Video Pembelajaran Kurikulum Madrasah Kemenag & Kurikulum Merdeka Terintegrasi AI"
                  className="w-full rounded-xl bg-slate-950 px-3.5 py-2 text-xs text-white border border-slate-800 focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-950 p-3 border border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-white block">Aktifkan Announcement Bar Atas</span>
                  <span className="text-[11px] text-slate-400">Menampilkan banner pengumuman gradien di atas navbar</span>
                </div>
                <input
                  type="checkbox"
                  checked={draftHeader.showAnnouncement}
                  onChange={(e) => setDraftHeader({ ...draftHeader, showAnnouncement: e.target.checked })}
                  className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

          </div>

          {/* Bottom Save Reminder */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSaveHeader}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-95 transition-all"
            >
              <Save className="h-4 w-4" />
              <span>Simpan &amp; Terapkan Konfigurasi Header</span>
            </button>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: FITUR EDIT HERO SECTION */}
      {/* ======================================================== */}
      {activeAdminTab === 'hero' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header & Save Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4 text-indigo-400" />
                Kustomisasi Live Teks & Konten Hero Landing Page
              </h3>
              <p className="text-xs text-slate-400">
                Ubah judul utama, sorotan gradien, deskripsi, tombol aksi, dan template inspirasi yang muncul di halaman depan.
              </p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleResetHero}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Default</span>
              </button>

              <button
                onClick={handleSaveHero}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Simpan Perubahan Hero</span>
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {saveSuccessNotice && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-950/60 p-3.5 text-xs text-emerald-300 animate-fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Perubahan Hero Section berhasil disimpan dan langsung diterapkan ke halaman utama!</span>
            </div>
          )}

          {/* Form & Live Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Form Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Card 1: Headline & Subtitle */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  1. Teks Headline & Subtitle
                </h4>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">
                    Teks Badge Atas
                  </label>
                  <input
                    type="text"
                    value={draftHero.badgeText}
                    onChange={(e) => setDraftHero({ ...draftHero, badgeText: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 px-3.5 py-2 text-xs text-white border border-slate-800 focus:border-indigo-500 focus:outline-none"
                    placeholder="Contoh: AI Video Generator untuk Guru MI"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">
                    Judul Utama (Baris 1)
                  </label>
                  <input
                    type="text"
                    value={draftHero.headlineMain}
                    onChange={(e) => setDraftHero({ ...draftHero, headlineMain: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 px-3.5 py-2 text-xs text-white border border-slate-800 focus:border-indigo-500 focus:outline-none"
                    placeholder="Contoh: Ubah Teks & Materi Pelajaran Menjadi"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">
                    Sorotan Judul Berwarna Gradien (Baris 2)
                  </label>
                  <input
                    type="text"
                    value={draftHero.headlineHighlight}
                    onChange={(e) => setDraftHero({ ...draftHero, headlineHighlight: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 px-3.5 py-2 text-xs text-white border border-indigo-500/50 focus:border-indigo-400 focus:outline-none ring-1 ring-indigo-500/20"
                    placeholder="Contoh: Video Animasi Interaktif & Kuis"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">
                    Deskripsi / Paragraf Pengantar
                  </label>
                  <textarea
                    rows={3}
                    value={draftHero.description}
                    onChange={(e) => setDraftHero({ ...draftHero, description: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 px-3.5 py-2 text-xs text-white border border-slate-800 focus:border-indigo-500 focus:outline-none leading-relaxed"
                    placeholder="Tuliskan deskripsi ringkas tentang keunggulan EduVideo AI..."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">
                    Label Tombol CTA Utama
                  </label>
                  <input
                    type="text"
                    value={draftHero.ctaButtonText}
                    onChange={(e) => setDraftHero({ ...draftHero, ctaButtonText: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 px-3.5 py-2 text-xs text-white border border-slate-800 focus:border-indigo-500 focus:outline-none"
                    placeholder="Contoh: Buat Video Baru dengan AI"
                  />
                </div>
              </div>

              {/* Card 2: 4 Feature Highlights Pills */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  2. 4 Poin Fitur Unggulan (Pills)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Pill 1 (Storyboard):</label>
                    <input
                      type="text"
                      value={draftHero.featurePill1}
                      onChange={(e) => setDraftHero({ ...draftHero, featurePill1: e.target.value })}
                      className="w-full rounded-xl bg-slate-950 px-3 py-2 text-xs text-white border border-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Pill 2 (Suara/TTS):</label>
                    <input
                      type="text"
                      value={draftHero.featurePill2}
                      onChange={(e) => setDraftHero({ ...draftHero, featurePill2: e.target.value })}
                      className="w-full rounded-xl bg-slate-950 px-3 py-2 text-xs text-white border border-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Pill 3 (Subtitle):</label>
                    <input
                      type="text"
                      value={draftHero.featurePill3}
                      onChange={(e) => setDraftHero({ ...draftHero, featurePill3: e.target.value })}
                      className="w-full rounded-xl bg-slate-950 px-3 py-2 text-xs text-white border border-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Pill 4 (Kuis):</label>
                    <input
                      type="text"
                      value={draftHero.featurePill4}
                      onChange={(e) => setDraftHero({ ...draftHero, featurePill4: e.target.value })}
                      className="w-full rounded-xl bg-slate-950 px-3 py-2 text-xs text-white border border-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Quick Starter Templates Manager */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5" />
                    3. Template Mulai Cepat di Sisi Kanan ({draftHero.templates.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddTemplate}
                    className="flex items-center gap-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-indigo-300 hover:text-white border border-indigo-500/40 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Template</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {draftHero.templates.map((tmpl, idx) => {
                    const isEditing = editingTemplateIdx === idx;
                    return (
                      <div
                        key={tmpl.id || idx}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-500/20 text-[10px] font-bold text-indigo-300">
                              {idx + 1}
                            </span>
                            <h5 className="text-xs font-bold text-white truncate">{tmpl.title}</h5>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setEditingTemplateIdx(isEditing ? null : idx)}
                              className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] font-medium text-slate-300 transition-all flex items-center gap-1"
                            >
                              <Edit3 className="h-3 w-3" />
                              <span>{isEditing ? 'Tutup' : 'Edit'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTemplate(idx)}
                              className="rounded-lg bg-rose-500/10 hover:bg-rose-500/20 p-1 text-rose-400 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Inline Editor if expanded */}
                        {isEditing && (
                          <div className="pt-3 border-t border-slate-800 space-y-3 animate-fade-in">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="text-[10px] text-slate-400 mb-1 block">Judul Template:</label>
                                <input
                                  type="text"
                                  value={tmpl.title}
                                  onChange={(e) => handleUpdateTemplate(idx, { ...tmpl, title: e.target.value })}
                                  className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white border border-slate-800 focus:border-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 mb-1 block">Label Badge:</label>
                                <input
                                  type="text"
                                  value={tmpl.badge}
                                  onChange={(e) => handleUpdateTemplate(idx, { ...tmpl, badge: e.target.value })}
                                  className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white border border-slate-800 focus:border-indigo-500"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <div>
                                <label className="text-[10px] text-slate-400 mb-1 block">Mata Pelajaran:</label>
                                <select
                                  value={tmpl.subject}
                                  onChange={(e) => handleUpdateTemplate(idx, { ...tmpl, subject: e.target.value as SubjectCategory })}
                                  className="w-full rounded-lg bg-slate-900 px-2 py-1.5 text-xs text-white border border-slate-800 focus:border-indigo-500"
                                >
                                  {SUBJECTS.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 mb-1 block">Jenjang:</label>
                                <select
                                  value={tmpl.grade}
                                  onChange={(e) => handleUpdateTemplate(idx, { ...tmpl, grade: e.target.value as GradeLevel })}
                                  className="w-full rounded-lg bg-slate-900 px-2 py-1.5 text-xs text-white border border-slate-800 focus:border-indigo-500"
                                >
                                  {GRADES.map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 mb-1 block">Gaya Visual:</label>
                                <select
                                  value={tmpl.style}
                                  onChange={(e) => handleUpdateTemplate(idx, { ...tmpl, style: e.target.value as VisualStyle })}
                                  className="w-full rounded-lg bg-slate-900 px-2 py-1.5 text-xs text-white border border-slate-800 focus:border-indigo-500"
                                >
                                  {STYLES.map((v) => (
                                    <option key={v} value={v}>{v}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 mb-1 block">Teks Materi Lengkap:</label>
                              <textarea
                                rows={2}
                                value={tmpl.material}
                                onChange={(e) => handleUpdateTemplate(idx, { ...tmpl, material: e.target.value })}
                                className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white border border-slate-800 focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Column: Real-time Live Preview (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="sticky top-20 rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Eye className="h-4 w-4 text-emerald-400" />
                    <span>Live Preview Hero Section</span>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    Real-time Rendering
                  </span>
                </div>

                {/* Scaled-down Mini Hero Canvas */}
                <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-4 text-left space-y-3 relative overflow-hidden">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[9px] font-bold text-indigo-300">
                    <Sparkles className="h-3 w-3" />
                    {draftHero.badgeText}
                  </div>

                  <h3 className="text-base font-extrabold text-white leading-tight">
                    {draftHero.headlineMain}{' '}
                    <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200 bg-clip-text text-transparent">
                      {draftHero.headlineHighlight}
                    </span>
                  </h3>

                  <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
                    {draftHero.description}
                  </p>

                  {/* Feature Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[draftHero.featurePill1, draftHero.featurePill2, draftHero.featurePill3, draftHero.featurePill4].map((p, i) => (
                      <span key={i} className="text-[9px] font-medium rounded bg-slate-900 px-2 py-0.5 border border-slate-800 text-slate-300">
                        ✓ {p}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2">
                    <div className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-600 px-3.5 py-1.5 text-[11px] font-bold text-white shadow">
                      <Sparkles className="h-3 w-3" />
                      {draftHero.ctaButtonText}
                    </div>
                  </div>

                  {/* Template previews */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Template Starter ({draftHero.templates.length}):
                    </p>
                    {draftHero.templates.slice(0, 2).map((tmpl, idx) => (
                      <div key={idx} className="rounded-lg bg-slate-900/90 p-2 border border-slate-800 text-[10px]">
                        <div className="flex items-center justify-between text-indigo-300 font-bold mb-0.5">
                          <span className="truncate">{tmpl.title}</span>
                          <span className="text-[8px] bg-indigo-950 px-1 py-0.5 rounded">{tmpl.style}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 line-clamp-1">{tmpl.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <button
                    onClick={handleSaveHero}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-bold text-white shadow transition-all"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Terapkan & Simpan Sekarang</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: FITUR ZIP HOSTING PLESK */}
      {/* ======================================================== */}
      {activeAdminTab === 'plesk' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Main Plesk Banner Card */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-950 p-6 sm:p-8 shadow-2xl">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="max-w-2xl space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                  <FolderArchive className="h-4 w-4 text-emerald-400" />
                  Paket Distribusi Siap Deploy ke Plesk Obsidian
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Ekspor & Unduh ZIP Hosting Plesk
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Hasilkan paket arsip ZIP lengkap berstandar produksi yang telah terkonfigurasi otomatis dengan <strong>.htaccess (SPA Rewrite)</strong>, <strong>index.php fallback</strong>, <strong>web.config (IIS)</strong>, <strong>server.js Phusion Passenger</strong>, dan <strong>skema database MySQL</strong> untuk server hosting madrasah Anda.
                </p>
              </div>

              {/* Instant Download Action Card */}
              <div className="w-full lg:w-80 shrink-0 rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-5 space-y-4 shadow-xl">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Target Export ZIP</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                    Auto-Configured
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                      Nama Domain Madrasah:
                    </label>
                    <input
                      type="text"
                      value={targetDomain}
                      onChange={(e) => setTargetDomain(e.target.value)}
                      placeholder="madrasah.sch.id"
                      className="w-full rounded-xl bg-slate-950 px-3 py-2 text-xs text-white border border-slate-800 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                      Versi Node.js Plesk:
                    </label>
                    <select
                      value={nodeVersion}
                      onChange={(e) => setNodeVersion(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 px-3 py-2 text-xs text-white border border-slate-800 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="20.x">Node.js 20.x LTS (Rekomendasi)</option>
                      <option value="22.x">Node.js 22.x Current</option>
                      <option value="18.x">Node.js 18.x LTS</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1 text-[11px] text-slate-300">
                    <input
                      type="checkbox"
                      checked={includeProjectsInZip}
                      onChange={(e) => setIncludeProjectsInZip(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>Sertakan {projects.length} proyek video pembelajaran</span>
                  </label>
                </div>

                {/* Progress Indicator */}
                {isExportingZip && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[10px] text-slate-300 font-medium">
                      <span>{exportStatusText}</span>
                      <span>{exportProgress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-300"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {exportStatusText && !isExportingZip && (
                  <div className="text-[11px] text-emerald-400 font-medium text-center">
                    ✓ {exportStatusText}
                  </div>
                )}

                <button
                  onClick={handleDownloadPleskZip}
                  disabled={isExportingZip}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isExportingZip ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Mengompresi ZIP...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Unduh ZIP Hosting Plesk</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Included Files Breakdown & Plesk Interactive Guide */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Package File Tree (5 cols) */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                Struktur Berkas di Dalam ZIP Hosting
              </h3>
              <p className="text-[11px] text-slate-400">
                Semua file telah diuji kompatibel dengan Apache 2.4, LiteSpeed, Nginx, dan Plesk Phusion Passenger.
              </p>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2.5 font-mono text-[11px] text-slate-300">
                <div className="flex items-center gap-2 text-emerald-400 font-bold pb-1.5 border-b border-slate-800">
                  <FolderArchive className="h-4 w-4" />
                  <span>eduvideo-plesk-hosting.zip</span>
                </div>

                <div className="pl-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-300">
                    <FolderArchive className="h-3.5 w-3.5" />
                    <span>httpdocs/</span> <span className="text-[10px] text-slate-500">(Document Root)</span>
                  </div>
                  
                  <div className="pl-4 space-y-1 text-slate-300">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-3 w-3 text-amber-400" />
                      <span>.htaccess</span> <span className="text-[9px] text-slate-500">(URL rewrite, gzip, security)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Code className="h-3 w-3 text-sky-400" />
                      <span>index.html</span> <span className="text-[9px] text-slate-500">(SPA Production App)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileCode className="h-3 w-3 text-purple-400" />
                      <span>index.php</span> <span className="text-[9px] text-slate-500">(PHP fallback & API proxy)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileCode className="h-3 w-3 text-blue-400" />
                      <span>web.config</span> <span className="text-[9px] text-slate-500">(IIS/Windows rewrite)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FolderArchive className="h-3 w-3 text-slate-500" />
                      <span>data/projects.json</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    <div className="flex items-center gap-2 text-emerald-300">
                      <Terminal className="h-3.5 w-3.5" />
                      <span>server.js</span> <span className="text-[9px] text-slate-500">(Node.js Engine)</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <FileCode className="h-3 w-3 text-emerald-400" />
                      <span>package.json</span> <span className="text-[9px] text-slate-500">(Prod dependencies)</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <FileCode className="h-3 w-3 text-slate-400" />
                      <span>.env.example</span> <span className="text-[9px] text-slate-500">(API key config)</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Database className="h-3 w-3 text-amber-400" />
                      <span>database_schema.sql</span> <span className="text-[9px] text-slate-500">(MySQL phpMyAdmin)</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-300">
                      <BookOpen className="h-3 w-3 text-pink-400" />
                      <span>README_PLESK_DEPLOYMENT.md</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Step-by-Step Installation Guide (7 cols) */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  Petunjuk Praktis Deploy di Plesk Obsidian (5 Menit)
                </h3>
              </div>

              {/* Step Buttons */}
              <div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
                {[
                  { num: 1, title: '1. Upload File' },
                  { num: 2, title: '2. Setup Node / PHP' },
                  { num: 3, title: '3. API Key & SSL' },
                  { num: 4, title: '4. Database (Opsional)' },
                ].map((s) => (
                  <button
                    key={s.num}
                    onClick={() => setActivePleskStep(s.num)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
                      activePleskStep === s.num
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>

              {/* Step Content */}
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950 p-4 space-y-3 text-xs leading-relaxed text-slate-300">
                {activePleskStep === 1 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-slate-950">1</span>
                      Upload & Ekstrak Berkas ke Plesk File Manager
                    </h4>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1">
                      <li>Buka panel Plesk Anda di browser (<code className="text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded">https://ip-hosting:8443</code>).</li>
                      <li>Pilih domain madrasah Anda (<strong className="text-white">{targetDomain}</strong>).</li>
                      <li>Klik ikon <strong>File Manager</strong> lalu masuk ke root direktori domain.</li>
                      <li>Klik tombol <strong>Upload</strong> dan pilih file <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded">eduvideo-plesk-hosting.zip</code>.</li>
                      <li>Klik kanan pada file ZIP lalu pilih <strong>Extract Files</strong>.</li>
                    </ol>
                  </div>
                )}

                {activePleskStep === 2 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-slate-950">2</span>
                      Konfigurasi Node.js di Plesk (Atau Mode PHP SPA)
                    </h4>
                    <p>Pilih salah satu mode yang didukung server Plesk Anda:</p>
                    <div className="rounded-xl bg-slate-900 p-3 space-y-1.5 border border-slate-800">
                      <strong className="text-emerald-400 block">Opsi A: Mode Node.js (Phusion Passenger)</strong>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                        <li>Buka menu <strong>Node.js</strong> di dashboard domain Plesk.</li>
                        <li>Pilih versi: <strong>Node.js {nodeVersion}</strong>.</li>
                        <li>Document Root: <code className="text-indigo-300">/httpdocs</code></li>
                        <li>Application Root: <code className="text-indigo-300">/</code></li>
                        <li>Application Startup File: <code className="text-indigo-300">server.js</code></li>
                        <li>Klik <strong>NPM Install</strong> lalu klik <strong>Restart App</strong>.</li>
                      </ul>
                    </div>
                    <div className="rounded-xl bg-slate-900 p-3 space-y-1 border border-slate-800">
                      <strong className="text-indigo-400 block">Opsi B: Mode Static SPA + PHP-FPM</strong>
                      <p className="text-[11px] text-slate-300">
                        Cukup pastikan file <code className="text-amber-300">.htaccess</code>, <code className="text-amber-300">index.html</code>, dan <code className="text-amber-300">index.php</code> berada di direktori <code className="text-indigo-300">/httpdocs</code>.
                      </p>
                    </div>
                  </div>
                )}

                {activePleskStep === 3 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-slate-950">3</span>
                      Set Kunci API Gemini & Pasang SSL Let's Encrypt
                    </h4>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1">
                      <li>Di menu <strong>Node.js</strong> &gt; <strong>Environment Variables</strong>, tambahkan variabel:
                        <div className="my-1.5 p-2 bg-slate-900 rounded border border-slate-800 text-[11px] font-mono text-emerald-400">
                          GEMINI_API_KEY = AIzaSyD...
                        </div>
                      </li>
                      <li>Untuk mengaktifkan gembok hijau HTTPS, klik menu <strong>SSL/TLS Certificates</strong> di Plesk.</li>
                      <li>Klik <strong>Install Let's Encrypt Certificate</strong> (Gratis &amp; auto-renew).</li>
                      <li>Centang <em>Include www</em> dan klik <strong>Get it free</strong>.</li>
                    </ol>
                  </div>
                )}

                {activePleskStep === 4 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-slate-950">4</span>
                      Import Database MySQL via phpMyAdmin (Opsional)
                    </h4>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1">
                      <li>Buka menu <strong>Databases</strong> di Plesk &gt; klik <strong>Add Database</strong>.</li>
                      <li>Beri nama database <code className="text-amber-400 bg-slate-900 px-1 py-0.5 rounded">eduvideo_db</code> dan buat user password.</li>
                      <li>Klik ikon <strong>phpMyAdmin</strong> pada database yang baru dibuat.</li>
                      <li>Pilih tab <strong>Import</strong> &gt; upload file <code className="text-amber-400 bg-slate-900 px-1 py-0.5 rounded">database_schema.sql</code> dari paket zip &gt; klik <strong>Go</strong>.</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SISTEM & METRIK SERVER */}
      {/* ======================================================== */}
      {activeAdminTab === 'system' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Status Engine AI</span>
                <Sparkles className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-lg font-bold text-white flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Gemini 3.7 Flash
              </p>
              <p className="text-[11px] text-emerald-400">
                {hasApiKey ? 'Kunci API Gemini Aktif & Siap' : 'Menggunakan fallback cerdas'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Total Video Proyek</span>
                <Layers className="h-4 w-4 text-indigo-400" />
              </div>
              <p className="text-lg font-bold text-white">
                {projects.length} Proyek Aktif
              </p>
              <p className="text-[11px] text-slate-400">
                MI Kelas 1-6 & Jenjang Umum
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Target Hosting</span>
                <Server className="h-4 w-4 text-sky-400" />
              </div>
              <p className="text-lg font-bold text-white">
                Plesk Obsidian
              </p>
              <p className="text-[11px] text-sky-400">
                Node.js &amp; PHP-FPM Ready
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Otoritas Administrator</span>
                <ShieldCheck className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-lg font-bold text-white">
                Super Administrator
              </p>
              <p className="text-[11px] text-slate-400">
                Akses penuh sistem & hero
              </p>
            </div>

          </div>

          {/* Admin Details Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <School className="h-4 w-4 text-indigo-400" />
              Informasi Instansi & Akun Administrator
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold text-[10px]">Nama Lembaga / Madrasah:</span>
                <p className="font-bold text-white">MI Ma'arif NU 2 Sanggreman</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold text-[10px]">Email Admin Terdaftar:</span>
                <p className="font-bold text-white">{adminUser.email}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold text-[10px]">Role / Hak Akses:</span>
                <p className="font-bold text-emerald-400 uppercase tracking-wider">{adminUser.role}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold text-[10px]">Waktu Sesi Login Terakhir:</span>
                <p className="font-bold text-slate-300">{new Date(adminUser.lastLogin || Date.now()).toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
