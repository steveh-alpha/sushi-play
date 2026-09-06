#!/usr/bin/env python3
import base64, hashlib, pathlib, sys
expected = {
    "01_nigiri.png": "040262d17edd86f18d7f19c48edb3314",
    "02_maki.png": "84f0ef69d2d91ba54c812f20ca97ee7a",
    "03_gunkan.png": "c07e2c0e36d8d5f71b09350516e8285f",
    "04_temaki.png": "397ef1bd61df29541725903e042b0134",
    "05_chirashi.png": "9d305f0261ed3e48a73b29547a5a6f5d",
    "06_platter.png": "c207be111aa05ac4ba329cfba195b9a1",
    "07_feast.png": "a8f001415a73c67fd9924de5ffcf81c4",
}
art = pathlib.Path("art")
for name, md5 in expected.items():
    b64 = (art / (name + ".b64")).read_text().strip()
    data = base64.b64decode(b64)
    got = hashlib.md5(data).hexdigest()
    if got != md5:
        sys.exit(f"md5 mismatch {name}: {got} != {md5}")
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        sys.exit(f"not png {name}")
    (art / name).write_bytes(data)
    print("wrote", name, len(data), got)
print("ok")
