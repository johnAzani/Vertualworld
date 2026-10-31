/**
 * Procedural atmosphere audio for the Abuja world — zero audio assets.
 *
 * Everything is synthesized live with the Web Audio API:
 *   - wind and distant city hum (looped filtered noise with slow LFOs)
 *   - daytime bird chirps and night-time cricket pulses
 *   - rain patter with rare low thunder during heavy showers
 *   - footsteps, jump/land thumps and UI blips
 *
 * The engine degrades to a silent no-op when the Web Audio API is missing
 * (e.g. headless tests), so callers can use it unconditionally.
 */

const STORAGE_KEY = 'vertualworld-sound';

function noop() {}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createSilentAudio() {
  return {
    available: false,
    start: noop,
    setEnabled: noop,
    isEnabled: () => false,
    stats: { birds: 0, crickets: 0, honks: 0, thunders: 0 },
    setEnvironment: noop,
    update: noop,
    footstep: noop,
    jump: noop,
    land: noop,
    playThunder: noop,
    playUiBlip: noop,
    dispose: noop,
  };
}

function createNoiseBuffer(context, seconds = 2) {
  const frameCount = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const data = buffer.getChannelData(0);
  // Slightly shaped white noise: a touch of low-pass memory so loops sound
  // less like static hiss and more like moving air.
  let previous = 0;
  for (let i = 0; i < frameCount; i += 1) {
    const white = Math.random() * 2 - 1;
    previous = previous * 0.82 + white * 0.18;
    data[i] = white * 0.55 + previous * 0.45;
  }
  return buffer;
}

export function createAtmosphereAudio({
  audioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext ?? null,
  storage = globalThis.localStorage ?? null,
  random = Math.random,
  masterVolume = 0.62,
} = {}) {
  if (!audioContextClass) return createSilentAudio();

  const safeRandom = typeof random === 'function' ? random : Math.random;
  const state = {
    started: false,
    enabled: true,
    night: 0,
    indoors: 0,
    rain: 0,
    harmattan: 0,
    nextBirdAt: 0,
    nextCricketAt: 0,
    nextHonkAt: 0,
    clock: 0,
    stats: { birds: 0, crickets: 0, honks: 0, thunders: 0 },
  };

  try {
    const stored = storage?.getItem?.(STORAGE_KEY);
    if (stored === 'muted') state.enabled = false;
  } catch {
    // Storage can be unavailable; default to sound on.
  }

  let context = null;
  let masterGain = null;
  let noiseBuffer = null;
  let windGain = null;
  let humGain = null;
  let roomGain = null;
  let rainHighGain = null;
  let rainLowGain = null;
  const liveSources = new Set();

  function track(node) {
    liveSources.add(node);
    node.addEventListener?.('ended', () => liveSources.delete(node));
    return node;
  }

  function buildLoop({ filterType, frequency, q = 0.7, gain, lfoRate, lfoDepthToFrequency = 0, lfoDepthToGain = 0 }) {
    const source = context.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = frequency;
    filter.Q.value = q;
    const gainNode = context.createGain();
    gainNode.gain.value = gain;
    source.connect(filter).connect(gainNode).connect(masterGain);
    if (lfoDepthToFrequency > 0) {
      const lfo = context.createOscillator();
      lfo.frequency.value = lfoRate;
      const lfoGain = context.createGain();
      lfoGain.gain.value = lfoDepthToFrequency;
      lfo.connect(lfoGain).connect(filter.frequency);
      lfo.start();
    }
    if (lfoDepthToGain > 0) {
      const lfo = context.createOscillator();
      lfo.frequency.value = lfoRate * 1.37;
      const lfoGain = context.createGain();
      lfoGain.gain.value = lfoDepthToGain;
      lfo.connect(lfoGain).connect(gainNode.gain);
      lfo.start();
    }
    source.start();
    return gainNode;
  }

  function envelope(gainNode, now, peak, attack, hold, release) {
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + attack);
    gainNode.gain.setValueAtTime(Math.max(0.0002, peak), now + attack + hold);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + attack + hold + release);
  }

  function oneShotNoise({ filterType = 'bandpass', from, to = from, q = 1, peak = 0.1, attack = 0.008, release = 0.09, playbackRate = 1 }) {
    if (!state.started || !state.enabled) return;
    const now = context.currentTime;
    const source = track(context.createBufferSource());
    source.buffer = noiseBuffer;
    source.playbackRate.value = playbackRate;
    const filter = context.createBiquadFilter();
    filter.type = filterType;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(from, now);
    if (to !== from) filter.frequency.exponentialRampToValueAtTime(Math.max(40, to), now + attack + release);
    const gainNode = context.createGain();
    envelope(gainNode, now, peak, attack, 0, release);
    source.connect(filter).connect(gainNode).connect(masterGain);
    source.start(now);
    source.stop(now + attack + release + 0.05);
  }

  function oneShotTone({ type = 'sine', from, to = from, peak = 0.05, attack = 0.006, release = 0.1, when = 0 }) {
    if (!state.started || !state.enabled) return;
    const now = context.currentTime + when;
    const oscillator = track(context.createOscillator());
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, now);
    if (to !== from) oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, to), now + attack + release);
    const gainNode = context.createGain();
    envelope(gainNode, now, peak, attack, 0, release);
    oscillator.connect(gainNode).connect(masterGain);
    oscillator.start(now);
    oscillator.stop(now + attack + release + 0.05);
  }

  function birdChirp() {
    state.stats.birds += 1;
    const notes = 2 + Math.floor(safeRandom() * 3);
    const base = 2100 + safeRandom() * 900;
    for (let i = 0; i < notes; i += 1) {
      const when = i * (0.11 + safeRandom() * 0.07);
      const top = base + safeRandom() * 620;
      oneShotTone({ type: 'sine', from: top * 0.82, to: top, peak: 0.028, attack: 0.02, release: 0.075, when });
      oneShotTone({ type: 'sine', from: top, to: top * 0.86, peak: 0.02, attack: 0.012, release: 0.06, when: when + 0.06 });
    }
  }

  function cricketBurst() {
    state.stats.crickets += 1;
    const pulses = 4 + Math.floor(safeRandom() * 3);
    for (let i = 0; i < pulses; i += 1) {
      oneShotTone({ type: 'triangle', from: 4100 + safeRandom() * 320, peak: 0.011, attack: 0.004, release: 0.028, when: i * 0.046 });
    }
  }

  function thunderRumble() {
    if (!state.started || !state.enabled) return;
    state.stats.thunders += 1;
    const now = context.currentTime;
    const source = track(context.createBufferSource());
    source.buffer = noiseBuffer;
    source.playbackRate.value = 0.42 + safeRandom() * 0.16;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 110 + safeRandom() * 45;
    const gainNode = context.createGain();
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.26, now + 0.5);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
    source.connect(filter).connect(gainNode).connect(masterGain);
    source.start(now);
    source.stop(now + 3.4);
  }

  function distantHonk() {
    state.stats.honks += 1;
    const base = 360 + safeRandom() * 180;
    oneShotTone({ type: 'square', from: base, to: base * 0.94, peak: 0.016, attack: 0.012, release: 0.16 });
    if (safeRandom() > 0.45) {
      oneShotTone({ type: 'square', from: base * 1.18, to: base * 1.1, peak: 0.013, attack: 0.01, release: 0.13, when: 0.22 });
    }
  }

  return {
    available: true,

    start() {
      if (state.started) return;
      try {
        context = new audioContextClass();
      } catch {
        context = null;
        return;
      }
      if (!context) return;
      state.started = true;

      masterGain = context.createGain();
      masterGain.gain.value = state.enabled ? masterVolume : 0;
      masterGain.connect(context.destination);

      noiseBuffer = createNoiseBuffer(context);

      // Wind: band-passed noise, slow frequency wander.
      windGain = buildLoop({ filterType: 'bandpass', frequency: 420, q: 0.55, gain: 0.05, lfoRate: 0.055, lfoDepthToFrequency: 130, lfoDepthToGain: 0.014 });
      // Distant city hum.
      humGain = buildLoop({ filterType: 'lowpass', frequency: 155, q: 0.4, gain: 0.055, lfoRate: 0.031, lfoDepthToGain: 0.016 });
      // Indoor room tone (crossfaded up when inside a residence).
      roomGain = buildLoop({ filterType: 'lowpass', frequency: 300, q: 0.3, gain: 0.0001 });
      // Rain patter: airy top end plus a low body.
      rainHighGain = buildLoop({ filterType: 'highpass', frequency: 1150, q: 0.4, gain: 0.0001 });
      rainLowGain = buildLoop({ filterType: 'lowpass', frequency: 420, q: 0.5, gain: 0.0001 });

      const now = context.currentTime;
      state.clock = now;
      state.nextBirdAt = now + 1.2 + safeRandom() * 3;
      state.nextCricketAt = now + 2 + safeRandom() * 3;
      state.nextHonkAt = now + 14 + safeRandom() * 24;

      if (!state.enabled && typeof context.suspend === 'function') context.suspend();
    },

    setEnabled(enabled) {
      state.enabled = Boolean(enabled);
      try {
        storage?.setItem?.(STORAGE_KEY, state.enabled ? 'on' : 'muted');
      } catch {
        // Persisting the preference is best-effort.
      }
      if (!state.started || !context) return;
      if (state.enabled) {
        if (typeof context.resume === 'function') context.resume();
        masterGain.gain.setTargetAtTime?.(masterVolume, context.currentTime, 0.08) ?? (masterGain.gain.value = masterVolume);
      } else {
        masterGain.gain.setTargetAtTime?.(0, context.currentTime, 0.05) ?? (masterGain.gain.value = 0);
      }
    },

    isEnabled() {
      return state.enabled;
    },

    /** Introspection for tests and debuggers: how many ambient events fired. */
    get stats() {
      return { ...state.stats };
    },

    setEnvironment({ night = 0, indoors = 0, rain = 0, harmattan = 0 } = {}) {
      state.night = clamp(Number(night) || 0, 0, 1);
      state.indoors = clamp(Number(indoors) || 0, 0, 1);
      state.rain = clamp(Number(rain) || 0, 0, 1);
      state.harmattan = clamp(Number(harmattan) || 0, 0, 1);
      if (!state.started || !context) return;
      const outdoorFactor = 1 - state.indoors * 0.74;
      windGain.gain.value = (0.05 + state.harmattan * 0.024) * outdoorFactor * (1 - state.rain * 0.22);
      humGain.gain.value = 0.05 + state.rain * 0.014 + state.indoors * 0.012;
      roomGain.gain.value = 0.0001 + state.indoors * 0.036;
      rainHighGain.gain.value = state.rain * 0.1 * outdoorFactor;
      rainLowGain.gain.value = state.rain * 0.055 * (1 - state.indoors * 0.4);
    },

    update(delta = 1 / 60) {
      if (!state.started || !state.enabled || !context) return;
      // Schedule against an internal clock that is advanced by render frames so
      // behaviour is deterministic and independent of the audio hardware clock.
      state.clock += Number.isFinite(delta) && delta > 0 ? Math.min(delta, 0.5) : 0;
      const now = state.clock;
      if (state.night < 0.6 && state.rain < 0.35 && now >= state.nextBirdAt) {
        birdChirp();
        state.nextBirdAt = now + 2.4 + safeRandom() * 7.5;
      }
      if (state.night > 0.42 && state.rain < 0.5 && now >= state.nextCricketAt) {
        cricketBurst();
        state.nextCricketAt = now + 0.55 + safeRandom() * 1.15;
      }
      if (state.night < 0.62 && state.rain < 0.45 && now >= state.nextHonkAt) {
        distantHonk();
        state.nextHonkAt = now + 16 + safeRandom() * 38;
      }
    },

    footstep(surface = 'grass', intensity = 1) {
      const frequencies = { grass: 470, dirt: 520, stone: 1250, road: 900, wood: 720 };
      const base = frequencies[surface] ?? 520;
      const gain = 0.085 * clamp(Number(intensity) || 1, 0.35, 1.4);
      oneShotNoise({ filterType: 'bandpass', from: base * (0.88 + safeRandom() * 0.26), q: 1.05, peak: gain, attack: 0.006, release: 0.075, playbackRate: 0.82 + safeRandom() * 0.36 });
      // Wet-weather splash layer on top of the step.
      if (state.rain > 0.28) {
        oneShotNoise({ filterType: 'highpass', from: 1500, peak: gain * 0.5 * state.rain, attack: 0.004, release: 0.09, playbackRate: 1.1 + safeRandom() * 0.3 });
      }
    },

    jump() {
      oneShotNoise({ filterType: 'bandpass', from: 320, to: 900, q: 0.9, peak: 0.05, attack: 0.02, release: 0.12 });
    },

    land(impact = 1) {
      const force = clamp(Number(impact) || 1, 0.4, 3.2);
      oneShotTone({ type: 'sine', from: 92, to: 48, peak: 0.13 * force, attack: 0.008, release: 0.22 });
      oneShotNoise({ filterType: 'lowpass', from: 280, peak: 0.075 * force, attack: 0.005, release: 0.12 });
    },

    playThunder() {
      thunderRumble();
    },

    playUiBlip(kind = 'tap') {
      if (kind === 'success') {
        oneShotTone({ type: 'sine', from: 660, to: 990, peak: 0.045, attack: 0.008, release: 0.12 });
      } else if (kind === 'alert') {
        oneShotTone({ type: 'triangle', from: 520, to: 380, peak: 0.05, attack: 0.006, release: 0.14 });
      } else {
        oneShotTone({ type: 'sine', from: 740, to: 740, peak: 0.04, attack: 0.005, release: 0.055 });
      }
    },

    dispose() {
      for (const source of liveSources) {
        try { source.stop?.(); } catch { /* already stopped */ }
      }
      liveSources.clear();
      try { context?.close?.(); } catch { /* already closed */ }
      context = null;
      state.started = false;
    },
  };
}
