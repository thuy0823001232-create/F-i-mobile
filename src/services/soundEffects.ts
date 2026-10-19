/**
 * Procedural Web Audio Sound Synthesizer for 3D Stadium Football
 * Zero external audio files, 100% synthesized in real time.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private crowdGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;

  constructor() {
    // Lazy initialize on first user gesture
  }

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.startCrowdAmbience();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // Realistic whistle with dual frequencies and trill amplitude modulation
  public playWhistle(long = false) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const duration = long ? 1.1 : 0.45;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const trill = this.ctx.createOscillator();
    const trillGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2600, t);
    osc1.frequency.exponentialRampToValueAtTime(2850, t + duration * 0.4);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(2800, t);
    osc2.frequency.exponentialRampToValueAtTime(3000, t + duration * 0.4);

    trill.frequency.setValueAtTime(30, t); // 30Hz pea vibration
    trillGain.gain.setValueAtTime(200, t);

    trill.connect(osc1.frequency);
    trill.connect(osc2.frequency);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.04);
    gain.gain.setValueAtTime(0.38, t + duration - 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    trill.start(t);
    osc1.start(t);
    osc2.start(t);
    trill.stop(t + duration);
    osc1.stop(t + duration);
    osc2.stop(t + duration);
  }

  // Soccer ball kick thump
  public playKick(power = 1.0) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140 + power * 40, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);

    gain.gain.setValueAtTime(Math.min(0.8, 0.4 * power), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.15);

    // Subtle grass swoosh
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(600, t);
    noiseFilter.Q.setValueAtTime(2, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25 * power, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(t);
  }

  // Metal crossbar / post hit
  public playPostHit() {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.4);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.5);
  }

  // Massive GOAL crowd cheer
  public playGoalExplosion() {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    this.playWhistle(true);

    const t = this.ctx.currentTime;
    // Sub bass boom
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(95, t);
    subOsc.frequency.exponentialRampToValueAtTime(25, t + 0.7);

    subGain.gain.setValueAtTime(0.7, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(t);
    subOsc.stop(t + 0.8);

    // Stadium surge noise
    const duration = 2.5;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.linearRampToValueAtTime(1400, t + 0.6);
    filter.frequency.exponentialRampToValueAtTime(300, t + duration);

    const cheerGain = this.ctx.createGain();
    cheerGain.gain.setValueAtTime(0.1, t);
    cheerGain.gain.linearRampToValueAtTime(0.65, t + 0.3);
    cheerGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(cheerGain);
    cheerGain.connect(this.masterGain);

    noise.start(t);
  }

  // Blaster Laser shot (Battle Football Mode)
  public playLaserShot() {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.18);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Nitro Boost supersonic blast
  public playNitroBoost() {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.linearRampToValueAtTime(480, t + 0.2);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  // Car engine audio loop
  public updateEngine(speedRatio: number, isDrivingCar: boolean) {
    if (!isDrivingCar) {
      if (this.engineGain && this.ctx) {
        this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      return;
    }
    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (!this.engineOsc) {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(65, this.ctx.currentTime);
      this.engineGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);
      this.engineOsc.start();
    }

    const t = this.ctx.currentTime;
    const targetFreq = 70 + speedRatio * 180;
    this.engineOsc.frequency.linearRampToValueAtTime(targetFreq, t + 0.05);
    const targetVolume = Math.min(0.18, 0.03 + speedRatio * 0.12);
    if (this.engineGain) {
      this.engineGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : targetVolume, t + 0.05);
    }
  }

  // Tackle collision or body check
  public playTackle() {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  // Referee Yellow/Red card reveal buzzer
  public playCardAlert(isRed = false) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(isRed ? 320 : 540, t);
    osc.frequency.setValueAtTime(isRed ? 240 : 440, t + 0.15);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  // Background stadium murmur
  private startCrowdAmbience() {
    if (!this.ctx || !this.masterGain) return;

    const duration = 4.0;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = (Math.random() * 2 - 1);
      // Brown noise for crowd murmur
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 1.8;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    this.crowdGain = this.ctx.createGain();
    this.crowdGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(this.crowdGain);
    this.crowdGain.connect(this.masterGain);

    noise.start();
  }
}

export const sounds = new SoundEngine();
