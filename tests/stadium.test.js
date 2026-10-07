import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { STADIUM_CONFIG, updateStadiumMatch } from '../src/stadium.js';

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
