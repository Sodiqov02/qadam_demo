# QadamUp Demo — continuation state

Updated: 2026-11-15. Repository: https://github.com/sodiqov02/qadam_demo
Public: https://sodiqov02.github.io/qadam_demo/

## Scope and constraints
Optimize only 3d demo speed/stability. Preserve original textures, colors, geometry and existing design. Do not touch backend, cart or payments. User will test actual iPhone/LTE/Quick Look. Cloud WebGL unavailable: do not retry it. Update this file after every completed stage.

## Stage 1 — repository audit COMPLETE
- Fresh clone main at 09d5a9ca6d93a2bc373ca606cadcaa2116b92fa8; only remote branch main, working tree initially clean.
- Latest published source contains poster/retry and restored textures, but NOT prior agent's caching/progress/direct Quick Look/optimized assets. Prior chat claims are not proof of publication.
- No prior local uncommitted files available in this workspace.
- GLB baseline: osh.glb 3,045,028 bytes; fruits-real-v1.glb 6,732,052 bytes.
- USDZ baseline: osh.usdz 5,787,605 bytes; fruits.usdz 11,206,159 bytes.
- Plov GLB has 1 embedded JPEG (729,715 bytes). Fruits has 18 embedded images (1,478,313 bytes total; retain bytes).
- Fruits USDZ incorrectly labels several JPEG payloads as .png; fix package references without changing payloads. USDA mesh data is 9,724,894 bytes; convert losslessly to USDC.
- Remote page reachable HTTP 200. Publication for this continuation not yet done.

## Next stages
2. Optimize assets, verify preservation/integrity, record exact measurements.
3. Restore cache/progress/direct iOS Quick Look and lazy USDZ; meaningful automated tests.
4. Commit/publish through connected GitHub, verify actual live hashes. Record evidence and iPhone checks still required.

## Stage 2 — asset optimization COMPLETE
- New osh-fast.glb: 2,149,640 bytes (-29.40%). New fruits-real-v1-fast.glb: 3,862,220 bytes (-42.63%).
- Lossless Meshopt + vertex/index reordering, no quantization/simplification. Compared every oriented triangle including POSITION/NORMAL/UV (and other vertex attributes) after decoding against originals; all exact. All embedded textures byte-identical. Originals retained for rollback.
- Fruits target 1–3 MB not reached under strict lossless constraint; prefer exact original appearance/geometry to aggressive lossy conversion.
- fruits-fast.usdz: 3,342,452 bytes (-70.17%). USDA converted to USDC, JPEG file suffixes corrected. Every texture payload byte-identical; all package references resolve; uncompressed ZIP, 64-byte entry alignment verified.
- Plov USDZ lossless re-export saved only 104 bytes; retained original working osh.usdz (5,787,605 bytes).
- Reproducible scripts in 3d/tools/optimize. Decoder vendored with MIT license. Runtime supports EXT_meshopt_compression; CSP allows WebAssembly compilation only in addition to existing self script policy.

## Stage 3 — implementation COMPLETE
- Restored direct iOS rel=ar anchor independent of GLB/WebGL; no USDZ prefetch.
- Cache-first service worker scoped to 3d; only versioned GLBs and viewer/decoder scripts, never HTML/cart/API. Registration bounded to 1.5s, online fallback on cache/quota failure. Retry keeps stable model URLs.
- Viewer native progress events, poster/error/retry retained. 27 automated tests passed (16 AR/assets + 4 cache behavior + 7 security).

- Service worker also caches full successful USDZ requests after user activation; never prefetches USDZ, never intercepts range requests. Native Quick Look may use OS-managed networking/cache outside the service worker; on-device verification still required.
- Exact embedded model-viewer decoder decoded both new GLBs. Khronos glTF Validator on decoded files: 0 errors / 0 warnings for each.
- USDZ checks: dependency resolution, CRC, ZIP stored mode, 64-byte alignment, original texture hashes; all USD array/xform values compared against original (see verification output).
- No cloud WebGL attempts. No claims about real LTE/decode/first-render times; user tests those.

## Stage 4 — publication IN PROGRESS
- Git dry-run confirms local push has no credentials. Use connected GitHub Git Data API (blobs/tree/commit/ref), expected-head lease on main; user explicitly authorized publication.
- Keep parent 09d5a9ca6d93a2bc373ca606cadcaa2116b92fa8 unless remote head advances. Never force overwrite concurrent work.
- After push verify GitHub Pages deployment and actual served asset SHA-256, not only HTTP 200 or API ref update.
