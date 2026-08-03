// =====================================================================
// ===== Ficha de producto: galería de miniaturas + zoom (lightbox) =====
// =====================================================================
document.addEventListener('DOMContentLoaded', function () {
  const mainImg = document.getElementById('gallery-main-img');
  const thumbs = document.querySelectorAll('.gallery-thumbs button');

  thumbs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const src = btn.getAttribute('data-src');
      const alt = btn.getAttribute('data-alt') || '';
      if (!src || !mainImg) return;

      mainImg.src = src;
      mainImg.alt = alt;

      thumbs.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });

  const overlay = document.getElementById('lightbox-overlay');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close');

  if (!mainImg || !overlay || !lightboxImg) return;

  function openLightbox() {
    lightboxImg.src = mainImg.src;
    lightboxImg.alt = mainImg.alt;
    overlay.classList.add('open');
  }

  function closeLightbox() {
    overlay.classList.remove('open');
  }

  mainImg.addEventListener('click', openLightbox);
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeLightbox();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });
});
