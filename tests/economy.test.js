import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ECONOMY_STORAGE_KEY,
  RENTAL_MONTH_MS,
  advanceRentalBilling,
  createDefaultEconomy,
  endRentalLease,
  loadEconomy,
  payRentalRent,
  purchaseProduct,
  saveEconomy,
  signRentalLease,
} from '../src/economy.js';

test('renting charges the deposit and first month, then prevents a second active lease', () => {
  const economy = createDefaultEconomy();
  const result = signRentalLease(economy, 2, 10_000);

  assert.equal(result.ok, true);
  assert.equal(result.moveInCost, 360);
  assert.equal(economy.wallet, 840);
  assert.equal(economy.lease.houseNumber, 2);
  assert.equal(economy.lease.nextDueAt, 10_000 + RENTAL_MONTH_MS);
  assert.equal(signRentalLease(economy, 3, 10_000).reason, 'lease-active');
});

test('rent accrues in 30-day periods and can be paid from the in-game wallet', () => {
  const economy = createDefaultEconomy();
  signRentalLease(economy, 3, 0);

  assert.equal(advanceRentalBilling(economy, RENTAL_MONTH_MS * 2), 2);
  assert.equal(economy.lease.rentDue, 440);
  assert.deepEqual(payRentalRent(economy, RENTAL_MONTH_MS * 2), { ok: true, paid: 440 });
  assert.equal(economy.wallet, 320);
  assert.equal(economy.lease.rentDue, 0);
  assert.equal(payRentalRent(economy, RENTAL_MONTH_MS * 2).reason, 'not-due');
});

test('rent payment fails safely when funds are insufficient and the deposit covers arrears on move-out', () => {
  const economy = createDefaultEconomy();
  signRentalLease(economy, 4, 0);
  economy.wallet = 0;
  advanceRentalBilling(economy, RENTAL_MONTH_MS);

  assert.equal(payRentalRent(economy, RENTAL_MONTH_MS).reason, 'insufficient-funds');
  assert.deepEqual(endRentalLease(economy, RENTAL_MONTH_MS), {
    ok: true,
    refund: 0,
    depositUsed: 260,
    unpaidAfterDeposit: 0,
  });
  assert.equal(economy.lease, null);
  assert.equal(economy.wallet, 0);
});

test('shop purchases subtract credits and add persistent inventory counts', () => {
  const economy = createDefaultEconomy();
  assert.equal(purchaseProduct(economy, 'cafe-bun').count, 1);
  assert.equal(purchaseProduct(economy, 'cafe-bun').count, 2);
  assert.equal(economy.wallet, 1184);
  economy.wallet = 0;
  assert.equal(purchaseProduct(economy, 'market-pantry').reason, 'insufficient-funds');
  assert.equal(purchaseProduct(economy, 'unknown-item').reason, 'item-not-found');
});

test('economy state round-trips through storage and ignores unknown inventory entries', () => {
  const values = new Map();
  const storage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  };
  const economy = createDefaultEconomy();
  signRentalLease(economy, 2, 42);
  purchaseProduct(economy, 'market-eggs-bread');
  saveEconomy(storage, economy);
  const loaded = loadEconomy(storage, 99);

  assert.equal(values.has(ECONOMY_STORAGE_KEY), true);
  assert.deepEqual(loaded, economy);
  values.set(ECONOMY_STORAGE_KEY, JSON.stringify({ wallet: 7, inventory: { 'not-a-product': 90 }, lease: { houseNumber: 999 } }));
  assert.deepEqual(loadEconomy(storage, 99), { wallet: 7, inventory: {}, lease: null });
});
