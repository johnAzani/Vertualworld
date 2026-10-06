import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const ROAD_ROUTE_XZ = [
  [44, 8], [36, 8], [28, 8], [20, 8], [13, 8],
  [8, 5], [7, -2], [7, -10], [7, -18], [7, -25], [7, -29],
  [-4, -32], [-17, -34], [-30, -31], [-42, -24], [-50, -15],
  [-53, -5], [-54, 6], [-53.5, 18],
];

const RAIL_ROUTE_XZ = [
  [44, 8], [39, 0], [31, -10], [20, -19], [10, -26], [3, -29],
  [-8, -31], [-21, -29], [-34, -23], [-46, -14], [-54, -4],
  [-57, 7], [-57, 18], [-58, 30], [-49, 41], [-34, 46],
  [-16, 45], [3, 39], [22, 29], [37, 18],
];

const STATION_LAYOUT = [
  {
    id: 'meadow-court',
    name: 'Meadow Court',
    railPoint: [44, 8],
    platformSide: 1,
    accessPoint: [43, 8],
  },
  {
    id: 'beacon-circle',
    name: 'Beacon Circle',
    railPoint: [3, -29],
    platformSide: -1,
    accessPoint: [6, -27.5],
  },
  {
    id: 'meadow-park',
    name: 'Meadow Park',
    railPoint: [-57, 18],
    platformSide: 1,
    accessPoint: [-53.5, 18],
  },
];

const BUS_TERMINAL_LAYOUT = [
  { id: 'meadow-court-bus', name: 'Meadow Court', roadPoint: [44, 8], terminalPoint: [48, 0] },
  { id: 'beacon-circle-bus', name: 'Beacon Circle', roadPoint: [7, -29], terminalPoint: [12, -34] },
  { id: 'meadow-park-bus', name: 'Meadow Park', roadPoint: [-53.5, 18], terminalPoint: [-57, 27] },
];

const ROAD_HALF_WIDTH = 2.35;
const ROAD_SURFACE_OFFSET = 0.115;
const TRACK_HALF_WIDTH = 1.25;
const RAIL_GAUGE_HALF_WIDTH = 0.68;
const TRAIN_SPEED = 7.2;
const BUS_SPEED = 8.8;
const STATION_DWELL_SECONDS = 6.5;
const BUS_TERMINAL_DWELL_SECONDS = 7.5;
const TRAIN_LENGTH = 6.3;
const BUS_LENGTH = 5.7;
const TRAIN_WHEEL_RADIUS = 0.29;

function addBox(parent, width, height, depth, material, x, y, z, castShadow = true, receiveShadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  parent.add(mesh);
  return mesh;
}

function mergeStaticMeshes(parent, excludedMeshes = new Set()) {
  const batches = new Map();
  for (const mesh of parent.children) {
    if (!mesh.isMesh || excludedMeshes.has(mesh) || Array.isArray(mesh.material)) continue;
    const key = `${mesh.material.id}:${Number(mesh.castShadow)}:${Number(mesh.receiveShadow)}`;
    if (!batches.has(key)) {
      batches.set(key, {
        material: mesh.material,
        castShadow: mesh.castShadow,
        receiveShadow: mesh.receiveShadow,
        meshes: [],
      });
    }
    batches.get(key).meshes.push(mesh);
  }

  for (const batch of batches.values()) {
    if (batch.meshes.length < 2) continue;
    const geometries = [];
    let mergedGeometry;
    try {
      for (const mesh of batch.meshes) {
        mesh.updateMatrix();
        const geometry = mesh.geometry.clone();
        geometry.clearGroups();
        geometry.applyMatrix4(mesh.matrix);
        geometries.push(geometry);
      }
      mergedGeometry = mergeGeometries(geometries, false);
    } catch {
      for (const geometry of geometries) geometry.dispose();
      continue;
    }
    if (!mergedGeometry) {
      for (const geometry of geometries) geometry.dispose();
      continue;
    }

    mergedGeometry.computeBoundingSphere();
    const mergedMesh = new THREE.Mesh(mergedGeometry, batch.material);
    mergedMesh.castShadow = batch.castShadow;
    mergedMesh.receiveShadow = batch.receiveShadow;
    mergedMesh.name = 'Merged static transport geometry';
    for (const mesh of batch.meshes) {
      parent.remove(mesh);
      mesh.geometry.dispose();
    }
    parent.add(mergedMesh);
    for (const geometry of geometries) geometry.dispose();
  }
}

function createPlanarCurve(points, closed = false) {
  const vectors = points.map(([x, z]) => new THREE.Vector3(x, 0, z));
  return new THREE.CatmullRomCurve3(vectors, closed, 'centripetal');
}

function createRibbonGeometry(curve, terrainHeight, segments, halfWidth, heightOffset, lateralOffset = 0) {
  const positions = new Float32Array((segments + 1) * 2 * 3);
  const indices = [];
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();

  for (let segment = 0; segment <= segments; segment += 1) {
    const t = segment / segments;
    const center = curve.getPointAt(t);
    tangent.copy(curve.getTangentAt(t));
    tangent.y = 0;
    tangent.normalize();
    side.set(-tangent.z, 0, tangent.x).normalize();

    for (let edge = 0; edge < 2; edge += 1) {
      const edgeOffset = lateralOffset + (edge === 0 ? -halfWidth : halfWidth);
      const x = center.x + side.x * edgeOffset;
      const z = center.z + side.z * edgeOffset;
      const vertex = segment * 2 + edge;
      const positionOffset = vertex * 3;
      positions[positionOffset] = x;
      positions[positionOffset + 1] = terrainHeight(x, z) + heightOffset;
      positions[positionOffset + 2] = z;
    }

    if (segment < segments) {
      const first = segment * 2;
      indices.push(first, first + 1, first + 2, first + 1, first + 3, first + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createDashedLineGeometry(curve, terrainHeight, dashLength = 1.35, gapLength = 2.85, halfWidth = 0.055) {
  const length = curve.getLength();
  const positions = [];
  const indices = [];
  let vertex = 0;

  for (let distance = 1.1; distance < length - 0.7; distance += dashLength + gapLength) {
    const endDistance = Math.min(distance + dashLength, length - 0.25);
    const start = curve.getPointAt(distance / length);
    const end = curve.getPointAt(endDistance / length);
    const tangent = new THREE.Vector3(end.x - start.x, 0, end.z - start.z).normalize();
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    for (const point of [start, end]) {
      for (const edge of [-1, 1]) {
        const x = point.x + side.x * edge * halfWidth;
        const z = point.z + side.z * edge * halfWidth;
        positions.push(x, terrainHeight(x, z) + ROAD_SURFACE_OFFSET + 0.012, z);
      }
    }
    indices.push(vertex, vertex + 1, vertex + 2, vertex + 1, vertex + 3, vertex + 2);
    vertex += 4;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createSurfaceSegments(curve, terrainHeight, sampleCount, halfWidth, heightOffset) {
  const segments = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const first = curve.getPointAt(index / sampleCount);
    const second = curve.getPointAt((index + 1) / sampleCount);
    segments.push({
      ax: first.x,
      az: first.z,
      bx: second.x,
      bz: second.z,
      ay: terrainHeight(first.x, first.z) + heightOffset,
      by: terrainHeight(second.x, second.z) + heightOffset,
      halfWidth,
    });
  }
  return segments;
}

function distanceSquaredToSegment(x, z, segment) {
  const dx = segment.bx - segment.ax;
  const dz = segment.bz - segment.az;
  const lengthSquared = dx * dx + dz * dz;
  const t = lengthSquared === 0
    ? 0
    : THREE.MathUtils.clamp(((x - segment.ax) * dx + (z - segment.az) * dz) / lengthSquared, 0, 1);
  const nearestX = segment.ax + dx * t;
  const nearestZ = segment.az + dz * t;
  return {
    distanceSquared: (x - nearestX) ** 2 + (z - nearestZ) ** 2,
    height: THREE.MathUtils.lerp(segment.ay, segment.by, t),
  };
}

function createOffsetRailCurve(centerCurve, terrainHeight, lateralOffset, sampleCount = 420) {
  const points = [];
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();
  for (let index = 0; index < sampleCount; index += 1) {
    const center = centerCurve.getPointAt(index / sampleCount);
    tangent.copy(centerCurve.getTangentAt(index / sampleCount));
    tangent.y = 0;
    tangent.normalize();
    side.set(-tangent.z, 0, tangent.x).normalize();
    const x = center.x + side.x * lateralOffset;
    const z = center.z + side.z * lateralOffset;
    points.push(new THREE.Vector3(x, terrainHeight(x, z) + 0.265, z));
  }
  return new THREE.CatmullRomCurve3(points, true, 'centripetal');
}

function findCurveFraction(curve, x, z, samples = 800, wrapAtEnd = true) {
  let bestFraction = 0;
  let bestDistanceSquared = Infinity;
  for (let index = 0; index <= samples; index += 1) {
    const fraction = index / samples;
    const point = curve.getPointAt(fraction);
    const distanceSquared = (point.x - x) ** 2 + (point.z - z) ** 2;
    if (distanceSquared < bestDistanceSquared) {
      bestDistanceSquared = distanceSquared;
      bestFraction = fraction;
    }
  }
  return wrapAtEnd && bestFraction > 0.98 ? 0 : bestFraction;
}

function makeStationSignTexture(title, subtitle) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 160;
  const context = canvas.getContext('2d');
  context.fillStyle = '#173d35';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#d8bf7f';
  context.fillRect(0, 0, 16, canvas.height);
  context.fillRect(canvas.width - 16, 0, 16, canvas.height);
  context.strokeStyle = '#d8bf7f';
  context.lineWidth = 6;
  context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#fff4d8';
  context.font = '700 44px Arial, sans-serif';
  context.fillText(title.toUpperCase(), canvas.width / 2, 61);
  context.fillStyle = '#afcfb8';
  context.font = '700 20px Arial, sans-serif';
  context.fillText(subtitle, canvas.width / 2, 120);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}

function makeTrainSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 160;
  const context = canvas.getContext('2d');
  context.fillStyle = '#163c35';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#dfc887';
  context.fillRect(0, 0, 12, canvas.height);
  context.fillRect(canvas.width - 12, 0, 12, canvas.height);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#fff4d8';
  context.font = '700 46px Arial, sans-serif';
  context.fillText('ISLAND LINE', canvas.width / 2, 60);
  context.fillStyle = '#b7d2be';
  context.font = '700 19px Arial, sans-serif';
  context.fillText('ELECTRIC SHUTTLE', canvas.width / 2, 119);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}

function addTrain(scene) {
  const group = new THREE.Group();
  group.name = 'Island Line electric tram';
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x477662, roughness: 0.48, metalness: 0.12 });
  const lowerBodyMaterial = new THREE.MeshStandardMaterial({ color: 0x294c42, roughness: 0.66, metalness: 0.18 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xe8dfc8, roughness: 0.62, metalness: 0.04 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xd8bd79, roughness: 0.42, metalness: 0.28 });
  const windowMaterial = new THREE.MeshStandardMaterial({ color: 0x7fb5b5, emissive: 0x1b4141, emissiveIntensity: 0.18, roughness: 0.24, metalness: 0.08, side: THREE.DoubleSide });
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x26332f, roughness: 0.86, metalness: 0.08 });
  const headlightMaterial = new THREE.MeshStandardMaterial({ color: 0xffe2a4, emissive: 0xffc95d, emissiveIntensity: 0.3, roughness: 0.28 });
  const tailLightMaterial = new THREE.MeshStandardMaterial({ color: 0xe07c65, emissive: 0x8a3128, emissiveIntensity: 0.22, roughness: 0.34 });
  const addTrainBox = (width, height, depth, material, x, y, z) => addBox(group, width, height, depth, material, x, y, z);

  addTrainBox(1.64, 0.26, 5.25, lowerBodyMaterial, 0, 0.61, 0);
  addTrainBox(1.86, 1.2, TRAIN_LENGTH, bodyMaterial, 0, 1.32, 0);
  addTrainBox(1.9, 0.16, 6.48, roofMaterial, 0, 2.02, 0.02);
  addTrainBox(1.9, 0.09, 6.42, trimMaterial, 0, 0.91, 0);
  addTrainBox(1.72, 0.08, 6.0, lowerBodyMaterial, 0, 0.43, 0.02);

  for (const side of [-1, 1]) {
    addTrainBox(0.06, 0.11, 5.82, trimMaterial, side * 0.946, 0.94, 0);
    for (const z of [-1.95, -0.72, 0.72, 1.95]) {
      const window = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.48), windowMaterial);
      window.position.set(side * 0.941, 1.48, z);
      window.rotation.y = side * Math.PI / 2;
      window.castShadow = false;
      group.add(window);
    }
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.86), windowMaterial);
    door.position.set(side * 0.942, 1.34, 0);
    door.rotation.y = side * Math.PI / 2;
    group.add(door);

    const sideSign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.42, 0.42),
      new THREE.MeshBasicMaterial({ map: makeTrainSignTexture(), toneMapped: false, side: THREE.DoubleSide }),
    );
    sideSign.position.set(side * 0.952, 1.04, 0);
    sideSign.rotation.y = side * Math.PI / 2;
    group.add(sideSign);
  }

  const frontGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 0.49), windowMaterial);
  frontGlass.position.set(0, 1.53, -TRAIN_LENGTH / 2 - 0.012);
  frontGlass.rotation.y = Math.PI;
  group.add(frontGlass);
  addTrainBox(1.78, 0.13, 0.12, trimMaterial, 0, 0.94, -TRAIN_LENGTH / 2 - 0.04);
  addTrainBox(1.78, 0.13, 0.12, lowerBodyMaterial, 0, 0.86, TRAIN_LENGTH / 2 + 0.035);

  const wheelGeometry = new THREE.CylinderGeometry(TRAIN_WHEEL_RADIUS, TRAIN_WHEEL_RADIUS, 0.18, 14);
  wheelGeometry.rotateZ(Math.PI / 2);
  const wheels = [];
  for (const side of [-1, 1]) {
    for (const z of [-1.88, 1.88]) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(side * 0.78, 0.36, z);
      wheel.castShadow = true;
      group.add(wheel);
      wheels.push(wheel);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.195, 12), trimMaterial);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(side * 0.79, 0.36, z);
      group.add(hub);
    }
  }

  const headlights = [];
  for (const side of [-1, 1]) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.095, 9, 7), headlightMaterial);
    lamp.position.set(side * 0.56, 1.02, -TRAIN_LENGTH / 2 - 0.075);
    group.add(lamp);
    const light = new THREE.PointLight(0xffdf9a, 0, 12, 2);
    light.position.copy(lamp.position);
    group.add(light);
    headlights.push(light);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.12, 0.06), tailLightMaterial);
    tail.position.set(side * 0.62, 0.98, TRAIN_LENGTH / 2 + 0.045);
    group.add(tail);
  }
  mergeStaticMeshes(group, new Set(wheels));
  scene.add(group);
  return { group, wheels, headlightMaterial, tailLightMaterial, headlights };
}

function addStation(scene, station, terrainHeight) {
  const root = new THREE.Group();
  root.name = `${station.name} Rail Terminal`;
  root.position.set(station.x, terrainHeight(station.x, station.z) + 0.025, station.z);
  root.rotation.y = station.yaw;

  const platformMaterial = new THREE.MeshStandardMaterial({ color: 0xb8b29e, roughness: 0.92 });
  const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xe3bd66, roughness: 0.72, emissive: 0x453514, emissiveIntensity: 0.12 });
  const supportMaterial = new THREE.MeshStandardMaterial({ color: 0x50645a, roughness: 0.67, metalness: 0.2 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x3a6254, roughness: 0.76, metalness: 0.08 });
  const terminalWallMaterial = new THREE.MeshStandardMaterial({ color: 0xd5d0b9, roughness: 0.84 });
  const terminalTrimMaterial = new THREE.MeshStandardMaterial({ color: 0x6e8b73, roughness: 0.62, metalness: 0.08 });
  const terminalGlassMaterial = new THREE.MeshStandardMaterial({ color: 0x79aeb0, emissive: 0x183c3a, emissiveIntensity: 0.14, roughness: 0.24, metalness: 0.08, side: THREE.DoubleSide });
  const benchMaterial = new THREE.MeshStandardMaterial({ color: 0x587e69, roughness: 0.72 });
  const lampMaterial = new THREE.MeshStandardMaterial({ color: 0xffe6aa, emissive: 0xe8aa51, emissiveIntensity: 0.12, roughness: 0.28 });
  const stationCanvas = makeStationSignTexture(station.name, 'RAIL TERMINAL  ·  ISLAND LINE');
  const stationSignMaterial = new THREE.MeshBasicMaterial({ map: stationCanvas, toneMapped: false, side: THREE.DoubleSide });

  addBox(root, station.length, 0.34, station.width, platformMaterial, 0, 0.17, 0, false, true);
  addBox(root, station.length - 0.18, 0.035, 0.14, edgeMaterial, 0, 0.36, -station.platformSide * (station.width / 2 - 0.14), false, false);
  addBox(root, station.length, 0.08, station.width + 0.18, supportMaterial, 0, 0.025, 0, false, true);

  const shelterSide = station.platformSide;
  const shelterZ = shelterSide * 0.66;
  for (const x of [-2.35, 2.35]) {
    addBox(root, 0.1, 2.08, 0.1, supportMaterial, x, 1.38, shelterZ, true, false);
  }
  addBox(root, 5.05, 0.16, 1.42, roofMaterial, 0, 2.48, shelterZ, true, false);
  addBox(root, 4.84, 0.13, 0.08, edgeMaterial, 0, 2.37, shelterZ - shelterSide * 0.68, false, false);

  for (const x of [-1.15, 1.15]) {
    addBox(root, 1.55, 0.12, 0.44, benchMaterial, x, 0.55, shelterSide * 0.72, false, false);
    addBox(root, 1.55, 0.48, 0.1, benchMaterial, x, 0.83, shelterSide * 0.91, false, false);
  }

  addBox(root, 3.0, 0.54, 0.14, supportMaterial, 0, 3.04, shelterSide * 0.66, false, false);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.82, 0.4), stationSignMaterial);
  sign.position.set(0, 3.04, shelterSide * 0.742);
  sign.rotation.y = shelterSide > 0 ? Math.PI : 0;
  root.add(sign);

  const terminalCenterZ = station.platformSide * 3.78;
  addBox(root, 1.45, 0.14, 0.78, platformMaterial, 0, 0.26, station.platformSide * 1.48, false, true);
  addBox(root, 6.65, 0.2, 4.55, platformMaterial, 0, 0.25, terminalCenterZ, false, true);
  addBox(root, 6.1, 2.05, 4.0, terminalWallMaterial, 0, 1.35, terminalCenterZ, true, true);
  addBox(root, 6.38, 0.2, 4.3, roofMaterial, 0, 2.49, terminalCenterZ, true, false);
  addBox(root, 6.55, 0.075, 4.42, edgeMaterial, 0, 2.36, terminalCenterZ, false, false);
  for (const side of [-1, 1]) {
    const window = new THREE.Mesh(new THREE.PlaneGeometry(4.95, 0.82), terminalGlassMaterial);
    window.position.set(0, 1.53, terminalCenterZ + side * 2.015);
    window.rotation.y = side < 0 ? Math.PI : 0;
    window.castShadow = false;
    root.add(window);
  }
  const terminalFrontZ = terminalCenterZ - station.platformSide * 2.025;
  const entranceDoor = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 1.7), terminalGlassMaterial);
  entranceDoor.position.set(0, 1.18, terminalFrontZ);
  entranceDoor.rotation.y = station.platformSide > 0 ? Math.PI : 0;
  root.add(entranceDoor);
  addBox(root, 4.95, 0.72, 0.12, supportMaterial, 0, 2.05, terminalCenterZ - station.platformSide * 2.08, false, false);
  const terminalSign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.7, 0.58),
    new THREE.MeshBasicMaterial({ map: makeStationSignTexture(station.name, 'RAIL TERMINAL  ·  PLATFORM 01'), toneMapped: false, side: THREE.DoubleSide }),
  );
  terminalSign.position.set(0, 2.05, terminalCenterZ - station.platformSide * 2.15);
  terminalSign.rotation.y = station.platformSide > 0 ? Math.PI : 0;
  root.add(terminalSign);
  for (const x of [-2.4, 2.4]) {
    addBox(root, 0.1, 0.45, 0.1, terminalTrimMaterial, x, 0.58, terminalCenterZ - station.platformSide * 2.35, false, false);
  }
  addBox(root, 1.65, 0.12, 0.55, benchMaterial, 0, 0.53, terminalCenterZ + station.platformSide * 0.8, false, false);

  const bulbs = [];
  for (const x of [-1.75, 1.75]) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), lampMaterial);
    bulb.position.set(x, 2.34, shelterZ);
    root.add(bulb);
    const light = new THREE.PointLight(0xffd792, 0, 11, 2);
    light.position.set(x, 2.22, shelterZ);
    root.add(light);
    bulbs.push({ light, material: lampMaterial });
  }

  for (const x of [-2.0, 2.0]) {
    const terminalBulb = new THREE.Mesh(new THREE.SphereGeometry(0.095, 8, 6), lampMaterial);
    terminalBulb.position.set(x, 2.28, terminalCenterZ - station.platformSide * 1.92);
    root.add(terminalBulb);
    bulbs.push({ material: lampMaterial });
  }

  mergeStaticMeshes(root);
  scene.add(root);
  station.group = root;
  station.platformTop = root.position.y + 0.34;
  station.terminalBounds = { centerZ: terminalCenterZ, halfX: 3.33, halfZ: 2.28, top: root.position.y + 0.35 };
  station.connectorBounds = { centerZ: station.platformSide * 1.43, halfX: 0.72, halfZ: 0.42, top: root.position.y + 0.34 };
  station.lights = bulbs;
}

function addBusTerminal(scene, terminal, terrainHeight) {
  const root = new THREE.Group();
  root.name = `${terminal.name} Bus Terminal`;
  root.position.set(terminal.x, terrainHeight(terminal.x, terminal.z) + 0.025, terminal.z);
  root.rotation.y = terminal.yaw;

  const platformMaterial = new THREE.MeshStandardMaterial({ color: 0xb9b5a3, roughness: 0.91 });
  const curbMaterial = new THREE.MeshStandardMaterial({ color: 0xe1bf70, roughness: 0.68, emissive: 0x493612, emissiveIntensity: 0.1 });
  const structureMaterial = new THREE.MeshStandardMaterial({ color: 0x416b59, roughness: 0.72, metalness: 0.08 });
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xd8d1b8, roughness: 0.82 });
  const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x77aeb1, emissive: 0x163e3d, emissiveIntensity: 0.14, roughness: 0.23, metalness: 0.08, side: THREE.DoubleSide });
  const lampMaterial = new THREE.MeshStandardMaterial({ color: 0xffe4a8, emissive: 0xe1a751, emissiveIntensity: 0.12, roughness: 0.28 });
  const signMaterial = new THREE.MeshBasicMaterial({ map: makeStationSignTexture(terminal.name, 'BUS TERMINAL  ·  ISLAND SHUTTLE'), toneMapped: false, side: THREE.DoubleSide });
  const roadSide = terminal.roadSide;
  const hallZ = -roadSide * 0.72;

  addBox(root, 8.25, 0.34, 4.5, platformMaterial, 0, 0.17, 0, false, true);
  addBox(root, 7.9, 0.035, 0.16, curbMaterial, 0, 0.36, roadSide * 1.98, false, false);
  addBox(root, 5.15, 1.88, 2.5, wallMaterial, 0, 1.31, hallZ, true, true);
  addBox(root, 5.42, 0.16, 2.78, structureMaterial, 0, 2.32, hallZ, true, false);
  for (const side of [-1, 1]) {
    const window = new THREE.Mesh(new THREE.PlaneGeometry(4.15, 0.82), glassMaterial);
    window.position.set(0, 1.48, hallZ + side * 1.258);
    window.rotation.y = side < 0 ? Math.PI : 0;
    root.add(window);
  }
  const terminalDoor = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 1.62), glassMaterial);
  terminalDoor.position.set(0, 1.15, hallZ + roadSide * 1.267);
  terminalDoor.rotation.y = roadSide < 0 ? Math.PI : 0;
  root.add(terminalDoor);
  for (const x of [-3.15, 3.15]) addBox(root, 0.12, 2.1, 0.12, structureMaterial, x, 1.35, roadSide * 0.74, true, false);
  addBox(root, 7.0, 0.18, 3.35, structureMaterial, 0, 2.46, roadSide * 0.74, true, false);
  addBox(root, 6.8, 0.1, 0.12, curbMaterial, 0, 2.34, roadSide * 2.36, false, false);
  addBox(root, 3.2, 0.52, 0.14, structureMaterial, 0, 2.75, roadSide * 0.79, false, false);
  const terminalSign = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.4), signMaterial);
  terminalSign.position.set(0, 2.75, roadSide * 0.87);
  terminalSign.rotation.y = roadSide < 0 ? Math.PI : 0;
  root.add(terminalSign);
  addBox(root, 1.2, 0.82, 0.72, structureMaterial, -1.45, 0.75, hallZ - roadSide * 0.35, false, false);
  for (const x of [-2.2, 2.2]) {
    addBox(root, 1.55, 0.12, 0.46, structureMaterial, x, 0.55, roadSide * 1.06, false, false);
    addBox(root, 1.55, 0.42, 0.1, structureMaterial, x, 0.8, roadSide * 1.22, false, false);
  }

  const lights = [];
  for (const x of [-2.4, 2.4]) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), lampMaterial);
    bulb.position.set(x, 2.31, roadSide * 0.88);
    root.add(bulb);
    lights.push({ material: lampMaterial });
  }

  mergeStaticMeshes(root);
  scene.add(root);
  terminal.group = root;
  terminal.platformTop = root.position.y + 0.34;
  terminal.bounds = { halfX: 4.13, halfZ: 2.26, top: terminal.platformTop };
  terminal.lights = lights;
  return root;
}

function makeBusSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 160;
  const context = canvas.getContext('2d');
  context.fillStyle = '#214f45';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#e3c47c';
  context.fillRect(0, 0, 12, canvas.height);
  context.fillRect(canvas.width - 12, 0, 12, canvas.height);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#fff4d8';
  context.font = '700 46px Arial, sans-serif';
  context.fillText('ISLAND BUS', canvas.width / 2, 60);
  context.fillStyle = '#b8d7c3';
  context.font = '700 19px Arial, sans-serif';
  context.fillText('ISLAND SHUTTLE  ·  ALL STOPS', canvas.width / 2, 119);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}

function addBus(scene) {
  const group = new THREE.Group();
  group.name = 'Island Bus circular shuttle';
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x527e62, roughness: 0.5, metalness: 0.1 });
  const lowerBodyMaterial = new THREE.MeshStandardMaterial({ color: 0x294b41, roughness: 0.72, metalness: 0.12 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xe9e1cd, roughness: 0.56, metalness: 0.05 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xe0c47e, roughness: 0.4, metalness: 0.25 });
  const windowMaterial = new THREE.MeshStandardMaterial({ color: 0x76b4b4, emissive: 0x19403f, emissiveIntensity: 0.2, roughness: 0.22, metalness: 0.08, side: THREE.DoubleSide });
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x27342f, roughness: 0.86, metalness: 0.08 });
  const lampMaterial = new THREE.MeshStandardMaterial({ color: 0xffe4a7, emissive: 0xffc95d, emissiveIntensity: 0.32, roughness: 0.28 });
  const tailMaterial = new THREE.MeshStandardMaterial({ color: 0xe27f68, emissive: 0x8a3028, emissiveIntensity: 0.22, roughness: 0.34 });
  addBox(group, 1.88, 0.3, 5.25, lowerBodyMaterial, 0, 0.6, 0);
  addBox(group, 2.05, 1.28, BUS_LENGTH, bodyMaterial, 0, 1.34, 0);
  addBox(group, 2.1, 0.16, 5.94, roofMaterial, 0, 2.06, 0.02);
  addBox(group, 2.09, 0.1, 5.8, trimMaterial, 0, 0.92, 0);
  for (const side of [-1, 1]) {
    for (const z of [-1.85, -0.55, 0.83, 1.92]) {
      const window = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.57), windowMaterial);
      window.position.set(side * 1.036, 1.53, z);
      window.rotation.y = side * Math.PI / 2;
      group.add(window);
    }
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.96), windowMaterial);
    door.position.set(side * 1.04, 1.27, 0.15);
    door.rotation.y = side * Math.PI / 2;
    group.add(door);
    const routeSign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.25, 0.45),
      new THREE.MeshBasicMaterial({ map: makeBusSignTexture(), toneMapped: false, side: THREE.DoubleSide }),
    );
    routeSign.position.set(side * 1.045, 1.02, 0.05);
    routeSign.rotation.y = side * Math.PI / 2;
    group.add(routeSign);
  }
  const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 0.56), windowMaterial);
  windshield.position.set(0, 1.54, -BUS_LENGTH / 2 - 0.012);
  windshield.rotation.y = Math.PI;
  group.add(windshield);
  addBox(group, 1.96, 0.13, 0.12, trimMaterial, 0, 0.94, -BUS_LENGTH / 2 - 0.04);
  addBox(group, 1.96, 0.13, 0.12, lowerBodyMaterial, 0, 0.88, BUS_LENGTH / 2 + 0.035);

  const wheelGeometry = new THREE.CylinderGeometry(0.31, 0.31, 0.2, 14);
  wheelGeometry.rotateZ(Math.PI / 2);
  const wheels = [];
  for (const side of [-1, 1]) {
    for (const z of [-1.78, 1.78]) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(side * 0.88, 0.34, z);
      wheel.castShadow = true;
      group.add(wheel);
      wheels.push(wheel);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.21, 12), trimMaterial);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(side * 0.89, 0.34, z);
      group.add(hub);
    }
  }
  const headlights = [];
  for (const side of [-1, 1]) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 9, 7), lampMaterial);
    lamp.position.set(side * 0.65, 1.0, -BUS_LENGTH / 2 - 0.07);
    group.add(lamp);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 0.06), tailMaterial);
    tail.position.set(side * 0.67, 0.96, BUS_LENGTH / 2 + 0.04);
    group.add(tail);
  }
  mergeStaticMeshes(group, new Set(wheels));
  scene.add(group);
  return { group, wheels, headlightMaterial: lampMaterial, tailLightMaterial: tailMaterial, headlights };
}

export function createTransportNetwork(scene, terrainHeight) {
  const roadCurve = createPlanarCurve(ROAD_ROUTE_XZ, false);
  const railCurve = createPlanarCurve(RAIL_ROUTE_XZ, true);
  const asphalt = new THREE.MeshStandardMaterial({ color: 0x59615d, roughness: 0.94, metalness: 0.01 });
  const roadEdge = new THREE.MeshStandardMaterial({ color: 0xd2c7a2, roughness: 0.88 });
  const centerPaint = new THREE.MeshBasicMaterial({ color: 0xe6d39e, toneMapped: false });
  const ballastMaterial = new THREE.MeshStandardMaterial({ color: 0x696c62, roughness: 1, flatShading: true });
  const sleeperMaterial = new THREE.MeshStandardMaterial({ color: 0x655846, roughness: 0.96, flatShading: true });
  const railMaterial = new THREE.MeshStandardMaterial({ color: 0xb6b5a4, roughness: 0.3, metalness: 0.72 });
  const walkwayMaterial = new THREE.MeshStandardMaterial({ color: 0xc6bd9e, roughness: 0.96 });

  const road = new THREE.Mesh(createRibbonGeometry(roadCurve, terrainHeight, 360, ROAD_HALF_WIDTH, ROAD_SURFACE_OFFSET), asphalt);
  road.receiveShadow = true;
  scene.add(road);
  for (const side of [-1, 1]) {
    const edge = new THREE.Mesh(
      createRibbonGeometry(roadCurve, terrainHeight, 360, 0.055, ROAD_SURFACE_OFFSET + 0.012, side * (ROAD_HALF_WIDTH - 0.14)),
      roadEdge,
    );
    edge.receiveShadow = true;
    scene.add(edge);
  }
  const dashedCenterline = new THREE.Mesh(createDashedLineGeometry(roadCurve, terrainHeight), centerPaint);
  dashedCenterline.receiveShadow = false;
  scene.add(dashedCenterline);

  const ballast = new THREE.Mesh(createRibbonGeometry(railCurve, terrainHeight, 520, TRACK_HALF_WIDTH, 0.1), ballastMaterial);
  ballast.receiveShadow = true;
  scene.add(ballast);
  const sleeperCount = Math.floor(railCurve.getLength() / 2.0);
  const sleepers = new THREE.InstancedMesh(new THREE.BoxGeometry(2.15, 0.12, 0.19), sleeperMaterial, sleeperCount);
  sleepers.castShadow = false;
  sleepers.receiveShadow = true;
  const sleeperTransform = new THREE.Object3D();
  for (let index = 0; index < sleeperCount; index += 1) {
    const fraction = index / sleeperCount;
    const point = railCurve.getPointAt(fraction);
    const tangent = railCurve.getTangentAt(fraction);
    sleeperTransform.position.set(point.x, terrainHeight(point.x, point.z) + 0.16, point.z);
    sleeperTransform.rotation.set(0, Math.atan2(-tangent.x, -tangent.z), 0);
    sleeperTransform.updateMatrix();
    sleepers.setMatrixAt(index, sleeperTransform.matrix);
  }
  sleepers.instanceMatrix.needsUpdate = true;
  scene.add(sleepers);

  for (const offset of [-RAIL_GAUGE_HALF_WIDTH, RAIL_GAUGE_HALF_WIDTH]) {
    const railPath = createOffsetRailCurve(railCurve, terrainHeight, offset);
    const rail = new THREE.Mesh(new THREE.TubeGeometry(railPath, 520, 0.055, 6, true), railMaterial);
    rail.castShadow = true;
    rail.receiveShadow = true;
    scene.add(rail);
  }

  const roadSegments = createSurfaceSegments(roadCurve, terrainHeight, 360, ROAD_HALF_WIDTH, ROAD_SURFACE_OFFSET);
  const railSegments = createSurfaceSegments(railCurve, terrainHeight, 520, TRACK_HALF_WIDTH, 0.16);
  const roadMapPoints = Array.from({ length: 120 }, (_, index) => {
    const point = roadCurve.getPointAt(index / 119);
    return [point.x, point.z];
  });
  const railMapPoints = Array.from({ length: 240 }, (_, index) => {
    const point = railCurve.getPointAt(index / 240);
    return [point.x, point.z];
  });

  const stations = STATION_LAYOUT.map((layout) => {
    const [railX, railZ] = layout.railPoint;
    const fraction = findCurveFraction(railCurve, railX, railZ);
    const point = railCurve.getPointAt(fraction);
    const tangent = railCurve.getTangentAt(fraction);
    tangent.y = 0;
    tangent.normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const platformOffset = 3.25 * layout.platformSide;
    const station = {
      ...layout,
      railX: point.x,
      railZ: point.z,
      fraction,
      distance: fraction * railCurve.getLength(),
      x: point.x + normal.x * platformOffset,
      z: point.z + normal.z * platformOffset,
      yaw: Math.atan2(-tangent.z, tangent.x),
      length: 7.2,
      width: 2.65,
      platformSide: layout.platformSide,
    };
    addStation(scene, station, terrainHeight);
    const pathCurve = createPlanarCurve([[station.x, station.z], layout.accessPoint], false);
    const path = new THREE.Mesh(createRibbonGeometry(pathCurve, terrainHeight, 36, 0.8, 0.075), walkwayMaterial);
    path.receiveShadow = true;
    scene.add(path);
    station.walkwaySegments = createSurfaceSegments(pathCurve, terrainHeight, 36, 0.8, 0.075);
    return station;
  }).sort((a, b) => a.distance - b.distance);
  stations.forEach((station, index) => { station.index = index; });

  const busTerminals = BUS_TERMINAL_LAYOUT.map((layout) => {
    const [roadX, roadZ] = layout.roadPoint;
    const fraction = findCurveFraction(roadCurve, roadX, roadZ, 800, false);
    const point = roadCurve.getPointAt(fraction);
    const tangent = roadCurve.getTangentAt(fraction);
    tangent.y = 0;
    tangent.normalize();
    const [x, z] = layout.terminalPoint;
    const yaw = Math.atan2(-tangent.z, tangent.x);
    const dx = point.x - x;
    const dz = point.z - z;
    const roadSide = Math.sign(dx * Math.sin(yaw) + dz * Math.cos(yaw)) || 1;
    const terminal = {
      ...layout,
      x,
      z,
      roadX: point.x,
      roadZ: point.z,
      fraction,
      distance: fraction * roadCurve.getLength(),
      yaw,
      roadSide,
      length: 8.25,
      width: 4.5,
    };
    addBusTerminal(scene, terminal, terrainHeight);
    const pathCurve = createPlanarCurve([[terminal.x, terminal.z], [point.x, point.z]], false);
    const path = new THREE.Mesh(createRibbonGeometry(pathCurve, terrainHeight, 48, 0.92, 0.075), walkwayMaterial);
    path.receiveShadow = true;
    scene.add(path);
    terminal.walkwaySegments = createSurfaceSegments(pathCurve, terrainHeight, 48, 0.92, 0.075);
    return terminal;
  }).sort((a, b) => a.distance - b.distance);
  busTerminals.forEach((terminal, index) => { terminal.index = index; });

  const train = addTrain(scene);
  const bus = addBus(scene);
  const network = {
    roadCurve,
    railCurve,
    terrainHeight,
    roadPoints: ROAD_ROUTE_XZ,
    roadMapPoints,
    railMapPoints,
    busMapPoints: roadMapPoints,
    roadSegments,
    railSegments,
    stations,
    busTerminals,
    train,
    bus,
    length: railCurve.getLength(),
    distanceTravelled: stations[0].distance,
    currentStationIndex: 0,
    dwellRemaining: STATION_DWELL_SECONDS,
    speed: TRAIN_SPEED,
    dwellDuration: STATION_DWELL_SECONDS,
    busService: {
      distanceTravelled: busTerminals[0].distance,
      direction: 1,
      currentTerminalIndex: 0,
      dwellRemaining: BUS_TERMINAL_DWELL_SECONDS,
      speed: BUS_SPEED,
      dwellDuration: BUS_TERMINAL_DWELL_SECONDS,
    },
  };
  updateTrainPosition(network, 0);
  updateBusPosition(network, 0);
  return network;
}

function updateTrainPosition(network, distanceDelta) {
  const distance = ((network.distanceTravelled % network.length) + network.length) % network.length;
  const fraction = distance / network.length;
  const point = network.railCurve.getPointAt(fraction);
  const tangent = network.railCurve.getTangentAt(fraction);
  const train = network.train;
  train.group.position.set(point.x, network.terrainHeight(point.x, point.z) + 0.25, point.z);
  train.group.rotation.y = Math.atan2(-tangent.x, -tangent.z);
  if (distanceDelta !== 0) {
    const rotationDelta = distanceDelta / TRAIN_WHEEL_RADIUS;
    for (const wheel of train.wheels) wheel.rotation.x -= rotationDelta;
  }
}

function updateBusPosition(network, distanceDelta) {
  const service = network.busService;
  const length = network.roadCurve.getLength();
  const fraction = THREE.MathUtils.clamp(service.distanceTravelled / length, 0, 1);
  const point = network.roadCurve.getPointAt(fraction);
  const tangent = network.roadCurve.getTangentAt(fraction).multiplyScalar(service.direction);
  const bus = network.bus;
  bus.group.position.set(point.x, network.terrainHeight(point.x, point.z) + 0.24, point.z);
  bus.group.rotation.y = Math.atan2(-tangent.x, -tangent.z);
  if (distanceDelta !== 0) {
    const rotationDelta = distanceDelta / 0.31;
    for (const wheel of bus.wheels) wheel.rotation.x -= rotationDelta;
  }
}

function updateBusNetwork(network, delta) {
  const service = network.busService;
  const previousDistance = service.distanceTravelled;
  let arrivedTerminal = null;
  if (service.dwellRemaining > 0) {
    service.dwellRemaining = Math.max(0, service.dwellRemaining - delta);
  } else {
    let nextIndex = service.currentTerminalIndex + service.direction;
    if (nextIndex < 0 || nextIndex >= network.busTerminals.length) {
      service.direction *= -1;
      nextIndex = service.currentTerminalIndex + service.direction;
    }
    const nextTerminal = network.busTerminals[nextIndex];
    const proposedDistance = service.distanceTravelled + service.speed * service.direction * delta;
    const hasReachedTerminal = service.direction > 0
      ? proposedDistance >= nextTerminal.distance
      : proposedDistance <= nextTerminal.distance;
    if (hasReachedTerminal) {
      service.distanceTravelled = nextTerminal.distance;
      service.currentTerminalIndex = nextIndex;
      service.dwellRemaining = service.dwellDuration;
      arrivedTerminal = nextTerminal;
    } else {
      service.distanceTravelled = proposedDistance;
    }
  }
  updateBusPosition(network, service.distanceTravelled - previousDistance);
  return { arrivedTerminal };
}

export function updateTransportNetwork(network, delta) {
  let arrivedStation = null;
  const previousDistance = network.distanceTravelled;
  if (network.dwellRemaining > 0) {
    network.dwellRemaining = Math.max(0, network.dwellRemaining - delta);
  } else {
    const nextStationIndex = (network.currentStationIndex + 1) % network.stations.length;
    const nextStation = network.stations[nextStationIndex];
    const lap = Math.floor(network.distanceTravelled / network.length);
    let targetDistance = lap * network.length + nextStation.distance;
    if (targetDistance <= network.distanceTravelled + 1e-4) targetDistance += network.length;
    const proposedDistance = network.distanceTravelled + network.speed * delta;
    if (proposedDistance >= targetDistance) {
      network.distanceTravelled = targetDistance;
      network.currentStationIndex = nextStationIndex;
      network.dwellRemaining = network.dwellDuration;
      arrivedStation = nextStation;
    } else {
      network.distanceTravelled = proposedDistance;
    }
  }
  updateTrainPosition(network, network.distanceTravelled - previousDistance);
  const busUpdate = updateBusNetwork(network, delta);
  return { arrivedStation, arrivedBusTerminal: busUpdate.arrivedTerminal };
}

export function getNearestTransitStation(network, x, z, maxDistance = 4.6) {
  if (!network) return null;
  let closestStation = null;
  let closestDistance = maxDistance;
  for (const station of network.stations) {
    const distance = Math.hypot(x - station.x, z - station.z);
    if (distance < closestDistance) {
      closestStation = station;
      closestDistance = distance;
    }
  }
  return closestStation ? { station: closestStation, distance: closestDistance } : null;
}

export function isTrainAtStation(network, station) {
  return Boolean(network && station
    && network.stations[network.currentStationIndex]?.id === station.id
    && network.dwellRemaining > 0.05);
}

export function getNextTransitStation(network) {
  if (!network) return null;
  const nextIndex = (network.currentStationIndex + 1) % network.stations.length;
  return network.stations[nextIndex];
}

export function getTransitWaitSeconds(network, station) {
  if (!network || !station || isTrainAtStation(network, station)) return 0;
  const currentDistance = network.distanceTravelled;
  let targetDistance = Math.floor(currentDistance / network.length) * network.length + station.distance;
  if (targetDistance <= currentDistance + 0.1) targetDistance += network.length;
  let intermediateStops = 0;
  for (const stop of network.stations) {
    if (stop.id === station.id) continue;
    let stopDistance = Math.floor(currentDistance / network.length) * network.length + stop.distance;
    if (stopDistance <= currentDistance + 0.1) stopDistance += network.length;
    if (stopDistance < targetDistance) intermediateStops += 1;
  }
  const currentDwell = network.dwellRemaining > 0 ? network.dwellRemaining : 0;
  return Math.ceil((targetDistance - currentDistance) / network.speed + intermediateStops * network.dwellDuration + currentDwell);
}

export function getNearestBusTerminal(network, x, z, maxDistance = 4.6) {
  if (!network) return null;
  let closestTerminal = null;
  let closestDistance = maxDistance;
  for (const terminal of network.busTerminals) {
    const distance = Math.hypot(x - terminal.x, z - terminal.z);
    if (distance < closestDistance) {
      closestTerminal = terminal;
      closestDistance = distance;
    }
  }
  return closestTerminal ? { terminal: closestTerminal, distance: closestDistance } : null;
}

export function isBusAtTerminal(network, terminal) {
  return Boolean(network && terminal
    && network.busTerminals[network.busService.currentTerminalIndex]?.id === terminal.id
    && network.busService.dwellRemaining > 0.05);
}

export function getNextBusTerminal(network) {
  if (!network) return null;
  const service = network.busService;
  let nextIndex = service.currentTerminalIndex + service.direction;
  if (nextIndex < 0 || nextIndex >= network.busTerminals.length) nextIndex = service.currentTerminalIndex - service.direction;
  return network.busTerminals[nextIndex];
}

export function getBusWaitSeconds(network, terminal) {
  if (!network || !terminal || isBusAtTerminal(network, terminal)) return 0;
  const service = network.busService;
  let distance = service.distanceTravelled;
  let index = service.currentTerminalIndex;
  let direction = service.direction;
  let seconds = service.dwellRemaining > 0 ? service.dwellRemaining : 0;
  for (let step = 0; step < network.busTerminals.length * 3; step += 1) {
    let nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= network.busTerminals.length) {
      direction *= -1;
      nextIndex = index + direction;
    }
    const nextTerminal = network.busTerminals[nextIndex];
    seconds += Math.abs(nextTerminal.distance - distance) / service.speed;
    if (nextTerminal.id === terminal.id) return Math.ceil(seconds);
    seconds += service.dwellDuration;
    distance = nextTerminal.distance;
    index = nextIndex;
  }
  return Math.ceil(seconds);
}

export function getTransportSurfaceHeight(network, x, z) {
  if (!network) return null;
  let height = null;
  let nearestDistanceSquared = Infinity;
  for (const segment of network.roadSegments) {
    const result = distanceSquaredToSegment(x, z, segment);
    if (result.distanceSquared <= segment.halfWidth * segment.halfWidth && result.distanceSquared < nearestDistanceSquared) {
      height = result.height;
      nearestDistanceSquared = result.distanceSquared;
    }
  }
  for (const station of network.stations) {
    for (const segment of station.walkwaySegments) {
      const result = distanceSquaredToSegment(x, z, segment);
      if (result.distanceSquared <= segment.halfWidth * segment.halfWidth && result.distanceSquared < nearestDistanceSquared) {
        height = result.height;
        nearestDistanceSquared = result.distanceSquared;
      }
    }
    const dx = x - station.x;
    const dz = z - station.z;
    const cosine = Math.cos(station.yaw);
    const sine = Math.sin(station.yaw);
    const localX = dx * cosine - dz * sine;
    const localZ = dx * sine + dz * cosine;
    const withinPlatform = Math.abs(localX) <= station.length / 2 && Math.abs(localZ) <= station.width / 2;
    if (withinPlatform) height = Math.max(height ?? -Infinity, station.platformTop);
    for (const bounds of [station.terminalBounds, station.connectorBounds]) {
      if (bounds && Math.abs(localX) <= bounds.halfX && Math.abs(localZ - bounds.centerZ) <= bounds.halfZ) {
        height = Math.max(height ?? -Infinity, bounds.top);
      }
    }
  }
  for (const terminal of network.busTerminals) {
    for (const segment of terminal.walkwaySegments) {
      const result = distanceSquaredToSegment(x, z, segment);
      if (result.distanceSquared <= segment.halfWidth * segment.halfWidth && result.distanceSquared < nearestDistanceSquared) {
        height = result.height;
        nearestDistanceSquared = result.distanceSquared;
      }
    }
    const dx = x - terminal.x;
    const dz = z - terminal.z;
    const cosine = Math.cos(terminal.yaw);
    const sine = Math.sin(terminal.yaw);
    const localX = dx * cosine - dz * sine;
    const localZ = dx * sine + dz * cosine;
    if (Math.abs(localX) <= terminal.length / 2 && Math.abs(localZ) <= terminal.width / 2) {
      height = Math.max(height ?? -Infinity, terminal.platformTop);
    }
  }
  return height;
}

export function isReservedTransportSpot(network, x, z, padding = 0) {
  if (!network) return false;
  const margin = Math.max(0, padding);
  for (const segment of network.roadSegments) {
    const reserveWidth = segment.halfWidth + margin;
    if (distanceSquaredToSegment(x, z, segment).distanceSquared < reserveWidth * reserveWidth) return true;
  }
  for (const segment of network.railSegments) {
    const reserveWidth = segment.halfWidth + 2.6 + margin;
    if (distanceSquaredToSegment(x, z, segment).distanceSquared < reserveWidth * reserveWidth) return true;
  }
  for (const station of network.stations) {
    for (const segment of station.walkwaySegments) {
      const reserveWidth = segment.halfWidth + 1.8 + margin;
      if (distanceSquaredToSegment(x, z, segment).distanceSquared < reserveWidth * reserveWidth) return true;
    }
    if (Math.hypot(x - station.x, z - station.z) < 5.4 + margin) return true;
    const dx = x - station.x;
    const dz = z - station.z;
    const cosine = Math.cos(station.yaw);
    const sine = Math.sin(station.yaw);
    const localX = dx * cosine - dz * sine;
    const localZ = dx * sine + dz * cosine;
    for (const bounds of [station.terminalBounds, station.connectorBounds]) {
      if (bounds && Math.abs(localX) < bounds.halfX + margin && Math.abs(localZ - bounds.centerZ) < bounds.halfZ + margin) return true;
    }
  }
  for (const terminal of network.busTerminals) {
    for (const segment of terminal.walkwaySegments) {
      const reserveWidth = segment.halfWidth + 1.8 + margin;
      if (distanceSquaredToSegment(x, z, segment).distanceSquared < reserveWidth * reserveWidth) return true;
    }
    const dx = x - terminal.x;
    const dz = z - terminal.z;
    const cosine = Math.cos(terminal.yaw);
    const sine = Math.sin(terminal.yaw);
    const localX = dx * cosine - dz * sine;
    const localZ = dx * sine + dz * cosine;
    if (Math.abs(localX) < terminal.length / 2 + margin && Math.abs(localZ) < terminal.width / 2 + margin) return true;
  }
  return false;
}

export function updateTransitLighting(network, night) {
  if (!network) return;
  for (const station of network.stations) {
    for (const fixture of station.lights) {
      if (fixture.light) fixture.light.intensity = THREE.MathUtils.lerp(0, 14, night);
      fixture.material.emissiveIntensity = THREE.MathUtils.lerp(0.12, 1.35, night);
    }
  }
  for (const terminal of network.busTerminals) {
    for (const fixture of terminal.lights) {
      if (fixture.light) fixture.light.intensity = THREE.MathUtils.lerp(0, 12, night);
      fixture.material.emissiveIntensity = THREE.MathUtils.lerp(0.12, 1.25, night);
    }
  }
  for (const light of network.train.headlights) light.intensity = THREE.MathUtils.lerp(0, 18, night);
  network.train.headlightMaterial.emissiveIntensity = THREE.MathUtils.lerp(0.3, 2.2, night);
  network.train.tailLightMaterial.emissiveIntensity = THREE.MathUtils.lerp(0.22, 0.9, night);
  for (const light of network.bus.headlights) light.intensity = THREE.MathUtils.lerp(0, 16, night);
  network.bus.headlightMaterial.emissiveIntensity = THREE.MathUtils.lerp(0.32, 2.0, night);
  network.bus.tailLightMaterial.emissiveIntensity = THREE.MathUtils.lerp(0.22, 0.92, night);
}
