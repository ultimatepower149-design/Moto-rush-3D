class SoundService {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning: boolean = false;
  private nitroGain: GainNode | null = null;
  private nitroNoise: AudioBufferSourceNode | null = null;

  // Music system
  private musicInterval: number | null = null;
  private isMusicPlaying: boolean = false;
  private musicStep: number = 0;

  private sfxVolume: number = 0.9;
  private musicVolume: number = 0.6;
  private masterVolume: number = 0.8;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public updateVolumes(master: number, sfx: number, music: number, soundOn: boolean, musicOn: boolean) {
    this.masterVolume = master;
    this.sfxVolume = sfx;
    this.musicVolume = music;
    this.soundEnabled = soundOn;
    this.musicEnabled = musicOn;

    if (!this.musicEnabled && this.isMusicPlaying) {
      this.stopMusic();
    } else if (this.musicEnabled && !this.isMusicPlaying) {
      this.startMusic();
    }
  }

  // --- MOTORCYCLE ENGINE SOUND ---
  public startEngine(basePitch: number = 90) {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || this.isEngineRunning) return;

    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(basePitch, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(basePitch * 3.5, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      const vol = this.masterVolume * this.sfxVolume * 0.18;
      this.engineGain.gain.setValueAtTime(vol, this.ctx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
      this.isEngineRunning = true;
    } catch {
      // Audio autoplay policy
    }
  }

  public updateEnginePitch(speedRatio: number, isAccelerating: boolean, basePitch: number = 90) {
    if (!this.isEngineRunning || !this.ctx || !this.engineOsc || !this.engineFilter) return;

    // Simulate multi-gear engine rev climb
    // Speed ratio is 0 to 1
    const gears = 6;
    const gearProgress = (speedRatio * gears) % 1;
    const gearIndex = Math.min(Math.floor(speedRatio * gears), gears - 1);
    
    // Frequency climbs with gear revs plus baseline gear multiplier
    const gearBase = 1 + gearIndex * 0.18;
    const accelBoost = isAccelerating ? 1.15 : 0.95;
    const targetFreq = (basePitch * gearBase + gearProgress * 120) * accelBoost;

    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);
    this.engineFilter.frequency.setTargetAtTime(targetFreq * 3.2, this.ctx.currentTime, 0.08);

    if (this.engineGain) {
      const vol = this.soundEnabled ? this.masterVolume * this.sfxVolume * (0.16 + speedRatio * 0.12) : 0;
      this.engineGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1);
    }
  }

  public stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      if (this.engineOsc) {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      }
      if (this.engineGain) {
        this.engineGain.disconnect();
      }
    } catch {
      // ignore
    }
    this.isEngineRunning = false;
    this.engineOsc = null;
    this.engineGain = null;
    this.engineFilter = null;
  }

  // --- NITRO BOOST SOUND ---
  public playNitro(active: boolean) {
    if (!this.soundEnabled || !active) {
      if (this.nitroGain && this.ctx) {
        this.nitroGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      }
      return;
    }

    this.initContext();
    if (!this.ctx) return;

    if (!this.nitroGain) {
      // Create white noise buffer for whoosh
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      this.nitroNoise = this.ctx.createBufferSource();
      this.nitroNoise.buffer = buffer;
      this.nitroNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      this.nitroGain = this.ctx.createGain();
      this.nitroGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.nitroNoise.connect(filter);
      filter.connect(this.nitroGain);
      this.nitroGain.connect(this.ctx.destination);
      this.nitroNoise.start();
    }

    const vol = this.masterVolume * this.sfxVolume * 0.3;
    this.nitroGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1);
  }

  // --- BRAKE SQUEAL ---
  public playBrake() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.18);

    const vol = this.masterVolume * this.sfxVolume * 0.08;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  // --- COIN PICKUP CHIME ---
  public playCoin() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [987.77, 1318.51]; // B5 then E6
    notes.forEach((freq, idx) => {
      const startTime = this.ctx!.currentTime + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      const vol = this.masterVolume * this.sfxVolume * 0.35;
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  }

  // --- NEAR-MISS SWOOSH ---
  public playNearMiss() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.22);

    const vol = this.masterVolume * this.sfxVolume * 0.45;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  // --- CRASH IMPACT SOUND ---
  public playCrash() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    // Sub-bass thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, this.ctx.currentTime);
    subOsc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.6);

    const subVol = this.masterVolume * this.sfxVolume * 0.8;
    subGain.gain.setValueAtTime(subVol, this.ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start();
    subOsc.stop(this.ctx.currentTime + 0.6);

    // Noise crunch
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.5);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(900, this.ctx.currentTime);
    noiseFilter.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.5);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.7, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noiseSource.start();
  }

  // --- HORN / HONK ---
  public playHorn() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    [440, 520].forEach(freq => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);

      const vol = this.masterVolume * this.sfxVolume * 0.25;
      gain.gain.setValueAtTime(vol, this.ctx!.currentTime);
      gain.gain.setValueAtTime(vol, this.ctx!.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start();
      osc.stop(this.ctx!.currentTime + 0.3);
    });
  }

  // --- COUNTDOWN TONE ---
  public playCountdown(isGo: boolean = false) {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const freq = isGo ? 880 : 440;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    const vol = this.masterVolume * this.sfxVolume * 0.4;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (isGo ? 0.4 : 0.2));

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + (isGo ? 0.4 : 0.2));
  }

  // --- UI BUTTON CLICK ---
  public playClick() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(250, this.ctx.currentTime + 0.06);

    const vol = this.masterVolume * this.sfxVolume * 0.2;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  // --- REWARD FANFARE ---
  public playRewardFanfare() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const startTime = this.ctx!.currentTime + idx * 0.1;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      const vol = this.masterVolume * this.sfxVolume * 0.3;
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  // --- PROCEDURAL SYNTHWAVE MUSIC ENGINE ---
  public startMusic() {
    if (!this.musicEnabled || this.isMusicPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    this.isMusicPlaying = true;
    this.musicStep = 0;

    // 128 BPM -> 16th note ~ 117ms
    const stepDuration = 0.117;
    const bassNotes = [55, 55, 65.41, 55, 49, 49, 58.27, 49]; // A1, A1, C2, A1, G1, G1, Bb1, G1
    const leadNotes = [220, 0, 261.63, 0, 329.63, 293.66, 0, 261.63, 220, 329.63, 0, 392, 329.63, 0, 293.66, 0];

    const playStep = () => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicEnabled) return;

      const now = this.ctx.currentTime;
      const bassNote = bassNotes[Math.floor(this.musicStep / 2) % bassNotes.length];
      const leadNote = leadNotes[this.musicStep % leadNotes.length];

      // Bass synth
      if (this.musicStep % 2 === 0 && bassNote > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bassNote, now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, now);

        const vol = this.masterVolume * this.musicVolume * 0.22;
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 1.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + stepDuration * 1.8);
      }

      // Lead melody synth
      if (leadNote > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(leadNote, now);

        const vol = this.masterVolume * this.musicVolume * 0.12;
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.85);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + stepDuration * 0.85);
      }

      this.musicStep++;
    };

    this.musicInterval = window.setInterval(playStep, stepDuration * 1000);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public cleanup() {
    this.stopEngine();
    this.stopMusic();
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close();
      } catch {
        // ignore
      }
      this.ctx = null;
    }
  }
}

export const sound = new SoundService();
