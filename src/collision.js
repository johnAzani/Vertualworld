function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

/**
 * Push a circular ground-plane collider out of a rotated rectangular obstacle.
 * The returned normal points away from the obstacle in world XZ coordinates.
 */
export function resolveDiscAgainstOrientedBox(position, box, radius) {
  if (!position || !box || !Number.isFinite(radius) || radius < 0) return null;

  const halfX = Math.max(0, Number(box.halfX) || 0);
  const halfZ = Math.max(0, Number(box.halfZ) || 0);
  const yaw = Number.isFinite(box.yaw) ? box.yaw : 0;
  const cosine = Math.cos(yaw);
  const sine = Math.sin(yaw);
  const offsetX = position.x - box.x;
  const offsetZ = position.z - box.z;
  let localX = offsetX * cosine - offsetZ * sine;
  let localZ = offsetX * sine + offsetZ * cosine;
  const closestX = clamp(localX, -halfX, halfX);
  const closestZ = clamp(localZ, -halfZ, halfZ);
  let normalLocalX = localX - closestX;
  let normalLocalZ = localZ - closestZ;
  const distance = Math.hypot(normalLocalX, normalLocalZ);

  if (distance > 1e-8) {
    const penetration = radius - distance;
    if (penetration <= 0) return null;
    normalLocalX /= distance;
    normalLocalZ /= distance;
    localX += normalLocalX * penetration;
    localZ += normalLocalZ * penetration;
  } else {
    // The centre is inside the box. Exit through the nearest face, including
    // the collider radius, rather than leaving it embedded in the wall.
    const overlapX = halfX + radius - Math.abs(localX);
    const overlapZ = halfZ + radius - Math.abs(localZ);
    if (overlapX <= 0 || overlapZ <= 0) return null;
    if (overlapX < overlapZ) {
      normalLocalX = Math.sign(localX) || 1;
      normalLocalZ = 0;
      localX = normalLocalX * (halfX + radius);
    } else {
      normalLocalX = 0;
      normalLocalZ = Math.sign(localZ) || 1;
      localZ = normalLocalZ * (halfZ + radius);
    }
  }

  position.x = box.x + localX * cosine + localZ * sine;
  position.z = box.z - localX * sine + localZ * cosine;
  return {
    normalX: normalLocalX * cosine + normalLocalZ * sine,
    normalZ: -normalLocalX * sine + normalLocalZ * cosine,
  };
}
