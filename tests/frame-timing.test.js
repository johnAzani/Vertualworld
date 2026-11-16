import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getFrameTiming,
  MAX_FRAME_DELTA_SECONDS,
  MAX_MOVEMENT_STEP_SECONDS,
} from '../src/frame-timing.js';

function integrateWalkingForFrames(frameDeltas) {
  let velocity = 0;
  let distance = 0;
  for (const rawDelta of frameDeltas) {
    const { movementSteps, movementStepDelta } = getFrameTiming(rawDelta);
    for (let step = 0; step < movementSteps; step += 1) {
      const response = 1 - Math.exp(-12 * movementStepDelta);
      velocity += (5.1 - velocity) * response;
      distance += velocity * movementStepDelta;
    }
  }
  return distance;
}

test('movement preserves elapsed time across 60, 30, and 20 FPS render frames', () => {
  const atSixtyFps = integrateWalkingForFrames(Array(6).fill(1 / 60));
  const atThirtyFps = integrateWalkingForFrames(Array(3).fill(1 / 30));
  const atTwentyFps = integrateWalkingForFrames(Array(2).fill(1 / 20));
  const atTenFps = integrateWalkingForFrames([0.1]);

  assert.ok(Math.abs(atThirtyFps - atSixtyFps) < 1e-9);
  assert.ok(Math.abs(atTwentyFps - atSixtyFps) < 1e-9);
  assert.ok(Math.abs(atTenFps - atSixtyFps) < 1e-9);
});

test('catch-up movement steps stay at or below 60 Hz and are bounded after a long stall', () => {
  const timing = getFrameTiming(0.1);
  assert.equal(timing.delta, MAX_FRAME_DELTA_SECONDS);
  assert.equal(timing.movementSteps, 6);
  assert.ok(timing.movementStepDelta <= MAX_MOVEMENT_STEP_SECONDS);
  assert.ok(Math.abs(timing.movementSteps * timing.movementStepDelta - timing.delta) < 1e-12);

  const stalledTiming = getFrameTiming(0.6);
  assert.equal(stalledTiming.delta, MAX_FRAME_DELTA_SECONDS);
  assert.equal(stalledTiming.movementSteps, 6, 'a long stall cannot trigger unbounded catch-up work');
});
