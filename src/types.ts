export type AspectRatio = '16:9' | '9:16' | '1:1' | '21:9';

export type CameraMotion =
  | 'zoom_in'
  | 'zoom_out'
  | 'pan_left'
  | 'pan_right'
  | 'tilt_up'
  | 'drone_forward'
  | 'orbit'
  | 'handheld_shake'
  | 'static';

export type TransitionType =
  | 'whip_pan'
  | 'film_burn'
  | 'glitch'
  | 'zoom_rush'
  | 'cross_dissolve'
  | 'fade_black'
  | 'flash_white'
  | 'none';

export type ColorGradePreset =
  | 'teal_orange'
  | 'cyberpunk'
  | 'kodak_film'
  | 'noir'
  | 'matrix'
  | 'golden_hour'
  | 'hdr_vivid'
  | 'natural';

export type EffectOverlay =
  | 'film_grain'
  | 'lens_flare'
  | 'vhs'
  | 'light_leak'
  | 'particles'
  | 'none';

export type SoundEffectType =
  | 'whoosh'
  | 'glitch_hit'
  | 'cinematic_boom'
  | 'camera_click'
  | 'riser'
  | 'bass_drop'
  | 'none';

export type SubtitleStyle =
  | 'karaoke'
  | 'cyberpunk_glitch'
  | 'cinematic_fade'
  | 'typewriter'
  | 'impact_bold'
  | 'lower_third';

export interface Scene {
  id: string;
  title: string;
  visualDescription: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'procedural';
  voiceover: string;
  subtitle: string;
  duration: number; // in seconds
  cameraMotion: CameraMotion;
  transition: TransitionType;
  transitionDuration?: number; // default 0.6s
  colorGrade: ColorGradePreset;
  effectOverlay: EffectOverlay;
  soundEffect: SoundEffectType;
  audioBase64?: string;
  searchKeywords?: string[];
  generatingMedia?: boolean;
}

export interface AudioTrack {
  id: string;
  name: string;
  type: 'bgm' | 'voiceover' | 'sfx';
  url?: string;
  volume: number; // 0 - 1
  muted: boolean;
  genre?: string;
  mood?: string;
}

export interface Project {
  id: string;
  title: string;
  summary: string;
  aspectRatio: AspectRatio;
  scenes: Scene[];
  bgmTrack: AudioTrack;
  subtitleStyle: SubtitleStyle;
  letterbox: boolean;
  resolution: '720p' | '1080p' | '4k';
  fps: 30 | 60;
  updatedAt: number;
}

export interface StockMediaItem {
  id: string;
  title: string;
  category: string;
  url: string;
  type: 'image' | 'video';
  tags: string[];
  thumbnail: string;
}

export interface BgmTrackPreset {
  id: string;
  title: string;
  genre: string;
  mood: string;
  bpm: number;
  tags: string[];
  synthMood: 'epic' | 'synthwave' | 'lofi' | 'cyberpunk' | 'orchestral' | 'ambient';
}
