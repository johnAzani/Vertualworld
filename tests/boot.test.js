import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const htmlSource = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const styleSource = await readFile(new URL('../src/style.css', import.meta.url), 'utf8');
const bootSource = htmlSource.match(/<script id="world-boot">([\s\S]*?)<\/script>/)?.[1];
assert.ok(bootSource, 'inline startup fallback should be present in the HTML shell');

function makeElement(id) {
  const listeners = new Map();
  const classes = new Set();
  return {
    id,
    src: id === 'world-entry' ? '/Vertualworld/assets/app.js' : '',
    textContent: '',
    hidden: false,
    classList: {
      add(...names) { names.forEach((name) => classes.add(name)); },
      remove(...names) { names.forEach((name) => classes.delete(name)); },
      contains(name) { return classes.has(name); },
    },
    addEventListener(type, listener) {
      const registered = listeners.get(type) || [];
      registered.push(listener);
      listeners.set(type, registered);
    },
    dispatch(type, values = {}) {
      const event = { type, target: this, preventDefault() {}, ...values };
      for (const listener of listeners.get(type) || []) listener(event);
      return event;
    },
    querySelector(selector) {
      return this.children?.[selector] || null;
    },
    children: {},
  };
}

function createBootHarness() {
  const elements = new Map();
  const screen = makeElement('loading-screen');
  const title = makeElement('loading-title');
  const subtitle = makeElement('loading-subtitle');
  const line = makeElement('loading-line');
  const detail = makeElement('loading-detail');
  const retry = makeElement('loading-retry');
  const entry = makeElement('world-entry');
  const canvas = makeElement('world-canvas');
  screen.children = {
    '.loading-title': title,
    '.loading-subtitle': subtitle,
    '.loading-line': line,
    '.loading-detail': detail,
    '.loading-retry-button': retry,
  };
  for (const element of [screen, entry, canvas]) elements.set(element.id, element);

  const documentListeners = new Map();
  const windowListeners = new Map();
  const timers = new Map();
  const animationFrames = [];
  let nextTimerId = 1;
  let reloadCount = 0;
  const document = {
    getElementById(id) { return elements.get(id) || null; },
    querySelectorAll(selector) { return selector === 'script[type="module"]' ? [entry] : []; },
    addEventListener(type, listener) {
      const registered = documentListeners.get(type) || [];
      registered.push(listener);
      documentListeners.set(type, registered);
    },
    dispatch(type, values = {}) {
      const event = { type, ...values };
      for (const listener of documentListeners.get(type) || []) listener(event);
      return event;
    },
  };
  const window = {
    location: { reload() { reloadCount += 1; } },
    addEventListener(type, listener) {
      const registered = windowListeners.get(type) || [];
      registered.push(listener);
      windowListeners.set(type, registered);
    },
    dispatch(type, values = {}) {
      const event = { type, target: this, ...values };
      for (const listener of windowListeners.get(type) || []) listener(event);
      return event;
    },
    setTimeout(callback, delay) {
      const id = nextTimerId++;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    requestAnimationFrame(callback) { animationFrames.push(callback); },
  };

  vm.runInNewContext(bootSource, {
    window,
    document,
    console: { error() {} },
  });

  return {
    window,
    document,
    screen,
    title,
    subtitle,
    line,
    detail,
    retry,
    entry,
    canvas,
    timers,
    animationFrames,
    get reloadCount() { return reloadCount; },
    fireStartupTimeout() {
      const timeout = [...timers.values()].find((timer) => timer.delay === 20_000);
      assert.ok(timeout, 'startup timeout should be scheduled');
      timeout.callback();
    },
  };
}

test('a successful first render dismisses the loader without another animation-frame dependency', () => {
  const harness = createBootHarness();

  assert.equal(harness.window.vertualworldBoot.ready(), true);
  assert.equal(harness.timers.size, 0);
  assert.equal(harness.animationFrames.length, 0);
  assert.equal(harness.screen.classList.contains('is-ready'), true);
});

test('slow startup offers a reload but can still recover when the first frame renders', () => {
  const harness = createBootHarness();
  harness.fireStartupTimeout();

  assert.equal(harness.title.textContent, 'STILL OPENING');
  assert.equal(harness.line.hidden, true);
  assert.equal(harness.retry.hidden, false);
  assert.equal(harness.screen.classList.contains('is-slow'), true);

  assert.equal(harness.window.vertualworldBoot.ready(), true);
  assert.equal(harness.screen.classList.contains('is-ready'), true);
  assert.equal(harness.screen.classList.contains('is-slow'), false);
});

test('startup exceptions are shown with a safe, bounded diagnostic and cannot be hidden as success', () => {
  const harness = createBootHarness();
  const error = new TypeError('renderer setup failed');
  harness.window.dispatch('error', { error, message: error.message });

  assert.equal(harness.title.textContent, 'THE ISLAND COULD NOT OPEN');
  assert.match(harness.subtitle.textContent, /script error interrupted startup/i);
  assert.equal(harness.detail.textContent, 'Technical detail: TypeError: renderer setup failed');
  assert.equal(harness.retry.hidden, false);
  assert.equal(harness.window.vertualworldBoot.ready(), false);
  assert.equal(harness.animationFrames.length, 0);
});

test('failed entry script and WebGL context creation have specific recovery guidance', () => {
  const scriptHarness = createBootHarness();
  scriptHarness.entry.dispatch('error');
  assert.match(scriptHarness.subtitle.textContent, /game code could not be loaded/i);

  const graphicsHarness = createBootHarness();
  graphicsHarness.canvas.dispatch('webglcontextcreationerror', { statusMessage: 'GPU context unavailable' });
  assert.match(graphicsHarness.subtitle.textContent, /could not start WebGL 2/i);
  assert.equal(graphicsHarness.detail.textContent, 'Technical detail: GPU context unavailable');
});

test('the retry button reloads the current page', () => {
  const harness = createBootHarness();
  harness.retry.dispatch('click');
  assert.equal(harness.reloadCount, 1);
});

test('optional Google Fonts load asynchronously rather than through a CSS import chain', () => {
  assert.doesNotMatch(styleSource, /@import\s/i);
  assert.match(htmlSource, /fonts\.googleapis\.com[^>]+media="print" onload=/);
});
