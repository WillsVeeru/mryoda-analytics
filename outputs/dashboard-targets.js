/* One browser-saved target source shared by Financial Overview and Targets & Alerts. */
(() => {
  'use strict';
  const key='mryoda-pro-targets-v1',snapshotKey='mryoda-pro-actuals-v1';
  const branches=[['hyderabad','Hyderabad','Akshay Reddy','Swathi Rao'],['bengaluru','Bengaluru','Pranav Rao','Anita Hegde'],['chennai','Chennai','Sathish Raman','Lakshmi Iyer'],['mumbai','Mumbai','Vivek Shah','Riya Patil'],['delhi','Delhi','Mohit Sharma','Simran Kapoor']];
  const catalog=Object.freeze(branches.flatMap(([centerId,branch,...names])=>names.map((name,i)=>Object.freeze({id:centerId.toUpperCase()+'-PRO0'+(i+1),centerId,branch,name}))));
  const repNames={hyderabad:['Vamshi Reddy','Nisha Rao'],bengaluru:['Rohan Hegde','Deepa Nair'],chennai:['Harini Ravi','Surya Kumar'],mumbai:['Aditi Shah','Kunal Desai'],delhi:['Tanya Kapoor','Aman Sethi']};
  const scopeLabels=Object.freeze({pro:'PRO',accountManager:'Account Manager',salesRep:'Sales Rep'});
  const people=Object.freeze([
    ...(window.targetReferencePeople||[]),
    ...catalog.map(person=>Object.freeze({...person,scope:'pro'})),
    ...['accountManager','salesRep'].flatMap(scope=>branches.flatMap(([centerId,branch])=>repNames[centerId].map((name,index)=>Object.freeze({id:centerId.toUpperCase()+'-SR0'+(index+1),centerId,branch,name,scope}))))
  ]);
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
  function savedTarget(scope,personId,month){
    if(!validMonth(month)||!people.some(person=>person.scope===scope&&person.id===personId))return null;
    const legacy=scope==='pro'&&catalog.some(person=>person.id===personId);
    const data=read(),id=legacy?personId+':'+month:scope+':'+personId+':revenue:'+month;
    const value=(legacy?data.targets:data.scopedTargets||{})[id];
    return Number.isFinite(value)&&value>=0?value:null;
  }
  function setScopedTarget(scope,personId,month,amount){
    if(!validMonth(month)||!people.some(person=>person.scope===scope&&person.id===personId)||!Number.isSafeInteger(amount)||amount<0)throw Error('Choose a valid scope, person, month and whole-rupee target.');
    if(scope==='pro'&&catalog.some(person=>person.id===personId))return setMonthlyTarget(personId,month,amount);
    const data=read();data.scopedTargets=data.scopedTargets||{};data.scopedTargets[scope+':'+personId+':revenue:'+month]=amount;let saved=true;
    try{localStorage.setItem(key,JSON.stringify(data));}catch{saved=false;memoryOnly=true;}
    window.dispatchEvent(new Event('dashboardtargetschange'));return saved;
  }
  function savedTargets(month){return people.flatMap(person=>{const target=savedTarget(person.scope,person.id,month);return target===null?[]:[{...person,target,metric:'revenue'}];});}
  function actualFor(scope,personId,from,to){const snapshot=getSnapshot();if(!snapshot||snapshot.from!==from||snapshot.to!==to)return null;const values=scope==='pro'?snapshot.actuals:snapshot.scopeActuals?.[scope];return values&&Object.hasOwn(values,personId)&&Number.isFinite(values[personId])?values[personId]:null;}
  function captureActuals({from,to,records,centerIds,scope}){
    if(!validDate(from)||!validDate(to)||from>to)return;
    const ids=new Set(centerIds),eligible=catalog.filter(p=>ids.has(p.centerId)).map(p=>p.id),actuals=Object.fromEntries(eligible.map(id=>[id,0]));
    for(const row of records)if(Object.hasOwn(actuals,row.proId)&&Number.isFinite(row.net))actuals[row.proId]+=row.net;
    const scopeActuals={};
    for(const [role,field]of [['accountManager','accountManagerId'],['salesRep','representativeId']]){
      const scoped=people.filter(person=>person.scope===role&&ids.has(person.centerId));
      const known=new Set(scoped.map(person=>person.id));
      if(!records.some(row=>known.has(row[field])))continue;
      const values=Object.fromEntries(scoped.map(person=>[person.id,0]));
      for(const row of records)if(Object.hasOwn(values,row[field])&&Number.isFinite(row.net))values[row[field]]+=row.net;
      scopeActuals[role]=values;
    }
    lastSnapshot={from,to,actuals,scopeActuals,scope,capturedAt:new Date().toISOString()};
    try{localStorage.setItem(snapshotKey,JSON.stringify(lastSnapshot));}catch{memoryOnly=true;}
  }
  function getSnapshot(){if(!memoryOnly)try{const saved=JSON.parse(localStorage.getItem(snapshotKey)||'null');if(saved&&validDate(saved.from)&&validDate(saved.to)&&saved.actuals)lastSnapshot=saved;}catch{}return lastSnapshot;}
  function link(url){
    // File previews have separate storage per document. Carry state only on local-file links.
    if(typeof location==='undefined'||location.protocol!=='file:')return url;
    const index=url.indexOf('#'),base=index<0?url:url.slice(0,index),hash=index<0?'':url.slice(index);
    return base+(base.includes('?')?'&':'?')+'_targetsState='+encodeURIComponent(JSON.stringify({targets:read().targets,scopedTargets:read().scopedTargets||{},snapshot:getSnapshot()}))+hash;
  }
  if(typeof location!=='undefined'&&location.protocol==='file:')try{
    const raw=new URLSearchParams(location.search).get('_targetsState');
    if(raw){
      const imported=JSON.parse(raw),targets=read().targets;
      for(const [id,value]of Object.entries(imported.targets||{})){
        const split=id.lastIndexOf(':'),proId=id.slice(0,split),month=id.slice(split+1);
        if(catalog.some(p=>p.id===proId)&&validMonth(month)&&(value===null||Number.isFinite(value)&&value>=0))targets[id]=value;
      }
      memory.scopedTargets=memory.scopedTargets||{};
      for(const [id,value]of Object.entries(imported.scopedTargets||{})){
        const [scope,personId,metric,month,...extra]=id.split(':');
        if(!extra.length&&!(scope==='pro'&&catalog.some(person=>person.id===personId))&&people.some(person=>person.scope===scope&&person.id===personId)&&metric==='revenue'&&validMonth(month)&&Number.isSafeInteger(value)&&value>=0)memory.scopedTargets[id]=value;
      }
      try{localStorage.setItem(key,JSON.stringify(memory));}catch{memoryOnly=true;}
      const snapshot=imported.snapshot;
      if(snapshot&&validDate(snapshot.from)&&validDate(snapshot.to)&&snapshot.from<=snapshot.to&&snapshot.actuals){
        const actuals={};for(const pro of catalog)if(Object.hasOwn(snapshot.actuals,pro.id)&&Number.isFinite(snapshot.actuals[pro.id]))actuals[pro.id]=snapshot.actuals[pro.id];
        const scopeActuals={};for(const role of ['accountManager','salesRep']){const values={};for(const person of people.filter(person=>person.scope===role))if(Object.hasOwn(snapshot.scopeActuals?.[role]||{},person.id)&&Number.isFinite(snapshot.scopeActuals[role][person.id]))values[person.id]=snapshot.scopeActuals[role][person.id];scopeActuals[role]=values;}
        lastSnapshot={from:snapshot.from,to:snapshot.to,actuals,scopeActuals,scope:String(snapshot.scope||'Financial Overview selection'),capturedAt:snapshot.capturedAt};
        try{localStorage.setItem(snapshotKey,JSON.stringify(lastSnapshot));}catch{memoryOnly=true;}
      }
    }
  }catch{}
  window.dashboardTargets={key,snapshotKey,catalog,people,scopeLabels,validDate,validMonth,daysInMonth,monthly,getPeriodTarget,setMonthlyTarget,savedTarget,setScopedTarget,savedTargets,actualFor,assess,captureActuals,getSnapshot,link};
})();
