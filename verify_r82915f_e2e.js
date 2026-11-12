const http=require('http');
const fs=require('fs');
const path=require('path');
const {chromium}=require('playwright');

const index=fs.readFileSync(path.join(__dirname,'index.html'));
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guatemala',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const historic='2026-10-22';
function payload(date){
  const historical=date===historic;
  return {
    routeDate:date,
    messenger:{id:'m_daniel',name:'Daniel Choc',centerId:'cedi16',routeStatus:historical?'Pendiente':'En ruta',routePublishedDate:date,routeAssignedAt:new Date().toISOString(),returnCediAt:historical?'2026-10-22T15:46:45-06:00':'',routeKmReal:33,routeDistanceKm:10.5},
    orders:[historical?{id:'o_hist',orderNo:'346382',clientName:'IMFOHSA ZONA 4',address:'Zona 4 de la Ciudad de Guatemala, Ruta 6, 8-08',date,status:'Entregado',operationType:'Entrega',cut:'08:30',lat:14.6164,lng:-90.5153,arrivalLat:14.6163889,arrivalLng:-90.5153253,arrivalAccuracy:11.48,arrivalDistanceMeters:15,deliveredAt:'2026-10-22T08:25:56-06:00'}:{id:'o_live',orderNo:'S347065',clientName:'CESAR DAVID TAQUIRA LOPEZ',address:'5 CALLE 7-72, ZONA 1',date,status:'En cliente',operationType:'Entrega',cut:'08:30',lat:14.62,lng:-90.52,arrivalLat:14.6201,arrivalLng:-90.5201,arrivalAccuracy:9,arrivalDistanceMeters:12,arrivedAt:new Date().toISOString()}],
    settings:{routeDispatchGraceMinutes:10,waitAlertMinutes:5,maxWaitMinutes:15,cuts:['08:30','10:00','13:00','14:30']},
    centers:[{id:'cedi16',name:'CEDI CENTRAL',lat:14.61,lng:-90.52}]
  };
}

(async()=>{
  const server=http.createServer((req,res)=>{
    const u=new URL(req.url,'http://127.0.0.1');
    if(u.pathname==='/index.html'||u.pathname==='/'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});return res.end(index)}
    if(u.pathname==='/api/public/driver'){res.writeHead(200,{'content-type':'application/json'});return res.end(JSON.stringify(payload(u.searchParams.get('date')||today)))}
    if(u.pathname==='/api/driver/action'){let raw='';req.on('data',c=>raw+=c);req.on('end',()=>{res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({ok:true,received:raw?JSON.parse(raw):{}}))});return}
    if(u.pathname==='/api/logout'){res.writeHead(200,{'content-type':'application/json'});return res.end('{"ok":true}')}
    res.writeHead(404);res.end('not found');
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const port=server.address().port,browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'}),page=await browser.newPage({viewport:{width:390,height:844}}),dialogs=[];
  page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss()});
  const results=[];const check=(name,ok,evidence)=>{results.push({name,ok:Boolean(ok),evidence});if(!ok)process.exitCode=1};
  try{
    await page.goto(`http://127.0.0.1:${port}/index.html?driver=m_daniel&auth=1&date=${historic}&v=82915f`,{waitUntil:'networkidle'});
    await page.waitForSelector('.r823-stop');
    check('historical_final_status',(await page.locator('.r823-online').innerText()).includes('Finalizada'),await page.locator('.r823-online').innerText());
    check('historical_no_prepare',await page.locator('.r824-start-alert').count()===0,'start alert absent');
    check('historical_no_return_actions',await page.locator('#returnCedi,#closeRoute').count()===0,'return/close absent');
    check('historical_final_card',await page.getByText('Ruta finalizada',{exact:false}).count()>0,'final card visible');
    const visual=await page.locator('.r823-stop').evaluate(el=>{const top=el.querySelector('.r823-stop-top'),badge=top.querySelector('.r823-badge'),name=top.querySelector('h3'),address=top.querySelector('.r823-address');return{display:getComputedStyle(top).display,badgeWidth:badge.getBoundingClientRect().width,nameWhiteSpace:getComputedStyle(name).whiteSpace,addressWhiteSpace:getComputedStyle(address).whiteSpace}});
    check('compact_stop',visual.display==='flex'&&visual.badgeWidth<=30&&visual.nameWhiteSpace==='nowrap'&&visual.addressWhiteSpace==='nowrap',visual);
    await page.waitForTimeout(1600);check('historical_no_late_alert',dialogs.length===0,dialogs);
    await page.goto(`http://127.0.0.1:${port}/index.html?driver=m_daniel&auth=1&date=${today}&v=82915f`,{waitUntil:'networkidle'});
    await page.waitForSelector('.r823-stop');
    await page.evaluate(()=>r829OpenOutcome('o_live','failed',{}));
    check('failure_modal_reason',await page.locator('#r82915fReason').count()===1,'reason selector visible');
    check('failure_modal_photo',await page.locator('#r82915fPhoto').count()===1,'photo required control visible');
    check('failure_modal_notes',await page.locator('#r82915fNotes').count()===1,'required notes visible');
    const rules=await page.evaluate(()=>({absent:r82915fFailureResolution('Cliente ausente'),address:r82915fFailureResolution('Dirección incorrecta'),rejected:r82915fFailureResolution('Cliente rechazó'),hasPlannerResolver:typeof r82915fResolveIncident==='function'}));
    check('resolution_rules',rules.absent==='reprogramar'&&rules.address==='corregir'&&rules.rejected==='revision_anulacion'&&rules.hasPlannerResolver,rules);
  }finally{await browser.close();await new Promise(r=>server.close(r))}
  console.log(JSON.stringify({ok:results.every(x=>x.ok),results},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
