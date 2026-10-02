

const GALERIA = ['imagenes/proyecto1.jpg', 'imagenes/proyecto2.jpg', 'imagenes/proyecto3.jpg' , 'imagenes/proyecto4.jpg' , 'imagenes/proyecto5.jpg' ];

// ---------- Botones "Cotizar" del catálogo ----------
document.querySelectorAll('[data-tipo]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const res = await fetch('/api/me');
    const data = await res.json();
    const tipo = encodeURIComponent(btn.dataset.tipo);
    window.location.href = data.authenticated
      ? `cliente.html?tipo=${tipo}`
      : `login.html?next=cliente.html%3Ftipo%3D${tipo}`;
  });
});

// ---------- Galería deslizable ----------
const track = document.getElementById('slider-track');
const dots = document.getElementById('slider-dots');
if (track) {
  track.innerHTML = GALERIA.map(src => `
    <div class="slide"><img src="${src}" alt="Proyecto realizado" onerror="this.parentElement.textContent='Imagen de proyecto'"></div>
  `).join('');
  dots.innerHTML = GALERIA.map((_, i) => `<div class="dot ${i === 0 ? 'active' : ''}" data-i="${i}"></div>`).join('');

  let current = 0;
  function goTo(i) {
    current = (i + GALERIA.length) % GALERIA.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.querySelectorAll('.dot').forEach((d, idx) => d.classList.toggle('active', idx === current));
  }
  document.getElementById('slider-prev').addEventListener('click', () => goTo(current - 1));
  document.getElementById('slider-next').addEventListener('click', () => goTo(current + 1));
  dots.querySelectorAll('.dot').forEach(d => d.addEventListener('click', () => goTo(Number(d.dataset.i))));
  setInterval(() => goTo(current + 1), 6000);
}

// ---------- Botón "Mi Cuenta" según sesión ----------
fetch('/api/me').then(r => r.json()).then(data => {
  const btn = document.getElementById('cuenta-btn');
  if (!btn) return;
  if (data.authenticated) {
    btn.textContent = data.role === 'admin' ? 'Panel Admin' : 'Mi Cuenta';
    btn.href = data.role === 'admin' ? 'admin.html' : 'cliente.html';
  }
});
