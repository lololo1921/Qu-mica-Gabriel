// Completa cada ficha con los datos de Supabase (descripción, modo de uso,
// fotos extra, stock). Sirve para las fichas ya generadas y para la plantilla
// de productos nuevos (producto.html).
(function () {
  var URL_ = window.SUPABASE_URL, KEY = window.SUPABASE_ANON_KEY;
  var card = document.querySelector('.product-buy.product-card');
  if (!URL_ || !KEY || !card) return;

  var esPlantilla = !card.dataset.id;
  var id = card.dataset.id;
  if (!id) {
    try { id = decodeURIComponent(location.pathname.split('/').pop() || '').replace(/\.html$/, ''); }
    catch (e) { id = ''; }
  }
  var H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

  function get(path) {
    return fetch(URL_ + '/rest/v1/' + path, { headers: H }).then(function (r) {
      return r.ok ? r.json() : Promise.reject(r.status);
    });
  }
  function fmt(n) {
    n = Number(n);
    var partes = n.toFixed(Number.isInteger(n) ? 0 : 2).split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return '$' + partes.join(',');
  }
  function setText(el, t) { if (el) el.textContent = t; }

  function noEncontrado() {
    var wrap = document.querySelector('.product-detail-section .wrap');
    if (!wrap) return;
    wrap.textContent = '';
    var h = document.createElement('h1');
    h.textContent = 'No encontramos este producto';
    var a = document.createElement('a');
    a.className = 'back-link'; a.href = '/index.html'; a.textContent = '\u2190 Volver al inicio';
    wrap.append(h, a);
    document.title = 'Producto no encontrado \u2014 Qu\u00edmica Gabriel';
  }

  function bloque(titulo, texto) {
    document.querySelectorAll('.product-description-block').forEach(function (b) {
      var h = b.querySelector('h2');
      if (!h || h.textContent.trim() !== titulo) return;
      if (!texto) { b.style.display = 'none'; return; }
      b.style.display = '';
      var p = b.querySelector('p');
      if (!p) { p = document.createElement('p'); b.append(p); }
      p.classList.remove('placeholder-copy');
      p.textContent = texto;
      p.style.whiteSpace = 'pre-line';
    });
  }

  function meta(li, etiqueta, valor) {
    if (!li) return;
    li.textContent = '';
    var s = document.createElement('strong');
    s.textContent = etiqueta;
    li.append(s, document.createTextNode(' ' + valor));
  }

  function llenar(p, extras) {
    var nombreCompleto = p.nombre + (p.variante ? ' (' + p.variante + ')' : '');
    var paginaHref = p.linea === 'la' ? '/p\u00e1ginas/la.html' : '/p\u00e1ginas/lh.html';
    var paginaNombre = p.linea === 'la' ? 'L\u00ednea automotriz' : 'Limpieza del hogar';
    var anchor = paginaHref + '#cat-' + p.categoria_key;

    document.title = p.nombre + ' \u2014 Qu\u00edmica Gabriel';
    card.dataset.id = p.id;
    card.dataset.name = nombreCompleto;
    card.dataset.category = p.categoria_key;
    card.dataset.price = fmt(p.precio);

    var titulo = card.querySelector('.product-title');
    setText(titulo, p.nombre);
    var v = card.querySelector('.product-variant');
    if (p.variante) {
      if (!v && titulo) {
        v = document.createElement('p'); v.className = 'product-variant';
        titulo.insertAdjacentElement('afterend', v);
      }
      setText(v, 'Presentaci\u00f3n: ' + p.variante);
    } else if (v) { v.remove(); }

    setText(card.querySelector('.product-price'), fmt(p.precio));
    setText(card.querySelector('.p-cat'), p.categoria);
    var lis = card.querySelectorAll('.product-meta-list li');
    meta(lis[0], 'Categor\u00eda:', p.categoria);
    meta(lis[1], 'C\u00f3digo:', p.id);

    var bc = document.querySelectorAll('.breadcrumb a');
    if (bc[1]) { bc[1].href = paginaHref; bc[1].textContent = paginaNombre; }
    if (bc[2]) { bc[2].href = anchor; bc[2].textContent = p.categoria; }
    setText(document.querySelector('.breadcrumb .current'), p.nombre);
    var volver = document.querySelector('.back-link');
    if (volver) { volver.href = anchor; volver.textContent = '\u2190 Volver a ' + p.categoria; }

    var wa = card.querySelector('.wa-btn');
    if (wa) wa.href = 'https://wa.me/59899661360?text=' + encodeURIComponent('Hola, quiero consultar sobre: ' + nombreCompleto);

    var fotos = [];
    if (p.imagen) fotos.push(p.imagen);
    extras.forEach(function (x) { fotos.push(x.url); });
    var main = document.getElementById('gallery-main-img');
    var thumbs = document.getElementById('gallery-thumbs');
    if (fotos.length && main && thumbs) {
      main.src = fotos[0]; main.alt = p.nombre;
      var buy = card.querySelector('.buy-img');
      if (buy) { buy.src = fotos[0]; buy.alt = p.nombre; }
      thumbs.textContent = '';
      fotos.forEach(function (src, i) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'thumb' + (i === 0 ? ' active' : '');
        b.dataset.src = src; b.dataset.alt = p.nombre;
        var im = document.createElement('img'); im.src = src; im.alt = p.nombre;
        b.append(im);
        b.addEventListener('click', function () {
          main.src = src; main.alt = p.nombre;
          thumbs.querySelectorAll('.thumb').forEach(function (x) { x.classList.remove('active'); });
          b.classList.add('active');
        });
        thumbs.append(b);
      });
    }

    var btn = card.querySelector('.btn-add');
    if (btn && p.agotado) { btn.disabled = true; btn.textContent = 'Sin stock'; }

    bloque('Descripci\u00f3n', p.descripcion);
    bloque('Modo de uso', p.modo_uso);
  }

  Promise.all([
    get('productos?id=eq.' + encodeURIComponent(id) + '&select=*'),
    get('producto_imagenes?producto_id=eq.' + encodeURIComponent(id) + '&select=url,orden&order=orden')
  ]).then(function (r) {
    var p = r[0][0];
    if (!p) { if (esPlantilla) noEncontrado(); return; }
    if (p.activo === false) { noEncontrado(); return; }
    llenar(p, r[1]);
  }).catch(function (e) {
    console.warn('Ficha:', e);
    if (esPlantilla) noEncontrado();
  });
})();
