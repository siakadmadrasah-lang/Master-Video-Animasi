import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { LandingHero } from './components/LandingHero.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { VideoGeneratorWizard } from './components/VideoGeneratorWizard.tsx';
import { VideoEditorStudio } from './components/editor/VideoEditorStudio.tsx';
import { VideoLibraryView } from './components/VideoLibraryView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { InteractivePlayerModal } from './components/InteractivePlayerModal.tsx';
import { ExportModal } from './components/editor/ExportModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { AdminLoginModal } from './components/AdminLoginModal.tsx';
import { AdminDashboardView } from './components/AdminDashboardView.tsx';
import { StickyFooter } from './components/StickyFooter.tsx';
import { LoginGateView } from './components/LoginGateView.tsx';

import { VideoProject, UserProfile, SubjectCategory, GradeLevel, VisualStyle, AdminUser, HeroConfig, HeaderConfig } from './types.ts';
import { SAMPLE_PROJECTS } from './data/sampleProjects.ts';
import { DEFAULT_HERO_CONFIG } from './data/defaultHeroConfig.ts';
import { DEFAULT_HEADER_CONFIG } from './data/defaultHeaderConfig.ts';
import { generateAndDownloadPleskZip } from './utils/pleskExporter.ts';

export function App() {
  const [projects, setProjects] = useState<VideoProject[]>(SAMPLE_PROJECTS);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [editingProject, setEditingProject] = useState<VideoProject | null>(null);
  const [playerProject, setPlayerProject] = useState<VideoProject | null>(null);
  const [exportModalProject, setExportModalProject] = useState<VideoProject | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // App Access Authentication Gate (Enabled by default to show working application directly)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const loggedOut = localStorage.getItem('eduvideo_auth_logged_out');
      if (loggedOut === 'true') return false;
      return true;
    } catch {
      return true;
    }
  });

  // Admin & Header & Hero State
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem('eduvideo_admin_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>(() => {
    try {
      const saved = localStorage.getItem('eduvideo_header_config');
      return saved ? JSON.parse(saved) : DEFAULT_HEADER_CONFIG;
    } catch {
      return DEFAULT_HEADER_CONFIG;
    }
  });

  const [heroConfig, setHeroConfig] = useState<HeroConfig>(() => {
    try {
      const saved = localStorage.getItem('eduvideo_hero_config');
      return saved ? JSON.parse(saved) : DEFAULT_HERO_CONFIG;
    } catch {
      return DEFAULT_HERO_CONFIG;
    }
  });

  const [generatorTemplate, setGeneratorTemplate] = useState<{
    title: string;
    subject: SubjectCategory;
    grade: GradeLevel;
    material: string;
    style: VisualStyle;
  } | null>(null);

  // Default educator profile
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('eduvideo_current_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: 'usr-jaenal',
      name: 'Dev Jaenal Maskun',
      email: 'jaenalmaskun@gmail.com',
      avatarUrl: '/assets/logo-badge.jpg',
      role: 'kreator',
      institution: "MI Ma'arif NU 2 Sanggreman",
      defaultSubject: 'Fikih',
      defaultGrade: 'Kelas 1 MI',
    };
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch initial projects and API health on mount
  useEffect(() => {
    fetch('/api/projects')
      .then((res) => {
        if (res.ok) return res.json();
        return SAMPLE_PROJECTS;
      })
      .then((data: VideoProject[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setProjects(data);
        }
      })
      .catch((err) => {
        console.warn('Using local sample data:', err);
      });

    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasApiKey !== undefined) {
          setHasApiKey(data.hasApiKey);
        }
      })
      .catch(() => {});
  }, []);

  // Login Gate handler
  const handleLoginSuccess = (user: UserProfile, admin?: AdminUser) => {
    setCurrentUser(user);
    if (admin) setAdminUser(admin);
    setIsAuthenticated(true);
    showToast(`Selamat datang ${user.name}! Akses Studio Edukasi Aktif.`);
  };

  // Logout handler
  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminUser(null);
    try {
      localStorage.removeItem('eduvideo_auth_session');
      localStorage.removeItem('eduvideo_admin_session');
    } catch {}
    showToast('Anda telah keluar dari aplikasi');
  };

  // Handlers
  const handleAdminLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
    try {
      localStorage.setItem('eduvideo_admin_session', JSON.stringify(user));
    } catch {}
    setActiveTab('admin');
    showToast(`Selamat datang Administrator ${user.name}!`);
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    try {
      localStorage.removeItem('eduvideo_admin_session');
    } catch {}
    if (activeTab === 'admin') {
      setActiveTab('dashboard');
    }
    showToast('Berhasil logout dari Panel Admin');
  };

  const handleSaveHeaderConfig = (newConfig: HeaderConfig) => {
    setHeaderConfig(newConfig);
    try {
      localStorage.setItem('eduvideo_header_config', JSON.stringify(newConfig));
    } catch {}
    showToast('Tampilan Header & Navbar berhasil disimpan & diterapkan!');
  };

  const handleSaveHeroConfig = (newConfig: HeroConfig) => {
    setHeroConfig(newConfig);
    try {
      localStorage.setItem('eduvideo_hero_config', JSON.stringify(newConfig));
    } catch {}
    showToast('Tampilan Hero berhasil disimpan & diterapkan!');
  };

  const handleQuickPleskExport = async () => {
    showToast('Mempersiapkan arsip ZIP Hosting Plesk...');
    try {
      await generateAndDownloadPleskZip({
        domainName: 'eduvideo-madrasah.sch.id',
        databaseName: 'eduvideo_db',
        includeNodeServer: true,
        includePhpApache: true,
        includeIisWebConfig: true,
      });
      showToast('File ZIP Plesk siap di-upload ke File Manager Hosting!');
    } catch (err) {
      console.error(err);
      showToast('Gagal membuat ZIP Plesk. Silakan coba lagi.');
    }
  };

  const handleOpenEditor = (project: VideoProject) => {
    setEditingProject(project);
    setActiveTab('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartCreateWithTemplate = (template: {
    title: string;
    subject: SubjectCategory;
    grade: GradeLevel;
    material: string;
    style: VisualStyle;
  }) => {
    setGeneratorTemplate(template);
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateNew = () => {
    setGeneratorTemplate(null);
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerationComplete = (newProject: VideoProject) => {
    setProjects((prev) => [newProject, ...prev]);
    setEditingProject(newProject);
    setActiveTab('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveProject = async (updatedProject: VideoProject) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
    if (editingProject?.id === updatedProject.id) {
      setEditingProject(updatedProject);
    }

    try {
      await fetch(`/api/projects/${updatedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProject),
      });
    } catch (err) {
      console.error('Failed to sync save with backend:', err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (editingProject?.id === id) {
      setEditingProject(null);
      setActiveTab('dashboard');
    }

    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete on server:', err);
    }
  };

  const handleDuplicateProject = async (project: VideoProject) => {
    try {
      const resp = await fetch(`/api/projects/${project.id}/duplicate`, {
        method: 'POST',
      });
      if (resp.ok) {
        const duplicated: VideoProject = await resp.json();
        setProjects((prev) => [duplicated, ...prev]);
        showToast(`Video "${project.title}" berhasil digandakan.`);
      } else {
        const localDup: VideoProject = {
          ...project,
          id: `proj-${Date.now()}`,
          title: `${project.title} (Salinan)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProjects((prev) => [localDup, ...prev]);
        showToast(`Video "${project.title}" berhasil digandakan.`);
      }
    } catch (err) {
      const localDup: VideoProject = {
        ...project,
        id: `proj-${Date.now()}`,
        title: `${project.title} (Salinan)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProjects((prev) => [localDup, ...prev]);
      showToast(`Video "${project.title}" berhasil digandakan.`);
    }
  };

  if (!isAuthenticated) {
    return <LoginGateView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-2xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-2xl shadow-indigo-500/40 border border-indigo-400/40 flex items-center gap-2 animate-bounce">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Main Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'editor') setEditingProject(null);
        }}
        currentUser={currentUser}
        adminUser={adminUser}
        headerConfig={headerConfig}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenAdminLogin={() => {
          if (adminUser) {
            setActiveTab('admin');
          } else {
            setIsAdminLoginOpen(true);
          }
        }}
        hasApiKey={hasApiKey}
        onQuickCreate={handleCreateNew}
      />

      {/* Main App Layout with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16">
        
        {/* Sidebar Navigation */}
        {activeTab !== 'editor' && (
          <Sidebar
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              if (tab !== 'editor') setEditingProject(null);
            }}
            recentProjects={projects}
            onSelectProject={(p) => handleOpenEditor(p)}
            adminUser={adminUser}
            onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
          />
        )}

        {/* Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <LandingHero
                onStartCreate={handleCreateNew}
                onUseTemplate={handleStartCreateWithTemplate}
                totalVideosCount={projects.length}
                heroConfig={heroConfig}
              />

              <DashboardView
                projects={projects}
                onCreateNew={handleCreateNew}
                onOpenEditor={handleOpenEditor}
                onOpenPlayer={(p) => setPlayerProject(p)}
                onDeleteProject={handleDeleteProject}
                onDuplicateProject={handleDuplicateProject}
                onOpenExportModal={(p) => setExportModalProject(p)}
              />
            </div>
          )}

          {/* CREATE VIDEO WIZARD TAB */}
          {activeTab === 'create' && (
            <VideoGeneratorWizard
              onCancel={() => setActiveTab('dashboard')}
              onGenerationComplete={handleGenerationComplete}
              initialTemplate={generatorTemplate}
            />
          )}

          {/* TIMELINE STUDIO EDITOR TAB */}
          {activeTab === 'editor' && (
            <VideoEditorStudio
              project={editingProject || projects[0]}
              onBack={() => {
                setEditingProject(null);
                setActiveTab('dashboard');
              }}
              onSaveProject={handleSaveProject}
              onOpenInteractivePlayer={(p) => setPlayerProject(p)}
            />
          )}

          {/* VIDEO GALLERY / LIBRARY TAB */}
          {activeTab === 'videos' && (
            <VideoLibraryView
              projects={projects}
              onCreateNew={handleCreateNew}
              onOpenEditor={handleOpenEditor}
              onOpenPlayer={(p) => setPlayerProject(p)}
              onDeleteProject={handleDeleteProject}
              onOpenExportModal={(p) => setExportModalProject(p)}
            />
          )}

          {/* ADMIN DASHBOARD TAB */}
          {activeTab === 'admin' && (
            adminUser ? (
              <AdminDashboardView
                adminUser={adminUser}
                onLogoutAdmin={handleAdminLogout}
                headerConfig={headerConfig}
                onUpdateHeaderConfig={handleSaveHeaderConfig}
                heroConfig={heroConfig}
                onUpdateHeroConfig={handleSaveHeroConfig}
                projects={projects}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                hasApiKey={hasApiKey}
              />
            ) : (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-center max-w-xl mx-auto space-y-4">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400">
                  🔒
                </div>
                <h2 className="text-xl font-bold text-white">
                  Otentikasi Administrator Diperlukan
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Silakan login dengan akun Administrator untuk mengakses fitur Pengaturan Hero, Manajemen Template Pembelajaran MI, dan Ekspor Paket Plesk Hosting.
                </p>
                <button
                  onClick={() => setIsAdminLoginOpen(true)}
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20"
                >
                  Buka Dialog Login Admin
                </button>
              </div>
            )
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              onUpdateUser={(u) => setCurrentUser(u)}
              hasApiKey={hasApiKey}
              onLogout={handleLogout}
            />
          )}

        </main>

      </div>

      {/* Iconic Modern Sticky Footer (Only shown on Overview / Gallery to avoid blocking inputs & forms) */}
      {(activeTab === 'dashboard' || activeTab === 'videos') && !isAdminLoginOpen && !playerProject && !exportModalProject && !isAuthModalOpen && (
        <StickyFooter
          onQuickCreate={handleCreateNew}
          onOpenAdminLogin={() => {
            if (adminUser) {
              setActiveTab('admin');
            } else {
              setIsAdminLoginOpen(true);
            }
          }}
          adminUser={adminUser}
          totalProjects={projects.length}
          hasApiKey={hasApiKey}
        />
      )}

      {/* Admin Login Modal */}
      {isAdminLoginOpen && (
        <AdminLoginModal
          isOpen={isAdminLoginOpen}
          onClose={() => setIsAdminLoginOpen(false)}
          onLoginSuccess={handleAdminLoginSuccess}
        />
      )}

      {/* Interactive Player Modal */}
      {playerProject && (
        <InteractivePlayerModal
          project={playerProject}
          onClose={() => setPlayerProject(null)}
          onOpenExportModal={(p) => {
            setPlayerProject(null);
            setExportModalProject(p);
          }}
        />
      )}

      {/* Standalone Export Modal */}
      {exportModalProject && (
        <ExportModal
          project={exportModalProject}
          onClose={() => setExportModalProject(null)}
          onUpdateProject={(updated) => handleSaveProject(updated)}
        />
      )}

      {/* Profile Switch Modal */}
      {isAuthModalOpen && (
        <AuthModal
          currentUser={currentUser}
          onSelectUser={(u) => setCurrentUser(u)}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

    </div>
  );
}

export default App;

