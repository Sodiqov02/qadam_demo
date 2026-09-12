# Qadam 3D / AR demo catalog

Static, mobile-first catalog for showing restaurant dishes in 3D and AR. It has
no backend, API, database, build step, or runtime dependency on the local PC.

After publishing the repository root with GitHub Pages:

- Catalog: https://sodiqov02.github.io/qadam_demo/3d/
- Demo Plov: https://sodiqov02.github.io/qadam_demo/3d/plov/
- Demo Plov diagnostics: https://sodiqov02.github.io/qadam_demo/3d/plov/?ar-debug=1

## Structure

```text
3d/
  index.html                         catalog; preview images only
  style.css                          shared catalog/model-page styles
  viewer.js                          shared 3D, AR, fallback and diagnostics logic
  plov/
    index.html                       Demo Plov page
    app.js                           Demo Plov asset configuration
  assets/
    preview.webp
    osh.glb
    osh.usdz
  vendor/
    model-viewer-4.3.1.min.js
    model-viewer-LICENSE.txt
  tests/
    ar.test.cjs
```

All browser paths are relative so the project keeps the `/qadam_demo/` GitHub
Pages prefix. The catalog loads only `preview.webp`. The model page loads its
GLB and the local pinned model-viewer distribution when opened. The USDZ URL is
passed to Quick Look but is not used by Android.

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

## Adding Demo Fruits

Place the real assets here without copying or renaming the Plov model:

```text
3d/assets/fruits.glb
3d/assets/fruits.usdz
3d/assets/fruits-preview.webp
```

Then copy `3d/plov/` to `3d/fruits/`, change its title, description, poster and
the three configuration values in `app.js`, and add a `Demo Fruits` card linking
to `./fruits/` in `3d/index.html`. The shared `viewer.js`, local library and CSS
do not need to be duplicated.

## Local verification

```sh
node --check 3d/viewer.js
node --check 3d/plov/app.js
node --check 3d/vendor/model-viewer-4.3.1.min.js
node --test 3d/tests/ar.test.cjs
git diff --check
```

Serve the repository root so both project-prefixed routes can be checked:

```sh
python -m http.server 8000
```

Open `http://localhost:8000/3d/` and `http://localhost:8000/3d/plov/`. Native AR
still requires a compatible phone and HTTPS; validate it again after publishing.
