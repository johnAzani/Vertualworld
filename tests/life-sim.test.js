import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LIFE_GOALS,
  LIFE_JOBS,
  LIFE_STORAGE_KEY,
  advanceLifeNeeds,
  answerLifeShiftTask,
  connectWithNeighbour,
  createDefaultLife,
  createResident,
  enjoyMeal,
  getActiveShiftTask,
  getLifeGoalProgress,
  loadLife,
  recordLifeVisit,
  restAtHome,
  saveLife,
  selectLifeJob,
  startLifeShift,
} from '../src/life-sim.js';

function makeStorage() {
  const values = new Map();
  return {
    values,
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  };
}

test('resident profiles are validated, sanitised and persisted on this device', () => {
  const life = createDefaultLife();
  assert.equal(createResident(life, { name: '<>', origin: 'Abuja', outfit: 'forest' }).reason, 'name-too-short');
  assert.equal(createResident(life, { name: 'Ada', origin: 'Elsewhere', outfit: 'forest' }).reason, 'origin-not-found');
  assert.deepEqual(createResident(life, { name: '  Ada  Bello ', origin: 'Kaduna', outfit: 'coral' }), {
    ok: true,
    profile: { created: true, name: 'Ada Bello', origin: 'Kaduna', outfit: 'coral' },
  });

  const storage = makeStorage();
  assert.equal(saveLife(storage, life), true);
  assert.equal(storage.values.has(LIFE_STORAGE_KEY), true);
  assert.deepEqual(loadLife(storage), life);
});

test('stored life data is bounded and invalid jobs, needs and shifts are ignored', () => {
  const storage = makeStorage();
  storage.setItem(LIFE_STORAGE_KEY, JSON.stringify({
    profile: { created: true, name: '<Amina>', origin: 'Unknown', outfit: 'neon' },
    needs: { energy: 170, hunger: -20, hygiene: 'high' },
    career: { jobId: 'admin', xp: -30, shifts: -1 },
    activeShift: { jobId: 'not-a-job', taskIndex: 99, correctAnswers: 2 },
    goals: { 'visit-cafe': true, 'unknown-goal': true },
  }));

  const life = loadLife(storage);
  assert.deepEqual(life.profile, { created: true, name: 'Amina', origin: 'Abuja', outfit: 'forest' });
  assert.equal(life.needs.energy, 100);
  assert.equal(life.needs.hunger, 0);
  assert.equal(life.needs.hygiene, 82);
  assert.equal(life.career.jobId, 'cafe-assistant');
  assert.equal(life.career.xp, 0);
  assert.equal(life.activeShift, null);
  assert.equal(life.goals['visit-cafe'], true);
  assert.equal(Object.hasOwn(life.goals, 'unknown-goal'), false);
});

test('jobs require the selected real location and energy before clocking in', () => {
  const life = createDefaultLife();
  createResident(life, { name: 'Amina', origin: 'Abuja', outfit: 'forest' });
  assert.equal(startLifeShift(life, 'market').reason, 'wrong-workplace');
  assert.equal(startLifeShift(life, 'cafe').ok, true);
  assert.ok(getActiveShiftTask(life));
  assert.equal(selectLifeJob(life, 'market-clerk').reason, 'shift-active');

  const tiredLife = createDefaultLife();
  createResident(tiredLife, { name: 'Amina', origin: 'Abuja', outfit: 'forest' });
  tiredLife.needs.energy = 17;
  assert.equal(startLifeShift(tiredLife, 'cafe').reason, 'too-tired');
});

test('three shift orders produce game-credit pay, career XP and a promotion', () => {
  const life = createDefaultLife();
  createResident(life, { name: 'Amina', origin: 'Abuja', outfit: 'forest' });
  assert.equal(startLifeShift(life, 'cafe').ok, true);
  const job = LIFE_JOBS.find(({ id }) => id === 'cafe-assistant');
  let result;
  for (const task of job.tasks) result = answerLifeShiftTask(life, task.answerId);

  assert.equal(result.complete, true);
  assert.equal(result.correctAnswers, 3);
  assert.equal(result.reward, 204);
  assert.equal(result.rankUp, false);
  assert.equal(life.career.xp, 94);
  assert.equal(life.career.shifts, 1);
  assert.equal(life.activeShift, null);
  assert.equal(life.goals['work-shift'], true);

  assert.equal(selectLifeJob(life, 'market-clerk').ok, true);
  assert.equal(startLifeShift(life, 'market').ok, true);
  for (const task of LIFE_JOBS.find(({ id }) => id === 'market-clerk').tasks) {
    result = answerLifeShiftTask(life, task.answerId);
  }
  assert.equal(result.rankUp, true);
  assert.equal(life.career.rank, 1);
  assert.equal(getLifeGoalProgress(life).total, LIFE_GOALS.length);
});

test('invalid shift answers do not advance tasks; wrong valid choices do', () => {
  const life = createDefaultLife();
  createResident(life, { name: 'Amina', origin: 'Abuja', outfit: 'forest' });
  startLifeShift(life, 'cafe');
  assert.equal(answerLifeShiftTask(life, 'unknown').reason, 'invalid-answer');
  assert.equal(life.activeShift.taskIndex, 0);
  const result = answerLifeShiftTask(life, 'salad');
  assert.equal(result.correct, false);
  assert.equal(life.activeShift.taskIndex, 1);
});

test('needs drift gently and home, meals and neighbour check-ins improve the right needs', () => {
  const life = createDefaultLife();
  const initial = { ...life.needs };
  advanceLifeNeeds(life, 25);
  assert.equal(life.needs.hunger, initial.hunger - 1);
  assert.equal(life.needs.energy < initial.energy, true);
  assert.equal(restAtHome(life, false).reason, 'not-at-home');
  assert.equal(restAtHome(life, true).ok, true);
  assert.ok(life.needs.energy > initial.energy);
  assert.equal(enjoyMeal(life, 'cafe-bun').ok, true);
  assert.equal(life.goals['share-a-meal'], true);
  assert.equal(enjoyMeal(life, 'not-food').reason, 'not-food');
  connectWithNeighbour(life);
  assert.equal(life.goals['connect-neighbour'], true);
  assert.ok(life.needs.social > initial.social);
});

test('neighbourhood visits and goal completion are one-time events', () => {
  const life = createDefaultLife();
  assert.equal(recordLifeVisit(life, 'cafe'), true);
  assert.equal(recordLifeVisit(life, 'cafe'), false);
  assert.equal(recordLifeVisit(life, 'stadium'), true);
  assert.equal(life.goals['watch-match'], false);
  assert.equal(life.goals['visit-stadium'], true);
  assert.equal(getLifeGoalProgress(life).completed, 2);
});

test('all shift jobs have three answerable tasks with a valid correct option', () => {
  for (const job of LIFE_JOBS) {
    assert.equal(job.tasks.length, 3);
    for (const task of job.tasks) {
      assert.ok(task.options.some(({ id }) => id === task.answerId));
    }
  }
});
