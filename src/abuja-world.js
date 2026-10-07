import * as THREE from 'three';

// A visual skyline reference only; these positions are not a survey of Abuja.
export const ABUJA_HORIZON = Object.freeze({
  landmark: Object.freeze({
    name: 'Aso Rock — distant stylised landmark',
    x: 24,
    z: -210,
    baseY: -0.72,
    height: 46,
    radius: 21,
  }),
});

const ROCK_LEVELS = Object.freeze([
  Object.freeze({ y: 0, radius: 19 }),
  Object.freeze({ y: 4, radius: 21 }),
  Object.freeze({ y: 10, radius: 19 }),
  Object.freeze({ y: 19, radius: 17 }),
  Object.freeze({ y: 29, radius: 16 }),
  Object.freeze({ y: 36, radius: 14 }),
  Object.freeze({ y: 41, radius: 11 }),
  Object.freeze({ y: 44, radius: 7 }),
]);

const ROCK_PALETTE = Object.freeze([0x6e695f, 0x81796b, 0x958976, 0xa2957f, 0xb1a187]);
const RING_SEGMENTS = 16;

function rockPoint(levelIndex, segmentIndex) {
  const level = ROCK_LEVELS[levelIndex];
  const angle = (segmentIndex / RING_SEGMENTS) * Math.PI * 2;
  const irregularity = 1
    + Math.sin(angle * 3 + levelIndex * 0.61) * 0.055
    + Math.cos(angle * 5 - levelIndex * 0.37) * 0.025;
  const radius = level.radius * irregularity;
  const centreX = Math.sin(levelIndex * 0.53) * 1.15;
  const centreZ = Math.cos(levelIndex * 0.41) * 0.95;
  return new THREE.Vector3(
    centreX + Math.cos(angle) * radius,
    level.y,
    centreZ + Math.sin(angle) * radius,
  );
}

function appendFlatTriangle(positions, colors, a, b, c, color) {
  const linearColor = new THREE.Color(color);
  for (const point of [a, b, c]) {
    positions.push(point.x, point.y, point.z);
    colors.push(linearColor.r, linearColor.g, linearColor.b);
  }
}

export function createAsoRockGeometry() {
  const positions = [];
  const colors = [];
  for (let levelIndex = 0; levelIndex < ROCK_LEVELS.length - 1; levelIndex += 1) {
    for (let segment = 0; segment < RING_SEGMENTS; segment += 1) {
      const nextSegment = (segment + 1) % RING_SEGMENTS;
      const lowerA = rockPoint(levelIndex, segment);
      const lowerB = rockPoint(levelIndex, nextSegment);
      const upperA = rockPoint(levelIndex + 1, segment);
      const upperB = rockPoint(levelIndex + 1, nextSegment);
      const paletteIndex = Math.min(ROCK_PALETTE.length - 1, Math.floor((levelIndex / (ROCK_LEVELS.length - 1)) * ROCK_PALETTE.length));
      const facetShift = (segment + levelIndex * 2) % 4 === 0 ? 1 : 0;
      const color = ROCK_PALETTE[Math.min(ROCK_PALETTE.length - 1, paletteIndex + facetShift)];
      appendFlatTriangle(positions, colors, lowerA, upperA, lowerB, color);
      appendFlatTriangle(positions, colors, lowerB, upperA, upperB, color);
    }
  }

  const topCenter = new THREE.Vector3(0, ABUJA_HORIZON.landmark.height, 0);
  const topLevelIndex = ROCK_LEVELS.length - 1;
  for (let segment = 0; segment < RING_SEGMENTS; segment += 1) {
    const nextSegment = (segment + 1) % RING_SEGMENTS;
    appendFlatTriangle(
      positions,
      colors,
      topCenter,
      rockPoint(topLevelIndex, nextSegment),
      rockPoint(topLevelIndex, segment),
      ROCK_PALETTE.at(-1),
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

export function createAbujaLandscape() {
  const group = new THREE.Group();
  group.name = 'Abuja inland savannah horizon';

  const rock = new THREE.Mesh(
    createAsoRockGeometry(),
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }),
  );
  rock.name = ABUJA_HORIZON.landmark.name;
  rock.position.set(ABUJA_HORIZON.landmark.x, ABUJA_HORIZON.landmark.baseY, ABUJA_HORIZON.landmark.z);
  rock.castShadow = false;
  rock.receiveShadow = false;
  group.add(rock);

  // Low, far ridges keep the dry inland horizon from reading as a flat ocean plane.
  const ridgeGeometry = new THREE.DodecahedronGeometry(1, 0);
  const ridgeMaterial = new THREE.MeshStandardMaterial({ color: 0x8d8061, roughness: 1, flatShading: true });
  const ridgeLayout = [
    { x: -195, z: -155, width: 58, height: 14, depth: 32, rotation: 0.18 },
    { x: 185, z: -145, width: 54, height: 11, depth: 30, rotation: -0.34 },
    { x: 205, z: 54, width: 64, height: 13, depth: 34, rotation: 0.42 },
    { x: -180, z: 185, width: 60, height: 12, depth: 33, rotation: -0.22 },
    { x: 96, z: 215, width: 52, height: 10, depth: 28, rotation: 0.61 },
  ];
  const ridges = new THREE.InstancedMesh(ridgeGeometry, ridgeMaterial, ridgeLayout.length);
  const transform = new THREE.Object3D();
  for (let index = 0; index < ridgeLayout.length; index += 1) {
    const ridge = ridgeLayout[index];
    transform.position.set(ridge.x, -0.72 + ridge.height * 0.5, ridge.z);
    transform.rotation.set(0, ridge.rotation, 0);
    transform.scale.set(ridge.width * 0.5, ridge.height * 0.5, ridge.depth * 0.5);
    transform.updateMatrix();
    ridges.setMatrixAt(index, transform.matrix);
  }
  ridges.name = 'Distant Abuja plateau ridges';
  ridges.castShadow = false;
  ridges.receiveShadow = false;
  ridges.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  ridges.instanceMatrix.needsUpdate = true;
  ridges.computeBoundingSphere();
  group.add(ridges);

  return group;
}
