import React from 'react';
import { Video, Sparkles, Plus, Layers, Settings, Library, ShieldCheck, School } from 'lucide-react';
import { UserProfile, AdminUser, HeaderConfig } from '../types.ts';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile;
  adminUser: AdminUser | null;
  headerConfig: HeaderConfig;
  onOpenAuthModal: () => void;
  onOpenAdminLogin: () => void;
  hasApiKey: boolean;
  onQuickCreate: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  adminUser,
  headerConfig,
  onOpenAuthModal,
  onOpenAdminLogin,
  hasApiKey,
  onQuickCreate,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl ring-1 ring-white/5">
      {/* Top Announcement Bar (if enabled) */}
      {headerConfig.showAnnouncement && headerConfig.announcementText && (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-emerald-950 px-4 py-1 text-center text-[11px] font-medium text-emerald-300 border-b border-slate-800/80 flex items-center justify-center gap-2">
          <Sparkles className="h-3 w-3 text-amber-300 shrink-0" />
          <span className="truncate max-w-2xl">{headerConfig.announcementText}</span>
        </div>
      )}

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Institution Info */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-emerald-500 shadow-lg shadow-indigo-500/25 ring-2 ring-white/20 transition-transform hover:scale-105 shrink-0">
            <Video className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                {headerConfig.brandName || 'EduVideo'}
              </span>
              {headerConfig.brandBadge && (
                <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-300 border border-emerald-500/30">
                  {headerConfig.brandBadge}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <p className="hidden sm:block text-[10px] text-slate-400 font-medium -mt-0.5">
                {headerConfig.subtitle || 'Video Edukasi Madrasah & Sekolah'}
              </p>
              {headerConfig.showInstitution && headerConfig.institutionName && (
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/50 px-2 py-0.2 rounded border border-emerald-500/20">
                  <School className="h-2.5 w-2.5" />
                  {headerConfig.institutionName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 rounded-full bg-slate-900/90 p-1 border border-slate-800/90 shadow-inner">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'create'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Buat Video AI</span>
          </button>

          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'videos'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Library className="h-3.5 w-3.5" />
            <span>Galeri</span>
          </button>

          <button
            onClick={() => {
              if (adminUser) {
                setActiveTab('admin');
              } else {
                onOpenAdminLogin();
              }
            }}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'admin'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : adminUser
                ? 'text-emerald-400 hover:bg-emerald-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Admin</span>
            {adminUser && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Pengaturan</span>
          </button>
        </nav>

        {/* Right Actions & User Profile */}
        <div className="flex items-center gap-2.5">
          
          {/* Quick Create CTA */}
          <button
            onClick={onQuickCreate}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-indigo-700 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span className="hidden sm:inline">{headerConfig.ctaText || 'Buat Video'}</span>
          </button>

          {/* User Profile Avatar */}
          <div
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 cursor-pointer rounded-xl bg-slate-900/90 p-1.5 pr-2.5 border border-slate-800 hover:border-indigo-500/40 transition-all"
          >
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="h-7 w-7 rounded-lg object-cover ring-1 ring-indigo-500/30"
            />
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-200 leading-tight truncate max-w-[110px]">
                {currentUser.name}
              </p>
              <p className="text-[9px] text-slate-400 capitalize truncate max-w-[110px]">
                {currentUser.role}
              </p>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};

