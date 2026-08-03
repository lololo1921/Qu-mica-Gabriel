#!/usr/bin/env python3
"""
Genera una ficha de producto (.html) por cada producto encontrado en
la.html y lh.html, dentro de /productos-paginas/.

Uso:
    python3 generar_fichas.py

Requiere: bs4 (BeautifulSoup)

Cómo funciona:
  - Se ejecuta parado en la RAÍZ del repo (el mismo nivel que las carpetas
    /páginas, /productos, etc.).
  - Lee /páginas/la.html y /páginas/lh.html.
  - Por cada producto arma un archivo /productos-paginas/{data-id}.html
    con el mismo header/footer/estilo del sitio, una galería de imágenes
    (arranca con la única foto que hay hoy; se le pueden sumar más a mano
    después), y un botón "Agregar al pedido" que graba en el mismo
    carrito (localStorage) que usa el catálogo.
  - Si volvés a correr el script después de agregar productos nuevos en
    la.html/lh.html, vuelve a generar TODAS las fichas. Si ya editaste
    una ficha a mano (agregaste descripción, más fotos, etc.) y no querés
    perder esos cambios, pasale --skip-existentes.
"""

import argparse
import html
import re
import urllib.parse
from pathlib import Path

from bs4 import BeautifulSoup

BASE_DIR = Path(__file__).resolve().parent
PAGINAS_DIR = BASE_DIR / "páginas"
OUT_DIR = BASE_DIR / "productos-paginas"

WHATSAPP_CONSULTA = "59899661360"  # mismo número que usa el footer del sitio

SOURCES = [
    {"file": PAGINAS_DIR / "la.html", "page_label": "Línea automotriz", "page_href": "/páginas/la.html"},
    {"file": PAGINAS_DIR / "lh.html", "page_label": "Limpieza del hogar", "page_href": "/páginas/lh.html"},
]


def esc(text):
    """Escapa texto para uso en contenido HTML."""
    return html.escape(text or "", quote=False)


def esc_attr(text):
    """Escapa texto para uso dentro de un atributo HTML."""
    return html.escape(text or "", quote=True)


def parse_name_and_variant(card):
    """Separa el nombre principal de la variante (contenido del <small>)."""
    h3 = card.find("h3")
    if not h3:
        return card.get("data-name", "").strip(), ""

    small = h3.find("small")
    variant = small.get_text(strip=True) if small else ""

    h3_copy = BeautifulSoup(str(h3), "html.parser").h3
    if h3_copy.find("small"):
        h3_copy.find("small").decompose()
    if h3_copy.find("br"):
        h3_copy.find("br").decompose()
    name = h3_copy.get_text(strip=True)

    if variant in ("", "—"):
        variant = ""

    return name, variant


def extract_products(html_path, page_label, page_href):
    soup = BeautifulSoup(html_path.read_text(encoding="utf-8"), "html.parser")
    products = []

    for block in soup.select(".category-block"):
        cat_key = block.get("data-category-block", "")
        title_el = block.find("h2", class_="category-title")
        cat_label = title_el.get_text(strip=True) if title_el else cat_key

        for card in block.select(".product-card"):
            img = card.find("img")
            name, variant = parse_name_and_variant(card)

            products.append({
                "id": card.get("data-id", "").strip(),
                "name": name or card.get("data-name", "").strip(),
                "variant": variant,
                "price": card.get("data-price", "").strip(),
                "cat_key": cat_key,
                "cat_label": cat_label,
                "img_src": img.get("src", "").strip() if img else "",
                "img_alt": img.get("alt", "").strip() if img else name,
                "page_label": page_label,
                "page_href": page_href,
            })

    return products


def render_product_page(p):
    name_esc = esc(p["name"])
    variant_esc = esc(p["variant"])
    price_esc = esc(p["price"])
    cat_label_esc = esc(p["cat_label"])
    img_src_esc = esc_attr(p["img_src"])
    img_alt_esc = esc_attr(p["img_alt"])
    id_esc = esc_attr(p["id"])
    cat_key_esc = esc_attr(p["cat_key"])
    page_href_esc = esc_attr(p["page_href"])
    page_label_esc = esc(p["page_label"])
    cat_anchor = f'{p["page_href"]}#cat-{p["cat_key"]}'
    cat_anchor_esc = esc_attr(cat_anchor)

    variant_html = (
        f'<p class="product-variant">Presentación: {variant_esc}</p>'
        if p["variant"] else ""
    )

    wa_message = f'Hola, quiero consultar sobre: {p["name"]}' + (f' ({p["variant"]})' if p["variant"] else "")
    wa_text = urllib.parse.quote(wa_message, safe="")

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{name_esc} — Química Gabriel</title>
<meta name="description" content="Comprá {name_esc} en Química Gabriel. Envíos y retiro en Montevideo, Uruguay.">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Work+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
<link rel="stylesheet" href="/producto.css">
</head>
<body>

<header>
  <div class="wrap headbar">
    <div class="logo"><a href="/index.html"><img src="/logo.png" alt="Química Gabriel" class="logo-img"></a></div>
    <nav>
      <ul>
        <li class="has-dropdown">
          <button class="nav-drop-btn" aria-expanded="false">Categorías
            <svg class="chev" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4"/></svg>
          </button>
          <ul class="dropdown-menu">
            <li><a href="/páginas/la.html">Línea automotriz</a></li>
            <li><a href="/páginas/lh.html">Limpieza del hogar</a></li>
          </ul>
        </li>
        <li><a href="/páginas/fp.html">Formas de pago</a></li>
        <li><a href="/páginas/nosotros.html">Nosotros</a></li>
      </ul>
    </nav>
    <div class="head-actions">
      <a class="cart-btn" href="/carrito/carrito.html" aria-label="Carrito">
        <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1.4"/><circle cx="18" cy="21" r="1.4"/><path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21 8H6"/></svg>
        <span class="cart-badge" data-cart-badge>0</span>
      </a>
      <a class="btn-account" href="/formulario/inicio.html">Ingresar</a>
    </div>
    <button class="burger" aria-label="Abrir menú">☰</button>
  </div>
  <div class="mobile-nav">
    <button class="mobile-drop-btn">Categorías
      <svg class="chev" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4"/></svg>
    </button>
    <div class="mobile-submenu">
      <a href="/páginas/la.html">Línea automotriz</a>
      <a href="/páginas/lh.html">Limpieza del hogar</a>
    </div>
    <a href="/páginas/fp.html">Formas de pago</a>
    <a href="/páginas/nosotros.html">Nosotros</a>
    <a href="/carrito/carrito.html">Carrito (<span data-cart-badge>0</span>)</a>
    <a href="/formulario/inicio.html">Ingresar</a>
  </div>
</header>

<nav class="breadcrumb" aria-label="Ruta de navegación">
  <div class="wrap">
    <a href="/index.html">Inicio</a>
    <span class="sep">/</span>
    <a href="{page_href_esc}">{page_label_esc}</a>
    <span class="sep">/</span>
    <a href="{cat_anchor_esc}">{cat_label_esc}</a>
    <span class="sep">/</span>
    <span class="current">{name_esc}</span>
  </div>
</nav>

<section class="section product-detail-section">
  <div class="wrap">
    <div class="product-detail-grid">

      <div class="product-gallery">
        <div class="gallery-main">
          <img id="gallery-main-img" src="{img_src_esc}" alt="{img_alt_esc}">
        </div>
        <div class="gallery-thumbs" id="gallery-thumbs">
          <button type="button" class="thumb active" data-src="{img_src_esc}" data-alt="{img_alt_esc}">
            <img src="{img_src_esc}" alt="{img_alt_esc}">
          </button>
          <!-- Para sumar más fotos: agregá otro <button> igual a este, cambiando data-src/data-alt -->
        </div>
      </div>

      <div class="product-buy product-card" data-id="{id_esc}" data-name="{esc_attr(p['name'])}" data-price="{esc_attr(p['price'])}" data-category="{cat_key_esc}">
        <img class="buy-img" src="{img_src_esc}" alt="{img_alt_esc}">
        <span class="p-cat">{cat_label_esc}</span>
        <h1 class="product-title">{name_esc}</h1>
        {variant_html}
        <div class="product-price">{price_esc}</div>
        <button type="button" class="btn-add">Agregar al pedido</button>
        <a class="wa-btn" href="https://wa.me/{WHATSAPP_CONSULTA}?text={wa_text}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
        <ul class="product-meta-list">
          <li><strong>Categoría:</strong> {cat_label_esc}</li>
          <li><strong>Código:</strong> {id_esc}</li>
        </ul>
      </div>
    </div>

    <div class="product-description-block">
      <h2>Descripción</h2>
      <p class="placeholder-copy">Agregá acá una descripción más detallada del producto: para qué sirve, en qué superficies se usa, rendimiento, etc.</p>
    </div>

    <div class="product-description-block">
      <h2>Modo de uso</h2>
      <p class="placeholder-copy">Agregá acá el modo de uso o dosificación recomendada.</p>
    </div>

    <a class="back-link" href="{cat_anchor_esc}">&larr; Volver a {cat_label_esc}</a>
  </div>
</section>

<div class="lightbox-overlay" id="lightbox-overlay">
  <button class="lightbox-close" id="lightbox-close" aria-label="Cerrar">&times;</button>
  <img class="lightbox-img" id="lightbox-img" src="" alt="">
</div>

<footer>
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <div class="logo"><img src="/logo.png" alt="Química Gabriel" class="logo-img"></div>
        <p>Droguería especializada en productos automotrices y de limpieza del hogar. Danubio 5090, Sayago — Montevideo, Uruguay.</p>
        <a class="wa-btn" href="https://wa.me/59899661360" target="_blank" rel="noopener">WhatsApp</a>
      </div>
      <div>
        <h4>Catálogo</h4>
        <ul>
          <li><a href="/páginas/la.html">Línea automotriz</a></li>
          <li><a href="/páginas/lh.html">Limpieza del hogar</a></li>
          <li><a href="/páginas/fp.html">Formas de pago</a></li>
        </ul>
      </div>
      <div>
        <h4>Empresa</h4>
        <ul>
          <li><a href="/páginas/nosotros.html">Nosotros</a></li>
          <li><a href="/páginas/nosotros.html">Contacto</a></li>
          <li><a href="/formulario/inicio.html">Mi cuenta</a></li>
        </ul>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© 2026 Química Gabriel</span>
      <span>Boceto — versión de trabajo</span>
    </div>
  </div>
</footer>

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/supabase-config.js"></script>
<script src="/script.js"></script>
<script src="/producto.js"></script>
</body>
</html>
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--skip-existentes",
        action="store_true",
        help="No sobrescribe fichas que ya existan en /productos-paginas/ (para no perder ediciones manuales).",
    )
    args = parser.parse_args()

    OUT_DIR.mkdir(exist_ok=True)

    all_products = []
    for source in SOURCES:
        path = source["file"]
        if not path.exists():
            print(f'  [!] No se encontró {path} — ¿estás parado en la raíz del repo?')
            continue
        products = extract_products(path, source["page_label"], source["page_href"])
        all_products.extend(products)
        print(f'{path.name}: {len(products)} productos encontrados')

    ids_seen = {}
    creadas, saltadas = 0, 0

    for p in all_products:
        if not p["id"]:
            print("  [!] producto sin data-id, se omite:", p["name"])
            continue

        if p["id"] in ids_seen:
            print(f'  [!] data-id duplicado: "{p["id"]}" ({p["name"]}) — se pisa el anterior')
        ids_seen[p["id"]] = True

        out_path = OUT_DIR / f'{p["id"]}.html'

        if args.skip_existentes and out_path.exists():
            saltadas += 1
            continue

        out_path.write_text(render_product_page(p), encoding="utf-8")
        creadas += 1

    print(f"\nTotal productos: {len(all_products)}")
    print(f"Fichas generadas/actualizadas: {creadas}")
    if args.skip_existentes:
        print(f"Fichas saltadas (ya existían): {saltadas}")
    print(f"Carpeta de salida: {OUT_DIR}")


if __name__ == "__main__":
    main()