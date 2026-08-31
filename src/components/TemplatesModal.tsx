import React from 'react';
import { TEMPLATE_PRESETS } from '../data/sampleProjects';
import { createProjectFromStoryboard, generateAIStoryboard } from '../services/geminiService';
import { Project } from '../types';
import { X, Sparkles, FolderOpen, ArrowRight, Play } from 'lucide-react';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (prompt: string, style: string, aspectRatio: any) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Template Video Sinematik AI</h2>
              <p className="text-xs text-slate-400">
                Pilih tema siap pakai dengan komposisi sinematografi profesional
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Grid */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3.5 scrollbar-thin scrollbar-thumb-slate-800">
          {TEMPLATE_PRESETS.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => {
                onApplyTemplate(tpl.prompt, tpl.style, tpl.aspectRatio);
                onClose();
              }}
              className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/20 cursor-pointer flex flex-col transition-all"
            >
              {/* Thumbnail */}
              <div className="aspect-video w-full relative overflow-hidden bg-slate-950">
                <img
                  src={tpl.thumbnail}
                  alt={tpl.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                  {tpl.badge}
                </div>
              </div>

              {/* Info */}
              <div className="p-3.5 flex flex-col justify-between flex-1 gap-2">
                <div>
                  <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {tpl.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-mono text-slate-500">{tpl.aspectRatio}</span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                    Gunakan Template <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
