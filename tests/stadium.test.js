import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { resolveDiscAgainstOrientedBox } from '../src/collision.js';
import {
  createStadium,
  getNearestStadiumSeat,
  getStadiumSurfaceHeight,
  getStadiumWallColliders,
  isInsideStadiumBowl,
  STADIUM_CONFIG,
  STADIUM_PARKING_BAYS,
  STADIUM_SEATING_SPOTS,
  updateStadiumMatch,
} from '../src/stadium.js';

function makeCrowdTestStadium() {
  const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const material = new THREE.MeshBasicMaterial();
  const body = new THREE.InstancedMesh(geometry, material, 1);
  const head = new THREE.InstancedMesh(geometry, material, 1);
  const arms = new THREE.InstancedMesh(geometry, material, 2);
  const crowd = {
    body,
    head,
    arms,
    motions: [{ x: 2, y: 1, z: -3, rotation: 0, phase: 0, cheer: 1 }],
    transform: new THREE.Object3D(),
    reducedMotionPoseReady: false,
    updateAccumulator: 0,
  };
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.3), material);
  ball.position.y = STADIUM_CONFIG.pitchOffset + 0.3;
  return {
    config: STADIUM_CONFIG,
    ball,
    ballVelocity: new THREE.Vector3(),
    ballVerticalVelocity: 0,
    ballShadow: {
      position: new THREE.Vector3(),
      scale: new THREE.Vector3(1, 1, 1),
      material: { opacity: 0 },
    },
    cornerFlags: [],
    teams: [],
    score: [0, 0],
    goalFlash: 0,
    kickCooldown: 10,
    elapsed: 0,
    scoreboardAccumulator: 0,
    crowd,
  };
}

function readInstancePosition(mesh) {
  const matrix = new THREE.Matrix4();
  mesh.getMatrixAt(0, matrix);
  return new THREE.Vector3().setFromMatrixPosition(matrix);
}

test('background crowd matrices update at their LOD interval and full-rate updates resume immediately', () => {
  const stadium = makeCrowdTestStadium();
  const backgroundInterval = 1 / 30;

  updateStadiumMatch(stadium, 0.02, false, backgroundInterval);
  assert.equal(readInstancePosition(stadium.crowd.body).x, 0, 'first partial interval leaves the prior pose intact');

  updateStadiumMatch(stadium, 0.02, false, backgroundInterval);
  assert.equal(readInstancePosition(stadium.crowd.body).x, 2, 'crowd pose updates once the interval elapses');

  stadium.crowd.motions[0].x = 4;
  updateStadiumMatch(stadium, 0.01, false, 0);
  assert.equal(readInstancePosition(stadium.crowd.body).x, 4, 'full-rate crowd updates are immediate');
});

test('standard enclosed stadium includes VIP Presidential Lounge, parking lot with VIP and general bays, and 4-stand seating', () => {
  const stadium = createStadium(() => STADIUM_CONFIG.level);
  assert.ok(stadium.vipSection, 'stadium includes a dedicated VIP section group');
  assert.ok(stadium.parkingLot, 'stadium includes a dedicated parking lot group');
  assert.equal(STADIUM_PARKING_BAYS.length, 6, 'stadium parking lot has 6 marked bays');
  assert.ok(STADIUM_PARKING_BAYS.some((bay) => bay.isVip), 'stadium parking lot includes VIP bays');
  assert.ok(STADIUM_PARKING_BAYS.some((bay) => !bay.isVip), 'stadium parking lot includes general matchday bays');
  assert.ok(STADIUM_PARKING_BAYS.some((bay) => !bay.occupied), 'stadium parking lot leaves open bays for the player car');

  const vipSeats = STADIUM_SEATING_SPOTS.filter((spot) => spot.isVip);
  const standSeats = STADIUM_SEATING_SPOTS.filter((spot) => !spot.isVip);
  assert.ok(vipSeats.length >= 4, 'VIP Presidential Lounge exposes interactive VIP seats');
  assert.ok(standSeats.length >= 8, 'East, West, North, and South stands expose interactive seats');
});

test('stadium wall colliders block players from passing through exterior walls while keeping East and West gates open', () => {
  const colliders = getStadiumWallColliders(STADIUM_CONFIG);
  assert.ok(colliders.length >= 6, 'includes perimeter wall colliders and parked car colliders');

  // Attempting to walk through the North exterior wall pushes the player out
  const northWallAttempt = { x: STADIUM_CONFIG.x, z: STADIUM_CONFIG.z - (STADIUM_CONFIG.standHalfZ + 0.38) };
  let northBlocked = false;
  for (const collider of colliders) {
    const contact = resolveDiscAgainstOrientedBox({ ...northWallAttempt }, collider, 0.42);
    if (contact) northBlocked = true;
  }
  assert.equal(northBlocked, true, 'North stadium wall blocks player passage');

  // Attempting to walk through the East North-wing wall pushes the player out
  const eastWallAttempt = { x: STADIUM_CONFIG.x + STADIUM_CONFIG.standHalfX + 0.38, z: STADIUM_CONFIG.z - 10 };
  let eastWingBlocked = false;
  for (const collider of colliders) {
    const contact = resolveDiscAgainstOrientedBox({ ...eastWallAttempt }, collider, 0.42);
    if (contact) eastWingBlocked = true;
  }
  assert.equal(eastWingBlocked, true, 'East wing stadium wall blocks player passage');

  // Walking through the East Main Gate (z = STADIUM_CONFIG.z) and West VIP Gate is unobstructed
  for (const gateX of [STADIUM_CONFIG.x + STADIUM_CONFIG.standHalfX + 0.38, STADIUM_CONFIG.x - STADIUM_CONFIG.standHalfX - 0.38]) {
    let gateBlocked = false;
    for (const collider of colliders) {
      const contact = resolveDiscAgainstOrientedBox({ x: gateX, z: STADIUM_CONFIG.z }, collider, 0.42);
      if (contact) gateBlocked = true;
    }
    assert.equal(gateBlocked, false, 'Main East and West VIP gates allow the player to walk into the stadium');
  }
});

test('stadium surface height supports exploring the pitch, stepped stands, VIP lounge, and parking lot, and finding seats', () => {
  const baseY = STADIUM_CONFIG.level;
  const pitchY = getStadiumSurfaceHeight(STADIUM_CONFIG.x, STADIUM_CONFIG.z, baseY, STADIUM_CONFIG);
  const lowerEastStandY = getStadiumSurfaceHeight(STADIUM_CONFIG.x + 13.2, STADIUM_CONFIG.z - 6, baseY, STADIUM_CONFIG);
  const upperEastStandY = getStadiumSurfaceHeight(STADIUM_CONFIG.x + 16.5, STADIUM_CONFIG.z - 6, baseY, STADIUM_CONFIG);
  const vipLoungeY = getStadiumSurfaceHeight(STADIUM_CONFIG.x - 16.0, STADIUM_CONFIG.z - 5, baseY, STADIUM_CONFIG);
  const parkingY = getStadiumSurfaceHeight(
    STADIUM_CONFIG.x + STADIUM_CONFIG.parkingCenterX,
    STADIUM_CONFIG.z + STADIUM_CONFIG.parkingCenterZ,
    baseY,
    STADIUM_CONFIG,
  );

  assert.ok(pitchY > baseY, 'pitch is elevated above base terrain');
  assert.ok(lowerEastStandY > pitchY, 'lower stand tier is elevated above pitch');
  assert.ok(upperEastStandY > lowerEastStandY, 'upper stand tier steps higher than lower stand tier');
  assert.ok(vipLoungeY > upperEastStandY, 'VIP Presidential Lounge deck is elevated overlooking the pitch');
  assert.ok(parkingY > baseY, 'stadium parking lot has a paved surface height');
  assert.equal(isInsideStadiumBowl(STADIUM_CONFIG.x, STADIUM_CONFIG.z, STADIUM_CONFIG), true);

  const nearestVip = getNearestStadiumSeat(STADIUM_CONFIG.x - 16.0, STADIUM_CONFIG.z - 5.2, baseY, STADIUM_CONFIG);
  assert.equal(nearestVip.isVip, true, 'finds VIP seat when exploring the West VIP Presidential Lounge');
  const nearestEast = getNearestStadiumSeat(STADIUM_CONFIG.x + 14.2, STADIUM_CONFIG.z - 3.7, baseY, STADIUM_CONFIG);
  assert.equal(nearestEast.sectionName, 'East Stand', 'finds East Stand seat when exploring the East Stand');
});
