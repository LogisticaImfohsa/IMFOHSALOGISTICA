const { chromium } = require('playwright');
const fs = require('fs');

async function main(){
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage({ viewport: { width: 1900, height: 900 } });
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  const qaUrl = process.env.IMF_QA_URL || 'http://127.0.0.1:8952/index.html?access=1&v=copy-clear-7';
  const response = await page.goto(qaUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: 'qa-access.png', fullPage: true });
  const report = {
    status: response && response.status(),
    title: await page.title(),
    bodyClass: await page.locator('body').getAttribute('class'),
    accessHeading: await page.locator('body').innerText().then(v => v.includes('Acceso administrativo')),
    finalCss: await page.locator('link[href*="r82915-admin-final.css"]').count(),
    errors
  };
  fs.writeFileSync('qa-access-report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  await browser.close();
}

main().catch(error => { console.error(error); process.exit(1); });
