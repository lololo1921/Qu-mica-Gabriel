from pathlib import Path
from generar_fichas import render_product_page

p = {
    "id": "", "name": "Cargando…", "variant": "VARIANTE", "price": "",
    "cat_key": "", "cat_label": "",
    "img_src": "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "img_alt": "", "page_label": "Catálogo", "page_href": "/index.html",
}
html = render_product_page(p)
marca = '<script src="/producto.js"></script>'
assert html.count(marca) == 1, "no encontré la línea de producto.js"
html = html.replace(marca, marca + '\n<script src="/precios-supabase.js"></script>\n<script src="/ficha-dinamica.js"></script>')
html = html.replace('Comprá Cargando… en Química Gabriel.', 'Producto de Química Gabriel.')
Path("producto.html").write_text(html, encoding="utf-8")
print("producto.html creado")
