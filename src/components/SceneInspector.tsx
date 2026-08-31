import React, { useState } from 'react';
import {
  CameraMotion,
  ColorGradePreset,
  EffectOverlay,
  Project,
  Scene,
  SoundEffectType,
  TransitionType,
} from '../types';
import { generateSceneVisual, refineScriptWithAI, generateAITTS } from '../services/geminiService';
import { videoAudioMixer } from '../services/videoAudioMixer';
import {
  Wand2,
  Sparkles,
  Camera,
  Layers,
  Palette,
  Volume2,
  Type,
  RefreshCw,
  Sliders,
  Image as ImageIcon,
  Zap,
  Flame,
  Binary,
  ZoomIn,
  MoveUp,
  MoveRight,
  MoveLeft,
  Video,
  Play,
  RotateCw,
  Compass,
  X,
  Edit3,
} from 'lucide-react';

interface SceneInspectorProps {
  project: Project;
  selectedSceneIndex: number;
  onUpdateScene: (sceneIndex: number, updater: (prevScene: Scene) => Scene) => void;
  onOpenMediaLibrary: () => void;
  onClose?: () => void;
}

export const SceneInspector: React.FC<SceneInspectorProps> = ({
  project,
  selectedSceneIndex,
  onUpdateScene,
  onOpenMediaLibrary,
  onClose,
}) => {
  const scene = project.scenes[selectedSceneIndex];
  const [isGeneratingVisual, setIsGeneratingVisual] = useState(false);
  const [isRefiningScript, setIsRefiningScript] = useState(false);
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);

  if (!scene) {
    return (
      <div className="w-80 border-l border-slate-800 bg-slate-950 p-4 text-center text-slate-500 text-xs flex items-center justify-center">
        Pilih salah satu scene di timeline untuk mengedit detailnya.
      </div>
    );
  }

  // Camera Motion options
  const cameraMotions: Array<{ id: CameraMotion; label: string; desc: string; icon: React.ReactNode }> = [
    { id: 'zoom_in', label: 'Zoom In (Ken Burns)', desc: 'Smooth cinematic push-in', icon: <ZoomIn className="w-3.5 h-3.5" /> },
    { id: 'zoom_out', label: 'Zoom Out (Reveal)', desc: 'Expansive pull-back', icon: <ZoomIn className="w-3.5 h-3.5 rotate-180" /> },
    { id: 'drone_forward', label: 'Drone Flythrough', desc: 'Forward aerial movement', icon: <Compass className="w-3.5 h-3.5" /> },
    { id: 'pan_left', label: 'Pan Left', desc: 'Horizontal sweep left', icon: <MoveLeft className="w-3.5 h-3.5" /> },
    { id: 'pan_right', label: 'Pan Right', desc: 'Horizontal sweep right', icon: <MoveRight className="w-3.5 h-3.5" /> },
    { id: 'tilt_up', label: 'Tilt Up', desc: 'Vertical reveal upward', icon: <MoveUp className="w-3.5 h-3.5" /> },
    { id: 'orbit', label: 'Orbit Arc', desc: 'Curved rotation sweep', icon: <RotateCw className="w-3.5 h-3.5" /> },
    { id: 'handheld_shake', label: 'Handheld Shaky', desc: 'Action raw camera realism', icon: <Camera className="w-3.5 h-3.5" /> },
    { id: 'static', label: 'Static Lock', desc: 'Tripod steady view', icon: <Video className="w-3.5 h-3.5" /> },
  ];

  // Transitions
  const transitions: Array<{ id: TransitionType; label: string; desc: string; icon: React.ReactNode }> = [
    { id: 'whip_pan', label: 'Whip Pan', desc: 'Fast motion blur swipe', icon: <Zap className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'film_burn', label: 'Film Burn', desc: 'Warm 35mm light leak flash', icon: <Flame className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'glitch', label: 'Cyber Glitch', desc: 'RGB split distortion', icon: <Binary className="w-3.5 h-3.5 text-pink-400" /> },
    { id: 'zoom_rush', label: 'Zoom Rush', desc: 'Rapid scale into next scene', icon: <ZoomIn className="w-3.5 h-3.5 text-purple-400" /> },
    { id: 'cross_dissolve', label: 'Cross Dissolve', desc: 'Smooth cinematic morph', icon: <Sparkles className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'flash_white', label: 'White Flash', desc: 'Dramatic photographic strobe', icon: <Sparkles className="w-3.5 h-3.5 text-white" /> },
    { id: 'fade_black', label: 'Fade to Black', desc: 'Dramatic blackout', icon: <Layers className="w-3.5 h-3.5 text-slate-400" /> },
    { id: 'none', label: 'Cut (None)', desc: 'Direct hard cut', icon: <Video className="w-3.5 h-3.5 text-slate-500" /> },
  ];

  // Color Grades
  const colorGrades: Array<{ id: ColorGradePreset; label: string; previewColor: string }> = [
    { id: 'teal_orange', label: 'Teal & Orange', previewColor: 'from-cyan-500 to-amber-500' },
    { id: 'cyberpunk', label: 'Cyberpunk Neon', previewColor: 'from-fuchsia-500 to-cyan-400' },
    { id: 'kodak_film', label: 'Kodak 35mm', previewColor: 'from-amber-400 to-yellow-600' },
    { id: 'noir', label: 'Monochrome Noir', previewColor: 'from-slate-700 to-slate-900' },
    { id: 'matrix', label: 'Sci-Fi Matrix', previewColor: 'from-emerald-500 to-green-800' },
    { id: 'golden_hour', label: 'Golden Hour', previewColor: 'from-orange-400 to-rose-500' },
    { id: 'hdr_vivid', label: 'HDR Vivid', previewColor: 'from-violet-500 to-rose-500' },
    { id: 'natural', label: 'Natural / Neutral', previewColor: 'from-slate-500 to-slate-600' },
  ];

  // Visual Overlays
  const effectOverlays: Array<{ id: EffectOverlay; label: string; desc: string }> = [
    { id: 'film_grain', label: 'Film Grain 35mm', desc: 'Tekstur grain kamera film organik' },
    { id: 'lens_flare', label: 'Anamorphic Lens Flare', desc: 'Goresan cahaya biru horizontal' },
    { id: 'vhs', label: 'VHS Retro 1984', desc: 'Scanlines & timestamp rekaman pita kaset' },
    { id: 'light_leak', label: 'Warm Light Leak', desc: 'Bocoran cahaya lembut estetis' },
    { id: 'particles', label: 'Ember & Bokeh Particles', desc: 'Partikel debu keemasan melayang' },
    { id: 'none', label: 'None (Bersih)', desc: 'Tanpa overlay tambahan' },
  ];

  // Sound effects
  const soundEffects: Array<{ id: SoundEffectType; label: string }> = [
    { id: 'whoosh', label: '💨 Whoosh Air Sweep' },
    { id: 'glitch_hit', label: '👾 Glitch Hit Distortion' },
    { id: 'cinematic_boom', label: '💥 Cinematic Sub-Bass Boom' },
    { id: 'camera_click', label: '📸 Camera Shutter Click' },
    { id: 'riser', label: '📈 Tension Tension Riser' },
    { id: 'bass_drop', label: '🔊 Heavy Bass Drop' },
    { id: 'none', label: 'Mute (Tanpa SFX)' },
  ];

  // Trigger AI Visual Keyframe generation for this scene
  const handleGenerateVisual = async () => {
    setIsGeneratingVisual(true);
    try {
      const res = await generateSceneVisual(
        scene.visualDescription || scene.title,
        project.aspectRatio,
        scene.colorGrade
      );
      if (res.imageUrl) {
        onUpdateScene(selectedSceneIndex, (prev) => ({
          ...prev,
          mediaUrl: res.imageUrl,
        }));
      }
    } catch (err: any) {
      console.warn('AI Visual generation warning:', err);
    } finally {
      setIsGeneratingVisual(false);
    }
  };

  // AI Script Doctor Refinement
  const handleRefineScript = async (instruction: string) => {
    setIsRefiningScript(true);
    try {
      const res = await refineScriptWithAI(scene.voiceover || scene.subtitle, instruction);
      if (res.refinedVoiceover) {
        onUpdateScene(selectedSceneIndex, (prev) => ({
          ...prev,
          voiceover: res.refinedVoiceover,
          subtitle: res.refinedSubtitle || prev.subtitle,
        }));
      }
    } catch (err: any) {
      console.warn('AI Script refine warning:', err);
    } finally {
      setIsRefiningScript(false);
    }
  };

  // Generate AI Voiceover TTS
  const handleGenerateTTS = async () => {
    if (!scene.voiceover) return;
    setIsGeneratingTTS(true);
    try {
      const res = await generateAITTS(scene.voiceover, 'Kore');
      if (res.audioBase64) {
        onUpdateScene(selectedSceneIndex, (prev) => ({
          ...prev,
          audioBase64: res.audioBase64,
        }));
        videoAudioMixer.playVoiceover(res.audioBase64);
      }
    } catch (err: any) {
      // Fallback preview
      videoAudioMixer.playVoiceover(undefined, scene.voiceover);
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  return (
    <div className="w-80 lg:w-96 border-l border-slate-800 bg-slate-950/95 flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 select-none z-10">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between sticky top-0 bg-slate-950/95 backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-200">
            Inspector Scene {selectedSceneIndex + 1}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Scene Duration Badge */}
          <div className="flex items-center gap-1 text-xs text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
            <span className="font-mono text-cyan-400 font-bold">{scene.duration.toFixed(1)}s</span>
          </div>

          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              title="Tutup Inspector"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-5">
        {/* Scene Title & Duration */}
        <div className="flex flex-col gap-1.5 bg-slate-900/50 border border-slate-800/80 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5" />
              Judul Scene {selectedSceneIndex + 1}
            </label>
            <span className="text-[10px] text-slate-500">Edit Langsung</span>
          </div>
          <input
            type="text"
            value={scene.title}
            onChange={(e) =>
              onUpdateScene(selectedSceneIndex, (prev) => ({
                ...prev,
                title: e.target.value,
              }))
            }
            placeholder="Ketik judul scene..."
            className="w-full text-xs font-semibold text-white bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-lg px-3 py-2 outline-none shadow-inner focus:ring-1 focus:ring-cyan-500/40 transition-all"
          />

          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
            <span>Durasi Scene</span>
            <span className="font-mono text-cyan-300 font-bold">{scene.duration.toFixed(1)} detik</span>
          </div>
          <input
            type="range"
            min={1.5}
            max={10.0}
            step={0.5}
            value={scene.duration}
            onChange={(e) =>
              onUpdateScene(selectedSceneIndex, (prev) => ({
                ...prev,
                duration: parseFloat(e.target.value),
              }))
            }
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Visual Media & AI Keyframe */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              Visual Media Keyframe
            </label>
          </div>

          <div className="relative rounded-xl overflow-hidden aspect-video border border-slate-800 bg-slate-900 group">
            <img src={scene.mediaUrl} alt={scene.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5 opacity-90">
              <span className="text-[10px] text-slate-300 line-clamp-1">{scene.visualDescription}</span>
            </div>
          </div>

          {/* Action buttons for visual */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleGenerateVisual}
              disabled={isGeneratingVisual}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-sm border border-purple-400/30 transition-all disabled:opacity-50"
            >
              <Wand2 className={`w-3.5 h-3.5 ${isGeneratingVisual ? 'animate-spin' : ''}`} />
              <span>{isGeneratingVisual ? 'Generating AI...' : 'Generate AI Image'}</span>
            </button>

            <button
              onClick={onOpenMediaLibrary}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-all"
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Pilih Stock</span>
            </button>
          </div>

          <textarea
            value={scene.visualDescription}
            onChange={(e) =>
              onUpdateScene(selectedSceneIndex, (prev) => ({
                ...prev,
                visualDescription: e.target.value,
              }))
            }
            rows={2}
            placeholder="Deskripsi visual adegan untuk AI..."
            className="w-full text-xs text-slate-300 bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 focus:border-cyan-500 outline-none resize-none"
          />
        </div>

        {/* Camera Motion */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            Gerakan Kamera AI (Ken Burns)
          </label>

          <div className="grid grid-cols-3 gap-1.5">
            {cameraMotions.map((m) => (
              <button
                key={m.id}
                onClick={() =>
                  onUpdateScene(selectedSceneIndex, (prev) => ({
                    ...prev,
                    cameraMotion: m.id,
                  }))
                }
                className={`p-2 rounded-lg text-left flex flex-col items-center gap-1 text-center border transition-all ${
                  scene.cameraMotion === m.id
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
                title={m.desc}
              >
                {m.icon}
                <span className="text-[10px] truncate max-w-full">{m.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Transition to next scene */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Transisi ke Scene Berikutnya
          </label>

          <div className="grid grid-cols-2 gap-1.5">
            {transitions.map((t) => (
              <button
                key={t.id}
                onClick={() =>
                  onUpdateScene(selectedSceneIndex, (prev) => ({
                    ...prev,
                    transition: t.id,
                  }))
                }
                className={`p-2 rounded-lg text-left flex items-center gap-2 border transition-all ${
                  scene.transition === t.id
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {t.icon}
                <span className="text-[10px] truncate">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Color Grading LUT Preset */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            Color Grading Sinematik (LUT)
          </label>

          <div className="grid grid-cols-2 gap-1.5">
            {colorGrades.map((c) => (
              <button
                key={c.id}
                onClick={() =>
                  onUpdateScene(selectedSceneIndex, (prev) => ({
                    ...prev,
                    colorGrade: c.id,
                  }))
                }
                className={`p-2 rounded-lg text-left flex items-center gap-2 border transition-all ${
                  scene.colorGrade === c.id
                    ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40 font-bold shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${c.previewColor} shrink-0`} />
                <span className="text-[10px] truncate">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Visual Overlay Effects */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Efek Overlay Sinematik
          </label>

          <div className="grid grid-cols-2 gap-1.5">
            {effectOverlays.map((o) => (
              <button
                key={o.id}
                onClick={() =>
                  onUpdateScene(selectedSceneIndex, (prev) => ({
                    ...prev,
                    effectOverlay: o.id,
                  }))
                }
                className={`p-2 rounded-lg text-left flex flex-col gap-0.5 border transition-all ${
                  scene.effectOverlay === o.id
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="text-[10px] font-semibold truncate">{o.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Voiceover & Subtitle Script Doctor */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-cyan-400" />
              Naskah Voiceover & Subtitle
            </label>
          </div>

          <textarea
            value={scene.voiceover}
            onChange={(e) =>
              onUpdateScene(selectedSceneIndex, (prev) => ({
                ...prev,
                voiceover: e.target.value,
                subtitle: prev.subtitle || e.target.value,
              }))
            }
            rows={3}
            placeholder="Ketik narasi suara di sini..."
            className="w-full text-xs text-slate-200 bg-slate-900 border border-slate-800 rounded-lg p-2.5 focus:border-cyan-500 outline-none resize-none"
          />

          {/* AI Script Doctor quick presets */}
          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] text-slate-500 font-semibold w-full">AI Script Improver:</span>
            <button
              onClick={() => handleRefineScript('Buat lebih dramatis, puitis, dan sinematik')}
              disabled={isRefiningScript}
              className="px-2 py-1 text-[10px] rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
            >
              ✨ Sinematik
            </button>
            <button
              onClick={() => handleRefineScript('Buat hook viral pendek dan memikat untuk TikTok')}
              disabled={isRefiningScript}
              className="px-2 py-1 text-[10px] rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
            >
              🔥 Hook TikTok
            </button>
            <button
              onClick={() => handleRefineScript('Terjemahkan ke Bahasa Indonesia yang keren')}
              disabled={isRefiningScript}
              className="px-2 py-1 text-[10px] rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
            >
              🇮🇩 Bahasa Indonesia
            </button>
          </div>

          {/* Voiceover TTS button */}
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={handleGenerateTTS}
              disabled={isGeneratingTTS || !scene.voiceover}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50 transition-all disabled:opacity-50"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isGeneratingTTS ? 'Synthesizing...' : 'Play / Test Voiceover'}</span>
            </button>
          </div>
        </div>

        {/* Sound Effect Cue */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            Sound Effect (SFX) Awal Scene
          </label>

          <select
            value={scene.soundEffect}
            onChange={(e) => {
              const sfx = e.target.value as SoundEffectType;
              onUpdateScene(selectedSceneIndex, (prev) => ({
                ...prev,
                soundEffect: sfx,
              }));
              videoAudioMixer.playSoundEffect(sfx);
            }}
            className="w-full text-xs text-slate-200 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 focus:border-cyan-500 outline-none"
          >
            {soundEffects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
