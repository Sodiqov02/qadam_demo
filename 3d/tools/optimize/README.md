# Lossless demo asset optimization

Run `npm install` here, then `npm run optimize`. GLB inputs are retained in assets;
outputs use `-fast.glb` names. No quantization, simplification, material or texture
conversion. Meshopt changes vertex order and may cyclically rotate triangle indices;
the script verifies oriented triangles with all vertex attributes after decoding and
checks embedded texture payloads byte for byte.

USDZ: `python -m pip install usd-core==26.11`, then `python usdz.py`.
Re-export USD layer as binary USDC, correct JPEG filename extensions, package using
OpenUSD's aligned/uncompressed USDZ writer. Original files remain unchanged.
Plov re-export saves only 104 bytes and is deliberately not used by the site.

Runtime: vendored model-viewer 4.3.1, Meshopt decoder 1.3.0; decoder served locally,
CSP permits WebAssembly compilation (`wasm-unsafe-eval`). No Draco/KTX2/WebP
conversion is applied: original image payloads and decoded geometry are preserved.

Verification on 2026-11-15: both compressed GLBs decoded with the exact decoder
embedded in vendored model-viewer, then validated by Khronos glTF Validator with
0 errors and 0 warnings. USDZ dependency resolution, ZIP CRC, uncompressed entries,
64-byte alignment, original texture hashes and all 800 USD arrays/xforms verified.
Actual iPhone rendering, LTE timings and native Quick Look require device testing.
