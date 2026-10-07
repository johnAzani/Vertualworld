import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { resolveDiscAgainstOrientedBox } from '../src/collision.js';
import {
  BUS_ROUTE_XZ,
  BUS_TERMINAL_LAYOUT,
  createPlanarCurve,
  RAIL_ROUTE_XZ,
  ROAD_NETWORK_LAYOUT,
  STATION_LAYOUT,
} from '../src/transport.js';
import {
  COMMUNITY_HALL_LAYOUT,
  COMMERCE_VENUE_COLLIDER,
  COMMERCE_VENUE_LAYOUT,
  ESTATE_HOUSE_COLLISION_MARGIN,
  ESTATE_HOUSE_LAYOUT,
  ESTATE_HOUSE_SIZE,
} from '../src/world-layout.js';

function distanceToPolyline(x, z, points) {
  let nearest = Infinity;
  for (let index = 0; index < points.length - 1; index += 1) {
    const [ax, az] = points[index];
    const [bx, bz] = points[index + 1];
    const dx = bx - ax;
    const dz = bz - az;
    const lengthSquared = dx * dx + dz * dz;
    const t = lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / lengthSquared));
    nearest = Math.min(nearest, Math.hypot(x - (ax + dx * t), z - (az + dz * t)));
  }
  return nearest;
}

function localToWorld(box, localX, localZ) {
  const cosine = Math.cos(box.yaw);
  const sine = Math.sin(box.yaw);
  return {
    x: box.x + localX * cosine + localZ * sine,
    z: box.z - localX * sine + localZ * cosine,
  };
}

function worldToLocal(box, x, z) {
  const offsetX = x - box.x;
  const offsetZ = z - box.z;
  const cosine = Math.cos(box.yaw);
  const sine = Math.sin(box.yaw);
  return {
    x: offsetX * cosine - offsetZ * sine,
    z: offsetX * sine + offsetZ * cosine,
  };
}

function distanceFromBox(local, box) {
  const nearestX = Math.max(-box.halfX, Math.min(box.halfX, local.x));
  const nearestZ = Math.max(-box.halfZ, Math.min(box.halfZ, local.z));
  return Math.hypot(local.x - nearestX, local.z - nearestZ);
}

function getStaticBuildingBounds() {
  const houses = ESTATE_HOUSE_LAYOUT.map((house) => ({
    id: `House ${String(house.number).padStart(2, '0')}`,
    x: house.x,
    z: house.z,
    yaw: house.facing,
    halfX: ESTATE_HOUSE_SIZE.width / 2 + ESTATE_HOUSE_COLLISION_MARGIN,
    halfZ: ESTATE_HOUSE_SIZE.depth / 2 + ESTATE_HOUSE_COLLISION_MARGIN,
  }));
  const venues = COMMERCE_VENUE_LAYOUT.map((venue) => {
    const collider = venue.collider ?? COMMERCE_VENUE_COLLIDER;
    const center = localToWorld({ ...venue, yaw: venue.facing }, collider.localX, collider.localZ);
    return {
      id: venue.name,
      ...center,
      yaw: venue.facing,
      halfX: collider.halfX,
      halfZ: collider.halfZ,
    };
  });
  const hall = {
    id: COMMUNITY_HALL_LAYOUT.name,
    x: COMMUNITY_HALL_LAYOUT.x,
    z: COMMUNITY_HALL_LAYOUT.z,
    yaw: COMMUNITY_HALL_LAYOUT.facing,
    halfX: COMMUNITY_HALL_LAYOUT.halfX,
    halfZ: COMMUNITY_HALL_LAYOUT.halfZ,
  };
  return [...houses, ...venues, hall];
}

function boxAxes(yaw) {
  return [
    new THREE.Vector2(Math.cos(yaw), -Math.sin(yaw)),
    new THREE.Vector2(Math.sin(yaw), Math.cos(yaw)),
  ];
}

function orientedBoxesOverlap(centerA, axesA, halfA, centerB, axesB, halfB) {
  for (const axis of [...axesA, ...axesB]) {
    const radiusA = halfA[0] * Math.abs(axis.dot(axesA[0]))
      + halfA[1] * Math.abs(axis.dot(axesA[1]));
    const radiusB = halfB[0] * Math.abs(axis.dot(axesB[0]))
      + halfB[1] * Math.abs(axis.dot(axesB[1]));
    if (Math.abs(centerB.clone().sub(centerA).dot(axis)) > radiusA + radiusB) return false;
  }
  return true;
}

function assertRouteClearsBuildings(routeName, points, closed, halfLength, halfWidth) {
  const curve = createPlanarCurve(points, closed);
  const buildings = getStaticBuildingBounds();
  const sampleCount = Math.ceil(curve.getLength() / 0.2);
  for (let index = 0; index <= sampleCount; index += 1) {
    const fraction = index / sampleCount;
    const point = curve.getPointAt(fraction);
    const tangent = curve.getTangentAt(fraction).setY(0).normalize();
    const vehicleCenter = new THREE.Vector2(point.x, point.z);
    const vehicleAxes = [
      new THREE.Vector2(tangent.x, tangent.z),
      new THREE.Vector2(-tangent.z, tangent.x),
    ];
    for (const building of buildings) {
      const overlaps = orientedBoxesOverlap(
        vehicleCenter,
        vehicleAxes,
        [halfLength, halfWidth],
        new THREE.Vector2(building.x, building.z),
        boxAxes(building.yaw),
        [building.halfX, building.halfZ],
      );
      assert.equal(
        overlaps,
        false,
        `${routeName} overlaps ${building.id} near route fraction ${fraction.toFixed(4)}`,
      );
    }
  }
}

test('bus and rail curves stay clear of every residence, café, market, and community hall', () => {
  assertRouteClearsBuildings('bus', BUS_ROUTE_XZ, false, 2.98, 1.05);
  assertRouteClearsBuildings('train', RAIL_ROUTE_XZ, true, 3.25, 0.96);
});

test('local streets meet the bus-road spine without endpoint gaps', () => {
  const spine = ROAD_NETWORK_LAYOUT[0].points;
  for (const road of ROAD_NETWORK_LAYOUT.slice(1)) {
    for (const point of [road.points[0], road.points.at(-1)]) {
      assert.ok(
        distanceToPolyline(point[0], point[1], spine) <= 1e-6,
        `road endpoint (${point.join(', ')}) is not joined to the bus-road spine`,
      );
    }
  }
});

test('Unity Community Hall and its shaded approach keep clear of every connected road surface', () => {
  const hall = {
    x: COMMUNITY_HALL_LAYOUT.x,
    z: COMMUNITY_HALL_LAYOUT.z,
    yaw: COMMUNITY_HALL_LAYOUT.facing,
    halfX: COMMUNITY_HALL_LAYOUT.halfX,
    halfZ: 4.4,
  };
  for (const road of ROAD_NETWORK_LAYOUT) {
    const curve = createPlanarCurve(road.points);
    const sampleCount = Math.ceil(curve.getLength() / 0.15);
    for (let index = 0; index <= sampleCount; index += 1) {
      const point = curve.getPointAt(index / sampleCount);
      const clearance = distanceFromBox(worldToLocal(hall, point.x, point.z), hall);
      assert.ok(
        clearance >= road.halfWidth + 0.2,
        `${COMMUNITY_HALL_LAYOUT.name} is too close to a road surface (${clearance.toFixed(2)} units)`,
      );
    }
  }
});

test('rail stations and bus terminals remain connected at the shared road stops', () => {
  const busCurve = createPlanarCurve(BUS_ROUTE_XZ, false);
  const railCurve = createPlanarCurve(RAIL_ROUTE_XZ, true);
  const busSamples = Array.from({ length: 5001 }, (_, index) => busCurve.getPointAt(index / 5000));
  const railSamples = Array.from({ length: 7001 }, (_, index) => railCurve.getPointAt(index / 7000));

  for (const terminal of BUS_TERMINAL_LAYOUT) {
    const [x, z] = terminal.roadPoint;
    const distance = Math.min(...busSamples.map((point) => Math.hypot(point.x - x, point.z - z)));
    assert.ok(distance <= 0.2, `${terminal.name} bus stop must touch the bus route`);
  }

  for (const station of STATION_LAYOUT) {
    const [railX, railZ] = station.railPoint;
    const railDistance = Math.min(...railSamples.map((point) => Math.hypot(point.x - railX, point.z - railZ)));
    assert.ok(railDistance <= 0.2, `${station.name} must sit on the rail curve`);
    const busTerminal = BUS_TERMINAL_LAYOUT.find((terminal) => terminal.name === station.name);
    assert.ok(busTerminal, `${station.name} needs a matching bus terminal`);
    const accessDistance = Math.hypot(
      station.accessPoint[0] - busTerminal.roadPoint[0],
      station.accessPoint[1] - busTerminal.roadPoint[1],
    );
    assert.ok(accessDistance <= 2, `${station.name} rail walkway must meet its bus-stop paving`);
  }

  const crossing = [47, 33];
  const roadDistance = Math.min(...busSamples.map((point) => Math.hypot(point.x - crossing[0], point.z - crossing[1])));
  const railDistance = Math.min(...railSamples.map((point) => Math.hypot(point.x - crossing[0], point.z - crossing[1])));
  assert.ok(roadDistance <= 0.2 && railDistance <= 0.2, 'the north-east road/rail crossing should meet at the marked junction');
});

test('walking collision keeps the player outside rotated house walls', () => {
  const radius = 0.42;
  for (const house of ESTATE_HOUSE_LAYOUT) {
    const box = {
      x: house.x,
      z: house.z,
      yaw: house.facing,
      halfX: ESTATE_HOUSE_SIZE.width / 2 + ESTATE_HOUSE_COLLISION_MARGIN,
      halfZ: ESTATE_HOUSE_SIZE.depth / 2 + ESTATE_HOUSE_COLLISION_MARGIN,
    };
    const start = localToWorld(box, 0, -8);
    const position = { x: start.x, z: start.z };
    const localForward = { x: Math.sin(house.facing), z: Math.cos(house.facing) };

    for (let step = 0; step < 100; step += 1) {
      position.x += localForward.x * 0.12;
      position.z += localForward.z * 0.12;
      resolveDiscAgainstOrientedBox(position, box, radius);
      const local = worldToLocal(box, position.x, position.z);
      assert.ok(distanceFromBox(local, box) >= radius - 1e-6, `player entered House ${house.number} through its wall`);
    }

    const stopped = worldToLocal(box, position.x, position.z);
    assert.ok(stopped.z <= -box.halfZ - radius + 1e-6, `player should stop at House ${house.number}'s front wall`);
  }
});

test('walking collision also blocks the rotated café and market corners', () => {
  const radius = 0.42;
  for (const venue of COMMERCE_VENUE_LAYOUT) {
    const box = getStaticBuildingBounds().find((building) => building.id === venue.name);
    const position = localToWorld(box, box.halfX + 0.2, box.halfZ + 0.2);
    const contact = resolveDiscAgainstOrientedBox(position, box, radius);
    assert.ok(contact, `${venue.name} corner should contact the player collider`);
    assert.ok(distanceFromBox(worldToLocal(box, position.x, position.z), box) >= radius - 1e-6);
  }
});

test('walking collision also blocks the Unity Community Hall walls', () => {
  const box = {
    x: COMMUNITY_HALL_LAYOUT.x,
    z: COMMUNITY_HALL_LAYOUT.z,
    yaw: COMMUNITY_HALL_LAYOUT.facing,
    halfX: COMMUNITY_HALL_LAYOUT.halfX,
    halfZ: COMMUNITY_HALL_LAYOUT.halfZ,
  };
  const position = localToWorld(box, box.halfX + 0.2, box.halfZ + 0.2);
  const contact = resolveDiscAgainstOrientedBox(position, box, 0.42);
  assert.ok(contact, 'Unity Community Hall corner should contact the player collider');
  assert.ok(distanceFromBox(worldToLocal(box, position.x, position.z), box) >= 0.42 - 1e-6);
});
