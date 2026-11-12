const { chromium } = require('playwright');
const base=process.env.IMF_QA_BASE,user=process.env.IMF_QA_USER,password=process.env.IMF_QA_PASSWORD;
async function main(){
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1900,height:950}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${base}/index.html?access=1&v=copy-clear-11`,{waitUntil:'networkidle'});
 await page.fill('#lu',user);await page.fill('#lp',password);await page.click('#loginBtn');await page.waitForSelector('#appShell');
 const date=page.locator('input[type=date]').first();if(await date.count()){await date.fill('2026-10-23');await date.dispatchEvent('change');await page.waitForTimeout(900)}
 await page.getByText('Planificador de rutas',{exact:true}).first().click();await page.waitForTimeout(1800);
 const report={
  pendingLocations:await page.getByText(/Ubicaciones pendientes/).count(),
  scanMenu:await page.getByText(/Escanear \/ cargar ruta/).count(),
  analyze:await page.getByText(/Analizar y proponer rutas/).count(),
  map:await page.locator('.leaflet-container').count(),
  daniel:await page.getByText('Daniel Choc',{exact:true}).count(),
  zeroRouteCards:await page.locator('.r765-route-card:visible').evaluateAll(cards=>cards.filter(c=>!c.querySelectorAll('.r765-stop[data-oid]').length).length),
  orderActionMenus:await page.locator('.r765-order-card select,.r810-order-card select').count(),
  errors
 };
 await page.locator('#imfImportMessengerRoute').click();await page.waitForTimeout(300);
 report.modalTitle=await page.getByText('Cargar ruta por mensajero',{exact:true}).count();
 report.messengerOptions=await page.locator('#imfRouteMessenger option').allTextContents();
 report.hasDate=await page.locator('#imfRouteDate').count();
 report.hasFile=await page.locator('#imfRouteFile').count();
 report.hasRapidMode=await page.locator('#imfRapidRelease').count();
 report.hasImportAction=await page.getByText('Importar y asignar',{exact:true}).count();
 await page.screenshot({path:'qa-planner-import.png',fullPage:false});
 console.log(JSON.stringify(report,null,2));await browser.close();
}
main().catch(e=>{console.error(e);process.exit(1)});
