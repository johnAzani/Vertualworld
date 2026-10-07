import * as THREE from 'three';

export const PRIVATE_TAXI_DESTINATIONS = Object.freeze([
  Object.freeze({
    id: 'mall',
    name: 'Unity Grand Indoor Mall & Lockup Shops',
    shortName: 'Unity Grand Mall',
    category: 'Shopping · 6 Walk-In Lockup Shops',
    summary: 'Front Taxi Forecourt right outside the 6.2m Grand Entrance Portal',
    x: 51.8,
    z: 36.8,
    dropOffYaw: -Math.PI / 2,
  }),
  Object.freeze({
    id: 'mall-parking',
    name: 'Unity Mall Customer & VIP Parking Lot',
    shortName: 'Mall Parking Lot',
    category: 'Mall Parking Bays VIP P-01 to P-06',
    summary: 'Direct drop-off inside the Unity Grand Mall paved parking lot',
    x: 60.4,
    z: 18.8,
    dropOffYaw: Math.PI / 2,
  }),
  Object.freeze({
    id: 'home',
    name: 'Unity Court · House 01 (Your Home)',
    shortName: 'House 01 · Unity Court',
    category: 'Residence & Driveway',
    summary: 'Front porch and driveway at House 01 in Unity Court',
    x: 24.2,
    z: 1.0,
    dropOffYaw: Math.PI / 2,
  }),
  Object.freeze({
    id: 'stadium',
    name: 'Abuja Community Stadium & VIP Parking',
    shortName: 'Community Stadium',
    category: 'Live Football Arena & VIP Lounge',
    summary: 'East Gate VIP & Matchday Parking Lot entrance',
    x: -44.5,
    z: 18.0,
    dropOffYaw: Math.PI / 2,
  }),
  Object.freeze({
    id: 'hall',
    name: 'Unity Community Hall · Governor’s Office',
    shortName: 'Governor’s Office',
    category: 'Civic Government & Treasury',
    summary: 'Governor’s Boulevard plaza in front of Community Hall',
    x: 10.0,
    z: 27.6,
    dropOffYaw: 0,
  }),
  Object.freeze({
    id: 'cafe',
    name: 'Civic Café · Promenade',
    shortName: 'Civic Café',
    category: 'Coffee, Suya & Neighbourhood Social',
    summary: 'Curbside drop-off outside Civic Café',
    x: 35.2,
    z: 33.0,
    dropOffYaw: Math.PI / 2,
  }),
  Object.freeze({
    id: 'circle',
    name: 'Unity Circle · Central Fountain Plaza',
    shortName: 'Unity Circle',
    category: 'Southern Landmark & Transit Plaza',
    summary: 'Unity Circle overlook promenade',
    x: 5.5,
    z: -24.5,
    dropOffYaw: 0,
  }),
]);

export const PRIVATE_TAXI_DRIVER = Object.freeze({
  name: 'Driver Ibrahim Musa',
  vehicleModel: 'Abuja Executive Emerald & Gold Sedan',
  plateNumber: 'ABJ-804-TX',
  rating: '4.98 ★',
});

export const PRIVATE_TAXI_APPROACH_SPEED = 12.5;
export const PRIVATE_TAXI_RIDE_SPEED = 15.2;
export const PRIVATE_TAXI_PICKUP_STOP_DISTANCE = 3.1;
export const PRIVATE_TAXI_BOARD_RADIUS = 5.4;
export const PRIVATE_TAXI_DROPOFF_STOP_DISTANCE = 2.2;

export function getPrivateTaxiDestination(destinationId) {
  return (
    PRIVATE_TAXI_DESTINATIONS.find((dest) => dest.id === destinationId)
    || PRIVATE_TAXI_DESTINATIONS[0]
  );
}

export function getPrivateTaxiQuote(playerX, playerZ, destinationId) {
  const destination = getPrivateTaxiDestination(destinationId);
  const distance = Math.hypot((Number(playerX) || 0) - destination.x, (Number(playerZ) || 0) - destination.z);
  const distanceMeters = Math.max(1, Math.round(distance));
  const fare = Math.max(10, Math.min(45, Math.round(10 + distance * 0.28)));
  const etaSeconds = Math.max(3, Math.round(distance / PRIVATE_TAXI_RIDE_SPEED) + 2);
  return {
    destination,
    distanceMeters,
    fare,
    etaSeconds,
  };
}

export function createPrivateTaxiState() {
  return {
    status: 'idle', // 'idle' | 'approaching' | 'arrived' | 'en-route'
    x: 56.4,
    z: 21.6,
    yaw: 0,
    speed: 0,
    steering: 0,
    selectedDestinationId: PRIVATE_TAXI_DESTINATIONS[0].id,
    pickupX: 56.4,
    pickupZ: 21.6,
    pickupLabel: 'Unity Mall Parking Lot',
    quotedFare: 0,
    farePaid: false,
    tripsCompleted: 0,
  };
}

export function orderPrivateTaxi(
  taxiState,
  {
    playerX = 0,
    playerZ = 0,
    destinationId = taxiState?.selectedDestinationId || 'mall',
    locationLabel = 'Current Location',
  } = {},
) {
  if (!taxiState) return { ok: false, reason: 'invalid-state' };
  if (taxiState.status === 'en-route') {
    return { ok: false, reason: 'already-riding' };
  }
  const destination = getPrivateTaxiDestination(destinationId);
  const quote = getPrivateTaxiQuote(playerX, playerZ, destination.id);
  taxiState.selectedDestinationId = destination.id;
  taxiState.pickupX = Number(playerX) || 0;
  taxiState.pickupZ = Number(playerZ) || 0;
  taxiState.pickupLabel = String(locationLabel || 'Current Location').slice(0, 48);
  taxiState.quotedFare = quote.fare;
  taxiState.farePaid = false;

  // If the taxi is very far away (> 28m), dispatch it from an approach point ~20m away so the player sees it drive up promptly
  const currentDist = Math.hypot(taxiState.x - taxiState.pickupX, taxiState.z - taxiState.pickupZ);
  if (currentDist > 28) {
    const angle = Math.atan2(taxiState.x - taxiState.pickupX, taxiState.z - taxiState.pickupZ);
    const spawnDist = 20;
    taxiState.x = Math.max(-78, Math.min(78, taxiState.pickupX + Math.sin(angle) * spawnDist));
    taxiState.z = Math.max(-78, Math.min(78, taxiState.pickupZ + Math.cos(angle) * spawnDist));
  }

  const distAfterDispatch = Math.hypot(taxiState.x - taxiState.pickupX, taxiState.z - taxiState.pickupZ);
  if (distAfterDispatch <= PRIVATE_TAXI_PICKUP_STOP_DISTANCE + 0.35) {
    taxiState.status = 'arrived';
    taxiState.speed = 0;
  } else {
    taxiState.status = 'approaching';
    taxiState.speed = PRIVATE_TAXI_APPROACH_SPEED;
  }

  return {
    ok: true,
    status: taxiState.status,
    destination,
    quote,
  };
}

export function cancelPrivateTaxi(taxiState) {
  if (!taxiState || taxiState.status === 'en-route') {
    return { ok: false, reason: 'cannot-cancel' };
  }
  taxiState.status = 'idle';
  taxiState.speed = 0;
  taxiState.steering = 0;
  return { ok: true };
}

export function isPlayerNearPrivateTaxi(taxiState, playerX, playerZ, maxDistance = PRIVATE_TAXI_BOARD_RADIUS) {
  if (!taxiState) return false;
  return Math.hypot((Number(playerX) || 0) - taxiState.x, (Number(playerZ) || 0) - taxiState.z) <= maxDistance;
}

export function boardPrivateTaxi(taxiState, economy = null, now = Date.now()) {
  if (!taxiState) return { ok: false, reason: 'invalid-state' };
  if (taxiState.status !== 'arrived' && taxiState.status !== 'approaching') {
    return { ok: false, reason: 'not-ordered' };
  }
  const destination = getPrivateTaxiDestination(taxiState.selectedDestinationId);
  const quote = getPrivateTaxiQuote(taxiState.x, taxiState.z, destination.id);
  const fare = taxiState.quotedFare > 0 ? taxiState.quotedFare : quote.fare;
  let chargedFare = 0;
  if (economy && typeof economy.wallet === 'number') {
    if (economy.wallet >= fare) {
      economy.wallet -= fare;
      chargedFare = fare;
      if (Array.isArray(economy.ledger)) {
        economy.ledger.unshift({
          id: `tx-taxi-${now}`,
          description: `Abuja Private Taxi to ${destination.shortName}`,
          amount: -fare,
          occurredAt: now,
        });
        if (economy.ledger.length > 24) economy.ledger.length = 24;
      }
    }
  }
  taxiState.farePaid = true;
  taxiState.status = 'en-route';
  taxiState.speed = PRIVATE_TAXI_RIDE_SPEED;
  return {
    ok: true,
    destination,
    chargedFare,
    courtesyRide: chargedFare === 0,
  };
}

export function completePrivateTaxiRide(taxiState) {
  if (!taxiState || taxiState.status !== 'en-route') {
    return { ok: false, reason: 'not-en-route' };
  }
  const destination = getPrivateTaxiDestination(taxiState.selectedDestinationId);
  taxiState.x = destination.x;
  taxiState.z = destination.z;
  taxiState.yaw = destination.dropOffYaw;
  taxiState.speed = 0;
  taxiState.steering = 0;
  taxiState.status = 'idle';
  taxiState.tripsCompleted = (taxiState.tripsCompleted || 0) + 1;

  // Compute safe passenger exit point right beside the taxi door
  const exitOffsetX = -Math.cos(taxiState.yaw) * 1.95;
  const exitOffsetZ = Math.sin(taxiState.yaw) * 1.95;
  return {
    ok: true,
    destination,
    exitX: destination.x + exitOffsetX,
    exitZ: destination.z + exitOffsetZ,
    exitYaw: destination.dropOffYaw,
  };
}

export function updatePrivateTaxi(
  taxiState,
  delta,
  { playerX = 0, playerZ = 0, groundHeightAt = null, taxiMesh = null } = {},
) {
  if (!taxiState) return { event: null };
  const dt = Math.max(0, Math.min(0.1, Number(delta) || 0));
  let event = null;

  if (taxiState.status === 'approaching') {
    // Dynamically track the player's current position so the taxi always meets them where they are standing
    taxiState.pickupX = Number(playerX) || taxiState.pickupX;
    taxiState.pickupZ = Number(playerZ) || taxiState.pickupZ;
    const dx = taxiState.pickupX - taxiState.x;
    const dz = taxiState.pickupZ - taxiState.z;
    const dist = Math.hypot(dx, dz);

    if (dist <= PRIVATE_TAXI_PICKUP_STOP_DISTANCE) {
      taxiState.status = 'arrived';
      taxiState.speed = 0;
      taxiState.steering = 0;
      event = 'arrived-at-pickup';
    } else {
      const targetYaw = Math.atan2(-dx, -dz);
      const angleDiff = Math.atan2(Math.sin(targetYaw - taxiState.yaw), Math.cos(targetYaw - taxiState.yaw));
      taxiState.yaw += angleDiff * Math.min(1, dt * 8.5);
      taxiState.steering = Math.max(-0.42, Math.min(0.42, angleDiff * 0.7));
      const stepDist = Math.min(dist - PRIVATE_TAXI_PICKUP_STOP_DISTANCE + 0.05, PRIVATE_TAXI_APPROACH_SPEED * dt);
      taxiState.x += (dx / dist) * stepDist;
      taxiState.z += (dz / dist) * stepDist;
      taxiState.speed = PRIVATE_TAXI_APPROACH_SPEED;
    }
  } else if (taxiState.status === 'en-route') {
    const destination = getPrivateTaxiDestination(taxiState.selectedDestinationId);
    const dx = destination.x - taxiState.x;
    const dz = destination.z - taxiState.z;
    const dist = Math.hypot(dx, dz);

    if (dist <= PRIVATE_TAXI_DROPOFF_STOP_DISTANCE) {
      const completion = completePrivateTaxiRide(taxiState);
      event = 'arrived-at-destination';
      if (taxiMesh) {
        syncPrivateTaxiMesh(taxiState, taxiMesh, dt, groundHeightAt);
      }
      return { event, completion };
    }

    const targetYaw = Math.atan2(-dx, -dz);
    const angleDiff = Math.atan2(Math.sin(targetYaw - taxiState.yaw), Math.cos(targetYaw - taxiState.yaw));
    taxiState.yaw += angleDiff * Math.min(1, dt * 9.0);
    taxiState.steering = Math.max(-0.42, Math.min(0.42, angleDiff * 0.7));
    const stepDist = Math.min(dist, PRIVATE_TAXI_RIDE_SPEED * dt);
    taxiState.x += (dx / dist) * stepDist;
    taxiState.z += (dz / dist) * stepDist;
    taxiState.speed = PRIVATE_TAXI_RIDE_SPEED;
  } else {
    taxiState.speed = 0;
    taxiState.steering = 0;
  }

  if (taxiMesh) {
    syncPrivateTaxiMesh(taxiState, taxiMesh, dt, groundHeightAt);
  }

  return { event };
}

function makeTaxiRoofSignTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 84;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#f6c344';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1b4332';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
    ctx.fillStyle = '#142a20';
    ctx.font = '800 38px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TAXI · ABJ', canvas.width / 2, canvas.height / 2 + 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createPrivateTaxiMesh() {
  const group = new THREE.Group();
  group.name = 'AbujaPrivateTaxi';

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f6e54,
    roughness: 0.42,
    metalness: 0.16,
  });
  const goldTrimMaterial = new THREE.MeshStandardMaterial({
    color: 0xf0be49,
    roughness: 0.36,
    metalness: 0.22,
  });
  const cabinMaterial = new THREE.MeshStandardMaterial({
    color: 0xf7f2e4,
    roughness: 0.5,
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x8cc3be,
    roughness: 0.18,
    metalness: 0.1,
    transparent: true,
    opacity: 0.72,
  });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: 0x2f3533, roughness: 0.78 });
  const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x232625, roughness: 0.9 });
  const hubMaterial = new THREE.MeshStandardMaterial({ color: 0xefe3c2, roughness: 0.45, metalness: 0.25 });
  const headLightMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff5d6,
    emissive: 0xffd56b,
    emissiveIntensity: 0.65,
    roughness: 0.25,
  });
  const tailLightMaterial = new THREE.MeshStandardMaterial({
    color: 0xe3624d,
    emissive: 0xb8321e,
    emissiveIntensity: 0.45,
    roughness: 0.35,
  });
  const roofSignTexture = makeTaxiRoofSignTexture();
  const roofBeaconMaterial = new THREE.MeshStandardMaterial({
    color: 0xf6c344,
    emissive: 0xd49619,
    emissiveIntensity: 0.55,
    roughness: 0.3,
    map: roofSignTexture || null,
  });

  const addPart = (w, h, d, mat, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // Lower chassis, executive emerald body, and gold taxi side stripes
  addPart(1.94, 0.2, 4.18, trimMaterial, 0, 0.27, 0);
  addPart(1.88, 0.48, 3.92, bodyMaterial, 0, 0.54, 0);
  addPart(1.91, 0.12, 3.66, goldTrimMaterial, 0, 0.58, 0);
  addPart(1.62, 0.48, 2.04, cabinMaterial, 0, 0.98, 0.08);
  addPart(1.68, 0.4, 1.88, glassMaterial, 0, 0.97, 0.08);

  // Illuminated rooftop TAXI beacon
  const roofPedestal = addPart(0.56, 0.08, 0.28, trimMaterial, 0, 1.24, -0.05);
  const roofBeacon = addPart(0.84, 0.26, 0.32, roofBeaconMaterial, 0, 1.39, -0.05);

  // Bumpers, headlights, and taillights
  addPart(1.76, 0.12, 0.16, trimMaterial, 0, 0.36, -2.04);
  addPart(1.76, 0.12, 0.16, trimMaterial, 0, 0.36, 2.04);
  for (const side of [-0.62, 0.62]) {
    addPart(0.28, 0.13, 0.08, headLightMaterial, side, 0.55, -1.98);
    addPart(0.28, 0.13, 0.08, tailLightMaterial, side, 0.55, 1.98);
  }

  // 4 Articulated wheels
  const wheelPivots = [];
  const wheelGeometry = new THREE.CylinderGeometry(0.32, 0.32, 0.26, 18);
  wheelGeometry.rotateZ(Math.PI / 2);
  const hubGeometry = new THREE.CylinderGeometry(0.16, 0.16, 0.28, 12);
  hubGeometry.rotateZ(Math.PI / 2);

  for (const [x, z, isFront] of [
    [-0.95, -1.24, true],
    [0.95, -1.24, true],
    [-0.95, 1.24, false],
    [0.95, 1.24, false],
  ]) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.32, z);
    const tire = new THREE.Mesh(wheelGeometry, tireMaterial);
    const hub = new THREE.Mesh(hubGeometry, hubMaterial);
    tire.castShadow = true;
    pivot.add(tire, hub);
    group.add(pivot);
    wheelPivots.push({ pivot, tire, isFront });
  }

  return {
    group,
    wheelPivots,
    roofBeacon,
    roofPedestal,
    roofBeaconMaterial,
  };
}

export function syncPrivateTaxiMesh(taxiState, taxiMesh, delta = 0, groundHeightAt = null) {
  if (!taxiState || !taxiMesh?.group) return;
  const surfaceY = typeof groundHeightAt === 'function' ? groundHeightAt(taxiState.x, taxiState.z) : 0;
  taxiMesh.group.position.set(taxiState.x, surfaceY, taxiState.z);
  taxiMesh.group.rotation.y = taxiState.yaw;

  if (Array.isArray(taxiMesh.wheelPivots)) {
    for (const wheel of taxiMesh.wheelPivots) {
      wheel.pivot.rotation.y = wheel.isFront ? taxiState.steering : 0;
      if (taxiState.speed > 0.05 && delta > 0) {
        wheel.tire.rotation.x -= (taxiState.speed * delta) / 0.32;
      }
    }
  }

  if (taxiMesh.roofBeaconMaterial) {
    taxiMesh.roofBeaconMaterial.emissiveIntensity =
      taxiState.status === 'arrived'
        ? 0.95
        : taxiState.status === 'approaching' || taxiState.status === 'en-route'
          ? 0.72
          : 0.35;
  }
}
