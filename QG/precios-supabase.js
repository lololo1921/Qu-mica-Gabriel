// Pisa precio, stock y visibilidad de cada .product-card con los datos de Supabase.
(function () {
  var URL_ = window.SUPABASE_URL, KEY = window.SUPABASE_ANON_KEY;
  if (!URL_ || !KEY) return;

  function fmt(n) {
    return '$' + Number(n).toLocaleString('es-UY', { maximumFractionDigits: 2 });
  }

  function aplicar(filas) {
    var porId = {};
    filas.forEach(function (f) { porId[f.id] = f; });
    window.PRECIOS_SUPABASE = porId;

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
