const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');

const script = fs.readFileSync('static/script.js', 'utf8');

test('customer PII is never written to console', () => {
  assert.doesNotMatch(script, /console\.(?:log|info|debug)\([^\n]*demoOrder/);
});

test('storage access is isolated behind safe wrappers', () => {
  assert.match(script, /function readStoredLanguage\(/);
  assert.match(script, /function storeLanguage\(/);
  assert.doesNotMatch(script, /const currentLang = localStorage\.getItem/);
});

test('menu input validation rejects malformed and duplicate records', () => {
  assert.match(script, /function validateMenuItems\(/);
  assert.match(script, /duplicate menu item id/i);
  assert.match(script, /Number\.isFinite\(price\)/);
});

test('application pages carry restrictive repository-controlled policies', () => {
  for (const file of ['index.html','3d/index.html','3d/fruits/index.html','3d/plov/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /http-equiv="Content-Security-Policy"/i, file);
    assert.match(html, /default-src 'self'/i, file);
    assert.match(html, /connect-src 'self'/i, file);
    assert.match(html, /name="referrer" content="no-referrer"/i, file);
  }
});

test('generator dependencies use the reviewed exact resolution', () => {
  const requirements = fs.readFileSync('3d/tools/fruits-realism/requirements.txt','utf8').trim().split(/\r?\n/);
  assert.deepEqual(requirements, ['numpy==2.5.3','Pillow==12.3.0']);
});

test('vendored model-viewer bytes match the reviewed normalized digest', () => {
  const bytes = fs.readFileSync('3d/vendor/model-viewer-4.3.1.min.js','utf8').replaceAll('\r\n','\n');
  const digest = crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(digest, '283b0672384614b4847636c306fc93fe4b1fcadc76d668b4e47f0ca76bcf033b');
});

test('AR diagnostics exclude credential and customer-data keys', () => {
  const viewer = fs.readFileSync('3d/viewer.js','utf8');
  const object = viewer.match(/const diagnostics = \{([\s\S]*?)\n  \};/);
  assert.ok(object);
  assert.doesNotMatch(object[1], /\b(?:token|secret|password|customer|phone|address)\b\s*:/i);
});
