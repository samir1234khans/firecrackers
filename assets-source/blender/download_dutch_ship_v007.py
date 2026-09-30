"""Download one official Poly Haven CC0 asset and verify supplied checksums.

Source inspection only; nothing is copied into the public runtime bundle.
"""
from __future__ import annotations
import datetime
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1] / "downloads" / "polyhaven-dutch-ship-medium-v007"
SLUG = "dutch_ship_medium"
HEADERS = {"User-Agent": "Mozilla/5.0 (Firecrackers asset source inspection)"}

def fetch(url: str) -> bytes:
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=60) as response:
        return response.read()

def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    api_url = f"https://api.polyhaven.com/files/{SLUG}"
    api_bytes = fetch(api_url)
    (ROOT / "official-files.json").write_bytes(api_bytes)
    info_bytes = fetch(f"https://api.polyhaven.com/info/{SLUG}")
    (ROOT / "official-info.json").write_bytes(info_bytes)
    license_url = "https://polyhaven.com/license"
    (ROOT / "official-license.html").write_bytes(fetch(license_url))
    package = json.loads(api_bytes)["gltf"]["1k"]["gltf"]
    files = {f"{SLUG}_1k.gltf": {key: value for key, value in package.items() if key != "include"}}
    files.update(package["include"])
    entries = []
    for relative_path, descriptor in files.items():
        destination = ROOT / relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        content = destination.read_bytes() if destination.exists() else fetch(descriptor["url"])
        supplied_md5 = hashlib.md5(content).hexdigest()
        if supplied_md5 != descriptor["md5"] or len(content) != descriptor["size"]:
            raise RuntimeError(f"Official checksum/size mismatch: {relative_path}")
        destination.write_bytes(content)
        entries.append({"path": relative_path, "url": descriptor["url"], "bytes": len(content), "official_md5": supplied_md5, "sha256": hashlib.sha256(content).hexdigest()})
        print(f"VERIFIED {relative_path}: {len(content)} bytes", flush=True)
    receipt = {"retrieved_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(), "source": f"https://polyhaven.com/a/{SLUG}", "license": "CC0-1.0", "license_url": license_url, "api_url": api_url, "resolution": "1k", "files": entries, "package_bytes": sum(item["bytes"] for item in entries), "public_bundle_modified": False}
    (ROOT / "download-receipt.json").write_text(json.dumps(receipt, indent=2), encoding="utf-8")
    print(f"READY {ROOT} ({receipt['package_bytes']} bytes)", flush=True)

if __name__ == "__main__":
    main()
