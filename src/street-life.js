/**
 * Street life: moving local traffic (keke NAPEP, okada, private car) on the
 * real road network, canoes drifting on the Jabi–Usuma waterway, roadside
 * suya/fruit stands with grill glow and rising smoke, and harmattan dust.
 *
 * Nigeria drives on the left: every vehicle keeps to the left of its own
 * direction of travel, so two-way traffic naturally splits around the road
 * centreline. Nothing here casts shadows or allocates per frame.
 */

import * as THREE from 'three';
import { ABUJA_RIVER_WATERWAY_POINTS } from './world-layout.js';

const _position = new THREE.Vector3();
const _tangent = new THREE.Vector3();

function makeWheelGeometry(radius, width) {
  const geometry = new THREE.CylinderGeometry(radius, radius, width, 12);
  geometry.rotateZ(Math.PI / 2);
  return geometry;
}

const WHEEL_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x22262a, roughness: 0.92 });
const GLASS_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x2c343a, roughness: 0.24, metalness: 0.18 });
const RIDER_SKIN_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x8d5a3b, roughness: 0.85 });

function addPart(group, geometry, material, x, y, z) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  group.add(mesh);
  return mesh;
}

/** Yellow-green keke NAPEP tricycle: body, canopy, one front + two rear wheels. */
function createKeke() {
  const group = new THREE.Group();
  group.name = 'KekeNAPEP';
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xe8b23a, roughness: 0.72 });
  const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0x2f7d4f, roughness: 0.72 });
  addPart(group, new THREE.BoxGeometry(1.02, 0.52, 1.62), bodyMaterial, 0, 0.56, 0);
  addPart(group, new THREE.BoxGeometry(1.06, 0.16, 1.2), stripeMaterial, 0, 0.72, 0.1);
  addPart(group, new THREE.BoxGeometry(0.96, 0.5, 0.94), GLASS_MATERIAL, 0, 1.06, -0.28);
  addPart(group, new THREE.BoxGeometry(0.8, 0.06, 0.42), stripeMaterial, 0, 1.32, -0.28);
  addPart(group, new THREE.BoxGeometry(0.52, 0.09, 0.09), WHEEL_MATERIAL, 0, 1.02, -0.84);
  const wheels = [
    addPart(group, makeWheelGeometry(0.2, 0.1), WHEEL_MATERIAL, 0, 0.2, -0.92),
    addPart(group, makeWheelGeometry(0.22, 0.12), WHEEL_MATERIAL, -0.56, 0.22, 0.52),
    addPart(group, makeWheelGeometry(0.22, 0.12), WHEEL_MATERIAL, 0.56, 0.22, 0.52),
  ];
  return { group, wheels };
}

/** Okada: commercial motorcycle with a rider silhouette. */
function createOkada() {
  const group = new THREE.Group();
  group.name = 'Okada';
  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x31424e, roughness: 0.66, metalness: 0.18 });
  const riderMaterial = new THREE.MeshStandardMaterial({ color: 0x4a6d52, roughness: 0.92 });
  const wheels = [
    addPart(group, makeWheelGeometry(0.27, 0.07), WHEEL_MATERIAL, 0, 0.27, -0.62),
    addPart(group, makeWheelGeometry(0.27, 0.07), WHEEL_MATERIAL, 0, 0.27, 0.56),
  ];
  addPart(group, new THREE.BoxGeometry(0.16, 0.24, 1.1), frameMaterial, 0, 0.52, -0.02);
  addPart(group, new THREE.BoxGeometry(0.42, 0.09, 0.09), frameMaterial, 0, 0.86, -0.42);
  addPart(group, new THREE.BoxGeometry(0.3, 0.52, 0.24), riderMaterial, 0, 0.98, 0.16);
  addPart(group, new THREE.BoxGeometry(0.2, 0.22, 0.2), RIDER_SKIN_MATERIAL, 0, 1.38, 0.1);
  return { group, wheels };
}

/** Simple private car: body, cabin and four wheels. */
function createAmbientCar(color = 0x7a8794) {
  const group = new THREE.Group();
  group.name = 'AmbientCar';
  const bodyMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.52, metalness: 0.22 });
  addPart(group, new THREE.BoxGeometry(1.02, 0.44, 2.1), bodyMaterial, 0, 0.52, 0);
  addPart(group, new THREE.BoxGeometry(0.92, 0.42, 1.06), GLASS_MATERIAL, 0, 0.96, -0.06);
  const wheels = [];
  for (const side of [-1, 1]) {
    for (const front of [-1, 1]) {
      wheels.push(addPart(group, makeWheelGeometry(0.23, 0.1), WHEEL_MATERIAL, side * 0.6, 0.23, front * 0.72));
    }
  }
  return { group, wheels };
}

/**
 * Vehicles loop along a curve-like road (anything with getPointAt/getTangentAt
 * and a length), at fixed speeds, in two lanes keeping to the left of travel.
 */
export function createStreetTraffic({
  roadCurve,
  roadLength,
  groundHeightAt,
  random = Math.random,
  cullDistance = 110,
} = {}) {
  const safeRandom = typeof random === 'function' ? random : Math.random;
  const groundAt = typeof groundHeightAt === 'function' ? groundHeightAt : () => 0;
  const length = Number.isFinite(roadLength) && roadLength > 1 ? roadLength : roadCurve?.getLength?.() ?? 1;

  const group = new THREE.Group();
  group.name = 'StreetTraffic';

  const rigs = [createKeke(), createOkada(), createAmbientCar(0x7a8794), createAmbientCar(0x9a5b4c)];
  const vehicles = rigs.map((rig, index) => {
    group.add(rig.group);
    return {
      rig,
      distance: (length / rigs.length) * index + safeRandom() * (length * 0.08),
      speed: 5.2 + safeRandom() * 3.4,
      direction: index % 2 === 0 ? 1 : -1,
      laneOffset: 1.15,
      wheelRadius: 0.22,
      spin: safeRandom() * Math.PI * 2,
      visible: true,
    };
  });

  return {
    group,
    vehicles,
    update(delta, playerPosition = null) {
      const safeDelta = Number.isFinite(delta) && delta > 0 ? Math.min(delta, 0.1) : 0;
      if (!safeDelta || !roadCurve) return;
      for (const vehicle of vehicles) {
        const rigGroup = vehicle.rig.group;
        vehicle.distance += vehicle.speed * vehicle.direction * safeDelta;
        const fraction = ((vehicle.distance % length) + length) % length / length;
        roadCurve.getPointAt(fraction, _position);
        roadCurve.getTangentAt(fraction, _tangent);
        _tangent.y = 0;
        _tangent.normalize();
        const dirX = _tangent.x * vehicle.direction;
        const dirZ = _tangent.z * vehicle.direction;

        // Keep left of travel: perpendicular offset opposite for each direction.
        const leftX = dirZ;
        const leftZ = -dirX;
        const x = _position.x + leftX * vehicle.laneOffset;
        const z = _position.z + leftZ * vehicle.laneOffset;

        if (playerPosition) {
          const dx = x - playerPosition.x;
          const dz = z - playerPosition.z;
          const inRange = dx * dx + dz * dz < cullDistance * cullDistance;
          if (inRange !== vehicle.visible) {
            vehicle.visible = inRange;
            rigGroup.visible = inRange;
          }
          if (!inRange) continue;
        }

        rigGroup.position.set(x, groundAt(x, z) + 0.02, z);
        rigGroup.rotation.y = Math.atan2(-dirX, -dirZ);

        vehicle.spin += (vehicle.speed / vehicle.wheelRadius) * safeDelta;
        for (const wheel of vehicle.rig.wheels) wheel.rotation.x = vehicle.spin;
      }
    },
  };
}

/**
 * Canoes drift along the Jabi–Usuma waterway: gentle bob, slow wrap-around.
 */
export function createRiverCanoes({
  terrainHeight,
  count = 2,
  random = Math.random,
  waterLevelOffset = 0.075,
} = {}) {
  const safeRandom = typeof random === 'function' ? random : Math.random;
  const heightAt = typeof terrainHeight === 'function' ? terrainHeight : () => 0;
  const riverPoints = ABUJA_RIVER_WATERWAY_POINTS.map(
    ([x, z]) => new THREE.Vector3(x, heightAt(x, z) + waterLevelOffset, z),
  );
  const riverCurve = new THREE.CatmullRomCurve3(riverPoints, false, 'centripetal');

  const group = new THREE.Group();
  group.name = 'RiverCanoes';
  const hullMaterial = new THREE.MeshStandardMaterial({ color: 0x7a5232, roughness: 0.88 });

  const canoes = [];
  for (let i = 0; i < Math.max(1, Math.floor(count)); i += 1) {
    const canoe = new THREE.Group();
    addPart(canoe, new THREE.BoxGeometry(0.62, 0.22, 2.5), hullMaterial, 0, 0, 0);
    addPart(canoe, new THREE.BoxGeometry(0.34, 0.34, 0.32), RIDER_SKIN_MATERIAL, 0, 0.3, 0.35);
    addPart(canoe, new THREE.BoxGeometry(0.05, 0.05, 1.5), hullMaterial, 0.38, 0.28, 0.3);
    group.add(canoe);
    canoes.push({
      group: canoe,
      t: (i + safeRandom() * 0.3) / count,
      speed: 0.0016 + safeRandom() * 0.0012,
      phase: safeRandom() * Math.PI * 2,
    });
  }

  return {
    group,
    canoes,
    riverCurve,
    update(delta, time = 0) {
      const safeDelta = Number.isFinite(delta) && delta > 0 ? Math.min(delta, 0.1) : 0;
      const t = Number.isFinite(time) ? time : 0;
      for (const canoe of canoes) {
        canoe.t = (canoe.t + canoe.speed * safeDelta * 8) % 1;
        riverCurve.getPointAt(canoe.t, _position);
        riverCurve.getTangentAt(canoe.t, _tangent);
        canoe.group.position.set(
          _position.x,
          heightAt(_position.x, _position.z) + waterLevelOffset + 0.1 + Math.sin(t * 1.25 + canoe.phase) * 0.035,
          _position.z,
        );
        canoe.group.rotation.y = Math.atan2(-_tangent.x, -_tangent.z);
        canoe.group.rotation.z = Math.sin(t * 0.85 + canoe.phase) * 0.055;
      }
    },
  };
}

/**
 * Roadside suya & fruit stands: a stall, a parasol, a grill that glows warm
 * after dark, and a plume of smoke rising from the grill.
 */
export function createStreetStalls({ stalls, terrainHeight, random = Math.random } = {}) {
  const safeRandom = typeof random === 'function' ? random : Math.random;
  const heightAt = typeof terrainHeight === 'function' ? terrainHeight : () => 0;

  const group = new THREE.Group();
  group.name = 'RoadsideStalls';
  const tableMaterial = new THREE.MeshStandardMaterial({ color: 0x8a6845, roughness: 0.9 });
  const parasolMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xc4593f, roughness: 0.85, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x3f7a63, roughness: 0.85, flatShading: true }),
  ];
  const grillMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a3a3c,
    roughness: 0.72,
    emissive: 0xff7b2e,
    emissiveIntensity: 0.12,
  });

  const smokeFields = [];
  const stallRigs = [];

  for (let i = 0; i < stalls.length; i += 1) {
    const { x, z, facing = 0 } = stalls[i];
    const stall = new THREE.Group();
    const baseY = heightAt(x, z);
    stall.position.set(x, baseY, z);
    stall.rotation.y = facing;

    addPart(stall, new THREE.BoxGeometry(1.5, 0.5, 0.9), tableMaterial, 0, 0.42, 0);
    addPart(stall, new THREE.BoxGeometry(1.05, 0.42, 0.72), grillMaterial, 0.32, 0.86, 0);
    addPart(stall, new THREE.ConeGeometry(1.28, 0.52, 7), parasolMaterials[i % parasolMaterials.length], -0.18, 2.1, 0);
    addPart(stall, new THREE.BoxGeometry(0.06, 1.7, 0.06), tableMaterial, -0.18, 1.15, 0);

    // Grill smoke: rising Points, recycled above the grill.
    const smokeCount = 18;
    const smokePositions = new Float32Array(smokeCount * 3);
    for (let p = 0; p < smokeCount; p += 1) {
      smokePositions[p * 3] = x + 0.32 + (safeRandom() - 0.5) * 0.35;
      smokePositions[p * 3 + 1] = baseY + 1.1 + safeRandom() * 1.8;
      smokePositions[p * 3 + 2] = z + (safeRandom() - 0.5) * 0.35;
    }
    const smokeGeometry = new THREE.BufferGeometry();
    smokeGeometry.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
    const smokeMaterial = new THREE.PointsMaterial({
      color: 0xc9c2b4,
      size: 0.34,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const smokePoints = new THREE.Points(smokeGeometry, smokeMaterial);
    smokePoints.frustumCulled = false;
    smokePoints.name = 'GrillSmoke';
    group.add(smokePoints);
    smokeFields.push({ points: smokePoints, geometry: smokeGeometry, material: smokeMaterial, positions: smokePositions, baseY: baseY + 1.1, originX: x + 0.32, originZ: z });

    group.add(stall);
    stallRigs.push({ group: stall, grillMaterial });
  }

  return {
    group,
    stallRigs,
    smokeFields,
    update(delta, time = 0, nightAmount = 0, rainAmount = 0) {
      const safeDelta = Number.isFinite(delta) && delta > 0 ? Math.min(delta, 0.1) : 0;
      const t = Number.isFinite(time) ? time : 0;
      const night = Math.max(0, Math.min(1, Number(nightAmount) || 0));
      grillMaterial.emissiveIntensity = 0.12 + night * 1.35;
      const wetness = Math.max(0, Math.min(1, Number(rainAmount) || 0));
      for (const field of smokeFields) {
        const positions = field.positions;
        for (let p = 0; p < positions.length / 3; p += 1) {
          let y = positions[p * 3 + 1] + safeDelta * (0.42 + (p % 3) * 0.06);
          if (y > field.baseY + 2.3) {
            y = field.baseY;
            positions[p * 3] = field.originX + (safeRandom() - 0.5) * 0.35;
            positions[p * 3 + 2] = field.originZ + (safeRandom() - 0.5) * 0.35;
          }
          positions[p * 3 + 1] = y;
          positions[p * 3] += Math.sin(t * 0.7 + p) * safeDelta * 0.12;
        }
        field.geometry.attributes.position.needsUpdate = true;
        field.material.opacity = (0.13 + night * 0.2) * (1 - wetness * 0.45);
      }
    },
  };
}

/**
 * Harmattan dust: warm motes hanging in the dry-season haze, opacity follows
 * the harmattan amount. One Points draw call.
 */
export function createHarmattanDust({ count = 36, random = Math.random, radius = 62 } = {}) {
  const safeRandom = typeof random === 'function' ? random : Math.random;
  const positions = new Float32Array(Math.max(1, Math.floor(count)) * 3);
  const motes = [];
  for (let i = 0; i < positions.length / 3; i += 1) {
    const angle = safeRandom() * Math.PI * 2;
    const distance = 4 + safeRandom() * radius;
    const mote = {
      homeX: Math.cos(angle) * distance,
      homeY: 0.6 + safeRandom() * 6.5,
      homeZ: Math.sin(angle) * distance,
      speed: 0.12 + safeRandom() * 0.22,
      phase: safeRandom() * Math.PI * 2,
    };
    motes.push(mote);
    positions[i * 3] = mote.homeX;
    positions[i * 3 + 1] = mote.homeY;
    positions[i * 3 + 2] = mote.homeZ;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xd9c294,
    size: 0.12,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.visible = false;
  points.name = 'HarmattanDust';

  return {
    points,
    update(time, harmattanAmount = 0) {
      const haze = Math.max(0, Math.min(1, Number(harmattanAmount) || 0));
      points.visible = haze > 0.06;
      if (!points.visible) return;
      const t = Number.isFinite(time) ? time : 0;
      for (let i = 0; i < motes.length; i += 1) {
        const mote = motes[i];
        const drift = t * mote.speed + mote.phase;
        positions[i * 3] = mote.homeX + Math.sin(drift) * 2.2;
        positions[i * 3 + 1] = mote.homeY + Math.sin(drift * 1.6) * 0.55;
        positions[i * 3 + 2] = mote.homeZ + Math.cos(drift * 0.8) * 2.2;
      }
      geometry.attributes.position.needsUpdate = true;
      material.opacity = haze * 0.34;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
