// === Neon Pac VR -- Audio Manager (procedural) ===

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientRunning = false;

  // Siren state
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenRunning = false;
  private sirenLevel = 0;
  private static readonly SIREN_FREQS = [180, 240, 320, 420]; // escalating urgency

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

  // ---- Siren (escalating urgency as dots decrease) ----
  startSiren(level = 0): void {
    this.sirenLevel = level;
    if (this.sirenRunning) {
      this.updateSirenFreq();
      return;
    }
    const ctx = this.getCtx();
    this.sirenGain = ctx.createGain();
    this.sirenGain.gain.value = 0;
    this.sirenGain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.5);
    this.sirenGain.connect(this.getMaster());

    this.sirenOsc = ctx.createOscillator();
    this.sirenOsc.type = 'sawtooth';
    this.sirenOsc.frequency.value = AudioManager.SIREN_FREQS[level] ?? 180;
    this.sirenOsc.connect(this.sirenGain);
    this.sirenOsc.start();
    this.sirenRunning = true;
  }

  updateSirenLevel(level: number): void {
    this.sirenLevel = level;
    this.updateSirenFreq();
  }

  private updateSirenFreq(): void {
    if (!this.sirenOsc || !this.sirenRunning) return;
    const ctx = this.getCtx();
    const freq = AudioManager.SIREN_FREQS[this.sirenLevel] ?? 180;
    this.sirenOsc.frequency.linearRampToValueAtTime(freq, ctx.currentTime + 0.3);
  }

  stopSiren(): void {
    if (!this.sirenRunning) return;
    if (this.sirenGain) {
      const ctx = this.getCtx();
      this.sirenGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    }
    setTimeout(() => {
      if (this.sirenOsc) {
        try { this.sirenOsc.stop(); } catch { /* ignore */ }
        this.sirenOsc = null;
      }
      this.sirenGain = null;
      this.sirenRunning = false;
    }, 400);
  }

  // ---- Tunnel warp sound ----
  playTunnelWarp(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.3);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain);
    gain.connect(this.getMaster());
    osc.start(t);
    osc.stop(t + 0.4);
  }

  // ---- Power-up sounds ----
  playPowerUpCollect(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    // Bright magical shimmer
    const notes = [880, 1100, 1320, 1760];
    for (let i = 0; i < notes.length; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const st = t + i * 0.06;
      osc.frequency.setValueAtTime(notes[i], st);
      gain.gain.setValueAtTime(0.18, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.12);
      osc.connect(gain);
      gain.connect(this.getMaster());
      osc.start(st);
      osc.stop(st + 0.15);
    }
  }

  playPowerUpExpire(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    // Descending fade
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.3);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain);
    gain.connect(this.getMaster());
    osc.start(t);
    osc.stop(t + 0.4);
  }

  playShieldBlock(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    // Metallic clang
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = 'square';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(300, t);
    osc2.frequency.setValueAtTime(450, t);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.getMaster());
    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.3);
    osc2.stop(t + 0.3);
  }

  playGhostFreeze(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    // Ice crystallize sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, t);
    osc.frequency.exponentialRampToValueAtTime(500, t + 0.2);
    osc.frequency.exponentialRampToValueAtTime(1500, t + 0.4);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain);
    gain.connect(this.getMaster());
    osc.start(t);
    osc.stop(t + 0.55);
  }

  // ---- Streak combo sound ----
  playStreakUp(multiplier: number): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const baseFreq = 400 + multiplier * 200;
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const st = t + i * 0.06;
      osc.frequency.setValueAtTime(baseFreq + i * 100, st);
      gain.gain.setValueAtTime(0.12, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.1);
      osc.connect(gain);
      gain.connect(this.getMaster());
      osc.start(st);
      osc.stop(st + 0.12);
    }
  }
}
