import assert from 'node:assert/strict';
import test from 'node:test';

import {
  computeHeadBob,
  computeWetSurface,
  computeWeatherMix,
  createFootstepTracker,
  createLandingSpring,
  smoothTowards,
} from '../src/immersion.js';

test('wet surface mix glosses roads up as rain falls and is clamped', () => {
  const dry = computeWetSurface(0);
  assert.equal(dry.roughnessScale, 1);
  assert.equal(dry.metalnessBoost, 0);
  const soaked = computeWetSurface(1);
  assert.ok(Math.abs(soaked.roughnessScale - 0.34) < 1e-9, 'soaked roads are glossy');
  assert.ok(Math.abs(soaked.metalnessBoost - 0.16) < 1e-9, 'soaked roads pick up metalness');
  const clamped = computeWetSurface(9);
  assert.ok(clamped.roughnessScale === soaked.roughnessScale, 'inputs clamp to 1');
});

test('smoothTowards is framerate independent and eases toward the target', () => {
  const oneBigStep = smoothTowards(0, 10, 1, 5.5);
  let manySmallSteps = 0;
  for (let i = 0; i < 10; i += 1) manySmallSteps = smoothTowards(manySmallSteps, 10, 0.1, 5.5);
  assert.ok(oneBigStep > 9.8, 'a full second should reach the target');
  assert.ok(Math.abs(oneBigStep - manySmallSteps) < 0.35, 'many small steps should match one big step');
  assert.equal(smoothTowards(4, 10, 0, 5.5), 4, 'zero delta must not move');
  assert.equal(smoothTowards(4, 10, -1, 5.5), 4, 'negative delta must not move');
});

test('head bob is zero for reduced motion and when standing still', () => {
  assert.deepEqual(
    computeHeadBob({ phase: 1.2, strideAmount: 1, isRunning: true, isFirstPerson: true, prefersReducedMotion: true }),
    { y: 0, side: 0, roll: 0, pitch: 0 },
  );
  const idle = computeHeadBob({ phase: 1.2, strideAmount: 0, planarSpeed: 0, isFirstPerson: true });
  assert.deepEqual(idle, { y: 0, side: 0, roll: 0, pitch: 0 });
});

test('head bob scales with stride and is stronger in first person than third person', () => {
  // Vertical bob peaks at phase PI/4 (double-frequency sine at its maximum).
  const firstPerson = computeHeadBob({ phase: Math.PI / 4, strideAmount: 1, planarSpeed: 5.1, isFirstPerson: true });
  const thirdPerson = computeHeadBob({ phase: Math.PI / 4, strideAmount: 1, planarSpeed: 5.1, isFirstPerson: false });
  assert.ok(Math.abs(firstPerson.y) > 0.02, 'walking first-person bob should be felt');
  assert.ok(Math.abs(firstPerson.y) > Math.abs(thirdPerson.y) * 1.8, 'first person bob must exceed third person bob');

  const walking = computeHeadBob({ phase: Math.PI / 4, strideAmount: 1, planarSpeed: 5.1, isRunning: false, isFirstPerson: true });
  const running = computeHeadBob({ phase: Math.PI / 4, strideAmount: 1, planarSpeed: 9, isRunning: true, isFirstPerson: true });
  assert.ok(Math.abs(running.y) > Math.abs(walking.y), 'running bob must exceed walking bob');

  // Vertical bob is double frequency: phase 0 and phase PI both give zero vertical.
  const atZero = computeHeadBob({ phase: 0, strideAmount: 1, planarSpeed: 5.1, isFirstPerson: true });
  const atPi = computeHeadBob({ phase: Math.PI, strideAmount: 1, planarSpeed: 5.1, isFirstPerson: true });
  assert.ok(Math.abs(atZero.y) < 1e-9, 'vertical bob is zero at phase 0');
  assert.ok(Math.abs(atPi.y) < 1e-9, 'vertical bob is zero at phase PI');
  assert.ok(Math.abs(atZero.side) < 1e-9, 'lateral sway is zero at phase 0');
});

test('landing spring dips down on impact, oscillates, and settles', () => {
  const spring = createLandingSpring();
  assert.equal(spring.value, 0, 'no impact means no dip');
  spring.impact(12);
  const initial = spring.update(0.016);
  assert.ok(initial < -0.05, `impact dip should push the camera down, got ${initial}`);
  let sample = initial;
  for (let i = 0; i < 120; i += 1) sample = spring.update(0.016);
  assert.ok(Math.abs(sample) < 0.01, 'spring should settle near zero');
  assert.equal(spring.value, 0, 'energy clears after settling');

  spring.impact(0.4);
  assert.equal(spring.update(0.016), 0, 'tiny impacts are ignored');
});

test('landing spring caps extreme impacts', () => {
  const spring = createLandingSpring({ maxDip: 0.26 });
  spring.impact(1000);
  const dip = spring.update(0.001);
  assert.ok(Math.abs(dip) <= 0.27, `dip must respect maxDip, got ${dip}`);
});

test('footstep tracker fires once per footfall and never bursts after idle', () => {
  const tracker = createFootstepTracker();
  let steps = 0;
  let phase = 0;
  // Walking across 4 full cycles (8 half cycles) = 8 footfalls.
  while (phase < 8 * Math.PI) {
    phase += 0.05;
    if (tracker.step(phase, true)) steps += 1;
  }
  assert.equal(steps, 8, `expected 8 footfalls over 4 walk cycles, got ${steps}`);

  // Idle: no steps while standing even as the phase stays put.
  for (let i = 0; i < 10; i += 1) {
    assert.equal(tracker.step(phase, false), false);
  }
  // Resuming walking must not replay the pause as a burst of steps.
  assert.equal(tracker.step(phase + 0.01, true), false, 'no catch-up burst when resuming');
});

test('weather mix: clear day is the untouched baseline', () => {
  const clear = computeWeatherMix({ rain: 0, harmattan: 0 });
  assert.equal(clear.fogNear, 130);
  assert.equal(clear.fogFar, 310);
  assert.equal(clear.skyTintWeight, 0);
  assert.equal(clear.sunScale, 1);
  assert.equal(clear.cloudShade, 0);
});

test('weather mix: rain closes fog, cools the sky and dims the sun', () => {
  const rain = computeWeatherMix({ rain: 1, harmattan: 0 });
  assert.ok(rain.fogFar < 220, 'rain must shorten the fog distance');
  assert.ok(rain.sunScale < 0.6, 'rain must dim the sun');
  assert.ok(rain.skyTintWeight > 0.2, 'rain must tint the sky');
  assert.ok(rain.cloudShade > 0.4, 'rain must darken clouds');
  assert.ok(rain.skyTint.b >= rain.skyTint.r, 'rain tint skews cool');
});

test('weather mix: harmattan haze closes visibility furthest and tints warm dust', () => {
  const haze = computeWeatherMix({ rain: 0, harmattan: 1 });
  const rain = computeWeatherMix({ rain: 1, harmattan: 0 });
  assert.ok(haze.fogFar < rain.fogFar, 'harmattan visibility is tighter than rain');
  assert.ok(haze.skyTint.r > haze.skyTint.b, 'harmattan tint skews warm dust');
  const clamped = computeWeatherMix({ rain: 5, harmattan: -3 });
  assert.ok(clamped.rainSound <= 1 && clamped.rainSound >= 0, 'inputs are clamped');
});
