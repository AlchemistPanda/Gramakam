// Simple sound effects using Web Audio API

class SoundManager {
  private audioContext: AudioContext | null = null;
  private muted: boolean = false;

  setMuted(value: boolean) {
    this.muted = value;
  }

  isMuted(): boolean {
    return this.muted;
  }

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  private playSound(frequency: number, duration: number, gainValue: number = 0.3) {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(gainValue, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // Silent fail
    }
  }

  // Beep sound for hitting spotlight
  playHit() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      // Silent fail if Web Audio API not available
    }
  }

  // Different combo sounds for each multiplier level
  playComboX(multiplier: number) {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      
      // Different frequencies for different combo levels
      const frequencies = {
        2: [900, 1100],
        3: [1000, 1200, 1400],
        4: [1100, 1300, 1500, 1700],
        5: [1200, 1400, 1600, 1800, 2000],
      };
      
      const freqs = frequencies[multiplier as keyof typeof frequencies] || [1000];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const startTime = now + i * 0.05;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.12);
        
        osc.start(startTime);
        osc.stop(startTime + 0.12);
      });
    } catch (e) {
      // Silent fail
    }
  }

  // Combo sound (higher pitch) - traditional style
  playCombo() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      // Silent fail
    }
  }

  // Error sound for missing spotlight
  playMiss() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      // Silent fail
    }
  }

  // Enhanced Level up sound (ascending notes with more drama)
  playLevelUp() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const notes = [523, 659, 784, 1047]; // C, E, G, C (octave higher)

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const startTime = now + i * 0.1;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.18);

        osc.start(startTime);
        osc.stop(startTime + 0.18);
      });
    } catch (e) {
      // Silent fail
    }
  }

  // Quiz correct sound (happy chime)
  playQuizCorrect() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      // Silent fail
    }
  }

  // Quiz incorrect sound (sad buzz)
  playQuizIncorrect() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(200, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      // Silent fail
    }
  }

  // Game over sound (descending notes)
  playGameOver() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const notes = [400, 350, 300]; // Descending

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const startTime = now + i * 0.15;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

        osc.start(startTime);
        osc.stop(startTime + 0.2);
      });
    } catch (e) {
      // Silent fail
    }
  }

  // Page flip sound (for brochure interactions) — play MP3 audio file
  playPageFlip() {
    if (this.muted) return;
    try {
      const audio = new Audio('/freesound_community-page-flip-47177.mp3');
      audio.volume = 0.6;
      audio.play().catch(() => {
        // Silent fail if audio can't play
      });
    } catch (e) {
      // Silent fail if Audio API not available
    }
  }
}

export const soundManager = new SoundManager();
