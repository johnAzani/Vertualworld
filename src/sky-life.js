/**
 * Living sky: a circling bird flock (one InstancedMesh draw call) and
 * night-time fireflies (one Points draw call). Both are pure animation over
 * shared buffers — no per-frame allocation, no shadow casting.
 */

import * as THREE from 'three';

function createBirdGeometry() {
  // A slim V-glide silhouette: two swept wing triangles plus small tail fans.
  const positions = new Float32Array([
    // left wing
    0, 0, 0.34, -0.78, 0.16, -0.24, -0.08, 0.015, -0.2,
    // right wing
    0, 0, 0.34, 0.08, 0.015, -0.2, 0.78, 0.16, -0.24,
    // tail
    -0.08, 0.015, -0.2, 0, 0.02, -0.42, 0.08, 0.015, -0.2,
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Birds orbit lazily around the city at altitude, banking into their turns and
 * flapping via per-instance wing squash. `update(time)` is cheap enough to run
 * every frame.
 */
export function createBirdFlock({ count = 9, random = Math.random, center = { x: 0, z: 0 } } = {}) {
  const safeRandom = typeof random === 'function' ? random : Math.random;
  const safeCount = Math.max(1, Math.floor(count));
  const geometry = createBirdGeometry();
  const material = new THREE.MeshStandardMaterial({
    color: 0x2c3a42,
    roughness: 0.95,
    metalness: 0,
    flatShading: true,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, safeCount);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.frustumCulled = false;
  mesh.name = 'BirdFlock';

  const birds = [];
  for (let i = 0; i < safeCount; i += 1) {
    birds.push({
      centerX: center.x + (safeRandom() - 0.5) * 130,
      centerZ: center.z + (safeRandom() - 0.5) * 130,
      radius: 34 + safeRandom() * 62,
      altitude: 23 + safeRandom() * 22,
      angularSpeed: (safeRandom() > 0.5 ? 1 : -1) * (0.026 + safeRandom() * 0.032),
      phase: safeRandom() * Math.PI * 2,
      bobPhase: safeRandom() * Math.PI * 2,
      flapPhase: safeRandom() * Math.PI * 2,
      flapSpeed: 5.2 + safeRandom() * 3.2,
    });
  }

  const transform = new THREE.Object3D();

  return {
    mesh,
    birds,
    update(time) {
      const t = Number.isFinite(time) ? time : 0;
      for (let i = 0; i < birds.length; i += 1) {
        const bird = birds[i];
        const angle = bird.phase + t * bird.angularSpeed;
        const x = bird.centerX + Math.cos(angle) * bird.radius;
        const z = bird.centerZ + Math.sin(angle) * bird.radius;
        const y = bird.altitude + Math.sin(t * 0.65 + bird.bobPhase) * 1.9;
        const heading = angle + (bird.angularSpeed > 0 ? Math.PI / 2 : -Math.PI / 2);
        const flap = Math.sin(t * bird.flapSpeed + bird.flapPhase);

        transform.position.set(x, y, z);
        transform.rotation.set(flap * 0.12, -heading, -Math.sign(bird.angularSpeed) * 0.34 + flap * 0.14);
        transform.scale.set(1 + flap * 0.2, 1 - Math.abs(flap) * 0.12, 1);
        transform.updateMatrix();
        mesh.setMatrixAt(i, transform.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

/**
 * Butterflies flutter around the gardens by day: one vertex-coloured Points
 * cloud that swirls near the flower beds and disappears after dark.
 */
export function createButterflies({ count = 12, random = Math.random } = {}) {
  const safeRandom = typeof random === 'function' ? random : Math.random;
  const safeCount = Math.max(1, Math.floor(count));
  // Garden beds: estate shrubbery, community hall forecourt, mall promenade planters.
  const gardens = [
    { x: 52, z: -22, radius: 14 },
    { x: -38, z: 66, radius: 9 },
    { x: 68, z: 56, radius: 10 },
  ];
  const palette = [0xffd45e, 0xff9d5c, 0xfff3d8, 0xffb7d9];
  const positions = new Float32Array(safeCount * 3);
  const colors = new Float32Array(safeCount * 3);
  const drifters = [];
  const colorScratch = new THREE.Color();
  for (let i = 0; i < safeCount; i += 1) {
    const garden = gardens[i % gardens.length];
    const angle = safeRandom() * Math.PI * 2;
    const distance = safeRandom() * garden.radius;
    const drifter = {
      homeX: garden.x + Math.cos(angle) * distance,
      homeY: 0.55 + safeRandom() * 1.35,
      homeZ: garden.z + Math.sin(angle) * distance,
      swirlR: 0.6 + safeRandom() * 1.15,
      speed: 0.65 + safeRandom() * 0.75,
      phase: safeRandom() * Math.PI * 2,
    };
    drifters.push(drifter);
    positions[i * 3] = drifter.homeX;
    positions[i * 3 + 1] = drifter.homeY;
    positions[i * 3 + 2] = drifter.homeZ;
    colorScratch.setHex(palette[i % palette.length]);
    colors[i * 3] = colorScratch.r;
    colors[i * 3 + 1] = colorScratch.g;
    colors[i * 3 + 2] = colorScratch.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.22,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.visible = false;
  points.name = 'Butterflies';

  return {
    points,
    update(time, nightAmount = 0) {
      const night = Math.max(0, Math.min(1, Number(nightAmount) || 0));
      points.visible = night < 0.62;
      if (!points.visible) return;
      const t = Number.isFinite(time) ? time : 0;
      for (let i = 0; i < drifters.length; i += 1) {
        const drifter = drifters[i];
        const swirl = t * drifter.speed + drifter.phase;
        positions[i * 3] = drifter.homeX + Math.sin(swirl) * drifter.swirlR;
        positions[i * 3 + 1] = drifter.homeY + Math.sin(swirl * 1.7 + drifter.phase) * 0.34;
        positions[i * 3 + 2] = drifter.homeZ + Math.cos(swirl * 0.82) * drifter.swirlR;
      }
      geometry.attributes.position.needsUpdate = true;
      material.opacity = (1 - night) * 0.85;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

/**
 * Fireflies drift around the neighbourhood after dark: one additive Points
 * cloud whose opacity follows the night amount.
 */
export function createFireflies({ count = 42, random = Math.random, center = { x: 0, z: 0 }, radius = 58 } = {}) {
  const safeRandom = typeof random === 'function' ? random : Math.random;
  const safeCount = Math.max(1, Math.floor(count));
  const positions = new Float32Array(safeCount * 3);
  const drifters = [];
  for (let i = 0; i < safeCount; i += 1) {
    const angle = safeRandom() * Math.PI * 2;
    const distance = 6 + safeRandom() * radius;
    drifters.push({
      homeX: center.x + Math.cos(angle) * distance,
      homeY: 0.7 + safeRandom() * 2.1,
      homeZ: center.z + Math.sin(angle) * distance,
      swayX: 0.6 + safeRandom() * 1.1,
      swayZ: 0.6 + safeRandom() * 1.1,
      swayY: 0.28 + safeRandom() * 0.5,
      speed: 0.35 + safeRandom() * 0.55,
      phase: safeRandom() * Math.PI * 2,
      flickerSpeed: 1.4 + safeRandom() * 2.4,
    });
    positions[i * 3] = drifters[i].homeX;
    positions[i * 3 + 1] = drifters[i].homeY;
    positions[i * 3 + 2] = drifters[i].homeZ;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffe9a2,
    size: 0.17,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    fog: false,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.visible = false;
  points.name = 'Fireflies';

  return {
    points,
    update(time, nightAmount = 0) {
      const night = Math.max(0, Math.min(1, Number(nightAmount) || 0));
      points.visible = night > 0.18;
      if (!points.visible) return;
      const t = Number.isFinite(time) ? time : 0;
      for (let i = 0; i < drifters.length; i += 1) {
        const drifter = drifters[i];
        const sway = t * drifter.speed + drifter.phase;
        positions[i * 3] = drifter.homeX + Math.sin(sway * 1.1) * drifter.swayX;
        positions[i * 3 + 1] = drifter.homeY + Math.sin(sway * 1.7 + drifter.phase) * drifter.swayY;
        positions[i * 3 + 2] = drifter.homeZ + Math.cos(sway * 0.9) * drifter.swayZ;
      }
      geometry.attributes.position.needsUpdate = true;
      const flicker = 0.62 + Math.sin(t * 1.9) * 0.12;
      material.opacity = Math.min(1, night) * flicker;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
