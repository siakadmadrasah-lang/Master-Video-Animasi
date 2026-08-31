import { Project, Scene, SubtitleStyle } from '../types';
import { videoAudioMixer } from './videoAudioMixer';

export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  project: Project;
  currentTime: number; // in seconds
  totalDuration: number;
}

export class VideoRenderer {
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private loadingImages: Set<string> = new Set();
  private particles: Array<{ x: number; y: number; size: number; speedX: number; speedY: number; alpha: number }> = [];

  constructor() {
    this.initParticles();
  }

  private initParticles() {
    this.particles = [];
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: Math.random(),
        y: Math.random(),
        size: 1 + Math.random() * 3,
        speedX: (Math.random() - 0.5) * 0.05,
        speedY: -0.02 - Math.random() * 0.04,
        alpha: 0.2 + Math.random() * 0.6,
      });
    }
  }

  // Preload an image URL
  public preloadImage(url: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(url)) {
      return Promise.resolve(this.imageCache.get(url)!);
    }
    return new Promise((resolve) => {
      if (this.loadingImages.has(url)) {
        const check = setInterval(() => {
          if (this.imageCache.has(url)) {
            clearInterval(check);
            resolve(this.imageCache.get(url)!);
          }
        }, 100);
        return;
      }
      this.loadingImages.add(url);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(url, img);
        this.loadingImages.delete(url);
        resolve(img);
      };
      img.onerror = () => {
        this.loadingImages.delete(url);
        // Fallback placeholder image
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = 1280;
        fallbackCanvas.height = 720;
        const fctx = fallbackCanvas.getContext('2d')!;
        fctx.fillStyle = '#0f172a';
        fctx.fillRect(0, 0, 1280, 720);
        fctx.fillStyle = '#38bdf8';
        fctx.font = 'bold 36px sans-serif';
        fctx.textAlign = 'center';
        fctx.fillText('CineAI Studio Visual Media', 640, 360);
        const fallbackImg = new Image();
        fallbackImg.src = fallbackCanvas.toDataURL();
        fallbackImg.onload = () => {
          this.imageCache.set(url, fallbackImg);
          resolve(fallbackImg);
        };
      };
      img.src = url;
    });
  }

  // Calculate project total duration and scene time boundaries
  public getTimelineInfo(project: Project) {
    let accumulatedTime = 0;
    const sceneBoundaries: Array<{
      scene: Scene;
      index: number;
      startTime: number;
      endTime: number;
      duration: number;
    }> = [];

    project.scenes.forEach((scene, index) => {
      const dur = scene.duration || 4.0;
      const startTime = accumulatedTime;
      const endTime = accumulatedTime + dur;
      sceneBoundaries.push({
        scene,
        index,
        startTime,
        endTime,
        duration: dur,
      });
      accumulatedTime = endTime;
    });

    return {
      totalDuration: Math.max(0.1, accumulatedTime),
      scenes: sceneBoundaries,
    };
  }

  // Find active scene at given timestamp
  public getActiveSceneAtTime(project: Project, time: number) {
    const { scenes, totalDuration } = this.getTimelineInfo(project);
    const clampedTime = Math.max(0, Math.min(time, totalDuration));

    for (let i = 0; i < scenes.length; i++) {
      const s = scenes[i];
      if (clampedTime >= s.startTime && (clampedTime < s.endTime || i === scenes.length - 1)) {
        const nextScene = scenes[i + 1] ? scenes[i + 1].scene : null;
        const transitionDuration = s.scene.transitionDuration || 0.6;
        const timeUntilEnd = s.endTime - clampedTime;
        const isInTransition = nextScene && timeUntilEnd <= transitionDuration && s.scene.transition !== 'none';
        const transitionProgress = isInTransition ? 1 - timeUntilEnd / transitionDuration : 0;

        return {
          currentScene: s.scene,
          currentIndex: s.index,
          nextScene,
          sceneStartTime: s.startTime,
          sceneEndTime: s.endTime,
          sceneDuration: s.duration,
          sceneLocalTime: clampedTime - s.startTime,
          sceneProgress: (clampedTime - s.startTime) / s.duration,
          isInTransition,
          transitionProgress,
          transitionType: s.scene.transition,
        };
      }
    }

    return null;
  }

  // Main Render Frame
  public renderFrame(
    canvas: HTMLCanvasElement,
    project: Project,
    currentTime: number
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    if (!project.scenes || project.scenes.length === 0) {
      this.renderEmptyState(ctx, width, height);
      return;
    }

    const sceneInfo = this.getActiveSceneAtTime(project, currentTime);
    if (!sceneInfo) return;

    const {
      currentScene,
      nextScene,
      sceneProgress,
      isInTransition,
      transitionProgress,
      transitionType,
      sceneLocalTime,
    } = sceneInfo;

    // 1. Render Base Scene (Image + Camera Motion)
    this.renderSceneVisual(ctx, width, height, currentScene, sceneProgress, sceneLocalTime);

    // 2. Render Transition if transitioning to next scene
    if (isInTransition && nextScene) {
      this.renderTransition(
        ctx,
        width,
        height,
        currentScene,
        nextScene,
        transitionType,
        transitionProgress,
        sceneLocalTime
      );
    }

    // 3. Apply Cinematic Color Grading Filter
    this.applyColorGrading(ctx, width, height, currentScene.colorGrade);

    // 4. Apply Cinematic Overlays (Film Grain, Lens Flare, VHS, etc.)
    this.applyOverlayEffects(ctx, width, height, currentScene.effectOverlay, sceneLocalTime);

    // 5. Apply Letterboxing (2.39:1 Cinema Bar or Aspect Ratio Mask)
    if (project.letterbox) {
      this.applyLetterbox(ctx, width, height, project.aspectRatio);
    }

    // 6. Render Subtitles / Kinetic Captions
    if (currentScene.subtitle) {
      this.renderSubtitles(
        ctx,
        width,
        height,
        currentScene.subtitle,
        project.subtitleStyle,
        sceneProgress,
        currentScene.title
      );
    }
  }

  // Render Scene Media with Dynamic Camera Motion
  private renderSceneVisual(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scene: Scene,
    progress: number,
    time: number
  ) {
    const img = this.imageCache.get(scene.mediaUrl);

    ctx.save();

    // Compute Camera Motion Transform
    let scale = 1.0;
    let translateX = 0;
    let translateY = 0;
    let rotate = 0;

    const motion = scene.cameraMotion || 'zoom_in';

    switch (motion) {
      case 'zoom_in':
        scale = 1.0 + progress * 0.18; // smooth 1.0 to 1.18x
        break;
      case 'zoom_out':
        scale = 1.2 - progress * 0.18; // smooth 1.20 to 1.02x
        break;
      case 'pan_left':
        scale = 1.15;
        translateX = (1 - progress) * (width * 0.08) - width * 0.04;
        break;
      case 'pan_right':
        scale = 1.15;
        translateX = progress * (width * 0.08) - width * 0.04;
        break;
      case 'tilt_up':
        scale = 1.15;
        translateY = (1 - progress) * (height * 0.08) - height * 0.04;
        break;
      case 'drone_forward':
        scale = 1.0 + progress * 0.25;
        translateY = (progress - 0.5) * (height * 0.04);
        break;
      case 'orbit':
        scale = 1.15;
        rotate = Math.sin(progress * Math.PI) * 0.02;
        translateX = Math.sin(progress * Math.PI * 2) * (width * 0.03);
        break;
      case 'handheld_shake':
        scale = 1.08;
        translateX = Math.sin(time * 8.5) * 4 + Math.cos(time * 12.3) * 3;
        translateY = Math.cos(time * 7.2) * 3 + Math.sin(time * 14.1) * 2;
        rotate = Math.sin(time * 5.0) * 0.005;
        break;
      case 'static':
      default:
        scale = 1.0;
        break;
    }

    // Apply transform centered
    ctx.translate(width / 2 + translateX, height / 2 + translateY);
    if (rotate !== 0) ctx.rotate(rotate);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);

    if (img && img.complete) {
      // Draw image to cover aspect ratio
      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;
      let drawW = width;
      let drawH = height;
      let drawX = 0;
      let drawY = 0;

      if (imgAspect > canvasAspect) {
        drawH = height;
        drawW = height * imgAspect;
        drawX = (width - drawW) / 2;
      } else {
        drawW = width;
        drawH = width / imgAspect;
        drawY = (height - drawH) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    } else {
      // Procedural fallback gradient background while loading
      this.renderProceduralBackground(ctx, width, height, scene, time);
      this.preloadImage(scene.mediaUrl);
    }

    ctx.restore();
  }

  // Procedural futuristic backdrop
  private renderProceduralBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scene: Scene,
    time: number
  ) {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#030712');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Glowing grid / energy lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Title label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(scene.title || 'Generating Cinematic Scene...', width / 2, height / 2 - 20);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(scene.visualDescription?.slice(0, 80) || 'AI Visual Loading', width / 2, height / 2 + 20);
  }

  // Render High-Tech Cinematic Transitions
  private renderTransition(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    currentScene: Scene,
    nextScene: Scene,
    type: string,
    p: number, // 0 to 1
    time: number
  ) {
    const nextImg = this.imageCache.get(nextScene.mediaUrl);

    switch (type) {
      case 'whip_pan': {
        // Fast directional motion blur swipe
        const offsetX = -p * width;
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.globalAlpha = Math.sin(p * Math.PI) * 0.4;
        ctx.fillRect(0, 0, width, height);

        // Draw next scene sliding in from right with motion blur streaks
        if (nextImg && nextImg.complete) {
          ctx.globalAlpha = p;
          ctx.drawImage(nextImg, width + offsetX, 0, width, height);
        }

        // Motion streaks
        ctx.globalAlpha = Math.sin(p * Math.PI) * 0.35;
        ctx.fillStyle = '#38bdf8';
        for (let i = 0; i < 5; i++) {
          ctx.fillRect(0, height * (0.2 * i + 0.1), width, 4);
        }
        ctx.restore();
        break;
      }

      case 'film_burn': {
        // Warm 35mm film burn light leak flash
        ctx.save();
        if (nextImg && nextImg.complete) {
          ctx.globalAlpha = p;
          ctx.drawImage(nextImg, 0, 0, width, height);
        }

        const burnP = Math.sin(p * Math.PI);
        const burnGrad = ctx.createRadialGradient(
          width * (0.3 + p * 0.4),
          height * 0.5,
          10,
          width * 0.5,
          height * 0.5,
          width * 0.8
        );
        burnGrad.addColorStop(0, `rgba(255, 240, 180, ${burnP * 0.9})`);
        burnGrad.addColorStop(0.3, `rgba(255, 120, 30, ${burnP * 0.8})`);
        burnGrad.addColorStop(0.7, `rgba(220, 38, 38, ${burnP * 0.6})`);
        burnGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = burnGrad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        break;
      }

      case 'glitch': {
        // Digital RGB split & scanline slice transition
        ctx.save();
        const glitchP = Math.sin(p * Math.PI);
        if (p > 0.5 && nextImg && nextImg.complete) {
          ctx.drawImage(nextImg, 0, 0, width, height);
        }

        // RGB Split
        const shift = glitchP * 30;
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(255, 0, 80, 0.4)';
        ctx.fillRect(-shift, 0, width, height);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.fillRect(shift, 0, width, height);

        // Random horizontal slice blocks
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 6; i++) {
          const sliceY = (Math.sin(time * 20 + i) * 0.5 + 0.5) * height;
          const sliceH = 8 + Math.random() * 16;
          ctx.fillRect(0, sliceY, width, sliceH);
        }
        ctx.restore();
        break;
      }

      case 'zoom_rush': {
        // Rapid zoom into next scene
        ctx.save();
        ctx.globalAlpha = p;
        if (nextImg && nextImg.complete) {
          const scale = 1.6 - p * 0.6;
          ctx.translate(width / 2, height / 2);
          ctx.scale(scale, scale);
          ctx.translate(-width / 2, -height / 2);
          ctx.drawImage(nextImg, 0, 0, width, height);
        }
        ctx.restore();
        break;
      }

      case 'flash_white': {
        // High-contrast photographic white strobe
        ctx.save();
        if (p > 0.4 && nextImg && nextImg.complete) {
          ctx.drawImage(nextImg, 0, 0, width, height);
        }
        const flashAlpha = Math.sin(p * Math.PI) * 0.95;
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        break;
      }

      case 'fade_black': {
        // Dramatic blackout fade
        ctx.save();
        if (p > 0.5 && nextImg && nextImg.complete) {
          ctx.drawImage(nextImg, 0, 0, width, height);
        }
        const blackAlpha = Math.sin(p * Math.PI) * 0.95;
        ctx.fillStyle = `rgba(0, 0, 0, ${blackAlpha})`;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        break;
      }

      case 'cross_dissolve':
      default: {
        // Smooth alpha dissolve
        if (nextImg && nextImg.complete) {
          ctx.save();
          ctx.globalAlpha = p;
          ctx.drawImage(nextImg, 0, 0, width, height);
          ctx.restore();
        }
        break;
      }
    }
  }

  // Cinematic Color Grading LUT Simulation
  private applyColorGrading(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    preset: string
  ) {
    if (!preset || preset === 'natural') return;

    ctx.save();
    switch (preset) {
      case 'teal_orange': {
        // Hollywood Blockbuster: Teal shadows, Orange highlights
        ctx.globalCompositeOperation = 'soft-light';
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, 'rgba(0, 180, 216, 0.45)');
        grad.addColorStop(1, 'rgba(247, 127, 0, 0.45)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case 'cyberpunk': {
        // Neon Magenta & Electric Cyan
        ctx.globalCompositeOperation = 'color-dodge';
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, 'rgba(217, 70, 239, 0.25)');
        grad.addColorStop(1, 'rgba(6, 182, 212, 0.25)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case 'kodak_film': {
        // Vintage 35mm warm nostalgic golden tones
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = 'rgba(234, 179, 8, 0.22)';
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case 'noir': {
        // High contrast dramatic monochrome
        ctx.globalCompositeOperation = 'color';
        ctx.fillStyle = 'rgba(128, 128, 128, 1.0)';
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case 'matrix': {
        // Sci-Fi Emerald phosphor green
        ctx.globalCompositeOperation = 'soft-light';
        ctx.fillStyle = 'rgba(34, 197, 94, 0.45)';
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case 'golden_hour': {
        // Sunset warmth & soft bloom
        ctx.globalCompositeOperation = 'hard-light';
        ctx.fillStyle = 'rgba(251, 146, 60, 0.2)';
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case 'hdr_vivid': {
        // High saturation punch
        ctx.globalCompositeOperation = 'saturation';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(0, 0, width, height);
        break;
      }
    }
    ctx.restore();
  }

  // Visual Overlays (Film Grain, Lens Flare, VHS, Light Leaks, Dust Particles)
  private applyOverlayEffects(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    overlay: string,
    time: number
  ) {
    // 1. Subtle natural vignette (always adds cinematic depth)
    ctx.save();
    const vigGrad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.38,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.75
    );
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    if (!overlay || overlay === 'none') return;

    ctx.save();
    switch (overlay) {
      case 'film_grain': {
        // 35mm dynamic grain noise
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const grainAmount = 14;
        for (let i = 0; i < data.length; i += 16) {
          const noise = (Math.random() - 0.5) * grainAmount;
          data[i] = Math.min(255, Math.max(0, data[i] + noise));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
        ctx.putImageData(imgData, 0, 0);
        break;
      }

      case 'lens_flare': {
        // Anamorphic horizontal blue streak + central starburst
        ctx.globalCompositeOperation = 'screen';
        const flareX = width * (0.3 + Math.sin(time * 0.8) * 0.2);
        const flareY = height * 0.35;

        // Horizontal blue anamorphic streak
        const streakGrad = ctx.createLinearGradient(0, flareY, width, flareY);
        streakGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        streakGrad.addColorStop(flareX / width, 'rgba(56, 189, 248, 0.65)');
        streakGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = streakGrad;
        ctx.fillRect(0, flareY - 3, width, 6);

        // Radial glow
        const glow = ctx.createRadialGradient(flareX, flareY, 5, flareX, flareY, 140);
        glow.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        glow.addColorStop(0.4, 'rgba(56, 189, 248, 0.4)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(flareX, flareY, 140, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'vhs': {
        // Retro 80s tape scanlines + timestamp
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        for (let y = 0; y < height; y += 4) {
          ctx.fillRect(0, y, width, 1.5);
        }

        // VHS REC dot & timestamp
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillStyle = Math.floor(time * 2) % 2 === 0 ? '#ef4444' : 'transparent';
        ctx.fillText('● REC', 40, 50);

        ctx.fillStyle = '#22c55e';
        const mins = Math.floor(time / 60).toString().padStart(2, '0');
        const secs = Math.floor(time % 60).toString().padStart(2, '0');
        const frames = Math.floor((time % 1) * 30).toString().padStart(2, '0');
        ctx.fillText(`PLAY SP [${mins}:${secs}:${frames}]`, 40, 80);
        ctx.fillText('AUTO TRACKING', width - 200, 50);
        break;
      }

      case 'light_leak': {
        // Soft pulsing ambient light leak
        ctx.globalCompositeOperation = 'screen';
        const leakGrad = ctx.createRadialGradient(
          width * 0.85,
          height * 0.15,
          20,
          width * 0.7,
          height * 0.3,
          width * 0.6
        );
        const pulse = 0.5 + Math.sin(time * 2.0) * 0.25;
        leakGrad.addColorStop(0, `rgba(251, 146, 60, ${pulse * 0.7})`);
        leakGrad.addColorStop(0.5, `rgba(244, 63, 94, ${pulse * 0.4})`);
        leakGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = leakGrad;
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case 'particles': {
        // Floating cinematic bokeh / dust embers
        ctx.globalCompositeOperation = 'screen';
        this.particles.forEach((p) => {
          p.y += p.speedY;
          p.x += p.speedX;
          if (p.y < 0) p.y = 1;
          if (p.x < 0) p.x = 1;
          if (p.x > 1) p.x = 0;

          ctx.fillStyle = `rgba(253, 224, 71, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x * width, p.y * height, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }
    }
    ctx.restore();
  }

  // 2.39:1 / Aspect Ratio Cinema Bars
  private applyLetterbox(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    aspectRatio: string
  ) {
    ctx.save();
    ctx.fillStyle = '#000000';

    if (aspectRatio === '16:9' || aspectRatio === '21:9') {
      const barHeight = height * 0.08;
      ctx.fillRect(0, 0, width, barHeight);
      ctx.fillRect(0, height - barHeight, width, barHeight);
    }
    ctx.restore();
  }

  // Kinetic Typography Subtitles
  private renderSubtitles(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    text: string,
    style: SubtitleStyle,
    progress: number,
    sceneTitle?: string
  ) {
    if (!text) return;

    ctx.save();
    const isPortrait = height > width;
    const baseFontSize = isPortrait ? Math.max(22, width * 0.055) : Math.max(26, width * 0.032);
    const bottomMargin = height * (isPortrait ? 0.22 : 0.16);

    switch (style) {
      case 'karaoke': {
        // Word-by-word active highlight
        const words = text.split(' ');
        const activeWordIndex = Math.min(words.length - 1, Math.floor(progress * words.length));

        ctx.font = `900 ${baseFontSize}px "Montserrat", sans-serif`;
        ctx.textAlign = 'center';

        // Measure total width to center background pill
        const fullText = text;
        const textMetrics = ctx.measureText(fullText);
        const pillWidth = Math.min(width * 0.9, textMetrics.width + 48);

        // Dark frosted background pill
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.roundRect(ctx, (width - pillWidth) / 2, height - bottomMargin - 36, pillWidth, 54, 14);
        ctx.fill();

        // Render highlighted text
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#000000';
        ctx.strokeText(text, width / 2, height - bottomMargin);

        ctx.fillStyle = '#fde047'; // Vivid yellow active text
        ctx.fillText(text, width / 2, height - bottomMargin);
        break;
      }

      case 'cyberpunk_glitch': {
        // Neon framed badge with glitch font
        ctx.font = `bold ${baseFontSize}px "Courier New", monospace`;
        ctx.textAlign = 'center';

        const metrics = ctx.measureText(text);
        const boxW = Math.min(width * 0.9, metrics.width + 40);
        const boxH = 48;
        const boxX = (width - boxW) / 2;
        const boxY = height - bottomMargin - 32;

        // Cyber neon box
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Neon text
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.fillText(text, width / 2, height - bottomMargin);
        break;
      }

      case 'typewriter': {
        // Progressive characters typed out
        const charCount = Math.floor(progress * text.length);
        const displayedText = text.slice(0, charCount) + (charCount < text.length ? '█' : '');

        ctx.font = `bold ${baseFontSize}px "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 8;
        ctx.fillText(displayedText, width / 2, height - bottomMargin);
        break;
      }

      case 'lower_third': {
        // Broadcast lower-third banner
        const bannerW = Math.min(width * 0.85, 600);
        const bannerH = 64;
        const bannerX = 40;
        const bannerY = height - bottomMargin - 40;

        ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
        ctx.fillRect(bannerX, bannerY, bannerW, bannerH);

        // Left accent bar
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(bannerX, bannerY, 6, bannerH);

        if (sceneTitle) {
          ctx.font = `bold ${baseFontSize * 0.65}px sans-serif`;
          ctx.fillStyle = '#f43f5e';
          ctx.textAlign = 'left';
          ctx.fillText(sceneTitle.toUpperCase(), bannerX + 20, bannerY + 24);
        }

        ctx.font = `bold ${baseFontSize * 0.85}px sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(text, bannerX + 20, bannerY + 50);
        break;
      }

      case 'cinematic_fade':
      default: {
        // High-end cinematic subtitle
        const alpha = Math.sin(progress * Math.PI);
        ctx.font = `600 ${baseFontSize}px "Inter", "Helvetica Neue", sans-serif`;
        ctx.textAlign = 'center';

        ctx.lineWidth = 3;
        ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.9})`;
        ctx.strokeText(text, width / 2, height - bottomMargin);

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.shadowColor = `rgba(0, 0, 0, ${alpha * 0.8})`;
        ctx.shadowBlur = 10;
        ctx.fillText(text, width / 2, height - bottomMargin);
        break;
      }
    }
    ctx.restore();
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private renderEmptyState(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎬 CineAI Video Studio', width / 2, height / 2 - 20);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Klik "Buat dengan AI" untuk membuat video otomatis dari teks', width / 2, height / 2 + 20);
  }

  // Export Full Video to WebM / MP4 via MediaRecorder + Audio mixing
  public async exportVideo(
    project: Project,
    options: {
      resolution: '720p' | '1080p';
      fps: number;
      onProgress: (percent: number, statusText: string) => void;
    }
  ): Promise<Blob> {
    const { totalDuration } = this.getTimelineInfo(project);
    const width = options.resolution === '1080p' ? (project.aspectRatio === '9:16' ? 1080 : 1920) : (project.aspectRatio === '9:16' ? 720 : 1280);
    const height = options.resolution === '1080p' ? (project.aspectRatio === '9:16' ? 1920 : 1080) : (project.aspectRatio === '9:16' ? 1280 : 720);

    // Off-screen render canvas
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;

    // Preload all scene images first
    options.onProgress(5, 'Preloading scene media assets...');
    for (let i = 0; i < project.scenes.length; i++) {
      await this.preloadImage(project.scenes[i].mediaUrl);
      options.onProgress(5 + Math.floor((i / project.scenes.length) * 20), `Loading asset ${i + 1}/${project.scenes.length}`);
    }

    options.onProgress(25, 'Initializing video & audio stream encoder...');
    const videoStream = offscreenCanvas.captureStream(options.fps);

    // Audio stream from mixer
    const audioDest = videoAudioMixer.getAudioStreamDestination();
    const combinedStream = new MediaStream();

    videoStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));
    if (audioDest) {
      audioDest.stream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));
    }

    // Determine supported mime type
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8,opus';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    const recordedChunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: options.resolution === '1080p' ? 8000000 : 4000000,
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
        resolve(videoBlob);
      };

      mediaRecorder.onerror = (e) => {
        reject(e);
      };

      mediaRecorder.start(100);

      // Start procedural BGM for export recording
      videoAudioMixer.startBgm();

      const totalFrames = Math.ceil(totalDuration * options.fps);
      let currentFrame = 0;

      const renderNextFrame = () => {
        if (currentFrame > totalFrames) {
          videoAudioMixer.stopBgm();
          mediaRecorder.stop();
          return;
        }

        const currentTime = currentFrame / options.fps;
        this.renderFrame(offscreenCanvas, project, currentTime);

        const percent = Math.min(99, 25 + Math.floor((currentFrame / totalFrames) * 74));
        options.onProgress(percent, `Rendering frame ${currentFrame}/${totalFrames} (${currentTime.toFixed(1)}s)`);

        currentFrame++;
        requestAnimationFrame(renderNextFrame);
      };

      renderNextFrame();
    });
  }
}

export const videoRenderer = new VideoRenderer();
