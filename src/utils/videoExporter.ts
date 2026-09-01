import { VideoProject, Scene } from '../types.ts';
import { drawSceneFrame, preloadAllSceneImages } from './videoCanvasRenderer.ts';

export interface RenderProgressCallback {
  (progress: number, currentSceneIndex: number, totalScenes: number, statusText: string): void;
}

export async function exportVideoToFile(
  project: VideoProject,
  onProgress?: RenderProgressCallback
): Promise<Blob> {
  const is1080p = project.exportSettings?.resolution === '1080p';
  const width = is1080p ? 1920 : 1280;
  const height = is1080p ? 1080 : 720;
  const fps = project.exportSettings?.fps || 30;

  // Preload all scene images
  onProgress?.(0.05, 0, project.scenes.length, 'Menyiapkan aset visual & gambar...');
  preloadAllSceneImages(project.scenes);
  await new Promise((r) => setTimeout(r, 600));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D Context tidak tersedia.');

  // Create Audio Context for BGM & synthesizer mixing
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const dest = audioContext.createMediaStreamDestination();

  // Try to load BGM if available
  let bgmBuffer: AudioBuffer | null = null;
  if (project.audioTrack?.musicUrl) {
    try {
      const resp = await fetch(project.audioTrack.musicUrl);
      const arrayBuf = await resp.arrayBuffer();
      bgmBuffer = await audioContext.decodeAudioData(arrayBuf);
    } catch (err) {
      console.warn('Could not decode BGM audio for export:', err);
    }
  }

  let bgmSource: AudioBufferSourceNode | null = null;
  if (bgmBuffer) {
    bgmSource = audioContext.createBufferSource();
    bgmSource.buffer = bgmBuffer;
    bgmSource.loop = true;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = (project.audioTrack.volume || 30) / 100 * 0.4;
    bgmSource.connect(gainNode);
    gainNode.connect(dest);
  }

  // Setup MediaRecorder
  const canvasStream = canvas.captureStream(fps);
  if (dest.stream.getAudioTracks().length > 0) {
    canvasStream.addTrack(dest.stream.getAudioTracks()[0]);
  }

  const mimeTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  let selectedMime = '';
  for (const m of mimeTypes) {
    if (MediaRecorder.isTypeSupported(m)) {
      selectedMime = m;
      break;
    }
  }

  const recorder = new MediaRecorder(canvasStream, {
    mimeType: selectedMime || undefined,
    videoBitsPerSecond: is1080p ? 5000000 : 2500000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const totalDuration = project.scenes.reduce((acc, s) => acc + s.duration, 0) || 30;
  const totalFrames = Math.round(totalDuration * fps);

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      if (bgmSource) {
        try { bgmSource.stop(); } catch (e) {}
      }
      audioContext.close().catch(() => {});
      const blob = new Blob(chunks, { type: selectedMime || 'video/webm' });
      resolve(blob);
    };

    recorder.onerror = (e) => {
      reject(e);
    };

    recorder.start(100);
    if (bgmSource) bgmSource.start(0);

    let frameIndex = 0;
    let currentTotalTime = 0;
    const timeStep = 1 / fps;

    function renderNextBatch() {
      // Render 5 frames per RAF batch for smooth rendering performance
      for (let i = 0; i < 5; i++) {
        if (frameIndex >= totalFrames) {
          recorder.stop();
          return;
        }

        // Determine current scene
        let accumTime = 0;
        let activeScene = project.scenes[0];
        let sceneIndex = 0;
        let sceneTime = 0;

        for (let sIdx = 0; sIdx < project.scenes.length; sIdx++) {
          const sc = project.scenes[sIdx];
          if (currentTotalTime >= accumTime && currentTotalTime <= accumTime + sc.duration) {
            activeScene = sc;
            sceneIndex = sIdx;
            sceneTime = currentTotalTime - accumTime;
            break;
          }
          accumTime += sc.duration;
        }

        drawSceneFrame(ctx!, {
          scene: activeScene,
          sceneTime,
          totalVideoTime: currentTotalTime,
          project,
          width,
          height,
        });

        frameIndex++;
        currentTotalTime += timeStep;
      }

      const progress = frameIndex / totalFrames;
      onProgress?.(
        progress,
        Math.min(project.scenes.length, Math.floor(progress * project.scenes.length) + 1),
        project.scenes.length,
        `Me-render frame ${frameIndex} / ${totalFrames} (${Math.round(progress * 100)}%)...`
      );

      requestAnimationFrame(renderNextBatch);
    }

    renderNextBatch();
  });
}
