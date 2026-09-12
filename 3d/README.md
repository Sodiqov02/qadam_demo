# Osh static 3D / AR demo

Public URL after pushing `main` and completion of the existing Pages build:
https://sodiqov02.github.io/qadam_demo/3d/

GitHub Pages is already configured for branch `main`, repository root `/`.
This addition does not change the homepage, existing assets, or deployment.
There is no backend, API, database, build step, or server code in this directory.

## Files

```text
3d/
  index.html
  style.css
  app.js
  viewer.js
  README.md
  assets/
    osh.glb
    osh.usdz
    preview.webp
  vendor/
    model-viewer-4.3.1.min.js
    model-viewer-LICENSE.txt
```

The existing `../assets/favicon.png` is reused. Page resources are relative;
model URLs are resolved against `import.meta.url`, retaining `/qadam_demo/3d/`
on GitHub Pages and working under other deployment prefixes as well.

## Preserved assets

Copied byte-for-byte from `Z:\qadam_demo local server\static\demo\models\osh`.
No geometry, texture, scale, or material changes were made during the transfer.

| Asset | Bytes | SHA-256 |
| --- | ---: | --- |
| osh.glb | 3,045,028 | `ee98c5ec4ac9837ca2ad1ca655c1934e2d027cd40be02349d053eea0374f6b0b` |
| osh.usdz | 5,787,605 | `1b17a3875ccdd859e02ae4354fda16accee942cdfaf8cc0cddbdf05f96626f62` |
| preview.webp | 23,596 | `f52f3f35004d9418118ff7bc0e345b21ed5c3d6c0ea3fb12b18ed61247862dc6` |

GLB: 86,088 triangles, embedded 4096×4096 texture. USDZ contains its own texture.
The original scan's approximated underside and other existing limitations remain.

## Viewer

The `Посмотреть` button opens a native modal dialog. The viewer module,
model-viewer library, and GLB load only after this click. Orbit, wheel/pinch zoom,
reset, close/Escape and repeat opening are preserved. The invisible pan target
is suppressed so it does not intercept touches at the centre of the model.
Network errors offer a retry with a fresh model cache key. Missing WebGL falls
back to the preview image. AR starts only from the separate AR button.

Android prefers `webxr` and falls back to `scene-viewer`, using the library's
mode selection and native intent implementation. Missing `navigator.xr` does
not disable Scene Viewer. The AR button stays disabled until the model loads;
its click calls `activateAR()` immediately, stops duplicate slot activation,
and reports rejected activations without removing the 3D model. `ar-placement`
is `floor` (horizontal surfaces, including tables), and `ar-scale="auto"`
allows resizing. iPhone
uses `quick-look` and the explicit
`ios-src` URL of `osh.usdz`. Model URLs resolve to the public Pages origin;
there are no hardcoded localhost or domain-root paths in the page.

## Android AR investigation (2026-09-12)

The original code already used the library's built-in AR slot click handler;
there was no custom intent or WebXR-only capability gate. The reported native
Android launch failure has **not been reproduced or conclusively diagnosed**.
Confirmed issues addressed here are fixed scaling, AR being clickable before
model readiness, missing rejected-activation diagnostics, and a status message
that only checked asynchronous AR availability once at model load. The mode
order now follows WebXR → Scene Viewer → ordinary 3D. Mode selection and native
fallback remain owned by model-viewer; `canActivateAR` is not proof that the
Google app / ARCore is installed or that a native session succeeded.

Verified against the public Pages deployment during this investigation:

- Page, GLB, USDZ, viewer module and local library: HTTP 200, no redirects.
- GLB MIME: `model/gltf-binary`; USDZ MIME: `model/vnd.usdz+zip`.
- Downloaded GLB/USDZ are byte-identical to the local assets. This was a desktop
  HTTP download, not a native Android download.
- Local model-viewer 4.3.1 matches the official pinned Google CDN distribution
  after CRLF/LF normalization. No library replacement was necessary.
- Khronos glTF Validator 2.0.0-dev.3.10: zero errors, zero warnings; one informational
  unused UV attribute on the underside. No extensions or external dependencies.
- GLB bounds in metres: min `[-0.105165, 0, -0.105606]`, max
  `[0.105250, 0.039905, 0.105606]`. The origin is at the plate base, near its centre.
- 86,088 triangles, two materials, one embedded JPEG. Its 4096×4096 texture
  exceeds Scene Viewer's **recommended** 2048×2048 limit. The Google validator
  documents that as a warning, not a hard rejection. The asset was preserved
  to avoid an unproven quality reduction; investigate a smaller texture only
  if physical-device testing identifies it as a problem.

References: [Scene Viewer requirements and validation](https://developers.google.com/ar/develop/scene-viewer),
[model-viewer AR documentation](https://modelviewer.dev/examples/augmentedreality/).

Local checks for this change:

```sh
node --check 3d/app.js
node --check 3d/viewer.js
node --check 3d/vendor/model-viewer-4.3.1.min.js
node --test 3d/tests/ar.test.cjs
git diff --check
```

All four application regression tests passed: AR with/without WebXR, immediate
click activation, failure preserving 3D/reset, delayed capabilities, hidden debug
UI, cleanup, and WebGL fallback. The tests stub the DOM and library; they do not
prove browser rendering, actual intent delivery, or native AR placement.
No connected browser or Android/iPhone was available in this session. The older
browser checks below are historical, not a fresh rendering verification.

### Device diagnostics and acceptance check

After deploying this change, open
`https://sodiqov02.github.io/qadam_demo/3d/?ar-debug=1` and press `Посмотреть`.
The dialog displays user agent/platform, Android/iOS/Desktop detection, secure
context, resolved GLB and USDZ URLs, WebGL/custom-element availability, model
load status, `canActivateAR`, WebXR session support, inferred AR mode,
`ar-status`, the last `ar-tracking`, activation timestamp/error, and page
visibility changes after activation. `Copy diagnostics` copies the complete
report as one JSON text.
Without the parameter there is no diagnostic panel. Load, errors, capability
changes, activation attempts and AR status events are also logged to the console.
Native Scene Viewer/Quick Look do not report successful placement via WebXR
`ar-status`; visually confirm that on the phone.

1. On an ARCore-supported Android with current Chrome, Google app and Google
   Play Services for AR, load the deployed page and verify the textured 3D model.
2. Tap `Посмотреть в AR`, allow camera access, scan a table, place the plate,
   move/resize it, and return to the still-working 3D dialog. Repeat the launch.
3. Test a device/browser without WebXR but with Scene Viewer; verify native
   Scene Viewer opens the GLB. Test unavailable AR and denied camera permission;
   the page must retain 3D and offer a readable failure message.
4. On iPhone Safari, confirm Quick Look opens the explicit USDZ and returns.
5. On desktop, confirm orbit, zoom, reset, close/Escape and repeat opening.

**Release acceptance remains pending the physical Android flow above.**
No push or deployment was performed during this investigation.

## Historical verification before the original commit

Tested using Python's standard static HTTP server, not the FastAPI app. The
repository was mounted as `/qadam_demo/` so the exact project subpath was tested.
Temporary test scripts, logs and screenshots were kept outside this repository.

- Desktop 1440×1000 and mobile 390×844 Chromium viewports: image/card layout,
  actual textured GLB rendering, mouse/touch orbit, wheel/pinch zoom, reset,
  close, Escape and repeat opening passed.
- No page JavaScript errors or HTTP 404s during normal viewing.
- GLB and model-viewer are not requested before opening the viewer.
- All page asset requests retain the project prefix; no backend/API requests.
- Direct GLB/USDZ/preview requests returned 200 and bytes identical to the files.
- Failed model request followed by retry passed. WebGL-disabled fallback passed.
- JavaScript syntax checks and `git diff --check` passed.

Physical Android/iPhone AR sessions were not available for testing. HTTPS is
provided by GitHub Pages, but final native AR testing must happen after push.
In particular, verify Quick Look opens the deployed USDZ: the standard local
Windows static server returns `application/octet-stream` for GLB/USDZ, so it
cannot establish the MIME headers used by GitHub Pages. The preferred USDZ
header is `model/vnd.usdz+zip`. No custom server MIME configuration is shipped.
Unsupported devices retain the normal 3D viewer.

## Publishing

No push was performed as part of this change. From the repository root:

```sh
git push origin main
```

Then wait for the existing GitHub Pages build and open the URL above. This
page does not need the local computer, FastAPI or Cloudflare Tunnel online.

## Third-party library

`vendor/model-viewer-4.3.1.min.js` is the unchanged local distribution from
https://ajax.googleapis.com/ajax/libs/model-viewer/4.3.1/model-viewer.min.js .
model-viewer is Apache-2.0; its license is included. Bundled dependency notices
are retained in the distribution. AR reference: https://modelviewer.dev/examples/augmentedreality/ .
