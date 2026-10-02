
const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const store = require('./store');

store.ensureAdmin();

const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // sirve index.html, css/, imagenes/, js/

app.use(session({
  secret: 'renor-llave-secreta-cambia-esto',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 2 } // 2 horas
}));


app.post('/api/register', (req, res) => {
  const { name, email, phone, password, securityQuestion, securityAnswer } = req.body;
  if (!name || !email || !phone || !password || !securityQuestion || !securityAnswer) {
    return res.status(400).json({ error: 'Faltan datos.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
  }
  if (store.findUserByEmail(email)) {
    return res.status(409).json({ error: 'Ese correo ya está registrado.' });
  }
  const user = store.addUser({
    name, email, phone,
    password_hash: bcrypt.hashSync(password, 10),
    security_question: securityQuestion,
    security_answer_hash: bcrypt.hashSync(securityAnswer.trim().toLowerCase(), 10),
    role: 'cliente'
  });
  req.session.userId = user.id;
  req.session.role = user.role;
  req.session.name = user.name;
  res.json({ ok: true, role: user.role });
});


app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = store.findUserByEmail(email || '');
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  }
  req.session.userId = user.id;
  req.session.role = user.role;
  req.session.name = user.name;
  res.json({ ok: true, role: user.role });
});


app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});


app.post('/api/recover/question', (req, res) => {
  const user = store.findUserByEmail(req.body.email || '');
  res.json({ question: user ? user.security_question : null });
});


const crypto = require('crypto');
app.post('/api/recover/verify', (req, res) => {
  const { email, answer } = req.body;
  const user = store.findUserByEmail(email || '');
  if (!user || !bcrypt.compareSync((answer || '').trim().toLowerCase(), user.security_answer_hash)) {
    return res.status(400).json({ error: 'Respuesta incorrecta.' });
  }
  const token = crypto.randomBytes(20).toString('hex');
  store.updateUser(user.id, { reset_token: token, reset_token_expires: new Date(Date.now() + 15 * 60 * 1000).toISOString() });
  res.json({ ok: true, token });
});


app.post('/api/recover/reset', (req, res) => {
  const { email, token, password } = req.body;
  const user = store.findUserByEmail(email || '');
  if (!user || user.reset_token !== token || !user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
    return res.status(400).json({ error: 'Token inválido o vencido. Vuelve a iniciar el proceso.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
  }
  store.updateUser(user.id, { password_hash: bcrypt.hashSync(password, 10), reset_token: null, reset_token_expires: null });
  res.json({ ok: true });
});


app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.json({ authenticated: false });
  res.json({ authenticated: true, name: req.session.name, role: req.session.role });
});

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Debes iniciar sesión.' });
  next();
}
function requireAdmin(req, res, next) {
  if (req.session.role !== 'admin') return res.status(403).json({ error: 'Solo el administrador puede ver esto.' });
  next();
}


app.post('/api/quotes', requireAuth, (req, res) => {
  const { resistanceType, specs, paymentMethod } = req.body;
  if (!resistanceType || !specs || !paymentMethod) {
    return res.status(400).json({ error: 'Faltan datos de la cotización.' });
  }
  const folio = 'RNR-' + Math.floor(1000 + Math.random() * 9000);
  const quote = store.addQuote({ folio, user_id: req.session.userId, resistance_type: resistanceType, specs, payment_method: paymentMethod });
  res.json({ ok: true, folio: quote.folio });
});


app.get('/api/quotes/mine', requireAuth, (req, res) => {
  res.json(store.getQuotesByUser(req.session.userId));
});


app.get('/api/admin/quotes', requireAuth, requireAdmin, (req, res) => {
  res.json(store.getQuotesWithClientInfo());
});


app.patch('/api/admin/quotes/:id', requireAuth, requireAdmin, (req, res) => {
  const updated = store.updateQuote(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'No encontrada.' });
  res.json({ ok: true });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
