/**
 * Immersion feel systems: camera head bob, sprint FOV kicks, landing dips,
 * footstep cadence tracking, and weather appearance mixing.
 *
 * Everything here is pure, dependency-free math so it can be unit-tested in
 * Node and reused by src/main.js inside the animation loop.
 */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Wet-surface look: rain slicks materials down in roughness and adds a touch
 * of metalness so roads and trails catch the sky.
 */
export function computeWetSurface(rain = 0) {
  const wet = clamp(Number(rain) || 0, 0, 1);
  return {
    roughnessScale: 1 - 0.66 * wet,
    metalnessBoost: 0.16 * wet,
    wet,
  };
}

/**
 * Exponential smoothing toward a target that is framerate independent.
 */
export function smoothTowards(current, target, delta, rate = 5.5) {
  if (!Number.isFinite(delta) || delta <= 0) return current;
  const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 5.5;
  return current + (target - current) * (1 - Math.exp(-safeRate * delta));
}

/**
 * Camera head bob, sway, and micro-roll driven by the walk/run cycle phase.
 *
 * - Vertical bob runs at double step frequency (two bobs per stride).
 * - Lateral sway and roll alternate once per stride.
 * - First-person receives the full effect; third-person cameras get a
 *   restrained version so following the avatar never feels seasick.
 * - prefersReducedMotion zeroes everything.
 */
export function computeHeadBob({
  phase = 0,
  strideAmount = 0,
  isRunning = false,
  isFirstPerson = false,
  prefersReducedMotion = false,
  planarSpeed = 0,
  referenceSpeed = 5.1,
} = {}) {
  if (prefersReducedMotion) {
    return { y: 0, side: 0, roll: 0, pitch: 0 };
  }
  const stride = clamp(Number(strideAmount) || 0, 0, 1.25);
  const speedFactor = clamp((Number(planarSpeed) || 0) / (referenceSpeed > 0 ? referenceSpeed : 5.1), 0, 1.15);
  const amount = clamp(stride * 0.72 + speedFactor * 0.38, 0, 1.1);
  if (amount < 0.012) {
    return { y: 0, side: 0, roll: 0, pitch: 0 };
  }

  const runGain = isRunning ? 1.38 : 1;
  const perspectiveGain = isFirstPerson ? 1 : 0.42;
  const amplitude = 0.052 * runGain * perspectiveGain * amount;

  const verticalWave = Math.sin(phase * 2);
  const lateralWave = Math.sin(phase);

  return {
    y: verticalWave * amplitude,
    side: lateralWave * amplitude * 0.58,
    roll: lateralWave * (isRunning ? 0.0125 : 0.0085) * perspectiveGain * amount,
    pitch: verticalWave * (isRunning ? 0.0068 : 0.0042) * perspectiveGain * amount,
  };
}

/**
 * Damped landing spring: on impact the camera dips down, overshoots slightly,
 * and settles. `value` is the vertical offset in metres to ADD to the camera
 * (negative = pushed down).
 */
export function createLandingSpring({ maxDip = 0.26, decayRate = 6.2, oscillationRate = 11.5 } = {}) {
  let energy = 0;
  let elapsed = 1e3;
  return {
    impact(impactSpeed = 0) {
      const speed = Number.isFinite(impactSpeed) ? Math.max(0, impactSpeed) : 0;
      if (speed < 1.2) return;
      energy = Math.min(maxDip, speed * 0.028);
      elapsed = 0;
    },
    update(delta) {
      if (energy <= 0) return 0;
      elapsed += Number.isFinite(delta) && delta > 0 ? delta : 0;
      const value = -energy * Math.exp(-elapsed * decayRate) * Math.cos(elapsed * oscillationRate);
      if (elapsed > 1.4) energy = 0;
      return value;
    },
    get value() {
      if (energy <= 0) return 0;
      return -energy * Math.exp(-elapsed * decayRate) * Math.cos(elapsed * oscillationRate);
    },
  };
}

/**
 * Footstep cadence tracker: fires once per half walk-cycle (each footfall)
 * while the avatar is moving, without bursting after idle pauses.
 */
export function createFootstepTracker() {
  let lastHalfCycle = null;
  return {
    step(walkCyclePhase = 0, isMoving = false) {
      const phase = Number.isFinite(walkCyclePhase) ? walkCyclePhase : 0;
      const halfCycle = Math.floor(phase / Math.PI);
      if (!isMoving) {
        lastHalfCycle = halfCycle;
        return false;
      }
      if (lastHalfCycle === null || halfCycle === lastHalfCycle) {
        lastHalfCycle = halfCycle;
        return false;
      }
      lastHalfCycle = halfCycle;
      return true;
    },
  };
}

/**
 * Weather appearance mixing. Pure numbers in, pure numbers out:
 * fog distances, sky tint weight/colour, sun scale, cloud look.
 */
export function computeWeatherMix({ rain = 0, harmattan = 0 } = {}) {
  const rainAmount = clamp(Number(rain) || 0, 0, 1);
  const hazeAmount = clamp(Number(harmattan) || 0, 0, 1);

  // Clear: 130 → 310 fog band. Rain closes it down; harmattan dust closes it far tighter.
  const fogNear = 130 - rainAmount * 34 - hazeAmount * 58;
  const fogFar = 310 - rainAmount * 96 - hazeAmount * 168;

  const skyTintWeight = clamp(rainAmount * 0.34 + hazeAmount * 0.46, 0, 0.62);
  // Rain skews the sky cool-grey; harmattan skews it warm dust.
  const skyTint = {
    r: 0.62 * rainAmount + 0.86 * hazeAmount,
    g: 0.66 * rainAmount + 0.79 * hazeAmount,
    b: 0.7 * rainAmount + 0.6 * hazeAmount,
  };
  const tintTotal = rainAmount + hazeAmount;
  if (tintTotal > 0) {
    skyTint.r /= tintTotal;
    skyTint.g /= tintTotal;
    skyTint.b /= tintTotal;
  }

  return {
    fogNear,
    fogFar,
    skyTintWeight,
    skyTint,
    sunScale: clamp(1 - rainAmount * 0.52 - hazeAmount * 0.3, 0.2, 1),
    hemiScale: clamp(1 - rainAmount * 0.22 - hazeAmount * 0.12, 0.5, 1),
    cloudOpacity: clamp(0.84 + rainAmount * 0.16 - hazeAmount * 0.1, 0.35, 1),
    cloudShade: clamp(rainAmount * 0.52 + hazeAmount * 0.2, 0, 0.8),
    rainSound: rainAmount,
  };
}
