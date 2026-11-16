import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GOVERNMENT_STORAGE_KEY,
  GOVERNOR_POLICIES,
  PUBLIC_PROJECTS,
  canvassNeighboursForCampaign,
  createDefaultGovernment,
  enactGovernorPolicy,
  fundPublicProject,
  getActiveGovernorPolicy,
  holdCivicTownHall,
  loadGovernment,
  runGovernorElection,
  saveGovernment,
  setGovernorTaxRate,
  updateCampaignPlatform,
} from '../src/government.js';

test('residents can campaign, win a gubernatorial election, enact policies, and fund public works', () => {
  const gov = createDefaultGovernment();
  assert.equal(gov.isPlayerGovernor, false);
  assert.equal(enactGovernorPolicy(gov, 'commuter-dividend').reason, 'not-governor');

  assert.equal(
    updateCampaignPlatform(gov, {
      slogan: 'Prosperity for Unity Court and Unity Mall',
      platformId: 'commuter-dividend',
    }).ok,
    true,
  );
  canvassNeighboursForCampaign(gov, { atCommunityHall: true });

  const election = runGovernorElection(gov, 'Amina');
  assert.equal(election.ok, true);
  assert.equal(election.won, true);
  assert.equal(gov.isPlayerGovernor, true);
  assert.equal(gov.governorName, 'Amina');
  assert.equal(getActiveGovernorPolicy(gov).id, 'commuter-dividend');

  const policyResult = enactGovernorPolicy(gov, 'small-business-boost');
  assert.equal(policyResult.ok, true);
  assert.equal(getActiveGovernorPolicy(gov).mallSalesMultiplier, 1.25);

  assert.equal(setGovernorTaxRate(gov, 'development').ok, true);

  const projectResult = fundPublicProject(gov, 'solar-promenade');
  assert.equal(projectResult.ok, true);
  assert.equal(gov.completedProjects.includes('solar-promenade'), true);
  assert.equal(fundPublicProject(gov, 'solar-promenade').reason, 'already-completed');

  const townHall = holdCivicTownHall(gov);
  assert.equal(townHall.ok, true);
  assert.ok(townHall.treasuryAdded > 200);
  assert.ok(townHall.stipend >= 65);
  assert.equal(GOVERNOR_POLICIES.length, 4);
  assert.equal(PUBLIC_PROJECTS.length, 4);
});

test('government state round-trips through local storage and sanitises invalid entries', () => {
  const values = new Map();
  const storage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  };
  const gov = createDefaultGovernment();
  canvassNeighboursForCampaign(gov, { atCommunityHall: true });
  runGovernorElection(gov, 'Zainab');
  fundPublicProject(gov, 'solar-promenade');
  saveGovernment(storage, gov);

  const loaded = loadGovernment(storage);
  assert.equal(values.has(GOVERNMENT_STORAGE_KEY), true);
  assert.deepEqual(loaded, gov);

  values.set(
    GOVERNMENT_STORAGE_KEY,
    JSON.stringify({
      isPlayerGovernor: true,
      governorName: '  ',
      activePolicyId: 'not-a-policy',
      taxRateId: 'not-a-rate',
      completedProjects: ['solar-promenade', 'invalid-project', 'solar-promenade'],
      treasury: -90,
    }),
  );
  const sanitized = loadGovernment(storage);
  assert.equal(sanitized.governorName, 'Danjuma Bello');
  assert.equal(sanitized.activePolicyId, 'small-business-boost');
  assert.equal(sanitized.taxRateId, 'balanced');
  assert.deepEqual(sanitized.completedProjects, ['solar-promenade']);
  assert.equal(sanitized.treasury, 520);
});
