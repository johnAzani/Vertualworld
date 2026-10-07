import assert from 'node:assert/strict';
import test from 'node:test';
import { createDefaultEconomy } from '../src/economy.js';
import {
  PRIVATE_TAXI_DESTINATIONS,
  PRIVATE_TAXI_DRIVER,
  boardPrivateTaxi,
  cancelPrivateTaxi,
  completePrivateTaxiRide,
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
  for (let step = 0; step < 120; step += 1) {
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
