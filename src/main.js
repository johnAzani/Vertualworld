import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { resolveDiscAgainstOrientedBox } from './collision.js';
import { getFrameTiming } from './frame-timing.js';
import { createAbujaLandscape } from './abuja-world.js';
import {
  BILLBOARD_LAYOUT,
  COMMUNITY_HALL_LAYOUT,
  COMMERCE_VENUE_COLLIDER,
  COMMERCE_VENUE_LAYOUT,
  COMMERCE_VENUE_SIZE,
  ESTATE_HOUSE_COLLISION_MARGIN,
  ESTATE_HOUSE_LAYOUT,
  ESTATE_HOUSE_SIZE,
  MALL_SHOP_BAY_LAYOUT,
} from './world-layout.js';
import { createStadium, STADIUM_CONFIG as STADIUM, updateStadiumMatch } from './stadium.js';
import {
  createTransportNetwork,
  getBusWaitSeconds,
  getNearestBusTerminal,
  getNearestTransitStation,
  getNextBusTerminal,
  getNextTransitStation,
  getTransportSurfaceHeight,
  getTransitWaitSeconds,
  isBusAtTerminal,
  isReservedTransportSpot,
  isTrainAtStation,
  updateTransitLighting,
  updateTransportNetwork,
} from './transport.js';
import {
  MALL_SHOP_SPACES,
  RENTAL_LISTINGS,
  RENTAL_MONTH_MS,
  SHOP_CATALOG,
  VIRTUAL_GOOD_STYLES,
  advanceRentalBilling,
  collectMallShowcaseSales,
  consumeProduct,
  createCustomVirtualGood,
  earnGameCredits,
  endMallShopLease,
  endRentalLease,
  getAllVirtualGoods,
  getMallShopDisplayState,
  getMallShopSpace,
  getProduct,
  loadEconomy,
  payMallShopRent,
  payRentalRent,
  purchaseProduct,
  saveEconomy,
  signMallShopLease,
  signRentalLease,
  toggleMallShopDisplayedGood,
  updateMallShopDetails,
} from './economy.js';
import {
  LIFE_GOALS,
  LIFE_JOBS,
  RESIDENT_ORIGINS,
  RESIDENT_OUTFITS,
  adjustLifeNeeds,
  advanceLifeNeeds,
  answerLifeShiftTask,
  completeLifeGoal,
  connectWithNeighbour,
  createResident,
  enjoyMeal,
  getActiveShiftTask,
  getLifeGoalProgress,
  getLifeRank,
  getOutfit,
  getSelectedLifeJob,
  loadLife,
  recordLifeVisit,
  restAtHome,
  saveLife,
  selectLifeJob,
  startLifeShift,
} from './life-sim.js';
import {
  WORLD_VIEW_ANGLE,
  WORLD_VIEW_RADIUS,
  getWorldViewCameraDistance,
} from './world-view.js';
import {
  createThirdPersonMovementState,
  getNextCameraMode,
  getThirdPersonMovementYaw,
  setBehindPlayerOffset,
  stepJoystickNavigation,
} from './follow-camera.js';
import {
  GOVERNOR_POLICIES,
  PUBLIC_PROJECTS,
  TAX_RATES,
  canvassNeighboursForCampaign,
  enactGovernorPolicy,
  fundPublicProject,
  getActiveGovernorPolicy,
  getActiveTaxRate,
  getNextCivicPetition,
  holdCivicTownHall,
  loadGovernment,
  runGovernorElection,
  saveGovernment,
  setGovernorTaxRate,
  updateCampaignPlatform,
} from './government.js';
import {
  BILLBOARD_CAMPAIGN_TYPES,
  BILLBOARD_THEMES,
  applyQuickBillboardPreset,
  collectBillboardRevenue,
  endBillboardLease,
  getBillboardBonuses,
  getBillboardById,
  getBillboardDisplayState,
  loadBillboardState,
  rentBillboard,
  saveBillboardState,
  updateBillboardCampaign,
} from './billboards.js';
import './style.css';

const app = document.querySelector('#app');
const canvas = document.querySelector('#world-canvas');
const loadingScreen = document.querySelector('#loading-screen');
const introCard = document.querySelector('#intro-card');
const toast = document.querySelector('#toast');
const toastMessage = document.querySelector('#toast-message');
const homeInteraction = document.querySelector('#home-interaction');
const homeInteractionEyebrow = document.querySelector('#home-interaction-eyebrow');
const homeInteractionMessage = document.querySelector('#home-interaction-message');
const homeInteractionAction = document.querySelector('#home-interaction-action');
const homeInteractionButton = document.querySelector('#home-interaction-button');
const homeLightsButton = document.querySelector('#home-lights-button');
const stadiumBroadcast = document.querySelector('#stadium-broadcast');
const stadiumBroadcastClock = document.querySelector('#stadium-broadcast-clock');
const stadiumBroadcastScoreline = document.querySelector('#stadium-broadcast-scoreline');
const stadiumBroadcastStatus = document.querySelector('#stadium-broadcast-status');
const stadiumWatchExitButton = document.querySelector('#stadium-watch-exit');
const homeLightsAction = document.querySelector('#home-lights-action');
const controlsHint = document.querySelector('#controls-hint');
const walkingControlsHint = document.querySelector('#walking-controls');
const vehicleControlsHint = document.querySelector('#vehicle-controls');
const transitControlsHint = document.querySelector('#transit-controls');
const jumpButtonLabel = document.querySelector('#jump-button-label');
const jumpButtonIcon = document.querySelector('#jump-button-icon');
const touchLabel = document.querySelector('#touch-label');
const accelerateButton = document.querySelector('#accelerate-button');
const accelerateButtonLabel = document.querySelector('#accelerate-button-label');
const accelerateButtonIcon = document.querySelector('#accelerate-button-icon');
const homeTransitionElement = document.querySelector('#home-transition');
const mapCanvas = document.querySelector('#map-canvas');
const mapContext = mapCanvas.getContext('2d');
const phoneMapCanvas = document.querySelector('#phone-map-canvas');
const phoneMapContext = phoneMapCanvas.getContext('2d');
const phonePanel = document.querySelector('#phone-panel');
const phoneScrim = document.querySelector('#phone-scrim');
const phoneButton = document.querySelector('#phone-button');
const viewToggleButton = document.querySelector('#view-toggle');
const worldViewButton = document.querySelector('#world-view-button');
const worldViewBanner = document.querySelector('#world-view-banner');
const worldViewReturnButton = document.querySelector('#world-view-return');
const fullscreenButton = document.querySelector('#fullscreen-button');
const phoneCloseButton = document.querySelector('#phone-close');
const phoneBackButton = document.querySelector('#phone-back');
const phoneContent = document.querySelector('#phone-content');
const phonePageTitle = document.querySelector('#phone-page-title');
const phonePageEyebrow = document.querySelector('#phone-page-eyebrow');
const phonePageSubtitle = document.querySelector('#phone-page-subtitle');
const phoneChatThread = document.querySelector('#phone-chat-thread');
const phoneMessagePreview = document.querySelector('#phone-message-preview');
const phoneMessageForm = document.querySelector('#phone-message-form');
const phoneMessageInput = document.querySelector('#phone-message-input');
const phoneNotificationDot = document.querySelector('#phone-notification-dot');
const phoneMessageBadge = document.querySelector('#phone-message-badge');
const phoneNote = document.querySelector('#phone-note');
const phoneNoteStatus = document.querySelector('#phone-note-status');
const phoneNoteCount = document.querySelector('#phone-note-count');
const phoneTimeElement = document.querySelector('#phone-time');
const phoneHomeTime = document.querySelector('#phone-home-time');
const worldPeriodElement = document.querySelector('#world-period');
const walletBalanceElement = document.querySelector('#wallet-balance');
const cafeWalletBalanceElement = document.querySelector('#cafe-wallet-balance');
const marketWalletBalanceElement = document.querySelector('#market-wallet-balance');
const bankAccountIdElement = document.querySelector('#bank-account-id');
const bankWalletBalanceElement = document.querySelector('#bank-wallet-balance');
const bankTopupAmountInput = document.querySelector('#bank-topup-amount');
const bankInputFeedbackElement = document.querySelector('#bank-input-feedback');
const bankCheckoutPreviewElement = document.querySelector('#bank-checkout-preview');
const bankIntentTitleElement = document.querySelector('#bank-intent-title');
const bankIntentAmountElement = document.querySelector('#bank-intent-amount');
const bankIntentReferenceElement = document.querySelector('#bank-intent-reference');
const bankIntentAccountElement = document.querySelector('#bank-intent-account');
const bankIntentMessageElement = document.querySelector('#bank-intent-message');
const bankLedgerEmptyElement = document.querySelector('#bank-ledger-empty');
const bankLedgerElement = document.querySelector('#bank-ledger');
const estateRosterElement = document.querySelector('#estate-roster');
const leaseManagementElement = document.querySelector('#lease-management');
const propertyHouseNumberElement = document.querySelector('#property-house-number');
const propertyHomeLabelElement = document.querySelector('#property-home-label');
const propertyHomeTitleElement = document.querySelector('#property-home-title');
const propertyHomeSubtitleElement = document.querySelector('#property-home-subtitle');
const propertyInteriorLabelElement = document.querySelector('#property-interior-label');
const propertyInteriorDescriptionElement = document.querySelector('#property-interior-description');
const residenceStatusElement = document.querySelector('#residence-status');
const cafeShopItemsElement = document.querySelector('#cafe-shop-items');
const marketShopItemsElement = document.querySelector('#market-shop-items');
const cafeProximityElement = document.querySelector('#cafe-proximity');
const marketProximityElement = document.querySelector('#market-proximity');
const cafeInventoryElement = document.querySelector('#cafe-inventory');
const marketInventoryElement = document.querySelector('#market-inventory');
const mallShopSpacesElement = document.querySelector('#mall-shop-spaces');
const mallShowcaseManagerElement = document.querySelector('#mall-showcase-manager');
const governmentTreasuryBalanceElement = document.querySelector('#government-treasury-balance');
const governmentProximityElement = document.querySelector('#government-proximity');
const governmentOfficeCardElement = document.querySelector('#government-office-card');
const governmentPolicySectionElement = document.querySelector('#government-policy-section');
const governmentProjectsSectionElement = document.querySelector('#government-projects-section');
const billboardsWalletBalanceElement = document.querySelector('#billboards-wallet-balance');
const billboardsProximityElement = document.querySelector('#billboards-proximity');
const billboardsStudioSectionElement = document.querySelector('#billboards-studio-section');
const billboardsDirectorySectionElement = document.querySelector('#billboards-directory-section');
const residentForm = document.querySelector('#resident-form');
const residentNameInput = document.querySelector('#resident-name-input');
const residentOriginInput = document.querySelector('#resident-origin-input');
const residentOutfitInput = document.querySelector('#resident-outfit-input');
const lifeProfileForm = document.querySelector('#life-profile-form');
const lifeNameEditInput = document.querySelector('#life-name-edit');
const lifeOriginEditInput = document.querySelector('#life-origin-edit');
const lifeOutfitEditInput = document.querySelector('#life-outfit-edit');
const lifeNeedsElement = document.querySelector('#life-needs-list');
const lifeFoodInventoryElement = document.querySelector('#life-food-inventory');
const lifeGoalListElement = document.querySelector('#life-goal-list');
const workCareerSummaryElement = document.querySelector('#work-career-summary');
const workJobListElement = document.querySelector('#work-job-list');
const workShiftPanelElement = document.querySelector('#work-shift-panel');
const reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
const showPerformanceHud = new URLSearchParams(window.location.search).get('perf') === '1';
// The neighborhood is built below using the persisted lease to choose the active home.
// Load it before any world construction so the rental selection never reads a TDZ binding.
const economyStorage = {
  getItem(key) { return window.localStorage.getItem(key); },
  setItem(key, value) { window.localStorage.setItem(key, value); },
};
const economy = loadEconomy(economyStorage);
// Persist the local game-account reference even before the first wallet transaction.
saveEconomy(economyStorage, economy);
const government = loadGovernment(economyStorage);
saveGovernment(economyStorage, government);
const billboards = loadBillboardState(economyStorage);
saveBillboardState(billboards, economyStorage);
let selectedBillboardId = BILLBOARD_LAYOUT[0].id;
const lifeStorage = {
  getItem(key) { return window.localStorage.getItem(key); },
  setItem(key, value) { window.localStorage.setItem(key, value); },
};
const life = loadLife(lifeStorage);
let lifeNeedMinuteAccumulator = 0;

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function populateResidentControls() {
  const originOptions = RESIDENT_ORIGINS.map((origin) => `<option value="${escapeHTML(origin)}">${escapeHTML(origin)}</option>`).join('');
  const outfitOptions = RESIDENT_OUTFITS.map((outfit) => `<option value="${escapeHTML(outfit.id)}">${escapeHTML(outfit.name)}</option>`).join('');
  for (const select of [residentOriginInput, lifeOriginEditInput]) select.innerHTML = originOptions;
  for (const select of [residentOutfitInput, lifeOutfitEditInput]) select.innerHTML = outfitOptions;
  residentNameInput.value = life.profile.created ? life.profile.name : '';
  residentOriginInput.value = life.profile.origin;
  residentOutfitInput.value = life.profile.outfit;
  lifeNameEditInput.value = life.profile.name;
  lifeOriginEditInput.value = life.profile.origin;
  lifeOutfitEditInput.value = life.profile.outfit;
  if (life.profile.created) {
    introCard.querySelector('.eyebrow').lastChild.textContent = ' WELCOME BACK · ABUJA LIFE';
    introCard.querySelector('h1').innerHTML = `${escapeHTML(life.profile.name)},<br><em>you’re home.</em>`;
    introCard.querySelector('p').textContent = 'Your home and neighbours are right where you left them. Keep building your Abuja story.';
    introCard.querySelector('#explore-button span').textContent = 'Continue your life';
  }
}

populateResidentControls();
let prefersReducedMotion = Boolean(reducedMotionQuery?.matches);
reducedMotionQuery?.addEventListener?.('change', (event) => {
  prefersReducedMotion = event.matches;
});

const WORLD_RADIUS = 82;
const SEED_POSITIONS = [
  new THREE.Vector2(-18, -10),
  new THREE.Vector2(25, -24),
  new THREE.Vector2(-39, -42),
];
const PATH_POINTS_XZ = [
  [-13.1, 18], [-9, 18], [-5, 18], [0, 18], [0.4, 13], [-1.8, 9], [1.6, 5], [1.4, 0], [-1.2, -5], [-2.2, -11], [0.8, -16], [1.2, -21], [0, -27],
];

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
} catch (error) {
  console.error('WebGL could not be initialized:', error);
  const webglMessage = 'This browser or device could not start WebGL 2 graphics. Try an up-to-date browser with hardware acceleration enabled.';
  if (typeof window.vertualworldBoot?.fail === 'function') {
    window.vertualworldBoot.fail(webglMessage, error);
  } else {
    loadingScreen.querySelector('.loading-title').textContent = 'THIS WORLD NEEDS WEBGL';
    loadingScreen.querySelector('.loading-subtitle').textContent = webglMessage;
    loadingScreen.querySelector('.loading-line').hidden = true;
  }
  throw error;
}

const RENDER_PIXEL_RATIO_CAP = window.matchMedia?.('(pointer: coarse)').matches ? 1.4 : 1.5;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, RENDER_PIXEL_RATIO_CAP));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.info.autoReset = !showPerformanceHud;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb5dce0);
scene.fog = new THREE.Fog(0xb5dce0, 90, 225);

const camera = new THREE.PerspectiveCamera(49, window.innerWidth / window.innerHeight, 0.1, 600);
camera.position.set(0, 7, 23);

const hemi = new THREE.HemisphereLight(0xe2fff1, 0x597662, 2.0);
scene.add(hemi);

const sunLight = new THREE.DirectionalLight(0xffedcf, 3.1);
sunLight.position.set(-36, 54, 22);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024, 1024);
sunLight.shadow.camera.left = -78;
sunLight.shadow.camera.right = 78;
sunLight.shadow.camera.top = 78;
sunLight.shadow.camera.bottom = -78;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 160;
sunLight.shadow.bias = -0.00028;
sunLight.shadow.normalBias = 0.035;
scene.add(sunLight);
sunLight.target.position.set(0, 0, -8);
scene.add(sunLight.target);

const fillLight = new THREE.DirectionalLight(0xc2f0e8, 0.55);
fillLight.position.set(35, 18, -35);
scene.add(fillLight);

const moonLight = new THREE.DirectionalLight(0xb5c9e2, 0);
moonLight.position.set(20, 55, 30);
scene.add(moonLight);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setTextIfChanged(element, value) {
  const text = String(value);
  if (element.textContent !== text) element.textContent = text;
}

function setAttributeIfChanged(element, name, value) {
  const attribute = String(value);
  if (element.getAttribute(name) !== attribute) element.setAttribute(name, attribute);
}

function smoothstep01(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function terrainHeight(x, z) {
  const radius = Math.hypot(x, z);
  const plateau = 0.22
    + Math.sin(x * 0.105 + Math.sin(z * 0.08)) * Math.cos(z * 0.085) * 0.28
    + Math.sin((x + z) * 0.16) * 0.12;
  // The playable plateau eases into inland savannah; there is no shoreline or sea cliff.
  const savannahBlend = smoothstep01((radius - 62) / 28);
  const naturalHeight = THREE.MathUtils.lerp(plateau, -0.72, savannahBlend);
  const outsideX = Math.max(Math.abs(x - STADIUM.x) - STADIUM.plateauHalfX, 0);
  const outsideZ = Math.max(Math.abs(z - STADIUM.z) - STADIUM.plateauHalfZ, 0);
  const stadiumBlend = 1 - smoothstep01(Math.hypot(outsideX, outsideZ) / STADIUM.terrainBlend);
  return THREE.MathUtils.lerp(naturalHeight, STADIUM.level, stadiumBlend);
}

function distanceToPath(x, z) {
  let minimum = Infinity;
  for (let i = 0; i < PATH_POINTS_XZ.length - 1; i += 1) {
    const [ax, az] = PATH_POINTS_XZ[i];
    const [bx, bz] = PATH_POINTS_XZ[i + 1];
    const dx = bx - ax;
    const dz = bz - az;
    const lengthSq = dx * dx + dz * dz;
    const t = lengthSq === 0 ? 0 : clamp(((x - ax) * dx + (z - az) * dz) / lengthSq, 0, 1);
    minimum = Math.min(minimum, Math.hypot(x - (ax + dx * t), z - (az + dz * t)));
  }
  return minimum;
}

const ESTATE_BOUNDS = { minX: 9, maxX: 46, minZ: -9, maxZ: 25 };
const TRAIL_HALF_WIDTH = 0.82;
const TRAIL_SURFACE_OFFSET = 0.065;
const PLAYER_FOOT_OFFSET = 0.042;
const PLAYER_COLLISION_RADIUS = 0.42;
const PLAYER_BODY_HEIGHT = 1.82;
const CAR_COLLISION_RADIUS = 1.52;
const CAR_BODY_HEIGHT = 1.62;
const CAR_INTERACTION_RADIUS = 3.15;
const HOME_INTERACTION_PRIORITY_RADIUS = 1.8;
const PLAYER_GRAVITY = 17;
const JUMP_SPEED = 6.5;
const JUMP_BUFFER_SECONDS = 0.16;
const COYOTE_TIME_SECONDS = 0.12;
const estateHouses = [];
const commerceVenues = [];
const estateRoadSurfaces = [];
const exteriorNightLights = [];
const worldObstacleColliders = [];
let playerCar = null;
let transitNetwork = null;
let isDriving = false;
let isRidingTransit = false;
let transitStopRequested = false;
let transitRideMode = null;
let transitBoardedStopId = null;
let vehicleInteractionCooldown = 0;
let vehicleAccelerateTapTimer = 0;
const vehicleTouchInput = { accelerate: false, brake: false };
const homeFurnitureColliders = [];
const homeLightFixtures = [];
let homeLightFixtureSequence = 0;
const HOME_FLOOR_TOP = 0.38;
const HOME_DOOR_OPENING_HALF_WIDTH = 0.8;
const HOME_INTERIOR_BOUNDS = 3.92;
let homeHouse = null;
let activeResidence = null;
let homeDoorPivot = null;
let homeDoorTargetAngle = 0;
let homeLightSwitchIndicator = null;
let homeTransitionPending = null;
let homeLightingEnabled = true;
let isInsideHome = false;

function getCurrentResidence() {
  return activeResidence || homeHouse;
}

function residenceLocalToWorld(residence, localX, localZ) {
  const cosYaw = Math.cos(residence.facing);
  const sinYaw = Math.sin(residence.facing);
  return {
    x: residence.x + localX * cosYaw + localZ * sinYaw,
    z: residence.z - localX * sinYaw + localZ * cosYaw,
  };
}

function residenceWorldToLocal(residence, x, z) {
  const offsetX = x - residence.x;
  const offsetZ = z - residence.z;
  const cosYaw = Math.cos(residence.facing);
  const sinYaw = Math.sin(residence.facing);
  return { x: offsetX * cosYaw - offsetZ * sinYaw, z: offsetX * sinYaw + offsetZ * cosYaw };
}

function placePlayerOutsideResidence(residence) {
  if (!residence) return;
  const outside = residenceLocalToWorld(residence, 0, -6.0);
  player.position.set(outside.x, groundHeightAt(outside.x, outside.z), outside.z);
  player.rotation.y = residence.facing;
  cameraYaw = residence.facing + Math.PI;
  cameraPitch = 0;
  jumpHeight = 0;
  jumpVelocity = 0;
  isGrounded = true;
  isInsideHome = false;
  velocity.set(0, 0, 0);
  avatarModel.visible = !isFirstPerson && !isDriving && !isRidingTransit;
  playerShadow.visible = !isFirstPerson && !isDriving && !isRidingTransit;
}

function isInsideEstate(x, z, margin = 0) {
  return x >= ESTATE_BOUNDS.minX - margin
    && x <= ESTATE_BOUNDS.maxX + margin
    && z >= ESTATE_BOUNDS.minZ - margin
    && z <= ESTATE_BOUNDS.maxZ + margin;
}

function isReservedSpot(x, z, extra = 0) {
  if (distanceToPath(x, z) < 4.2 + extra) return true;
  if (Math.hypot(x, z + 27) < 11 + extra) return true;
  if (Math.hypot(x, z - 12) < 7 + extra) return true;
  if (isInsideEstate(x, z, extra)) return true;
  for (const venue of COMMERCE_VENUE_LAYOUT) {
    const collider = venue.collider ?? COMMERCE_VENUE_COLLIDER;
    const local = residenceWorldToLocal(venue, x, z);
    if (Math.abs(local.x - collider.localX) < collider.halfX + 2.2 + extra
      && Math.abs(local.z - collider.localZ) < collider.halfZ + 2.6 + extra) return true;
  }
  if (Math.abs(x - COMMUNITY_HALL_LAYOUT.x) < COMMUNITY_HALL_LAYOUT.halfX + extra
    && Math.abs(z - COMMUNITY_HALL_LAYOUT.z) < COMMUNITY_HALL_LAYOUT.halfZ + extra) return true;
  if (BILLBOARD_LAYOUT.some((item) => Math.hypot(x - item.x, z - item.z) < 4.2 + extra)) return true;
  if (Math.abs(x - STADIUM.x) < STADIUM.standHalfX + 2 + extra
    && Math.abs(z - STADIUM.z) < STADIUM.standHalfZ + 2 + extra) return true;
  if (transitNetwork && isReservedTransportSpot(transitNetwork, x, z, extra)) return true;
  return SEED_POSITIONS.some((point) => Math.hypot(x - point.x, z - point.y) < 5.5 + extra);
}

// A gently rolling Abuja plateau blends into a warm, dry-season savannah edge.
const terrainGeometry = new THREE.PlaneGeometry(180, 180, 112, 112);
const terrainPositions = terrainGeometry.attributes.position;
const terrainColors = [];
const grassDeep = new THREE.Color(0x5d8057);
const grassBase = new THREE.Color(0x839b63);
const grassLight = new THREE.Color(0xb0b47a);
const savannahSoil = new THREE.Color(0xb39a68);
for (let i = 0; i < terrainPositions.count; i += 1) {
  const x = terrainPositions.getX(i);
  const z = -terrainPositions.getY(i);
  const radius = Math.hypot(x, z);
  const height = terrainHeight(x, z);
  terrainPositions.setZ(i, height);
  const patch = 0.5 + 0.5 * Math.sin(x * 0.14 + Math.sin(z * 0.11)) * Math.cos(z * 0.13);
  const color = grassDeep.clone().lerp(grassBase, 0.42 + patch * 0.42);
  color.lerp(grassLight, Math.max(0, patch - 0.66) * 0.35);
  color.lerp(savannahSoil, smoothstep01((radius - 52) / 38) * 0.78);
  terrainColors.push(color.r, color.g, color.b);
}
terrainGeometry.setAttribute('color', new THREE.Float32BufferAttribute(terrainColors, 3));
terrainGeometry.rotateX(-Math.PI / 2);
terrainGeometry.computeVertexNormals();
const terrain = new THREE.Mesh(terrainGeometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }));
terrain.receiveShadow = true;
terrain.frustumCulled = false;
scene.add(terrain);

// A broad, matte inland ground plane carries the landscape beyond the playable plateau.
const hinterlandGeometry = new THREE.PlaneGeometry(1200, 1200, 1, 1);
hinterlandGeometry.rotateX(-Math.PI / 2);
const hinterland = new THREE.Mesh(hinterlandGeometry, new THREE.MeshStandardMaterial({
  color: 0x9b8c64,
  roughness: 1,
  metalness: 0,
}));
hinterland.position.y = -0.72;
hinterland.receiveShadow = false;
scene.add(hinterland);
scene.add(createAbujaLandscape());

// A slow sun arc, moon, and faint stars mark the passage of time over the city.

const sunDiscMaterial = new THREE.MeshBasicMaterial({ color: 0xffdda0 });
const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(6.8, 24, 16), sunDiscMaterial);
sunDisc.position.set(-80, 75, -138);
scene.add(sunDisc);
const moonDisc = new THREE.Mesh(
  new THREE.SphereGeometry(4.2, 20, 14),
  new THREE.MeshBasicMaterial({ color: 0xdce8f4 }),
);
moonDisc.visible = false;
scene.add(moonDisc);

const starPositions = new Float32Array(210 * 3);
let starSeed = 0x4f39a1;
for (let i = 0; i < starPositions.length / 3; i += 1) {
  starSeed = (starSeed * 1664525 + 1013904223) >>> 0;
  const azimuth = (starSeed / 4294967296) * Math.PI * 2;
  starSeed = (starSeed * 1664525 + 1013904223) >>> 0;
  const height = 0.18 + (starSeed / 4294967296) * 0.8;
  const horizontal = Math.sqrt(1 - height * height);
  starPositions[i * 3] = Math.cos(azimuth) * horizontal * 270;
  starPositions[i * 3 + 1] = height * 270;
  starPositions[i * 3 + 2] = Math.sin(azimuth) * horizontal * 270;
}
const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeometry.computeBoundingSphere();
const starMaterial = new THREE.PointsMaterial({ color: 0xe8f0ff, size: 1.2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false });
const stars = new THREE.Points(starGeometry, starMaterial);
stars.visible = false;
scene.add(stars);

const nightSkyColor = new THREE.Color(0x172b43);
const daySkyColor = new THREE.Color(0xb5dce0);
const twilightSkyColor = new THREE.Color(0xe9a889);
const nightHemiColor = new THREE.Color(0x7f9ec1);
const dayHemiColor = new THREE.Color(0xe2fff1);
const nightGroundColor = new THREE.Color(0x283b51);
const dayGroundColor = new THREE.Color(0x597662);
const nightFillColor = new THREE.Color(0x9bbce0);
const dayFillColor = new THREE.Color(0xc2f0e8);
const daySunColor = new THREE.Color(0xffedcf);
const twilightSunColor = new THREE.Color(0xffbd86);
const nightSunColor = new THREE.Color(0x9bb6d8);
const blendedSkyColor = new THREE.Color();
const solarDirection = new THREE.Vector3();
const moonDirection = new THREE.Vector3();

function updateDaylight() {
  const minuteOfDay = (worldMinutes + elapsedWorldTime / 18) % (24 * 60);
  const hour = minuteOfDay / 60;
  const solarPhase = ((hour - 6) / 12) * Math.PI;
  const elevation = Math.sin(solarPhase);
  const daylight = smoothstep01((elevation + 0.13) / 0.6);
  const night = 1 - daylight;
  const sunrise = Math.exp(-0.5 * ((hour - 6.2) / 1.7) ** 2);
  const sunset = Math.exp(-0.5 * ((hour - 17.8) / 1.7) ** 2);
  const twilight = clamp(Math.max(sunrise, sunset), 0, 1);
  const azimuth = (hour / 24) * Math.PI * 2;

  solarDirection.set(Math.cos(azimuth), elevation, Math.sin(azimuth)).normalize();
  sunLight.position.copy(solarDirection).multiplyScalar(120);
  sunLight.intensity = THREE.MathUtils.lerp(0.035, 3.1, daylight);
  sunLight.color.copy(nightSunColor).lerp(daySunColor, daylight).lerp(twilightSunColor, twilight * 0.58);
  fillLight.intensity = THREE.MathUtils.lerp(0.1, 0.55, daylight);
  fillLight.color.copy(nightFillColor).lerp(dayFillColor, daylight);
  moonDirection.copy(solarDirection).negate();
  moonLight.position.copy(moonDirection).multiplyScalar(110);
  moonLight.intensity = night * 0.26;
  hemi.intensity = THREE.MathUtils.lerp(0.42, 2, daylight);
  hemi.color.copy(nightHemiColor).lerp(dayHemiColor, daylight);
  hemi.groundColor.copy(nightGroundColor).lerp(dayGroundColor, daylight);

  blendedSkyColor.copy(nightSkyColor).lerp(daySkyColor, daylight).lerp(twilightSkyColor, twilight * 0.52);
  scene.background.copy(blendedSkyColor);
  scene.fog.color.copy(blendedSkyColor);
  sunDisc.position.copy(solarDirection).multiplyScalar(148);
  sunDisc.visible = elevation > -0.035;
  sunDiscMaterial.color.copy(daySunColor).lerp(twilightSunColor, twilight * 0.62);
  moonDisc.position.copy(moonDirection).multiplyScalar(145);
  moonDisc.visible = night > 0.72 && moonDirection.y > 0.12;
  starMaterial.opacity = clamp((night - 0.12) / 0.88, 0, 1) * 0.84;
  stars.visible = starMaterial.opacity > 0.015;

  for (const fixture of exteriorNightLights) {
    fixture.light.intensity = THREE.MathUtils.lerp(fixture.dayIntensity, fixture.nightIntensity, night);
    fixture.material.emissiveIntensity = THREE.MathUtils.lerp(fixture.dayEmissive, fixture.nightEmissive, night);
  }
  for (const floodlight of stadium.floodlights) floodlight.intensity = THREE.MathUtils.lerp(0, 210, night);
  stadium.floodlightMaterial.emissiveIntensity = THREE.MathUtils.lerp(0.08, 1.55, night);
  for (const material of stadium.pitchsideMaterials) material.emissiveIntensity = THREE.MathUtils.lerp(0.16, 0.9, night);
  updateTransitLighting(transitNetwork, night);
}

const cloudMaterial = new THREE.MeshStandardMaterial({ color: 0xf2f8e9, roughness: 1, transparent: true, opacity: 0.84, depthWrite: false });
const cloudGeometry = new THREE.SphereGeometry(1, 12, 9);
const clouds = [];
const cloudTransform = new THREE.Object3D();
for (let i = 0; i < 7; i += 1) {
  const count = 3 + (i % 3);
  const cloud = new THREE.InstancedMesh(cloudGeometry, cloudMaterial, count);
  for (let part = 0; part < count; part += 1) {
    const size = 1.7 + ((part + i) % 3) * 0.55;
    cloudTransform.position.set((part - (count - 1) / 2) * 2.25, (part % 2) * 0.45, Math.sin(part * 2 + i) * 0.5);
    cloudTransform.scale.set(size * 1.35, size * (0.62 + (part % 2) * 0.08), size * 0.76);
    cloudTransform.updateMatrix();
    cloud.setMatrixAt(part, cloudTransform.matrix);
  }
  cloud.instanceMatrix.needsUpdate = true;
  cloud.computeBoundingSphere();
  cloud.position.set(-90 + i * 30, 33 + (i % 3) * 5, -92 + (i % 4) * 42);
  cloud.userData.speed = 0.22 + (i % 4) * 0.06;
  cloud.castShadow = false;
  cloud.receiveShadow = false;
  clouds.push(cloud);
  scene.add(cloud);
}

// A flat, terrain-following ribbon keeps the path walkable instead of burying the avatar in a raised tube.
const trailPoints = PATH_POINTS_XZ.map(([x, z]) => new THREE.Vector3(x, terrainHeight(x, z) + TRAIL_SURFACE_OFFSET, z));
const trailCurve = new THREE.CatmullRomCurve3(trailPoints, false, 'centripetal');
function createTrailRibbonGeometry(curve, segments, halfWidth) {
  const positions = new Float32Array((segments + 1) * 2 * 3);
  const uvs = new Float32Array((segments + 1) * 2 * 2);
  const indices = [];
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();

  for (let segment = 0; segment <= segments; segment += 1) {
    const t = segment / segments;
    const center = curve.getPointAt(t);
    tangent.copy(curve.getTangentAt(t));
    tangent.y = 0;
    tangent.normalize();
    side.set(-tangent.z, 0, tangent.x).normalize();

    for (let edge = 0; edge < 2; edge += 1) {
      const offset = edge === 0 ? -halfWidth : halfWidth;
      const x = center.x + side.x * offset;
      const z = center.z + side.z * offset;
      const vertex = segment * 2 + edge;
      const positionOffset = vertex * 3;
      positions[positionOffset] = x;
      positions[positionOffset + 1] = terrainHeight(x, z) + TRAIL_SURFACE_OFFSET;
      positions[positionOffset + 2] = z;
      const uvOffset = vertex * 2;
      uvs[uvOffset] = edge;
      uvs[uvOffset + 1] = t;
    }

    if (segment < segments) {
      const first = segment * 2;
      indices.push(first, first + 1, first + 2, first + 1, first + 3, first + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const trail = new THREE.Mesh(
  createTrailRibbonGeometry(trailCurve, 180, TRAIL_HALF_WIDTH),
  new THREE.MeshStandardMaterial({ color: 0xd5c493, roughness: 0.95, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 }),
);
trail.receiveShadow = true;
scene.add(trail);

function groundHeightAt(x, z) {
  let ground = terrainHeight(x, z);
  if (distanceToPath(x, z) <= TRAIL_HALF_WIDTH) {
    ground = Math.max(ground, terrainHeight(x, z) + TRAIL_SURFACE_OFFSET);
  }
  if (Math.abs(x - STADIUM.x) <= STADIUM.fieldHalfX && Math.abs(z - STADIUM.z) <= STADIUM.fieldHalfZ) {
    ground = Math.max(ground, terrainHeight(x, z) + STADIUM.pitchOffset);
  }

  for (const surface of estateRoadSurfaces) {
    if (x >= surface.minX && x <= surface.maxX && z >= surface.minZ && z <= surface.maxZ) {
      ground = Math.max(ground, surface.top);
    }
  }
  const transportSurface = getTransportSurfaceHeight(transitNetwork, x, z);
  if (transportSurface !== null) ground = Math.max(ground, transportSurface);

  if (!isInsideHome) {
    for (const porchHouse of estateHouses) {
      const local = residenceWorldToLocal(porchHouse, x, z);
      const baseY = porchHouse.group.position.y;
      const onPorch = Math.abs(local.x) <= 1.85 && local.z >= -5.66 && local.z <= -4.1;
      const onStep = Math.abs(local.x) <= 1.25 && local.z >= -6.12 && local.z <= -5.55;
      if (onPorch) ground = Math.max(ground, baseY + 0.44);
      else if (onStep) ground = Math.max(ground, baseY + 0.26);
    }
  }

  return ground + PLAYER_FOOT_OFFSET;
}

// Small handmade stepping stones set into the trail.
const stoneGeometry = new THREE.CylinderGeometry(0.42, 0.48, 0.13, 7, 1);
const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0xc2b78f, roughness: 1, flatShading: true });
for (let i = 0; i < 19; i += 1) {
  const t = 0.06 + i * 0.047;
  const point = trailCurve.getPoint(t);
  const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
  stone.position.set(point.x + Math.sin(i * 2.8) * 0.66, point.y + 0.06, point.z);
  stone.rotation.y = i * 0.8;
  stone.scale.set(0.8 + (i % 3) * 0.13, 1, 0.82 + (i % 2) * 0.16);
  stone.receiveShadow = true;
  scene.add(stone);
}

// Unity Circle plaza and its softly animated portal.
const beacon = new THREE.Group();
beacon.position.set(0, terrainHeight(0, -27), -27);
scene.add(beacon);
const plaza = new THREE.Mesh(
  new THREE.CylinderGeometry(5.1, 5.45, 0.34, 40),
  new THREE.MeshStandardMaterial({ color: 0xb9b38f, roughness: 0.87, flatShading: true }),
);
plaza.position.y = 0.19;
plaza.receiveShadow = true;
beacon.add(plaza);
const plazaTop = new THREE.Mesh(
  new THREE.CylinderGeometry(4.85, 5.12, 0.18, 40),
  new THREE.MeshStandardMaterial({ color: 0xe2d5a8, roughness: 0.75 }),
);
plazaTop.position.y = 0.43;
plazaTop.receiveShadow = true;
beacon.add(plazaTop);
const floorRing = new THREE.Mesh(
  new THREE.TorusGeometry(4.52, 0.075, 8, 80),
  new THREE.MeshStandardMaterial({ color: 0xc89b57, metalness: 0.45, roughness: 0.38, emissive: 0x5b3920, emissiveIntensity: 0.12 }),
);
floorRing.rotation.x = Math.PI / 2;
floorRing.position.y = 0.55;
beacon.add(floorRing);

const portalGlow = new THREE.Mesh(
  new THREE.CircleGeometry(2.1, 48),
  new THREE.MeshBasicMaterial({ color: 0x68cabc, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
);
portalGlow.position.set(0, 3.77, -0.04);
beacon.add(portalGlow);
const portalInner = new THREE.Mesh(
  new THREE.CircleGeometry(1.78, 40),
  new THREE.MeshBasicMaterial({ color: 0x9de3cf, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false }),
);
portalInner.position.set(0, 3.77, -0.055);
beacon.add(portalInner);
const portalRingMaterial = new THREE.MeshStandardMaterial({
  color: 0x78c9ad,
  metalness: 0.32,
  roughness: 0.3,
  emissive: 0x2e8e7a,
  emissiveIntensity: 0.7,
});
const portalRing = new THREE.Mesh(new THREE.TorusGeometry(2.34, 0.17, 12, 64), portalRingMaterial);
portalRing.position.set(0, 3.77, 0);
beacon.add(portalRing);
const portalGoldTrim = new THREE.Mesh(
  new THREE.TorusGeometry(2.58, 0.045, 8, 64),
  new THREE.MeshStandardMaterial({ color: 0xe3c078, metalness: 0.55, roughness: 0.34, emissive: 0x684520, emissiveIntensity: 0.18 }),
);
portalGoldTrim.position.set(0, 3.77, 0.025);
beacon.add(portalGoldTrim);
for (const side of [-1, 1]) {
  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.31, 3.46, 8),
    new THREE.MeshStandardMaterial({ color: 0xc3b58a, roughness: 0.8, flatShading: true }),
  );
  pillar.position.set(side * 2.4, 1.94, 0);
  pillar.castShadow = true;
  pillar.receiveShadow = true;
  beacon.add(pillar);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.28, 9, 7), portalRingMaterial);
  cap.position.set(side * 2.4, 3.72, 0);
  beacon.add(cap);
}
const beaconLight = new THREE.PointLight(0x7ce5c2, 4.2, 18, 2);
beaconLight.position.set(0, 3.7, 0.6);
beacon.add(beaconLight);

// Deterministic layout keeps every visit feeling like the same Abuja neighbourhood.
let randomState = 0x51a7c3;
function random() {
  randomState = (randomState * 1664525 + 1013904223) >>> 0;
  return randomState / 4294967296;
}

// Unity Court: four small homes share a landscaped lane just east of the trail.
const estateRoadMaterial = new THREE.MeshStandardMaterial({ color: 0xaaa68c, roughness: 0.94, metalness: 0.01 });
const estateRoadEdgeMaterial = new THREE.MeshStandardMaterial({ color: 0xd0c6a2, roughness: 0.92 });
const estateFoundationMaterial = new THREE.MeshStandardMaterial({ color: 0xb3ad98, roughness: 0.95 });
const estateTrimMaterial = new THREE.MeshStandardMaterial({ color: 0xf2e9d4, roughness: 0.84 });
const estateWindowMaterial = new THREE.MeshStandardMaterial({ color: 0x6caaa5, roughness: 0.24, metalness: 0.12, emissive: 0x1c4140, emissiveIntensity: 0.2, transparent: true, opacity: 0.74, side: THREE.DoubleSide, depthWrite: false });
const estateDoorMaterials = [
  new THREE.MeshStandardMaterial({ color: 0x527e70, roughness: 0.72 }),
  new THREE.MeshStandardMaterial({ color: 0x8f6247, roughness: 0.78 }),
  new THREE.MeshStandardMaterial({ color: 0x527a87, roughness: 0.72 }),
  new THREE.MeshStandardMaterial({ color: 0x6b7354, roughness: 0.76 }),
];
const estateRoofColors = [0x536f68, 0x92634e, 0x4e7074, 0x81755e];
const estateWallColors = [0xe5d9bf, 0xcbd8bf, 0xd9c5ae, 0xd6dfe0];
const estateShrubMaterial = new THREE.MeshStandardMaterial({ color: 0x477b54, roughness: 1, flatShading: true });
const estateFlowerMaterials = [
  new THREE.MeshStandardMaterial({ color: 0xe5c87b, roughness: 0.9 }),
  new THREE.MeshStandardMaterial({ color: 0xf2e5c4, roughness: 0.9 }),
];
const houseWidth = ESTATE_HOUSE_SIZE.width;
const houseDepth = ESTATE_HOUSE_SIZE.depth;
const houseWallHeight = 3.2;
const houseBaseY = 0.24;
const houseEaveY = houseBaseY + houseWallHeight;
const houseRoofRise = 2.12;
const houseRoofAngle = Math.atan2(houseRoofRise, houseWidth / 2);
const houseRoofSlope = Math.hypot(houseWidth / 2, houseRoofRise);

function addEstateRoad(length, width, x, z, vertical = false) {
  const halfX = (vertical ? width : length) / 2;
  const halfZ = (vertical ? length : width) / 2;
  const roadTop = terrainHeight(x, z) + 0.16;
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(vertical ? width : length, 0.16, vertical ? length : width),
    estateRoadMaterial,
  );
  road.position.set(x, terrainHeight(x, z) + 0.08, z);
  road.receiveShadow = true;
  scene.add(road);
  estateRoadSurfaces.push({ minX: x - halfX, maxX: x + halfX, minZ: z - halfZ, maxZ: z + halfZ, top: roadTop });

  const edgeY = terrainHeight(x, z) + 0.17;
  for (const side of [-1, 1]) {
    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(vertical ? 0.12 : length, 0.035, vertical ? length : 0.12),
      estateRoadEdgeMaterial,
    );
    edge.position.set(vertical ? x + side * width * 0.5 : x, edgeY, vertical ? z : z + side * (width * 0.5 - 0.06));
    edge.receiveShadow = true;
    scene.add(edge);
  }
}

function makeEstateSignTexture() {
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 128;
  const context = signCanvas.getContext('2d');
  context.fillStyle = '#2d5148';
  context.fillRect(0, 0, signCanvas.width, signCanvas.height);
  context.strokeStyle = '#d9bd7b';
  context.lineWidth = 7;
  context.strokeRect(8, 8, signCanvas.width - 16, signCanvas.height - 16);
  context.fillStyle = '#fff0ca';
  context.font = '600 42px Georgia, serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('UNITY COURT', signCanvas.width / 2, 51);
  context.fillStyle = '#dfc993';
  context.font = '18px Arial, sans-serif';
  context.letterSpacing = '4px';
  context.fillText('ABUJA · FCT · NIGERIA', signCanvas.width / 2, 91);
  const texture = new THREE.CanvasTexture(signCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function makeHouseNumberTexture(number, isHome) {
  const numberCanvas = document.createElement('canvas');
  numberCanvas.width = 160;
  numberCanvas.height = 112;
  const context = numberCanvas.getContext('2d');
  context.fillStyle = isHome ? '#315c4e' : '#6f6149';
  context.fillRect(0, 0, numberCanvas.width, numberCanvas.height);
  context.fillStyle = '#f8efd8';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = 'bold 54px Arial, sans-serif';
  context.fillText(number, numberCanvas.width / 2, 52);
  if (isHome) {
    context.fillStyle = '#e9cb83';
    context.font = 'bold 15px Arial, sans-serif';
    context.fillText('YOUR HOME', numberCanvas.width / 2, 94);
  }
  const texture = new THREE.CanvasTexture(numberCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function makeWoodFloorTexture() {
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = 512;
  floorCanvas.height = 512;
  const context = floorCanvas.getContext('2d');
  const plankColors = ['#b9855e', '#c28f67', '#ae7a54', '#c8956d', '#b37f58', '#c18b62', '#a97651', '#c48d64'];
  context.fillStyle = '#73513b';
  context.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 8; row += 1) {
    const y = row * 64;
    context.fillStyle = plankColors[row];
    context.fillRect(2, y + 2, 508, 60);
    context.strokeStyle = 'rgba(80, 49, 32, .24)';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, y + 1);
    context.lineTo(512, y + 1);
    context.moveTo(0, y + 63);
    context.lineTo(512, y + 63);
    context.stroke();
    const seamX = row % 2 === 0 ? 170 : 345;
    context.beginPath();
    context.moveTo(seamX, y + 3);
    context.lineTo(seamX, y + 61);
    context.stroke();
    for (let grain = 0; grain < 3; grain += 1) {
      context.strokeStyle = `rgba(92, 58, 37, ${0.08 + grain * 0.025})`;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(16, y + 15 + grain * 15);
      context.bezierCurveTo(125, y + 9 + grain * 16, 290, y + 23 + grain * 13, 490, y + 13 + grain * 14);
      context.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(floorCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.5, 2.5);
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

function makeHomeArtTexture() {
  const artCanvas = document.createElement('canvas');
  artCanvas.width = 256;
  artCanvas.height = 320;
  const context = artCanvas.getContext('2d');
  context.fillStyle = '#e8dfc9';
  context.fillRect(0, 0, 256, 320);
  context.fillStyle = '#b8c2a3';
  context.fillRect(18, 18, 220, 284);
  context.fillStyle = '#e5d9bd';
  context.fillRect(28, 28, 200, 264);
  context.strokeStyle = '#4d745b';
  context.lineWidth = 8;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(124, 252);
  context.bezierCurveTo(120, 198, 142, 139, 116, 74);
  context.stroke();
  for (const [x, y, rotate, color] of [[88, 198, -.7, '#66856a'], [158, 170, .72, '#81976d'], [94, 126, .6, '#9ea879'], [151, 101, -.65, '#68815f']]) {
    context.save();
    context.translate(x, y);
    context.rotate(rotate);
    context.fillStyle = color;
    context.beginPath();
    context.ellipse(0, 0, 19, 43, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
  const texture = new THREE.CanvasTexture(artCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

function addHomeBox(parent, dimensions, position, material, castShadow = true, receiveShadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dimensions), material);
  mesh.position.set(...position);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  parent.add(mesh);
  return mesh;
}

function addHomeCollider(x, z, halfX, halfZ) {
  homeFurnitureColliders.push({ x, z, halfX, halfZ });
}

function registerHomeLightFixture(light, bulb = null) {
  const fixtureId = homeLightFixtureSequence;
  homeLightFixtureSequence += 1;
  light.userData.homeLightFixtureId = fixtureId;
  light.userData.homeLightIntensity = light.intensity;
  if (bulb) bulb.userData.homeLightBulbId = fixtureId;
  homeLightFixtures.push({ light, bulb, intensity: light.intensity });
  light.intensity = homeLightingEnabled ? light.intensity : 0;
  if (bulb) bulb.visible = homeLightingEnabled;
}

function createHomeInterior(houseGroup) {
  const interior = new THREE.Group();
  interior.name = 'House 01 furnished interior';
  houseGroup.add(interior);

  const floorMaterial = new THREE.MeshStandardMaterial({ map: makeWoodFloorTexture(), roughness: 0.78 });
  const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0xe8e0cf, roughness: 0.92 });
  const partitionMaterial = new THREE.MeshStandardMaterial({ color: 0xe2d8c4, roughness: 0.91 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: 0x8a6248, roughness: 0.77 });
  const cabinetMaterial = new THREE.MeshStandardMaterial({ color: 0x9b684b, roughness: 0.76 });
  const cabinetLightMaterial = new THREE.MeshStandardMaterial({ color: 0xc29169, roughness: 0.73 });
  const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0xd3cbb7, roughness: 0.66 });
  const hardwareMaterial = new THREE.MeshStandardMaterial({ color: 0x9c9b8d, metalness: 0.62, roughness: 0.36 });
  const sofaMaterial = new THREE.MeshStandardMaterial({ color: 0x607d68, roughness: 0.94 });
  const sofaCushionMaterial = new THREE.MeshStandardMaterial({ color: 0x91a083, roughness: 0.98 });
  const rugMaterial = new THREE.MeshStandardMaterial({ color: 0x9ba889, roughness: 1 });
  const rugTrimMaterial = new THREE.MeshStandardMaterial({ color: 0xd1c39e, roughness: 1 });
  const bedMaterial = new THREE.MeshStandardMaterial({ color: 0xc3aa83, roughness: 0.98 });
  const beddingMaterial = new THREE.MeshStandardMaterial({ color: 0xe5dfca, roughness: 0.99 });
  const throwMaterial = new THREE.MeshStandardMaterial({ color: 0x789284, roughness: 0.97 });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x303638, roughness: 0.42, metalness: 0.12 });
  const screenMaterial = new THREE.MeshStandardMaterial({ color: 0x182d35, roughness: 0.2, metalness: 0.08, emissive: 0x10232a, emissiveIntensity: 0.25 });
  const warmBulbMaterial = new THREE.MeshStandardMaterial({ color: 0xffe6b2, emissive: 0xf0bd6e, emissiveIntensity: 0.7, roughness: 0.28 });

  addHomeBox(interior, [7.92, 0.08, 7.92], [0, 0.34, 0], floorMaterial, false, true);
  addHomeBox(interior, [7.9, 0.1, 7.9], [0, 3.18, 0], ceilingMaterial, false, true);

  // A wide, open bedroom doorway makes the small cottage feel connected, not boxy.
  const partitionZ = 0.66;
  for (const [start, end] of [[-3.88, -0.88], [0.88, 3.88]]) {
    addHomeBox(interior, [end - start, 2.28, 0.14], [(start + end) / 2, 1.55, partitionZ], partitionMaterial);
  }
  addHomeBox(interior, [1.76, 0.48, 0.14], [0, 2.93, partitionZ], partitionMaterial);
  addHomeBox(interior, [0.12, 0.12, 7.65], [-3.94, 0.46, 0], trimMaterial, false, true);
  addHomeBox(interior, [0.12, 0.12, 7.65], [3.94, 0.46, 0], trimMaterial, false, true);
  addHomeBox(interior, [1.35, 0.055, 0.25], [0, 0.412, -4.02], trimMaterial, false, true);

  // Soft curtains add a little colour and privacy without hiding the daylight.
  const curtainMaterial = new THREE.MeshStandardMaterial({ color: 0xd7d1ba, roughness: 0.98, side: THREE.DoubleSide });
  for (const centerX of [-2.42, 2.42]) {
    addHomeBox(interior, [1.3, 0.035, 0.045], [centerX, 2.7, -3.79], trimMaterial, false, false);
    for (const side of [-1, 1]) {
      const curtain = addHomeBox(interior, [0.2, 0.92, 0.045], [centerX + side * 0.46, 2.12, -3.78], curtainMaterial, false, true);
      curtain.scale.x = side > 0 ? 0.84 : 1;
    }
  }
  for (const [side, centerZ] of [[-1, -1.5], [1, 1.5]]) {
    const curtainX = side * 3.78;
    addHomeBox(interior, [0.045, 0.035, 1.3], [curtainX, 2.7, centerZ], trimMaterial, false, false);
    for (const edge of [-1, 1]) addHomeBox(interior, [0.045, 0.92, 0.2], [curtainX, 2.12, centerZ + edge * 0.46], curtainMaterial, false, true);
  }

  // The entry-side switch is both a visual detail and the cue for the L-key light control.
  const switchPlateMaterial = new THREE.MeshStandardMaterial({ color: 0xe8e1d0, roughness: 0.65 });
  const switchIndicatorMaterial = new THREE.MeshStandardMaterial({ color: 0x709276, emissive: 0x304b33, emissiveIntensity: 0.35, roughness: 0.45 });
  addHomeBox(interior, [0.14, 0.23, 0.065], [0.99, 1.38, -3.82], switchPlateMaterial, false, false);
  homeLightSwitchIndicator = addHomeBox(interior, [0.055, 0.09, 0.025], [0.99, 1.38, -3.775], switchIndicatorMaterial, false, false);
  homeLightSwitchIndicator.userData.isHomeLightSwitch = true;

  addHomeBox(interior, [3.35, 0.035, 2.8], [1.95, 0.415, -1.95], rugMaterial, false, true);
  addHomeBox(interior, [3.2, 0.018, 0.055], [1.95, 0.437, -3.31], rugTrimMaterial, false, false);
  addHomeBox(interior, [3.2, 0.018, 0.055], [1.95, 0.437, -0.59], rugTrimMaterial, false, false);

  // A deep, soft sofa, turned toward the television wall.
  const sofa = new THREE.Group();
  sofa.position.set(1.65, 0, -1.95);
  sofa.rotation.y = -Math.PI / 2;
  interior.add(sofa);
  addHomeBox(sofa, [2.35, 0.36, 0.92], [0, 0.58, 0], sofaMaterial);
  addHomeBox(sofa, [2.12, 0.24, 0.74], [0, 0.86, -0.04], sofaCushionMaterial);
  addHomeBox(sofa, [2.36, 0.82, 0.24], [0, 1.12, 0.36], sofaMaterial);
  addHomeBox(sofa, [0.22, 0.62, 0.96], [-1.08, 0.88, -0.02], sofaMaterial);
  addHomeBox(sofa, [0.22, 0.62, 0.96], [1.08, 0.88, -0.02], sofaMaterial);
  for (const [x, color] of [[-0.54, 0xc9b998], [0.45, 0x829582]]) {
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.44, 0.16), new THREE.MeshStandardMaterial({ color, roughness: 1 }));
    pillow.position.set(x, 1.08, 0.18);
    pillow.rotation.x = -0.16;
    pillow.castShadow = true;
    sofa.add(pillow);
  }

  // Low timber coffee table, books, and a small ceramic vase.
  addHomeBox(interior, [1.28, 0.1, 0.72], [2.55, 0.66, -1.95], cabinetLightMaterial);
  for (const [x, z] of [[2.08, -2.22], [3.02, -2.22], [2.08, -1.68], [3.02, -1.68]]) {
    addHomeBox(interior, [0.07, 0.24, 0.07], [x, 0.52, z], trimMaterial, true, false);
  }
  addHomeBox(interior, [0.52, 0.045, 0.32], [2.5, 0.74, -1.95], new THREE.MeshStandardMaterial({ color: 0x547d6b, roughness: 0.9 }), false, false);
  const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.31, 12), new THREE.MeshStandardMaterial({ color: 0xd9c79f, roughness: 0.35 }));
  vase.position.set(2.95, 0.86, -1.9);
  vase.castShadow = true;
  interior.add(vase);

  // A television and floating shelf on the living-room side wall.
  addHomeBox(interior, [0.11, 0.95, 1.62], [3.83, 1.83, -1.95], darkMaterial, true, false);
  addHomeBox(interior, [0.025, 0.77, 1.42], [3.765, 1.84, -1.95], screenMaterial, false, false);
  addHomeBox(interior, [0.34, 0.08, 1.82], [3.57, 1.25, -1.95], trimMaterial);
  const smallPlantPot = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.22, 0.29, 10), cabinetLightMaterial);
  smallPlantPot.position.set(3.35, 1.0, -3.0);
  interior.add(smallPlantPot);
  for (const [x, y, z, scale] of [[3.35, 1.25, -3.0, 0.28], [3.15, 1.42, -3.05, 0.2], [3.53, 1.43, -2.93, 0.22]]) {
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 0), estateShrubMaterial);
    leaf.position.set(x, y, z);
    leaf.scale.setScalar(scale);
    leaf.castShadow = true;
    interior.add(leaf);
  }

  // Compact kitchen: timber fronts, stone worktop, inset sink, hob, and tall fridge.
  addHomeBox(interior, [0.78, 0.72, 3.12], [-3.28, 0.77, -2.05], cabinetMaterial);
  addHomeBox(interior, [0.86, 0.11, 3.28], [-3.24, 1.17, -2.05], stoneMaterial);
  for (const z of [-3.1, -2.15, -1.2]) {
    addHomeBox(interior, [0.045, 0.58, 0.88], [-2.87, 0.78, z], cabinetLightMaterial, false, true);
    addHomeBox(interior, [0.055, 0.16, 0.06], [-2.83, 0.79, z], hardwareMaterial, false, false);
  }
  addHomeBox(interior, [0.72, 0.82, 2.44], [-3.44, 2.05, -2.17], cabinetLightMaterial);
  for (const z of [-2.87, -2.05, -1.23]) {
    addHomeBox(interior, [0.045, 0.68, 0.74], [-3.055, 2.05, z], cabinetMaterial, false, false);
    addHomeBox(interior, [0.045, 0.16, 0.045], [-3.02, 2.05, z], hardwareMaterial, false, false);
  }
  // Sink bowl and a simple chrome gooseneck tap.
  addHomeBox(interior, [0.42, 0.055, 0.58], [-3.18, 1.245, -2.58], new THREE.MeshStandardMaterial({ color: 0x7f918e, roughness: 0.34, metalness: 0.55 }), false, false);
  const faucetStem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.28, 10), hardwareMaterial);
  faucetStem.position.set(-3.42, 1.38, -2.58);
  interior.add(faucetStem);
  const tapSpout = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.03, 7, 16, Math.PI), hardwareMaterial);
  tapSpout.rotation.x = Math.PI / 2;
  tapSpout.position.set(-3.42, 1.48, -2.58);
  interior.add(tapSpout);
  // Black glass hob with four burner rings.
  addHomeBox(interior, [0.62, 0.045, 0.66], [-3.2, 1.25, -1.04], darkMaterial, false, false);
  for (const [x, z] of [[-3.37, -1.21], [-3.03, -1.21], [-3.37, -0.87], [-3.03, -0.87]]) {
    const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.025, 12), hardwareMaterial);
    burner.position.set(x, 1.285, z);
    interior.add(burner);
  }
  // Tall fridge tucked beside the open-plan kitchen.
  addHomeBox(interior, [0.88, 2.02, 0.9], [-3.12, 1.41, 0.05], new THREE.MeshStandardMaterial({ color: 0xd7d8d2, roughness: 0.4, metalness: 0.1 }));
  addHomeBox(interior, [0.045, 1.78, 0.78], [-2.65, 1.43, 0.05], new THREE.MeshStandardMaterial({ color: 0xe8e6de, roughness: 0.36, metalness: 0.08 }), false, false);
  addHomeBox(interior, [0.055, 0.58, 0.045], [-2.61, 1.55, 0.28], hardwareMaterial, false, false);

  // Small dining table, two upholstered chairs, and pendant light.
  addHomeBox(interior, [1.42, 0.12, 0.82], [-1.12, 0.99, -0.58], cabinetLightMaterial);
  for (const x of [-1.66, -0.58]) addHomeBox(interior, [0.08, 0.64, 0.08], [x, 0.73, -0.86], trimMaterial, true, false);
  for (const z of [-1.2, 0.03]) {
    addHomeBox(interior, [0.56, 0.12, 0.54], [-1.12, 0.59, z], sofaMaterial);
    addHomeBox(interior, [0.56, 0.62, 0.1], [-1.12, 0.92, z + 0.22], sofaMaterial);
    for (const x of [-1.34, -0.9]) addHomeBox(interior, [0.055, 0.24, 0.055], [x, 0.5, z], trimMaterial, true, false);
  }
  addHomeBox(interior, [0.08, 0.24, 0.08], [-1.12, 2.93, -0.58], trimMaterial, false, false);
  const pendant = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), warmBulbMaterial);
  pendant.position.set(-1.12, 2.79, -0.58);
  interior.add(pendant);
  const kitchenLight = new THREE.PointLight(0xffdca8, 0.55, 5.5, 2);
  kitchenLight.position.set(-1.3, 2.65, -0.6);
  interior.add(kitchenLight);
  registerHomeLightFixture(kitchenLight, pendant);

  // Bedroom: framed bed, layered linens, bedside drawers, lamps, wardrobe and rug.
  addHomeBox(interior, [3.54, 0.035, 3.18], [1.42, 0.415, 2.25], new THREE.MeshStandardMaterial({ color: 0xb0a68e, roughness: 1 }), false, true);
  addHomeBox(interior, [2.18, 0.42, 2.6], [1.68, 0.62, 2.27], bedMaterial);
  addHomeBox(interior, [2.02, 0.28, 2.43], [1.68, 0.93, 2.24], beddingMaterial);
  addHomeBox(interior, [1.9, 0.12, 1.45], [1.68, 1.12, 1.86], throwMaterial, false, true);
  addHomeBox(interior, [0.78, 0.16, 0.48], [1.13, 1.14, 3.08], beddingMaterial, false, false);
  addHomeBox(interior, [0.78, 0.16, 0.48], [2.23, 1.14, 3.08], beddingMaterial, false, false);
  addHomeBox(interior, [2.26, 0.88, 0.15], [1.68, 1.02, 3.64], cabinetMaterial);
  for (const x of [0.36, 3.0]) {
    addHomeBox(interior, [0.62, 0.56, 0.58], [x, 0.69, 3.1], cabinetLightMaterial);
    addHomeBox(interior, [0.64, 0.07, 0.6], [x, 1.0, 3.1], trimMaterial, false, false);
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 0.28, 10), warmBulbMaterial);
    lamp.position.set(x, 1.19, 3.1);
    interior.add(lamp);
    const light = new THREE.PointLight(0xffd6a0, 0.25, 3.2, 2);
    light.position.set(x, 1.42, 3.1);
    interior.add(light);
    registerHomeLightFixture(light, lamp);
  }
  addHomeBox(interior, [1.18, 2.02, 0.78], [-2.72, 1.42, 2.45], cabinetMaterial);
  addHomeBox(interior, [1.08, 1.84, 0.055], [-2.72, 1.42, 2.03], cabinetLightMaterial, false, false);
  addHomeBox(interior, [0.055, 1.72, 0.04], [-2.72, 1.42, 2.0], hardwareMaterial, false, false);

  // Framed botanical prints lend the walls a lived-in, personal touch.
  const artTexture = makeHomeArtTexture();
  const artFrameMaterial = new THREE.MeshStandardMaterial({ color: 0x72533e, roughness: 0.72 });
  addHomeBox(interior, [0.08, 0.82, 0.66], [3.91, 2.25, -0.25], artFrameMaterial, false, false);
  const sideArt = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.71), new THREE.MeshBasicMaterial({ map: artTexture, side: THREE.DoubleSide }));
  sideArt.position.set(3.855, 2.25, -0.25);
  sideArt.rotation.y = -Math.PI / 2;
  interior.add(sideArt);
  addHomeBox(interior, [1.28, 0.78, 0.09], [2.55, 2.14, 0.545], artFrameMaterial, false, false);
  const bedroomArt = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 0.64), new THREE.MeshBasicMaterial({ map: artTexture, side: THREE.DoubleSide }));
  bedroomArt.position.set(2.55, 2.14, 0.49);
  bedroomArt.rotation.y = Math.PI;
  interior.add(bedroomArt);

  // Warm overhead light plus softer bedside and kitchen pools.
  for (const [x, z] of [[1.7, -1.8], [1.65, 2.25]]) {
    const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.1, 14), trimMaterial);
    mount.position.set(x, 3.04, z);
    interior.add(mount);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), warmBulbMaterial);
    bulb.position.set(x, 2.91, z);
    interior.add(bulb);
    const light = new THREE.PointLight(0xffe1b7, 0.8, 8.5, 2);
    light.position.set(x, 2.82, z);
    interior.add(light);
    registerHomeLightFixture(light, bulb);
  }
  const livingLight = new THREE.PointLight(0xffe3bf, 0.62, 7, 2);
  livingLight.position.set(1.5, 2.5, -2.0);
  interior.add(livingLight);
  registerHomeLightFixture(livingLight);

  // Keep movement grounded around the larger furnishings while leaving the central passage clear.
  addHomeCollider(-3.28, -2.05, 0.48, 1.65);
  addHomeCollider(-3.12, 0.05, 0.5, 0.5);
  addHomeCollider(-1.12, -0.58, 0.76, 0.5);
  addHomeCollider(-1.12, -1.2, 0.31, 0.34);
  addHomeCollider(-1.12, 0.03, 0.31, 0.34);
  addHomeCollider(-2.38, partitionZ, 1.5, 0.1);
  addHomeCollider(2.38, partitionZ, 1.5, 0.1);
  addHomeCollider(1.65, -1.95, 0.55, 1.24);
  addHomeCollider(2.55, -1.95, 0.68, 0.42);
  addHomeCollider(1.68, 2.27, 1.12, 1.34);
  addHomeCollider(-2.72, 2.45, 0.62, 0.43);
  return interior;
}

function createEstateWindow(group, x, y, z, side = 'front') {
  const frame = new THREE.Mesh(
    side === 'front' ? new THREE.BoxGeometry(1.22, 1.04, 0.16) : new THREE.BoxGeometry(0.16, 1.04, 1.22),
    estateTrimMaterial,
  );
  frame.position.set(x, y, z);
  frame.castShadow = false;
  group.add(frame);

  const glass = new THREE.Mesh(
    side === 'front' ? new THREE.BoxGeometry(0.96, 0.78, 0.055) : new THREE.BoxGeometry(0.055, 0.78, 0.96),
    estateWindowMaterial,
  );
  glass.position.set(x + (side === 'front' ? 0 : Math.sign(x) * 0.1), y, z + (side === 'front' ? -0.11 : 0));
  group.add(glass);

  const crossbar = new THREE.Mesh(
    side === 'front' ? new THREE.BoxGeometry(0.07, 0.78, 0.05) : new THREE.BoxGeometry(0.05, 0.78, 0.07),
    estateTrimMaterial,
  );
  crossbar.position.set(x + (side === 'front' ? 0 : Math.sign(x) * 0.14), y, z + (side === 'front' ? -0.145 : 0));
  group.add(crossbar);
  const sill = new THREE.Mesh(
    side === 'front' ? new THREE.BoxGeometry(1.42, 0.12, 0.24) : new THREE.BoxGeometry(0.24, 0.12, 1.42),
    estateTrimMaterial,
  );
  sill.position.set(x, y - 0.57, z + (side === 'front' ? -0.11 : 0));
  group.add(sill);
}

function createEstateHouse({ number, x, z, facing, isHome = false }) {
  const group = new THREE.Group();
  let interiorGroup = null;
  const wallMaterial = new THREE.MeshStandardMaterial({ color: estateWallColors[number - 1], roughness: 0.9 });
  const frontZ = -houseDepth / 2;
  const wallThickness = 0.18;
  const roofMaterial = new THREE.MeshStandardMaterial({ color: estateRoofColors[number - 1], roughness: 0.88, flatShading: true });
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(houseWidth + 0.42, 0.3, houseDepth + 0.42), estateFoundationMaterial);
  foundation.position.y = 0.15;
  foundation.receiveShadow = true;
  foundation.castShadow = true;
  group.add(foundation);

  if (!isHome) {
    const walls = new THREE.Mesh(new THREE.BoxGeometry(houseWidth, houseWallHeight, houseDepth), wallMaterial);
    walls.position.y = houseBaseY + houseWallHeight / 2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    group.add(walls);
  } else {
    const addFrontBand = (bottom, top, openings = []) => {
      const sortedOpenings = [...openings].sort((a, b) => a[0] - b[0]);
      let cursor = -houseWidth / 2;
      for (const [openingStart, openingEnd] of sortedOpenings) {
        if (openingStart > cursor) {
          const width = openingStart - cursor;
          const segment = new THREE.Mesh(new THREE.BoxGeometry(width, top - bottom, wallThickness), wallMaterial);
          segment.position.set(cursor + width / 2, (bottom + top) / 2, frontZ + wallThickness / 2);
          segment.castShadow = true;
          segment.receiveShadow = true;
          group.add(segment);
        }
        cursor = Math.max(cursor, openingEnd);
      }
      if (cursor < houseWidth / 2) {
        const width = houseWidth / 2 - cursor;
        const segment = new THREE.Mesh(new THREE.BoxGeometry(width, top - bottom, wallThickness), wallMaterial);
        segment.position.set(cursor + width / 2, (bottom + top) / 2, frontZ + wallThickness / 2);
        segment.castShadow = true;
        segment.receiveShadow = true;
        group.add(segment);
      }
    };
    const doorGap = [-HOME_DOOR_OPENING_HALF_WIDTH, HOME_DOOR_OPENING_HALF_WIDTH];
    const windowGaps = [[-3.1, -1.74], [1.74, 3.1]];
    addFrontBand(houseBaseY, 1.58, [doorGap]);
    addFrontBand(1.58, 2.34, [...windowGaps, doorGap]);
    addFrontBand(2.34, 2.76, [...windowGaps, doorGap]);
    addFrontBand(2.76, houseEaveY);

    const rearWall = new THREE.Mesh(new THREE.BoxGeometry(houseWidth, houseWallHeight, wallThickness), wallMaterial);
    rearWall.position.set(0, houseBaseY + houseWallHeight / 2, houseDepth / 2 - wallThickness / 2);
    rearWall.castShadow = true;
    rearWall.receiveShadow = true;
    group.add(rearWall);

    const addSideWall = (side, windowZ) => {
      const wallX = side * (houseWidth / 2 - wallThickness / 2);
      const addBand = (bottom, top, openings = []) => {
        const sortedOpenings = [...openings].sort((a, b) => a[0] - b[0]);
        let cursor = -houseDepth / 2;
        for (const [openingStart, openingEnd] of sortedOpenings) {
          if (openingStart > cursor) {
            const depth = openingStart - cursor;
            const segment = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, top - bottom, depth), wallMaterial);
            segment.position.set(wallX, (bottom + top) / 2, cursor + depth / 2);
            segment.castShadow = true;
            segment.receiveShadow = true;
            group.add(segment);
          }
          cursor = Math.max(cursor, openingEnd);
        }
        if (cursor < houseDepth / 2) {
          const depth = houseDepth / 2 - cursor;
          const segment = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, top - bottom, depth), wallMaterial);
          segment.position.set(wallX, (bottom + top) / 2, cursor + depth / 2);
          segment.castShadow = true;
          segment.receiveShadow = true;
          group.add(segment);
        }
      };
      addBand(houseBaseY, 1.58);
      addBand(1.58, 2.76, [[windowZ - 0.68, windowZ + 0.68]]);
      addBand(2.76, houseEaveY);
    };
    addSideWall(-1, -1.5);
    addSideWall(1, 1.5);
  }

  const gableShape = new THREE.Shape();
  gableShape.moveTo(-houseWidth / 2, houseEaveY);
  gableShape.lineTo(houseWidth / 2, houseEaveY);
  gableShape.lineTo(0, houseEaveY + houseRoofRise);
  gableShape.closePath();
  const gableGeometry = new THREE.ShapeGeometry(gableShape);
  for (const side of [-1, 1]) {
    const gable = new THREE.Mesh(gableGeometry, wallMaterial);
    gable.position.z = side * (houseDepth / 2 + 0.015);
    gable.material.side = THREE.DoubleSide;
    gable.castShadow = true;
    group.add(gable);
  }

  const roofFront = new THREE.Mesh(new THREE.BoxGeometry(houseRoofSlope + 0.42, 0.28, houseDepth + 0.56), roofMaterial);
  roofFront.position.set(-houseWidth / 4, houseEaveY + houseRoofRise / 2, 0);
  roofFront.rotation.z = houseRoofAngle;
  roofFront.castShadow = true;
  roofFront.receiveShadow = true;
  group.add(roofFront);
  const roofBack = new THREE.Mesh(new THREE.BoxGeometry(houseRoofSlope + 0.42, 0.28, houseDepth + 0.56), roofMaterial);
  roofBack.position.set(houseWidth / 4, houseEaveY + houseRoofRise / 2, 0);
  roofBack.rotation.z = -houseRoofAngle;
  roofBack.castShadow = true;
  roofBack.receiveShadow = true;
  group.add(roofBack);
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, houseDepth + 0.68), estateTrimMaterial);
  ridge.position.set(0, houseEaveY + houseRoofRise + 0.04, 0);
  ridge.castShadow = true;
  group.add(ridge);

  const porch = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.2, 1.55), estateFoundationMaterial);
  porch.position.set(0, 0.34, frontZ - 0.78);
  porch.receiveShadow = true;
  porch.castShadow = true;
  group.add(porch);
  const porchStep = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.16, 0.58), estateRoadEdgeMaterial);
  porchStep.position.set(0, 0.18, frontZ - 1.73);
  porchStep.receiveShadow = true;
  group.add(porchStep);
  const porchCanopy = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.16, 1.45), roofMaterial);
  porchCanopy.position.set(0, 3.05, frontZ - 0.72);
  porchCanopy.castShadow = true;
  group.add(porchCanopy);
  for (const postX of [-1.62, 1.62]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.58, 0.14), estateTrimMaterial);
    post.position.set(postX, 1.75, frontZ - 1.23);
    post.castShadow = true;
    group.add(post);
  }

  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.52, 2.47, 0.15), estateTrimMaterial);
  doorFrame.position.set(0, 1.48, frontZ - 0.085);
  group.add(doorFrame);
  const doorWidth = 1.25;
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-doorWidth / 2, 0, frontZ - 0.17);
  const door = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, 2.2, 0.1), estateDoorMaterials[number - 1]);
  door.position.set(doorWidth / 2, 1.42, 0);
  door.castShadow = true;
  doorPivot.add(door);
  const doorPanelMaterial = new THREE.MeshStandardMaterial({ color: isHome ? 0x77a28a : 0xb18b64, roughness: 0.74 });
  for (const panelY of [0.88, 1.75]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.48, 0.035), doorPanelMaterial);
    panel.position.set(doorWidth / 2, panelY, -0.064);
    doorPivot.add(panel);
  }
  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xd9b768, metalness: 0.62, roughness: 0.33 }),
  );
  knob.position.set(doorWidth - 0.18, 1.38, -0.105);
  doorPivot.add(knob);
  group.add(doorPivot);
  if (isHome) homeDoorPivot = doorPivot;

  createEstateWindow(group, -2.42, 2.16, frontZ - 0.08);
  createEstateWindow(group, 2.42, 2.16, frontZ - 0.08);
  createEstateWindow(group, -houseWidth / 2 - 0.04, 2.15, -1.5, 'side');
  createEstateWindow(group, houseWidth / 2 + 0.04, 2.15, 1.5, 'side');

  const numberPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.64, 0.46, 0.1),
    new THREE.MeshStandardMaterial({ color: isHome ? 0x315c4e : 0x6f6149, roughness: 0.7 }),
  );
  numberPlate.position.set(1.44, 1.28, frontZ - 0.13);
  group.add(numberPlate);
  const numberFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.56, 0.39),
    new THREE.MeshBasicMaterial({ map: makeHouseNumberTexture(String(number).padStart(2, '0'), isHome) }),
  );
  numberFace.position.set(1.44, 1.28, frontZ - 0.19);
  numberFace.rotation.y = Math.PI;
  group.add(numberFace);

  const mailboxPost = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.75, 0.13), estateTrimMaterial);
  mailboxPost.position.set(3.62, 0.49, frontZ - 1.95);
  mailboxPost.castShadow = true;
  group.add(mailboxPost);
  const mailbox = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.4, 0.66),
    new THREE.MeshStandardMaterial({ color: isHome ? 0x547d68 : estateDoorMaterials[number - 1].color, roughness: 0.72, metalness: 0.05 }),
  );
  mailbox.position.set(3.62, 0.95, frontZ - 1.95);
  mailbox.castShadow = true;
  group.add(mailbox);
  const mailSlot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.035, 0.035), estateTrimMaterial);
  mailSlot.position.set(3.62, 1.02, frontZ - 2.29);
  group.add(mailSlot);

  const shrubGeometry = new THREE.IcosahedronGeometry(0.62, 1);
  for (const side of [-1, 1]) {
    const shrub = new THREE.Mesh(shrubGeometry, estateShrubMaterial);
    shrub.position.set(side * 3.12, 0.54, frontZ - 1.78);
    shrub.scale.set(1.2, 0.8, 0.82);
    shrub.castShadow = true;
    group.add(shrub);
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), estateFlowerMaterials[(number + (side > 0 ? 1 : 0)) % estateFlowerMaterials.length]);
    flower.position.set(side * 2.9, 0.48, frontZ - 2.35);
    group.add(flower);
  }
  const porchLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xffe0a1, emissive: 0xf7b955, emissiveIntensity: 0.65, roughness: 0.35 }),
  );
  porchLight.position.set(-0.98, 2.52, frontZ - 0.2);
  group.add(porchLight);
  const porchLightPoint = new THREE.PointLight(0xffcf85, 0, 7, 2);
  porchLightPoint.position.copy(porchLight.position);
  group.add(porchLightPoint);
  exteriorNightLights.push({
    light: porchLightPoint,
    material: porchLight.material,
    dayIntensity: 0,
    nightIntensity: 0.68,
    dayEmissive: 0.05,
    nightEmissive: 1.1,
  });
  if (isHome) interiorGroup = createHomeInterior(group);

  group.position.set(x, terrainHeight(x, z), z);
  group.rotation.y = facing;
  scene.add(group);
  const doorOffset = new THREE.Vector3(0, 0, -houseDepth / 2 - 0.72).applyAxisAngle(new THREE.Vector3(0, 1, 0), facing);
  const house = {
    number,
    name: isHome ? 'Your home' : `House ${String(number).padStart(2, '0')}`,
    x,
    z,
    facing,
    doorX: x + doorOffset.x,
    doorZ: z + doorOffset.z,
    isHome,
    group,
    doorPivot,
    interiorGroup,
    collisionBounds: {
      x,
      z,
      yaw: facing,
      halfX: houseWidth / 2 + ESTATE_HOUSE_COLLISION_MARGIN,
      halfZ: houseDepth / 2 + ESTATE_HOUSE_COLLISION_MARGIN,
    },
  };
  estateHouses.push(house);
  if (isHome) {
    homeHouse = house;
    activeResidence = house;
  }
}

function prepareRentalInteriors() {
  if (!homeHouse?.interiorGroup) return;
  const interiorTemplate = homeHouse.interiorGroup;
  for (const house of estateHouses) {
    if (house.isHome) continue;
    const interior = interiorTemplate.clone(true);
    interior.name = `House ${String(house.number).padStart(2, '0')} furnished rental interior`;
    interior.position.copy(house.group.position);
    interior.rotation.y = house.facing;
    interior.visible = false;
    scene.add(interior);
    house.interiorGroup = interior;
  }
}

function refreshActiveHomeLights() {
  homeLightFixtures.length = 0;
  homeLightSwitchIndicator = null;
  const interior = getCurrentResidence()?.interiorGroup;
  if (!interior) return;
  const bulbsByFixture = new Map();
  interior.traverse((object) => {
    const bulbId = object.userData?.homeLightBulbId;
    if (Number.isInteger(bulbId)) bulbsByFixture.set(bulbId, object);
    if (object.userData?.isHomeLightSwitch) homeLightSwitchIndicator = object;
  });
  interior.traverse((object) => {
    const fixtureId = object.userData?.homeLightFixtureId;
    const intensity = object.userData?.homeLightIntensity;
    if (!Number.isInteger(fixtureId) || !Number.isFinite(intensity)) return;
    const bulb = bulbsByFixture.get(fixtureId) || null;
    homeLightFixtures.push({ light: object, bulb, intensity });
    object.intensity = homeLightingEnabled ? intensity : 0;
    if (bulb) bulb.visible = homeLightingEnabled;
  });
  if (homeLightSwitchIndicator) {
    homeLightSwitchIndicator.material.color.setHex(homeLightingEnabled ? 0x709276 : 0x918e7e);
    homeLightSwitchIndicator.material.emissive.setHex(homeLightingEnabled ? 0x304b33 : 0x000000);
    homeLightSwitchIndicator.material.emissiveIntensity = homeLightingEnabled ? 0.35 : 0;
  }
}

function setActiveResidence(residence) {
  activeResidence = residence || homeHouse;
  homeDoorPivot = activeResidence?.doorPivot || null;
  homeDoorTargetAngle = 0;
  if (homeHouse?.interiorGroup) homeHouse.interiorGroup.visible = activeResidence === homeHouse;
  for (const house of estateHouses) {
    if (!house.isHome && house.interiorGroup && house !== activeResidence) house.interiorGroup.visible = false;
  }
  refreshActiveHomeLights();
}

function setResidenceInteriorVisible(residence, isVisible) {
  if (!residence) return;
  if (residence.isHome) {
    residence.group.visible = true;
    if (residence.interiorGroup) residence.interiorGroup.visible = true;
    return;
  }
  residence.group.visible = !isVisible;
  if (residence.interiorGroup) residence.interiorGroup.visible = isVisible;
}

function createEstateLamp(x, z) {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x3f5c50, roughness: 0.65, metalness: 0.25 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.11, 3.35, 8), metal);
  pole.position.y = 1.68;
  pole.castShadow = true;
  group.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.09, 0.09), metal);
  arm.position.set(0.34, 3.22, 0);
  group.add(arm);
  const lanternMaterial = new THREE.MeshStandardMaterial({ color: 0xffe2a0, emissive: 0xe9a84e, emissiveIntensity: 0.8, roughness: 0.3 });
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), lanternMaterial);
  lantern.position.set(0.74, 3.16, 0);
  group.add(lantern);
  const lampLight = new THREE.PointLight(0xffcf85, 0, 10, 2);
  lampLight.position.copy(lantern.position);
  group.add(lampLight);
  exteriorNightLights.push({
    light: lampLight,
    material: lanternMaterial,
    dayIntensity: 0.015,
    nightIntensity: 0.82,
    dayEmissive: 0.05,
    nightEmissive: 1.05,
  });
  group.position.set(x, terrainHeight(x, z), z);
  scene.add(group);
}

function batchStaticVenueMeshes(group) {
  const batches = new Map();
  for (const mesh of group.children) {
    if (!mesh.isMesh || Array.isArray(mesh.material)) continue;
    const key = `${mesh.material.id}:${Number(mesh.castShadow)}:${Number(mesh.receiveShadow)}`;
    if (!batches.has(key)) batches.set(key, { material: mesh.material, castShadow: mesh.castShadow, receiveShadow: mesh.receiveShadow, meshes: [] });
    batches.get(key).meshes.push(mesh);
  }

  for (const batch of batches.values()) {
    if (batch.meshes.length < 2) continue;
    const geometries = [];
    let mergedGeometry;
    try {
      for (const mesh of batch.meshes) {
        mesh.updateMatrix();
        const geometry = mesh.geometry.clone();
        geometry.clearGroups();
        geometry.applyMatrix4(mesh.matrix);
        geometries.push(geometry);
      }
      mergedGeometry = mergeGeometries(geometries, false);
    } catch {
      for (const geometry of geometries) geometry.dispose();
      continue;
    }
    if (!mergedGeometry) {
      for (const geometry of geometries) geometry.dispose();
      continue;
    }
    mergedGeometry.computeBoundingSphere();
    const mergedMesh = new THREE.Mesh(mergedGeometry, batch.material);
    mergedMesh.castShadow = batch.castShadow;
    mergedMesh.receiveShadow = batch.receiveShadow;
    mergedMesh.name = 'Batched static shop geometry';
    for (const mesh of batch.meshes) {
      group.remove(mesh);
      mesh.geometry.dispose();
    }
    group.add(mergedMesh);
    for (const geometry of geometries) geometry.dispose();
  }
}

function makeCommerceSignTexture(label, backgroundColor, foregroundColor) {
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 128;
  const context = signCanvas.getContext('2d');
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, signCanvas.width, signCanvas.height);
  context.strokeStyle = 'rgba(255, 248, 220, .78)';
  context.lineWidth = 7;
  context.strokeRect(8, 8, signCanvas.width - 16, signCanvas.height - 16);
  context.fillStyle = foregroundColor;
  context.font = '700 46px system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label, signCanvas.width / 2, signCanvas.height / 2 + 2, 460);
  const texture = new THREE.CanvasTexture(signCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

const mallShopBayRuntime = [];

function makeMallBaySignTexture(displayState, accentHex) {
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 152;
  const context = signCanvas.getContext('2d');
  context.fillStyle = accentHex;
  context.fillRect(0, 0, signCanvas.width, signCanvas.height);
  context.strokeStyle = 'rgba(255, 248, 224, .82)';
  context.lineWidth = 6;
  context.strokeRect(7, 7, signCanvas.width - 14, signCanvas.height - 14);
  const { space, isRented, shopName, displayedGoods } = displayState;
  context.fillStyle = 'rgba(255, 248, 224, .92)';
  context.font = '700 22px system-ui, sans-serif';
  context.textAlign = 'left';
  context.textBaseline = 'top';
  context.fillText(`${space.code} · ${space.sizeLabel.toUpperCase()} · ${space.areaSqm}m²`, 24, 20, 310);
  context.textAlign = 'right';
  context.fillStyle = isRented ? '#d7f7c2' : '#ffe8b8';
  context.fillText(isRented ? 'RENTED' : `${space.monthlyRent} GC/MO`, signCanvas.width - 24, 20, 165);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#fff9eb';
  context.font = '700 36px system-ui, sans-serif';
  context.fillText(shopName, signCanvas.width / 2, 82, 464);
  context.font = '600 20px system-ui, sans-serif';
  context.fillStyle = 'rgba(255, 246, 222, .88)';
  context.fillText(
    `${displayedGoods.length}/${space.maxDisplayItems} VIRTUAL GOODS ON DISPLAY`,
    signCanvas.width / 2,
    122,
    464,
  );
  const texture = new THREE.CanvasTexture(signCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

function createVirtualGoodDisplayMesh(good) {
  const itemGroup = new THREE.Group();
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.25, 0.62, 12),
    new THREE.MeshStandardMaterial({ color: 0xf2ead7, roughness: 0.68 }),
  );
  pedestal.position.y = 0.31;
  itemGroup.add(pedestal);
  const style = good?.style || 'craft';
  if (style === 'fashion') {
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.15, 0.44, 10),
      new THREE.MeshStandardMaterial({ color: 0xd96b43, roughness: 0.55 }),
    );
    torso.position.y = 0.88;
    const shoulders = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.14, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xf2b84b, roughness: 0.5 }),
    );
    shoulders.position.y = 1.02;
    itemGroup.add(torso, shoulders);
  } else if (style === 'art') {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.42, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x5c4632, roughness: 0.6 }),
    );
    frame.position.y = 0.88;
    const canvasMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.34, 0.06),
      new THREE.MeshStandardMaterial({
        color: 0xe68449,
        emissive: 0x8a3d1b,
        emissiveIntensity: 0.35,
        roughness: 0.35,
      }),
    );
    canvasMesh.position.y = 0.88;
    itemGroup.add(frame, canvasMesh);
  } else if (style === 'tech') {
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      new THREE.MeshStandardMaterial({
        color: 0x5ec2d6,
        emissive: 0x1d6878,
        emissiveIntensity: 0.42,
        metalness: 0.35,
        roughness: 0.25,
      }),
    );
    core.position.y = 0.88;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.025, 8, 18),
      new THREE.MeshStandardMaterial({ color: 0xd8ecf2, metalness: 0.4, roughness: 0.3 }),
    );
    ring.position.y = 0.88;
    ring.rotation.x = Math.PI / 3;
    itemGroup.add(core, ring);
  } else if (style === 'audio') {
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.12, 0.26),
      new THREE.MeshStandardMaterial({ color: 0x2f3b46, metalness: 0.3, roughness: 0.45 }),
    );
    deck.position.y = 0.7;
    const speaker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.24, 12),
      new THREE.MeshStandardMaterial({ color: 0xd49a45, roughness: 0.4 }),
    );
    speaker.position.set(0, 0.88, 0);
    itemGroup.add(deck, speaker);
  } else if (style === 'harvest') {
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.2, 0.28),
      new THREE.MeshStandardMaterial({ color: 0x9b6b43, roughness: 0.8 }),
    );
    crate.position.y = 0.72;
    const jar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.1, 0.22, 10),
      new THREE.MeshStandardMaterial({ color: 0x6ea85b, roughness: 0.45 }),
    );
    jar.position.set(0, 0.9, 0);
    itemGroup.add(crate, jar);
  } else {
    const lantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 10),
      new THREE.MeshStandardMaterial({
        color: 0xf4c76b,
        emissive: 0x9c651c,
        emissiveIntensity: 0.4,
        roughness: 0.38,
      }),
    );
    lantern.position.y = 0.84;
    itemGroup.add(lantern);
  }
  return itemGroup;
}

function syncMallShopBays3D() {
  for (const bayRuntime of mallShopBayRuntime) {
    const displayState = getMallShopDisplayState(economy, bayRuntime.spaceId);
    if (!displayState) continue;
    const nextTexture = makeMallBaySignTexture(displayState, bayRuntime.accentHex);
    if (bayRuntime.signMaterial.map) bayRuntime.signMaterial.map.dispose();
    bayRuntime.signMaterial.map = nextTexture;
    bayRuntime.signMaterial.needsUpdate = true;

    while (bayRuntime.goodsGroup.children.length > 0) {
      const child = bayRuntime.goodsGroup.children[0];
      bayRuntime.goodsGroup.remove(child);
    }
    const { displayedGoods } = displayState;
    for (let index = 0; index < displayedGoods.length && index < bayRuntime.pedestalOffsets.length; index += 1) {
      const good = displayedGoods[index];
      const [offsetX, offsetZ] = bayRuntime.pedestalOffsets[index];
      const goodMesh = createVirtualGoodDisplayMesh(good);
      goodMesh.position.set(offsetX, 0.16, offsetZ);
      bayRuntime.goodsGroup.add(goodMesh);
    }
  }
}

function createShoppingMallVenue(venueLayout) {
  const {
    id,
    name,
    sign,
    x,
    z,
    facing,
    width = 14.2,
    depth = 8.6,
    collider = COMMERCE_VENUE_COLLIDER,
    wallColor,
    roofColor,
    awningColor,
  } = venueLayout;
  const frontZ = -depth / 2;
  const group = new THREE.Group();
  group.name = name;
  const wallMaterial = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.86 });
  const upperWallMaterial = new THREE.MeshStandardMaterial({ color: 0xf5efe0, roughness: 0.82 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.78 });
  const awningMaterial = new THREE.MeshStandardMaterial({ color: awningColor, roughness: 0.76 });
  const plinthMaterial = new THREE.MeshStandardMaterial({ color: 0xc8bfa8, roughness: 0.92 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xf7eed8, roughness: 0.68 });
  const columnMaterial = new THREE.MeshStandardMaterial({ color: 0xd9cfb8, roughness: 0.8 });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x9ed0cb,
    roughness: 0.2,
    metalness: 0.08,
    transparent: true,
    opacity: 0.56,
    side: THREE.DoubleSide,
  });
  const signMaterial = new THREE.MeshBasicMaterial({
    map: makeCommerceSignTexture(`${sign} · SHOPPING GALLERIA`, `#${new THREE.Color(awningColor).getHexString()}`, '#fff9e8'),
  });
  const addBox = (dimensions, position, material, castShadow = true, receiveShadow = true) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dimensions), material);
    mesh.position.set(...position);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    group.add(mesh);
    return mesh;
  };

  // Broad promenade deck and main multi-wing shopping mall body
  addBox([width + 1.1, 0.24, depth + 2.1], [0, 0.12, -0.45], plinthMaterial, false, true);
  addBox([width, 4.35, depth], [0, 2.3, 0.2], wallMaterial);
  // Second-level central skylight atrium hall
  addBox([6.4, 2.25, depth - 1.2], [0.8, 5.55, 0.15], upperWallMaterial);
  addBox([6.8, 0.28, depth - 0.8], [0.8, 6.78, 0.15], roofMaterial);
  addBox([5.6, 0.72, 0.12], [0.8, 5.65, frontZ + 0.68], glassMaterial, false, false);
  addBox([width + 0.55, 0.3, depth + 0.45], [0, 4.55, 0.2], roofMaterial);
  addBox([width - 0.5, 0.24, 1.35], [0, 3.55, frontZ - 0.35], awningMaterial);

  for (const columnX of [-6.3, -3.55, -0.65, 2.75, 6.35]) {
    addBox([0.28, 3.45, 0.28], [columnX, 1.85, frontZ - 0.85], columnMaterial);
  }

  for (const bay of MALL_SHOP_BAY_LAYOUT) {
    const windowHeight = Math.min(2.35, bay.bayHeight - 0.65);
    addBox([bay.bayWidth, windowHeight + 0.22, 0.12], [bay.localX, 1.48, frontZ + 0.16], trimMaterial, false, false);
    addBox([bay.bayWidth - 0.22, windowHeight, 0.08], [bay.localX, 1.48, frontZ + 0.1], glassMaterial, false, false);
    addBox([bay.bayWidth + 0.12, 0.16, 0.92], [bay.localX, 0.3, frontZ - 0.18], trimMaterial, false, true);
  }

  const mainSignBoard = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 0.95), signMaterial);
  mainSignBoard.position.set(0.8, 6.08, frontZ + 0.58);
  mainSignBoard.rotation.y = Math.PI;
  group.add(mainSignBoard);

  batchStaticVenueMeshes(group);

  const shopBays = [];
  for (const bay of MALL_SHOP_BAY_LAYOUT) {
    const bayGroup = new THREE.Group();
    bayGroup.position.set(bay.localX, 0, bay.localZ);
    const accentHex = `#${new THREE.Color(bay.accentColor).getHexString()}`;
    const initialState = getMallShopDisplayState(economy, bay.spaceId);
    const baySignMaterial = new THREE.MeshBasicMaterial({
      map: makeMallBaySignTexture(initialState, accentHex),
    });
    const baySign = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.max(2.1, bay.bayWidth - 0.15), 0.64),
      baySignMaterial,
    );
    baySign.position.set(0, 3.06, -0.02);
    baySign.rotation.y = Math.PI;
    bayGroup.add(baySign);

    const goodsGroup = new THREE.Group();
    goodsGroup.position.set(0, 0, -0.2);
    bayGroup.add(goodsGroup);
    group.add(bayGroup);

    const worldPos = residenceLocalToWorld({ x, z, facing }, bay.localX, frontZ - 0.95);
    const runtimeEntry = {
      spaceId: bay.spaceId,
      code: bay.code,
      sizeLabel: bay.sizeLabel,
      accentHex,
      signMaterial: baySignMaterial,
      goodsGroup,
      pedestalOffsets: bay.pedestalOffsets,
      interactionX: worldPos.x,
      interactionZ: worldPos.z,
    };
    mallShopBayRuntime.push(runtimeEntry);
    shopBays.push(runtimeEntry);
  }
  syncMallShopBays3D();

  group.position.set(x, terrainHeight(x, z), z);
  group.rotation.y = facing;
  scene.add(group);
  const doorPosition = residenceLocalToWorld({ x, z, facing }, 0, frontZ - 0.95);
  const venue = {
    id,
    kind: 'mall',
    name,
    x,
    z,
    facing,
    group,
    interactionX: doorPosition.x,
    interactionZ: doorPosition.z,
    interactionRadius: 9.2,
    shopBays,
  };
  const colliderCenter = residenceLocalToWorld(
    { x, z, facing },
    collider.localX,
    collider.localZ,
  );
  commerceVenues.push(venue);
  worldObstacleColliders.push({
    x: colliderCenter.x,
    z: colliderCenter.z,
    yaw: facing,
    halfX: collider.halfX,
    halfZ: collider.halfZ,
    height: collider.height,
  });
  return venue;
}

function createCommerceVenue(venueLayout) {
  if (venueLayout.kind === 'mall') return createShoppingMallVenue(venueLayout);
  const {
    id,
    name,
    sign,
    x,
    z,
    facing,
    width = COMMERCE_VENUE_SIZE.width,
    depth = COMMERCE_VENUE_SIZE.depth,
    collider = COMMERCE_VENUE_COLLIDER,
    wallColor,
    roofColor,
    awningColor,
  } = venueLayout;
  const frontZ = -depth / 2;
  const group = new THREE.Group();
  const wallMaterial = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.88 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.82 });
  const awningMaterial = new THREE.MeshStandardMaterial({ color: awningColor, roughness: 0.8 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xf1e5c9, roughness: 0.7 });
  const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x76533f, roughness: 0.72 });
  const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x9bcac3, roughness: 0.22, metalness: 0.04, transparent: true, opacity: 0.72, side: THREE.DoubleSide });
  const signMaterial = new THREE.MeshBasicMaterial({ map: makeCommerceSignTexture(sign, `#${new THREE.Color(awningColor).getHexString()}`, '#fff9e8') });
  const addBox = (dimensions, position, material, castShadow = true, receiveShadow = true) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dimensions), material);
    mesh.position.set(...position);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    group.add(mesh);
    return mesh;
  };

  addBox([width, 4.05, depth], [0, 2.025, 0], wallMaterial);
  const roofRise = 1.25;
  const roofSlope = Math.hypot(width / 2, roofRise);
  const roofAngle = Math.atan2(roofRise, width / 2);
  const leftRoof = addBox([roofSlope + 0.32, 0.28, depth + 0.38], [-width / 4, 4.05 + roofRise / 2, 0], roofMaterial);
  leftRoof.rotation.z = roofAngle;
  const rightRoof = addBox([roofSlope + 0.32, 0.28, depth + 0.38], [width / 4, 4.05 + roofRise / 2, 0], roofMaterial);
  rightRoof.rotation.z = -roofAngle;
  addBox([0.24, 0.2, depth + 0.45], [0, 5.32, 0], trimMaterial);
  addBox([1.38, 2.35, 0.12], [0, 1.25, frontZ - 0.09], trimMaterial, false, false);
  addBox([1.16, 2.15, 0.13], [0, 1.22, frontZ - 0.17], doorMaterial, true, false);
  for (const side of [-1, 1]) {
    addBox([1.82, 1.42, 0.08], [side * 2.42, 2.18, frontZ - 0.09], trimMaterial, false, false);
    addBox([1.58, 1.18, 0.09], [side * 2.42, 2.18, frontZ - 0.15], glassMaterial, false, false);
    addBox([1.96, 0.12, 0.28], [side * 2.42, 1.42, frontZ - 0.13], trimMaterial, false, false);
  }
  addBox([7.35, 0.22, 0.86], [0, 3.18, frontZ - 0.42], awningMaterial);
  const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 0.82), signMaterial);
  signBoard.position.set(0, 3.76, frontZ - 0.135);
  signBoard.rotation.y = Math.PI;
  signBoard.receiveShadow = false;
  group.add(signBoard);
  const doorKnob = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xd8bb78, metalness: 0.5, roughness: 0.36 }),
  );
  doorKnob.position.set(0.39, 1.22, frontZ - 0.25);
  group.add(doorKnob);
  batchStaticVenueMeshes(group);

  group.position.set(x, terrainHeight(x, z), z);
  group.rotation.y = facing;
  scene.add(group);
  const doorPosition = residenceLocalToWorld({ x, z, facing }, 0, frontZ - 0.58);
  const venue = {
    id,
    kind: 'cafe',
    name,
    x,
    z,
    facing,
    group,
    interactionX: doorPosition.x,
    interactionZ: doorPosition.z,
    interactionRadius: 5.8,
  };
  const colliderCenter = residenceLocalToWorld(
    { x, z, facing },
    collider.localX,
    collider.localZ,
  );
  commerceVenues.push(venue);
  worldObstacleColliders.push({
    x: colliderCenter.x,
    z: colliderCenter.z,
    yaw: facing,
    halfX: collider.halfX,
    halfZ: collider.halfZ,
    height: collider.height,
  });
  return venue;
}

let communityHallSignMaterial = null;

function makeCommunityHallSignTexture() {
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 148;
  const context = signCanvas.getContext('2d');
  context.fillStyle = '#335749';
  context.fillRect(0, 0, signCanvas.width, signCanvas.height);
  context.strokeStyle = 'rgba(255, 245, 214, .84)';
  context.lineWidth = 6;
  context.strokeRect(8, 8, signCanvas.width - 16, signCanvas.height - 16);
  context.fillStyle = '#d8f3c5';
  context.font = '700 20px system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'top';
  context.fillText('UNITY COMMUNITY HALL · GOVERNOR’S OFFICE', signCanvas.width / 2, 18, 472);
  context.fillStyle = '#fff8e6';
  context.font = '700 32px system-ui, sans-serif';
  context.textBaseline = 'middle';
  context.fillText(
    `GOVERNOR ${government.governorName.toUpperCase()} · ${government.approval}%`,
    signCanvas.width / 2,
    76,
    472,
  );
  const policy = getActiveGovernorPolicy(government);
  context.fillStyle = 'rgba(255, 244, 216, .9)';
  context.font = '600 19px system-ui, sans-serif';
  context.fillText(
    `${policy.title.toUpperCase()} · TREASURY GC ${government.treasury}`,
    signCanvas.width / 2,
    118,
    472,
  );
  const texture = new THREE.CanvasTexture(signCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

function syncCommunityHall3D() {
  if (!communityHallSignMaterial) return;
  const nextTexture = makeCommunityHallSignTexture();
  if (communityHallSignMaterial.map) communityHallSignMaterial.map.dispose();
  communityHallSignMaterial.map = nextTexture;
  communityHallSignMaterial.needsUpdate = true;
}

function createCommunityHall() {
  const layout = COMMUNITY_HALL_LAYOUT;
  const { width, depth } = layout;
  const frontZ = -depth / 2;
  const group = new THREE.Group();
  group.name = layout.name;
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xe6ddc8, roughness: 0.88 });
  const plinthMaterial = new THREE.MeshStandardMaterial({ color: 0x98917d, roughness: 0.94 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xd5c7a2, roughness: 0.92 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xf6ecd6, roughness: 0.78 });
  const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x775c43, roughness: 0.82 });
  const civicGreenMaterial = new THREE.MeshStandardMaterial({ color: 0x2f6b4f, roughness: 0.65 });
  const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x91bcb5, roughness: 0.3, metalness: 0.04, transparent: true, opacity: 0.74, side: THREE.DoubleSide });
  communityHallSignMaterial = new THREE.MeshBasicMaterial({
    map: makeCommunityHallSignTexture(),
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const addBox = (dimensions, position, material, castShadow = true, receiveShadow = true) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dimensions), material);
    mesh.position.set(...position);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    group.add(mesh);
    return mesh;
  };

  addBox([width + 0.42, 0.24, depth + 0.42], [0, 0.12, 0], plinthMaterial);
  addBox([width, 3.15, depth], [0, 1.82, 0], wallMaterial);
  addBox([width + 1.4, 0.28, depth + 2.2], [0, 3.55, 0.02], roofMaterial);
  // Civic rooftop Rotunda pediment and green-white-green flag standards
  addBox([2.8, 0.62, 1.8], [0, 3.98, -0.15], trimMaterial);
  addBox([3.1, 0.16, 2.05], [0, 4.35, -0.15], civicGreenMaterial);
  for (const side of [-1, 1]) {
    addBox([0.18, 3.1, 0.18], [side * (width / 2 - 0.32), 1.65, frontZ - 0.95], trimMaterial);
    addBox([1.7, 1.48, 0.1], [side * 2.12, 2.1, frontZ - 0.065], trimMaterial, false, false);
    addBox([1.48, 1.26, 0.12], [side * 2.12, 2.1, frontZ - 0.14], glassMaterial, false, false);
    // Flanking civic flagpoles
    addBox([0.07, 2.35, 0.07], [side * 2.65, 1.35, frontZ - 1.25], trimMaterial);
    addBox([0.48, 0.28, 0.04], [side * 2.65 + 0.24, 2.32, frontZ - 1.25], civicGreenMaterial);
  }
  addBox([1.58, 2.32, 0.12], [0, 1.4, frontZ - 0.08], trimMaterial, false, false);
  addBox([1.32, 2.06, 0.14], [0, 1.38, frontZ - 0.16], doorMaterial);
  addBox([4.5, 0.14, 1.2], [0, 0.22, frontZ - 0.72], roofMaterial, false, true);
  addBox([1.7, 0.12, 0.55], [0, 0.1, frontZ - 1.38], trimMaterial, false, true);

  // A pair of shaded seats makes the forecourt a usable neighbourhood meeting place.
  const benchMaterial = new THREE.MeshStandardMaterial({ color: 0x58755e, roughness: 0.84 });
  for (const side of [-1, 1]) {
    const benchX = side * 2.2;
    addBox([1.55, 0.16, 0.48], [benchX, 0.56, frontZ - 0.96], benchMaterial, true, true);
    for (const legSide of [-1, 1]) {
      addBox([0.12, 0.48, 0.12], [benchX + legSide * 0.58, 0.31, frontZ - 0.96], plinthMaterial, true, false);
    }
  }

  batchStaticVenueMeshes(group);
  const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 0.88), communityHallSignMaterial);
  signBoard.position.set(0, 3.05, frontZ - 0.19);
  signBoard.rotation.y = Math.PI;
  group.add(signBoard);
  group.position.set(layout.x, terrainHeight(layout.x, layout.z), layout.z);
  group.rotation.y = layout.facing;
  scene.add(group);
  worldObstacleColliders.push({
    x: layout.x,
    z: layout.z,
    yaw: layout.facing,
    halfX: layout.halfX,
    halfZ: layout.halfZ,
    height: layout.height,
  });
  return group;
}

const billboard3DEntries = new Map();

function makeBillboardCanvasTexture(billboardId) {
  const display = getBillboardDisplayState(billboards, billboardId);
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 640;
  signCanvas.height = 320;
  const ctx = signCanvas.getContext('2d');
  const { theme, billboard } = display;

  const bgGradient = ctx.createLinearGradient(0, 0, 0, signCanvas.height);
  bgGradient.addColorStop(0, theme.bgTop);
  bgGradient.addColorStop(1, theme.bgBottom);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, signCanvas.width, signCanvas.height);

  // Subtle geometric corner glow & outer frame
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, signCanvas.width - 20, signCanvas.height - 20);
  ctx.strokeStyle = 'rgba(255, 255, 255, .22)';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, signCanvas.width - 40, signCanvas.height - 40);

  // Top badge pill
  ctx.fillStyle = theme.badgeBg;
  ctx.fillRect(32, 30, signCanvas.width - 64, 44);
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 30, signCanvas.width - 64, 44);

  ctx.fillStyle = theme.accent;
  ctx.font = '800 20px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(display.badge.toUpperCase(), 48, 52, 420);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255, 255, 255, .88)';
  ctx.font = '700 17px system-ui, sans-serif';
  ctx.fillText(`${billboard.code} · ${display.isLeased ? 'LEASED AD' : 'ABUJA MEDIA'}`, signCanvas.width - 48, 52, 160);

  // Main headline
  ctx.textAlign = 'center';
  ctx.fillStyle = theme.text;
  ctx.font = '900 40px system-ui, sans-serif';
  ctx.fillText(display.headline.toUpperCase(), signCanvas.width / 2, 134, signCanvas.width - 68);

  // Subline
  ctx.fillStyle = 'rgba(255, 250, 236, .92)';
  ctx.font = '600 22px system-ui, sans-serif';
  ctx.fillText(display.subline, signCanvas.width / 2, 188, signCanvas.width - 76);

  // Bottom CTA bar & Advertiser stamp
  ctx.fillStyle = theme.accent;
  ctx.fillRect(42, 232, 260, 50);
  ctx.fillStyle = '#18241d';
  ctx.font = '900 21px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(display.cta.toUpperCase(), 172, 258, 236);

  ctx.textAlign = 'right';
  ctx.fillStyle = theme.accent;
  ctx.font = '700 18px system-ui, sans-serif';
  ctx.fillText(
    `SPONSOR: ${display.advertiserName.toUpperCase()}`,
    signCanvas.width - 42,
    247,
    280,
  );
  ctx.fillStyle = 'rgba(255, 255, 255, .78)';
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.fillText(
    `${billboard.dailyImpressions.toLocaleString()} DAILY VIEWS · PRESS E TO LEASE`,
    signCanvas.width - 42,
    271,
    280,
  );

  const texture = new THREE.CanvasTexture(signCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

function syncBillboards3D() {
  for (const [billboardId, entry] of billboard3DEntries.entries()) {
    const nextTexture = makeBillboardCanvasTexture(billboardId);
    if (entry.screenMaterial.map) entry.screenMaterial.map.dispose();
    entry.screenMaterial.map = nextTexture;
    entry.screenMaterial.needsUpdate = true;
    const display = getBillboardDisplayState(billboards, billboardId);
    entry.trimMaterial.color.set(display.theme.accent);
  }
}

function createStrategicBillboards() {
  const steelMaterial = new THREE.MeshStandardMaterial({ color: 0x323d3a, roughness: 0.56, metalness: 0.42 });
  const plinthMaterial = new THREE.MeshStandardMaterial({ color: 0x8f8875, roughness: 0.92 });
  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x222b28, roughness: 0.48, metalness: 0.36 });
  const lampGlowMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff0c2,
    emissive: 0xffd27d,
    emissiveIntensity: 0.9,
    roughness: 0.25,
  });

  for (const spec of BILLBOARD_LAYOUT) {
    const group = new THREE.Group();
    group.name = spec.name;
    const display = getBillboardDisplayState(billboards, spec.id);
    const trimMaterial = new THREE.MeshStandardMaterial({
      color: display.theme.accent,
      roughness: 0.42,
      metalness: 0.24,
    });
    const screenMaterial = new THREE.MeshBasicMaterial({
      map: makeBillboardCanvasTexture(spec.id),
      toneMapped: false,
    });

    const addPart = (dimensions, position, material, castShadow = true, receiveShadow = true) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dimensions), material);
      mesh.position.set(...position);
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
      group.add(mesh);
      return mesh;
    };

    // Heavy stone & steel foundation plinth
    addPart([2.5, 0.34, 1.3], [0, 0.17, 0], plinthMaterial);
    addPart([1.9, 0.22, 0.94], [0, 0.42, 0], steelMaterial);

    // Twin steel support columns up to the board
    const columnHeight = spec.towerHeight;
    for (const side of [-1, 1]) {
      addPart([0.28, columnHeight, 0.28], [side * 0.72, columnHeight / 2 + 0.35, 0], steelMaterial);
    }
    // Cross-brace beam
    addPart([1.8, 0.18, 0.22], [0, columnHeight * 0.56, 0], steelMaterial);

    const boardCenterY = columnHeight + spec.boardHeight / 2 + 0.15;
    // Main cabinet frame & accent trim border
    addPart([spec.boardWidth + 0.36, spec.boardHeight + 0.34, 0.36], [0, boardCenterY, 0], frameMaterial);
    addPart([spec.boardWidth + 0.16, spec.boardHeight + 0.16, 0.4], [0, boardCenterY, 0], trimMaterial);

    // Catwalk maintenance ledge below the billboard
    addPart([spec.boardWidth + 0.2, 0.1, 0.86], [0, columnHeight + 0.02, 0], steelMaterial);

    // Overhead floodlight bar & 3 lamp heads on each side
    const topY = boardCenterY + spec.boardHeight / 2 + 0.24;
    addPart([spec.boardWidth * 0.84, 0.1, 0.16], [0, topY, 0], steelMaterial);
    for (const lampX of [-spec.boardWidth * 0.3, 0, spec.boardWidth * 0.3]) {
      for (const side of [-1, 1]) {
        addPart([0.1, 0.08, 0.48], [lampX, topY + 0.04, side * 0.24], steelMaterial, false, false);
        addPart([0.34, 0.1, 0.18], [lampX, topY - 0.02, side * 0.44], lampGlowMaterial, false, false);
      }
    }

    // Double-sided high-contrast display planes
    const planeGeo = new THREE.PlaneGeometry(spec.boardWidth, spec.boardHeight);
    const frontScreen = new THREE.Mesh(planeGeo, screenMaterial);
    frontScreen.position.set(0, boardCenterY, 0.21);
    group.add(frontScreen);

    const backScreen = new THREE.Mesh(planeGeo, screenMaterial);
    backScreen.position.set(0, boardCenterY, -0.21);
    backScreen.rotation.y = Math.PI;
    group.add(backScreen);

    const groundY = terrainHeight(spec.x, spec.z);
    group.position.set(spec.x, groundY, spec.z);
    group.rotation.y = spec.facing;
    scene.add(group);

    worldObstacleColliders.push({
      x: spec.x,
      z: spec.z,
      yaw: spec.facing,
      halfX: spec.halfX,
      halfZ: spec.halfZ,
      height: columnHeight + spec.boardHeight + 0.5,
    });

    billboard3DEntries.set(spec.id, {
      group,
      screenMaterial,
      trimMaterial,
      spec,
    });
  }
}

function createParkedCar(x, z, heading) {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4f8069, roughness: 0.58, metalness: 0.08 });
  const bodyShadowMaterial = new THREE.MeshStandardMaterial({ color: 0x345a4b, roughness: 0.72, metalness: 0.06 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xe2d5b7, roughness: 0.72 });
  const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x9acdc6, roughness: 0.24, metalness: 0.04, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide });
  const windshieldMaterial = new THREE.MeshStandardMaterial({ color: 0xb1d8d0, roughness: 0.16, metalness: 0.02, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide });
  const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x293330, roughness: 0.9 });
  const hubMaterial = new THREE.MeshStandardMaterial({ color: 0xd1be8b, roughness: 0.42, metalness: 0.42 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xe8dfca, roughness: 0.5, metalness: 0.2 });
  const headlightMaterial = new THREE.MeshStandardMaterial({ color: 0xffe6b2, emissive: 0xffd981, emissiveIntensity: 0.55, roughness: 0.3 });
  const tailLightMaterial = new THREE.MeshStandardMaterial({ color: 0xb74e45, emissive: 0x6e1e1b, emissiveIntensity: 0.2, roughness: 0.36 });
  const wheelPivots = [];
  const wheelGeometry = new THREE.CylinderGeometry(0.34, 0.34, 0.18, 16);
  wheelGeometry.rotateZ(Math.PI / 2);
  const hubGeometry = new THREE.CylinderGeometry(0.17, 0.17, 0.19, 12);
  hubGeometry.rotateZ(Math.PI / 2);

  const addCarMesh = (geometry, material, position, rotation = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  addCarMesh(new THREE.BoxGeometry(1.72, 0.22, 3.28), bodyShadowMaterial, [0, 0.49, 0]);
  addCarMesh(new THREE.BoxGeometry(1.88, 0.34, 3.38), bodyMaterial, [0, 0.66, 0]);
  addCarMesh(new THREE.BoxGeometry(1.78, 0.27, 1.12), bodyMaterial, [0, 0.83, -1.06]);
  addCarMesh(new THREE.BoxGeometry(1.78, 0.28, 0.72), bodyMaterial, [0, 0.81, 1.22]);
  addCarMesh(new THREE.BoxGeometry(1.48, 0.63, 1.8), bodyMaterial, [0, 1.17, 0.04]);
  addCarMesh(new THREE.BoxGeometry(1.43, 0.12, 1.35), roofMaterial, [0, 1.54, 0.06]);
  addCarMesh(new THREE.BoxGeometry(1.31, 0.42, 0.045), windshieldMaterial, [0, 1.23, -0.91], [-0.32, 0, 0]);
  addCarMesh(new THREE.BoxGeometry(1.26, 0.4, 0.045), glassMaterial, [0, 1.21, 0.98], [0.32, 0, 0]);

  for (const side of [-1, 1]) {
    for (const windowZ of [-0.42, 0.39]) {
      addCarMesh(new THREE.BoxGeometry(0.035, 0.38, 0.68), glassMaterial, [side * 0.755, 1.2, windowZ]);
    }
    addCarMesh(new THREE.BoxGeometry(0.045, 0.32, 0.045), bodyShadowMaterial, [side * 0.77, 1.2, -0.015]);
    addCarMesh(new THREE.BoxGeometry(0.19, 0.11, 0.16), bodyMaterial, [side * 0.93, 1.13, -0.55]);
    addCarMesh(new THREE.BoxGeometry(0.06, 0.31, 0.88), bodyShadowMaterial, [side * 0.94, 0.72, -0.04]);
  }

  addCarMesh(new THREE.BoxGeometry(1.92, 0.11, 0.12), trimMaterial, [0, 0.54, -1.74]);
  addCarMesh(new THREE.BoxGeometry(1.92, 0.11, 0.12), bodyShadowMaterial, [0, 0.54, 1.74]);
  addCarMesh(new THREE.BoxGeometry(0.74, 0.08, 0.035), bodyShadowMaterial, [0, 0.69, -1.72]);
  for (const side of [-1, 1]) {
    addCarMesh(new THREE.BoxGeometry(0.24, 0.13, 0.11), headlightMaterial, [side * 0.61, 0.77, -1.72]);
    addCarMesh(new THREE.BoxGeometry(0.21, 0.12, 0.1), tailLightMaterial, [side * 0.64, 0.78, 1.72]);
  }

  for (const side of [-1, 1]) {
    for (const wheelZ of [-1.12, 1.12]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.91, 0.34, wheelZ);
      group.add(pivot);
      const tire = new THREE.Mesh(wheelGeometry, tireMaterial);
      tire.castShadow = true;
      tire.receiveShadow = true;
      pivot.add(tire);
      const hub = new THREE.Mesh(hubGeometry, hubMaterial);
      hub.position.x = side * 0.015;
      hub.castShadow = true;
      pivot.add(hub);
      wheelPivots.push({ pivot, tire, isFront: wheelZ < 0 });
    }
  }

  group.position.set(x, groundHeightAt(x, z) - PLAYER_FOOT_OFFSET, z);
  group.rotation.y = heading;
  scene.add(group);
  const collider = { vehicleGroup: group, radius: CAR_COLLISION_RADIUS, height: CAR_BODY_HEIGHT };
  worldObstacleColliders.push(collider);
  return { group, wheelPivots, collider, speed: 0, steering: 0 };
}

// A paved entry lane meets a quiet shared street, with a short drive to each front porch.
addEstateRoad(28, 3.7, 14.1, 8, false);
addEstateRoad(33, 3.7, 27, 8, true);
for (const [x, z] of [[23.8, 1], [23.8, 17], [30.2, 1], [30.2, 17]]) {
  addEstateRoad(3.1, 2.45, x, z, false);
}

const gateMaterial = new THREE.MeshStandardMaterial({ color: 0x9a8769, roughness: 0.9, flatShading: true });
for (const z of [6.15, 9.85]) {
  const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.48, 2.9, 0.48), gateMaterial);
  pillar.position.set(9.05, terrainHeight(9.05, z) + 1.45, z);
  pillar.castShadow = true;
  pillar.receiveShadow = true;
  scene.add(pillar);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.2, 0.68), estateTrimMaterial);
  cap.position.set(9.05, terrainHeight(9.05, z) + 2.98, z);
  cap.castShadow = true;
  scene.add(cap);
}
const gateSign = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.84, 3.45), gateMaterial);
gateSign.position.set(9.05, terrainHeight(9.05, 8) + 2.55, 8);
gateSign.castShadow = true;
scene.add(gateSign);
const gateSignFace = new THREE.Mesh(
  new THREE.PlaneGeometry(3.2, 0.64),
  new THREE.MeshBasicMaterial({ map: makeEstateSignTexture() }),
);
gateSignFace.position.set(8.89, terrainHeight(9.05, 8) + 2.55, 8);
gateSignFace.rotation.y = -Math.PI / 2;
scene.add(gateSignFace);

// A small planted traffic circle gives the four driveways a shared centre.
const roundabout = new THREE.Mesh(
  new THREE.CylinderGeometry(1.28, 1.48, 0.28, 24),
  new THREE.MeshStandardMaterial({ color: 0xb2a786, roughness: 0.95 }),
);
roundabout.position.set(27, terrainHeight(27, 8) + 0.14, 8);
roundabout.receiveShadow = true;
scene.add(roundabout);
const roundaboutShrub = new THREE.Mesh(new THREE.IcosahedronGeometry(0.92, 1), estateShrubMaterial);
roundaboutShrub.position.set(27, terrainHeight(27, 8) + 1.0, 8);
roundaboutShrub.scale.set(1.2, 0.92, 1.1);
roundaboutShrub.castShadow = true;
scene.add(roundaboutShrub);
const roundaboutFlowers = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), estateFlowerMaterials[0]);
roundaboutFlowers.position.set(27.38, terrainHeight(27, 8) + 1.22, 7.72);
scene.add(roundaboutFlowers);

for (const houseLayout of ESTATE_HOUSE_LAYOUT) {
  createEstateHouse({ ...houseLayout, isHome: houseLayout.number === 1 });
}
prepareRentalInteriors();
const savedRentalHouse = economy.lease
  ? estateHouses.find((house) => house.number === economy.lease.houseNumber)
  : null;
if (economy.lease && !savedRentalHouse) economy.lease = null;
setActiveResidence(savedRentalHouse || homeHouse);
for (const venueLayout of COMMERCE_VENUE_LAYOUT) createCommerceVenue(venueLayout);
// Keep the street lamps on the verges so they don't stand in the middle of the walking and driving lanes.
for (const [x, z] of [[11.8, 10.3], [29.35, -5], [29.35, 21], [42.5, 10.3]]) createEstateLamp(x, z);

// A small paved bay places your car just off the porch walk, facing out toward the lane.
addEstateRoad(4.45, 2.5, 23.85, -2.8, false);
playerCar = createParkedCar(23.85, -2.8, -Math.PI / 2);
const stadium = createStadium(terrainHeight);
scene.add(stadium.group);
transitNetwork = createTransportNetwork(scene, terrainHeight);
createCommunityHall();
createStrategicBillboards();
worldObstacleColliders.push({ vehicleGroup: transitNetwork.train.group, radius: 3.25, height: 2.55 });
worldObstacleColliders.push({ vehicleGroup: transitNetwork.bus.group, radius: 2.9, height: 2.55 });

const treeLocations = [];
const treePartInstances = {
  trunks: [],
  pineLow: [],
  pineHigh: [],
  broadleafCenters: [],
  broadleafPuffs: [],
};
const PINE_COLORS = [0x34785f, 0x438763, 0x5a9566];
const BROADLEAF_COLORS = [0x4b8d65, 0x70a666, 0x3b785e];
const TREE_TRUNK_COLOR = 0x805940;
const trunkGeometry = new THREE.CylinderGeometry(0.19, 0.31, 2.25, 7, 1);
const pineLowGeometry = new THREE.ConeGeometry(1.28, 2.55, 7, 1);
const pineHighGeometry = new THREE.ConeGeometry(0.96, 2.05, 7, 1);
const canopyGeometry = new THREE.IcosahedronGeometry(1.12, 0);
const canopySmallGeometry = new THREE.IcosahedronGeometry(0.84, 0);

function recordTreePart(kind, x, y, z, rotation, scale, color, partScale = [1, 1, 1]) {
  treePartInstances[kind].push({
    x,
    y,
    z,
    rotation,
    scaleX: scale * partScale[0],
    scaleY: scale * partScale[1],
    scaleZ: scale * partScale[2],
    color,
  });
}

function createTree(x, z, scale, type) {
  const groundY = terrainHeight(x, z) - 0.02;
  let lowerColor;
  let upperColor;
  let centerColor;
  const puffColors = [];
  if (type === 0) {
    lowerColor = PINE_COLORS[Math.floor(random() * PINE_COLORS.length)];
    upperColor = PINE_COLORS[Math.floor(random() * PINE_COLORS.length)];
  } else {
    centerColor = BROADLEAF_COLORS[Math.floor(random() * BROADLEAF_COLORS.length)];
    for (let index = 0; index < 3; index += 1) {
      puffColors.push(BROADLEAF_COLORS[Math.floor(random() * BROADLEAF_COLORS.length)]);
    }
  }
  const rotation = random() * Math.PI * 2;
  recordTreePart('trunks', x, groundY + 1.11 * scale, z, rotation, scale, TREE_TRUNK_COLOR);

  if (type === 0) {
    recordTreePart('pineLow', x, groundY + 2.35 * scale, z, rotation, scale, lowerColor);
    recordTreePart('pineHigh', x, groundY + 3.68 * scale, z, rotation, scale, upperColor);
  } else {
    recordTreePart('broadleafCenters', x, groundY + 2.88 * scale, z, rotation, scale, centerColor, [1.05, 1.12, 0.96]);
    const cosine = Math.cos(rotation);
    const sine = Math.sin(rotation);
    for (let index = 0; index < 3; index += 1) {
      const angle = (index / 3) * Math.PI * 2 + 0.5;
      const localX = Math.cos(angle) * 0.73;
      const localY = 2.45 + (index % 2) * 0.52;
      const localZ = Math.sin(angle) * 0.62;
      const worldX = x + (localX * cosine + localZ * sine) * scale;
      const worldZ = z + (-localX * sine + localZ * cosine) * scale;
      recordTreePart('broadleafPuffs', worldX, groundY + localY * scale, worldZ, rotation, scale, puffColors[index], [0.76, 0.8, 0.75]);
    }
  }

  worldObstacleColliders.push({ x, z, radius: 0.3 * scale, height: 2.25 * scale });
  treeLocations.push({ x, z });
}

let treeAttempts = 0;
while (treeLocations.length < 38 && treeAttempts < 1000) {
  treeAttempts += 1;
  const angle = random() * Math.PI * 2;
  const radius = 17 + Math.sqrt(random()) * 45;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  if (Math.hypot(x, z) > 63 || isReservedSpot(x, z)) continue;
  createTree(x, z, 0.78 + random() * 0.53, random() < 0.82 ? 1 : 0);
}

function addTreeInstanceBatch(name, geometry, material, instances, receiveShadow = false) {
  if (!instances.length) return null;
  const mesh = new THREE.InstancedMesh(geometry, material, instances.length);
  const transform = new THREE.Object3D();
  const color = new THREE.Color();
  for (let index = 0; index < instances.length; index += 1) {
    const instance = instances[index];
    transform.position.set(instance.x, instance.y, instance.z);
    transform.rotation.set(0, instance.rotation, 0);
    transform.scale.set(instance.scaleX, instance.scaleY, instance.scaleZ);
    transform.updateMatrix();
    mesh.setMatrixAt(index, transform.matrix);
    mesh.setColorAt(index, color.setHex(instance.color));
  }
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = receiveShadow;
  mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  scene.add(mesh);
  return mesh;
}

const treeTrunkMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true });
const treeFoliageMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true });
addTreeInstanceBatch('Tree trunks', trunkGeometry, treeTrunkMaterial, treePartInstances.trunks, true);
addTreeInstanceBatch('Pine lower canopies', pineLowGeometry, treeFoliageMaterial, treePartInstances.pineLow);
addTreeInstanceBatch('Pine upper canopies', pineHighGeometry, treeFoliageMaterial, treePartInstances.pineHigh);
addTreeInstanceBatch('Broadleaf canopies', canopyGeometry, treeFoliageMaterial, treePartInstances.broadleafCenters);
addTreeInstanceBatch('Broadleaf canopy clusters', canopySmallGeometry, treeFoliageMaterial, treePartInstances.broadleafPuffs);
for (const instances of Object.values(treePartInstances)) instances.length = 0;

// Weathered rocks are scattered around clearings and the neighbourhood's slope.
const rockGeometry = new THREE.DodecahedronGeometry(0.75, 0);
const ROCK_COLORS = [0x879487, 0xa59d7e, 0x74847b];
const rockMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true });
const rockInstances = [];
for (let i = 0; i < 30; i += 1) {
  const angle = random() * Math.PI * 2;
  const radius = 14 + random() * 51;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  if (radius > 65 || isReservedSpot(x, z, 1.3)) continue;
  const color = ROCK_COLORS[Math.floor(random() * ROCK_COLORS.length)];
  const scaleX = 0.7 + random() * 0.9;
  const scaleY = 0.42 + random() * 0.5;
  const scaleZ = 0.55 + random() * 0.8;
  const y = terrainHeight(x, z) + 0.22;
  const rotationX = random() * 0.2;
  const rotationY = random() * Math.PI;
  const rotationZ = random() * 0.2;
  rockInstances.push({
    x,
    y,
    z,
    scaleX,
    scaleY,
    scaleZ,
    rotationX,
    rotationY,
    rotationZ,
    color,
  });
  worldObstacleColliders.push({
    x,
    z,
    radius: 0.75 * Math.max(scaleX, scaleZ),
    height: 0.22 + 0.75 * scaleY,
  });
}
if (rockInstances.length) {
  const rocks = new THREE.InstancedMesh(rockGeometry, rockMaterial, rockInstances.length);
  const rockTransform = new THREE.Object3D();
  const rockColor = new THREE.Color();
  for (let index = 0; index < rockInstances.length; index += 1) {
    const rock = rockInstances[index];
    rockTransform.position.set(rock.x, rock.y, rock.z);
    rockTransform.rotation.set(rock.rotationX, rock.rotationY, rock.rotationZ);
    rockTransform.scale.set(rock.scaleX, rock.scaleY, rock.scaleZ);
    rockTransform.updateMatrix();
    rocks.setMatrixAt(index, rockTransform.matrix);
    rocks.setColorAt(index, rockColor.setHex(rock.color));
  }
  rocks.name = 'Savannah rocks';
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  rocks.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  rocks.instanceMatrix.needsUpdate = true;
  if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;
  rocks.computeBoundingSphere();
  scene.add(rocks);
  rockInstances.length = 0;
}

// Tiny wildflowers use instancing so the open meadows stay light to render.
const flowerHeadGeometry = new THREE.SphereGeometry(0.11, 7, 5);
const flowerStemGeometry = new THREE.CylinderGeometry(0.018, 0.025, 0.22, 4);
const flowerHeads = new THREE.InstancedMesh(flowerHeadGeometry, new THREE.MeshStandardMaterial({ roughness: 0.72 }), 170);
const flowerStems = new THREE.InstancedMesh(flowerStemGeometry, new THREE.MeshStandardMaterial({ color: 0x4f8b5e, roughness: 1 }), 170);
flowerHeads.castShadow = false;
flowerHeads.receiveShadow = false;
flowerStems.castShadow = false;
const dummy = new THREE.Object3D();
const flowerColors = [0xf3d28a, 0xfff2d1, 0xe9a7a0, 0xdac2e7];
let flowerCount = 0;
for (let i = 0; i < 170; i += 1) {
  const angle = random() * Math.PI * 2;
  const radius = 8 + Math.sqrt(random()) * 57;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  if (radius > 66 || distanceToPath(x, z) < 2.2 || isReservedSpot(x, z, -2)) continue;
  const ground = terrainHeight(x, z);
  dummy.position.set(x, ground + 0.28, z);
  dummy.scale.setScalar(0.75 + random() * 0.6);
  dummy.rotation.set(0, random() * Math.PI, 0);
  dummy.updateMatrix();
  flowerHeads.setMatrixAt(flowerCount, dummy.matrix);
  flowerHeads.setColorAt(flowerCount, new THREE.Color(flowerColors[Math.floor(random() * flowerColors.length)]));
  dummy.position.y = ground + 0.13;
  dummy.scale.set(1, 0.8 + random() * 0.5, 1);
  dummy.updateMatrix();
  flowerStems.setMatrixAt(flowerCount, dummy.matrix);
  flowerCount += 1;
}
flowerHeads.count = flowerCount;
flowerStems.count = flowerCount;
flowerHeads.instanceMatrix.needsUpdate = true;
flowerStems.instanceMatrix.needsUpdate = true;
if (flowerHeads.instanceColor) flowerHeads.instanceColor.needsUpdate = true;
scene.add(flowerStems, flowerHeads);

// Collectible seed-lights.
const seeds = [];
const seedMaterial = new THREE.MeshStandardMaterial({ color: 0xffd987, roughness: 0.22, metalness: 0.18, emissive: 0xe6a64d, emissiveIntensity: 1.8 });
const seedRingMaterial = new THREE.MeshStandardMaterial({ color: 0xffdf94, roughness: 0.24, metalness: 0.45, emissive: 0xf7ba5b, emissiveIntensity: 1.15 });
for (let i = 0; i < SEED_POSITIONS.length; i += 1) {
  const position = SEED_POSITIONS[i];
  const seedGroup = new THREE.Group();
  seedGroup.position.set(position.x, terrainHeight(position.x, position.y), position.y);
  const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.31, 1), seedMaterial);
  orb.position.y = 1.16;
  orb.scale.set(0.8, 1.1, 0.8);
  orb.castShadow = true;
  seedGroup.add(orb);
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.035, 7, 32), seedRingMaterial);
  hoop.rotation.x = Math.PI / 2;
  hoop.position.y = 1.13;
  seedGroup.add(hoop);
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.018, 5, 32),
    new THREE.MeshBasicMaterial({ color: 0xffe9b1, transparent: true, opacity: 0.55 }),
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 1.12;
  seedGroup.add(halo);
  const light = new THREE.PointLight(0xffd174, 1.4, 5, 2);
  light.position.y = 1.2;
  seedGroup.add(light);
  scene.add(seedGroup);
  seeds.push({ index: i + 1, group: seedGroup, orb, hoop, halo, x: position.x, z: position.y, phase: random() * Math.PI * 2, collected: false });
}

// A few slow sparks circle the beacon like fireflies. One dynamic batch avoids
// a separate draw submission for every tiny particle.
const motes = [];
const moteGeometry = new THREE.SphereGeometry(0.055, 7, 5);
const moteMaterial = new THREE.MeshBasicMaterial({ color: 0xc8f3bb, transparent: true, opacity: 0.82, depthWrite: false });
const moteInstances = new THREE.InstancedMesh(moteGeometry, moteMaterial, 19);
const moteTransform = new THREE.Object3D();
for (let i = 0; i < 19; i += 1) {
  const data = { phase: random() * Math.PI * 2, radius: 3.1 + random() * 2.3, speed: 0.25 + random() * 0.45, height: 1.1 + random() * 4.7 };
  motes.push(data);
  const angle = data.phase;
  moteTransform.position.set(
    Math.cos(angle) * data.radius,
    data.height + Math.sin(angle * 1.6) * 0.45,
    Math.sin(angle) * data.radius,
  );
  moteTransform.updateMatrix();
  moteInstances.setMatrixAt(i, moteTransform.matrix);
}
moteInstances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
moteInstances.instanceMatrix.needsUpdate = true;
moteInstances.computeBoundingSphere();
moteInstances.castShadow = false;
moteInstances.receiveShadow = false;
beacon.add(moteInstances);
let lastMoteReducedMotion = null;

// A more natural, softly shaded wanderer with human proportions, layered clothes,
// facial features, articulated limbs, and a stitched travel pack.
const player = new THREE.Group();
const avatarModel = new THREE.Group();
player.add(avatarModel);
scene.add(player);

const initialResidentOutfit = getOutfit(life.profile.outfit);
const shirtMaterial = new THREE.MeshStandardMaterial({ color: initialResidentOutfit.shirt, roughness: 0.92 });
const shirtLightMaterial = new THREE.MeshStandardMaterial({ color: initialResidentOutfit.highlight, roughness: 0.9 });
const shirtShadowMaterial = new THREE.MeshStandardMaterial({ color: 0x385b4b, roughness: 0.94 });
const pantsMaterial = new THREE.MeshStandardMaterial({ color: initialResidentOutfit.trousers, roughness: 0.96 });
const pantsShadeMaterial = new THREE.MeshStandardMaterial({ color: 0x918a78, roughness: 0.97 });

function applyResidentOutfit() {
  const outfit = getOutfit(life.profile.outfit);
  const shirtColor = new THREE.Color(outfit.shirt);
  const trousersColor = new THREE.Color(outfit.trousers);
  shirtMaterial.color.setHex(outfit.shirt);
  shirtLightMaterial.color.setHex(outfit.highlight);
  shirtShadowMaterial.color.copy(shirtColor).multiplyScalar(0.72);
  pantsMaterial.color.setHex(outfit.trousers);
  pantsShadeMaterial.color.copy(trousersColor).multiplyScalar(0.72);
}
applyResidentOutfit();
const shoeMaterial = new THREE.MeshStandardMaterial({ color: 0xd7c6a5, roughness: 0.84 });
const soleMaterial = new THREE.MeshStandardMaterial({ color: 0x625d50, roughness: 0.98 });
const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xc48662, roughness: 0.88 });
const skinLightMaterial = new THREE.MeshStandardMaterial({ color: 0xd29a75, roughness: 0.9 });
const hairMaterial = new THREE.MeshStandardMaterial({ color: 0x382e2b, roughness: 0.98 });
const hairHighlightMaterial = new THREE.MeshStandardMaterial({ color: 0x554037, roughness: 0.98 });
const backpackMaterial = new THREE.MeshStandardMaterial({ color: 0x9a6848, roughness: 0.96 });
const backpackTrimMaterial = new THREE.MeshStandardMaterial({ color: 0xc29463, roughness: 0.9 });
const eyeWhiteMaterial = new THREE.MeshStandardMaterial({ color: 0xf0e9d9, roughness: 0.58 });
const irisMaterial = new THREE.MeshStandardMaterial({ color: 0x53786d, roughness: 0.46 });
const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x202c29, roughness: 0.42 });
const faceLineMaterial = new THREE.MeshStandardMaterial({ color: 0x68443a, roughness: 0.86 });
const eyeGlintMaterial = new THREE.MeshBasicMaterial({ color: 0xfff8e9 });

function avatarMesh(geometry, material, x, y, z, parent = avatarModel) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function avatarTube(points, radius, material, parent = avatarModel, tubularSegments = 16) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, tubularSegments, radius, 6, false), material);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

// Backpack: a padded silhouette, separate outer pocket, flap, buckles, and curved seams.
const backpack = new THREE.Group();
avatarModel.add(backpack);
const packBody = avatarMesh(new THREE.SphereGeometry(1, 18, 14), backpackMaterial, 0, 1.26, 0.315, backpack);
packBody.scale.set(0.225, 0.285, 0.155);
const packTop = avatarMesh(new THREE.SphereGeometry(1, 16, 12), backpackMaterial, 0, 1.46, 0.32, backpack);
packTop.scale.set(0.19, 0.105, 0.145);
const packPocket = avatarMesh(new THREE.SphereGeometry(1, 16, 12), backpackMaterial, 0, 1.095, 0.448, backpack);
packPocket.scale.set(0.158, 0.12, 0.052);
const packFlap = avatarMesh(new THREE.BoxGeometry(0.29, 0.07, 0.035), backpackTrimMaterial, 0, 1.2, 0.493, backpack);
packFlap.rotation.x = -0.08;
for (const side of [-1, 1]) {
  const buckle = avatarMesh(new THREE.BoxGeometry(0.035, 0.052, 0.016), soleMaterial, side * 0.09, 1.19, 0.514, backpack);
  buckle.rotation.z = side * -0.13;
}
avatarTube([[-0.13, 1.02, 0.477], [-0.14, 1.105, 0.496], [0, 1.12, 0.503], [0.14, 1.105, 0.496], [0.13, 1.02, 0.477]], 0.006, backpackTrimMaterial, backpack, 20);

// Narrow padded shoulder straps sit between the jacket and pack.
for (const side of [-1, 1]) {
  const strap = avatarMesh(new THREE.BoxGeometry(0.062, 0.38, 0.035), backpackMaterial, side * 0.205, 1.38, 0.225);
  strap.rotation.z = side * -0.12;
  const strapStitch = avatarTube(
    [[side * 0.205, 1.55, 0.247], [side * 0.205, 1.39, 0.247], [side * 0.205, 1.22, 0.245]],
    0.0035,
    backpackTrimMaterial,
  );
  strapStitch.castShadow = false;
}

// A tailored jacket uses a shaped lathe profile instead of a straight cylinder.
const jacketProfile = [
  new THREE.Vector2(0, -0.33),
  new THREE.Vector2(0.155, -0.33),
  new THREE.Vector2(0.195, -0.29),
  new THREE.Vector2(0.205, -0.18),
  new THREE.Vector2(0.235, -0.045),
  new THREE.Vector2(0.255, 0.09),
  new THREE.Vector2(0.295, 0.22),
  new THREE.Vector2(0.282, 0.28),
  new THREE.Vector2(0.22, 0.32),
  new THREE.Vector2(0, 0.32),
];
const jacketGeometry = new THREE.LatheGeometry(jacketProfile, 24);
jacketGeometry.computeVertexNormals();
const torsoMesh = avatarMesh(jacketGeometry, shirtMaterial, 0, 1.23, 0);

// Soft collar and a glimpse of the shirt underneath.
avatarMesh(new THREE.CylinderGeometry(0.105, 0.12, 0.17, 16), skinMaterial, 0, 1.565, 0);
const shirtNeck = avatarMesh(new THREE.CylinderGeometry(0.105, 0.12, 0.075, 16), shirtLightMaterial, 0, 1.505, 0);
shirtNeck.material = shirtLightMaterial;
const collar = avatarMesh(new THREE.TorusGeometry(0.115, 0.026, 8, 24), shirtLightMaterial, 0, 1.535, 0);
collar.rotation.x = Math.PI / 2;

// Front zip, pocket flaps, and fine seams give the jacket readable construction.
const zipperMaterial = new THREE.MeshStandardMaterial({ color: 0xd7c8a4, metalness: 0.18, roughness: 0.72 });
avatarTube([[0, 1.49, -0.27], [0, 1.37, -0.285], [0, 1.2, -0.24], [0, 1.04, -0.207]], 0.007, zipperMaterial, avatarModel, 22);
avatarMesh(new THREE.SphereGeometry(0.018, 8, 6), zipperMaterial, 0.012, 1.405, -0.292);
for (const side of [-1, 1]) {
  const pocket = avatarMesh(new THREE.BoxGeometry(0.105, 0.09, 0.024), shirtShadowMaterial, side * 0.145, 1.145, -0.208);
  pocket.rotation.z = side * -0.04;
  avatarMesh(new THREE.BoxGeometry(0.115, 0.027, 0.03), shirtLightMaterial, side * 0.145, 1.194, -0.221);
  avatarTube(
    [[side * 0.11, 1.45, -0.235], [side * 0.19, 1.48, -0.19], [side * 0.265, 1.43, -0.12]],
    0.006,
    shirtLightMaterial,
  );
}
avatarTube([[-0.17, 0.96, -0.19], [0, 0.95, -0.205], [0.17, 0.96, -0.19]], 0.005, shirtLightMaterial);

// The face is built as a small head assembly so it can glance and nod independently.
const headGroup = new THREE.Group();
headGroup.position.y = 1.655;
avatarModel.add(headGroup);
const headShape = avatarMesh(new THREE.SphereGeometry(1, 22, 16), skinMaterial, 0, 0.075, 0, headGroup);
headShape.scale.set(0.15, 0.185, 0.142);
const jawShape = avatarMesh(new THREE.SphereGeometry(1, 18, 13), skinMaterial, 0, -0.045, -0.003, headGroup);
jawShape.scale.set(0.12, 0.095, 0.12);

// Ears, with a softer inner fold.
for (const side of [-1, 1]) {
  const ear = avatarMesh(new THREE.SphereGeometry(0.043, 12, 9), skinMaterial, side * 0.147, 0.055, 0, headGroup);
  ear.scale.set(0.66, 1.04, 0.73);
  const innerEar = avatarMesh(new THREE.SphereGeometry(0.022, 9, 7), skinLightMaterial, side * 0.157, 0.055, -0.009, headGroup);
  innerEar.scale.set(0.55, 0.8, 0.5);
}

// Individual eye groups make blinking possible; iris and catchlight remain visible at a distance.
const eyeGroups = [];
for (const side of [-1, 1]) {
  const eyeGroup = new THREE.Group();
  eyeGroup.position.set(side * 0.057, 0.096, -0.116);
  headGroup.add(eyeGroup);
  const sclera = avatarMesh(new THREE.SphereGeometry(0.027, 14, 10), eyeWhiteMaterial, 0, 0, 0, eyeGroup);
  sclera.scale.set(0.92, 0.82, 0.58);
  const iris = avatarMesh(new THREE.SphereGeometry(0.016, 12, 9), irisMaterial, 0, -0.001, -0.014, eyeGroup);
  iris.scale.set(0.83, 0.95, 0.62);
  const pupil = avatarMesh(new THREE.SphereGeometry(0.0085, 10, 8), pupilMaterial, 0, -0.001, -0.024, eyeGroup);
  pupil.scale.z = 0.62;
  avatarMesh(new THREE.SphereGeometry(0.0045, 8, 6), eyeGlintMaterial, -0.004, 0.006, -0.03, eyeGroup);
  eyeGroups.push(eyeGroup);
  avatarTube(
    [[side * 0.103, 0.143, -0.111], [side * 0.073, 0.16, -0.13], [side * 0.036, 0.15, -0.137]],
    0.006,
    hairMaterial,
    headGroup,
    8,
  );
}
const noseBridge = avatarMesh(new THREE.SphereGeometry(0.025, 12, 9), skinLightMaterial, 0, 0.043, -0.139, headGroup);
noseBridge.scale.set(0.52, 1.18, 0.72);
avatarMesh(new THREE.SphereGeometry(0.022, 10, 8), skinMaterial, 0, 0.014, -0.16, headGroup).scale.set(0.78, 0.64, 0.74);
avatarTube([[-0.027, -0.047, -0.125], [0, -0.053, -0.143], [0.027, -0.047, -0.125]], 0.0045, faceLineMaterial, headGroup, 10);

// Natural hairline, crown, and a few separated locks rather than one oversized sphere.
const hairBack = avatarMesh(new THREE.SphereGeometry(1, 20, 14), hairMaterial, 0, 0.164, 0.026, headGroup);
hairBack.scale.set(0.16, 0.105, 0.15);
const hairCrown = avatarMesh(new THREE.SphereGeometry(1, 20, 14), hairMaterial, 0, 0.208, 0.005, headGroup);
hairCrown.scale.set(0.156, 0.091, 0.15);
const fringe = avatarMesh(new THREE.SphereGeometry(1, 16, 12), hairMaterial, 0.005, 0.15, -0.102, headGroup);
fringe.scale.set(0.112, 0.052, 0.057);
for (const side of [-1, 1]) {
  const lock = avatarMesh(new THREE.SphereGeometry(1, 12, 9), hairMaterial, side * 0.126, 0.09, 0.012, headGroup);
  lock.scale.set(0.042, 0.095, 0.075);
  const curl = avatarMesh(new THREE.SphereGeometry(1, 12, 9), hairHighlightMaterial, side * 0.064, 0.267, 0.018, headGroup);
  curl.scale.set(0.046, 0.034, 0.045);
}

// Belt and shaped trousers establish the waist before the articulated legs begin.
const pelvis = avatarMesh(new THREE.SphereGeometry(1, 18, 12), pantsMaterial, 0, 0.965, 0);
pelvis.scale.set(0.235, 0.145, 0.165);
const belt = avatarMesh(new THREE.TorusGeometry(0.205, 0.018, 7, 24), pantsShadeMaterial, 0, 1.015, 0);
belt.rotation.x = Math.PI / 2;
avatarMesh(new THREE.BoxGeometry(0.052, 0.052, 0.018), backpackTrimMaterial, 0, 1.015, -0.203);

// Articulated arms: sleeve, elbow, forearm, cuff, palm, thumb, and separate fingers.
const armPivots = [];
const elbowPivots = [];
for (const side of [-1, 1]) {
  const shoulder = new THREE.Group();
  shoulder.position.set(side * 0.31, 1.415, 0);
  avatarModel.add(shoulder);
  const shoulderCap = avatarMesh(new THREE.SphereGeometry(0.102, 14, 11), shirtMaterial, 0, -0.025, 0, shoulder);
  shoulderCap.scale.set(0.9, 0.92, 0.88);
  const upperSleeve = avatarMesh(new THREE.CylinderGeometry(0.088, 0.074, 0.32, 14, 2), shirtMaterial, 0, -0.16, 0, shoulder);
  upperSleeve.rotation.z = side * -0.035;
  const elbow = new THREE.Group();
  elbow.position.y = -0.315;
  shoulder.add(elbow);
  avatarMesh(new THREE.SphereGeometry(0.073, 12, 9), shirtLightMaterial, 0, 0, 0, elbow);
  const forearm = avatarMesh(new THREE.CylinderGeometry(0.073, 0.058, 0.28, 14, 2), shirtLightMaterial, 0, -0.14, 0, elbow);
  forearm.rotation.z = side * 0.025;
  avatarMesh(new THREE.CylinderGeometry(0.062, 0.06, 0.055, 12), shirtShadowMaterial, 0, -0.275, 0, elbow);
  const palm = avatarMesh(new THREE.SphereGeometry(1, 14, 10), skinMaterial, 0, -0.34, -0.006, elbow);
  palm.scale.set(0.057, 0.075, 0.039);
  avatarMesh(new THREE.SphereGeometry(0.027, 10, 8), skinLightMaterial, side * 0.054, -0.333, -0.02, elbow).scale.set(0.7, 1.1, 0.8);
  for (let finger = 0; finger < 4; finger += 1) {
    const fingerX = (finger - 1.5) * 0.025;
    const length = finger === 1 || finger === 2 ? 0.046 : 0.039;
    const digit = avatarMesh(new THREE.SphereGeometry(1, 9, 7), skinMaterial, fingerX, -0.393, -0.008, elbow);
    digit.scale.set(0.012, length, 0.014);
  }
  armPivots.push(shoulder);
  elbowPivots.push(elbow);
}

// Articulated legs include separate knees, calves, cuffs, and built-up trail shoes.
const legPivots = [];
const kneePivots = [];
for (const side of [-1, 1]) {
  const hip = new THREE.Group();
  hip.position.set(side * 0.117, 0.94, 0);
  avatarModel.add(hip);
  const thigh = avatarMesh(new THREE.CylinderGeometry(0.113, 0.096, 0.42, 14, 2), pantsMaterial, 0, -0.21, 0, hip);
  thigh.rotation.z = side * -0.018;
  const knee = avatarMesh(new THREE.SphereGeometry(0.094, 13, 10), pantsMaterial, 0, -0.414, -0.004, hip);
  knee.scale.set(0.96, 0.88, 0.93);
  const lowerLeg = new THREE.Group();
  lowerLeg.position.y = -0.414;
  hip.add(lowerLeg);
  const calf = avatarMesh(new THREE.CylinderGeometry(0.083, 0.065, 0.405, 14, 2), pantsMaterial, 0, -0.197, 0.005, lowerLeg);
  calf.rotation.z = side * 0.01;
  avatarMesh(new THREE.CylinderGeometry(0.068, 0.067, 0.065, 12), pantsShadeMaterial, 0, -0.39, 0.005, lowerLeg);

  const sole = avatarMesh(new THREE.SphereGeometry(1, 16, 11), soleMaterial, 0, -0.546, -0.052, lowerLeg);
  sole.scale.set(0.105, 0.022, 0.177);
  const shoe = avatarMesh(new THREE.SphereGeometry(1, 16, 12), shoeMaterial, 0, -0.511, -0.065, lowerLeg);
  shoe.scale.set(0.099, 0.063, 0.16);
  const tongue = avatarMesh(new THREE.SphereGeometry(1, 12, 9), shirtLightMaterial, 0, -0.462, -0.105, lowerLeg);
  tongue.scale.set(0.035, 0.015, 0.064);
  for (let lace = 0; lace < 3; lace += 1) {
    const laceZ = -0.105 - lace * 0.027;
    avatarTube([[-0.026, -0.464, laceZ], [0, -0.459, laceZ - 0.006], [0.026, -0.464, laceZ]], 0.0035, zipperMaterial, lowerLeg, 6);
  }
  legPivots.push(hip);
  kneePivots.push(lowerLeg);
}

const playerShadow = new THREE.Mesh(
  new THREE.CircleGeometry(0.65, 24),
  new THREE.MeshBasicMaterial({ color: 0x315c4d, transparent: true, opacity: 0.24, depthWrite: false }),
);
playerShadow.rotation.x = -Math.PI / 2;
playerShadow.position.y = 0.035 - PLAYER_FOOT_OFFSET;
player.add(playerShadow);

const startPosition = new THREE.Vector3(0, groundHeightAt(0, 12), 12);
player.position.copy(startPosition);
// Let the player greet the camera at the trailhead, then turn naturally when movement begins.
player.rotation.y = Math.PI - 0.28;

let cameraYaw = 0;
let cameraPitch = 0;
const thirdPersonMovementState = createThirdPersonMovementState();
let drivingViewYawOffset = 0;
let cameraMode = 'follow';
let isFirstPerson = false;
let isWorldView = false;
let worldViewRestore = null;
let worldViewCameraDistance = 0;
let isWatchingMatch = false;
let previousMatchCameraFov = camera.fov;
let pointerDragging = false;
let activeCameraPointer = null;
let previousPointerX = 0;
let previousPointerY = 0;
let jumpHeight = 0;
let jumpVelocity = 0;
let isGrounded = true;
let jumpRequested = false;
let jumpBufferTimer = 0;
let coyoteTimer = 0;
let seedCount = 0;
let toastTimer = 0;
let worldMinutes = 9 * 60 + 42;
let lastClockMinute = -1;
const velocity = new THREE.Vector3();
const pressedKeys = new Set();
const joystickInput = { x: 0, y: 0 };
let elapsedWorldTime = 0;
let activePhonePage = 'home';
let phoneUnread = true;
let phoneCloseTimer = 0;
let previousPhoneFocus = null;
let phoneNoteSaveTimer = 0;
let bankCheckoutIntent = null;
if (activeResidence && activeResidence !== homeHouse) placePlayerOutsideResidence(activeResidence);

const CAMERA_MODE_LABELS = {
  follow: 'Follow behind',
  orbit: 'Orbit',
  overhead: 'Overhead',
  'first-person': 'First-person',
};

function syncViewToggleButton() {
  const nextMode = getNextCameraMode(cameraMode);
  const currentLabel = CAMERA_MODE_LABELS[cameraMode];
  const nextLabel = CAMERA_MODE_LABELS[nextMode];
  viewToggleButton.classList.toggle('is-active', cameraMode !== 'follow');
  viewToggleButton.dataset.cameraMode = cameraMode;
  viewToggleButton.removeAttribute('aria-pressed');
  viewToggleButton.setAttribute('aria-label', `Camera mode: ${currentLabel}. Activate to switch to ${nextLabel}.`);
  viewToggleButton.title = `Camera: ${currentLabel} · next: ${nextLabel} (V)`;
}

function setCameraMode(nextMode) {
  cameraMode = CAMERA_MODE_LABELS[nextMode] ? nextMode : 'follow';
  isFirstPerson = cameraMode === 'first-person';
  cameraYaw = isFirstPerson ? -player.rotation.y : player.rotation.y;
  cameraPitch = 0;
  drivingViewYawOffset = 0;
  getThirdPersonMovementYaw(thirdPersonMovementState, player.rotation.y, false);
  camera.fov = isFirstPerson ? 68 : cameraMode === 'overhead' ? 54 : 49;
  camera.updateProjectionMatrix();
  avatarModel.visible = !isFirstPerson && !isDriving && !isRidingTransit;
  playerShadow.visible = !isFirstPerson && !isDriving && !isRidingTransit;
  syncViewToggleButton();
}
syncViewToggleButton();

function resetCameraView() {
  cameraYaw = isWorldView ? 0 : isFirstPerson ? -player.rotation.y : player.rotation.y;
  cameraPitch = 0;
  drivingViewYawOffset = 0;
  getThirdPersonMovementYaw(thirdPersonMovementState, player.rotation.y, false);
}

function updateWorldViewProjection() {
  const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
  worldViewCameraDistance = getWorldViewCameraDistance({ aspect });
  const defaultFar = worldViewRestore?.far ?? 225;
  camera.far = Math.max(defaultFar, worldViewCameraDistance + WORLD_VIEW_RADIUS + 80);
  scene.fog.near = worldViewCameraDistance * 0.78;
  scene.fog.far = worldViewCameraDistance + WORLD_VIEW_RADIUS * 1.1;
  camera.updateProjectionMatrix();
}

function toggleCameraMode() {
  if (isWatchingMatch || isRidingTransit || isWorldView) return;
  setCameraMode(getNextCameraMode(cameraMode));
  const messages = {
    follow: isDriving ? 'Follow view · the camera stays behind your car as you turn.' : 'Follow camera · stays behind your resident.',
    orbit: isDriving ? 'Orbit camera · drag to circle around your car.' : 'Orbit camera · drag to circle around your resident.',
    overhead: isDriving ? 'Overhead camera · follows above your car.' : 'Overhead camera · follows above your resident.',
    'first-person': isDriving
      ? 'Driver view · looking through the windscreen.'
      : 'First-person view · drag to look up, down, and around.',
  };
  showToast(messages[cameraMode], 2800);
}

function toggleWorldView() {
  if (isWorldView) {
    isWorldView = false;
    const restore = worldViewRestore;
    if (restore) {
      camera.fov = restore.fov;
      camera.far = restore.far;
      camera.up.copy(restore.up);
      scene.fog.near = restore.fogNear;
      scene.fog.far = restore.fogFar;
      cameraYaw = restore.cameraYaw;
      cameraPitch = restore.cameraPitch;
      cameraMode = restore.cameraMode ?? (restore.wasFirstPerson ? 'first-person' : 'follow');
      isFirstPerson = cameraMode === 'first-person';
    }
    worldViewRestore = null;
    camera.updateProjectionMatrix();
    app.classList.remove('is-world-view');
    worldViewBanner.hidden = true;
    worldViewButton.classList.remove('is-active');
    worldViewButton.setAttribute('aria-pressed', 'false');
    worldViewButton.setAttribute('aria-label', 'Open world view');
    worldViewButton.title = 'Open world view (O)';
    syncViewToggleButton();
    avatarModel.visible = !isFirstPerson && !isDriving && !isRidingTransit;
    playerShadow.visible = !isFirstPerson && !isDriving && !isRidingTransit;
    updateVehicleControlUi();
    updateLocationAndMap();
    showToast('Back to your resident view.');
    return true;
  }

  if (isWatchingMatch || isRidingTransit || isDriving || isInsideHome || homeTransitionPending || isPhoneOpen()) {
    showToast('Step out of your current activity before opening World View.');
    return false;
  }
  worldViewRestore = {
    fov: camera.fov,
    far: camera.far,
    up: camera.up.clone(),
    fogNear: scene.fog.near,
    fogFar: scene.fog.far,
    cameraMode,
    wasFirstPerson: isFirstPerson,
    cameraYaw,
    cameraPitch,
  };
  isWorldView = true;
  if (cameraMode === 'follow' || cameraMode === 'overhead') cameraYaw = player.rotation.y;
  camera.fov = 49;
  cameraPitch = 0;
  camera.up.set(0, 1, 0);
  app.classList.add('is-world-view');
  worldViewBanner.hidden = false;
  worldViewButton.classList.add('is-active');
  worldViewButton.setAttribute('aria-pressed', 'true');
  worldViewButton.setAttribute('aria-label', 'Return to your resident view');
  worldViewButton.title = 'Return to your resident view (O)';
  syncViewToggleButton();
  avatarModel.visible = true;
  playerShadow.visible = true;
  updateWorldViewProjection();
  updateVehicleControlUi();
  updateLocationAndMap();
  showToast('World View · the whole neighbourhood is in sight. Drag to orbit; press O to return.', 3800);
  return true;
}

function updateVehicleControlUi() {
  walkingControlsHint.hidden = isDriving || isRidingTransit;
  vehicleControlsHint.hidden = !isDriving;
  transitControlsHint.hidden = !isRidingTransit;
  controlsHint.setAttribute('aria-label', isDriving ? 'Driving controls' : isRidingTransit ? 'Rail and bus riding controls' : 'Keyboard controls');
  viewToggleButton.disabled = isRidingTransit || isWatchingMatch || isWorldView;
  jumpButtonLabel.textContent = isDriving ? 'BRAKE' : isRidingTransit ? 'ON BOARD' : 'JUMP';
  jumpButtonIcon.textContent = isDriving ? '■' : '↑';
  jumpButton.setAttribute('aria-label', isDriving ? 'Brake the car' : isRidingTransit ? 'On the Abuja City Rail tram' : 'Jump');
  accelerateButton.hidden = isRidingTransit;
  if (accelerateButtonLabel) accelerateButtonLabel.textContent = isDriving ? 'ACCEL' : 'WALK';
  if (accelerateButtonIcon) accelerateButtonIcon.textContent = '↑';
  accelerateButton.setAttribute('aria-label', isDriving ? 'Accelerate' : 'Walk forward');
  app.classList.toggle('is-riding-transit', isRidingTransit);
  setAttributeIfChanged(joystick, 'aria-label', isDriving
    ? 'Steering joystick. Drag left or right to steer the car.'
    : 'Navigation joystick. Drag to turn and aim your direction; use the Walk button to walk forward.');
  touchLabel.textContent = isDriving ? 'STEER' : isRidingTransit ? 'TRANSIT' : 'NAVIGATE';
}

const keyToMove = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift']);
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'escape' && isPhoneOpen()) {
    event.preventDefault();
    closePhone();
    return;
  }
  const isTyping = event.target instanceof HTMLElement && event.target.matches('input, textarea, select, [contenteditable="true"]');
  if (isTyping) return;
  if (homeTransitionPending) {
    if (keyToMove.has(key)) event.preventDefault();
    return;
  }
  const isInteractiveControl = event.target instanceof Element
    && event.target.closest('button, a[href], input, textarea, select, [role="button"], [role="link"]');
  if (key === ' ' && isInteractiveControl) return;
  if (key === 'p' && !event.repeat) {
    event.preventDefault();
    togglePhone();
    return;
  }
  if (isPhoneOpen()) return;
  if (isWatchingMatch) {
    if ((key === 'e' || key === 'escape') && !event.repeat) {
      event.preventDefault();
      exitMatchView();
      return;
    }
    if (keyToMove.has(key)) event.preventDefault();
    return;
  }
  if (key === 'o' && !event.repeat) {
    event.preventDefault();
    toggleWorldView();
    return;
  }
  if (key === 'v' && !event.repeat) {
    event.preventDefault();
    toggleCameraMode();
    return;
  }
  if (key === 'e' && !event.repeat && handleNearbyInteraction()) {
    event.preventDefault();
    return;
  }
  if (key === 'l' && !event.repeat && isInsideHome) {
    event.preventDefault();
    toggleHomeLighting();
    return;
  }
  if (keyToMove.has(key)) event.preventDefault();
  pressedKeys.add(key);
  if (key === ' ' && !event.repeat && !isDriving) jumpRequested = true;
});
window.addEventListener('keyup', (event) => pressedKeys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => {
  pressedKeys.clear();
  resetJoystick();
  resetVehicleTouchInputs();
  releasePointer();
  jumpRequested = false;
  jumpBufferTimer = 0;
});

function homeWorldToLocal(x, z) {
  const residence = getCurrentResidence();
  if (!residence) return { x: 0, z: 0 };
  const offsetX = x - residence.x;
  const offsetZ = z - residence.z;
  const cosYaw = Math.cos(residence.facing);
  const sinYaw = Math.sin(residence.facing);
  return {
    x: offsetX * cosYaw - offsetZ * sinYaw,
    z: offsetX * sinYaw + offsetZ * cosYaw,
  };
}

function homeLocalToWorld(localX, localZ) {
  const residence = getCurrentResidence();
  if (!residence) return { x: 0, z: 0 };
  return residenceLocalToWorld(residence, localX, localZ);
}

function resolveHomeInteriorCollisions() {
  const residence = getCurrentResidence();
  if (!residence) return;
  const local = homeWorldToLocal(player.position.x, player.position.z);
  let localX = local.x;
  let localZ = local.z;
  const cosYaw = Math.cos(residence.facing);
  const sinYaw = Math.sin(residence.facing);
  let localVelocityX = velocity.x * cosYaw - velocity.z * sinYaw;
  let localVelocityZ = velocity.x * sinYaw + velocity.z * cosYaw;
  const bound = HOME_INTERIOR_BOUNDS - PLAYER_COLLISION_RADIUS;

  const removeIntoSurfaceVelocity = (normalX, normalZ) => {
    const inwardVelocity = localVelocityX * normalX + localVelocityZ * normalZ;
    if (inwardVelocity < 0) {
      localVelocityX -= inwardVelocity * normalX;
      localVelocityZ -= inwardVelocity * normalZ;
    }
  };

  for (let pass = 0; pass < 4; pass += 1) {
    if (localX < -bound) {
      localX = -bound;
      removeIntoSurfaceVelocity(1, 0);
    } else if (localX > bound) {
      localX = bound;
      removeIntoSurfaceVelocity(-1, 0);
    }
    if (localZ < -bound) {
      localZ = -bound;
      removeIntoSurfaceVelocity(0, 1);
    } else if (localZ > bound) {
      localZ = bound;
      removeIntoSurfaceVelocity(0, -1);
    }

    for (const obstacle of homeFurnitureColliders) {
      const dx = localX - obstacle.x;
      const dz = localZ - obstacle.z;
      const overlapX = obstacle.halfX + PLAYER_COLLISION_RADIUS - Math.abs(dx);
      const overlapZ = obstacle.halfZ + PLAYER_COLLISION_RADIUS - Math.abs(dz);
      if (overlapX <= 0 || overlapZ <= 0) continue;
      if (overlapX < overlapZ) {
        const normalX = Math.sign(dx) || (localVelocityX > 0 ? -1 : 1);
        localX = obstacle.x + normalX * (obstacle.halfX + PLAYER_COLLISION_RADIUS);
        removeIntoSurfaceVelocity(normalX, 0);
      } else {
        const normalZ = Math.sign(dz) || (localVelocityZ > 0 ? -1 : 1);
        localZ = obstacle.z + normalZ * (obstacle.halfZ + PLAYER_COLLISION_RADIUS);
        removeIntoSurfaceVelocity(0, normalZ);
      }
    }
  }

  const world = homeLocalToWorld(localX, localZ);
  player.position.x = world.x;
  player.position.z = world.z;
  velocity.x = localVelocityX * cosYaw + localVelocityZ * sinYaw;
  velocity.z = -localVelocityX * sinYaw + localVelocityZ * cosYaw;
}

function resolveHouseCollisions() {
  if (isInsideHome) {
    resolveHomeInteriorCollisions();
    return;
  }
  const collisionRadius = isDriving ? CAR_COLLISION_RADIUS : PLAYER_COLLISION_RADIUS;
  for (const house of estateHouses) {
    const contact = resolveDiscAgainstOrientedBox(player.position, house.collisionBounds, collisionRadius);
    if (!contact) continue;

    if (isDriving && playerCar) {
      const forwardX = -Math.sin(playerCar.group.rotation.y);
      const forwardZ = -Math.cos(playerCar.group.rotation.y);
      if (playerCar.speed * (forwardX * contact.normalX + forwardZ * contact.normalZ) < 0) playerCar.speed = 0;
    } else {
      const inwardVelocity = velocity.x * contact.normalX + velocity.z * contact.normalZ;
      if (inwardVelocity < 0) {
        velocity.x -= inwardVelocity * contact.normalX;
        velocity.z -= inwardVelocity * contact.normalZ;
      }
    }
  }
}

function resolveWorldObstacleCollisions() {
  if (isInsideHome) return;
  const collisionRadius = isDriving ? CAR_COLLISION_RADIUS : PLAYER_COLLISION_RADIUS;
  const collisionHeight = isDriving ? CAR_BODY_HEIGHT : PLAYER_BODY_HEIGHT;
  for (let pass = 0; pass < 3; pass += 1) {
    let resolvedAny = false;
    const playerBottom = jumpHeight;
    const playerTop = playerBottom + collisionHeight;
    for (const obstacle of worldObstacleColliders) {
      if (isDriving && obstacle.vehicleGroup === playerCar?.group) continue;
      const overlapsVertically = playerBottom < obstacle.height && playerTop > 0;
      if (!overlapsVertically) continue;
      if (Number.isFinite(obstacle.halfX) && Number.isFinite(obstacle.halfZ)) {
        const contact = resolveDiscAgainstOrientedBox(player.position, obstacle, collisionRadius);
        if (!contact) continue;
        if (isDriving && playerCar) {
          const forwardX = -Math.sin(playerCar.group.rotation.y);
          const forwardZ = -Math.cos(playerCar.group.rotation.y);
          if (playerCar.speed * (forwardX * contact.normalX + forwardZ * contact.normalZ) < 0) playerCar.speed = 0;
        } else {
          const inwardVelocity = velocity.x * contact.normalX + velocity.z * contact.normalZ;
          if (inwardVelocity < 0) {
            velocity.x -= inwardVelocity * contact.normalX;
            velocity.z -= inwardVelocity * contact.normalZ;
          }
        }
        resolvedAny = true;
        continue;
      }
      const obstacleX = obstacle.vehicleGroup ? obstacle.vehicleGroup.position.x : obstacle.x;
      const obstacleZ = obstacle.vehicleGroup ? obstacle.vehicleGroup.position.z : obstacle.z;
      const dx = player.position.x - obstacleX;
      const dz = player.position.z - obstacleZ;
      const minimumDistance = obstacle.radius + collisionRadius;
      const distanceSquared = dx * dx + dz * dz;
      if (distanceSquared >= minimumDistance * minimumDistance) continue;

      const distance = Math.sqrt(distanceSquared);
      let normalX;
      let normalZ;
      if (distance > 1e-5) {
        normalX = dx / distance;
        normalZ = dz / distance;
      } else if (isDriving && playerCar) {
        normalX = Math.sin(playerCar.group.rotation.y);
        normalZ = Math.cos(playerCar.group.rotation.y);
      } else {
        const speed = Math.hypot(velocity.x, velocity.z);
        normalX = speed > 1e-5 ? -velocity.x / speed : 1;
        normalZ = speed > 1e-5 ? -velocity.z / speed : 0;
      }

      player.position.x = obstacleX + normalX * minimumDistance;
      player.position.z = obstacleZ + normalZ * minimumDistance;
      if (isDriving && playerCar) {
        const forwardX = -Math.sin(playerCar.group.rotation.y);
        const forwardZ = -Math.cos(playerCar.group.rotation.y);
        if (playerCar.speed * (forwardX * normalX + forwardZ * normalZ) < 0) playerCar.speed = 0;
      } else {
        const inwardVelocity = velocity.x * normalX + velocity.z * normalZ;
        if (inwardVelocity < 0) {
          velocity.x -= inwardVelocity * normalX;
          velocity.z -= inwardVelocity * normalZ;
        }
      }
      resolvedAny = true;
    }
    if (!resolvedAny) break;
  }
}

canvas.addEventListener('pointerdown', (event) => {
  if (pointerDragging || (event.pointerType === 'mouse' && event.button !== 0)
    || (!isFirstPerson && !isWorldView && cameraMode !== 'orbit')) return;
  pointerDragging = true;
  activeCameraPointer = event.pointerId;
  canvas.classList.add('is-dragging');
  previousPointerX = event.clientX;
  previousPointerY = event.clientY;
  canvas.setPointerCapture?.(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!pointerDragging || event.pointerId !== activeCameraPointer) return;
  const deltaX = event.clientX - previousPointerX;
  const deltaY = event.clientY - previousPointerY;
  previousPointerX = event.clientX;
  previousPointerY = event.clientY;
  if (isDriving && isFirstPerson) drivingViewYawOffset -= deltaX * 0.0065;
  else if (isFirstPerson || isWorldView || cameraMode === 'orbit') cameraYaw -= deltaX * 0.0065;
  if (isFirstPerson) cameraPitch = clamp(cameraPitch - deltaY * 0.004, -0.7, 0.58);
});
function releasePointer(event) {
  if (event && event.pointerId !== activeCameraPointer) return;
  pointerDragging = false;
  activeCameraPointer = null;
  canvas.classList.remove('is-dragging');
}
canvas.addEventListener('pointerup', releasePointer);
canvas.addEventListener('pointercancel', releasePointer);
canvas.addEventListener('lostpointercapture', releasePointer);

const joystick = document.querySelector('#joystick');
const joystickStick = document.querySelector('#joystick-stick');
let joystickPointer = null;
function updateJoystick(event) {
  const bounds = joystick.getBoundingClientRect();
  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;
  const maxTravel = 31;
  const dx = event.clientX - centerX;
  const dy = event.clientY - centerY;
  const distance = Math.hypot(dx, dy);
  const scale = distance > maxTravel ? maxTravel / distance : 1;
  const x = dx * scale;
  const y = dy * scale;
  joystickInput.x = x / maxTravel;
  joystickInput.y = y / maxTravel;
  joystickStick.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
}
function resetJoystick() {
  joystickPointer = null;
  joystickInput.x = 0;
  joystickInput.y = 0;
  joystick.classList.remove('is-active');
  joystickStick.style.transform = 'translate(-50%, -50%)';
}
function resetVehicleTouchInputs() {
  vehicleTouchInput.accelerate = false;
  vehicleTouchInput.brake = false;
  vehicleAccelerateTapTimer = 0;
}
joystick.addEventListener('pointerdown', (event) => {
  if (joystickPointer !== null) return;
  event.preventDefault();
  joystickPointer = event.pointerId;
  joystick.classList.add('is-active');
  joystick.setPointerCapture(event.pointerId);
  updateJoystick(event);
});
joystick.addEventListener('pointermove', (event) => {
  if (event.pointerId === joystickPointer) updateJoystick(event);
});
joystick.addEventListener('pointerup', (event) => {
  if (event.pointerId === joystickPointer) resetJoystick();
});
joystick.addEventListener('pointercancel', (event) => {
  if (event.pointerId === joystickPointer) resetJoystick();
});
function requestJump() {
  if (homeTransitionPending || isPhoneOpen()) return;
  if (isDriving && playerCar) {
    playerCar.speed *= 0.48;
    return;
  }
  jumpRequested = true;
}

const jumpButton = document.querySelector('#jump-button');
jumpButton.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  event.preventDefault();
  if (isDriving) {
    vehicleTouchInput.brake = true;
    jumpButton.setPointerCapture?.(event.pointerId);
    return;
  }
  requestJump();
});
for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  jumpButton.addEventListener(eventName, () => {
    vehicleTouchInput.brake = false;
  });
}
// detail === 0 covers keyboard and assistive-technology activation; pointer presses act while held above.
jumpButton.addEventListener('click', (event) => {
  if (event.detail === 0) requestJump();
});

accelerateButton.addEventListener('pointerdown', (event) => {
  if (isRidingTransit || homeTransitionPending || isPhoneOpen() || (event.pointerType === 'mouse' && event.button !== 0)) return;
  event.preventDefault();
  vehicleTouchInput.accelerate = true;
  accelerateButton.classList.add('is-active');
  accelerateButton.setPointerCapture?.(event.pointerId);
});
for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  accelerateButton.addEventListener(eventName, () => {
    vehicleTouchInput.accelerate = false;
    accelerateButton.classList.remove('is-active');
  });
}
accelerateButton.addEventListener('click', (event) => {
  if (event.detail === 0 && !isRidingTransit) vehicleAccelerateTapTimer = 0.25;
});

function showToast(message, duration = 2600) {
  toastMessage.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), duration);
}

function isPhoneOpen() {
  return !phonePanel.hidden && phonePanel.classList.contains('is-open');
}

function updateStadiumBroadcast() {
  const matchSeconds = Math.floor(stadium.elapsed * 1.4);
  const minutes = Math.floor(matchSeconds / 60);
  const seconds = matchSeconds % 60;
  setTextIfChanged(stadiumBroadcastClock, `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
  setTextIfChanged(stadiumBroadcastScoreline, `${stadium.score[0]} – ${stadium.score[1]}`);
  const isGoal = stadium.goalFlash > 0;
  stadiumBroadcast.classList.toggle('is-goal', isGoal);
  setTextIfChanged(stadiumBroadcastStatus, isGoal
    ? `GOAL! ${stadium.teams[stadium.lastScoringTeam].name}`
    : 'The match is underway');
}

function enterMatchView() {
  if (isWorldView) toggleWorldView();
  if (isWatchingMatch || isDriving || isInsideHome || homeTransitionPending) return;
  isWatchingMatch = true;
  if (life.profile.created && completeLifeGoal(life, 'watch-match')) {
    adjustLifeNeeds(life, { mood: 8, social: 5, energy: -2 });
    persistLife();
    if (isPhoneOpen() && activePhonePage === 'life') renderLifePage();
  }
  previousMatchCameraFov = camera.fov;
  camera.fov = 55;
  camera.updateProjectionMatrix();
  app.classList.add('is-watching-match');
  stadiumBroadcast.hidden = false;
  viewToggleButton.disabled = true;
  pressedKeys.clear();
  resetJoystick();
  resetVehicleTouchInputs();
  velocity.set(0, 0, 0);
  jumpHeight = 0;
  jumpVelocity = 0;
  jumpRequested = false;
  jumpBufferTimer = 0;
  isGrounded = true;
  player.position.y = groundHeightAt(player.position.x, player.position.z);
  avatarModel.visible = false;
  playerShadow.visible = false;
  updateStadiumBroadcast();
  updateLocationAndMap();
  stadiumWatchExitButton.focus({ preventScroll: true });
}

function exitMatchView() {
  if (!isWatchingMatch) return;
  isWatchingMatch = false;
  stadiumBroadcast.hidden = true;
  stadiumBroadcast.classList.remove('is-goal');
  app.classList.remove('is-watching-match');
  viewToggleButton.disabled = false;
  camera.fov = previousMatchCameraFov;
  camera.updateProjectionMatrix();
  avatarModel.visible = !isFirstPerson && !isDriving;
  playerShadow.visible = !isFirstPerson && !isDriving;
  pressedKeys.clear();
  resetJoystick();
  resetVehicleTouchInputs();
  velocity.set(0, 0, 0);
  updateLocationAndMap();
  if (!isPhoneOpen()) canvas.focus({ preventScroll: true });
  showToast('Back in the stands. The match keeps playing.', 2400);
}

function completeHomeEntry() {
  if (isWorldView) toggleWorldView();
  const residence = getCurrentResidence();
  if (!residence || isInsideHome) return;
  isInsideHome = true;
  setResidenceInteriorVisible(residence, true);
  homeDoorTargetAngle = -Math.PI / 2;
  const entryPosition = homeLocalToWorld(0, -3.35);
  player.position.set(entryPosition.x, residence.group.position.y + HOME_FLOOR_TOP + PLAYER_FOOT_OFFSET, entryPosition.z);
  player.rotation.y = residence.facing + Math.PI;
  cameraYaw = residence.facing;
  cameraPitch = 0;
  jumpHeight = 0;
  jumpVelocity = 0;
  isGrounded = true;
  jumpRequested = false;
  jumpBufferTimer = 0;
  coyoteTimer = 0;
  updateLocationAndMap();
  showToast(residence.isHome
    ? 'Welcome home. The living room, kitchen, and bedroom are yours to explore.'
    : `Welcome to your furnished House ${String(residence.number).padStart(2, '0')} rental.`, 3600);
}

function completeHomeExit() {
  const residence = getCurrentResidence();
  if (!residence || !isInsideHome) return;
  isInsideHome = false;
  setResidenceInteriorVisible(residence, false);
  homeDoorTargetAngle = 0;
  const exitPosition = homeLocalToWorld(0, -6.35);
  player.position.set(exitPosition.x, groundHeightAt(exitPosition.x, exitPosition.z), exitPosition.z);
  player.rotation.y = residence.facing;
  cameraYaw = residence.facing + Math.PI;
  cameraPitch = 0;
  jumpHeight = 0;
  jumpVelocity = 0;
  isGrounded = true;
  jumpRequested = false;
  jumpBufferTimer = 0;
  coyoteTimer = 0;
  updateLocationAndMap();
  showToast(`You’re back outside House ${String(residence.number).padStart(2, '0')} at Unity Court.`, 2500);
}

function beginHomeTransition(destination) {
  if (!getCurrentResidence() || homeTransitionPending) return;
  homeTransitionPending = destination;
  homeDoorTargetAngle = -Math.PI / 2;
  velocity.set(0, 0, 0);
  pressedKeys.clear();
  resetJoystick();
  homeTransitionElement.classList.add('is-fading');
  const transitionDuration = prefersReducedMotion ? 0 : 220;
  window.setTimeout(() => {
    if (homeTransitionPending === 'enter') completeHomeEntry();
    else if (homeTransitionPending === 'exit') completeHomeExit();
    homeTransitionElement.classList.remove('is-fading');
    window.setTimeout(() => {
      homeTransitionPending = null;
    }, transitionDuration);
  }, transitionDuration);
}

function getNextActiveTransitStop() {
  return transitRideMode === 'bus'
    ? getNextBusTerminal(transitNetwork)
    : getNextTransitStation(transitNetwork);
}

function getCurrentActiveTransitStop() {
  if (transitRideMode === 'bus') return transitNetwork.busTerminals[transitNetwork.busService.currentTerminalIndex];
  return transitNetwork.stations[transitNetwork.currentStationIndex];
}

function getActiveTransitVehicle() {
  return transitRideMode === 'bus' ? transitNetwork.bus.group : transitNetwork.train.group;
}

function boardTransitVehicle(mode, stop) {
  if (!transitNetwork || !stop || isDriving || isRidingTransit) return false;
  const ready = mode === 'bus' ? isBusAtTerminal(transitNetwork, stop) : isTrainAtStation(transitNetwork, stop);
  if (!ready) return false;
  if (isWorldView) toggleWorldView();
  isRidingTransit = true;
  transitRideMode = mode;
  transitStopRequested = false;
  transitBoardedStopId = stop.id;
  const vehicle = mode === 'bus' ? transitNetwork.bus.group : transitNetwork.train.group;
  player.position.set(vehicle.position.x, vehicle.position.y + 0.55, vehicle.position.z);
  player.rotation.y = vehicle.rotation.y;
  cameraYaw = isFirstPerson ? -vehicle.rotation.y : vehicle.rotation.y;
  cameraPitch = 0;
  velocity.set(0, 0, 0);
  jumpHeight = 0;
  jumpVelocity = 0;
  jumpRequested = false;
  jumpBufferTimer = 0;
  coyoteTimer = 0;
  isGrounded = true;
  avatarModel.visible = false;
  playerShadow.visible = false;
  pressedKeys.clear();
  resetJoystick();
  resetVehicleTouchInputs();
  updateVehicleControlUi();
  updateLocationAndMap();
  const serviceName = mode === 'bus' ? 'Abuja City Bus' : 'Abuja City Rail';
  showToast(`Boarded the ${serviceName} at ${stop.name}. Press E to request the next stop.`, 3600);
  return true;
}

function leaveTransitVehicle(stop) {
  if (!isRidingTransit || !stop) return;
  isRidingTransit = false;
  transitRideMode = null;
  transitStopRequested = false;
  transitBoardedStopId = null;
  player.position.set(stop.x, groundHeightAt(stop.x, stop.z), stop.z);
  player.rotation.y = stop.yaw;
  cameraYaw = stop.yaw;
  cameraPitch = 0;
  velocity.set(0, 0, 0);
  jumpHeight = 0;
  jumpVelocity = 0;
  jumpRequested = false;
  jumpBufferTimer = 0;
  coyoteTimer = 0;
  isGrounded = true;
  avatarModel.visible = !isFirstPerson;
  playerShadow.visible = !isFirstPerson;
  pressedKeys.clear();
  resetJoystick();
  resetVehicleTouchInputs();
  updateVehicleControlUi();
  updateLocationAndMap();
  showToast(`Arrived at ${stop.name}. Step off and explore.`, 3000);
}

function requestTransitStop() {
  if (!isRidingTransit || !transitNetwork) return;
  const currentStop = getCurrentActiveTransitStop();
  const dwellRemaining = transitRideMode === 'bus'
    ? transitNetwork.busService.dwellRemaining
    : transitNetwork.dwellRemaining;
  if (dwellRemaining > 0.05 && currentStop?.id !== transitBoardedStopId) {
    leaveTransitVehicle(currentStop);
    return;
  }
  const nextStop = getNextActiveTransitStop();
  if (transitStopRequested) {
    showToast(`Stop requested · ${nextStop.name} is next.`, 2500);
    return;
  }
  transitStopRequested = true;
  showToast(`Stop requested · ${nextStop.name} is next.`, 2800);
  updateLocationAndMap();
}

function getNearbyRailStation() {
  return getNearestTransitStation(transitNetwork, player.position.x, player.position.z, 4.6)?.station ?? null;
}

function getNearbyBusTerminal() {
  return getNearestBusTerminal(transitNetwork, player.position.x, player.position.z, 4.6)?.terminal ?? null;
}

function getNearbyMallShopBay(maxDistance = 4.2) {
  let nearest = null;
  let nearestDistance = maxDistance;
  for (const bay of mallShopBayRuntime) {
    const distance = Math.hypot(player.position.x - bay.interactionX, player.position.z - bay.interactionZ);
    if (distance <= nearestDistance) {
      nearest = bay;
      nearestDistance = distance;
    }
  }
  return nearest ? { bay: nearest, distance: nearestDistance } : null;
}

function getNearbyCommerceVenue(maxDistance = 5.8) {
  let nearest = null;
  let nearestDistance = Infinity;
  for (const venue of commerceVenues) {
    const limit = venue.interactionRadius ?? maxDistance;
    let distance = Math.hypot(player.position.x - venue.interactionX, player.position.z - venue.interactionZ);
    if (Array.isArray(venue.shopBays)) {
      for (const bay of venue.shopBays) {
        distance = Math.min(distance, Math.hypot(player.position.x - bay.interactionX, player.position.z - bay.interactionZ));
      }
    }
    if (distance <= limit && distance <= nearestDistance) {
      nearest = venue;
      nearestDistance = distance;
    }
  }
  return nearest ? { venue: nearest, distance: nearestDistance } : null;
}

function isPlayerAtCommunityHall(maxDistance = 6.2) {
  const entranceZ = COMMUNITY_HALL_LAYOUT.z - COMMUNITY_HALL_LAYOUT.depth / 2 - 0.8;
  const entranceDistance = Math.hypot(player.position.x - COMMUNITY_HALL_LAYOUT.x, player.position.z - entranceZ);
  const centerDistance = Math.hypot(player.position.x - COMMUNITY_HALL_LAYOUT.x, player.position.z - COMMUNITY_HALL_LAYOUT.z);
  return Math.min(entranceDistance, centerDistance) <= maxDistance;
}

function getNearbyBillboard(maxDistance = 6.8) {
  let nearest = null;
  let nearestDistance = maxDistance;
  for (const billboard of BILLBOARD_LAYOUT) {
    const distance = Math.hypot(player.position.x - billboard.x, player.position.z - billboard.z);
    if (distance <= nearestDistance) {
      nearest = billboard;
      nearestDistance = distance;
    }
  }
  return nearest ? { billboard: nearest, distance: nearestDistance } : null;
}

function getNearbyRentalHouse(maxDistance = 4.6) {
  let nearest = null;
  let nearestDistance = maxDistance;
  for (const house of estateHouses) {
    if (house.isHome) continue;
    const distance = Math.hypot(player.position.x - house.doorX, player.position.z - house.doorZ);
    if (distance <= nearestDistance) {
      nearest = house;
      nearestDistance = distance;
    }
  }
  return nearest ? { house: nearest, distance: nearestDistance } : null;
}

function getNearbyInteractionTarget() {
  if (isRidingTransit) return 'request-transit-stop';
  if (isDriving) return 'exit-car';

  if (isInsideHome) {
    if (!getCurrentResidence()) return null;
    const local = homeWorldToLocal(player.position.x, player.position.z);
    return Math.hypot(local.x, local.z + 3.35) <= 2.1 ? 'exit-home' : null;
  }

  const residence = getCurrentResidence();
  const homeDistance = residence
    ? Math.hypot(player.position.x - residence.doorX, player.position.z - residence.doorZ)
    : Infinity;
  const carDistance = playerCar
    ? Math.hypot(player.position.x - playerCar.group.position.x, player.position.z - playerCar.group.position.z)
    : Infinity;
  if (homeDistance <= HOME_INTERACTION_PRIORITY_RADIUS) return 'enter-home';
  if (vehicleInteractionCooldown <= 0 && carDistance <= CAR_INTERACTION_RADIUS) return 'enter-car';
  if (homeDistance <= 4.2) return 'enter-home';
  if (getNearbyRentalHouse()) return 'view-rentals';
  const nearbyVenue = getNearbyCommerceVenue();
  if (nearbyVenue) return `open-${nearbyVenue.venue.id}`;
  if (isPlayerAtCommunityHall()) return 'open-government';
  if (getNearbyBillboard()) return 'open-billboard';

  const railStop = getNearestTransitStation(transitNetwork, player.position.x, player.position.z, 4.6);
  const busStop = getNearestBusTerminal(transitNetwork, player.position.x, player.position.z, 4.6);
  if (railStop && (!busStop || railStop.distance <= busStop.distance)) {
    return isTrainAtStation(transitNetwork, railStop.station) ? 'board-train' : 'wait-train';
  }
  if (busStop) return isBusAtTerminal(transitNetwork, busStop.terminal) ? 'board-bus' : 'wait-bus';
  const stadiumDistance = Math.hypot(player.position.x - STADIUM.x, player.position.z - STADIUM.z);
  if (stadiumDistance <= 21) return 'watch-match';
  return null;
}

function enterParkedCar() {
  if (!playerCar || isDriving || isInsideHome) return;
  if (isWorldView) toggleWorldView();
  isDriving = true;
  playerCar.speed = 0;
  playerCar.steering = 0;
  player.position.set(playerCar.group.position.x, groundHeightAt(playerCar.group.position.x, playerCar.group.position.z), playerCar.group.position.z);
  player.rotation.y = playerCar.group.rotation.y;
  cameraYaw = playerCar.group.rotation.y;
  cameraPitch = 0;
  drivingViewYawOffset = 0;
  velocity.set(0, 0, 0);
  jumpHeight = 0;
  jumpVelocity = 0;
  isGrounded = true;
  jumpRequested = false;
  jumpBufferTimer = 0;
  coyoteTimer = 0;
  avatarModel.visible = false;
  playerShadow.visible = false;
  pressedKeys.clear();
  resetJoystick();
  resetVehicleTouchInputs();
  updateVehicleControlUi();
  updateLocationAndMap();
  const touchDriving = Boolean(navigator.maxTouchPoints);
  showToast(touchDriving ? 'Driver view · joystick steers; use the nearby pedals to move and brake.' : 'Driver view · W/S drive, A/D steer, Space brake, E to exit.', 3800);
}

function exitParkedCar() {
  if (!playerCar || !isDriving) return;
  isDriving = false;
  playerCar.speed = 0;
  const exitOffset = new THREE.Vector3(
    -(CAR_COLLISION_RADIUS + PLAYER_COLLISION_RADIUS + 0.2),
    0,
    0,
  ).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerCar.group.rotation.y);
  const exitX = playerCar.group.position.x + exitOffset.x;
  const exitZ = playerCar.group.position.z + exitOffset.z;
  player.position.set(exitX, groundHeightAt(exitX, exitZ), exitZ);
  player.rotation.y = playerCar.group.rotation.y;
  cameraYaw = playerCar.group.rotation.y;
  cameraPitch = 0;
  drivingViewYawOffset = 0;
  velocity.set(0, 0, 0);
  jumpHeight = 0;
  jumpVelocity = 0;
  isGrounded = true;
  jumpRequested = false;
  jumpBufferTimer = 0;
  coyoteTimer = 0;
  vehicleInteractionCooldown = 0.8;
  avatarModel.visible = !isFirstPerson;
  playerShadow.visible = !isFirstPerson;
  pressedKeys.clear();
  resetJoystick();
  resetVehicleTouchInputs();
  updateVehicleControlUi();
  updateLocationAndMap();
  showToast('You’re out of the car. Walk back up and press E to drive again.', 3000);
}

function handleNearbyInteraction() {
  if (isPhoneOpen() || homeTransitionPending) return false;
  if (isWatchingMatch) {
    exitMatchView();
    return true;
  }
  const target = getNearbyInteractionTarget();
  if (target === 'view-rentals') {
    openPhone();
    setPhonePage('property');
    renderPropertyPage();
    return true;
  }
  if (target === 'open-cafe' || target === 'open-market') {
    openCommercePage(target.slice('open-'.length));
    return true;
  }
  if (target === 'open-government') {
    if (!isPhoneOpen()) openPhone();
    setPhonePage('government');
    return true;
  }
  if (target === 'open-billboard') {
    const nearby = getNearbyBillboard()?.billboard;
    if (nearby) selectedBillboardId = nearby.id;
    if (!isPhoneOpen()) openPhone();
    setPhonePage('billboards');
    return true;
  }
  if (target === 'watch-match') {
    enterMatchView();
    return true;
  }
  if (target === 'request-transit-stop') {
    requestTransitStop();
    return true;
  }
  if (target === 'board-train') {
    const station = getNearbyRailStation();
    if (!boardTransitVehicle('rail', station)) showToast('The Abuja City Rail is pulling out. Wait for its next stop.');
    return true;
  }
  if (target === 'wait-train') {
    const station = getNearbyRailStation();
    const waitSeconds = getTransitWaitSeconds(transitNetwork, station);
    showToast(`${station.name} · next train in about ${waitSeconds} seconds.`, 3200);
    return true;
  }
  if (target === 'board-bus') {
    const terminal = getNearbyBusTerminal();
    if (!boardTransitVehicle('bus', terminal)) showToast('The Abuja City Bus is pulling out. Wait for its next terminal stop.');
    return true;
  }
  if (target === 'wait-bus') {
    const terminal = getNearbyBusTerminal();
    const waitSeconds = getBusWaitSeconds(transitNetwork, terminal);
    showToast(`${terminal.name} · next bus in about ${waitSeconds} seconds.`, 3200);
    return true;
  }
  if (target === 'enter-car') {
    enterParkedCar();
    return true;
  }
  if (target === 'exit-car') {
    exitParkedCar();
    return true;
  }
  if (target === 'enter-home') {
    beginHomeTransition('enter');
    return true;
  }
  if (target === 'exit-home') {
    beginHomeTransition('exit');
    return true;
  }
  return false;
}

function updateVehicleMovement(delta, forwardInput, steeringInput) {
  if (!playerCar || !isDriving) return;
  const throttle = clamp(forwardInput, -1, 1);
  if (pressedKeys.has(' ') || vehicleTouchInput.brake) {
    const braking = Math.min(Math.abs(playerCar.speed), 13 * delta);
    playerCar.speed -= Math.sign(playerCar.speed) * braking;
  } else if (Math.abs(throttle) > 0.08) {
    if (playerCar.speed * throttle < 0) {
      const braking = Math.min(Math.abs(playerCar.speed), 11 * delta * Math.abs(throttle));
      playerCar.speed -= Math.sign(playerCar.speed) * braking;
    } else {
      playerCar.speed += throttle * 5.6 * delta;
    }
  } else {
    playerCar.speed *= Math.exp(-1.45 * delta);
    if (Math.abs(playerCar.speed) < 0.025) playerCar.speed = 0;
  }
  playerCar.speed = clamp(playerCar.speed, -3.8, 8.2);

  const directionSign = playerCar.speed < -0.08 ? -1 : 1;
  const speedFactor = clamp(Math.abs(playerCar.speed) / 1.2, 0, 1);
  const turnDelta = -clamp(steeringInput, -1, 1) * 1.05 * speedFactor * directionSign * delta;
  playerCar.group.rotation.y += turnDelta;
  playerCar.steering = -clamp(steeringInput, -1, 1) * directionSign * 0.42;
  if (cameraMode !== 'orbit') cameraYaw = playerCar.group.rotation.y;

  const forwardX = -Math.sin(playerCar.group.rotation.y);
  const forwardZ = -Math.cos(playerCar.group.rotation.y);
  player.position.x += forwardX * playerCar.speed * delta;
  player.position.z += forwardZ * playerCar.speed * delta;
  player.rotation.y = playerCar.group.rotation.y;
  velocity.set(0, 0, 0);

  for (const wheel of playerCar.wheelPivots) {
    wheel.pivot.rotation.y = wheel.isFront ? playerCar.steering : 0;
    wheel.tire.rotation.x += playerCar.speed * delta / 0.34;
  }
}

function toggleHomeLighting() {
  if (!isInsideHome) return;
  homeLightingEnabled = !homeLightingEnabled;
  for (const fixture of homeLightFixtures) {
    fixture.light.intensity = homeLightingEnabled ? fixture.intensity : 0;
    if (fixture.bulb) fixture.bulb.visible = homeLightingEnabled;
  }
  if (homeLightSwitchIndicator) {
    homeLightSwitchIndicator.material.color.setHex(homeLightingEnabled ? 0x709276 : 0x918e7e);
    homeLightSwitchIndicator.material.emissive.setHex(homeLightingEnabled ? 0x304b33 : 0x000000);
    homeLightSwitchIndicator.material.emissiveIntensity = homeLightingEnabled ? 0.35 : 0;
  }
  homeLightsAction.textContent = homeLightingEnabled ? 'LIGHTS OFF' : 'LIGHTS ON';
  homeLightsButton.setAttribute('aria-label', homeLightingEnabled ? 'Turn home lights off' : 'Turn home lights on');
  showToast(homeLightingEnabled ? 'The home lights are on.' : 'The home lights are off.');
}

function formatCredits(amount) {
  return `GC ${Math.max(0, Math.floor(amount)).toLocaleString()}`;
}

function formatNaira(amount) {
  return `₦${Math.max(0, Math.floor(amount)).toLocaleString('en-NG')}`;
}

function persistEconomy() {
  if (!saveEconomy(economyStorage, economy)) {
    showToast('This browser could not save your credits and purchases locally.', 3600);
    return false;
  }
  return true;
}

let lifeStorageWarningShown = false;
function persistLife() {
  if (saveLife(lifeStorage, life)) return true;
  if (!lifeStorageWarningShown) {
    lifeStorageWarningShown = true;
    showToast('This browser could not save your resident locally.', 3800);
  }
  return false;
}

function refreshRentalBilling(now = Date.now()) {
  const newPeriods = advanceRentalBilling(economy, now);
  if (newPeriods > 0) persistEconomy();
  return newPeriods;
}

function updateWalletBalances() {
  const balance = formatCredits(economy.wallet);
  setTextIfChanged(walletBalanceElement, balance);
  setTextIfChanged(cafeWalletBalanceElement, balance);
  setTextIfChanged(marketWalletBalanceElement, balance);
  setTextIfChanged(billboardsWalletBalanceElement, balance);
  setTextIfChanged(bankAccountIdElement, economy.accountId);
  setTextIfChanged(bankWalletBalanceElement, balance);
}

function getHouseLane(house) {
  return house.number <= 2 ? 'west lane' : 'east lane';
}

function renderRentalRoster() {
  const leasedHouseNumber = economy.lease?.houseNumber;
  const leaseActive = Boolean(economy.lease);
  const rows = RENTAL_LISTINGS.map((listing) => {
    const house = estateHouses.find((candidate) => candidate.number === listing.houseNumber);
    const isCurrentRental = leasedHouseNumber === listing.houseNumber;
    const moveInCost = listing.monthlyRent + listing.deposit;
    const actionLabel = isCurrentRental
      ? 'CURRENT RENTAL'
      : leaseActive
        ? 'END CURRENT LEASE FIRST'
        : `SIGN LEASE · ${formatCredits(moveInCost)}`;
    const disabled = leaseActive || economy.wallet < moveInCost || isInsideHome || isDriving || isRidingTransit;
    return `<div class="rental-listing">
      <div class="estate-home-row ${isCurrentRental ? 'estate-home-row--rented' : 'estate-home-row--listing'}">
        <span class="estate-home-number">${String(listing.houseNumber).padStart(2, '0')}</span>
        <span><strong>House ${String(listing.houseNumber).padStart(2, '0')} · ${house ? getHouseLane(house) : 'Unity Court'}</strong><small class="rental-listing-owner"><i aria-hidden="true">${listing.landlord[0]}</i>NPC landlord · ${listing.landlord}</small></span>
        <em class="${isCurrentRental ? 'estate-rented' : 'estate-available'}">${isCurrentRental ? 'RENTED' : 'AVAILABLE'}</em>
      </div>
      <div class="rental-listing-details"><span>Furnished cottage · ${Math.round(RENTAL_MONTH_MS / 86400000)}-day rolling lease</span><strong>${formatCredits(listing.monthlyRent)} / month · ${formatCredits(listing.deposit)} refundable deposit</strong></div>
      <button class="rental-action-button rental-listing-button" type="button" data-rent-house="${listing.houseNumber}" ${disabled ? 'disabled' : ''}>${actionLabel}</button>
    </div>`;
  }).join('');
  estateRosterElement.innerHTML = `<div class="estate-roster-heading"><span>UNITY COURT · NPC LANDLORDS</span><strong>4 HOMES</strong></div>
    <div class="estate-home-row estate-home-row--owned"><span class="estate-home-number">01</span><span><strong>Your owned home · ${getHouseLane(homeHouse)}</strong><small>Furnished · front porch · green mailbox</small></span><em>YOURS</em></div>${rows}`;
}

function renderLeaseManagement() {
  if (!economy.lease) {
    leaseManagementElement.innerHTML = '<div class="rental-lease-card"><div class="rental-lease-heading">No active rental <small>LEASES ARE OPTIONAL</small></div><p>Choose a cottage above to sign with its NPC landlord. The first month and refundable deposit are due at move-in.</p></div>';
    return;
  }
  const lease = economy.lease;
  const dueDate = new Date(lease.nextDueAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const dueText = lease.rentDue > 0
    ? `${formatCredits(lease.rentDue)} rent is due now. Next billing date: ${dueDate}.`
    : `Next ${formatCredits(lease.monthlyRent)} rent installment is due ${dueDate}.`;
  const isInsideRentedHome = isInsideHome && getCurrentResidence()?.number === lease.houseNumber;
  const payLabel = lease.rentDue > 0 ? `PAY RENT · ${formatCredits(lease.rentDue)}` : 'NO RENT DUE';
  leaseManagementElement.innerHTML = `<div class="rental-lease-card">
    <div class="rental-lease-heading">House ${String(lease.houseNumber).padStart(2, '0')} lease <small>LANDLORD · ${lease.landlord.toUpperCase()}</small></div>
    <p>${formatCredits(lease.monthlyRent)} per 30-day month · ${formatCredits(lease.deposit)} refundable deposit. ${dueText}</p>
    ${isInsideRentedHome ? '<p>Step outside before ending this lease.</p>' : ''}
    <div class="rental-actions">
      <button class="rental-action-button" type="button" data-rental-action="pay" ${lease.rentDue === 0 ? 'disabled' : ''}>${payLabel}</button>
      <button class="rental-action-button rental-action-button--quiet" type="button" data-rental-action="end" ${isInsideRentedHome ? 'disabled' : ''}>END LEASE</button>
    </div>
    ${lease.rentDue > 0 ? `<button class="rental-flutterwave-button" type="button" data-bank-rent>PREVIEW FLUTTERWAVE PAYMENT · ${formatNaira(lease.rentDue)}</button>` : ''}
  </div>`;
}

function renderPropertyPage() {
  refreshRentalBilling();
  updateWalletBalances();
  const residence = getCurrentResidence() || homeHouse;
  if (!residence) return;
  const number = String(residence.number).padStart(2, '0');
  propertyHouseNumberElement.textContent = number;
  propertyHomeLabelElement.textContent = residence.isHome ? 'OWNED HOME' : 'YOUR RENTAL';
  propertyHomeTitleElement.textContent = 'Unity Court';
  propertyHomeSubtitleElement.textContent = `House ${number} · ${getHouseLane(residence)}`;
  propertyInteriorLabelElement.textContent = isInsideHome ? 'CURRENT ROOM' : 'FURNISHED INTERIOR';
  propertyInteriorDescriptionElement.textContent = isInsideHome
    ? 'Living room · full kitchen · bedroom'
    : 'Move-in ready · living room · kitchen · bedroom';
  const statusText = economy.lease && !residence.isHome
    ? `HOUSE ${number} · RENTED FROM ${economy.lease.landlord.toUpperCase()}`
    : residence.isHome ? 'HOUSE 01 · OWNED HOME' : `HOUSE ${number} · ACTIVE RENTAL`;
  setTextIfChanged(residenceStatusElement.querySelector('span'), statusText);
  renderRentalRoster();
  renderLeaseManagement();
}

function getInventorySummary() {
  const inventory = Object.values(SHOP_CATALOG).flat()
    .filter((product) => economy.inventory[product.id] > 0)
    .map((product) => `${product.name} ×${economy.inventory[product.id]}`);
  return inventory.length ? inventory.join(' · ') : 'Nothing yet';
}

let selectedMallSpaceId = MALL_SHOP_SPACES[0].id;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isPlayerAtCommerceVenue(venueId) {
  return getNearbyCommerceVenue()?.venue.id === venueId;
}

function renderMallSpacesSection(isNearbyMall) {
  if (!mallShopSpacesElement || !mallShowcaseManagerElement) return;
  if (!getMallShopSpace(selectedMallSpaceId)) {
    const firstLeased = Object.keys(economy.shopLeases || {})[0];
    selectedMallSpaceId = firstLeased || MALL_SHOP_SPACES[0].id;
  }

  mallShopSpacesElement.innerHTML = MALL_SHOP_SPACES.map((space) => {
    const displayState = getMallShopDisplayState(economy, space.id);
    const isRented = displayState.isRented;
    const isSelected = space.id === selectedMallSpaceId;
    const moveInCost = space.monthlyRent + space.deposit;
    const canAfford = economy.wallet >= moveInCost;
    const sizeClass = `mall-size-badge--${space.sizeLabel.toLowerCase()}`;
    const goodsPills = displayState.displayedGoods.length
      ? displayState.displayedGoods.map((good) => `<span class="mall-good-pill">${escapeHtml(good.name)} · ${formatCredits(good.price)}</span>`).join('')
      : '<span class="mall-good-pill">No virtual goods displayed</span>';
    return `<div class="mall-space-card ${isRented ? 'is-rented' : ''} ${isSelected ? 'is-selected' : ''}">
      <div class="mall-space-header">
        <span class="mall-space-title">
          <strong>${escapeHtml(space.name)} · ${escapeHtml(displayState.shopName)}</strong>
          <small>${escapeHtml(space.wing)} · Manager ${escapeHtml(space.manager)} · up to ${space.maxDisplayItems} virtual goods</small>
        </span>
        <span class="mall-size-badge ${sizeClass}">${escapeHtml(space.sizeLabel.toUpperCase())} · ${space.areaSqm} m²</span>
      </div>
      <div class="mall-space-meta">
        <span>${formatCredits(space.monthlyRent)} / month · ${formatCredits(space.deposit)} deposit</span>
        <strong>${isRented ? 'YOUR SHOP SPACE' : `AVAILABLE · ${formatCredits(moveInCost)} MOVE-IN`}</strong>
      </div>
      <div class="mall-goods-pills">${goodsPills}</div>
      <div class="mall-space-actions">
        ${isRented
          ? `<button class="rental-action-button" type="button" data-select-mall-space="${space.id}">${isSelected ? 'MANAGING SHOWCASE BELOW' : 'MANAGE SHOWCASE & GOODS'}</button>`
          : `<button class="rental-action-button" type="button" data-rent-mall-space="${space.id}" ${!canAfford ? 'disabled' : ''}>RENT ${escapeHtml(space.sizeLabel.toUpperCase())} SPACE · ${formatCredits(moveInCost)}</button>
             <button class="rental-action-button rental-action-button--quiet" type="button" data-select-mall-space="${space.id}">${isSelected ? 'SELECTED' : 'INSPECT SPACE'}</button>`}
      </div>
    </div>`;
  }).join('');

  const selectedState = getMallShopDisplayState(economy, selectedMallSpaceId);
  if (!selectedState) {
    mallShowcaseManagerElement.innerHTML = '';
    return;
  }
  const { space, lease, isRented, displayedGoods } = selectedState;
  if (!isRented) {
    const moveInCost = space.monthlyRent + space.deposit;
    mallShowcaseManagerElement.innerHTML = `<div class="mall-showcase-card">
      <div class="rental-lease-heading">${escapeHtml(space.name)} (${escapeHtml(space.sizeLabel)} · ${space.areaSqm} m²) <small>AVAILABLE TO RENT</small></div>
      <p>Rent this ${escapeHtml(space.sizeLabel.toLowerCase())} mall unit from ${escapeHtml(space.manager)} to name your shop, display up to <strong>${space.maxDisplayItems} virtual goods</strong> in Unity Mall’s 3D storefront window, and collect showcase sales from shoppers.</p>
      <button class="rental-action-button" type="button" data-rent-mall-space="${space.id}" ${economy.wallet < moveInCost ? 'disabled' : ''}>SIGN SHOP LEASE · ${formatCredits(moveInCost)}</button>
    </div>`;
    return;
  }

  const allGoods = getAllVirtualGoods(economy);
  const displayedSet = new Set(lease.displayedGoods);
  const dueDate = new Date(lease.nextDueAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const catalogHtml = allGoods.map((good) => {
    const isDisplayed = displayedSet.has(good.id);
    const displayFull = !isDisplayed && lease.displayedGoods.length >= space.maxDisplayItems;
    return `<div class="mall-catalog-item ${isDisplayed ? 'is-displayed' : ''}">
      <span class="mall-catalog-copy">
        <strong>${escapeHtml(good.name)} (${formatCredits(good.price)})</strong>
        <small>${escapeHtml(good.category)} · ${isDisplayed ? 'Displayed in 3D window' : 'In virtual catalog'}</small>
      </span>
      <button class="rental-action-button ${isDisplayed ? 'rental-action-button--quiet' : ''}" type="button" data-toggle-mall-good="${good.id}" data-mall-space="${space.id}" ${displayFull ? 'disabled' : ''}>
        ${isDisplayed ? 'REMOVE' : displayFull ? 'WINDOW FULL' : 'DISPLAY IN 3D'}
      </button>
    </div>`;
  }).join('');

  const styleOptions = VIRTUAL_GOOD_STYLES.map(
    (style) => `<option value="${style.id}">${escapeHtml(style.label)}</option>`,
  ).join('');

  mallShowcaseManagerElement.innerHTML = `<div class="mall-showcase-card">
    <div class="rental-lease-heading">${escapeHtml(lease.shopName)} · ${escapeHtml(space.code)} (${escapeHtml(space.sizeLabel)} · ${space.areaSqm} m²) <small>${displayedGoods.length}/${space.maxDisplayItems} DISPLAYED</small></div>
    <p>${escapeHtml(lease.tagline)} · Total showcase sales: <strong>${formatCredits(lease.totalSales || 0)}</strong> · Next ${formatCredits(lease.monthlyRent)} rent due ${dueDate}.</p>
    <form class="mall-showcase-form" data-mall-shop-form="${space.id}">
      <div class="mall-form-row">
        <input class="mall-input" name="shopName" type="text" maxlength="26" minlength="2" value="${escapeHtml(lease.shopName)}" placeholder="Shop name" aria-label="Shop name" required>
        <input class="mall-input" name="tagline" type="text" maxlength="56" value="${escapeHtml(lease.tagline)}" placeholder="Window tagline" aria-label="Window tagline">
      </div>
      <button class="rental-action-button" type="submit">UPDATE 3D SHOP SIGN</button>
    </form>
    <div class="estate-roster-heading" style="margin-top:8px;"><span>VIRTUAL GOODS IN 3D WINDOW</span><strong>${displayedGoods.length} / ${space.maxDisplayItems} SLOTS</strong></div>
    <div class="mall-catalog-grid">${catalogHtml}</div>
    <form class="mall-custom-good-form" data-mall-custom-good-form="${space.id}">
      <div class="estate-roster-heading" style="margin-top:6px;"><span>CREATE YOUR OWN VIRTUAL GOOD</span><strong>ADD TO CATALOG &amp; WINDOW</strong></div>
      <div class="mall-form-row">
        <input class="mall-input" name="goodName" type="text" maxlength="28" minlength="2" placeholder="New virtual item name" aria-label="New virtual item name" required>
        <select class="mall-input" name="goodStyle" aria-label="3D display style">${styleOptions}</select>
      </div>
      <div class="mall-form-row">
        <input class="mall-input" name="goodPrice" type="number" min="5" max="500" step="5" value="55" aria-label="Virtual item price in GC" required>
        <button class="rental-action-button" type="submit">CREATE &amp; DISPLAY GOOD</button>
      </div>
    </form>
    <div class="rental-actions" style="margin-top:8px;">
      <button class="rental-action-button" type="button" data-mall-action="collect-sales" data-mall-space="${space.id}" ${!isNearbyMall || displayedGoods.length === 0 ? 'disabled' : ''}>
        ${isNearbyMall ? 'SERVE SHOPPERS · EARN GC' : 'VISIT MALL TO COLLECT SALES'}
      </button>
      <button class="rental-action-button rental-action-button--quiet" type="button" data-mall-action="${lease.rentDue > 0 ? 'pay-rent' : 'end-lease'}" data-mall-space="${space.id}">
        ${lease.rentDue > 0 ? `PAY SHOP RENT · ${formatCredits(lease.rentDue)}` : 'END SHOP LEASE'}
      </button>
    </div>
  </div>`;
}

function renderCommercePage(venueId) {
  refreshRentalBilling();
  updateWalletBalances();
  const products = SHOP_CATALOG[venueId];
  if (!products) return;
  const venue = commerceVenues.find((candidate) => candidate.id === venueId);
  const isNearby = isPlayerAtCommerceVenue(venueId);
  const proximityElement = venueId === 'cafe' ? cafeProximityElement : marketProximityElement;
  const inventoryElement = venueId === 'cafe' ? cafeInventoryElement : marketInventoryElement;
  const itemsElement = venueId === 'cafe' ? cafeShopItemsElement : marketShopItemsElement;
  if (venueId === 'market') {
    const nearbyBay = getNearbyMallShopBay()?.bay;
    const baySpace = nearbyBay ? getMallShopSpace(nearbyBay.spaceId) : null;
    proximityElement.textContent = isNearby
      ? baySpace
        ? `At Unity Mall · standing by ${baySpace.name} (${baySpace.sizeLabel} · ${baySpace.areaSqm} m²). Rent shop spaces, curate 3D virtual goods, or shop groceries.`
        : `Welcome to ${venue.name}. Rent shop spaces of different sizes, display virtual goods in 3D, or buy groceries.`
      : `Visit ${venue.name} in person to buy groceries or collect showcase sales. You can rent shop spaces and arrange virtual goods from anywhere.`;
  } else {
    proximityElement.textContent = isNearby
      ? `Welcome to ${venue.name}. Buy with game credits or preview Flutterwave checkout.`
      : `Visit ${venue.name} to buy or preview checkout. This menu can be browsed from anywhere.`;
  }
  proximityElement.classList.toggle('is-near', isNearby);
  proximityElement.classList.toggle('is-away', !isNearby);
  if (venueId === 'market') renderMallSpacesSection(isNearby);
  inventoryElement.textContent = getInventorySummary();
  itemsElement.innerHTML = products.map((product) => {
    const count = economy.inventory[product.id] || 0;
    const cannotAfford = economy.wallet < product.price;
    return `<div class="shop-item">
      <span class="shop-item-copy"><strong>${product.name}</strong><small>${product.description}</small><em>${product.category}${count > 0 ? ` · IN BAG ×${count}` : ''}</em></span>
      <span class="shop-item-actions">
        <button class="shop-buy-button" type="button" data-shop-buy="${product.id}" ${!isNearby || cannotAfford ? 'disabled' : ''}><span>BUY · GAME</span><strong>${formatCredits(product.price)}</strong></button>
        <button class="shop-flutterwave-button" type="button" data-bank-shop="${product.id}" aria-label="Preview demo Flutterwave payment for ${product.name}" ${!isNearby ? 'disabled' : ''}><span>PAY · DEMO</span><strong>${formatNaira(product.price)}</strong></button>
      </span>
    </div>`;
  }).join('');
}

function renderBankPage() {
  updateWalletBalances();
  bankLedgerElement.replaceChildren();
  const ledger = Array.isArray(economy.ledger) ? economy.ledger : [];
  bankLedgerEmptyElement.hidden = ledger.length > 0;
  for (const entry of ledger) {
    const row = document.createElement('div');
    row.className = 'bank-ledger-row';
    const copy = document.createElement('span');
    copy.className = 'bank-ledger-copy';
    const title = document.createElement('strong');
    title.textContent = entry.description;
    const date = document.createElement('small');
    date.textContent = Number.isFinite(entry.occurredAt) && entry.occurredAt > 0
      ? new Date(entry.occurredAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
      : 'Game account activity';
    copy.append(title, date);
    const amount = document.createElement('span');
    amount.className = `bank-ledger-amount${entry.amount > 0 ? ' is-credit' : ''}`;
    amount.textContent = `${entry.amount > 0 ? '+' : '−'} ${formatCredits(Math.abs(entry.amount))}`;
    row.append(copy, amount);
    bankLedgerElement.append(row);
  }
  bankCheckoutPreviewElement.hidden = !bankCheckoutIntent;
  if (bankCheckoutIntent) {
    bankIntentTitleElement.textContent = bankCheckoutIntent.title;
    bankIntentAmountElement.textContent = formatNaira(bankCheckoutIntent.amountNgn);
    bankIntentReferenceElement.textContent = bankCheckoutIntent.reference;
    bankIntentAccountElement.textContent = 'Not generated in demo mode';
    bankIntentMessageElement.textContent = bankCheckoutIntent.kind === 'topup'
      ? 'Demo only. No Flutterwave request was sent, no money was charged and no credits were added. The amount is a mock checkout input, not a live exchange rate or payment instruction.'
      : 'No Flutterwave request was sent. No money was charged, and the rent or shop purchase remains unpaid. This is a preview only.';
  }
}

function makeDemoPaymentReference(now = Date.now()) {
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase().padEnd(5, '0');
  return `VW-DEMO-${now.toString(36).toUpperCase()}-${suffix}`;
}

function startFlutterwaveDemoCheckout({ kind, title, amountNgn }) {
  if (!Number.isSafeInteger(amountNgn) || amountNgn < 1 || amountNgn > 100000) {
    const message = 'Enter a whole-number amount from ₦100 to ₦100,000.';
    if (activePhonePage === 'bank') bankInputFeedbackElement.textContent = message;
    else showToast(message);
    return;
  }
  bankCheckoutIntent = {
    kind,
    title,
    amountNgn,
    reference: makeDemoPaymentReference(),
  };
  bankInputFeedbackElement.textContent = '';
  if (!isPhoneOpen()) openPhone();
  setPhonePage('bank');
  showToast('Demo preview only · no Flutterwave request or charge was made.', 3600);
}

function previewBankTopup() {
  const rawAmount = bankTopupAmountInput.value.trim();
  const amountNgn = Number(rawAmount);
  if (!/^\d+$/.test(rawAmount) || !Number.isSafeInteger(amountNgn) || amountNgn < 100 || amountNgn > 100000) {
    bankInputFeedbackElement.textContent = 'Choose a whole-number amount from ₦100 to ₦100,000.';
    bankTopupAmountInput.focus();
    return;
  }
  startFlutterwaveDemoCheckout({
    kind: 'topup',
    title: 'Game-credit top-up preview',
    amountNgn,
  });
}

function previewShopPayment(productId) {
  const product = getProduct(productId);
  if (!product) return;
  const venueId = Object.keys(SHOP_CATALOG).find((key) => SHOP_CATALOG[key].some((item) => item.id === productId));
  const venue = commerceVenues.find((candidate) => candidate.id === venueId);
  if (!venueId || !venue || !isPlayerAtCommerceVenue(venueId)) {
    showToast('Visit the café or market in person before starting checkout.');
    return;
  }
  startFlutterwaveDemoCheckout({
    kind: 'direct',
    title: `${venue.name} · ${product.name}`,
    amountNgn: product.price,
  });
}

function previewRentPayment() {
  refreshRentalBilling();
  const lease = economy.lease;
  if (!lease || lease.rentDue < 1) {
    showToast('There is no rent due to preview right now.');
    return;
  }
  startFlutterwaveDemoCheckout({
    kind: 'direct',
    title: `House ${String(lease.houseNumber).padStart(2, '0')} rent · ${formatCredits(lease.rentDue)}`,
    amountNgn: lease.rentDue,
  });
}

function openCommercePage(venueId) {
  if (!SHOP_CATALOG[venueId]) return;
  if (venueId === 'market') {
    const nearbyBay = getNearbyMallShopBay()?.bay;
    if (nearbyBay) selectedMallSpaceId = nearbyBay.spaceId;
  }
  if (!isPhoneOpen()) openPhone();
  setPhonePage(venueId);
}

function rentMallShopFromPhone(spaceId) {
  const result = signMallShopLease(
    economy,
    spaceId,
    { residentName: life.profile?.created ? life.profile.name : '' },
    Date.now(),
  );
  if (!result.ok) {
    if (result.reason === 'space-already-leased') showToast('You already lease this mall shop space.');
    else if (result.reason === 'insufficient-funds') showToast(`Move-in needs ${formatCredits(result.cost)} for the first month and deposit.`);
    else showToast('That shop space could not be leased right now.');
    renderCommercePage('market');
    return;
  }
  selectedMallSpaceId = result.space.id;
  persistEconomy();
  syncMallShopBays3D();
  renderCommercePage('market');
  updateLocationAndMap();
  showToast(
    `Leased ${result.space.name} (${result.space.sizeLabel} · ${result.space.areaSqm} m²). Your virtual goods are now on display in Unity Mall’s 3D window!`,
    4200,
  );
}

function toggleMallGoodFromPhone(spaceId, goodId) {
  const result = toggleMallShopDisplayedGood(economy, spaceId, goodId);
  if (!result.ok) {
    if (result.reason === 'display-full') {
      showToast(`This shop window holds up to ${result.maxDisplayItems} virtual goods. Remove one or rent a larger mall unit.`);
    } else showToast('Could not update that virtual good right now.');
    return;
  }
  selectedMallSpaceId = spaceId;
  persistEconomy();
  syncMallShopBays3D();
  renderCommercePage('market');
  showToast(
    result.displayed
      ? `${result.good.name} placed in your 3D shop window.`
      : `${result.good.name} removed from your shop window.`,
    2600,
  );
}

function persistGovernment() {
  return saveGovernment(economyStorage, government);
}

function persistBillboards() {
  return saveBillboardState(billboards, economyStorage);
}

function handleMallActionFromPhone(action, spaceId) {
  selectedMallSpaceId = spaceId;
  if (action === 'collect-sales') {
    if (!isPlayerAtCommerceVenue('market')) {
      showToast('Walk to Unity Mall to serve shoppers and collect showcase sales.');
      return;
    }
    const result = collectMallShowcaseSales(economy, spaceId, Date.now());
    if (!result.ok) {
      showToast('Display at least one virtual good in your window before collecting sales.');
      return;
    }
    const activePolicy = getActiveGovernorPolicy(government);
    const policyMultiplier = activePolicy.mallSalesMultiplier || 1;
    const billboardBonuses = getBillboardBonuses(billboards);
    const adMultiplier = billboardBonuses.mallSalesBonusMultiplier || 1;
    const policyBonus = policyMultiplier > 1 ? Math.round(result.payout * (policyMultiplier - 1)) : 0;
    const adBonus = adMultiplier > 1 ? Math.round(result.payout * (adMultiplier - 1)) : 0;
    const totalBonus = policyBonus + adBonus;
    if (totalBonus > 0) {
      earnGameCredits(
        economy,
        `${result.lease.shopName} · Governor & Billboard promo bonus`,
        totalBonus,
        Date.now(),
      );
      result.lease.totalSales += totalBonus;
    }
    persistEconomy();
    renderCommercePage('market');
    showToast(
      `Showcase sales collected · +${formatCredits(result.payout + totalBonus)} from ${result.lease.shopName}${totalBonus > 0 ? ` (includes +${formatCredits(totalBonus)} policy & billboard ad bonus)` : ''}!`,
      3800,
    );
    return;
  }
  if (action === 'pay-rent') {
    const result = payMallShopRent(economy, spaceId, Date.now());
    persistEconomy();
    renderCommercePage('market');
    if (result.ok) showToast(`Shop rent paid · ${formatCredits(result.paid)} for ${result.space.name}.`);
    else if (result.reason === 'insufficient-funds') showToast(`You need ${formatCredits(result.due)} to pay shop rent.`);
    else showToast('No shop rent is due right now.');
    return;
  }
  if (action === 'end-lease') {
    const result = endMallShopLease(economy, spaceId, Date.now());
    if (!result.ok) return;
    persistEconomy();
    syncMallShopBays3D();
    renderCommercePage('market');
    updateLocationAndMap();
    showToast(
      `Ended lease for ${result.space.name} · ${formatCredits(result.refund)} deposit returned to your wallet.`,
      3400,
    );
  }
}

function renderGovernmentPage() {
  if (!governmentOfficeCardElement || !governmentPolicySectionElement || !governmentProjectsSectionElement) return;
  updateWalletBalances();
  const atHall = isPlayerAtCommunityHall();
  const activePolicy = getActiveGovernorPolicy(government);
  const activeTax = getActiveTaxRate(government);
  const nextPetition = getNextCivicPetition(government);
  const candidateName = life.profile?.created ? life.profile.name : 'Resident';

  setTextIfChanged(
    governmentTreasuryBalanceElement,
    `${formatCredits(government.treasury)} · ${government.approval}%`,
  );
  governmentProximityElement.textContent = atHall
    ? `At Unity Community Hall · hold town halls, canvass voters, or run gubernatorial business.`
    : `Current Governor: ${government.governorName} (Term ${government.termNumber}). Walk to Unity Community Hall for extra town-hall support.`;
  governmentProximityElement.classList.toggle('is-near', atHall);
  governmentProximityElement.classList.toggle('is-away', !atHall);

  const platformOptions = GOVERNOR_POLICIES.map(
    (policy) => `<option value="${policy.id}" ${government.campaignPlatformId === policy.id ? 'selected' : ''}>${escapeHtml(policy.title)}</option>`,
  ).join('');

  governmentOfficeCardElement.innerHTML = `<div class="mall-showcase-card">
    <div class="rental-lease-heading">
      <span>${government.isPlayerGovernor ? `Governor ${escapeHtml(government.governorName)} (You)` : `Governor ${escapeHtml(government.governorName)}`} · Term ${government.termNumber}</span>
      <small>${government.isPlayerGovernor ? 'IN OFFICE' : `YOUR POLLING · ${government.campaignSupport}%`}</small>
    </div>
    <p>${escapeHtml(government.lastElectionSummary)}</p>
    <p><strong>Active Charter:</strong> ${escapeHtml(activePolicy.title)} — ${escapeHtml(activePolicy.summary)}</p>
    <form class="mall-showcase-form" data-government-campaign-form>
      <div class="mall-form-row">
        <input class="mall-input" name="slogan" type="text" maxlength="64" minlength="2" value="${escapeHtml(government.campaignSlogan)}" placeholder="Campaign slogan" aria-label="Campaign slogan" required>
        <select class="mall-input" name="platformId" aria-label="Campaign platform">${platformOptions}</select>
      </div>
      <button class="rental-action-button" type="submit">UPDATE CAMPAIGN PLATFORM (+3% SUPPORT)</button>
    </form>
    <div class="mall-space-meta" style="margin-top:8px;">
      <span>Next Town Hall Petition: ${escapeHtml(nextPetition.citizen)}</span>
      <strong>+${formatCredits(nextPetition.treasuryGrant)} Treasury</strong>
    </div>
    <p style="margin:4px 0 8px;">“${escapeHtml(nextPetition.prompt)}”</p>
    <div class="rental-actions">
      <button class="rental-action-button" type="button" data-government-action="canvass">
        CANVASS NEIGHBOURS (+${atHall ? 12 : 7}% SUPPORT)
      </button>
      <button class="rental-action-button" type="button" data-government-action="town-hall">
        HOLD TOWN HALL (+${formatCredits(government.isPlayerGovernor ? nextPetition.governorStipend : Math.round(nextPetition.governorStipend * 0.5))} STIPEND)
      </button>
    </div>
    <button class="rental-action-button" style="width:100%;margin-top:6px;" type="button" data-government-action="run-election">
      ${government.isPlayerGovernor
        ? `SEEK RE-ELECTION AS GOVERNOR (${government.campaignSupport}% SUPPORT)`
        : `RUN FOR GOVERNOR AS ${escapeHtml(candidateName.toUpperCase())} (${government.campaignSupport}% SUPPORT · 51% NEEDED)`}
    </button>
  </div>`;

  governmentPolicySectionElement.innerHTML = `<div class="estate-roster-heading"><span>GOVERNOR’S EXECUTIVE POLICIES</span><strong>${government.isPlayerGovernor ? 'ACTIVE OFFICE' : 'WIN ELECTION TO ENACT'}</strong></div>
    <div class="mall-spaces-list">
      ${GOVERNOR_POLICIES.map((policy) => {
        const isCurrent = policy.id === government.activePolicyId;
        return `<div class="mall-space-card ${isCurrent ? 'is-rented is-selected' : ''}">
          <div class="mall-space-header">
            <span class="mall-space-title">
              <strong>${escapeHtml(policy.title)}</strong>
              <small>${escapeHtml(policy.summary)}</small>
            </span>
            <span class="mall-size-badge ${isCurrent ? 'mall-size-badge--medium' : ''}">${isCurrent ? 'ENACTED' : `+${policy.approvalDelta}% APPROVAL`}</span>
          </div>
          <div class="mall-space-actions">
            <button class="rental-action-button ${isCurrent ? 'rental-action-button--quiet' : ''}" type="button" data-governor-policy="${policy.id}" ${!government.isPlayerGovernor || isCurrent ? 'disabled' : ''}>
              ${isCurrent ? 'ACTIVE EXECUTIVE POLICY' : government.isPlayerGovernor ? 'ENACT POLICY' : 'GOVERNOR ONLY'}
            </button>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div class="estate-roster-heading" style="margin-top:9px;"><span>CIVIC REVENUE RATE</span><strong>${escapeHtml(activeTax.label.toUpperCase())}</strong></div>
    <div class="government-tax-row">
      ${TAX_RATES.map((rate) => {
        const isCurrent = rate.id === government.taxRateId;
        return `<button class="rental-action-button ${isCurrent ? '' : 'rental-action-button--quiet'}" type="button" data-governor-tax="${rate.id}" ${!government.isPlayerGovernor || isCurrent ? 'disabled' : ''}>${escapeHtml(rate.label)}</button>`;
      }).join('')}
    </div>`;

  governmentProjectsSectionElement.innerHTML = `<div class="estate-roster-heading"><span>PUBLIC WORKS · TREASURY ${formatCredits(government.treasury)}</span><strong>${government.completedProjects.length} / ${PUBLIC_PROJECTS.length} BUILT</strong></div>
    <div class="mall-spaces-list">
      ${PUBLIC_PROJECTS.map((project) => {
        const completed = government.completedProjects.includes(project.id);
        const canFund = government.isPlayerGovernor && !completed && government.treasury >= project.cost;
        return `<div class="mall-space-card ${completed ? 'is-rented' : ''}">
          <div class="mall-space-header">
            <span class="mall-space-title">
              <strong>${escapeHtml(project.name)}</strong>
              <small>${escapeHtml(project.description)}</small>
            </span>
            <span class="mall-size-badge ${completed ? 'mall-size-badge--medium' : 'mall-size-badge--anchor'}">${completed ? 'COMPLETED' : formatCredits(project.cost)}</span>
          </div>
          <div class="mall-space-meta">
            <span>+${project.approvalBoost}% citizen approval</span>
            <strong>+${formatCredits(project.treasuryReturn)} / town hall</strong>
          </div>
          <div class="mall-space-actions">
            <button class="rental-action-button" type="button" data-fund-project="${project.id}" ${!canFund ? 'disabled' : ''}>
              ${completed
                ? 'PUBLIC WORK COMPLETED'
                : !government.isPlayerGovernor
                  ? 'WIN GOVERNOR ELECTION TO COMMISSION'
                  : government.treasury < project.cost
                    ? `NEED ${formatCredits(project.cost)} IN TREASURY`
                    : `COMMISSION PROJECT · ${formatCredits(project.cost)}`}
            </button>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

function handleGovernmentActionFromPhone(action) {
  const atHall = isPlayerAtCommunityHall();
  const candidateName = life.profile?.created ? life.profile.name : 'Resident';
  if (action === 'canvass') {
    const result = canvassNeighboursForCampaign(government, { atCommunityHall: atHall });
    if (life.profile?.created) {
      connectWithNeighbour(life);
      persistLife();
    }
    persistGovernment();
    syncCommunityHall3D();
    renderGovernmentPage();
    showToast(
      `Canvassed neighbours${atHall ? ' at Unity Community Hall' : ''} · campaign support is now ${result.campaignSupport}%!`,
      3200,
    );
    return;
  }
  if (action === 'town-hall') {
    const result = holdCivicTownHall(government);
    earnGameCredits(
      economy,
      `Unity Community Hall · ${government.isPlayerGovernor ? 'Governor' : 'Civic'} town-hall stipend`,
      result.stipend,
      Date.now(),
    );
    if (life.profile?.created) {
      adjustLifeNeeds(life, { mood: 6, social: 8 });
      persistLife();
    }
    persistEconomy();
    persistGovernment();
    syncCommunityHall3D();
    renderGovernmentPage();
    showToast(
      `Town Hall resolved: ${result.petition.resolution} (+${formatCredits(result.treasuryAdded)} Treasury, +${formatCredits(result.stipend)} to your wallet)!`,
      4200,
    );
    return;
  }
  if (action === 'run-election') {
    const result = runGovernorElection(government, candidateName);
    persistGovernment();
    syncCommunityHall3D();
    renderGovernmentPage();
    updateLocationAndMap();
    if (result.won) {
      if (life.profile?.created) {
        adjustLifeNeeds(life, { mood: 15, social: 12 });
        persistLife();
      }
      showToast(
        `Congratulations, Governor ${result.governorName}! You won with ${result.voteShare}% of the Unity Court vote!`,
        4500,
      );
    } else {
      showToast(result.summary, 3800);
    }
  }
}

function enactPolicyFromPhone(policyId) {
  const result = enactGovernorPolicy(government, policyId);
  if (!result.ok) {
    showToast('Win the gubernatorial election to enact executive policies.');
    return;
  }
  persistGovernment();
  syncCommunityHall3D();
  renderGovernmentPage();
  updateLocationAndMap();
  showToast(`Enacted Governor Policy: ${result.policy.title}!`, 3400);
}

function setTaxRateFromPhone(taxRateId) {
  const result = setGovernorTaxRate(government, taxRateId);
  if (!result.ok) {
    showToast('Only the Governor can adjust the civic revenue rate.');
    return;
  }
  persistGovernment();
  syncCommunityHall3D();
  renderGovernmentPage();
  showToast(`Civic revenue rate set to ${result.rate.label}. Approval: ${result.approval}%.`, 3000);
}

function fundProjectFromPhone(projectId) {
  const result = fundPublicProject(government, projectId);
  if (!result.ok) {
    if (result.reason === 'insufficient-treasury') {
      showToast(`Treasury needs ${formatCredits(result.cost)} (currently ${formatCredits(result.treasury)}). Hold a town hall to raise civic funds.`);
    } else if (result.reason === 'not-governor') {
      showToast('Win the gubernatorial election before commissioning public works.');
    }
    return;
  }
  persistGovernment();
  syncCommunityHall3D();
  renderGovernmentPage();
  showToast(`Commissioned ${result.project.name}! Citizen approval rose to ${result.approval}%.`, 3800);
}

function getPlayerFirstMallShop() {
  const leasedSpaceIds = Object.keys(economy.shopLeases || {});
  if (!leasedSpaceIds.length) return null;
  const space = getMallShopSpace(leasedSpaceIds[0]);
  const lease = economy.shopLeases[leasedSpaceIds[0]];
  return space && lease ? { space, lease } : null;
}

function renderBillboardsPage() {
  if (!billboardsStudioSectionElement || !billboardsDirectorySectionElement) return;
  updateWalletBalances();
  if (!getBillboardById(selectedBillboardId)) {
    selectedBillboardId = BILLBOARD_LAYOUT[0].id;
  }
  const nearby = getNearbyBillboard()?.billboard;
  const bonuses = getBillboardBonuses(billboards);
  const display = getBillboardDisplayState(billboards, selectedBillboardId);
  const { billboard, isLeased, lease, theme } = display;

  billboardsProximityElement.textContent = nearby
    ? `Standing by ${nearby.name} (${nearby.code} · ${nearby.locationLabel}). Customize your 3D billboard ad or collect campaign revenue.`
    : `Active Leases: ${bonuses.activeLeaseCount} / ${BILLBOARD_LAYOUT.length} · Mall Sales Bonus: +${Math.round((bonuses.mallSalesBonusMultiplier - 1) * 100)}% · Total Ad Revenue: ${formatCredits(billboards.totalRevenueCollected || 0)}.`;
  billboardsProximityElement.classList.toggle('is-near', Boolean(nearby));
  billboardsProximityElement.classList.toggle('is-away', !nearby);

  const themeOptions = BILLBOARD_THEMES.map(
    (item) => `<option value="${item.id}" ${theme.id === item.id ? 'selected' : ''}>${escapeHtml(item.label)}</option>`,
  ).join('');
  const campaignTypeOptions = BILLBOARD_CAMPAIGN_TYPES.map(
    (item) => `<option value="${item.id}" ${display.campaignType.id === item.id ? 'selected' : ''}>${escapeHtml(item.label)}</option>`,
  ).join('');

  billboardsStudioSectionElement.innerHTML = `<div class="mall-showcase-card">
    <div class="rental-lease-heading">
      <span>${escapeHtml(billboard.code)} · ${escapeHtml(billboard.name)}</span>
      <small>${isLeased ? `LEASED BY YOU · ${billboard.dailyImpressions.toLocaleString()} VIEWS/DAY` : `AVAILABLE · ${formatCredits(billboard.leaseCost)}`}</small>
    </div>
    <p><strong>Strategic Corridor:</strong> ${escapeHtml(billboard.corridor)} (${escapeHtml(billboard.locationLabel)}) · Est. Payout: <strong>+${formatCredits(billboard.payoutPerCollection)}</strong> / collection.</p>
    <div class="billboard-live-preview" style="background:linear-gradient(160deg, ${theme.bgTop}, ${theme.bgBottom});border-color:${theme.accent};color:${theme.text};">
      <span class="billboard-live-preview-badge" style="background:${theme.badgeBg};color:${theme.accent};">${escapeHtml(display.badge)}</span>
      <strong>${escapeHtml(display.headline)}</strong>
      <p>${escapeHtml(display.subline)}</p>
      <span class="billboard-live-preview-cta" style="background:${theme.accent};">${escapeHtml(display.cta)}</span>
    </div>
    ${isLeased
      ? `<div class="estate-roster-heading" style="margin-top:8px;"><span>ONE-CLICK CAMPAIGN PRESETS</span><strong>SYNC 3D BOARD</strong></div>
        <div class="billboard-preset-row">
          <button class="rental-action-button rental-action-button--quiet" type="button" data-billboard-preset="mall" data-billboard-id="${billboard.id}">MALL SHOP AD</button>
          <button class="rental-action-button rental-action-button--quiet" type="button" data-billboard-preset="civic" data-billboard-id="${billboard.id}">GOVERNOR AD</button>
          <button class="rental-action-button rental-action-button--quiet" type="button" data-billboard-preset="brand" data-billboard-id="${billboard.id}">BRAND SPOTLIGHT</button>
        </div>
        <form class="mall-showcase-form" data-billboard-campaign-form="${billboard.id}">
          <div class="mall-form-row">
            <input class="mall-input" name="headline" type="text" maxlength="46" minlength="2" value="${escapeHtml(lease.headline)}" placeholder="Billboard headline" aria-label="Billboard headline" required>
            <input class="mall-input" name="badge" type="text" maxlength="38" minlength="2" value="${escapeHtml(lease.badge)}" placeholder="Top badge label" aria-label="Top badge label" required>
          </div>
          <div class="mall-form-row">
            <input class="mall-input" name="subline" type="text" maxlength="68" minlength="2" value="${escapeHtml(lease.subline)}" placeholder="Subheadline message" aria-label="Subheadline message" required>
            <input class="mall-input" name="cta" type="text" maxlength="28" minlength="2" value="${escapeHtml(lease.cta)}" placeholder="Call to action" aria-label="Call to action" required>
          </div>
          <div class="mall-form-row">
            <select class="mall-input" name="theme" aria-label="Billboard color theme">${themeOptions}</select>
            <select class="mall-input" name="campaignType" aria-label="Campaign focus">${campaignTypeOptions}</select>
          </div>
          <button class="rental-action-button" type="submit">PUBLISH LIVE TO 3D BILLBOARD</button>
        </form>
        <div class="rental-actions" style="margin-top:8px;">
          <button class="rental-action-button" type="button" data-billboard-action="collect" data-billboard-id="${billboard.id}">
            COLLECT AD REVENUE (+${formatCredits(billboard.payoutPerCollection)}+)
          </button>
          <button class="rental-action-button rental-action-button--quiet" type="button" data-billboard-action="end-lease" data-billboard-id="${billboard.id}">
            END BILLBOARD LEASE
          </button>
        </div>`
      : `<div class="rental-actions" style="margin-top:8px;">
          <button class="rental-action-button" type="button" data-rent-billboard="${billboard.id}" ${economy.wallet < billboard.leaseCost ? 'disabled' : ''}>
            ${economy.wallet < billboard.leaseCost
              ? `NEED ${formatCredits(billboard.leaseCost)} TO LEASE`
              : `LEASE ${escapeHtml(billboard.code)} BILLBOARD · ${formatCredits(billboard.leaseCost)}`}
          </button>
        </div>`}
  </div>`;

  billboardsDirectorySectionElement.innerHTML = `<div class="estate-roster-heading"><span>STRATEGIC LOCATIONS · 5 CORRIDORS</span><strong>${bonuses.activeLeaseCount} LEASED</strong></div>
    <div class="mall-spaces-list">
      ${BILLBOARD_LAYOUT.map((spec) => {
        const specDisplay = getBillboardDisplayState(billboards, spec.id);
        const isSelected = spec.id === selectedBillboardId;
        const canAfford = economy.wallet >= spec.leaseCost;
        return `<div class="mall-space-card ${specDisplay.isLeased ? 'is-rented' : ''} ${isSelected ? 'is-selected' : ''}">
          <div class="mall-space-header">
            <span class="mall-space-title">
              <strong>${escapeHtml(spec.code)} · ${escapeHtml(spec.name)}</strong>
              <small>${escapeHtml(spec.corridor)} · ${spec.dailyImpressions.toLocaleString()} daily views</small>
            </span>
            <span class="mall-size-badge ${specDisplay.isLeased ? 'mall-size-badge--medium' : 'mall-size-badge--small'}">
              ${specDisplay.isLeased ? 'YOUR AD LIVE' : formatCredits(spec.leaseCost)}
            </span>
          </div>
          <div class="mall-space-meta">
            <span>Ad: “${escapeHtml(specDisplay.headline)}”</span>
            <strong>+${formatCredits(spec.payoutPerCollection)} / payout</strong>
          </div>
          <div class="mall-space-actions">
            <button class="rental-action-button ${isSelected ? '' : 'rental-action-button--quiet'}" type="button" data-select-billboard="${spec.id}">
              ${isSelected ? 'SELECTED IN STUDIO' : 'OPEN IN STUDIO'}
            </button>
            ${specDisplay.isLeased
              ? `<button class="rental-action-button" type="button" data-billboard-action="collect" data-billboard-id="${spec.id}">COLLECT REVENUE</button>`
              : `<button class="rental-action-button" type="button" data-rent-billboard="${spec.id}" ${!canAfford ? 'disabled' : ''}>LEASE · ${formatCredits(spec.leaseCost)}</button>`}
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

function rentBillboardFromPhone(billboardId) {
  const residentName = life.profile?.created ? life.profile.name : 'Abuja Resident';
  const firstShop = getPlayerFirstMallShop();
  const result = rentBillboard(billboards, economy, billboardId, {
    advertiserName: residentName,
    badge: firstShop ? `UNITY MALL · ${firstShop.space.code}` : `${residentName.toUpperCase()} · ABUJA`,
    headline: firstShop ? firstShop.lease.shopName.toUpperCase() : `${residentName.toUpperCase()} LIVE IN ABUJA`,
    subline: firstShop ? firstShop.lease.tagline : undefined,
    cta: firstShop ? 'VISIT UNITY MALL' : 'OPEN PHONE',
    campaignType: firstShop ? 'mall' : undefined,
  });
  if (!result.ok) {
    if (result.reason === 'already-leased') showToast('You already lease this strategic billboard.');
    else if (result.reason === 'insufficient-funds') showToast(`You need ${formatCredits(result.needed)} to lease this billboard.`);
    else showToast('Could not lease that billboard right now.');
    return;
  }
  selectedBillboardId = result.billboard.id;
  persistEconomy();
  persistBillboards();
  syncBillboards3D();
  renderBillboardsPage();
  drawMap();
  updateLocationAndMap();
  showToast(
    `Leased ${result.billboard.name} (${result.billboard.code})! Your 3D billboard ad is now live at ${result.billboard.locationLabel}.`,
    4000,
  );
}

function applyBillboardPresetFromPhone(billboardId, presetType) {
  const residentName = life.profile?.created ? life.profile.name : 'Abuja Resident';
  const residentOrigin = life.profile?.created ? life.profile.origin : 'Abuja';
  const firstShop = getPlayerFirstMallShop();
  const result = applyQuickBillboardPreset(billboards, billboardId, presetType, {
    residentName,
    residentOrigin,
    shopName: firstShop?.lease.shopName,
    shopTagline: firstShop?.lease.tagline,
    shopCode: firstShop?.space.code,
    campaignSlogan: government.campaignSlogan,
    isPlayerGovernor: government.isPlayerGovernor,
  });
  if (!result.ok) {
    showToast('Lease this billboard first to apply a campaign preset.');
    return;
  }
  selectedBillboardId = billboardId;
  if (presetType === 'civic') {
    canvassNeighboursForCampaign(government, { atCommunityHall: false });
    persistGovernment();
    syncCommunityHall3D();
  }
  persistBillboards();
  syncBillboards3D();
  renderBillboardsPage();
  showToast(
    presetType === 'mall'
      ? `3D Billboard updated to promote "${result.lease.headline}" (+15% Unity Mall showcase sales)!`
      : presetType === 'civic'
        ? `3D Billboard updated with your Governor campaign (+7% voter support)!`
        : `3D Billboard updated with "${result.lease.headline}"!`,
    3600,
  );
}

function handleBillboardActionFromPhone(action, billboardId) {
  selectedBillboardId = billboardId;
  if (action === 'collect') {
    const activePolicy = getActiveGovernorPolicy(government);
    const hasMallShop = Boolean(getPlayerFirstMallShop());
    const result = collectBillboardRevenue(billboards, economy, billboardId, {
      hasMallShop,
      policyMultiplier: activePolicy.mallSalesMultiplier || 1,
    });
    if (!result.ok) {
      showToast('Lease this billboard first to collect ad revenue.');
      return;
    }
    persistEconomy();
    persistBillboards();
    renderBillboardsPage();
    showToast(
      `Collected +${formatCredits(result.payout)} ad revenue from ${result.billboard.code} (${result.impressions.toLocaleString()} daily views)!`,
      3600,
    );
    return;
  }
  if (action === 'end-lease') {
    const result = endBillboardLease(billboards, billboardId);
    if (!result.ok) return;
    persistBillboards();
    syncBillboards3D();
    renderBillboardsPage();
    drawMap();
    updateLocationAndMap();
    showToast(`Ended billboard lease for ${result.billboard.name} (${result.billboard.code}).`, 3000);
  }
}

function rentHouseFromPhone(houseNumber) {
  if (isInsideHome || isDriving || isRidingTransit) {
    showToast('Step outside and leave your vehicle before signing a new lease.');
    return;
  }
  const result = signRentalLease(economy, houseNumber, Date.now());
  if (!result.ok) {
    if (result.reason === 'lease-active') showToast('End your current lease before renting another house.');
    else if (result.reason === 'insufficient-funds') showToast(`Move-in needs ${formatCredits(result.cost)} for the deposit and first month.`);
    else showToast('That rental listing is no longer available.');
    renderPropertyPage();
    return;
  }
  const residence = estateHouses.find((house) => house.number === result.listing.houseNumber);
  if (!residence) return;
  setActiveResidence(residence);
  setResidenceInteriorVisible(residence, false);
  placePlayerOutsideResidence(residence);
  persistEconomy();
  renderPropertyPage();
  updateLocationAndMap();
  closePhone();
  showToast(`Lease signed with ${result.listing.landlord}. House ${String(residence.number).padStart(2, '0')} is ready; first month and deposit paid.`, 4200);
}

function payRentFromPhone() {
  const result = payRentalRent(economy, Date.now());
  persistEconomy();
  renderPropertyPage();
  if (result.ok) showToast(`Rent paid · ${formatCredits(result.paid)} from your game credits.`);
  else if (result.reason === 'insufficient-funds') showToast(`You need ${formatCredits(result.due)} to clear rent due.`);
  else showToast('No rent is due yet.');
}

function endRentalFromPhone() {
  const leasedHouse = economy.lease
    ? estateHouses.find((house) => house.number === economy.lease.houseNumber)
    : null;
  if (isInsideHome && getCurrentResidence() === leasedHouse) {
    showToast('Step outside the rental before ending the lease.');
    return;
  }
  const result = endRentalLease(economy, Date.now());
  if (!result.ok) return;
  if (leasedHouse) setResidenceInteriorVisible(leasedHouse, false);
  setActiveResidence(homeHouse);
  placePlayerOutsideResidence(homeHouse);
  persistEconomy();
  renderPropertyPage();
  updateLocationAndMap();
  closePhone();
  const moveOutMessage = result.refund > 0
    ? `Lease ended · ${formatCredits(result.refund)} deposit returned. You’re home at House 01.`
    : result.unpaidAfterDeposit > 0
      ? 'Lease ended · the deposit was kept and remaining rent was settled with the landlord. You’re home at House 01.'
      : 'Lease ended · the deposit was applied to outstanding rent. You’re home at House 01.';
  showToast(moveOutMessage, 4200);
}

function buyShopItem(productId) {
  const product = getProduct(productId);
  if (!product) return;
  const venueId = Object.keys(SHOP_CATALOG).find((key) => SHOP_CATALOG[key].some((item) => item.id === productId));
  if (!venueId || !isPlayerAtCommerceVenue(venueId)) {
    showToast('Visit the café or market in person before buying.');
    return;
  }
  const result = purchaseProduct(economy, productId);
  if (!result.ok) {
    showToast(`Not enough game credits · ${formatCredits(result.price)} needed.`);
    renderCommercePage(venueId);
    return;
  }
  persistEconomy();
  renderCommercePage(venueId);
  showToast(`Bought ${result.product.name} · ${formatCredits(result.product.price)}. Added to your bag.`);
}

function renderLifeNeeds() {
  const labels = [
    ['energy', 'Energy'],
    ['hunger', 'Fullness'],
    ['hygiene', 'Freshness'],
    ['mood', 'Mood'],
    ['social', 'Connection'],
  ];
  lifeNeedsElement.innerHTML = labels.map(([key, label]) => {
    const value = Math.round(life.needs[key]);
    const level = value < 25 ? 'low' : 'steady';
    return `<div class="life-need-row" data-level="${level}">
      <span class="life-need-label">${label}</span>
      <div class="life-need-track" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}"><span class="life-need-fill" style="width:${value}%"></span></div>
      <span class="life-need-value">${value}%</span>
    </div>`;
  }).join('');
}

function renderLifePage() {
  const profile = life.profile;
  const career = life.career;
  const rank = Math.min(3, career.rank);
  const rankName = getLifeRank(rank);
  const firstName = profile.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  setTextIfChanged(document.querySelector('#life-resident-avatar'), firstName || 'R');
  setTextIfChanged(document.querySelector('#life-resident-name'), profile.name);
  setTextIfChanged(document.querySelector('#life-resident-origin'), `From ${profile.origin} · Unity Court`);
  setTextIfChanged(document.querySelector('#life-rank-chip'), rankName.toUpperCase());
  setTextIfChanged(document.querySelector('#life-rank-label'), rankName);
  setTextIfChanged(document.querySelector('#life-career-xp'), career.xp);
  const careerProgress = document.querySelector('#life-career-progress');
  careerProgress.max = 120;
  careerProgress.value = rank >= 3 ? 120 : career.xp % 120;
  careerProgress.setAttribute('aria-label', `${career.xp} career XP; ${rank >= 3 ? 'top rank reached' : `${120 - (career.xp % 120)} XP to next rank`}`);

  lifeNameEditInput.value = profile.name;
  lifeOriginEditInput.value = profile.origin;
  lifeOutfitEditInput.value = profile.outfit;
  renderLifeNeeds();

  const foodProducts = Object.values(SHOP_CATALOG).flat().filter((product) => economy.inventory[product.id] > 0);
  lifeFoodInventoryElement.innerHTML = foodProducts.length
    ? foodProducts.map((product) => `<div class="life-food-row"><span>${escapeHTML(product.name)}</span><small>×${economy.inventory[product.id]}</small><button type="button" data-food-use="${escapeHTML(product.id)}">Eat</button></div>`).join('')
    : '<p class="life-food-empty">Your bag is empty. Pick up a snack at Civic Café or Unity Market, then use it here.</p>';

  const progress = getLifeGoalProgress(life);
  setTextIfChanged(document.querySelector('#life-goal-progress'), `${progress.completed} / ${progress.total}`);
  lifeGoalListElement.innerHTML = LIFE_GOALS.map(({ id, label }) => {
    const complete = Boolean(life.goals[id]);
    return `<li class="${complete ? 'is-complete' : ''}"><span class="life-goal-check" aria-hidden="true">${complete ? '✓' : ''}</span><span>${escapeHTML(label)}</span></li>`;
  }).join('');
  const restButton = document.querySelector('#life-rest-button');
  const restHint = document.querySelector('#life-rest-hint');
  restButton.disabled = !isInsideHome;
  restHint.textContent = isInsideHome ? 'You’re home · restore energy' : 'Go inside your home first';
}

function isAtLifeWorkplace(job) {
  if (isInsideHome || isDriving || isRidingTransit || isWatchingMatch) return false;
  if (job.workplace === 'cafe' || job.workplace === 'market') return isPlayerAtCommerceVenue(job.workplace);
  return job.workplace === 'stadium' && Math.hypot(player.position.x - STADIUM.x, player.position.z - STADIUM.z) < 24;
}

function renderWorkPage() {
  const selectedJob = getSelectedLifeJob(life);
  const rankName = getLifeRank(life.career.rank);
  workCareerSummaryElement.innerHTML = `<span>CAREER · ${escapeHTML(rankName.toUpperCase())}</span><strong>${life.career.xp} XP · ${life.career.shifts} ${life.career.shifts === 1 ? 'shift' : 'shifts'}</strong>`;
  workJobListElement.innerHTML = LIFE_JOBS.map((job) => {
    const selected = job.id === selectedJob.id;
    const active = Boolean(life.activeShift);
    return `<article class="work-job-card ${selected ? 'is-selected' : ''}">
      <div><span><strong>${escapeHTML(job.title)}</strong><small>${escapeHTML(job.workplaceName)} · ${escapeHTML(job.blurb)}</small></span><em>from ${formatCredits(job.basePay)}</em></div>
      <button type="button" data-life-job="${escapeHTML(job.id)}" ${active ? 'disabled' : ''}>${active ? 'Shift in progress' : selected ? 'Selected role' : 'Choose this role'}</button>
    </article>`;
  }).join('');

  if (life.activeShift) {
    const job = LIFE_JOBS.find(({ id }) => id === life.activeShift.jobId) || selectedJob;
    const task = getActiveShiftTask(life);
    if (!task) {
      workShiftPanelElement.innerHTML = '<p>Your shift is complete. Open the job board again to choose another role.</p>';
      return;
    }
    const orderNumber = life.activeShift.taskIndex + 1;
    workShiftPanelElement.innerHTML = `<span class="work-shift-kicker">ON SHIFT · ${escapeHTML(job.workplaceName.toUpperCase())}</span>
      <h3>Neighbour ${orderNumber} of ${job.tasks.length}</h3>
      <p>${escapeHTML(task.prompt)}</p>
      <div>${task.options.map((option) => `<button type="button" data-shift-answer="${escapeHTML(option.id)}">${escapeHTML(option.label)}</button>`).join('')}</div>
      <p class="life-soft-note">Serve all three neighbours to finish your shift. Your pay is fictional game credit.</p>`;
    return;
  }

  const atWorkplace = isAtLifeWorkplace(selectedJob);
  const hasEnergy = life.needs.energy >= 18;
  const canClockIn = life.profile.created && atWorkplace && hasEnergy;
  const clockInLabel = !life.profile.created
    ? 'Create your resident first'
    : !atWorkplace
      ? `Walk to ${selectedJob.workplaceName} to clock in`
      : !hasEnergy
        ? 'Rest at home before your shift'
        : `Clock in at ${selectedJob.workplaceName}`;
  const requirement = !life.profile.created
    ? 'Begin your resident story before choosing a job.'
    : !atWorkplace
      ? `You need to be at ${selectedJob.workplaceName}. Check the map, walk there and open this page again.`
      : !hasEnergy
        ? 'Your energy is low. Rest inside your home, then come back.'
        : 'Help three neighbours with quick counter or matchday requests.';
  workShiftPanelElement.innerHTML = `<span class="work-shift-kicker">YOUR NEXT SHIFT · ${escapeHTML(selectedJob.title.toUpperCase())}</span>
    <h3>${escapeHTML(selectedJob.workplaceName)}</h3>
    <p>${escapeHTML(requirement)}</p>
    <button type="button" data-life-action="clock-in" ${canClockIn ? '' : 'disabled'}>${escapeHTML(clockInLabel)}</button>`;
}

function useFoodFromBag(productId) {
  const consumed = consumeProduct(economy, productId);
  if (!consumed.ok) {
    showToast(consumed.reason === 'not-in-inventory' ? 'That item is no longer in your bag.' : 'That item is not available.');
    renderLifePage();
    return;
  }
  const meal = enjoyMeal(life, productId);
  if (!meal.ok) {
    showToast('That item is not a meal.');
    persistEconomy();
    renderLifePage();
    return;
  }
  persistEconomy();
  persistLife();
  renderLifePage();
  showToast(`You enjoyed ${consumed.product.name}. Fullness and mood refreshed.`);
}

function beginSelectedWorkShift() {
  const job = getSelectedLifeJob(life);
  if (!isAtLifeWorkplace(job)) {
    showToast(`Walk to ${job.workplaceName} before clocking in.`);
    renderWorkPage();
    return;
  }
  const result = startLifeShift(life, job.workplace);
  if (!result.ok) {
    const message = result.reason === 'profile-needed'
      ? 'Create your resident before clocking in.'
      : result.reason === 'too-tired'
        ? 'Your energy is low. Rest inside your home first.'
        : 'Finish your current shift before starting another.';
    showToast(message);
    renderWorkPage();
    return;
  }
  persistLife();
  renderWorkPage();
  showToast(`You’re on shift at ${job.workplaceName}. Help three neighbours to earn game credits.`, 3400);
}

function answerWorkShift(optionId) {
  const result = answerLifeShiftTask(life, optionId);
  if (!result.ok) {
    showToast(result.reason === 'invalid-answer' ? 'Choose one of the listed responses.' : 'There is no active shift.');
    renderWorkPage();
    return;
  }
  persistLife();
  if (result.complete) {
    const activePolicy = getActiveGovernorPolicy(government);
    const totalPay = Math.round(result.reward * (activePolicy.workPayMultiplier || 1));
    const creditResult = earnGameCredits(economy, `${result.job.workplaceName} · shift pay`, totalPay);
    if (creditResult.ok) {
      persistEconomy();
      updateWalletBalances();
    }
    renderWorkPage();
    if (activePhonePage === 'life') renderLifePage();
    const promotion = result.rankUp ? ` Promotion earned: ${getLifeRank(result.rank)}.` : '';
    showToast(`Shift complete · ${formatCredits(totalPay)} added to your game wallet · ${result.correctAnswers}/3 good calls.${promotion}`, 4200);
    return;
  }
  renderWorkPage();
  showToast(result.message, 2400);
}

function performLifeAction(action) {
  if (action === 'rest') {
    const result = restAtHome(life, isInsideHome);
    if (!result.ok) {
      showToast('Walk to your home and press E to step inside before resting.');
      return;
    }
    persistLife();
    renderLifePage();
    showToast('A quiet rest at home restored some energy.');
  } else if (action === 'message-nia') {
    connectWithNeighbour(life);
    persistLife();
    phoneUnread = false;
    updatePhoneBadge();
    setPhonePage('messages');
    appendPhoneMessage('outgoing', `Hi Nia, ${life.profile.name} here. I’m finding my feet in Abuja.`);
    const response = 'Lovely to hear from you. Take it one corner at a time — I’m around if you need a tip.';
    appendPhoneMessage('incoming', response);
    phoneMessagePreview.textContent = response;
    showToast('A friendly check-in with Nia lifted your spirits.');
  } else if (action === 'clock-in') {
    beginSelectedWorkShift();
  }
}

const phonePageCopy = {
  home: { eyebrow: 'YOUR POCKET GUIDE', title: 'Abuja, your neighbourhood', subtitle: 'Useful things for wherever the path takes you.' },
  map: { eyebrow: 'ABUJA · FCT · LIVE', title: 'Field map', subtitle: 'Find your place and see what’s close.' },
  messages: { eyebrow: 'YOUR NEIGHBOURHOOD', title: 'Messages', subtitle: 'A small check-in from someone nearby.' },
  journal: { eyebrow: 'FIELD NOTES · PRIVATE', title: 'Journal', subtitle: 'A note to keep, just for you.' },
  quests: { eyebrow: 'YOUR PROGRESS', title: 'Small things to do', subtitle: 'A gentle reason to keep wandering.' },
  property: { eyebrow: 'UNITY COURT · HOMES', title: 'Homes & rentals', subtitle: 'Meet local landlords and manage your lease.' },
  cafe: { eyebrow: 'CIVIC CAFÉ · ABUJA', title: 'A little something', subtitle: 'Fresh food and a warm drink for the road.' },
  market: { eyebrow: 'UNITY MALL · SHOPS & GROCERIES', title: 'Unity Mall', subtitle: 'Rent shop spaces, display virtual goods, and shop.' },
  government: { eyebrow: 'UNITY COURT · CIVIC SEAT', title: 'Governor’s Office', subtitle: 'Run for Governor, enact policies, and fund public works.' },
  billboards: { eyebrow: 'ABUJA MEDIA · 5 CORRIDORS', title: 'Strategic Billboards', subtitle: 'Lease high-visibility 3D billboards and run live ad campaigns.' },
  bank: { eyebrow: 'ABUJA GAME WALLET · GAME ACCOUNT', title: 'Your game wallet', subtitle: 'Check your credits and preview payment flows.' },
  life: { eyebrow: 'YOUR RESIDENT · LOCAL SAVE', title: 'Life in Abuja', subtitle: 'Look after your needs, make your own routine.' },
  work: { eyebrow: 'NEIGHBOURHOOD JOB BOARD', title: 'Work & progression', subtitle: 'Pick a role, show up and help your neighbours.' },
};

function updatePhoneBadge() {
  phoneNotificationDot.hidden = !phoneUnread;
  phoneMessageBadge.hidden = !phoneUnread;
  const phoneLabel = phoneUnread ? 'Open your phone · unread message' : 'Open your phone';
  phoneButton.setAttribute('aria-label', phoneLabel);
  phoneButton.title = `${phoneLabel} (P)`;
}

function setPhonePage(pageName) {
  const page = phonePageCopy[pageName] ? pageName : 'home';
  activePhonePage = page;
  for (const phonePage of phoneContent.querySelectorAll('[data-phone-page]')) {
    phonePage.hidden = phonePage.dataset.phonePage !== page;
  }
  phonePageEyebrow.textContent = phonePageCopy[page].eyebrow;
  phonePageTitle.textContent = phonePageCopy[page].title;
  phonePageSubtitle.textContent = phonePageCopy[page].subtitle;
  phoneBackButton.hidden = page === 'home';
  phoneContent.scrollTop = 0;
  if (page === 'property') renderPropertyPage();
  else if (page === 'cafe' || page === 'market') renderCommercePage(page);
  else if (page === 'government') renderGovernmentPage();
  else if (page === 'billboards') renderBillboardsPage();
  else if (page === 'bank') renderBankPage();
  else if (page === 'life') renderLifePage();
  else if (page === 'work') renderWorkPage();
  if (page === 'messages') {
    phoneUnread = false;
    updatePhoneBadge();
  }
  if (page === 'map') drawMap();
  if (isPhoneOpen()) {
    const focusTarget = page === 'home' ? phoneContent.querySelector('[data-phone-app="map"]') : phoneBackButton;
    focusTarget?.focus({ preventScroll: true });
  }
}

function openPhone() {
  if (isPhoneOpen()) return;
  window.clearTimeout(phoneCloseTimer);
  previousPhoneFocus = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
    ? document.activeElement
    : phoneButton;
  phonePanel.hidden = false;
  phoneScrim.hidden = false;
  phonePanel.inert = false;
  phonePanel.setAttribute('aria-hidden', 'false');
  phoneScrim.setAttribute('aria-hidden', 'false');
  phoneButton.setAttribute('aria-expanded', 'true');
  pressedKeys.clear();
  resetJoystick();
  velocity.x = 0;
  velocity.z = 0;
  jumpRequested = false;
  jumpBufferTimer = 0;
  phonePanel.offsetWidth;
  phonePanel.classList.add('is-open');
  phoneScrim.classList.add('is-open');
  phoneCloseButton.focus({ preventScroll: true });
  if (activePhonePage === 'map') drawMap();
  else if (activePhonePage === 'life') renderLifePage();
  else if (activePhonePage === 'work') renderWorkPage();
  else if (activePhonePage === 'cafe' || activePhonePage === 'market') renderCommercePage(activePhonePage);
  else if (activePhonePage === 'government') renderGovernmentPage();
  else if (activePhonePage === 'billboards') renderBillboardsPage();
  else if (activePhonePage === 'property') renderPropertyPage();
}

function closePhone() {
  if (!isPhoneOpen()) return;
  phonePanel.classList.remove('is-open');
  phoneScrim.classList.remove('is-open');
  phonePanel.setAttribute('aria-hidden', 'true');
  phoneScrim.setAttribute('aria-hidden', 'true');
  phonePanel.inert = true;
  phoneButton.setAttribute('aria-expanded', 'false');
  window.clearTimeout(phoneCloseTimer);
  phoneCloseTimer = window.setTimeout(() => {
    phonePanel.hidden = true;
    phoneScrim.hidden = true;
    phoneCloseTimer = 0;
  }, 250);
  const canRestoreFocus = previousPhoneFocus?.isConnected
    && !phonePanel.contains(previousPhoneFocus)
    && !previousPhoneFocus.closest('[hidden]');
  const focusTarget = canRestoreFocus ? previousPhoneFocus : phoneButton;
  focusTarget.focus?.({ preventScroll: true });
}

function togglePhone() {
  if (isPhoneOpen()) closePhone();
  else openPhone();
}

function appendPhoneMessage(direction, messageText) {
  const message = document.createElement('div');
  message.className = `phone-chat-message phone-chat-message--${direction}`;
  if (direction === 'incoming') {
    const sender = document.createElement('span');
    sender.className = 'phone-chat-sender';
    sender.textContent = 'Nia';
    message.append(sender);
  }
  const body = document.createElement('p');
  body.textContent = messageText;
  const time = document.createElement('time');
  time.textContent = phoneTimeElement.textContent;
  message.append(body, time);
  phoneChatThread.append(message);
  phoneChatThread.scrollTop = phoneChatThread.scrollHeight;
}

function sendPhoneReply(replyKey) {
  const replies = {
    beacon: {
      sent: 'I’m heading to Unity Circle.',
      received: 'Sounds good. Follow the pale path south and you’ll see the plaza ahead.',
    },
    exploring: {
      sent: 'I’m still exploring for a while.',
      received: 'Enjoy the quiet. The best corners are the ones you find by accident.',
    },
    found: {
      sent: 'I found a glow seed!',
      received: seedCount > 0
        ? 'Lovely — one little light is home. Keep an eye out for the others.'
        : 'That’s exciting! Keep looking around; I’ll be cheering you on.',
    },
  };
  const reply = replies[replyKey];
  if (!reply) return;
  if (life.profile.created) {
    connectWithNeighbour(life);
    persistLife();
    if (isPhoneOpen() && activePhonePage === 'life') renderLifePage();
  }
  phoneUnread = false;
  updatePhoneBadge();
  appendPhoneMessage('outgoing', reply.sent);
  appendPhoneMessage('incoming', reply.received);
  phoneMessagePreview.textContent = reply.received;
}

function updatePhoneQuestProgress() {
  const total = seeds.length;
  const desktopProgress = document.querySelector('#progress-fill');
  const phoneProgress = document.querySelector('#phone-quest-progress-fill');
  setTextIfChanged(document.querySelector('#seed-count'), seedCount);
  setTextIfChanged(document.querySelector('#seed-count-top'), seedCount);
  desktopProgress.max = total;
  desktopProgress.value = seedCount;
  setTextIfChanged(document.querySelector('#phone-seed-count'), `${seedCount} / ${total}`);
  phoneProgress.max = total;
  phoneProgress.value = seedCount;
  for (const seed of seeds) {
    const row = document.querySelector(`#phone-seed-status-${seed.index}`).closest('.phone-seed-row');
    const status = document.querySelector(`#phone-seed-status-${seed.index}`);
    const check = document.querySelector(`#phone-seed-check-${seed.index}`);
    row.classList.toggle('is-found', seed.collected);
    status.textContent = seed.collected ? 'FOUND' : 'TO FIND';
    check.textContent = seed.collected ? '✓' : String(seed.index);
  }
}

phoneButton.addEventListener('click', togglePhone);
viewToggleButton.addEventListener('click', toggleCameraMode);
worldViewButton.addEventListener('click', toggleWorldView);
worldViewReturnButton.addEventListener('click', toggleWorldView);
homeInteractionButton.addEventListener('click', handleNearbyInteraction);
homeLightsButton.addEventListener('click', toggleHomeLighting);
stadiumWatchExitButton.addEventListener('click', exitMatchView);
phoneCloseButton.addEventListener('click', closePhone);
phoneBackButton.addEventListener('click', () => setPhonePage('home'));
phoneScrim.addEventListener('click', closePhone);
phoneContent.addEventListener('click', (event) => {
  const appButton = event.target.closest('[data-phone-app]');
  if (appButton) {
    setPhonePage(appButton.dataset.phoneApp);
    return;
  }
  const shopButton = event.target.closest('[data-shop-buy]');
  if (shopButton) {
    buyShopItem(shopButton.dataset.shopBuy);
    return;
  }
  const bankShopButton = event.target.closest('[data-bank-shop]');
  if (bankShopButton) {
    previewShopPayment(bankShopButton.dataset.bankShop);
    return;
  }
  if (event.target.closest('[data-bank-topup]')) {
    previewBankTopup();
    return;
  }
  if (event.target.closest('[data-bank-rent]')) {
    previewRentPayment();
    return;
  }
  if (event.target.closest('[data-bank-action="clear-preview"]')) {
    bankCheckoutIntent = null;
    renderBankPage();
    return;
  }
  const rentButton = event.target.closest('[data-rent-house]');
  if (rentButton) {
    rentHouseFromPhone(Number(rentButton.dataset.rentHouse));
    return;
  }
  const rentalActionButton = event.target.closest('[data-rental-action]');
  if (rentalActionButton) {
    if (rentalActionButton.dataset.rentalAction === 'pay') payRentFromPhone();
    else if (rentalActionButton.dataset.rentalAction === 'end') endRentalFromPhone();
    return;
  }
  const rentMallSpaceButton = event.target.closest('[data-rent-mall-space]');
  if (rentMallSpaceButton) {
    rentMallShopFromPhone(rentMallSpaceButton.dataset.rentMallSpace);
    return;
  }
  const selectMallSpaceButton = event.target.closest('[data-select-mall-space]');
  if (selectMallSpaceButton) {
    selectedMallSpaceId = selectMallSpaceButton.dataset.selectMallSpace;
    renderCommercePage('market');
    return;
  }
  const toggleMallGoodButton = event.target.closest('[data-toggle-mall-good]');
  if (toggleMallGoodButton) {
    toggleMallGoodFromPhone(
      toggleMallGoodButton.dataset.mallSpace || selectedMallSpaceId,
      toggleMallGoodButton.dataset.toggleMallGood,
    );
    return;
  }
  const mallActionButton = event.target.closest('[data-mall-action]');
  if (mallActionButton) {
    handleMallActionFromPhone(
      mallActionButton.dataset.mallAction,
      mallActionButton.dataset.mallSpace || selectedMallSpaceId,
    );
    return;
  }
  const governmentActionButton = event.target.closest('[data-government-action]');
  if (governmentActionButton) {
    handleGovernmentActionFromPhone(governmentActionButton.dataset.governmentAction);
    return;
  }
  const governorPolicyButton = event.target.closest('[data-governor-policy]');
  if (governorPolicyButton) {
    enactPolicyFromPhone(governorPolicyButton.dataset.governorPolicy);
    return;
  }
  const governorTaxButton = event.target.closest('[data-governor-tax]');
  if (governorTaxButton) {
    setTaxRateFromPhone(governorTaxButton.dataset.governorTax);
    return;
  }
  const fundProjectButton = event.target.closest('[data-fund-project]');
  if (fundProjectButton) {
    fundProjectFromPhone(fundProjectButton.dataset.fundProject);
    return;
  }
  const selectBillboardButton = event.target.closest('[data-select-billboard]');
  if (selectBillboardButton) {
    selectedBillboardId = selectBillboardButton.dataset.selectBillboard;
    renderBillboardsPage();
    return;
  }
  const rentBillboardButton = event.target.closest('[data-rent-billboard]');
  if (rentBillboardButton) {
    rentBillboardFromPhone(rentBillboardButton.dataset.rentBillboard);
    return;
  }
  const billboardPresetButton = event.target.closest('[data-billboard-preset]');
  if (billboardPresetButton) {
    applyBillboardPresetFromPhone(
      billboardPresetButton.dataset.billboardId || selectedBillboardId,
      billboardPresetButton.dataset.billboardPreset,
    );
    return;
  }
  const billboardActionButton = event.target.closest('[data-billboard-action]');
  if (billboardActionButton) {
    handleBillboardActionFromPhone(
      billboardActionButton.dataset.billboardAction,
      billboardActionButton.dataset.billboardId || selectedBillboardId,
    );
    return;
  }
  const foodButton = event.target.closest('[data-food-use]');
  if (foodButton) {
    useFoodFromBag(foodButton.dataset.foodUse);
    return;
  }
  const jobButton = event.target.closest('[data-life-job]');
  if (jobButton) {
    const result = selectLifeJob(life, jobButton.dataset.lifeJob);
    if (!result.ok) showToast('Finish your current shift before changing roles.');
    else {
      persistLife();
      renderWorkPage();
      showToast(`${result.job.title} selected. Head to ${result.job.workplaceName} to clock in.`);
    }
    return;
  }
  const shiftAnswerButton = event.target.closest('[data-shift-answer]');
  if (shiftAnswerButton) {
    answerWorkShift(shiftAnswerButton.dataset.shiftAnswer);
    return;
  }
  const lifeActionButton = event.target.closest('[data-life-action]');
  if (lifeActionButton) {
    performLifeAction(lifeActionButton.dataset.lifeAction);
    return;
  }
  const replyButton = event.target.closest('[data-phone-reply]');
  if (replyButton) {
    sendPhoneReply(replyButton.dataset.phoneReply);
    return;
  }
  const actionButton = event.target.closest('[data-phone-action]');
  if (!actionButton) return;
  if (actionButton.dataset.phoneAction === 'camera-reset') {
    if (isWatchingMatch) exitMatchView();
    resetCameraView();
    document.querySelector('#phone-map-feedback').textContent = 'Camera view reset. Your location marker stays live.';
  } else if (actionButton.dataset.phoneAction === 'show-home-on-map') {
    setPhonePage('map');
    document.querySelector('#phone-map-feedback').textContent = 'Your home is the green house marker at Unity Court.';
  } else if (actionButton.dataset.phoneAction === 'continue') {
    closePhone();
    showToast('Back to exploring. The path is yours.', 2400);
  }
});

phoneContent.addEventListener('submit', (event) => {
  const shopForm = event.target.closest('[data-mall-shop-form]');
  if (shopForm) {
    event.preventDefault();
    const spaceId = shopForm.dataset.mallShopForm;
    const formData = new FormData(shopForm);
    const result = updateMallShopDetails(economy, spaceId, {
      shopName: String(formData.get('shopName') || ''),
      tagline: String(formData.get('tagline') || ''),
    });
    if (!result.ok) {
      showToast('Enter a shop name with at least two characters.');
      return;
    }
    selectedMallSpaceId = spaceId;
    persistEconomy();
    syncMallShopBays3D();
    renderCommercePage('market');
    showToast(`3D shop sign updated to "${result.lease.shopName}".`);
    return;
  }

  const customGoodForm = event.target.closest('[data-mall-custom-good-form]');
  if (customGoodForm) {
    event.preventDefault();
    const spaceId = customGoodForm.dataset.mallCustomGoodForm;
    const formData = new FormData(customGoodForm);
    const styleId = String(formData.get('goodStyle') || 'fashion');
    const styleObj = VIRTUAL_GOOD_STYLES.find((style) => style.id === styleId);
    const result = createCustomVirtualGood(economy, {
      name: String(formData.get('goodName') || ''),
      category: styleObj?.defaultCategory || 'Showcase',
      style: styleId,
      price: Number(formData.get('goodPrice')),
      spaceId,
    });
    if (!result.ok) {
      showToast(
        result.reason === 'invalid-price'
          ? 'Choose a virtual good price from 1 to 500 GC.'
          : result.reason === 'catalog-full'
            ? 'Your custom virtual goods catalog is full.'
            : 'Enter a virtual good name with at least two characters.',
      );
      return;
    }
    selectedMallSpaceId = spaceId;
    persistEconomy();
    syncMallShopBays3D();
    renderCommercePage('market');
    showToast(
      result.autoDisplayed
        ? `Created "${result.good.name}" and placed it in your 3D shop window!`
        : `Created "${result.good.name}" in your virtual goods catalog.`,
      3400,
    );
    return;
  }

  const campaignForm = event.target.closest('[data-government-campaign-form]');
  if (campaignForm) {
    event.preventDefault();
    const formData = new FormData(campaignForm);
    const result = updateCampaignPlatform(government, {
      slogan: String(formData.get('slogan') || ''),
      platformId: String(formData.get('platformId') || ''),
      candidateName: life.profile?.created ? life.profile.name : '',
    });
    if (!result.ok) {
      showToast('Enter a campaign slogan with at least two characters.');
      return;
    }
    persistGovernment();
    syncCommunityHall3D();
    renderGovernmentPage();
    showToast(`Campaign platform updated · voter support rose to ${result.campaignSupport}%!`, 3200);
    return;
  }

  const billboardForm = event.target.closest('[data-billboard-campaign-form]');
  if (billboardForm) {
    event.preventDefault();
    const billboardId = billboardForm.dataset.billboardCampaignForm;
    const formData = new FormData(billboardForm);
    const campaignType = String(formData.get('campaignType') || 'mall');
    const result = updateBillboardCampaign(billboards, billboardId, {
      advertiserName: life.profile?.created ? life.profile.name : 'Abuja Resident',
      headline: String(formData.get('headline') || ''),
      badge: String(formData.get('badge') || ''),
      subline: String(formData.get('subline') || ''),
      cta: String(formData.get('cta') || ''),
      theme: String(formData.get('theme') || 'emerald'),
      campaignType,
    });
    if (!result.ok) {
      showToast('Enter a billboard headline with at least two characters.');
      return;
    }
    selectedBillboardId = billboardId;
    if (campaignType === 'civic') {
      canvassNeighboursForCampaign(government, { atCommunityHall: false });
      persistGovernment();
      syncCommunityHall3D();
    }
    persistBillboards();
    syncBillboards3D();
    renderBillboardsPage();
    showToast(`Published "${result.lease.headline}" live to ${result.billboard.code} in 3D!`, 3400);
  }
});

residentForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const result = createResident(life, {
    name: residentNameInput.value,
    origin: residentOriginInput.value,
    outfit: residentOutfitInput.value,
  });
  if (!result.ok) {
    showToast(result.reason === 'name-too-short' ? 'Choose a resident name with at least two characters.' : 'Choose a valid hometown and outfit.');
    residentNameInput.focus();
    return;
  }
  lifeNeedMinuteAccumulator = 0;
  persistLife();
  applyResidentOutfit();
  populateResidentControls();
  introCard.classList.add('is-dismissed');
  canvas.focus({ preventScroll: true });
  showToast(`Welcome to Abuja, ${life.profile.name}. Open your phone to meet neighbours and find work.`, 4200);
});

lifeProfileForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const result = createResident(life, {
    name: lifeNameEditInput.value,
    origin: lifeOriginEditInput.value,
    outfit: lifeOutfitEditInput.value,
  });
  if (!result.ok) {
    showToast(result.reason === 'name-too-short' ? 'Choose a resident name with at least two characters.' : 'Choose a valid hometown and outfit.');
    lifeNameEditInput.focus();
    return;
  }
  persistLife();
  applyResidentOutfit();
  populateResidentControls();
  renderLifePage();
  showToast('Resident details saved on this device.');
});

phoneMessageForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const message = phoneMessageInput.value.trim();
  if (!message) return;
  if (life.profile.created) {
    connectWithNeighbour(life);
    persistLife();
    if (isPhoneOpen() && activePhonePage === 'life') renderLifePage();
  }
  phoneUnread = false;
  updatePhoneBadge();
  appendPhoneMessage('outgoing', message);
  phoneMessageInput.value = '';
  const normalized = message.toLowerCase();
  let response = 'Got it. Take your time out there — send another note whenever you like.';
  if (normalized.includes('beacon')) response = 'The plaza is easy to spot. Follow the pale trail and you’ll get there.';
  else if (normalized.includes('seed') || normalized.includes('light')) {
    response = seedCount > 0
      ? 'I can see the neighbourhood getting brighter. Thanks for bringing a little light home.'
      : 'Keep looking around — I think there’s a little more light waiting to be found.';
  }
  appendPhoneMessage('incoming', response);
  phoneMessagePreview.textContent = response;
});

phonePanel.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return;
  const focusable = [...phonePanel.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled])')]
    .filter((element) => !element.closest('[hidden]'));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

const PHONE_NOTE_STORAGE_KEY = 'vertualworld-field-note';
const PHONE_NOTE_MAX_LENGTH = 500;
try {
  phoneNote.value = (localStorage.getItem(PHONE_NOTE_STORAGE_KEY) || '').slice(0, PHONE_NOTE_MAX_LENGTH);
} catch {
  setTextIfChanged(phoneNoteStatus, 'Local storage is unavailable');
}
setTextIfChanged(phoneNoteCount, phoneNote.value.length);

function savePhoneNote() {
  phoneNoteSaveTimer = 0;
  try {
    localStorage.setItem(PHONE_NOTE_STORAGE_KEY, phoneNote.value);
    setTextIfChanged(phoneNoteStatus, 'Saved on this device');
  } catch {
    setTextIfChanged(phoneNoteStatus, 'Could not save on this device');
  }
}

function flushPhoneNote() {
  if (!phoneNoteSaveTimer) return;
  window.clearTimeout(phoneNoteSaveTimer);
  savePhoneNote();
}

phoneNote.addEventListener('input', () => {
  setTextIfChanged(phoneNoteCount, phoneNote.value.length);
  setTextIfChanged(phoneNoteStatus, 'Saving…');
  window.clearTimeout(phoneNoteSaveTimer);
  phoneNoteSaveTimer = window.setTimeout(savePhoneNote, 180);
});
phoneNote.addEventListener('change', flushPhoneNote);
window.addEventListener('pagehide', flushPhoneNote);
window.addEventListener('pagehide', persistLife);
updatePhoneBadge();
setPhonePage('home');
updatePhoneQuestProgress();

document.querySelector('#camera-reset').addEventListener('click', () => {
  if (isWatchingMatch) exitMatchView();
  resetCameraView();
  const message = isWorldView
    ? 'World View camera reset.'
    : isFirstPerson
      ? 'First-person view reset to your resident’s facing direction.'
      : cameraMode === 'overhead'
        ? 'Overhead camera aligned with your resident.'
        : 'Camera reset behind your resident.';
  showToast(message, 1800);
});
function updateFullscreenButton() {
  const isFullscreen = document.fullscreenElement === app;
  const action = isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen';
  fullscreenButton.setAttribute('aria-label', action);
  fullscreenButton.title = action;
  fullscreenButton.setAttribute('aria-pressed', String(isFullscreen));
}

document.addEventListener('fullscreenchange', updateFullscreenButton);
updateFullscreenButton();
fullscreenButton.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement === app) {
      if (typeof document.exitFullscreen !== 'function') {
        showToast('Fullscreen cannot be exited in this browser.');
        return;
      }
      await document.exitFullscreen();
      return;
    }
    if (typeof app.requestFullscreen !== 'function' || document.fullscreenEnabled === false) {
      showToast('Fullscreen is not available in this browser.');
      return;
    }
    await app.requestFullscreen();
  } catch (error) {
    console.warn('Fullscreen could not be changed.', error);
    showToast('Fullscreen could not be changed. Please try again.');
  }
});

const clockElement = document.querySelector('#world-time');
function updateClock() {
  const minute = Math.floor(worldMinutes + elapsedWorldTime / 18);
  if (minute === lastClockMinute) return;
  lastClockMinute = minute;
  const hour24 = Math.floor(minute / 60) % 24;
  const hours = hour24 % 12 || 12;
  const minutes = minute % 60;
  const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const period = hour24 < 12 ? 'AM' : 'PM';
  clockElement.textContent = time;
  phoneTimeElement.textContent = time;
  phoneHomeTime.textContent = `${time} ${period}`;
  worldPeriodElement.textContent = period;
}

function updateLocationAndMap() {
  const x = player.position.x;
  const z = player.position.z;
  let location = 'Civic Greenway';
  let currentHomeRoom = '';
  const currentResidence = getCurrentResidence();
  const currentCommerceVenue = commerceVenues.find((venue) => Math.hypot(x - venue.x, z - venue.z) < 10);
  if (life.profile.created) {
    let lifeGoalUpdated = false;
    if (currentCommerceVenue) lifeGoalUpdated = recordLifeVisit(life, currentCommerceVenue.id) || lifeGoalUpdated;
    if (Math.hypot(x - COMMUNITY_HALL_LAYOUT.x, z - COMMUNITY_HALL_LAYOUT.z) < 12) {
      lifeGoalUpdated = recordLifeVisit(life, 'hall') || lifeGoalUpdated;
    }
    if (Math.hypot(x - STADIUM.x, z - STADIUM.z) < 24) {
      lifeGoalUpdated = recordLifeVisit(life, 'stadium') || lifeGoalUpdated;
    }
    if (lifeGoalUpdated) {
      persistLife();
      if (isPhoneOpen() && activePhonePage === 'life') renderLifePage();
    }
  }
  if (isInsideHome && currentResidence) {
    const local = homeWorldToLocal(x, z);
    currentHomeRoom = local.z > 0.9
      ? 'Bedroom'
      : local.x < -2.1 && local.z < 0.7
        ? 'Kitchen'
        : 'Living Room';
    location = `${currentHomeRoom} · House ${String(currentResidence.number).padStart(2, '0')}`;
  } else if (Math.hypot(x - STADIUM.x, z - STADIUM.z) < 24) location = 'Abuja Community Stadium';
  else if (Math.hypot(x, z + 27) < 10) location = 'Unity Circle';
  else if (Math.hypot(x - COMMUNITY_HALL_LAYOUT.x, z - COMMUNITY_HALL_LAYOUT.z) < 10) location = 'Unity Community Hall · Governor’s Office';
  else if (currentCommerceVenue) location = currentCommerceVenue.name;
  else if (isInsideEstate(x, z)) location = 'Unity Court';
  else if (Math.hypot(x, z - 12) < 15) location = 'Unity Court North';
  else if (x < -24) location = 'Western Greenway';
  else if (x > 24) location = 'Eastern Savannah';
  else if (z < -16) location = 'Civic Park';

  const roundedX = Math.round(x);
  const roundedZ = Math.round(z);
  const formattedCoordinates = `X ${String(roundedX).padStart(2, '0')} · Z ${String(roundedZ).padStart(2, '0')}`;
  setTextIfChanged(document.querySelector('#location-name'), location);
  setTextIfChanged(document.querySelector('#location-coordinates'), `${roundedX}, ${roundedZ}`);
  setTextIfChanged(document.querySelector('#map-location'), location);
  setTextIfChanged(document.querySelector('#map-coordinates'), formattedCoordinates);
  setTextIfChanged(document.querySelector('#phone-home-location'), location);
  setTextIfChanged(document.querySelector('#phone-home-coordinates'), formattedCoordinates);
  setTextIfChanged(document.querySelector('#phone-map-location'), location);
  setTextIfChanged(document.querySelector('#phone-map-coordinates'), formattedCoordinates);
  const home = currentResidence;
  const interactionTarget = getNearbyInteractionTarget();
  const hasHomePrompt = isInsideHome || interactionTarget === 'enter-home' || interactionTarget === 'exit-home';
  const hasCarPrompt = interactionTarget === 'enter-car' || interactionTarget === 'exit-car';
  const hasStadiumPrompt = interactionTarget === 'watch-match';
  const hasTransitPrompt = ['board-train', 'wait-train', 'board-bus', 'wait-bus', 'request-transit-stop'].includes(interactionTarget);
  const hasCommercePrompt = interactionTarget === 'open-cafe' || interactionTarget === 'open-market' || interactionTarget === 'open-government' || interactionTarget === 'open-billboard';
  const hasPropertyPrompt = interactionTarget === 'view-rentals';
  homeInteraction.hidden = isWorldView || isWatchingMatch || !(hasHomePrompt || hasCarPrompt || hasStadiumPrompt || hasTransitPrompt || hasCommercePrompt || hasPropertyPrompt) || isPhoneOpen();
  homeInteractionButton.hidden = !['enter-home', 'exit-home', 'enter-car', 'exit-car', 'watch-match', 'board-train', 'wait-train', 'board-bus', 'wait-bus', 'request-transit-stop', 'view-rentals', 'open-cafe', 'open-market', 'open-government', 'open-billboard'].includes(interactionTarget);
  homeLightsButton.hidden = !isInsideHome;
  setAttributeIfChanged(homeInteraction, 'aria-label', hasCarPrompt ? 'Car controls' : hasTransitPrompt ? 'Rail and bus terminal controls' : hasStadiumPrompt ? 'Stadium match controls' : hasCommercePrompt ? 'Shop, billboard, and civic controls' : hasPropertyPrompt ? 'Rental listing controls' : 'Home controls');
  setTextIfChanged(homeLightsAction, homeLightingEnabled ? 'LIGHTS OFF' : 'LIGHTS ON');
  setAttributeIfChanged(homeLightsButton, 'aria-label', homeLightingEnabled ? 'Turn home lights off' : 'Turn home lights on');

  if (hasCarPrompt && playerCar) {
    setTextIfChanged(homeInteractionEyebrow, isDriving ? 'UNITY COURT · YOUR CAR' : 'YOUR CAR · UNITY COURT');
    const speed = Math.round(Math.abs(playerCar.speed) * 5);
    const touchDriving = Boolean(navigator.maxTouchPoints);
    const interactionMessage = isDriving
      ? `Driving · ${speed} km/h · ${touchDriving ? 'joystick steers; pedals drive and brake' : 'W/S drive, A/D steer'}`
      : 'Your car is parked just ahead';
    setTextIfChanged(homeInteractionMessage, interactionMessage);
    setTextIfChanged(homeInteractionAction, isDriving ? 'EXIT CAR' : 'ENTER CAR');
    setAttributeIfChanged(homeInteractionButton, 'aria-label', isDriving ? 'Exit your car' : 'Enter your car');
  } else if (interactionTarget === 'view-rentals') {
    const rentalHouse = getNearbyRentalHouse()?.house;
    const listing = RENTAL_LISTINGS.find((candidate) => candidate.houseNumber === rentalHouse?.number);
    setTextIfChanged(homeInteractionEyebrow, `HOUSE ${String(rentalHouse?.number || '').padStart(2, '0')} · UNITY COURT`);
    setTextIfChanged(homeInteractionMessage, listing
      ? `${listing.landlord} has a furnished cottage available · ${formatCredits(listing.monthlyRent)} / month`
      : 'Browse furnished cottages from local landlords.');
    setTextIfChanged(homeInteractionAction, 'VIEW RENTALS');
    setAttributeIfChanged(homeInteractionButton, 'aria-label', 'View Unity Court rental listings');
  } else if (interactionTarget === 'open-government') {
    const activePolicy = getActiveGovernorPolicy(government);
    setTextIfChanged(homeInteractionEyebrow, 'UNITY COMMUNITY HALL · GOVERNOR’S OFFICE');
    setTextIfChanged(
      homeInteractionMessage,
      `Governor ${government.governorName} (${government.approval}% approval) · ${activePolicy.title}`,
    );
    setTextIfChanged(homeInteractionAction, 'OPEN GOVERNMENT');
    setAttributeIfChanged(homeInteractionButton, 'aria-label', 'Open the Governor’s Office and civic government');
  } else if (interactionTarget === 'open-billboard') {
    const nearbyBoard = getNearbyBillboard()?.billboard;
    const display = nearbyBoard ? getBillboardDisplayState(billboards, nearbyBoard.id) : null;
    setTextIfChanged(
      homeInteractionEyebrow,
      nearbyBoard ? `STRATEGIC BILLBOARD · ${nearbyBoard.code} ${nearbyBoard.locationLabel.toUpperCase()}` : 'STRATEGIC BILLBOARD',
    );
    setTextIfChanged(
      homeInteractionMessage,
      display
        ? display.isLeased
          ? `Your live ad: “${display.headline}” · ${nearbyBoard.dailyImpressions.toLocaleString()} daily views`
          : `${nearbyBoard.name} · Lease for ${formatCredits(nearbyBoard.leaseCost)} (${nearbyBoard.dailyImpressions.toLocaleString()} daily views)`
        : 'Lease and customize this 3D advertising billboard.',
    );
    setTextIfChanged(homeInteractionAction, display?.isLeased ? 'MANAGE AD' : 'LEASE BILLBOARD');
    setAttributeIfChanged(homeInteractionButton, 'aria-label', 'Open strategic billboard advertising studio');
  } else if (hasCommercePrompt) {
    const venue = getNearbyCommerceVenue()?.venue;
    if (venue?.id === 'cafe') {
      setTextIfChanged(homeInteractionEyebrow, `${venue.name.toUpperCase()} · CITY STREET`);
      setTextIfChanged(homeInteractionMessage, 'Fresh food and warm drinks · pay with game credits');
      setTextIfChanged(homeInteractionAction, 'OPEN CAFÉ');
      setAttributeIfChanged(homeInteractionButton, 'aria-label', 'Open the café shop');
    } else {
      const nearbyBay = getNearbyMallShopBay()?.bay;
      const bayState = nearbyBay ? getMallShopDisplayState(economy, nearbyBay.spaceId) : null;
      const eyebrow = bayState
        ? `UNITY MALL · ${bayState.space.code} (${bayState.space.sizeLabel.toUpperCase()} · ${bayState.space.areaSqm} M²)`
        : `${venue?.name.toUpperCase() || 'UNITY MALL'} · SHOPPING GALLERIA`;
      const message = bayState
        ? bayState.isRented
          ? `${bayState.shopName} · ${bayState.displayedGoods.length}/${bayState.space.maxDisplayItems} virtual goods displayed`
          : `${bayState.space.name} available · ${formatCredits(bayState.space.monthlyRent)} / month · up to ${bayState.space.maxDisplayItems} virtual goods`
        : '4 shop spaces (Small to Anchor) to rent & display virtual goods · anchor grocer';
      setTextIfChanged(homeInteractionEyebrow, eyebrow);
      setTextIfChanged(homeInteractionMessage, message);
      setTextIfChanged(homeInteractionAction, 'OPEN MALL');
      setAttributeIfChanged(homeInteractionButton, 'aria-label', 'Open Unity Mall shops and virtual goods showcase');
    }
  } else if (home && hasHomePrompt) {
    const number = String(home.number).padStart(2, '0');
    const canReachHomeDoor = interactionTarget === 'enter-home' || interactionTarget === 'exit-home';
    setTextIfChanged(homeInteractionEyebrow, isInsideHome ? `HOUSE ${number} · ${currentHomeRoom.toUpperCase()}` : `HOUSE ${number} · ${home.isHome ? 'YOUR HOME' : 'YOUR RENTAL'}`);
    const interactionMessage = isInsideHome
      ? (canReachHomeDoor ? 'The front door is right here' : `You’re in the ${currentHomeRoom.toLowerCase()}`)
      : 'Step inside your furnished home';
    setTextIfChanged(homeInteractionMessage, interactionMessage);
    setTextIfChanged(homeInteractionAction, isInsideHome ? 'LEAVE HOME' : 'ENTER HOME');
    setAttributeIfChanged(homeInteractionButton, 'aria-label', isInsideHome ? `Leave House ${number}` : `Enter House ${number}`);
  } else if (hasTransitPrompt && interactionTarget === 'request-transit-stop') {
    const nextStop = getNextActiveTransitStop();
    const serviceName = transitRideMode === 'bus' ? 'ABUJA CITY BUS' : 'ABUJA CITY RAIL';
    setTextIfChanged(homeInteractionEyebrow, `${serviceName} · ON BOARD`);
    setTextIfChanged(homeInteractionMessage, transitStopRequested
      ? `Stop requested · ${nextStop.name} is next`
      : `Next stop · ${nextStop.name}`);
    setTextIfChanged(homeInteractionAction, transitStopRequested ? 'STOP REQUESTED' : 'REQUEST STOP');
    setAttributeIfChanged(homeInteractionButton, 'aria-label', transitStopRequested
      ? `Stop requested at ${nextStop.name}`
      : `Request a stop at ${nextStop.name}`);
  } else if (hasTransitPrompt) {
    const isBusPrompt = interactionTarget === 'board-bus' || interactionTarget === 'wait-bus';
    const stop = isBusPrompt ? getNearbyBusTerminal() : getNearbyRailStation();
    const vehicleReady = isBusPrompt
      ? isBusAtTerminal(transitNetwork, stop)
      : isTrainAtStation(transitNetwork, stop);
    const waitSeconds = isBusPrompt
      ? getBusWaitSeconds(transitNetwork, stop)
      : getTransitWaitSeconds(transitNetwork, stop);
    const vehicleName = isBusPrompt ? 'Abuja City Bus' : 'Abuja City Rail';
    const vehicleType = isBusPrompt ? 'BUS TERMINAL' : 'RAIL TERMINAL';
    setTextIfChanged(homeInteractionEyebrow, `${stop.name.toUpperCase()} · ${vehicleType}`);
    setTextIfChanged(homeInteractionMessage, vehicleReady
      ? `${vehicleName} is ready to board`
      : `Next ${isBusPrompt ? 'bus' : 'train'} in about ${waitSeconds} seconds`);
    setTextIfChanged(homeInteractionAction, vehicleReady ? (isBusPrompt ? 'BOARD BUS' : 'BOARD TRAIN') : 'WAIT');
    setAttributeIfChanged(homeInteractionButton, 'aria-label', vehicleReady
      ? `Board the ${vehicleName} at ${stop.name}`
      : `Wait for the ${vehicleName} at ${stop.name}`);
  } else if (hasStadiumPrompt) {
    setTextIfChanged(homeInteractionEyebrow, 'MATCHDAY · ABUJA COMMUNITY STADIUM');
    setTextIfChanged(homeInteractionMessage, 'Capital Stars vs Savannah United · LIVE');
    setTextIfChanged(homeInteractionAction, 'WATCH MATCH');
    setAttributeIfChanged(homeInteractionButton, 'aria-label', 'Watch the live Abuja Community Stadium football match');
  }
  drawMap();
}

const mapCanvasDrawState = new WeakMap();
const MAP_REDRAW_DISTANCE_SQUARED = 0.12 * 0.12;
const MAP_REDRAW_ANGLE_RADIANS = 0.035;

function drawMap() {
  drawMapCanvasIfNeeded(mapCanvas, mapContext);
  if (isPhoneOpen() && activePhonePage === 'map') drawMapCanvasIfNeeded(phoneMapCanvas, phoneMapContext);
}

function drawMapCanvasIfNeeded(targetCanvas, ctx) {
  const previous = mapCanvasDrawState.get(targetCanvas);
  const x = player.position.x;
  const z = player.position.z;
  const yaw = player.rotation.y;
  const width = targetCanvas.width;
  const height = targetCanvas.height;
  if (previous
    && previous.seedCount === seedCount
    && previous.width === width
    && previous.height === height) {
    const dx = x - previous.x;
    const dz = z - previous.z;
    const angle = Math.atan2(Math.sin(yaw - previous.yaw), Math.cos(yaw - previous.yaw));
    if (dx * dx + dz * dz < MAP_REDRAW_DISTANCE_SQUARED && Math.abs(angle) < MAP_REDRAW_ANGLE_RADIANS) return;
  }
  drawMapCanvas(targetCanvas, ctx);
  mapCanvasDrawState.set(targetCanvas, { x, z, yaw, seedCount, width, height });
}

function drawMapCanvas(targetCanvas, ctx) {
  const width = targetCanvas.width;
  const height = targetCanvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.44;
  const mapLeft = centerX - radius;
  const mapRight = centerX + radius;
  const mapTop = centerY - radius;
  const mapBottom = centerY + radius;
  const corner = radius * 0.12;
  const traceMapBoundary = () => {
    ctx.beginPath();
    ctx.moveTo(mapLeft + corner, mapTop);
    ctx.lineTo(mapRight - corner, mapTop);
    ctx.quadraticCurveTo(mapRight, mapTop, mapRight, mapTop + corner);
    ctx.lineTo(mapRight, mapBottom - corner);
    ctx.quadraticCurveTo(mapRight, mapBottom, mapRight - corner, mapBottom);
    ctx.lineTo(mapLeft + corner, mapBottom);
    ctx.quadraticCurveTo(mapLeft, mapBottom, mapLeft, mapBottom - corner);
    ctx.lineTo(mapLeft, mapTop + corner);
    ctx.quadraticCurveTo(mapLeft, mapTop, mapLeft + corner, mapTop);
    ctx.closePath();
  };
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#eee6d4';
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  traceMapBoundary();
  ctx.fillStyle = '#c9d2a6';
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = '#c9d2a6';
  ctx.fillRect(mapLeft, mapTop, radius * 2, radius * 2);

  // Light topographic contours and a warm civic path keep the neighbourhood plan legible.
  ctx.strokeStyle = 'rgba(91, 119, 77, .2)';
  ctx.lineWidth = 1;
  for (let ring = 0; ring < 4; ring += 1) {
    ctx.beginPath();
    ctx.ellipse(centerX - 6 + ring * 2, centerY + 3 - ring * 2, radius * (0.28 + ring * 0.13), radius * (0.23 + ring * 0.14), -0.34, 0, Math.PI * 2);
    ctx.stroke();
  }

  const mapX = (x) => centerX + (x / WORLD_RADIUS) * radius;
  const mapY = (z) => centerY + (z / WORLD_RADIUS) * radius;

  const estateLeft = mapX(ESTATE_BOUNDS.minX);
  const estateTop = mapY(ESTATE_BOUNDS.minZ);
  const estateWidth = mapX(ESTATE_BOUNDS.maxX) - estateLeft;
  const estateHeight = mapY(ESTATE_BOUNDS.maxZ) - estateTop;
  ctx.fillStyle = 'rgba(248, 239, 205, .19)';
  ctx.fillRect(estateLeft, estateTop, estateWidth, estateHeight);
  ctx.save();
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = 'rgba(70, 111, 77, .48)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(estateLeft, estateTop, estateWidth, estateHeight);
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(mapX(1), mapY(8));
  ctx.lineTo(mapX(27), mapY(8));
  ctx.moveTo(mapX(27), mapY(-8));
  ctx.lineTo(mapX(27), mapY(24));
  ctx.strokeStyle = 'rgba(231, 218, 177, .94)';
  ctx.lineWidth = Math.max(2, radius * 0.034);
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();

  if (transitNetwork) {
    ctx.save();
    ctx.beginPath();
    for (const roadLine of transitNetwork.roadMapLines) {
      roadLine.forEach(([x, z], index) => {
        if (index === 0) ctx.moveTo(mapX(x), mapY(z));
        else ctx.lineTo(mapX(x), mapY(z));
      });
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(244, 238, 216, .92)';
    ctx.lineWidth = Math.max(3, radius * 0.052);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(91, 100, 91, .86)';
    ctx.lineWidth = Math.max(1.7, radius * 0.031);
    ctx.stroke();

    ctx.beginPath();
    transitNetwork.busMapPoints.forEach(([x, z], index) => {
      if (index === 0) ctx.moveTo(mapX(x), mapY(z));
      else ctx.lineTo(mapX(x), mapY(z));
    });
    ctx.setLineDash([Math.max(2, radius * 0.024), Math.max(1.5, radius * 0.018)]);
    ctx.strokeStyle = 'rgba(237, 184, 110, .96)';
    ctx.lineWidth = Math.max(1.5, radius * 0.02);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    transitNetwork.railMapPoints.forEach(([x, z], index) => {
      if (index === 0) ctx.moveTo(mapX(x), mapY(z));
      else ctx.lineTo(mapX(x), mapY(z));
    });
    ctx.closePath();
    ctx.setLineDash([Math.max(2, radius * 0.025), Math.max(1.5, radius * 0.018)]);
    ctx.strokeStyle = 'rgba(250, 248, 229, .94)';
    ctx.lineWidth = Math.max(2.4, radius * 0.035);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#557a73';
    ctx.lineWidth = Math.max(1.1, radius * 0.016);
    ctx.stroke();

    const stationMapNames = {
      'unity-court': 'UNITY',
      'unity-circle': 'CIVIC',
      'abuja-community-stadium': 'STADIUM',
    };
    for (const station of transitNetwork.stations) {
      const stationX = mapX(station.x);
      const stationY = mapY(station.z);
      ctx.beginPath();
      ctx.arc(stationX, stationY, Math.max(2.7, radius * 0.026), 0, Math.PI * 2);
      ctx.fillStyle = '#f2d27f';
      ctx.fill();
      ctx.strokeStyle = '#fff9e9';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(stationX, stationY, Math.max(0.8, radius * 0.008), 0, Math.PI * 2);
      ctx.fillStyle = '#315b4a';
      ctx.fill();
      const labelOffsetX = stationX < centerX ? 6 : -6;
      const labelOffsetY = stationY < centerY ? -8 : 8;
      ctx.font = `700 ${Math.max(5.5, radius * 0.062)}px sans-serif`;
      ctx.textAlign = labelOffsetX > 0 ? 'left' : 'right';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = Math.max(1.5, radius * 0.02);
      ctx.strokeStyle = 'rgba(245, 246, 228, .94)';
      ctx.strokeText(stationMapNames[station.id] || station.name, stationX + labelOffsetX, stationY + labelOffsetY);
      ctx.fillStyle = '#315b4a';
      ctx.fillText(stationMapNames[station.id] || station.name, stationX + labelOffsetX, stationY + labelOffsetY);
    }
    for (const terminal of transitNetwork.busTerminals) {
      const terminalX = mapX(terminal.x);
      const terminalY = mapY(terminal.z);
      const iconSize = Math.max(2.6, radius * 0.025);
      ctx.save();
      ctx.translate(terminalX, terminalY);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#d9895c';
      ctx.strokeStyle = '#fff7e7';
      ctx.lineWidth = 1.1;
      ctx.fillRect(-iconSize, -iconSize, iconSize * 2, iconSize * 2);
      ctx.strokeRect(-iconSize, -iconSize, iconSize * 2, iconSize * 2);
      ctx.restore();
      ctx.fillStyle = '#fff7e7';
      ctx.font = `700 ${Math.max(4.5, radius * 0.05)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('B', terminalX, terminalY + 0.2);
    }
    ctx.restore();
  }

  const houseIconSize = Math.max(3.1, radius * 0.034);
  for (const house of estateHouses) {
    const houseX = mapX(house.x);
    const houseY = mapY(house.z);
    ctx.save();
    ctx.translate(houseX, houseY);
    ctx.beginPath();
    ctx.moveTo(-houseIconSize * 0.7, -houseIconSize * 0.05);
    ctx.lineTo(0, -houseIconSize * 0.8);
    ctx.lineTo(houseIconSize * 0.7, -houseIconSize * 0.05);
    ctx.closePath();
    ctx.fillStyle = house.isHome ? '#397b63' : '#8a8064';
    ctx.fill();
    ctx.fillRect(-houseIconSize * 0.48, -houseIconSize * 0.08, houseIconSize * 0.96, houseIconSize * 0.7);
    ctx.strokeStyle = 'rgba(255, 250, 226, .98)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-houseIconSize * 0.48, -houseIconSize * 0.08, houseIconSize * 0.96, houseIconSize * 0.7);
    ctx.restore();
  }
  for (const venue of commerceVenues) {
    const venueX = mapX(venue.x);
    const venueY = mapY(venue.z);
    const size = Math.max(3.1, radius * 0.032);
    ctx.beginPath();
    ctx.arc(venueX, venueY, size, 0, Math.PI * 2);
    ctx.fillStyle = venue.id === 'cafe' ? '#bd8052' : '#6d956c';
    ctx.fill();
    ctx.strokeStyle = '#fff7e8';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.fillStyle = '#fff9ec';
    ctx.font = `700 ${Math.max(4.5, radius * 0.052)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(venue.id === 'cafe' ? 'C' : 'M', venueX, venueY + 0.2);
  }
  const hallX = mapX(COMMUNITY_HALL_LAYOUT.x);
  const hallY = mapY(COMMUNITY_HALL_LAYOUT.z);
  const hallIconSize = Math.max(3.2, radius * 0.035);
  ctx.fillStyle = '#385d4c';
  ctx.strokeStyle = '#fff7e8';
  ctx.lineWidth = 1.1;
  ctx.fillRect(hallX - hallIconSize, hallY - hallIconSize, hallIconSize * 2, hallIconSize * 2);
  ctx.strokeRect(hallX - hallIconSize, hallY - hallIconSize, hallIconSize * 2, hallIconSize * 2);
  ctx.fillStyle = '#fff9ec';
  ctx.font = `700 ${Math.max(4.5, radius * 0.052)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('H', hallX, hallY + 0.2);

  for (const board of BILLBOARD_LAYOUT) {
    const boardX = mapX(board.x);
    const boardY = mapY(board.z);
    const w = Math.max(3.6, radius * 0.038);
    const h = Math.max(2.5, radius * 0.026);
    const isLeased = Boolean(billboards.leases?.[board.id]);
    ctx.fillStyle = isLeased ? '#e5a93c' : '#8c5328';
    ctx.strokeStyle = '#fff9ec';
    ctx.lineWidth = 1;
    ctx.fillRect(boardX - w, boardY - h, w * 2, h * 2);
    ctx.strokeRect(boardX - w, boardY - h, w * 2, h * 2);
    ctx.fillStyle = '#fff9ec';
    ctx.font = `700 ${Math.max(3.8, radius * 0.04)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AD', boardX, boardY + 0.2);
  }

  ctx.beginPath();
  PATH_POINTS_XZ.forEach(([x, z], index) => {
    if (index === 0) ctx.moveTo(mapX(x), mapY(z));
    else ctx.lineTo(mapX(x), mapY(z));
  });
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(255, 245, 211, .88)';
  ctx.lineWidth = Math.max(2.6, radius * 0.024);
  ctx.stroke();

  for (const tree of treeLocations) {
    ctx.beginPath();
    ctx.arc(mapX(tree.x), mapY(tree.z), Math.max(1.1, radius * 0.009), 0, Math.PI * 2);
    ctx.fillStyle = '#39775c';
    ctx.fill();
  }
  for (const seed of seeds) {
    if (seed.collected) continue;
    ctx.beginPath();
    ctx.arc(mapX(seed.x), mapY(seed.z), Math.max(2.4, radius * 0.019), 0, Math.PI * 2);
    ctx.fillStyle = '#f0b856';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // Abuja Community Stadium's tiny pitch marker helps visitors find the live match on either map.
  const stadiumMapX = mapX(STADIUM.x);
  const stadiumMapY = mapY(STADIUM.z);
  const stadiumIcon = Math.max(4.2, radius * 0.045);
  ctx.fillStyle = '#315b48';
  ctx.fillRect(stadiumMapX - stadiumIcon, stadiumMapY - stadiumIcon * 0.66, stadiumIcon * 2, stadiumIcon * 1.32);
  ctx.fillStyle = '#79ad69';
  ctx.fillRect(stadiumMapX - stadiumIcon * 0.72, stadiumMapY - stadiumIcon * 0.42, stadiumIcon * 1.44, stadiumIcon * 0.84);
  ctx.strokeStyle = 'rgba(255,255,255,.96)';
  ctx.lineWidth = 1;
  ctx.strokeRect(stadiumMapX - stadiumIcon * 0.72, stadiumMapY - stadiumIcon * 0.42, stadiumIcon * 1.44, stadiumIcon * 0.84);
  ctx.beginPath();
  ctx.moveTo(stadiumMapX, stadiumMapY - stadiumIcon * 0.42);
  ctx.lineTo(stadiumMapX, stadiumMapY + stadiumIcon * 0.42);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(stadiumMapX, stadiumMapY, stadiumIcon * 0.16, 0, Math.PI * 2);
  ctx.stroke();

  // Civic-plaza symbol.
  ctx.beginPath();
  ctx.arc(mapX(0), mapY(-27), Math.max(3.4, radius * 0.026), 0, Math.PI * 2);
  ctx.fillStyle = '#77b8a0';
  ctx.fill();
  ctx.strokeStyle = '#eff4d9';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const px = mapX(player.position.x);
  const py = mapY(player.position.z);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(-player.rotation.y);
  const arrowSize = Math.max(5, radius * 0.038);
  ctx.beginPath();
  ctx.moveTo(0, -arrowSize);
  ctx.lineTo(arrowSize * 0.76, arrowSize * 0.68);
  ctx.lineTo(0, arrowSize * 0.38);
  ctx.lineTo(-arrowSize * 0.76, arrowSize * 0.68);
  ctx.closePath();
  ctx.fillStyle = '#e98665';
  ctx.fill();
  ctx.strokeStyle = '#fff8e7';
  ctx.lineWidth = 1.25;
  ctx.stroke();
  ctx.restore();
  ctx.restore();

  traceMapBoundary();
  ctx.strokeStyle = 'rgba(255,255,255,.92)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

const clock = new THREE.Clock();
const animationScratch = {
  desiredDirection: new THREE.Vector3(),
  forward: new THREE.Vector3(),
  right: new THREE.Vector3(),
  desiredVelocity: new THREE.Vector3(),
  desiredCameraPosition: new THREE.Vector3(),
  behindCameraOffset: new THREE.Vector3(),
  lookAtPosition: new THREE.Vector3(),
  eyePosition: new THREE.Vector3(),
  seatOffset: new THREE.Vector3(),
  viewDirection: new THREE.Vector3(),
  yawAxis: new THREE.Vector3(0, 1, 0),
};
const FRAME_INTERVAL_MS = 1000 / 60;
const SHADOW_UPDATE_INTERVAL_MS = 1000 / 30;
let animationFrameHandle = null;
let hasRenderedInitialFrame = false;
let lastAnimationTimestamp = null;
let lastShadowUpdateTimestamp = null;
let frameIntervalAccumulator = 0;
let uiAccumulator = 0;
const performanceHud = showPerformanceHud ? document.createElement('output') : null;
let performanceFrames = 0;
let performanceTotalCalls = 0;
let performanceTotalTriangles = 0;
let performanceTotalCpuMs = 0;
let performanceWindowStart = null;
let performanceLastFrameTimestamp = null;
const performanceFrameIntervals = [];
if (performanceHud) {
  performanceHud.style.cssText = 'position:fixed;z-index:1000;top:8px;left:8px;padding:6px 8px;border:1px solid rgba(255,255,255,.35);border-radius:7px;color:#fff;background:rgba(20,35,30,.78);font:11px/1.45 ui-monospace,monospace;pointer-events:none;white-space:pre;';
  performanceHud.setAttribute('aria-live', 'off');
  performanceHud.textContent = 'Measuring render performance…';
  document.body.append(performanceHud);
}

function resetPerformanceHudWindow() {
  performanceFrames = 0;
  performanceTotalCalls = 0;
  performanceTotalTriangles = 0;
  performanceTotalCpuMs = 0;
  performanceWindowStart = null;
  performanceLastFrameTimestamp = null;
  performanceFrameIntervals.length = 0;
}

function updatePerformanceHud(timestamp, frameCpuMs) {
  if (!performanceHud) return;
  if (performanceWindowStart === null) performanceWindowStart = timestamp;
  if (performanceLastFrameTimestamp !== null) {
    performanceFrameIntervals.push(timestamp - performanceLastFrameTimestamp);
  }
  performanceLastFrameTimestamp = timestamp;
  const { calls, triangles } = renderer.info.render;
  performanceFrames += 1;
  performanceTotalCalls += calls;
  performanceTotalTriangles += triangles;
  performanceTotalCpuMs += frameCpuMs;
  const elapsedSeconds = (timestamp - performanceWindowStart) / 1000;
  if (elapsedSeconds < 0.5) return;
  const sortedFrameIntervals = [...performanceFrameIntervals].sort((a, b) => a - b);
  const p95Index = Math.max(0, Math.ceil(sortedFrameIntervals.length * 0.95) - 1);
  const p95FrameMs = sortedFrameIntervals[p95Index] || 0;
  performanceHud.textContent = `${Math.round(performanceFrames / elapsedSeconds)} FPS  ·  ${Math.round(performanceTotalCalls / performanceFrames)} draw calls/frame  ·  ${Math.round(performanceTotalTriangles / performanceFrames).toLocaleString()} triangles/frame\nFrame p95 ${p95FrameMs.toFixed(1)} ms  ·  CPU avg ${(performanceTotalCpuMs / performanceFrames).toFixed(1)} ms  ·  DPR ${renderer.getPixelRatio().toFixed(2)}`;
  resetPerformanceHudWindow();
  performanceWindowStart = timestamp;
  performanceLastFrameTimestamp = timestamp;
}

function scheduleAnimationFrame() {
  if (document.hidden || animationFrameHandle !== null) return;
  animationFrameHandle = requestAnimationFrame(animate);
}

function animate(timestamp) {
  animationFrameHandle = null;
  if (document.hidden) return;
  if (lastAnimationTimestamp === null) {
    lastAnimationTimestamp = timestamp;
    frameIntervalAccumulator = FRAME_INTERVAL_MS;
  } else {
    frameIntervalAccumulator += Math.min(timestamp - lastAnimationTimestamp, 100);
    lastAnimationTimestamp = timestamp;
  }
  if (frameIntervalAccumulator < FRAME_INTERVAL_MS) {
    scheduleAnimationFrame();
    return;
  }
  frameIntervalAccumulator %= FRAME_INTERVAL_MS;
  scheduleAnimationFrame();
  const performanceFrameStart = performanceHud ? performance.now() : 0;
  const { delta, movementSteps, movementStepDelta } = getFrameTiming(clock.getDelta());
  elapsedWorldTime += delta;
  if (life.profile.created && introCard.classList.contains('is-dismissed')) {
    lifeNeedMinuteAccumulator += delta / 18;
    const gameMinutesPassed = Math.floor(lifeNeedMinuteAccumulator);
    if (gameMinutesPassed > 0) {
      lifeNeedMinuteAccumulator -= gameMinutesPassed;
      const needsChanged = advanceLifeNeeds(life, gameMinutesPassed);
      persistLife();
      if (needsChanged && isPhoneOpen() && activePhonePage === 'life') renderLifeNeeds();
    }
  }
  vehicleInteractionCooldown = Math.max(0, vehicleInteractionCooldown - delta);
  vehicleAccelerateTapTimer = Math.max(0, vehicleAccelerateTapTimer - delta);
  updateClock();
  if (!prefersReducedMotion) updateDaylight();
  const stadiumDistance = Math.hypot(player.position.x - STADIUM.x, player.position.z - STADIUM.z);
  const crowdUpdateInterval = isWatchingMatch || stadiumDistance < 28
    ? 0
    : stadiumDistance < 48
      ? 1 / 30
      : 1 / 15;
  updateStadiumMatch(stadium, delta, prefersReducedMotion, crowdUpdateInterval);
  const transitUpdate = updateTransportNetwork(transitNetwork, delta);
  const arrivedRideStop = transitRideMode === 'bus' ? transitUpdate.arrivedBusTerminal : transitUpdate.arrivedStation;
  if (isRidingTransit && transitStopRequested && arrivedRideStop
    && arrivedRideStop.id !== transitBoardedStopId) {
    leaveTransitVehicle(arrivedRideStop);
  }
  if (isRidingTransit) {
    const vehicle = getActiveTransitVehicle();
    player.position.set(vehicle.position.x, vehicle.position.y + 0.55, vehicle.position.z);
    player.rotation.y = vehicle.rotation.y;
    if (!isFirstPerson && !pointerDragging) cameraYaw = vehicle.rotation.y;
  }
  if (homeDoorPivot) {
    if (prefersReducedMotion) homeDoorPivot.rotation.y = homeDoorTargetAngle;
    else {
      const doorResponse = 1 - Math.exp(-7.5 * delta);
      homeDoorPivot.rotation.y += (homeDoorTargetAngle - homeDoorPivot.rotation.y) * doorResponse;
    }
  }

  if (!prefersReducedMotion) {
    for (const cloud of clouds) {
      cloud.position.x += cloud.userData.speed * delta;
      if (cloud.position.x > 115) cloud.position.x = -115;
    }
  }

  // Inputs are camera-relative, so forward always feels like forward after orbiting.
  let forwardInput = 0;
  let sideInput = 0;
  if (pressedKeys.has('w') || pressedKeys.has('arrowup')) forwardInput += 1;
  if (pressedKeys.has('s') || pressedKeys.has('arrowdown')) forwardInput -= 1;
  if (pressedKeys.has('d') || pressedKeys.has('arrowright')) sideInput += 1;
  if (pressedKeys.has('a') || pressedKeys.has('arrowleft')) sideInput -= 1;
  if (isRidingTransit) {
    forwardInput = 0;
    sideInput = 0;
  } else if (isDriving) {
    if (vehicleTouchInput.accelerate || vehicleAccelerateTapTimer > 0) forwardInput += 1;
    sideInput += joystickInput.x;
    forwardInput = clamp(forwardInput, -1, 1);
    sideInput = clamp(sideInput, -1, 1);
  } else {
    if (vehicleTouchInput.accelerate || vehicleAccelerateTapTimer > 0) forwardInput += 1;
    if (!isWatchingMatch && (Math.abs(joystickInput.x) > 0.04 || Math.abs(joystickInput.y) > 0.04)) {
      const nav = stepJoystickNavigation({
        joystickX: joystickInput.x,
        joystickY: joystickInput.y,
        delta,
        playerYaw: player.rotation.y,
        cameraYaw,
        cameraPitch,
        isFirstPerson,
        thirdPersonMovementState,
      });
      player.rotation.y = nav.playerYaw;
      cameraYaw = nav.cameraYaw;
      cameraPitch = nav.cameraPitch;
    }
    const movementMagnitude = Math.hypot(forwardInput, sideInput);
    if (movementMagnitude > 1) {
      forwardInput /= movementMagnitude;
      sideInput /= movementMagnitude;
    }
  }
  if (isWatchingMatch) {
    forwardInput = 0;
    sideInput = 0;
  }

  const inputMagnitude = Math.hypot(forwardInput, sideInput);
  const hasMovementInput = inputMagnitude > 0.08;
  const isRunning = !isDriving && pressedKeys.has('shift');
  const desiredDirection = animationScratch.desiredDirection.set(0, 0, 0);
  const followsResident = !isFirstPerson && !isDriving && !isRidingTransit && !isWorldView
    && !isWatchingMatch && cameraMode !== 'orbit';
  const followMovementYaw = getThirdPersonMovementYaw(
    thirdPersonMovementState,
    player.rotation.y,
    followsResident && hasMovementInput,
  );
  const movementYaw = followsResident ? followMovementYaw : cameraYaw;
  if (!isDriving && !isRidingTransit) {
    const forward = animationScratch.forward.set(Math.sin(movementYaw), 0, -Math.cos(movementYaw));
    const right = animationScratch.right.set(Math.cos(movementYaw), 0, Math.sin(movementYaw));
    desiredDirection.copy(forward).multiplyScalar(forwardInput).addScaledVector(right, sideInput);
  }

  let isMoving = false;
  for (let movementStep = 0; movementStep < movementSteps; movementStep += 1) {
    isMoving = false;
    if (isRidingTransit) {
      isMoving = false;
    } else if (isDriving) {
      updateVehicleMovement(movementStepDelta, forwardInput, sideInput);
      isMoving = Math.abs(playerCar?.speed || 0) > 0.15;
    } else {
      const speed = isRunning ? 9.0 : 5.1;
      const desiredVelocity = animationScratch.desiredVelocity.copy(desiredDirection).multiplyScalar(speed);
      const acceleration = isGrounded ? (hasMovementInput ? 12 : 17) : (hasMovementInput ? 4.8 : 1.5);
      const response = 1 - Math.exp(-acceleration * movementStepDelta);
      velocity.x += (desiredVelocity.x - velocity.x) * response;
      velocity.z += (desiredVelocity.z - velocity.z) * response;
      player.position.x += velocity.x * movementStepDelta;
      player.position.z += velocity.z * movementStepDelta;
      isMoving = Math.hypot(velocity.x, velocity.z) > 0.15;
    }

    const planarDistance = Math.hypot(player.position.x, player.position.z);
    if (!isRidingTransit && planarDistance > 70) {
      const correction = 70 / planarDistance;
      player.position.x *= correction;
      player.position.z *= correction;
      const outwardX = player.position.x / 70;
      const outwardZ = player.position.z / 70;
      if (isDriving && playerCar) {
        const forwardX = -Math.sin(playerCar.group.rotation.y);
        const forwardZ = -Math.cos(playerCar.group.rotation.y);
        if (playerCar.speed * (forwardX * outwardX + forwardZ * outwardZ) > 0) playerCar.speed = 0;
      } else {
        const outwardVelocity = velocity.x * outwardX + velocity.z * outwardZ;
        if (outwardVelocity > 0) {
          velocity.x -= outwardX * outwardVelocity;
          velocity.z -= outwardZ * outwardVelocity;
        }
      }
    }
    if (!isRidingTransit) {
      resolveHouseCollisions();
      resolveWorldObstacleCollisions();
      resolveHouseCollisions();
    }

    const residence = getCurrentResidence();
    const ground = isInsideHome && residence
      ? residence.group.position.y + HOME_FLOOR_TOP + PLAYER_FOOT_OFFSET
      : groundHeightAt(player.position.x, player.position.z);
    if (isRidingTransit) {
      jumpHeight = 0;
      jumpVelocity = 0;
      jumpRequested = false;
      jumpBufferTimer = 0;
      coyoteTimer = 0;
      isGrounded = true;
    } else if (isDriving) {
      jumpHeight = 0;
      jumpVelocity = 0;
      jumpRequested = false;
      jumpBufferTimer = 0;
      coyoteTimer = 0;
      isGrounded = true;
      if (playerCar) {
        playerCar.group.position.set(player.position.x, ground - PLAYER_FOOT_OFFSET, player.position.z);
        playerCar.group.rotation.y = player.rotation.y;
      }
    } else {
      if (jumpRequested) {
        jumpBufferTimer = JUMP_BUFFER_SECONDS;
        jumpRequested = false;
      } else {
        jumpBufferTimer = Math.max(0, jumpBufferTimer - movementStepDelta);
      }
      coyoteTimer = isGrounded ? COYOTE_TIME_SECONDS : Math.max(0, coyoteTimer - movementStepDelta);
      if (jumpBufferTimer > 0 && (isGrounded || coyoteTimer > 0)) {
        jumpVelocity = JUMP_SPEED;
        isGrounded = false;
        coyoteTimer = 0;
        jumpBufferTimer = 0;
      }
      if (!isGrounded) {
        jumpHeight += jumpVelocity * movementStepDelta;
        jumpVelocity -= PLAYER_GRAVITY * movementStepDelta;
        if (jumpHeight <= 0) {
          jumpHeight = 0;
          jumpVelocity = 0;
          isGrounded = true;
        }
      }
    }
    if (!isRidingTransit) player.position.y = ground + jumpHeight;
  }

  if (!isDriving && !isRidingTransit && hasMovementInput) {
    const targetYaw = Math.atan2(-desiredDirection.x, -desiredDirection.z);
    const angleDelta = Math.atan2(Math.sin(targetYaw - player.rotation.y), Math.cos(targetYaw - player.rotation.y));
    player.rotation.y += angleDelta * (1 - Math.exp(-12 * delta));
  }

  const gait = isMoving ? Math.sin(elapsedWorldTime * (isRunning ? 13.2 : 9.4)) : 0;
  const idleSway = prefersReducedMotion ? 0 : Math.sin(elapsedWorldTime * 1.35);
  legPivots[0].rotation.x = gait * (isMoving ? 0.43 : 0);
  legPivots[1].rotation.x = -gait * (isMoving ? 0.43 : 0);
  kneePivots[0].rotation.x = isMoving ? Math.max(0, -gait) * 0.3 : 0;
  kneePivots[1].rotation.x = isMoving ? Math.max(0, gait) * 0.3 : 0;
  armPivots[0].rotation.x = -gait * (isMoving ? 0.34 : 0) + idleSway * 0.018;
  armPivots[1].rotation.x = gait * (isMoving ? 0.34 : 0) - idleSway * 0.018;
  elbowPivots[0].rotation.x = -0.12 + Math.max(0, gait) * (isMoving ? 0.16 : 0);
  elbowPivots[1].rotation.x = -0.12 + Math.max(0, -gait) * (isMoving ? 0.16 : 0);
  headGroup.rotation.y = prefersReducedMotion ? 0 : Math.sin(elapsedWorldTime * 0.52) * 0.035;
  headGroup.rotation.x = (prefersReducedMotion ? 0 : Math.sin(elapsedWorldTime * 0.83) * 0.014) + (isMoving ? -0.018 : 0);
  const blinkPhase = elapsedWorldTime % 4.6;
  const blink = !prefersReducedMotion && blinkPhase < 0.18 ? Math.sin((blinkPhase / 0.18) * Math.PI) : 0;
  for (const eye of eyeGroups) eye.scale.y = 1 - blink * 0.86;
  torsoMesh.scale.y = prefersReducedMotion ? 1 : 1 + Math.sin(elapsedWorldTime * 1.7) * 0.004;
  avatarModel.position.y = (isMoving ? Math.abs(gait) * 0.034 : (prefersReducedMotion ? 0 : Math.sin(elapsedWorldTime * 1.7) * 0.012)) + jumpHeight * 0.035;
  backpack.rotation.z = isMoving ? gait * 0.013 : (prefersReducedMotion ? 0 : Math.sin(elapsedWorldTime * 1.2) * 0.008);
  backpack.rotation.x = isMoving ? Math.abs(gait) * 0.012 : -0.01;
  playerShadow.material.opacity = 0.24 - Math.min(jumpHeight * 0.025, 0.12);

  for (const seed of seeds) {
    if (seed.collected) continue;
    const float = prefersReducedMotion ? 0 : Math.sin(elapsedWorldTime * 1.8 + seed.phase) * 0.16;
    seed.orb.position.y = 1.16 + float;
    seed.hoop.position.y = 1.13 + float;
    seed.halo.position.y = 1.12 + float;
    seed.halo.rotation.z = prefersReducedMotion ? seed.phase : elapsedWorldTime * 0.32 + seed.phase;
    if (!prefersReducedMotion) seed.orb.rotation.y += delta * 0.75;
    seed.group.rotation.y = prefersReducedMotion ? 0 : Math.sin(elapsedWorldTime * 0.55 + seed.phase) * 0.12;
    if (Math.hypot(player.position.x - seed.x, player.position.z - seed.z) < 1.45) {
      seed.collected = true;
      seed.group.visible = false;
      seedCount += 1;
      updatePhoneQuestProgress();
      updateLocationAndMap();
      showToast(seedCount === seeds.length ? 'All three lights are home. Lovely work.' : 'You found a glow seed. Abuja is a little brighter.');
    }
  }

  if (!prefersReducedMotion || lastMoteReducedMotion !== prefersReducedMotion) {
    let moteOpacity = 0.7;
    for (let index = 0; index < motes.length; index += 1) {
      const data = motes[index];
      const angle = prefersReducedMotion ? data.phase : elapsedWorldTime * data.speed + data.phase;
      const verticalFloat = prefersReducedMotion ? 0 : Math.sin(angle * 1.6) * 0.45;
      moteTransform.position.set(
        Math.cos(angle) * data.radius,
        data.height + verticalFloat,
        Math.sin(angle) * data.radius,
      );
      moteTransform.updateMatrix();
      moteInstances.setMatrixAt(index, moteTransform.matrix);
      if (!prefersReducedMotion) moteOpacity = 0.55 + Math.sin(elapsedWorldTime * 3 + data.phase) * 0.35;
    }
    moteInstances.instanceMatrix.needsUpdate = true;
    moteMaterial.opacity = moteOpacity;
    lastMoteReducedMotion = prefersReducedMotion;
  }
  portalRing.rotation.z = prefersReducedMotion ? 0 : Math.sin(elapsedWorldTime * 0.55) * 0.035;
  portalGlow.material.opacity = prefersReducedMotion ? 0.17 : 0.17 + Math.sin(elapsedWorldTime * 1.25) * 0.045;
  beaconLight.intensity = prefersReducedMotion ? 3.8 : 3.8 + Math.sin(elapsedWorldTime * 1.25) * 0.5;

  if (isWatchingMatch) {
    const aspectRatio = window.innerWidth / Math.max(window.innerHeight, 1);
    const portraitView = aspectRatio < 0.82;
    const cameraDistance = portraitView ? 51 : 25;
    const cameraHeight = portraitView ? 20.5 : 10.2;
    const desiredCameraPosition = animationScratch.desiredCameraPosition.set(
      STADIUM.x + cameraDistance,
      stadium.group.position.y + cameraHeight,
      STADIUM.z + 0.6,
    );
    camera.position.lerp(desiredCameraPosition, 1 - Math.exp(-3.4 * delta));
    const lookAt = animationScratch.lookAtPosition.set(
      STADIUM.x + stadium.ball.position.x * 0.14,
      stadium.group.position.y + 1.15 + (stadium.ball.position.y - STADIUM.pitchOffset) * 0.1,
      STADIUM.z + stadium.ball.position.z * 0.14,
    );
    camera.lookAt(lookAt);
    updateStadiumBroadcast();
  } else if (isWorldView) {
    const angle = WORLD_VIEW_ANGLE * Math.PI / 180;
    const targetY = terrainHeight(0, 0);
    const horizontalDistance = Math.cos(angle) * worldViewCameraDistance;
    const desiredCameraPosition = animationScratch.desiredCameraPosition.set(
      Math.sin(cameraYaw) * horizontalDistance,
      targetY + Math.sin(angle) * worldViewCameraDistance,
      Math.cos(cameraYaw) * horizontalDistance,
    );
    camera.position.lerp(desiredCameraPosition, 1 - Math.exp(-1.8 * delta));
    camera.up.set(0, 1, 0);
    camera.lookAt(0, targetY, 0);
  } else if (isFirstPerson) {
    const seatOffset = animationScratch.seatOffset.set(0, 0, 0);
    if (isDriving && playerCar) {
      seatOffset.set(-0.23, 0, -0.36).applyAxisAngle(animationScratch.yawAxis, playerCar.group.rotation.y);
    }
    const eyePosition = animationScratch.eyePosition.set(
      player.position.x + seatOffset.x,
      player.position.y + (isDriving ? 1.31 : isRidingTransit ? 1.2 : avatarModel.position.y + 1.73),
      player.position.z + seatOffset.z,
    );
    const pitchCos = Math.cos(cameraPitch);
    const viewYaw = isDriving && playerCar ? -playerCar.group.rotation.y + drivingViewYawOffset : cameraYaw;
    const viewDirection = animationScratch.viewDirection.set(
      Math.sin(viewYaw) * pitchCos,
      Math.sin(cameraPitch),
      -Math.cos(viewYaw) * pitchCos,
    );
    camera.position.lerp(eyePosition, 1 - Math.exp(-18 * delta));
    camera.lookAt(animationScratch.lookAtPosition.copy(eyePosition).addScaledVector(viewDirection, 18));
  } else if (cameraMode === 'overhead') {
    const cameraDistance = isInsideHome ? 2.4 : isDriving ? 4.2 : 3.8;
    const cameraHeight = isInsideHome ? 8.5 : isDriving ? 15.5 : 16.5;
    const lookHeight = isDriving ? 1.1 : 1.2;
    const behindOffset = setBehindPlayerOffset(
      animationScratch.behindCameraOffset,
      player.rotation.y,
      cameraDistance,
    );
    const desiredCameraPosition = animationScratch.desiredCameraPosition.set(
      player.position.x + behindOffset.x,
      player.position.y + cameraHeight + jumpHeight * 0.12,
      player.position.z + behindOffset.z,
    );
    camera.position.lerp(desiredCameraPosition, 1 - Math.exp(-6 * delta));
    camera.up.set(0, 1, 0);
    camera.lookAt(player.position.x, player.position.y + lookHeight + jumpHeight * 0.08, player.position.z);
  } else if (isInsideHome && getCurrentResidence()) {
    const residence = getCurrentResidence();
    const local = homeWorldToLocal(player.position.x, player.position.z);
    const orbitYaw = cameraMode === 'orbit'
      ? cameraYaw - residence.facing
      : player.rotation.y - residence.facing;
    const behindOffset = setBehindPlayerOffset(animationScratch.behindCameraOffset, orbitYaw, 4.15);
    const cameraLocal = homeLocalToWorld(
      local.x + behindOffset.x,
      local.z + behindOffset.z,
    );
    const desiredCameraPosition = animationScratch.desiredCameraPosition.set(
      cameraLocal.x,
      player.position.y + 2.35 + jumpHeight * 0.12,
      cameraLocal.z,
    );
    camera.position.lerp(desiredCameraPosition, 1 - Math.exp(-7 * delta));
    camera.lookAt(player.position.x, player.position.y + 1.2 + jumpHeight * 0.08, player.position.z);
  } else {
    const cameraDistance = isDriving ? 12.6 : 10.8;
    const cameraHeight = isDriving ? 4.8 : 6.2;
    const lookHeight = isDriving ? 0.98 : 1.24;
    const cameraYawForPosition = cameraMode === 'orbit' ? cameraYaw : player.rotation.y;
    const behindOffset = setBehindPlayerOffset(
      animationScratch.behindCameraOffset,
      cameraYawForPosition,
      cameraDistance,
    );
    const desiredCameraPosition = animationScratch.desiredCameraPosition.set(
      player.position.x + behindOffset.x,
      player.position.y + cameraHeight + jumpHeight * 0.16,
      player.position.z + behindOffset.z,
    );
    camera.position.lerp(desiredCameraPosition, 1 - Math.exp(-5.2 * delta));
    camera.lookAt(player.position.x, player.position.y + lookHeight + jumpHeight * 0.12, player.position.z);
  }

  uiAccumulator += delta;
  if (uiAccumulator > 0.14) {
    updateLocationAndMap();
    uiAccumulator = 0;
  }

  if (lastShadowUpdateTimestamp === null
    || timestamp - lastShadowUpdateTimestamp >= SHADOW_UPDATE_INTERVAL_MS) {
    renderer.shadowMap.needsUpdate = true;
    lastShadowUpdateTimestamp = timestamp;
  }
  if (performanceHud) renderer.info.reset();
  renderer.render(scene, camera);
  if (!hasRenderedInitialFrame) {
    hasRenderedInitialFrame = true;
    if (typeof window.vertualworldBoot?.ready === 'function') {
      window.vertualworldBoot.ready();
    } else {
      requestAnimationFrame(() => loadingScreen.classList.add('is-ready'));
    }
  }
  if (performanceHud) updatePerformanceHud(timestamp, performance.now() - performanceFrameStart);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  if (isWorldView) updateWorldViewProjection();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, RENDER_PIXEL_RATIO_CAP));
  renderer.setSize(width, height, false);
}
window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (animationFrameHandle !== null) cancelAnimationFrame(animationFrameHandle);
    animationFrameHandle = null;
    lastAnimationTimestamp = null;
    lastShadowUpdateTimestamp = null;
    frameIntervalAccumulator = 0;
    resetPerformanceHudWindow();
    clock.stop();
    return;
  }
  lastAnimationTimestamp = null;
  lastShadowUpdateTimestamp = null;
  frameIntervalAccumulator = 0;
  clock.start();
  scheduleAnimationFrame();
});

updateLocationAndMap();
updateClock();
updateDaylight();
scheduleAnimationFrame();
