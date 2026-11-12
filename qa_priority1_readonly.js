const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', args:['--no-sandbox']});
  const page = await browser.newPage({viewport:{width:1900,height:950}});
  const errors=[];
  page.on('pageerror', e=>errors.push(e.stack||e.message));
  await page.goto('https://gilbert-inbox-transcript-coverage.trycloudflare.com/index.html?access=1&v=priority1-final',{waitUntil:'networkidle',timeout:60000});
  await page.fill('#lu','WFUENTES');
  await page.fill('#lp','Imfohsa1234/');
  await page.click('#loginBtn');
  try { await page.waitForSelector('#appShell',{timeout:30000}); }
  catch (error) {
    console.error(JSON.stringify({url:page.url(),body:(await page.locator('body').innerText()).slice(0,1600),errors},null,2));
    throw error;
  }
  const report=await page.evaluate(async()=>{
    const dates=(STATE.orders||[]).map(o=>o.date).filter(Boolean).sort();
    const date=dates.at(-1)||localISODate();
    sessionStorage.setItem('globalDate',date);
    CURRENT='planner';renderPage(false);
    await new Promise(r=>setTimeout(r,700));
    const norm=v=>String(v||'').trim().replace(/^Corte(?: operativo)?\s*:\s*/i,'').replace(/\s+/g,' ').toLowerCase();
    const center=sessionStorage.getItem('planCenter')||'cedi16';
    const cuts=[...new Set((STATE.orders||[]).filter(o=>o.date===date&&o.cut).map(o=>o.cut))];
    const cutAudit=cuts.map(cut=>{const rows=filteredOrdersFinal(center,'ALL',date,cut);return {cut,count:rows.length,invalid:rows.filter(o=>norm(o.cut)!==norm(cut)).length}});
    const expected=(STATE.messengers||[]).filter(m=>messengerDayStatus(m.id,date)!=='Ausente').map(m=>m.name);
    const absent=(STATE.messengers||[]).filter(m=>messengerDayStatus(m.id,date)==='Ausente').map(m=>m.name);
    const cards=[...document.querySelectorAll('.r765-route-card[data-mid]')].filter(el=>!el.hidden&&getComputedStyle(el).display!=='none').map(el=>el.textContent);
    return {
      date,
      priorityScript:[...document.scripts].some(s=>/r82915-priority1\.js/.test(s.src)),
      atomicUnassign:typeof window.r773UnassignManagement==='function',
      atomicDelete:typeof window.r773DeleteManagement==='function',
      cutAudit,
      missingMessengers:expected.filter(n=>!cards.some(t=>t.includes(n))),
      absentVisible:absent.filter(n=>cards.some(t=>t.includes(n))),
      visibleCards:cards.length
    };
  });
  report.errors=errors;
  console.log(JSON.stringify(report,null,2));
  await browser.close();
  if(!report.priorityScript||!report.atomicUnassign||!report.atomicDelete||report.cutAudit.some(x=>x.invalid)||report.missingMessengers.length||report.absentVisible.length||errors.length)process.exit(1);
}
main().catch(e=>{console.error(e.stack||e);process.exit(1)});
