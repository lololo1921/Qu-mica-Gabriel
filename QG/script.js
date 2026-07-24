// ===== Menú móvil: abre/cierra la navegación =====
document.addEventListener('DOMContentLoaded', function () {
  const burger = document.querySelector('.burger');
  const mobileNav = document.querySelector('.mobile-nav');

  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
    });
  }
});

// ===== Dropdown "Categorías" (desktop) =====
document.addEventListener('DOMContentLoaded', function () {
  const dropdown = document.querySelector('.has-dropdown');
  if (!dropdown) return;
  const btn = dropdown.querySelector('.nav-drop-btn');

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    dropdown.classList.toggle('open');
    btn.setAttribute('aria-expanded', dropdown.classList.contains('open'));
  });

  document.addEventListener('click', function (e) {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
});

// ===== Submenú "Categorías" (mobile) =====
document.addEventListener('DOMContentLoaded', function () {
  const mobileBtn = document.querySelector('.mobile-drop-btn');
  const mobileSubmenu = document.querySelector('.mobile-submenu');
  if (!mobileBtn || !mobileSubmenu) return;

  mobileBtn.addEventListener('click', function () {
    mobileSubmenu.classList.toggle('open');
    mobileBtn.classList.toggle('open');
  });
});

// ===== Carrito (localStorage, funciona con o sin cuenta) =====
const CART_KEY = 'qg_cart';

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadges();
}

function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(function (p) { return p.id === item.id; });
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: item.id, name: item.name, category: item.category, img: item.img, price: item.price || '', qty: 1 });
  }
  saveCart(cart);
}

function updateCartBadges() {
  const total = getCart().reduce(function (sum, p) { return sum + p.qty; }, 0);
  document.querySelectorAll('[data-cart-badge]').forEach(function (el) {
    el.textContent = total;
    if (el.classList.contains('cart-badge')) {
      el.classList.remove('bump');
      // forzamos reflow para poder reiniciar la animación
      void el.offsetWidth;
      el.classList.add('bump');
    }
  });
}

document.addEventListener('DOMContentLoaded', updateCartBadges);

// Botón "Agregar al pedido" en las páginas de catálogo
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.btn-add').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const card = btn.closest('.product-card');
      if (!card) return;

      addToCart({
        id: card.dataset.id,
        name: card.dataset.name,
        category: card.dataset.category,
        price: card.dataset.price || '',
        img: card.querySelector('img') ? card.querySelector('img').src : ''
      });

      const original = btn.textContent;
      btn.textContent = 'Agregado ✓';
      btn.classList.add('added');
      setTimeout(function () {
        btn.textContent = original;
        btn.classList.remove('added');
      }, 1200);
    });
  });
});

// Visor de imagen ampliada: clic en la foto de un producto la muestra en grande
document.addEventListener('DOMContentLoaded', function () {
  const cards = document.querySelectorAll('.product-card');
  if (!cards.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML = '<button type="button" class="lightbox-close" aria-label="Cerrar">&times;</button><img class="lightbox-img" src="" alt="">';
  document.body.appendChild(overlay);
  const lightboxImg = overlay.querySelector('.lightbox-img');

  function closeLightbox() {
    overlay.classList.remove('open');
  }

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeLightbox();
  });
  overlay.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });

  cards.forEach(function (card) {
    const img = card.querySelector('img');
    if (!img) return;
    img.addEventListener('click', function () {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      overlay.classList.add('open');
    });
  });
});

// Estado de stock: si un producto está marcado como agotado (ver /datos/stock.json,
// que actualizan los scripts scripts/marcar-agotado.js y marcar-disponible.js),
// se muestra en gris con el botón deshabilitado.
document.addEventListener('DOMContentLoaded', function () {
  const cards = document.querySelectorAll('.product-card');
  if (!cards.length) return;

  fetch('/datos/stock.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      const agotados = (data && data.agotados) || [];
      cards.forEach(function (card) {
        if (agotados.indexOf(card.dataset.id) === -1) return;

        card.classList.add('sin-stock');

        const badge = document.createElement('span');
        badge.className = 'stock-badge';
        badge.textContent = 'Sin stock';
        card.prepend(badge);

        const btn = card.querySelector('.btn-add');
        if (btn) {
          btn.textContent = 'Sin stock';
          btn.disabled = true;
        }
      });
    })
    .catch(function () {
      // Si la página se abre sin servidor local (file://) el fetch puede fallar;
      // en ese caso el catálogo simplemente se muestra sin marcar el stock.
    });
});

// Filtro de catálogo por categoría (con o sin carrito en la misma página)
document.addEventListener('DOMContentLoaded', function () {
  const chips = document.querySelectorAll('.filter-chip');
  const cards = document.querySelectorAll('.product-card');
  const emptyState = document.querySelector('.empty-state');
  if (!chips.length || !cards.length) return;

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');

      const category = chip.dataset.category;
      let visibleCount = 0;

      cards.forEach(function (card) {
        const match = category === 'todos' || card.dataset.category === category;
        card.style.display = match ? '' : 'none';
        if (match) visibleCount++;
      });

      if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
      }
    });
  });
});

// ===== Renderizado de la página del carrito =====
function renderCartPage() {
  const list = document.getElementById('cart-list');
  if (!list) return; // no estamos en la página de carrito

  const qrResult = document.getElementById('qr-result');
  if (qrResult) qrResult.style.display = 'none';

  const emptyMsg = document.getElementById('cart-empty');
  const summary = document.getElementById('cart-summary');
  const addressWrap = document.getElementById('cart-address-wrap');
  const cart = getCart();

  list.innerHTML = '';

  if (cart.length === 0) {
    if (emptyMsg) emptyMsg.style.display = 'block';
    if (summary) summary.style.display = 'none';
    if (addressWrap) addressWrap.style.display = 'none';
    return;
  }

  if (emptyMsg) emptyMsg.style.display = 'none';
  if (summary) summary.style.display = 'flex';
  if (addressWrap) addressWrap.style.display = 'block';

  cart.forEach(function (item) {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML =
      '<img src="' + item.img + '" alt="' + item.name + '">' +
      '<div class="cart-item-info">' +
        '<span class="p-cat">' + item.category + '</span>' +
        '<h3>' + item.name + '</h3>' +
        (item.price ? '<span class="p-price" style="margin:0;">' + item.price + '</span>' : '') +
      '</div>' +
      '<div class="qty-control">' +
        '<button type="button" class="qty-minus">−</button>' +
        '<span>' + item.qty + '</span>' +
        '<button type="button" class="qty-plus">+</button>' +
      '</div>' +
      '<button type="button" class="remove-item">Quitar</button>';

    row.querySelector('.qty-minus').addEventListener('click', function () {
      changeQty(item.id, -1);
    });
    row.querySelector('.qty-plus').addEventListener('click', function () {
      changeQty(item.id, 1);
    });
    row.querySelector('.remove-item').addEventListener('click', function () {
      removeFromCart(item.id);
    });

    list.appendChild(row);
  });

  updateCartTotalText();
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find(function (p) { return p.id === id; });
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    return removeFromCart(id);
  }
  saveCart(cart);
  renderCartPage();
}

function removeFromCart(id) {
  const cart = getCart().filter(function (p) { return p.id !== id; });
  saveCart(cart);
  renderCartPage();
}

function parsePrice(str) {
  if (!str) return null;
  const m = str.match(/\$\s*([\d]{1,3}(?:\.\d{3})*)/);
  if (!m) return null;
  return parseInt(m[1].replace(/\./g, ''), 10);
}

function formatPrice(n) {
  return '$' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function updateCartTotalText() {
  const countEl = document.getElementById('cart-total-count');
  const amountEl = document.getElementById('cart-total-amount');
  if (!countEl) return;
  const cart = getCart();
  const totalQty = cart.reduce(function (sum, p) { return sum + p.qty; }, 0);
  countEl.textContent = totalQty;

  if (!amountEl) return;
  let totalAmount = 0;
  let unpriced = 0;
  cart.forEach(function (item) {
    const price = parsePrice(item.price);
    if (price !== null) {
      totalAmount += price * item.qty;
    } else {
      unpriced += item.qty;
    }
  });

  let html = 'Total a pagar: ' + formatPrice(totalAmount);
  if (unpriced > 0) {
    html += '<span class="unpriced-note">+ ' + unpriced + ' producto(s) a consultar precio</span>';
  }
  amountEl.innerHTML = html;
}

const WHATSAPP_NUMBER = '59897359485';

function buildWhatsAppMessage() {
  const cart = getCart();
  if (cart.length === 0) return '';
  let total = 0;
  let unpriced = 0;
  const lines = ['Hola, quiero coordinar este pedido:'];
  cart.forEach(function (item) {
    const price = parsePrice(item.price);
    if (price !== null) {
      total += price * item.qty;
    } else if (item.price) {
      unpriced += item.qty;
    }
    lines.push('- ' + item.name + ' (' + item.qty + ')' + (item.price ? ' - ' + item.price : ''));
  });

  let totalLine = 'Total aproximado: ' + formatPrice(total);
  if (unpriced > 0) {
    totalLine += ' (+ ' + unpriced + ' producto(s) a consultar)';
  }
  lines.push('', totalLine);

  const addressInput = document.getElementById('cart-address');
  const address = addressInput ? addressInput.value.trim() : '';
  lines.push('');
  lines.push(address ? 'Dirección de entrega: ' + address : '(Sin dirección cargada — retiro en el local o a coordinar)');

  return lines.join('\n');
}

document.addEventListener('DOMContentLoaded', function () {
  renderCartPage();

  const waBtn = document.getElementById('cart-whatsapp-btn');
  if (waBtn) {
    waBtn.addEventListener('click', function () {
      const msg = buildWhatsAppMessage();
      if (!msg) return;
      window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
    });
  }

  const clearBtn = document.getElementById('cart-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      saveCart([]);
      renderCartPage();
      const qrResult = document.getElementById('qr-result');
      if (qrResult) qrResult.style.display = 'none';
    });
  }

  const qrBtn = document.getElementById('cart-qr-btn');
  if (qrBtn) {
    qrBtn.addEventListener('click', function () {
      const cart = getCart();
      if (cart.length === 0) return;
      if (typeof QRCode === 'undefined') {
        alert('No se pudo cargar el generador de QR. Revisá tu conexión a internet e intentá de nuevo.');
        return;
      }

      const orderId = 'QG-' + Date.now().toString(36).toUpperCase();
      const addressInput = document.getElementById('cart-address');
      const address = addressInput ? addressInput.value.trim() : '';
      const fecha = new Date().toLocaleString('es-UY');

      let total = 0;
      let unpriced = 0;
      let totalQty = 0;
      cart.forEach(function (item) {
        const price = parsePrice(item.price);
        if (price !== null) {
          total += price * item.qty;
        } else if (item.price) {
          unpriced += item.qty;
        }
        totalQty += item.qty;
      });
      let totalLine = 'Total: ' + formatPrice(total);
      if (unpriced > 0) totalLine += ' (+' + unpriced + ' a consultar)';
      const entregaLine = 'Entrega: ' + (address || 'retiro en el local');

      // Versión completa: un detalle por producto
      const detalle = cart
        .map(function (item) {
          return item.qty + 'x ' + item.name + (item.price ? ' - ' + item.price : '');
        })
        .join('\n');
      const textoCompleto = ['Pedido ' + orderId, fecha, detalle, totalLine, entregaLine].join('\n');

      // Versión resumida por si el pedido tiene demasiados productos para el QR
      const textoResumido = [
        'Pedido ' + orderId,
        fecha,
        totalQty + ' producto(s) — ver detalle por WhatsApp',
        totalLine,
        entregaLine,
      ].join('\n');

      const canvasWrap = document.getElementById('qr-canvas');
      const qrWarning = document.getElementById('qr-warning');

      function generar(texto) {
        canvasWrap.innerHTML = '';
        new QRCode(canvasWrap, {
          text: texto,
          width: 180,
          height: 180,
          colorDark: '#1E2A28',
          colorLight: '#ffffff',
          correctLevel: (QRCode.CorrectLevel && QRCode.CorrectLevel.L) || 1,
        });
      }

      try {
        generar(textoCompleto);
        if (qrWarning) qrWarning.style.display = 'none';
      } catch (err) {
        console.error('QR: falló la versión completa ->', err);
        try {
          generar(textoResumido);
          if (qrWarning) qrWarning.style.display = 'block';
        } catch (err2) {
          console.error('QR: falló también la versión resumida ->', err2);
          if (qrWarning) {
            qrWarning.textContent = 'El pedido es demasiado grande para generar un QR. Usá el botón de WhatsApp para coordinarlo. (Ver detalle del error en la consola.)';
            qrWarning.style.display = 'block';
          }
          document.getElementById('qr-order-id').textContent = orderId;
          document.getElementById('qr-result').style.display = 'flex';
          return;
        }
      }

      document.getElementById('qr-order-id').textContent = orderId;
      document.getElementById('qr-result').style.display = 'flex';
    });
  }
});
