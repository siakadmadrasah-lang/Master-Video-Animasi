import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Film, 
  CheckCircle2, 
  Loader2, 
  FileText, 
  Sparkles, 
  Video, 
  Clock, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { VideoProject } from '../../types.ts';
import { exportVideoToFile } from '../../utils/videoExporter.ts';

interface ExportModalProps {
  project: VideoProject;
  onClose: () => void;
  onUpdateProject: (updated: VideoProject) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  project,
  onClose,
  onUpdateProject,
}) => {
  const [resolution, setResolution] = useState<'720p' | '1080p'>(
    project.exportSettings?.resolution || '720p'
  );
  const [fps, setFps] = useState<number>(project.exportSettings?.fps || 30);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderStatusText, setRenderStatusText] = useState<string>('');
  const [renderedBlobUrl, setRenderedBlobUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate SRT Subtitle string
  const generateSrt = () => {
    let srtContent = '';
    let currentSec = 0;

    project.scenes.forEach((scene, idx) => {
      const start = currentSec;
      const end = currentSec + scene.duration;

      const formatSrtTime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        const ms = Math.floor((sec % 1) * 1000);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
      };

      srtContent += `${idx + 1}\n`;
      srtContent += `${formatSrtTime(start)} --> ${formatSrtTime(end)}\n`;
      srtContent += `${scene.narration}\n\n`;

      currentSec += scene.duration;
    });

    return srtContent;
  };

  const handleDownloadSrt = () => {
    const srtText = generateSrt();
    const blob = new Blob([srtText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '_')}_subtitles.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStartRender = async () => {
    setIsRendering(true);
    setRenderProgress(0);
    setRenderStatusText('Memulai proses render video...');
    setErrorMessage(null);

    const updatedProject: VideoProject = {
      ...project,
      exportSettings: {
        ...project.exportSettings,
        resolution,
        fps,
      },
    };

    try {
      const blob = await exportVideoToFile(updatedProject, (prog, curSc, totSc, msg) => {
        setRenderProgress(prog);
        setRenderStatusText(msg);
      });

      const blobUrl = URL.createObjectURL(blob);
      setRenderedBlobUrl(blobUrl);

      // Auto trigger download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${project.title.replace(/\s+/g, '_')}.webm`;
      a.click();

      // Update project render status on server
      fetch(`/api/projects/${project.id}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution, fps }),
      }).catch((e) => console.warn('Render status sync:', e));

      onUpdateProject({
        ...updatedProject,
        status: 'ready',
      });
    } catch (err: any) {
      console.error('Render error:', err);
      setErrorMessage(err.message || 'Gagal me-render video. Pastikan peramban mendukung Canvas & MediaRecorder.');
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Ekspor & Unduh Video Edukasi
              </h2>
              <p className="text-xs text-slate-400">
                Render otomatis storyboard, narasi suara, animasi visual & kuis.
              </p>
            </div>
          </div>

          {!isRendering && (
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Video Summary Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex items-center gap-3.5">
          <img
            src={project.thumbnailUrl}
            alt={project.title}
            className="h-14 w-20 rounded-xl object-cover ring-1 ring-slate-800 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate">
              {project.title}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {project.subject} • {project.grade} • {project.scenes.length} Scenes
            </p>
            <p className="text-[11px] text-indigo-400 font-semibold mt-0.5">
              Durasi: {Math.floor((project.totalDurationSeconds || 60) / 60)}:
              {String((project.totalDurationSeconds || 60) % 60).padStart(2, '0')}
            </p>
          </div>
        </div>

        {/* Export Configuration Options */}
        {!isRendering && !renderedBlobUrl && (
          <div className="space-y-4">
            
            {/* Resolution Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200">
                Pilih Resolusi Video
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setResolution('720p')}
                  className={`rounded-2xl border p-3 text-left transition-all ${
                    resolution === '720p'
                      ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <p className="text-xs font-bold">HD 720p (1280 × 720)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Proses cepat, ukuran berkas ringan</p>
                </button>

                <button
                  type="button"
                  onClick={() => setResolution('1080p')}
                  className={`rounded-2xl border p-3 text-left transition-all ${
                    resolution === '1080p'
                      ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <p className="text-xs font-bold">Full HD 1080p (1920 × 1080)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Kualitas tajam untuk proyektor & TV</p>
                </button>
              </div>
            </div>

            {/* FPS Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200">
                Kecepatan Frame (FPS)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFps(30)}
                  className={`rounded-2xl border p-3 text-left transition-all ${
                    fps === 30
                      ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <p className="text-xs font-bold">30 FPS (Standar Video)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Paling stabil untuk sebagian besar peramban</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFps(60)}
                  className={`rounded-2xl border p-3 text-left transition-all ${
                    fps === 60
                      ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <p className="text-xs font-bold">60 FPS (Ultra Halus)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Animasi Ken Burns ekstra halus</p>
                </button>
              </div>
            </div>

            {/* Subtitle SRT Download */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-sky-400" />
                <div>
                  <p className="text-xs font-bold text-slate-200">Unduh Subtitle Terpisah</p>
                  <p className="text-[10px] text-slate-400">Format .SRT untuk YouTube / Google Classroom</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadSrt}
                className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-slate-700 transition-all"
              >
                Unduh .SRT
              </button>
            </div>

          </div>
        )}

        {/* Live Rendering Progress Screen */}
        {isRendering && (
          <div className="space-y-4 py-4 text-center">
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                Sedang Me-render Video... ({Math.round(renderProgress * 100)}%)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {renderStatusText}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 h-full rounded-full transition-all duration-150"
                style={{ width: `${Math.round(renderProgress * 100)}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-500">
              Harap jangan menutup jendela ini hingga proses rendering selesai.
            </p>
          </div>
        )}

        {/* Render Finished Successfully */}
        {renderedBlobUrl && !isRendering && (
          <div className="space-y-4 py-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                Render Video Selesai!
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Berkas video telah otomatis diunduh ke perangkat Anda.
              </p>
            </div>

            <div className="flex gap-2 justify-center">
              <a
                href={renderedBlobUrl}
                download={`${project.title.replace(/\s+/g, '_')}.webm`}
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all"
              >
                <Download className="h-4 w-4" />
                Unduh Ulang Video
              </a>
              <button
                onClick={onClose}
                className="rounded-2xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer CTA */}
        {!isRendering && !renderedBlobUrl && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleStartRender}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-600 hover:to-indigo-700 active:scale-95 transition-all"
            >
              <Film className="h-4 w-4" />
              Render & Unduh Sekarang
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
