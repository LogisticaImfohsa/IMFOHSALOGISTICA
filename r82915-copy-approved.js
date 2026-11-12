(function(){
'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
function iso(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function buckets(){const anchor=new Date(`${selectedDate()}T12:00:00`),day=(anchor.getDay()+6)%7,start=new Date(anchor),include=!!STATE.settings?.includeOperationalSunday,names=['lun','mar','mié','jue','vie','sáb','dom'];start.setDate(anchor.getDate()-day);return Array.from({length:include?7:6},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return {from:iso(d),to:iso(d),label:names[i]}})}
function enhanceDashboard(){const panel=qa('.r813-panel').find(x=>q('h3',x)?.textContent.trim()==='Cumplimiento');if(!panel)return;const h=q('h3',panel),p=q('.r813-title p',panel),title=q('.r813-title>div',panel);if(h)h.textContent='Cumplimiento · semana operativa';if(p)p.textContent='Lunes a sábado comparados con la meta.';if(title&&!q('.imf-operational-sunday',panel)){const l=document.createElement('label');l.className='imf-operational-sunday';l.innerHTML=`<input id="imfOperationalSunday" type="checkbox" ${STATE.settings?.includeOperationalSunday?'checked':''}> Incluir domingo`;title.appendChild(l);q('#imfOperationalSunday').onchange=async e=>{STATE.settings.includeOperationalSunday=e.target.checked;await saveState('Semana operativa actualizada');r813Dashboard()}}}
function routesOnly(shell){if(typeof R810_STATE!=='undefined'){R810_STATE.resourceTab='MESSENGERS';if(typeof r810ApplyResourceFilter==='function')r810ApplyResourceFilter()}const panel=shell?.querySelector('.r810-resources'),label=panel?.querySelector('.r810-panel-head b');if(label)label.textContent='Mensajeros del turno y rutas';panel?.classList.remove('r810-routes-only');panel?.querySelectorAll('.r765-route-card,.route-card').forEach(card=>{const mid=card.dataset.mid||card.dataset.messengerId||card.querySelector('[data-mid]')?.dataset.mid||'';const absent=mid&&typeof messengerDayStatus==='function'&&messengerDayStatus(mid,selectedDate())==='Ausente';card.hidden=!!absent;card.style.display=absent?'none':'';if(absent)return;const count=card.querySelectorAll('.r765-stop[data-oid]').length,status=card.querySelector('.r765-route-status');if(status)status.textContent=count?'Ruta asignada':'Sin ruta'})}
function addImport(){if(CURRENT!=='planner'||q('#imfImportMessengerRoute'))return;const toolbar=q('#content>.pagehead .toolbar');if(!toolbar)return;const b=document.createElement('button');b.id='imfImportMessengerRoute';b.type='button';b.className='btn btn-primary imf-route-import';b.textContent='📊 Cargar Excel individual por mensajero';b.title='Importar un archivo Excel y asignarlo directamente al mensajero seleccionado';b.onclick=openImport;toolbar.appendChild(b)}
function openImport(){const date=selectedDate(),ms=(STATE.messengers||[]).filter(m=>m.status!=='Inactivo'&&(!(typeof messengerDayStatus==='function')||messengerDayStatus(m.id,date)!=='Ausente'));openModal('Cargar ruta por mensajero',`<div class="insight"><b>Se conserva el Planificador original.</b> Los pedidos se asignarán al mensajero seleccionado.</div><div class="formgrid" style="margin-top:12px"><div class="field"><label>Mensajero disponible *</label><select id="imfRouteMessenger" class="select">${ms.map(m=>`<option value="${esc(m.id)}">${esc(m.name||m.fullName||m.username||'Mensajero')}</option>`).join('')}</select></div><div class="field"><label>Fecha *</label><input id="imfRouteDate" class="input" type="date" value="${date}"></div><div class="field wide"><label>Archivo Excel *</label><input id="imfRouteFile" class="input" type="file" accept=".xlsx,.xls,.csv"></div><label class="field wide"><span><input id="imfRapidRelease" type="checkbox"> Modo rápido: liberar sin validar cada pin y construir recorrido con el GPS real del mensajero</span></label></div>`,[{text:'Importar y asignar',cls:'btn-primary',fn:importRoute},{text:'Cancelar',fn:closeModal}])}
async function importRoute(){const file=q('#imfRouteFile')?.files?.[0],mid=q('#imfRouteMessenger')?.value,date=q('#imfRouteDate')?.value,rapid=!!q('#imfRapidRelease')?.checked;if(!file)return toast('Seleccione un archivo Excel.','err');if(!mid||!date)return toast('Seleccione mensajero y fecha.','err');try{const parsed=await r726ParseExcelInBrowser(file),rows=parsed?.orders||parsed?.rows||parsed;if(!Array.isArray(rows)||!rows.length)throw new Error('El Excel no contiene pedidos reconocibles');let url='';try{url=await r713UploadOriginal(file)||''}catch{}const made=[];for(let i=0;i<rows.length;i++){const o=await r726CreateExcelOrder(rows[i],file,url,i);if(!o)continue;Object.assign(o,{date,messengerId:mid,status:'Asignado',routePosition:made.length+1,assignedAt:new Date().toISOString(),assignedBy:ME?.username||''});if(rapid)Object.assign(o,{geoReleaseBypass:true,geoValidationMode:'observed_delivery',geoObservedPending:true,releaseApproved:true,releaseToPlanner:true,addressReviewRequired:false});else Object.assign(o,{geoReleaseBypass:false,geoValidationMode:'validated_before_route',releaseToPlanner:!!o.geoValidated});made.push(o)}if(!made.length)throw new Error('No se creó ningún pedido');if(typeof routeCache!=='undefined')routeCache={};await saveState(`${made.length} pedido(s) asignados por Excel`);closeModal();renderPlanner();toast(`${made.length} pedido(s) asignados al mensajero`,'ok')}catch(e){toast(e?.message||'No se pudo importar la ruta','err')}}
function rapidOrder(o){return !!(o&&(o.geoReleaseBypass===true||o.geoValidationMode==='observed_delivery'))}
async function publishRouteWithRapidMode(mid,base){const date=selectedDate(),selected=sessionStorage.getItem('planCut')||'ALL',m=person(mid),rows=(STATE.orders||[]).filter(o=>o.date===date&&o.messengerId===mid&&!['Entregado','No entregado','Anulado','Cancelado'].includes(o.status)&&(selected==='ALL'||o.cut===selected));if(!m)return toast('Mensajero no encontrado','err');if(!rows.length)return toast('No hay gestiones asignadas para enviar','err');if(!rows.some(rapidOrder))return base(mid);const traditionalBlocked=rows.find(o=>!rapidOrder(o)&&(!(o.geoValidated===true)||!Number.isFinite(Number(o.lat))||!Number.isFinite(Number(o.lng))));if(traditionalBlocked)return toast(`${traditionalBlocked.orderNo||'Una gestión'} usa modo tradicional y todavía requiere validar su punto.`,'err');const now=new Date().toISOString(),ids=rows.map(o=>o.id);Object.assign(m,{routePublishedAt:now,routePublishedDate:date,routeAssignedAt:now,routeAssignedDate:date,routeStatus:'Pendiente',routeStartedAt:'',routeEndedAt:'',returnCediAt:''});rows.forEach(o=>{const hasGeo=o.geoValidated===true&&Number.isFinite(Number(o.lat))&&Number.isFinite(Number(o.lng));Object.assign(o,{routePublishedAt:now,routePublishedDate:date,publishedMessengerId:mid,publishedGeoValidated:hasGeo,publishedLat:hasGeo?Number(o.lat):null,publishedLng:hasGeo?Number(o.lng):null,publishedAddress:o.address||'',status:o.status==='Pendiente'?'Asignado':o.status});if(rapidOrder(o))Object.assign(o,{releaseApproved:true,releaseToPlanner:true,addressReviewRequired:false,geoObservedPending:!hasGeo,rapidRoutePublished:true,rapidRoutePublishedAt:now})});if(typeof routeCache!=='undefined')routeCache={};if(typeof r760Record==='function')r760Record('rapid_route_published',{date,messengerId:mid,cut:selected,orderIds:ids,gpsPending:rows.filter(o=>rapidOrder(o)&&o.geoObservedPending).map(o=>o.id),at:now});const saved=await saveState(`Ruta rápida enviada a ${m.name}`);if(saved===false)throw new Error('El servidor no guardó la ruta rápida.');let remote=null;try{remote=await api('/api/state')}catch{}if(remote){const rm=(remote.messengers||[]).find(x=>x.id===mid),confirmed=(remote.orders||[]).filter(o=>ids.includes(o.id));if(rm?.routePublishedDate!==date||confirmed.length!==ids.length||confirmed.some(o=>o.routePublishedDate!==date||o.publishedMessengerId!==mid))throw new Error('El servidor no confirmó la publicación completa de la ruta rápida.');STATE=remote}toast(`Ruta enviada a ${m.name}. Los puntos pendientes se capturarán con el GPS al entregar.`,'ok');renderPlanner()}
function clearManagementAssignment(o){if(!o)return;const removedAt=new Date().toISOString();Object.assign(o,{messengerId:'',assignedMessengerId:'',routeMessengerId:'',routeId:'',status:'Pendiente',routePosition:null,assignedAt:'',assignedBy:'',routeAssignedAt:'',routeAssignedBy:'',routeRemovedAt:removedAt,routeRemovedBy:ME?.username||''});['routePublishedAt','routePublishedDate','publishedMessengerId','publishedGeoValidated','publishedLat','publishedLng','publishedAddress','rapidRoutePublished','rapidRoutePublishedAt'].forEach(k=>delete o[k]);(STATE.masterOrders||[]).filter(x=>x.id===o.masterOrderId||x.operationalStopId===o.id||x.orderNo===o.orderNo).forEach(x=>{x.messengerId='';x.assignedMessengerId='';x.routeMessengerId='';x.routeId='';x.routePosition=null;x.routeRemovedAt=removedAt;x.status=x.status==='ready'?'ready':x.status});(STATE.sharedVisits||[]).forEach(v=>{v.orderIds=(v.orderIds||[]).filter(x=>x!==o.id);v.orderNos=(v.orderNos||[]).filter(x=>x!==o.orderNo)})}
function clearEmptyMessengerRoute(mid,date){if(!mid)return;const remaining=(STATE.orders||[]).some(o=>o.date===date&&o.messengerId===mid&&!['Entregado','No entregado','Anulado','Cancelado'].includes(o.status));if(remaining)return;const m=(STATE.messengers||[]).find(x=>x.id===mid);if(!m)return;['routePublishedAt','routePublishedDate','routeAssignedAt','routeAssignedDate','routeStartedAt','routeEndedAt','returnCediAt'].forEach(k=>{m[k]=''});m.routeStatus='Sin ruta';m.routeGpsKm=0;m.routeGpsMinutes=0}
async function unassignManagementComplete(id){let o=(STATE.orders||[]).find(x=>x.id===id);if(!o)return;if(['Entregado','No entregado'].includes(o.status))return toast('Una gestión ejecutada no puede quitarse de la ruta.','err');const previous=o.messengerId||o.assignedMessengerId||o.routeMessengerId||'',date=o.date,orderNo=o.orderNo;const apply=()=>{o=(STATE.orders||[]).find(x=>x.id===id);if(!o)return false;clearManagementAssignment(o);clearEmptyMessengerRoute(previous,date);return true};if(!apply())return toast('La gestión ya no está disponible.','err');STATE.routeLearning=STATE.routeLearning||[];STATE.routeLearning.push({type:'management_fully_unassigned',module:'planificador',at:new Date().toISOString(),orderId:id,orderNo,previousMessengerId:previous,changedBy:ME?.username||''});if(typeof routeCache!=='undefined')routeCache={};let saved=await saveState(`${orderNo} devuelto completamente a No asignados`);if(!saved&&apply())saved=await saveState(`${orderNo} devuelto completamente a No asignados`);if(!saved)return toast('No se pudo confirmar el cambio en el servidor. Intente nuevamente.','err');let remote=null;try{remote=await api('/api/state')}catch{}if(remote){let persisted=(remote.orders||[]).find(x=>x.id===id);if(persisted&&(persisted.messengerId||persisted.assignedMessengerId||persisted.routeMessengerId)){STATE=remote;if(apply())saved=await saveState(`${orderNo} devuelto completamente a No asignados`);if(!saved)return toast('El servidor no confirmó que la gestión saliera de la ruta.','err');try{remote=await api('/api/state')}catch{}persisted=(remote?.orders||[]).find(x=>x.id===id);if(persisted&&(persisted.messengerId||persisted.assignedMessengerId||persisted.routeMessengerId))return toast('El servidor todavía conserva la asignación. No se mostró un éxito falso.','err')}if(remote)STATE=remote}closeModal();renderPlanner();toast('Gestión quitada de la ruta y devuelta a No asignados.','ok')}
async function unassignManagementAtomic(id){const o=(STATE.orders||[]).find(x=>x.id===id);if(!o)return;if(['Entregado','No entregado'].includes(o.status))return toast('Una gestión ejecutada no puede quitarse de la ruta.','err');try{await api('/api/order/unassign',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId:id,orderNo:o.orderNo})});await loadState();if((STATE.orders||[]).find(x=>x.id===id)?.messengerId)throw new Error('El servidor no confirmó la revocación');if(typeof routeCache!=='undefined')routeCache={};closeModal();renderPlanner();toast('Gestión revocada en plataforma y móvil.','ok')}catch(e){toast(e?.message||'No se pudo revocar la gestión','err')}}
function gpsPointValid(p){return Number.isFinite(Number(p?.lat))&&Number.isFinite(Number(p?.lng))&&Number(p.lat)!==0&&Number(p.lng)!==0}
function drawObservedRoutes(){if(typeof map==='undefined'||!map||typeof L==='undefined')return;const date=selectedDate();for(const m of STATE.messengers||[]){const track=(m.gpsTrackDate===date&&Array.isArray(m.gpsTrack)?m.gpsTrack:[]).filter(gpsPointValid);if(track.length>1)L.polyline(track.map(p=>[Number(p.lat),Number(p.lng)]),{color:m.color||'#0969b8',weight:5,opacity:.95,dashArray:'10 4'}).addTo(map).bindPopup(`<b>${esc(m.name)}</b><br>Recorrido GPS real · ${Number(m.routeGpsKm||0).toFixed(2)} km`)}for(const o of STATE.orders||[]){if(o.date!==date||!rapidOrder(o))continue;const lat=Number(o.observedLat||o.arrivalLat),lng=Number(o.observedLng||o.arrivalLng);if(!lat||!lng)continue;L.circleMarker([lat,lng],{radius:8,color:'#fff',weight:3,fillColor:o.status==='Entregado'?'#087a55':'#0969b8',fillOpacity:1}).addTo(map).bindPopup(`<b>${esc(o.clientName||o.orderNo)}</b><br>Ubicación observada por GPS · ${esc(o.status||'En ruta')}`)}}
function actualMetrics(){document.querySelectorAll('.r765-route-card[data-mid]').forEach(card=>{const m=(STATE.messengers||[]).find(x=>x.id===card.dataset.mid);if(!m)return;const rawKm=Number(m.routeGpsKm||0),rawMin=Number(m.routeGpsMinutes||0),km=Number.isFinite(rawKm)&&rawKm>=0&&rawKm<=1000?rawKm:0,mins=Number.isFinite(rawMin)&&rawMin>=0&&rawMin<=1440?rawMin:0,metric=card.querySelector('.r765-route-metrics span:last-child');if(metric){metric.innerHTML=`<b>${km.toFixed(km?1:0)} km</b> · <b>${Math.max(0,Math.round(mins))} min</b> GPS real`;metric.title='Distancia y tiempo calculados únicamente con posiciones GPS reales válidas de la jornada'}})}
let gpsWatchId=null,gpsLastSent=0;
function startMessengerGps(){const p=new URLSearchParams(location.search),driver=p.get('driver'),token=p.get('token');if(!driver||!token||!navigator.geolocation||gpsWatchId!==null)return;gpsWatchId=navigator.geolocation.watchPosition(async pos=>{const now=Date.now();if(now-gpsLastSent<15000)return;gpsLastSent=now;try{await api('/api/public/driver-action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({driver,token,date:p.get('date')||localISODate(),action:'gpsPing',lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:pos.coords.accuracy,capturedAt:new Date(pos.timestamp||now).toISOString()})})}catch(e){console.warn('GPS operativo',e)}},{enableHighAccuracy:true,maximumAge:10000,timeout:20000})}
function removePlannerOverlayTitle(){document.querySelectorAll('#planMap *,.planner-map *').forEach(x=>{if(x.children.length===0&&x.textContent.trim()==='Pedidos y rutas')x.closest('div')?.remove()})}
function clearMode(){const shell=q('#appShell');if(!shell)return;document.documentElement.dataset.imfTheme='light';localStorage.setItem('imfTheme','light');document.body.classList.add('imf-clear-copy');document.body.classList.toggle('imf-module-planner',typeof CURRENT!=='undefined'&&CURRENT==='planner');q('#imfThemeToggle')?.remove()}
function approvedAccess(){if(!new URLSearchParams(location.search).has('access')||q('#appShell')||q('.imf-access-shell'))return;const oldButton=q('#loginBtn'),oldClick=oldButton?.onclick,oldKey=q('#lp')?.onkeydown;document.body.className='imf-approved-access';document.body.innerHTML=`<main class="imf-access-shell" aria-label="Acceso administrativo"><section class="imf-access-hero"><div class="imf-access-brand"><img src="site-assets/site-01.png" alt="IMFOHSA · The EXCELLENCE begins here"><h2>Plataforma Logística Integral</h2><p>Personas <b>•</b> Procesos <b>•</b> Entregas <b>•</b> Resultados</p></div></section><section class="imf-access-panel"><div class="imf-online"><span></span>Servidor en línea</div><div class="imf-access-card"><div class="imf-shield" aria-hidden="true">♙</div><h1>Acceso administrativo</h1><label for="lu">Usuario</label><div class="imf-access-input"><span aria-hidden="true">♙</span><input id="lu" autocomplete="username" placeholder="Usuario"></div><label for="lp">Contraseña</label><div class="imf-access-input"><span aria-hidden="true">♙</span><input id="lp" type="password" autocomplete="current-password" placeholder="Contraseña"><button type="button" id="imfPasswordToggle" aria-label="Mostrar contraseña">◉</button></div><button class="imf-access-submit" id="loginBtn">Ingresar <span>→</span></button><button class="imf-forgot" type="button" id="imfForgot">¿Olvidaste tu contraseña?</button></div></section></main>`;if(typeof ensureUiRoots==='function')ensureUiRoots();const button=q('#loginBtn'),password=q('#lp');button.onclick=typeof oldClick==='function'?oldClick:async()=>{try{ME=await api('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:q('#lu').value,password:password.value})});await loadState();await prepareOperationalDay();sessionStorage.setItem('globalDate',localISODate());adminApp();startRealtime()}catch(e){toast('Credenciales incorrectas','err')}};password.onkeydown=typeof oldKey==='function'?oldKey:e=>{if(e.key==='Enter')button.click()};q('#imfPasswordToggle').onclick=()=>{const show=password.type==='password';password.type=show?'text':'password';q('#imfPasswordToggle').textContent=show?'◌':'◉';q('#imfPasswordToggle').setAttribute('aria-label',show?'Ocultar contraseña':'Mostrar contraseña')};q('#imfForgot').onclick=()=>toast('Solicite el restablecimiento al administrador de la plataforma.','ok')}
window.r82915ApprovedAccess=approvedAccess;
function install(){if(window.__IMF_COPY_APPROVED)return;window.__IMF_COPY_APPROVED=true;const login=window.loginPage;if(typeof login==='function')window.loginPage=function(){const out=login();approvedAccess();return out};approvedAccess();clearMode();if(typeof r813Buckets==='function')window.r813Buckets=buckets;const syncBase=window.r712SyncOne;if(typeof syncBase==='function')window.r712SyncOne=function(o){const m=syncBase(o);if(rapidOrder(o)){const hasGeo=o.geoValidated===true&&Number.isFinite(Number(o.lat))&&Number.isFinite(Number(o.lng));o.releaseApproved=true;o.releaseToPlanner=true;o.addressReviewRequired=false;o.geoObservedPending=!hasGeo;o.releaseBlocks=(o.releaseBlocks||[]).filter(x=>!/ubicaci[oó]n|punto|mapa/i.test(String(x)));if(m){m.status='ready';m.releaseApproved=true;m.geo=m.geo||{};m.geo.observedPending=!hasGeo;m.geo.validationMode='observed_delivery'}}return m};const publishBase=window.r773PublishRoute;if(typeof publishBase==='function')window.r773PublishRoute=mid=>publishRouteWithRapidMode(mid,publishBase);const shareBase=window.shareDriver;if(typeof shareBase==='function')window.shareDriver=mid=>publishRouteWithRapidMode(mid,shareBase);if(typeof window.r773UnassignManagement==='function')window.r773UnassignManagement=unassignManagementAtomic;const dash=window.r813Dashboard;if(typeof dash==='function')window.r813Dashboard=function(){const out=dash();enhanceDashboard();return out};const resources=window.r810EnhanceResources;if(typeof resources==='function')window.r810EnhanceResources=function(shell,left){const out=resources(shell,left);routesOnly(shell);return out};const planner=window.renderPlanner;if(typeof planner==='function')window.renderPlanner=function(){const out=planner();addImport();setTimeout(()=>{addImport();routesOnly(q('.planner-shell'))},80);return out};const page=window.renderPage;if(typeof page==='function')window.renderPage=function(...args){const out=page.apply(this,args);clearMode();if(CURRENT==='dashboard')enhanceDashboard();if(CURRENT==='planner')addImport();return out};setTimeout(()=>{approvedAccess();clearMode();if(!q('#appShell'))return;if(typeof CURRENT!=='undefined'&&CURRENT==='dashboard'&&typeof r813Dashboard==='function')r813Dashboard();if(typeof CURRENT!=='undefined'&&CURRENT==='planner'&&typeof renderPlanner==='function')renderPlanner()},0)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
/* El botón histórico "Quitar de la ruta" llama unassignStop, mientras que el
   menú moderno llama r773UnassignManagement. Se unifican para que ninguno
   pueda dejar una asignación parcial que el tiempo real restaure después. */
window.unassignStop=unassignManagementAtomic;
window.__imfClearManagementAssignment=clearManagementAssignment;
})();

/* C21 · correcciones de origen conservando íntegra la copia aprobada.
   - Las reservas futuras no bloquean la disponibilidad actual.
   - Mensajeros muestra exclusivamente recorrido GPS/odómetro ejecutado.
   - El acceso administrativo queda oculto tras dos clics consecutivos en el logotipo público. */
(function(){
  const bootC21=()=>{
    if(window.__IMF_C21_ROOT_FIXES)return;window.__IMF_C21_ROOT_FIXES=true;
    const day=()=>String((typeof selectedDate==='function'&&selectedDate())||(typeof localISODate==='function'&&localISODate())||new Date().toISOString().slice(0,10)).slice(0,10);
    const assignmentDates=a=>({
      start:String(a?.date||a?.startDate||a?.start||'').slice(0,10),
      end:String(a?.returnDate||a?.endDate||a?.date||a?.startDate||a?.end||'').slice(0,10)
    });
    const activeAssignment=(vehicleId,referenceDate=day())=>{
      const ref=String(referenceDate).slice(0,10);
      return (STATE.panelAssignments||[]).filter(a=>{
        if(a.vehicleId!==vehicleId||/final|cancel|rechaz/i.test(String(a.status||'')))return false;
        const w=assignmentDates(a);return !!w.start&&w.start<=ref&&w.end>=ref
      }).sort((a,b)=>assignmentDates(b).start.localeCompare(assignmentDates(a).start))[0]||null
    };
    window.r776ActiveVehicleAssignment=activeAssignment;
    window.r776VehicleStatus=function(v){
      const ref=day(),maintenance=(STATE.panelAssignments||[]).find(a=>a.vehicleId===v.id&&/mantenimiento/i.test(String(a.status||a.maintenanceState||''))&&(()=>{const w=assignmentDates(a);return w.start<=ref&&w.end>=ref})());
      if(maintenance||/fuera de servicio/i.test(String(v.manualStatus||'')))return maintenance?'Mantenimiento':'Fuera de servicio';
      const a=activeAssignment(v.id,ref);return a?(/en uso|iniciad/i.test(String(a.status||''))?'En uso':'Asignado'):'Disponible'
    };
    const executed=(m,date=day())=>{
      if(!m)return {km:0,min:0};
      const trackDate=String(m.gpsTrackDate||'').slice(0,10),routeDate=String(m.routePublishedDate||m.routeAssignedDate||'').slice(0,10);
      if(trackDate!==date&&routeDate!==date)return {km:0,min:0};
      const safe=(value,max)=>{const n=Number(value);return Number.isFinite(n)&&n>=0&&n<=max?n:0};
      const gpsKm=trackDate===date?safe(m.routeGpsKm,1000):0,gpsMin=trackDate===date?safe(m.routeGpsMinutes,1440):0;
      const odoStart=Number(m.odometerStart),odoEnd=Number(m.odometerEnd),delta=odoEnd-odoStart;
      const odoKm=routeDate===date&&Number.isFinite(odoStart)&&Number.isFinite(odoEnd)&&odoStart>0&&delta>=0&&delta<=1000?delta:0;
      const closedKm=routeDate===date?safe(m.routeKmReal,1000):0;
      // GPS manda durante la ruta; al cerrarla se admite el odómetro de la misma
      // jornada. Nunca se usa la lectura total ni el mayor valor histórico.
      const km=gpsKm>0?gpsKm:(odoKm>0?odoKm:closedKm);
      return {km,min:Math.max(0,Math.round(gpsMin))}
    };
    const rowBase=window.r819MessengerRow;
    if(typeof rowBase==='function')window.r819MessengerRow=function(m,date){
      const html=rowBase(m,date),metric=executed(m,date),box=document.createElement('template');box.innerHTML=html.trim();const card=box.content.firstElementChild;
      const km=card?.querySelector('[data-r819-stat="plan"]'),kmLabel=km?.parentElement?.querySelector('span'),time=card?.querySelector('[data-r819-stat="delay"]'),timeLabel=time?.parentElement?.querySelector('span');
      if(km)km.textContent=`${metric.km.toLocaleString('es-GT',{maximumFractionDigits:1})} km`;if(kmLabel)kmLabel.textContent='Km recorridos';
      if(time)time.textContent=`${metric.min} min`;if(timeLabel)timeLabel.textContent='Tiempo recorrido';if(time)time.classList.remove('warn');
      return card?.outerHTML||html
    };
    let hiddenAccessClicks=0,hiddenAccessAt=0;
    const isPublicLogo=target=>{const img=target?.closest?.('img');return !!(img&&/imfohsa/i.test(`${img.alt||''} ${img.src||''}`))};
    const openHiddenAccess=()=>{const url=new URL(location.origin+location.pathname);url.searchParams.set('access','1');url.searchParams.set('v','82915c26');location.assign(url.toString())};
    const hiddenAccessHandler=event=>{
      if(document.querySelector('#appShell')||new URLSearchParams(location.search).has('access')||!isPublicLogo(event.target))return;
      event.preventDefault();event.stopPropagation();
      const now=Date.now();hiddenAccessClicks=now-hiddenAccessAt<=1400?hiddenAccessClicks+1:1;hiddenAccessAt=now;
      if(hiddenAccessClicks>=2){hiddenAccessClicks=0;openHiddenAccess()}
    };
    if(!window.__IMF_HIDDEN_ACCESS_DELEGATED){window.__IMF_HIDDEN_ACCESS_DELEGATED=true;document.addEventListener('click',hiddenAccessHandler,true)}
    const publicAccess=()=>{
      if(document.querySelector('#appShell')||new URLSearchParams(location.search).has('access'))return;
      [...document.querySelectorAll('a,button')].forEach(el=>{if(/^\s*Acceso operativo\s*$/i.test(el.textContent||''))el.remove()});
      const logo=[...document.querySelectorAll('header img,img')].find(img=>/imfohsa/i.test(`${img.alt||''} ${img.src||''}`));
      const target=logo?.closest('a')||logo;if(!target)return;target.style.cursor='default';target.removeAttribute('href');target.onclick=null
    };
    const renderBase=window.renderPage;
    if(typeof renderBase==='function')window.renderPage=function(...args){const out=renderBase.apply(this,args);setTimeout(publicAccess,0);return out};
    const observer=new MutationObserver(()=>{if(new URLSearchParams(location.search).has('access'))window.r82915ApprovedAccess?.();else publicAccess()});observer.observe(document.documentElement,{subtree:true,childList:true});if(new URLSearchParams(location.search).has('access'))window.r82915ApprovedAccess?.();else publicAccess();
  };
  /* Se instala después de las capas históricas para que ninguna definición
     antigua vuelva a imponerse sobre estas reglas finales. */
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(bootC21,300),{once:true});else setTimeout(bootC21,300);
})();

/* R8.29.15 copia clara — recorrido observado y métricas GPS reales. */
(function(){
  const boot=()=>{
    if(window.__IMF_GPS_OPERATIONAL)return;window.__IMF_GPS_OPERATIONAL=true;
    const reconcileRemoved=()=>{const state=window.STATE;if(!state)return;for(const e of state.routeLearning||[]){if(!/management_(?:fully_)?unassigned|r773_management_unassigned/.test(String(e.type||'')))continue;const o=(state.orders||[]).find(x=>x.id===e.orderId||x.orderNo===e.orderNo);if(!o)continue;const removed=Date.parse(e.at||0),assigned=Date.parse(o.assignedAt||o.routeAssignedAt||0);if((!assigned||removed>=assigned)&&typeof window.__imfClearManagementAssignment==='function')window.__imfClearManagementAssignment(o)}};
    const loadBase=window.loadState;if(typeof loadBase==='function')window.loadState=async function(...args){const r=await loadBase.apply(this,args);if(window.STATE?.settings)STATE.settings.panelRequestAdvanceDays='0';reconcileRemoved();return r};if(window.STATE?.settings)STATE.settings.panelRequestAdvanceDays='0';reconcileRemoved();
    const rapid=o=>!!(o&&(o.geoReleaseBypass===true||o.geoValidationMode==='observed_delivery'));
    const mapBase=window.drawPlannerMap;
    if(typeof mapBase==='function')window.drawPlannerMap=async function(){
      const held=[],date=selectedDate(),cut=sessionStorage.getItem('planCut')||'ALL';
      (window.STATE?.orders||[]).filter(o=>o.date===date&&(rapid(o)||(cut!=='ALL'&&String(o.cut||'')!==cut))).forEach(o=>{held.push([o,o.lat,o.lng]);o.lat=null;o.lng=null});
      try{await mapBase()}finally{held.forEach(([o,lat,lng])=>{o.lat=lat;o.lng=lng})}
      if(typeof map!=='undefined'&&map&&window.L){
        for(const m of STATE.messengers||[]){const track=(m.gpsTrackDate===selectedDate()&&Array.isArray(m.gpsTrack)?m.gpsTrack:[]).filter(p=>Number(p?.lat)&&Number(p?.lng));if(track.length>1)L.polyline(track.map(p=>[+p.lat,+p.lng]),{color:m.color||'#0969b8',weight:5,opacity:.95,dashArray:'10 4'}).addTo(map).bindPopup(`<b>${esc(m.name)}</b><br>Recorrido GPS real · ${Number(m.routeGpsKm||0).toFixed(2)} km`)}
        for(const o of STATE.orders||[]){if(o.date!==selectedDate()||!rapid(o)||(cut!=='ALL'&&String(o.cut||'')!==cut))continue;const lat=Number(o.observedLat||o.arrivalLat),lng=Number(o.observedLng||o.arrivalLng);if(lat&&lng)L.circleMarker([lat,lng],{radius:8,color:'#fff',weight:3,fillColor:o.status==='Entregado'?'#087a55':'#0969b8',fillOpacity:1}).addTo(map).bindPopup(`<b>${esc(o.clientName||o.orderNo)}</b><br>Ubicación observada por GPS`) }
      }
      document.querySelectorAll('#planMap *,.planner-map *').forEach(x=>{if(x.children.length===0&&x.textContent.trim()==='Pedidos y rutas')x.closest('div')?.remove()});
    };
    const plannerBase=window.renderPlanner;
    if(typeof plannerBase==='function')window.renderPlanner=function(){const r=plannerBase();setTimeout(()=>{document.querySelectorAll('.r765-route-card[data-mid]').forEach(card=>{const m=(STATE.messengers||[]).find(x=>x.id===card.dataset.mid);if(!m)return;const absent=typeof messengerDayStatus==='function'&&messengerDayStatus(m.id,selectedDate())==='Ausente';card.hidden=absent;card.style.display=absent?'none':'';if(absent)return;const km=Number(m.routeGpsKm||0),mins=Number(m.routeGpsMinutes||0),metric=card.querySelector('.r765-route-metrics span:last-child');if(metric){metric.innerHTML=`<b>${km.toFixed(km?1:0)} km</b> · <b>${Math.max(0,Math.round(mins))} min</b> GPS real`;metric.title='Distancia y tiempo calculados únicamente con posiciones GPS reales'}})},120);return r};
    const saveBase=window.saveState;
    if(typeof saveBase==='function')window.saveState=async function(message,...rest){
      if(/Horarios|disponibilidad/i.test(String(message||''))&&typeof dailyAvailability==='function'){
        const date=selectedDate(),availability=dailyAvailability(date);
        for(const o of STATE.orders||[]){if(o.date!==date||!o.messengerId||availability[o.messengerId]!=='Ausente'||['Entregado','No entregado','Anulado'].includes(o.status))continue;const previous=o.messengerId;Object.assign(o,{messengerId:'',assignedMessengerId:'',routeMessengerId:'',routePosition:null,status:'Pendiente',needsReassignment:true,reassignmentReason:'Mensajero ausente'});STATE.routeLearning=STATE.routeLearning||[];STATE.routeLearning.push({type:'unassigned_absent_messenger',date,orderId:o.id,previousMessengerId:previous,at:new Date().toISOString()})}
      }
      return saveBase.call(this,message,...rest)
    };
    const requestBase=window.panelRequestApp;
    if(typeof requestBase==='function')window.panelRequestApp=function(){const r=requestBase();setTimeout(()=>{const today=typeof localISODate==='function'?localISODate():new Date().toISOString().slice(0,10);['rqDate','rqReturnDate'].forEach(id=>{const e=document.getElementById(id);if(e)e.min=today});document.querySelectorAll('.mobile-top p,.veh-form-card .insight').forEach(e=>{e.innerHTML=e.innerHTML.replace(/(?:mínimo|regla:)\s*7\s*días[^.<]*/gi,'Disponible desde hoy, sujeto a disponibilidad y ausencia de conflictos')})},0);return r};
    /* La copia aprobada elimina la espera obligatoria de siete días también en
       el formulario público por áreas (r8127), no solamente en el servidor. */
    if(typeof window.r8127BindUrgency==='function')window.r8127BindUrgency=function(){
      const select=document.getElementById('rqUrgency'),fields=document.getElementById('r8127EmergencyFields'),notice=document.getElementById('r8127UrgencyNotice');
      if(!select||!notice)return;
      const refresh=()=>{
        const emergency=select.value==='emergency';
        if(fields)fields.hidden=!emergency;
        notice.className='r779-field r779-wide r8127-notice '+(emergency?'emergency':'');
        notice.innerHTML=emergency?'<b>Emergencia.</b> Logística validará prioridad y disponibilidad.':'<b>Solicitud regular.</b> Puede solicitarse desde hoy; la asignación depende de disponibilidad y ausencia de conflictos.';
        const date=document.getElementById('rqDate'),ret=document.getElementById('rqReturnDate'),today=typeof localISODate==='function'?localISODate():new Date().toISOString().slice(0,10);
        if(date)date.min=today;if(ret)ret.min=today;
      };
      select.onchange=refresh;refresh();
    };
    if(new URLSearchParams(location.search).has('request')){
      const rewriteRequestCopy=()=>{
        const replacements=[
          [/Norma general:\s*7 días calendario de anticipación\.?/gi,'Disponible desde hoy, sujeto a disponibilidad.'],
          [/Si existe una emergencia, seleccione la excepción y complete la justificación para revisión de Logística\.?/gi,'Las solicitudes se validan en tiempo real según disponibilidad y conflictos.'],
          [/¿Por qué no pudo solicitarse con 7 días de anticipación\?/gi,'Motivo de la prioridad'],
          [/incumple el plazo normal/gi,'requiere atención prioritaria'],
          [/mínimo\s*7\s*días(?: calendario)? de anticipación/gi,'disponibilidad desde hoy'],
          [/regla de\s*7\s*días/gi,'disponibilidad desde hoy']
        ];
        const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
        while((node=walker.nextNode())){let value=node.nodeValue;for(const [from,to] of replacements)value=value.replace(from,to);if(value!==node.nodeValue)node.nodeValue=value}
        const today=typeof localISODate==='function'?localISODate():new Date().toISOString().slice(0,10);
        ['rqDate','rqReturnDate'].forEach(id=>{const e=document.getElementById(id);if(e)e.min=today});
      };
      new MutationObserver(rewriteRequestCopy).observe(document.documentElement,{subtree:true,childList:true});
      setTimeout(rewriteRequestCopy,0);
    }
    /* El atraso de salida queda en auditoría, pero deja de ser una alerta activa
       cuando la ruta ya inició o fue cerrada. */
    const alertsBase=window.dashboardAlerts;
    if(typeof alertsBase==='function')window.dashboardAlerts=function(...args){return alertsBase.apply(this,args).filter(x=>!/registraron (?:retraso de salida|salida tardía)/i.test(String(x)))};
    /* La bitácora y la ficha de Mensajeros usan recorrido ejecutado. Nunca se
       presenta como recorrido un kilometraje calculado al liberar la ruta. */
    const realKmFor=(m,date)=>{
      if(!m)return 0;
      const same=!m.routePublishedDate||m.routePublishedDate===date||m.gpsTrackDate===date;
      if(!same)return 0;
      if(m.routeEndedAt&&Number(m.routeKmReal)>0)return Number(m.routeKmReal);
      if(m.gpsTrackDate===date&&Number(m.routeGpsKm)>0)return Number(m.routeGpsKm);
      return 0;
    };
    const realMinutesFor=(m,date)=>{
      if(!m)return 0;
      const same=!m.routePublishedDate||m.routePublishedDate===date||m.gpsTrackDate===date;
      if(!same)return 0;
      if(m.routeEndedAt)return 0;
      return m.gpsTrackDate===date?Math.max(0,Math.round(Number(m.routeGpsMinutes||0))):0;
    };
    const monthlyRealKm=(mid,month)=>{
      const sessions=(STATE.routeLearning||[]).filter(x=>x&&x.type==='r770_route_session'&&x.messengerId===mid&&String(x.date||x.at||'').slice(0,7)===month);
      const byDate=new Map();
      sessions.forEach(x=>{const d=String(x.date||x.at||'').slice(0,10),km=Number(x.routeKmReal||x.km||x.distanceKm||0);if(d&&km>=0)byDate.set(d,Math.max(Number(byDate.get(d)||0),km))});
      for(const m of STATE.messengers||[]){if(m.id!==mid)continue;const d=String(m.routePublishedDate||m.gpsTrackDate||'').slice(0,10);if(d.startsWith(month)){const km=realKmFor(m,d);if(km>0)byDate.set(d,Math.max(Number(byDate.get(d)||0),km))}}
      return [...byDate.values()].reduce((sum,km)=>sum+Number(km||0),0);
    };
    const monthlyBase=window.r819MonthlyFuelData;
    if(typeof monthlyBase==='function')window.r819MonthlyFuelData=function(mid,month){
      const out=monthlyBase(mid,month)||{},km=monthlyRealKm(mid,month);
      if(km<=0)return out;
      const rate=Number(STATE.settings?.depreciationPerKm||.37),galRate=Number(STATE.settings?.fuelPrice||STATE.settings?.fuelPricePerGallon||0),m=(STATE.messengers||[]).find(x=>x.id===mid),eff=Number(m?.fuelEfficiencyKmGal||STATE.settings?.motoKmPerGallon||96);
      out.km=km;out.totalKm=km;out.depreciation=km*rate;
      if(!Number(out.fuel||out.fuelAmount||0)&&galRate>0&&eff>0){out.fuel=km/eff*galRate;out.fuelAmount=out.fuel}
      out.total=Number(out.fuel||out.fuelAmount||0)+Number(out.depreciation||0);
      return out
    };
    const applyExecutedMetrics=()=>{
      const date=typeof selectedDate==='function'?selectedDate():localISODate();
      document.querySelectorAll('[data-r818-mid]').forEach(card=>{
        const m=(STATE.messengers||[]).find(x=>x.id===card.dataset.r818Mid);if(!m)return;
        const plan=card.querySelector('[data-r819-stat="plan"]'),label=plan?.parentElement?.querySelector('span');
        if(plan)plan.textContent=`${realKmFor(m,date).toLocaleString('es-GT',{minimumFractionDigits:0,maximumFractionDigits:1})} km`;
        if(label)label.textContent='Km recorridos';
        const delay=card.querySelector('[data-r819-stat="delay"]');
        if(delay&&(m.routeEndedAt||realKmFor(m,date)===0)){delay.textContent=`${realMinutesFor(m,date)} min`;delay.classList.remove('warn');delay.title=m.routeEndedAt?'Ruta cerrada; el atraso histórico queda solo en auditoría':'Sin recorrido GPS ejecutado'}
      })
    };
    const applyImmediateVehicleRequests=()=>{
      if(window.STATE?.settings)STATE.settings.panelRequestAdvanceDays='0';
      const field=document.getElementById('stPanelDays');
      if(field){field.value='0';field.setAttribute('value','0')}
      document.querySelectorAll('label').forEach(label=>{
        if(/Anticipaci[oó]n solicitud (?:panel|veh[ií]culo)/i.test(label.textContent||''))label.textContent='Anticipación solicitud vehículo (días · 0 = desde hoy)'
      });
    };
    /* Una reserva futura no cambia el estado operativo de hoy. */
    window.r776ActiveVehicleAssignment=function(vehicleId,referenceDate){
      const date=String(referenceDate||((typeof selectedDate==='function'&&selectedDate())||localISODate())).slice(0,10);
      return (STATE.panelAssignments||[]).filter(a=>a.vehicleId===vehicleId&&!/final|cancel|rechaz/i.test(String(a.status||''))&&String(a.date||a.startDate||'').slice(0,10)<=date&&String(a.returnDate||a.endDate||a.date||a.startDate||'').slice(0,10)>=date).sort((a,b)=>String(b.date||b.startDate||'').localeCompare(String(a.date||a.startDate||'')))[0]||null
    };
    /* El tablero solo debe alertar por salidas pendientes de la fecha visible.
       Las asignaciones históricas permanecen en auditoría, pero no generan
       falsos avisos de "no ha iniciado ruta" en el día actual. */
    const dashboardAlertsBase=window.dashboardAlerts;
    if(typeof dashboardAlertsBase==='function')window.dashboardAlerts=function(date){
      const operativeDate=String(date||((typeof selectedDate==='function'&&selectedDate())||localISODate())).slice(0,10);
      const hidden=[];
      (window.STATE?.messengers||[]).forEach(m=>{
        if(m.routeAssignedAt&&String(m.routeAssignedDate||'').slice(0,10)!==operativeDate){
          hidden.push([m,m.routeAssignedAt]);
          m.routeAssignedAt='';
        }
      });
      try{return dashboardAlertsBase.call(this,operativeDate)}
      finally{hidden.forEach(([m,value])=>{m.routeAssignedAt=value})}
    };
    const pageBase=window.renderPage;
    if(typeof pageBase==='function')window.renderPage=function(...args){
      if(window.STATE?.settings)STATE.settings.panelRequestAdvanceDays='0';
      const result=pageBase.apply(this,args);
      setTimeout(()=>{applyExecutedMetrics();applyImmediateVehicleRequests()},0);
      return result
    };
    setTimeout(applyImmediateVehicleRequests,0);
    const p=new URLSearchParams(location.search),driver=p.get('driver'),token=p.get('token');
    if(driver&&token&&navigator.geolocation){let last=0;navigator.geolocation.watchPosition(async pos=>{if(Date.now()-last<15000)return;last=Date.now();try{await api('/api/public/driver-action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({driver,token,date:p.get('date')||localISODate(),action:'gpsPing',lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:pos.coords.accuracy,capturedAt:new Date(pos.timestamp||Date.now()).toISOString()})})}catch(e){console.warn('GPS operativo',e)}},{enableHighAccuracy:true,maximumAge:10000,timeout:20000})}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});else setTimeout(boot,0);
})();
