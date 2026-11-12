const BASE = process.argv[2];
if (!BASE) throw new Error('Uso: node verify_82300.js <base-url>');
async function status(url, options = {}) {
  try {
    const response = await fetch(url, { redirect: 'follow', ...options });
    return { status: response.status, ok: response.ok, url: response.url };
  } catch (error) {
    return { status: 0, ok: false, error: error.message };
  }
}
(async () => {
  const login = await fetch(BASE + '/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'WFUENTES', password: 'Imfohsa1234/' })
  });
  if (!login.ok) throw new Error('Login HTTP ' + login.status);
  const cookie = String(login.headers.get('set-cookie') || '').split(';')[0];
  const headers = { Cookie: cookie };
  const stateResponse = await fetch(BASE + '/api/state', { headers });
  if (!stateResponse.ok) throw new Error('State HTTP ' + stateResponse.status);
  const state = await stateResponse.json();
  const preferredDate = '2026-10-16';
  const assignedDates = [...new Set((state.orders || []).filter(o => o.messengerId).map(o => o.date).filter(Boolean))].sort().reverse();
  const date = (state.orders || []).some(o => o.date === preferredDate && o.messengerId) ? preferredDate : assignedDates[0];
  const sellerAccess = Object.values(state.settings?.sellerAccess || {}).filter(x => x?.active !== false && x?.token);
  const sellerResults = [];
  for (const seller of sellerAccess) {
    sellerResults.push({ name: seller.name || seller.vendor || '', ...(await status(BASE + '/vendedor/' + seller.token)) });
  }
  const panelResponse = await fetch(BASE + '/api/share/panel-request', { method: 'POST', headers });
  const panel = panelResponse.ok ? await panelResponse.json() : { path: '', error: 'HTTP ' + panelResponse.status };
  const messenger = (state.messengers || []).find(m => (state.orders || []).some(o => o.date === date && o.messengerId === m.id));
  let driver = { path: '', error: 'No hay mensajero con pedidos en la fecha' };
  if (messenger) {
    const driverResponse = await fetch(BASE + `/api/share/driver?mid=${encodeURIComponent(messenger.id)}&date=${date}&fast=1`, { headers });
    driver = driverResponse.ok ? await driverResponse.json() : { path: '', error: 'HTTP ' + driverResponse.status };
  }
  const routes = {
    platform: await status(BASE + '/index.html?access=1&v=82300'),
    panelForm: panel.path ? await status(BASE + panel.path) : panel,
    driver: driver.path ? await status(BASE + driver.path) : driver
  };
  console.log(JSON.stringify({
    version: 'R8.23.0',
    stateVersion: state.version,
    counts: { orders: state.orders?.length || 0, clients: state.clients?.length || 0, messengers: state.messengers?.length || 0, vehicles: state.vehicles?.length || 0 },
    driverTestDate: date || '',
    sellers: { tested: sellerResults.length, ok: sellerResults.filter(x => x.ok).length, failures: sellerResults.filter(x => !x.ok) },
    routes,
    driverPath: driver.path || '',
    panelPath: panel.path || ''
  }, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
