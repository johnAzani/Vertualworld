/**
 * Biomechanical human walk & run cycle kinematics for articulated Three.js characters.
 *
 * Coordinate convention (matching the resident avatar in src/main.js and players in src/stadium.js):
 * - Character faces -Z, with +Y up, +X right, and limb segments extending downward along -Y.
 * - Rotating a downward limb (0, -L, 0) around +X by angle `theta` produces z' = -L * sin(theta):
 *   - `theta > 0` swings the limb FORWARD (-Z).
 *   - `theta < 0` swings the limb BACKWARD (+Z).
 * - Therefore:
 *   - Hip flexion (thigh forward) is POSITIVE (`legPivot.rotation.x > 0`).
 *   - Knee flexion (shin bending backward relative to thigh) is NEGATIVE (`kneePivot.rotation.x <= 0`).
 *   - Elbow flexion (forearm bending forward relative to upper arm) is POSITIVE (`elbowPivot.rotation.x >= 0`).
 */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function computeLegPhasePose(phase, strideAmount, isRunning = false) {
  const amount = clamp(Number(strideAmount) || 0, 0, 1.25);
  const sinPhase = Math.sin(phase);
  const cosPhase = Math.cos(phase);

  // Hip flexion (+ = forward toward -Z) and extension (- = backward toward +Z).
  // During the forward swing (cosPhase > 0), the thigh lifts slightly higher to clear the ground.
  const hipAmplitude = isRunning ? 0.68 : 0.46;
  const swingHipLift = isRunning ? 0.16 : 0.09;
  const hipPitch = amount * (
    sinPhase * hipAmplitude
    + Math.max(0, cosPhase) * swingHipLift
  );

  // Knee flexion (always <= 0 so the shin bends backward toward +Z, never hyperextending forward).
  // 1) Swing clearance bend: peaks as the leg swings from back (-Z/toe-off) through mid-swing (cosPhase > 0).
  const swingWave = Math.max(0, Math.cos(phase + 0.28));
  const swingKneeBend = Math.pow(swingWave, 1.35) * (isRunning ? 1.08 : 0.68);

  // 2) Stance weight-acceptance cushion: right after heel-strike (sinPhase > 0 && cosPhase < 0),
  //    the knee flexes slightly to absorb impact before extending through mid-stance.
  const isStance = cosPhase < 0;
  const stanceCushionWave = isStance ? Math.max(0, Math.sin(phase) * -cosPhase * 2) : 0;
  const stanceKneeBend = stanceCushionWave * (isRunning ? 0.24 : 0.15);

  const restingKneeBend = 0.035;
  const kneePitch = -(restingKneeBend + amount * (swingKneeBend + stanceKneeBend));

  // Ankle / foot pitch:
  // - Dorsiflexion (+ = toes up) at heel strike (sinPhase > 0) and during mid-swing toe clearance.
  // - Plantarflexion (- = toes pointed down) at push-off / toe-off (sinPhase < 0 && cosPhase > -0.4).
  const heelStrikeToeUp = Math.max(0, sinPhase) * (isRunning ? 0.22 : 0.18);
  const pushOffToeDown = Math.max(0, -sinPhase) * (isRunning ? 0.28 : 0.22);
  const swingToeClearance = Math.max(0, cosPhase) * 0.08;
  const anklePitch = amount * (heelStrikeToeUp + swingToeClearance - pushOffToeDown);

  return {
    hipPitch,
    kneePitch,
    anklePitch,
  };
}

export function computeWalkCyclePose({
  phase = 0,
  strideAmount = 0,
  isRunning = false,
  idleSway = 0,
  jumpHeight = 0,
} = {}) {
  const amount = clamp(Number(strideAmount) || 0, 0, 1.25);
  const leftPhase = phase;
  const rightPhase = phase + Math.PI;

  const leftLeg = computeLegPhasePose(leftPhase, amount, isRunning);
  const rightLeg = computeLegPhasePose(rightPhase, amount, isRunning);

  // In air (jumping), tuck legs slightly with anatomically bent knees.
  const airFactor = clamp(jumpHeight / 0.45, 0, 1);
  if (airFactor > 0) {
    leftLeg.hipPitch = leftLeg.hipPitch * (1 - airFactor * 0.35) + 0.22 * airFactor;
    rightLeg.hipPitch = rightLeg.hipPitch * (1 - airFactor * 0.35) + 0.12 * airFactor;
    leftLeg.kneePitch = Math.min(leftLeg.kneePitch, -0.38 * airFactor);
    rightLeg.kneePitch = Math.min(rightLeg.kneePitch, -0.28 * airFactor);
  }

  // Opposite arm swings forward with opposite leg (left arm with right leg, right arm with left leg).
  const armAmplitude = isRunning ? 0.52 : 0.34;
  const leftArmSwing = Math.sin(rightPhase) * armAmplitude * amount;
  const rightArmSwing = Math.sin(leftPhase) * armAmplitude * amount;

  const leftArmPitch = leftArmSwing + idleSway * 0.018;
  const rightArmPitch = rightArmSwing - idleSway * 0.018;

  // Elbows bend forward (+ > 0), flexing more during the forward arm swing and when running.
  const baseElbowBend = isRunning ? 0.42 : 0.14;
  const elbowSwingGain = isRunning ? 0.34 : 0.18;
  const leftElbowPitch = baseElbowBend + Math.max(0, Math.sin(rightPhase)) * elbowSwingGain * amount;
  const rightElbowPitch = baseElbowBend + Math.max(0, Math.sin(leftPhase)) * elbowSwingGain * amount;

  // Double-frequency vertical bob (highest at mid-stance of each leg, lowest at double-support).
  const doubleStepWave = -Math.cos(phase * 2);
  const verticalBob = amount > 0.02
    ? (doubleStepWave * 0.5 + 0.5) * (isRunning ? 0.052 : 0.032) * amount
    : 0;

  // Subtle pelvic yaw counter-rotation and lateral hip roll.
  const pelvisYaw = Math.sin(phase) * (isRunning ? 0.085 : 0.055) * amount;
  const pelvisRoll = Math.cos(phase) * (isRunning ? 0.045 : 0.03) * amount;
  const torsoForwardLean = isRunning ? 0.08 * amount : 0.025 * amount;

  return {
    leftLeg,
    rightLeg,
    leftArmPitch,
    rightArmPitch,
    leftElbowPitch,
    rightElbowPitch,
    verticalBob,
    pelvisYaw,
    pelvisRoll,
    torsoForwardLean,
  };
}

export function computeSeatedPose({ goalCheer = 0, idleSway = 0 } = {}) {
  return {
    // Thighs pitched forward (+ > 0 toward -Z) to rest horizontally on the seat cushion
    hipPitch: 1.28,
    // Knees bent downward/backward (- < 0 toward +Z) so calves hang vertically to the floor
    kneePitch: -1.24,
    anklePitch: 0.04,
    leftArmPitch: goalCheer > 0 ? 2.1 + goalCheer * 0.35 : 0.36 + idleSway * 0.03,
    rightArmPitch: goalCheer > 0 ? 2.1 - goalCheer * 0.35 : 0.36 - idleSway * 0.03,
    leftElbowPitch: goalCheer > 0 ? 0.45 : 0.38,
    rightElbowPitch: goalCheer > 0 ? 0.45 : 0.38,
    avatarOffsetY: -0.26,
  };
}
