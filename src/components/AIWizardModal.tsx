import React, { useState } from 'react';
import { AspectRatio, Project } from '../types';
import { createProjectFromStoryboard, generateAIStoryboard } from '../services/geminiService';
import {
  Wand2,
  Sparkles,
  X,
  Tv,
  Smartphone,
  Square,
  Film,
  Clock,
  Mic,
  Globe,
  Palette,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface AIWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyProject: (newProject: Project) => void;
}

export const AIWizardModal: React.FC<AIWizardModalProps> = ({
  isOpen,
  onClose,
  onApplyProject,
}) => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('cinematic');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [targetDuration, setTargetDuration] = useState(30);
  const [voiceTone, setVoiceTone] = useState('dramatic');
  const [language, setLanguage] = useState('id');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const promptSuggestions = [
    {
      label: '🚀 Jakarta 2050 Cyberpunk',
      text: 'Masa depan Jakarta 2050 sebagai kota megapolitan cyberpunk tercanggih dengan mobil terbang dan gedung pencakar langit berhologram.',
    },
    {
      label: '🧠 5 Rahasia Produktivitas',
      text: '5 rahasia psikologi dan kebiasaan pagi orang-orang sukses dunia untuk mencapai fokus luar biasa.',
    },
    {
      label: '🌊 Misteri Palung Mariana',
      text: 'Dokumenter menegangkan menjelajahi kegelapan Palung Mariana dan makhluk-makhluk laut misterius di kedalaman 11.000 meter.',
    },
    {
      label: '⌚ Iklan Smartwatch AI',
      text: 'Video komersial modern berenergi tinggi untuk jam tangan pintar masa depan dengan sensor biometrik holografis.',
    },
    {
      label: '🏝️ Wonderful Indonesia',
      text: 'Sinematografi magis keindahan alam dan budaya Indonesia: dari pesona Raja Ampat, Danau Toba, hingga magisnya Gunung Bromo.',
    },
  ];

  const styleOptions = [
    { id: 'cinematic', label: 'Cinematic Movie', desc: 'Hollywood lighting & dramatic tones', badge: 'Popular' },
    { id: 'cyberpunk', label: 'Cyberpunk Sci-Fi', desc: 'Neon glow, glitch & futuristic beats', badge: 'High Energy' },
    { id: 'tiktok_viral', label: 'TikTok / Shorts Viral', desc: 'Fast-paced hook with kinetic captions', badge: 'Viral' },
    { id: 'documentary', label: 'Nature Documentary', desc: 'Serene aerial shots & calm deep voice', badge: '4K Realism' },
    { id: 'luxury_commercial', label: 'Luxury Commercial', desc: 'Sleek dark minimalism & high contrast', badge: 'Brand' },
    { id: 'anime_vibrant', label: 'Anime / Vibrant Art', desc: 'Hyper-colorful aesthetics & dynamic motion', badge: 'Creative' },
  ];

  const stepsList = [
    'Menganalisis ide & menyusun naskah dramatis dengan AI...',
    'Membuat storyboard multi-scene & visual keyframe...',
    'Menentukan gerakan kamera & transisi sinematik otomatis...',
    'Mengatur narasi voiceover, subtitle kinetik, dan musik latar...',
    'Menyelesaikan proyek & memuat ke studio!',
  ];

  const handleStartGeneration = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationStep(0);

    // Simulate animated step progression
    const stepInterval = setInterval(() => {
      setGenerationStep((prev) => {
        if (prev < stepsList.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 1800);

    try {
      const numScenes = targetDuration <= 15 ? 3 : targetDuration <= 30 ? 5 : 7;

      const storyboardData = await generateAIStoryboard({
        prompt,
        style,
        aspectRatio,
        targetDuration,
        voiceTone,
        language,
        numScenes,
      });

      clearInterval(stepInterval);
      setGenerationStep(stepsList.length - 1);

      setTimeout(() => {
        const newProject = createProjectFromStoryboard(storyboardData, aspectRatio);
        onApplyProject(newProject);
        setIsGenerating(false);
        onClose();
      }, 800);
    } catch (err: any) {
      clearInterval(stepInterval);
      setIsGenerating(false);
      setErrorMessage(err.message || 'Gagal terhubung dengan model AI. Silakan coba lagi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                AI Text to Video Generator
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  InVideo Style AI
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Ubah ide tulisan menjadi video sinematik lengkap dengan transisi & narasi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-5 flex-1 scrollbar-thin scrollbar-thumb-slate-800">
          {isGenerating ? (
            /* Loading Pipeline State */
            <div className="py-12 flex flex-col items-center justify-center gap-6 text-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
              </div>

              <div className="flex flex-col gap-2 max-w-md">
                <h3 className="text-base font-bold text-white">
                  AI Sedang Merender Storyboard Sinematik...
                </h3>
                <p className="text-xs text-cyan-400 font-mono">
                  {stepsList[generationStep]}
                </p>
              </div>

              {/* Progress Step List */}
              <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 text-left">
                {stepsList.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs">
                    {idx < generationStep ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : idx === generationStep ? (
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                    )}
                    <span
                      className={
                        idx <= generationStep
                          ? 'text-slate-200 font-medium'
                          : 'text-slate-600'
                      }
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Prompt Configuration Form */
            <>
              {/* Error Banner if any */}
              {errorMessage && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start justify-between gap-2 text-xs text-amber-200">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-amber-300">Catatan Server AI:</span>
                    <span className="text-[11px] text-amber-200/90">{errorMessage}</span>
                  </div>
                  <button
                    onClick={handleStartGeneration}
                    className="px-2.5 py-1 text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg transition-all shrink-0"
                  >
                    Coba Lagi
                  </button>
                </div>
              )}

              {/* Prompt Input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Ide / Naskah / Topik Video</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Didukung Gemini 3.7 Flash
                  </span>
                </label>

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  placeholder="Contoh: Buatkan video sinematik tentang masa depan kecerdasan buatan dan robotika di tahun 2050 dengan pencahayaan neon malam hari..."
                  className="w-full text-xs text-slate-200 bg-slate-900 border border-slate-800 rounded-xl p-3 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none resize-none"
                />

                {/* Prompt Suggestions */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" /> Coba Prompt:
                  </span>
                  {promptSuggestions.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(item.text)}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all text-left"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Style Grid */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-cyan-400" />
                  Gaya Sinematik (Visual Style)
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {styleOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setStyle(opt.id)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                        style === opt.id
                          ? 'bg-cyan-500/15 border-cyan-500/50 ring-1 ring-cyan-500/30'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            style === opt.id ? 'text-cyan-300' : 'text-slate-200'
                          }`}
                        >
                          {opt.label}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {opt.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 line-clamp-1">
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Format, Duration & Language */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Aspect Ratio */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Tv className="w-3 h-3" /> Rasio Video
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setAspectRatio('16:9')}
                      className={`p-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                        aspectRatio === '16:9'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      16:9 YT
                    </button>
                    <button
                      onClick={() => setAspectRatio('9:16')}
                      className={`p-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                        aspectRatio === '9:16'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      9:16 Shorts
                    </button>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Target Durasi
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {[15, 30, 60].map((dur) => (
                      <button
                        key={dur}
                        onClick={() => setTargetDuration(dur)}
                        className={`p-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                          targetDuration === dur
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850'
                        }`}
                      >
                        {dur}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Bahasa Narasi
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setLanguage('id')}
                      className={`p-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                        language === 'id'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      🇮🇩 Indonesia
                    </button>
                    <button
                      onClick={() => setLanguage('en')}
                      className={`p-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                        language === 'en'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      🇺🇸 English
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isGenerating && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/60">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
            >
              Batal
            </button>

            <button
              onClick={handleStartGeneration}
              disabled={!prompt.trim()}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30 transition-all transform active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Hasilkan Video AI</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
