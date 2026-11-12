const fs = require('fs');
const path = require('path');

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const current = read(path.join(__dirname, 'data', 'state.json'));
const original = read(path.join(__dirname, '..', 'R8.29.15_BLOQUEADA_ORIGINAL', 'data', 'state.json'));
const date = '2026-10-30';
const messenger = (current.messengers || []).find(m => /daniel choc/i.test(m.name || ''));
const orders = (current.orders || []).filter(o => o.date === date && o.messengerId === messenger?.id);
const sessions = (current.routeLearning || []).filter(x => x.type === 'r770_route_session' && x.messengerId === messenger?.id).slice(-12).map(x => ({
  id:x.id, date:x.date, startedAt:x.startedAt, endedAt:x.endedAt,
  odometerStart:x.odometerStart, odometerEnd:x.odometerEnd,
  kmReal:x.kmReal, gpsKm:x.gpsKm, gpsMinutes:x.gpsMinutes
}));
const rq = state => (state.panelRequests || []).map(r => ({id:r.id,date:r.date,returnDate:r.returnDate,status:r.status,createdAt:r.createdAt,weeklyItems:(r.weeklyItems || []).length}));
const currentAssignments = (current.panelAssignments || []).filter(a => date >= String(a.date || '') && date <= String(a.returnDate || a.date || ''));
const output = {
  date,
  messenger: messenger && {
    id: messenger.id,
    routeStatus: messenger.routeStatus,
    routeAssignedAt: messenger.routeAssignedAt,
    routeStartedAt: messenger.routeStartedAt,
    routeEndedAt: messenger.routeEndedAt,
    routeStartDelayMinutes: messenger.routeStartDelayMinutes,
    odometerStart: messenger.odometerStart,
    odometerEnd: messenger.odometerEnd,
    routeKmReal: messenger.routeKmReal,
    routeGpsKm: messenger.routeGpsKm,
    routeGpsMinutes: messenger.routeGpsMinutes
  },
  orders: orders.map(o => ({id:o.id,orderNo:o.orderNo,cut:o.cut,status:o.status,amount:o.amount,totalAmount:o.totalAmount,arrivedAt:o.arrivedAt,closedAt:o.closedAt})),
  sessions,
  rqCurrent: rq(current),
  rqOriginal: rq(original),
  panelAssignmentsForDate: currentAssignments.map(a => ({id:a.id,vehicleId:a.vehicleId,date:a.date,returnDate:a.returnDate,status:a.status,requestId:a.requestId})),
  totals: {
    deliveredToday: (current.orders || []).filter(o => o.date === date && o.status === 'Entregado').length,
    invoiceToday: (current.orders || []).filter(o => o.date === date).reduce((sum,o) => sum + Number(o.amount || 0), 0),
    manualCostsToday: (current.manualCosts || []).filter(x => x.date === date).reduce((sum,x) => sum + Number(x.amount || 0), 0)
  }
};
console.log(JSON.stringify(output, null, 2));
