/* Date/scope handoff only for explicit View report links from Home. */
(()=>{
  'use strict';
  const params=new URLSearchParams(location.search),kind=params.get('homeSource');
  if(!['revenue','operations','branches','cost','targets'].includes(kind))return;
  const from=params.get('homeFrom'),to=params.get('homeTo'),valid=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&Number.isFinite(+new Date(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
  if(!valid(from)||!valid(to)||from>to||(new Date(to)-new Date(from))/86400000>=3660)return;
  const field=id=>document.getElementById(id),set=(id,value)=>{const element=field(id);if(element&&(!element.options||[...element.options].some(option=>option.value===value)))element.value=value;};
  if(kind==='targets'){
    if(!window.targetsAlertsPage)return;
    set('targetReportMetric',params.get('homeMetric')==='tests'?'tests':'revenue');field('targetReportMetric')?.dispatchEvent(new Event('change',{bubbles:true}));return;
  }
  if(kind==='cost'){
    if(typeof financialModule==='undefined'||!window.dashboardFinancialData)return;
    set('coFrom',from);set('coTo',to);const city=params.get('homeCity')||'All';
    if(city==='All'||window.dashboardFinancialData.centers.some(row=>row.name===city)){set('coCity',city==='All'?'all':city);financialMultiFilters.set('coCity',city==='All'?null:new Set([city]));}
    financialModule='Cost Analysis';financialExpenseView='overview';renderCenterOverview();
    field('financialModules')?.querySelectorAll('button').forEach((button,index)=>button.setAttribute('aria-selected',String(index===1)));
    return;
  }
  set('homeFrom',from);set('homeTo',to);
  if(kind==='revenue'&&window.revenuePdfSource&&typeof refreshHome==='function')refreshHome();
  if(kind==='operations'&&window.tatOperations)window.tatOperations.refresh();
  if(kind==='branches'&&window.locationExplorerPage){set('locationCity',params.get('homeCity')||'All');set('locationCentre',params.get('homeBranch')||'All');window.locationExplorerPage.refresh();}
})();
