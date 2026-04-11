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

  // Page flip sound (for brochure interactions) — realistic paper rustle
  playPageFlip() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const duration = 0.35;

      // ── Layer 1: Filtered white noise (body of the rustle) ──
      const noiseLen = Math.floor(ctx.sampleRate * duration);
      const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
      const noiseData = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) {
        noiseData[i] = (Math.random() * 2 - 1);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(4500, now);
      bp.frequency.exponentialRampToValueAtTime(1500, now + duration);
      bp.Q.setValueAtTime(0.6, now);

      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(600, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.12, now + 0.01);
      noiseGain.gain.setValueAtTime(0.12, now + 0.06);
      noiseGain.gain.exponentialRampToValueAtTime(0.005, now + duration);

      noise.connect(bp);
      bp.connect(hp);
      hp.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      // ── Layer 2: Short crisp "snap" at the start (paper edge catch) ──
      const snapLen = Math.floor(ctx.sampleRate * 0.04);
      const snapBuf = ctx.createBuffer(1, snapLen, ctx.sampleRate);
      const snapData = snapBuf.getChannelData(0);
      for (let i = 0; i < snapLen; i++) {
        snapData[i] = (Math.random() * 2 - 1);
      }

      const snap = ctx.createBufferSource();
      snap.buffer = snapBuf;

      const snapHp = ctx.createBiquadFilter();
      snapHp.type = 'highpass';
      snapHp.frequency.setValueAtTime(2000, now);

      const snapGain = ctx.createGain();
      snapGain.gain.setValueAtTime(0.2, now);
      snapGain.gain.exponentialRampToValueAtTime(0.005, now + 0.04);

      snap.connect(snapHp);
      snapHp.connect(snapGain);
      snapGain.connect(ctx.destination);

      // ── Layer 3: Subtle low "whoosh" (air movement) ──
      const whoosh = ctx.createOscillator();
      whoosh.type = 'sine';
      whoosh.frequency.setValueAtTime(120, now);
      whoosh.frequency.exponentialRampToValueAtTime(80, now + 0.2);

      const whooshGain = ctx.createGain();
      whooshGain.gain.setValueAtTime(0, now);
      whooshGain.gain.linearRampToValueAtTime(0.04, now + 0.03);
      whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      whoosh.connect(whooshGain);
      whooshGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + duration);
      snap.start(now);
      snap.stop(now + 0.04);
      whoosh.start(now);
      whoosh.stop(now + 0.2);
    } catch (e) {
      // Silent fail if Web Audio API not available
    }
  }
}

export const soundManager = new SoundManager();
