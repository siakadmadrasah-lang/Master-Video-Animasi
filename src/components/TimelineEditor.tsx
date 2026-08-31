import React, { useRef, useState } from 'react';
import { Project, Scene, TransitionType } from '../types';
import { videoRenderer } from '../services/videoRenderer';
import {
  Plus,
  Trash2,
  Copy,
  Wand2,
  Volume2,
  Type,
  Film,
  Zap,
  Flame,
  Binary,
  ZoomIn,
  Sparkles,
  MoveHorizontal,
  ChevronLeft,
  ChevronRight,
  Music,
  Edit3,
  Check,
} from 'lucide-react';

interface TimelineEditorProps {
  project: Project;
  currentTime: number;
  onSeek: (time: number) => void;
  selectedSceneIndex: number;
  onSelectScene: (index: number) => void;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
  onOpenAIWizard: () => void;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  project,
  currentTime,
  onSeek,
  selectedSceneIndex,
  onSelectScene,
  onUpdateProject,
  onOpenAIWizard,
}) => {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(45); // pixels per second
  const [activeTransitionMenuIndex, setActiveTransitionMenuIndex] = useState<number | null>(null);
  const [editingSceneIdx, setEditingSceneIdx] = useState<number | null>(null);
  const [editTitleText, setEditTitleText] = useState<string>('');

  const timelineInfo = videoRenderer.getTimelineInfo(project);
  const totalDuration = timelineInfo.totalDuration;

  // Handle timeline ruler click to seek
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + timelineRef.current.scrollLeft;
    const clickedTime = Math.max(0, Math.min(totalDuration, clickX / zoomLevel));
    onSeek(clickedTime);
  };

  // Add new blank or AI scene
  const handleAddScene = () => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      title: `Scene ${project.scenes.length + 1}`,
      visualDescription: 'Pemandangan visual baru dengan pencahayaan sinematik.',
      mediaUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1920&q=80',
      mediaType: 'image',
      voiceover: 'Momen berikutnya membawa transformasi baru yang menakjubkan.',
      subtitle: 'Transformasi & Langkah Baru',
      duration: 4.0,
      cameraMotion: 'zoom_in',
      transition: 'cross_dissolve',
      transitionDuration: 0.6,
      colorGrade: 'teal_orange',
      effectOverlay: 'film_grain',
      soundEffect: 'whoosh',
    };

    onUpdateProject((prev) => ({
      ...prev,
      scenes: [...prev.scenes, newScene],
      updatedAt: Date.now(),
    }));
    onSelectScene(project.scenes.length);
  };

  // Duplicate scene
  const handleDuplicateScene = (index: number) => {
    const sceneToDup = project.scenes[index];
    if (!sceneToDup) return;
    const duplicated: Scene = {
      ...sceneToDup,
      id: `scene-${Date.now()}`,
      title: `${sceneToDup.title} (Copy)`,
    };

    onUpdateProject((prev) => {
      const newScenes = [...prev.scenes];
      newScenes.splice(index + 1, 0, duplicated);
      return {
        ...prev,
        scenes: newScenes,
        updatedAt: Date.now(),
      };
    });
    onSelectScene(index + 1);
  };

  // Delete scene
  const handleDeleteScene = (index: number) => {
    if (project.scenes.length <= 1) return;
    onUpdateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.filter((_, i) => i !== index),
      updatedAt: Date.now(),
    }));
    onSelectScene(Math.max(0, index - 1));
  };

  // Move scene left/right
  const handleMoveScene = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= project.scenes.length) return;

    onUpdateProject((prev) => {
      const newScenes = [...prev.scenes];
      const temp = newScenes[index];
      newScenes[index] = newScenes[targetIndex];
      newScenes[targetIndex] = temp;
      return {
        ...prev,
        scenes: newScenes,
        updatedAt: Date.now(),
      };
    });
    onSelectScene(targetIndex);
  };

  // Update transition type
  const handleSetTransition = (sceneIndex: number, transition: TransitionType) => {
    onUpdateProject((prev) => {
      const newScenes = [...prev.scenes];
      if (newScenes[sceneIndex]) {
        newScenes[sceneIndex] = {
          ...newScenes[sceneIndex],
          transition,
        };
      }
      return { ...prev, scenes: newScenes, updatedAt: Date.now() };
    });
    setActiveTransitionMenuIndex(null);
  };

  const transitionsList: Array<{ id: TransitionType; label: string; icon: React.ReactNode }> = [
    { id: 'whip_pan', label: 'Whip Pan (Fast Swipe)', icon: <Zap className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'film_burn', label: 'Film Burn (Light Leak)', icon: <Flame className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'glitch', label: 'Cyber Glitch (RGB Split)', icon: <Binary className="w-3.5 h-3.5 text-pink-400" /> },
    { id: 'zoom_rush', label: 'Zoom Rush (Inertia Zoom)', icon: <ZoomIn className="w-3.5 h-3.5 text-purple-400" /> },
    { id: 'cross_dissolve', label: 'Cross Dissolve (Smooth)', icon: <Sparkles className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'flash_white', label: 'White Strobe Flash', icon: <Sparkles className="w-3.5 h-3.5 text-white" /> },
    { id: 'fade_black', label: 'Fade to Black', icon: <Film className="w-3.5 h-3.5 text-slate-400" /> },
  ];

  return (
    <div className="h-64 border-t border-slate-800 bg-slate-950/95 flex flex-col select-none z-20">
      {/* Timeline Controls Header */}
      <div className="h-10 px-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-cyan-400" />
            Timeline Multi-Track
          </span>

          <span className="text-[11px] text-slate-400 px-2 py-0.5 bg-slate-800 rounded font-mono">
            {project.scenes.length} Scenes • {totalDuration.toFixed(1)}s Total
          </span>
        </div>

        {/* Zoom & Fast Actions */}
        <div className="flex items-center gap-3">
          {/* Zoom Slider */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MoveHorizontal className="w-3.5 h-3.5" />
            <input
              type="range"
              min={25}
              max={90}
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseInt(e.target.value))}
              className="w-20 h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
              title="Zoom Skala Timeline"
            />
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Add Scene Button */}
          <button
            onClick={handleAddScene}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tambah Scene</span>
          </button>
        </div>
      </div>

      {/* Main Multi-Track Scroll Area */}
      <div
        ref={timelineRef}
        onClick={handleTimelineClick}
        className="flex-1 overflow-x-auto overflow-y-hidden relative bg-slate-950 p-2 scrollbar-thin scrollbar-thumb-slate-800 cursor-pointer"
      >
        <div
          style={{ width: `${Math.max(800, totalDuration * zoomLevel + 160)}px` }}
          className="relative min-h-full flex flex-col gap-2"
        >
          {/* Ruler Seconds Marks */}
          <div className="h-5 border-b border-slate-800/80 relative flex items-end">
            {Array.from({ length: Math.ceil(totalDuration) + 2 }).map((_, sec) => (
              <div
                key={sec}
                style={{ left: `${sec * zoomLevel}px` }}
                className="absolute bottom-0 text-[9px] font-mono text-slate-400 flex flex-col items-center pointer-events-none"
              >
                <div className="h-1.5 w-px bg-slate-700" />
                <span>{sec}s</span>
              </div>
            ))}
          </div>

          {/* Playhead Vertical Line */}
          <div
            style={{ left: `${currentTime * zoomLevel}px` }}
            className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-40 pointer-events-none shadow-[0_0_8px_rgba(34,211,238,0.8)]"
          >
            <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full -ml-1 -top-1 absolute shadow-md" />
          </div>

          {/* TRACK 1: Video / Scene Track */}
          <div className="h-24 flex items-center relative">
            <div className="absolute left-0 top-0 bottom-0 flex items-center">
              {timelineInfo.scenes.map((s, idx) => {
                const widthPx = s.duration * zoomLevel;
                const isSelected = selectedSceneIndex === idx;

                return (
                  <React.Fragment key={s.scene.id}>
                    {/* Scene Block */}
                    <div
                      style={{ width: `${Math.max(70, widthPx - 16)}px` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectScene(idx);
                        onSeek(s.startTime);
                      }}
                      className={`h-22 rounded-lg border relative overflow-hidden flex flex-col justify-between p-1.5 transition-all group ${
                        isSelected
                          ? 'border-cyan-400 ring-2 ring-cyan-500/40 bg-slate-900/90 shadow-lg shadow-cyan-500/20'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      {/* Background image preview thumbnail */}
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-25 group-hover:opacity-40 transition-all pointer-events-none"
                        style={{ backgroundImage: `url(${s.scene.mediaUrl})` }}
                      />

                      {/* Header in scene clip with inline title edit */}
                      <div className="relative z-10 flex items-center justify-between gap-1">
                        {editingSceneIdx === idx ? (
                          <div
                            className="flex items-center gap-1 bg-slate-950/95 border border-cyan-400 rounded px-1 py-0.5 w-full z-30"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={editTitleText}
                              onChange={(e) => setEditTitleText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (editTitleText.trim()) {
                                    onUpdateProject((p) => {
                                      const scs = [...p.scenes];
                                      if (scs[idx]) scs[idx] = { ...scs[idx], title: editTitleText.trim() };
                                      return { ...p, scenes: scs, updatedAt: Date.now() };
                                    });
                                  }
                                  setEditingSceneIdx(null);
                                }
                                if (e.key === 'Escape') setEditingSceneIdx(null);
                              }}
                              autoFocus
                              className="text-[10px] font-bold text-white bg-transparent outline-none w-full"
                            />
                            <button
                              onClick={() => {
                                if (editTitleText.trim()) {
                                  onUpdateProject((p) => {
                                    const scs = [...p.scenes];
                                    if (scs[idx]) scs[idx] = { ...scs[idx], title: editTitleText.trim() };
                                    return { ...p, scenes: scs, updatedAt: Date.now() };
                                  });
                                }
                                setEditingSceneIdx(null);
                              }}
                              className="p-0.5 text-cyan-400 hover:text-cyan-300"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSceneIdx(idx);
                              setEditTitleText(s.scene.title);
                              onSelectScene(idx);
                            }}
                            className="group/title flex items-center gap-1 cursor-pointer max-w-[110px]"
                            title="Klik untuk ubah judul scene"
                          >
                            <span className="text-[10px] font-bold text-white truncate group-hover/title:text-cyan-300 transition-colors">
                              {idx + 1}. {s.scene.title}
                            </span>
                            <Edit3 className="w-2.5 h-2.5 text-slate-400 group-hover/title:text-cyan-400 opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0" />
                          </div>
                        )}
                        <span className="text-[9px] font-mono font-semibold px-1 rounded bg-black/60 text-cyan-300 shrink-0">
                          {s.duration.toFixed(1)}s
                        </span>
                      </div>

                      {/* Motion and Color Badges */}
                      <div className="relative z-10 flex items-center gap-1 flex-wrap">
                        <span className="text-[8px] font-medium px-1 py-0.2 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/20 capitalize">
                          {s.scene.cameraMotion.replace('_', ' ')}
                        </span>
                        <span className="text-[8px] font-medium px-1 py-0.2 rounded bg-rose-500/30 text-rose-300 border border-rose-500/20 capitalize">
                          {s.scene.colorGrade.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Scene quick actions on hover */}
                      <div className="relative z-10 flex items-center justify-between pt-1 border-t border-white/5">
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveScene(idx, 'left');
                            }}
                            disabled={idx === 0}
                            className="p-0.5 rounded text-slate-400 hover:text-white disabled:opacity-20"
                            title="Pindah ke kiri"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveScene(idx, 'right');
                            }}
                            disabled={idx === project.scenes.length - 1}
                            className="p-0.5 rounded text-slate-400 hover:text-white disabled:opacity-20"
                            title="Pindah ke kanan"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateScene(idx);
                            }}
                            className="p-0.5 rounded text-slate-400 hover:text-cyan-300"
                            title="Duplikat Scene"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteScene(idx);
                            }}
                            disabled={project.scenes.length <= 1}
                            className="p-0.5 rounded text-slate-400 hover:text-rose-400 disabled:opacity-20"
                            title="Hapus Scene"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Transition Connector Button between scenes */}
                    {idx < timelineInfo.scenes.length - 1 && (
                      <div className="relative flex items-center justify-center px-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTransitionMenuIndex(activeTransitionMenuIndex === idx ? null : idx);
                          }}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all z-20 shadow-md ${
                            s.scene.transition === 'whip_pan'
                              ? 'bg-cyan-500 text-black border-cyan-400'
                              : s.scene.transition === 'film_burn'
                              ? 'bg-amber-500 text-black border-amber-400'
                              : s.scene.transition === 'glitch'
                              ? 'bg-pink-500 text-white border-pink-400'
                              : s.scene.transition === 'zoom_rush'
                              ? 'bg-purple-500 text-white border-purple-400'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-cyan-400 hover:text-cyan-300'
                          }`}
                          title={`Transisi: ${s.scene.transition} (Klik untuk ganti)`}
                        >
                          <Zap className="w-3 h-3" />
                        </button>

                        {/* Transition Quick Picker Popup */}
                        {activeTransitionMenuIndex === idx && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-slate-900 border border-slate-800 rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-1"
                          >
                            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Pilih Transisi AI
                            </div>
                            {transitionsList.map((t) => (
                              <button
                                key={t.id}
                                onClick={() => handleSetTransition(idx, t.id)}
                                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-all ${
                                  s.scene.transition === t.id
                                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                                    : 'text-slate-300 hover:bg-slate-800'
                                }`}
                              >
                                {t.icon}
                                <span className="truncate">{t.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* TRACK 2: Audio & Voiceover Track */}
          <div className="h-8 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center px-3 relative overflow-hidden">
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 z-10">
              <Music className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-slate-200">{project.bgmTrack.name}</span>
              <span className="text-[10px] text-slate-500">• Voiceover AI Synced</span>
            </div>

            {/* Fake waveform bars */}
            <div className="absolute inset-0 flex items-center justify-around opacity-25 px-2 pointer-events-none">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  style={{ height: `${20 + Math.sin(i * 0.5) * 60}%` }}
                  className="w-1 bg-amber-400 rounded-full"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
