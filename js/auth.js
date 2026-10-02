
const nextUrl = new URLSearchParams(window.location.search).get('next') || 'cliente.html';

const tabs = document.querySelectorAll('.tab');
const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');
const recoverForms = [
  document.getElementById('form-recover-1'),
  document.getElementById('form-recover-2'),
  document.getElementById('form-recover-3')
];

function showError(msg) {
  document.getElementById('ok-box').style.display = 'none';
  const box = document.getElementById('error-box');
  box.textContent = msg; box.style.display = 'block';
}
function showOk(msg) {
  document.getElementById('error-box').style.display = 'none';
  const box = document.getElementById('ok-box');
  box.textContent = msg; box.style.display = 'block';
}
function clearMsgs() {
  document.getElementById('error-box').style.display = 'none';
  document.getElementById('ok-box').style.display = 'none';
}

function activarTab(tab) {
  clearMsgs();
  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  formLogin.classList.toggle('hidden', tab !== 'ingresar');
  formRegistro.classList.toggle('hidden', tab !== 'registrarse');
  recoverForms.forEach((f, i) => f.classList.toggle('hidden', !(tab === 'recuperar' && i === 0)));
}
tabs.forEach(t => t.addEventListener('click', () => activarTab(t.dataset.tab)));

async function postJSON(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Ocurrió un error.');
  return data;
}

// ---- Login ----
formLogin.addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const data = await postJSON('/api/login', {
      email: document.getElementById('login-email').value,
      password: document.getElementById('login-password').value
    });
    window.location.href = data.role === 'admin' ? 'admin.html' : nextUrl;
  } catch (err) { showError(err.message); }
});

// ---- Registro ----
formRegistro.addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await postJSON('/api/register', {
      name: document.getElementById('reg-name').value,
      email: document.getElementById('reg-email').value,
      phone: document.getElementById('reg-phone').value,
      password: document.getElementById('reg-password').value,
      securityQuestion: document.getElementById('reg-question').value,
      securityAnswer: document.getElementById('reg-answer').value
    });
    window.location.href = nextUrl;
  } catch (err) { showError(err.message); }
});

// ---- Recuperar: paso 1 -> pregunta ----
let recoverEmail = '';
recoverForms[0].addEventListener('submit', async e => {
  e.preventDefault();
  clearMsgs();
  recoverEmail = document.getElementById('rec-email').value;
  try {
    const data = await postJSON('/api/recover/question', { email: recoverEmail });
    if (!data.question) { showError('No encontramos una cuenta con ese correo.'); return; }
    document.getElementById('rec-question-label').textContent = data.question;
    recoverForms[0].classList.add('hidden');
    recoverForms[1].classList.remove('hidden');
  } catch (err) { showError(err.message); }
});

// ---- Recuperar: paso 2 -> validar respuesta ----
let recoverToken = '';
recoverForms[1].addEventListener('submit', async e => {
  e.preventDefault();
  clearMsgs();
  try {
    const data = await postJSON('/api/recover/verify', { email: recoverEmail, answer: document.getElementById('rec-answer').value });
    recoverToken = data.token;
    recoverForms[1].classList.add('hidden');
    recoverForms[2].classList.remove('hidden');
  } catch (err) { showError(err.message); }
});

// ---- Recuperar: paso 3 -> nueva contraseña ----
recoverForms[2].addEventListener('submit', async e => {
  e.preventDefault();
  clearMsgs();
  try {
    await postJSON('/api/recover/reset', { email: recoverEmail, token: recoverToken, password: document.getElementById('rec-new-password').value });
    showOk('Contraseña actualizada. Ya puedes iniciar sesión.');
    setTimeout(() => activarTab('ingresar'), 1500);
  } catch (err) { showError(err.message); }
});

activarTab('ingresar');
