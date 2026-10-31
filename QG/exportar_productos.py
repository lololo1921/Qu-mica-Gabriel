import json, re
from pathlib import Path
from generar_fichas import SOURCES, extract_products

def num(s):
    s = re.sub(r"[^\d.,]", "", s or "")
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    elif re.fullmatch(r"\d{1,3}(\.\d{3})+", s):
        s = s.replace(".", "")
    return float(s) if s else None

out = []
for src in SOURCES:
    for p in extract_products(src["file"], src["page_label"], src["page_href"]):
        out.append({
            "id": p["id"], "nombre": p["name"], "variante": p["variant"],
            "precio_original": p["price"], "precio": num(p["price"]),
            "categoria_key": p["cat_key"], "categoria": p["cat_label"],
            "linea": "la" if "la.html" in p["page_href"] else "lh",
            "imagen": p["img_src"],
        })

Path("productos.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
print(len(out), "productos")
for p in out:
    if p["precio"] is None:
        print("SIN PRECIO:", p["id"], p["precio_original"])