// Suraksha SFX Engine — Web Audio API Synthesizer (Zero External Dependencies)
const SFX = (() => {
  let audioCtx = null;
  let enabled = localStorage.getItem('suraksha-sfx-enabled') !== 'false';

  function getCtx() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, duration, type = 'sine', gainVal = 0.15) {
    if (!enabled) return;
    try {
      const ctx = getCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('SFX play error:', e);
    }
  }

  return {
    isEnabled: () => enabled,
    toggle: () => {
      enabled = !enabled;
      localStorage.setItem('suraksha-sfx-enabled', enabled ? 'true' : 'false');
      return enabled;
    },
    click: () => {
      playTone(600, 0.05, 'triangle', 0.08);
    },
    switch: () => {
      if (!enabled) return;
      try {
        const ctx = getCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } catch (e) {}
    },
    sos: () => {
      if (!enabled) return;
      try {
        const ctx = getCtx();
        if (!ctx) return;
        [0, 0.15, 0.3].forEach((delay, idx) => {
          setTimeout(() => {
            playTone(880 + idx * 100, 0.12, 'sawtooth', 0.25);
          }, delay * 1000);
        });
      } catch (e) {}
    },
    golden: () => {
      if (!enabled) return;
      try {
        const ctx = getCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1040, ctx.currentTime + 0.2);
        osc.frequency.linearRampToValueAtTime(520, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } catch (e) {}
    },
    connected: () => {
      if (!enabled) return;
      try {
        const ctx = getCtx();
        if (!ctx) return;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          setTimeout(() => {
            playTone(freq, 0.18, 'sine', 0.12);
          }, idx * 70);
        });
      } catch (e) {}
    },
    incomingCall: () => {
      if (!enabled) return;
      try {
        const ctx = getCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        for (let cycle = 0; cycle < 2; cycle++) {
          const startTime = now + cycle * 1.5;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine'; osc1.frequency.setValueAtTime(440, startTime);
          osc2.type = 'sine'; osc2.frequency.setValueAtTime(480, startTime);

          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
          gain.gain.setValueAtTime(0.2, startTime + 1.1);
          gain.gain.linearRampToValueAtTime(0.001, startTime + 1.2);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(startTime); osc1.stop(startTime + 1.2);
          osc2.start(startTime); osc2.stop(startTime + 1.2);
        }
      } catch (e) {
        console.warn('[Incoming Call SFX Error]', e);
      }
    }
  };
})();

document.addEventListener('click', () => {
  if (SFX.isEnabled()) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') ctx.resume();
    }
  }
}, { once: true });
