"""Losslessly repack USDZ: binary crate layer, correct image suffixes, 64-byte ZIP alignment."""
from pathlib import Path
import tempfile, zipfile, hashlib, json
from pxr import Sdf, Usd, UsdUtils
root = Path(__file__).resolve().parents[2] / 'assets'
for name in ['osh', 'fruits']:
    source = root / (name + '.usdz')
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        with zipfile.ZipFile(source) as z:
            z.extractall(tmp)
            entry = tmp / z.namelist()[0]
        layer = Sdf.Layer.FindOrOpen(str(entry))
        text = layer.ExportToString()
        images = []
        for p in tmp.rglob('*'):
            if not p.is_file() or p == entry: continue
            data = p.read_bytes()
            images.append(hashlib.sha256(data).hexdigest())
            if data.startswith(b'\xff\xd8\xff') and p.suffix == '.png':
                new = p.with_suffix('.jpg')
                text = text.replace(p.relative_to(tmp).as_posix(), new.relative_to(tmp).as_posix())
                p.rename(new)
        corrected = Sdf.Layer.CreateAnonymous('.usda')
        assert corrected.ImportFromString(text)
        binary = tmp / (name + '-fast.usdc')
        assert corrected.Export(str(binary))
        output = root / (name + '-fast.usdz')
        assert UsdUtils.CreateNewUsdzPackage(Sdf.AssetPath(str(binary)), str(output))
        stage = Usd.Stage.Open(str(output))
        assert stage
        errors = UsdUtils.ComputeAllDependencies(str(output))[2]
        assert not errors, errors
        with zipfile.ZipFile(output) as z:
            assert not z.testzip()
            result = sorted(hashlib.sha256(z.read(x)).hexdigest() for x in z.namelist()[1:])
            assert result == sorted(images), 'texture payloads changed'
            for x in z.infolist():
                assert x.compress_type == 0
                with output.open('rb') as f:
                    f.seek(x.header_offset + 26)
                    import struct
                    n, e = struct.unpack('<HH', f.read(4))
                    assert (x.header_offset + 30 + n + e) % 64 == 0
        print(name, source.stat().st_size, '->', output.stat().st_size, 'valid USDZ, textures byte-identical')
