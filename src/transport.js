import * as THREE from 'three';

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

const ROAD_HALF_WIDTH = 2.35;
const ROAD_SURFACE_OFFSET = 0.115;
const TRACK_HALF_WIDTH = 1.25;
const RAIL_GAUGE_HALF_WIDTH = 0.68;
const TRAIN_SPEED = 7.2;
const STATION_DWELL_SECONDS = 6.5;
const TRAIN_LENGTH = 6.3;
const TRAIN_WHEEL_RADIUS = 0.29;

function addBox(parent, width, height, depth, material, x, y, z, castShadow = true, receiveShadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  parent.add(mesh);
  return mesh;
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

function findCurveFraction(curve, x, z, samples = 800) {
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
  return bestFraction > 0.98 ? 0 : bestFraction;
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
  scene.add(group);
  return { group, wheels, headlightMaterial, tailLightMaterial, headlights };
}

function addStation(scene, station, terrainHeight) {
  const root = new THREE.Group();
  root.name = `${station.name} Island Line station`;
  root.position.set(station.x, terrainHeight(station.x, station.z) + 0.025, station.z);
  root.rotation.y = station.yaw;

  const platformMaterial = new THREE.MeshStandardMaterial({ color: 0xb8b29e, roughness: 0.92 });
  const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xe3bd66, roughness: 0.72, emissive: 0x453514, emissiveIntensity: 0.12 });
  const supportMaterial = new THREE.MeshStandardMaterial({ color: 0x50645a, roughness: 0.67, metalness: 0.2 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x3a6254, roughness: 0.76, metalness: 0.08 });
  const benchMaterial = new THREE.MeshStandardMaterial({ color: 0x587e69, roughness: 0.72 });
  const lampMaterial = new THREE.MeshStandardMaterial({ color: 0xffe6aa, emissive: 0xe8aa51, emissiveIntensity: 0.12, roughness: 0.28 });
  const stationCanvas = makeStationSignTexture(station.name, 'ISLAND LINE  ·  ALL STOPS');
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

  scene.add(root);
  station.group = root;
  station.platformTop = root.position.y + 0.34;
  station.lights = bulbs;
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

  const train = addTrain(scene);
  const network = {
    roadCurve,
    railCurve,
    terrainHeight,
    roadPoints: ROAD_ROUTE_XZ,
    roadMapPoints,
    railMapPoints,
    roadSegments,
    railSegments,
    stations,
    train,
    length: railCurve.getLength(),
    distanceTravelled: stations[0].distance,
    currentStationIndex: 0,
    dwellRemaining: STATION_DWELL_SECONDS,
    speed: TRAIN_SPEED,
    dwellDuration: STATION_DWELL_SECONDS,
  };
  updateTrainPosition(network, 0);
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
  return { arrivedStation };
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
  }
  return false;
}

export function updateTransitLighting(network, night) {
  if (!network) return;
  for (const station of network.stations) {
    for (const fixture of station.lights) {
      fixture.light.intensity = THREE.MathUtils.lerp(0, 14, night);
      fixture.material.emissiveIntensity = THREE.MathUtils.lerp(0.12, 1.35, night);
    }
  }
  for (const light of network.train.headlights) light.intensity = THREE.MathUtils.lerp(0, 18, night);
  network.train.headlightMaterial.emissiveIntensity = THREE.MathUtils.lerp(0.3, 2.2, night);
  network.train.tailLightMaterial.emissiveIntensity = THREE.MathUtils.lerp(0.22, 0.9, night);
}
