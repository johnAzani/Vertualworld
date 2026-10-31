import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';

import {
  createHarmattanDust,
  createRiverCanoes,
  createStreetStalls,
  createStreetTraffic,
} from '../src/street-life.js';
import {
  findNearestWalker,
  triggerWalkerWave,
  createPedestrianCrowd,
} from '../src/pedestrians.js';

function makeStraightRoad(length = 100) {
  const curve = new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(length, 0, 0));
  return { curve, length };
}

test('street traffic builds four shadow-less vehicles with spinning wheels', () => {
  const { curve, length } = makeStraightRoad();
  const traffic = createStreetTraffic({
    roadCurve: curve,
    roadLength: length,
    groundHeightAt: () => 0.5,
    random: () => 0.5,
  });
  assert.equal(traffic.vehicles.length, 4, 'keke, okada and two private cars');
  let meshes = 0;
  traffic.group.traverse((obj) => {
    if (obj.isMesh) {
      meshes += 1;
      assert.equal(obj.castShadow, false, 'traffic never joins the shadow pass');
    }
  });
  assert.equal(meshes, 26, 'keke 8 + okada 6 + two cars 6+6');
  traffic.update(0.016);
  for (const vehicle of traffic.vehicles) {
    assert.ok(vehicle.rig.wheels.length >= 2, 'vehicles have wheels to spin');
    assert.ok(Math.abs(vehicle.rig.group.position.y - 0.52) < 1e-9, 'vehicles sit on the ground height');
  }
});

test('street traffic keeps left of travel so two-way lanes split', () => {
  const { curve, length } = makeStraightRoad();
  const traffic = createStreetTraffic({
    roadCurve: curve,
    roadLength: length,
    groundHeightAt: () => 0,
    random: () => 0.5,
  });
  for (const vehicle of traffic.vehicles) {
    vehicle.distance = length * 0.5;
    traffic.update(0.001);
    const fraction = ((vehicle.distance % length) + length) % length / length;
    const point = curve.getPointAt(fraction, new THREE.Vector3());
    const dx = vehicle.rig.group.position.x - point.x;
    const dz = vehicle.rig.group.position.z - point.z;
    // Straight road along +X: left of a +direction vehicle is -Z; of a -direction vehicle is +Z.
    const expectedSide = vehicle.direction > 0 ? -1 : 1;
    assert.ok(Math.sign(dz) === expectedSide, `vehicle going ${vehicle.direction > 0 ? 'forward' : 'backward'} keeps to its left`);
    assert.ok(Math.abs(Math.abs(dz) - vehicle.laneOffset) < 0.02, 'lane offset is exact');
    const expectedYaw = vehicle.direction > 0 ? -Math.PI / 2 : Math.PI / 2;
    assert.ok(Math.abs(vehicle.rig.group.rotation.y - expectedYaw) < 1e-6, 'vehicle faces its direction of travel');
  }
});

test('street traffic spins wheels, follows the ground, and culls by distance', () => {
  const { curve, length } = makeStraightRoad();
  const traffic = createStreetTraffic({
    roadCurve: curve,
    roadLength: length,
    groundHeightAt: () => 2,
    random: () => 0.5,
    cullDistance: 50,
  });
  const [vehicle] = traffic.vehicles;
  const wheel = vehicle.rig.wheels[0];
  const spinBefore = wheel.rotation.x;
  traffic.update(0.5, { x: 0, z: 0 });
  assert.ok(wheel.rotation.x !== spinBefore, 'wheels rotate while driving');
  assert.ok(vehicle.rig.group.position.y > 2, 'vehicles ride on the ground height');

  traffic.update(0.1, { x: 500, z: 500 });
  assert.equal(vehicle.rig.group.visible, false, 'far traffic is culled');
  traffic.update(0.1, { x: vehicle.rig.group.position.x, z: vehicle.rig.group.position.z });
  assert.equal(vehicle.rig.group.visible, true, 'nearby traffic reappears');
});

test('river canoes drift along the waterway, bob, and wrap around', () => {
  const canoes = createRiverCanoes({ terrainHeight: () => 1, count: 2, random: () => 0.5 });
  assert.equal(canoes.canoes.length, 2);
  const [canoe] = canoes.canoes;
  const startX = canoe.group.position.x;
  for (let i = 0; i < 60; i += 1) canoes.update(0.1, i * 0.1);
  assert.ok(Math.abs(canoe.group.position.x - startX) > 0.5, 'canoes drift along the river');
  assert.ok(canoe.group.position.y > 1, 'canoes float on the water surface');

  canoe.t = 0.995;
  const speed = canoe.speed;
  canoe.speed = 0.05;
  canoes.update(0.1, 0);
  assert.ok(canoe.t < 0.2, `canoe wraps around the route, got t=${canoe.t}`);
  canoe.speed = speed;
  assert.ok(speed > 0, 'canoes keep a positive drift speed');
});

test('street stalls glow at night and their grill smoke rises and recycles', () => {
  const stalls = createStreetStalls({
    terrainHeight: () => 0,
    stalls: [{ x: 0, z: 0, facing: 0 }, { x: 20, z: 0, facing: Math.PI }],
    random: () => 0.5,
  });
  assert.equal(stalls.stallRigs.length, 2);
  assert.equal(stalls.smokeFields.length, 2);
  let meshes = 0;
  stalls.group.traverse((obj) => {
    if (obj.isMesh) meshes += 1;
  });
  assert.equal(meshes, 8, 'each stall is 4 meshes: table, grill, parasol, pole');

  const dayGlow = stalls.stallRigs[0].grillMaterial.emissiveIntensity;
  stalls.update(0.1, 0, 1, 0);
  const nightGlow = stalls.stallRigs[0].grillMaterial.emissiveIntensity;
  assert.ok(nightGlow > dayGlow + 0.8, 'grill glows warmer at night');

  const field = stalls.smokeFields[0];
  const positionsBefore = field.positions[1];
  stalls.update(0.5, 1, 0.5, 0);
  assert.ok(field.positions[1] > positionsBefore - 1e-6, 'smoke rises');
  assert.ok(field.material.opacity > 0.12, 'smoke is faintly visible');

  // Heavy rain thins the smoke.
  stalls.update(0.1, 1, 0.5, 1);
  const wetOpacity = field.material.opacity;
  stalls.update(0.1, 1, 0.5, 0);
  assert.ok(field.material.opacity > wetOpacity, 'rain thins the grill smoke');
});

test('harmattan dust hangs in the haze only when the harmattan blows', () => {
  const dust = createHarmattanDust({ count: 12, random: () => 0.5 });
  dust.update(1, 0);
  assert.equal(dust.points.visible, false, 'invisible in clear weather');
  dust.update(1, 0.8);
  assert.equal(dust.points.visible, true, 'visible in the haze');
  assert.ok(dust.points.material.opacity > 0.15, 'dust is visible but subtle');
  const attribute = dust.points.geometry.attributes.position;
  const before = attribute.getY(0);
  dust.update(3, 0.8);
  assert.ok(Math.abs(attribute.getY(0) - before) > 0.01, 'dust drifts');
  dust.dispose();
});

test('findNearestWalker locates close walkers and triggerWalkerWave makes them wave back', () => {
  const crowd = createPedestrianCrowd({ groundHeightAt: () => 0, count: 3, random: () => 0.5 });
  const [walker] = crowd.walkers;
  const rig = walker.rig.group;
  const near = findNearestWalker(crowd.walkers, rig.position.x + 2, rig.position.z, 11);
  assert.equal(near, walker, 'the closest walker is found');
  assert.equal(findNearestWalker(crowd.walkers, rig.position.x + 200, rig.position.z, 11), null, 'nobody found far away');
  assert.equal(triggerWalkerWave(null), false, 'waving at nobody is refused');

  triggerWalkerWave(walker, 1.5);
  assert.ok(walker.waveTimer > 1, 'wave timer starts');
  crowd.update(0.1, { x: rig.position.x, z: rig.position.z });
  assert.ok(walker.rig.armPivots[1].rotation.x < -2, 'the raised arm waves overhead');
  // Let the wave expire: arm returns to the walking swing.
  for (let i = 0; i < 25; i += 1) crowd.update(0.1, { x: rig.position.x, z: rig.position.z });
  assert.equal(walker.waveTimer, 0, 'wave timer runs out');
  assert.ok(walker.rig.armPivots[1].rotation.x > -1.5, 'arm settles back to the walk swing');
});
