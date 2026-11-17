/*
 * project.js — project pages: full-bleed images down the page, plus the
 * "i" button that slides out a sidebar with the project text.
 */
(function () {
  const panel = document.querySelector('.pc-panel');
  const infoBtn = document.querySelector('.pc-info-btn');
  const closeBtn = document.querySelector('.pc-close');

  /* ---------- Info sidebar ---------- */
  function openPanel() {
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    infoBtn.setAttribute('aria-expanded', 'true');
    setTimeout(() => closeBtn && closeBtn.focus(), 50);
  }

  function closePanel() {
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    infoBtn.setAttribute('aria-expanded', 'false');
    infoBtn.focus();
  }

  if (panel && infoBtn) {
    infoBtn.addEventListener('click', () => (panel.classList.contains('is-open') ? closePanel() : openPanel()));
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    // Escape or a click anywhere outside the open sidebar closes it
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) closePanel();
    });
    document.addEventListener('pointerdown', (e) => {
      if (panel.classList.contains('is-open') && !panel.contains(e.target) && !infoBtn.contains(e.target)) closePanel();
    });
  }

  /* ---------- Cursor trail in the three site colours ---------- */
  const colors = ['#0055FF', '#FF3D1F', '#DFFF00'];
  let lastDot = 0;
  document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastDot < 25) return;
    lastDot = now;
    const dot = document.createElement('div');
    dot.style.cssText = 'position:fixed;left:' + e.clientX + 'px;top:' + e.clientY + 'px;width:20px;height:20px;border-radius:50%;background-color:' + colors[Math.floor(Math.random() * colors.length)] + ';pointer-events:none;z-index:9998;opacity:0.5;transform:translate(-50%,-50%);transition:opacity 0.15s ease-out;';
    document.body.appendChild(dot);
    setTimeout(() => { dot.style.opacity = '0'; setTimeout(() => dot.remove(), 150); }, 50);
  });
})();
