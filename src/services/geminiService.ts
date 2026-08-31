import { AspectRatio, Project, Scene } from '../types';
import { findMatchingStockMedia } from './stockLibrary';

export interface GenerateStoryboardParams {
  prompt: string;
  style: string;
  aspectRatio: AspectRatio;
  targetDuration: number;
  voiceTone: string;
  language: string;
  numScenes?: number;
}

export interface StoryboardResponse {
  title: string;
  summary: string;
  recommendedBgm: {
    genre: string;
    mood: string;
    bpm?: number;
  };
  scenes: Array<{
    id?: string;
    title: string;
    visualDescription: string;
    voiceover: string;
    subtitle: string;
    duration: number;
    cameraMotion: string;
    transition: string;
    colorGrade: string;
    effectOverlay: string;
    soundEffect: string;
    searchKeywords?: string[];
  }>;
}

export async function generateAIStoryboard(
  params: GenerateStoryboardParams
): Promise<StoryboardResponse> {
  const response = await fetch('/api/ai/generate-storyboard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with status ${response.status}`);
  }

  return response.json();
}

export async function generateSceneVisual(
  prompt: string,
  aspectRatio: AspectRatio,
  style: string
): Promise<{ imageUrl: string }> {
  const response = await fetch('/api/ai/generate-scene-visual', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, aspectRatio, style }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to generate visual');
  }

  return response.json();
}

export async function generateAITTS(
  text: string,
  voiceName: string = 'Kore'
): Promise<{ audioBase64: string; sampleRate: number }> {
  const response = await fetch('/api/ai/generate-tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, voiceName }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to generate TTS voiceover');
  }

  return response.json();
}

export async function refineScriptWithAI(
  script: string,
  instruction: string,
  language: string = 'id'
): Promise<{ refinedVoiceover: string; refinedSubtitle: string; deliveryTone?: string }> {
  const response = await fetch('/api/ai/refine-script', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ script, instruction, language }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to refine script');
  }

  return response.json();
}

export function createProjectFromStoryboard(
  data: StoryboardResponse,
  aspectRatio: AspectRatio = '16:9'
): Project {
  const scenes: Scene[] = data.scenes.map((s, index) => {
    const stockMatch = findMatchingStockMedia(s.searchKeywords || [s.title, ...s.visualDescription.split(' ').slice(0, 3)]);

    return {
      id: `scene-${Date.now()}-${index}`,
      title: s.title || `Scene ${index + 1}`,
      visualDescription: s.visualDescription || '',
      mediaUrl: stockMatch.url,
      mediaType: 'image',
      voiceover: s.voiceover || '',
      subtitle: s.subtitle || '',
      duration: Math.max(2.5, Math.min(10, s.duration || 4.5)),
      cameraMotion: (s.cameraMotion as any) || 'zoom_in',
      transition: (s.transition as any) || 'cross_dissolve',
      transitionDuration: 0.6,
      colorGrade: (s.colorGrade as any) || 'teal_orange',
      effectOverlay: (s.effectOverlay as any) || 'film_grain',
      soundEffect: (s.soundEffect as any) || 'whoosh',
      searchKeywords: s.searchKeywords || [],
    };
  });

  return {
    id: `project-${Date.now()}`,
    title: data.title || 'Untitled AI Cinema Project',
    summary: data.summary || 'AI Generated cinematic video',
    aspectRatio,
    scenes,
    bgmTrack: {
      id: `bgm-${Date.now()}`,
      name: data.recommendedBgm?.genre || 'Cinematic Epic Beat',
      type: 'bgm',
      volume: 0.35,
      muted: false,
      genre: data.recommendedBgm?.genre,
      mood: data.recommendedBgm?.mood,
    },
    subtitleStyle: 'karaoke',
    letterbox: true,
    resolution: '1080p',
    fps: 30,
    updatedAt: Date.now(),
  };
}
