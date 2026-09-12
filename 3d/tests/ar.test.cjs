const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const viewerSource = fs.readFileSync(path.join(__dirname, '../viewer.js'), 'utf8');
const catalogHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const plovHtml = fs.readFileSync(path.join(__dirname, '../plov/index.html'), 'utf8');
const descendants = element => element.children.flatMap(child => [child, ...descendants(child)]);

async function setup({ supported = true, xr = false, debug = true, webgl = true } = {}) {
  const intervals = new Set();
  let viewer, activations = 0, inClick = false, copied = '';

  class Element extends EventTarget {
    constructor(tag) {
      super();
      Object.assign(this, { tag, children: [], attrs: {}, style: {}, loaded: false, canActivateAR: supported });
    }
    setAttribute(key, value) { this.attrs[key] = value; if (key === 'src') this.src = value; }
    getAttribute(key) { return this.attrs[key] ?? null; }
    append(...elements) { for (const element of elements) { this.children.push(element); element.parent = this; } }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(element => element !== this); }
    getContext() { return webgl ? { getExtension: () => null } : null; }
    activateAR() {
      assert.ok(inClick, 'activateAR must be called synchronously from the user click');
      activations++;
      return this.rejectAR ? Promise.reject(new Error('permission denied')) : Promise.resolve();
    }
    jumpCameraToGoal() { this.resetCalled = true; }
  }

  const documentEvents = new EventTarget();
  const windowEvents = new EventTarget();
  windowEvents.isSecureContext = true;
  const stage = new Element('stage');
  const status = new Element('status');
  const reset = new Element('reset');
  const retry = new Element('retry');
  const debugHost = new Element('debug-host');
  const context = {
    URL, URLSearchParams, Event,
    document: {
      visibilityState: 'visible',
      createElement(tag) { const element = new Element(tag); if (tag === 'model-viewer') viewer = element; return element; },
      addEventListener: (...args) => documentEvents.addEventListener(...args),
      removeEventListener: (...args) => documentEvents.removeEventListener(...args)
    },
    navigator: {
      userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile',
      platform: 'Linux armv8l',
      clipboard: { writeText: async text => { copied = text; } },
      ...(xr ? { xr: { isSessionSupported: async () => true } } : {})
    },
    window: windowEvents,
    location: { search: debug ? '?ar-debug=1' : '' },
    customElements: { get: () => Element },
    console: { info() {}, error() {} },
    setTimeout: () => 1,
    clearTimeout() {},
    setInterval: fn => { intervals.add(fn); return fn; },
    clearInterval: fn => intervals.delete(fn)
  };
  vm.createContext(context);
  const executable = viewerSource
    .replace('export function mountModelViewer', 'function mountModelViewer')
    .replace("import('./vendor/model-viewer-4.3.1.min.js')", 'Promise.resolve()');
  vm.runInContext(executable, context);
  context.mountModelViewer({
    stage, status, reset, retry, debugHost,
    title: 'Demo Plov', alt: 'Plov model',
    glbUrl: 'https://sodiqov02.github.io/qadam_demo/3d/assets/osh.glb',
    usdzUrl: 'https://sodiqov02.github.io/qadam_demo/3d/assets/osh.usdz'
  });
  await new Promise(resolve => setImmediate(resolve));

  return {
    stage, status, reset, retry, debugHost, intervals,
    viewer: () => viewer,
    arButton: () => viewer.children.find(element => element.slot === 'ar-button'),
    count: () => activations,
    copied: () => copied,
    click(element) { inClick = true; element.dispatchEvent(new Event('click', { bubbles: true, cancelable: true })); inClick = false; },
    load() { viewer.loaded = true; viewer.dispatchEvent(new Event('load')); }
  };
}

for (const xr of [false, true]) test(`AR activation with navigator.xr=${xr}`, async () => {
  const page = await setup({ xr });
  const viewer = page.viewer();
  const ar = page.arButton();
  assert.equal(page.count(), 0);
  assert.equal(ar.disabled, true);
  assert.equal(viewer.src, 'https://sodiqov02.github.io/qadam_demo/3d/assets/osh.glb');
  assert.equal(viewer.attrs['ios-src'], 'https://sodiqov02.github.io/qadam_demo/3d/assets/osh.usdz');
  assert.equal(viewer.attrs.ar, '');
  assert.equal(viewer.attrs['ar-modes'], 'webxr scene-viewer quick-look');
  assert.equal(viewer.attrs['ar-placement'], 'floor');
  assert.equal(viewer.attrs['ar-scale'], 'auto');
  assert.equal(viewer.attrs['camera-controls'], '');
  page.load();
  assert.equal(ar.disabled, false);
  page.click(ar);
  assert.equal(page.count(), 1);
  viewer.rejectAR = true;
  page.click(ar);
  await new Promise(resolve => setImmediate(resolve));
  assert.match(page.status.textContent, /AR не удалось/);
  assert.equal(viewer.loaded, true);
  page.click(page.reset);
  assert.equal(viewer.resetCalled, true);

  const copy = descendants(page.debugHost).find(element => element.textContent === 'Copy diagnostics');
  assert.ok(copy);
  page.click(copy);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(copy.textContent, 'Copied');
  assert.match(page.copied(), /"deviceType": "android"/);
});

test('unsupported AR preserves 3D and debug UI is opt-in', async () => {
  const page = await setup({ supported: false, debug: false });
  page.load();
  const ar = page.arButton();
  assert.equal(ar.disabled, true);
  page.click(ar);
  assert.equal(page.count(), 0);
  assert.equal(descendants(page.debugHost).some(element => element.className === 'ar-debug'), false);
  page.viewer().canActivateAR = true;
  for (const refresh of page.intervals) refresh();
  assert.equal(ar.disabled, false);
  page.click(ar);
  assert.equal(page.count(), 1);
});

test('WebGL failure retains poster and offers retry', async () => {
  const page = await setup({ webgl: false });
  assert.match(page.status.textContent, /Не удалось загрузить/);
  assert.equal(page.retry.hidden, false);
  assert.equal(page.stage.children.some(element => element.tag === 'model-viewer'), false);
});

test('catalog stays lightweight and routes to the dedicated Plov page', () => {
  assert.match(catalogHtml, /href="\.\/plov\/"/);
  assert.match(catalogHtml, /src="\.\/assets\/preview\.webp"/);
  assert.doesNotMatch(catalogHtml, /osh\.glb|osh\.usdz|model-viewer/i);
  assert.match(plovHtml, /src="\.\/app\.js"/);
  assert.match(plovHtml, /src="\.\.\/assets\/preview\.webp"/);
  assert.equal(new URL('../assets/osh.glb', 'https://sodiqov02.github.io/qadam_demo/3d/plov/app.js').href,
    'https://sodiqov02.github.io/qadam_demo/3d/assets/osh.glb');
});
