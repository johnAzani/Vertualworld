import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { resolveDiscAgainstOrientedBox } from '../src/collision.js';
import {
  BUS_ROUTE_XZ,
  BUS_TERMINAL_LAYOUT,
  CROSSWALK_LAYOUT,
  createPlanarCurve,
  RAIL_ROUTE_XZ,
  ROAD_NETWORK_LAYOUT,
  ROUNDABOUT_LAYOUT,
  STATION_LAYOUT,
} from '../src/transport.js';
import {
  ABUJA_RIVER_WATERWAY_POINTS,
  BILLBOARD_LAYOUT,
  BRIDGES_AND_FLYOVERS_LAYOUT,
  COMMUNITY_HALL_LAYOUT,
  COMMERCE_VENUE_COLLIDER,
  COMMERCE_VENUE_LAYOUT,
  ESTATE_HOUSE_COLLISION_MARGIN,
  ESTATE_HOUSE_LAYOUT,
  ESTATE_HOUSE_SIZE,
  MALL_LOCKUP_SHOP_LAYOUT,
  MALL_SHOP_BAY_LAYOUT,
  getBridgeFlyoverAt,
  getBridgeFlyoverGuardrailColliders,
  getBridgeFlyoverSurfaceHeight,
  getMallIndoorWallColliders,
  getMallLockupShopAt,
  isInsideMallBuilding,
  mallLocalToWorld,
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
  const billboards = BILLBOARD_LAYOUT.map((billboard) => ({
    id: billboard.name,
    x: billboard.x,
    z: billboard.z,
    yaw: billboard.facing,
    halfX: billboard.halfX,
    halfZ: billboard.halfZ,
  }));
  return [...houses, ...venues, hall, ...billboards];
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
  assert.equal(ROAD_NETWORK_LAYOUT.length, 7, 'Abuja road network includes the outer ring plus 6 district connector boulevards');
  const spine = ROAD_NETWORK_LAYOUT[0].points;
  for (const road of ROAD_NETWORK_LAYOUT.slice(1)) {
    for (const point of [road.points[0], road.points.at(-1)]) {
      assert.ok(
        distanceToPolyline(point[0], point[1], spine) <= 1e-6,
        `road endpoint (${point.join(', ')}) is not joined to the bus-road spine`,
      );
    }
  }

  assert.equal(ROUNDABOUT_LAYOUT.length, 5, '5 planted Abuja traffic roundabouts sit at district junctions');
  for (const rb of ROUNDABOUT_LAYOUT) {
    assert.ok(
      distanceToPolyline(rb.x, rb.z, spine) <= 1e-6,
      `roundabout ${rb.name} must sit directly on the main arterial ring`,
    );
  }

  assert.equal(CROSSWALK_LAYOUT.length, 6, '6 zebra pedestrian crosswalks serve all district hubs');
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

  const riverCurve = createPlanarCurve(ABUJA_RIVER_WATERWAY_POINTS, false);
  const riverSamples = Array.from({ length: 2001 }, (_, index) => riverCurve.getPointAt(index / 2000));

  for (const structure of BRIDGES_AND_FLYOVERS_LAYOUT) {
    const roadDistance = Math.min(
      ...busSamples.map((point) => Math.hypot(point.x - structure.x, point.z - structure.z)),
    );
    assert.ok(roadDistance <= 0.2, `${structure.name} should sit directly on the main bus highway`);
    if (structure.kind === 'flyover') {
      const railDistance = Math.min(
        ...railSamples.map((point) => Math.hypot(point.x - structure.x, point.z - structure.z)),
      );
      assert.ok(railDistance <= 0.2, `${structure.name} should cross directly above the rail corridor`);
    }
    if (structure.kind === 'bridge') {
      const riverDistance = Math.min(
        ...riverSamples.map((point) => Math.hypot(point.x - structure.x, point.z - structure.z)),
      );
      assert.ok(riverDistance <= 0.3, `${structure.name} should span the Abuja river waterway`);
    }
  }
});

test('residential area, business area, and government area are far apart in distinct districts connected by bridges and flyovers', () => {
  const mall = COMMERCE_VENUE_LAYOUT.find((venue) => venue.id === 'market');
  const cafe = COMMERCE_VENUE_LAYOUT.find((venue) => venue.id === 'cafe');
  assert.ok(mall && cafe);

  // Pairwise separation between Residential Area, Business Area, and Government Area
  for (const house of ESTATE_HOUSE_LAYOUT) {
    const distToMall = Math.hypot(house.x - mall.x, house.z - mall.z);
    const distToCafe = Math.hypot(house.x - cafe.x, house.z - cafe.z);
    const distToGov = Math.hypot(house.x - COMMUNITY_HALL_LAYOUT.x, house.z - COMMUNITY_HALL_LAYOUT.z);
    assert.ok(
      distToMall >= 85 && distToCafe >= 80,
      `House ${house.number} in the Residential Area must be far from the Business Area (got ${distToMall.toFixed(1)}m / ${distToCafe.toFixed(1)}m)`,
    );
    assert.ok(
      distToGov >= 120,
      `House ${house.number} in the Residential Area must be far from the Government Area (got ${distToGov.toFixed(1)}m)`,
    );
  }

  const businessToGovDistance = Math.hypot(
    mall.x - COMMUNITY_HALL_LAYOUT.x,
    mall.z - COMMUNITY_HALL_LAYOUT.z,
  );
  assert.ok(
    businessToGovDistance >= 100,
    `Business Area (Unity Mall) must be far from the Government Area (got ${businessToGovDistance.toFixed(1)}m)`,
  );

  // Verify all 4 bridges and flyovers provide smooth elevated ramp-to-deck height and side guardrails
  assert.equal(BRIDGES_AND_FLYOVERS_LAYOUT.length, 4);
  for (const bridge of BRIDGES_AND_FLYOVERS_LAYOUT) {
    const centerHit = getBridgeFlyoverAt(bridge.x, bridge.z);
    assert.ok(centerHit, `${bridge.name} should be detected at its centre`);
    assert.equal(centerHit.onMainSpan, true);
    assert.ok(centerHit.elevation >= 3.4, `${bridge.name} deck should rise at least 3.4m above terrain`);

    const centerSurfaceY = getBridgeFlyoverSurfaceHeight(bridge.x, bridge.z, 1.0);
    assert.ok(
      Math.abs(centerSurfaceY - (1.0 + bridge.deckHeight)) < 1e-6,
      `${bridge.name} surface height should add deckHeight (${bridge.deckHeight}m) to base terrain`,
    );

    // Mid-ramp check
    const midRampOffset = bridge.length / 2 - bridge.rampLength / 2;
    const rampX = bridge.axis === 'x' ? bridge.x + midRampOffset : bridge.x;
    const rampZ = bridge.axis === 'z' ? bridge.z + midRampOffset : bridge.z;
    const rampHit = getBridgeFlyoverAt(rampX, rampZ);
    assert.ok(rampHit && rampHit.onRamp, `${bridge.name} approach ramp should be detected`);
    assert.ok(
      rampHit.elevation > 0.5 && rampHit.elevation < bridge.deckHeight - 0.5,
      `${bridge.name} ramp should smoothly interpolate height (got ${rampHit.elevation.toFixed(2)}m)`,
    );
  }

  const guardrails = getBridgeFlyoverGuardrailColliders();
  assert.equal(guardrails.length, BRIDGES_AND_FLYOVERS_LAYOUT.length * 2);
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

test('strategic advertising billboards stay clear of every connected road surface and building', () => {
  assert.equal(BILLBOARD_LAYOUT.length, 5);
  for (const billboard of BILLBOARD_LAYOUT) {
    const box = {
      x: billboard.x,
      z: billboard.z,
      yaw: billboard.facing,
      halfX: billboard.halfX,
      halfZ: billboard.halfZ,
    };
    for (const road of ROAD_NETWORK_LAYOUT) {
      const curve = createPlanarCurve(road.points);
      const sampleCount = Math.ceil(curve.getLength() / 0.2);
      for (let index = 0; index <= sampleCount; index += 1) {
        const point = curve.getPointAt(index / sampleCount);
        const clearance = distanceFromBox(worldToLocal(box, point.x, point.z), box);
        assert.ok(
          clearance >= road.halfWidth + 0.25,
          `${billboard.name} is too close to a road surface (${clearance.toFixed(2)} units)`,
        );
      }
    }
  }
});

test('expanded Unity Grand Mall provides a larger footprint and wider storefront bays while staying inside the world boundary', () => {
  const mall = COMMERCE_VENUE_LAYOUT.find((venue) => venue.id === 'market');
  assert.ok(mall, 'Unity Mall is present in COMMERCE_VENUE_LAYOUT');
  assert.ok(mall.width >= 25, 'Unity Mall width is expanded to a big indoor mall footprint');
  assert.ok(mall.depth >= 17, 'Unity Mall depth is expanded for indoor concourse and lockup shops');
  assert.equal(MALL_SHOP_BAY_LAYOUT.length, 4, 'all 4 mall shop bays are laid out across the expanded mall');
  const totalBayWidth = MALL_SHOP_BAY_LAYOUT.reduce((sum, bay) => sum + bay.bayWidth, 0);
  assert.ok(totalBayWidth >= 17, 'storefront bays are widened across the larger mall facade');
});

test('indoor mall has an open front entrance portal, central concourse, and 6 walk-in lockup shops with wall colliders', () => {
  const mall = COMMERCE_VENUE_LAYOUT.find((venue) => venue.id === 'market');
  assert.equal(MALL_LOCKUP_SHOP_LAYOUT.length, 6, '6 indoor lockup shops are defined');
  const wallColliders = getMallIndoorWallColliders(mall);
  assert.equal(wallColliders.length, 9, 'perimeter walls and interior lockup partition walls are generated');

  // Walking straight through the 6.2m wide front entrance portal into the central concourse is unobstructed
  for (const localZ of [-9.2, -8.6, -5.0, 0.0, 5.0]) {
    const portalPoint = mallLocalToWorld(mall, 0, localZ);
    for (const wall of wallColliders) {
      const probe = { x: portalPoint.x, z: portalPoint.z };
      const hit = resolveDiscAgainstOrientedBox(probe, wall, 0.42);
      assert.equal(hit, null, `central concourse path at localZ=${localZ} should not hit wall ${wall.id}`);
    }
  }

  // Walking inside the central concourse registers as inside the indoor mall building
  const concourseCenter = mallLocalToWorld(mall, 0, 0);
  assert.equal(isInsideMallBuilding(concourseCenter.x, concourseCenter.z, mall), true);

  // Walking through each of the 6 lockup shop doorways and standing inside each lockup room works without hitting walls
  for (const lockup of MALL_LOCKUP_SHOP_LAYOUT) {
    const doorwayWorld = mallLocalToWorld(mall, lockup.doorLocalX, lockup.doorLocalZ);
    for (const wall of wallColliders) {
      const probe = { x: doorwayWorld.x, z: doorwayWorld.z };
      assert.equal(
        resolveDiscAgainstOrientedBox(probe, wall, 0.42),
        null,
        `doorway of ${lockup.code} should be open and unobstructed by ${wall.id}`,
      );
    }

    const roomCenterWorld = mallLocalToWorld(mall, lockup.localX, lockup.localZ);
    assert.equal(isInsideMallBuilding(roomCenterWorld.x, roomCenterWorld.z, mall), true);
    const detected = getMallLockupShopAt(roomCenterWorld.x, roomCenterWorld.z, mall);
    assert.ok(detected, `standing inside ${lockup.code} should detect the lockup shop`);
    assert.equal(detected.shop.id, lockup.id);
    assert.equal(detected.insideRoom, true);
  }

  // Exterior rear wall and interior partition walls block walking through solid walls
  const rearWallProbe = mallLocalToWorld(mall, 0, mall.depth / 2 - 0.1);
  const rearWall = wallColliders.find((wall) => wall.id === 'mall-wall-rear');
  assert.ok(resolveDiscAgainstOrientedBox({ ...rearWallProbe }, rearWall, 0.42));

  const partitionProbe = mallLocalToWorld(mall, -8.0, -2.6);
  const partitionWall = wallColliders.find((wall) => wall.id === 'mall-partition-l1-l2');
  assert.ok(resolveDiscAgainstOrientedBox({ ...partitionProbe }, partitionWall, 0.42));
});


