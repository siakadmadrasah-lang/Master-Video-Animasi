import React, { useState, useRef, useEffect } from 'react';
import { AspectRatio, Project } from '../types';
import {
  Wand2,
  Download,
  Camera,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Volume2,
  VolumeX,
  Tv,
  Smartphone,
  Square,
  Film,
  FolderOpen,
  Plus,
  FilePlus2,
  RefreshCcw,
  Edit3,
  Check,
  ChevronDown,
  SidebarClose,
  SidebarOpen,
} from 'lucide-react';

interface HeaderProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
  onOpenAIWizard: () => void;
  onOpenTemplates: () => void;
  onOpenExport: () => void;
  onOpenMediaLibrary: () => void;
  onTakeSnapshot: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onNewBlankProject: () => void;
  onResetDemo: () => void;
  isInspectorOpen?: boolean;
  onToggleInspector?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  onUpdateProject,
  onOpenAIWizard,
  onOpenTemplates,
  onOpenExport,
  onOpenMediaLibrary,
  onTakeSnapshot,
  isMuted,
  onToggleMute,
  onNewBlankProject,
  onResetDemo,
  isInspectorOpen = true,
  onToggleInspector,
}) => {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(project.title);
  const newMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTempTitle(project.title);
  }, [project.title]);

  // Click outside listener for New Menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setShowNewMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      onUpdateProject((p) => ({
        ...p,
        title: tempTitle.trim(),
        updatedAt: Date.now(),
      }));
    }
    setIsEditingTitle(false);
  };

  const aspectRatios: Array<{ id: AspectRatio; label: string; icon: React.ReactNode }> = [
    { id: '16:9', label: '16:9 Cinema / YT', icon: <Tv className="w-3.5 h-3.5" /> },
    { id: '9:16', label: '9:16 Shorts / TikTok', icon: <Smartphone className="w-3.5 h-3.5" /> },
    { id: '1:1', label: '1:1 Feed', icon: <Square className="w-3.5 h-3.5" /> },
    { id: '21:9', label: '21:9 Ultra-Wide', icon: <Film className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between select-none z-30 sticky top-0">
      {/* Left: Brand, New Project Menu & Project Name */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-indigo-500 to-rose-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
            <Film className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="font-extrabold text-sm tracking-tight text-white">CineAI</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              Studio
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-800 mx-0.5 sm:mx-1" />

        {/* Buat Baru Dropdown Button */}
        <div className="relative" ref={newMenuRef}>
          <button
            onClick={() => setShowNewMenu(!showNewMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/60 shadow-sm transition-all"
            title="Menu Buat Proyek Baru"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400 font-bold" />
            <span className="font-medium">Buat Baru</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showNewMenu && (
            <div className="absolute left-0 top-full mt-1.5 w-60 bg-slate-900 border border-slate-800 rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Opsi Buat Video Baru
              </div>

              {/* 1. Blank Project */}
              <button
                onClick={() => {
                  setShowNewMenu(false);
                  onNewBlankProject();
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-slate-800 flex items-center gap-2.5 text-slate-200 transition-all group"
              >
                <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                  <FilePlus2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-white">Proyek Baru (Kosong)</span>
                  <span className="text-[10px] text-slate-400">Mulai dari kanvas video baru</span>
                </div>
              </button>

              {/* 2. AI Wizard */}
              <button
                onClick={() => {
                  setShowNewMenu(false);
                  onOpenAIWizard();
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-slate-800 flex items-center gap-2.5 text-slate-200 transition-all group"
              >
                <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-white">Buat dengan AI (Prompt)</span>
                  <span className="text-[10px] text-slate-400">Generate storyboard & video otomatis</span>
                </div>
              </button>

              {/* 3. Templates */}
              <button
                onClick={() => {
                  setShowNewMenu(false);
                  onOpenTemplates();
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-slate-800 flex items-center gap-2.5 text-slate-200 transition-all group"
              >
                <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-all">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-white">Dari Template Sinematik</span>
                  <span className="text-[10px] text-slate-400">Pilih tema preset siap pakai</span>
                </div>
              </button>

              <div className="h-px bg-slate-800 my-0.5" />

              {/* 4. Reset Demo */}
              <button
                onClick={() => {
                  setShowNewMenu(false);
                  onResetDemo();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800/80 flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-all"
              >
                <RefreshCcw className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px]">Muat Ulang Demo Jakarta 2050</span>
              </button>
            </div>
          )}
        </div>

        {/* Project Title Input / Display */}
        {isEditingTitle ? (
          <div className="flex items-center gap-1 bg-slate-900 border border-cyan-500 rounded px-1.5 py-0.5">
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') setIsEditingTitle(false);
              }}
              autoFocus
              className="text-xs font-semibold text-white bg-transparent outline-none w-36 sm:w-48"
            />
            <button
              onClick={handleSaveTitle}
              className="p-1 text-cyan-400 hover:text-cyan-300"
              title="Simpan Judul"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingTitle(true)}
            className="group flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-200 hover:text-white bg-transparent hover:bg-slate-900/80 border border-transparent hover:border-slate-800 rounded px-2 py-1 max-w-[150px] sm:max-w-[220px] transition-all"
            title="Klik untuk mengubah judul video"
          >
            <span className="truncate">{project.title}</span>
            <Edit3 className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
          </div>
        )}
      </div>

      {/* Center: Aspect Ratio & Audio Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Aspect Ratio Switcher */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5">
          {aspectRatios.map((item) => (
            <button
              key={item.id}
              onClick={() =>
                onUpdateProject((p) => ({
                  ...p,
                  aspectRatio: item.id,
                  updatedAt: Date.now(),
                }))
              }
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 text-xs rounded font-medium transition-all ${
                project.aspectRatio === item.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title={`Format ${item.label}`}
            >
              {item.icon}
              <span className="hidden md:inline">{item.id}</span>
            </button>
          ))}
        </div>

        {/* Letterbox Bar Toggle */}
        <button
          onClick={() =>
            onUpdateProject((p) => ({
              ...p,
              letterbox: !p.letterbox,
            }))
          }
          className={`px-2.5 py-1 text-xs rounded-lg border hidden md:flex items-center gap-1.5 transition-all ${
            project.letterbox
              ? 'bg-slate-800 text-cyan-400 border-cyan-500/40'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800'
          }`}
          title="Toggle Garis Sinematik 2.39:1 Letterbox"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Letterbox</span>
        </button>

        {/* Master Sound Toggle */}
        <button
          onClick={onToggleMute}
          className={`p-1.5 rounded-lg border transition-all ${
            isMuted
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
          title={isMuted ? 'Suara dimatikan (Klik untuk nyalakan)' : 'Suara aktif (Klik untuk mute)'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Right: Actions (Templates, Media, Export, Toggle Inspector) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Templates Button */}
        <button
          onClick={onOpenTemplates}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-all shadow-sm"
        >
          <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>Templates</span>
        </button>

        {/* Media Library */}
        <button
          onClick={onOpenMediaLibrary}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Media AI</span>
        </button>

        {/* Take Snapshot Button */}
        <button
          onClick={onTakeSnapshot}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all"
          title="Ambil Foto Frame Saat Ini (Snapshot)"
        >
          <Camera className="w-4 h-4 text-emerald-400" />
        </button>

        {/* AI Create Wizard Button */}
        <button
          onClick={onOpenAIWizard}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-md shadow-cyan-500/25 border border-cyan-400/30 transition-all transform active:scale-95"
        >
          <Wand2 className="w-3.5 h-3.5 animate-pulse" />
          <span className="hidden sm:inline">AI Wizard</span>
        </button>

        {/* Export Video Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 border border-emerald-400/30 transition-all transform active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Ekspor</span>
        </button>

        {/* Toggle Inspector Sidebar */}
        {onToggleInspector && (
          <button
            onClick={onToggleInspector}
            className={`p-1.5 rounded-lg border transition-all ${
              isInspectorOpen
                ? 'bg-slate-800 text-cyan-400 border-cyan-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
            title={isInspectorOpen ? 'Tutup Panel Inspector Scene' : 'Buka Panel Inspector Scene'}
          >
            {isInspectorOpen ? <SidebarClose className="w-4 h-4" /> : <SidebarOpen className="w-4 h-4" />}
          </button>
        )}
      </div>
    </header>
  );
};

