# Qadam 3D / AR demo catalog

Static, mobile-first catalog for showing restaurant dishes in 3D and AR. It has
no backend, API, database, build step, or runtime dependency on the local PC.

After publishing the repository root with GitHub Pages:

- Catalog: https://sodiqov02.github.io/qadam_demo/3d/
- Demo Plov: https://sodiqov02.github.io/qadam_demo/3d/plov/
- Demo Plov diagnostics: https://sodiqov02.github.io/qadam_demo/3d/plov/?ar-debug=1
- Demo Fruits: https://sodiqov02.github.io/qadam_demo/3d/fruits/
- Demo Fruits diagnostics: https://sodiqov02.github.io/qadam_demo/3d/fruits/?ar-debug=1

## Structure

```text
3d/
  index.html                         catalog; preview images only
  style.css                          shared catalog/model-page styles
  viewer.js                          shared 3D, AR, fallback and diagnostics logic
  plov/
    index.html                       Demo Plov page
    app.js                           Demo Plov asset configuration
  fruits/
    index.html                       Demo Fruits page
    app.js                           Demo Fruits asset configuration
  assets/
    preview.webp
    osh.glb
    osh.usdz
    fruits-real-v1-preview.webp        catalog image rendered from production model
    fruits-real-v1-poster.webp         loading poster rendered from production model
    fruits-real-v1.glb                 public Fruits model (about 7 MB)
    fruits-clean-v2.glb                previous lightweight model
    fruits.glb                        archived source; not loaded by demo
  vendor/
    model-viewer-4.3.1.min.js
    model-viewer-LICENSE.txt
  tests/
    ar.test.cjs
    assets.test.cjs
  tools/fruits-realism/
    build.py                            deterministic geometry/PBR export pipeline
    skin-atlas.png                      source albedo atlas
```

All browser paths are relative so the project keeps the `/qadam_demo/` GitHub
Pages prefix. The catalog loads only the two preview images. Each model page
loads its GLB and the local pinned model-viewer distribution when opened. Demo
Plov passes its USDZ to Quick Look. Demo Fruits currently has no USDZ, so it
enables WebXR and Scene Viewer while iPhone retains the ordinary 3D viewer.

## Demo Plov AR behavior

The shared viewer preserves the verified configuration and controls:

- `camera-controls`, orbit/pinch zoom, centred camera and reset;
- `ar-modes="webxr scene-viewer quick-look"`;
- `ar-placement="floor"` for tables and other horizontal surfaces;
- `ar-scale="auto"` so supported AR viewers allow resizing;
- `activateAR()` directly in the AR button click, before any await, request or timer;
- Scene Viewer remains eligible when `navigator.xr` is unavailable;
- failed 3D or AR launches retain the preview/3D fallback and a short user message.

The debug query parameter adds a copyable JSON report with platform, device
type, resolved GLB/USDZ URLs, model-viewer registration, model load and WebXR
capabilities, inferred AR mode, `ar-status`, `ar-tracking`, activation time,
activation error, and page visibility transitions after the AR attempt.

The GLB is glTF 2.0, about 21 × 4 × 21 cm, with 86,088 triangles, two materials
and one embedded JPEG texture. Khronos glTF Validator 2.0.0-dev.3.10 reports no
errors and no warnings. The 4096×4096 texture exceeds Scene Viewer's recommended
2048×2048 target but is below its hard model-size limits; it remains unchanged
to preserve quality.

## Adding Quick Look for Demo Fruits later

When a real Fruits USDZ is available, place it here:

```text
3d/assets/fruits.usdz
```

Then add `usdzUrl: pageUrl('fruits.usdz')` and change `arModes` to
`webxr scene-viewer quick-look` in `3d/fruits/app.js`. The shared viewer,
library and CSS do not need to be duplicated.

## Local verification

```sh
node --check 3d/viewer.js
node --check 3d/plov/app.js
node --check 3d/fruits/app.js
node --check 3d/vendor/model-viewer-4.3.1.min.js
node --test 3d/tests/*.test.cjs
git diff --check
```

Serve the repository root so both project-prefixed routes can be checked:

```sh
python -m http.server 8000
```

Open `http://localhost:8000/3d/`, `http://localhost:8000/3d/plov/` and
`http://localhost:8000/3d/fruits/`. Native AR still requires a compatible phone
and HTTPS; validate it again after publishing.

The HTML poster remains above the viewer until its load event and returns on
error/retry. Catalog images reserve a responsive aspect ratio; only the first
preview has high priority, while the second is lazy. Previews are 24/35 KB;
the 1.07 MB viewer library is imported only on dish pages.

## Fruits production asset

`fruits-real-v1.glb` replaces the flat-color clean model. It uses separately
sculpted apple, citrus, peach and pomegranate silhouettes; an open pomegranate
calyx; an irregular 23-berry grape bunch with branching stems; leaves with
central veins; and a shallow porcelain plate with a rolled lip and foot ring.
Five fruit-skin materials embed albedo, micro-normal and varying-roughness maps.
The catalog preview and loading poster are renders of this exact GLB.

The asset can be rebuilt with Python 3, NumPy and Pillow:

```sh
python 3d/tools/fruits-realism/build.py
```

The committed GLB and web images are production artifacts, so the website has
no Python or image-generation dependency at runtime.

When changing CSS, app entry points or the shared viewer, update the stable
`?v=` release token in all three HTML files and both app imports. Keep the
pinned vendor URL and unchanged image/model URLs cacheable. GitHub Pages
controls HTML cache headers; clients must navigate/reload to receive a release.
