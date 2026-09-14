const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, '3d', file), 'utf8');
const base = 'https://sodiqov02.github.io/qadam_demo/3d/';

function config(dish) {
  let result;
  const source = read(`${dish}/app.js`);
  vm.runInNewContext(source.replace(/^import .*;$/m, '').replaceAll('import.meta.url', JSON.stringify(`${base}${dish}/app.js?v=test`)), {
    URL, document: { getElementById: id => id }, mountModelViewer: value => { result = value; }
  });
  return result;
}

test('G1/G2: actual Fruits configuration and measured binary', () => {
  assert.equal(config('fruits').glbUrl, `${base}assets/fruits-clean-v2.glb`);
  assert.doesNotMatch(read('fruits/app.js') + read('fruits/index.html'), /fruits(?:-clean)?\.glb/);
  const binary = fs.readFileSync(path.join(root, '3d/assets/fruits-clean-v2.glb'));
  const oldSize = fs.statSync(path.join(root, '3d/assets/fruits.glb')).size;
  assert.ok(binary.length > 800000 && binary.length < 1500000);
  assert.ok(binary.length < oldSize / 5);
  assert.equal(binary.toString('ascii', 0, 4), 'glTF');
  assert.equal(binary.readUInt32LE(4), 2);
  assert.equal(binary.readUInt32LE(8), binary.length);
  const gltf = JSON.parse(binary.toString('utf8', 20, 20 + binary.readUInt32LE(12)));
  assert.ok(gltf.meshes.length > 0);
  console.log(`Fruits: ${binary.length} bytes; archive: ${oldSize} bytes`);
});

test('G3/G4: lightweight catalog and sized, scheduled previews', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /<script|model-viewer|\.glb|\.usdz/i);
  const images = [...html.matchAll(/<img\b[^>]+>/g)].map(match => match[0]);
  assert.equal(images.length, 2);
  images.forEach(img => {
    assert.match(img, /width="\d+"/);
    assert.match(img, /height="\d+"/);
    assert.match(img, /decoding="async"/);
  });
  assert.match(images[0], /fetchpriority="high"/);
  assert.match(images[1], /loading="lazy"/);
  assert.match(read('style.css'), /\.dish-image\s*\{[^}]*height: auto;[^}]*aspect-ratio:/);
  assert.match(read('style.css'), /\.model-poster\s*\{[^}]*z-index: 1/);
  for (const file of ['preview.webp', 'fruits-clean-v2-preview.webp']) {
    assert.ok(fs.statSync(path.join(root, '3d/assets', file)).size < 50000);
  }
});

test('G5/G9: versioned entry chain and real paths under GitHub Pages prefix', () => {
  for (const file of ['index.html', 'fruits/index.html', 'plov/index.html']) {
    const html = read(file);
    assert.match(html, /style\.css\?v=[\w-]+/);
    for (const [, ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const url = new URL(ref, base + file);
      assert.ok(url.pathname.startsWith('/qadam_demo/'));
      assert.ok(fs.existsSync(path.join(root, decodeURIComponent(url.pathname.slice('/qadam_demo/'.length)))), ref);
    }
    if (file === 'index.html') continue;
    assert.match(html, /app\.js\?v=[\w-]+/);
    const app = read(file.replace('index.html', 'app.js'));
    const imported = app.match(/from '([^']+)'/)[1];
    assert.match(imported, /viewer\.js\?v=[\w-]+/);
    assert.equal(new URL(imported, base + file).pathname, '/qadam_demo/3d/viewer.js');
  }
  const library = read('viewer.js').match(/import\('([^']+)'\)/)[1];
  assert.ok(fs.existsSync(path.join(root, '3d', library)));
});

test('G6/G8: actual Plov sources and Fruits Android-only modes', () => {
  assert.equal(config('plov').glbUrl, `${base}assets/osh.glb`);
  assert.equal(config('plov').usdzUrl, `${base}assets/osh.usdz`);
  assert.equal(config('fruits').arModes, 'webxr scene-viewer');
  assert.equal(config('fruits').usdzUrl, undefined);
  assert.match(read('fruits/index.html'), /На iPhone — просмотр в 3D/);
});
