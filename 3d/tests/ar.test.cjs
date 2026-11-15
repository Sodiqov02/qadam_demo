const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const viewerSource = fs.readFileSync(path.join(__dirname, '../viewer.js'), 'utf8');
const catalogHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const plovHtml = fs.readFileSync(path.join(__dirname, '../plov/index.html'), 'utf8');
const fruitsHtml = fs.readFileSync(path.join(__dirname, '../fruits/index.html'), 'utf8');
const fruitsApp = fs.readFileSync(path.join(__dirname, '../fruits/app.js'), 'utf8');
const homepageHtml = fs.readFileSync(path.join(__dirname, '../../index.html'), 'utf8');
const homepageScript = fs.readFileSync(path.join(__dirname, '../../static/script.js'), 'utf8');
const descendants = element => element.children.flatMap(child => [child, ...descendants(child)]);

async function setup({ supported = true, xr = false, debug = true, webgl = true, usdz = true, ios = false } = {}) {
  const intervals = new Set();
  let viewer, activations = 0, inClick = false, copied = '';

  class Element extends EventTarget {
    constructor(tag) {
      super();
      Object.assign(this, { tag, children: [], attrs: {}, style: {}, loaded: false, canActivateAR: supported });
    }
    setAttribute(key, value) { this.attrs[key] = value; if (key === 'src') this.src = value; }
    querySelector(selector) { return this.children.find(element => selector === '.model-poster' && element.tag === 'img') || null; }
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
  const arHost = new Element('ar-host');
  const poster = new Element('img');
  stage.append(poster);
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
      userAgent: ios ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' : 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile',
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
    .replaceAll('import.meta.url', JSON.stringify('https://sodiqov02.github.io/qadam_demo/3d/viewer.js'))
    .replace('export function mountModelViewer', 'function mountModelViewer')
    .replace("import('./vendor/model-viewer-4.3.1.min.js')", 'Promise.resolve()');
  vm.runInContext(executable, context);
  context.mountModelViewer({
    stage, arHost, status, reset, retry, debugHost,
    title: 'Demo Plov', alt: 'Plov model',
    glbUrl: 'https://sodiqov02.github.io/qadam_demo/3d/assets/osh-fast.glb',
    usdzUrl: usdz ? 'https://sodiqov02.github.io/qadam_demo/3d/assets/osh.usdz' : null,
    arModes: usdz ? 'webxr scene-viewer quick-look' : 'webxr scene-viewer'
  });
  await new Promise(resolve => setImmediate(resolve));

  return {
    stage, arHost, poster, status, reset, retry, debugHost, intervals,
    viewer: () => viewer,
    arButton: () => arHost.children.find(element => element.className === 'primary-button model-ar-button'),
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
  assert.equal(viewer.src, 'https://sodiqov02.github.io/qadam_demo/3d/assets/osh-fast.glb');
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

test('model without USDZ keeps Android AR and disables Quick Look', async () => {
  const page = await setup({ usdz: false });
  const viewer = page.viewer();
  assert.equal(viewer.attrs['ar-modes'], 'webxr scene-viewer');
  assert.equal(Object.hasOwn(viewer.attrs, 'ios-src'), false);
  page.load();
  page.click(page.arButton());
  assert.equal(page.count(), 1);
});

test('catalog stays lightweight and routes to both model pages', () => {
  assert.match(catalogHtml, /href="\.\/plov\/\?v=20261115-fast1"/);
  assert.match(catalogHtml, /href="\.\/fruits\/\?v=20261115-fast1"/);
  assert.match(catalogHtml, /src="\.\/assets\/plov-menu-v2\.webp"/);
  assert.match(catalogHtml, /src="\.\/assets\/fruits-menu-v2\.webp"/);
  assert.doesNotMatch(catalogHtml, /\.glb|\.usdz|model-viewer/i);
  assert.match(plovHtml, /src="\.\/app\.js\?v=[^" ]+"/);
  assert.match(plovHtml, /src="\.\.\/assets\/plov-menu-v2\.webp"/);
  assert.equal(new URL('../assets/osh-fast.glb', 'https://sodiqov02.github.io/qadam_demo/3d/plov/app.js').href,
    'https://sodiqov02.github.io/qadam_demo/3d/assets/osh-fast.glb');
  assert.match(fruitsHtml, /src="\.\.\/assets\/fruits-menu-v2\.webp"/);
  assert.match(fruitsApp, /pageUrl\('fruits-real-v1-fast\.glb'\)/);
  assert.match(fruitsApp, /arModes: 'webxr scene-viewer quick-look'/);
  assert.match(fruitsApp, /usdzUrl: pageUrl\('fruits-fast\.usdz'\)/);
  assert.equal(new URL('../assets/fruits-real-v1-fast.glb', 'https://sodiqov02.github.io/qadam_demo/3d/fruits/app.js').href,
    'https://sodiqov02.github.io/qadam_demo/3d/assets/fruits-real-v1-fast.glb');
});

test('homepage promotes both models with project-relative localized links', () => {
  assert.match(homepageHtml, /href="\.\/3d\/plov\/\?v=20261115-fast1"/);
  assert.match(homepageHtml, /href="\.\/3d\/fruits\/\?v=20261115-fast1"/);
  assert.match(homepageHtml, /src="\.\/3d\/assets\/plov-menu-v2\.webp"/);
  assert.match(homepageHtml, /src="\.\/3d\/assets\/fruits-menu-v2\.webp"/);
  assert.doesNotMatch(homepageHtml, /href="\/3d\//);
  assert.match(homepageScript, /arShowcaseTitle: "Taomni stolingizda ko‘ring"/);
  assert.match(homepageScript, /arShowcaseTitle: "Посмотрите блюдо на своём столе"/);
  assert.match(homepageScript, /arShowcaseTitle: "See the dish on your table"/);
  assert.equal((homepageScript.match(/arShowcaseCta:/g) || []).length, 3);
});

test('poster stays visible during loading and returns after error and retry', async () => {
  const page = await setup();
  assert.equal(page.poster.hidden, false);
  assert.equal(page.reset.disabled, true);
  page.load();
  assert.equal(page.poster.hidden, true);
  assert.equal(page.reset.disabled, false);
  page.viewer().dispatchEvent(new Event('error'));
  assert.equal(page.poster.hidden, false);
  assert.equal(page.retry.hidden, false);
  page.click(page.retry);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(page.poster.hidden, false);
  page.load();
  assert.equal(page.poster.hidden, true);
});

test('AR control stays outside rotation surface and is replaced on retry', async () => {
  const page = await setup();
  assert.equal(descendants(page.stage).includes(page.arButton()), false);
  assert.equal(page.arHost.children.length, 1);
  page.viewer().dispatchEvent(new Event('error'));
  page.click(page.retry);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(page.arHost.children.length, 1);
});

test('viewer CSP allows embedded texture fetches and internal shadow styles', () => {
  for (const html of [plovHtml, fruitsHtml]) {
    const policy = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
    assert.match(policy, /connect-src 'self' blob:/);
    assert.match(policy, /style-src 'self' 'unsafe-inline'/);
    assert.match(policy, /script-src 'self' 'wasm-unsafe-eval';/);
    assert.match(html, /id="ar-actions"/);
  }
});

test('iPhone native Quick Look is available without WebGL or waiting for GLB', async () => {
  const page = await setup({ ios: true, webgl: false });
  const link = page.arHost.children.find(el => el.tag === 'a');
  assert.ok(link);
  assert.equal(link.attrs.rel, 'ar');
  assert.equal(link.attrs.href, 'https://sodiqov02.github.io/qadam_demo/3d/assets/osh.usdz');
  assert.equal(link.children[0].tag, 'img');
  assert.equal(link.disabled, undefined);
  assert.equal(page.retry.hidden, false);
  page.click(page.retry);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(page.arHost.children.filter(el => el.tag === 'a').length, 1);
});

test('retry reuses stable model URL and progress never announces ready before load', async () => {
  const page = await setup();
  const url = page.viewer().src;
  const event = new Event('progress'); event.detail = { totalProgress: 1 };
  page.viewer().dispatchEvent(event);
  assert.match(page.status.textContent, /99%/);
  assert.equal(page.poster.hidden, false);
  page.viewer().dispatchEvent(new Event('error'));
  page.click(page.retry);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(page.viewer().src, url);
});
