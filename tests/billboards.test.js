import assert from 'node:assert/strict';
import test from 'node:test';
import { createDefaultEconomy } from '../src/economy.js';
import {
  applyQuickBillboardPreset,
  collectBillboardRevenue,
  createInitialBillboardState,
  endBillboardLease,
  getBillboardBonuses,
  getBillboardDisplayState,
  loadBillboardState,
  rentBillboard,
  saveBillboardState,
  updateBillboardCampaign,
} from '../src/billboards.js';
import { BILLBOARD_LAYOUT } from '../src/world-layout.js';

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
  };
}

test('strategic billboards can be leased, customised with presets or custom copy, and pay out ad revenue', () => {
  const economy = createDefaultEconomy();
  const state = createInitialBillboardState();
  assert.equal(BILLBOARD_LAYOUT.length, 5);

  const defaultDisplay = getBillboardDisplayState(state, 'billboard-mall');
  assert.equal(defaultDisplay.isLeased, false);
  assert.equal(defaultDisplay.headline, 'RENT YOUR 3D SHOP AT UNITY MALL');

  const startCredits = economy.wallet;
  const leased = rentBillboard(state, economy, 'billboard-mall', {
    advertiserName: 'Chidi',
    campaignType: 'mall',
    theme: 'emerald',
  });
  assert.equal(leased.ok, true);
  assert.equal(economy.wallet, startCredits - leased.cost);

  const preset = applyQuickBillboardPreset(state, 'billboard-mall', 'mall', {
    residentName: 'Chidi',
    shopName: 'Chidi Luxe Gallery',
    shopTagline: 'Bespoke Abuja Agbada & Smart Glasses in Bay B2',
    shopCode: 'BAY B2',
  });
  assert.equal(preset.ok, true);
  assert.equal(preset.lease.headline, 'CHIDI LUXE GALLERY');
  assert.equal(preset.lease.campaignType, 'mall');

  const bonuses = getBillboardBonuses(state);
  assert.equal(bonuses.activeLeaseCount, 1);
  assert.equal(bonuses.mallCount, 1);
  assert.equal(bonuses.mallSalesBonusMultiplier, 1.15);

  const custom = updateBillboardCampaign(state, 'billboard-mall', {
    badge: 'CHIDI STUDIO · UNITY MALL',
    headline: 'NEW GOLD DRONE COLLECTION',
    subline: 'Now on 3D Pedestals at North Wing Boutique B2',
    cta: 'VISIT BAY B2',
    theme: 'gold',
    campaignType: 'mall',
  });
  assert.equal(custom.ok, true);
  assert.equal(custom.lease.theme, 'gold');

  const beforePayout = economy.wallet;
  const payout = collectBillboardRevenue(state, economy, 'billboard-mall', {
    hasMallShop: true,
    policyMultiplier: 1.25,
  });
  assert.equal(payout.ok, true);
  assert.ok(payout.payout > 28);
  assert.equal(economy.wallet, beforePayout + payout.payout);

  const ended = endBillboardLease(state, 'billboard-mall');
  assert.equal(ended.ok, true);
  assert.equal(getBillboardDisplayState(state, 'billboard-mall').isLeased, false);
});

test('billboard state round-trips through local storage and sanitises invalid entries', () => {
  const storage = createMemoryStorage();
  const economy = createDefaultEconomy();
  const state = createInitialBillboardState();

  rentBillboard(state, economy, 'billboard-stadium', {
    advertiserName: 'Zainab',
    headline: 'ZAINAB MATCHDAY EXPRESS',
    theme: 'sunset',
    campaignType: 'brand',
  });
  saveBillboardState(state, storage);

  const loaded = loadBillboardState(storage);
  assert.equal(Boolean(loaded.leases['billboard-stadium']), true);
  assert.equal(loaded.leases['billboard-stadium'].headline, 'ZAINAB MATCHDAY EXPRESS');
  assert.equal(loaded.leases['billboard-stadium'].theme, 'sunset');
});
