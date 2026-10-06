import * as THREE from 'three';

export const STADIUM_CONFIG = Object.freeze({
  x: -32,
  z: 18,
  level: 0.32,
  fieldHalfX: 11.5,
  fieldHalfZ: 14.5,
  goalHalfWidth: 2.35,
  goalHeight: 2.6,
  standHalfX: 18,
  standHalfZ: 19,
  plateauHalfX: 19.5,
  plateauHalfZ: 20.5,
  terrainBlend: 3.5,
  pitchOffset: 0.065,
});

const TEAM_NAMES = ['FERN FOXES', 'RIVER BLUES'];
const TEAM_COLORS = [0xe87955, 0x477bc0];
const CROWD_COLORS = [0xf0c46f, 0xe77e61, 0x6a9e86, 0x85a9cd, 0xd3b3d8, 0xe9e2cb];
const BALL_RADIUS = 0.3;

function makeRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function addBox(parent, width, height, depth, material, x, y, z, castShadow = true, receiveShadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  parent.add(mesh);
  return mesh;
}

function makeFootballTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 192;
  const context = canvas.getContext('2d');
  context.fillStyle = '#f4f3e8';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#252e2d';
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 7; column += 1) {
      const centerX = 26 + column * 56 + (row % 2) * 27;
      const centerY = 21 + row * 50;
      context.beginPath();
      for (let point = 0; point < 5; point += 1) {
        const angle = -Math.PI / 2 + point * Math.PI * 2 / 5;
        const x = centerX + Math.cos(angle) * 13;
        const y = centerY + Math.sin(angle) * 13;
        if (point === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
      context.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}

function makeBoardTexture(isScoreboard = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = isScoreboard ? 256 : 192;
  const context = canvas.getContext('2d');
  context.fillStyle = isScoreboard ? '#173832' : '#254b3e';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#d9c48c';
  context.lineWidth = 10;
  context.strokeRect(9, 9, canvas.width - 18, canvas.height - 18);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  if (isScoreboard) {
    context.fillStyle = '#b6d4ae';
    context.font = '700 27px Arial, sans-serif';
    context.fillText('MEADOW PARK  ·  LIVE MATCH', canvas.width / 2, 48);
    context.fillStyle = '#f5eed8';
    context.font = '700 43px Arial, sans-serif';
    context.fillText('FERN FOXES', 170, 132);
    context.fillText('RIVER BLUES', 598, 132);
    context.fillStyle = '#efd78c';
    context.font = '700 72px Arial, sans-serif';
    context.fillText('0  –  0', canvas.width / 2, 147);
    context.fillStyle = '#a9c9b0';
    context.font = '700 22px Arial, sans-serif';
    context.fillText('00:00', canvas.width / 2, 216);
  } else {
    context.fillStyle = '#f8f1dd';
    context.font = '700 43px Arial, sans-serif';
    context.fillText('MEADOW PARK', canvas.width / 2, 76);
    context.fillStyle = '#e6cb87';
    context.font = '700 25px Arial, sans-serif';
    context.fillText('STADIUM  ·  MATCHDAY', canvas.width / 2, 130);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  return { canvas, context, texture };
}

function drawScoreboard(stadium) {
  const context2d = stadium.scoreboardContext;
  const canvas = stadium.scoreboardCanvas;
  const { scoreboardTexture } = stadium;
  context2d.clearRect(0, 0, canvas.width, canvas.height);
  context2d.fillStyle = '#173832';
  context2d.fillRect(0, 0, canvas.width, canvas.height);
  context2d.strokeStyle = '#d9c48c';
  context2d.lineWidth = 10;
  context2d.strokeRect(9, 9, canvas.width - 18, canvas.height - 18);
  context2d.textAlign = 'center';
  context2d.textBaseline = 'middle';
  context2d.fillStyle = stadium.goalFlash > 0 ? '#ffd884' : '#b6d4ae';
  context2d.font = '700 27px Arial, sans-serif';
  context2d.fillText(stadium.goalFlash > 0 ? `GOAL!  ${TEAM_NAMES[stadium.lastScoringTeam]}` : 'MEADOW PARK  ·  LIVE MATCH', canvas.width / 2, 48);
  context2d.fillStyle = '#f5eed8';
  context2d.font = '700 36px Arial, sans-serif';
  context2d.fillText(TEAM_NAMES[0], 145, 132);
  context2d.fillText(TEAM_NAMES[1], 623, 132);
  context2d.fillStyle = '#efd78c';
  context2d.font = '700 72px Arial, sans-serif';
  context2d.fillText(`${stadium.score[0]}  –  ${stadium.score[1]}`, canvas.width / 2, 147);
  const matchSeconds = Math.floor(stadium.elapsed * 1.4);
  const minutes = Math.floor(matchSeconds / 60);
  const seconds = matchSeconds % 60;
  context2d.fillStyle = '#a9c9b0';
  context2d.font = '700 22px Arial, sans-serif';
  context2d.fillText(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`, canvas.width / 2, 216);
  scoreboardTexture.needsUpdate = true;
}

function createPlayer(teamIndex, index, formation, jerseyMaterials, shortsMaterials, sockMaterials, keeperMaterials, skinMaterial, shoeMaterial) {
  const isKeeper = index === 0;
  const group = new THREE.Group();
  const shirt = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.2, 0.38, 2, 7),
    isKeeper ? keeperMaterials[teamIndex] : jerseyMaterials[teamIndex],
  );
  shirt.position.y = 0.94;
  shirt.castShadow = true;
  group.add(shirt);

  const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.22, 7), shortsMaterials[teamIndex]);
  shorts.position.y = 0.61;
  shorts.castShadow = true;
  group.add(shorts);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 9, 7), skinMaterial);
  head.position.y = 1.39;
  head.castShadow = true;
  group.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.148, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.48), new THREE.MeshStandardMaterial({ color: index % 2 === 0 ? 0x392f2b : 0x4b372b, roughness: 0.96 }));
  hair.position.y = 1.42;
  group.add(hair);

  const legs = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.105, 0.47, 0);
    const shin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.14), sockMaterials[teamIndex]);
    shin.position.y = -0.16;
    shin.castShadow = true;
    pivot.add(shin);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.085, 0.22), shoeMaterial);
    boot.position.set(0, -0.34, -0.035);
    boot.castShadow = true;
    pivot.add(boot);
    group.add(pivot);
    legs.push(pivot);
  }

  return {
    group,
    legs,
    teamIndex,
    index,
    isKeeper,
    baseX: formation[0],
    baseZ: formation[1],
    phase: teamIndex * 1.7 + index * 0.83,
    kickPulse: 0,
    runAmount: 0,
  };
}

function addGoal(group, direction, config, postMaterial, netMaterial) {
  const { fieldHalfZ, goalHalfWidth, goalHeight, pitchOffset } = config;
  const lineZ = direction * (fieldHalfZ - 0.04);
  const backZ = direction * (fieldHalfZ + 1.45);
  const postWidth = 0.16;
  for (const x of [-goalHalfWidth, goalHalfWidth]) {
    addBox(group, postWidth, goalHeight, postWidth, postMaterial, x, pitchOffset + goalHeight / 2, lineZ);
    addBox(group, postWidth, goalHeight, postWidth, postMaterial, x, pitchOffset + goalHeight / 2, backZ);
    addBox(group, postWidth, 0.12, 1.45, postMaterial, x, pitchOffset + goalHeight, direction * (fieldHalfZ + 0.72));
  }
  addBox(group, goalHalfWidth * 2 + postWidth, 0.16, postWidth, postMaterial, 0, pitchOffset + goalHeight, lineZ);
  addBox(group, goalHalfWidth * 2 + postWidth, 0.12, postWidth, postMaterial, 0, pitchOffset + goalHeight, backZ);
  addBox(group, goalHalfWidth * 2 + postWidth, postWidth, 1.45, postMaterial, 0, pitchOffset + 0.06, direction * (fieldHalfZ + 0.72));

  const positions = [];
  const columns = 8;
  const rows = 5;
  for (let column = 0; column <= columns; column += 1) {
    const x = -goalHalfWidth + (column / columns) * goalHalfWidth * 2;
    positions.push(x, pitchOffset, backZ, x, pitchOffset + goalHeight, backZ);
  }
  for (let row = 0; row <= rows; row += 1) {
    const y = pitchOffset + (row / rows) * goalHeight;
    positions.push(-goalHalfWidth, y, backZ, goalHalfWidth, y, backZ);
  }
  const netGeometry = new THREE.BufferGeometry();
  netGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const net = new THREE.LineSegments(netGeometry, netMaterial);
  net.computeLineDistances();
  group.add(net);
}

function createPitch(group, config) {
  const { fieldHalfX, fieldHalfZ, pitchOffset } = config;
  const pitchWidth = fieldHalfX * 2;
  const pitchLength = fieldHalfZ * 2;
  const fieldBase = new THREE.Mesh(
    new THREE.PlaneGeometry(pitchWidth, pitchLength),
    new THREE.MeshStandardMaterial({ color: 0x4c9b61, roughness: 0.98, side: THREE.DoubleSide }),
  );
  fieldBase.rotation.x = -Math.PI / 2;
  fieldBase.position.y = pitchOffset;
  fieldBase.receiveShadow = true;
  group.add(fieldBase);

  const stripeColors = [0x509e62, 0x448e58];
  const stripeWidth = pitchWidth / 6;
  for (let stripe = 0; stripe < 6; stripe += 1) {
    const mowingStripe = new THREE.Mesh(
      new THREE.PlaneGeometry(stripeWidth, pitchLength),
      new THREE.MeshBasicMaterial({ color: stripeColors[stripe % 2], side: THREE.DoubleSide }),
    );
    mowingStripe.rotation.x = -Math.PI / 2;
    mowingStripe.position.set(-fieldHalfX + stripeWidth * (stripe + 0.5), pitchOffset + 0.003, 0);
    group.add(mowingStripe);
  }

  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xf5f5e8, toneMapped: false, side: THREE.DoubleSide });
  const lineY = pitchOffset + 0.018;
  const lineThickness = 0.085;
  addBox(group, pitchWidth, 0.018, lineThickness, lineMaterial, 0, lineY, -fieldHalfZ);
  addBox(group, pitchWidth, 0.018, lineThickness, lineMaterial, 0, lineY, fieldHalfZ);
  addBox(group, lineThickness, 0.018, pitchLength, lineMaterial, -fieldHalfX, lineY, 0);
  addBox(group, lineThickness, 0.018, pitchLength, lineMaterial, fieldHalfX, lineY, 0);
  addBox(group, pitchWidth, 0.018, lineThickness * 0.8, lineMaterial, 0, lineY, 0);

  const centreCircle = new THREE.Mesh(new THREE.TorusGeometry(3.15, 0.045, 6, 48), lineMaterial);
  centreCircle.rotation.x = -Math.PI / 2;
  centreCircle.position.y = lineY + 0.008;
  group.add(centreCircle);
  const centreSpot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.018, 16), lineMaterial);
  centreSpot.position.set(0, lineY, 0);
  group.add(centreSpot);

  for (const direction of [-1, 1]) {
    const penaltyHalfWidth = 7.2;
    const penaltyDepth = 5.1;
    const boxFrontZ = direction * (fieldHalfZ - penaltyDepth);
    addBox(group, penaltyHalfWidth * 2, 0.018, lineThickness, lineMaterial, 0, lineY, boxFrontZ);
    addBox(group, lineThickness, 0.018, penaltyDepth, lineMaterial, -penaltyHalfWidth, lineY, direction * (fieldHalfZ - penaltyDepth / 2));
    addBox(group, lineThickness, 0.018, penaltyDepth, lineMaterial, penaltyHalfWidth, lineY, direction * (fieldHalfZ - penaltyDepth / 2));
    const goalAreaHalfWidth = 3.8;
    const goalAreaDepth = 2.0;
    addBox(group, goalAreaHalfWidth * 2, 0.018, lineThickness, lineMaterial, 0, lineY, direction * (fieldHalfZ - goalAreaDepth));
    addBox(group, lineThickness, 0.018, goalAreaDepth, lineMaterial, -goalAreaHalfWidth, lineY, direction * (fieldHalfZ - goalAreaDepth / 2));
    addBox(group, lineThickness, 0.018, goalAreaDepth, lineMaterial, goalAreaHalfWidth, lineY, direction * (fieldHalfZ - goalAreaDepth / 2));
    const penaltySpot = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.018, 12), lineMaterial);
    penaltySpot.position.set(0, lineY, direction * (fieldHalfZ - 4.0));
    group.add(penaltySpot);
  }
}

function addStandSeats(group, config, random) {
  const seats = [];
  const rows = 5;
  for (const side of [-1, 1]) {
    for (let row = 0; row < rows; row += 1) {
      const x = side * (config.fieldHalfX + 1.55 + row * 1.08);
      const tierY = 0.2 + row * 0.36;
      for (let seatIndex = 0; seatIndex <= 24; seatIndex += 1) {
        const z = -15 + seatIndex * 1.25;
        if (side === 1 && Math.abs(z) < 1.8) continue;
        seats.push({ x, z, y: tierY + 0.21, rotation: Math.PI / 2, backX: x + side * 0.24, backZ: z, side, row, end: false });
      }
    }
  }
  for (const side of [-1, 1]) {
    for (let row = 0; row < rows; row += 1) {
      const z = side * (config.fieldHalfZ + 1.3 + row * 0.72);
      const tierY = 0.2 + row * 0.34;
      for (let seatIndex = 0; seatIndex <= 17; seatIndex += 1) {
        const x = -10.6 + seatIndex * 1.25;
        seats.push({ x, z, y: tierY + 0.2, rotation: 0, backX: x, backZ: z + side * 0.24, side, row, end: true });
      }
    }
  }

  const baseGeometry = new THREE.BoxGeometry(0.76, 0.18, 0.58);
  const backGeometry = new THREE.BoxGeometry(0.76, 0.36, 0.12);
  const seatMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.77 });
  const seatBases = new THREE.InstancedMesh(baseGeometry, seatMaterial, seats.length);
  const seatBacks = new THREE.InstancedMesh(backGeometry, seatMaterial, seats.length);
  seatBases.castShadow = false;
  seatBases.receiveShadow = false;
  seatBacks.castShadow = false;
  seatBacks.receiveShadow = false;
  const transform = new THREE.Object3D();
  const palette = [0x3d7862, 0xd7bd7a, 0x6688a7, 0xc66d53, 0x586f67, 0xd4d9c9];
  const crowdSlots = [];
  for (let index = 0; index < seats.length; index += 1) {
    const seat = seats[index];
    const color = new THREE.Color(palette[Math.floor(random() * palette.length)]);
    transform.position.set(seat.x, seat.y, seat.z);
    transform.rotation.set(0, seat.rotation, 0);
    transform.scale.set(1, 1, 1);
    transform.updateMatrix();
    seatBases.setMatrixAt(index, transform.matrix);
    seatBases.setColorAt(index, color);
    transform.position.set(seat.backX, seat.y + 0.24, seat.backZ);
    transform.rotation.set(0, seat.rotation, 0);
    transform.updateMatrix();
    seatBacks.setMatrixAt(index, transform.matrix);
    seatBacks.setColorAt(index, color.clone().multiplyScalar(0.82));
    if (!seat.end && index % 9 === 0 && !(seat.side === 1 && Math.abs(seat.z) < 2.2)) {
      crowdSlots.push({ x: seat.x, z: seat.z, y: seat.y, rotation: seat.rotation, side: seat.side, end: seat.end });
    }
  }
  seatBases.instanceMatrix.needsUpdate = true;
  seatBacks.instanceMatrix.needsUpdate = true;
  if (seatBases.instanceColor) seatBases.instanceColor.needsUpdate = true;
  if (seatBacks.instanceColor) seatBacks.instanceColor.needsUpdate = true;
  group.add(seatBases, seatBacks);

  const spectators = crowdSlots.slice(0, 62);
  const spectatorBody = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.13, 0.16, 0.4, 7),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }),
    spectators.length,
  );
  const spectatorHead = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.13, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92 }),
    spectators.length,
  );
  spectatorBody.castShadow = false;
  spectatorHead.castShadow = false;
  for (let index = 0; index < spectators.length; index += 1) {
    const seat = spectators[index];
    const shirtColor = new THREE.Color(CROWD_COLORS[Math.floor(random() * CROWD_COLORS.length)]);
    transform.position.set(seat.x, seat.y + 0.4, seat.z);
    transform.rotation.set(0, seat.rotation, 0);
    transform.scale.set(1, 1, 1);
    transform.updateMatrix();
    spectatorBody.setMatrixAt(index, transform.matrix);
    spectatorBody.setColorAt(index, shirtColor);
    transform.position.set(seat.x, seat.y + 0.7, seat.z);
    transform.rotation.set(0, 0, 0);
    transform.updateMatrix();
    spectatorHead.setMatrixAt(index, transform.matrix);
    spectatorHead.setColorAt(index, new THREE.Color(0xb97c5d + Math.floor(random() * 0x141414)));
  }
  spectatorBody.instanceMatrix.needsUpdate = true;
  spectatorHead.instanceMatrix.needsUpdate = true;
  if (spectatorBody.instanceColor) spectatorBody.instanceColor.needsUpdate = true;
  if (spectatorHead.instanceColor) spectatorHead.instanceColor.needsUpdate = true;
  group.add(spectatorBody, spectatorHead);
}

function addFloodlights(group, config) {
  const mastMaterial = new THREE.MeshStandardMaterial({ color: 0x4a6157, roughness: 0.7, metalness: 0.28 });
  const lampMaterial = new THREE.MeshStandardMaterial({ color: 0xffedbd, emissive: 0xffd77e, emissiveIntensity: 1.0, roughness: 0.3 });
  for (const xSign of [-1, 1]) {
    for (const zSign of [-1, 1]) {
      const x = xSign * (config.standHalfX - 0.4);
      const z = zSign * (config.standHalfZ - 0.6);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.16, 8.2, 8), mastMaterial);
      mast.position.set(x, 4.1, z);
      mast.castShadow = true;
      group.add(mast);
      addBox(group, 1.4, 0.3, 0.54, mastMaterial, x, 8.0, z);
      for (let lamp = 0; lamp < 5; lamp += 1) {
        const offsetX = (lamp - 2) * 0.24;
        const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.08), lampMaterial);
        bulb.position.set(x + offsetX, 7.97, z);
        group.add(bulb);
      }
    }
  }
}

function createTeams(group, config) {
  const jerseyMaterials = [
    new THREE.MeshStandardMaterial({ color: TEAM_COLORS[0], roughness: 0.74 }),
    new THREE.MeshStandardMaterial({ color: TEAM_COLORS[1], roughness: 0.74 }),
  ];
  const keeperMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xe8c54f, roughness: 0.7 }),
    new THREE.MeshStandardMaterial({ color: 0x9a75bd, roughness: 0.7 }),
  ];
  const shortsMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x30453d, roughness: 0.92 }),
    new THREE.MeshStandardMaterial({ color: 0x29384e, roughness: 0.92 }),
  ];
  const sockMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xe6ddd0, roughness: 0.93 }),
    new THREE.MeshStandardMaterial({ color: 0xf0eadb, roughness: 0.93 }),
  ];
  const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xc88768, roughness: 0.9 });
  const shoeMaterial = new THREE.MeshStandardMaterial({ color: 0x26312d, roughness: 0.82 });
  const formations = [
    [[0, -12.8], [-7, -7.5], [7, -7], [-4.4, -1.2], [4.4, 5.4]],
    [[0, 12.8], [-7, 7.5], [7, 7], [-4.4, 1.2], [4.4, -5.4]],
  ];
  const teams = [];
  for (let teamIndex = 0; teamIndex < 2; teamIndex += 1) {
    const players = formations[teamIndex].map((formation, index) => {
      const player = createPlayer(teamIndex, index, formation, jerseyMaterials, shortsMaterials, sockMaterials, keeperMaterials, skinMaterial, shoeMaterial);
      player.group.position.set(formation[0], config.pitchOffset, formation[1]);
      group.add(player.group);
      return player;
    });
    teams.push({ name: TEAM_NAMES[teamIndex], attackSign: teamIndex === 0 ? 1 : -1, players });
  }
  return teams;
}

export function createStadium(terrainHeight) {
  const config = STADIUM_CONFIG;
  const baseY = terrainHeight(config.x, config.z);
  const group = new THREE.Group();
  group.position.set(config.x, baseY, config.z);
  group.name = 'Meadow Park Stadium';

  const random = makeRandom(0x72a91c);
  const concrete = new THREE.MeshStandardMaterial({ color: 0x9ca698, roughness: 0.96, flatShading: true });
  const concreteDark = new THREE.MeshStandardMaterial({ color: 0x718078, roughness: 0.95, flatShading: true });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x3d6658, roughness: 0.82, metalness: 0.08 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xd6c48f, roughness: 0.68, metalness: 0.12 });
  const fieldBase = addBox(group, 38, 0.18, 40, concrete, 0, -0.09, 0);
  fieldBase.receiveShadow = true;

  const runningTrack = addBox(group, config.fieldHalfX * 2 + 2.8, 0.045, config.fieldHalfZ * 2 + 2.8, new THREE.MeshStandardMaterial({ color: 0xb27d61, roughness: 0.94 }), 0, 0.022, 0, false, true);
  runningTrack.receiveShadow = true;
  addBox(group, config.fieldHalfX * 2 + 3.25, 0.05, 0.2, trimMaterial, 0, 0.035, -config.fieldHalfZ - 1.5, false, true);
  addBox(group, config.fieldHalfX * 2 + 3.25, 0.05, 0.2, trimMaterial, 0, 0.035, config.fieldHalfZ + 1.5, false, true);
  addBox(group, 0.2, 0.05, config.fieldHalfZ * 2 + 3.25, trimMaterial, -config.fieldHalfX - 1.5, 0.035, 0, false, true);
  addBox(group, 0.2, 0.05, config.fieldHalfZ * 2 + 3.25, trimMaterial, config.fieldHalfX + 1.5, 0.035, 0, false, true);
  createPitch(group, config);

  const tierMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x99a496, roughness: 0.97, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x89968c, roughness: 0.97, flatShading: true }),
  ];
  const seatRows = 5;
  for (const side of [-1, 1]) {
    for (let row = 0; row < seatRows; row += 1) {
      const x = side * (config.fieldHalfX + 1.55 + row * 1.08);
      const y = 0.2 + row * 0.36;
      addBox(group, 1.12, 0.36, 33.5, tierMaterials[row % 2], x, y, 0);
      if (row === 0) addBox(group, 0.12, 0.56, 33.5, concreteDark, x - side * 0.54, y + 0.33, 0, true, false);
    }
  }
  for (const side of [-1, 1]) {
    for (let row = 0; row < seatRows; row += 1) {
      const z = side * (config.fieldHalfZ + 1.3 + row * 0.72);
      const y = 0.2 + row * 0.34;
      addBox(group, 26, 0.34, 0.82, tierMaterials[row % 2], 0, y, z);
    }
  }
  addStandSeats(group, config, random);

  for (const side of [-1, 1]) {
    addBox(group, 7.0, 0.34, 35.5, roofMaterial, side * 15.7, 4.15, 0);
    addBox(group, 7.0, 0.14, 35.8, trimMaterial, side * 15.7, 3.92, 0);
    const supportPositions = side > 0 ? [-15.5, -5, 5, 15.5] : [-15.5, 0, 15.5];
    for (const z of supportPositions) {
      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 3.7, 8), concreteDark);
      column.position.set(side * 18.05, 2.05, z);
      column.castShadow = true;
      group.add(column);
    }
    addBox(group, 0.22, 0.5, 33.5, side < 0 ? new THREE.MeshStandardMaterial({ color: TEAM_COLORS[0], roughness: 0.82 }) : new THREE.MeshStandardMaterial({ color: TEAM_COLORS[1], roughness: 0.82 }), side * 17.45, 3.55, 0, false, false);
  }
  addBox(group, 34, 0.36, 0.75, roofMaterial, 0, 3.55, -18.15);
  addBox(group, 34, 0.36, 0.75, roofMaterial, 0, 3.55, 18.15);

  const postMaterial = new THREE.MeshStandardMaterial({ color: 0xf0eee2, roughness: 0.48, metalness: 0.08 });
  const netMaterial = new THREE.LineBasicMaterial({ color: 0xf2f0e6, transparent: true, opacity: 0.52 });
  addGoal(group, -1, config, postMaterial, netMaterial);
  addGoal(group, 1, config, postMaterial, netMaterial);

  addFloodlights(group, config);

  const scoreboard = makeBoardTexture(true);
  const boardFrame = addBox(group, 0.42, 3.5, 10.2, concreteDark, -16.8, 6.4, 0);
  boardFrame.castShadow = true;
  const boardScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(9.7, 3.05),
    new THREE.MeshBasicMaterial({ map: scoreboard.texture, side: THREE.DoubleSide, toneMapped: false }),
  );
  boardScreen.position.set(-16.56, 6.45, 0);
  boardScreen.rotation.y = Math.PI / 2;
  group.add(boardScreen);

  for (const side of [-1, 1]) {
    const column = addBox(group, 0.55, 3.1, 0.55, concreteDark, config.standHalfX + 0.2, 1.55, side * 2.3);
    column.castShadow = true;
  }
  addBox(group, 0.55, 0.28, 5.15, trimMaterial, config.standHalfX + 0.2, 3.12, 0);
  const entranceBoard = makeBoardTexture(false);
  const entranceSign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 1.2),
    new THREE.MeshBasicMaterial({ map: entranceBoard.texture, side: THREE.DoubleSide, toneMapped: false }),
  );
  entranceSign.position.set(config.standHalfX + 0.48, 3.65, 0);
  entranceSign.rotation.y = Math.PI / 2;
  group.add(entranceSign);

  const ballTexture = makeFootballTexture();
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(BALL_RADIUS, 18, 14),
    new THREE.MeshStandardMaterial({ map: ballTexture, roughness: 0.74 }),
  );
  ball.castShadow = true;
  ball.position.set(0, config.pitchOffset + BALL_RADIUS, 0);
  group.add(ball);
  const ballShadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.34, 16),
    new THREE.MeshBasicMaterial({ color: 0x193125, transparent: true, opacity: 0.22, depthWrite: false }),
  );
  ballShadow.rotation.x = -Math.PI / 2;
  ballShadow.position.set(0, config.pitchOffset + 0.012, 0);
  group.add(ballShadow);

  const teams = createTeams(group, config);
  const stadium = {
    group,
    config,
    teams,
    ball,
    ballShadow,
    ballVelocity: new THREE.Vector3(),
    ballVerticalVelocity: 0,
    score: [0, 0],
    elapsed: 0,
    kickCount: 0,
    kickCooldown: 1.6,
    goalFlash: 0,
    lastScoringTeam: 0,
    scoreboardCanvas: scoreboard.canvas,
    scoreboardContext: scoreboard.context,
    scoreboardTexture: scoreboard.texture,
    scoreboardAccumulator: 0,
    random,
  };
  // Keep the entrance welcome graphic separate from the live score display.
  stadium.entranceCanvas = entranceBoard.canvas;
  stadium.entranceContext = entranceBoard.context;
  drawScoreboard(stadium);
  return stadium;
}

function kickBall(stadium, kicker) {
  const { config } = stadium;
  const ball = stadium.ball;
  const attackSign = stadium.teams[kicker.teamIndex].attackSign;
  const isShot = stadium.kickCount % 5 === 3;
  const lane = ((stadium.kickCount % 3) - 1) * (isShot ? 0.65 : 2.9);
  const targetX = isShot
    ? THREE.MathUtils.clamp(lane, -config.goalHalfWidth + 0.45, config.goalHalfWidth - 0.45)
    : THREE.MathUtils.clamp(ball.position.x + lane, -config.fieldHalfX + 1.4, config.fieldHalfX - 1.4);
  const targetZ = isShot
    ? attackSign * (config.fieldHalfZ + 3.2)
    : THREE.MathUtils.clamp(ball.position.z + attackSign * (5.2 + (stadium.kickCount % 3) * 1.6), -config.fieldHalfZ + 2, config.fieldHalfZ - 2);
  const direction = new THREE.Vector2(targetX - ball.position.x, targetZ - ball.position.z);
  if (direction.lengthSq() < 0.1) direction.set(lane || 1, attackSign * 4);
  direction.normalize();
  const speed = isShot ? 8.3 : 6.2;
  stadium.ballVelocity.set(direction.x * speed, 0, direction.y * speed);
  stadium.ballVerticalVelocity = isShot ? 1.9 : 0.78;
  stadium.kickCooldown = isShot ? 1.35 : 0.92;
  stadium.kickCount += 1;
  kicker.kickPulse = 0.34;
}

export function updateStadiumMatch(stadium, delta) {
  const { config, ball, ballVelocity } = stadium;
  stadium.elapsed += delta;
  stadium.kickCooldown = Math.max(0, stadium.kickCooldown - delta);
  stadium.goalFlash = Math.max(0, stadium.goalFlash - delta);

  ball.position.x += ballVelocity.x * delta;
  ball.position.z += ballVelocity.z * delta;
  ball.position.y += stadium.ballVerticalVelocity * delta;
  stadium.ballVerticalVelocity -= 8.2 * delta;
  const ballFloor = config.pitchOffset + BALL_RADIUS;
  if (ball.position.y < ballFloor) {
    ball.position.y = ballFloor;
    if (stadium.ballVerticalVelocity < -1.0) stadium.ballVerticalVelocity = -stadium.ballVerticalVelocity * 0.34;
    else stadium.ballVerticalVelocity = 0;
  }
  ballVelocity.x *= Math.exp(-0.38 * delta);
  ballVelocity.z *= Math.exp(-0.38 * delta);

  const goalCrossing = ball.position.z > config.fieldHalfZ + 0.18 || ball.position.z < -config.fieldHalfZ - 0.18;
  if (goalCrossing) {
    const scoringTeam = ball.position.z > 0 ? 0 : 1;
    const insideMouth = Math.abs(ball.position.x) < config.goalHalfWidth - 0.12;
    const underBar = ball.position.y < config.pitchOffset + config.goalHeight - 0.1;
    if (insideMouth && underBar) {
      stadium.score[scoringTeam] += 1;
      stadium.lastScoringTeam = scoringTeam;
      stadium.goalFlash = 2.8;
      ball.position.set(0, ballFloor, 0);
      ballVelocity.set(0, 0, 0);
      stadium.ballVerticalVelocity = 0;
      stadium.kickCooldown = 2.4;
    } else {
      ball.position.z = Math.sign(ball.position.z) * (config.fieldHalfZ - BALL_RADIUS * 0.5);
      ballVelocity.z = -ballVelocity.z * 0.62;
    }
  }
  const sideline = config.fieldHalfX - BALL_RADIUS * 0.7;
  if (ball.position.x > sideline || ball.position.x < -sideline) {
    ball.position.x = THREE.MathUtils.clamp(ball.position.x, -sideline, sideline);
    ballVelocity.x = -ballVelocity.x * 0.62;
  }
  ball.rotation.x += ballVelocity.z * delta / BALL_RADIUS;
  ball.rotation.z -= ballVelocity.x * delta / BALL_RADIUS;
  stadium.ballShadow.position.set(ball.position.x, config.pitchOffset + 0.012, ball.position.z);
  const shadowScale = THREE.MathUtils.clamp(1 - (ball.position.y - ballFloor) * 0.35, 0.54, 1);
  stadium.ballShadow.scale.setScalar(shadowScale);
  stadium.ballShadow.material.opacity = 0.22 * shadowScale;

  let chaser = null;
  let closestDistanceSq = Infinity;
  for (const team of stadium.teams) {
    for (const player of team.players) {
      if (player.isKeeper) continue;
      const dx = ball.position.x - player.group.position.x;
      const dz = ball.position.z - player.group.position.z;
      const distanceSq = dx * dx + dz * dz;
      if (distanceSq < closestDistanceSq) {
        closestDistanceSq = distanceSq;
        chaser = player;
      }
    }
  }

  for (const team of stadium.teams) {
    for (const player of team.players) {
      const position = player.group.position;
      let targetX = player.baseX + THREE.MathUtils.clamp((ball.position.x - player.baseX) * 0.35, -2.8, 2.8);
      let targetZ = player.baseZ + THREE.MathUtils.clamp((ball.position.z - player.baseZ) * 0.34, -3.8, 3.8);
      if (player.isKeeper) {
        const defendZ = -team.attackSign * (config.fieldHalfZ - 1.7);
        targetX = THREE.MathUtils.clamp(ball.position.x * 0.2, -1.8, 1.8);
        targetZ = defendZ;
      } else if (player === chaser) {
        targetX = ball.position.x;
        targetZ = ball.position.z - team.attackSign * 0.64;
      }
      const dx = targetX - position.x;
      const dz = targetZ - position.z;
      const distance = Math.hypot(dx, dz);
      const maxSpeed = player === chaser ? 4.35 : player.isKeeper ? 2.1 : 2.65;
      const step = Math.min(distance, maxSpeed * delta);
      if (distance > 0.025) {
        position.x += dx / distance * step;
        position.z += dz / distance * step;
        const targetYaw = Math.atan2(-dx, -dz);
        const angleDelta = Math.atan2(Math.sin(targetYaw - player.group.rotation.y), Math.cos(targetYaw - player.group.rotation.y));
        player.group.rotation.y += angleDelta * (1 - Math.exp(-9 * delta));
      }
      player.runAmount += (distance > 0.18 ? 1 : 0) - player.runAmount;
      player.runAmount = THREE.MathUtils.clamp(player.runAmount, 0, 1);
      player.kickPulse = Math.max(0, player.kickPulse - delta);
      const gait = Math.sin(stadium.elapsed * 10.5 + player.phase) * 0.52 * player.runAmount;
      player.legs[0].rotation.x = gait + (player.kickPulse > 0 ? -player.kickPulse * 1.8 : 0);
      player.legs[1].rotation.x = -gait;
    }
  }

  if (stadium.kickCooldown <= 0 && chaser && closestDistanceSq < 1.55 * 1.55) kickBall(stadium, chaser);
  stadium.scoreboardAccumulator += delta;
  if (stadium.scoreboardAccumulator >= 0.24) {
    stadium.scoreboardAccumulator = 0;
    drawScoreboard(stadium);
  }
}
