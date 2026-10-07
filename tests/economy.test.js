import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ECONOMY_STORAGE_KEY,
  MALL_LOCKUP_SHOPS,
  MALL_SHOP_SPACES,
  RENTAL_MONTH_MS,
  advanceRentalBilling,
  collectMallShowcaseSales,
  consumeProduct,
  createCustomVirtualGood,
  createDefaultEconomy,
  earnGameCredits,
  endMallShopLease,
  endRentalLease,
  getMallLockupProducts,
  getMallLockupShop,
  getMallShopDisplayState,
  loadEconomy,
  payMallShopRent,
  payRentalRent,
  purchaseProduct,
  saveEconomy,
  signMallShopLease,
  signRentalLease,
  toggleMallShopDisplayedGood,
  updateMallShopDetails,
} from '../src/economy.js';
import { createDefaultLife, enjoyMeal } from '../src/life-sim.js';

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

test('food can be consumed from the bag and work rewards stay in the fictional game wallet', () => {
  const economy = createDefaultEconomy();
  purchaseProduct(economy, 'cafe-bun', 12_000);
  assert.deepEqual(consumeProduct(economy, 'cafe-bun'), {
    ok: true,
    product: { id: 'cafe-bun', name: 'Coconut bun', category: 'Bakery', price: 8, description: 'Soft, sweet, and baked this morning.' },
    count: 0,
  });
  assert.equal(economy.inventory['cafe-bun'], undefined);
  assert.equal(consumeProduct(economy, 'cafe-bun').reason, 'not-in-inventory');
  assert.equal(consumeProduct(economy, 'unknown').reason, 'item-not-found');

  assert.deepEqual(earnGameCredits(economy, 'Civic Café · shift pay', 200, 15_000), {
    ok: true,
    amount: 200,
    balance: 1392,
  });
  assert.deepEqual(economy.ledger[0], {
    id: economy.ledger[0].id,
    description: 'Civic Café · shift pay',
    amount: 200,
    occurredAt: 15_000,
  });
  assert.equal(earnGameCredits(economy, 'bad pay', -5).reason, 'invalid-amount');
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
  const normalized = loadEconomy(storage, 99);
  assert.equal(normalized.wallet, 7);
  assert.deepEqual(normalized.inventory, {});
  assert.equal(normalized.lease, null);
  assert.match(normalized.accountId, /^VW-[0-9A-F]{8}$/);
  assert.deepEqual(normalized.ledger, []);
});

test('local bank account reference and recent wallet activity persist safely', () => {
  const economy = createDefaultEconomy();
  assert.match(economy.accountId, /^VW-[0-9A-F]{8}$/);
  signRentalLease(economy, 2, 10_000);
  purchaseProduct(economy, 'cafe-bun', 20_000);

  assert.deepEqual(economy.ledger.map(({ description, amount, occurredAt }) => ({ description, amount, occurredAt })), [
    { description: 'Coconut bun', amount: -8, occurredAt: 20_000 },
    { description: 'House 02 · move-in rent + deposit', amount: -360, occurredAt: 10_000 },
  ]);

  const values = new Map();
  const storage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  };
  saveEconomy(storage, economy);
  const loaded = loadEconomy(storage, 30_000);
  assert.equal(loaded.accountId, economy.accountId);
  assert.deepEqual(loaded.ledger, economy.ledger);
});

test('Unity Mall offers shop spaces of different sizes with matching virtual goods capacities', () => {
  assert.deepEqual(
    MALL_SHOP_SPACES.map((space) => ({
      id: space.id,
      sizeLabel: space.sizeLabel,
      areaSqm: space.areaSqm,
      maxDisplayItems: space.maxDisplayItems,
    })),
    [
      { id: 'kiosk-s1', sizeLabel: 'Small', areaSqm: 12, maxDisplayItems: 2 },
      { id: 'boutique-m2', sizeLabel: 'Medium', areaSqm: 28, maxDisplayItems: 3 },
      { id: 'showroom-l3', sizeLabel: 'Large', areaSqm: 54, maxDisplayItems: 4 },
      { id: 'anchor-xl4', sizeLabel: 'Anchor', areaSqm: 96, maxDisplayItems: 6 },
    ],
  );
});

test('residents can rent mall shop spaces, curate displayed virtual goods, create custom goods, and collect showcase sales', () => {
  const economy = createDefaultEconomy();
  const rentResult = signMallShopLease(economy, 'kiosk-s1', { shopName: 'Amina Atelier' }, 5_000);
  assert.equal(rentResult.ok, true);
  assert.equal(rentResult.moveInCost, 180);
  assert.equal(economy.wallet, 1020);
  assert.equal(economy.shopLeases['kiosk-s1'].shopName, 'Amina Atelier');
  assert.equal(economy.shopLeases['kiosk-s1'].displayedGoods.length, 2);

  assert.equal(
    toggleMallShopDisplayedGood(economy, 'kiosk-s1', 'vgood-smart-drone').reason,
    'display-full',
  );
  assert.equal(toggleMallShopDisplayedGood(economy, 'kiosk-s1', 'vgood-organic-hamper').displayed, false);

  const customResult = createCustomVirtualGood(economy, {
    name: 'Abuja Gold Cufflinks',
    category: 'Fashion',
    style: 'fashion',
    price: 80,
    spaceId: 'kiosk-s1',
  });
  assert.equal(customResult.ok, true);
  assert.equal(customResult.autoDisplayed, true);
  assert.equal(getMallShopDisplayState(economy, 'kiosk-s1').displayedGoods.length, 2);

  assert.equal(updateMallShopDetails(economy, 'kiosk-s1', { shopName: 'Amina Luxury Kiosk', tagline: 'Handcrafted Abuja gifts' }).ok, true);
  const sale = collectMallShowcaseSales(economy, 'kiosk-s1', 9_000);
  assert.equal(sale.ok, true);
  assert.ok(sale.payout > 18);

  advanceRentalBilling(economy, 5_000 + RENTAL_MONTH_MS);
  assert.equal(economy.shopLeases['kiosk-s1'].rentDue, 90);
  assert.equal(payMallShopRent(economy, 'kiosk-s1', 5_000 + RENTAL_MONTH_MS).paid, 90);
  const ended = endMallShopLease(economy, 'kiosk-s1', 5_000 + RENTAL_MONTH_MS);
  assert.equal(ended.ok, true);
  assert.equal(ended.refund, 90);
  assert.equal(economy.shopLeases['kiosk-s1'], undefined);
});

test('all 6 indoor lockup shops offer distinct counter catalogs that players can buy and use', () => {
  assert.equal(MALL_LOCKUP_SHOPS.length, 6);
  const economy = createDefaultEconomy();
  earnGameCredits(economy, 'Mall shopping spree bonus', 1000, 12_000);
  const life = createDefaultLife();
  life.needs.hunger = 40;
  life.needs.energy = 40;
  life.needs.hygiene = 40;
  life.needs.mood = 40;
  life.needs.social = 40;

  for (const lockup of MALL_LOCKUP_SHOPS) {
    assert.ok(getMallLockupShop(lockup.id));
    const products = getMallLockupProducts(lockup.id);
    assert.ok(products.length >= 3, `${lockup.code} (${lockup.name}) should have at least 3 buyable products`);
    for (const product of products) {
      assert.equal(product.lockupId, lockup.id);
      assert.equal(product.lockupCode, lockup.code);
      const purchase = purchaseProduct(economy, product.id, 15_000);
      assert.equal(purchase.ok, true, `should be able to buy ${product.name} from ${lockup.name}`);
      assert.equal(economy.inventory[product.id], 1);
      const consumed = consumeProduct(economy, product.id);
      assert.equal(consumed.ok, true);
      const used = enjoyMeal(life, product.id);
      assert.equal(used.ok, true, `${product.name} should be usable by the resident`);
    }
  }
});

