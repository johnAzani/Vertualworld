import { earnGameCredits } from './economy.js';

export const DAILY_RETURN_STORAGE_KEY = 'vertualworld-daily-return-v1';

const EPOCH_UTC_MS = Date.UTC(2026, 0, 1);
const DAY_MS = 86_400_000;

export const DAILY_STREAK_REWARDS = Object.freeze([
  Object.freeze({
    day: 1,
    title: 'Morning Welcome',
    credits: 60,
    xp: 15,
    itemBonus: null,
    itemLabel: '+60 GC · +15 XP',
    badge: 'Day 1 · Morning Welcome',
  }),
  Object.freeze({
    day: 2,
    title: 'Commuter Boost',
    credits: 85,
    xp: 20,
    itemBonus: 'cafe-coffee',
    itemLabel: '+85 GC · Fresh Coffee',
    badge: 'Day 2 · Commuter Boost',
  }),
  Object.freeze({
    day: 3,
    title: 'Neighbourhood Regular',
    credits: 110,
    xp: 25,
    itemBonus: null,
    civicApprovalBonus: 6,
    itemLabel: '+110 GC · +6% Civic Approval',
    badge: 'Day 3 · Neighbourhood Regular',
  }),
  Object.freeze({
    day: 4,
    title: 'Unity Market Patron',
    credits: 140,
    xp: 30,
    itemBonus: 'market-produce',
    itemLabel: '+140 GC · Produce Crate',
    badge: 'Day 4 · Market Patron',
  }),
  Object.freeze({
    day: 5,
    title: 'Civic Pillar',
    credits: 175,
    xp: 40,
    itemBonus: null,
    treasuryBonus: 100,
    itemLabel: '+175 GC · +100 GC Treasury',
    badge: 'Day 5 · Civic Pillar',
  }),
  Object.freeze({
    day: 6,
    title: 'Abuja Insider',
    credits: 220,
    xp: 50,
    itemBonus: 'market-rice-beans',
    itemLabel: '+220 GC · Rice & Beans Pack',
    badge: 'Day 6 · Abuja Insider',
  }),
  Object.freeze({
    day: 7,
    title: 'FCT Legend Chest',
    credits: 350,
    xp: 100,
    itemBonus: null,
    shieldBonus: 1,
    itemLabel: '+350 GC · +100 XP · +1 Shield',
    badge: 'Day 7 · FCT Legend Chest',
  }),
]);

export const DAILY_CITY_EVENTS = Object.freeze([
  Object.freeze({
    id: 'mall-fair',
    title: 'Unity Mall Trade Fair',
    district: 'Unity Mall',
    perkLabel: '+25% Mall showcase sales & +30 GC on Market Clerk shifts',
    description: 'Shoppers are packing Unity Mall today. Showcase payouts and Market Clerk shifts pay extra.',
    shiftBonusWorkplace: 'market',
    shiftBonusCredits: 30,
    mallPayoutMultiplier: 1.25,
    billboardPayoutMultiplier: 1,
    townHallBonusCredits: 0,
    goldenSeedMultiplier: 1,
    featuredActivity: 'visit-market',
  }),
  Object.freeze({
    id: 'cafe-rush',
    title: 'Civic Café Morning Rush',
    district: 'Civic Café',
    perkLabel: '+30 GC on Café Assistant shifts & +8 Mood at Civic Café',
    description: 'Commuters are gathering on the terrace. Café shifts pay extra and fresh coffee lifts spirits faster.',
    shiftBonusWorkplace: 'cafe',
    shiftBonusCredits: 30,
    mallPayoutMultiplier: 1,
    billboardPayoutMultiplier: 1,
    townHallBonusCredits: 0,
    goldenSeedMultiplier: 1,
    featuredActivity: 'visit-cafe',
  }),
  Object.freeze({
    id: 'derby-day',
    title: 'Capital Stars Derby Day',
    district: 'Abuja Community Stadium',
    perkLabel: '+35 GC on Stadium Steward shifts & +40 GC matchday bonus',
    description: 'The East Stand is buzzing for Capital Stars vs Savannah United. Steward shifts and matchday visits pay bonus credits.',
    shiftBonusWorkplace: 'stadium',
    shiftBonusCredits: 35,
    mallPayoutMultiplier: 1,
    billboardPayoutMultiplier: 1,
    townHallBonusCredits: 0,
    goldenSeedMultiplier: 1,
    featuredActivity: 'visit-stadium',
  }),
  Object.freeze({
    id: 'civic-assembly',
    title: 'Unity Hall Town Assembly',
    district: 'Unity Community Hall',
    perkLabel: '+40 GC town hall bonus & boosted voter support',
    description: 'Neighbours are meeting at Unity Community Hall. Holding a town hall or campaigning grants extra civic rewards.',
    shiftBonusWorkplace: null,
    shiftBonusCredits: 0,
    mallPayoutMultiplier: 1,
    billboardPayoutMultiplier: 1,
    townHallBonusCredits: 40,
    goldenSeedMultiplier: 1,
    featuredActivity: 'visit-hall',
  }),
  Object.freeze({
    id: 'ad-spotlight',
    title: 'Abuja Corridor Ad Spotlight',
    district: 'Strategic Billboards',
    perkLabel: '+25% billboard ad revenue across all 5 corridors',
    description: 'High commuter traffic along Civic Boulevard and Unity Mall boosts all strategic billboard payouts today.',
    shiftBonusWorkplace: 'market',
    shiftBonusCredits: 20,
    mallPayoutMultiplier: 1.1,
    billboardPayoutMultiplier: 1.25,
    townHallBonusCredits: 0,
    goldenSeedMultiplier: 1,
    featuredActivity: 'business-collect',
  }),
  Object.freeze({
    id: 'greenway-pulse',
    title: 'Greenway Golden Seed Day',
    district: 'Unity Circle & Greenway',
    perkLabel: '2× Daily Golden Seed reward (150 GC) & +25 XP',
    description: 'A bright golden seed is shining along the greenway today, worth double game credits when collected.',
    shiftBonusWorkplace: 'cafe',
    shiftBonusCredits: 20,
    mallPayoutMultiplier: 1,
    billboardPayoutMultiplier: 1,
    townHallBonusCredits: 0,
    goldenSeedMultiplier: 2,
    featuredActivity: 'golden-seed',
  }),
  Object.freeze({
    id: 'neighbour-fest',
    title: 'Unity Court Neighbour Festival',
    district: 'Unity Court',
    perkLabel: '+25 GC on all work shifts & +10 Social with neighbours',
    description: 'Lanterns and music fill Unity Court. All neighbourhood shifts pay a festival bonus today.',
    shiftBonusWorkplace: 'all',
    shiftBonusCredits: 25,
    mallPayoutMultiplier: 1.15,
    billboardPayoutMultiplier: 1.15,
    townHallBonusCredits: 25,
    goldenSeedMultiplier: 1,
    featuredActivity: 'connect-neighbour',
  }),
]);

export const DAILY_GOLDEN_SEED_SPOTS = Object.freeze([
  Object.freeze({ id: 'unity-circle', name: 'Unity Circle Beacon', hint: 'Beside the glowing Unity Circle plaza south of town', x: 0, z: -23.5 }),
  Object.freeze({ id: 'cafe-terrace', name: 'Civic Café Terrace', hint: 'Near the warm lantern steps outside Civic Café', x: -12.5, z: -8.5 }),
  Object.freeze({ id: 'mall-plaza', name: 'Unity Mall Promenade', hint: 'In front of the Unity Mall showcase windows', x: 13.5, z: -8.5 }),
  Object.freeze({ id: 'hall-steps', name: 'Unity Community Hall Steps', hint: 'By the civic forecourt at Unity Community Hall', x: -16.5, z: -24.5 }),
  Object.freeze({ id: 'stadium-gate', name: 'Abuja Stadium East Gate', hint: 'Outside the East Stand entrance at Abuja Community Stadium', x: 35.5, z: -16.5 }),
  Object.freeze({ id: 'court-roundabout', name: 'Unity Court Roundabout', hint: 'At the planted roundabout in the heart of Unity Court', x: 0, z: 16.5 }),
  Object.freeze({ id: 'greenway-overlook', name: 'Civic Greenway Overlook', hint: 'Along the central trail between Unity Court and the shops', x: 4.5, z: -2.5 }),
]);

const SPOTLIGHT_CONTRACTS = Object.freeze({
  'visit-market': Object.freeze({
    id: 'visit-market',
    title: 'Visit Unity Mall',
    description: 'Walk to Unity Mall to check out the shop windows and grocer.',
    activityType: 'visit-market',
    target: 1,
    rewardCredits: 65,
    rewardXp: 20,
  }),
  'visit-cafe': Object.freeze({
    id: 'visit-cafe',
    title: 'Stop by Civic Café',
    description: 'Walk over to Civic Café and soak in the neighbourhood buzz.',
    activityType: 'visit-cafe',
    target: 1,
    rewardCredits: 65,
    rewardXp: 20,
  }),
  'visit-stadium': Object.freeze({
    id: 'visit-stadium',
    title: 'Visit Abuja Community Stadium',
    description: 'Head east to Abuja Community Stadium for today’s matchday atmosphere.',
    activityType: 'visit-stadium',
    target: 1,
    rewardCredits: 70,
    rewardXp: 20,
  }),
  'visit-hall': Object.freeze({
    id: 'visit-hall',
    title: 'Visit Unity Community Hall',
    description: 'Stop by the Governor’s Office at Unity Community Hall.',
    activityType: 'visit-hall',
    target: 1,
    rewardCredits: 70,
    rewardXp: 20,
  }),
  'golden-seed': Object.freeze({
    id: 'golden-seed',
    title: 'Collect Today’s Golden Seed',
    description: 'Find the rotating Daily Golden Seed shining in the neighbourhood today.',
    activityType: 'golden-seed',
    target: 1,
    rewardCredits: 80,
    rewardXp: 25,
  }),
});

const WORK_CONTRACTS = Object.freeze([
  Object.freeze({
    id: 'work-shift',
    title: 'Complete a Work Shift',
    description: 'Clock in at Civic Café, Unity Mall, or the Stadium and finish 3 tasks.',
    activityType: 'work-shift',
    target: 1,
    rewardCredits: 85,
    rewardXp: 30,
  }),
  Object.freeze({
    id: 'business-or-work',
    title: 'Earn Local Income',
    description: 'Finish a work shift or collect revenue from a Mall shop, Billboard, or Town Hall.',
    activityType: 'earn-income',
    target: 1,
    rewardCredits: 85,
    rewardXp: 25,
  }),
]);

const COMMUNITY_CONTRACTS = Object.freeze([
  Object.freeze({
    id: 'connect-neighbour',
    title: 'Check In with Nia',
    description: 'Send a quick message to Nia or use the Life app check-in.',
    activityType: 'connect-neighbour',
    target: 1,
    rewardCredits: 60,
    rewardXp: 20,
  }),
  Object.freeze({
    id: 'daily-care',
    title: 'Enjoy Abuja Life',
    description: 'Eat something from your bag, rest at home, or watch the live stadium match.',
    activityType: 'daily-care',
    target: 1,
    rewardCredits: 65,
    rewardXp: 20,
  }),
]);

export function parseDayKeyToNumber(dayKey) {
  if (typeof dayKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) return null;
  const [year, month, day] = dayKey.split('-').map(Number);
  const utcMs = Date.UTC(year, month - 1, day);
  if (!Number.isFinite(utcMs)) return null;
  return Math.floor((utcMs - EPOCH_UTC_MS) / DAY_MS);
}

export function getDayKey(now = Date.now()) {
  if (typeof now === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(now)) {
    return now;
  }
  const date = now instanceof Date ? now : new Date(Number.isFinite(now) ? now : Date.now());
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDayNumber(now = Date.now()) {
  const key = getDayKey(now);
  return parseDayKeyToNumber(key) ?? 0;
}

export function getDailyCityEvent(now = Date.now()) {
  const dayNum = Math.abs(getDayNumber(now));
  return DAILY_CITY_EVENTS[dayNum % DAILY_CITY_EVENTS.length];
}

export function getDailyGoldenSeedSpot(now = Date.now()) {
  const dayNum = Math.abs(getDayNumber(now));
  return DAILY_GOLDEN_SEED_SPOTS[dayNum % DAILY_GOLDEN_SEED_SPOTS.length];
}

export function buildContractsForDay(now = Date.now()) {
  const dayNum = Math.abs(getDayNumber(now));
  const event = getDailyCityEvent(now);
  const spotlightTemplate = SPOTLIGHT_CONTRACTS[event.featuredActivity] || SPOTLIGHT_CONTRACTS['golden-seed'];
  const secondTemplate = dayNum % 2 === 0 ? WORK_CONTRACTS[0] : WORK_CONTRACTS[1];
  const thirdTemplate = dayNum % 2 === 0
    ? COMMUNITY_CONTRACTS[0]
    : COMMUNITY_CONTRACTS[1];

  return [spotlightTemplate, secondTemplate, thirdTemplate].map((template) => ({
    id: template.id,
    title: template.title,
    description: template.description,
    activityType: template.activityType,
    target: template.target,
    progress: 0,
    completed: false,
    claimed: false,
    rewardCredits: template.rewardCredits,
    rewardXp: template.rewardXp,
  }));
}

export function createDefaultDailyReturnState(now = Date.now()) {
  const dayKey = getDayKey(now);
  return {
    currentDayKey: dayKey,
    lastCheckInDayKey: null,
    streakCount: 0,
    bestStreak: 0,
    totalDaysVisited: 0,
    completedCycles: 0,
    streakShields: 1,
    lastShieldProtectedDayKey: null,
    goldenSeedCollectedDayKey: null,
    dividendClaimedDayKey: null,
    bonusChestClaimedDayKey: null,
    contracts: buildContractsForDay(dayKey),
  };
}

export function syncDailyReturnDay(state, now = Date.now()) {
  if (!state || typeof state !== 'object') return createDefaultDailyReturnState(now);
  const todayKey = getDayKey(now);
  if (state.currentDayKey !== todayKey) {
    state.currentDayKey = todayKey;
    state.contracts = buildContractsForDay(todayKey);
  } else if (!Array.isArray(state.contracts) || state.contracts.length !== 3) {
    state.contracts = buildContractsForDay(todayKey);
  }
  return state;
}

export function loadDailyReturnState(storage, now = Date.now()) {
  const fallback = createDefaultDailyReturnState(now);
  try {
    const raw = storage?.getItem(DAILY_RETURN_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fallback;

    const currentDayKey = typeof parsed.currentDayKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.currentDayKey)
      ? parsed.currentDayKey
      : fallback.currentDayKey;

    const state = {
      currentDayKey,
      lastCheckInDayKey: typeof parsed.lastCheckInDayKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.lastCheckInDayKey)
        ? parsed.lastCheckInDayKey
        : null,
      streakCount: Number.isInteger(parsed.streakCount) && parsed.streakCount >= 0 ? Math.min(3650, parsed.streakCount) : 0,
      bestStreak: Number.isInteger(parsed.bestStreak) && parsed.bestStreak >= 0 ? Math.min(3650, parsed.bestStreak) : 0,
      totalDaysVisited: Number.isInteger(parsed.totalDaysVisited) && parsed.totalDaysVisited >= 0 ? Math.min(3650, parsed.totalDaysVisited) : 0,
      completedCycles: Number.isInteger(parsed.completedCycles) && parsed.completedCycles >= 0 ? Math.min(500, parsed.completedCycles) : 0,
      streakShields: Number.isInteger(parsed.streakShields) && parsed.streakShields >= 0 ? Math.min(3, parsed.streakShields) : 1,
      lastShieldProtectedDayKey: typeof parsed.lastShieldProtectedDayKey === 'string' ? parsed.lastShieldProtectedDayKey : null,
      goldenSeedCollectedDayKey: typeof parsed.goldenSeedCollectedDayKey === 'string' ? parsed.goldenSeedCollectedDayKey : null,
      dividendClaimedDayKey: typeof parsed.dividendClaimedDayKey === 'string' ? parsed.dividendClaimedDayKey : null,
      bonusChestClaimedDayKey: typeof parsed.bonusChestClaimedDayKey === 'string' ? parsed.bonusChestClaimedDayKey : null,
      contracts: buildContractsForDay(currentDayKey),
    };

    if (Array.isArray(parsed.contracts) && currentDayKey === fallback.currentDayKey) {
      const savedById = new Map(
        parsed.contracts
          .filter((item) => item && typeof item === 'object' && typeof item.id === 'string')
          .map((item) => [item.id, item]),
      );
      state.contracts = state.contracts.map((contract) => {
        const saved = savedById.get(contract.id);
        if (!saved) return contract;
        const progress = Number.isInteger(saved.progress)
          ? Math.max(0, Math.min(contract.target, saved.progress))
          : 0;
        const completed = Boolean(saved.completed) || progress >= contract.target;
        return {
          ...contract,
          progress: completed ? contract.target : progress,
          completed,
          claimed: completed && Boolean(saved.claimed),
        };
      });
    }

    return syncDailyReturnDay(state, now);
  } catch {
    return fallback;
  }
}

export function saveDailyReturnState(storage, state) {
  try {
    storage?.setItem(DAILY_RETURN_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function isDailyCheckInAvailable(state, now = Date.now()) {
  const todayKey = getDayKey(now);
  return state?.lastCheckInDayKey !== todayKey;
}

export function getNextStreakDayIndex(state, now = Date.now()) {
  const todayKey = getDayKey(now);
  if (state?.lastCheckInDayKey === todayKey) {
    return ((Math.max(1, state.streakCount) - 1) % 7) + 1;
  }
  const lastDayNum = parseDayKeyToNumber(state?.lastCheckInDayKey);
  const todayNum = parseDayKeyToNumber(todayKey);
  let nextStreak = 1;
  if (lastDayNum !== null && todayNum !== null) {
    const diff = todayNum - lastDayNum;
    if (diff === 1) {
      nextStreak = (state.streakCount || 0) + 1;
    } else if (diff === 2 && (state.streakShields || 0) > 0 && (state.streakCount || 0) > 0) {
      nextStreak = state.streakCount + 1;
    }
  }
  return ((nextStreak - 1) % 7) + 1;
}

export function claimDailyCheckIn(state, { economy, life, government } = {}, now = Date.now()) {
  syncDailyReturnDay(state, now);
  const todayKey = getDayKey(now);
  if (state.lastCheckInDayKey === todayKey) {
    return { ok: false, reason: 'already-claimed' };
  }

  const lastDayNum = parseDayKeyToNumber(state.lastCheckInDayKey);
  const todayNum = parseDayKeyToNumber(todayKey);
  let shieldUsed = false;

  if (lastDayNum === null || todayNum === null) {
    state.streakCount = 1;
  } else {
    const diff = todayNum - lastDayNum;
    if (diff === 1) {
      state.streakCount += 1;
    } else if (diff === 2 && state.streakShields > 0 && state.streakCount > 0) {
      state.streakShields -= 1;
      state.streakCount += 1;
      state.lastShieldProtectedDayKey = todayKey;
      shieldUsed = true;
    } else {
      state.streakCount = 1;
    }
  }

  state.lastCheckInDayKey = todayKey;
  state.totalDaysVisited += 1;
  if (state.streakCount > state.bestStreak) {
    state.bestStreak = state.streakCount;
  }

  const cycleDay = ((state.streakCount - 1) % 7) + 1;
  const rewardTier = DAILY_STREAK_REWARDS[cycleDay - 1];
  const cycleMultiplier = 1 + Math.min(0.5, state.completedCycles * 0.1);
  const totalCredits = Math.round(rewardTier.credits * cycleMultiplier);

  if (cycleDay === 7) {
    state.completedCycles += 1;
  }
  if (rewardTier.shieldBonus) {
    state.streakShields = Math.min(3, state.streakShields + rewardTier.shieldBonus);
  }

  if (economy) {
    earnGameCredits(economy, `Day ${state.streakCount} check-in · ${rewardTier.title}`, totalCredits);
    if (rewardTier.itemBonus && economy.inventory && typeof economy.inventory === 'object') {
      economy.inventory[rewardTier.itemBonus] = (economy.inventory[rewardTier.itemBonus] || 0) + 1;
    }
  }

  if (life?.career) {
    life.career.xp = Math.max(0, (life.career.xp || 0) + rewardTier.xp);
    life.career.rank = Math.min(3, Math.floor(life.career.xp / 120));
  }

  if (government) {
    if (rewardTier.civicApprovalBonus) {
      government.approval = Math.min(100, (government.approval || 58) + rewardTier.civicApprovalBonus);
    }
    if (rewardTier.treasuryBonus) {
      government.treasury = (government.treasury || 0) + rewardTier.treasuryBonus;
    }
  }

  return {
    ok: true,
    streakCount: state.streakCount,
    cycleDay,
    shieldUsed,
    rewardTier,
    creditsAwarded: totalCredits,
    xpAwarded: rewardTier.xp,
  };
}

export function recordDailyActivity(state, activityType, amount = 1, now = Date.now()) {
  syncDailyReturnDay(state, now);
  const step = Math.max(1, Number(amount) || 1);
  const newlyCompleted = [];

  const matchesActivity = (contractActivity, triggered) => {
    if (contractActivity === triggered) return true;
    if (contractActivity === 'earn-income' && (triggered === 'work-shift' || triggered === 'business-collect')) {
      return true;
    }
    if (
      contractActivity === 'daily-care'
      && (triggered === 'eat-food' || triggered === 'rest-home' || triggered === 'watch-match' || triggered === 'connect-neighbour')
    ) {
      return true;
    }
    return false;
  };

  for (const contract of state.contracts) {
    if (contract.completed) continue;
    if (!matchesActivity(contract.activityType, activityType)) continue;
    contract.progress = Math.min(contract.target, contract.progress + step);
    if (contract.progress >= contract.target) {
      contract.completed = true;
      newlyCompleted.push(contract);
    }
  }

  return newlyCompleted;
}

export function claimDailyContract(state, contractId, { economy, life } = {}, now = Date.now()) {
  syncDailyReturnDay(state, now);
  const contract = state.contracts.find((item) => item.id === contractId);
  if (!contract) return { ok: false, reason: 'not-found' };
  if (!contract.completed) return { ok: false, reason: 'incomplete' };
  if (contract.claimed) return { ok: false, reason: 'already-claimed' };

  contract.claimed = true;
  if (economy) {
    earnGameCredits(economy, `Daily contract · ${contract.title}`, contract.rewardCredits);
  }
  if (life?.career) {
    life.career.xp = Math.max(0, (life.career.xp || 0) + contract.rewardXp);
    life.career.rank = Math.min(3, Math.floor(life.career.xp / 120));
  }

  return {
    ok: true,
    contract,
    creditsAwarded: contract.rewardCredits,
    xpAwarded: contract.rewardXp,
  };
}

export function isDailyBonusChestReady(state, now = Date.now()) {
  syncDailyReturnDay(state, now);
  const todayKey = getDayKey(now);
  if (state.bonusChestClaimedDayKey === todayKey) return false;
  return state.contracts.length === 3 && state.contracts.every((contract) => contract.completed);
}

export function claimDailyBonusChest(state, { economy, life } = {}, now = Date.now()) {
  syncDailyReturnDay(state, now);
  const todayKey = getDayKey(now);
  if (state.bonusChestClaimedDayKey === todayKey) {
    return { ok: false, reason: 'already-claimed' };
  }
  if (!state.contracts.every((contract) => contract.completed)) {
    return { ok: false, reason: 'contracts-incomplete' };
  }

  for (const contract of state.contracts) {
    if (!contract.claimed) {
      claimDailyContract(state, contract.id, { economy, life }, now);
    }
  }

  state.bonusChestClaimedDayKey = todayKey;
  state.streakShields = Math.min(3, (state.streakShields || 0) + 1);
  const bonusCredits = 150;
  const bonusXp = 50;

  if (economy) {
    earnGameCredits(economy, 'Daily Abuja Pulse Chest · 3/3 contracts', bonusCredits);
  }
  if (life?.career) {
    life.career.xp = Math.max(0, (life.career.xp || 0) + bonusXp);
    life.career.rank = Math.min(3, Math.floor(life.career.xp / 120));
  }

  return {
    ok: true,
    creditsAwarded: bonusCredits,
    xpAwarded: bonusXp,
    streakShields: state.streakShields,
  };
}

export function isDailyGoldenSeedCollected(state, now = Date.now()) {
  return state?.goldenSeedCollectedDayKey === getDayKey(now);
}

export function collectDailyGoldenSeed(state, { economy, life } = {}, now = Date.now()) {
  syncDailyReturnDay(state, now);
  const todayKey = getDayKey(now);
  if (state.goldenSeedCollectedDayKey === todayKey) {
    return { ok: false, reason: 'already-collected' };
  }

  state.goldenSeedCollectedDayKey = todayKey;
  const event = getDailyCityEvent(now);
  const spot = getDailyGoldenSeedSpot(now);
  const creditsAwarded = Math.round(75 * (event.goldenSeedMultiplier || 1));
  const xpAwarded = 25;

  if (economy) {
    earnGameCredits(economy, `Daily Golden Seed · ${spot.name}`, creditsAwarded);
  }
  if (life?.career) {
    life.career.xp = Math.max(0, (life.career.xp || 0) + xpAwarded);
    life.career.rank = Math.min(3, Math.floor(life.career.xp / 120));
  }

  const newlyCompleted = recordDailyActivity(state, 'golden-seed', 1, now);

  return {
    ok: true,
    spot,
    creditsAwarded,
    xpAwarded,
    newlyCompleted,
  };
}

export function calculateDailyOwnershipDividend({ economy, billboards, government, life } = {}) {
  const shopLeaseKeys = economy?.shopLeases && typeof economy.shopLeases === 'object'
    ? Object.keys(economy.shopLeases).length
    : 0;
  const mallShopKeys = economy?.mallShops && typeof economy.mallShops === 'object'
    ? Object.keys(economy.mallShops).length
    : 0;
  const mallShopCount = Math.max(shopLeaseKeys, mallShopKeys);
  const billboardCount = billboards?.leases && typeof billboards.leases === 'object'
    ? Object.keys(billboards.leases).length
    : 0;
  const isGovernor = Boolean(government?.isPlayerGovernor);
  const careerRank = Math.max(0, Number(life?.career?.rank) || 0);

  const baseResident = 35;
  const mallDividend = mallShopCount * 55;
  const billboardDividend = billboardCount * 45;
  const governorDividend = isGovernor ? 90 : 0;
  const careerDividend = careerRank * 15;
  const total = baseResident + mallDividend + billboardDividend + governorDividend + careerDividend;

  return {
    total,
    baseResident,
    mallShopCount,
    mallDividend,
    billboardCount,
    billboardDividend,
    isGovernor,
    governorDividend,
    careerRank,
    careerDividend,
  };
}

export function isDailyDividendAvailable(state, now = Date.now()) {
  return state?.dividendClaimedDayKey !== getDayKey(now);
}

export function collectDailyOwnershipDividend(state, { economy, billboards, government, life } = {}, now = Date.now()) {
  syncDailyReturnDay(state, now);
  const todayKey = getDayKey(now);
  if (state.dividendClaimedDayKey === todayKey) {
    return { ok: false, reason: 'already-claimed' };
  }

  const breakdown = calculateDailyOwnershipDividend({ economy, billboards, government, life });
  state.dividendClaimedDayKey = todayKey;

  if (economy) {
    earnGameCredits(economy, 'Daily Abuja Resident & Empire Dividend', breakdown.total);
  }

  const newlyCompleted = recordDailyActivity(state, 'business-collect', 1, now);

  return {
    ok: true,
    creditsAwarded: breakdown.total,
    breakdown,
    newlyCompleted,
  };
}

export function getDailyReturnActionCount(state, now = Date.now()) {
  syncDailyReturnDay(state, now);
  let count = 0;
  if (isDailyCheckInAvailable(state, now)) count += 1;
  if (isDailyDividendAvailable(state, now)) count += 1;
  for (const contract of state.contracts) {
    if (contract.completed && !contract.claimed) count += 1;
  }
  if (isDailyBonusChestReady(state, now)) count += 1;
  return count;
}
