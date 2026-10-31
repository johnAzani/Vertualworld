import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';

import { createAtmosphereAudio } from '../src/atmosphere-audio.js';
import {
  WEATHER_MODES,
  createRainField,
  createStormFlash,
  createWeatherState,
  getScheduledWeather,
  nextWeatherMode,
  resolveWeatherMode,
  updateRainDrops,
} from '../src/weather.js';
import { createBirdFlock, createFireflies } from '../src/sky-life.js';
import { PEDESTRIAN_PROMENADE_PATHS, createPedestrianCrowd } from '../src/pedestrians.js';

// ——— Stub Web Audio context that records every node the engine builds ———
function createStubAudioContextClass() {
  const created = { gains: 0, sources: 0, oscillators: 0, filters: 0, buffers: 0 };
  class StubNode {
    constructor(kind) {
      this.kind = kind;
      this.gain = {
        value: 0,
        setValueAtTime() {},
        exponentialRampToValueAtTime() {},
        setTargetAtTime() {},
      };
      this.frequency = {
        value: 0,
        setValueAtTime() {},
        exponentialRampToValueAtTime() {},
      };
      this.Q = { value: 0 };
      this.playbackRate = { value: 1 };
      this.type = '';
      this.buffer = null;
      this.loop = false;
      this._connections = [];
    }
    connect(node) { this._connections.push(node); return node; }
    start() {}
    stop() {}
    addEventListener() {}
    close() {}
    suspend() {}
    resume() {}
  }
  class StubAudioContext {
    constructor() {
      this.currentTime = 0;
      this.sampleRate = 8000;
      this.destination = new StubNode('destination');
      created.contexts = (created.contexts ?? 0) + 1;
    }
    createGain() { created.gains += 1; return new StubNode('gain'); }
    createBufferSource() { created.sources += 1; return new StubNode('source'); }
    createOscillator() { created.oscillators += 1; return new StubNode('oscillator'); }
    createBiquadFilter() { created.filters += 1; return new StubNode('filter'); }
    createBuffer(_channels, length) {
      created.buffers += 1;
      return { getChannelData: () => new Float32Array(length) };
    }
  }
  return { StubAudioContext, created };
}

test('atmosphere audio degrades to a safe no-op without the Web Audio API', () => {
  const audio = createAtmosphereAudio({ audioContextClass: null, storage: null });
  assert.equal(audio.available, false);
  audio.start();
  audio.setEnvironment({ night: 1, rain: 1 });
  audio.update(0.016);
  audio.footstep('road', 1);
  audio.jump();
  audio.land(3);
  audio.playUiBlip('tap');
  audio.setEnabled(false);
  audio.dispose();
});

test('atmosphere audio builds the ambient graph on start and persists mute state', () => {
  const { StubAudioContext, created } = createStubAudioContextClass();
  const storageMap = new Map();
  const storage = {
    getItem: (k) => storageMap.get(k) ?? null,
    setItem: (k, v) => storageMap.set(k, v),
  };
  const audio = createAtmosphereAudio({ audioContextClass: StubAudioContext, storage });
  assert.equal(audio.available, true);
  assert.equal(audio.isEnabled(), true);
  audio.start();
  // Wind + city hum + room tone + rain high + rain low = 5 looped noise chains.
  assert.ok(created.sources >= 5, `expected 5+ looping noise sources, got ${created.sources}`);
  assert.ok(created.filters >= 5, 'each loop has its own filter');
  assert.ok(created.buffers >= 1, 'a noise buffer is synthesized');

  audio.setEnabled(false);
  assert.equal(audio.isEnabled(), false);
  assert.equal(storageMap.get('vertualworld-sound'), 'muted', 'mute preference persists');
  audio.setEnabled(true);
  assert.equal(storageMap.get('vertualworld-sound'), 'on');
  audio.dispose();
});

test('atmosphere audio schedules birds by day and crickets by night as the clock advances', () => {
  const { StubAudioContext, created } = createStubAudioContextClass();
  const audio = createAtmosphereAudio({ audioContextClass: StubAudioContext, storage: null, random: () => 0.5 });
  audio.start();

  // Daytime: birds should chirp within ~12s of context time.
  audio.setEnvironment({ night: 0, rain: 0 });
  const oscillatorsBeforeBirds = created.oscillators;
  for (let i = 0; i < 40; i += 1) {
    audio.update(0.5);
  }
  assert.ok(created.oscillators > oscillatorsBeforeBirds, 'daytime bird chirps create oscillator notes');

  // Night: cricket pulses fire; birds stop.
  audio.setEnvironment({ night: 1, rain: 0 });
  const oscillatorsBeforeCrickets = created.oscillators;
  for (let i = 0; i < 40; i += 1) {
    audio.update(0.5);
  }
  assert.ok(created.oscillators > oscillatorsBeforeCrickets, 'night cricket pulses create oscillator notes');
});

test('weather schedule is deterministic across the game day', () => {
  assert.equal(getScheduledWeather(6.5), 'harmattan', 'hazy dawn');
  assert.equal(getScheduledWeather(9), 'clear');
  assert.equal(getScheduledWeather(15), 'rain', 'afternoon shower');
  assert.equal(getScheduledWeather(2.8), 'rain', 'pre-dawn drizzle');
  assert.equal(getScheduledWeather(20), 'clear');
  assert.equal(getScheduledWeather(30.5), 'harmattan', 'hours wrap around the day (30.5 ≡ 6.5)');
  for (let hour = 0; hour < 24; hour += 0.5) {
    assert.ok(WEATHER_MODES.includes(getScheduledWeather(hour)));
  }
});

test('manual weather overrides the schedule and the mode cycles', () => {
  assert.equal(resolveWeatherMode({ manualMode: null, hourOfDay: 15 }), 'rain');
  assert.equal(resolveWeatherMode({ manualMode: 'clear', hourOfDay: 15 }), 'clear');
  assert.equal(resolveWeatherMode({ manualMode: 'nonsense', hourOfDay: 15 }), 'rain', 'invalid manual falls back to schedule');
  assert.equal(nextWeatherMode('clear'), 'rain');
  assert.equal(nextWeatherMode('rain'), 'harmattan');
  assert.equal(nextWeatherMode('harmattan'), 'clear');
});

test('weather state crossfades smoothly between modes', () => {
  const weather = createWeatherState({ transitionRate: 0.24 });
  assert.equal(weather.rain, 0);
  for (let i = 0; i < 200; i += 1) weather.update(0.05, 'rain');
  assert.ok(weather.rain > 0.99, `rain should ease to 1, got ${weather.rain}`);
  for (let i = 0; i < 200; i += 1) weather.update(0.05, 'clear');
  assert.ok(weather.rain < 0.01, 'rain should ease back to 0');
  assert.ok(weather.harmattan === 0, 'harmattan untouched by rain mode');
});

test('storm flash only strikes in heavy rain, and each strike decays', () => {
  const flash = createStormFlash({ random: () => 0.5, minInterval: 1, maxInterval: 1, threshold: 0.55 });
  // Clear skies: no flashes no matter how long we wait.
  for (let i = 0; i < 200; i += 1) {
    const intensity = flash.update(0.1, 0);
    assert.equal(flash.fired, false);
    assert.equal(intensity, 0);
  }
  // Heavy rain: once the interval elapses the sky flashes and thunder is flagged.
  let sawFlash = false;
  let sawFire = false;
  for (let i = 0; i < 40; i += 1) {
    const intensity = flash.update(0.1, 0.9);
    if (flash.fired) {
      sawFire = true;
      assert.ok(intensity > 0.6, 'a fresh strike is bright');
    }
    if (intensity > 0) sawFlash = true;
  }
  assert.ok(sawFire, 'storm fires under heavy rain');
  assert.ok(sawFlash, 'flash intensity rises above zero');
  // Once the rain lets up, the flash decays fully and no new strikes fire.
  let last = 1;
  for (let i = 0; i < 80; i += 1) last = flash.update(0.1, 0);
  assert.equal(last, 0, 'flash fully decays after the storm passes');
  assert.equal(flash.fired, false, 'no strikes without rain');
});

test('atmosphere audio plays thunder on demand and honks during the day', () => {
  const { StubAudioContext, created } = createStubAudioContextClass();
  const audio = createAtmosphereAudio({ audioContextClass: StubAudioContext, storage: null, random: () => 0.5 });
  audio.start();

  const sourcesBeforeThunder = created.sources;
  audio.playThunder();
  assert.ok(created.sources > sourcesBeforeThunder, 'thunder builds a rumble source');
  assert.equal(audio.stats.thunders, 1, 'thunder is counted');

  // Daytime: distant honks are scheduled over time; birds chirp too.
  audio.setEnvironment({ night: 0, rain: 0 });
  for (let i = 0; i < 200; i += 1) audio.update(0.5);
  assert.ok(audio.stats.honks >= 2, `daytime honks fire over two minutes, got ${audio.stats.honks}`);
  assert.ok(audio.stats.birds >= 2, `daytime birds chirp too, got ${audio.stats.birds}`);

  // Quiet night: no honks once the sun is down.
  const honksAtDusk = audio.stats.honks;
  audio.setEnvironment({ night: 1, rain: 0 });
  for (let i = 0; i < 200; i += 1) audio.update(0.5);
  assert.equal(audio.stats.honks, honksAtDusk, 'no daytime honks at night');
  assert.ok(audio.stats.crickets > 0, 'crickets take over after dark');
});

test('rain drops fall, slant with the wind, and recycle around the camera', () => {
  const count = 4;
  const positions = new Float32Array(count * 6);
  const heights = new Float32Array(count).fill(10);
  // Drop 0 starts above the camera and should fall.
  positions[0] = 0;
  positions[1] = 10;
  positions[2] = 0;
  // Drop 1 starts below the floor and must respawn above the camera.
  positions[6] = 0;
  positions[7] = -50;
  positions[8] = 0;

  updateRainDrops({ positions, heights, count, delta: 0.1, cameraX: 0, cameraY: 0, cameraZ: 0, windX: -2, dropLength: 0.6, random: () => 0.5 });

  assert.ok(positions[1] < 10, 'the falling drop moved down');
  assert.ok(positions[0] < 0, 'wind slants the streak along its drift direction');
  assert.ok(positions[7] > 2, 'the dead drop respawned above the camera');
  // Streak tail sits above the head by dropLength.
  assert.ok(Math.abs(positions[4] - (positions[1] + 0.6)) < 1e-6, 'tail is offset by dropLength');
});

test('rain field hides itself when intensity fades out', () => {
  const field = createRainField({ count: 8, random: () => 0.5 });
  assert.equal(field.object3D.visible, false);
  field.update(0.016, new THREE.Vector3(0, 0, 0), 0.8);
  assert.equal(field.object3D.visible, true);
  assert.ok(field.object3D.material.opacity > 0.1, 'rain is translucent');
  field.update(0.016, new THREE.Vector3(0, 0, 0), 0);
  assert.equal(field.object3D.visible, false);
  field.dispose();
});

test('bird flock circles the city with animated wing flaps', () => {
  const flock = createBirdFlock({ count: 5, random: () => 0.5 });
  assert.equal(flock.mesh.count, 5);
  assert.equal(flock.mesh.castShadow, false, 'birds never enter the shadow pass');
  flock.update(0);
  const first = new THREE.Matrix4();
  flock.mesh.getMatrixAt(0, first);
  flock.update(10);
  const second = new THREE.Matrix4();
  flock.mesh.getMatrixAt(0, second);
  assert.ok(!first.equals(second), 'bird poses animate over time');
  const position = new THREE.Vector3().setFromMatrixPosition(second);
  assert.ok(position.y > 10, 'birds fly high above the city');
  flock.dispose();
});

test('fireflies only glow after dark and drift near the ground', () => {
  const fireflies = createFireflies({ count: 20, random: () => 0.5 });
  fireflies.update(1.5, 0);
  assert.equal(fireflies.points.visible, false, 'invisible during the day');
  fireflies.update(1.5, 0.9);
  assert.equal(fireflies.points.visible, true, 'visible at night');
  assert.ok(fireflies.points.material.opacity > 0.2, 'fireflies glow at night');
  const attribute = fireflies.points.geometry.attributes.position;
  for (let i = 0; i < attribute.count; i += 1) {
    assert.ok(attribute.getY(i) < 8, 'fireflies stay near the ground');
  }
  fireflies.dispose();
});

test('pedestrian promenade paths match the world roads', () => {
  assert.ok(PEDESTRIAN_PROMENADE_PATHS.length >= 4, 'at least four promenade loops');
  for (const path of PEDESTRIAN_PROMENADE_PATHS) {
    assert.ok(path.length >= 4, 'each loop has waypoints');
    for (const [x, z] of path) {
      assert.ok(Math.abs(x) < 124 && Math.abs(z) < 124, 'waypoints stay inside the playable world');
    }
  }
});

test('pedestrian crowd walks its loop, articulates limbs, culls by distance, and never shadows', () => {
  const crowd = createPedestrianCrowd({ groundHeightAt: () => 0.25, count: 4, random: () => 0.5 });
  assert.equal(crowd.walkers.length, 4);
  let meshCount = 0;
  crowd.group.traverse((obj) => {
    if (obj.isMesh) {
      meshCount += 1;
      assert.equal(obj.castShadow, false, 'pedestrians stay out of the shadow pass');
    }
  });
  assert.equal(meshCount, 4 * 8, 'each walker is 8 articulated meshes');

  const [walker] = crowd.walkers;
  const rig = walker.rig.group;
  const startX = rig.position.x;
  const startZ = rig.position.z;
  for (let i = 0; i < 120; i += 1) crowd.update(0.05, { x: startX - 3, z: startZ - 3 });
  const moved = Math.hypot(rig.position.x - startX, rig.position.z - startZ);
  assert.ok(moved > 1.2, `walkers must advance along their loop, moved ${moved}`);
  assert.notEqual(walker.rig.legPivots[0].rotation.x, 0, 'legs swing while walking');
  assert.equal(rig.position.y, 0.25, 'walkers follow the ground height');

  // Far from the player: culled. Near: visible again.
  crowd.update(0.05, { x: rig.position.x + 500, z: rig.position.z + 500 });
  assert.equal(rig.visible, false, 'distant walkers are culled');
  crowd.update(0.05, { x: rig.position.x, z: rig.position.z });
  assert.equal(rig.visible, true, 'nearby walkers reappear');
});
