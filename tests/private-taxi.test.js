import assert from 'node:assert/strict';
import test from 'node:test';
import { createDefaultEconomy } from '../src/economy.js';
import {
  PRIVATE_TAXI_DESTINATIONS,
  PRIVATE_TAXI_DRIVER,
  boardPrivateTaxi,
  cancelPrivateTaxi,
  completePrivateTaxiRide,
  computePrivateTaxiWaypoints,
  createPrivateTaxiMesh,
  createPrivateTaxiState,
  getPrivateTaxiDestination,
  getPrivateTaxiQuote,
  isPlayerNearPrivateTaxi,
  orderPrivateTaxi,
  syncPrivateTaxiMesh,
  updatePrivateTaxi,
} from '../src/private-taxi.js';
import {
  COMMERCE_VENUE_LAYOUT,
  MALL_PARKING_BAYS,
  MALL_PARKING_LOT_LAYOUT,
  getMallParkingSurfaceHeight,
  mallLocalToWorld,
} from '../src/world-layout.js';

test('Unity Mall includes a 6-bay Customer & VIP parking lot and front taxi drop-off forecourt', () => {
  const mall = COMMERCE_VENUE_LAYOUT.find((venue) => venue.id === 'market');
  assert.ok(mall);
  assert.equal(MALL_PARKING_BAYS.length, 6, 'Unity Mall parking lot provides 6 parking bays');
  const vipBays = MALL_PARKING_BAYS.filter((bay) => bay.isVip);
  const customerBays = MALL_PARKING_BAYS.filter((bay) => !bay.isVip);
  assert.equal(vipBays.length, 3);
  assert.equal(customerBays.length, 3);
  assert.ok(MALL_PARKING_BAYS.some((bay) => !bay.hasParkedCar), 'at least one bay is open for player/taxi parking');

  const lotWorld = mallLocalToWorld(mall, MALL_PARKING_LOT_LAYOUT.localX, MALL_PARKING_LOT_LAYOUT.localZ);
  assert.equal(getMallParkingSurfaceHeight(lotWorld.x, lotWorld.z, 2.0, mall), 2.12);

  const forecourtWorld = mallLocalToWorld(
    mall,
    MALL_PARKING_LOT_LAYOUT.taxiDropOffLocalX,
    MALL_PARKING_LOT_LAYOUT.taxiDropOffLocalZ,
  );
  assert.equal(getMallParkingSurfaceHeight(forecourtWorld.x, forecourtWorld.z, 2.0, mall), 2.12);
});

test('private car taxi can be ordered in the phone, drives to meet the player at their location, and takes them to their destination', () => {
  assert.ok(PRIVATE_TAXI_DESTINATIONS.length >= 6);
  assert.ok(PRIVATE_TAXI_DRIVER.plateNumber.includes('ABJ'));

  const taxiState = createPrivateTaxiState();
  const economy = createDefaultEconomy();
  const initialWallet = economy.wallet;

  // Player is at Unity Court (x: 18, z: 6) and orders a private taxi to Unity Grand Indoor Mall ('mall')
  const playerPos = { x: 18, z: 6 };
  const order = orderPrivateTaxi(taxiState, {
    playerX: playerPos.x,
    playerZ: playerPos.z,
    destinationId: 'mall',
    locationLabel: 'Unity Court',
  });
  assert.equal(order.ok, true);
  assert.equal(taxiState.status, 'approaching');
  assert.equal(order.destination.id, 'mall');
  assert.ok(order.quote.fare >= 10);

  // Step the simulation until the taxi drives up to meet the player at their location
  const taxiMesh = createPrivateTaxiMesh();
  let arrivedPickupEvent = null;
  for (let step = 0; step < 80; step += 1) {
    const update = updatePrivateTaxi(taxiState, 0.1, {
      playerX: playerPos.x,
      playerZ: playerPos.z,
      groundHeightAt: () => 0,
      taxiMesh,
    });
    if (update.event === 'arrived-at-pickup') {
      arrivedPickupEvent = update.event;
      break;
    }
  }
  assert.equal(arrivedPickupEvent, 'arrived-at-pickup');
  assert.equal(taxiState.status, 'arrived');
  assert.equal(isPlayerNearPrivateTaxi(taxiState, playerPos.x, playerPos.z), true);

  // Player enters the arrived private taxi
  const board = boardPrivateTaxi(taxiState, economy, 20_000);
  assert.equal(board.ok, true);
  assert.equal(taxiState.status, 'en-route');
  assert.equal(economy.wallet, initialWallet - board.chargedFare);

  // Step the simulation until the private taxi reaches the destination (Unity Grand Indoor Mall)
  let arrivedDestEvent = null;
  let completion = null;
  for (let step = 0; step < 360; step += 1) {
    const update = updatePrivateTaxi(taxiState, 0.1, {
      playerX: taxiState.x,
      playerZ: taxiState.z,
      groundHeightAt: () => 0,
      taxiMesh,
    });
    if (update.event === 'arrived-at-destination') {
      arrivedDestEvent = update.event;
      completion = update.completion;
      break;
    }
  }
  assert.equal(arrivedDestEvent, 'arrived-at-destination');
  assert.equal(taxiState.status, 'idle');
  assert.ok(completion?.ok);
  const mallDest = getPrivateTaxiDestination('mall');
  assert.ok(Math.hypot(taxiState.x - mallDest.x, taxiState.z - mallDest.z) < 0.01);
  assert.equal(taxiState.tripsCompleted, 1);

  syncPrivateTaxiMesh(taxiState, taxiMesh, 0.05, () => 1.5);
  assert.equal(taxiMesh.group.position.y, 1.5);
});

test('private taxi orders can be cancelled before boarding and support direct completion', () => {
  const taxiState = createPrivateTaxiState();
  orderPrivateTaxi(taxiState, { playerX: 0, playerZ: 0, destinationId: 'stadium' });
  assert.equal(taxiState.status, 'approaching');
  assert.equal(cancelPrivateTaxi(taxiState).ok, true);
  assert.equal(taxiState.status, 'idle');

  orderPrivateTaxi(taxiState, { playerX: 0, playerZ: 0, destinationId: 'mall-parking' });
  const quote = getPrivateTaxiQuote(0, 0, 'mall-parking');
  assert.equal(quote.destination.id, 'mall-parking');
  boardPrivateTaxi(taxiState, { wallet: 0, ledger: [] });
  assert.equal(taxiState.status, 'en-route');
  const done = completePrivateTaxiRide(taxiState);
  assert.equal(done.ok, true);
  assert.equal(taxiState.status, 'idle');
});

test('cross-district private taxi rides route across bridges and highway flyovers', () => {
  const home = getPrivateTaxiDestination('home');
  const mall = getPrivateTaxiDestination('mall');
  const hall = getPrivateTaxiDestination('hall');
  const stadium = getPrivateTaxiDestination('stadium');
  const extractBridges = (waypoints) => [...new Set(waypoints.map((wp) => wp.bridgeId).filter(Boolean))];

  // Residential Area (SE) -> Business Area (NE) crosses Maitama–CBD Commercial Flyover
  const homeToMallBridges = extractBridges(computePrivateTaxiWaypoints(home.x, home.z, mall.x, mall.z));
  assert.ok(
    homeToMallBridges.includes('cbd-flyover'),
    'Residential to Business Area taxi route must pass through Maitama–CBD Commercial Flyover',
  );

  // Business Area (NE) -> Government Area (NW) crosses Three Arms Civic River Bridge
  const mallToHallBridges = extractBridges(computePrivateTaxiWaypoints(mall.x, mall.z, hall.x, hall.z));
  assert.ok(
    mallToHallBridges.includes('civic-bridge'),
    'Business to Government Area taxi route must pass across Three Arms Civic River Bridge',
  );

  // Residential Area (SE) -> Government Area (NW) crosses both the CBD Flyover and Three Arms Civic River Bridge
  const homeToHallBridges = extractBridges(computePrivateTaxiWaypoints(home.x, home.z, hall.x, hall.z));
  assert.ok(
    homeToHallBridges.includes('cbd-flyover')
      && homeToHallBridges.includes('civic-bridge'),
    'Residential to Government Area taxi route must pass through both the CBD Flyover and Three Arms Civic Bridge',
  );

  // Government Area (NW) -> Stadium (SW) crosses Usuma West Viaduct Flyover
  const hallToStadiumBridges = extractBridges(computePrivateTaxiWaypoints(hall.x, hall.z, stadium.x, stadium.z));
  assert.ok(
    hallToStadiumBridges.includes('west-flyover'),
    'Government Area to Stadium taxi route must pass through Usuma West Viaduct Flyover',
  );

  // Stadium (SW) -> Residential Area (SE) crosses Constitution Stadium Bridge & Flyover
  const stadiumToHomeBridges = extractBridges(computePrivateTaxiWaypoints(stadium.x, stadium.z, home.x, home.z));
  assert.ok(
    stadiumToHomeBridges.includes('stadium-flyover'),
    'Stadium to Residential Area taxi route must pass across Constitution Stadium Bridge & Flyover',
  );
});
