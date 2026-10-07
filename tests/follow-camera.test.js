import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  CAMERA_MODE_ORDER,
  createThirdPersonMovementState,
  getNextCameraMode,
  getThirdPersonMovementYaw,
  setBehindPlayerOffset,
} from '../src/follow-camera.js';

const mainSource = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');

test('camera mode control cycles through follow, the previous orbit, overhead and first-person views', () => {
  assert.deepEqual(CAMERA_MODE_ORDER, ['follow', 'orbit', 'overhead', 'first-person']);
  let mode = 'follow';
  for (const expected of ['orbit', 'overhead', 'first-person', 'follow']) {
    mode = getNextCameraMode(mode);
    assert.equal(mode, expected);
  }
  assert.equal(getNextCameraMode('unknown'), 'follow');
});

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

test('gameplay cameras support follow behind, orbit, overhead, and first-person modes', () => {
  assert.match(mainSource, /else if \(cameraMode === 'overhead'\)/);
  assert.match(mainSource, /setBehindPlayerOffset\(\s*animationScratch\.behindCameraOffset,\s*player\.rotation\.y,\s*cameraDistance/);
  assert.match(mainSource, /const cameraYawForPosition = cameraMode === 'orbit' \? cameraYaw : player\.rotation\.y;/);
  assert.match(mainSource, /player\.rotation\.y\s*-\s*residence\.facing/);
  assert.match(mainSource, /\(!isFirstPerson && !isWorldView && cameraMode !== 'orbit'\)/);
  assert.match(mainSource, /followsResident && hasMovementInput/);
});
