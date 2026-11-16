import assert from 'node:assert/strict';
import test from 'node:test';
import { createStadium, STADIUM_CONFIG, updateStadiumMatch } from '../src/stadium.js';
import { computeLegPhasePose, computeSeatedPose, computeWalkCyclePose } from '../src/walk-cycle.js';

test('legPivots and kneePivots follow an anatomically realistic human gait cycle without knee hyperextension', () => {
  for (let step = 0; step < 64; step += 1) {
    const phase = (step / 64) * Math.PI * 2;
    const walkPose = computeWalkCyclePose({ phase, strideAmount: 1, isRunning: false });
    const runPose = computeWalkCyclePose({ phase, strideAmount: 1, isRunning: true });

    assert.ok(
      walkPose.leftLeg.kneePitch <= -0.03,
      `walking left kneePitch (${walkPose.leftLeg.kneePitch}) never hyperextends forward at phase ${phase.toFixed(2)}`,
    );
    assert.ok(
      walkPose.rightLeg.kneePitch <= -0.03,
      `walking right kneePitch (${walkPose.rightLeg.kneePitch}) never hyperextends forward at phase ${phase.toFixed(2)}`,
    );
    assert.ok(
      runPose.leftLeg.kneePitch <= -0.03,
      `running left kneePitch (${runPose.leftLeg.kneePitch}) never hyperextends forward at phase ${phase.toFixed(2)}`,
    );
    assert.ok(walkPose.leftElbowPitch > 0, 'left elbow bends forward anatomically');
    assert.ok(walkPose.rightElbowPitch > 0, 'right elbow bends forward anatomically');
  }

  // Mid-swing (phase = 0): knee flexes deeply backward to clear the ground while thigh lifts forward
  const midSwing = computeLegPhasePose(0, 1, false);
  // Heel-strike (phase = PI / 2): thigh is extended forward (hipPitch > 0) and knee is nearly straight
  const heelStrike = computeLegPhasePose(Math.PI / 2, 1, false);
  // Early stance weight-acceptance (phase = 2.1): knee cushions impact more than at heel strike
  const stanceCushion = computeLegPhasePose(2.1, 1, false);
  // Push-off / toe-off (phase = -PI / 2): thigh is extended backward (hipPitch < 0) and ankle plantarflexes
  const toeOff = computeLegPhasePose(-Math.PI / 2, 1, false);

  assert.ok(midSwing.kneePitch < -0.55, 'mid-swing bends the knee deeply for foot clearance');
  assert.ok(heelStrike.hipPitch > 0.4, 'heel-strike extends the hip forward');
  assert.ok(Math.abs(heelStrike.kneePitch) < Math.abs(midSwing.kneePitch) * 0.25, 'knee straightens at heel strike');
  assert.ok(stanceCushion.kneePitch < heelStrike.kneePitch, 'early stance exhibits weight-acceptance knee flexion');
  assert.ok(toeOff.hipPitch < -0.4, 'toe-off extends the hip backward');
  assert.ok(toeOff.anklePitch < 0, 'toe-off plantarflexes the ankle');
  assert.ok(heelStrike.anklePitch > 0, 'heel-strike dorsiflexes the ankle');
});

test('running increases legPivot stride amplitude and kneePivot swing lift, and seated pose aligns thighs and calves', () => {
  const walkMidSwing = computeWalkCyclePose({ phase: 0, strideAmount: 1, isRunning: false });
  const runMidSwing = computeWalkCyclePose({ phase: 0, strideAmount: 1, isRunning: true });

  assert.ok(
    Math.abs(runMidSwing.leftLeg.kneePitch) > Math.abs(walkMidSwing.leftLeg.kneePitch),
    'running produces deeper knee flexion during swing than walking',
  );

  const seated = computeSeatedPose({ goalCheer: 0 });
  assert.ok(seated.hipPitch > 1.0, 'seated hipPitch swings thighs forward onto the seat');
  assert.ok(seated.kneePitch < -1.0, 'seated kneePitch bends calves downward to the floor');
});

test('stadium football players also animate articulated legPivots and kneePivots', () => {
  const stadium = createStadium(() => STADIUM_CONFIG.level);
  const samplePlayer = stadium.teams[0].players[1];
  assert.equal(samplePlayer.legPivots.length, 2, 'stadium player has two articulated hip legPivots');
  assert.equal(samplePlayer.kneePivots.length, 2, 'stadium player has two articulated kneePivots');

  updateStadiumMatch(stadium, 0.16, false, 0);
  assert.ok(samplePlayer.kneePivots[0].rotation.x <= 0, 'stadium player kneePivot bends backward anatomically');
  assert.ok(samplePlayer.kneePivots[1].rotation.x <= 0, 'stadium player right kneePivot bends backward anatomically');
});
