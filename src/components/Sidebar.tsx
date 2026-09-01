import React from 'react';
import { 
  Layers, 
  Sparkles, 
  Library, 
  Settings, 
  HelpCircle, 
  BookOpen, 
  Video, 
  Sliders, 
  CheckCircle,
  FileText,
  ShieldCheck,
  FolderArchive
} from 'lucide-react';
import { VideoProject, AdminUser } from '../types.ts';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  recentProjects: VideoProject[];
  onSelectProject: (project: VideoProject) => void;
  adminUser?: AdminUser | null;
  onOpenAdminLogin?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  recentProjects,
  onSelectProject,
  adminUser,
  onOpenAdminLogin,
}) => {
  return (
    <aside className="w-64 shrink-0 border-r border-slate-800/80 bg-slate-950/70 backdrop-blur-md p-4 hidden lg:flex flex-col justify-between">
      <div className="space-y-6">
        
        {/* Main Menu */}
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Menu Utama
          </p>
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Layers className="h-4 w-4" />
              Dashboard Utama
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'create'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              Generator AI
              <span className="ml-auto rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300">
                Otomatis
              </span>
            </button>

            <button
              onClick={() => setActiveTab('videos')}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'videos'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Library className="h-4 w-4" />
              Koleksi Video Saya
              <span className="ml-auto rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                {recentProjects.length}
              </span>
            </button>

            <button
              onClick={() => {
                if (adminUser) {
                  setActiveTab('admin');
                } else if (onOpenAdminLogin) {
                  onOpenAdminLogin();
                }
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Panel Admin &amp; Hero</span>
              <span className="ml-auto rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-300">
                Admin
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Settings className="h-4 w-4" />
              Pengaturan Guru & AI
            </button>
          </div>
        </div>

        {/* Recent Projects Shortcut */}
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Proyek Terakhir
          </p>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {recentProjects.slice(0, 4).map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectProject(p)}
                className="flex w-full items-center gap-2.5 rounded-xl p-2 text-left hover:bg-slate-900 transition-all border border-transparent hover:border-slate-800"
              >
                <img
                  src={p.thumbnailUrl}
                  alt={p.title}
                  className="h-9 w-12 rounded-lg object-cover shrink-0 ring-1 ring-slate-800"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-200 truncate">
                    {p.title}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {p.subject} • {p.scenes.length} Scenes
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* AI Tips & Pedagogical Badge */}
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 to-slate-900/80 p-3.5 text-left shadow-lg">
        <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold mb-1">
          <BookOpen className="h-4 w-4 text-amber-300" />
          Tips Video Interaktif MI
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Gunakan durasi 1-3 menit dengan 1 kuis di akhir untuk memaksimalkan retensi materi siswa madrasah.
        </p>
      </div>

    </aside>
  );
};

