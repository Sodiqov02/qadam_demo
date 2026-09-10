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

Android prefers `scene-viewer` and falls back to `webxr`; putting Scene Viewer
first avoids Samsung Internet stalling on WebXR capability detection. iPhone
uses `quick-look` and the explicit
`ios-src` URL of `osh.usdz`. Model URLs resolve to the public Pages origin;
there are no hardcoded localhost or domain-root paths in the page.

## Verification before commit

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
