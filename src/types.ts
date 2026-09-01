export type GradeLevel = 
  | 'Kelas 1 MI'
  | 'Kelas 2 MI'
  | 'Kelas 3 MI'
  | 'Kelas 4 MI'
  | 'Kelas 5 MI'
  | 'Kelas 6 MI'
  | 'MI'
  | 'SD'
  | 'SMP'
  | 'SMA'
  | 'Kuliah'
  | 'Umum';

export type SubjectCategory = 
  | 'Al-Qur\'an Hadis'
  | 'Akidah Akhlak'
  | 'Fikih'
  | 'SKI'
  | 'Bahasa Arab'
  | 'IPAS'
  | 'IPA'
  | 'Matematika'
  | 'Fisika'
  | 'Biologi'
  | 'Kimia'
  | 'Sejarah'
  | 'Bahasa Indonesia'
  | 'Bahasa Inggris'
  | 'Informatika'
  | 'Pancasila & PPKn'
  | 'Geografi'
  | 'Ekonomi'
  | 'Seni & Budaya'
  | 'Lainnya';

export type VisualStyle = 
  | 'Animasi 3D'
  | 'Kartun 2D'
  | 'Presentasi'
  | 'Cinematic'
  | 'Infografis';

export type SceneType = 
  | 'intro'
  | 'learning_concept'
  | 'concept'
  | 'explanation'
  | 'example'
  | 'summary'
  | 'quiz'
  | 'outro';

export type AnimationType = 
  | 'zoom-in'
  | 'pan-left'
  | 'pan-right'
  | 'float'
  | 'none';

export type TransitionType = 
  | 'fade'
  | 'slide-left'
  | 'zoom'
  | 'dissolve'
  | 'wipe';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Scene {
  id: string;
  order: number;
  sceneType: SceneType;
  title: string;
  overlayTitle: string;
  overlaySubtitle: string;
  narration: string;
  duration: number; // in seconds
  visualPrompt: string;
  visualUrl: string;
  visualType: 'image' | 'gradient' | 'diagram' | 'code' | 'quiz_card';
  bgGradient?: string;
  animationType: AnimationType;
  transitionType: TransitionType;
  audioUrl?: string;
  audioBase64?: string;
  keywords: string[];
  bulletPoints: string[];
  quizQuestion?: QuizQuestion;
}

export interface VoiceConfig {
  provider: 'gemini' | 'browser';
  voiceName: string;
  gender: 'male' | 'female';
  speed: number; // 0.75 - 1.5
  pitch: number; // 0.8 - 1.2
  volume: number; // 0 - 100
}

export interface AudioTrackConfig {
  musicId: string;
  musicName: string;
  musicUrl: string;
  category: 'cheerful' | 'calm' | 'cinematic' | 'focus' | 'acoustic' | 'none';
  volume: number; // 0 - 100
  loop: boolean;
  ducking: boolean; // lowers BGM during narration
}

export interface SubtitleConfig {
  enabled: boolean;
  fontSize: 'sm' | 'md' | 'lg';
  position: 'bottom' | 'top' | 'middle';
  highlightCurrentWord: boolean;
  textColor: string;
  bgColor: string;
  fontStyle: 'modern' | 'minimal' | 'bold' | 'caption';
}

export interface FooterIdentityConfig {
  enabled: boolean;
  logoUrl?: string;
  badgeTitle?: string; // e.g. "VIDEO ANIMASI PEMBELAJARAN"
  creatorName?: string; // e.g. "DEV JAENAL MASKUN"
  position?: 'bottom-right' | 'bottom-left';
  showBadgeIcon?: boolean;
}

export interface IntroOutroConfig {
  interactiveIntro?: boolean;
  interactiveOutro?: boolean;
  introInteractive?: boolean;
  introBadgeAnimation?: 'spin-pop' | 'glow-pulse' | 'slide-up';
  outroCelebration?: boolean | 'confetti' | 'sparkles' | 'stars';
  showCertificatePrompt?: boolean;
  introTitle?: string;
  outroPrompt?: string;
}

export interface ExportSettings {
  resolution: '720p' | '1080p';
  fps: 30 | 60;
  format: 'mp4' | 'webm';
  watermark: boolean;
  watermarkText: string;
}

export interface VideoProject {
  id: string;
  title: string;
  subject: SubjectCategory;
  grade: GradeLevel;
  topic: string;
  learningMaterial: string;
  targetDurationMinutes: number;
  visualStyle: VisualStyle;
  language: string;
  status: 'draft' | 'ready' | 'rendering' | 'completed' | 'error';
  createdAt: string;
  updatedAt: string;
  thumbnailUrl: string;
  scenes: Scene[];
  voiceConfig: VoiceConfig;
  audioTrack: AudioTrackConfig;
  subtitleConfig: SubtitleConfig;
  footerIdentity?: FooterIdentityConfig;
  introOutroConfig?: IntroOutroConfig;
  exportSettings: ExportSettings;
  totalDurationSeconds: number;
  renderedVideoUrl?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'guru' | 'dosen' | 'siswa' | 'kreator';
  institution: string;
  avatarUrl: string;
  createdVideosCount?: number;
  defaultSubject: SubjectCategory;
  defaultGrade: GradeLevel;
}

export interface GenerationRequest {
  title: string;
  subject: SubjectCategory;
  grade: GradeLevel;
  learningMaterial: string;
  targetDurationMinutes: number;
  visualStyle: VisualStyle;
  language: string;
  voiceGender: 'male' | 'female';
  includeQuiz: boolean;
}

export interface QuickTemplate {
  id: string;
  title: string;
  subject: SubjectCategory;
  grade: GradeLevel;
  style: VisualStyle;
  desc: string;
  material: string;
  badge: string;
}

export interface HeaderConfig {
  brandName: string;
  brandBadge: string;
  subtitle: string;
  institutionName: string;
  showInstitution: boolean;
  ctaText: string;
  announcementText: string;
  showAnnouncement: boolean;
}

export interface HeroConfig {
  badgeText: string;
  badgeIcon: string;
  headlineMain: string;
  headlineHighlight: string;
  description: string;
  ctaButtonText: string;
  featurePill1: string;
  featurePill2: string;
  featurePill3: string;
  featurePill4: string;
  templates: QuickTemplate[];
}

export interface AdminUser {
  username: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin';
  lastLogin?: string;
}

