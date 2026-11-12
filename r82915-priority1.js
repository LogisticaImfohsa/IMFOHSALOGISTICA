/* R8.29.15 Prioridad 1
   Persistencia canonica, filtros completos y mensajeros del turno.
   Este archivo no sustituye el estado: usa operaciones atomicas del servidor. */
(()=>{
  'use strict';

  const finalStatuses=new Set(['Entregado','No entregado']);
  const selectedDateSafe=()=>typeof selectedDate==='function'?selectedDate():new Date().toISOString().slice(0,10);
  const selectedCut=()=>sessionStorage.getItem('planCut')||'ALL';
  const normalizeCut=value=>String(value||'').replace(/^Corte(?:\s+operativo)?\s*:\s*/i,'').trim();
  const cutMatches=(order,cut=selectedCut())=>cut==='ALL'||normalizeCut(order?.cut)===normalizeCut(cut);
  const deletingManagements=new Set();

  async function deleteManagementAtomic(id){
    if(deletingManagements.has(id))return;
    const order=(window.STATE?.orders||[]).find(item=>item.id===id);
    if(!order)return;
    if(finalStatuses.has(order.status))return toast('Las gestiones ejecutadas se conservan por auditoria.','err');
    if(!confirm(`¿Eliminar definitivamente la gestion ${order.orderNo||''}? Se retirara del Planificador y del movil; la copia de auditoria se conservara.`))return;
    deletingManagements.add(id);
    try{
      const response=await fetch('/api/order/delete',{
        method:'POST',
        credentials:'same-origin',
        cache:'no-store',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({orderId:id,orderNo:order.orderNo})
      });
      const raw=await response.text();
      let result={};
      try{result=raw?JSON.parse(raw):{}}catch{}
      if(!response.ok||result?.ok===false){
        throw new Error(result?.error||raw||`Error ${response.status} al eliminar la gestion`);
      }
      await loadState();
      if((window.STATE?.orders||[]).some(item=>item.id===id)){
        throw new Error('El servidor no confirmo la eliminacion');
      }
      if(typeof routeCache!=='undefined')routeCache={};
      if(typeof closeModal==='function')closeModal();
      if(typeof renderPlanner==='function')renderPlanner();
      toast('Gestion eliminada definitivamente de la operacion y del movil.','ok');
    }catch(error){
      toast(error?.message||'No se pudo eliminar la gestion','err');
    }finally{
      deletingManagements.delete(id);
    }
  }

  function applyTurnVisibility(){
    if(typeof CURRENT!=='undefined'&&CURRENT!=='planner')return;
    const date=selectedDateSafe();
    document.querySelectorAll('.r765-route-card[data-mid],.route-card[data-mid]').forEach(card=>{
      const mid=card.dataset.mid||card.dataset.messengerId||'';
      const absent=mid&&typeof messengerDayStatus==='function'&&messengerDayStatus(mid,date)==='Ausente';
      card.hidden=!!absent;
      card.style.display=absent?'none':'';
      if(absent)return;
      const count=card.querySelectorAll('[data-oid],.r765-stop').length;
      const status=card.querySelector('.r765-route-status');
      if(status)status.textContent=count?'Ruta asignada':'Sin ruta';
    });
  }

  function install(){
    // Eliminar y quitar de ruta son operaciones distintas y atomicas.
    window.r773DeleteManagement=deleteManagementAtomic;
    window.r716DeleteOrder=deleteManagementAtomic;

    // Un unico comparador de corte alimenta lista, mapa, contadores y rutas.
    const filteredBase=window.filteredOrdersFinal;
    if(typeof filteredBase==='function'&&!filteredBase.__priority1){
      const wrapped=function(centerId,daypart,date,cut){
        return filteredBase(centerId,daypart,date,cut).filter(order=>cutMatches(order,cut));
      };
      wrapped.__priority1=true;
      window.filteredOrdersFinal=wrapped;
    }

    // Los recorridos/entregas observados tambien respetan el corte seleccionado.
    window.drawObservedRoutes=function(){
      if(typeof map==='undefined'||!map||typeof L==='undefined')return;
      const date=selectedDateSafe(),cut=selectedCut();
      for(const messenger of STATE.messengers||[]){
        const applicable=(STATE.orders||[]).some(order=>order.date===date&&order.messengerId===messenger.id&&cutMatches(order,cut));
        if(!applicable)continue;
        const track=(messenger.gpsTrackDate===date&&Array.isArray(messenger.gpsTrack)?messenger.gpsTrack:[])
          .filter(point=>Number(point?.lat)&&Number(point?.lng));
        if(track.length>1)L.polyline(track.map(point=>[Number(point.lat),Number(point.lng)]),{
          color:messenger.color||'#0969b8',weight:5,opacity:.95,dashArray:'10 4'
        }).addTo(map).bindPopup(`<b>${esc(messenger.name)}</b><br>Recorrido observado`);
      }
      for(const order of STATE.orders||[]){
        if(order.date!==date||!cutMatches(order,cut))continue;
        const lat=Number(order.observedLat||order.arrivalLat),lng=Number(order.observedLng||order.arrivalLng);
        if(!lat||!lng)continue;
        L.circleMarker([lat,lng],{radius:8,color:'#fff',weight:3,fillColor:order.status==='Entregado'?'#087a55':'#0969b8',fillOpacity:1})
          .addTo(map).bindPopup(`<b>${esc(order.clientName||order.orderNo)}</b><br>${esc(order.status||'En ruta')}`);
      }
    };

    const plannerBase=window.renderPlanner;
    if(typeof plannerBase==='function'&&!plannerBase.__priority1){
      const wrapped=function(...args){
        const result=plannerBase.apply(this,args);
        setTimeout(applyTurnVisibility,0);
        return result;
      };
      wrapped.__priority1=true;
      window.renderPlanner=wrapped;
    }
    applyTurnVisibility();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
