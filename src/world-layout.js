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
    name: 'Civic Café',
    sign: 'CIVIC CAFE',
    x: 29,
    z: 33,
    facing: -Math.PI / 2,
    wallColor: 0xe8dcc8,
    roofColor: 0x526f5d,
    awningColor: 0x986849,
  }),
  Object.freeze({
    id: 'market',
    name: 'Unity Market',
    sign: 'UNITY MARKET',
    x: 55,
    z: 33,
    facing: Math.PI / 2,
    wallColor: 0xdfe2c6,
    roofColor: 0x647450,
    awningColor: 0x5d8665,
  }),
]);
