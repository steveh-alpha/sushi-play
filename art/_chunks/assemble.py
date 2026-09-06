#!/usr/bin/env python3
import base64, hashlib, json, pathlib, sys, shutil
root = pathlib.Path("art/_chunks")
art = pathlib.Path("art")
art.mkdir(exist_ok=True)
for d in sorted(root.iterdir()):
    if not d.is_dir():
        continue
    meta = json.loads((d/"meta.json").read_text())
    parts = [(d/f"{i:02d}.txt").read_text() for i in range(meta["parts"])]
    data = base64.b64decode("".join(parts))
    md5 = hashlib.md5(data).hexdigest()
    if md5 != meta["md5"]:
        sys.exit(f"md5 mismatch {meta['name']}: {md5} != {meta['md5']}")
    (art/meta["name"]).write_bytes(data)
    print("wrote", meta["name"], len(data), md5)
shutil.rmtree(root, ignore_errors=True)
(art/".gitkeep").unlink(missing_ok=True)
print("ALL OK")
