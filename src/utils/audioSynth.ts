// Audio & Speech Synthesis Utility for EduVideo AI

let activeAudioElement: HTMLAudioElement | null = null;
let bgmAudioElement: HTMLAudioElement | null = null;

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

  // 1. Look for Indonesian voices first
  const idVoices = voices.filter(
    (v) => v.lang.toLowerCase().includes('id') || v.name.toLowerCase().includes('indonesia')
  );

  if (isMale) {
    // Look for male indicators in Indonesian voices
    const idMale = idVoices.find((v) => {
      const n = v.name.toLowerCase();
      return (
        n.includes('male') ||
        n.includes('pria') ||
        n.includes('laki') ||
        n.includes('dimas') ||
        n.includes('budi') ||
        n.includes('ardi') ||
        n.includes('id-id-standard-b') ||
        n.includes('id-id-wavenet-b') ||
        n.includes('id-id-neural2-b')
      );
    });
    if (idMale) return idMale;
  } else {
    // Look for female indicators in Indonesian voices
    const idFemale = idVoices.find((v) => {
      const n = v.name.toLowerCase();
      return (
        n.includes('female') ||
        n.includes('wanita') ||
        n.includes('perempuan') ||
        n.includes('siti') ||
        n.includes('gadis') ||
        n.includes('wita') ||
        n.includes('id-id-standard-a') ||
        n.includes('id-id-wavenet-a') ||
        n.includes('id-id-neural2-a')
      );
    });
    if (idFemale) return idFemale;
  }

  // If any Indonesian voice exists, use it
  if (idVoices.length > 0) {
    return idVoices[0];
  }

  // Fallback to general male/female voices if no ID voice
  if (isMale) {
    const generalMale = voices.find((v) => {
      const n = v.name.toLowerCase();
      return n.includes('male') || n.includes('david') || n.includes('george') || n.includes('guy') || n.includes('james');
    });
    if (generalMale) return generalMale;
  }

  return voices[0] || null;
}

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

  // Pitch calibration: Male voice must be significantly lower pitch (0.72 - 0.76) for masculine resonance, Female voice around 1.10 - 1.15
  if (options.pitch !== undefined) {
    utterance.pitch = options.pitch;
  } else {
    utterance.pitch = isMale ? 0.74 : 1.12;
  }

  // Rate calibration
  utterance.rate = (options.speed || 1.0) * (isMale ? 0.96 : 1.02);

  // Assign best matching voice
  const chosenVoice = findBestVoice(options.gender || 'female');
  if (chosenVoice) {
    utterance.voice = chosenVoice;
  }

  utterance.onend = () => {
    options.onEnd?.();
  };

  utterance.onerror = (e) => {
    console.warn('SpeechSynthesis error:', e);
    options.onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function testVoiceSample(gender: 'male' | 'female', speed: number = 1.0) {
  const sampleText = gender === 'male' 
    ? 'Halo! Saya Dimas, suara guru laki-laki yang siap memandu video pembelajaran interaktif Anda.'
    : 'Halo! Saya Siti, suara guru perempuan yang siap membawakan materi pembelajaran yang ceria.';
  return speakNarrationBrowser(sampleText, { gender, speed });
}

export function stopAllAudio() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  if (activeAudioElement) {
    activeAudioElement.pause();
    activeAudioElement.currentTime = 0;
  }
  if (bgmAudioElement) {
    bgmAudioElement.pause();
    bgmAudioElement.currentTime = 0;
  }
}

export function playBgmAudio(url: string, volume: number = 30, loop: boolean = true) {
  if (!url) {
    if (bgmAudioElement) {
      bgmAudioElement.pause();
    }
    return;
  }

  try {
    if (!bgmAudioElement) {
      bgmAudioElement = new Audio(url);
    } else {
      if (bgmAudioElement.src !== url) {
        bgmAudioElement.src = url;
      }
    }
    bgmAudioElement.volume = Math.max(0, Math.min(1, volume / 100));
    bgmAudioElement.loop = loop;
    bgmAudioElement.play().catch((err) => {
      console.warn('Autoplay BGM prevented or audio error:', err);
    });
  } catch (e) {
    console.warn('Error playing BGM:', e);
  }
}

export function setBgmVolume(volume: number) {
  if (bgmAudioElement) {
    bgmAudioElement.volume = Math.max(0, Math.min(1, volume / 100));
  }
}

export function pauseBgmAudio() {
  if (bgmAudioElement) {
    bgmAudioElement.pause();
  }
}

export function resumeBgmAudio() {
  if (bgmAudioElement && bgmAudioElement.src) {
    bgmAudioElement.play().catch(() => {});
  }
}

