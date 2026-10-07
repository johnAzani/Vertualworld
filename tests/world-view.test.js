import assert from 'node:assert/strict';
import test from 'node:test';
import {
  WORLD_VIEW_ANGLE,
  WORLD_VIEW_FOV,
  WORLD_VIEW_MARGIN,
  WORLD_VIEW_RADIUS,
  getWorldViewCameraDistance,
} from '../src/world-view.js';

test('world view camera distance fits the playable circle in landscape, square and portrait layouts', () => {
  const verticalProjection = Math.sin(WORLD_VIEW_ANGLE * Math.PI / 180);
  const screenHalfHeight = (distance) => distance * Math.tan((WORLD_VIEW_FOV * Math.PI / 180) / 2);
  for (const aspect of [2.2, 16 / 9, 1, 0.75, 0.48]) {
    const distance = getWorldViewCameraDistance({ aspect });
    const screenRadius = screenHalfHeight(distance);
    const horizontalGroundRadius = screenRadius * aspect;
    const verticalGroundRadius = screenRadius / verticalProjection;
    assert.ok(horizontalGroundRadius >= WORLD_VIEW_RADIUS * WORLD_VIEW_MARGIN - 1e-8, `horizontal fit at aspect ${aspect}`);
    assert.ok(verticalGroundRadius >= WORLD_VIEW_RADIUS * WORLD_VIEW_MARGIN - 1e-8, `vertical fit at aspect ${aspect}`);
  }
});

test('world view camera inputs are bounded and narrower screens require a more distant overview', () => {
  assert.ok(getWorldViewCameraDistance({ aspect: 0.5 }) > getWorldViewCameraDistance({ aspect: 1.8 }));
  assert.equal(getWorldViewCameraDistance({ aspect: 0 }), getWorldViewCameraDistance({ aspect: 1 }));
  assert.ok(getWorldViewCameraDistance({ fovDegrees: 5 }) > 0);
  assert.ok(getWorldViewCameraDistance({ radius: -1 }) > 0);
});
