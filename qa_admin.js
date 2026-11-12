const { chromium } = require('playwright');
const fs = require('fs');

const base = process.env.IMF_QA_BASE;
const user = process.env.IMF_QA_USER;
const password = process.env.IMF_QA_PASSWORD;
if (!base || !user || !password) throw new Error('Faltan variables IMF_QA_BASE, IMF_QA_USER o IMF_QA_PASSWORD');

async function pageSummary(page, name){
  return page.evaluate((moduleName) => {
    const visible = node => !!(node && (node.offsetWidth || node.offsetHeight || node.getClientRects().length));
    const selectedOptions = [...document.querySelectorAll('select')].filter(visible).map(select => ({
      value: select.value,
      duplicates: [...select.options].filter(option => option.value === select.value).length
    }));
    const text = document.body.innerText;
    return {
      module: moduleName,
      bodyClass: document.body.className,
      finalCss: document.querySelectorAll('link[href*="r82915-admin-final.css"]').length,
      duplicateSelectedOptions: selectedOptions.filter(item => item.duplicates > 1).length,
      messengerDaniel: /Daniel Choc/i.test(text),
      hasDarkThemeToggle: !!document.querySelector('#imfThemeToggle'),
      pageTextStart: text.slice(0, 500)
    };
  }, name);
}

async function main(){
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({ viewport: { width: 1900, height: 950 } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/index.html?access=1&v=copy-clear-9`, { waitUntil: 'networkidle', timeout: 45000 });
  await page.locator('#lu').fill(user);
  await page.locator('#lp').fill(password);
  await page.locator('#loginBtn').click();
  await page.locator('#appShell').waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForTimeout(1200);
  const dateInput = page.locator('input[type="date"]').first();
  if (await dateInput.count()) {
    await dateInput.fill('2026-10-23');
    await dateInput.dispatchEvent('change');
    await page.waitForTimeout(1200);
  }
  const modules = [
    ['dashboard','Dashboard'],
    ['planner','Planificador de rutas'],
    ['orders','Pedidos y despachos'],
    ['sales','Ventas'],
    ['messengers','Mensajeros'],
    ['fleet','Flotilla'],
    ['requests','Solicitud de vehículo'],
    ['costs','Combustibles y costos'],
    ['settings','Configuración']
  ];
  const results = [];
  for (const [name, label] of modules) {
    const nav = page.getByText(label, { exact: true }).first();
    if (await nav.count()) {
      await nav.click();
      await page.waitForTimeout(name === 'planner' ? 2200 : 1200);
      await page.screenshot({ path: `qa-${name}.png`, fullPage: false });
      results.push(await pageSummary(page, name));
    } else {
      results.push({ module: name, missingNavigation: true });
    }
  }
  const report = { results, errors };
  fs.writeFileSync('qa-admin-report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  await browser.close();
}

main().catch(error => { console.error(error); process.exit(1); });
