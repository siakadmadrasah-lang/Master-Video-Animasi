// Video Rendering & Synchronized Audio Exporter
// Dev Jaenal Maskun • MI Ma'arif NU 2 Sanggreman

import { VideoProject } from '../types.ts';
import { drawSceneFrame, preloadAllSceneImages } from './videoCanvasRenderer.ts';
import { buildProjectMasterAudioBuffer } from './audioSynth.ts';

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
  const fps = Math.min(30, project.exportSettings?.fps || 30);

  // 1. Preload all scene images
  onProgress?.(0.05, 0, project.scenes.length, 'Menyiapkan aset visual & gambar ilustrasi...');
  preloadAllSceneImages(project.scenes);
  await new Promise((r) => setTimeout(r, 400));

  // 2. Setup Canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D Context tidak tersedia.');

  // 3. Build & Mix Master Synchronized Audio (Voice Narrations + BGM)
  onProgress?.(0.12, 0, project.scenes.length, 'Melakukan sintesis audio suara narasi & musik latar...');
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioContext.state === 'suspended') {
    await audioContext.resume().catch(() => {});
  }

  const dest = audioContext.createMediaStreamDestination();
  const masterAudioBuffer = await buildProjectMasterAudioBuffer(project, audioContext, (status) => {
    onProgress?.(0.25, 0, project.scenes.length, status);
  });

  // Connect Master Audio Buffer Source to destination
  const masterAudioSource = audioContext.createBufferSource();
  masterAudioSource.buffer = masterAudioBuffer;
  masterAudioSource.connect(dest);

  // 4. Setup MediaStream and MediaRecorder
  const canvasStream = canvas.captureStream(fps);
  const audioTracks = dest.stream.getAudioTracks();
  if (audioTracks.length > 0) {
    canvasStream.addTrack(audioTracks[0]);
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
    videoBitsPerSecond: is1080p ? 4500000 : 2500000,
    audioBitsPerSecond: 192000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const totalDuration = project.totalDurationSeconds ||
    project.scenes.reduce((acc, s) => acc + s.duration, 0) || 30;

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      try { masterAudioSource.stop(); } catch (_) {}
      audioContext.close().catch(() => {});
      const blob = new Blob(chunks, { type: selectedMime || 'video/webm' });
      resolve(blob);
    };

    recorder.onerror = (e) => {
      try { masterAudioSource.stop(); } catch (_) {}
      audioContext.close().catch(() => {});
      reject(e);
    };

    // Draw initial frame 0
    drawSceneFrame(ctx!, {
      scene: project.scenes[0],
      sceneTime: 0,
      totalVideoTime: 0,
      project,
      width,
      height,
    });

    // Start recording & audio
    recorder.start(100);
    masterAudioSource.start(0);

    const startTime = performance.now();
    let isFinished = false;

    function renderFrame(now: number) {
      if (isFinished) return;

      const elapsed = (now - startTime) / 1000;
      const currentTotalTime = Math.min(totalDuration, elapsed);

      // Determine current scene
      let accumTime = 0;
      let activeScene = project.scenes[0];
      let sceneIndex = 0;
      let sceneTime = 0;

      for (let sIdx = 0; sIdx < project.scenes.length; sIdx++) {
        const sc = project.scenes[sIdx];
        if (currentTotalTime >= accumTime && currentTotalTime < accumTime + sc.duration) {
          activeScene = sc;
          sceneIndex = sIdx;
          sceneTime = currentTotalTime - accumTime;
          break;
        }
        accumTime += sc.duration;
      }

      if (currentTotalTime >= totalDuration) {
        activeScene = project.scenes[project.scenes.length - 1];
        sceneIndex = project.scenes.length - 1;
        sceneTime = activeScene ? activeScene.duration : 0;
      }

      // Draw synchronized frame
      drawSceneFrame(ctx!, {
        scene: activeScene,
        sceneTime,
        totalVideoTime: currentTotalTime,
        project,
        width,
        height,
      });

      const progress = Math.min(1.0, currentTotalTime / totalDuration);
      onProgress?.(
        progress,
        sceneIndex + 1,
        project.scenes.length,
        `Me-render & menyinkronkan video + audio (${Math.round(progress * 100)}%)...`
      );

      if (elapsed >= totalDuration + 0.3) {
        isFinished = true;
        onProgress?.(1.0, project.scenes.length, project.scenes.length, 'Finalisasi berkas video...');
        setTimeout(() => {
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
        }, 200);
        return;
      }

      requestAnimationFrame(renderFrame);
    }

    requestAnimationFrame(renderFrame);
  });
}
