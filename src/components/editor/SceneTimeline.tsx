import React from 'react';
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Copy, 
  Volume2, 
  Music, 
  Subtitles, 
  Sparkles,
  Layers,
  HelpCircle,
  GripVertical
} from 'lucide-react';
import { VideoProject, Scene, SceneType } from '../../types.ts';

interface SceneTimelineProps {
  project: VideoProject;
  activeSceneIndex: number;
  onSelectScene: (index: number) => void;
  onUpdateScenes: (scenes: Scene[]) => void;
  onAddScene: (sceneType: SceneType) => void;
}

export const SceneTimeline: React.FC<SceneTimelineProps> = ({
  project,
  activeSceneIndex,
  onSelectScene,
  onUpdateScenes,
  onAddScene,
}) => {
  const scenes = project.scenes;

  // Move scene left
  const moveScene = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= scenes.length) return;

    const newScenes = [...scenes];
    const temp = newScenes[index];
    newScenes[index] = newScenes[targetIndex];
    newScenes[targetIndex] = temp;

    // Update order values
    newScenes.forEach((s, idx) => {
      s.order = idx + 1;
    });

    onUpdateScenes(newScenes);
    onSelectScene(targetIndex);
  };

  // Change scene duration
  const adjustDuration = (index: number, delta: number) => {
    const newScenes = [...scenes];
    const cur = newScenes[index].duration;
    newScenes[index] = {
      ...newScenes[index],
      duration: Math.max(4, Math.min(60, cur + delta)),
    };
    onUpdateScenes(newScenes);
  };

  // Delete scene
  const deleteScene = (index: number) => {
    if (scenes.length <= 1) return;
    const newScenes = scenes.filter((_, i) => i !== index).map((s, idx) => ({ ...s, order: idx + 1 }));
    onUpdateScenes(newScenes);
    onSelectScene(Math.max(0, index - 1));
  };

  // Duplicate scene
  const duplicateScene = (index: number) => {
    const target = scenes[index];
    const newScene: Scene = {
      ...target,
      id: `sc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: `${target.title} (Salinan)`,
      order: index + 2,
    };
    const newScenes = [...scenes.slice(0, index + 1), newScene, ...scenes.slice(index + 1)].map((s, idx) => ({
      ...s,
      order: idx + 1,
    }));
    onUpdateScenes(newScenes);
    onSelectScene(index + 1);
  };

  const getSceneBadge = (type: SceneType) => {
    switch (type) {
      case 'intro':
        return { label: 'Intro', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'learning_concept':
        return { label: 'Konsep', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'explanation':
        return { label: 'Penjelasan', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
      case 'example':
        return { label: 'Contoh', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'summary':
        return { label: 'Rangkuman', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'quiz':
        return { label: 'Kuis', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' };
      case 'outro':
        return { label: 'Outro', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' };
      default:
        return { label: 'Scene', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4 sm:p-5 space-y-4 shadow-xl">
      
      {/* Header & Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Timeline Multi-Track & Storyboard
          </h3>
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-800">
            {scenes.length} Scenes • Total{' '}
            {Math.floor(scenes.reduce((acc, s) => acc + s.duration, 0) / 60)}:
            {String(scenes.reduce((acc, s) => acc + s.duration, 0) % 60).padStart(2, '0')}
          </span>
        </div>

        {/* Add Scene Dropdown / Button */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onAddScene('explanation')}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600/30 px-3 py-1.5 text-xs font-bold text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600 hover:text-white transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Scene
          </button>
        </div>
      </div>

      {/* TRACK 1: Video Scene Cards Track */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3 text-indigo-400" /> Track Visual & Naskah
          </span>
          <span>Klik scene untuk mengedit</span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-3 pt-1">
          {scenes.map((scene, idx) => {
            const isSelected = idx === activeSceneIndex;
            const badge = getSceneBadge(scene.sceneType);

            return (
              <div
                key={scene.id}
                onClick={() => onSelectScene(idx)}
                className={`group relative shrink-0 w-52 cursor-pointer rounded-2xl border p-3 transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/20'
                    : 'border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                {/* Top Row: Scene Order & Badge */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-slate-300">
                      #{idx + 1}
                    </span>
                    <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-950 mb-2">
                    {scene.visualUrl ? (
                      <img
                        src={scene.visualUrl}
                        alt={scene.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-slate-900 text-[10px] text-slate-500">
                        Visual Gradient
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[9px] font-bold text-white">
                      {scene.duration}s
                    </div>
                  </div>

                  {/* Scene Title & Narration preview */}
                  <h4 className="text-xs font-bold text-slate-100 truncate">
                    {scene.overlayTitle || scene.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                    {scene.narration}
                  </p>
                </div>

                {/* Bottom Row: Duration Adjuster & Reorder buttons */}
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  
                  {/* Duration Controls */}
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        adjustDuration(idx, -1);
                      }}
                      className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
                      title="Kurangi 1 detik"
                    >
                      -
                    </button>
                    <span className="w-6 text-center">{scene.duration}s</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        adjustDuration(idx, 1);
                      }}
                      className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
                      title="Tambah 1 detik"
                    >
                      +
                    </button>
                  </div>

                  {/* Actions (Move, Duplicate, Delete) */}
                  <div className="flex items-center gap-1">
                    <button
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveScene(idx, 'left');
                      }}
                      className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30"
                      title="Geser ke kiri"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>

                    <button
                      disabled={idx === scenes.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveScene(idx, 'right');
                      }}
                      className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30"
                      title="Geser ke kanan"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateScene(idx);
                      }}
                      className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      title="Duplikat Scene"
                    >
                      <Copy className="h-3 w-3" />
                    </button>

                    {scenes.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteScene(idx);
                        }}
                        className="rounded p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400"
                        title="Hapus Scene"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* TRACK 2: Voiceover Track Strip */}
      <div className="rounded-2xl bg-slate-900/60 p-2.5 border border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-indigo-400 font-bold shrink-0">
          <Volume2 className="h-3.5 w-3.5" />
          <span>Track Suara Guru:</span>
        </div>
        <div className="flex-1 flex items-center gap-1 overflow-hidden h-5">
          {scenes.map((s, i) => (
            <div
              key={i}
              style={{ flex: s.duration }}
              className={`h-full rounded-md flex items-center justify-center text-[9px] font-semibold px-1 truncate transition-colors ${
                i === activeSceneIndex
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-950/40 text-indigo-300 border border-indigo-500/20'
              }`}
            >
              🎤 Narasi #{i + 1}
            </div>
          ))}
        </div>
        <span className="text-[11px] text-slate-400 shrink-0 font-medium">
          {project.voiceConfig?.voiceName || 'Siti (AI)'}
        </span>
      </div>

      {/* TRACK 3: Background Music Track Strip */}
      <div className="rounded-2xl bg-slate-900/60 p-2.5 border border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-sky-400 font-bold shrink-0">
          <Music className="h-3.5 w-3.5" />
          <span>Musik Latar:</span>
        </div>
        <div className="flex-1 rounded-md bg-sky-950/40 border border-sky-500/20 h-5 flex items-center px-3 text-[10px] font-medium text-sky-300">
          🎵 {project.audioTrack?.musicName || 'Acoustic Educational'} (Vol: {project.audioTrack?.volume || 30}%)
        </div>
      </div>

      {/* TRACK 4: Subtitles Track Strip */}
      <div className="rounded-2xl bg-slate-900/60 p-2.5 border border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-bold shrink-0">
          <Subtitles className="h-3.5 w-3.5" />
          <span>Subtitle Karaoke:</span>
        </div>
        <div className="flex-1 rounded-md bg-emerald-950/40 border border-emerald-500/20 h-5 flex items-center px-3 text-[10px] font-medium text-emerald-300">
          📝 Subtitle Otomatis Aktif • Posisi: {project.subtitleConfig?.position || 'bottom'} • Ukuran: {project.subtitleConfig?.fontSize || 'md'}
        </div>
      </div>

    </div>
  );
};
