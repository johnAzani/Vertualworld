import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import test from 'node:test';

const mainSource = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

test('loads the persisted economy before resolving the saved rental residence', () => {
  const economyInitialization = mainSource.indexOf('const economy = loadEconomy(economyStorage);');
  const rentalResidenceLookup = mainSource.indexOf('const savedRentalHouse = economy.lease');

  assert.notEqual(economyInitialization, -1, 'the game economy should be initialized');
  assert.notEqual(rentalResidenceLookup, -1, 'startup should resolve the saved rental residence');
  assert.ok(
    economyInitialization < rentalResidenceLookup,
    'the economy must be initialized before startup reads a persisted rental lease',
  );
});

test('executes src/main.js end-to-end, builds all 3D scene geometry, and calls vertualworldBoot.ready() on first frame', async () => {
  const noopFn = () => {};
  const make2DContext = () => new Proxy({
    createLinearGradient: () => ({ addColorStop: noopFn }),
    createRadialGradient: () => ({ addColorStop: noopFn }),
    measureText: () => ({ width: 50 }),
  }, {
    get(target, prop) {
      if (prop in target) return target[prop];
      return noopFn;
    },
    set(target, prop, val) {
      target[prop] = val;
      return true;
    },
  });

  const elements = new Map();
  function makeElement(tag = 'div') {
    return {
      tagName: tag.toUpperCase(),
      id: '',
      className: '',
      textContent: '',
      innerHTML: '',
      value: '',
      hidden: false,
      disabled: false,
      inert: false,
      width: 320,
      height: 230,
      scrollTop: 0,
      scrollHeight: 100,
      offsetWidth: 100,
      style: { setProperty: noopFn },
      dataset: {},
      attributes: new Map(),
      classList: {
        add: noopFn,
        remove: noopFn,
        toggle: noopFn,
        contains: () => false,
      },
      addEventListener: noopFn,
      removeEventListener: noopFn,
      removeAttribute(k) { this.attributes.delete(k); },
      setAttribute(k, v) { this.attributes.set(k, String(v)); },
      getAttribute(k) { return this.attributes.get(k) ?? null; },
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 320, height: 230 }),
      querySelector: (sel) => getEl(sel),
      querySelectorAll: () => [],
      closest: () => makeElement('div'),
      matches: () => false,
      contains: () => false,
      focus: noopFn,
      append: noopFn,
      getContext: (type) => (type === '2d' ? make2DContext() : null),
      lastChild: { textContent: '' },
    };
  }
  function getEl(sel) {
    if (!elements.has(sel)) elements.set(sel, makeElement('div'));
    return elements.get(sel);
  }

  let bootReadyCalled = false;
  let bootFailCalled = null;
  const storage = new Map();
  let rafCallback = null;

  globalThis.HTMLElement = class {};
  globalThis.Element = class {};
  globalThis.localStorage = {
    getItem: (k) => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, String(v)),
  };
  globalThis.requestAnimationFrame = (cb) => {
    rafCallback = cb;
    return 1;
  };
  globalThis.cancelAnimationFrame = noopFn;
  globalThis.document = {
    hidden: false,
    fullscreenElement: null,
    fullscreenEnabled: true,
    activeElement: null,
    body: makeElement('body'),
    querySelector: (sel) => getEl(sel),
    querySelectorAll: () => [],
    createElement: (tag) => makeElement(tag),
    addEventListener: noopFn,
  };
  globalThis.window = {
    innerWidth: 1280,
    innerHeight: 800,
    devicePixelRatio: 1,
    location: { search: '', reload: noopFn },
    localStorage: globalThis.localStorage,
    matchMedia: () => ({ matches: false, addEventListener: noopFn }),
    addEventListener: noopFn,
    setTimeout: () => 1,
    clearTimeout: noopFn,
    vertualworldBoot: {
      ready() { bootReadyCalled = true; },
      fail(msg, err) { bootFailCalled = { msg, err }; },
    },
  };

  globalThis.__createMockRenderer = () => ({
    shadowMap: { enabled: true, type: null, autoUpdate: false, needsUpdate: true },
    info: { autoReset: true, reset: noopFn, render: { calls: 10, triangles: 1000 } },
    capabilities: { getMaxAnisotropy: () => 4 },
    _pixelRatio: 1,
    setPixelRatio(r) { this._pixelRatio = r; },
    getPixelRatio() { return this._pixelRatio; },
    setSize() {},
    render() {},
  });

  register(`data:text/javascript,${encodeURIComponent(`
    export async function load(url, context, nextLoad) {
      if (url.endsWith('.css')) {
        return { format: 'module', shortCircuit: true, source: 'export default {};' };
      }
      const res = await nextLoad(url, context);
      if (url.endsWith('src/main.js')) {
        const code = res.source.toString().replace(
          "new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' })",
          "globalThis.__createMockRenderer()"
        );
        return { ...res, source: code };
      }
      return res;
    }
  `)}`);

  await import('../src/main.js');
  assert.equal(typeof rafCallback, 'function', 'src/main.js should schedule the first animation frame');
  rafCallback(16);
  assert.equal(bootFailCalled, null, 'vertualworldBoot.fail must not be called');
  assert.equal(bootReadyCalled, true, 'vertualworldBoot.ready must be called on first frame');
});
