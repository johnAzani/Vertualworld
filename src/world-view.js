export const WORLD_VIEW_RADIUS = 74;
export const WORLD_VIEW_FOV = 49;
export const WORLD_VIEW_ANGLE = 65;
export const WORLD_VIEW_MARGIN = 1.1;

export function getWorldViewCameraDistance({
  aspect = 16 / 9,
  fovDegrees = WORLD_VIEW_FOV,
  angleDegrees = WORLD_VIEW_ANGLE,
  radius = WORLD_VIEW_RADIUS,
  margin = WORLD_VIEW_MARGIN,
} = {}) {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  const safeFov = Number.isFinite(fovDegrees) ? Math.max(10, Math.min(110, fovDegrees)) : WORLD_VIEW_FOV;
  const safeAngle = Number.isFinite(angleDegrees) ? Math.max(25, Math.min(85, angleDegrees)) : WORLD_VIEW_ANGLE;
  const safeRadius = Number.isFinite(radius) && radius > 0 ? radius : WORLD_VIEW_RADIUS;
  const safeMargin = Number.isFinite(margin) && margin >= 1 ? margin : WORLD_VIEW_MARGIN;
  const tangent = Math.tan((safeFov * Math.PI / 180) / 2);
  const verticalLimit = Math.sin(safeAngle * Math.PI / 180);
  const horizontalLimit = 1 / safeAspect;
  return safeRadius * safeMargin * Math.max(verticalLimit, horizontalLimit) / tangent;
}
