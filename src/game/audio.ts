export class Sfx {
  private ctx: AudioContext | null = null;
  muted = false;
  private lastCoin = 0;

  unlock() {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!this.ctx) this.ctx = new AC();
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  toggle() {
    this.muted = !this.muted;
    return this.muted;
  }

  play(kind: string) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    if (kind === "coin") {
      if (now - this.lastCoin < 0.045) return;
      this.lastCoin = now;
      this.tone(880, 1280, 0.09, "sine", 0.05);
      return;
    }
    if (kind === "jump") this.tone(420, 640, 0.1, "square", 0.04);
    else if (kind === "slide") this.tone(220, 90, 0.12, "sawtooth", 0.03);
    else if (kind === "shield") this.tone(520, 880, 0.16, "triangle", 0.05);
    else if (kind === "break") this.tone(300, 80, 0.18, "square", 0.05);
    else if (kind === "near") this.tone(740, 980, 0.08, "triangle", 0.03);
    else if (kind === "die") {
      this.tone(240, 60, 0.32, "sawtooth", 0.06);
    } else if (kind === "start") {
      this.tone(392, 392, 0.08, "triangle", 0.04);
      window.setTimeout(() => this.tone(523, 784, 0.12, "triangle", 0.04), 90);
    } else if (kind === "best") {
      this.tone(523, 659, 0.1, "triangle", 0.05);
      window.setTimeout(() => this.tone(784, 1046, 0.16, "triangle", 0.05), 110);
    }
  }

  private tone(
    from: number,
    to: number,
    dur: number,
    type: OscillatorType,
    gain: number,
  ) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + dur);
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(amp);
    amp.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }
}
