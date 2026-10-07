export const LIFE_STORAGE_KEY = 'vertualworld-life-v1';
export const LIFE_NEED_KEYS = Object.freeze(['energy', 'hunger', 'hygiene', 'mood', 'social']);

export const RESIDENT_ORIGINS = Object.freeze([
  'Abuja',
  'Kaduna',
  'Enugu',
  'Kano',
  'Lagos',
  'Jos',
  'Port Harcourt',
]);

export const RESIDENT_OUTFITS = Object.freeze([
  Object.freeze({ id: 'forest', name: 'Greenway green', shirt: 0x4c745f, highlight: 0x688b71, trousers: 0xb7ad95 }),
  Object.freeze({ id: 'coral', name: 'Abuja coral', shirt: 0xb96750, highlight: 0xd68465, trousers: 0xd2bd9d }),
  Object.freeze({ id: 'indigo', name: 'Evening indigo', shirt: 0x485d87, highlight: 0x7188b4, trousers: 0xc7c5ba }),
  Object.freeze({ id: 'sunshine', name: 'Market sunshine', shirt: 0xc28a34, highlight: 0xe0ae50, trousers: 0x6f7460 }),
]);

export const LIFE_JOBS = Object.freeze([
  Object.freeze({
    id: 'cafe-assistant',
    title: 'Café assistant',
    workplace: 'cafe',
    workplaceName: 'Civic Café',
    blurb: 'Serve a few neighbours at the counter and learn the rhythm of the morning rush.',
    basePay: 150,
    tasks: Object.freeze([
      Object.freeze({
        prompt: 'A commuter wants a warm drink and something small to take away. What do you prepare?',
        answerId: 'coffee-bun',
        options: Object.freeze([
          Object.freeze({ id: 'coffee-bun', label: 'Fresh coffee + coconut bun' }),
          Object.freeze({ id: 'salad', label: 'Garden salad' }),
          Object.freeze({ id: 'groceries', label: 'A produce crate' }),
        ]),
      }),
      Object.freeze({
        prompt: 'A neighbour asks for a fresh, light lunch. Which plate do you recommend?',
        answerId: 'salad',
        options: Object.freeze([
          Object.freeze({ id: 'sandwich', label: 'Packed picnic sandwich' }),
          Object.freeze({ id: 'salad', label: 'Garden salad' }),
          Object.freeze({ id: 'coffee-bun', label: 'Coffee and coconut bun' }),
        ]),
      }),
      Object.freeze({
        prompt: 'Someone is heading across town and needs lunch packed for the road.',
        answerId: 'sandwich',
        options: Object.freeze([
          Object.freeze({ id: 'sandwich', label: 'A picnic sandwich' }),
          Object.freeze({ id: 'salad', label: 'A bowl to eat here' }),
          Object.freeze({ id: 'groceries', label: 'Market groceries' }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    id: 'market-clerk',
    title: 'Market clerk',
    workplace: 'market',
    workplaceName: 'Unity Market',
    blurb: 'Help neighbours find everyday staples and keep the shelves in order.',
    basePay: 175,
    tasks: Object.freeze([
      Object.freeze({
        prompt: 'A household is restocking breakfast for the week. Which bundle belongs in their basket?',
        answerId: 'eggs-bread',
        options: Object.freeze([
          Object.freeze({ id: 'eggs-bread', label: 'Eggs and bread' }),
          Object.freeze({ id: 'coffee', label: 'Fresh-brewed coffee' }),
          Object.freeze({ id: 'salad', label: 'Garden salad' }),
        ]),
      }),
      Object.freeze({
        prompt: 'A customer is planning dinner and asks for fresh ingredients.',
        answerId: 'produce',
        options: Object.freeze([
          Object.freeze({ id: 'pantry', label: 'Pantry staples' }),
          Object.freeze({ id: 'produce', label: 'A fresh produce crate' }),
          Object.freeze({ id: 'bun', label: 'Coconut bun' }),
        ]),
      }),
      Object.freeze({
        prompt: 'A neighbour has run out of basics for the kitchen shelf.',
        answerId: 'pantry',
        options: Object.freeze([
          Object.freeze({ id: 'sandwich', label: 'A picnic sandwich' }),
          Object.freeze({ id: 'pantry', label: 'Pantry staples' }),
          Object.freeze({ id: 'coffee', label: 'Fresh-brewed coffee' }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    id: 'stadium-steward',
    title: 'Stadium steward',
    workplace: 'stadium',
    workplaceName: 'Abuja Community Stadium',
    blurb: 'Help matchday visitors find their seats and enjoy a welcoming afternoon.',
    basePay: 190,
    tasks: Object.freeze([
      Object.freeze({
        prompt: 'A family has tickets for the east stand and is unsure where to go.',
        answerId: 'east-stand',
        options: Object.freeze([
          Object.freeze({ id: 'east-stand', label: 'Point out the east-stand entrance' }),
          Object.freeze({ id: 'leave', label: 'Tell them to leave the stadium' }),
          Object.freeze({ id: 'pitch', label: 'Send them across the pitch' }),
        ]),
      }),
      Object.freeze({
        prompt: 'A visitor needs step-free access to their section. What is the helpful next step?',
        answerId: 'access-help',
        options: Object.freeze([
          Object.freeze({ id: 'access-help', label: 'Guide them to the accessible entrance' }),
          Object.freeze({ id: 'crowd', label: 'Ask them to push through the crowd' }),
          Object.freeze({ id: 'ignore', label: 'Ignore the request' }),
        ]),
      }),
      Object.freeze({
        prompt: 'A young fan has become separated from their group.',
        answerId: 'help-desk',
        options: Object.freeze([
          Object.freeze({ id: 'help-desk', label: 'Stay nearby and contact the help desk' }),
          Object.freeze({ id: 'gate', label: 'Send them outside alone' }),
          Object.freeze({ id: 'crowd', label: 'Leave them in the crowd' }),
        ]),
      }),
    ]),
  }),
]);

export const LIFE_GOALS = Object.freeze([
  Object.freeze({ id: 'visit-cafe', label: 'Stop by Civic Café' }),
  Object.freeze({ id: 'visit-market', label: 'Browse Unity Market' }),
  Object.freeze({ id: 'visit-hall', label: 'Find the community hall' }),
  Object.freeze({ id: 'visit-stadium', label: 'Stop by the stadium' }),
  Object.freeze({ id: 'rest-home', label: 'Rest at home' }),
  Object.freeze({ id: 'share-a-meal', label: 'Try something local' }),
  Object.freeze({ id: 'connect-neighbour', label: 'Check in with Nia' }),
  Object.freeze({ id: 'work-shift', label: 'Finish a work shift' }),
  Object.freeze({ id: 'watch-match', label: 'Catch a match at the stadium' }),
]);

const jobsById = new Map(LIFE_JOBS.map((job) => [job.id, job]));
const origins = new Set(RESIDENT_ORIGINS);
const outfitsById = new Map(RESIDENT_OUTFITS.map((outfit) => [outfit.id, outfit]));
const goalsById = new Map(LIFE_GOALS.map((goal) => [goal.id, goal]));

const FOOD_EFFECTS = Object.freeze({
  'cafe-coffee': Object.freeze({ hunger: 5, energy: 12, mood: 3 }),
  'cafe-bun': Object.freeze({ hunger: 18, energy: 3, mood: 3 }),
  'cafe-salad': Object.freeze({ hunger: 23, hygiene: 2, mood: 4 }),
  'cafe-sandwich': Object.freeze({ hunger: 21, mood: 2 }),
  'market-produce': Object.freeze({ hunger: 25, hygiene: 2, mood: 3 }),
  'market-rice-beans': Object.freeze({ hunger: 25, energy: 3 }),
  'market-eggs-bread': Object.freeze({ hunger: 19, energy: 3 }),
  'market-pantry': Object.freeze({ hunger: 14 }),
});

const DEFAULT_NEEDS = Object.freeze({ energy: 84, hunger: 74, hygiene: 82, mood: 72, social: 58 });

function clampNeed(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(Math.max(0, Math.min(100, number)) * 10) / 10 : fallback;
}

function cleanName(value) {
  return String(value ?? '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20);
}

function makeEmptyGoals() {
  return Object.fromEntries(LIFE_GOALS.map(({ id }) => [id, false]));
}

export function createDefaultLife() {
  return {
    profile: { created: false, name: 'New Resident', origin: 'Abuja', outfit: 'forest' },
    needs: { ...DEFAULT_NEEDS },
    career: { jobId: 'cafe-assistant', xp: 0, rank: 0, shifts: 0 },
    activeShift: null,
    goals: makeEmptyGoals(),
  };
}

function normalizeActiveShift(value) {
  if (!value || typeof value !== 'object') return null;
  const job = jobsById.get(value.jobId);
  if (!job) return null;
  const taskIndex = Number(value.taskIndex);
  const correctAnswers = Number(value.correctAnswers);
  if (!Number.isInteger(taskIndex) || taskIndex < 0 || taskIndex >= job.tasks.length) return null;
  if (!Number.isInteger(correctAnswers) || correctAnswers < 0 || correctAnswers > taskIndex) return null;
  return { jobId: job.id, taskIndex, correctAnswers };
}

export function loadLife(storage) {
  const life = createDefaultLife();
  try {
    const raw = storage?.getItem(LIFE_STORAGE_KEY);
    if (!raw) return life;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return life;

    const profile = saved.profile && typeof saved.profile === 'object' ? saved.profile : {};
    const name = cleanName(profile.name);
    life.profile = {
      created: profile.created === true && name.length >= 2,
      name: name.length >= 2 ? name : 'New Resident',
      origin: origins.has(profile.origin) ? profile.origin : 'Abuja',
      outfit: outfitsById.has(profile.outfit) ? profile.outfit : 'forest',
    };

    const needs = saved.needs && typeof saved.needs === 'object' ? saved.needs : {};
    for (const key of Object.keys(DEFAULT_NEEDS)) life.needs[key] = clampNeed(needs[key], DEFAULT_NEEDS[key]);

    const career = saved.career && typeof saved.career === 'object' ? saved.career : {};
    const xp = Number(career.xp);
    life.career = {
      jobId: jobsById.has(career.jobId) ? career.jobId : 'cafe-assistant',
      xp: Number.isSafeInteger(xp) && xp >= 0 ? Math.min(xp, 100_000) : 0,
      rank: 0,
      shifts: Number.isSafeInteger(career.shifts) && career.shifts >= 0 ? Math.min(career.shifts, 100_000) : 0,
    };
    life.career.rank = Math.min(3, Math.floor(life.career.xp / 120));
    life.activeShift = normalizeActiveShift(saved.activeShift);

    if (saved.goals && typeof saved.goals === 'object') {
      for (const { id } of LIFE_GOALS) life.goals[id] = saved.goals[id] === true;
    }
  } catch {
    // The story stays playable if storage is unavailable or contains an old value.
  }
  return life;
}

export function saveLife(storage, life) {
  try {
    storage?.setItem(LIFE_STORAGE_KEY, JSON.stringify(life));
    return true;
  } catch {
    return false;
  }
}

export function createResident(life, { name, origin, outfit } = {}) {
  const residentName = cleanName(name);
  if (residentName.length < 2) return { ok: false, reason: 'name-too-short' };
  if (!origins.has(origin)) return { ok: false, reason: 'origin-not-found' };
  if (!outfitsById.has(outfit)) return { ok: false, reason: 'outfit-not-found' };
  life.profile = { created: true, name: residentName, origin, outfit };
  return { ok: true, profile: life.profile };
}

export function selectLifeJob(life, jobId) {
  if (life.activeShift) return { ok: false, reason: 'shift-active' };
  const job = jobsById.get(jobId);
  if (!job) return { ok: false, reason: 'job-not-found' };
  life.career.jobId = job.id;
  return { ok: true, job };
}

export function getSelectedLifeJob(life) {
  return jobsById.get(life.career.jobId) || LIFE_JOBS[0];
}

export function getActiveShiftTask(life) {
  if (!life.activeShift) return null;
  const job = jobsById.get(life.activeShift.jobId);
  return job?.tasks[life.activeShift.taskIndex] || null;
}

export function startLifeShift(life, workplaceId) {
  if (!life.profile.created) return { ok: false, reason: 'profile-needed' };
  if (life.activeShift) return { ok: false, reason: 'shift-active' };
  const job = getSelectedLifeJob(life);
  if (job.workplace !== workplaceId) return { ok: false, reason: 'wrong-workplace', job };
  if (life.needs.energy < 18) return { ok: false, reason: 'too-tired', job };
  life.activeShift = { jobId: job.id, taskIndex: 0, correctAnswers: 0 };
  return { ok: true, job, task: job.tasks[0] };
}

export function answerLifeShiftTask(life, optionId) {
  const activeShift = life.activeShift;
  const job = activeShift && jobsById.get(activeShift.jobId);
  const task = getActiveShiftTask(life);
  if (!job || !task) return { ok: false, reason: 'no-active-shift' };
  const chosenOption = task.options.find((option) => option.id === optionId);
  if (!chosenOption) return { ok: false, reason: 'invalid-answer' };
  const correct = optionId === task.answerId;
  if (correct) activeShift.correctAnswers += 1;
  activeShift.taskIndex += 1;

  if (activeShift.taskIndex < job.tasks.length) {
    return {
      ok: true,
      correct,
      complete: false,
      message: correct ? 'Good call. The neighbour leaves with what they need.' : 'Not quite, but you keep the queue moving.',
      task: job.tasks[activeShift.taskIndex],
    };
  }

  const correctAnswers = activeShift.correctAnswers;
  const oldRank = life.career.rank;
  const xpGained = 10 + correctAnswers * 28;
  life.career.xp += xpGained;
  life.career.rank = Math.min(3, Math.floor(life.career.xp / 120));
  life.career.shifts += 1;
  life.career.jobId = job.id;
  life.activeShift = null;
  adjustLifeNeeds(life, { energy: -20, hunger: -12, mood: 4, social: 2 });
  completeLifeGoal(life, 'work-shift');
  return {
    ok: true,
    correct,
    complete: true,
    correctAnswers,
    totalTasks: job.tasks.length,
    reward: job.basePay + correctAnswers * 18 + oldRank * 20,
    xpGained,
    rank: life.career.rank,
    rankUp: life.career.rank > oldRank,
    job,
  };
}

export function adjustLifeNeeds(life, changes = {}) {
  for (const key of LIFE_NEED_KEYS) {
    if (Number.isFinite(changes[key])) life.needs[key] = clampNeed(life.needs[key] + changes[key]);
  }
  return life.needs;
}

export function advanceLifeNeeds(life, elapsedGameMinutes) {
  const minutes = Number(elapsedGameMinutes);
  if (!Number.isFinite(minutes) || minutes <= 0) return false;
  const previous = { ...life.needs };
  adjustLifeNeeds(life, {
    hunger: -(minutes / 25),
    energy: -(minutes / 42),
    hygiene: -(minutes / 55),
    mood: -(minutes / 95),
    social: -(minutes / 110),
  });
  return LIFE_NEED_KEYS.some((key) => Math.floor(previous[key]) !== Math.floor(life.needs[key]));
}

export function restAtHome(life, isInsideHome) {
  if (!isInsideHome) return { ok: false, reason: 'not-at-home' };
  adjustLifeNeeds(life, { energy: 48, hunger: -7, mood: 7, social: 1 });
  completeLifeGoal(life, 'rest-home');
  return { ok: true, needs: life.needs };
}

export function enjoyMeal(life, productId) {
  const effects = FOOD_EFFECTS[productId];
  if (!effects) return { ok: false, reason: 'not-food' };
  adjustLifeNeeds(life, effects);
  completeLifeGoal(life, 'share-a-meal');
  return { ok: true, effects };
}

export function connectWithNeighbour(life) {
  adjustLifeNeeds(life, { social: 14, mood: 5 });
  completeLifeGoal(life, 'connect-neighbour');
  return { ok: true, needs: life.needs };
}

export function recordLifeVisit(life, goalId) {
  if (goalId === 'cafe') return completeLifeGoal(life, 'visit-cafe');
  if (goalId === 'market') return completeLifeGoal(life, 'visit-market');
  if (goalId === 'hall') return completeLifeGoal(life, 'visit-hall');
  if (goalId === 'stadium') return completeLifeGoal(life, 'visit-stadium');
  return false;
}

export function completeLifeGoal(life, goalId) {
  if (!goalsById.has(goalId) || life.goals[goalId]) return false;
  life.goals[goalId] = true;
  return true;
}

export function getLifeGoalProgress(life) {
  const completed = LIFE_GOALS.filter(({ id }) => life.goals[id]).length;
  return { completed, total: LIFE_GOALS.length };
}

export function getLifeRank(rank) {
  return ['New starter', 'Neighbourhood regular', 'Trusted local', 'Community favourite'][Math.max(0, Math.min(3, Math.floor(rank)))];
}

export function getOutfit(outfitId) {
  return outfitsById.get(outfitId) || RESIDENT_OUTFITS[0];
}

export function getFoodProductIds() {
  return Object.keys(FOOD_EFFECTS);
}
