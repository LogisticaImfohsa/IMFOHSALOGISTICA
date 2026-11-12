const fs = require('fs');
const path = require('path');

const statePath = path.join(__dirname, 'data', 'state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const order = (state.orders || []).find(o => o.orderNo === 'S341842' && o.sourceExcelFileName === 'Pedido de venta (sale.order) - 2026-10-21T162042.816.xlsx');
if (!order) throw new Error('No se encontró el pedido S341842 del archivo indicado');

const correctedDate = order.importOperationDate || '2026-10-17';
const previousDate = order.date;
order.date = correctedDate;
order.requestedDeliveryDate = correctedDate;
order.scheduleInterpretation = 'Fecha operativa seleccionada; “lista 1/2” no es una fecha';
order.scheduleAnchorDate = correctedDate;
order.scheduleHistory = Array.isArray(order.scheduleHistory) ? order.scheduleHistory : [];
order.scheduleHistory.push({
  at: new Date().toISOString(),
  from: previousDate,
  to: correctedDate,
  reason: 'Corrección R8.29.14: se excluyen fracciones/listas sin indicador de fecha',
  instruction: order.instructions || ''
});
state.lastModifiedAt = new Date().toISOString();
state.lastModifiedBy = 'R82914_SCHEDULE_REPAIR';
state.version = Number(state.version || 0) + 1;
fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');
console.log(JSON.stringify({ orderNo: order.orderNo, from: previousDate, to: correctedDate, instruction: order.instructions }, null, 2));
