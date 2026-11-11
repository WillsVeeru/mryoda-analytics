/* Shared sample-data filter helpers for the common analytics header. */
window.testsMultiFilters=window.testsMultiFilters||Object.create(null);
window.analyticsFilterMatches=function(id,value){let selected=window.testsMultiFilters[id],field=document.getElementById(id);return selected?selected.has(value):!field||field.value==='All'||field.value===value};
window.analyticsScopeFactor=function(){let weights={centre:.22,clientType:.35,client:.4,moreCity:.22,moreZone:.35,moreCategory:.24,moreDoctor:.25,moreRep:.34},factor=1;Object.entries(weights).forEach(([id,weight])=>{let field=document.getElementById(id);if(!field)return;let options=Array.from(field.options).filter(option=>option.value!=='All').map(option=>option.value),selected=window.testsMultiFilters[id];if(selected){factor*=selected.size===options.length?1:Math.min(1,selected.size*weight)}else if(field.value!=='All')factor*=weight});return factor};
window.analyticsSpecialtyMatches=function(order){let centre=order.centre,city=centre==='MR YODA'?'Hyderabad':centre==='YODA LIFELINE DIAGNOSTICS'?'Bengaluru':centre,zone={Hyderabad:'South',Bengaluru:'South',Chennai:'South',Mumbai:'West',Delhi:'North'}[city]||'South',category=String(order.department||'').toLowerCase()==='immunology'?'SEROLOGY / IMMUNOLOGY':String(order.department||'').toUpperCase(),doctor=order.doctor==='Self'?'Self / Walk-in':order.doctor==='Demo Doctor A'?'DEEPTHI RAJU':order.doctor,staffIndex=Number(String(order.staff).match(/\d+/)?.[0]||1),rep=['Demo Sales Rep A','Demo Sales Rep B','Demo Sales Rep C'][(staffIndex-1)%3];return analyticsFilterMatches('centre',city)&&analyticsFilterMatches('clientType',order.clientType)&&analyticsFilterMatches('client',order.client)&&analyticsFilterMatches('moreCity',city)&&analyticsFilterMatches('moreZone',zone)&&analyticsFilterMatches('moreCategory',category)&&analyticsFilterMatches('moreDoctor',doctor)&&analyticsFilterMatches('moreRep',rep)};

window.analyticsToday=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
window.analyticsWeekStart=function(value){let date=new Date(value+'T00:00:00Z');date.setUTCDate(date.getUTCDate()-(date.getUTCDay()+6)%7);return date.toISOString().slice(0,10)};

// A city cannot belong to conflicting centre, city and zone selections.
const analyticsOriginalScopeFactor=window.analyticsScopeFactor;
window.analyticsScopeFactor=function(){
  const cities={Hyderabad:'South',Bengaluru:'South',Chennai:'South',Mumbai:'West',Delhi:'North'};
  const locationFields=['centre','moreCity','moreZone'];
  if(locationFields.some(id=>document.getElementById(id))&&!Object.entries(cities).some(([city,zone])=>
    analyticsFilterMatches('centre',city)&&analyticsFilterMatches('moreCity',city)&&analyticsFilterMatches('moreZone',zone)))return 0;
  return analyticsOriginalScopeFactor();
};
