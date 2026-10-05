import * as THREE from 'three';
import './style.css';

const app = document.querySelector('#app');
const canvas = document.querySelector('#world-canvas');
const loadingScreen = document.querySelector('#loading-screen');
const introCard = document.querySelector('#intro-card');
const toast = document.querySelector('#toast');
const toastMessage = document.querySelector('#toast-message');
const mapCanvas = document.querySelector('#map-canvas');
const mapContext = mapCanvas.getContext('2d');

const WORLD_RADIUS = 82;
const SEED_POSITIONS = [
  new THREE.Vector2(-18, -10),
  new THREE.Vector2(25, -24),
  new THREE.Vector2(-39, -42),
];
const PATH_POINTS_XZ = [
  [0, 18], [0.4, 13], [-1.8, 9], [1.6, 5], [1.4, 0], [-1.2, -5], [-2.2, -11], [0.8, -16], [1.2, -21], [0, -27],
];

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
} catch (error) {
  console.error('WebGL could not be initialized:', error);
  loadingScreen.querySelector('.loading-title').textContent = 'THIS WORLD NEEDS WEBGL';
  loadingScreen.querySelector('.loading-subtitle').textContent = 'Try opening it in a browser with 3D graphics enabled.';
  loadingScreen.querySelector('.loading-line').hidden = true;
  throw error;
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb5dce0);
scene.fog = new THREE.Fog(0xb5dce0, 90, 225);

const camera = new THREE.PerspectiveCamera(49, window.innerWidth / window.innerHeight, 0.1, 600);
camera.position.set(0, 7, 23);

const hemi = new THREE.HemisphereLight(0xe2fff1, 0x597662, 2.0);
scene.add(hemi);

const sunLight = new THREE.DirectionalLight(0xffedcf, 3.1);
sunLight.position.set(-36, 54, 22);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1536, 1536);
sunLight.shadow.camera.left = -78;
sunLight.shadow.camera.right = 78;
sunLight.shadow.camera.top = 78;
sunLight.shadow.camera.bottom = -78;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 160;
sunLight.shadow.bias = -0.00028;
sunLight.shadow.normalBias = 0.035;
scene.add(sunLight);
sunLight.target.position.set(0, 0, -8);
scene.add(sunLight.target);

const fillLight = new THREE.DirectionalLight(0xc2f0e8, 0.55);
fillLight.position.set(35, 18, -35);
scene.add(fillLight);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep01(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function terrainHeight(x, z) {
  const radius = Math.hypot(x, z);
  const meadow = 0.22
    + Math.sin(x * 0.105 + Math.sin(z * 0.08)) * Math.cos(z * 0.085) * 0.28
    + Math.sin((x + z) * 0.16) * 0.12;
  if (radius < 69) return meadow;
  const edge = smoothstep01((radius - 69) / 14);
  return THREE.MathUtils.lerp(meadow, -15.5, edge);
}

function distanceToPath(x, z) {
  let minimum = Infinity;
  for (let i = 0; i < PATH_POINTS_XZ.length - 1; i += 1) {
    const [ax, az] = PATH_POINTS_XZ[i];
    const [bx, bz] = PATH_POINTS_XZ[i + 1];
    const dx = bx - ax;
    const dz = bz - az;
    const lengthSq = dx * dx + dz * dz;
    const t = lengthSq === 0 ? 0 : clamp(((x - ax) * dx + (z - az) * dz) / lengthSq, 0, 1);
    minimum = Math.min(minimum, Math.hypot(x - (ax + dx * t), z - (az + dz * t)));
  }
  return minimum;
}

function isReservedSpot(x, z, extra = 0) {
  if (distanceToPath(x, z) < 4.2 + extra) return true;
  if (Math.hypot(x, z + 27) < 11 + extra) return true;
  if (Math.hypot(x, z - 12) < 7 + extra) return true;
  return SEED_POSITIONS.some((point) => Math.hypot(x - point.x, z - point.y) < 5.5 + extra);
}

// A softly rolling, vertex-painted island. The outer mesh dips under the water to form its shoreline.
const terrainGeometry = new THREE.PlaneGeometry(180, 180, 112, 112);
const terrainPositions = terrainGeometry.attributes.position;
const terrainColors = [];
const grassDeep = new THREE.Color(0x538b68);
const grassBase = new THREE.Color(0x73aa70);
const grassLight = new THREE.Color(0xa5c57f);
const shorelineColor = new THREE.Color(0xb7ad7c);
for (let i = 0; i < terrainPositions.count; i += 1) {
  const x = terrainPositions.getX(i);
  const z = -terrainPositions.getY(i);
  const radius = Math.hypot(x, z);
  const height = terrainHeight(x, z);
  terrainPositions.setZ(i, height);
  const patch = 0.5 + 0.5 * Math.sin(x * 0.14 + Math.sin(z * 0.11)) * Math.cos(z * 0.13);
  const color = grassDeep.clone().lerp(grassBase, 0.42 + patch * 0.42);
  color.lerp(grassLight, Math.max(0, patch - 0.66) * 0.35);
  color.lerp(shorelineColor, smoothstep01((radius - 66) / 13) * 0.72);
  terrainColors.push(color.r, color.g, color.b);
}
terrainGeometry.setAttribute('color', new THREE.Float32BufferAttribute(terrainColors, 3));
terrainGeometry.rotateX(-Math.PI / 2);
terrainGeometry.computeVertexNormals();
const terrain = new THREE.Mesh(terrainGeometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }));
terrain.receiveShadow = true;
terrain.frustumCulled = false;
scene.add(terrain);

const cliffGeometry = new THREE.CylinderGeometry(78, 91, 19, 96, 2, true);
const cliff = new THREE.Mesh(cliffGeometry, new THREE.MeshStandardMaterial({ color: 0x61766d, roughness: 1, flatShading: true }));
cliff.position.y = -9.5;
cliff.receiveShadow = true;
scene.add(cliff);
const cliffBand = new THREE.Mesh(
  new THREE.CylinderGeometry(84, 94, 4.5, 96, 1, false),
  new THREE.MeshStandardMaterial({ color: 0x455f61, roughness: 0.96, flatShading: true }),
);
cliffBand.position.y = -18.2;
scene.add(cliffBand);

const oceanGeometry = new THREE.PlaneGeometry(1200, 1200, 1, 1);
oceanGeometry.rotateX(-Math.PI / 2);
const ocean = new THREE.Mesh(oceanGeometry, new THREE.MeshPhysicalMaterial({
  color: 0x3c99b7,
  roughness: 0.31,
  metalness: 0.08,
  clearcoat: 0.48,
  clearcoatRoughness: 0.35,
}));
ocean.position.y = -8.4;
ocean.receiveShadow = true;
scene.add(ocean);

// Low, warm sun and slow cloud banks give the horizon a little depth.
const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(6.8, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffdda0 }));
sunDisc.position.set(-80, 75, -138);
scene.add(sunDisc);

const cloudMaterial = new THREE.MeshStandardMaterial({ color: 0xf2f8e9, roughness: 1, transparent: true, opacity: 0.84, depthWrite: false });
const clouds = [];
for (let i = 0; i < 7; i += 1) {
  const cloud = new THREE.Group();
  const count = 3 + (i % 3);
  for (let part = 0; part < count; part += 1) {
    const size = 1.7 + ((part + i) % 3) * 0.55;
    const puff = new THREE.Mesh(new THREE.SphereGeometry(size, 12, 9), cloudMaterial);
    puff.position.set((part - (count - 1) / 2) * 2.25, (part % 2) * 0.45, Math.sin(part * 2 + i) * 0.5);
    puff.scale.set(1.35, 0.62 + (part % 2) * 0.08, 0.76);
    cloud.add(puff);
  }
  cloud.position.set(-90 + i * 30, 33 + (i % 3) * 5, -92 + (i % 4) * 42);
  cloud.userData.speed = 0.22 + (i % 4) * 0.06;
  clouds.push(cloud);
  scene.add(cloud);
}

// A winding sandy trail, lifted just enough to sit cleanly on the terrain.
const trailPoints = PATH_POINTS_XZ.map(([x, z]) => new THREE.Vector3(x, terrainHeight(x, z) + 0.075, z));
const trailCurve = new THREE.CatmullRomCurve3(trailPoints, false, 'centripetal');
const trail = new THREE.Mesh(
  new THREE.TubeGeometry(trailCurve, 150, 0.82, 8, false),
  new THREE.MeshStandardMaterial({ color: 0xd5c493, roughness: 0.95 }),
);
trail.receiveShadow = true;
scene.add(trail);

// Small handmade stepping stones set into the trail.
const stoneGeometry = new THREE.CylinderGeometry(0.42, 0.48, 0.13, 7, 1);
const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0xc2b78f, roughness: 1, flatShading: true });
for (let i = 0; i < 19; i += 1) {
  const t = 0.06 + i * 0.047;
  const point = trailCurve.getPoint(t);
  const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
  stone.position.set(point.x + Math.sin(i * 2.8) * 0.66, point.y + 0.06, point.z);
  stone.rotation.y = i * 0.8;
  stone.scale.set(0.8 + (i % 3) * 0.13, 1, 0.82 + (i % 2) * 0.16);
  stone.receiveShadow = true;
  scene.add(stone);
}

// Beacon plaza and its softly animated portal.
const beacon = new THREE.Group();
beacon.position.set(0, terrainHeight(0, -27), -27);
scene.add(beacon);
const plaza = new THREE.Mesh(
  new THREE.CylinderGeometry(5.1, 5.45, 0.34, 40),
  new THREE.MeshStandardMaterial({ color: 0xb9b38f, roughness: 0.87, flatShading: true }),
);
plaza.position.y = 0.19;
plaza.receiveShadow = true;
beacon.add(plaza);
const plazaTop = new THREE.Mesh(
  new THREE.CylinderGeometry(4.85, 5.12, 0.18, 40),
  new THREE.MeshStandardMaterial({ color: 0xe2d5a8, roughness: 0.75 }),
);
plazaTop.position.y = 0.43;
plazaTop.receiveShadow = true;
beacon.add(plazaTop);
const floorRing = new THREE.Mesh(
  new THREE.TorusGeometry(4.52, 0.075, 8, 80),
  new THREE.MeshStandardMaterial({ color: 0xc89b57, metalness: 0.45, roughness: 0.38, emissive: 0x5b3920, emissiveIntensity: 0.12 }),
);
floorRing.rotation.x = Math.PI / 2;
floorRing.position.y = 0.55;
beacon.add(floorRing);

const portalGlow = new THREE.Mesh(
  new THREE.CircleGeometry(2.1, 48),
  new THREE.MeshBasicMaterial({ color: 0x68cabc, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
);
portalGlow.position.set(0, 3.77, -0.04);
beacon.add(portalGlow);
const portalInner = new THREE.Mesh(
  new THREE.CircleGeometry(1.78, 40),
  new THREE.MeshBasicMaterial({ color: 0x9de3cf, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false }),
);
portalInner.position.set(0, 3.77, -0.055);
beacon.add(portalInner);
const portalRingMaterial = new THREE.MeshStandardMaterial({
  color: 0x78c9ad,
  metalness: 0.32,
  roughness: 0.3,
  emissive: 0x2e8e7a,
  emissiveIntensity: 0.7,
});
const portalRing = new THREE.Mesh(new THREE.TorusGeometry(2.34, 0.17, 12, 64), portalRingMaterial);
portalRing.position.set(0, 3.77, 0);
beacon.add(portalRing);
const portalGoldTrim = new THREE.Mesh(
  new THREE.TorusGeometry(2.58, 0.045, 8, 64),
  new THREE.MeshStandardMaterial({ color: 0xe3c078, metalness: 0.55, roughness: 0.34, emissive: 0x684520, emissiveIntensity: 0.18 }),
);
portalGoldTrim.position.set(0, 3.77, 0.025);
beacon.add(portalGoldTrim);
for (const side of [-1, 1]) {
  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.31, 3.46, 8),
    new THREE.MeshStandardMaterial({ color: 0xc3b58a, roughness: 0.8, flatShading: true }),
  );
  pillar.position.set(side * 2.4, 1.94, 0);
  pillar.castShadow = true;
  pillar.receiveShadow = true;
  beacon.add(pillar);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.28, 9, 7), portalRingMaterial);
  cap.position.set(side * 2.4, 3.72, 0);
  beacon.add(cap);
}
const beaconLight = new THREE.PointLight(0x7ce5c2, 4.2, 18, 2);
beaconLight.position.set(0, 3.7, 0.6);
beacon.add(beaconLight);

// Deterministic layout keeps every visit feeling like the same little island.
let randomState = 0x51a7c3;
function random() {
  randomState = (randomState * 1664525 + 1013904223) >>> 0;
  return randomState / 4294967296;
}

const treeLocations = [];
const treeWood = new THREE.MeshStandardMaterial({ color: 0x805940, roughness: 1, flatShading: true });
const pineMats = [
  new THREE.MeshStandardMaterial({ color: 0x34785f, roughness: 1, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: 0x438763, roughness: 1, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: 0x5a9566, roughness: 1, flatShading: true }),
];
const broadleafMats = [
  new THREE.MeshStandardMaterial({ color: 0x4b8d65, roughness: 1, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: 0x70a666, roughness: 1, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: 0x3b785e, roughness: 1, flatShading: true }),
];
const trunkGeometry = new THREE.CylinderGeometry(0.19, 0.31, 2.25, 7, 1);
const pineLowGeometry = new THREE.ConeGeometry(1.28, 2.55, 7, 1);
const pineHighGeometry = new THREE.ConeGeometry(0.96, 2.05, 7, 1);
const canopyGeometry = new THREE.IcosahedronGeometry(1.12, 0);
const canopySmallGeometry = new THREE.IcosahedronGeometry(0.84, 0);

function createTree(x, z, scale, type) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(trunkGeometry, treeWood);
  trunk.position.y = 1.11;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  if (type === 0) {
    const lower = new THREE.Mesh(pineLowGeometry, pineMats[Math.floor(random() * pineMats.length)]);
    lower.position.y = 2.35;
    lower.castShadow = true;
    group.add(lower);
    const upper = new THREE.Mesh(pineHighGeometry, pineMats[Math.floor(random() * pineMats.length)]);
    upper.position.y = 3.68;
    upper.castShadow = true;
    group.add(upper);
  } else {
    const center = new THREE.Mesh(canopyGeometry, broadleafMats[Math.floor(random() * broadleafMats.length)]);
    center.position.y = 2.88;
    center.scale.set(1.05, 1.12, 0.96);
    center.castShadow = true;
    group.add(center);
    for (let i = 0; i < 3; i += 1) {
      const puff = new THREE.Mesh(canopySmallGeometry, broadleafMats[Math.floor(random() * broadleafMats.length)]);
      const angle = (i / 3) * Math.PI * 2 + 0.5;
      puff.position.set(Math.cos(angle) * 0.73, 2.45 + (i % 2) * 0.52, Math.sin(angle) * 0.62);
      puff.scale.set(0.76, 0.8, 0.75);
      puff.castShadow = true;
      group.add(puff);
    }
  }
  group.position.set(x, terrainHeight(x, z) - 0.02, z);
  group.scale.setScalar(scale);
  group.rotation.y = random() * Math.PI * 2;
  scene.add(group);
  treeLocations.push({ x, z });
}

let treeAttempts = 0;
while (treeLocations.length < 38 && treeAttempts < 1000) {
  treeAttempts += 1;
  const angle = random() * Math.PI * 2;
  const radius = 17 + Math.sqrt(random()) * 45;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  if (Math.hypot(x, z) > 63 || isReservedSpot(x, z)) continue;
  createTree(x, z, 0.78 + random() * 0.53, Math.floor(random() * 2));
}

// Weathered rocks are scattered around clearings and the island's slope.
const rockGeometry = new THREE.DodecahedronGeometry(0.75, 0);
const rockMaterials = [
  new THREE.MeshStandardMaterial({ color: 0x879487, roughness: 1, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: 0xa59d7e, roughness: 1, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: 0x74847b, roughness: 1, flatShading: true }),
];
for (let i = 0; i < 30; i += 1) {
  const angle = random() * Math.PI * 2;
  const radius = 14 + random() * 51;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  if (radius > 65 || isReservedSpot(x, z, 1.3)) continue;
  const rock = new THREE.Mesh(rockGeometry, rockMaterials[Math.floor(random() * rockMaterials.length)]);
  rock.position.set(x, terrainHeight(x, z) + 0.22, z);
  rock.scale.set(0.7 + random() * 0.9, 0.42 + random() * 0.5, 0.55 + random() * 0.8);
  rock.rotation.set(random() * 0.2, random() * Math.PI, random() * 0.2);
  rock.castShadow = true;
  rock.receiveShadow = true;
  scene.add(rock);
}

// Tiny wildflowers use instancing so the open meadows stay light to render.
const flowerHeadGeometry = new THREE.SphereGeometry(0.11, 7, 5);
const flowerStemGeometry = new THREE.CylinderGeometry(0.018, 0.025, 0.22, 4);
const flowerHeads = new THREE.InstancedMesh(flowerHeadGeometry, new THREE.MeshStandardMaterial({ roughness: 0.72 }), 170);
const flowerStems = new THREE.InstancedMesh(flowerStemGeometry, new THREE.MeshStandardMaterial({ color: 0x4f8b5e, roughness: 1 }), 170);
flowerHeads.castShadow = false;
flowerHeads.receiveShadow = false;
flowerStems.castShadow = false;
const dummy = new THREE.Object3D();
const flowerColors = [0xf3d28a, 0xfff2d1, 0xe9a7a0, 0xdac2e7];
let flowerCount = 0;
for (let i = 0; i < 170; i += 1) {
  const angle = random() * Math.PI * 2;
  const radius = 8 + Math.sqrt(random()) * 57;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  if (radius > 66 || distanceToPath(x, z) < 2.2 || isReservedSpot(x, z, -2)) continue;
  const ground = terrainHeight(x, z);
  dummy.position.set(x, ground + 0.28, z);
  dummy.scale.setScalar(0.75 + random() * 0.6);
  dummy.rotation.set(0, random() * Math.PI, 0);
  dummy.updateMatrix();
  flowerHeads.setMatrixAt(flowerCount, dummy.matrix);
  flowerHeads.setColorAt(flowerCount, new THREE.Color(flowerColors[Math.floor(random() * flowerColors.length)]));
  dummy.position.y = ground + 0.13;
  dummy.scale.set(1, 0.8 + random() * 0.5, 1);
  dummy.updateMatrix();
  flowerStems.setMatrixAt(flowerCount, dummy.matrix);
  flowerCount += 1;
}
flowerHeads.count = flowerCount;
flowerStems.count = flowerCount;
flowerHeads.instanceMatrix.needsUpdate = true;
flowerStems.instanceMatrix.needsUpdate = true;
if (flowerHeads.instanceColor) flowerHeads.instanceColor.needsUpdate = true;
scene.add(flowerStems, flowerHeads);

// Collectible seed-lights.
const seeds = [];
const seedMaterial = new THREE.MeshStandardMaterial({ color: 0xffd987, roughness: 0.22, metalness: 0.18, emissive: 0xe6a64d, emissiveIntensity: 1.8 });
const seedRingMaterial = new THREE.MeshStandardMaterial({ color: 0xffdf94, roughness: 0.24, metalness: 0.45, emissive: 0xf7ba5b, emissiveIntensity: 1.15 });
for (let i = 0; i < SEED_POSITIONS.length; i += 1) {
  const position = SEED_POSITIONS[i];
  const seedGroup = new THREE.Group();
  seedGroup.position.set(position.x, terrainHeight(position.x, position.y), position.y);
  const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.31, 1), seedMaterial);
  orb.position.y = 1.16;
  orb.scale.set(0.8, 1.1, 0.8);
  orb.castShadow = true;
  seedGroup.add(orb);
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.035, 7, 32), seedRingMaterial);
  hoop.rotation.x = Math.PI / 2;
  hoop.position.y = 1.13;
  seedGroup.add(hoop);
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.018, 5, 32),
    new THREE.MeshBasicMaterial({ color: 0xffe9b1, transparent: true, opacity: 0.55 }),
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 1.12;
  seedGroup.add(halo);
  const light = new THREE.PointLight(0xffd174, 1.4, 5, 2);
  light.position.y = 1.2;
  seedGroup.add(light);
  scene.add(seedGroup);
  seeds.push({ group: seedGroup, orb, hoop, halo, x: position.x, z: position.y, phase: random() * Math.PI * 2, collected: false });
}

// A few slow sparks circle the beacon like fireflies.
const motes = [];
const moteGeometry = new THREE.SphereGeometry(0.055, 7, 5);
const moteMaterial = new THREE.MeshBasicMaterial({ color: 0xc8f3bb, transparent: true, opacity: 0.82, depthWrite: false });
for (let i = 0; i < 19; i += 1) {
  const mote = new THREE.Mesh(moteGeometry, moteMaterial);
  mote.userData = { phase: random() * Math.PI * 2, radius: 3.1 + random() * 2.3, speed: 0.25 + random() * 0.45, height: 1.1 + random() * 4.7 };
  motes.push(mote);
  beacon.add(mote);
}

// A more natural, softly shaded wanderer with human proportions, layered clothes,
// facial features, articulated limbs, and a stitched travel pack.
const player = new THREE.Group();
const avatarModel = new THREE.Group();
player.add(avatarModel);
scene.add(player);

const shirtMaterial = new THREE.MeshStandardMaterial({ color: 0x4c745f, roughness: 0.92 });
const shirtLightMaterial = new THREE.MeshStandardMaterial({ color: 0x688b71, roughness: 0.9 });
const shirtShadowMaterial = new THREE.MeshStandardMaterial({ color: 0x385b4b, roughness: 0.94 });
const pantsMaterial = new THREE.MeshStandardMaterial({ color: 0xb7ad95, roughness: 0.96 });
const pantsShadeMaterial = new THREE.MeshStandardMaterial({ color: 0x918a78, roughness: 0.97 });
const shoeMaterial = new THREE.MeshStandardMaterial({ color: 0xd7c6a5, roughness: 0.84 });
const soleMaterial = new THREE.MeshStandardMaterial({ color: 0x625d50, roughness: 0.98 });
const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xc48662, roughness: 0.88 });
const skinLightMaterial = new THREE.MeshStandardMaterial({ color: 0xd29a75, roughness: 0.9 });
const hairMaterial = new THREE.MeshStandardMaterial({ color: 0x382e2b, roughness: 0.98 });
const hairHighlightMaterial = new THREE.MeshStandardMaterial({ color: 0x554037, roughness: 0.98 });
const backpackMaterial = new THREE.MeshStandardMaterial({ color: 0x9a6848, roughness: 0.96 });
const backpackTrimMaterial = new THREE.MeshStandardMaterial({ color: 0xc29463, roughness: 0.9 });
const eyeWhiteMaterial = new THREE.MeshStandardMaterial({ color: 0xf0e9d9, roughness: 0.58 });
const irisMaterial = new THREE.MeshStandardMaterial({ color: 0x53786d, roughness: 0.46 });
const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x202c29, roughness: 0.42 });
const faceLineMaterial = new THREE.MeshStandardMaterial({ color: 0x68443a, roughness: 0.86 });
const eyeGlintMaterial = new THREE.MeshBasicMaterial({ color: 0xfff8e9 });

function avatarMesh(geometry, material, x, y, z, parent = avatarModel) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function avatarTube(points, radius, material, parent = avatarModel, tubularSegments = 16) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, tubularSegments, radius, 6, false), material);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

// Backpack: a padded silhouette, separate outer pocket, flap, buckles, and curved seams.
const backpack = new THREE.Group();
avatarModel.add(backpack);
const packBody = avatarMesh(new THREE.SphereGeometry(1, 18, 14), backpackMaterial, 0, 1.26, 0.315, backpack);
packBody.scale.set(0.225, 0.285, 0.155);
const packTop = avatarMesh(new THREE.SphereGeometry(1, 16, 12), backpackMaterial, 0, 1.46, 0.32, backpack);
packTop.scale.set(0.19, 0.105, 0.145);
const packPocket = avatarMesh(new THREE.SphereGeometry(1, 16, 12), backpackMaterial, 0, 1.095, 0.448, backpack);
packPocket.scale.set(0.158, 0.12, 0.052);
const packFlap = avatarMesh(new THREE.BoxGeometry(0.29, 0.07, 0.035), backpackTrimMaterial, 0, 1.2, 0.493, backpack);
packFlap.rotation.x = -0.08;
for (const side of [-1, 1]) {
  const buckle = avatarMesh(new THREE.BoxGeometry(0.035, 0.052, 0.016), soleMaterial, side * 0.09, 1.19, 0.514, backpack);
  buckle.rotation.z = side * -0.13;
}
avatarTube([[-0.13, 1.02, 0.477], [-0.14, 1.105, 0.496], [0, 1.12, 0.503], [0.14, 1.105, 0.496], [0.13, 1.02, 0.477]], 0.006, backpackTrimMaterial, backpack, 20);

// Narrow padded shoulder straps sit between the jacket and pack.
for (const side of [-1, 1]) {
  const strap = avatarMesh(new THREE.BoxGeometry(0.062, 0.38, 0.035), backpackMaterial, side * 0.205, 1.38, 0.225);
  strap.rotation.z = side * -0.12;
  const strapStitch = avatarTube(
    [[side * 0.205, 1.55, 0.247], [side * 0.205, 1.39, 0.247], [side * 0.205, 1.22, 0.245]],
    0.0035,
    backpackTrimMaterial,
  );
  strapStitch.castShadow = false;
}

// A tailored jacket uses a shaped lathe profile instead of a straight cylinder.
const jacketProfile = [
  new THREE.Vector2(0, -0.33),
  new THREE.Vector2(0.155, -0.33),
  new THREE.Vector2(0.195, -0.29),
  new THREE.Vector2(0.205, -0.18),
  new THREE.Vector2(0.235, -0.045),
  new THREE.Vector2(0.255, 0.09),
  new THREE.Vector2(0.295, 0.22),
  new THREE.Vector2(0.282, 0.28),
  new THREE.Vector2(0.22, 0.32),
  new THREE.Vector2(0, 0.32),
];
const jacketGeometry = new THREE.LatheGeometry(jacketProfile, 24);
jacketGeometry.computeVertexNormals();
const torsoMesh = avatarMesh(jacketGeometry, shirtMaterial, 0, 1.23, 0);

// Soft collar and a glimpse of the shirt underneath.
avatarMesh(new THREE.CylinderGeometry(0.105, 0.12, 0.17, 16), skinMaterial, 0, 1.565, 0);
const shirtNeck = avatarMesh(new THREE.CylinderGeometry(0.105, 0.12, 0.075, 16), shirtLightMaterial, 0, 1.505, 0);
shirtNeck.material = shirtLightMaterial;
const collar = avatarMesh(new THREE.TorusGeometry(0.115, 0.026, 8, 24), shirtLightMaterial, 0, 1.535, 0);
collar.rotation.x = Math.PI / 2;

// Front zip, pocket flaps, and fine seams give the jacket readable construction.
const zipperMaterial = new THREE.MeshStandardMaterial({ color: 0xd7c8a4, metalness: 0.18, roughness: 0.72 });
avatarTube([[0, 1.49, -0.27], [0, 1.37, -0.285], [0, 1.2, -0.24], [0, 1.04, -0.207]], 0.007, zipperMaterial, avatarModel, 22);
avatarMesh(new THREE.SphereGeometry(0.018, 8, 6), zipperMaterial, 0.012, 1.405, -0.292);
for (const side of [-1, 1]) {
  const pocket = avatarMesh(new THREE.BoxGeometry(0.105, 0.09, 0.024), shirtShadowMaterial, side * 0.145, 1.145, -0.208);
  pocket.rotation.z = side * -0.04;
  avatarMesh(new THREE.BoxGeometry(0.115, 0.027, 0.03), shirtLightMaterial, side * 0.145, 1.194, -0.221);
  avatarTube(
    [[side * 0.11, 1.45, -0.235], [side * 0.19, 1.48, -0.19], [side * 0.265, 1.43, -0.12]],
    0.006,
    shirtLightMaterial,
  );
}
avatarTube([[-0.17, 0.96, -0.19], [0, 0.95, -0.205], [0.17, 0.96, -0.19]], 0.005, shirtLightMaterial);

// The face is built as a small head assembly so it can glance and nod independently.
const headGroup = new THREE.Group();
headGroup.position.y = 1.655;
avatarModel.add(headGroup);
const headShape = avatarMesh(new THREE.SphereGeometry(1, 22, 16), skinMaterial, 0, 0.075, 0, headGroup);
headShape.scale.set(0.15, 0.185, 0.142);
const jawShape = avatarMesh(new THREE.SphereGeometry(1, 18, 13), skinMaterial, 0, -0.045, -0.003, headGroup);
jawShape.scale.set(0.12, 0.095, 0.12);

// Ears, with a softer inner fold.
for (const side of [-1, 1]) {
  const ear = avatarMesh(new THREE.SphereGeometry(0.043, 12, 9), skinMaterial, side * 0.147, 0.055, 0, headGroup);
  ear.scale.set(0.66, 1.04, 0.73);
  const innerEar = avatarMesh(new THREE.SphereGeometry(0.022, 9, 7), skinLightMaterial, side * 0.157, 0.055, -0.009, headGroup);
  innerEar.scale.set(0.55, 0.8, 0.5);
}

// Individual eye groups make blinking possible; iris and catchlight remain visible at a distance.
const eyeGroups = [];
for (const side of [-1, 1]) {
  const eyeGroup = new THREE.Group();
  eyeGroup.position.set(side * 0.057, 0.096, -0.116);
  headGroup.add(eyeGroup);
  const sclera = avatarMesh(new THREE.SphereGeometry(0.027, 14, 10), eyeWhiteMaterial, 0, 0, 0, eyeGroup);
  sclera.scale.set(0.92, 0.82, 0.58);
  const iris = avatarMesh(new THREE.SphereGeometry(0.016, 12, 9), irisMaterial, 0, -0.001, -0.014, eyeGroup);
  iris.scale.set(0.83, 0.95, 0.62);
  const pupil = avatarMesh(new THREE.SphereGeometry(0.0085, 10, 8), pupilMaterial, 0, -0.001, -0.024, eyeGroup);
  pupil.scale.z = 0.62;
  avatarMesh(new THREE.SphereGeometry(0.0045, 8, 6), eyeGlintMaterial, -0.004, 0.006, -0.03, eyeGroup);
  eyeGroups.push(eyeGroup);
  avatarTube(
    [[side * 0.103, 0.143, -0.111], [side * 0.073, 0.16, -0.13], [side * 0.036, 0.15, -0.137]],
    0.006,
    hairMaterial,
    headGroup,
    8,
  );
}
const noseBridge = avatarMesh(new THREE.SphereGeometry(0.025, 12, 9), skinLightMaterial, 0, 0.043, -0.139, headGroup);
noseBridge.scale.set(0.52, 1.18, 0.72);
avatarMesh(new THREE.SphereGeometry(0.022, 10, 8), skinMaterial, 0, 0.014, -0.16, headGroup).scale.set(0.78, 0.64, 0.74);
avatarTube([[-0.027, -0.047, -0.125], [0, -0.053, -0.143], [0.027, -0.047, -0.125]], 0.0045, faceLineMaterial, headGroup, 10);

// Natural hairline, crown, and a few separated locks rather than one oversized sphere.
const hairBack = avatarMesh(new THREE.SphereGeometry(1, 20, 14), hairMaterial, 0, 0.164, 0.026, headGroup);
hairBack.scale.set(0.16, 0.105, 0.15);
const hairCrown = avatarMesh(new THREE.SphereGeometry(1, 20, 14), hairMaterial, 0, 0.208, 0.005, headGroup);
hairCrown.scale.set(0.156, 0.091, 0.15);
const fringe = avatarMesh(new THREE.SphereGeometry(1, 16, 12), hairMaterial, 0.005, 0.15, -0.102, headGroup);
fringe.scale.set(0.112, 0.052, 0.057);
for (const side of [-1, 1]) {
  const lock = avatarMesh(new THREE.SphereGeometry(1, 12, 9), hairMaterial, side * 0.126, 0.09, 0.012, headGroup);
  lock.scale.set(0.042, 0.095, 0.075);
  const curl = avatarMesh(new THREE.SphereGeometry(1, 12, 9), hairHighlightMaterial, side * 0.064, 0.267, 0.018, headGroup);
  curl.scale.set(0.046, 0.034, 0.045);
}

// Belt and shaped trousers establish the waist before the articulated legs begin.
const pelvis = avatarMesh(new THREE.SphereGeometry(1, 18, 12), pantsMaterial, 0, 0.965, 0);
pelvis.scale.set(0.235, 0.145, 0.165);
const belt = avatarMesh(new THREE.TorusGeometry(0.205, 0.018, 7, 24), pantsShadeMaterial, 0, 1.015, 0);
belt.rotation.x = Math.PI / 2;
const beltBuckle = avatarMesh(new THREE.BoxGeometry(0.052, 0.052, 0.018), backpackTrimMaterial, 0, 1.015, -0.203);

// Articulated arms: sleeve, elbow, forearm, cuff, palm, thumb, and separate fingers.
const armPivots = [];
const elbowPivots = [];
for (const side of [-1, 1]) {
  const shoulder = new THREE.Group();
  shoulder.position.set(side * 0.31, 1.415, 0);
  avatarModel.add(shoulder);
  const shoulderCap = avatarMesh(new THREE.SphereGeometry(0.102, 14, 11), shirtMaterial, 0, -0.025, 0, shoulder);
  shoulderCap.scale.set(0.9, 0.92, 0.88);
  const upperSleeve = avatarMesh(new THREE.CylinderGeometry(0.088, 0.074, 0.32, 14, 2), shirtMaterial, 0, -0.16, 0, shoulder);
  upperSleeve.rotation.z = side * -0.035;
  const elbow = new THREE.Group();
  elbow.position.y = -0.315;
  shoulder.add(elbow);
  avatarMesh(new THREE.SphereGeometry(0.073, 12, 9), shirtLightMaterial, 0, 0, 0, elbow);
  const forearm = avatarMesh(new THREE.CylinderGeometry(0.073, 0.058, 0.28, 14, 2), shirtLightMaterial, 0, -0.14, 0, elbow);
  forearm.rotation.z = side * 0.025;
  avatarMesh(new THREE.CylinderGeometry(0.062, 0.06, 0.055, 12), shirtShadowMaterial, 0, -0.275, 0, elbow);
  const palm = avatarMesh(new THREE.SphereGeometry(1, 14, 10), skinMaterial, 0, -0.34, -0.006, elbow);
  palm.scale.set(0.057, 0.075, 0.039);
  avatarMesh(new THREE.SphereGeometry(0.027, 10, 8), skinLightMaterial, side * 0.054, -0.333, -0.02, elbow).scale.set(0.7, 1.1, 0.8);
  for (let finger = 0; finger < 4; finger += 1) {
    const fingerX = (finger - 1.5) * 0.025;
    const length = finger === 1 || finger === 2 ? 0.046 : 0.039;
    const digit = avatarMesh(new THREE.SphereGeometry(1, 9, 7), skinMaterial, fingerX, -0.393, -0.008, elbow);
    digit.scale.set(0.012, length, 0.014);
  }
  armPivots.push(shoulder);
  elbowPivots.push(elbow);
}

// Articulated legs include separate knees, calves, cuffs, and built-up trail shoes.
const legPivots = [];
const kneePivots = [];
for (const side of [-1, 1]) {
  const hip = new THREE.Group();
  hip.position.set(side * 0.117, 0.94, 0);
  avatarModel.add(hip);
  const thigh = avatarMesh(new THREE.CylinderGeometry(0.113, 0.096, 0.42, 14, 2), pantsMaterial, 0, -0.21, 0, hip);
  thigh.rotation.z = side * -0.018;
  const knee = avatarMesh(new THREE.SphereGeometry(0.094, 13, 10), pantsMaterial, 0, -0.414, -0.004, hip);
  knee.scale.set(0.96, 0.88, 0.93);
  const lowerLeg = new THREE.Group();
  lowerLeg.position.y = -0.414;
  hip.add(lowerLeg);
  const calf = avatarMesh(new THREE.CylinderGeometry(0.083, 0.065, 0.405, 14, 2), pantsMaterial, 0, -0.197, 0.005, lowerLeg);
  calf.rotation.z = side * 0.01;
  avatarMesh(new THREE.CylinderGeometry(0.068, 0.067, 0.065, 12), pantsShadeMaterial, 0, -0.39, 0.005, lowerLeg);

  const sole = avatarMesh(new THREE.SphereGeometry(1, 16, 11), soleMaterial, 0, -0.546, -0.052, lowerLeg);
  sole.scale.set(0.105, 0.022, 0.177);
  const shoe = avatarMesh(new THREE.SphereGeometry(1, 16, 12), shoeMaterial, 0, -0.511, -0.065, lowerLeg);
  shoe.scale.set(0.099, 0.063, 0.16);
  const tongue = avatarMesh(new THREE.SphereGeometry(1, 12, 9), shirtLightMaterial, 0, -0.462, -0.105, lowerLeg);
  tongue.scale.set(0.035, 0.015, 0.064);
  for (let lace = 0; lace < 3; lace += 1) {
    const laceZ = -0.105 - lace * 0.027;
    avatarTube([[-0.026, -0.464, laceZ], [0, -0.459, laceZ - 0.006], [0.026, -0.464, laceZ]], 0.0035, zipperMaterial, lowerLeg, 6);
  }
  legPivots.push(hip);
  kneePivots.push(lowerLeg);
}

const playerShadow = new THREE.Mesh(
  new THREE.CircleGeometry(0.65, 24),
  new THREE.MeshBasicMaterial({ color: 0x315c4d, transparent: true, opacity: 0.24, depthWrite: false }),
);
playerShadow.rotation.x = -Math.PI / 2;
playerShadow.position.y = 0.035;
player.add(playerShadow);

const startPosition = new THREE.Vector3(0, terrainHeight(0, 12), 12);
player.position.copy(startPosition);
// Let the player greet the camera at the trailhead, then turn naturally when movement begins.
player.rotation.y = Math.PI - 0.28;

let cameraYaw = 0;
let pointerDragging = false;
let previousPointerX = 0;
let jumpHeight = 0;
let jumpVelocity = 0;
let jumpRequested = false;
let seedCount = 0;
let toastTimer = 0;
let worldMinutes = 9 * 60 + 42;
let lastClockMinute = -1;
const velocity = new THREE.Vector3();
const pressedKeys = new Set();
const joystickInput = { x: 0, y: 0 };
let elapsedWorldTime = 0;

const keyToMove = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift']);
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (keyToMove.has(key)) event.preventDefault();
  pressedKeys.add(key);
  if (key === ' ' && !event.repeat) jumpRequested = true;
});
window.addEventListener('keyup', (event) => pressedKeys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => pressedKeys.clear());

canvas.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  pointerDragging = true;
  previousPointerX = event.clientX;
  canvas.setPointerCapture?.(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!pointerDragging) return;
  const delta = event.clientX - previousPointerX;
  previousPointerX = event.clientX;
  cameraYaw -= delta * 0.0065;
});
function releasePointer() {
  pointerDragging = false;
}
canvas.addEventListener('pointerup', releasePointer);
canvas.addEventListener('pointercancel', releasePointer);
canvas.addEventListener('lostpointercapture', releasePointer);

const joystick = document.querySelector('#joystick');
const joystickStick = document.querySelector('#joystick-stick');
let joystickPointer = null;
function updateJoystick(event) {
  const bounds = joystick.getBoundingClientRect();
  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;
  const maxTravel = 31;
  const dx = event.clientX - centerX;
  const dy = event.clientY - centerY;
  const distance = Math.hypot(dx, dy);
  const scale = distance > maxTravel ? maxTravel / distance : 1;
  const x = dx * scale;
  const y = dy * scale;
  joystickInput.x = x / maxTravel;
  joystickInput.y = y / maxTravel;
  joystickStick.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
}
function resetJoystick() {
  joystickPointer = null;
  joystickInput.x = 0;
  joystickInput.y = 0;
  joystick.classList.remove('is-active');
  joystickStick.style.transform = 'translate(-50%, -50%)';
}
joystick.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  joystickPointer = event.pointerId;
  joystick.classList.add('is-active');
  joystick.setPointerCapture(event.pointerId);
  updateJoystick(event);
});
joystick.addEventListener('pointermove', (event) => {
  if (event.pointerId === joystickPointer) updateJoystick(event);
});
joystick.addEventListener('pointerup', (event) => {
  if (event.pointerId === joystickPointer) resetJoystick();
});
joystick.addEventListener('pointercancel', resetJoystick);
document.querySelector('#jump-button').addEventListener('pointerdown', (event) => {
  event.preventDefault();
  jumpRequested = true;
});

function showToast(message, duration = 2600) {
  toastMessage.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), duration);
}

document.querySelector('#explore-button').addEventListener('click', () => {
  introCard.classList.add('is-dismissed');
  showToast('You’re here. Take the path, or make your own.', 3200);
});
document.querySelector('#camera-reset').addEventListener('click', () => {
  cameraYaw = 0;
  showToast('Back to the island’s first view.', 1800);
});
document.querySelector('#fullscreen-button').addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) await app.requestFullscreen?.();
    else await document.exitFullscreen?.();
  } catch (error) {
    console.warn('Fullscreen is not available in this browser context.', error);
  }
});

const clockElement = document.querySelector('#world-time');
function updateClock() {
  const minute = Math.floor(worldMinutes + elapsedWorldTime / 18);
  if (minute === lastClockMinute) return;
  lastClockMinute = minute;
  const hours = Math.floor(minute / 60) % 12 || 12;
  const minutes = minute % 60;
  clockElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function updateLocationAndMap() {
  const x = player.position.x;
  const z = player.position.z;
  let location = 'Wildflower Path';
  if (Math.hypot(x, z + 27) < 10) location = 'Beacon Circle';
  else if (Math.hypot(x, z - 12) < 15) location = 'Meadow Rise';
  else if (x < -24) location = 'Fern Hollow';
  else if (x > 24) location = 'Sunward Coast';
  else if (z < -16) location = 'Glow Garden';

  const roundedX = Math.round(x);
  const roundedZ = Math.round(z);
  document.querySelector('#location-name').textContent = location;
  document.querySelector('#location-coordinates').textContent = `${roundedX}, ${roundedZ}`;
  document.querySelector('#map-location').textContent = location;
  document.querySelector('#map-coordinates').textContent = `X ${String(roundedX).padStart(2, '0')} · Z ${String(roundedZ).padStart(2, '0')}`;
  drawMap();
}

function drawMap() {
  const ctx = mapContext;
  const width = mapCanvas.width;
  const height = mapCanvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = width * 0.42;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#c4e0dc';
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
  ctx.fillStyle = '#b2d0c4';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#a9ce9e';
  ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

  // A few soft contour lines suggest the island's raised center.
  ctx.strokeStyle = 'rgba(80, 132, 94, .19)';
  ctx.lineWidth = 1;
  for (let ring = 0; ring < 4; ring += 1) {
    ctx.beginPath();
    ctx.ellipse(centerX - 6 + ring * 2, centerY + 3 - ring * 2, radius * (0.28 + ring * 0.13), radius * (0.23 + ring * 0.14), -0.34, 0, Math.PI * 2);
    ctx.stroke();
  }

  const mapX = (x) => centerX + (x / WORLD_RADIUS) * radius;
  const mapY = (z) => centerY + (z / WORLD_RADIUS) * radius;
  ctx.beginPath();
  PATH_POINTS_XZ.forEach(([x, z], index) => {
    if (index === 0) ctx.moveTo(mapX(x), mapY(z));
    else ctx.lineTo(mapX(x), mapY(z));
  });
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(255, 245, 211, .85)';
  ctx.lineWidth = 4;
  ctx.stroke();

  for (const tree of treeLocations) {
    ctx.beginPath();
    ctx.arc(mapX(tree.x), mapY(tree.z), 1.55, 0, Math.PI * 2);
    ctx.fillStyle = '#39775c';
    ctx.fill();
  }
  for (const seed of seeds) {
    if (seed.collected) continue;
    ctx.beginPath();
    ctx.arc(mapX(seed.x), mapY(seed.z), 3.1, 0, Math.PI * 2);
    ctx.fillStyle = '#f0b856';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // Beacon symbol.
  ctx.beginPath();
  ctx.arc(mapX(0), mapY(-27), 4.2, 0, Math.PI * 2);
  ctx.fillStyle = '#77b8a0';
  ctx.fill();
  ctx.strokeStyle = '#eff4d9';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const px = mapX(player.position.x);
  const py = mapY(player.position.z);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(-player.rotation.y);
  ctx.beginPath();
  ctx.moveTo(0, -6.3);
  ctx.lineTo(4.8, 4.3);
  ctx.lineTo(0, 2.5);
  ctx.lineTo(-4.8, 4.3);
  ctx.closePath();
  ctx.fillStyle = '#e98665';
  ctx.fill();
  ctx.strokeStyle = '#fff8e7';
  ctx.lineWidth = 1.25;
  ctx.stroke();
  ctx.restore();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,.85)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

const clock = new THREE.Clock();
let uiAccumulator = 0;
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  elapsedWorldTime += delta;
  updateClock();

  for (const cloud of clouds) {
    cloud.position.x += cloud.userData.speed * delta;
    if (cloud.position.x > 115) cloud.position.x = -115;
  }

  // Inputs are camera-relative, so forward always feels like forward after orbiting.
  let forwardInput = 0;
  let sideInput = 0;
  if (pressedKeys.has('w') || pressedKeys.has('arrowup')) forwardInput += 1;
  if (pressedKeys.has('s') || pressedKeys.has('arrowdown')) forwardInput -= 1;
  if (pressedKeys.has('d') || pressedKeys.has('arrowright')) sideInput += 1;
  if (pressedKeys.has('a') || pressedKeys.has('arrowleft')) sideInput -= 1;
  forwardInput -= joystickInput.y;
  sideInput += joystickInput.x;

  const inputMagnitude = Math.hypot(forwardInput, sideInput);
  if (inputMagnitude > 1) {
    forwardInput /= inputMagnitude;
    sideInput /= inputMagnitude;
  }
  const forward = new THREE.Vector3(Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
  const right = new THREE.Vector3(Math.cos(cameraYaw), 0, Math.sin(cameraYaw));
  const desiredDirection = forward.multiplyScalar(forwardInput).add(right.multiplyScalar(sideInput));
  const isMoving = inputMagnitude > 0.08;
  const isRunning = pressedKeys.has('shift');
  const speed = isRunning ? 9.0 : 5.1;
  const desiredVelocity = desiredDirection.multiplyScalar(speed);
  const response = 1 - Math.exp(-(isMoving ? 12 : 17) * delta);
  velocity.x += (desiredVelocity.x - velocity.x) * response;
  velocity.z += (desiredVelocity.z - velocity.z) * response;

  player.position.x += velocity.x * delta;
  player.position.z += velocity.z * delta;
  const planarDistance = Math.hypot(player.position.x, player.position.z);
  if (planarDistance > 70) {
    const correction = 70 / planarDistance;
    player.position.x *= correction;
    player.position.z *= correction;
    const outwardX = player.position.x / 70;
    const outwardZ = player.position.z / 70;
    const outwardVelocity = velocity.x * outwardX + velocity.z * outwardZ;
    if (outwardVelocity > 0) {
      velocity.x -= outwardX * outwardVelocity;
      velocity.z -= outwardZ * outwardVelocity;
    }
  }

  const ground = terrainHeight(player.position.x, player.position.z);
  if (jumpRequested && jumpHeight <= 0.001) {
    jumpVelocity = 6.3;
    jumpRequested = false;
  } else if (jumpHeight > 0) {
    jumpRequested = false;
  }
  if (jumpHeight > 0 || jumpVelocity > 0) {
    jumpHeight += jumpVelocity * delta;
    jumpVelocity -= 16.5 * delta;
    if (jumpHeight <= 0) {
      jumpHeight = 0;
      jumpVelocity = 0;
    }
  }
  player.position.y = ground + jumpHeight;

  if (isMoving) {
    const targetYaw = Math.atan2(-desiredDirection.x, -desiredDirection.z);
    const angleDelta = Math.atan2(Math.sin(targetYaw - player.rotation.y), Math.cos(targetYaw - player.rotation.y));
    player.rotation.y += angleDelta * (1 - Math.exp(-12 * delta));
  }

  const gait = isMoving ? Math.sin(elapsedWorldTime * (isRunning ? 13.2 : 9.4)) : 0;
  const idleSway = Math.sin(elapsedWorldTime * 1.35);
  legPivots[0].rotation.x = gait * (isMoving ? 0.43 : 0);
  legPivots[1].rotation.x = -gait * (isMoving ? 0.43 : 0);
  kneePivots[0].rotation.x = isMoving ? Math.max(0, -gait) * 0.3 : 0;
  kneePivots[1].rotation.x = isMoving ? Math.max(0, gait) * 0.3 : 0;
  armPivots[0].rotation.x = -gait * (isMoving ? 0.34 : 0) + idleSway * 0.018;
  armPivots[1].rotation.x = gait * (isMoving ? 0.34 : 0) - idleSway * 0.018;
  elbowPivots[0].rotation.x = -0.12 + Math.max(0, gait) * (isMoving ? 0.16 : 0);
  elbowPivots[1].rotation.x = -0.12 + Math.max(0, -gait) * (isMoving ? 0.16 : 0);
  headGroup.rotation.y = Math.sin(elapsedWorldTime * 0.52) * 0.035;
  headGroup.rotation.x = Math.sin(elapsedWorldTime * 0.83) * 0.014 + (isMoving ? -0.018 : 0);
  const blinkPhase = elapsedWorldTime % 4.6;
  const blink = blinkPhase < 0.18 ? Math.sin((blinkPhase / 0.18) * Math.PI) : 0;
  for (const eye of eyeGroups) eye.scale.y = 1 - blink * 0.86;
  torsoMesh.scale.y = 1 + Math.sin(elapsedWorldTime * 1.7) * 0.004;
  avatarModel.position.y = (isMoving ? Math.abs(gait) * 0.034 : Math.sin(elapsedWorldTime * 1.7) * 0.012) + jumpHeight * 0.035;
  backpack.rotation.z = isMoving ? gait * 0.013 : Math.sin(elapsedWorldTime * 1.2) * 0.008;
  backpack.rotation.x = isMoving ? Math.abs(gait) * 0.012 : -0.01;
  playerShadow.material.opacity = 0.24 - Math.min(jumpHeight * 0.025, 0.12);

  for (const seed of seeds) {
    if (seed.collected) continue;
    const float = Math.sin(elapsedWorldTime * 1.8 + seed.phase) * 0.16;
    seed.orb.position.y = 1.16 + float;
    seed.hoop.position.y = 1.13 + float;
    seed.halo.position.y = 1.12 + float;
    seed.halo.rotation.z = elapsedWorldTime * 0.32 + seed.phase;
    seed.orb.rotation.y += delta * 0.75;
    seed.group.rotation.y = Math.sin(elapsedWorldTime * 0.55 + seed.phase) * 0.12;
    if (Math.hypot(player.position.x - seed.x, player.position.z - seed.z) < 1.45) {
      seed.collected = true;
      seed.group.visible = false;
      seedCount += 1;
      document.querySelector('#seed-count').textContent = seedCount;
      document.querySelector('#seed-count-top').textContent = seedCount;
      document.querySelector('#progress-fill').style.width = `${(seedCount / seeds.length) * 100}%`;
      updateLocationAndMap();
      showToast(seedCount === seeds.length ? 'All three lights are home. Lovely work.' : 'You found a glow seed. The island is a little brighter.');
    }
  }

  for (const mote of motes) {
    const data = mote.userData;
    const angle = elapsedWorldTime * data.speed + data.phase;
    mote.position.set(Math.cos(angle) * data.radius, data.height + Math.sin(angle * 1.6) * 0.45, Math.sin(angle) * data.radius);
    mote.material.opacity = 0.55 + Math.sin(elapsedWorldTime * 3 + data.phase) * 0.35;
  }
  portalRing.rotation.z = Math.sin(elapsedWorldTime * 0.55) * 0.035;
  portalGlow.material.opacity = 0.17 + Math.sin(elapsedWorldTime * 1.25) * 0.045;
  beaconLight.intensity = 3.8 + Math.sin(elapsedWorldTime * 1.25) * 0.5;

  // Smooth third-person follow camera.
  const cameraDistance = 10.8;
  const desiredCameraPosition = new THREE.Vector3(
    player.position.x + Math.sin(cameraYaw) * cameraDistance,
    player.position.y + 6.2 + jumpHeight * 0.16,
    player.position.z + Math.cos(cameraYaw) * cameraDistance,
  );
  camera.position.lerp(desiredCameraPosition, 1 - Math.exp(-5.2 * delta));
  camera.lookAt(player.position.x, player.position.y + 1.24 + jumpHeight * 0.12, player.position.z);

  uiAccumulator += delta;
  if (uiAccumulator > 0.14) {
    updateLocationAndMap();
    uiAccumulator = 0;
  }

  renderer.render(scene, camera);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
  renderer.setSize(width, height, false);
}
window.addEventListener('resize', resize);

updateLocationAndMap();
updateClock();
requestAnimationFrame(() => loadingScreen.classList.add('is-ready'));
animate();
