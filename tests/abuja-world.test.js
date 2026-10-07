import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { ABUJA_HORIZON, createAbujaLandscape, createAsoRockGeometry } from '../src/abuja-world.js';

test('Abuja skyline landmark is an explicitly stylised, distant Aso Rock reference', () => {
  assert.match(ABUJA_HORIZON.landmark.name, /Aso Rock.*stylised/i);
  assert.ok(Math.hypot(ABUJA_HORIZON.landmark.x, ABUJA_HORIZON.landmark.z) > 82);
  assert.equal(ABUJA_HORIZON.landmark.baseY, -0.72);

  const geometry = createAsoRockGeometry();
  assert.ok(geometry instanceof THREE.BufferGeometry);
  assert.ok(geometry.attributes.position.count < 1200, 'landmark should remain a small static low-poly mesh');
  assert.ok(geometry.attributes.position.count > 200);
  assert.ok(geometry.boundingBox.min.y >= 0);
  assert.ok(geometry.boundingBox.max.y >= ABUJA_HORIZON.landmark.height);
  assert.ok(geometry.attributes.color.count === geometry.attributes.position.count);
});

test('the inland horizon uses one landmark mesh and an instanced batch for far ridges', () => {
  const landscape = createAbujaLandscape();
  const landmark = landscape.children.find((child) => child.isMesh);
  const ridges = landscape.children.find((child) => child.isInstancedMesh);
  assert.equal(landscape.name, 'Abuja inland savannah horizon');
  assert.ok(landmark?.name.includes('Aso Rock'));
  assert.ok(ridges);
  assert.equal(ridges.count, 5);
  assert.equal(landmark.castShadow, false);
  assert.equal(ridges.castShadow, false);
});
