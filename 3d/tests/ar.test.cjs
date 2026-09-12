// Application-level regression tests. These do not emulate native AR or rendering.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const raw = fs.readFileSync(require('node:path').join(__dirname, '../viewer.js'), 'utf8');
const descendants = element => element.children.flatMap(child => [child, ...descendants(child)]);

async function setup({ supported = true, xr = false, debug = true, webgl = true } = {}) {
  const intervals = new Set();
  let dialog, viewer, activations = 0, inClick = false;
  class Element extends EventTarget {
    constructor(tag) {
      super();
      Object.assign(this, { tag, children: [], attrs: {}, style: {}, loaded: false, canActivateAR: supported });
    }
    setAttribute(key, value) { this.attrs[key] = value; if (key === 'src') this.src = value; }
    getAttribute(key) { return this.attrs[key] ?? null; }
    append(...elements) { for (const element of elements) { this.children.push(element); element.parent = this; } }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(e => e !== this); }
    set innerHTML(value) {
      this.parts = Object.fromEntries(['osh-stage', 'osh-status', 'osh-reset', 'osh-retry', 'osh-close']
        .map(name => ['.' + name, new Element(name)]));
    }
    querySelector(selector) { return this.parts?.[selector] || null; }
    showModal() { this.open = true; }
    close() { this.open = false; this.dispatchEvent(new Event('close')); }
    getContext() { return webgl ? { getExtension: () => null } : null; }
    activateAR() {
      assert.ok(inClick, 'activateAR must be called synchronously from the click');
      activations++;
      return this.rejectAR ? Promise.reject(new Error('permission denied')) : Promise.resolve();
    }
    jumpCameraToGoal() { this.reset = true; }
  }
  const documentEvents = new EventTarget();
  const context = {
    URL, URLSearchParams, Event,
    document: {
      body: new Element('body'), visibilityState: 'visible', querySelector: () => null,
      addEventListener: (...args) => documentEvents.addEventListener(...args),
      removeEventListener: (...args) => documentEvents.removeEventListener(...args),
      createElement(tag) {
        const element = new Element(tag);
        if (tag === 'dialog') dialog = element;
        if (tag === 'model-viewer') viewer = element;
        return element;
      }
    },
    navigator: { userAgent: 'Android Chrome', platform: 'Linux', clipboard: { writeText: async text => { context.copied = text; } },
      ...(xr ? { xr: { isSessionSupported: async () => true } } : {}) },
    window: { isSecureContext: true }, location: { search: debug ? '?ar-debug=1' : '' },
    customElements: { get: () => Element }, console: { info() {}, error() {} },
    setTimeout: () => 1, clearTimeout() {},
    setInterval: fn => { intervals.add(fn); return fn; }, clearInterval: fn => intervals.delete(fn)
  };
  vm.createContext(context);
  // Stub only the library import and browser environment; exercise real application handlers.
  const source = raw.replaceAll('import.meta.url', JSON.stringify('https://sodiqov02.github.io/qadam_demo/3d/viewer.js'))
    .replace('export function openOshViewer', 'function openOshViewer')
    .replace("import('./vendor/model-viewer-4.3.1.min.js')", 'Promise.resolve()');
  vm.runInContext(source, context);
  context.openOshViewer({ focus() {} });
  await Promise.resolve();
  await Promise.resolve();
  return {
    dialog, viewer, intervals, count: () => activations,
    button: viewer?.children.find(e => e.slot === 'ar-button'),
    click(button) { inClick = true; button.dispatchEvent(new Event('click', { bubbles: true, cancelable: true })); inClick = false; },
    load() { viewer.loaded = true; viewer.dispatchEvent(new Event('load')); }
  };
}

for (const xr of [false, true]) test(`AR activation with navigator.xr=${xr}`, async () => {
  const s = await setup({ xr });
  assert.equal(s.count(), 0);
  assert.equal(s.button.disabled, true);
  assert.equal(s.viewer.src, 'https://sodiqov02.github.io/qadam_demo/3d/assets/osh.glb');
  assert.equal(s.viewer.attrs['ios-src'], 'https://sodiqov02.github.io/qadam_demo/3d/assets/osh.usdz');
  assert.equal(s.viewer.attrs.ar, '');
  assert.equal(s.viewer.attrs['ar-modes'], 'webxr scene-viewer quick-look');
  assert.equal(s.viewer.attrs['ar-placement'], 'floor');
  assert.equal(s.viewer.attrs['ar-scale'], 'auto');
  assert.equal(s.viewer.attrs['camera-controls'], '');
  s.load();
  assert.equal(s.button.disabled, false);
  s.click(s.button);
  assert.equal(s.count(), 1);
  s.viewer.rejectAR = true;
  s.click(s.button);
  await Promise.resolve();
  assert.match(s.dialog.parts['.osh-status'].textContent, /AR не удалось/);
  assert.equal(s.viewer.loaded, true);
  s.dialog.parts['.osh-reset'].onclick();
  assert.equal(s.viewer.reset, true);
  assert.ok(descendants(s.dialog).some(e => e.className === 'osh-ar-debug'));
  const copy = descendants(s.dialog).find(e => e.textContent === 'Copy diagnostics');
  assert.ok(copy, `copy button missing: ${JSON.stringify(descendants(s.dialog).map(e => [e.tag, e.className, e.textContent]))}`);
  copy.dispatchEvent(new Event('click'));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(copy.textContent, 'Copied');
  s.dialog.close();
  assert.equal(s.intervals.size, 0);
});

test('unsupported device and delayed capability selection, normal UI has no debug panel', async () => {
  const s = await setup({ supported: false, debug: false });
  s.load();
  assert.equal(s.button.disabled, true);
  s.click(s.button);
  assert.equal(s.count(), 0);
  assert.match(s.dialog.parts['.osh-status'].textContent, /AR недоступен/);
  s.viewer.canActivateAR = true;
  for (const refresh of s.intervals) refresh();
  assert.equal(s.button.disabled, false);
  s.click(s.button);
  assert.equal(s.count(), 1);
  assert.equal(descendants(s.dialog).some(e => e.className === 'osh-ar-debug'), false);
  s.dialog.close();
  assert.equal(s.intervals.size, 0);
});

test('WebGL failure retains fallback and retry', async () => {
  const s = await setup({ webgl: false });
  assert.match(s.dialog.parts['.osh-status'].textContent, /Не удалось загрузить/);
  assert.equal(s.dialog.parts['.osh-retry'].hidden, false);
  s.dialog.close();
});
