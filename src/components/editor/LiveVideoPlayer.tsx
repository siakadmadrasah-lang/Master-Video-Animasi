import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Subtitles, 
  HelpCircle,
  Sparkles,
  Repeat
} from 'lucide-react';
import { VideoProject, Scene } from '../../types.ts';
import { drawSceneFrame, preloadAllSceneImages } from '../../utils/videoCanvasRenderer.ts';
import { 
  speakNarrationBrowser, 
  stopAllAudio, 
  playBgmAudio, 
  pauseBgmAudio, 
  resumeBgmAudio, 
  setBgmVolume,
  setMuteState
} from '../../utils/audioSynth.ts';

interface LiveVideoPlayerProps {
  project: VideoProject;
  activeSceneIndex: number;
  onSceneChange: (index: number) => void;
  onProjectUpdate?: (updated: VideoProject) => void;
}

export const LiveVideoPlayer: React.FC<LiveVideoPlayerProps> = ({
  project,
  activeSceneIndex,
  onSceneChange,
  onProjectUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);

  const totalDuration = project.totalDurationSeconds || 
    project.scenes.reduce((acc, s) => acc + s.duration, 0) || 60;

  // Calculate which scene corresponds to a given total timestamp
  const getSceneAtTime = useCallback(
    (time: number): { scene: Scene; sceneIndex: number; sceneTime: number } => {
      let accum = 0;
      for (let i = 0; i < project.scenes.length; i++) {
        const sc = project.scenes[i];
        if (time >= accum && time < accum + sc.duration) {
          return { scene: sc, sceneIndex: i, sceneTime: time - accum };
        }
        accum += sc.duration;
      }
      const lastIdx = project.scenes.length - 1;
      const lastScene = project.scenes[lastIdx];
      return { scene: lastScene, sceneIndex: lastIdx, sceneTime: lastScene ? lastScene.duration : 0 };
    },
    [project.scenes]
  );

  // Preload images whenever scenes change
  useEffect(() => {
    preloadAllSceneImages(project.scenes);
  }, [project.scenes]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopAllAudio();
    } else {
      if (currentTime >= totalDuration) {
        setCurrentTime(0);
      }
      setIsPlaying(true);
      if (!isMuted) {
        playBgmAudio(undefined, project.audioTrack?.volume || 30, true);
        const { scene, sceneTime } = getSceneAtTime(currentTime >= totalDuration ? 0 : currentTime);
        if (scene?.narration && sceneTime < 1.0) {
          lastSpokenSceneRef.current = activeSceneIndex;
          speakNarrationBrowser(scene.narration, {
            gender: project.voiceConfig?.gender || 'female',
            speed: project.voiceConfig?.speed || 1.0,
            pitch: project.voiceConfig?.pitch || 1.0,
          });
        }
      }
    }
  };

  // Playback timer loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const renderLoop = (now: number) => {
      const delta = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + delta;
          if (next >= totalDuration) {
            if (isLooping) {
              return 0;
            } else {
              setIsPlaying(false);
              stopAllAudio();
              return totalDuration;
            }
          }
          return next;
        });
      }

      // Render frame to canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const { scene, sceneIndex, sceneTime } = getSceneAtTime(currentTime);

          if (sceneIndex !== activeSceneIndex && isPlaying) {
            onSceneChange(sceneIndex);
          }

          drawSceneFrame(ctx, {
            scene: scene || project.scenes[0],
            sceneTime,
            totalVideoTime: currentTime,
            project,
            width: canvas.width,
            height: canvas.height,
            interactiveQuizSelected: scene?.sceneType === 'quiz' ? selectedQuizOption : null,
          });
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, currentTime, totalDuration, activeSceneIndex, project, getSceneAtTime, onSceneChange, isLooping, selectedQuizOption]);

  // Synchronize Narration Speech Synthesis when entering a new scene during playback
  const lastSpokenSceneRef = useRef<number>(-1);
  useEffect(() => {
    if (!isPlaying || isMuted) return;

    const { scene, sceneIndex, sceneTime } = getSceneAtTime(currentTime);
    if (sceneIndex !== lastSpokenSceneRef.current && sceneTime < 0.5) {
      lastSpokenSceneRef.current = sceneIndex;
      if (scene?.narration) {
        speakNarrationBrowser(scene.narration, {
          gender: project.voiceConfig?.gender || 'female',
          speed: project.voiceConfig?.speed || 1.0,
          pitch: project.voiceConfig?.pitch || 1.0,
        });
      }
    }
  }, [currentTime, isPlaying, isMuted, getSceneAtTime, project.voiceConfig]);

  // Jump to specific scene when activeSceneIndex prop changes from timeline
  useEffect(() => {
    let accum = 0;
    for (let i = 0; i < activeSceneIndex; i++) {
      accum += project.scenes[i]?.duration || 10;
    }
    setCurrentTime(accum);
    setSelectedQuizOption(null);
  }, [activeSceneIndex, project.scenes]);

  const seekTo = (newTime: number) => {
    const clamped = Math.max(0, Math.min(totalDuration, newTime));
    setCurrentTime(clamped);
    const { sceneIndex } = getSceneAtTime(clamped);
    onSceneChange(sceneIndex);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Format MM:SS
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const { scene: activeScene, sceneIndex } = getSceneAtTime(currentTime);

  return (
    <div 
      ref={containerRef}
      className="flex flex-col rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl"
    >
      {/* 16:9 Canvas Stage */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center group overflow-hidden">
        
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full h-full object-contain"
        />

        {/* Quick Quiz Interactive Overlay (if active scene is quiz) */}
        {activeScene?.sceneType === 'quiz' && activeScene.quizQuestion && (
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-slate-900/90 p-2.5 rounded-2xl border border-pink-500/40 backdrop-blur-md">
            <span className="text-[10px] font-bold text-pink-300 flex items-center gap-1">
              <HelpCircle className="h-3 w-3" /> Uji Jawaban Kuis:
            </span>
            <div className="flex gap-1">
              {activeScene.quizQuestion.options.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedQuizOption(idx)}
                  className={`h-6 w-6 rounded-lg text-xs font-bold transition-all ${
                    selectedQuizOption === idx
                      ? idx === activeScene.quizQuestion?.correctIndex
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                        : 'bg-rose-600 text-white ring-2 ring-rose-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Intro Overlay Prompt */}
        {activeScene?.sceneType === 'intro' && !isPlaying && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={togglePlay}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-xl hover:scale-105 active:scale-95 transition-all ring-2 ring-amber-300"
            >
              <Sparkles className="h-4 w-4 text-yellow-200" />
              Mulai Belajar Interaktif
            </button>
          </div>
        )}

        {/* Interactive Outro Replay Overlay */}
        {activeScene?.sceneType === 'outro' && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            <button
              onClick={() => {
                seekTo(0);
                setIsPlaying(true);
              }}
              className="flex items-center gap-1.5 rounded-full bg-sky-600/90 backdrop-blur-md px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-sky-500 active:scale-95 transition-all ring-1 ring-sky-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Putar Ulang Video
            </button>
          </div>
        )}

        {/* Center Big Play Button when paused */}
        {!isPlaying && activeScene?.sceneType !== 'intro' && (
          <div 
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-xs cursor-pointer transition-opacity"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600/90 text-white shadow-2xl ring-4 ring-white/20 hover:scale-110 active:scale-95 transition-all">
              <Play className="h-7 w-7 ml-1 fill-white" />
            </div>
          </div>
        )}

      </div>

      {/* Control Bar */}
      <div className="border-t border-slate-800 bg-slate-900/90 p-3 sm:p-4 space-y-2">
        
        {/* Progress Scrubber */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono font-bold text-slate-400">
            {formatTime(currentTime)}
          </span>

          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={totalDuration}
              step={0.1}
              value={currentTime}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-2 transition-all"
            />
          </div>

          <span className="text-[11px] font-mono font-bold text-slate-400">
            {formatTime(totalDuration)}
          </span>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-2 pt-1">
          
          {/* Left: Playback & Scene indicator */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            <button
              onClick={togglePlay}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all"
              title={isPlaying ? 'Jeda Video' : 'Putar Video'}
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-white" /> : <Play className="h-4 w-4 ml-0.5 fill-white" />}
            </button>

            <button
              onClick={() => seekTo(currentTime - 5)}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              title="Mundur 5 Detik"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              onClick={() => seekTo(currentTime + 5)}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              title="Maju 5 Detik"
            >
              <RotateCw className="h-4 w-4" />
            </button>

            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800">
              <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[11px] font-bold text-indigo-300">
                Scene {sceneIndex + 1} / {project.scenes.length}
              </span>
              <span className="text-xs font-semibold text-slate-300 truncate max-w-[180px]">
                {activeScene?.title || `Scene ${sceneIndex + 1}`}
              </span>
            </div>

          </div>

          {/* Right: Sound, Subtitles & Fullscreen */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Subtitle Toggle */}
            <button
              onClick={() => {
                if (onProjectUpdate) {
                  onProjectUpdate({
                    ...project,
                    subtitleConfig: {
                      ...project.subtitleConfig,
                      enabled: !project.subtitleConfig?.enabled,
                    },
                  });
                }
              }}
              title="Toggle Subtitle"
              className={`rounded-xl p-2 text-xs font-bold transition-all ${
                project.subtitleConfig?.enabled
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
              }`}
            >
              <Subtitles className="h-4 w-4" />
            </button>

            {/* Loop Toggle */}
            <button
              onClick={() => setIsLooping(!isLooping)}
              title="Ulangi Otomatis (Loop)"
              className={`rounded-xl p-2 text-xs font-bold transition-all ${
                isLooping
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
              }`}
            >
              <Repeat className="h-4 w-4" />
            </button>

            {/* Mute/Volume */}
            <button
              onClick={() => {
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                setMuteState(nextMuted);
              }}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              title="Layar Penuh"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};
