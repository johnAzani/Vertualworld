export const CAMERA_MODE_ORDER = Object.freeze(['follow', 'orbit', 'overhead', 'first-person']);

export function getNextCameraMode(currentMode) {
  const currentIndex = CAMERA_MODE_ORDER.indexOf(currentMode);
  return CAMERA_MODE_ORDER[(currentIndex + 1 + CAMERA_MODE_ORDER.length) % CAMERA_MODE_ORDER.length];
}

export function createThirdPersonMovementState() {
  return { yaw: 0, hasInput: false };
}

// The avatar faces local -Z, so its forward movement yaw is the inverse of its
// Three.js Y rotation. Keep that movement basis steady until the input ends;
// otherwise a following camera would rotate the controls while they are held.
export function getThirdPersonMovementYaw(state, playerYaw, hasMovementInput) {
  const isMoving = Boolean(hasMovementInput);
  if (!isMoving || !state.hasInput) state.yaw = -playerYaw;
  state.hasInput = isMoving;
  return state.yaw;
}

// Return the horizontal offset from the avatar to a camera positioned behind it.
export function setBehindPlayerOffset(target, playerYaw, distance) {
  target.set(Math.sin(playerYaw) * distance, 0, Math.cos(playerYaw) * distance);
  return target;
}
