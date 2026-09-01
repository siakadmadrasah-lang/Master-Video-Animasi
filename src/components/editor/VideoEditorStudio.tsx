import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Play, 
  Download, 
  Sparkles, 
  Layers, 
  Check, 
  Clock, 
  Share2, 
  Sliders,
  HelpCircle,
  Film
} from 'lucide-react';
import { VideoProject, Scene, SceneType } from '../../types.ts';
import { LiveVideoPlayer } from './LiveVideoPlayer.tsx';
import { SceneInspector } from './SceneInspector.tsx';
import { SceneTimeline } from './SceneTimeline.tsx';
import { ExportModal } from './ExportModal.tsx';

interface VideoEditorStudioProps {
  project: VideoProject;
  onBack: () => void;
  onSaveProject: (project: VideoProject) => Promise<void>;
  onOpenInteractivePlayer: (project: VideoProject) => void;
}

export const VideoEditorStudio: React.FC<VideoEditorStudioProps> = ({
  project: initialProject,
  onBack,
  onSaveProject,
  onOpenInteractivePlayer,
}) => {
  const [project, setProject] = useState<VideoProject>(initialProject);
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const activeScene = project.scenes[activeSceneIndex] || project.scenes[0];

  // Update a single scene
  const handleUpdateScene = (updatedScene: Scene) => {
    const newScenes = project.scenes.map((s, idx) =>
      idx === activeSceneIndex ? updatedScene : s
    );
    const totalSec = newScenes.reduce((acc, s) => acc + s.duration, 0);
    setProject({
      ...project,
      scenes: newScenes,
      totalDurationSeconds: totalSec,
      updatedAt: new Date().toISOString(),
    });
  };

  // Update whole scene array from timeline (reorder, add, remove)
  const handleUpdateScenes = (newScenes: Scene[]) => {
    const totalSec = newScenes.reduce((acc, s) => acc + s.duration, 0);
    setProject({
      ...project,
      scenes: newScenes,
      totalDurationSeconds: totalSec,
      updatedAt: new Date().toISOString(),
    });
  };

  // Add a new scene
  const handleAddScene = (sceneType: SceneType) => {
    const newScene: Scene = {
      id: `sc-${Date.now()}`,
      order: project.scenes.length + 1,
      title: `Scene #${project.scenes.length + 1}`,
      overlayTitle: 'Konsep Pembelajaran Baru',
      overlaySubtitle: 'Poin Kunci Materi',
      narration: 'Tambahkan naskah narasi penjelasan pengajar di sini...',
      bulletPoints: ['Poin materi 1', 'Poin materi 2'],
      visualPrompt: 'Educational graphic illustration',
      visualUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&auto=format&fit=crop&q=80',
      visualType: 'image',
      duration: 8,
      sceneType,
      animationType: 'zoom-in',
      transitionType: 'fade',
      keywords: ['Materi', 'Edukasi'],
    };

    const newScenes = [...project.scenes, newScene];
    handleUpdateScenes(newScenes);
    setActiveSceneIndex(newScenes.length - 1);
  };

  // Update project-wide settings (audio, subtitles, export watermark, title)
  const handleUpdateProjectSettings = (updated: VideoProject) => {
    setProject(updated);
  };

  // Save changes to server
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveProject(project);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save project:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Studio Header Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-950 p-4 sm:p-5 shadow-xl">
        
        {/* Left: Back button & Editable Title */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 transition-colors"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={project.title}
              onChange={(e) =>
                setProject({
                  ...project,
                  title: e.target.value,
                })
              }
              className="font-extrabold text-base sm:text-lg text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none transition-colors w-full truncate"
            />
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300">
                {project.subject} • {project.grade}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[11px]">
                <Clock className="h-3 w-3 text-sky-400" />
                {Math.floor((project.totalDurationSeconds || 60) / 60)}:
                {String((project.totalDurationSeconds || 60) % 60).padStart(2, '0')}
              </span>
              <span>•</span>
              <span className="text-[11px] text-slate-400">{project.visualStyle}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions (Save, Full Player, Export) */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-200 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all"
          >
            {saveSuccess ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300">Tersimpan</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 text-indigo-400" />
                <span>Simpan</span>
              </>
            )}
          </button>

          <button
            onClick={() => onOpenInteractivePlayer(project)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600/20 px-3.5 py-2 text-xs font-bold text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Player Siswa</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-indigo-700 active:scale-95 transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Ekspor Video</span>
          </button>

        </div>

      </div>

      {/* Main Studio Grid: Left Player Stage, Right Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Video Player (7 Columns) */}
        <div className="lg:col-span-7">
          <LiveVideoPlayer
            project={project}
            activeSceneIndex={activeSceneIndex}
            onSceneChange={(idx) => setActiveSceneIndex(idx)}
            onProjectUpdate={handleUpdateProjectSettings}
          />
        </div>

        {/* Scene Inspector (5 Columns) */}
        <div className="lg:col-span-5">
          <SceneInspector
            scene={activeScene}
            sceneIndex={activeSceneIndex}
            project={project}
            onUpdateScene={handleUpdateScene}
            onUpdateProjectSettings={handleUpdateProjectSettings}
          />
        </div>

      </div>

      {/* Bottom: Multi-Track Timeline */}
      <div>
        <SceneTimeline
          project={project}
          activeSceneIndex={activeSceneIndex}
          onSelectScene={(idx) => setActiveSceneIndex(idx)}
          onUpdateScenes={handleUpdateScenes}
          onAddScene={handleAddScene}
        />
      </div>

      {/* Export & Render Modal */}
      {isExportModalOpen && (
        <ExportModal
          project={project}
          onClose={() => setIsExportModalOpen(false)}
          onUpdateProject={(updated) => {
            setProject(updated);
            onSaveProject(updated);
          }}
        />
      )}

    </div>
  );
};
