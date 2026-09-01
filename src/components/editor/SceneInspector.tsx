import React, { useState } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Volume2, 
  HelpCircle, 
  Sliders, 
  Sparkles, 
  Play, 
  Plus, 
  Trash2, 
  Layers, 
  CheckCircle2, 
  Loader2,
  Music,
  Check,
  RefreshCw,
  Eye,
  Award,
  BadgeCheck,
  Palette
} from 'lucide-react';
import { Scene, VideoProject, SceneType, AnimationType, TransitionType, VisualStyle } from '../../types.ts';
import { speakNarrationBrowser, playBgmAudio, stopAllAudio, testVoiceSample } from '../../utils/audioSynth.ts';
import { preloadImage } from '../../utils/videoCanvasRenderer.ts';

interface SceneInspectorProps {
  scene: Scene;
  sceneIndex: number;
  project: VideoProject;
  onUpdateScene: (updatedScene: Scene) => void;
  onUpdateProjectSettings: (updatedProject: VideoProject) => void;
}

export const SceneInspector: React.FC<SceneInspectorProps> = ({
  scene,
  sceneIndex,
  project,
  onUpdateScene,
  onUpdateProjectSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'visual' | 'audio' | 'identity' | 'quiz' | 'subtitles'>('text');
  const [isEnhancingNarration, setIsEnhancingNarration] = useState<boolean>(false);
  const [isGeneratingVisual, setIsGeneratingVisual] = useState<boolean>(false);
  const [newBulletText, setNewBulletText] = useState<string>('');
  const [newKeywordText, setNewKeywordText] = useState<string>('');

  // Educational Preset Images Curated by Subject
  const PRESET_VISUALS = [
    {
      name: 'Laboratorium & Sel Biologi',
      url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&auto=format&fit=crop&q=80',
      category: 'Biologi',
    },
    {
      name: 'Galaksi & Tata Surya Angkasa',
      url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1200&auto=format&fit=crop&q=80',
      category: 'Astronomi',
    },
    {
      name: 'Fisika & Gelombang Magnetik',
      url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&auto=format&fit=crop&q=80',
      category: 'Fisika',
    },
    {
      name: 'Matematika & Geometri',
      url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&auto=format&fit=crop&q=80',
      category: 'Matematika',
    },
    {
      name: 'Hutan, Daun & Fotosintesis',
      url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&auto=format&fit=crop&q=80',
      category: 'Biologi',
    },
    {
      name: 'Papan Tulis Sekolah & Edukasi',
      url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&auto=format&fit=crop&q=80',
      category: 'Kelas',
    },
    {
      name: 'Teknologi Robotik & AI',
      url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&auto=format&fit=crop&q=80',
      category: 'Informatika',
    },
    {
      name: 'Peta & Candi Sejarah Kuno',
      url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&auto=format&fit=crop&q=80',
      category: 'Sejarah',
    },
  ];

  const BGM_PRESETS = [
    {
      id: 'acoustic-edu',
      name: 'Acoustic Educational (Ceria & Ramah)',
      url: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
      vibe: 'Cocok untuk SD & SMP',
    },
    {
      id: 'lofi-study',
      name: 'Ambient Lo-Fi Focus (Tenang & Fokus)',
      url: 'https://assets.mixkit.co/music/preview/mixkit-game-level-music-689.mp3',
      vibe: 'Cocok untuk SMA & Kuliah',
    },
    {
      id: 'cinematic-inspire',
      name: 'Inspirational Cinematic (Megah & Eksploratif)',
      url: 'https://assets.mixkit.co/music/preview/mixkit-valley-sunset-127.mp3',
      vibe: 'Cocok untuk Sejarah & Sains',
    },
  ];

  // AI Narration Enhancer
  const handleEnhanceNarration = async () => {
    setIsEnhancingNarration(true);
    try {
      const resp = await fetch('/api/ai/enhance-narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          narration: scene.narration,
          subject: project.subject,
          grade: project.grade,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.enhancedNarration) {
          onUpdateScene({
            ...scene,
            narration: data.enhancedNarration,
          });
        }
      }
    } catch (err) {
      console.error('Enhance narration error:', err);
    } finally {
      setIsEnhancingNarration(false);
    }
  };

  // AI Visual Generator specifically for this scene's topic
  const handleGenerateVisualAI = async () => {
    setIsGeneratingVisual(true);
    try {
      const resp = await fetch('/api/ai/generate-scene-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: project.topic || project.title,
          sceneTitle: scene.title,
          visualPrompt: scene.visualPrompt || scene.overlayTitle || scene.title,
          visualStyle: project.visualStyle || '3d-animation',
          subject: project.subject,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.imageUrl) {
          preloadImage(data.imageUrl);
          onUpdateScene({
            ...scene,
            visualUrl: data.imageUrl,
          });
        }
      }
    } catch (err) {
      console.error('Generate visual error:', err);
    } finally {
      setIsGeneratingVisual(false);
    }
  };

  // Add Bullet Point
  const handleAddBullet = () => {
    if (!newBulletText.trim()) return;
    const current = scene.bulletPoints || [];
    onUpdateScene({
      ...scene,
      bulletPoints: [...current, newBulletText.trim()],
    });
    setNewBulletText('');
  };

  const handleRemoveBullet = (index: number) => {
    const current = scene.bulletPoints || [];
    onUpdateScene({
      ...scene,
      bulletPoints: current.filter((_, i) => i !== index),
    });
  };

  // Add Keyword
  const handleAddKeyword = () => {
    if (!newKeywordText.trim()) return;
    const current = scene.keywords || [];
    onUpdateScene({
      ...scene,
      keywords: [...current, newKeywordText.trim()],
    });
    setNewKeywordText('');
  };

  const handleRemoveKeyword = (index: number) => {
    const current = scene.keywords || [];
    onUpdateScene({
      ...scene,
      keywords: current.filter((_, i) => i !== index),
    });
  };

  // Test Browser TTS Speech
  const handleTestTTS = () => {
    speakNarrationBrowser(scene.narration, {
      gender: project.voiceConfig?.gender || 'female',
      speed: project.voiceConfig?.speed || 1.0,
      pitch: project.voiceConfig?.pitch || 1.0,
    });
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4 sm:p-5 space-y-5 shadow-xl flex flex-col justify-between">
      
      <div>
        {/* Inspector Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-400 font-bold text-xs">
              #{sceneIndex + 1}
            </span>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Inspector Scene #{sceneIndex + 1}
              </h3>
              <p className="text-[11px] text-slate-400">
                {scene.title || 'Materi Pembelajaran'}
              </p>
            </div>
          </div>

          {/* Scene Type Selector */}
          <select
            value={scene.sceneType}
            onChange={(e) =>
              onUpdateScene({
                ...scene,
                sceneType: e.target.value as SceneType,
              })
            }
            className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-indigo-300 border border-indigo-500/30 focus:outline-none"
          >
            <option value="intro">Intro / Apersepsi Interaktif</option>
            <option value="concept">Konsep Utama</option>
            <option value="explanation">Penjelasan Mendalam</option>
            <option value="example">Contoh & Aplikasi Nyata</option>
            <option value="summary">Rangkuman Kesimpulan</option>
            <option value="quiz">Kuis Evaluasi Interaktif</option>
            <option value="outro">Penutup / Refleksi Interaktif</option>
          </select>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-2xl bg-slate-900/80 p-1 border border-slate-800 mb-4 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
              activeTab === 'text'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Naskah
          </button>

          <button
            onClick={() => setActiveTab('visual')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
              activeTab === 'visual'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            Visual & Gambar
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
              activeTab === 'audio'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="h-3.5 w-3.5" />
            Suara Guru & BGM
          </button>

          <button
            onClick={() => setActiveTab('identity')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
              activeTab === 'identity'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <BadgeCheck className="h-3.5 w-3.5" />
            Logo & Interaktif
          </button>

          {scene.sceneType === 'quiz' && (
            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
                activeTab === 'quiz'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-pink-400 hover:text-pink-300'
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Soal Kuis
            </button>
          )}

          <button
            onClick={() => setActiveTab('subtitles')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
              activeTab === 'subtitles'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            Subtitle
          </button>
        </div>

        {/* TAB 1: NASKAH & TEKS */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            
            {/* Overlay Title */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">
                Judul Utama di Layar (Overlay Title)
              </label>
              <input
                type="text"
                value={scene.overlayTitle || ''}
                onChange={(e) =>
                  onUpdateScene({
                    ...scene,
                    overlayTitle: e.target.value,
                  })
                }
                placeholder="Judul bab materi..."
                className="w-full rounded-xl bg-slate-900 px-3.5 py-2 text-xs text-white border border-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Overlay Subtitle */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">
                Sub-Judul / Konsep Kunci
              </label>
              <input
                type="text"
                value={scene.overlaySubtitle || ''}
                onChange={(e) =>
                  onUpdateScene({
                    ...scene,
                    overlaySubtitle: e.target.value,
                  })
                }
                placeholder="Penjelasan ringkas konsep..."
                className="w-full rounded-xl bg-slate-900 px-3.5 py-2 text-xs text-slate-200 border border-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Narration Script */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300">
                  Naskah Narasi Suara Guru (Dibacakan AI)
                </label>
                <button
                  type="button"
                  onClick={handleEnhanceNarration}
                  disabled={isEnhancingNarration}
                  className="flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 disabled:opacity-50 transition-colors"
                >
                  {isEnhancingNarration ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Perindah Naskah AI
                </button>
              </div>

              <textarea
                rows={4}
                value={scene.narration}
                onChange={(e) =>
                  onUpdateScene({
                    ...scene,
                    narration: e.target.value,
                  })
                }
                placeholder="Tulis naskah narasi pengajar di sini..."
                className="w-full rounded-xl bg-slate-900 p-3 text-xs text-slate-200 border border-slate-800 focus:border-indigo-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Bullet Points */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300">
                Poin Materi Berurutan (Bullet Points)
              </label>
              
              <div className="space-y-1.5">
                {scene.bulletPoints?.map((bp, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-[10px] font-bold text-indigo-300">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={bp}
                      onChange={(e) => {
                        const updated = [...(scene.bulletPoints || [])];
                        updated[idx] = e.target.value;
                        onUpdateScene({ ...scene, bulletPoints: updated });
                      }}
                      className="flex-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs text-slate-200 border border-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveBullet(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBulletText}
                  onChange={(e) => setNewBulletText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddBullet()}
                  placeholder="Tambah poin baru..."
                  className="flex-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs text-slate-200 border border-slate-800 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddBullet}
                  className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300">
                Kata Kunci / Tagar Materi (#Keywords)
              </label>

              <div className="flex flex-wrap gap-1.5">
                {scene.keywords?.map((kw, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 rounded-lg bg-indigo-950/80 border border-indigo-500/30 px-2 py-0.5 text-[11px] text-indigo-300"
                  >
                    #{kw}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(idx)}
                      className="hover:text-rose-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newKeywordText}
                  onChange={(e) => setNewKeywordText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                  placeholder="Tambah tagar..."
                  className="flex-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs text-slate-200 border border-slate-800 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700"
                >
                  Tambah
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: VISUAL & GAMBAR */}
        {activeTab === 'visual' && (
          <div className="space-y-4">
            
            {/* AI Generate Visual Button based on Topic */}
            <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/60 to-slate-900 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Generate Gambar AI Sesuai Materi
                </span>
                <span className="text-[10px] text-indigo-400 font-medium">
                  {project.subject || 'Sains'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Sesuaikan visual otomatis dengan judul scene: <strong className="text-slate-200">"{scene.title}"</strong> ({project.topic || 'Materi'}).
              </p>
              <button
                type="button"
                onClick={handleGenerateVisualAI}
                disabled={isGeneratingVisual}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 py-2.5 text-xs font-bold text-white shadow-lg hover:from-indigo-500 hover:to-sky-500 active:scale-98 transition-all disabled:opacity-50"
              >
                {isGeneratingVisual ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menghasilkan Gambar AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    Generate Gambar Baru Sesuai Materi
                  </>
                )}
              </button>
            </div>

            {/* Visual URL Input & Preview */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300">
                Gambar Latar Scene (URL)
              </label>
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-950 border border-slate-800">
                {scene.visualUrl ? (
                  <img
                    src={scene.visualUrl}
                    alt={scene.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-slate-500">
                    Gradien Latar Belakang
                  </div>
                )}
              </div>

              <input
                type="text"
                value={scene.visualUrl || ''}
                onChange={(e) =>
                  onUpdateScene({
                    ...scene,
                    visualUrl: e.target.value,
                  })
                }
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full rounded-xl bg-slate-900 px-3.5 py-2 text-xs text-slate-200 border border-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Curated Educational Visual Presets */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300">
                Pilih dari Galeri Visual Edukasi:
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {PRESET_VISUALS.map((preset, idx) => (
                  <div
                    key={idx}
                    onClick={() =>
                      onUpdateScene({
                        ...scene,
                        visualUrl: preset.url,
                      })
                    }
                    className={`group relative cursor-pointer overflow-hidden rounded-xl border p-1 transition-all ${
                      scene.visualUrl === preset.url
                        ? 'border-indigo-500 ring-2 ring-indigo-500'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="aspect-video w-full rounded-lg object-cover"
                    />
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="truncate font-medium">{preset.name}</span>
                      <span className="text-indigo-400 shrink-0 font-bold">{preset.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Camera Motion & Animation */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300">
                Gerakan Kamera (Ken Burns Animation)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'zoom-in', label: '🔍 Zoom-In Perlahan' },
                  { id: 'pan-left', label: '👈 Geser ke Kiri' },
                  { id: 'pan-right', label: '👉 Geser ke Kanan' },
                  { id: 'float', label: '🌊 Float Mengambang' },
                ].map((anim) => (
                  <button
                    key={anim.id}
                    type="button"
                    onClick={() =>
                      onUpdateScene({
                        ...scene,
                        animationType: anim.id as AnimationType,
                      })
                    }
                    className={`rounded-xl border p-2 text-xs font-bold transition-all text-left ${
                      scene.animationType === anim.id
                        ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {anim.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: AUDIO & SUARA GURU */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            
            {/* TTS Voice Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300">
                  Karakter Suara AI (Pengajar)
                </label>
                <button
                  onClick={handleTestTTS}
                  className="flex items-center gap-1 rounded-lg bg-indigo-600/30 px-2.5 py-1 text-[10px] font-bold text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all"
                >
                  <Play className="h-3 w-3 fill-current" />
                  Uji Narasi Scene Ini
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div
                  onClick={() =>
                    onUpdateProjectSettings({
                      ...project,
                      voiceConfig: {
                        ...project.voiceConfig,
                        gender: 'female',
                        voiceName: 'Siti (AI Wanita)',
                        pitch: 1.12,
                      },
                    })
                  }
                  className={`rounded-xl border p-3 cursor-pointer transition-all flex flex-col justify-between ${
                    project.voiceConfig?.gender === 'female'
                      ? 'border-pink-500 bg-pink-950/40 text-white ring-1 ring-pink-500'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-pink-300">👩‍🏫 Suara Siti</p>
                      {project.voiceConfig?.gender === 'female' && (
                        <Check className="h-3.5 w-3.5 text-pink-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Wanita (Ceria, Hangat, Ramah)</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      testVoiceSample('female', project.voiceConfig?.speed);
                    }}
                    className="mt-2.5 flex items-center justify-center gap-1 rounded-lg bg-pink-600/20 py-1 text-[10px] font-bold text-pink-300 hover:bg-pink-600 hover:text-white transition-all"
                  >
                    <Play className="h-2.5 w-2.5 fill-current" /> Tes Sampel Siti
                  </button>
                </div>

                <div
                  onClick={() =>
                    onUpdateProjectSettings({
                      ...project,
                      voiceConfig: {
                        ...project.voiceConfig,
                        gender: 'male',
                        voiceName: 'Dimas (AI Pria)',
                        pitch: 0.74,
                      },
                    })
                  }
                  className={`rounded-xl border p-3 cursor-pointer transition-all flex flex-col justify-between ${
                    project.voiceConfig?.gender === 'male'
                      ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-indigo-300">👨‍🏫 Suara Dimas</p>
                      {project.voiceConfig?.gender === 'male' && (
                        <Check className="h-3.5 w-3.5 text-indigo-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Pria (Berat, Wibawa, Runtut)</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      testVoiceSample('male', project.voiceConfig?.speed);
                    }}
                    className="mt-2.5 flex items-center justify-center gap-1 rounded-lg bg-indigo-600/20 py-1 text-[10px] font-bold text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    <Play className="h-2.5 w-2.5 fill-current" /> Tes Sampel Dimas
                  </button>
                </div>
              </div>
            </div>

            {/* Voice Speed Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">Kecepatan Bicara:</span>
                <span className="text-indigo-400 font-mono font-bold">
                  {project.voiceConfig?.speed || 1.0}x
                </span>
              </div>
              <input
                type="range"
                min={0.8}
                max={1.4}
                step={0.05}
                value={project.voiceConfig?.speed || 1.0}
                onChange={(e) =>
                  onUpdateProjectSettings({
                    ...project,
                    voiceConfig: {
                      ...project.voiceConfig,
                      speed: parseFloat(e.target.value),
                    },
                  })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* BGM Selector */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-[11px] font-bold text-slate-300">
                Musik Latar Belakang (BGM)
              </label>

              <div className="space-y-1.5">
                {BGM_PRESETS.map((bgm) => (
                  <div
                    key={bgm.id}
                    onClick={() =>
                      onUpdateProjectSettings({
                        ...project,
                        audioTrack: {
                          ...project.audioTrack,
                          musicUrl: bgm.url,
                          musicName: bgm.name,
                        },
                      })
                    }
                    className={`cursor-pointer rounded-xl border p-2.5 flex items-center justify-between transition-all ${
                      project.audioTrack?.musicUrl === bgm.url
                        ? 'border-indigo-500 bg-indigo-950/40 text-white'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-200">{bgm.name}</p>
                      <p className="text-[10px] text-slate-400">{bgm.vibe}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playBgmAudio(bgm.url, 40, false);
                      }}
                      className="rounded-lg bg-slate-800 p-1.5 hover:bg-slate-700 text-slate-300"
                    >
                      <Play className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: IDENTITAS & LOGO FOOTER */}
        {activeTab === 'identity' && (
          <div className="space-y-4">
            
            {/* Logo Badge in Footer */}
            <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <BadgeCheck className="h-4 w-4 text-amber-400" />
                  Logo & Identitas Footer Video
                </span>
                <div
                  onClick={() =>
                    onUpdateProjectSettings({
                      ...project,
                      footerIdentity: {
                        ...project.footerIdentity,
                        enabled: project.footerIdentity?.enabled === false ? true : false,
                      },
                    })
                  }
                  className={`h-5 w-9 rounded-full p-0.5 cursor-pointer transition-colors ${
                    project.footerIdentity?.enabled !== false ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white transition-transform ${
                      project.footerIdentity?.enabled !== false ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Preview Badge */}
              <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <img
                  src={project.footerIdentity?.logoUrl || '/assets/logo-badge.jpg'}
                  alt="Logo Badge"
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-amber-400"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider truncate">
                    {project.footerIdentity?.badgeTitle || 'VIDEO ANIMASI PEMBELAJARAN'}
                  </p>
                  <p className="text-xs font-bold text-white truncate">
                    {project.footerIdentity?.creatorName || 'Dev Jaenal Maskun'} <span className="text-sky-400">✓</span>
                  </p>
                </div>
              </div>

              {/* Creator Name Field */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">
                  Nama Pembuat / Pengembang
                </label>
                <input
                  type="text"
                  value={project.footerIdentity?.creatorName || 'Dev Jaenal Maskun'}
                  onChange={(e) =>
                    onUpdateProjectSettings({
                      ...project,
                      footerIdentity: {
                        ...project.footerIdentity,
                        creatorName: e.target.value,
                      },
                    })
                  }
                  placeholder="Dev Jaenal Maskun"
                  className="w-full rounded-xl bg-slate-950 px-3 py-1.5 text-xs text-white border border-slate-800 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Badge Title Field */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">
                  Judul Label Badge Footer
                </label>
                <input
                  type="text"
                  value={project.footerIdentity?.badgeTitle || 'VIDEO ANIMASI PEMBELAJARAN'}
                  onChange={(e) =>
                    onUpdateProjectSettings({
                      ...project,
                      footerIdentity: {
                        ...project.footerIdentity,
                        badgeTitle: e.target.value,
                      },
                    })
                  }
                  placeholder="VIDEO ANIMASI PEMBELAJARAN"
                  className="w-full rounded-xl bg-slate-950 px-3 py-1.5 text-xs text-white border border-slate-800 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Position */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300">
                  Posisi Badge Footer
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateProjectSettings({
                        ...project,
                        footerIdentity: {
                          ...project.footerIdentity,
                          position: 'bottom-right',
                        },
                      })
                    }
                    className={`rounded-xl border p-2 text-xs font-bold transition-all ${
                      project.footerIdentity?.position !== 'bottom-left'
                        ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    Kanan Bawah (Standar)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateProjectSettings({
                        ...project,
                        footerIdentity: {
                          ...project.footerIdentity,
                          position: 'bottom-left',
                        },
                      })
                    }
                    className={`rounded-xl border p-2 text-xs font-bold transition-all ${
                      project.footerIdentity?.position === 'bottom-left'
                        ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    Kiri Bawah
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Intro & Outro Settings */}
            <div className="rounded-2xl border border-sky-500/30 bg-slate-900/90 p-3.5 space-y-3">
              <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-sky-400" />
                Intro & Outro Interaktif
              </span>

              {/* Intro Toggle */}
              <div
                onClick={() =>
                  onUpdateProjectSettings({
                    ...project,
                    introOutroConfig: {
                      ...project.introOutroConfig,
                      introInteractive: project.introOutroConfig?.introInteractive === false ? true : false,
                    },
                  })
                }
                className="cursor-pointer rounded-xl border border-slate-800 bg-slate-950 p-2.5 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-200">🚀 Intro Interaktif Beranimasi</p>
                  <p className="text-[10px] text-slate-400">Pemberitahuan apersepsi, logo menyala & tombol mulai</p>
                </div>
                <div
                  className={`h-5 w-9 rounded-full p-0.5 transition-colors ${
                    project.introOutroConfig?.introInteractive !== false ? 'bg-sky-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white transition-transform ${
                      project.introOutroConfig?.introInteractive !== false ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Outro Toggle */}
              <div
                onClick={() =>
                  onUpdateProjectSettings({
                    ...project,
                    introOutroConfig: {
                      ...project.introOutroConfig,
                      outroCelebration: project.introOutroConfig?.outroCelebration === false ? true : false,
                    },
                  })
                }
                className="cursor-pointer rounded-xl border border-slate-800 bg-slate-950 p-2.5 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-200">🌟 Outro & Konfeti Perayaan</p>
                  <p className="text-[10px] text-slate-400">Efek kembang api konfeti, kartu piala & tombol ulangi</p>
                </div>
                <div
                  className={`h-5 w-9 rounded-full p-0.5 transition-colors ${
                    project.introOutroConfig?.outroCelebration !== false ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white transition-transform ${
                      project.introOutroConfig?.outroCelebration !== false ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: SOAL KUIS INTERAKTIF */}
        {activeTab === 'quiz' && scene.quizQuestion && (
          <div className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-pink-300">
                Pertanyaan Soal Kuis
              </label>
              <textarea
                rows={2}
                value={scene.quizQuestion.question}
                onChange={(e) =>
                  onUpdateScene({
                    ...scene,
                    quizQuestion: {
                      ...scene.quizQuestion!,
                      question: e.target.value,
                    },
                  })
                }
                className="w-full rounded-xl bg-slate-900 p-3 text-xs text-white border border-slate-800 focus:border-pink-500 focus:outline-none"
              />
            </div>

            {/* 4 Options */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300">
                Pilihan Jawaban (Pilih radio untuk kunci jawaban benar)
              </label>

              {scene.quizQuestion.options.map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={scene.quizQuestion?.correctIndex === optIdx}
                    onChange={() =>
                      onUpdateScene({
                        ...scene,
                        quizQuestion: {
                          ...scene.quizQuestion!,
                          correctIndex: optIdx,
                        },
                      })
                    }
                    className="accent-emerald-500 h-4 w-4 cursor-pointer"
                  />
                  <span className="font-bold text-xs text-slate-400 w-4">
                    {String.fromCharCode(65 + optIdx)}.
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...scene.quizQuestion!.options];
                      newOpts[optIdx] = e.target.value;
                      onUpdateScene({
                        ...scene,
                        quizQuestion: {
                          ...scene.quizQuestion!,
                          options: newOpts,
                        },
                      });
                    }}
                    className="flex-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs text-slate-200 border border-slate-800 focus:border-pink-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            {/* Explanation / Pembahasan */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-emerald-300">
                Pembahasan / Penjelasan Jawaban Benar
              </label>
              <textarea
                rows={2}
                value={scene.quizQuestion.explanation}
                onChange={(e) =>
                  onUpdateScene({
                    ...scene,
                    quizQuestion: {
                      ...scene.quizQuestion!,
                      explanation: e.target.value,
                    },
                  })
                }
                className="w-full rounded-xl bg-slate-900 p-3 text-xs text-slate-200 border border-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

          </div>
        )}

        {/* TAB 6: SUBTITLE & TAMPILAN */}
        {activeTab === 'subtitles' && (
          <div className="space-y-4">
            
            {/* Subtitle Font Size */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300">
                Ukuran Teks Subtitle
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'sm', label: 'Kecil (sm)' },
                  { id: 'md', label: 'Sedang (md)' },
                  { id: 'lg', label: 'Besar (lg)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      onUpdateProjectSettings({
                        ...project,
                        subtitleConfig: {
                          ...project.subtitleConfig,
                          fontSize: s.id as any,
                        },
                      })
                    }
                    className={`rounded-xl border p-2 text-xs font-bold transition-all ${
                      project.subtitleConfig?.fontSize === s.id
                        ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subtitle Position */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300">
                Posisi Subtitle di Layar
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bottom', label: 'Bawah (Default)' },
                  { id: 'middle', label: 'Tengah' },
                  { id: 'top', label: 'Atas' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      onUpdateProjectSettings({
                        ...project,
                        subtitleConfig: {
                          ...project.subtitleConfig,
                          position: p.id as any,
                        },
                      })
                    }
                    className={`rounded-xl border p-2 text-xs font-bold transition-all ${
                      project.subtitleConfig?.position === p.id
                        ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Karaoke Highlight Toggle */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300">
                Efek Karaoke Kata Aktif
              </label>
              <div
                onClick={() =>
                  onUpdateProjectSettings({
                    ...project,
                    subtitleConfig: {
                      ...project.subtitleConfig,
                      highlightCurrentWord: !project.subtitleConfig?.highlightCurrentWord,
                    },
                  })
                }
                className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900 p-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-200">Highlight Kuning Berjalan</p>
                  <p className="text-[10px] text-slate-400">Kata yang sedang diucapkan disorot terang</p>
                </div>
                <div
                  className={`h-5 w-9 rounded-full p-0.5 transition-colors ${
                    project.subtitleConfig?.highlightCurrentWord ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white transition-transform ${
                      project.subtitleConfig?.highlightCurrentWord ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Watermark Branding */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-[11px] font-bold text-slate-300">
                Watermark Guru / Sekolah
              </label>
              <input
                type="text"
                value={project.exportSettings?.watermarkText || ''}
                onChange={(e) =>
                  onUpdateProjectSettings({
                    ...project,
                    exportSettings: {
                      ...project.exportSettings,
                      watermark: true,
                      watermarkText: e.target.value,
                    },
                  })
                }
                placeholder="Contoh: Bu Siti • SMP Negeri 1"
                className="w-full rounded-xl bg-slate-900 px-3.5 py-2 text-xs text-slate-200 border border-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
