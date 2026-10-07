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
    sign: 'UNITY MALL',
    x: 57.2,
    z: 34.4,
    facing: Math.PI / 2,
    width: 14.2,
    depth: 8.6,
    collider: Object.freeze({
      localX: 0,
      localZ: -0.25,
      halfX: 7.32,
      halfZ: 4.55,
      height: 7.4,
    }),
    wallColor: 0xebe5d5,
    roofColor: 0x456b5c,
    awningColor: 0x3f7a63,
  }),
]);

export const MALL_SHOP_BAY_LAYOUT = Object.freeze([
  Object.freeze({
    spaceId: 'kiosk-s1',
    code: 'K1',
    sizeLabel: 'SMALL',
    localX: -5.15,
    localZ: -3.55,
    bayWidth: 2.35,
    bayHeight: 2.85,
    accentColor: 0xc97b49,
    pedestalOffsets: Object.freeze([[-0.44, 0], [0.44, 0]]),
  }),
  Object.freeze({
    spaceId: 'boutique-m2',
    code: 'B2',
    sizeLabel: 'MEDIUM',
    localX: -2.25,
    localZ: -4.3,
    bayWidth: 2.95,
    bayHeight: 3.35,
    accentColor: 0x3f7a63,
    pedestalOffsets: Object.freeze([[-0.76, 0.05], [0, -0.06], [0.76, 0.05]]),
  }),
  Object.freeze({
    spaceId: 'anchor-xl4',
    code: 'A4',
    sizeLabel: 'ANCHOR',
    localX: 1.05,
    localZ: -4.3,
    bayWidth: 3.55,
    bayHeight: 5.4,
    accentColor: 0x2f5e76,
    pedestalOffsets: Object.freeze([
      [-1.08, 0.08],
      [-0.64, -0.08],
      [-0.22, 0.08],
      [0.22, -0.08],
      [0.64, 0.08],
      [1.08, -0.08],
    ]),
  }),
  Object.freeze({
    spaceId: 'showroom-l3',
    code: 'S3',
    sizeLabel: 'LARGE',
    localX: 4.85,
    localZ: -4.3,
    bayWidth: 3.45,
    bayHeight: 3.8,
    accentColor: 0x7b5c8e,
    pedestalOffsets: Object.freeze([[-1.02, 0.06], [-0.34, -0.06], [0.34, -0.06], [1.02, 0.06]]),
  }),
]);
