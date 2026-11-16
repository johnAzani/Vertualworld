import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';

import {
  createCelestialGlows,
  createRainbowEvent,
  createShootingStars,
  createSkyPlane,
} from '../src/sky-events.js';

test('rainbow paints a full spectrum band across the arc', () => {
  const rainbow = createRainbowEvent({ minCooldown: 5, duration: 10 });
  const colors = rainbow.mesh.geometry.attributes.color;
  const positions = rainbow.mesh.geometry.attributes.position;
  assert.equal(colors.count, positions.count, 'every vertex carries a colour');
  assert.equal(rainbow.mesh.castShadow, false, 'the rainbow never joins the shadow pass');
  assert.equal(rainbow.mesh.visible, false, 'hidden until a storm clears');

  // Colours vary across the band: outermost vertices are red, innermost violet.
  const radius = 95;
  const tube = 6.5;
  let outerRed = 0;
  let innerViolet = 0;
  for (let i = 0; i < positions.count; i += 1) {
    const radial = Math.hypot(positions.getX(i), positions.getY(i));
    const outer = radial > radius + tube * 0.6;
    const inner = radial < radius - tube * 0.6;
    if (outer && colors.getX(i) > colors.getZ(i)) outerRed += 1;
    if (inner && colors.getZ(i) > colors.getX(i)) innerViolet += 1;
  }
  assert.ok(outerRed > 20, 'outer band is red-dominant');
  assert.ok(innerViolet > 20, 'inner band is violet-dominant');
});

test('rainbow triggers when a storm clears, fades in and out, and respects cooldown', () => {
  const rainbow = createRainbowEvent({ minCooldown: 30, duration: 10 });
  assert.equal(rainbow.notify(0, 0), false, 'no trigger in the dry');
  assert.equal(rainbow.notify(0.8, 1), false, 'no trigger while it is still raining');
  assert.equal(rainbow.notify(0.1, 2), true, 'triggered as the storm clears');
  assert.equal(rainbow.active, true);

  const early = rainbow.update(2 + 2.5);
  assert.ok(early > 0.2, 'rainbow fades in toward full strength');
  assert.equal(rainbow.mesh.visible, true);
  const late = rainbow.update(2 + 9.5);
  assert.ok(late < 0.2, 'rainbow fades out toward the end');
  assert.equal(rainbow.update(2 + 11), 0, 'gone after its window');
  assert.equal(rainbow.mesh.visible, false);

  // Cooldown: an immediate second storm does not retrigger.
  assert.equal(rainbow.notify(0.9, 12), false);
  assert.equal(rainbow.notify(0.1, 13), false, 'cooldown suppresses an instant repeat');
  assert.equal(rainbow.notify(0.1, 50), false, 'no trigger without a new storm');
  assert.equal(rainbow.notify(0.9, 51), false);
  assert.equal(rainbow.notify(0.1, 52), true, 'a later storm clears again');
});

test('shooting stars only streak on clear nights and fade out', () => {
  const stars = createShootingStars({ random: () => 0.5, firstDelay: 0, minInterval: 60, maxInterval: 60 });
  assert.equal(stars.lines.visible, false);
  stars.update(0, 0, 0.016);
  assert.equal(stars.fired, false, 'no shooting stars in daylight');

  stars.update(10, 1, 0.016);
  assert.equal(stars.fired, true, 'a streak spawns at night');
  assert.equal(stars.lines.visible, true, 'the streak is visible');

  // Mid-flight the streak is bright; after its life it is gone.
  stars.update(10.5, 1, 0.016);
  assert.equal(stars.lines.visible, true, 'still streaking mid-flight');
  for (let i = 0; i < 100; i += 1) stars.update(10.5 + i * 0.016, 1, 0.016);
  assert.equal(stars.lines.visible, false, 'the streak fades away');
});

test('sky flight crosses with a growing contrail and lands', () => {
  const plane = createSkyPlane({ random: () => 0.5, firstFlightAt: 1, minGap: 1, maxGap: 1, flightDuration: 2 });
  assert.equal(plane.group.visible, false, 'hidden between flights');
  plane.update(0.016, 0);
  assert.equal(plane.fired, false);

  plane.update(0.016, 25);
  assert.equal(plane.fired, true, 'takeoff is announced');
  assert.equal(plane.group.visible, true, 'the flight is in the sky');

  plane.update(0.016, 25.4);
  const anyTrail = plane.group.children.some((child) => child.scale && child.scale.z > 1);
  assert.ok(anyTrail, 'the contrail grows behind the aircraft');

  plane.update(0.016, 26.5);
  assert.equal(plane.group.visible, true, 'still airborne mid-crossing');
  plane.update(0.016, 27.5);
  assert.equal(plane.group.visible, false, 'lands after its crossing');
  assert.equal(plane.fired, false, 'no repeat announcement mid-flight');
});

test('sun halo and moon glow follow the daylight', () => {
  const glows = createCelestialGlows({ glowTexture: null });
  assert.equal(glows.sunGlow.isSprite, true, 'halos are budget-free sprites');

  glows.update({ sunPosition: new THREE.Vector3(1, 2, 3), sunVisible: true, daylight: 1, twilight: 0, night: 0 });
  assert.equal(glows.sunGlow.visible, true);
  assert.ok(glows.sunGlow.material.opacity > 0.05, 'the sun glows by day');
  assert.deepEqual(glows.sunGlow.position.toArray(), [1, 2, 3], 'halo rides the sun disc');

  glows.update({ sunVisible: true, daylight: 0.4, twilight: 1, night: 0 });
  const duskOpacity = glows.sunGlow.material.opacity;
  glows.update({ sunVisible: true, daylight: 1, twilight: 0, night: 0 });
  assert.ok(duskOpacity > glows.sunGlow.material.opacity, 'the halo blooms at sunrise and sunset');

  glows.update({ moonPosition: new THREE.Vector3(0, 5, 0), moonVisible: true, night: 1, daylight: 0, twilight: 0 });
  assert.equal(glows.moonGlow.visible, true);
  assert.ok(glows.moonGlow.material.opacity > 0.2, 'the moon glows at night');

  glows.update({ moonVisible: false, night: 0, sunVisible: false });
  assert.equal(glows.moonGlow.material.opacity, 0, 'both glows sleep by day');
});
