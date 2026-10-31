/**
 * Neighbourhood pedestrians: small articulated residents strolling the
 * promenades around Unity Court, the Mall, the Civic Plaza and Stadium
 * Boulevard. Each walker reuses the biomechanical walk cycle from
 * walk-cycle.js and costs 8 shadow-less meshes (batched materials).
 */

import * as THREE from 'three';
import { computeWalkCyclePose } from './walk-cycle.js';

/** Friendly names so greetings feel personal. */
export const PEDESTRIAN_NAMES = Object.freeze(['Amaka', 'Musa', 'Chidi', 'Fatima', 'Emeka', 'Aisha', 'Ngozi', 'Bola', 'Sade', 'Tunde']);

/** Find the closest walker within `maxDistance` of a world position. */
export function findNearestWalker(walkers, x, z, maxDistance = 11) {
  let nearest = null;
  let best = maxDistance * maxDistance;
  for (const walker of walkers) {
    const rigGroup = walker.rig.group;
    const dx = rigGroup.position.x - x;
    const dz = rigGroup.position.z - z;
    const sq = dx * dx + dz * dz;
    if (sq < best) {
      best = sq;
      nearest = walker;
    }
  }
  return nearest;
}

/** Ask a walker to wave back for `duration` seconds. */
export function triggerWalkerWave(walker, duration = 2.2) {
  if (!walker) return false;
  walker.waveTimer = Math.max(walker.waveTimer, duration);
  return true;
}

function angleDelta(from, to) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

/** Closed promenade loops anchored to the real world-layout road network. */
export const PEDESTRIAN_PROMENADE_PATHS = Object.freeze([
  // Unity Court estate lane (follows the estate roads at x≈34–62, z≈-24).
  Object.freeze([
    Object.freeze([42, -21.6]),
    Object.freeze([58, -21.6]),
    Object.freeze([63, -33]),
    Object.freeze([63, -12]),
    Object.freeze([42, -26.4]),
  ]),
  // Unity Grand Mall & CBD promenade (mall at 72,72 · café at 35,68).
  Object.freeze([
    Object.freeze([51, 52]),
    Object.freeze([61, 61]),
    Object.freeze([58, 69]),
    Object.freeze([48, 62]),
  ]),
  // Governor's Office civic plaza (Three Arms roundabout at -22,60).
  Object.freeze([
    Object.freeze([-28, 57]),
    Object.freeze([-38, 63]),
    Object.freeze([-35, 71]),
    Object.freeze([-25, 66]),
  ]),
  // Stadium Boulevard approach (roundabout at -34,-8 · stadium at -68,-24).
  Object.freeze([
    Object.freeze([-38, -12]),
    Object.freeze([-50, -15]),
    Object.freeze([-55, -25]),
    Object.freeze([-42, -23]),
  ]),
]);

const SHIRT_COLORS = [0x4e7ca1, 0xb5654f, 0x5f8a5a, 0xc4994f, 0x7a6796, 0x3f7d78];
const TROUSER_COLORS = [0x2e3a44, 0x4a4238, 0x37414c, 0x51483c];
const SKIN_TONES = [0x8d5a3b, 0xa9714c, 0x6f452c, 0xc08a62];

function createPedestrianRig({ shirt, trousers, skin }) {
  const group = new THREE.Group();

  const shirtMaterial = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.92 });
  const trouserMaterial = new THREE.MeshStandardMaterial({ color: trousers, roughness: 0.95 });
  const skinMaterial = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.88 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.55, 0.22), shirtMaterial);
  torso.position.y = 1.08;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.23, 0.21), skinMaterial);
  head.position.y = 1.5;
  group.add(head);

  const legPivots = [];
  const kneePivots = [];
  for (const side of [-1, 1]) {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.1, 0.82, 0);
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.42, 0.14), trouserMaterial);
    thigh.position.y = -0.21;
    legPivot.add(thigh);
    const kneePivot = new THREE.Group();
    kneePivot.position.y = -0.42;
    const shin = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.4, 0.125), trouserMaterial);
    shin.position.y = -0.2;
    kneePivot.add(shin);
    legPivot.add(kneePivot);
    group.add(legPivot);
    legPivots.push(legPivot);
    kneePivots.push(kneePivot);
  }

  const armPivots = [];
  for (const side of [-1, 1]) {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 0.235, 1.3, 0);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.58, 0.105), shirtMaterial);
    arm.position.y = -0.29;
    armPivot.add(arm);
    group.add(armPivot);
    armPivots.push(armPivot);
  }

  for (const child of group.children) {
    child.traverse?.((node) => {
      if (node.isMesh) {
        node.castShadow = false;
        node.receiveShadow = false;
      }
    });
    if (child.isMesh) {
      child.castShadow = false;
      child.receiveShadow = false;
    }
  }

  return { group, legPivots, kneePivots, armPivots };
}

/**
 * Build the crowd. `groundHeightAt(x, z)` supplies walkable ground height so
 * promenades follow roads, bridges and terrain.
 */
export function createPedestrianCrowd({
  groundHeightAt,
  count = 6,
  random = Math.random,
  paths = PEDESTRIAN_PROMENADE_PATHS,
  cullDistance = 84,
} = {}) {
  const safeRandom = typeof random === 'function' ? random : Math.random;
  const safeCount = Math.max(1, Math.floor(count));
  const groundAt = typeof groundHeightAt === 'function' ? groundHeightAt : () => 0;

  const group = new THREE.Group();
  group.name = 'NeighbourhoodPedestrians';

  const walkers = [];
  for (let i = 0; i < safeCount; i += 1) {
    const path = paths[i % paths.length];
    const waypointIndex = Math.floor(safeRandom() * path.length) % path.length;
    const [startX, startZ] = path[waypointIndex];
    const speed = 1.12 + safeRandom() * 0.55;
    const rig = createPedestrianRig({
      shirt: SHIRT_COLORS[i % SHIRT_COLORS.length],
      trousers: TROUSER_COLORS[i % TROUSER_COLORS.length],
      skin: SKIN_TONES[i % SKIN_TONES.length],
    });
    rig.group.position.set(startX, groundAt(startX, startZ), startZ);
    group.add(rig.group);

    walkers.push({
      rig,
      path,
      waypointIndex: (waypointIndex + 1) % path.length,
      speed,
      yaw: safeRandom() * Math.PI * 2,
      phase: safeRandom() * Math.PI * 2,
      cadence: 4.4 + speed * 1.15,
      waveTimer: 0,
      name: PEDESTRIAN_NAMES[i % PEDESTRIAN_NAMES.length],
      visible: true,
    });
  }

  return {
    group,
    walkers,
    update(delta, playerPosition = null) {
      const safeDelta = Number.isFinite(delta) && delta > 0 ? Math.min(delta, 0.1) : 0;
      if (safeDelta === 0) return;
      for (const walker of walkers) {
        const rigGroup = walker.rig.group;
        const [targetX, targetZ] = walker.path[walker.waypointIndex];
        let dirX = targetX - rigGroup.position.x;
        let dirZ = targetZ - rigGroup.position.z;
        const distance = Math.hypot(dirX, dirZ);

        if (playerPosition) {
          const dx = rigGroup.position.x - playerPosition.x;
          const dz = rigGroup.position.z - playerPosition.z;
          const inRange = dx * dx + dz * dz < cullDistance * cullDistance;
          if (inRange !== walker.visible) {
            walker.visible = inRange;
            rigGroup.visible = inRange;
          }
          if (!inRange) continue;
        }

        if (distance < 0.85) {
          walker.waypointIndex = (walker.waypointIndex + 1) % walker.path.length;
        } else {
          dirX /= distance;
          dirZ /= distance;
          rigGroup.position.x += dirX * walker.speed * safeDelta;
          rigGroup.position.z += dirZ * walker.speed * safeDelta;
          const targetYaw = Math.atan2(-dirX, -dirZ);
          walker.yaw += angleDelta(walker.yaw, targetYaw) * (1 - Math.exp(-7 * safeDelta));
          rigGroup.rotation.y = walker.yaw;
        }

        rigGroup.position.y = groundAt(rigGroup.position.x, rigGroup.position.z);

        walker.phase += walker.cadence * safeDelta;
        const strideAmount = 0.52 + walker.speed * 0.22;
        const pose = computeWalkCyclePose({
          phase: walker.phase,
          strideAmount,
          isRunning: false,
          idleSway: 0,
          jumpHeight: 0,
        });
        walker.rig.legPivots[0].rotation.x = pose.leftLeg.hipPitch;
        walker.rig.legPivots[1].rotation.x = pose.rightLeg.hipPitch;
        walker.rig.kneePivots[0].rotation.x = pose.leftLeg.kneePitch;
        walker.rig.kneePivots[1].rotation.x = pose.rightLeg.kneePitch;
        walker.rig.armPivots[0].rotation.x = pose.leftArmPitch;
        walker.rig.armPivots[0].rotation.z = 0;
        walker.rig.armPivots[1].rotation.x = pose.rightArmPitch;
        walker.rig.armPivots[1].rotation.z = 0;

        // Greeting: the walker raises their arm and waves back for a moment.
        if (walker.waveTimer > 0) {
          walker.waveTimer = Math.max(0, walker.waveTimer - safeDelta);
          const waveSwing = Math.sin(walker.waveTimer * 9.5) * 0.32;
          walker.rig.armPivots[1].rotation.x = -2.35 + waveSwing * 0.25;
          walker.rig.armPivots[1].rotation.z = -0.55 + waveSwing;
        }
      }
    },
  };
}
