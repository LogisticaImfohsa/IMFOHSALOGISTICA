const { chromium } = require('playwright');
const fs = require('fs');

const base = process.env.IMF_QA_BASE || 'https://long-bridal-generated-folks.trycloudflare.com';
const cookieLines = fs.readFileSync('qa-admin.cookies', 'utf8').split(/\r?\n/).filter(line => line && !line.startsWith('#'));
const cookies = cookieLines.map(line => {
  const [domain, , path, secure, expires, name, ...value] = line.split('\t');
  return { domain, path, secure: secure === 'TRUE', expires: Number(expires) || -1, name, value: value.join('\t') };
});

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({ viewport: { width: 1900, height: 950 } });
  await context.addCookies(cookies.map(cookie => ({ ...cookie, domain: new URL(base).hostname })));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(`${base}/index.html?access=1&v=82915c16`, { waitUntil: 'networkidle', timeout: 45000 });
  const authenticated = await page.locator('#appShell').count() > 0;
  const report = { authenticated, modules: [], errors };
  if (authenticated) {
    const modules = [
      ['dashboard','Dashboard'], ['planner','Planificador de rutas'], ['orders','Pedidos y despachos'],
      ['sales','Ventas'], ['messengers','Mensajeros'], ['fleet','Flotilla'],
      ['requests','Solicitud de vehículo'], ['costs','Combustibles y costos'], ['settings','Configuración']
    ];
    for (const [name, label] of modules) {
      const nav = page.getByText(label, { exact: true }).first();
      if (!await nav.count()) { report.modules.push({ name, navigation: false }); continue; }
      await nav.click();
      await page.waitForTimeout(name === 'planner' ? 1800 : 700);
      const result = await page.evaluate(module => {
        const visible = el => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
        const selectedDuplicates = [...document.querySelectorAll('select')].filter(visible).filter(select => [...select.options].filter(option => option.value === select.value).length > 1).length;
        const text = document.body.innerText;
        return {
          name: module,
          selectedDuplicates,
          darkToggle: !!document.querySelector('#imfThemeToggle'),
          serverActive: /Servidor activo/i.test(text),
          danielVisible: /Daniel Choc/i.test(text),
          rapidImport: /Cargar Excel individual por mensajero/i.test(text),
          gpsMetric: /km\s*·\s*\d+\s*min\s*GPS real/i.test(text),
          requestAdvance: document.querySelector('#stPanelDays')?.value || null,
          bodyClass: document.body.className
        };
      }, name);
      report.modules.push(result);
    }
  }
  fs.writeFileSync('qa-c16-report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
