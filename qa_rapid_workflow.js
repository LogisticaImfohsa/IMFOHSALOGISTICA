const { chromium } = require('playwright');

const base = process.env.IMF_QA_BASE;
const user = process.env.IMF_QA_USER;
const password = process.env.IMF_QA_PASSWORD;
if (!base || !user || !password) throw new Error('Faltan variables de QA');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/index.html?access=1&v=rapid-workflow-1`, { waitUntil: 'networkidle' });
  await page.fill('#lu', user);
  await page.fill('#lp', password);
  await page.click('#loginBtn');
  await page.waitForSelector('#appShell');
  const result = await page.evaluate(async () => {
    const originalState = STATE;
    const originalSave = saveState;
    const originalRender = renderPlanner;
    const originalToast = toast;
    const originalApi = api;
    const date = selectedDate();
    const messenger = (STATE.messengers || []).find(m => m.status !== 'Inactivo');
    const messages = [];
    const rapid = {
      id: '__qa_rapid__', orderNo: 'QA-RAPID', date, messengerId: messenger.id,
      status: 'Asignado', routePosition: 1, geoValidated: false, lat: null, lng: null,
      geoReleaseBypass: true, geoValidationMode: 'observed_delivery', geoObservedPending: true,
      releaseApproved: true, releaseToPlanner: true, address: 'Dirección QA'
    };
    STATE = JSON.parse(JSON.stringify(originalState));
    STATE.orders = [rapid];
    saveState = async () => true;
    api = async path => path === '/api/state' ? STATE : originalApi(path);
    renderPlanner = () => {};
    toast = message => messages.push(message);
    sessionStorage.setItem('globalDate', date);
    sessionStorage.setItem('planCut', 'ALL');
    await shareDriver(messenger.id);
    const published = {
      routePublished: !!rapid.routePublishedAt,
      publishedMessengerId: rapid.publishedMessengerId,
      gpsStillPending: rapid.geoObservedPending === true,
      rapidRoutePublished: rapid.rapidRoutePublished === true,
      status: rapid.status,
      message: messages.at(-1) || ''
    };
    messages.length = 0;
    const assignedSnapshot = JSON.parse(JSON.stringify(STATE));
    let unassignSaveCalls = 0;
    saveState = async () => {
      unassignSaveCalls += 1;
      if (unassignSaveCalls === 1) {
        STATE = JSON.parse(JSON.stringify(assignedSnapshot));
        return false;
      }
      return true;
    };
    await r773UnassignManagement(rapid.id);
    const persistedRapid = (STATE.orders || []).find(o => o.id === rapid.id);
    const unassigned = {
      messengerId: persistedRapid?.messengerId,
      status: persistedRapid?.status,
      routePosition: persistedRapid?.routePosition,
      routePublishedRemoved: !persistedRapid?.routePublishedAt,
      saveAttempts: unassignSaveCalls,
      conflictRecovered: unassignSaveCalls === 2,
      message: messages.at(-1) || ''
    };
    STATE = originalState;
    saveState = originalSave;
    renderPlanner = originalRender;
    toast = originalToast;
    api = originalApi;
    return { published, unassigned };
  });
  console.log(JSON.stringify({ ...result, errors }, null, 2));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
