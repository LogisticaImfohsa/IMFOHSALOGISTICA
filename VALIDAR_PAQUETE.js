const fs = require('fs');
const path = require('path');

const root = __dirname;
const required = [
  'index.html',
  'IMFOHSA_SERVIDOR.exe',
  'server_copia_aprobada_8946.go',
  'data/admins.json',
  'data/state_cost_root.json',
  'CONTRATO_INTEGRACION_ODOO.md',
  'ODOO.env.example'
];
const missing = required.filter(file => !fs.existsSync(path.join(root, file)));
const admins = JSON.parse(fs.readFileSync(path.join(root, 'data/admins.json'), 'utf8'));
const state = JSON.parse(fs.readFileSync(path.join(root, 'data/state_cost_root.json'), 'utf8'));
const messengerIds = new Set((state.messengers || []).map(item => String(item.id || '')));
const active = admins.filter(item => item.active);
const pilots = active.filter(item => item.role === 'mensajero');
const invalidPilots = pilots.filter(item => !item.messengerId || !messengerIds.has(String(item.messengerId)));
const duplicateUsers = active.map(item => String(item.username).toUpperCase()).filter((name, index, all) => all.indexOf(name) !== index);

console.log(JSON.stringify({
  ok: !missing.length && !invalidPilots.length && !duplicateUsers.length,
  missing,
  activeUsers: active.length,
  activePilots: pilots.length,
  invalidPilots: invalidPilots.map(item => item.username),
  duplicateUsers,
  orders: (state.orders || []).length,
  messengers: (state.messengers || []).length
}, null, 2));

if (missing.length || invalidPilots.length || duplicateUsers.length) process.exit(1);
