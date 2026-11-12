const fs = require('fs');
const path = require('path');

const statePath = path.join(__dirname, 'data', 'state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const targetDate = '2026-10-21';
const orderNos = new Set(['S347501', 'S347473', 'S347419', 'S347365', 'S347421', 'S341842']);
const repaired = [];

for (const order of state.orders || []) {
  if (!orderNos.has(String(order.orderNo || '').toUpperCase())) continue;
  const previousDate = order.date || '';
  order.date = targetDate;
  order.importOperationDate = targetDate;
  order.requestedDeliveryDate = targetDate;
  order.scheduleAnchorDate = targetDate;
  order.routeDate = null;
  order.deliveryDate = null;
  order.scheduleHistory = Array.isArray(order.scheduleHistory) ? order.scheduleHistory : [];
  order.scheduleHistory.push({
    at: new Date().toISOString(),
    from: previousDate,
    to: targetDate,
    reason: 'Estabilización R8.29.15: fecha operativa del lote importado',
  });
  repaired.push({ orderNo: order.orderNo, from: previousDate, to: targetDate });
}

if (repaired.length !== orderNos.size) {
  throw new Error(`Se esperaban ${orderNos.size} pedidos y se encontraron ${repaired.length}`);
}

state.lastModifiedAt = new Date().toISOString();
state.lastModifiedBy = 'R82915_IMPORT_STABILIZATION';
state.version = Number(state.version || 0) + 1;
fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');
console.log(JSON.stringify({ repaired, version: state.version }, null, 2));
