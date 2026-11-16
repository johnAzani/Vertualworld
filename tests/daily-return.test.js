import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  DAILY_CITY_EVENTS,
  DAILY_GOLDEN_SEED_SPOTS,
  DAILY_STREAK_REWARDS,
  calculateDailyOwnershipDividend,
  claimDailyBonusChest,
  claimDailyCheckIn,
  claimDailyContract,
  collectDailyGoldenSeed,
  collectDailyOwnershipDividend,
  createDefaultDailyReturnState,
  getDailyCityEvent,
  getDailyGoldenSeedSpot,
  getDailyReturnActionCount,
  isDailyCheckInAvailable,
  loadDailyReturnState,
  recordDailyActivity,
  saveDailyReturnState,
  syncDailyReturnDay,
} from '../src/daily-return.js';
import { createDefaultEconomy } from '../src/economy.js';
import { createDefaultGovernment } from '../src/government.js';
import { createDefaultLife } from '../src/life-sim.js';

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
  };
}

test('daily check-in builds a 7-day streak, grants escalating rewards, and uses a streak shield if a day is missed', () => {
  const economy = createDefaultEconomy();
  const initialWallet = economy.wallet;
  const life = createDefaultLife();
  const government = createDefaultGovernment();
  const state = createDefaultDailyReturnState('2026-10-01');

  assert.equal(DAILY_STREAK_REWARDS.length, 7);
  assert.equal(isDailyCheckInAvailable(state, '2026-10-01'), true);

  const day1 = claimDailyCheckIn(state, { economy, life, government }, '2026-10-01');
  assert.equal(day1.ok, true);
  assert.equal(day1.streakCount, 1);
  assert.equal(day1.creditsAwarded, 60);
  assert.equal(economy.wallet, initialWallet + 60);
  assert.equal(isDailyCheckInAvailable(state, '2026-10-01'), false);

  const duplicate = claimDailyCheckIn(state, { economy, life, government }, '2026-10-01');
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.reason, 'already-claimed');

  // Consecutive Day 2 grants coffee item bonus
  const day2 = claimDailyCheckIn(state, { economy, life, government }, '2026-10-02');
  assert.equal(day2.ok, true);
  assert.equal(day2.streakCount, 2);
  assert.equal(economy.inventory['cafe-coffee'], 1);

  // Skip 2026-10-03 and check in on 2026-10-04 -> streak shield protects streak!
  assert.equal(state.streakShields, 1);
  const day3Protected = claimDailyCheckIn(state, { economy, life, government }, '2026-10-04');
  assert.equal(day3Protected.ok, true);
  assert.equal(day3Protected.shieldUsed, true);
  assert.equal(day3Protected.streakCount, 3);
  assert.equal(state.streakShields, 0);

  // Advance through Day 7 to complete the first 7-day cycle
  claimDailyCheckIn(state, { economy, life, government }, '2026-10-05'); // Day 4
  claimDailyCheckIn(state, { economy, life, government }, '2026-10-06'); // Day 5
  claimDailyCheckIn(state, { economy, life, government }, '2026-10-07'); // Day 6
  const day7 = claimDailyCheckIn(state, { economy, life, government }, '2026-10-08'); // Day 7
  assert.equal(day7.ok, true);
  assert.equal(day7.cycleDay, 7);
  assert.equal(state.completedCycles, 1);
  assert.equal(state.streakShields, 1);
});

test('daily contracts progress from activities, unlock the 3/3 Pulse Chest, and rotate with city events', () => {
  const economy = createDefaultEconomy();
  const life = createDefaultLife();
  const state = createDefaultDailyReturnState('2026-10-07');

  assert.equal(DAILY_CITY_EVENTS.length, 7);
  assert.equal(DAILY_GOLDEN_SEED_SPOTS.length, 7);
  assert.equal(state.contracts.length, 3);

  const event = getDailyCityEvent('2026-10-07');
  const spot = getDailyGoldenSeedSpot('2026-10-07');
  assert.ok(event.title.length > 3);
  assert.ok(spot.name.length > 3);

  // Complete all 3 daily contracts
  for (const contract of state.contracts) {
    recordDailyActivity(state, contract.activityType, contract.target, '2026-10-07');
  }
  assert.ok(state.contracts.every((c) => c.completed));

  const firstClaim = claimDailyContract(state, state.contracts[0].id, { economy, life }, '2026-10-07');
  assert.equal(firstClaim.ok, true);
  assert.ok(firstClaim.creditsAwarded >= 60);

  const chest = claimDailyBonusChest(state, { economy, life }, '2026-10-07');
  assert.equal(chest.ok, true);
  assert.equal(chest.creditsAwarded, 150);
  assert.ok(state.contracts.every((c) => c.claimed));

  // Collect the Daily Golden Seed
  const seedResult = collectDailyGoldenSeed(state, { economy, life }, '2026-10-07');
  assert.equal(seedResult.ok, true);
  assert.ok(seedResult.creditsAwarded >= 75);
});

test('daily ownership dividend scales with Mall shops, Billboards, Governor office, and persists across days', () => {
  const storage = createMemoryStorage();
  const economy = createDefaultEconomy();
  economy.mallShops = { 'kiosk-a': { spaceId: 'kiosk-a' }, 'boutique-b': { spaceId: 'boutique-b' } };
  const billboards = { leases: { 'bb-mall-plaza': { billboardId: 'bb-mall-plaza' } } };
  const government = createDefaultGovernment();
  government.isPlayerGovernor = true;
  const life = createDefaultLife();
  life.career.rank = 2;

  const state = createDefaultDailyReturnState('2026-10-07');
  const breakdown = calculateDailyOwnershipDividend({ economy, billboards, government, life });
  assert.equal(breakdown.baseResident, 35);
  assert.equal(breakdown.mallDividend, 110);
  assert.equal(breakdown.billboardDividend, 45);
  assert.equal(breakdown.governorDividend, 90);
  assert.equal(breakdown.careerDividend, 30);
  assert.equal(breakdown.total, 310);

  const dividendResult = collectDailyOwnershipDividend(
    state,
    { economy, billboards, government, life },
    '2026-10-07',
  );
  assert.equal(dividendResult.ok, true);
  assert.equal(dividendResult.creditsAwarded, 310);

  saveDailyReturnState(storage, state);
  const reloadedSameDay = loadDailyReturnState(storage, '2026-10-07');
  assert.equal(reloadedSameDay.dividendClaimedDayKey, '2026-10-07');

  // Roll over to the next day: contracts refresh and check-in + dividend become available again
  const nextDayState = syncDailyReturnDay(reloadedSameDay, '2026-10-08');
  assert.equal(nextDayState.currentDayKey, '2026-10-08');
  assert.ok(getDailyReturnActionCount(nextDayState, '2026-10-08') >= 2);
});

test('HUD and phone UI expose the Daily Abuja Pulse app, 7-day streak button, and 3D Daily Golden Seed', () => {
  const indexHtml = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const mainSource = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

  assert.match(indexHtml, /id="daily-streak-button"/);
  assert.match(indexHtml, /data-phone-app="daily"/);
  assert.match(indexHtml, /data-phone-page="daily"/);
  assert.match(mainSource, /collectDailyGoldenSeed/);
  assert.match(mainSource, /claimDailyCheckIn/);
  assert.match(mainSource, /collectDailyOwnershipDividend/);
});

