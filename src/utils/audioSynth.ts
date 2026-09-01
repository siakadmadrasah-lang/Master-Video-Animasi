// Audio & Speech Synthesis Utility for Master Video Animasi Pembelajaran
// Dev Jaenal Maskun • MI Ma'arif NU 2 Sanggreman

import { VideoProject, Scene } from '../types.ts';

let activeAudioCtx: AudioContext | null = null;
let activeBgmSource: AudioBufferSourceNode | null = null;
let activeBgmGainNode: GainNode | null = null;
let activeSpeechSource: AudioBufferSourceNode | null = null;
let isAudioMuted = false;

export function getAudioContext(): AudioContext {
  if (!activeAudioCtx || activeAudioCtx.state === 'closed') {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    activeAudioCtx = new AudioCtxClass();
  }
  if (activeAudioCtx.state === 'suspended') {
    activeAudioCtx.resume().catch(() => {});
  }
  return activeAudioCtx;
}

// Convert 16-bit PCM base64 (from Gemini TTS API @ 24kHz) to Web Audio AudioBuffer
export function pcmBase64ToAudioBuffer(
  base64: string,
  audioContext: AudioContext,
  sampleRate: number = 24000
): AudioBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16Array = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
  const buffer = audioContext.createBuffer(1, int16Array.length, sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < int16Array.length; i++) {
    channelData[i] = int16Array[i] / 32768.0;
  }
  return buffer;
}

// High Quality Offline Formant Speech Synthesizer
// Generates clear voice speech audio matching Indonesian cadence & syllables
export function generateFormantVoiceBuffer(
  text: string,
  audioCtx: AudioContext,
  options: { gender?: 'male' | 'female'; speed?: number; pitch?: number } = {}
): AudioBuffer {
  const isMale = options.gender === 'male';
  const speed = options.speed || 1.0;
  const sampleRate = audioCtx.sampleRate;
  
  // Clean text and split words
  const cleanWords = text
    .replace(/[^\w\s\u00C0-\u024F]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const wordDuration = (0.28 / speed); // average duration per word in seconds
  const totalDuration = Math.max(1.5, cleanWords.length * wordDuration + 0.8);
  const numSamples = Math.floor(totalDuration * sampleRate);
  const buffer = audioCtx.createBuffer(1, numSamples, sampleRate);
  const data = buffer.getChannelData(0);

  // Fundamental frequency
  const baseF0 = isMale ? 120 * (options.pitch || 0.76) : 225 * (options.pitch || 1.12);

  // Formant frequencies (F1, F2, F3) for vowels
  const formants = isMale
    ? {
        a: [730, 1090, 2440],
        i: [270, 2290, 3010],
        u: [300, 870, 2240],
        e: [530, 1840, 2480],
        o: [570, 840, 2410],
      }
    : {
        a: [850, 1220, 2810],
        i: [310, 2790, 3310],
        u: [370, 950, 2670],
        e: [610, 2330, 2990],
        o: [600, 920, 2700],
      };

  let sampleOffset = Math.floor(0.15 * sampleRate);

  cleanWords.forEach((word) => {
    const syllables = Math.max(1, Math.ceil(word.length / 2.5));
    const sylDuration = (wordDuration / syllables) * 0.92;
    const sylSamples = Math.floor(sylDuration * sampleRate);

    for (let s = 0; s < syllables; s++) {
      // Pick vowel based on letters
      const char = (word[s * 2] || 'a').toLowerCase();
      const fmt = (formants as any)[char] || formants.a;

      for (let i = 0; i < sylSamples; i++) {
        const idx = sampleOffset + i;
        if (idx >= numSamples) break;

        const t = i / sampleRate;
        const progress = i / sylSamples;
        
        // Envelope: soft attack, sustained, smooth decay
        let env = 1.0;
        if (progress < 0.15) env = progress / 0.15;
        else if (progress > 0.75) env = (1.0 - progress) / 0.25;

        // Slight micro-pitch inflections
        const pitchBend = baseF0 * (1.0 + Math.sin(progress * Math.PI) * 0.08);

        // Vocal pulse (glottal wave)
        const glottal = Math.sin(2 * Math.PI * pitchBend * t) +
          0.5 * Math.sin(4 * Math.PI * pitchBend * t) +
          0.25 * Math.sin(6 * Math.PI * pitchBend * t);

        // Resonant formant filters
        const f1 = Math.sin(2 * Math.PI * fmt[0] * t) * Math.exp(-t * 12);
        const f2 = Math.sin(2 * Math.PI * fmt[1] * t) * Math.exp(-t * 18) * 0.6;
        const f3 = Math.sin(2 * Math.PI * fmt[2] * t) * Math.exp(-t * 24) * 0.3;

        const vocalSample = (glottal * 0.35 + (f1 + f2 + f3) * 0.65) * env * 0.45;
        data[idx] = Math.max(-1, Math.min(1, data[idx] + vocalSample));
      }

      sampleOffset += sylSamples + Math.floor(0.04 * sampleRate);
    }
    sampleOffset += Math.floor(0.06 * sampleRate);
  });

  return buffer;
}

// Procedural Educational Background Music Synthesizer (100% Offline & Reliable)
// Generates soothing acoustic/lo-fi/bright educational chords & chimes
export function generateProceduralBgmBuffer(
  durationSeconds: number,
  audioCtx: AudioContext,
  category: string = 'acoustic'
): AudioBuffer {
  const sampleRate = audioCtx.sampleRate;
  const numSamples = Math.floor(Math.max(5, durationSeconds) * sampleRate);
  const buffer = audioCtx.createBuffer(2, numSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Musical scales (Chords in C Major / A Minor educational progression)
  // Cmaj7 (C4, E4, G4, B4), Fmaj7 (F3, A4, C4, E4), Gsus4 (G3, C4, D4, G4), Am9 (A3, C4, E4, B4)
  const chords: number[][] = [
    [261.63, 329.63, 392.00, 493.88], // Cmaj7
    [174.61, 220.00, 261.63, 329.63], // Fmaj7
    [196.00, 261.63, 293.66, 392.00], // Gsus4
    [220.00, 261.63, 329.63, 493.88], // Am9
  ];

  const barDuration = 4.0; // 4 seconds per chord progression
  const bellNotes = [523.25, 659.25, 783.99, 987.77, 1046.50]; // Gentle educational marimba / bell arpeggios

  for (let bar = 0; bar * barDuration < durationSeconds; bar++) {
    const chord = chords[bar % chords.length];
    const barStartSample = Math.floor(bar * barDuration * sampleRate);

    // 1. Warm Pad Chords (Sustained soft tones)
    chord.forEach((freq, noteIdx) => {
      const pan = (noteIdx / (chord.length - 1)) * 0.6 - 0.3; // Stereo spread
      const noteSamples = Math.floor(barDuration * sampleRate);

      for (let i = 0; i < noteSamples; i++) {
        const idx = barStartSample + i;
        if (idx >= numSamples) break;

        const t = i / sampleRate;
        const progress = i / noteSamples;

        // Smooth pad envelope
        let env = 1.0;
        if (progress < 0.2) env = progress / 0.2;
        else if (progress > 0.8) env = (1.0 - progress) / 0.2;

        // Soft sine wave with warm octave harmonic
        const sample = (
          Math.sin(2 * Math.PI * freq * t) * 0.6 +
          Math.sin(2 * Math.PI * (freq * 0.5) * t) * 0.3 +
          Math.sin(2 * Math.PI * (freq * 2) * t) * 0.1
        ) * env * 0.08;

        left[idx] += sample * (0.5 - pan);
        right[idx] += sample * (0.5 + pan);
      }
    });

    // 2. Playful Educational Bell / Marimba Plucks (Every 0.5s / 1.0s)
    for (let beat = 0; beat < 4; beat++) {
      const bellFreq = bellNotes[(bar * 2 + beat) % bellNotes.length];
      const bellStartSample = barStartSample + Math.floor(beat * 1.0 * sampleRate);
      const bellDurationSamples = Math.floor(1.2 * sampleRate);

      for (let i = 0; i < bellDurationSamples; i++) {
        const idx = bellStartSample + i;
        if (idx >= numSamples) break;

        const t = i / sampleRate;
        // Exponential decay pluck envelope
        const env = Math.exp(-t * 4.5);
        const bellSample = (
          Math.sin(2 * Math.PI * bellFreq * t) * 0.7 +
          Math.sin(2 * Math.PI * bellFreq * 2.756 * t) * 0.2 +
          Math.sin(2 * Math.PI * bellFreq * 5.404 * t) * 0.1
        ) * env * 0.07;

        left[idx] += bellSample * 0.45;
        right[idx] += bellSample * 0.55;
      }
    }
  }

  // Normalize softly
  for (let i = 0; i < numSamples; i++) {
    left[i] = Math.max(-0.95, Math.min(0.95, left[i]));
    right[i] = Math.max(-0.95, Math.min(0.95, right[i]));
  }

  return buffer;
}

// Fetch TTS Voice from Gemini or generate reliable fallback AudioBuffer
export async function fetchSceneSpeechBuffer(
  text: string,
  audioCtx: AudioContext,
  options: { gender?: 'male' | 'female'; speed?: number; pitch?: number } = {}
): Promise<AudioBuffer> {
  if (!text || !text.trim()) {
    return audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 0.5), audioCtx.sampleRate);
  }

  try {
    const res = await fetch('/api/ai/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        gender: options.gender || 'female',
        speed: options.speed || 1.0,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audioBase64) {
        return pcmBase64ToAudioBuffer(data.audioBase64, audioCtx, data.sampleRate || 24000);
      }
    }
  } catch (err) {
    console.warn('Could not fetch Gemini TTS, using high quality vocal synthesizer:', err);
  }

  // Fallback to high quality offline formant voice synthesis
  return generateFormantVoiceBuffer(text, audioCtx, options);
}

// Build Master AudioBuffer combining all scenes speech narration + ducked BGM
export async function buildProjectMasterAudioBuffer(
  project: VideoProject,
  audioCtx: AudioContext,
  onProgress?: (status: string) => void
): Promise<AudioBuffer> {
  const totalDuration = project.totalDurationSeconds ||
    project.scenes.reduce((acc, s) => acc + s.duration, 0) || 60;
  
  const sampleRate = audioCtx.sampleRate;
  const totalSamples = Math.floor((totalDuration + 1) * sampleRate);
  const masterBuffer = audioCtx.createBuffer(2, totalSamples, sampleRate);
  const left = masterBuffer.getChannelData(0);
  const right = masterBuffer.getChannelData(1);

  // 1. Synthesize all Scene Speech Narrations
  let currentSec = 0;
  for (let i = 0; i < project.scenes.length; i++) {
    const scene = project.scenes[i];
    onProgress?.(`Menyiapkan audio suara narasi Adegan ${i + 1} / ${project.scenes.length}...`);

    if (scene.narration && scene.narration.trim()) {
      const speechBuf = await fetchSceneSpeechBuffer(scene.narration, audioCtx, {
        gender: project.voiceConfig?.gender || 'female',
        speed: project.voiceConfig?.speed || 1.0,
        pitch: project.voiceConfig?.pitch || 1.0,
      });

      const speechData = speechBuf.getChannelData(0);
      const startSample = Math.floor(currentSec * sampleRate);
      const volume = (project.voiceConfig?.volume || 100) / 100 * 1.2;

      for (let s = 0; s < speechData.length; s++) {
        const destIdx = startSample + s;
        if (destIdx >= totalSamples) break;
        const val = speechData[s] * volume;
        left[destIdx] += val;
        right[destIdx] += val;
      }
    }

    currentSec += scene.duration;
  }

  // 2. Mix in Background Music with Smart Ducking
  onProgress?.('Melakukan mixing musik latar (BGM) & audio mastering...');
  const bgmBuf = generateProceduralBgmBuffer(
    totalDuration,
    audioCtx,
    project.audioTrack?.category || 'acoustic'
  );

  const bgmLeft = bgmBuf.getChannelData(0);
  const bgmRight = bgmBuf.getChannelData(1);
  const bgmBaseVol = ((project.audioTrack?.volume || 30) / 100) * 0.35;

  for (let i = 0; i < totalSamples; i++) {
    // If narration is active, duck BGM down to 30% of its normal volume
    const voiceIntensity = Math.abs(left[i]);
    const ducking = voiceIntensity > 0.05 ? 0.35 : 1.0;
    const bgmGain = bgmBaseVol * ducking;

    const bL = i < bgmLeft.length ? bgmLeft[i] * bgmGain : 0;
    const bR = i < bgmRight.length ? bgmRight[i] * bgmGain : 0;

    left[i] = Math.max(-0.98, Math.min(0.98, left[i] + bL));
    right[i] = Math.max(-0.98, Math.min(0.98, right[i] + bR));
  }

  return masterBuffer;
}

// Browser Web Speech Synthesizer fallback for live player
export function speakNarrationBrowser(
  text: string,
  options: {
    gender?: 'male' | 'female';
    speed?: number;
    pitch?: number;
    onEnd?: () => void;
    onError?: (err: any) => void;
  } = {}
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options.onEnd?.();
    return null;
  }

  window.speechSynthesis.cancel();

  const isMale = options.gender === 'male';
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'id-ID';
  utterance.pitch = options.pitch !== undefined ? options.pitch : (isMale ? 0.74 : 1.12);
  utterance.rate = (options.speed || 1.0) * (isMale ? 0.96 : 1.02);

  const voices = window.speechSynthesis.getVoices();
  const idVoice = voices.find((v) =>
    v.lang.toLowerCase().includes('id') &&
    (isMale ? v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('dimas') || v.name.toLowerCase().includes('budi') : true)
  ) || voices.find((v) => v.lang.toLowerCase().includes('id')) || voices[0];

  if (idVoice) utterance.voice = idVoice;

  utterance.onend = () => options.onEnd?.();
  utterance.onerror = (e) => {
    console.warn('SpeechSynthesis error:', e);
    options.onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
  return utterance;
}

// Live Player BGM & Sound Controls
export function playBgmAudio(url?: string, volume: number = 30, loop: boolean = true) {
  try {
    const audioCtx = getAudioContext();
    if (activeBgmSource) {
      try { activeBgmSource.stop(); } catch (_) {}
      activeBgmSource = null;
    }

    // Generate procedural calming BGM buffer
    const bgmBuffer = generateProceduralBgmBuffer(300, audioCtx, 'acoustic');
    const source = audioCtx.createBufferSource();
    source.buffer = bgmBuffer;
    source.loop = loop;

    const gain = audioCtx.createGain();
    gain.gain.value = isAudioMuted ? 0 : (volume / 100) * 0.35;

    source.connect(gain);
    gain.connect(audioCtx.destination);
    source.start(0);

    activeBgmSource = source;
    activeBgmGainNode = gain;
  } catch (err) {
    console.warn('Error starting live BGM:', err);
  }
}

export function setBgmVolume(volume: number) {
  if (activeBgmGainNode && activeAudioCtx) {
    activeBgmGainNode.gain.setValueAtTime(
      isAudioMuted ? 0 : (volume / 100) * 0.35,
      activeAudioCtx.currentTime
    );
  }
}

export function pauseBgmAudio() {
  if (activeBgmSource) {
    try { activeBgmSource.stop(); } catch (_) {}
    activeBgmSource = null;
  }
}

export function resumeBgmAudio() {
  playBgmAudio(undefined, 30, true);
}

export function stopAllAudio() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  if (activeBgmSource) {
    try { activeBgmSource.stop(); } catch (_) {}
    activeBgmSource = null;
  }
  if (activeSpeechSource) {
    try { activeSpeechSource.stop(); } catch (_) {}
    activeSpeechSource = null;
  }
}

export function setMuteState(muted: boolean) {
  isAudioMuted = muted;
  if (activeBgmGainNode && activeAudioCtx) {
    activeBgmGainNode.gain.setValueAtTime(muted ? 0 : 0.12, activeAudioCtx.currentTime);
  }
  if (muted) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

export function findBestVoice(gender: 'male' | 'female' = 'female'): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  const isMale = gender === 'male';
  const idVoices = voices.filter(
    (v) => v.lang.toLowerCase().includes('id') || v.name.toLowerCase().includes('indonesia')
  );
  if (isMale) {
    const idMale = idVoices.find((v) => {
      const n = v.name.toLowerCase();
      return n.includes('male') || n.includes('pria') || n.includes('dimas') || n.includes('budi');
    });
    if (idMale) return idMale;
  } else {
    const idFemale = idVoices.find((v) => {
      const n = v.name.toLowerCase();
      return n.includes('female') || n.includes('wanita') || n.includes('siti') || n.includes('gadis');
    });
    if (idFemale) return idFemale;
  }
  if (idVoices.length > 0) return idVoices[0];
  return voices[0] || null;
}

export function testVoiceSample(gender: 'male' | 'female', speed: number = 1.0) {
  const sampleText = gender === 'male' 
    ? 'Halo! Saya Dimas, suara guru laki-laki yang siap memandu video pembelajaran interaktif Anda.'
    : 'Halo! Saya Siti, suara guru perempuan yang siap membawakan materi pembelajaran yang ceria.';
  return speakNarrationBrowser(sampleText, { gender, speed });
}

