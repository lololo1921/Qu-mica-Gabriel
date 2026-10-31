// Pestaña "Productos" del panel: crear, editar, fotos, stock y visibilidad.
(function () {
  const css = `
  #ov{position:fixed;inset:0;background:#0008;z-index:15;display:flex;align-items:flex-start;justify-content:center;padding:12px;overflow:auto}
  .fp{background:#fff;border-radius:14px;padding:20px;max-width:560px;width:100%;margin:auto}
  .fp textarea{font:inherit;padding:12px;border:2px solid var(--borde);border-radius:10px;width:100%;min-height:80px}
  .fp .prev{max-width:140px;max-height:140px;display:block;margin:8px 0;border:1px solid var(--borde);border-radius:8px}
  .chk{display:flex;gap:10px;align-items:center;font-weight:600;margin-top:14px}
  .chk input{width:auto;transform:scale(1.4)}
  .extras{display:flex;gap:10px;flex-wrap:wrap;margin:8px 0}
  .extra{text-align:center;font-size:.8em}
  .extra img{width:80px;height:80px;object-fit:contain;border:1px solid var(--borde);border-radius:8px;display:block;margin-bottom:4px}
  .etq{font-size:.7em;font-weight:700;padding:2px 8px;border-radius:99px;background:#e6e6e6;margin-left:6px}
  .etq.rojo{background:#ffdcd8}
  .fp-botones{display:flex;gap:10px;justify-content:flex-end;margin-top:18px;flex-wrap:wrap}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.append(st);

  const el = (tag, props, ...hijos) => {
    const e = document.createElement(tag);
    Object.assign(e, props || {});
    hijos.forEach(h => e.append(h));
    return e;
  };
  const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  function generarId(key, nombre, variante) {
    const base = [key, slug(nombre), slug(variante)].filter(Boolean).join('-');
    let id = base, n = 2;
    while (productos.some(p => p.id === id)) id = base + '-' + (n++);
    return id;
  }

  async function prepararImagen(file) {
    const bmp = await createImageBitmap(file);
    const esc = Math.min(1, 1000 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * esc);
    c.height = Math.round(bmp.height * esc);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/webp', 0.85));
    if (!blob) throw new Error('No se pudo procesar la imagen');
    return blob;
  }

  async function subir(id, file) {
    const blob = await prepararImagen(file);
    const ext = blob.type === 'image/webp' ? 'webp' : 'png';
    const path = id + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 6) + '.' + ext;
    const { error } = await sb.storage.from('productos').upload(path, blob, { contentType: blob.type });
    if (error) throw error;
    return sb.storage.from('productos').getPublicUrl(path).data.publicUrl;
  }

  // ---------- Lista ----------
  function renderProd() {
    const cont = $('lista-prod'); cont.textContent = '';
    const q = norm($('buscar-prod').value);
    productos
      .filter(p => !q || norm(p.nombre + ' ' + p.variante).includes(q))
      .forEach(p => {
        const info = el('div', { className: 'info' });
        const n = el('strong', { textContent: p.nombre });
        if (p.agotado) n.append(el('span', { className: 'etq rojo', textContent: 'SIN STOCK' }));
        if (p.activo === false) n.append(el('span', { className: 'etq', textContent: 'OCULTO' }));
        info.append(n, el('span', { className: 'sub', textContent: [p.variante, p.categoria].filter(Boolean).join(' · ') }));
        const b = el('button', { className: 'btn', textContent: 'Editar' });
        b.onclick = () => abrirForm(p);
        cont.append(el('div', { className: 'fila' }, info, b));
      });
  }

  // ---------- Formulario ----------
  async function abrirForm(p) {
    const nuevo = !p;
    const ov = el('div', { id: 'ov' });
    const f = el('div', { className: 'fp' });
    ov.append(f);

    const cats = new Map();
    productos.forEach(x => {
      const k = x.linea + '|' + x.categoria_key;
      if (!cats.has(k)) cats.set(k, { linea: x.linea, key: x.categoria_key, nombre: x.categoria });
    });
    const selCat = el('select');
    selCat.append(new Option('Elegí una categoría…', ''));
    cats.forEach((c, k) => selCat.append(new Option((c.linea === 'la' ? 'Automotriz · ' : 'Hogar · ') + c.nombre, k)));
    if (p) selCat.value = p.linea + '|' + p.categoria_key;

    const inNombre = el('input', { value: p ? p.nombre : '' });
    const inVar = el('input', { value: p ? p.variante || '' : '', placeholder: 'Ej: 5LTS, 500ML' });
    const inPrecio = el('input', { inputMode: 'decimal', placeholder: 'Ej: 450' });
    const txDesc = el('textarea', { value: p ? p.descripcion || '' : '' });
    const txModo = el('textarea', { value: p ? p.modo_uso || '' : '' });
    const inFoto = el('input', { type: 'file', accept: 'image/*' });
    const prev = el('img', { className: 'prev', alt: '' });
    prev.hidden = true;
    if (p && p.imagen) { prev.src = p.imagen; prev.hidden = false; }
    inFoto.onchange = () => {
      if (inFoto.files[0]) { prev.src = URL.createObjectURL(inFoto.files[0]); prev.hidden = false; }
    };
    const chkStock = el('input', { type: 'checkbox', checked: !!(p && p.agotado) });
    const chkVisible = el('input', { type: 'checkbox', checked: p ? p.activo !== false : true });
    const extras = el('div', { className: 'extras' });
    const inExtra = el('input', { type: 'file', accept: 'image/*', multiple: true });
    const err = el('p', { className: 'error' });

    let ordenBase = 0;
    if (p) {
      const { data } = await sb.from('producto_imagenes').select('id,url').eq('producto_id', p.id).order('orden');
      (data || []).forEach(x => {
        const d = el('div', { className: 'extra' });
        const q = el('button', { className: 'btn', type: 'button', textContent: 'Quitar' });
        q.onclick = async () => {
          if (!confirm('¿Quitar esta foto?')) return;
          const { error } = await sb.from('producto_imagenes').delete().eq('id', x.id);
          if (error) { aviso('No se pudo quitar: ' + error.message, true); return; }
          d.remove();
        };
        d.append(el('img', { src: x.url, alt: '' }), q);
        extras.append(d);
      });
      ordenBase = (data || []).length;
    }

    const campo = (t, nodo) => [el('label', { textContent: t }), nodo];
    const chk = (t, input) => el('label', { className: 'chk' }, input, document.createTextNode(t));

    f.append(
      el('h2', { textContent: nuevo ? 'Nuevo producto' : 'Editar producto' }),
      ...campo('Categoría', selCat),
      ...campo('Nombre', inNombre),
      ...campo('Presentación (opcional)', inVar),
      ...(nuevo ? campo('Precio ($)', inPrecio) : [el('p', { className: 'ayuda', textContent: 'El precio se cambia en la pestaña "Precios".' })]),
      ...campo('Descripción (opcional)', txDesc),
      ...campo('Modo de uso (opcional)', txModo),
      ...campo(nuevo ? 'Foto principal' : 'Cambiar foto principal (opcional)', inFoto),
      prev,
      ...campo('Fotos extra (opcional, podés elegir varias)', extras),
      inExtra,
      chk('Sin stock', chkStock),
      chk('Visible en la web', chkVisible),
      err
    );

    const cancelar = el('button', { className: 'btn', textContent: 'Cancelar' });
    cancelar.onclick = () => ov.remove();
    const guardar = el('button', { className: 'btn principal', textContent: 'Guardar' });
    f.append(el('div', { className: 'fp-botones' }, cancelar, guardar));
    document.body.append(ov);

    guardar.onclick = async () => {
      err.textContent = '';
      const nombre = inNombre.value.trim();
      const c = cats.get(selCat.value);
      if (!c) { err.textContent = 'Elegí una categoría.'; return; }
      if (!nombre) { err.textContent = 'Escribí el nombre del producto.'; return; }
      let precio = null;
      if (nuevo) {
        precio = parsear(inPrecio.value);
        if (precio === null) { err.textContent = 'Escribí un precio válido, por ejemplo 450.'; return; }
        if (!inFoto.files[0]) { err.textContent = 'Elegí una foto del producto.'; return; }
      }
      guardar.disabled = true; guardar.textContent = 'Guardando…';
      try {
        const id = nuevo ? generarId(c.key, nombre, inVar.value) : p.id;
        const datos = {
          nombre, variante: inVar.value.trim(),
          categoria_key: c.key, categoria: c.nombre, linea: c.linea,
          descripcion: txDesc.value.trim(), modo_uso: txModo.value.trim(),
          agotado: chkStock.checked, activo: chkVisible.checked
        };
        if (inFoto.files[0]) datos.imagen = await subir(id, inFoto.files[0]);
        if (nuevo) {
          const { error } = await sb.from('productos').insert({ id, precio, ...datos });
          if (error) throw error;
        } else {
          const { error } = await sb.from('productos').update(datos).eq('id', id);
          if (error) throw error;
        }
        const nExtra = inExtra.files.length;
        for (let i = 0; i < nExtra; i++) {
          const url = await subir(id, inExtra.files[i]);
          const { error } = await sb.from('producto_imagenes').insert({ producto_id: id, url, orden: ordenBase + i });
          if (error) throw error;
        }
      } catch (e) {
        err.textContent = 'No se pudo guardar: ' + (e.message || e);
        guardar.disabled = false; guardar.textContent = 'Guardar';
        return;
      }
      ov.remove();
      await cargarProductos();
      renderProd();
      aviso('Producto guardado.');
    };
  }

  $('buscar-prod').addEventListener('input', renderProd);
  $('nuevo-prod').onclick = () => abrirForm(null);
  document.querySelector('[data-tab="productos"]').addEventListener('click', renderProd);
})();
