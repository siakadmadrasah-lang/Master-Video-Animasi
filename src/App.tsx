import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Project, Scene, SubtitleStyle, BgmTrackPreset } from './types';
import { INITIAL_DEMO_PROJECT, createBlankProject } from './data/sampleProjects';
import { Header } from './components/Header';
import { VideoPlayerCanvas } from './components/VideoPlayerCanvas';
import { TimelineEditor } from './components/TimelineEditor';
import { SceneInspector } from './components/SceneInspector';
import { AIWizardModal } from './components/AIWizardModal';
import { TemplatesModal } from './components/TemplatesModal';
import { ExportModal } from './components/ExportModal';
import { MediaLibraryModal } from './components/MediaLibraryModal';
import { videoAudioMixer } from './services/videoAudioMixer';
import { videoRenderer } from './services/videoRenderer';
import { generateAIStoryboard, createProjectFromStoryboard } from './services/geminiService';

export default function App() {
  const [project, setProject] = useState<Project>(() => {
    const saved = localStorage.getItem('cineai_project');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_DEMO_PROJECT;
  });

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isAIWizardOpen, setIsAIWizardOpen] = useState<boolean>(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState<boolean>(false);

  const lastTriggeredSceneRef = useRef<number>(-1);

  // Toast notifier
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Persist project changes
  useEffect(() => {
    localStorage.setItem('cineai_project', JSON.stringify(project));
  }, [project]);

  // Audio syncer when time advances
  useEffect(() => {
    if (!isPlaying) return;

    const sceneInfo = videoRenderer.getActiveSceneAtTime(project, currentTime);
    if (!sceneInfo) return;

    if (sceneInfo.currentIndex !== lastTriggeredSceneRef.current) {
      lastTriggeredSceneRef.current = sceneInfo.currentIndex;
      setSelectedSceneIndex(sceneInfo.currentIndex);

      // Trigger SFX cue
      if (sceneInfo.currentScene.soundEffect && sceneInfo.currentScene.soundEffect !== 'none') {
        videoAudioMixer.playSoundEffect(sceneInfo.currentScene.soundEffect);
      }

      // Trigger Voiceover narration
      if (sceneInfo.currentScene.voiceover) {
        videoAudioMixer.playVoiceover(sceneInfo.currentScene.audioBase64, sceneInfo.currentScene.voiceover);
      }
    }
  }, [isPlaying, currentTime, project]);

  // Toggle Play / Pause
  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (next) {
        videoAudioMixer.startBgm();
        const sceneInfo = videoRenderer.getActiveSceneAtTime(project, currentTime);
        if (sceneInfo) {
          lastTriggeredSceneRef.current = sceneInfo.currentIndex;
          if (sceneInfo.currentScene.voiceover) {
            videoAudioMixer.playVoiceover(sceneInfo.currentScene.audioBase64, sceneInfo.currentScene.voiceover);
          }
        }
      } else {
        videoAudioMixer.stopAll();
      }
      return next;
    });
  }, [project, currentTime]);

  // Seek time handler
  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
    lastTriggeredSceneRef.current = -1;
  }, []);

  // Toggle Mute
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      videoAudioMixer.setMasterMuted(next);
      return next;
    });
  }, []);

  // Update specific scene
  const handleUpdateScene = useCallback((sceneIndex: number, updater: (prev: Scene) => Scene) => {
    setProject((prev) => {
      const newScenes = [...prev.scenes];
      if (newScenes[sceneIndex]) {
        newScenes[sceneIndex] = updater(newScenes[sceneIndex]);
      }
      return {
        ...prev,
        scenes: newScenes,
        updatedAt: Date.now(),
      };
    });
  }, []);

  // Update scene title directly from HUD or Timeline
  const handleUpdateSceneTitle = useCallback((sceneIndex: number, newTitle: string) => {
    handleUpdateScene(sceneIndex, (prev) => ({
      ...prev,
      title: newTitle,
    }));
  }, [handleUpdateScene]);

  // Create new blank project
  const handleNewBlankProject = useCallback(() => {
    const blank = createBlankProject();
    setProject(blank);
    setCurrentTime(0);
    setSelectedSceneIndex(0);
    setIsPlaying(false);
    videoAudioMixer.stopAll();
    showToast('Proyek baru kosong siap dibuat!');
  }, []);

  // Reset to initial demo project
  const handleResetDemo = useCallback(() => {
    setProject(INITIAL_DEMO_PROJECT);
    setCurrentTime(0);
    setSelectedSceneIndex(0);
    setIsPlaying(false);
    videoAudioMixer.stopAll();
    showToast('Proyek demo Jakarta 2050 dimuat!');
  }, []);

  // Take Canvas Snapshot keyframe
  const handleTakeSnapshot = useCallback(() => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1920;
    tempCanvas.height = 1080;
    videoRenderer.renderFrame(tempCanvas, project, currentTime);

    const link = document.createElement('a');
    link.download = `cineai-snapshot-${Date.now()}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
    showToast('Snapshot frame berhasil disimpan!');
  }, [project, currentTime]);

  // Apply template directly
  const handleApplyTemplate = async (templatePrompt: string, style: string, aspectRatio: any) => {
    try {
      setIsAIWizardOpen(true);
    } catch (e) {}
  };

  // Keyboard Shortcuts (Space for Play/Pause, Left/Right arrows for seek)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSeek(Math.max(0, currentTime - 1));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        const totalDur = videoRenderer.getTimelineInfo(project).totalDuration;
        handleSeek(Math.min(totalDur, currentTime + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleSeek, currentTime, project]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-cyan-500/90 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl shadow-cyan-500/30 flex items-center gap-2 border border-white/20 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Studio Header */}
      <Header
        project={project}
        onUpdateProject={setProject}
        onOpenAIWizard={() => setIsAIWizardOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenMediaLibrary={() => setIsMediaLibraryOpen(true)}
        onTakeSnapshot={handleTakeSnapshot}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onNewBlankProject={handleNewBlankProject}
        onResetDemo={handleResetDemo}
        isInspectorOpen={isInspectorOpen}
        onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
      />

      {/* Main Workspace (Canvas Player + Scene Inspector Sidebar) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Central Video Player Canvas */}
        <VideoPlayerCanvas
          project={project}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onTimeUpdate={setCurrentTime}
          onTogglePlay={handleTogglePlay}
          onSeek={handleSeek}
          playbackSpeed={playbackSpeed}
          onChangeSpeed={setPlaybackSpeed}
          onUpdateSubtitleStyle={(style: SubtitleStyle) =>
            setProject((prev) => ({ ...prev, subtitleStyle: style }))
          }
          selectedSceneIndex={selectedSceneIndex}
          onSelectScene={setSelectedSceneIndex}
          onUpdateSceneTitle={handleUpdateSceneTitle}
          isInspectorOpen={isInspectorOpen}
          onOpenInspector={() => setIsInspectorOpen(true)}
        />

        {/* Right Inspector Panel */}
        {isInspectorOpen && (
          <SceneInspector
            project={project}
            selectedSceneIndex={selectedSceneIndex}
            onUpdateScene={handleUpdateScene}
            onOpenMediaLibrary={() => setIsMediaLibraryOpen(true)}
            onClose={() => setIsInspectorOpen(false)}
          />
        )}
      </div>

      {/* Bottom Multi-Track Timeline */}
      <TimelineEditor
        project={project}
        currentTime={currentTime}
        onSeek={handleSeek}
        selectedSceneIndex={selectedSceneIndex}
        onSelectScene={setSelectedSceneIndex}
        onUpdateProject={setProject}
        onOpenAIWizard={() => setIsAIWizardOpen(true)}
      />

      {/* Modals */}
      <AIWizardModal
        isOpen={isAIWizardOpen}
        onClose={() => setIsAIWizardOpen(false)}
        onApplyProject={(newProj) => {
          setProject(newProj);
          setCurrentTime(0);
          setSelectedSceneIndex(0);
          showToast('Video sinematik AI berhasil dibuat!');
        }}
      />

      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onApplyTemplate={handleApplyTemplate}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        project={project}
      />

      <MediaLibraryModal
        isOpen={isMediaLibraryOpen}
        onClose={() => setIsMediaLibraryOpen(false)}
        onSelectMedia={(url: string, title: string) => {
          handleUpdateScene(selectedSceneIndex, (prev) => ({
            ...prev,
            mediaUrl: url,
            visualDescription: title,
          }));
        }}
        onSelectBgm={(preset: BgmTrackPreset) => {
          setProject((prev) => ({
            ...prev,
            bgmTrack: {
              ...prev.bgmTrack,
              name: preset.title,
              genre: preset.genre,
              mood: preset.mood,
            },
          }));
          videoAudioMixer.setBgmMood(preset.synthMood);
        }}
      />
    </div>
  );
}

