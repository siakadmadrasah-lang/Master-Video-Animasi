import React, { useState } from 'react';
import { BgmTrackPreset, StockMediaItem } from '../types';
import { BGM_PRESETS, STOCK_MEDIA_COLLECTION } from '../services/stockLibrary';
import { generateSceneVisual } from '../services/geminiService';
import { videoAudioMixer } from '../services/videoAudioMixer';
import {
  X,
  Search,
  Sparkles,
  Upload,
  Music,
  Image as ImageIcon,
  Play,
  Check,
  Wand2,
  Filter,
} from 'lucide-react';

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (url: string, title: string) => void;
  onSelectBgm: (preset: BgmTrackPreset) => void;
}

export const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectMedia,
  onSelectBgm,
}) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'ai' | 'bgm' | 'upload'>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // AI Generator Tab state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStyle, setAiStyle] = useState('cinematic');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  if (!isOpen) return null;

  const categories = ['All', 'Cyberpunk & Sci-Fi', 'Nature & Landscape', 'Technology & AI', 'City & Architecture', 'Travel & Culture'];

  const filteredStock = STOCK_MEDIA_COLLECTION.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesQuery =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAi(true);
    try {
      const res = await generateSceneVisual(aiPrompt, '16:9', aiStyle);
      if (res.imageUrl) {
        setGeneratedImages((prev) => [res.imageUrl, ...prev]);
      }
    } catch (err: any) {
      alert(`Gagal generate AI: ${err.message}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      if (loadEvent.target?.result) {
        onSelectMedia(loadEvent.target.result as string, file.name);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              Media Assets & Audio Library
            </h2>

            {/* Tabs */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 ml-2">
              <button
                onClick={() => setActiveTab('stock')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'stock'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Stock Footage
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                  activeTab === 'ai'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3 h-3 text-purple-400" />
                AI Generator
              </button>
              <button
                onClick={() => setActiveTab('bgm')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'bgm'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Musik BGM
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'upload'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Upload File
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-800">
          {activeTab === 'stock' && (
            <div className="flex flex-col gap-4">
              {/* Search & Category Filter */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari stock footage (cyberpunk, gunung, laut, mobil, ai)..."
                    className="w-full text-xs text-slate-200 bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 focus:border-cyan-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredStock.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectMedia(item.url, item.title);
                      onClose();
                    }}
                    className="group relative rounded-xl overflow-hidden aspect-video border border-slate-800 bg-slate-900 cursor-pointer hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2.5 opacity-90 group-hover:opacity-100 transition-all">
                      <span className="text-xs font-bold text-white line-clamp-1">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-cyan-300 capitalize">{item.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300">
                  Prompt Visual Gambar AI
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Deskripsikan gambar sinematik yang ingin dibuat..."
                    className="flex-1 text-xs text-slate-200 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 focus:border-purple-500 outline-none"
                  />
                  <button
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAi || !aiPrompt.trim()}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md transition-all disabled:opacity-50"
                  >
                    <Wand2 className={`w-4 h-4 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingAi ? 'Generating...' : 'Buat AI'}</span>
                  </button>
                </div>
              </div>

              {generatedImages.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-400">Hasil Generate AI</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {generatedImages.map((imgUrl, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          onSelectMedia(imgUrl, `AI Image ${i + 1}`);
                          onClose();
                        }}
                        className="rounded-xl overflow-hidden aspect-video border border-slate-800 hover:border-purple-400 cursor-pointer shadow-md transition-all group relative"
                      >
                        <img src={imgUrl} alt="AI Visual" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <span className="text-xs font-bold text-white px-2 py-1 bg-purple-600 rounded-lg shadow">
                            Pakai untuk Scene
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bgm' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BGM_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-900 flex items-center justify-between transition-all"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-white">{preset.title}</span>
                    <span className="text-[11px] text-amber-400 font-medium">{preset.genre}</span>
                    <span className="text-[10px] text-slate-500">
                      {preset.mood} • {preset.bpm} BPM
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        videoAudioMixer.setBgmMood(preset.synthMood);
                        videoAudioMixer.startBgm();
                      }}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                      title="Preview Musik"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        onSelectBgm(preset);
                        onClose();
                      }}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-black shadow-sm"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-center transition-all bg-slate-900/30">
              <div className="w-12 h-12 rounded-full bg-slate-800 text-cyan-400 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Pilih File Gambar dari Komputer</h4>
                <p className="text-xs text-slate-400 mt-0.5">Mendukung format PNG, JPG, WebP, GIF</p>
              </div>
              <label className="cursor-pointer px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md transition-all">
                Pilih File
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
