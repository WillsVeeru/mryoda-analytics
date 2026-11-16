/* Presentation-only sample values. Never write these into saved targets or actual snapshots. */
(() => {
  'use strict';
  const hash=value=>[...value].reduce((seed,char)=>(Math.imul(seed,31)+char.charCodeAt(0))>>>0,17);
  function target(person,month,metric='revenue'){
    const source=window.dashboardTargets;
    if(person.source!=='demo'||!source.validMonth(month))return null;
    if(metric==='tests')return Math.round(target(person,month)/600);
    if(person.scope==='pro'&&source.catalog.some(entry=>entry.id===person.id))return 50000*source.daysInMonth(month);
    const seed=hash(person.scope+':'+person.id),season=Number(month.slice(5))+Number(month.slice(0,4))*12;
    const base=person.scope==='accountManager'?600000:person.scope==='salesRep'?300000:800000;
    return base+(seed%9)*50000+(season%5)*25000;
  }
  function actual(person,month,elapsed,days,metric='revenue'){
    if(person.source!=='demo')return null;
    if(!elapsed)return 0;
    const seed=hash(person.scope+':'+person.id+':'+month);
    const pace=[.76,.9,1,1.12,1.28,1.48,1.7,1.95,2.12,2.3][seed%10];
    return Math.round(target(person,month,metric)*pace*elapsed/days);
  }
  window.targetsAlertsSample=Object.freeze({target,actual});
})();
