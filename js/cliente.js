
async function checkSession() {
  const res = await fetch('/api/me');
  const data = await res.json();
  if (!data.authenticated) { window.location.href = 'login.html?next=cliente.html'; return; }
  if (data.role === 'admin') { window.location.href = 'admin.html'; return; }
  document.getElementById('bienvenida').textContent = 'Bienvenido, ' + data.name;
}

async function cargarCotizaciones() {
  const res = await fetch('/api/quotes/mine');
  const rows = await res.json();
  document.getElementById('tabla').innerHTML = rows.length
    ? rows.map(r => `<tr><td>${r.folio}</td><td>${r.resistance_type}</td><td>${r.specs}</td><td>${r.status}</td><td>${r.price ? '$' + r.price : 'Por definir'}</td></tr>`).join('')
    : '<tr><td colspan="5">Aún no tienes cotizaciones.</td></tr>';
}

document.getElementById('form-cotizar').addEventListener('submit', async e => {
  e.preventDefault();
  const errorBox = document.getElementById('error-box');
  const okBox = document.getElementById('ok-box');
  errorBox.style.display = 'none'; okBox.style.display = 'none';
  try {
    const res = await fetch('/api/quotes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resistanceType: document.getElementById('tipo-resistencia').value,
        specs: document.getElementById('specs').value,
        paymentMethod: document.getElementById('metodo-pago').value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    okBox.textContent = 'Enviado. Folio: ' + data.folio;
    okBox.style.display = 'block';
    document.getElementById('form-cotizar').reset();
    cargarCotizaciones();
  } catch (err) { errorBox.textContent = err.message; errorBox.style.display = 'block'; }
});

document.getElementById('btn-logout').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = 'index.html';
});

const preTipo = new URLSearchParams(window.location.search).get('tipo');
if (preTipo) {
  const select = document.getElementById('tipo-resistencia');
  [...select.options].forEach(o => { if (o.value === preTipo) select.value = preTipo; });
}

checkSession();
cargarCotizaciones();
