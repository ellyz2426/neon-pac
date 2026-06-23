// === Neon Pac VR -- Audio Manager (procedural) ===

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientRunning = false;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private getMaster(): GainNode {
    this.getCtx();
    return this.masterGain!;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.3;
    }
    return this.muted;
  }

  playWaka(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.linearRampToValueAtTime(220, t + 0.06);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(this.getMaster());
    osc.start(t);
    osc.stop(t + 0.1);
  }

  playPowerPellet(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const startTime = t + i * 0.08;
      osc.frequency.setValueAtTime(300 + i * 200, startTime);
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
      osc.connect(gain);
      gain.connect(this.getMaster());
      osc.start(startTime);
      osc.stop(startTime + 0.12);
    }
  }

  playGhostEat(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.3);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain);
    gain.connect(this.getMaster());
    osc.start(t);
    osc.stop(t + 0.4);
  }

  playDeath(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const startTime = t + i * 0.15;
      osc.frequency.setValueAtTime(600 - i * 80, startTime);
      osc.frequency.linearRampToValueAtTime(100, startTime + 0.12);
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.14);
      osc.connect(gain);
      gain.connect(this.getMaster());
      osc.start(startTime);
      osc.stop(startTime + 0.16);
    }
  }

  playLevelComplete(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const notes = [523, 659, 784, 1047];
    for (let i = 0; i < notes.length; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const startTime = t + i * 0.15;
      osc.frequency.setValueAtTime(notes[i], startTime);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
      osc.connect(gain);
      gain.connect(this.getMaster());
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    }
  }

  playGameStart(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const melody = [262, 330, 392, 523, 392, 330, 262];
    for (let i = 0; i < melody.length; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      const startTime = t + i * 0.12;
      osc.frequency.setValueAtTime(melody[i], startTime);
      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
      osc.connect(gain);
      gain.connect(this.getMaster());
      osc.start(startTime);
      osc.stop(startTime + 0.12);
    }
  }

  playMenuSelect(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, t);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(this.getMaster());
    osc.start(t);
    osc.stop(t + 0.1);
  }

  playFrightenedLoop(playing: boolean): void {
    // Simple one-shot siren blip for frightened state
    if (!playing) return;
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(400, t + 0.2);
    osc.frequency.linearRampToValueAtTime(200, t + 0.4);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(this.getMaster());
    osc.start(t);
    osc.stop(t + 0.45);
  }

  playAchievement(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const notes = [784, 988, 1175, 1319];
    for (let i = 0; i < notes.length; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const startTime = t + i * 0.1;
      osc.frequency.setValueAtTime(notes[i], startTime);
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
      osc.connect(gain);
      gain.connect(this.getMaster());
      osc.start(startTime);
      osc.stop(startTime + 0.18);
    }
  }

  playExtraLife(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    // Triumphant ascending arpeggio
    const notes = [523, 659, 784, 1047, 1319];
    for (let i = 0; i < notes.length; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const startTime = t + i * 0.08;
      osc.frequency.setValueAtTime(notes[i], startTime);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
      osc.connect(gain);
      gain.connect(this.getMaster());
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    }
    // Add a shimmer
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = 'triangle';
    shimmer.frequency.setValueAtTime(2000, t + 0.3);
    shimmer.frequency.linearRampToValueAtTime(4000, t + 0.6);
    shimmerGain.gain.setValueAtTime(0.06, t + 0.3);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(this.getMaster());
    shimmer.start(t + 0.3);
    shimmer.stop(t + 0.8);
  }

  startAmbient(): void {
    if (this.ambientRunning) return;
    const ctx = this.getCtx();
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.value = 0;
    this.ambientGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 1);
    this.ambientGain.connect(this.getMaster());

    // Deep bass drone
    this.ambientOsc = ctx.createOscillator();
    this.ambientOsc.type = 'sine';
    this.ambientOsc.frequency.value = 55; // Low A
    this.ambientOsc.connect(this.ambientGain);
    this.ambientOsc.start();

    // Add a subtle modulator for movement
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.3;
    lfoGain.gain.value = 8;
    lfo.connect(lfoGain);
    lfoGain.connect(this.ambientOsc.frequency);
    lfo.start();

    this.ambientRunning = true;
  }

  stopAmbient(): void {
    if (!this.ambientRunning) return;
    if (this.ambientGain) {
      const ctx = this.getCtx();
      this.ambientGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    }
    setTimeout(() => {
      if (this.ambientOsc) {
        try { this.ambientOsc.stop(); } catch { /* ignore */ }
        this.ambientOsc = null;
      }
      this.ambientGain = null;
      this.ambientRunning = false;
    }, 600);
  }

  playLevelFlash(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    // Quick bright ascending sweep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(1600, t + 0.3);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(this.getMaster());
    osc.start(t);
    osc.stop(t + 0.45);
  }
}
