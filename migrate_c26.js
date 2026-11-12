const fs = require('fs');
const path = require('path');

const root = __dirname;
const statePath = path.join(root, 'data', 'state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
let changed = 0;

const requests = Array.isArray(state.panelRequests) ? state.panelRequests : [];
let maxRQ = 0;
for (const request of requests) {
  const match = /^RQ-(\d+)$/i.exec(String(request?.id || '').trim());
  if (match) maxRQ = Math.max(maxRQ, Number(match[1]));
}
const legacy = requests
  .filter(request => !/^RQ-\d+$/i.test(String(request?.id || '').trim()))
  .sort((a, b) => String(a.createdAt || a.date || a.id || '').localeCompare(String(b.createdAt || b.date || b.id || '')));
for (const request of legacy) {
  const oldId = String(request.id || '').trim();
  if (oldId) request.legacyRequestId = oldId;
  request.id = `RQ-${String(++maxRQ).padStart(2, '0')}`;
  changed++;
}

for (const messenger of Array.isArray(state.messengers) ? state.messengers : []) {
  for (const [field, legacyField, max] of [
    ['routeKmReal', 'legacyRouteKmRealInvalid', 1000],
    ['routeGpsKm', 'legacyRouteGpsKmInvalid', 1000],
    ['routeGpsMinutes', 'legacyRouteGpsMinutesInvalid', 1440],
  ]) {
    const value = Number(messenger?.[field] || 0);
    if (!Number.isFinite(value) || value < 0 || value > max) {
      messenger[legacyField] = messenger[field];
      messenger[field] = 0;
      changed++;
    }
  }
}

if (changed) {
  state.version = Number(state.version || 0) + 1;
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

console.log(JSON.stringify({ ok: true, changed, nextRequest: `RQ-${String(maxRQ + 1).padStart(2, '0')}` }));
