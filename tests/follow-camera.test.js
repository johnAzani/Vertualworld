import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  createThirdPersonMovementState,
  getThirdPersonMovementYaw,
  setBehindPlayerOffset,
} from '../src/follow-camera.js';

const mainSource = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');

function vector() {
  return {
    set(x, y, z) {
      Object.assign(this, { x, y, z });
      return this;
    },
  };
}

test('third-person follow offsets stay behind the avatar at different headings', () => {
  const offset = vector();
  setBehindPlayerOffset(offset, 0, 10);
  assert.ok(Math.abs(offset.x) < 1e-10);
  assert.equal(offset.y, 0);
  assert.equal(offset.z, 10);

  setBehindPlayerOffset(offset, Math.PI / 2, 6);
  assert.equal(offset.x, 6);
  assert.ok(Math.abs(offset.z) < 1e-10);

  setBehindPlayerOffset(offset, Math.PI, 4);
  assert.ok(Math.abs(offset.x) < 1e-10);
  assert.equal(offset.z, -4);
});

test('third-person movement keeps a stable heading while the camera follows, then recentres', () => {
  const state = createThirdPersonMovementState();
  const initialYaw = Math.PI / 3;

  assert.equal(getThirdPersonMovementYaw(state, initialYaw, true), -initialYaw);
  assert.equal(getThirdPersonMovementYaw(state, -0.2, true), -initialYaw);
  assert.equal(getThirdPersonMovementYaw(state, -0.2, false), 0.2);
  assert.equal(getThirdPersonMovementYaw(state, 0.5, true), -0.5);
});

test('the gameplay camera follows avatar facing and reserves dragging for first-person and World View', () => {
  assert.match(mainSource, /setBehindPlayerOffset\(\s*animationScratch\.behindCameraOffset,\s*player\.rotation\.y,\s*cameraDistance/);
  assert.match(mainSource, /player\.rotation\.y\s*-\s*residence\.facing/);
  assert.match(mainSource, /\(!isFirstPerson && !isWorldView\)/);
  assert.match(mainSource, /followsResident && hasMovementInput/);
});
