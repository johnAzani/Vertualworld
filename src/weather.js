/**
 * Abuja weather system: deterministic daily weather schedule, smooth weather
 * state transitions, and a lightweight camera-following rain field rendered
 * as slanted LineSegments streaks (one draw call, no textures).
 */

import * as THREE from 'three';

export const WEATHER_MODES = Object.freeze(['clear', 'rain', 'harmattan']);

export const WEATHER_LABELS = Object.freeze({
  clear: 'Clear skies',
  rain: 'Rain shower',
  harmattan: 'Harmattan haze',
});

export const WEATHER_ICONS = Object.freeze({
  clear: '☀',
  rain: '🌧',
  harmattan: '🌫',
});

/**
 * Deterministic daily schedule keyed by game hour (0..24):
 * - dry hazy harmattan dawn,
 * - a warm afternoon rain shower,
 * - a short pre-dawn drizzle.
 */
export function getScheduledWeather(hourOfDay) {
  const hour = Number.isFinite(hourOfDay) ? ((hourOfDay % 24) + 24) % 24 : 12;
  if (hour >= 5.25 && hour < 8.25) return 'harmattan';
  if (hour >= 14.5 && hour < 16.25) return 'rain';
  if (hour >= 2 && hour < 3.25) return 'rain';
  return 'clear';
}

export function nextWeatherMode(currentMode) {
  const index = WEATHER_MODES.indexOf(currentMode);
  return WEATHER_MODES[(index + 1 + WEATHER_MODES.length) % WEATHER_MODES.length];
}

/**
 * Manual weather overrides the schedule; otherwise the schedule drives it.
 */
export function resolveWeatherMode({ manualMode = null, hourOfDay = 12 } = {}) {
  if (manualMode && WEATHER_MODES.includes(manualMode)) return manualMode;
  return getScheduledWeather(hourOfDay);
}

/**
 * Smoothly interpolated weather amounts. `rain` and `harmattan` ease toward
 * 1 when their mode is active and back to 0 otherwise, so skies, fog, audio
 * and the rain field all crossfade together.
 */
export function createWeatherState({ transitionRate = 0.24 } = {}) {
  return {
    mode: 'clear',
    rain: 0,
    harmattan: 0,
    update(delta, targetMode) {
      const safeDelta = Number.isFinite(delta) && delta > 0 ? Math.min(delta, 0.5) : 0;
      const target = WEATHER_MODES.includes(targetMode) ? targetMode : 'clear';
      this.mode = target;
      const step = 1 - Math.exp(-(Number.isFinite(transitionRate) && transitionRate > 0 ? transitionRate : 0.24) * safeDelta * 3);
      this.rain += ((target === 'rain' ? 1 : 0) - this.rain) * step;
      this.harmattan += ((target === 'harmattan' ? 1 : 0) - this.harmattan) * step;
      if (Math.abs(this.rain - (target === 'rain' ? 1 : 0)) < 0.002) this.rain = target === 'rain' ? 1 : 0;
      if (Math.abs(this.harmattan - (target === 'harmattan' ? 1 : 0)) < 0.002) this.harmattan = target === 'harmattan' ? 1 : 0;
      return { rain: this.rain, harmattan: this.harmattan };
    },
    setMode(targetMode) {
      const target = WEATHER_MODES.includes(targetMode) ? targetMode : 'clear';
      this.mode = target;
      this.rain = target === 'rain' ? 1 : 0;
      this.harmattan = target === 'harmattan' ? 1 : 0;
    },
  };
}

const DROP_SPAWN_HEIGHT = 17;
const DROP_KILL_BELOW = 2.5;
const DROP_FIELD_RADIUS = 34;

/**
 * Core rain simulation (pure math over a flat positions array).
 *
 * `positions` holds `count` drops as streak pairs: vertex 2i is the drop head,
 * vertex 2i+1 is the tail (slightly up and wind-abreast). `heights` holds the
 * fall speed of each drop. Everything recycles around `camera` so the field
 * follows the player without allocation.
 */
export function updateRainDrops({
  positions,
  heights,
  count,
  delta,
  cameraX = 0,
  cameraY = 0,
  cameraZ = 0,
  windX = -2.4,
  dropLength = 0.62,
  random = Math.random,
}) {
  const safeDelta = Number.isFinite(delta) && delta > 0 ? Math.min(delta, 0.25) : 0;
  for (let i = 0; i < count; i += 1) {
    const head = i * 6;
    const speed = heights[i];
    let x = positions[head];
    let y = positions[head + 1];
    let z = positions[head + 2];

    y -= speed * safeDelta * 1.65;
    x += windX * safeDelta;

    const belowFloor = y < cameraY - DROP_KILL_BELOW;
    const tooFar = (x - cameraX) * (x - cameraX) + (z - cameraZ) * (z - cameraZ) > DROP_FIELD_RADIUS * DROP_FIELD_RADIUS;
    if (belowFloor || tooFar) {
      x = cameraX + (random() - 0.5) * DROP_FIELD_RADIUS * 2;
      z = cameraZ + (random() - 0.5) * DROP_FIELD_RADIUS * 2;
      y = cameraY + DROP_SPAWN_HEIGHT * (0.72 + random() * 0.5);
    }

    positions[head] = x;
    positions[head + 1] = y;
    positions[head + 2] = z;
    positions[head + 3] = x - windX * 0.052;
    positions[head + 4] = y + dropLength;
    positions[head + 5] = z;
  }
}

/**
 * Storm lightning: while rain is heavy, occasional double-peak sky flashes.
 * `update` returns the current flash intensity (0..1) and sets `.fired` on the
 * frame where a new strike begins so the caller can trigger thunder.
 */
export function createStormFlash({ random = Math.random, minInterval = 26, maxInterval = 72, threshold = 0.55 } = {}) {
  const safeRandom = typeof random === 'function' ? random : Math.random;
  const state = {
    elapsed: 0,
    flash: 0,
    nextFlashAt: minInterval + safeRandom() * (maxInterval - minInterval),
    fired: false,
  };
  return {
    get fired() {
      return state.fired;
    },
    get flash() {
      return state.flash;
    },
    update(delta, rainAmount) {
      const safeDelta = Number.isFinite(delta) && delta > 0 ? Math.min(delta, 0.5) : 0;
      state.elapsed += safeDelta;
      state.fired = false;
      // Fast attack, double-peak decay: bright strike then a softer echo.
      if (state.flash > 0) {
        const decay = state.flash > 0.5 ? 3.1 : 1.35;
        state.flash = Math.max(0, state.flash - safeDelta * decay * (0.55 + state.flash));
      }
      const rain = Math.max(0, Math.min(1, Number(rainAmount) || 0));
      if (rain >= threshold && state.elapsed >= state.nextFlashAt) {
        state.flash = 0.72 + safeRandom() * 0.28;
        state.fired = true;
        state.nextFlashAt = state.elapsed + minInterval + safeRandom() * (maxInterval - minInterval);
      }
      return state.flash;
    },
  };
}

/**
 * Rain field object: LineSegments streaks with a single shared material.
 * `update` follows the camera and drives fall speed + opacity from intensity.
 */
export function createRainField({ count = 520, random = Math.random, windX = -2.4, dropLength = 0.62 } = {}) {
  const safeRandom = typeof random === 'function' ? random : Math.random;
  const safeCount = Math.max(1, Math.floor(count));
  const positions = new Float32Array(safeCount * 6);
  const heights = new Float32Array(safeCount);
  for (let i = 0; i < safeCount; i += 1) {
    const head = i * 6;
    positions[head] = (safeRandom() - 0.5) * DROP_FIELD_RADIUS * 2;
    positions[head + 1] = 2 + safeRandom() * DROP_SPAWN_HEIGHT;
    positions[head + 2] = (safeRandom() - 0.5) * DROP_FIELD_RADIUS * 2;
    positions[head + 3] = positions[head] - windX * 0.052;
    positions[head + 4] = positions[head + 1] + dropLength;
    positions[head + 5] = positions[head + 2];
    heights[i] = 9.5 + safeRandom() * 5;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color: 0xa9c2d4,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: true,
  });
  const object3D = new THREE.LineSegments(geometry, material);
  object3D.frustumCulled = false;
  object3D.visible = false;
  object3D.name = 'RainField';

  return {
    object3D,
    positions,
    heights,
    count: safeCount,
    update(delta, cameraPosition, intensity = 0) {
      const amount = Math.max(0, Math.min(1, Number(intensity) || 0));
      object3D.visible = amount > 0.015;
      if (!object3D.visible) return;
      material.opacity = 0.1 + amount * 0.34;
      updateRainDrops({
        positions,
        heights,
        count: safeCount,
        delta,
        cameraX: cameraPosition?.x ?? 0,
        cameraY: cameraPosition?.y ?? 0,
        cameraZ: cameraPosition?.z ?? 0,
        windX,
        dropLength,
        random: safeRandom,
      });
      geometry.attributes.position.needsUpdate = true;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
