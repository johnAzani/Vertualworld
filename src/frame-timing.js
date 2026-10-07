export const MAX_FRAME_DELTA_SECONDS = 0.1;
export const MAX_MOVEMENT_STEP_SECONDS = 1 / 60;

/**
 * Keep movement time proportional to elapsed time while bounding catch-up work.
 * A long render frame is split into small movement/collision steps; after 100 ms
 * the excess is intentionally discarded to avoid an unbounded catch-up spiral.
 */
export function getFrameTiming(rawDelta) {
  const safeRawDelta = Number.isFinite(rawDelta) ? Math.max(0, rawDelta) : 0;
  const delta = Math.min(safeRawDelta, MAX_FRAME_DELTA_SECONDS);
  const movementSteps = Math.max(1, Math.ceil(delta / MAX_MOVEMENT_STEP_SECONDS));
  return {
    delta,
    movementSteps,
    movementStepDelta: delta / movementSteps,
  };
}
