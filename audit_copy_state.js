const state = require('./data/state.json');
const admins = require('./data/admins.json');
const users = (Array.isArray(admins) ? admins : (admins.users || admins.admins || [])).map(({ username, role, messengerId }) => ({ username, role, messengerId: messengerId || '' }));
const date = process.argv[2] || '2026-10-23';
const assigned = (state.messengers || []).map(m => ({
  id: m.id,
  name: m.name,
  orders: (state.orders || []).filter(o => o.date === date && o.messengerId === m.id && !['Anulado', 'Cancelado'].includes(o.status)).length,
})).filter(x => x.orders > 0);
const rawAdmins = Array.isArray(admins) ? admins : (admins.users || admins.admins || []);
console.log(JSON.stringify({ adminFields: Object.keys(rawAdmins[0] || {}), hashPrefixes: rawAdmins.slice(0,2).map(x=>String(x.passwordHash||'').slice(0,12)), users, date, assigned }, null, 2));
