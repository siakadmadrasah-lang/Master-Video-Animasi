import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Project, SubtitleStyle } from '../types';
import { videoRenderer } from '../services/videoRenderer';
import { videoAudioMixer } from '../services/videoAudioMixer';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Maximize2,
  Repeat,
  Sparkles,
  Volume2,
  VolumeX,
  Type,
  Gauge,
  Edit3,
  Check,
  Sliders,
} from 'lucide-react';

interface VideoPlayerCanvasProps {
  project: Project;
  currentTime: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  onUpdateSubtitleStyle: (style: SubtitleStyle) => void;
  selectedSceneIndex: number;
  onSelectScene: (index: number) => void;
  onUpdateSceneTitle?: (sceneIndex: number, newTitle: string) => void;
  isInspectorOpen?: boolean;
  onOpenInspector?: () => void;
}

export const VideoPlayerCanvas: React.FC<VideoPlayerCanvasProps> = ({
  project,
  currentTime,
  isPlaying,
  onTimeUpdate,
  onTogglePlay,
  onSeek,
  playbackSpeed,
  onChangeSpeed,
  onUpdateSubtitleStyle,
  selectedSceneIndex,
  onSelectScene,
  onUpdateSceneTitle,
  isInspectorOpen,
  onOpenInspector,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const [isLooping, setIsLooping] = useState(true);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [isEditingHudTitle, setIsEditingHudTitle] = useState(false);
  const [hudTitleText, setHudTitleText] = useState('');

  const timelineInfo = videoRenderer.getTimelineInfo(project);
  const totalDuration = timelineInfo.totalDuration;

  // Render loop
  const render = useCallback(() => {
    if (canvasRef.current) {
      videoRenderer.renderFrame(canvasRef.current, project, currentTime);
    }
  }, [project, currentTime]);

  useEffect(() => {
    render();
  }, [render]);

  // Playback timer & auto audio synchronization
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const nextTime = currentTime + delta * playbackSpeed;

      if (nextTime >= totalDuration) {
        if (isLooping) {
          onSeek(0);
        } else {
          onTogglePlay();
          onSeek(0);
        }
      } else {
        onTimeUpdate(nextTime);
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTime, totalDuration, isLooping, playbackSpeed, onTimeUpdate, onSeek, onTogglePlay]);

  // Preload all project images
  useEffect(() => {
    project.scenes.forEach((scene) => {
      if (scene.mediaUrl) {
        videoRenderer.preloadImage(scene.mediaUrl);
      }
    });
  }, [project.scenes]);

  // Calculate container aspect ratio styles
  const getAspectRatioClasses = () => {
    switch (project.aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[520px]';
      case '1:1':
        return 'aspect-square max-h-[480px]';
      case '21:9':
        return 'aspect-[21/9] max-w-[860px]';
      case '16:9':
      default:
        return 'aspect-video max-w-[820px]';
    }
  };

  const activeSceneInfo = videoRenderer.getActiveSceneAtTime(project, currentTime);

  // Time format helper (00:04.2)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const tenths = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
  };

  const subtitleStyles: Array<{ id: SubtitleStyle; label: string; desc: string }> = [
    { id: 'karaoke', label: 'Karaoke Highlight', desc: 'Vivid yellow word highlight' },
    { id: 'cyberpunk_glitch', label: 'Cyberpunk Neon', desc: 'Framed glowing cyan box' },
    { id: 'cinematic_fade', label: 'Cinematic Minimal', desc: 'Clean high-contrast movie text' },
    { id: 'typewriter', label: 'Typewriter Cursor', desc: 'Dynamic typewriter animation' },
    { id: 'lower_third', label: 'Lower Third News', desc: 'Broadcast news banner style' },
  ];

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col items-center justify-center p-3 lg:p-5 bg-slate-950/60 overflow-hidden relative"
    >
      {/* Video Viewport Area */}
      <div className="w-full flex-1 flex items-center justify-center relative min-h-0">
        <div
          className={`relative w-full ${getAspectRatioClasses()} rounded-xl overflow-hidden shadow-2xl shadow-black/80 ring-1 ring-slate-800/80 bg-black flex items-center justify-center group`}
        >
          {/* Canvas Renderer */}
          <canvas
            ref={canvasRef}
            width={project.aspectRatio === '9:16' ? 1080 : 1920}
            height={project.aspectRatio === '9:16' ? 1920 : 1080}
            className="w-full h-full object-contain cursor-pointer"
            onClick={onTogglePlay}
          />

          {/* Quick HUD Overlays */}
          <div className="absolute top-3 left-3 flex items-center gap-2 z-30">
            {activeSceneInfo && (
              isEditingHudTitle ? (
                <div
                  className="px-2.5 py-1 rounded-md bg-slate-950/90 backdrop-blur-md border border-cyan-400 text-xs font-semibold text-white flex items-center gap-1.5 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                  <span className="text-[11px] text-cyan-300 font-mono shrink-0">Sc {activeSceneInfo.currentIndex + 1}:</span>
                  <input
                    type="text"
                    value={hudTitleText}
                    onChange={(e) => setHudTitleText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (onUpdateSceneTitle && hudTitleText.trim()) {
                          onUpdateSceneTitle(activeSceneInfo.currentIndex, hudTitleText.trim());
                        }
                        setIsEditingHudTitle(false);
                      }
                      if (e.key === 'Escape') setIsEditingHudTitle(false);
                    }}
                    autoFocus
                    placeholder="Ketik judul scene..."
                    className="bg-transparent text-white text-xs font-semibold outline-none w-36 sm:w-48"
                  />
                  <button
                    onClick={() => {
                      if (onUpdateSceneTitle && hudTitleText.trim()) {
                        onUpdateSceneTitle(activeSceneInfo.currentIndex, hudTitleText.trim());
                      }
                      setIsEditingHudTitle(false);
                    }}
                    className="p-0.5 text-cyan-400 hover:text-cyan-300"
                    title="Simpan Judul Scene"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setHudTitleText(activeSceneInfo.currentScene.title);
                    setIsEditingHudTitle(true);
                    onSelectScene(activeSceneInfo.currentIndex);
                  }}
                  className="group px-2.5 py-1 rounded-md bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/10 hover:border-cyan-500/50 text-[11px] font-semibold text-white flex items-center gap-1.5 shadow-lg cursor-pointer transition-all"
                  title="Klik untuk mengubah judul scene ini"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400 group-hover:scale-125 transition-transform" />
                  <span>Scene {activeSceneInfo.currentIndex + 1}: {activeSceneInfo.currentScene.title}</span>
                  <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-cyan-400 opacity-60 group-hover:opacity-100 transition-all ml-0.5" />
                </div>
              )
            )}
            {activeSceneInfo?.isInTransition && (
              <div className="px-2 py-0.5 rounded bg-amber-500/90 text-black text-[10px] font-black uppercase tracking-wider shadow-lg pointer-events-none">
                Transisi: {activeSceneInfo.transitionType.replace('_', ' ')}
              </div>
            )}
            {/* Quick Open Inspector Button if closed */}
            {!isInspectorOpen && onOpenInspector && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenInspector();
                }}
                className="px-2 py-1 rounded-md bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700 text-[11px] font-medium text-cyan-300 hover:text-white flex items-center gap-1 shadow-lg transition-all"
                title="Buka Panel Edit Scene (Inspector)"
              >
                <Sliders className="w-3 h-3" />
                <span className="hidden sm:inline">Inspector</span>
              </button>
            )}
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-none">
            <div className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300">
              {project.aspectRatio} • {project.resolution} • {project.fps} FPS
            </div>
          </div>

          {/* Big Play overlay icon on pause */}
          {!isPlaying && (
            <div
              onClick={onTogglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-xl shadow-cyan-500/30 transform hover:scale-105 active:scale-95 transition-all">
                <Play className="w-7 h-7 fill-current ml-1" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modern Player Controls Bar */}
      <div className="w-full max-w-3xl mt-3 bg-slate-900/90 backdrop-blur-lg border border-slate-800 rounded-xl p-2.5 shadow-xl flex flex-col gap-2 select-none">
        {/* Scrubber Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-medium text-cyan-400 min-w-[50px]">
            {formatTime(currentTime)}
          </span>

          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={totalDuration || 10}
              step={0.05}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition-all"
            />
          </div>

          <span className="text-xs font-mono font-medium text-slate-400 min-w-[50px] text-right">
            {formatTime(totalDuration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          {/* Left Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onSeek(0)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
              title="Kembali ke awal"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => onSeek(Math.max(0, currentTime - 2))}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
              title="Mundur 2 Detik"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              className={`p-2 rounded-xl flex items-center justify-center font-bold text-white transition-all transform active:scale-95 shadow-md ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/25'
              }`}
              title={isPlaying ? 'Jeda Video' : 'Putar Video'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => onSeek(Math.min(totalDuration, currentTime + 2))}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
              title="Maju 2 Detik"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`p-1.5 rounded-lg transition-all ${
                isLooping ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'hover:bg-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={isLooping ? 'Looping Aktif' : 'Looping Non-aktif'}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Center Info: Active Scene Indicator */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">
              {activeSceneInfo ? `${activeSceneInfo.currentScene.title}` : 'CineAI Ready'}
            </span>
          </div>

          {/* Right Buttons: Subtitles, Speed, Fullscreen */}
          <div className="flex items-center gap-1.5 relative">
            {/* Subtitle Style Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSubtitleMenu(!showSubtitleMenu)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-all"
                title="Gaya Subtitle / Kinetik Kapsi"
              >
                <Type className="w-3.5 h-3.5 text-cyan-400" />
                <span className="capitalize">{project.subtitleStyle.replace('_', ' ')}</span>
              </button>

              {showSubtitleMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-56 bg-slate-900 border border-slate-800 rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Gaya Animasi Subtitle
                  </div>
                  {subtitleStyles.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onUpdateSubtitleStyle(item.id);
                        setShowSubtitleMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex flex-col ${
                        project.subtitleStyle === item.id
                          ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="text-[10px] text-slate-500">{item.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Speed Selector */}
            <button
              onClick={() => {
                const speeds = [0.5, 1.0, 1.5, 2.0];
                const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
                onChangeSpeed(speeds[nextIdx]);
              }}
              className="px-2 py-1 text-xs font-mono font-medium rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-all"
              title="Kecepatan Putar (Playback Speed)"
            >
              {playbackSpeed}x
            </button>

            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
              title="Layar Penuh"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
