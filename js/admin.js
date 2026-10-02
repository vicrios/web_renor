
const ESTATUSES = ['Pendiente', 'En revisión', 'Cotizado', 'En producción', 'Completado', 'Cancelado'];

async function checkAdmin() {
  const res = await fetch('/api/me');
  const data = await res.json();
  if (!data.authenticated || data.role !== 'admin') window.location.href = 'login.html';
}

async function cargar() {
  const res = await fetch('/api/admin/quotes');
  const rows = await res.json();
  document.getElementById('tabla').innerHTML = rows.length ? rows.map(r => `
    <tr>
      <td>${r.folio}</td>
      <td>${r.resistance_type}</td>
      <td style="max-width:200px;">${r.specs}</td>
      <td>${r.client_name}</td>
      <td>${r.client_email}<br>${r.client_phone}</td>
      <td><input type="number" data-precio="${r.id}" value="${r.price ?? ''}" style="width:80px;background:#0d0d0d;color:#fff;border:1px solid #3a1414;padding:.3rem;"></td>
      <td>
        <select data-estatus="${r.id}" style="background:#0d0d0d;color:#fff;border:1px solid #3a1414;padding:.3rem;">
          ${ESTATUSES.map(s => `<option ${s === r.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
      <td><button class="btn-cotizar" style="width:auto;padding:.4rem .8rem;" data-guardar="${r.id}">Guardar</button></td>
    </tr>
  `).join('') : '<tr><td colspan="8">Sin solicitudes aún.</td></tr>';

  document.querySelectorAll('[data-guardar]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.guardar;
      const price = document.querySelector(`[data-precio="${id}"]`).value;
      const status = document.querySelector(`[data-estatus="${id}"]`).value;
      await fetch(`/api/admin/quotes/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: price ? Number(price) : null, status })
      });
      cargar();
    });
  });
}

document.getElementById('btn-logout').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = 'index.html';
});

checkAdmin();
cargar();