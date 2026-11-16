import { BILLBOARD_LAYOUT } from './world-layout.js';
import { earnGameCredits } from './economy.js';

export const BILLBOARD_STORAGE_KEY = 'vertualworld-abuja-billboards-v1';

export const BILLBOARD_THEMES = Object.freeze([
  Object.freeze({
    id: 'emerald',
    label: 'Emerald Civic',
    bgTop: '#16382c',
    bgBottom: '#235946',
    accent: '#f2ca68',
    badgeBg: '#2e6b54',
    text: '#f8f5ec',
  }),
  Object.freeze({
    id: 'gold',
    label: 'Abuja Gold',
    bgTop: '#332814',
    bgBottom: '#5c451d',
    accent: '#ffd86b',
    badgeBg: '#7a5c24',
    text: '#fff9ec',
  }),
  Object.freeze({
    id: 'terracotta',
    label: 'Terracotta Market',
    bgTop: '#4a2518',
    bgBottom: '#783c26',
    accent: '#f5c77e',
    badgeBg: '#944a30',
    text: '#fcf5ee',
  }),
  Object.freeze({
    id: 'royal',
    label: 'Royal Night',
    bgTop: '#16283d',
    bgBottom: '#234264',
    accent: '#7cd4f5',
    badgeBg: '#2f5885',
    text: '#f4f9ff',
  }),
  Object.freeze({
    id: 'sunset',
    label: 'Savannah Sunset',
    bgTop: '#3e1f33',
    bgBottom: '#6b3048',
    accent: '#ffb86c',
    badgeBg: '#8c3f58',
    text: '#fff6f0',
  }),
]);

export const BILLBOARD_CAMPAIGN_TYPES = Object.freeze([
  Object.freeze({
    id: 'mall',
    label: 'Unity Mall Storefront Promo',
    perk: '+15% Unity Mall showcase sales per active Mall billboard (up to +45%)',
  }),
  Object.freeze({
    id: 'civic',
    label: 'Governor & Civic Campaign',
    perk: '+10% Gubernatorial voter support or +5% Governor approval on launch',
  }),
  Object.freeze({
    id: 'brand',
    label: 'Abuja Brand & Commercial Ad',
    perk: '+20% direct ad impression payout when collecting billboard revenue',
  }),
]);

function sanitiseText(value, fallback, maxLength = 54) {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
  return cleaned.length >= 2 ? cleaned : fallback;
}

export function getBillboardById(billboardId) {
  return BILLBOARD_LAYOUT.find((item) => item.id === billboardId) || null;
}

export function getBillboardTheme(themeId) {
  return BILLBOARD_THEMES.find((item) => item.id === themeId) || BILLBOARD_THEMES[0];
}

export function createInitialBillboardState() {
  return {
    leases: {},
    totalRevenueCollected: 0,
    totalCampaignsLaunched: 0,
  };
}

function sanitiseBillboardLease(billboard, rawLease) {
  if (!rawLease || typeof rawLease !== 'object') return null;
  const theme = getBillboardTheme(rawLease.theme).id;
  const campaignType = BILLBOARD_CAMPAIGN_TYPES.some((item) => item.id === rawLease.campaignType)
    ? rawLease.campaignType
    : billboard.defaultAd.campaignType;
  return {
    billboardId: billboard.id,
    advertiserName: sanitiseText(rawLease.advertiserName, 'Abuja Resident', 32),
    badge: sanitiseText(rawLease.badge, billboard.defaultAd.badge, 38),
    headline: sanitiseText(rawLease.headline, billboard.defaultAd.headline, 46),
    subline: sanitiseText(rawLease.subline, billboard.defaultAd.subline, 68),
    cta: sanitiseText(rawLease.cta, billboard.defaultAd.cta, 28),
    theme,
    campaignType,
    collections: Number.isFinite(rawLease.collections) && rawLease.collections >= 0
      ? Math.floor(rawLease.collections)
      : 0,
    revenueEarned: Number.isFinite(rawLease.revenueEarned) && rawLease.revenueEarned >= 0
      ? Math.floor(rawLease.revenueEarned)
      : 0,
  };
}

export function loadBillboardState(storage = globalThis.localStorage) {
  const initial = createInitialBillboardState();
  try {
    const raw = storage?.getItem(BILLBOARD_STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return initial;
    const leases = {};
    if (parsed.leases && typeof parsed.leases === 'object') {
      for (const billboard of BILLBOARD_LAYOUT) {
        const cleanLease = sanitiseBillboardLease(billboard, parsed.leases[billboard.id]);
        if (cleanLease) leases[billboard.id] = cleanLease;
      }
    }
    return {
      leases,
      totalRevenueCollected: Number.isFinite(parsed.totalRevenueCollected) && parsed.totalRevenueCollected >= 0
        ? Math.floor(parsed.totalRevenueCollected)
        : 0,
      totalCampaignsLaunched: Number.isFinite(parsed.totalCampaignsLaunched) && parsed.totalCampaignsLaunched >= 0
        ? Math.floor(parsed.totalCampaignsLaunched)
        : 0,
    };
  } catch {
    return initial;
  }
}

export function saveBillboardState(state, storage = globalThis.localStorage) {
  try {
    storage?.setItem(BILLBOARD_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function getBillboardDisplayState(state, billboardId) {
  const billboard = getBillboardById(billboardId);
  if (!billboard) return null;
  const lease = state?.leases?.[billboard.id] || null;
  const activeAd = lease || billboard.defaultAd;
  const theme = getBillboardTheme(activeAd.theme);
  const campaignTypeObj = BILLBOARD_CAMPAIGN_TYPES.find((item) => item.id === activeAd.campaignType)
    || BILLBOARD_CAMPAIGN_TYPES[0];
  return {
    billboard,
    isLeased: Boolean(lease),
    lease,
    advertiserName: lease ? lease.advertiserName : 'Abuja Civic Media',
    badge: activeAd.badge,
    headline: activeAd.headline,
    subline: activeAd.subline,
    cta: activeAd.cta,
    theme,
    campaignType: campaignTypeObj,
  };
}

export function getBillboardBonuses(state) {
  const activeLeases = Object.values(state?.leases || {});
  const mallCount = activeLeases.filter((lease) => lease.campaignType === 'mall').length;
  const civicCount = activeLeases.filter((lease) => lease.campaignType === 'civic').length;
  const brandCount = activeLeases.filter((lease) => lease.campaignType === 'brand').length;
  return {
    activeLeaseCount: activeLeases.length,
    mallCount,
    civicCount,
    brandCount,
    mallSalesBonusMultiplier: Number((1 + Math.min(3, mallCount) * 0.15).toFixed(2)),
  };
}

export function rentBillboard(state, economy, billboardId, options = {}) {
  const billboard = getBillboardById(billboardId);
  if (!billboard) return { ok: false, reason: 'unknown-billboard' };
  if (state.leases?.[billboard.id]) return { ok: false, reason: 'already-leased' };

  if (!economy || typeof economy.wallet !== 'number' || economy.wallet < billboard.leaseCost) {
    return { ok: false, reason: 'insufficient-funds', needed: billboard.leaseCost };
  }
  economy.wallet -= billboard.leaseCost;
  if (!Array.isArray(economy.ledger)) economy.ledger = [];
  economy.ledger.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    description: `Billboard lease · ${billboard.name} (${billboard.code})`,
    amount: -billboard.leaseCost,
    occurredAt: Date.now(),
  });

  const advertiserName = sanitiseText(options.advertiserName, 'Abuja Resident', 32);
  const lease = sanitiseBillboardLease(billboard, {
    advertiserName,
    badge: options.badge || `${advertiserName.toUpperCase()} · ${billboard.code}`,
    headline: options.headline || `${advertiserName.toUpperCase()} LIVE IN ABUJA`,
    subline: options.subline || `Featured on ${billboard.name} · ${billboard.locationLabel}`,
    cta: options.cta || 'VISIT TODAY',
    theme: options.theme || billboard.defaultAd.theme,
    campaignType: options.campaignType || billboard.defaultAd.campaignType,
    collections: 0,
    revenueEarned: 0,
  });

  state.leases[billboard.id] = lease;
  state.totalCampaignsLaunched = (state.totalCampaignsLaunched || 0) + 1;

  return {
    ok: true,
    billboard,
    lease,
    cost: billboard.leaseCost,
  };
}

export function updateBillboardCampaign(state, billboardId, campaignInput = {}) {
  const billboard = getBillboardById(billboardId);
  if (!billboard) return { ok: false, reason: 'unknown-billboard' };
  const currentLease = state.leases?.[billboard.id];
  if (!currentLease) return { ok: false, reason: 'not-leased' };

  const rawHeadline = typeof campaignInput.headline === 'string' ? campaignInput.headline.trim() : '';
  if (rawHeadline.length < 2) {
    return { ok: false, reason: 'headline-too-short' };
  }

  const updated = sanitiseBillboardLease(billboard, {
    ...currentLease,
    advertiserName: campaignInput.advertiserName || currentLease.advertiserName,
    badge: campaignInput.badge || currentLease.badge,
    headline: rawHeadline,
    subline: campaignInput.subline || currentLease.subline,
    cta: campaignInput.cta || currentLease.cta,
    theme: campaignInput.theme || currentLease.theme,
    campaignType: campaignInput.campaignType || currentLease.campaignType,
  });

  state.leases[billboard.id] = updated;
  state.totalCampaignsLaunched = (state.totalCampaignsLaunched || 0) + 1;

  return {
    ok: true,
    billboard,
    lease: updated,
  };
}

export function applyQuickBillboardPreset(state, billboardId, presetType, context = {}) {
  const billboard = getBillboardById(billboardId);
  if (!billboard) return { ok: false, reason: 'unknown-billboard' };
  const currentLease = state.leases?.[billboard.id];
  if (!currentLease) return { ok: false, reason: 'not-leased' };

  const residentName = sanitiseText(context.residentName, currentLease.advertiserName, 32);
  let preset = null;

  if (presetType === 'mall') {
    const shopName = sanitiseText(context.shopName, `${residentName}'s Abuja Studio`, 38);
    const shopTagline = sanitiseText(
      context.shopTagline,
      'Exclusive 3D Virtual Goods · Visit Our Storefront at Unity Mall',
      64,
    );
    const shopCode = sanitiseText(context.shopCode, 'UNITY MALL', 18);
    preset = {
      advertiserName: residentName,
      badge: `UNITY MALL · ${shopCode.toUpperCase()}`,
      headline: shopName.toUpperCase(),
      subline: shopTagline,
      cta: 'SHOP AT UNITY MALL',
      theme: 'emerald',
      campaignType: 'mall',
    };
  } else if (presetType === 'civic') {
    const slogan = sanitiseText(
      context.campaignSlogan,
      'Forward Unity Court: Prosperity, Light & Clean Streets for All!',
      64,
    );
    const titlePrefix = context.isPlayerGovernor ? `GOV. ${residentName.toUpperCase()}` : `VOTE ${residentName.toUpperCase()} FOR GOVERNOR`;
    preset = {
      advertiserName: residentName,
      badge: context.isPlayerGovernor ? 'EXECUTIVE CIVIC BROADCAST' : 'GUBERNATORIAL CAMPAIGN · UNITY COURT',
      headline: titlePrefix,
      subline: slogan,
      cta: 'UNITY COMMUNITY HALL',
      theme: 'gold',
      campaignType: 'civic',
    };
  } else {
    const origin = sanitiseText(context.residentOrigin, 'Abuja', 24);
    preset = {
      advertiserName: residentName,
      badge: `ABUJA SPOTLIGHT · ${origin.toUpperCase()}`,
      headline: `${residentName.toUpperCase()} CREATIVE NETWORK`,
      subline: `Connecting ${billboard.locationLabel} · ${billboard.dailyImpressions.toLocaleString()} Daily Views`,
      cta: 'CONNECT ON PHONE',
      theme: 'royal',
      campaignType: 'brand',
    };
  }

  return updateBillboardCampaign(state, billboardId, preset);
}

export function collectBillboardRevenue(state, economy, billboardId, options = {}) {
  const billboard = getBillboardById(billboardId);
  if (!billboard) return { ok: false, reason: 'unknown-billboard' };
  const lease = state.leases?.[billboard.id];
  if (!lease) return { ok: false, reason: 'not-leased' };

  const brandMultiplier = lease.campaignType === 'brand' ? 1.2 : 1;
  const policyMultiplier = Number.isFinite(options.policyMultiplier) && options.policyMultiplier > 0
    ? options.policyMultiplier
    : 1;
  const mallSynergyBonus = lease.campaignType === 'mall' && options.hasMallShop ? 8 : 0;
  const payout = Math.max(
    10,
    Math.round(billboard.payoutPerCollection * brandMultiplier * policyMultiplier) + mallSynergyBonus,
  );

  earnGameCredits(
    economy,
    `Billboard ad payout · ${billboard.code} (${lease.headline.slice(0, 24)})`,
    payout,
  );

  lease.collections += 1;
  lease.revenueEarned += payout;
  state.totalRevenueCollected = (state.totalRevenueCollected || 0) + payout;

  return {
    ok: true,
    billboard,
    lease,
    payout,
    impressions: billboard.dailyImpressions,
  };
}

export function endBillboardLease(state, billboardId) {
  const billboard = getBillboardById(billboardId);
  if (!billboard) return { ok: false, reason: 'unknown-billboard' };
  const lease = state.leases?.[billboard.id];
  if (!lease) return { ok: false, reason: 'not-leased' };
  delete state.leases[billboard.id];
  return {
    ok: true,
    billboard,
    endedLease: lease,
  };
}
