/**
 * Memony Audio Synthesizer (Web Audio API)
 * -------------------------------------------------------------
 * Menghasilkan efek audio taktil murni tanpa perlu memuat file audio eksternal.
 * Ringan, instan, 0 latency, dan memiliki opsi Mute.
 */

class AudioService {
  constructor() {
    this.audioCtx = null;
    this.isMuted = localStorage.getItem("memony_sfx_muted") === "true";
  }

  _initContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem("memony_sfx_muted", this.isMuted ? "true" : "false");
    if (!this.isMuted) {
      this.playClickSound();
    }
    return this.isMuted;
  }

  getMuteState() {
    return this.isMuted;
  }

  // 1. Koin Emas Gemerincing (Dual Harmonic Sine Waves)
  playCoinSound() {
    if (this.isMuted) return;
    try {
      this._initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Note 1 (High bell)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // E6

      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.36);

      // Note 2 (Resonant Harmonic with small delay)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1567.98, now + 0.05); // G6
      osc2.frequency.exponentialRampToValueAtTime(2093.0, now + 0.15); // C7

      gain2.gain.setValueAtTime(0.12, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.46);
    } catch (e) {
      console.warn("Audio playCoin error:", e);
    }
  }

  // 2. Bel Kasir Antik ("Kaching! 🔔")
  playRegisterDing() {
    if (this.isMuted) return;
    try {
      this._initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Dual tone bell
      [1046.5, 2093.0].forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.15 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.65);
      });
    } catch (e) {
      console.warn("Audio playRegisterDing error:", e);
    }
  }

  // 3. Stempel Lilin / Cap Kertas (Wax Seal Press Thump)
  playStampSound() {
    if (this.isMuted) return;
    try {
      this._initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {
      console.warn("Audio playStamp error:", e);
    }
  }

  // 4. Laser Scan Hum (Garis Pemindai AI)
  playScanSound() {
    if (this.isMuted) return;
    try {
      this._initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(750, now + 0.2);
      osc.frequency.linearRampToValueAtTime(500, now + 0.4);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.46);
    } catch (e) {
      console.warn("Audio playScan error:", e);
    }
  }

  // 5. Click Taktil (Tombol 3D)
  playClickSound() {
    if (this.isMuted) return;
    try {
      this._initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    } catch (e) {
      console.warn("Audio playClick error:", e);
    }
  }
}

window.audioService = new AudioService();
