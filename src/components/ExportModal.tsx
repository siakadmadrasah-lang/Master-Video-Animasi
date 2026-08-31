import React, { useState } from 'react';
import { Project } from '../types';
import { videoRenderer } from '../services/videoRenderer';
import {
  Download,
  X,
  Film,
  CheckCircle2,
  Loader2,
  Tv,
  Sparkles,
  Volume2,
  Play,
  Share2,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
  const [fps, setFps] = useState<number>(30);
  const [isExporting, setIsExporting] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const timelineInfo = videoRenderer.getTimelineInfo(project);

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgressPercent(0);
    setStatusText('Memulai proses rendering video...');
    setExportedVideoUrl(null);

    try {
      const blob = await videoRenderer.exportVideo(project, {
        resolution,
        fps,
        onProgress: (percent, text) => {
          setProgressPercent(percent);
          setStatusText(text);
        },
      });

      const videoUrl = URL.createObjectURL(blob);
      setExportedVideoUrl(videoUrl);
      setIsExporting(false);
    } catch (err: any) {
      setIsExporting(false);
      alert(`Gagal mengekspor video: ${err.message || 'Error encoder'}`);
    }
  };

  const handleDownload = () => {
    if (!exportedVideoUrl) return;
    const a = document.createElement('a');
    a.href = exportedVideoUrl;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '-')}-${resolution}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Download className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Ekspor Video Sinematik</h2>
              <p className="text-[11px] text-slate-400">
                Render kanvas ke file video dengan audio & transisi lengkap
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4">
          {exportedVideoUrl ? (
            /* Export Complete State */
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">Video Berhasil Dirender!</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Siap diunduh dan dibagikan ke media sosial (TikTok, YouTube, Reels).
                </p>
              </div>

              {/* Preview Player */}
              <div className="w-full aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 shadow-lg">
                <video
                  src={exportedVideoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Action Buttons */}
              <div className="w-full flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Video Sekarang (.webm)</span>
                </button>
              </div>
            </div>
          ) : isExporting ? (
            /* Rendering Progress State */
            <div className="flex flex-col items-center justify-center gap-5 py-8 text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xs text-emerald-400">
                  {progressPercent}%
                </div>
              </div>

              <div className="flex flex-col gap-1 max-w-xs">
                <span className="text-xs font-bold text-white">Merender Frame Kanvas...</span>
                <span className="text-[11px] text-slate-400 font-mono">{statusText}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  style={{ width: `${progressPercent}%` }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-200"
                />
              </div>
            </div>
          ) : (
            /* Export Config Options */
            <>
              {/* Project Summary info */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400">Judul Video</span>
                  <span className="font-semibold text-white truncate max-w-[240px]">
                    {project.title}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-slate-400">Total Durasi</span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {timelineInfo.totalDuration.toFixed(1)} detik
                  </span>
                </div>
              </div>

              {/* Resolution options */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Kualitas Resolusi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setResolution('1080p')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      resolution === '1080p'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                    }`}
                  >
                    <span className="text-xs font-bold text-emerald-400">1080p Full HD</span>
                    <span className="text-[10px] text-slate-500">Kualitas tajam untuk YouTube & TikTok</span>
                  </button>

                  <button
                    onClick={() => setResolution('720p')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      resolution === '720p'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-300">720p HD</span>
                    <span className="text-[10px] text-slate-500">Rendering cepat & ukuran file hemat</span>
                  </button>
                </div>
              </div>

              {/* Frame rate */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Frame Rate (FPS)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[30, 60].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFps(f)}
                      className={`p-2 rounded-lg text-xs font-semibold border text-center transition-all ${
                        fps === f
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {f} FPS {f === 60 ? '(Ultra Smooth)' : '(Standar)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Inclusion Info */}
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
                <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Audio BGM & narasi voiceover akan dimixing otomatis ke dalam file video.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!exportedVideoUrl && !isExporting && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/60">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
            >
              Batal
            </button>

            <button
              onClick={handleStartExport}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/30 transition-all transform active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Mulai Ekspor Video</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
