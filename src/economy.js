export const ECONOMY_STORAGE_KEY = 'vertualworld-economy-v1';
export const STARTING_CREDITS = 1200;
export const RENTAL_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
export const BANK_LEDGER_LIMIT = 20;

export const RENTAL_LISTINGS = Object.freeze([
  Object.freeze({ houseNumber: 2, landlord: 'Mariam Bello', monthlyRent: 180, deposit: 180 }),
  Object.freeze({ houseNumber: 3, landlord: 'Tunde Ibrahim', monthlyRent: 220, deposit: 220 }),
  Object.freeze({ houseNumber: 4, landlord: 'Nneka Okorie', monthlyRent: 260, deposit: 260 }),
]);

export const SHOP_CATALOG = Object.freeze({
  cafe: Object.freeze([
    Object.freeze({ id: 'cafe-coffee', name: 'Fresh-brewed coffee', category: 'Food & drink', price: 12, description: 'A warm cup for the walk ahead.' }),
    Object.freeze({ id: 'cafe-bun', name: 'Coconut bun', category: 'Bakery', price: 8, description: 'Soft, sweet, and baked this morning.' }),
    Object.freeze({ id: 'cafe-salad', name: 'Garden salad', category: 'Fresh food', price: 18, description: 'Greens, tomato, and a citrus dressing.' }),
    Object.freeze({ id: 'cafe-sandwich', name: 'Picnic sandwich', category: 'Fresh food', price: 22, description: 'A packed lunch for your afternoon out.' }),
  ]),
  market: Object.freeze([
    Object.freeze({ id: 'market-produce', name: 'Fresh produce crate', category: 'Groceries', price: 34, description: 'Seasonal fruit and vegetables.' }),
    Object.freeze({ id: 'market-rice-beans', name: 'Rice & beans', category: 'Pantry', price: 28, description: 'A staple bundle for the kitchen shelf.' }),
    Object.freeze({ id: 'market-eggs-bread', name: 'Eggs & bread', category: 'Groceries', price: 24, description: 'Everyday essentials from local growers.' }),
    Object.freeze({ id: 'market-pantry', name: 'Pantry staples', category: 'Groceries', price: 50, description: 'Oil, seasoning, and a few useful basics.' }),
  ]),
});

const rentalListingByHouse = new Map(RENTAL_LISTINGS.map((listing) => [listing.houseNumber, listing]));
const productsById = new Map(Object.values(SHOP_CATALOG).flat().map((product) => [product.id, product]));

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
  return { wallet: STARTING_CREDITS, inventory: {}, lease: null, accountId: createGameAccountId(), ledger: [] };
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

export function advanceRentalBilling(economy, now = Date.now()) {
  const lease = economy.lease;
  if (!lease || now < lease.nextDueAt) return 0;
  const monthsDue = Math.floor((now - lease.nextDueAt) / RENTAL_MONTH_MS) + 1;
  lease.rentDue += monthsDue * lease.monthlyRent;
  lease.nextDueAt += monthsDue * RENTAL_MONTH_MS;
  return monthsDue;
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
