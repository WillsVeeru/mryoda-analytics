/* One browser-saved target source shared by Financial Overview and Targets & Alerts. */
(() => {
  'use strict';
  const key='mryoda-pro-targets-v1',snapshotKey='mryoda-pro-actuals-v1';
  const branches=[['hyderabad','Hyderabad','Akshay Reddy','Swathi Rao'],['bengaluru','Bengaluru','Pranav Rao','Anita Hegde'],['chennai','Chennai','Sathish Raman','Lakshmi Iyer'],['mumbai','Mumbai','Vivek Shah','Riya Patil'],['delhi','Delhi','Mohit Sharma','Simran Kapoor']];
  const catalog=Object.freeze(branches.flatMap(([centerId,branch,...names])=>names.map((name,i)=>Object.freeze({id:centerId.toUpperCase()+'-PRO0'+(i+1),centerId,branch,name}))));
  let memory={targets:{}};let lastSnapshot=null,memoryOnly=false;
  const read=()=>{if(!memoryOnly)try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved&&saved.targets&&typeof saved.targets==='object')memory=saved;}catch{}return memory;};
  const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&Number.isFinite(+new Date(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
  const validMonth=month=>/^\d{4}-\d{2}$/.test(month||'')&&validDate(month+'-01');
  const daysInMonth=month=>new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).getUTCDate();
  function monthly(proId,month){
    if(!catalog.some(p=>p.id===proId)||!validMonth(month))return null;
    const targets=read().targets,id=proId+':'+month;
    if(Object.hasOwn(targets,id)){const value=targets[id];return value===null?null:Number.isFinite(value)&&value>=0?value:null;}
    // Preserve the existing demo baseline until an edited monthly target is saved.
    return 50000*daysInMonth(month);
  }
  function getPeriodTarget(proId,from,to){
    if(!validDate(from)||!validDate(to)||from>to||!catalog.some(p=>p.id===proId))return null;
    const end=new Date(to+'T00:00:00Z');let cursor=new Date(from+'T00:00:00Z'),total=0;
    while(cursor<=end){
      const month=cursor.toISOString().slice(0,7),amount=monthly(proId,month);if(amount===null)return null;
      const last=new Date(Date.UTC(cursor.getUTCFullYear(),cursor.getUTCMonth()+1,0)),cut=last<end?last:end,days=Math.round((cut-cursor)/86400000)+1;
      total+=amount*days/daysInMonth(month);cursor=new Date(Date.UTC(cursor.getUTCFullYear(),cursor.getUTCMonth()+1,1));
    }
    return Math.round(total);
  }
  function setMonthlyTarget(proId,month,amount){
    if(!catalog.some(p=>p.id===proId)||!validMonth(month)||amount!==null&&(!Number.isFinite(amount)||amount<0))throw Error('Choose a valid PRO, month and nonnegative target.');
    const data=read();data.targets[proId+':'+month]=amount;let saved=true;
    try{localStorage.setItem(key,JSON.stringify(data));}catch{saved=false;memoryOnly=true;}
    window.dispatchEvent(new Event('dashboardtargetschange'));return saved;
  }
  function assess(actual,target){
    if(target===null||!Number.isFinite(target))return{shortfall:null,excess:null,status:'No target',tone:'neutral'};
    if(actual===null||!Number.isFinite(actual))return{shortfall:null,excess:null,status:'Actual unavailable',tone:'neutral'};
    const difference=actual-target;
    return{shortfall:Math.max(0,-difference),excess:Math.max(0,difference),status:difference>0?'Above target':difference<0?'Below target':'Target met',tone:difference<0?'warning':'positive'};
  }
  function captureActuals({from,to,records,centerIds,scope}){
    if(!validDate(from)||!validDate(to)||from>to)return;
    const ids=new Set(centerIds),eligible=catalog.filter(p=>ids.has(p.centerId)).map(p=>p.id),actuals=Object.fromEntries(eligible.map(id=>[id,0]));
    for(const row of records)if(Object.hasOwn(actuals,row.proId)&&Number.isFinite(row.net))actuals[row.proId]+=row.net;
    lastSnapshot={from,to,actuals,scope,capturedAt:new Date().toISOString()};
    try{localStorage.setItem(snapshotKey,JSON.stringify(lastSnapshot));}catch{memoryOnly=true;}
  }
  function getSnapshot(){if(!memoryOnly)try{const saved=JSON.parse(localStorage.getItem(snapshotKey)||'null');if(saved&&validDate(saved.from)&&validDate(saved.to)&&saved.actuals)lastSnapshot=saved;}catch{}return lastSnapshot;}
  function link(url){
    // File previews have separate storage per document. Carry state only on local-file links.
    if(typeof location==='undefined'||location.protocol!=='file:')return url;
    const index=url.indexOf('#'),base=index<0?url:url.slice(0,index),hash=index<0?'':url.slice(index);
    return base+(base.includes('?')?'&':'?')+'_targetsState='+encodeURIComponent(JSON.stringify({targets:read().targets,snapshot:getSnapshot()}))+hash;
  }
  if(typeof location!=='undefined'&&location.protocol==='file:')try{
    const raw=new URLSearchParams(location.search).get('_targetsState');
    if(raw){
      const imported=JSON.parse(raw),targets=read().targets;
      for(const [id,value]of Object.entries(imported.targets||{})){
        const split=id.lastIndexOf(':'),proId=id.slice(0,split),month=id.slice(split+1);
        if(catalog.some(p=>p.id===proId)&&validMonth(month)&&(value===null||Number.isFinite(value)&&value>=0))targets[id]=value;
      }
      try{localStorage.setItem(key,JSON.stringify(memory));}catch{memoryOnly=true;}
      const snapshot=imported.snapshot;
      if(snapshot&&validDate(snapshot.from)&&validDate(snapshot.to)&&snapshot.from<=snapshot.to&&snapshot.actuals){
        const actuals={};for(const pro of catalog)if(Object.hasOwn(snapshot.actuals,pro.id)&&Number.isFinite(snapshot.actuals[pro.id]))actuals[pro.id]=snapshot.actuals[pro.id];
        lastSnapshot={from:snapshot.from,to:snapshot.to,actuals,scope:String(snapshot.scope||'Financial Overview selection'),capturedAt:snapshot.capturedAt};
        try{localStorage.setItem(snapshotKey,JSON.stringify(lastSnapshot));}catch{memoryOnly=true;}
      }
    }
  }catch{}
  window.dashboardTargets={key,snapshotKey,catalog,validDate,validMonth,monthly,getPeriodTarget,setMonthlyTarget,assess,captureActuals,getSnapshot,link};
})();
