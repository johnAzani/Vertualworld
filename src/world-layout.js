export const NEIGHBOURHOOD_NAME = 'Unity Court';
export const COMMUNITY_HALL_LAYOUT = Object.freeze({
  id: 'community-hall',
  name: 'Unity Community Hall',
  x: 10,
  z: 34,
  facing: 0,
  width: 6.6,
  depth: 5.4,
  halfX: 3.4,
  halfZ: 2.8,
  height: 4.6,
});
export const ESTATE_HOUSE_SIZE = Object.freeze({ width: 8.2, depth: 8.2 });
export const ESTATE_HOUSE_COLLISION_MARGIN = 0.22;

export const ESTATE_HOUSE_LAYOUT = Object.freeze([
  Object.freeze({ number: 1, x: 18, z: 1, facing: -Math.PI / 2 }),
  Object.freeze({ number: 2, x: 18, z: 17, facing: -Math.PI / 2 }),
  Object.freeze({ number: 3, x: 36, z: 1, facing: Math.PI / 2 }),
  Object.freeze({ number: 4, x: 36, z: 17, facing: Math.PI / 2 }),
]);

export const COMMERCE_VENUE_SIZE = Object.freeze({ width: 8.2, depth: 6.4 });
export const COMMERCE_VENUE_COLLIDER = Object.freeze({
  localX: 0,
  localZ: -0.33,
  halfX: 4.36,
  halfZ: 3.78,
  height: 5.7,
});

export const COMMERCE_VENUE_LAYOUT = Object.freeze([
  Object.freeze({
    id: 'cafe',
    kind: 'cafe',
    name: 'Civic Café',
    sign: 'CIVIC CAFE',
    x: 29,
    z: 33,
    facing: -Math.PI / 2,
    width: COMMERCE_VENUE_SIZE.width,
    depth: COMMERCE_VENUE_SIZE.depth,
    collider: COMMERCE_VENUE_COLLIDER,
    wallColor: 0xe8dcc8,
    roofColor: 0x526f5d,
    awningColor: 0x986849,
  }),
  Object.freeze({
    id: 'market',
    kind: 'mall',
    name: 'Unity Mall',
    sign: 'UNITY GRAND INDOOR MALL',
    x: 63.0,
    z: 36.8,
    facing: Math.PI / 2,
    width: 25.2,
    depth: 17.2,
    collider: Object.freeze({
      localX: 0,
      localZ: 0,
      halfX: 12.6,
      halfZ: 8.6,
      height: 10.2,
    }),
    wallColor: 0xebe5d5,
    roofColor: 0x456b5c,
    awningColor: 0x3f7a63,
  }),
]);

export const MALL_LOCKUP_SHOP_LAYOUT = Object.freeze([
  Object.freeze({
    id: 'lockup-l1',
    code: 'L-01',
    spaceId: 'kiosk-s1',
    name: 'Zuma Artisan & Wellness Lockup',
    categoryLabel: 'Home Decor · Spa & Craft',
    wing: 'North Concourse · Front Unit',
    localX: -7.7,
    localZ: -5.2,
    doorLocalX: -3.5,
    doorLocalZ: -5.2,
    roomWidth: 8.2,
    roomDepth: 4.8,
    side: -1,
    accentColor: 0xc97b49,
    floorColor: 0xdfd1bd,
    pedestalOffsets: Object.freeze([[-1.2, -1.1], [1.2, -1.1]]),
  }),
  Object.freeze({
    id: 'lockup-l2',
    code: 'L-02',
    spaceId: 'boutique-m2',
    name: 'Wuse Streetwear & Sneaker Lockup',
    categoryLabel: 'Fashion · Apparel & Footwear',
    wing: 'North Concourse · Mid Unit',
    localX: -7.7,
    localZ: 0.0,
    doorLocalX: -3.5,
    doorLocalZ: 0.0,
    roomWidth: 8.2,
    roomDepth: 4.8,
    side: -1,
    accentColor: 0x3f7a63,
    floorColor: 0xd5e0d9,
    pedestalOffsets: Object.freeze([[-1.4, -1.1], [0, -1.1], [1.4, -1.1]]),
  }),
  Object.freeze({
    id: 'lockup-l3',
    code: 'L-03',
    spaceId: null,
    name: 'Suya & Jollof Food Court Lockup',
    categoryLabel: 'Hot Meals · Suya, Jollof & Zobo',
    wing: 'North Concourse · Rear Unit',
    localX: -7.7,
    localZ: 5.2,
    doorLocalX: -3.5,
    doorLocalZ: 5.2,
    roomWidth: 8.2,
    roomDepth: 4.8,
    side: -1,
    accentColor: 0xb8523b,
    floorColor: 0xe4cfc5,
    pedestalOffsets: Object.freeze([[-1.2, -1.1], [1.2, -1.1]]),
  }),
  Object.freeze({
    id: 'lockup-l4',
    code: 'L-04',
    spaceId: 'showroom-l3',
    name: 'Capital Tech & Audio Lockup',
    categoryLabel: 'Gadgets · Drones, Audio & Gear',
    wing: 'South Concourse · Front Unit',
    localX: 7.7,
    localZ: -5.2,
    doorLocalX: 3.5,
    doorLocalZ: -5.2,
    roomWidth: 8.2,
    roomDepth: 4.8,
    side: 1,
    accentColor: 0x7b5c8e,
    floorColor: 0xd9d3e2,
    pedestalOffsets: Object.freeze([[-1.5, -1.1], [-0.5, -1.1], [0.5, -1.1], [1.5, -1.1]]),
  }),
  Object.freeze({
    id: 'lockup-l5',
    code: 'L-05',
    spaceId: null,
    name: 'Abuja Pharmacy & Vitality Lockup',
    categoryLabel: 'Pharmacy · Vitamins, Cologne & Care',
    wing: 'South Concourse · Mid Unit',
    localX: 7.7,
    localZ: 0.0,
    doorLocalX: 3.5,
    doorLocalZ: 0.0,
    roomWidth: 8.2,
    roomDepth: 4.8,
    side: 1,
    accentColor: 0x2e8578,
    floorColor: 0xd2e4e0,
    pedestalOffsets: Object.freeze([[-1.2, -1.1], [1.2, -1.1]]),
  }),
  Object.freeze({
    id: 'lockup-l6',
    code: 'L-06',
    spaceId: 'anchor-xl4',
    name: 'Grand Harvest Supermarket Lockup',
    categoryLabel: 'Supermarket · Groceries & Staples',
    wing: 'South Concourse · Anchor Hall',
    localX: 7.7,
    localZ: 5.2,
    doorLocalX: 3.5,
    doorLocalZ: 5.2,
    roomWidth: 8.2,
    roomDepth: 4.8,
    side: 1,
    accentColor: 0x2f5e76,
    floorColor: 0xd3dde4,
    pedestalOffsets: Object.freeze([
      [-1.75, -1.1],
      [-1.05, -1.1],
      [-0.35, -1.1],
      [0.35, -1.1],
      [1.05, -1.1],
      [1.75, -1.1],
    ]),
  }),
]);

export const MALL_SHOP_BAY_LAYOUT = Object.freeze([
  Object.freeze({
    spaceId: 'kiosk-s1',
    lockupId: 'lockup-l1',
    code: 'K1',
    sizeLabel: 'SMALL',
    localX: -7.7,
    localZ: -5.2,
    bayWidth: 3.8,
    bayHeight: 3.4,
    accentColor: 0xc97b49,
    pedestalOffsets: Object.freeze([[-1.1, 0], [1.1, 0]]),
  }),
  Object.freeze({
    spaceId: 'boutique-m2',
    lockupId: 'lockup-l2',
    code: 'B2',
    sizeLabel: 'MEDIUM',
    localX: -7.7,
    localZ: 0.0,
    bayWidth: 4.4,
    bayHeight: 3.95,
    accentColor: 0x3f7a63,
    pedestalOffsets: Object.freeze([[-1.2, 0.06], [0, -0.06], [1.2, 0.06]]),
  }),
  Object.freeze({
    spaceId: 'anchor-xl4',
    lockupId: 'lockup-l6',
    code: 'A4',
    sizeLabel: 'ANCHOR',
    localX: 7.7,
    localZ: 5.2,
    bayWidth: 5.6,
    bayHeight: 6.2,
    accentColor: 0x2f5e76,
    pedestalOffsets: Object.freeze([
      [-1.65, 0.1],
      [-0.98, -0.1],
      [-0.32, 0.1],
      [0.32, -0.1],
      [0.98, 0.1],
      [1.65, -0.1],
    ]),
  }),
  Object.freeze({
    spaceId: 'showroom-l3',
    lockupId: 'lockup-l4',
    code: 'S3',
    sizeLabel: 'LARGE',
    localX: 7.7,
    localZ: -5.2,
    bayWidth: 4.8,
    bayHeight: 4.5,
    accentColor: 0x7b5c8e,
    pedestalOffsets: Object.freeze([[-1.38, 0.08], [-0.46, -0.08], [0.46, -0.08], [1.38, 0.08]]),
  }),
]);

export function mallLocalToWorld(mallLayout, localX, localZ) {
  const cos = Math.cos(mallLayout.facing);
  const sin = Math.sin(mallLayout.facing);
  return {
    x: mallLayout.x + localX * cos + localZ * sin,
    z: mallLayout.z - localX * sin + localZ * cos,
  };
}

export function mallWorldToLocal(mallLayout, worldX, worldZ) {
  const dx = worldX - mallLayout.x;
  const dz = worldZ - mallLayout.z;
  const cos = Math.cos(mallLayout.facing);
  const sin = Math.sin(mallLayout.facing);
  return {
    x: dx * cos - dz * sin,
    z: dx * sin + dz * cos,
  };
}

export function isInsideMallBuilding(worldX, worldZ, mallLayout = COMMERCE_VENUE_LAYOUT.find((v) => v.id === 'market')) {
  if (!mallLayout) return false;
  const local = mallWorldToLocal(mallLayout, worldX, worldZ);
  return Math.abs(local.x) <= mallLayout.width / 2 + 0.3 && Math.abs(local.z) <= mallLayout.depth / 2 + 0.3;
}

export function getMallLockupShopAt(worldX, worldZ, mallLayout = COMMERCE_VENUE_LAYOUT.find((v) => v.id === 'market')) {
  if (!mallLayout) return null;
  const local = mallWorldToLocal(mallLayout, worldX, worldZ);
  if (Math.abs(local.x) > mallLayout.width / 2 + 1.2 || Math.abs(local.z) > mallLayout.depth / 2 + 1.2) {
    return null;
  }
  let best = null;
  let bestDistance = Infinity;
  for (const shop of MALL_LOCKUP_SHOP_LAYOUT) {
    const insideRoom = Math.abs(local.x - shop.localX) <= shop.roomWidth / 2 + 0.35
      && Math.abs(local.z - shop.localZ) <= shop.roomDepth / 2 + 0.25;
    const distanceToCounter = Math.hypot(local.x - shop.localX, local.z - shop.localZ);
    const distanceToDoor = Math.hypot(local.x - shop.doorLocalX, local.z - shop.doorLocalZ);
    const effectiveDistance = insideRoom ? distanceToCounter * 0.5 : Math.min(distanceToCounter, distanceToDoor);
    if (insideRoom || effectiveDistance <= 3.6) {
      if (effectiveDistance < bestDistance) {
        bestDistance = effectiveDistance;
        best = {
          shop,
          insideRoom,
          distance: effectiveDistance,
        };
      }
    }
  }
  return best;
}

export function getMallIndoorWallColliders(mallLayout = COMMERCE_VENUE_LAYOUT.find((v) => v.id === 'market')) {
  if (!mallLayout) return [];
  const halfW = mallLayout.width / 2;
  const halfD = mallLayout.depth / 2;
  // Local wall segments that enclose the mall perimeter and separate the 6 lockup shops
  // while leaving the 6.2m front entrance portal (localX in [-3.1, +3.1], localZ = -halfD)
  // and each lockup shop doorway open for players to walk into!
  const localSegments = [
    // Rear perimeter wall
    { id: 'mall-wall-rear', localX: 0, localZ: halfD - 0.28, halfX: halfW, halfZ: 0.34, height: 9.6 },
    // North/Left perimeter wall
    { id: 'mall-wall-left', localX: -halfW + 0.28, localZ: 0, halfX: 0.34, halfZ: halfD, height: 9.6 },
    // South/Right perimeter wall
    { id: 'mall-wall-right', localX: halfW - 0.28, localZ: 0, halfX: 0.34, halfZ: halfD, height: 9.6 },
    // Front facade walls framing the open 6.2m Grand Main Entrance at localX in [-3.1, +3.1]
    { id: 'mall-wall-front-left', localX: -7.85, localZ: -halfD + 0.28, halfX: 4.75, halfZ: 0.34, height: 9.6 },
    { id: 'mall-wall-front-right', localX: 7.85, localZ: -halfD + 0.28, halfX: 4.75, halfZ: 0.34, height: 9.6 },
    // Interior partition walls between Lockup L-01, L-02, and L-03 (Left wing)
    { id: 'mall-partition-l1-l2', localX: -7.8, localZ: -2.6, halfX: 4.3, halfZ: 0.24, height: 4.5 },
    { id: 'mall-partition-l2-l3', localX: -7.8, localZ: 2.6, halfX: 4.3, halfZ: 0.24, height: 4.5 },
    // Interior partition walls between Lockup L-04, L-05, and L-06 (Right wing)
    { id: 'mall-partition-l4-l5', localX: 7.8, localZ: -2.6, halfX: 4.3, halfZ: 0.24, height: 4.5 },
    { id: 'mall-partition-l5-l6', localX: 7.8, localZ: 2.6, halfX: 4.3, halfZ: 0.24, height: 4.5 },
  ];

  return localSegments.map((seg) => {
    const worldPos = mallLocalToWorld(mallLayout, seg.localX, seg.localZ);
    return {
      id: seg.id,
      x: worldPos.x,
      z: worldPos.z,
      yaw: mallLayout.facing,
      halfX: seg.halfX,
      halfZ: seg.halfZ,
      height: seg.height,
    };
  });
}

export const MALL_PARKING_LOT_LAYOUT = Object.freeze({
  localX: 18.0,
  localZ: 0.6,
  width: 10.4,
  depth: 15.6,
  taxiDropOffLocalX: 0.0,
  taxiDropOffLocalZ: -11.2,
});

export const MALL_PARKING_BAYS = Object.freeze([
  Object.freeze({
    id: 'mall-vip-p1',
    code: 'VIP P-01',
    isVip: true,
    hasParkedCar: true,
    carColor: 0x243b4a,
    localX: 15.6,
    localZ: -4.8,
  }),
  Object.freeze({
    id: 'mall-vip-p2',
    code: 'VIP P-02',
    isVip: true,
    hasParkedCar: false,
    carColor: 0xc89a4b,
    localX: 15.6,
    localZ: 0.0,
  }),
  Object.freeze({
    id: 'mall-vip-p3',
    code: 'VIP P-03',
    isVip: true,
    hasParkedCar: true,
    carColor: 0x7a3b2e,
    localX: 15.6,
    localZ: 4.8,
  }),
  Object.freeze({
    id: 'mall-cust-p4',
    code: 'P-04',
    isVip: false,
    hasParkedCar: true,
    carColor: 0x3b6e5c,
    localX: 20.6,
    localZ: -4.8,
  }),
  Object.freeze({
    id: 'mall-cust-p5',
    code: 'P-05',
    isVip: false,
    hasParkedCar: false,
    carColor: 0xd8a148,
    localX: 20.6,
    localZ: 0.0,
  }),
  Object.freeze({
    id: 'mall-cust-p6',
    code: 'P-06',
    isVip: false,
    hasParkedCar: true,
    carColor: 0x5c5346,
    localX: 20.6,
    localZ: 4.8,
  }),
]);

export function getMallParkingSurfaceHeight(
  worldX,
  worldZ,
  baseY = 0,
  mallLayout = COMMERCE_VENUE_LAYOUT.find((v) => v.id === 'market'),
) {
  if (!mallLayout) return null;
  const local = mallWorldToLocal(mallLayout, worldX, worldZ);
  const lot = MALL_PARKING_LOT_LAYOUT;
  const insideParkingLot = Math.abs(local.x - lot.localX) <= lot.width / 2 + 0.4
    && Math.abs(local.z - lot.localZ) <= lot.depth / 2 + 0.4;
  const onTaxiForecourt = Math.abs(local.x) <= mallLayout.width / 2 + 0.4
    && local.z >= -mallLayout.depth / 2 - 4.2
    && local.z <= -mallLayout.depth / 2 + 0.2;
  if (insideParkingLot || onTaxiForecourt) {
    return baseY + 0.12;
  }
  return null;
}

export const BILLBOARD_LAYOUT = Object.freeze([
  Object.freeze({
    id: 'billboard-mall',
    code: 'BB-01',
    name: 'Unity Mall Junction Megaboard',
    corridor: 'Commerce Promenade & Rail Crossing',
    locationLabel: 'Unity Mall Approach',
    x: 52.8,
    z: 25.4,
    facing: -Math.PI * 0.72,
    boardWidth: 5.8,
    boardHeight: 2.9,
    towerHeight: 4.6,
    halfX: 1.4,
    halfZ: 0.75,
    dailyImpressions: 2800,
    leaseCost: 45,
    payoutPerCollection: 28,
    defaultAd: Object.freeze({
      badge: 'UNITY MALL · 4 STOREFRONT TIERS',
      headline: 'RENT YOUR 3D SHOP AT UNITY MALL',
      subline: 'Display Virtual Goods · Kiosk to Anchor Hall · East Promenade',
      cta: 'VISIT UNITY MALL',
      theme: 'emerald',
      campaignType: 'mall',
    }),
  }),
  Object.freeze({
    id: 'billboard-civic',
    code: 'BB-02',
    name: 'Governor’s Boulevard Spectacular',
    corridor: 'Unity Community Hall & Civic Café',
    locationLabel: 'Civic Boulevard North',
    x: 18.2,
    z: 31.8,
    facing: Math.PI,
    boardWidth: 5.4,
    boardHeight: 2.7,
    towerHeight: 4.4,
    halfX: 1.3,
    halfZ: 0.7,
    dailyImpressions: 2200,
    leaseCost: 36,
    payoutPerCollection: 22,
    defaultAd: Object.freeze({
      badge: 'CIVIC SEAT · UNITY COURT',
      headline: 'RUN FOR GOVERNOR AT COMMUNITY HALL',
      subline: 'Hold Town Halls · Enact Policies · Fund Public Works',
      cta: 'OPEN GOVERNOR APP',
      theme: 'gold',
      campaignType: 'civic',
    }),
  }),
  Object.freeze({
    id: 'billboard-estate',
    code: 'BB-03',
    name: 'Unity Court Transit Gateway Board',
    corridor: 'Unity Court Avenue & Homes Hub',
    locationLabel: 'Unity Court Boulevard',
    x: 27.2,
    z: 12.6,
    facing: Math.PI,
    boardWidth: 5.4,
    boardHeight: 2.7,
    towerHeight: 4.4,
    halfX: 1.3,
    halfZ: 0.7,
    dailyImpressions: 2400,
    leaseCost: 38,
    payoutPerCollection: 24,
    defaultAd: Object.freeze({
      badge: 'UNITY COURT · FURNISHED HOMES',
      headline: 'LEASE A COTTAGE AT UNITY COURT',
      subline: 'Houses 01–04 · Local Landlords · Steps from Rail & Bus',
      cta: 'BROWSE HOMES APP',
      theme: 'terracotta',
      campaignType: 'brand',
    }),
  }),
  Object.freeze({
    id: 'billboard-circle',
    code: 'BB-04',
    name: 'Unity Circle Monumental Unipole',
    corridor: 'Unity Circle Plaza & South Transit Hub',
    locationLabel: 'Unity Circle Overlook',
    x: 16.5,
    z: -31.5,
    facing: -Math.PI * 0.72,
    boardWidth: 5.8,
    boardHeight: 2.85,
    towerHeight: 4.6,
    halfX: 1.35,
    halfZ: 0.72,
    dailyImpressions: 2600,
    leaseCost: 42,
    payoutPerCollection: 26,
    defaultAd: Object.freeze({
      badge: 'ABUJA TRANSIT · RAIL & BUS',
      headline: 'RIDE ABUJA CITY RAIL & SHUTTLE',
      subline: 'Connecting Unity Court, Unity Circle & Community Stadium',
      cta: 'BOARD AT ANY HUB',
      theme: 'royal',
      campaignType: 'brand',
    }),
  }),
  Object.freeze({
    id: 'billboard-stadium',
    code: 'BB-05',
    name: 'Abuja Stadium Matchday Megaboard',
    corridor: 'Abuja Community Stadium & West Hub',
    locationLabel: 'Stadium Concourse Approach',
    x: -46.8,
    z: 16.2,
    facing: -Math.PI * 0.42,
    boardWidth: 6.2,
    boardHeight: 3.0,
    towerHeight: 4.8,
    halfX: 1.45,
    halfZ: 0.78,
    dailyImpressions: 3200,
    leaseCost: 52,
    payoutPerCollection: 32,
    defaultAd: Object.freeze({
      badge: 'LIVE MATCHDAY · FLOODLIGHT ARENA',
      headline: 'CAPITAL STARS VS SAVANNAH UNITED',
      subline: 'Watch Live Broadcast View at Abuja Community Stadium',
      cta: 'WATCH MATCH LIVE',
      theme: 'sunset',
      campaignType: 'brand',
    }),
  }),
]);

