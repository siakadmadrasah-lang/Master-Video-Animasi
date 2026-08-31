import { SoundEffectType } from '../types';

class VideoAudioMixer {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private mediaDest: MediaStreamAudioDestinationNode | null = null;

  private isBgmPlaying = false;
  private currentBgmOscillators: Array<{ stop: () => void }> = [];
  private bgmMood: string = 'epic';
  private bgmVolume = 0.35;
  private isMuted = false;

  private activeVoiceSource: AudioBufferSourceNode | null = null;
  private lastTriggeredSfxTime: number = -1;

  public init() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.bgmVolume;

      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.value = 1.0;

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.6;

      this.bgmGain.connect(this.masterGain);
      this.voiceGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);

      this.masterGain.connect(this.ctx.destination);

      // Destination for video export stream
      this.mediaDest = this.ctx.createMediaStreamDestination();
      this.masterGain.connect(this.mediaDest);
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAudioStreamDestination(): MediaStreamAudioDestinationNode | null {
    this.init();
    return this.mediaDest;
  }

  public setMasterMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1, this.ctx.currentTime);
    }
  }

  public setBgmVolume(volume: number) {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
    }
  }

  public setBgmMood(mood: string) {
    this.bgmMood = mood.toLowerCase();
  }

  // Play procedural sound effects
  public playSoundEffect(type: SoundEffectType) {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted || type === 'none') return;

    const now = this.ctx.currentTime;

    if (type === 'whoosh') {
      // Wind / Whoosh sweep
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(2500, now + 0.2);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.5);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'glitch_hit') {
      // Glitch high frequency digital click & buzz
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.setValueAtTime(300, now + 0.05);
      osc.frequency.setValueAtTime(900, now + 0.1);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'cinematic_boom' || type === 'bass_drop') {
      // Deep sub-bass cinematic impact
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 1.2);

      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 1.2);
    } else if (type === 'riser') {
      // Tension riser
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 1.5);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 1.4);
      gain.gain.linearRampToValueAtTime(0.001, now + 1.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 1.5);
    } else if (type === 'camera_click') {
      // Camera shutter snap
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.setValueAtTime(800, now + 0.03);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.08);
    }
  }

  // Start background procedural music loop
  public startBgm() {
    this.init();
    if (!this.ctx || !this.bgmGain || this.isBgmPlaying) return;

    this.isBgmPlaying = true;
    const now = this.ctx.currentTime;

    // Create ambient cinematic chords / rhythm
    const chordFrequencies =
      this.bgmMood.includes('synth') || this.bgmMood.includes('cyber')
        ? [110, 164.81, 220, 329.63] // A minor synth
        : this.bgmMood.includes('lofi')
        ? [130.81, 196.0, 246.94, 329.63] // C maj 7 lofi
        : [98.0, 146.83, 196.0, 293.66]; // G minor dramatic

    const activeNodes: Array<{ stop: () => void }> = [];

    chordFrequencies.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

      osc.type = idx === 0 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Subtle LFO pulse
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 0.3 + idx * 0.15;
      lfoGain.gain.value = 0.04;
      lfo.connect(gain.gain);
      lfo.start(now);

      gain.gain.setValueAtTime(0.06 / (idx + 1), now);

      if (panner) {
        panner.pan.value = (idx % 2 === 0 ? -1 : 1) * 0.4;
        osc.connect(panner);
        panner.connect(gain);
      } else {
        osc.connect(gain);
      }

      gain.connect(this.bgmGain!);
      osc.start(now);

      activeNodes.push({
        stop: () => {
          try {
            osc.stop();
            lfo.stop();
          } catch (e) {}
        },
      });
    });

    this.currentBgmOscillators = activeNodes;
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    this.currentBgmOscillators.forEach((node) => node.stop());
    this.currentBgmOscillators = [];
  }

  // Play audio voiceover PCM / blob
  public async playVoiceover(pcmBase64?: string, textFallback?: string) {
    this.init();
    if (!this.ctx || !this.voiceGain || this.isMuted) return;

    // Duck BGM volume
    if (this.bgmGain) {
      this.bgmGain.gain.setTargetAtTime(this.bgmVolume * 0.25, this.ctx.currentTime, 0.1);
    }

    if (pcmBase64) {
      try {
        const binary = atob(pcmBase64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        // 16-bit PCM at 24kHz
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768.0;
        }

        const buffer = this.ctx.createBuffer(1, float32Array.length, 24000);
        buffer.getChannelData(0).set(float32Array);

        if (this.activeVoiceSource) {
          try {
            this.activeVoiceSource.stop();
          } catch (e) {}
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.voiceGain);
        source.onended = () => {
          // Restore BGM volume
          if (this.bgmGain && this.ctx) {
            this.bgmGain.gain.setTargetAtTime(this.bgmVolume, this.ctx.currentTime, 0.3);
          }
        };
        source.start();
        this.activeVoiceSource = source;
        return;
      } catch (err) {
        console.warn('Could not decode PCM audio, falling back to speech synthesis:', err);
      }
    }

    // Web Speech API fallback for instant voiceover
    if (textFallback && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textFallback);
      utterance.rate = 1.0;
      utterance.pitch = 0.95;
      utterance.onend = () => {
        if (this.bgmGain && this.ctx) {
          this.bgmGain.gain.setTargetAtTime(this.bgmVolume, this.ctx.currentTime, 0.3);
        }
      };
      window.speechSynthesis.speak(utterance);
    }
  }

  public stopAll() {
    this.stopBgm();
    if (this.activeVoiceSource) {
      try {
        this.activeVoiceSource.stop();
      } catch (e) {}
      this.activeVoiceSource = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const videoAudioMixer = new VideoAudioMixer();
