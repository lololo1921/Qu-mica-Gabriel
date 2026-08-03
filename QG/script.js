// ...existing code...
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

// =====================================================================
// ===== Carrito (localStorage, funciona con o sin cuenta)           =====
// =====================================================================
// ESQUEMA ÚNICO usado en todo el sitio:
// { id, name, category, price (texto para mostrar), priceNumber (numero),
//   imageSrc, imageAlt, quantity }
const CART_KEY = 'qg_cart';
const WHATSAPP_NUMBER = '59899661360';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadges();
}

function parsePriceNumber(raw) {
  if (raw === null || raw === undefined) return 0;
  // toma el primer monto tipo $1.234 o $1234 que aparezca en el texto
  const match = String(raw).match(/\$\s*([\d.,]+)/);
  const cleaned = match ? match[1].replace(/\./g, '').replace(',', '.') : String(raw).replace(/[^\d.,]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function cleanText(s) {
  if (!s) return '';
  return String(s).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(function (p) {
    return p.id === item.id;
  });

  if (existing) {
    existing.quantity = (Number(existing.quantity) || 0) + 1;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      category: item.category || '',
      price: item.price || '',
      priceNumber: item.priceNumber !== undefined ? item.priceNumber : parsePriceNumber(item.price),
      imageSrc: item.imageSrc || item.img || '',
      imageAlt: item.imageAlt || item.name || '',
      quantity: 1
    });
  }

  saveCart(cart);
}

// ===== Listener global: agrega cualquier .btn-add del catálogo (index, la, lh) =====
// Antes esto no existía en script.js, por eso los botones de la.html / lh.html
// no guardaban nada: no había nada escuchando el click.
document.body.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-add');
  if (!btn) return;

  const card = btn.closest('.product-card');
  if (!card) return;

  const id = card.dataset.id || ('prod_' + Date.now());
  const name = cleanText(card.dataset.name || card.querySelector('h3')?.innerText || 'Producto');
  const priceText = card.dataset.price || card.querySelector('.p-price')?.textContent || '0';
  const priceNumber = parsePriceNumber(priceText);
  const category = card.dataset.category || '';
  const imgEl = card.querySelector('img');
  const imageSrc = imgEl?.getAttribute('src') || '';
  const imageAlt = imgEl?.alt || name;

  addToCart({
    id: id,
    name: name,
    price: String(priceText).trim(),
    priceNumber: priceNumber,
    imageSrc: imageSrc,
    imageAlt: imageAlt,
    category: category
  });

  const original = btn.textContent;
  btn.textContent = 'Agregado';
  btn.disabled = true;
  setTimeout(function () {
    btn.textContent = original || 'Agregar al pedido';
    btn.disabled = false;
  }, 900);
});

function updateCartBadges() {
  const total = getCart().reduce(function (sum, p) {
    return sum + (Number(p.quantity) || 0);
  }, 0);

  document.querySelectorAll('[data-cart-badge]').forEach(function (el) {
    el.textContent = total;

    if (el.classList.contains('cart-badge')) {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    }
  });
}

// =====================================================================
// ===== Navegación a la ficha de producto individual                =====
// =====================================================================
// Cada producto vive en /productos-paginas/{data-id}.html. Esto agrega
// un botón "Ver más" a cada .product-card del catálogo (index, la, lh)
// y hace que la card completa navegue a la ficha (salvo que el click
// sea sobre "Agregar al pedido", que sigue agregando al carrito sin navegar).
document.addEventListener('DOMContentLoaded', function () {
  const grids = document.querySelectorAll('#catalog-container .product-card[data-id], .product-grid .product-card[data-id]');

  grids.forEach(function (card) {
    if (card.querySelector('.btn-view-more')) return;

    const addBtn = card.querySelector('.btn-add');
    if (!addBtn) return;

    const viewBtn = document.createElement('a');
    viewBtn.className = 'btn-view-more';
    viewBtn.href = '/productos-paginas/' + card.dataset.id + '.html';
    viewBtn.textContent = 'Ver más';

    addBtn.insertAdjacentElement('afterend', viewBtn);
  });
});

document.body.addEventListener('click', function (e) {
  if (e.target.closest('.btn-add') || e.target.closest('.btn-view-more')) return;

  const card = e.target.closest('.product-card[data-id]');
  if (!card) return;
  if (!card.closest('#catalog-container') && !card.closest('.product-grid')) return;

  window.location.href = '/productos-paginas/' + card.dataset.id + '.html';
});

document.addEventListener('DOMContentLoaded', updateCartBadges);

function formatPrice(n) {
  return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function buildWhatsAppMessage() {
  const cart = getCart();
  if (cart.length === 0) return '';

  let total = 0;
  let unpriced = 0;
  const lines = ['Hola, quiero coordinar este pedido:'];

  cart.forEach(function (item) {
    const qty = Number(item.quantity) || 0;
    const priceNumber = Number(item.priceNumber) || 0;

    if (priceNumber > 0) {
      total += priceNumber * qty;
    } else if (item.price) {
      unpriced += qty;
    }

    lines.push('- ' + item.name + ' (' + qty + ')' + (item.price ? ' - ' + item.price : ''));
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

function buildQrPayloads(cart, orderId, address, fecha) {
  const total = cart.reduce(function (sum, item) {
    const qty = Number(item.quantity) || 0;
    const priceNumber = Number(item.priceNumber) || 0;
    return sum + priceNumber * qty;
  }, 0);

  const payload = [
    'Pedido ' + orderId,
    fecha,
    'Total: ' + formatPrice(total),
    address ? 'Entrega: ' + address : 'Retiro en local'
  ].join('\n');

  return {
    completo: payload,
    resumido: payload
  };
}

async function confirmOrderToWhatsApp() {
  const cart = getCart();
  if (!cart.length) {
    alert('El carrito está vacío.');
    return;
  }

  const total = cart.reduce(function (sum, item) {
    const qty = Number(item.quantity) || 0;
    const priceNumber = Number(item.priceNumber) || 0;
    return sum + priceNumber * qty;
  }, 0);

  let user;
  try {
    const { data, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Auth getUser error:', userError);
    }
    user = data?.user;
  } catch (e) {
    console.error('Auth getUser threw:', e);
    user = null;
  }

  if (user) {
    const orderId = 'QG-' + Date.now().toString(36).toUpperCase();
    const payload = { user_id: user.id, items: cart, total, order_id: orderId, status: 'pendiente' };
    try {
      const { data: insertData, error: insertError } = await supabase.from('purchases').insert(payload);
      if (insertError) {
        console.error('Supabase insert error:', insertError);
        alert('No se pudo guardar el pedido en el historial: ' + insertError.message);
      } else {
        console.log('Pedido guardado en historial:', insertData);
      }
    } catch (e) {
      console.error('Supabase insert threw:', e);
      alert('No se pudo guardar el pedido en el historial (error inesperado). El envío por WhatsApp continúa.');
    }
  } else {
    alert('No estás logueado. El pedido no quedará registrado en el historial de compras.');
  }

  const msg = buildWhatsAppMessage();
  if (!msg) {
    alert('No hay nada para enviar por WhatsApp.');
    return;
  }

  window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
}

function renderCartPage() {
  const list = document.getElementById('cart-list');
  if (!list) return;

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
    const qty = Number(item.quantity) || 0;
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML =
      '<img src="' + (item.imageSrc || '/placeholder.png') + '" alt="' + (item.imageAlt || item.name || '') + '">' +
      '<div class="cart-item-info">' +
        '<span class="p-cat">' + (item.category || '') + '</span>' +
        '<h3>' + item.name + '</h3>' +
        (item.price ? '<span class="p-price" style="margin:0;">' + item.price + '</span>' : '') +
      '</div>' +
      '<div class="qty-control">' +
        '<button type="button" class="qty-minus">−</button>' +
        '<span>' + qty + '</span>' +
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
  const item = cart.find(function (p) {
    return p.id === id;
  });

  if (!item) return;

  item.quantity = (Number(item.quantity) || 0) + delta;

  if (item.quantity <= 0) {
    return removeFromCart(id);
  }

  saveCart(cart);
  renderCartPage();
}

function removeFromCart(id) {
  const cart = getCart().filter(function (p) {
    return p.id !== id;
  });

  saveCart(cart);
  renderCartPage();
}

function updateCartTotalText() {
  const countEl = document.getElementById('cart-total-count');
  const amountEl = document.getElementById('cart-total-amount');

  if (!countEl) return;

  const cart = getCart();
  const totalQty = cart.reduce(function (sum, p) {
    return sum + (Number(p.quantity) || 0);
  }, 0);

  countEl.textContent = totalQty;

  if (!amountEl) return;

  let totalAmount = 0;
  let unpriced = 0;

  cart.forEach(function (item) {
    const qty = Number(item.quantity) || 0;
    const priceNumber = Number(item.priceNumber) || 0;
    if (priceNumber > 0) {
      totalAmount += priceNumber * qty;
    } else {
      unpriced += qty;
    }
  });

  let html = 'Total a pagar: ' + formatPrice(totalAmount);
  if (unpriced > 0) {
    html += '<span class="unpriced-note">+ ' + unpriced + ' producto(s) a consultar precio</span>';
  }

  amountEl.innerHTML = html;
}

function createAccountMenu(button) {
  if (button.dataset.accountMenuAttached) return;
  button.dataset.accountMenuAttached = 'true';

  button.href = '#';
  button.setAttribute('aria-haspopup', 'true');
  button.setAttribute('aria-expanded', 'false');

  const menu = document.createElement('div');
  menu.className = 'account-menu';
  menu.innerHTML = `
    <a class="account-menu-item" href="/páginas/historial.html">Historial de compras</a>
    <a class="account-menu-item" href="/páginas/datos.html">Mis datos</a>
    <button type="button" class="account-menu-item logout-btn">Cerrar sesión</button>
  `;
  button.insertAdjacentElement('afterend', menu);

  button.addEventListener('click', function (event) {
    event.preventDefault();
    const open = menu.classList.toggle('open');
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  menu.querySelector('.logout-btn').addEventListener('click', async function () {
    await supabase.auth.signOut();
    window.location.href = '/index.html';
  });

  document.addEventListener('click', function (event) {
    if (!button.contains(event.target) && !menu.contains(event.target)) {
      menu.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      menu.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
    }
  });
}

async function updateAccountButton() {
  const accountButtons = document.querySelectorAll('.head-actions .btn-account, .mobile-nav .btn-account');
  if (!accountButtons.length || !window.supabase) return;

  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;
  if (error || !user) return;

  const name = user.user_metadata?.nombre || user.user_metadata?.name || user.email;

  accountButtons.forEach(function (btn) {
    btn.textContent = name;
    btn.href = '#';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    createAccountMenu(btn);
  });
}

function renderPurchaseHistory() {
  const container = document.getElementById('history-list');
  if (!container) return;

  container.innerHTML = '<p class="empty-state">Cargando historial...</p>';

  supabase.auth.getUser().then(function (result) {
    const user = result.data?.user;
    if (!user) {
      container.innerHTML = '<p class="empty-state">Inicia sesión para ver tu historial.</p>';
      return;
    }

    supabase.from('purchases')
      .select('id,created_at,items,total,status,order_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(function (response) {
        console.log('Supabase purchases response:', response);
        if (response.error) {
          console.error('Supabase select error:', response.error);
          container.innerHTML = '<p class="empty-state">No se pudo cargar el historial. Revisá la consola.</p>';
          return;
        }

        const purchases = response.data || [];
        if (!purchases.length) {
          container.innerHTML = '<p class="empty-state">No hay compras registradas.</p>';
          return;
        }

        container.innerHTML = purchases.map(function (purchase) {
          const date = new Date(purchase.created_at).toLocaleString('es-UY', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          const itemsHtml = (purchase.items || []).map(function (item) {
            return '<li>' +
              '<strong>' + (item.quantity || 0) + 'x</strong> ' +
              (item.name || 'Producto') +
              (item.price ? ' — ' + item.price : '') +
              '</li>';
          }).join('');

          return (
            '<article class="history-item">' +
              '<div class="history-meta">' +
                '<span class="history-date">' + date + '</span>' +
                '<span class="history-status">' + (purchase.status || 'pendiente') + '</span>' +
              '</div>' +
              '<div class="history-card">' +
                '<div class="history-total">Total: ' + formatPrice(Number(purchase.total) || 0) + '</div>' +
                '<div class="history-order">ID: ' + (purchase.order_id || '-') + '</div>' +
                '<ul class="history-products">' + itemsHtml + '</ul>' +
              '</div>' +
            '</article>'
          );
        }).join('');
      })
      .catch(function (err) {
        console.error('Supabase select threw:', err);
        container.innerHTML = '<p class="empty-state">Error al cargar historial.</p>';
      });
  }).catch(function () {
    container.innerHTML = '<p class="empty-state">No se pudo validar tu sesión.</p>';
  });
}

function renderUserProfile() {
  const container = document.getElementById('profile-data');
  if (!container) return;

  container.innerHTML = '<p class="empty-state">Cargando datos...</p>';

  supabase.auth.getUser().then(function (result) {
    const user = result.data?.user;
    if (!user) {
      container.innerHTML = '<p class="empty-state">Inicia sesión para ver tus datos.</p>';
      return;
    }

    const meta = user.user_metadata || {};
    container.innerHTML = `
      <div class="profile-grid">
        <div class="profile-row">
          <span>Nombre</span>
          <strong>${meta.nombre || ''}</strong>
        </div>
        <div class="profile-row">
          <span>Apellido</span>
          <strong>${meta.apellido || ''}</strong>
        </div>
        <div class="profile-row">
          <span>Email</span>
          <strong>${user.email || ''}</strong>
        </div>
        <div class="profile-row">
          <span>Teléfono</span>
          <strong>${meta.telefono || 'No cargado'}</strong>
        </div>
        <div class="profile-row">
          <span>Registrado</span>
          <strong>${new Date(user.created_at).toLocaleDateString('es-UY', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
        </div>
      </div>
      <button type="button" class="btn-secondary logout-btn-page">Cerrar sesión</button>
    `;

    const logoutBtn = container.querySelector('.logout-btn-page');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async function () {
        await supabase.auth.signOut();
        window.location.href = '/index.html';
      });
    }
  }).catch(function () {
    container.innerHTML = '<p class="empty-state">No se pudo validar tu sesión.</p>';
  });
}

document.addEventListener('DOMContentLoaded', function () {
  renderCartPage();

  const waBtn = document.getElementById('cart-whatsapp-btn');
  const clearBtn = document.getElementById('cart-clear-btn');
  const qrBtn = document.getElementById('cart-qr-btn');

  if (waBtn) {
    waBtn.addEventListener('click', confirmOrderToWhatsApp);
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      saveCart([]);
      renderCartPage();

      const qrResult = document.getElementById('qr-result');
      if (qrResult) qrResult.style.display = 'none';
    });
  }

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
      const payloads = buildQrPayloads(cart, orderId, address, fecha);

      const canvasWrap = document.getElementById('qr-canvas');
      const qrWarning = document.getElementById('qr-warning');
      const qrResult = document.getElementById('qr-result');

      function generar(texto) {
        canvasWrap.innerHTML = '';
        new QRCode(canvasWrap, {
          text: texto,
          width: 180,
          height: 180,
          colorDark: '#1E2A28',
          colorLight: '#ffffff',
          correctLevel: (QRCode.CorrectLevel && QRCode.CorrectLevel.L) || 1
        });
      }

      try {
        generar(payloads.completo);
        if (qrWarning) qrWarning.style.display = 'none';
      } catch (err) {
        console.error('QR: falló la versión completa ->', err);

        try {
          generar(payloads.resumido);
          if (qrWarning) {
            qrWarning.textContent = 'Se generó un QR resumido porque el pedido es grande.';
            qrWarning.style.display = 'block';
          }
        } catch (err2) {
          console.error('QR: falló también la versión resumida ->', err2);

          if (qrWarning) {
            qrWarning.textContent = 'El pedido es demasiado grande para generar un QR. Usá el botón de WhatsApp para coordinarlo.';
            qrWarning.style.display = 'block';
          }
        }
      }

      if (qrResult) qrResult.style.display = 'flex';
      const orderIdEl = document.getElementById('qr-order-id');
      if (orderIdEl) orderIdEl.textContent = orderId;
    });
  }

  updateAccountButton();
  renderPurchaseHistory();
  renderUserProfile();
});
