// Pisa precio, stock y visibilidad con los datos de Supabase, dibuja los
// productos nuevos en el catálogo y actualiza los precios del carrito.
(function () {
  var URL_ = window.SUPABASE_URL, KEY = window.SUPABASE_ANON_KEY;
  if (!URL_ || !KEY) return;

  function fmt(n) {
    n = Number(n);
    var partes = n.toFixed(Number.isInteger(n) ? 0 : 2).split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return '$' + partes.join(',');
  }

  function crearTarjeta(f) {
    var nombreCompleto = f.nombre + (f.variante ? ' (' + f.variante + ')' : '');
    var card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.category = f.categoria_key;
    card.dataset.id = f.id;
    card.dataset.name = nombreCompleto;
    card.dataset.price = fmt(f.precio);

    var img = document.createElement('img');
    img.src = f.imagen || '';
    img.alt = f.nombre;
    img.loading = 'lazy';

    var body = document.createElement('div');
    body.className = 'product-card-body';

    var cat = document.createElement('span');
    cat.className = 'p-cat';
    cat.textContent = f.categoria;

    var h3 = document.createElement('h3');
    h3.append(document.createTextNode(f.nombre));
    if (f.variante) {
      h3.append(document.createElement('br'));
      var small = document.createElement('small');
      small.style.cssText = 'font-weight:500;color:#8b928d;';
      small.textContent = f.variante;
      h3.append(small);
    }

    var precio = document.createElement('span');
    precio.className = 'p-price';
    precio.textContent = fmt(f.precio);

    var btn = document.createElement('button');
    btn.className = 'btn-add';
    btn.textContent = 'Agregar al pedido';

    var ver = document.createElement('a');
    ver.className = 'btn-view-more';
    ver.href = '/productos-paginas/' + f.id + '.html';
    ver.textContent = 'Ver más';

    body.append(cat, h3, precio, btn, ver);
    card.append(img, body);
    return card;
  }

  function inyectarNuevos(filas) {
    var m = location.pathname.match(/\/(la|lh)\.html$/);
    if (!m) return;
    var existentes = {};
    document.querySelectorAll('.product-card[data-id]').forEach(function (c) { existentes[c.dataset.id] = true; });
    filas.forEach(function (f) {
      if (existentes[f.id] || f.activo === false || f.linea !== m[1]) return;
      try {
        var grid = document.querySelector('.category-block[data-category-block="' + f.categoria_key + '"] .product-grid');
        if (grid) grid.append(crearTarjeta(f));
      } catch (e) { console.warn('No se pudo dibujar', f.id, e); }
    });
  }

  function aplicarEnPagina(porId) {
    document.querySelectorAll('.product-card[data-id]').forEach(function (card) {
      var f = porId[card.dataset.id];
      if (!f) return;
      if (f.activo === false) { card.style.display = 'none'; return; }

      var texto = fmt(f.precio);
      card.dataset.price = texto;
      var el = card.querySelector('.p-price, .product-price');
      if (el) el.textContent = texto;

      if (f.agotado) {
        card.classList.add('sin-stock');
        var btn = card.querySelector('.btn-add');
        if (btn) { btn.disabled = true; btn.textContent = 'Sin stock'; }
      }
    });
  }

  function aplicarEnCarrito(porId) {
    if (typeof getCart !== 'function' || typeof saveCart !== 'function') return;
    var cart = getCart(), cambio = false;
    cart.forEach(function (item) {
      var f = porId[item.id];
      if (!f) return;
      var n = Number(f.precio);
      if (Number(item.priceNumber) !== n) {
        item.priceNumber = n;
        item.price = fmt(n);
        cambio = true;
      }
    });
    if (!cambio) return;
    saveCart(cart);
    if (location.pathname.indexOf('/carrito') === 0) location.reload();
  }

  function aplicar(filas) {
    var porId = {};
    filas.forEach(function (f) { porId[f.id] = f; });
    window.PRECIOS_SUPABASE = porId;
    inyectarNuevos(filas);
    aplicarEnPagina(porId);
    aplicarEnCarrito(porId);
    document.dispatchEvent(new CustomEvent('precios-listos'));
  }

  function cargar() {
    fetch(URL_ + '/rest/v1/productos?select=id,nombre,variante,precio,agotado,activo,imagen,categoria,categoria_key,linea', {
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY }
    })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(aplicar)
      .catch(function (e) { console.warn('No se pudieron cargar los precios:', e); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cargar);
  else cargar();
})();
