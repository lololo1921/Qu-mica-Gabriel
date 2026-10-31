// Pisa precio, stock y visibilidad con los datos de Supabase y
// actualiza los precios guardados en el carrito de cada cliente.
(function () {
  var URL_ = window.SUPABASE_URL, KEY = window.SUPABASE_ANON_KEY;
  if (!URL_ || !KEY) return;

  function fmt(n) {
    n = Number(n);
    var partes = n.toFixed(Number.isInteger(n) ? 0 : 2).split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return '$' + partes.join(',');
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
    // El carrito ya se dibujó con los precios viejos: se recarga una sola vez.
    if (location.pathname.indexOf('/carrito') === 0) location.reload();
  }

  function aplicar(filas) {
    var porId = {};
    filas.forEach(function (f) { porId[f.id] = f; });
    window.PRECIOS_SUPABASE = porId;
    aplicarEnPagina(porId);
    aplicarEnCarrito(porId);
    document.dispatchEvent(new CustomEvent('precios-listos'));
  }

  function cargar() {
    fetch(URL_ + '/rest/v1/productos?select=id,precio,agotado,activo', {
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY }
    })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(aplicar)
      .catch(function (e) { console.warn('No se pudieron cargar los precios:', e); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cargar);
  else cargar();
})();
