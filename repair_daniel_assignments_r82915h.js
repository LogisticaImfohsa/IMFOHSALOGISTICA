const fs=require('fs');
const path=require('path');
const dataPath=path.join(__dirname,'data','state.json');
const backupPath=path.join(__dirname,'data',`state.pre_r82915h_${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
const state=JSON.parse(fs.readFileSync(dataPath,'utf8'));
const targetIds=new Set([
  'o_intake_1792783416595_ba37',
  'o_intake_1792783417282_aed5',
  'o_intake_1792783416568_6cec',
  'o_intake_1792783416630_1cee',
  'o_intake_1792783416613_468a'
]);
const changed=[];
for(const order of state.orders||[]){
  if(!targetIds.has(order.id))continue;
  if(order.date!=='2026-10-23'||order.cut!=='14:00'||order.messengerId!=='m_daniel'||['Entregado','No entregado','Anulado'].includes(order.status))throw new Error(`Estado inesperado para ${order.orderNo||order.id}; reparación cancelada.`);
  changed.push({id:order.id,orderNo:order.orderNo,clientName:order.clientName});
}
if(changed.length!==targetIds.size)throw new Error(`Se esperaban ${targetIds.size} pedidos y se encontraron ${changed.length}; reparación cancelada.`);
fs.copyFileSync(dataPath,backupPath);
const now=new Date().toISOString();
for(const order of state.orders||[]){
  if(!targetIds.has(order.id))continue;
  order.previousMessengerId='m_daniel';order.messengerId='';order.status='Pendiente';order.routePosition=null;
  order.routePublishedAt='';order.routePublishedDate='';order.publishedMessengerId='';order.publishedRoutePosition=null;
  order.assignmentChangedAt=now;order.assignmentChangeReason='Retirado de la ruta de Daniel; devuelto al planificador';
}
const daniel=(state.messengers||[]).find(m=>m.id==='m_daniel');
if(daniel){daniel.routeRevision=Number(daniel.routeRevision||0)+1;daniel.routeUpdatedAt=now}
state.routeLearning=state.routeLearning||[];
state.routeLearning.push({type:'assignment_sync_repair',version:'R8.29.15h',at:now,messengerId:'m_daniel',date:'2026-10-23',removedOrderIds:[...targetIds],reason:'Cinco gestiones del corte 14:00 seguían asignadas después de retirarlas desde el planificador'});
fs.writeFileSync(dataPath,JSON.stringify(state,null,2)+'\n','utf8');
console.log(JSON.stringify({ok:true,backupPath,changed},null,2));
