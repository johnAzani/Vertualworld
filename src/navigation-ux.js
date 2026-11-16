import { computePrivateTaxiWaypoints, PRIVATE_TAXI_DESTINATIONS } from './private-taxi.js';
import { BRIDGES_AND_FLYOVERS_LAYOUT } from './world-layout.js';

export const DISTRICT_QUICK_DESTINATIONS = Object.freeze([
  Object.freeze({
    id: 'home',
    taxiDestinationId: 'home',
    shortLabel: 'Home',
    icon: '⌂',
    name: 'Unity Court · House 01',
    districtName: 'Southeast Residential District',
    x: 58.2,
    z: -31.0,
    arrivalRadius: 9.5,
  }),
  Object.freeze({
    id: 'mall',
    taxiDestinationId: 'mall',
    shortLabel: 'Mall',
    icon: '🛍',
    name: 'Unity Grand Indoor Mall',
    districtName: 'Northeast Business District',
    x: 60.8,
    z: 72.0,
    arrivalRadius: 10.5,
  }),
  Object.freeze({
    id: 'hall',
    taxiDestinationId: 'hall',
    shortLabel: 'Gov',
    icon: '🏛',
    name: 'Governor’s Office · Community Hall',
    districtName: 'Northwest Three Arms Zone',
    x: -44.0,
    z: 65.5,
    arrivalRadius: 10.0,
  }),
  Object.freeze({
    id: 'stadium',
    taxiDestinationId: 'stadium',
    shortLabel: 'Stadium',
    icon: '⚽',
    name: 'Abuja Community Stadium',
    districtName: 'Southwest Sports District',
    x: -45.0,
    z: -24.0,
    arrivalRadius: 12.0,
  }),
  Object.freeze({
    id: 'cafe',
    taxiDestinationId: 'cafe',
    shortLabel: 'Café',
    icon: '☕',
    name: 'Civic Café Promenade',
    districtName: 'Northeast Business District',
    x: 41.2,
    z: 68.0,
    arrivalRadius: 9.0,
  }),
  Object.freeze({
    id: 'circle',
    taxiDestinationId: 'circle',
    shortLabel: 'Circle',
    icon: '✦',
    name: 'Unity Circle Fountain Plaza',
    districtName: 'Southern Greenway Plaza',
    x: 18.0,
    z: -53.0,
    arrivalRadius: 9.5,
  }),
]);

export function createNavigationUxState() {
  return {
    activeDestinationId: null,
    sprintEnabled: false,
    lastArrivedDestinationId: null,
  };
}

export function getQuickDestinationById(destinationId) {
  return (
    DISTRICT_QUICK_DESTINATIONS.find((dest) => dest.id === destinationId)
    || PRIVATE_TAXI_DESTINATIONS.find((dest) => dest.id === destinationId)
    || null
  );
}

export function selectNavigationDestination(navState, destinationId) {
  if (!navState) return null;
  if (!destinationId || navState.activeDestinationId === destinationId) {
    navState.activeDestinationId = null;
    return null;
  }
  const dest = getQuickDestinationById(destinationId);
  if (!dest) return null;
  navState.activeDestinationId = dest.id;
  navState.lastArrivedDestinationId = null;
  return dest;
}

export function clearNavigationDestination(navState) {
  if (!navState) return;
  navState.activeDestinationId = null;
}

export function toggleSprintMode(navState, forceValue = undefined) {
  if (!navState) return false;
  navState.sprintEnabled = typeof forceValue === 'boolean' ? forceValue : !navState.sprintEnabled;
  return navState.sprintEnabled;
}

export function computeGpsGuidance(navState, playerX, playerZ, cameraYaw = 0) {
  if (!navState?.activeDestinationId) return null;
  const destination = getQuickDestinationById(navState.activeDestinationId);
  if (!destination) return null;

  const px = Number(playerX) || 0;
  const pz = Number(playerZ) || 0;
  const directDistance = Math.hypot(destination.x - px, destination.z - pz);
  const arrivalRadius = destination.arrivalRadius || 9.5;

  if (directDistance <= arrivalRadius) {
    return {
      arrived: true,
      destination,
      directDistanceMeters: Math.max(0, Math.round(directDistance)),
      routeDistanceMeters: 0,
      nextTarget: { x: destination.x, z: destination.z },
      bearingRadians: 0,
      relativeTurnRadians: 0,
      bridgeNames: [],
      routeSummary: `Arrived at ${destination.name}`,
      etaSprintSeconds: 0,
      etaTaxiSeconds: 0,
      waypoints: [{ x: destination.x, z: destination.z, bridgeId: null }],
    };
  }

  const rawWaypoints = computePrivateTaxiWaypoints(px, pz, destination.x, destination.z);
  // Filter out waypoints already behind or within 7m of the player (except the final destination)
  const remainingWaypoints = rawWaypoints.filter(
    (wp, idx) => idx === rawWaypoints.length - 1 || Math.hypot(wp.x - px, wp.z - pz) > 7.5,
  );
  const nextTarget = remainingWaypoints[0] || { x: destination.x, z: destination.z };

  let routeDistance = 0;
  let prevX = px;
  let prevZ = pz;
  for (const wp of remainingWaypoints) {
    routeDistance += Math.hypot(wp.x - prevX, wp.z - prevZ);
    prevX = wp.x;
    prevZ = wp.z;
  }

  const bridgeIds = [...new Set(rawWaypoints.map((wp) => wp.bridgeId).filter(Boolean))];
  const bridgeNames = bridgeIds
    .map((id) => BRIDGES_AND_FLYOVERS_LAYOUT.find((b) => b.id === id)?.shortName)
    .filter(Boolean);

  // World movement forward for yaw=0 is (0, -1), right is (1, 0)
  const dx = nextTarget.x - px;
  const dz = nextTarget.z - pz;
  const bearingRadians = Math.atan2(dx, -dz);
  const relativeTurnRadians = Math.atan2(
    Math.sin(bearingRadians - cameraYaw),
    Math.cos(bearingRadians - cameraYaw),
  );

  const routeDistanceMeters = Math.max(1, Math.round(routeDistance));
  const etaSprintSeconds = Math.max(2, Math.round(routeDistance / 9.0));
  const etaTaxiSeconds = Math.max(2, Math.round(routeDistance / 24.0));
  const routeSummary = bridgeNames.length > 0
    ? `Via ${bridgeNames.join(' & ')}`
    : destination.districtName || 'Direct Boulevard Route';

  return {
    arrived: false,
    destination,
    directDistanceMeters: Math.max(1, Math.round(directDistance)),
    routeDistanceMeters,
    nextTarget,
    bearingRadians,
    relativeTurnRadians,
    bridgeNames,
    routeSummary,
    etaSprintSeconds,
    etaTaxiSeconds,
    waypoints: remainingWaypoints,
  };
}

export function findNearestQuickDestination(worldX, worldZ, maxDistance = 36) {
  let best = null;
  let bestDist = maxDistance;
  for (const dest of DISTRICT_QUICK_DESTINATIONS) {
    const d = Math.hypot(worldX - dest.x, worldZ - dest.z);
    if (d < bestDist) {
      best = dest;
      bestDist = d;
    }
  }
  return best;
}
