const crypto = require('crypto');
const admins = require('./data/admins.json');
const rows = Array.isArray(admins) ? admins : (admins.users || admins.admins || []);
const candidates = ['IMFOHSA2026', 'Imfohsa#2026', 'Imfohsa1234/', 'Imfohsa2026', 'IMFOHSA1234/'];
for (const candidate of candidates) {
  const hash = crypto.createHash('sha256').update(candidate).digest('hex');
  const matched = rows.filter(x => x.passwordHash === hash).map(x => x.username);
  if (matched.length) console.log(JSON.stringify({ candidateIndex: candidates.indexOf(candidate), users: matched }));
}
