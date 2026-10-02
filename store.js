
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const USERS_FILE = path.join(__dirname, 'usuarios.json');
const QUOTES_FILE = path.join(__dirname, 'pedidos.json');

[USERS_FILE, QUOTES_FILE].forEach(f => { if (!fs.existsSync(f)) fs.writeFileSync(f, '[]', 'utf8'); });

function readJSON(file) {
  const raw = fs.readFileSync(file, 'utf8').trim();
  return raw ? JSON.parse(raw) : [];
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}
function nextId(list) {
  return list.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;
}


function getUsers() { return readJSON(USERS_FILE); }
function findUserByEmail(email) {
  return getUsers().find(u => u.email.toLowerCase() === String(email).toLowerCase()) || null;
}
function addUser(user) {
  const users = getUsers();
  const newUser = { id: nextId(users), role: 'cliente', created_at: new Date().toISOString(), ...user };
  users.push(newUser);
  writeJSON(USERS_FILE, users);
  return newUser;
}
function updateUser(id, patch) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === Number(id));
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...patch };
  writeJSON(USERS_FILE, users);
  return users[idx];
}


function getQuotes() { return readJSON(QUOTES_FILE); }
function addQuote(quote) {
  const quotes = getQuotes();
  const now = new Date().toISOString();
  const newQuote = { id: nextId(quotes), status: 'Pendiente', price: null, created_at: now, ...quote };
  quotes.push(newQuote);
  writeJSON(QUOTES_FILE, quotes);
  return newQuote;
}
function updateQuote(id, patch) {
  const quotes = getQuotes();
  const idx = quotes.findIndex(q => q.id === Number(id));
  if (idx === -1) return null;
  quotes[idx] = { ...quotes[idx], ...patch };
  writeJSON(QUOTES_FILE, quotes);
  return quotes[idx];
}
function getQuotesByUser(userId) {
  return getQuotes().filter(q => q.user_id === Number(userId)).reverse();
}
function getQuotesWithClientInfo() {
  const users = getUsers();
  return getQuotes().map(q => {
    const u = users.find(u => u.id === q.user_id) || {};
    return { ...q, client_name: u.name || '(no encontrado)', client_email: u.email || '', client_phone: u.phone || '' };
  }).reverse();
}


function ensureAdmin() {
  const email = 'admin@renor.com';
  if (findUserByEmail(email)) return;
  addUser({
    name: 'Administrador',
    email,
    phone: '',
    password_hash: bcrypt.hashSync('Admin123', 10),
    role: 'admin'
  });
  console.log('Cuenta admin creada -> correo: admin@renor.com  contraseña: Admin123');
}

module.exports = { findUserByEmail, addUser, updateUser, addQuote, updateQuote, getQuotesByUser, getQuotesWithClientInfo, ensureAdmin };
