/**
 * Sky events: the visible wonders of the Abuja sky.
 *
 * - Rainbows that arc over the city after every storm clears
 * - Shooting stars on clear nights
 * - A flight crossing toward Nnamdi Azikiwe Airport with a growing contrail
 * - Sun halo and moon glow that bloom at sunrise, sunset and moonrise
 *
 * Sprites, additive Points and LineSegments only where possible; the rainbow
 * and plane are hidden meshes that never join the shadow pass.
 */

import * as THREE from 'three';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/** Shared radial glow texture for celestial glows and vehicle lights.
 *  Returns null in headless environments (sprites then render as flat colour). */
export function makeGlowTexture() {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

/**
 * Rainbow: a full-spectrum torus arc whose colours run across the band
 * (red outermost, violet innermost). Activates when a storm clears and
 * fades in and out over `duration` seconds.
 */
export function createRainbowEvent({ minCooldown = 150, duration = 52, radius = 95, tube = 6.5 } = {}) {
  const geometry = new THREE.TorusGeometry(radius, tube, 10, 72, Math.PI);
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < position.count; i += 1) {
    const radial = Math.hypot(position.getX(i), position.getY(i));
    const t = clamp((radial - (radius - tube)) / (2 * tube), 0, 1);
    // Red on the outer edge (t = 1) through to violet on the inner edge.
    color.setHSL((1 - t) * 0.78, 0.85, 0.56);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(-10, 6, -86);
  mesh.rotation.y = 0.32;
  mesh.visible = false;
  mesh.name = 'Rainbow';

  const state = { active: false, startedAt: -1e3, lastTrigger: -1e3, wasRaining: false, fired: false };

  return {
    mesh,
    get active() {
      return state.active;
    },
    get fired() {
      return state.fired;
    },
    /** Call every frame with the smoothed rain amount; returns true on trigger. */
    notify(rainAmount, time) {
      state.fired = false;
      const rain = clamp(Number(rainAmount) || 0, 0, 1);
      const now = Number.isFinite(time) ? time : 0;
      if (state.wasRaining && rain < 0.18 && now - state.lastTrigger > minCooldown) {
        state.active = true;
        state.startedAt = now;
        state.lastTrigger = now;
        state.fired = true;
      }
      state.wasRaining = rain > 0.5;
      return state.fired;
    },
    update(time) {
      const now = Number.isFinite(time) ? time : 0;
      if (!state.active) {
        mesh.visible = false;
        return 0;
      }
      const age = now - state.startedAt;
      if (age > duration) {
        state.active = false;
        mesh.visible = false;
        material.opacity = 0;
        return 0;
      }
      const envelope = Math.sin(Math.PI * clamp(age / duration, 0, 1));
      material.opacity = 0.5 * envelope;
      mesh.visible = material.opacity > 0.012;
      mesh.scale.setScalar(1 + age * 0.0012);
      return material.opacity;
    },
  };
}

/**
 * Shooting stars: bright streaks that cross the night sky. A small pool of
 * LineSegments streaks, scheduled at random, with `fired` set on each spawn.
 */
export function createShootingStars({
  random = Math.random,
  maxStreaks = 3,
  minInterval = 22,
  maxInterval = 64,
  firstDelay = 16,
} = {}) {
  const safeRandom = typeof random === 'function' ? random : Math.random;
  const positions = new Float32Array(maxStreaks * 2 * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color: 0xe8f0ff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  });
  const lines = new THREE.LineSegments(geometry, material);
  lines.frustumCulled = false;
  lines.visible = false;
  lines.name = 'ShootingStars';

  const streaks = [];
  for (let i = 0; i < maxStreaks; i += 1) {
    streaks.push({ active: false, x: 0, y: 0, z: 0, dirX: 0, dirY: 0, dirZ: 0, t: 0, speed: 90, length: 30, life: 1.35 });
  }
  const state = { nextAt: firstDelay + safeRandom() * 12, fired: false };

  function spawn() {
    for (const streak of streaks) {
      if (streak.active) continue;
      const azimuth = safeRandom() * Math.PI * 2;
      const elevation = 0.28 + safeRandom() * 0.5;
      const horizontal = Math.sqrt(Math.max(0, 1 - elevation * elevation));
      streak.x = Math.cos(azimuth) * horizontal * 235;
      streak.y = elevation * 235;
      streak.z = Math.sin(azimuth) * horizontal * 235;
      const dirAzimuth = azimuth + Math.PI * (0.6 + safeRandom() * 0.8);
      streak.dirX = Math.cos(dirAzimuth) * 0.86;
      streak.dirY = -0.34 - safeRandom() * 0.18;
      streak.dirZ = Math.sin(dirAzimuth) * 0.86;
      streak.t = 0;
      streak.speed = 82 + safeRandom() * 46;
      streak.length = 26 + safeRandom() * 18;
      streak.active = true;
      return true;
    }
    return false;
  }

  return {
    lines,
    get fired() {
      return state.fired;
    },
    update(time, nightAmount, delta = 1 / 60) {
      const now = Number.isFinite(time) ? time : 0;
      const night = clamp(Number(nightAmount) || 0, 0, 1);
      const safeDelta = Number.isFinite(delta) && delta > 0 ? Math.min(delta, 0.1) : 1 / 60;
      state.fired = false;

      if (night > 0.5 && now >= state.nextAt) {
        if (spawn()) {
          state.fired = true;
          state.nextAt = now + minInterval + safeRandom() * (maxInterval - minInterval);
        }
      }

      let activeCount = 0;
      let peakEnvelope = 0;
      for (let i = 0; i < streaks.length; i += 1) {
        const streak = streaks[i];
        const head = i * 6;
        if (!streak.active) {
          positions[head + 1] = -1e4;
          positions[head + 4] = -1e4;
          continue;
        }
        streak.t += safeDelta;
        const progress = streak.t / streak.life;
        if (progress >= 1) {
          streak.active = false;
          positions[head + 1] = -1e4;
          positions[head + 4] = -1e4;
          continue;
        }
        activeCount += 1;
        const travel = streak.t * streak.speed;
        const headX = streak.x + streak.dirX * travel;
        const headY = streak.y + streak.dirY * travel;
        const headZ = streak.z + streak.dirZ * travel;
        const tailScale = Math.sin(Math.PI * progress);
        const tailX = headX - streak.dirX * streak.length * tailScale;
        const tailY = headY - streak.dirY * streak.length * tailScale;
        const tailZ = headZ - streak.dirZ * streak.length * tailScale;
        positions[head] = tailX;
        positions[head + 1] = tailY;
        positions[head + 2] = tailZ;
        positions[head + 3] = headX;
        positions[head + 4] = headY;
        positions[head + 5] = headZ;
        peakEnvelope = Math.max(peakEnvelope, tailScale);
      }

      lines.visible = activeCount > 0;
      material.opacity = peakEnvelope * 0.9;
      if (lines.visible) geometry.attributes.position.needsUpdate = true;
      return activeCount;
    },
  };
}

/**
 * Sky flight: a passenger flight crossing toward the airport with a long
 * contrail. Hidden between flights, so it never weighs on the idle scene.
 */
export function createSkyPlane({
  random = Math.random,
  firstFlightAt = 75,
  minGap = 240,
  maxGap = 420,
  flightDuration = 55,
} = {}) {
  const safeRandom = typeof random === 'function' ? random : Math.random;
  const group = new THREE.Group();
  group.name = 'SkyFlight';
  group.visible = false;

  const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xf4f7fb, fog: false });
  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 5.6, 8), whiteMaterial);
  fuselage.rotation.x = Math.PI / 2;
  const wings = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.16, 1.5), whiteMaterial);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 1.05), whiteMaterial);
  tail.position.set(0, 0.55, 2.35);
  for (const part of [fuselage, wings, tail]) {
    part.castShadow = false;
    part.receiveShadow = false;
    group.add(part);
  }

  const trailMaterial = new THREE.MeshBasicMaterial({
    color: 0xeaf2ff,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  });
  const trails = [];
  for (const side of [-1, 1]) {
    const trail = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 1), trailMaterial);
    trail.position.x = side * 2.1;
    trail.castShadow = false;
    trail.receiveShadow = false;
    group.add(trail);
    trails.push(trail);
  }

  const from = new THREE.Vector3(-320, 86, -230);
  const to = new THREE.Vector3(320, 104, 190);
  const directionScratch = new THREE.Vector3();
  const state = {
    active: false,
    startedAt: -1e3,
    nextAt: firstFlightAt + safeRandom() * 40,
    fired: false,
    from,
    to,
  };

  return {
    group,
    get fired() {
      return state.fired;
    },
    update(delta, time) {
      const now = Number.isFinite(time) ? time : 0;
      state.fired = false;

      if (!state.active && now >= state.nextAt) {
        state.active = true;
        state.startedAt = now;
        state.fired = true;
        state.from.set(-320, 82 + safeRandom() * 14, -230 + safeRandom() * 60);
        state.to.set(320, 98 + safeRandom() * 14, 160 + safeRandom() * 70);
        group.visible = true;
      }

      if (!state.active) {
        group.visible = false;
        return false;
      }

      const age = now - state.startedAt;
      const progress = age / flightDuration;
      if (progress >= 1) {
        state.active = false;
        group.visible = false;
        state.nextAt = now + minGap + safeRandom() * (maxGap - minGap);
        return false;
      }

      group.position.lerpVectors(state.from, state.to, progress);
      directionScratch.copy(state.to).sub(state.from).normalize();
      group.rotation.y = Math.atan2(-directionScratch.x, -directionScratch.z);
      group.rotation.x = Math.asin(clamp(directionScratch.y, -1, 1));

      const trailLength = Math.min(1, progress * 2.4) * 240 * (1 - Math.max(0, progress - 0.86) * 6);
      for (const trail of trails) {
        trail.scale.z = Math.max(0.001, trailLength);
        trail.position.z = 3.2 + trailLength * 0.5;
      }
      trailMaterial.opacity = 0.22 * Math.min(1, progress * 6);
      return true;
    },
  };
}

/**
 * Sun halo and moon glow: additive sprites that bloom around the sun disc and
 * moon disc. Sprites cost nothing in the mesh budget.
 */
export function createCelestialGlows({ glowTexture = null } = {}) {
  const texture = glowTexture ?? makeGlowTexture();
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    color: 0xffd9a0,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  }));
  sunGlow.name = 'SunHalo';
  sunGlow.scale.setScalar(52);
  const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    color: 0xcfe0f4,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  }));
  moonGlow.name = 'MoonGlow';
  moonGlow.scale.setScalar(26);

  return {
    sunGlow,
    moonGlow,
    update({ sunPosition, moonPosition, daylight = 0, twilight = 0, night = 0, sunVisible = false, moonVisible = false } = {}) {
      if (sunPosition) sunGlow.position.copy(sunPosition);
      if (moonPosition) moonGlow.position.copy(moonPosition);
      const day = clamp(Number(daylight) || 0, 0, 1);
      const dusk = clamp(Number(twilight) || 0, 0, 1);
      const dark = clamp(Number(night) || 0, 0, 1);
      sunGlow.visible = Boolean(sunVisible);
      sunGlow.material.opacity = sunVisible ? 0.14 + dusk * 0.6 + day * 0.08 : 0;
      sunGlow.scale.setScalar(46 + dusk * 40);
      moonGlow.visible = Boolean(moonVisible);
      moonGlow.material.opacity = moonVisible ? 0.16 + dark * 0.3 : 0;
    },
  };
}
