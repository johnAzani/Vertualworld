export const ECONOMY_STORAGE_KEY = 'vertualworld-economy-v1';
export const STARTING_CREDITS = 1200;
export const RENTAL_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
export const BANK_LEDGER_LIMIT = 20;

export const RENTAL_LISTINGS = Object.freeze([
  Object.freeze({ houseNumber: 2, landlord: 'Mariam Bello', monthlyRent: 180, deposit: 180 }),
  Object.freeze({ houseNumber: 3, landlord: 'Tunde Ibrahim', monthlyRent: 220, deposit: 220 }),
  Object.freeze({ houseNumber: 4, landlord: 'Nneka Okorie', monthlyRent: 260, deposit: 260 }),
]);

export const VIRTUAL_GOOD_STYLES = Object.freeze([
  Object.freeze({ id: 'fashion', label: 'Fashion & Apparel', defaultCategory: 'Fashion' }),
  Object.freeze({ id: 'art', label: 'Digital & Fine Art', defaultCategory: 'Digital Art' }),
  Object.freeze({ id: 'tech', label: 'Tech & Gadgets', defaultCategory: 'Tech & Gadgets' }),
  Object.freeze({ id: 'craft', label: 'Home & Craft', defaultCategory: 'Home & Craft' }),
  Object.freeze({ id: 'audio', label: 'Music & Audio', defaultCategory: 'Music & Audio' }),
  Object.freeze({ id: 'harvest', label: 'Gourmet & Provisions', defaultCategory: 'Gourmet' }),
]);

export const MALL_VIRTUAL_GOODS = Object.freeze([
  Object.freeze({
    id: 'vgood-ankara-capsule',
    name: 'Abuja Streetwear Capsule',
    category: 'Fashion',
    style: 'fashion',
    price: 45,
    description: 'Tailored woven jacket and street sneakers on a lit mannequin stand.',
  }),
  Object.freeze({
    id: 'vgood-aso-art-print',
    name: 'Aso Rock Sunset Holoprint',
    category: 'Digital Art',
    style: 'art',
    price: 60,
    description: 'Luminous framed gallery print of the monolith at dusk.',
  }),
  Object.freeze({
    id: 'vgood-smart-drone',
    name: 'Savannah Courier Mini-Drone',
    category: 'Tech & Gadgets',
    style: 'tech',
    price: 85,
    description: 'Compact quad-rotor showcase unit on an acrylic plinth.',
  }),
  Object.freeze({
    id: 'vgood-calabash-lamp',
    name: 'Brass & Calabash Glow Lamp',
    category: 'Home & Craft',
    style: 'craft',
    price: 38,
    description: 'Warm carved table lantern crafted by local artisans.',
  }),
  Object.freeze({
    id: 'vgood-afrobeats-synth',
    name: 'Maitama Beat Loop Deck',
    category: 'Music & Audio',
    style: 'audio',
    price: 70,
    description: 'Portable studio sampler and tabletop speaker rig.',
  }),
  Object.freeze({
    id: 'vgood-organic-hamper',
    name: 'FCT Highland Spice Hamper',
    category: 'Gourmet',
    style: 'harvest',
    price: 32,
    description: 'Gift crate of hibiscus, ginger, honey, and highland roast.',
  }),
]);

export const MALL_SHOP_SPACES = Object.freeze([
  Object.freeze({
    id: 'kiosk-s1',
    code: 'K1',
    name: 'Atrium Kiosk K1',
    sizeLabel: 'Small',
    areaSqm: 12,
    maxDisplayItems: 2,
    monthlyRent: 90,
    deposit: 90,
    manager: 'Aisha Danjuma',
    wing: 'Promenade Concourse',
    defaultShopName: 'Zuma Craft Kiosk',
    defaultTagline: 'Compact front-promenade counter for artisan picks',
    defaultGoods: Object.freeze(['vgood-calabash-lamp', 'vgood-organic-hamper']),
    visitorBonus: 18,
  }),
  Object.freeze({
    id: 'boutique-m2',
    code: 'B2',
    name: 'North Wing Boutique B2',
    sizeLabel: 'Medium',
    areaSqm: 28,
    maxDisplayItems: 3,
    monthlyRent: 160,
    deposit: 160,
    manager: 'Chidi Okafor',
    wing: 'North Gallery Wing',
    defaultShopName: 'Wuse Style Boutique',
    defaultTagline: 'Mid-sized glass bay with three display plinths',
    defaultGoods: Object.freeze(['vgood-ankara-capsule', 'vgood-calabash-lamp', 'vgood-aso-art-print']),
    visitorBonus: 30,
  }),
  Object.freeze({
    id: 'showroom-l3',
    code: 'S3',
    name: 'South Wing Showroom S3',
    sizeLabel: 'Large',
    areaSqm: 54,
    maxDisplayItems: 4,
    monthlyRent: 260,
    deposit: 260,
    manager: 'Halima Yusuf',
    wing: 'South Promenade Wing',
    defaultShopName: 'Capital Tech & Design',
    defaultTagline: 'Double-frontage showroom with four gallery pedestals',
    defaultGoods: Object.freeze(['vgood-smart-drone', 'vgood-afrobeats-synth', 'vgood-aso-art-print', 'vgood-ankara-capsule']),
    visitorBonus: 46,
  }),
  Object.freeze({
    id: 'anchor-xl4',
    code: 'A4',
    name: 'Grand Atrium Hall A4',
    sizeLabel: 'Anchor',
    areaSqm: 96,
    maxDisplayItems: 6,
    monthlyRent: 380,
    deposit: 380,
    manager: 'Ibrahim Musa',
    wing: 'Central Skylight Atrium',
    defaultShopName: 'Abuja Grand Pavilion',
    defaultTagline: 'Full-height central showcase with six flagship display stands',
    defaultGoods: Object.freeze([
      'vgood-ankara-capsule',
      'vgood-aso-art-print',
      'vgood-smart-drone',
      'vgood-calabash-lamp',
      'vgood-afrobeats-synth',
      'vgood-organic-hamper',
    ]),
    visitorBonus: 68,
  }),
]);

export const MAX_CUSTOM_VIRTUAL_GOODS = 12;

export const MALL_LOCKUP_SHOPS = Object.freeze([
  Object.freeze({
    id: 'lockup-l1',
    code: 'L-01',
    spaceId: 'kiosk-s1',
    name: 'Zuma Artisan & Wellness Lockup',
    category: 'Home Decor · Spa & Craft',
    wing: 'North Concourse · Front Lockup',
    merchant: 'Aisha Danjuma',
    description: 'Hand-carved lanterns, shea butter spa kits, and framed Abuja holoprints.',
  }),
  Object.freeze({
    id: 'lockup-l2',
    code: 'L-02',
    spaceId: 'boutique-m2',
    name: 'Wuse Streetwear & Sneaker Lockup',
    category: 'Fashion · Apparel & Footwear',
    wing: 'North Concourse · Mid Lockup',
    merchant: 'Chidi Okafor',
    description: 'Tailored Ankara streetwear jackets, trail sneakers, and royal caps.',
  }),
  Object.freeze({
    id: 'lockup-l3',
    code: 'L-03',
    spaceId: null,
    name: 'Suya & Jollof Food Court Lockup',
    category: 'Hot Meals · Suya, Jollof & Zobo',
    wing: 'North Concourse · Rear Lockup',
    merchant: 'Chef Musa Danladi',
    description: 'Freshly grilled Abuja beef suya, smoky party jollof boxes, and chilled zobo.',
  }),
  Object.freeze({
    id: 'lockup-l4',
    code: 'L-04',
    spaceId: 'showroom-l3',
    name: 'Capital Tech & Audio Lockup',
    category: 'Gadgets · Drones, Audio & Gear',
    wing: 'South Concourse · Front Lockup',
    merchant: 'Halima Yusuf',
    description: 'Courier mini-drones, wireless studio earbuds, and portable Afrobeats synth decks.',
  }),
  Object.freeze({
    id: 'lockup-l5',
    code: 'L-05',
    spaceId: null,
    name: 'Abuja Pharmacy & Vitality Lockup',
    category: 'Pharmacy · Vitamins, Cologne & Care',
    wing: 'South Concourse · Mid Lockup',
    merchant: 'Dr. Kemi Adewale',
    description: 'Daily multivitamin packs, hydration boosters, and luxury oud & citrus cologne.',
  }),
  Object.freeze({
    id: 'lockup-l6',
    code: 'L-06',
    spaceId: 'anchor-xl4',
    name: 'Grand Harvest Supermarket Lockup',
    category: 'Supermarket · Groceries & Staples',
    wing: 'South Concourse · Anchor Hall',
    merchant: 'Ibrahim Musa',
    description: 'Fresh farm produce crates, rice & beans bundles, bakery bread, and pantry staples.',
  }),
]);

export const SHOP_CATALOG = Object.freeze({
  cafe: Object.freeze([
    Object.freeze({ id: 'cafe-coffee', name: 'Fresh-brewed coffee', category: 'Food & drink', price: 12, description: 'A warm cup for the walk ahead.' }),
    Object.freeze({ id: 'cafe-bun', name: 'Coconut bun', category: 'Bakery', price: 8, description: 'Soft, sweet, and baked this morning.' }),
    Object.freeze({ id: 'cafe-salad', name: 'Garden salad', category: 'Fresh food', price: 18, description: 'Greens, tomato, and a citrus dressing.' }),
    Object.freeze({ id: 'cafe-sandwich', name: 'Picnic sandwich', category: 'Fresh food', price: 22, description: 'A packed lunch for your afternoon out.' }),
  ]),
  market: Object.freeze([
    // Lockup L-06 · Grand Harvest Supermarket
    Object.freeze({ id: 'market-produce', lockupId: 'lockup-l6', lockupCode: 'L-06', name: 'Fresh produce crate', category: 'Groceries', price: 34, description: 'Seasonal fruit and vegetables from FCT farms.' }),
    Object.freeze({ id: 'market-rice-beans', lockupId: 'lockup-l6', lockupCode: 'L-06', name: 'Rice & beans', category: 'Pantry', price: 28, description: 'A staple bundle for the kitchen shelf.' }),
    Object.freeze({ id: 'market-eggs-bread', lockupId: 'lockup-l6', lockupCode: 'L-06', name: 'Eggs & bread', category: 'Groceries', price: 24, description: 'Everyday essentials from local growers.' }),
    Object.freeze({ id: 'market-pantry', lockupId: 'lockup-l6', lockupCode: 'L-06', name: 'Pantry staples', category: 'Groceries', price: 50, description: 'Oil, seasoning, and a few useful basics.' }),
    // Lockup L-01 · Zuma Artisan & Wellness Lockup
    Object.freeze({ id: 'mall-calabash-lamp', lockupId: 'lockup-l1', lockupCode: 'L-01', name: 'Brass & Calabash Glow Lamp', category: 'Home & Craft', price: 38, description: 'Hand-carved warm table lantern that brightens your mood.' }),
    Object.freeze({ id: 'mall-spa-kit', lockupId: 'lockup-l1', lockupCode: 'L-01', name: 'Shea Butter & Neem Spa Kit', category: 'Wellness', price: 26, description: 'Artisan bath and skincare bundle · restores freshness and mood.' }),
    Object.freeze({ id: 'mall-aso-print', lockupId: 'lockup-l1', lockupCode: 'L-01', name: 'Aso Rock Sunset Holoprint', category: 'Art & Decor', price: 60, description: 'Luminous gallery collector print of Aso Rock at dusk.' }),
    // Lockup L-02 · Wuse Streetwear & Sneaker Lockup
    Object.freeze({ id: 'mall-ankara-jacket', lockupId: 'lockup-l2', lockupCode: 'L-02', name: 'Abuja Streetwear Jacket', category: 'Fashion', price: 45, description: 'Tailored woven Ankara bomber jacket · boosts social confidence.' }),
    Object.freeze({ id: 'mall-sneakers', lockupId: 'lockup-l2', lockupCode: 'L-02', name: 'Maitama Trail Sneakers', category: 'Footwear', price: 38, description: 'Cushioned city runners built for exploring Abuja.' }),
    Object.freeze({ id: 'mall-royal-cap', lockupId: 'lockup-l2', lockupCode: 'L-02', name: 'Aso Oke Royal Cap Set', category: 'Fashion', price: 30, description: 'Hand-woven ceremonial cap and scarf set.' }),
    // Lockup L-03 · Suya & Jollof Food Court Lockup
    Object.freeze({ id: 'mall-suya-platter', lockupId: 'lockup-l3', lockupCode: 'L-03', name: 'Smoky Abuja Beef Suya Platter', category: 'Hot Meals', price: 20, description: 'Spiced yaji grilled beef skewers with onions and tomatoes.' }),
    Object.freeze({ id: 'mall-jollof-box', lockupId: 'lockup-l3', lockupCode: 'L-03', name: 'Party Jollof & Plantain Box', category: 'Hot Meals', price: 25, description: 'Firewood-style smoky jollof rice with sweet fried plantain.' }),
    Object.freeze({ id: 'mall-zobo-drink', lockupId: 'lockup-l3', lockupCode: 'L-03', name: 'Chilled Zobo & Ginger Drink', category: 'Drinks', price: 10, description: 'Ice-cold hibiscus, pineapple, and ginger refresher.' }),
    // Lockup L-04 · Capital Tech & Audio Lockup
    Object.freeze({ id: 'mall-smart-drone', lockupId: 'lockup-l4', lockupCode: 'L-04', name: 'Savannah Courier Mini-Drone', category: 'Tech & Gadgets', price: 85, description: 'Compact quad-rotor camera drone for aerial city views.' }),
    Object.freeze({ id: 'mall-earbuds', lockupId: 'lockup-l4', lockupCode: 'L-04', name: 'Abuja Pro Wireless Earbuds', category: 'Audio Gear', price: 42, description: 'Noise-cancelling earbuds tuned for Afrobeats on the move.' }),
    Object.freeze({ id: 'mall-synth-deck', lockupId: 'lockup-l4', lockupCode: 'L-04', name: 'Maitama Beat Loop Synth Deck', category: 'Music & Audio', price: 70, description: 'Portable studio sampler and tabletop beatmaker rig.' }),
    // Lockup L-05 · Abuja Pharmacy & Vitality Lockup
    Object.freeze({ id: 'mall-vitamins', lockupId: 'lockup-l5', lockupCode: 'L-05', name: 'Abuja Vitality Multivitamin Pack', category: 'Pharmacy', price: 30, description: 'Daily energy and immunity pack · boosts energy and freshness.' }),
    Object.freeze({ id: 'mall-electrolytes', lockupId: 'lockup-l5', lockupCode: 'L-05', name: 'Savannah Hydration & Electrolytes', category: 'Pharmacy', price: 16, description: 'Fast-acting electrolyte sachets for active days in the city.' }),
    Object.freeze({ id: 'mall-oud-cologne', lockupId: 'lockup-l5', lockupCode: 'L-05', name: 'Luxury Oud & Citrus Cologne', category: 'Fragrance', price: 44, description: 'Long-lasting artisan fragrance · boosts freshness and social charm.' }),
  ]),
});

const rentalListingByHouse = new Map(RENTAL_LISTINGS.map((listing) => [listing.houseNumber, listing]));
const mallSpaceById = new Map(MALL_SHOP_SPACES.map((space) => [space.id, space]));
const mallLockupById = new Map(MALL_LOCKUP_SHOPS.map((shop) => [shop.id, shop]));
const virtualGoodStyleById = new Map(VIRTUAL_GOOD_STYLES.map((style) => [style.id, style]));
const builtInVirtualGoodsById = new Map(MALL_VIRTUAL_GOODS.map((good) => [good.id, good]));
const productsById = new Map(Object.values(SHOP_CATALOG).flat().map((product) => [product.id, product]));

function sanitizeShortText(value, maxLength = 28, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
  return cleaned.length >= 2 ? cleaned : fallback;
}

export function getMallShopSpace(spaceId) {
  return mallSpaceById.get(spaceId) || null;
}

export function getMallLockupShop(lockupId) {
  return mallLockupById.get(lockupId) || null;
}

export function getMallLockupProducts(lockupId) {
  if (!lockupId || lockupId === 'all') return SHOP_CATALOG.market;
  return SHOP_CATALOG.market.filter((product) => product.lockupId === lockupId);
}

export function getAllVirtualGoods(economy) {
  const custom = Array.isArray(economy?.customVirtualGoods) ? economy.customVirtualGoods : [];
  return [...MALL_VIRTUAL_GOODS, ...custom];
}

export function getVirtualGood(economy, goodId) {
  if (builtInVirtualGoodsById.has(goodId)) return builtInVirtualGoodsById.get(goodId);
  const custom = Array.isArray(economy?.customVirtualGoods) ? economy.customVirtualGoods : [];
  return custom.find((good) => good.id === goodId) || null;
}

function normalizeCustomVirtualGoods(value) {
  if (!Array.isArray(value)) return [];
  const seenIds = new Set(builtInVirtualGoodsById.keys());
  return value.slice(0, MAX_CUSTOM_VIRTUAL_GOODS).flatMap((entry, index) => {
    if (!entry || typeof entry !== 'object') return [];
    const name = sanitizeShortText(entry.name, 28, '');
    const styleObj = virtualGoodStyleById.get(entry.style) || VIRTUAL_GOOD_STYLES[0];
    const price = Number(entry.price);
    if (!name || !Number.isSafeInteger(price) || price < 1 || price > 500) return [];
    const rawId = typeof entry.id === 'string' && /^custom-vgood-[a-z0-9-]{1,36}$/i.test(entry.id)
      ? entry.id
      : `custom-vgood-${index + 1}`;
    if (seenIds.has(rawId)) return [];
    seenIds.add(rawId);
    const category = sanitizeShortText(entry.category, 22, styleObj.defaultCategory);
    const description = sanitizeShortText(
      entry.description,
      72,
      `Custom ${category.toLowerCase()} showcase piece.`,
    );
    return [{
      id: rawId,
      name,
      category,
      style: styleObj.id,
      price,
      description,
      custom: true,
    }];
  });
}

function normalizeDisplayedGoods(goodIds, space, validGoodIds) {
  if (!Array.isArray(goodIds)) return [...space.defaultGoods].slice(0, space.maxDisplayItems);
  const unique = [];
  const seen = new Set();
  for (const id of goodIds) {
    if (typeof id === 'string' && validGoodIds.has(id) && !seen.has(id)) {
      seen.add(id);
      unique.push(id);
      if (unique.length >= space.maxDisplayItems) break;
    }
  }
  return unique;
}

function normalizeShopLeases(value, now, validGoodIds) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const normalized = {};
  for (const space of MALL_SHOP_SPACES) {
    const raw = value[space.id];
    if (!raw || typeof raw !== 'object') continue;
    const nextDueAt = Number(raw.nextDueAt);
    normalized[space.id] = {
      spaceId: space.id,
      code: space.code,
      name: space.name,
      sizeLabel: space.sizeLabel,
      areaSqm: space.areaSqm,
      maxDisplayItems: space.maxDisplayItems,
      manager: space.manager,
      monthlyRent: space.monthlyRent,
      deposit: space.deposit,
      rentDue: safeCount(raw.rentDue),
      nextDueAt: Number.isFinite(nextDueAt) && nextDueAt > 0 ? nextDueAt : now + RENTAL_MONTH_MS,
      shopName: sanitizeShortText(raw.shopName, 26, `${space.code} Resident Studio`),
      tagline: sanitizeShortText(raw.tagline, 56, space.defaultTagline),
      displayedGoods: normalizeDisplayedGoods(raw.displayedGoods, space, validGoodIds),
      totalSales: safeCount(raw.totalSales),
    };
  }
  return normalized;
}

function createGameAccountId() {
  const bytes = new Uint8Array(4);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  }
  return `VW-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function normalizeLedger(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, BANK_LEDGER_LIMIT).flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const amount = Number(entry.amount);
    const occurredAt = Number(entry.occurredAt);
    const description = typeof entry.description === 'string' ? entry.description.trim().slice(0, 100) : '';
    if (!description || !Number.isSafeInteger(amount) || amount === 0) return [];
    return [{
      id: typeof entry.id === 'string' && entry.id.length <= 64 ? entry.id : `${occurredAt}-${description}`,
      description,
      amount,
      occurredAt: Number.isFinite(occurredAt) && occurredAt >= 0 ? occurredAt : 0,
    }];
  });
}

function recordWalletTransaction(economy, description, amount, now = Date.now()) {
  if (!Number.isSafeInteger(amount) || amount === 0) return;
  if (!Array.isArray(economy.ledger)) economy.ledger = [];
  economy.ledger.unshift({
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    description: String(description).slice(0, 100),
    amount,
    occurredAt: now,
  });
  economy.ledger.length = Math.min(economy.ledger.length, BANK_LEDGER_LIMIT);
}

export function createDefaultEconomy() {
  return {
    wallet: STARTING_CREDITS,
    inventory: {},
    lease: null,
    shopLeases: {},
    customVirtualGoods: [],
    accountId: createGameAccountId(),
    ledger: [],
  };
}

function safeCount(value, fallback = 0) {
  return Number.isSafeInteger(value) && value >= 0 ? value : fallback;
}

function normalizeLease(value, now) {
  if (!value || typeof value !== 'object') return null;
  const listing = rentalListingByHouse.get(Number(value.houseNumber));
  if (!listing) return null;
  const nextDueAt = Number(value.nextDueAt);
  return {
    houseNumber: listing.houseNumber,
    landlord: listing.landlord,
    monthlyRent: listing.monthlyRent,
    deposit: listing.deposit,
    rentDue: safeCount(value.rentDue),
    nextDueAt: Number.isFinite(nextDueAt) && nextDueAt > 0 ? nextDueAt : now + RENTAL_MONTH_MS,
  };
}

export function loadEconomy(storage, now = Date.now()) {
  const economy = createDefaultEconomy();
  try {
    const raw = storage?.getItem(ECONOMY_STORAGE_KEY);
    if (!raw) return economy;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return economy;
    economy.wallet = safeCount(saved.wallet, STARTING_CREDITS);
    if (saved.inventory && typeof saved.inventory === 'object') {
      for (const id of productsById.keys()) {
        const count = safeCount(saved.inventory[id]);
        if (count > 0) economy.inventory[id] = count;
      }
    }
    economy.lease = normalizeLease(saved.lease, now);
    economy.customVirtualGoods = normalizeCustomVirtualGoods(saved.customVirtualGoods);
    const validGoodIds = new Set(getAllVirtualGoods(economy).map((good) => good.id));
    economy.shopLeases = normalizeShopLeases(saved.shopLeases, now, validGoodIds);
    if (typeof saved.accountId === 'string' && /^VW-[0-9A-F]{8}$/.test(saved.accountId)) economy.accountId = saved.accountId;
    economy.ledger = normalizeLedger(saved.ledger);
  } catch {
    // Keep the game playable if local storage is unavailable or contains stale data.
  }
  return economy;
}

export function saveEconomy(storage, economy) {
  try {
    storage?.setItem(ECONOMY_STORAGE_KEY, JSON.stringify(economy));
    return true;
  } catch {
    return false;
  }
}

function advanceSingleLeaseBilling(lease, now = Date.now()) {
  if (!lease || now < lease.nextDueAt) return 0;
  const monthsDue = Math.floor((now - lease.nextDueAt) / RENTAL_MONTH_MS) + 1;
  lease.rentDue += monthsDue * lease.monthlyRent;
  lease.nextDueAt += monthsDue * RENTAL_MONTH_MS;
  return monthsDue;
}

export function advanceRentalBilling(economy, now = Date.now()) {
  let totalMonthsDue = advanceSingleLeaseBilling(economy.lease, now);
  if (economy.shopLeases && typeof economy.shopLeases === 'object') {
    for (const shopLease of Object.values(economy.shopLeases)) {
      totalMonthsDue += advanceSingleLeaseBilling(shopLease, now);
    }
  }
  return totalMonthsDue;
}

export function signRentalLease(economy, houseNumber, now = Date.now()) {
  if (economy.lease) return { ok: false, reason: 'lease-active' };
  const listing = rentalListingByHouse.get(Number(houseNumber));
  if (!listing) return { ok: false, reason: 'listing-not-found' };
  const moveInCost = listing.monthlyRent + listing.deposit;
  if (economy.wallet < moveInCost) return { ok: false, reason: 'insufficient-funds', cost: moveInCost };
  economy.wallet -= moveInCost;
  economy.lease = {
    houseNumber: listing.houseNumber,
    landlord: listing.landlord,
    monthlyRent: listing.monthlyRent,
    deposit: listing.deposit,
    rentDue: 0,
    nextDueAt: now + RENTAL_MONTH_MS,
  };
  recordWalletTransaction(economy, `House ${String(listing.houseNumber).padStart(2, '0')} · move-in rent + deposit`, -moveInCost, now);
  return { ok: true, listing, moveInCost };
}

export function payRentalRent(economy, now = Date.now()) {
  if (!economy.lease) return { ok: false, reason: 'no-lease' };
  advanceRentalBilling(economy, now);
  if (economy.lease.rentDue === 0) return { ok: false, reason: 'not-due' };
  if (economy.wallet < economy.lease.rentDue) {
    return { ok: false, reason: 'insufficient-funds', due: economy.lease.rentDue };
  }
  const paid = economy.lease.rentDue;
  economy.wallet -= paid;
  economy.lease.rentDue = 0;
  recordWalletTransaction(economy, `House ${String(economy.lease.houseNumber).padStart(2, '0')} · rent paid`, -paid, now);
  return { ok: true, paid };
}

export function endRentalLease(economy, now = Date.now()) {
  if (!economy.lease) return { ok: false, reason: 'no-lease' };
  advanceRentalBilling(economy, now);
  const lease = economy.lease;
  const depositUsed = Math.min(lease.deposit, lease.rentDue);
  const refund = lease.deposit - depositUsed;
  const unpaidAfterDeposit = lease.rentDue - depositUsed;
  economy.wallet += refund;
  economy.lease = null;
  if (refund > 0) recordWalletTransaction(economy, `House ${String(lease.houseNumber).padStart(2, '0')} · deposit returned`, refund, now);
  return { ok: true, refund, depositUsed, unpaidAfterDeposit };
}

export function purchaseProduct(economy, productId, now = Date.now()) {
  const product = productsById.get(productId);
  if (!product) return { ok: false, reason: 'item-not-found' };
  if (economy.wallet < product.price) return { ok: false, reason: 'insufficient-funds', price: product.price };
  economy.wallet -= product.price;
  economy.inventory[product.id] = (economy.inventory[product.id] || 0) + 1;
  recordWalletTransaction(economy, product.name, -product.price, now);
  return { ok: true, product, count: economy.inventory[product.id] };
}

export function consumeProduct(economy, productId) {
  const product = productsById.get(productId);
  if (!product) return { ok: false, reason: 'item-not-found' };
  const count = safeCount(economy.inventory?.[product.id]);
  if (count < 1) return { ok: false, reason: 'not-in-inventory', product };
  if (count === 1) delete economy.inventory[product.id];
  else economy.inventory[product.id] = count - 1;
  return { ok: true, product, count: count - 1 };
}

export function earnGameCredits(economy, description, amount, now = Date.now()) {
  if (!Number.isSafeInteger(amount) || amount <= 0) return { ok: false, reason: 'invalid-amount' };
  if (!Number.isSafeInteger(economy.wallet) || economy.wallet < 0 || economy.wallet + amount > Number.MAX_SAFE_INTEGER) {
    return { ok: false, reason: 'invalid-wallet' };
  }
  economy.wallet += amount;
  recordWalletTransaction(economy, description, amount, now);
  return { ok: true, amount, balance: economy.wallet };
}

export function getProduct(productId) {
  return productsById.get(productId) || null;
}

export function getMallShopDisplayState(economy, spaceId) {
  const space = mallSpaceById.get(spaceId);
  if (!space) return null;
  const lease = economy?.shopLeases?.[space.id] || null;
  const goodIds = lease ? lease.displayedGoods : space.defaultGoods;
  const displayedGoods = goodIds
    .map((id) => getVirtualGood(economy, id))
    .filter(Boolean)
    .slice(0, space.maxDisplayItems);
  return {
    space,
    lease,
    isRented: Boolean(lease),
    shopName: lease ? lease.shopName : space.defaultShopName,
    tagline: lease ? lease.tagline : space.defaultTagline,
    displayedGoods,
  };
}

export function signMallShopLease(economy, spaceId, options = {}, now = Date.now()) {
  const space = mallSpaceById.get(spaceId);
  if (!space) return { ok: false, reason: 'space-not-found' };
  if (!economy.shopLeases || typeof economy.shopLeases !== 'object') economy.shopLeases = {};
  if (economy.shopLeases[space.id]) return { ok: false, reason: 'space-already-leased' };
  const moveInCost = space.monthlyRent + space.deposit;
  if (economy.wallet < moveInCost) return { ok: false, reason: 'insufficient-funds', cost: moveInCost };
  const validGoodIds = new Set(getAllVirtualGoods(economy).map((good) => good.id));
  const defaultTitle = options.residentName
    ? `${sanitizeShortText(options.residentName, 16, 'Resident')}’s ${space.sizeLabel} Shop`
    : `${space.code} Resident Studio`;
  const shopName = sanitizeShortText(options.shopName, 26, defaultTitle);
  const tagline = sanitizeShortText(options.tagline, 56, space.defaultTagline);
  const displayedGoods = normalizeDisplayedGoods(options.displayedGoods, space, validGoodIds);
  economy.wallet -= moveInCost;
  const lease = {
    spaceId: space.id,
    code: space.code,
    name: space.name,
    sizeLabel: space.sizeLabel,
    areaSqm: space.areaSqm,
    maxDisplayItems: space.maxDisplayItems,
    manager: space.manager,
    monthlyRent: space.monthlyRent,
    deposit: space.deposit,
    rentDue: 0,
    nextDueAt: now + RENTAL_MONTH_MS,
    shopName,
    tagline,
    displayedGoods,
    totalSales: 0,
  };
  economy.shopLeases[space.id] = lease;
  recordWalletTransaction(economy, `Unity Mall ${space.code} (${space.sizeLabel}) · move-in rent + deposit`, -moveInCost, now);
  return { ok: true, space, lease, moveInCost };
}

export function updateMallShopDetails(economy, spaceId, { shopName, tagline } = {}) {
  const space = mallSpaceById.get(spaceId);
  const lease = space ? economy?.shopLeases?.[space.id] : null;
  if (!space || !lease) return { ok: false, reason: 'no-shop-lease' };
  const cleanedName = sanitizeShortText(shopName, 26, '');
  if (!cleanedName) return { ok: false, reason: 'invalid-shop-name' };
  lease.shopName = cleanedName;
  if (typeof tagline === 'string') {
    lease.tagline = sanitizeShortText(tagline, 56, space.defaultTagline);
  }
  return { ok: true, lease };
}

export function toggleMallShopDisplayedGood(economy, spaceId, goodId) {
  const space = mallSpaceById.get(spaceId);
  const lease = space ? economy?.shopLeases?.[space.id] : null;
  if (!space || !lease) return { ok: false, reason: 'no-shop-lease' };
  const good = getVirtualGood(economy, goodId);
  if (!good) return { ok: false, reason: 'good-not-found' };
  const currentIndex = lease.displayedGoods.indexOf(good.id);
  if (currentIndex >= 0) {
    lease.displayedGoods.splice(currentIndex, 1);
    return { ok: true, displayed: false, displayedGoods: [...lease.displayedGoods], good };
  }
  if (lease.displayedGoods.length >= space.maxDisplayItems) {
    return { ok: false, reason: 'display-full', maxDisplayItems: space.maxDisplayItems };
  }
  lease.displayedGoods.push(good.id);
  return { ok: true, displayed: true, displayedGoods: [...lease.displayedGoods], good };
}

export function createCustomVirtualGood(economy, { name, category, style, price, spaceId } = {}) {
  const cleanedName = sanitizeShortText(name, 28, '');
  if (!cleanedName) return { ok: false, reason: 'invalid-name' };
  const numericPrice = Number(price);
  if (!Number.isSafeInteger(numericPrice) || numericPrice < 1 || numericPrice > 500) {
    return { ok: false, reason: 'invalid-price' };
  }
  if (!Array.isArray(economy.customVirtualGoods)) economy.customVirtualGoods = [];
  if (economy.customVirtualGoods.length >= MAX_CUSTOM_VIRTUAL_GOODS) {
    return { ok: false, reason: 'catalog-full', limit: MAX_CUSTOM_VIRTUAL_GOODS };
  }
  const styleObj = virtualGoodStyleById.get(style) || VIRTUAL_GOOD_STYLES[0];
  const cleanedCategory = sanitizeShortText(category, 22, styleObj.defaultCategory);
  const id = `custom-vgood-${economy.customVirtualGoods.length + 1}-${Math.random().toString(36).slice(2, 6)}`;
  const good = {
    id,
    name: cleanedName,
    category: cleanedCategory,
    style: styleObj.id,
    price: numericPrice,
    description: `Custom ${cleanedCategory.toLowerCase()} showcase piece.`,
    custom: true,
  };
  economy.customVirtualGoods.push(good);
  let autoDisplayed = false;
  if (spaceId && economy.shopLeases?.[spaceId]) {
    const space = mallSpaceById.get(spaceId);
    const lease = economy.shopLeases[spaceId];
    if (space && lease.displayedGoods.length < space.maxDisplayItems) {
      lease.displayedGoods.push(good.id);
      autoDisplayed = true;
    }
  }
  return { ok: true, good, autoDisplayed };
}

export function collectMallShowcaseSales(economy, spaceId, now = Date.now()) {
  const space = mallSpaceById.get(spaceId);
  const lease = space ? economy?.shopLeases?.[space.id] : null;
  if (!space || !lease) return { ok: false, reason: 'no-shop-lease' };
  const displayed = lease.displayedGoods.map((id) => getVirtualGood(economy, id)).filter(Boolean);
  if (displayed.length === 0) return { ok: false, reason: 'no-goods-displayed' };
  const merchandiseValue = displayed.reduce((sum, good) => sum + Math.max(6, Math.round(good.price * 0.25)), 0);
  const payout = space.visitorBonus + merchandiseValue;
  const creditResult = earnGameCredits(
    economy,
    `${lease.shopName} (${space.code}) · virtual goods showcase sales`,
    payout,
    now,
  );
  if (!creditResult.ok) return creditResult;
  lease.totalSales = safeCount(lease.totalSales) + payout;
  return { ok: true, payout, totalSales: lease.totalSales, displayedCount: displayed.length, space, lease };
}

export function payMallShopRent(economy, spaceId, now = Date.now()) {
  const space = mallSpaceById.get(spaceId);
  const lease = space ? economy?.shopLeases?.[space.id] : null;
  if (!space || !lease) return { ok: false, reason: 'no-shop-lease' };
  advanceSingleLeaseBilling(lease, now);
  if (lease.rentDue === 0) return { ok: false, reason: 'not-due' };
  if (economy.wallet < lease.rentDue) {
    return { ok: false, reason: 'insufficient-funds', due: lease.rentDue };
  }
  const paid = lease.rentDue;
  economy.wallet -= paid;
  lease.rentDue = 0;
  recordWalletTransaction(economy, `Unity Mall ${space.code} · shop rent paid`, -paid, now);
  return { ok: true, paid, space };
}

export function endMallShopLease(economy, spaceId, now = Date.now()) {
  const space = mallSpaceById.get(spaceId);
  const lease = space ? economy?.shopLeases?.[space.id] : null;
  if (!space || !lease) return { ok: false, reason: 'no-shop-lease' };
  advanceSingleLeaseBilling(lease, now);
  const depositUsed = Math.min(lease.deposit, lease.rentDue);
  const refund = lease.deposit - depositUsed;
  const unpaidAfterDeposit = lease.rentDue - depositUsed;
  economy.wallet += refund;
  delete economy.shopLeases[space.id];
  if (refund > 0) {
    recordWalletTransaction(economy, `Unity Mall ${space.code} · shop deposit returned`, refund, now);
  }
  return { ok: true, refund, depositUsed, unpaidAfterDeposit, space };
}
