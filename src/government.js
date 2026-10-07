export const GOVERNMENT_STORAGE_KEY = 'vertualworld-government-v1';

export const GOVERNOR_POLICIES = Object.freeze([
  Object.freeze({
    id: 'small-business-boost',
    title: 'Mall & Creator Showcase Grant',
    summary: 'Boosts Unity Mall virtual goods showcase sales by +25% for shop tenants.',
    mallSalesMultiplier: 1.25,
    workPayMultiplier: 1.0,
    approvalDelta: 6,
  }),
  Object.freeze({
    id: 'commuter-dividend',
    title: 'Civic Workforce & Commuter Dividend',
    summary: 'Adds a +20% civic bonus to shift pay at Civic Café, Unity Mall, and the stadium.',
    mallSalesMultiplier: 1.0,
    workPayMultiplier: 1.2,
    approvalDelta: 7,
  }),
  Object.freeze({
    id: 'housing-relief',
    title: 'Unity Court Neighbourhood Relief',
    summary: 'Supports tenants and families across Unity Court, raising citizen approval.',
    mallSalesMultiplier: 1.1,
    workPayMultiplier: 1.1,
    approvalDelta: 10,
  }),
  Object.freeze({
    id: 'festival-of-lights',
    title: 'Abuja Festival of Lights Charter',
    summary: 'Celebrates neighbourhood arts, commerce, and evening plaza gatherings.',
    mallSalesMultiplier: 1.15,
    workPayMultiplier: 1.1,
    approvalDelta: 9,
  }),
]);

export const PUBLIC_PROJECTS = Object.freeze([
  Object.freeze({
    id: 'solar-promenade',
    name: 'Solar Plaza & Promenade Beacons',
    cost: 240,
    approvalBoost: 8,
    treasuryReturn: 45,
    description: 'Clean solar lighting along Unity Circle, Unity Mall, and the community hall.',
  }),
  Object.freeze({
    id: 'transit-shelter-upgrade',
    name: 'Abuja Rail & Bus Commuter Canopies',
    cost: 320,
    approvalBoost: 10,
    treasuryReturn: 60,
    description: 'Shaded seating and live route boards at all three transit hubs.',
  }),
  Object.freeze({
    id: 'entrepreneur-hub',
    name: 'Unity Mall Digital Creator Incubator',
    cost: 400,
    approvalBoost: 12,
    treasuryReturn: 85,
    description: 'High-speed showcase kiosks and micro-grants for virtual goods creators.',
  }),
  Object.freeze({
    id: 'stadium-youth-cup',
    name: 'Community Stadium Youth Cup Endowment',
    cost: 360,
    approvalBoost: 10,
    treasuryReturn: 65,
    description: 'Supports local matchdays and youth athletics at Abuja Community Stadium.',
  }),
]);

export const TAX_RATES = Object.freeze([
  Object.freeze({ id: 'low', label: 'Low · 4%', ratePercent: 4, treasuryPerCycle: 95, approvalDelta: 5 }),
  Object.freeze({ id: 'balanced', label: 'Balanced · 8%', ratePercent: 8, treasuryPerCycle: 165, approvalDelta: 0 }),
  Object.freeze({ id: 'development', label: 'Development · 12%', ratePercent: 12, treasuryPerCycle: 245, approvalDelta: -6 }),
]);

export const CIVIC_PETITIONS = Object.freeze([
  Object.freeze({
    id: 'petition-mall-lighting',
    citizen: 'Hauwa Musa · Unity Mall Vendor',
    prompt: 'Evening shoppers want brighter walkway lanterns between the rail crossing and Unity Mall.',
    resolution: 'Approved evening promenade lanterns and vendor safety patrols.',
    treasuryGrant: 110,
    governorStipend: 65,
    approvalBoost: 6,
  }),
  Object.freeze({
    id: 'petition-Drainage-greenway',
    citizen: 'Ibrahim Bello · Unity Court Resident',
    prompt: 'Rainwater pools near the east lane roundabout after heavy savannah showers.',
    resolution: 'Cleared the greenway culverts and planted absorbent verge shrubs.',
    treasuryGrant: 125,
    governorStipend: 70,
    approvalBoost: 7,
  }),
  Object.freeze({
    id: 'petition-youth-market-day',
    citizen: 'Chidinma Okafor · Creative Guild',
    prompt: 'Local digital artists want an open showcase afternoon in the mall atrium.',
    resolution: 'Sponsored the Unity Mall Open Showcase and waived student kiosk fees.',
    treasuryGrant: 140,
    governorStipend: 80,
    approvalBoost: 8,
  }),
]);

const policyById = new Map(GOVERNOR_POLICIES.map((policy) => [policy.id, policy]));
const projectById = new Map(PUBLIC_PROJECTS.map((project) => [project.id, project]));
const taxRateById = new Map(TAX_RATES.map((rate) => [rate.id, rate]));

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sanitizeText(value, maxLength = 42, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
  return cleaned.length >= 2 ? cleaned : fallback;
}

export function createDefaultGovernment() {
  return {
    incumbentName: 'Danjuma Bello',
    isPlayerGovernor: false,
    governorName: 'Danjuma Bello',
    governorTitle: 'Governor of Unity Court',
    termNumber: 1,
    campaignSlogan: 'Forward together for every lane in Abuja',
    campaignPlatformId: 'small-business-boost',
    activePolicyId: 'small-business-boost',
    taxRateId: 'balanced',
    approval: 58,
    campaignSupport: 46,
    treasury: 520,
    completedProjects: [],
    townHallsHeld: 0,
    electionsWon: 0,
    nextPetitionIndex: 0,
    lastElectionSummary: 'Governor Danjuma Bello leads the first civic term. Campaign at Unity Community Hall to run for Governor.',
  };
}

export function loadGovernment(storage) {
  const state = createDefaultGovernment();
  try {
    const raw = storage?.getItem(GOVERNMENT_STORAGE_KEY);
    if (!raw) return state;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return state;
    state.isPlayerGovernor = Boolean(saved.isPlayerGovernor);
    state.governorName = sanitizeText(saved.governorName, 26, state.incumbentName);
    state.termNumber = Number.isSafeInteger(saved.termNumber) && saved.termNumber >= 1 ? saved.termNumber : 1;
    state.campaignSlogan = sanitizeText(saved.campaignSlogan, 64, state.campaignSlogan);
    if (policyById.has(saved.campaignPlatformId)) state.campaignPlatformId = saved.campaignPlatformId;
    if (policyById.has(saved.activePolicyId)) state.activePolicyId = saved.activePolicyId;
    if (taxRateById.has(saved.taxRateId)) state.taxRateId = saved.taxRateId;
    if (Number.isFinite(saved.approval)) state.approval = clamp(Math.round(saved.approval), 10, 100);
    if (Number.isFinite(saved.campaignSupport)) state.campaignSupport = clamp(Math.round(saved.campaignSupport), 10, 100);
    if (Number.isSafeInteger(saved.treasury) && saved.treasury >= 0) state.treasury = Math.min(saved.treasury, 1_000_000);
    if (Array.isArray(saved.completedProjects)) {
      const seen = new Set();
      state.completedProjects = saved.completedProjects.filter((id) => {
        if (typeof id !== 'string' || !projectById.has(id) || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    }
    if (Number.isSafeInteger(saved.townHallsHeld) && saved.townHallsHeld >= 0) state.townHallsHeld = saved.townHallsHeld;
    if (Number.isSafeInteger(saved.electionsWon) && saved.electionsWon >= 0) state.electionsWon = saved.electionsWon;
    if (Number.isSafeInteger(saved.nextPetitionIndex) && saved.nextPetitionIndex >= 0) {
      state.nextPetitionIndex = saved.nextPetitionIndex % CIVIC_PETITIONS.length;
    }
    state.lastElectionSummary = sanitizeText(saved.lastElectionSummary, 140, state.lastElectionSummary);
  } catch {
    // Keep civic governance playable even if local storage is unavailable.
  }
  return state;
}

export function saveGovernment(storage, state) {
  try {
    storage?.setItem(GOVERNMENT_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function getActiveGovernorPolicy(state) {
  return policyById.get(state?.activePolicyId) || GOVERNOR_POLICIES[0];
}

export function getActiveTaxRate(state) {
  return taxRateById.get(state?.taxRateId) || TAX_RATES[1];
}

export function getNextCivicPetition(state) {
  const index = (state?.nextPetitionIndex || 0) % CIVIC_PETITIONS.length;
  return CIVIC_PETITIONS[index];
}

export function updateCampaignPlatform(state, { slogan, platformId, candidateName } = {}) {
  if (typeof slogan === 'string') {
    const cleaned = sanitizeText(slogan, 64, '');
    if (!cleaned) return { ok: false, reason: 'invalid-slogan' };
    state.campaignSlogan = cleaned;
  }
  if (platformId) {
    if (!policyById.has(platformId)) return { ok: false, reason: 'invalid-policy' };
    state.campaignPlatformId = platformId;
  }
  if (candidateName && state.isPlayerGovernor) {
    state.governorName = sanitizeText(candidateName, 26, state.governorName);
  }
  state.campaignSupport = clamp(state.campaignSupport + 3, 10, 100);
  return { ok: true, campaignSupport: state.campaignSupport, campaignSlogan: state.campaignSlogan };
}

export function canvassNeighboursForCampaign(state, { atCommunityHall = false } = {}) {
  const gain = atCommunityHall ? 12 : 7;
  state.campaignSupport = clamp(state.campaignSupport + gain, 10, 100);
  state.approval = clamp(state.approval + (atCommunityHall ? 4 : 2), 10, 100);
  return {
    ok: true,
    gain,
    campaignSupport: state.campaignSupport,
    approval: state.approval,
  };
}

export function runGovernorElection(state, candidateName = 'Resident') {
  const cleanCandidate = sanitizeText(candidateName, 26, 'Resident');
  const projectBonus = (state.completedProjects?.length || 0) * 3;
  const voteShare = clamp(Math.round(state.campaignSupport + projectBonus), 15, 96);
  const won = voteShare >= 51;
  if (won) {
    state.isPlayerGovernor = true;
    state.governorName = cleanCandidate;
    state.termNumber += 1;
    state.electionsWon += 1;
    state.activePolicyId = state.campaignPlatformId || state.activePolicyId;
    state.approval = clamp(Math.max(state.approval, voteShare), 52, 100);
    state.treasury += 180;
    state.lastElectionSummary = `Governor ${cleanCandidate} won Term ${state.termNumber} with ${voteShare}% of the Unity Court vote!`;
  } else {
    state.lastElectionSummary = `${cleanCandidate} earned ${voteShare}% of the vote (51% needed). Canvass neighbours or hold a town hall at Unity Community Hall to win!`;
  }
  return {
    ok: true,
    won,
    voteShare,
    governorName: state.governorName,
    termNumber: state.termNumber,
    summary: state.lastElectionSummary,
  };
}

export function enactGovernorPolicy(state, policyId) {
  if (!state.isPlayerGovernor) return { ok: false, reason: 'not-governor' };
  const policy = policyById.get(policyId);
  if (!policy) return { ok: false, reason: 'invalid-policy' };
  state.activePolicyId = policy.id;
  state.campaignPlatformId = policy.id;
  state.approval = clamp(state.approval + Math.max(2, Math.round(policy.approvalDelta / 2)), 10, 100);
  return { ok: true, policy, approval: state.approval };
}

export function setGovernorTaxRate(state, taxRateId) {
  if (!state.isPlayerGovernor) return { ok: false, reason: 'not-governor' };
  const rate = taxRateById.get(taxRateId);
  if (!rate) return { ok: false, reason: 'invalid-rate' };
  state.taxRateId = rate.id;
  state.approval = clamp(state.approval + rate.approvalDelta, 10, 100);
  return { ok: true, rate, approval: state.approval };
}

export function fundPublicProject(state, projectId) {
  if (!state.isPlayerGovernor) return { ok: false, reason: 'not-governor' };
  const project = projectById.get(projectId);
  if (!project) return { ok: false, reason: 'project-not-found' };
  if (state.completedProjects.includes(project.id)) {
    return { ok: false, reason: 'already-completed' };
  }
  if (state.treasury < project.cost) {
    return { ok: false, reason: 'insufficient-treasury', cost: project.cost, treasury: state.treasury };
  }
  state.treasury -= project.cost;
  state.completedProjects.push(project.id);
  state.approval = clamp(state.approval + project.approvalBoost, 10, 100);
  state.campaignSupport = clamp(state.campaignSupport + 5, 10, 100);
  return {
    ok: true,
    project,
    treasury: state.treasury,
    approval: state.approval,
  };
}

export function holdCivicTownHall(state) {
  const petition = getNextCivicPetition(state);
  const taxRate = getActiveTaxRate(state);
  const projectDividend = state.completedProjects.reduce((sum, id) => {
    const project = projectById.get(id);
    return sum + (project ? project.treasuryReturn : 0);
  }, 0);
  const treasuryAdded = petition.treasuryGrant + taxRate.treasuryPerCycle + projectDividend;
  state.treasury += treasuryAdded;
  state.townHallsHeld += 1;
  state.approval = clamp(state.approval + petition.approvalBoost, 10, 100);
  state.campaignSupport = clamp(state.campaignSupport + 8, 10, 100);
  state.nextPetitionIndex = (state.nextPetitionIndex + 1) % CIVIC_PETITIONS.length;
  const stipend = state.isPlayerGovernor ? petition.governorStipend : Math.round(petition.governorStipend * 0.5);
  return {
    ok: true,
    petition,
    treasuryAdded,
    treasury: state.treasury,
    stipend,
    approval: state.approval,
    campaignSupport: state.campaignSupport,
  };
}
