import { Scene, VideoProject, SubtitleConfig } from '../types.ts';

// Preload and cache images for smooth playback & rendering
const imageCache: Map<string, HTMLImageElement> = new Map();

// Automatically preload default logo
if (typeof window !== 'undefined') {
  preloadImage('/assets/logo-badge.jpg');
}

export function preloadImage(url: string): Promise<HTMLImageElement> {
  if (imageCache.has(url)) {
    return Promise.resolve(imageCache.get(url)!);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => {
      // Fallback empty image
      resolve(img);
    };
    img.src = url;
  });
}

export function preloadAllSceneImages(scenes: Scene[]) {
  preloadImage('/assets/logo-badge.jpg');
  scenes.forEach((s) => {
    if (s.visualUrl) preloadImage(s.visualUrl);
  });
}

export interface DrawSceneOptions {
  scene: Scene;
  sceneTime: number; // current second in scene (0 to scene.duration)
  totalVideoTime: number;
  project: VideoProject;
  width: number;
  height: number;
  interactiveQuizSelected?: number | null;
}

export function drawSceneFrame(ctx: CanvasRenderingContext2D, options: DrawSceneOptions) {
  const { scene, sceneTime, totalVideoTime, project, width, height, interactiveQuizSelected } = options;
  const progressInScene = Math.max(0, Math.min(1, sceneTime / (scene.duration || 10)));

  ctx.clearRect(0, 0, width, height);

  // 1. Draw Background Image or Gradient
  const cachedImg = scene.visualUrl ? imageCache.get(scene.visualUrl) : null;

  if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
    ctx.save();
    // Ken Burns camera animation effect
    let scale = 1.0;
    let translateX = 0;
    let translateY = 0;

    if (scene.animationType === 'zoom-in') {
      scale = 1.0 + progressInScene * 0.12;
    } else if (scene.animationType === 'pan-left') {
      scale = 1.08;
      translateX = (1 - progressInScene) * (width * 0.04);
    } else if (scene.animationType === 'pan-right') {
      scale = 1.08;
      translateX = -((1 - progressInScene) * (width * 0.04));
    } else if (scene.animationType === 'float') {
      scale = 1.04;
      translateY = Math.sin(progressInScene * Math.PI) * (height * 0.02);
    }

    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2 + translateX, -height / 2 + translateY);

    // Calculate Aspect Ratio Cover
    const imgRatio = cachedImg.naturalWidth / cachedImg.naturalHeight;
    const canvasRatio = width / height;
    let renderW = width;
    let renderH = height;
    let renderX = 0;
    let renderY = 0;

    if (imgRatio > canvasRatio) {
      renderW = height * imgRatio;
      renderX = (width - renderW) / 2;
    } else {
      renderH = width / imgRatio;
      renderY = (height - renderH) / 2;
    }

    ctx.drawImage(cachedImg, renderX, renderY, renderW, renderH);
    ctx.restore();
  } else {
    // Dynamic Gradient Background based on visual style
    const grad = ctx.createLinearGradient(0, 0, width, height);
    if (scene.sceneType === 'intro') {
      grad.addColorStop(0, '#1E1B4B');
      grad.addColorStop(1, '#0F172A');
    } else if (scene.sceneType === 'outro') {
      grad.addColorStop(0, '#064E3B');
      grad.addColorStop(1, '#0F172A');
    } else if (scene.sceneType === 'quiz') {
      grad.addColorStop(0, '#4A044E');
      grad.addColorStop(1, '#0F172A');
    } else {
      grad.addColorStop(0, '#0F172A');
      grad.addColorStop(1, '#1E293B');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // 2. High Quality Dark Vignette & Color Overlay for Maximum Text Contrast
  const overlayGrad = ctx.createLinearGradient(0, 0, 0, height);
  overlayGrad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
  overlayGrad.addColorStop(0.45, 'rgba(15, 23, 42, 0.65)');
  overlayGrad.addColorStop(1, 'rgba(15, 23, 42, 0.88)');
  ctx.fillStyle = overlayGrad;
  ctx.fillRect(0, 0, width, height);

  // 3. Draw Header Badges (Scene Type & Watermark)
  ctx.save();
  const pillX = width * 0.05;
  const pillY = height * 0.05;
  const pillPaddingX = 14;

  let sceneTypeName = '📖 01. PENGANTAR MATERI';
  let pillColor = '#6366F1';
  if (scene.sceneType === 'intro') {
    sceneTypeName = '🚀 01. INTRO & APERSEPSI';
    pillColor = '#6366F1';
  } else if (scene.sceneType === 'concept' || scene.sceneType === 'learning_concept') {
    sceneTypeName = '💡 02. KONSEP UTAMA';
    pillColor = '#8B5CF6';
  } else if (scene.sceneType === 'explanation') {
    sceneTypeName = '📚 03. PENJELASAN MENDALAM';
    pillColor = '#06B6D4';
  } else if (scene.sceneType === 'example') {
    sceneTypeName = '🔬 04. CONTOH & APLIKASI NYATA';
    pillColor = '#10B981';
  } else if (scene.sceneType === 'summary') {
    sceneTypeName = '📌 05. RANGKUMAN KESIMPULAN';
    pillColor = '#F59E0B';
  } else if (scene.sceneType === 'quiz') {
    sceneTypeName = '❓ 06. KUIS EVALUASI INTERAKTIF';
    pillColor = '#EC4899';
  } else if (scene.sceneType === 'outro') {
    sceneTypeName = '🌟 07. PENUTUP & REFLEKSI';
    pillColor = '#14B8A6';
  }

  // Draw Scene Type Pill
  ctx.font = `bold ${Math.round(height * 0.024)}px 'Outfit', sans-serif`;
  const textWidth = ctx.measureText(sceneTypeName).width;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, textWidth + pillPaddingX * 2, height * 0.048, 8);
  ctx.fill();
  ctx.strokeStyle = pillColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(sceneTypeName, pillX + pillPaddingX, pillY + height * 0.033);

  // Watermark / Subject Badge on top right
  if (project.exportSettings?.watermark) {
    const wmText = project.exportSettings.watermarkText || `${project.subject} • ${project.grade}`;
    ctx.font = `600 ${Math.round(height * 0.022)}px 'Plus Jakarta Sans', sans-serif`;
    const wmWidth = ctx.measureText(wmText).width;
    const wmX = width - wmXPos(width, wmWidth);
    const wmY = height * 0.05;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.roundRect(wmX - 12, wmY, wmWidth + 24, height * 0.044, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#E2E8F0';
    ctx.fillText(wmText, wmX, wmY + height * 0.03);
  }
  ctx.restore();

  // 4. Main Scene Content based on type
  if (scene.sceneType === 'intro') {
    drawInteractiveIntroScene(ctx, scene, width, height, sceneTime, project);
  } else if (scene.sceneType === 'outro') {
    drawInteractiveOutroScene(ctx, scene, width, height, sceneTime, project);
  } else if (scene.sceneType === 'quiz' && scene.quizQuestion) {
    drawQuizScene(ctx, scene, width, height, sceneTime, interactiveQuizSelected);
  } else {
    drawStandardScene(ctx, scene, width, height, sceneTime, project);
  }

  // 5. Draw Subtitles at Bottom
  if (project.subtitleConfig?.enabled && scene.narration) {
    drawSubtitles(ctx, scene.narration, sceneTime, scene.duration, project.subtitleConfig, width, height);
  }

  // 6. Draw Footer Identity Logo Badge
  drawFooterIdentity(ctx, project, width, height, sceneTime);

  // 7. Subtle Progress Bar at the very bottom
  const barY = height - 6;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fillRect(0, barY, width, 6);

  const totalDuration = project.totalDurationSeconds || 60;
  const overallProgress = Math.max(0, Math.min(1, totalVideoTime / totalDuration));
  const progressGrad = ctx.createLinearGradient(0, 0, width, 0);
  progressGrad.addColorStop(0, '#6366F1');
  progressGrad.addColorStop(0.5, '#38BDF8');
  progressGrad.addColorStop(1, '#10B981');
  ctx.fillStyle = progressGrad;
  ctx.fillRect(0, barY, width * overallProgress, 6);
}

function wmXPos(canvasW: number, textW: number): number {
  return textW + canvasW * 0.05;
}

// -------------------------------------------------------------
// FOOTER IDENTITY LOGO BADGE (WITH ANIMATED WRITING EFFECT)
// -------------------------------------------------------------
function drawFooterIdentity(
  ctx: CanvasRenderingContext2D,
  project: VideoProject,
  width: number,
  height: number,
  sceneTime: number
) {
  const config = project.footerIdentity;
  if (config && config.enabled === false) return;

  ctx.save();

  const logoUrl = config?.logoUrl || '/assets/logo-badge.jpg';
  const badgeTitle = config?.badgeTitle || 'VIDEO ANIMASI PEMBELAJARAN';
  const creatorName = config?.creatorName || 'Dev Jaenal Maskun';

  const badgeH = height * 0.072;
  const badgeW = width * 0.35;
  const isRight = config?.position !== 'bottom-left';
  
  const badgeX = isRight ? width - badgeW - width * 0.035 : width * 0.035;
  const badgeY = height * 0.90;

  ctx.globalAlpha = Math.min(1, sceneTime * 1.5);

  // Background Glassmorphism Container
  ctx.fillStyle = 'rgba(10, 15, 30, 0.92)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeH / 2);
  ctx.fill();

  // Vibrant Multi-color Animated Border
  const borderGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
  borderGrad.addColorStop(0, '#F59E0B');
  borderGrad.addColorStop(0.5, '#6366F1');
  borderGrad.addColorStop(1, '#38BDF8');
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Draw Logo Image (or Fallback Vector Badge)
  const avatarRadius = badgeH * 0.38;
  const avatarX = badgeX + badgeH * 0.52;
  const avatarY = badgeY + badgeH / 2;

  const cachedLogo = imageCache.get(logoUrl) || imageCache.get('/assets/logo-badge.jpg');

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
  ctx.clip();

  if (cachedLogo && cachedLogo.complete && cachedLogo.naturalWidth > 0) {
    ctx.drawImage(
      cachedLogo,
      avatarX - avatarRadius,
      avatarY - avatarRadius,
      avatarRadius * 2,
      avatarRadius * 2
    );
  } else {
    // Vector Badge Fallback
    const bgGrad = ctx.createRadialGradient(avatarX, avatarY, 2, avatarX, avatarY, avatarRadius);
    bgGrad.addColorStop(0, '#FBBF24');
    bgGrad.addColorStop(1, '#D97706');
    ctx.fillStyle = bgGrad;
    ctx.fill();

    ctx.fillStyle = '#0F172A';
    ctx.font = `bold ${Math.round(avatarRadius * 0.9)}px 'Outfit', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('🎓', avatarX, avatarY + avatarRadius * 0.35);
  }
  ctx.restore();

  // Circular Gold Ring around logo with subtle pulsing rotation
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius + 1.2, 0, Math.PI * 2);
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Text Content Base
  const textLeft = avatarX + avatarRadius + 10;

  // Title: "VIDEO ANIMASI PEMBELAJARAN"
  ctx.fillStyle = '#FBBF24';
  ctx.font = `bold ${Math.round(height * 0.015)}px 'Outfit', sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(badgeTitle.toUpperCase(), textLeft, badgeY + badgeH * 0.40);

  // -------------------------------------------------------------
  // ANIMATED WRITING / TYPEWRITER EFFECT FOR "Dev Jaenal Maskun"
  // -------------------------------------------------------------
  const charsPerSec = 7.5;
  // Typewriter loop: types letter by letter, pauses for 3 seconds when finished, then repeats
  const textLength = creatorName.length;
  const loopCycle = (sceneTime * charsPerSec) % (textLength + 20);
  const currentChars = Math.min(textLength, Math.floor(loopCycle));
  const animatedText = creatorName.substring(0, currentChars);
  const isCurrentlyWriting = currentChars < textLength;

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.round(height * 0.022)}px 'Plus Jakarta Sans', sans-serif`;
  ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
  ctx.shadowBlur = isCurrentlyWriting ? 8 : 4;
  ctx.fillText(animatedText, textLeft, badgeY + badgeH * 0.78);

  const currentWidth = ctx.measureText(animatedText).width;

  // If currently writing, render animated writing pen nib or glowing cursor
  if (isCurrentlyWriting) {
    // Glowing neon writing cursor & pen nib
    const penX = textLeft + currentWidth + 2;
    const penY = badgeY + badgeH * 0.76;
    
    // Writing Cursor Bar
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(penX, penY - height * 0.018, 2.5, height * 0.022);

    // Glowing Pen Icon ✍️ with slight writing oscillation
    const penBobbing = Math.sin(sceneTime * 14) * 2;
    ctx.font = `${Math.round(height * 0.02)}px sans-serif`;
    ctx.fillText('✍️', penX + 2, penY - penBobbing);
  } else {
    // Fully written: show sparkling verified checkmark
    ctx.fillStyle = '#38BDF8';
    ctx.font = `bold ${Math.round(height * 0.018)}px sans-serif`;
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#38BDF8';
    ctx.fillText('✓', textLeft + currentWidth + 5, badgeY + badgeH * 0.78);
  }

  ctx.restore();
}

// -------------------------------------------------------------
// INTERACTIVE INTRO SCENE
// -------------------------------------------------------------
function drawInteractiveIntroScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  width: number,
  height: number,
  sceneTime: number,
  project: VideoProject
) {
  ctx.save();

  // 1. Floating Sparkle Stars
  for (let i = 0; i < 15; i++) {
    const starX = (Math.sin(i * 1.7 + sceneTime * 0.8) * 0.5 + 0.5) * width;
    const starY = (Math.cos(i * 2.3 + sceneTime * 0.6) * 0.5 + 0.5) * height * 0.7;
    const starAlpha = (Math.sin(sceneTime * 3 + i) * 0.5 + 0.5) * 0.7;
    ctx.fillStyle = `rgba(253, 224, 71, ${starAlpha})`;
    ctx.beginPath();
    ctx.arc(starX, starY, (i % 3) + 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Animated Center Logo & Welcome Badge
  const centerY = height * 0.38;
  const popScale = Math.min(1.0, sceneTime * 1.4);
  
  ctx.save();
  ctx.translate(width / 2, centerY);
  ctx.scale(popScale, popScale);

  // Glowing animated outer rings
  const ringRadius = height * 0.14 + Math.sin(sceneTime * 4) * 6;
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
  ctx.stroke();

  const ringRadius2 = height * 0.12 + Math.cos(sceneTime * 3) * 4;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, ringRadius2, 0, Math.PI * 2);
  ctx.stroke();

  // Center Circle Badge
  const cachedLogo = imageCache.get('/assets/logo-badge.jpg');
  ctx.beginPath();
  ctx.arc(0, 0, height * 0.09, 0, Math.PI * 2);
  ctx.fillStyle = '#0F172A';
  ctx.fill();
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.clip();

  if (cachedLogo && cachedLogo.complete && cachedLogo.naturalWidth > 0) {
    ctx.drawImage(cachedLogo, -height * 0.09, -height * 0.09, height * 0.18, height * 0.18);
  } else {
    ctx.fillStyle = '#FBBF24';
    ctx.font = `bold ${Math.round(height * 0.08)}px 'Outfit', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('✨', 0, height * 0.03);
  }
  ctx.restore();

  // 3. Title & Topic Header
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.round(height * 0.058)}px 'Outfit', sans-serif`;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 14;

  const titleLines = wrapText(ctx, scene.overlayTitle || project.title, width * 0.85);
  let curY = height * 0.58;
  titleLines.forEach((line) => {
    ctx.fillText(line, width / 2, curY);
    curY += height * 0.068;
  });

  // Subtitle / Learning Target
  ctx.fillStyle = '#38BDF8';
  ctx.font = `600 ${Math.round(height * 0.028)}px 'Plus Jakarta Sans', sans-serif`;
  ctx.shadowBlur = 8;
  ctx.fillText(scene.overlaySubtitle || `Mata Pelajaran: ${project.subject} (${project.grade})`, width / 2, curY + 6);

  // 4. Interactive Call-To-Action Pill
  if (sceneTime >= 1.5) {
    const ctaY = curY + height * 0.07;
    const ctaW = width * 0.38;
    const ctaH = height * 0.062;
    const ctaX = width / 2 - ctaW / 2;

    const pulseBtn = Math.sin(sceneTime * 4) * 0.05 + 1.0;
    ctx.save();
    ctx.translate(width / 2, ctaY + ctaH / 2);
    ctx.scale(pulseBtn, pulseBtn);
    ctx.translate(-width / 2, -(ctaY + ctaH / 2));

    const btnGrad = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaW, ctaY + ctaH);
    btnGrad.addColorStop(0, '#4F46E5');
    btnGrad.addColorStop(1, '#0284C7');
    ctx.fillStyle = btnGrad;
    ctx.beginPath();
    ctx.roundRect(ctaX, ctaY, ctaW, ctaH, ctaH / 2);
    ctx.fill();

    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(height * 0.024)}px 'Outfit', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('▶ SENTUH / KLIK UNTUK BELAJAR', width / 2, ctaY + ctaH * 0.65);
    ctx.restore();
  }

  ctx.restore();
}

// -------------------------------------------------------------
// INTERACTIVE OUTRO SCENE
// -------------------------------------------------------------
function drawInteractiveOutroScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  width: number,
  height: number,
  sceneTime: number,
  project: VideoProject
) {
  ctx.save();

  // 1. Confetti & Celebration Burst Particles
  const confettiColors = ['#F59E0B', '#EC4899', '#10B981', '#38BDF8', '#8B5CF6', '#F43F5E'];
  for (let i = 0; i < 40; i++) {
    const seed = i * 97.3;
    const confX = ((Math.sin(seed + sceneTime * 1.2) * 0.5 + 0.5) * width + Math.sin(sceneTime * 2 + i) * 30) % width;
    const confY = ((seed * 13 + sceneTime * (80 + (i % 50))) % (height * 1.1)) - 20;
    const confColor = confettiColors[i % confettiColors.length];
    
    ctx.fillStyle = confColor;
    ctx.save();
    ctx.translate(confX, confY);
    ctx.rotate(sceneTime * 2 + i);
    ctx.fillRect(-6, -4, 12, 8);
    ctx.restore();
  }

  // 2. Celebration Trophy / Badge Card
  const cardW = width * 0.74;
  const cardH = height * 0.62;
  const cardX = width / 2 - cardW / 2;
  const cardY = height * 0.16;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 20);
  ctx.fill();

  const cardBorderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  cardBorderGrad.addColorStop(0, '#10B981');
  cardBorderGrad.addColorStop(0.5, '#F59E0B');
  cardBorderGrad.addColorStop(1, '#38BDF8');
  ctx.strokeStyle = cardBorderGrad;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Celebration Trophy Icon
  ctx.textAlign = 'center';
  ctx.font = `bold ${Math.round(height * 0.07)}px 'Outfit', sans-serif`;
  ctx.fillText('🏆', width / 2, cardY + height * 0.11);

  // Main Congrats Headline
  ctx.fillStyle = '#FDE047';
  ctx.font = `bold ${Math.round(height * 0.046)}px 'Outfit', sans-serif`;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 10;
  ctx.fillText('SELAMAT! MATERI SELESAI', width / 2, cardY + height * 0.19);

  // Title of Topic Learned
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `600 ${Math.round(height * 0.032)}px 'Plus Jakarta Sans', sans-serif`;
  const titleLines = wrapText(ctx, `Anda telah menuntaskan video "${project.title}"`, cardW * 0.85);
  let curY = cardY + height * 0.26;
  titleLines.forEach((line) => {
    ctx.fillText(line, width / 2, curY);
    curY += height * 0.045;
  });

  // Creator Attribution & Certificate Note
  ctx.fillStyle = '#94A3B8';
  ctx.font = `500 ${Math.round(height * 0.022)}px 'Plus Jakarta Sans', sans-serif`;
  ctx.fillText(`Karya & Desain Interaktif: ${project.footerIdentity?.creatorName || 'Dev Jaenal Maskun'}`, width / 2, curY + height * 0.02);

  // Interactive Replay & Certificate Buttons
  const btnW = width * 0.28;
  const btnH = height * 0.06;
  const btnY = cardY + cardH - height * 0.11;

  // Button 1: Putar Ulang
  const btn1X = width / 2 - btnW - 12;
  ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
  ctx.beginPath();
  ctx.roundRect(btn1X, btnY, btnW, btnH, 12);
  ctx.fill();
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#38BDF8';
  ctx.font = `bold ${Math.round(height * 0.022)}px 'Outfit', sans-serif`;
  ctx.fillText('🔄 Putar Ulang Video', btn1X + btnW / 2, btnY + btnH * 0.65);

  // Button 2: Unduh Materi
  const btn2X = width / 2 + 12;
  ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
  ctx.beginPath();
  ctx.roundRect(btn2X, btnY, btnW, btnH, 12);
  ctx.fill();
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#10B981';
  ctx.fillText('📜 Rangkuman Materi', btn2X + btnW / 2, btnY + btnH * 0.65);

  ctx.restore();
}

// -------------------------------------------------------------
// STANDARD SCENE (CONCEPT / EXPLANATION / SUMMARY)
// -------------------------------------------------------------
function drawStandardScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  width: number,
  height: number,
  sceneTime: number,
  project: VideoProject
) {
  ctx.save();
  const startX = width * 0.06;
  const cardMaxW = width * 0.88;
  let curY = height * 0.16;

  // 1. Pedagogical Category Badge
  const badgeLabel =
    scene.sceneType === 'learning_concept'
      ? '💡 TUJUAN & KONSEP DASAR'
      : scene.sceneType === 'explanation'
      ? '📖 PENJELASAN MATERI & TATA CARA'
      : scene.sceneType === 'example'
      ? '🔬 CONTOH KASUS & PENERAPAN NYATA'
      : scene.sceneType === 'summary'
      ? '✨ RANGKUMAN POIN PENTING'
      : '📚 MATERI PEMBELAJARAN';

  const badgeAlpha = Math.min(1, sceneTime * 3);
  ctx.globalAlpha = badgeAlpha;

  ctx.font = `bold ${Math.round(height * 0.02)}px 'Outfit', sans-serif`;
  const badgeTextW = ctx.measureText(badgeLabel).width;
  const badgeH = height * 0.038;
  const badgePadX = 14;

  ctx.fillStyle = 'rgba(79, 70, 229, 0.4)';
  ctx.beginPath();
  ctx.roundRect(startX, curY, badgeTextW + badgePadX * 2, badgeH, 8);
  ctx.fill();
  ctx.strokeStyle = '#818CF8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#E0E7FF';
  ctx.fillText(badgeLabel, startX + badgePadX, curY + badgeH * 0.68);

  curY += badgeH + height * 0.024;

  // 2. Animate Main Title Entrance
  const titleAlpha = Math.min(1, sceneTime * 2);
  ctx.globalAlpha = titleAlpha;

  // Overlay Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.round(height * 0.054)}px 'Outfit', sans-serif`;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  const titleLines = wrapText(ctx, scene.overlayTitle || scene.title, cardMaxW);
  titleLines.forEach((line) => {
    ctx.fillText(line, startX, curY);
    curY += height * 0.065;
  });

  // Overlay Subtitle / Key Concept Banner
  if (scene.overlaySubtitle) {
    ctx.fillStyle = '#93C5FD';
    ctx.font = `600 ${Math.round(height * 0.028)}px 'Plus Jakarta Sans', sans-serif`;
    ctx.shadowBlur = 8;
    const subLines = wrapText(ctx, scene.overlaySubtitle, cardMaxW);
    subLines.forEach((line) => {
      ctx.fillText(line, startX, curY);
      curY += height * 0.042;
    });
  }

  // 3. Bullet Points & Material Explanation Cards
  const points = (scene.bulletPoints && scene.bulletPoints.length > 0)
    ? scene.bulletPoints
    : [
        scene.narration ? (scene.narration.length > 85 ? scene.narration.slice(0, 82) + '...' : scene.narration) : 'Simak materi pembelajaran dengan saksama.',
        'Pahami konsep dan penerapannya dalam kehidupan.'
      ];

  curY += height * 0.015;
  points.forEach((point, idx) => {
    const pointTime = 0.8 + idx * 0.7;
    if (sceneTime >= pointTime) {
      const pointAlpha = Math.min(1, (sceneTime - pointTime) * 2.5);
      ctx.globalAlpha = pointAlpha;

      ctx.font = `500 ${Math.round(height * 0.026)}px 'Plus Jakarta Sans', sans-serif`;
      const textWrapW = cardMaxW - height * 0.09;
      const wrappedLines = wrapText(ctx, point, textWrapW);
      const cardH = Math.max(height * 0.065, height * 0.035 + wrappedLines.length * (height * 0.032));
      const cardY = curY;

      // Card Backdrop Glassmorphism
      ctx.fillStyle = 'rgba(15, 23, 42, 0.86)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(startX, cardY, cardMaxW, cardH, 12);
      ctx.fill();

      const borderColors = ['#6366F1', '#38BDF8', '#10B981', '#F59E0B'];
      ctx.strokeStyle = borderColors[idx % borderColors.length];
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Icon Number Badge
      const iconRadius = height * 0.018;
      const iconCenterX = startX + height * 0.034;
      const iconCenterY = cardY + cardH / 2;

      ctx.fillStyle = borderColors[idx % borderColors.length];
      ctx.beginPath();
      ctx.arc(iconCenterX, iconCenterY, iconRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.round(height * 0.02)}px 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`${idx + 1}`, iconCenterX, iconCenterY + height * 0.007);
      ctx.textAlign = 'left';

      // Multiline Bullet Text
      ctx.fillStyle = '#F8FAFC';
      ctx.font = `500 ${Math.round(height * 0.025)}px 'Plus Jakarta Sans', sans-serif`;
      let textLineY = cardY + (cardH - (wrappedLines.length - 1) * height * 0.032) / 2 + height * 0.008;
      wrappedLines.forEach((tLine) => {
        ctx.fillText(tLine, startX + height * 0.065, textLineY);
        textLineY += height * 0.032;
      });

      curY += cardH + height * 0.014;
    }
  });

  // 4. Keywords Badge Row
  if (scene.keywords && scene.keywords.length > 0 && sceneTime >= 1.8) {
    let kwX = startX;
    const kwY = height * 0.73;
    ctx.globalAlpha = Math.min(1, (sceneTime - 1.8) * 2);

    scene.keywords.slice(0, 4).forEach((kw) => {
      ctx.font = `600 ${Math.round(height * 0.019)}px 'Plus Jakarta Sans', sans-serif`;
      const kwWidth = ctx.measureText(`# ${kw}`).width;
      const padX = 12;

      ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
      ctx.beginPath();
      ctx.roundRect(kwX, kwY, kwWidth + padX * 2, height * 0.036, 18);
      ctx.fill();
      ctx.strokeStyle = 'rgba(165, 180, 252, 0.7)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#E0E7FF';
      ctx.fillText(`# ${kw}`, kwX + padX, kwY + height * 0.024);

      kwX += kwWidth + padX * 2 + 10;
    });
  }

  ctx.restore();
}

// -------------------------------------------------------------
// QUIZ SCENE
// -------------------------------------------------------------
function drawQuizScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  width: number,
  height: number,
  sceneTime: number,
  interactiveQuizSelected?: number | null
) {
  const quiz = scene.quizQuestion;
  if (!quiz) return;

  ctx.save();
  const startX = width * 0.08;
  const startY = height * 0.18;

  // Quiz Header Box
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.beginPath();
  ctx.roundRect(startX, startY, width * 0.84, height * 0.15, 12);
  ctx.fill();
  ctx.strokeStyle = '#EC4899';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#F472B6';
  ctx.font = `bold ${Math.round(height * 0.026)}px 'Outfit', sans-serif`;
  ctx.fillText('❓ SOAL KUIS PEMAHAMAN:', startX + 20, startY + height * 0.045);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `600 ${Math.round(height * 0.032)}px 'Plus Jakarta Sans', sans-serif`;
  const qLines = wrapText(ctx, quiz.question, width * 0.8);
  let qY = startY + height * 0.088;
  qLines.forEach((line) => {
    ctx.fillText(line, startX + 20, qY);
    qY += height * 0.04;
  });

  // Options Grid (2 rows x 2 columns)
  const optStartY = startY + height * 0.18;
  const optH = height * 0.085;
  const optW = width * 0.405;

  quiz.options.forEach((opt, idx) => {
    const row = Math.floor(idx / 2);
    const col = idx % 2;
    const oX = startX + col * (optW + width * 0.03);
    const oY = optStartY + row * (optH + height * 0.02);

    const isSelected = interactiveQuizSelected === idx;
    const isCorrect = idx === quiz.correctIndex;
    const isRevealed = interactiveQuizSelected !== undefined && interactiveQuizSelected !== null;

    let optBg = 'rgba(30, 41, 59, 0.85)';
    let optBorder = 'rgba(255, 255, 255, 0.2)';
    let optText = '#F8FAFC';

    if (isRevealed) {
      if (isCorrect) {
        optBg = 'rgba(16, 185, 129, 0.35)';
        optBorder = '#10B981';
        optText = '#A7F3D0';
      } else if (isSelected && !isCorrect) {
        optBg = 'rgba(239, 68, 68, 0.35)';
        optBorder = '#EF4444';
        optText = '#FECACA';
      }
    }

    ctx.fillStyle = optBg;
    ctx.beginPath();
    ctx.roundRect(oX, oY, optW, optH, 10);
    ctx.fill();

    ctx.strokeStyle = optBorder;
    ctx.lineWidth = isSelected || (isRevealed && isCorrect) ? 2.5 : 1;
    ctx.stroke();

    ctx.fillStyle = optText;
    ctx.font = `600 ${Math.round(height * 0.026)}px 'Plus Jakarta Sans', sans-serif`;
    const wrappedOpt = wrapText(ctx, opt, optW - 30);
    wrappedOpt.forEach((line, lIdx) => {
      ctx.fillText(line, oX + 16, oY + height * 0.045 + lIdx * height * 0.03);
    });
  });

  // If answered, show explanation pill
  if (interactiveQuizSelected !== undefined && interactiveQuizSelected !== null) {
    const expY = optStartY + 2 * (optH + height * 0.02) + height * 0.01;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.beginPath();
    ctx.roundRect(startX, expY, width * 0.84, height * 0.09, 10);
    ctx.fill();
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#10B981';
    ctx.font = `bold ${Math.round(height * 0.024)}px 'Outfit', sans-serif`;
    ctx.fillText('💡 Pembahasan:', startX + 16, expY + height * 0.036);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = `500 ${Math.round(height * 0.022)}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillText(quiz.explanation, startX + 16, expY + height * 0.068);
  }

  ctx.restore();
}

// -------------------------------------------------------------
// SUBTITLES
// -------------------------------------------------------------
function drawSubtitles(
  ctx: CanvasRenderingContext2D,
  narration: string,
  sceneTime: number,
  duration: number,
  config: SubtitleConfig,
  width: number,
  height: number
) {
  const words = narration.split(/\s+/).filter(Boolean);
  if (words.length === 0) return;

  const wordsPerSec = words.length / Math.max(1, duration);
  const currentWordIndex = Math.min(words.length - 1, Math.floor(sceneTime * wordsPerSec));

  const windowSize = 8;
  const windowIndex = Math.floor(currentWordIndex / windowSize);
  const startWord = windowIndex * windowSize;
  const endWord = Math.min(words.length, startWord + windowSize);
  const displayWords = words.slice(startWord, endWord);
  const relativeActiveIndex = currentWordIndex - startWord;

  ctx.save();

  const fontSizeMap = { sm: 0.024, md: 0.032, lg: 0.040 };
  const fontSizeRatio = fontSizeMap[config.fontSize] || 0.032;
  const fontSizePx = Math.round(height * fontSizeRatio);

  ctx.font = `bold ${fontSizePx}px 'Plus Jakarta Sans', sans-serif`;
  ctx.textAlign = 'center';

  let subY = height * 0.83;
  if (config.position === 'top') subY = height * 0.16;
  else if (config.position === 'middle') subY = height * 0.5;

  const fullSubtitleText = displayWords.join(' ');
  const subWidth = ctx.measureText(fullSubtitleText).width;
  const padX = width * 0.025;
  const padY = height * 0.016;

  // Subtitle Backdrop Pill
  ctx.fillStyle = config.bgColor || 'rgba(0, 0, 0, 0.75)';
  ctx.beginPath();
  ctx.roundRect(width / 2 - subWidth / 2 - padX, subY - fontSizePx - padY / 2, subWidth + padX * 2, fontSizePx * 1.5 + padY, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw Words with highlight
  let curX = width / 2 - subWidth / 2;
  ctx.textAlign = 'left';

  displayWords.forEach((word, idx) => {
    const isCurrent = idx === relativeActiveIndex && config.highlightCurrentWord;
    if (isCurrent) {
      ctx.fillStyle = '#FDE047'; // Bright educational yellow highlight
      ctx.shadowColor = 'rgba(253, 224, 71, 0.8)';
      ctx.shadowBlur = 8;
    } else {
      ctx.fillStyle = config.textColor || '#FFFFFF';
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    }

    ctx.fillText(word, curX, subY);
    curX += ctx.measureText(word + ' ').width;
  });

  ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}
