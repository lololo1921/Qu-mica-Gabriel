import json, os, re, unicodedata
from pathlib import Path
from urllib.parse import quote, unquote
import mimetypes
import requests

URL = os.environ["SUPABASE_URL"].rstrip("/")
KEY = os.environ["SUPABASE_SERVICE_KEY"]
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}
BASE = Path(__file__).resolve().parent
BUCKET = "productos"


def slug_path(rel):
    """Limpia la ruta para usarla como nombre en Storage (sin acentos ni espacios)."""
    rel = unicodedata.normalize("NFD", rel)
    rel = "".join(c for c in rel if not unicodedata.combining(c))
    rel = re.sub(r"[^A-Za-z0-9._/-]+", "-", rel).strip("-/")
    return rel.lower()


productos = json.loads((BASE / "productos.json").read_text(encoding="utf-8"))

destinos = {}      # destino en Storage -> archivo local (detecta choques)
subidas = {}       # archivo local -> URL pública
faltantes = []

for p in productos:
    src = unquote(p["imagen"]).lstrip("/")
    if not src:
        faltantes.append((p["id"], "(sin imagen)"))
        p["imagen"] = ""
        continue
    local = BASE / src
    if not local.exists():
        faltantes.append((p["id"], src))
        p["imagen"] = ""
        continue

    if src in subidas:
        p["imagen"] = subidas[src]
        continue

    dest = slug_path(src)
    base_dest, n = dest, 1
    while dest in destinos and destinos[dest] != src:   # dos archivos distintos con el mismo nombre limpio
        n += 1
        stem, dot, ext = base_dest.rpartition(".")
        dest = f"{stem}-{n}.{ext}" if dot else f"{base_dest}-{n}"
    destinos[dest] = src

    mime = mimetypes.guess_type(local.name)[0] or "application/octet-stream"
    r = requests.post(
        f"{URL}/storage/v1/object/{BUCKET}/{quote(dest)}",
        headers={**H, "Content-Type": mime, "x-upsert": "true"},
        data=local.read_bytes(),
    )
    if r.status_code >= 300:
        print("ERROR subiendo", src, r.status_code, r.text)
        faltantes.append((p["id"], src))
        p["imagen"] = ""
        continue
    publica = f"{URL}/storage/v1/object/public/{BUCKET}/{quote(dest)}"
    subidas[src] = publica
    p["imagen"] = publica
    print("OK imagen:", dest)

filas = [{
    "id": p["id"], "nombre": p["nombre"], "variante": p["variante"],
    "precio": p["precio"], "categoria_key": p["categoria_key"],
    "categoria": p["categoria"], "linea": p["linea"], "imagen": p["imagen"],
} for p in productos]

for i in range(0, len(filas), 50):
    r = requests.post(
        f"{URL}/rest/v1/productos?on_conflict=id",
        headers={**H, "Content-Type": "application/json",
                 "Prefer": "resolution=merge-duplicates,return=minimal"},
        data=json.dumps(filas[i:i + 50]),
    )
    if r.status_code >= 300:
        print("ERROR insertando lote", i, r.status_code, r.text)
        raise SystemExit(1)

print(f"\nProductos cargados: {len(filas)}")
print(f"Imágenes subidas: {len(subidas)}")
if faltantes:
    print("Sin imagen o con error:")
    for pid, src in faltantes:
        print("  -", pid, "->", src)