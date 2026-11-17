(()=>{
  'use strict';
  const $=id=>document.getElementById(id),source=window.homeDashboardModel,icon=window.dashboardIcon;
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const number=value=>value===null||value===undefined?'\u2014':Number(value).toLocaleString('en-IN',{maximumFractionDigits:1});
  const money=value=>value===null||value===undefined?'\u2014':'\u20b9'+Math.round(value).toLocaleString('en-IN');
  const signed=(value,metric='revenue')=>value===null?'\u2014':(value>0?'+':value<0?'\u2212':'')+(metric==='tests'?number(Math.abs(value)):money(Math.abs(value)));
  const date=value=>source.validDate(value)?new Date(value+'T00:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}):'Choose valid dates';
  const range=value=>value&&source.validRange(value)?date(value.start)+(value.start===value.end?'':' \u2013 '+date(value.end)):'Choose valid dates';
  const state={filters:{mode:'latest',from:window.revenuePdfSource.sourceFrom,to:window.revenuePdfSource.sourceTo,city:'All',branch:'All'},targetMonth:source.today().slice(0,7),metric:'revenue',branches:{page:1,size:5,sort:6,asc:false},targets:{page:1,size:5,sort:null,asc:true}};
  let model;
  function reportLink(kind,period){
    const pages={revenue:'revenue-sales.html',operations:'tat-operations.html',branches:'location-explorer.html',cost:'center-overview.html'};
    const query=new URLSearchParams({homeSource:kind,homeFrom:period.start,homeTo:period.end});
    if(['branches','cost'].includes(kind)){query.set('homeCity',state.filters.city);query.set('homeBranch',state.filters.branch);}
    return pages[kind]+'?'+query.toString()+(kind==='cost'?'#coWorkspaceCharts':'');
  }
  const presets=[['latest','Latest reports'],['today','Today'],['yesterday','Yesterday'],['week','Last 7 days'],['month','Month to date'],['last30','Last 30 days'],['quarter','Quarter to date'],['year','Year to date']];
  const options=values=>'<option value="All">All</option>'+values.map(value=>'<option value="'+esc(value)+'">'+esc(value)+'</option>').join('');
  function branchOptions(){const previous=$('homeBranch').value;$('homeBranch').innerHTML=options(window.locationExplorerData.centres.filter(row=>$('homeCity').value==='All'||row[1]===$('homeCity').value).map(row=>row[0]));$('homeBranch').value=[...$('homeBranch').options].some(option=>option.value===previous)?previous:'All';}
  function dateFields(mode){const selected=mode==='selected';$('homeDateFields').hidden=!selected;for(const id of ['homeFrom','homeTo']){$(id).disabled=!selected;$(id).required=selected;}}
  function pending(){dateFields($('homeViewMode').value);$('homeFilterState').textContent='Apply filters to update';}
  function apply(){
    const next={mode:$('homeViewMode').value,from:$('homeFrom').value,to:$('homeTo').value,city:$('homeCity').value,branch:$('homeBranch').value};
    if(next.mode==='selected'&&!source.validRange({start:next.from,end:next.to})){$('homeError').hidden=false;$('homeError').textContent='Choose valid dates, with From on or before To, within ten years.';return false;}
    state.filters=next;state.branches.page=state.targets.page=1;$('homeError').hidden=true;render();return true;
  }
  function setPreset(key){
    $('homeViewMode').value=key==='latest'?'latest':'selected';
    const period=key==='latest'?{start:window.revenuePdfSource.sourceFrom,end:window.revenuePdfSource.sourceTo}:source.preset(key);
    $('homeFrom').value=period.start;$('homeTo').value=period.end;apply();
  }
  function reset(){ $('homeCity').value='All';branchOptions();$('homeBranch').value='All';state.targetMonth=source.today().slice(0,7);state.metric='revenue';$('homeTargetMonth').value=state.targetMonth;$('homeTargetMetric').value=state.metric;setPreset('latest'); }
  function emptyChart(host,message){host.innerHTML='<div class="home-chart-empty"><p>'+esc(message)+'</p><button type="button" class="home-btn" data-home-latest>Latest reports</button></div>';}
  function renderBusiness(){
    const revenue=model.revenue,totals=revenue.totals;
    $('homeScope').textContent=(state.filters.branch!=='All'?state.filters.branch:state.filters.city!=='All'?state.filters.city:'All branches')+' \u00b7 '+(model.latest?'Latest available reports':range(revenue.range));
    $('homeViewDescription').textContent=model.latest?'Each section shows its reporting period.':'Selected dates apply where report data is available.';
    $('homeNet').textContent=money(totals?.net);$('homeGross').textContent=money(totals?.gross);$('homeDiscount').textContent=money(totals?.discount);$('homeRefunds').textContent=money(totals?.refunds);
    $('homeRevenuePeriod').textContent=(revenue.available?'Revenue period: ':'Revenue available: ')+range(revenue.available?revenue.range:{start:window.revenuePdfSource.sourceFrom,end:window.revenuePdfSource.sourceTo});
    const before=model.baseline?.totals;
    $('homeNetChange').hidden=!totals||!before;
    if(totals&&before){const change=totals.net-before.net;$('homeNetChange').dataset.direction=change<0?'decrease':change>0?'increase':'flat';$('homeNetChange').textContent=signed(change)+(before.net?' ('+(change>0?'+':'')+(change/before.net*100).toFixed(1)+'%)':'')+' vs prior equal-length period';}
    const metrics=[
      ['Bills',totals?.bills??null,'Receipt',reportLink('revenue',revenue.range),totals?.bills?'Average bill '+money(totals.net/totals.bills):'Revenue & Sales',revenue.range,false],
      ['Patient Visits',totals?.patients??null,'Users',reportLink('revenue',revenue.range),'Reported visits \u00b7 Revenue & Sales',revenue.range,false],
      ['Tests',model.tests.value,'FlaskConical',reportLink('branches',model.tests.range),model.tests.filtered?'Available branch rows':'Location Explorer',model.tests.range,false],
      ['Operating Expenses',model.finance.totals?.operating??null,'Banknote',reportLink('cost',model.finance.range),state.filters.branch!=='All'?'Available at city level':'Financial Overview',model.finance.range,true]
    ];
    $('homeKPIs').innerHTML=metrics.map(([label,value,name,href,note,period,currency])=>'<section class="revenue-kpi"><span class="restored-kpi-icon" aria-hidden="true">'+icon(name)+'</span><h2><a href="'+href+'">'+label+'</a></h2><strong>'+esc(currency?money(value):number(value))+'</strong><p data-kpi-note>'+esc(note)+'<br>'+esc(range(period))+'</p></section>').join('');
    $('homeTrendPeriod').textContent=(model.latest?'Reporting period: ':'Selected period: ')+range(revenue.range);
    $('homePaymentPeriod').textContent=(model.latest?'Reporting period: ':'Selected period: ')+range(model.payment.range);
    if(revenue.available){
      const charts=window.dashboardReportCharts;if(!charts.states.has('home-revenue'))charts.states.set('home-revenue',{type:'Line',category:0,value:3,top:'All'});
      charts.render($('homeRevenueChart'),{key:'home-revenue',title:'Revenue performance',columns:['Date','Gross revenue','Discount','Net revenue'],types:['date','money','money','money'],metric:3,valueIndices:[1,2,3],chronological:true,rows:revenue.rows.map(row=>[row[0],row[3],row[4],row[8]]),format:money,close:''});
    }else emptyChart($('homeRevenueChart'),model.filtered?'Revenue totals are available for all branches.':'Revenue is available for '+range({start:window.revenuePdfSource.sourceFrom,end:window.revenuePdfSource.sourceTo})+'.');
    if(model.payment.available){
      const charts=window.dashboardReportCharts;if(!charts.states.has('home-payment'))charts.states.set('home-payment',{type:'Pie',category:0,value:2,top:'All'});
      const palette=['#35b34a','#2da6d9','#8b4ac4','#efa124','#36aca0','#d57698','#7c91b0'];
      charts.render($('homePaymentChart'),{key:'home-payment',title:'How patients pay',columns:['Payment mode','Receipts','Amount'],types:['text','number','money'],metric:2,valueIndices:[1,2],colors:Object.fromEntries(model.payment.rows.map((row,index)=>[row[0],palette[index%palette.length]])),rows:model.payment.rows,format:(value,type)=>type==='money'?money(value):number(value),close:''});
    }else emptyChart($('homePaymentChart'),'Payment totals are available for all branches, '+range({start:window.revenuePdfSource.sourceFrom,end:window.revenuePdfSource.sourceTo})+'.');
    for(const name of ['revenue','payment'])document.querySelector('[data-home-export="'+name+'"]').disabled=!model[name].available;
  }
  function renderOperations(){
    $('homeOperationsPeriod').textContent=(model.latest?'Reporting period: ':'Selected period: ')+range(model.operations.range);
    $('homeOperationsNote').textContent=model.operations.available?'':'Operational totals are available for all branches, '+range({start:window.tatOperationsData.from,end:window.tatOperationsData.to})+'.';
    $('homeOperations').innerHTML=model.operations.items.map(item=>'<article class="home-operation"><i aria-hidden="true">'+icon(item.icon)+'</i><span>'+item.label+'</span><strong>'+esc(item.value===null?'\u2014':number(item.value)+(item.type==='hours'?'h':''))+'</strong></article>').join('');
  }
  function compare(a,b,asc){if(a===null||a===undefined)return b===null||b===undefined?0:1;if(b===null||b===undefined)return -1;return(typeof a==='number'&&typeof b==='number'?a-b:String(a).localeCompare(String(b),undefined,{numeric:true}))*(asc?1:-1);}
  function sortedRows(kind){
    const paging=state[kind],rows=[...(kind==='branches'?model.branches.rows:model.targets.rows)];
    if(paging.sort!==null){const value=row=>kind==='branches'?row[paging.sort]:[row.name,window.dashboardTargets.scopeLabels[row.scope],row.target,row.actual,row.difference,row.status][paging.sort];rows.sort((a,b)=>compare(value(a),value(b),paging.asc));}
    return rows;
  }
  function paging(kind,count){
    const value=state[kind],pages=Math.max(1,Math.ceil(count/value.size));value.page=Math.max(1,Math.min(value.page,pages));
    const start=(value.page-1)*value.size,end=Math.min(count,start+value.size);
    $('home'+(kind==='branches'?'Branch':'Target')+'Paging').innerHTML='<span role="status">'+(count?'Showing '+(start+1)+'\u2013'+end+' of '+count+' available rows':'0 rows')+'</span><div class="home-page-buttons"><label>Rows<select data-home-size="'+kind+'" aria-label="Rows per page">'+[5,10,25].map(size=>'<option'+(size===value.size?' selected':'')+'>'+size+'</option>').join('')+'</select></label>'+[['first','First page',1,'\u00ab'],['previous','Previous page',value.page-1,'\u2039'],['next','Next page',value.page+1,'\u203a'],['last','Last page',pages,'\u00bb']].map(([action,label,page,symbol],index)=>(index===2?'<span>Page '+value.page+' of '+pages+'</span>':'')+'<button class="home-btn" type="button" data-home-page="'+kind+'" data-page="'+page+'" aria-label="'+label+'"'+((index<2?value.page===1:value.page===pages)?' disabled':'')+'>'+symbol+'</button>').join('')+'</div>';
    return{start,end};
  }
  function headers(kind,columns){return columns.map(([label,index,align,tone])=>'<th data-column-align="'+align+'"'+(tone?' data-home-tone="'+tone+'"':'')+' aria-sort="'+(state[kind].sort===index?(state[kind].asc?'ascending':'descending'):'none')+'"><button type="button" data-home-sort="'+kind+'" data-index="'+index+'">'+label+'<span aria-hidden="true">'+(state[kind].sort===index?(state[kind].asc?'\u2191':'\u2193'):'\u2195')+'</span></button></th>').join('');}
  function renderBranches(){
    const rows=sortedRows('branches'),page=paging('branches',rows.length),table=$('homeBranchTable');
    $('homeBranchesPeriod').textContent=(model.latest?'Reporting period: ':'Selected period: ')+range(model.branches.range);
    table.tHead.innerHTML='<tr>'+headers('branches',[['Branch',0,'left',''],['Bills',3,'center','result'],['Tests',4,'center','deduction'],['Revenue',6,'right','inflow']])+'</tr>';
    table.tBodies[0].innerHTML=rows.slice(page.start,page.end).map(row=>'<tr><td>'+esc(row[0])+'<small>'+esc(row[1])+'</small></td><td data-home-tone="result">'+number(row[3])+'</td><td data-home-tone="deduction">'+number(row[4])+'</td><td data-home-tone="inflow">'+money(row[6])+'</td></tr>').join('')||'<tr><td colspan="4" class="home-empty">'+esc(model.branches.available?'No available branch rows match these filters.':'Branch reporting is available for '+range({start:window.locationExplorerData.from,end:window.locationExplorerData.to})+'.')+'</td></tr>';
    document.querySelector('[data-home-export="branches"]').disabled=!rows.length;
  }
  function renderTargets(){
    const target=model.targets,rows=sortedRows('targets'),page=paging('targets',rows.length),table=$('homeTargetTable'),tests=state.metric==='tests',validMonth=window.dashboardTargets.validMonth(target.month);
    $('homeTargetsPeriod').textContent='Monthly targets: '+(window.dashboardTargets.validMonth(target.month)?new Date(target.month+'-01T00:00:00Z').toLocaleDateString('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}):'Choose a valid month')+(target.elapsed?' \u00b7 Actuals through '+date(target.to):'');
    $('homeTargetSummary').textContent=!validMonth?'Choose a valid target month.':target.available?rows.length+' targets \u00b7 '+rows.filter(row=>row.status==='Shortfall').length+' shortfalls \u00b7 '+rows.filter(row=>row.status==='Excess').length+' excesses \u00b7 '+rows.filter(row=>row.status==='Awaiting activity').length+' awaiting activity'+(rows.some(row=>row.hasSample)?' \u00b7 Includes labelled sample values':''):'Branch-specific target activity is not available.';
    const numeric=tests?'center':'right';table.tHead.innerHTML='<tr>'+headers('targets',[['Person',0,'left',''],['Scope',1,'left',''],['Target',2,numeric,'benchmark'],[tests?'Tests':'Net revenue',3,numeric,'inflow'],['Difference',4,numeric,'inflow'],['Status',5,'left','']])+'</tr>';
    table.tBodies[0].innerHTML=rows.slice(page.start,page.end).map(row=>'<tr><td>'+esc(row.name)+(row.designation?'<small>'+esc(row.designation)+'</small>':'')+(row.hasSample?'<span class="home-target-sample">Sample '+(row.sampleTarget&&row.sampleActual?'values':row.sampleActual?'activity':'target')+'</span>':'')+'</td><td>'+esc(window.dashboardTargets.scopeLabels[row.scope])+'</td><td data-home-tone="benchmark">'+(tests?number(row.target):money(row.target))+'</td><td data-home-tone="inflow">'+(tests?number(row.actual):money(row.actual))+'</td><td data-home-tone="inflow" class="home-difference '+(row.difference<0?'negative':row.difference>0?'positive':'')+'">'+signed(row.difference,state.metric)+'</td><td><span class="home-status-pill '+(row.status==='Shortfall'?'warning':['Excess','Target met'].includes(row.status)?'positive':'')+'">'+row.status+'</span></td></tr>').join('')||'<tr><td colspan="6" class="home-empty">'+(!validMonth?'Choose a valid target month.':target.available?'No saved '+(tests?'test-count':'revenue')+' targets for this month.':'Clear the branch filter to view saved monthly targets.')+'</td></tr>';
    document.querySelector('[data-home-export="targets"]').disabled=!rows.length;
    const targetQuery=new URLSearchParams({to:target.to||source.today(),homeSource:'targets',homeFrom:target.from||source.today(),homeTo:target.to||source.today(),homeMetric:state.metric});
    $('homeTargetsLink').href=window.dashboardTargets.link('targets-alerts.html?'+targetQuery.toString());
  }
  function renderFormulas(){
    const totals=model.revenue.totals,cost=model.finance.totals;
    const net=totals&&totals.gross-totals.discount+totals.refunds===totals.net?'<p class="home-calculation">'+money(totals.gross)+' \u2212 '+money(totals.discount)+' + ('+money(totals.refunds)+') = '+money(totals.net)+'</p>':'';
    $('homeFormulaScope').textContent='Revenue: '+range(model.revenue.range)+' \u00b7 Operations: '+range(model.operations.range);
    $('homeFormulaContent').innerHTML='<article><h3>Net revenue</h3><p>Gross revenue \u2212 discounts + signed refunds. Refunds are already included in the reported net value.</p>'+net+'</article><article><h3>Average bill value</h3><p>Net revenue \u00f7 bills.</p>'+(totals?.bills?'<p class="home-calculation">'+money(totals.net)+' \u00f7 '+number(totals.bills)+' = '+money(totals.net/totals.bills)+'</p>':'')+'</article><article><h3>Operating expenses</h3><p>Regular operating expenses + expansion operating expenses. Salaries are counted once; capital expenses are shown separately in Financial Overview.</p>'+(cost?'<p class="home-calculation">'+money(cost.regularOperating)+' + '+money(cost.expansionOperating)+' = '+money(cost.operating)+'</p>':'')+'</article><article><h3>Target difference</h3><p>Actual activity \u2212 monthly target. A negative difference is Shortfall; a positive difference is Excess. Sample activity and targets are labelled and never saved as actual records. Available recorded activity takes priority, including zero. Missing activity remains unavailable. Current-month results are provisional until month-end.</p></article><article><h3>Reporting periods</h3><p>Latest reports uses each section\u2019s available reporting period. Selected dates updates the metrics supported by that range and scope. Comparisons require complete data for both periods.</p></article>';
  }
  function render(){
    model=source.build({...state.filters,targetMonth:state.targetMonth,metric:state.metric});
    dateFields(state.filters.mode);$('homeFilterState').textContent=model.latest?'Section reporting periods':'Filters applied';
    document.querySelectorAll('[data-home-range]').forEach(button=>{const key=button.dataset.homeRange,period=key==='latest'?null:source.preset(key);button.setAttribute('aria-pressed',String(key==='latest'?model.latest:!model.latest&&state.filters.from===period.start&&state.filters.to===period.end));});
    renderBusiness();renderOperations();renderBranches();renderTargets();renderFormulas();
    for(const link of document.querySelectorAll('[data-home-report]')){const kind=link.dataset.homeReport;link.href=reportLink(kind,kind==='revenue'?model.revenue.range:kind==='operations'?model.operations.range:model.branches.range);}
  }
  function download(kind){
    let headers,rows,period;
    if(kind==='revenue'){headers=['Date','Bills','Patient visits','Gross revenue','Discount','Routine net revenue','Specialty revenue','Refunds (signed)','Net revenue'];rows=model.revenue.rows;period=model.revenue.range;}
    if(kind==='payment'){headers=['Payment mode','Receipts','Amount'];rows=model.payment.rows;period=model.payment.range;}
    if(kind==='branches'){headers=['Branch','City','Model','Bills','Tests','Patient visits','Revenue'];rows=sortedRows(kind);period=model.branches.range;}
    if(kind==='targets'){headers=['Target person key','Person','Scope','Month','Metric','Target','Actual','Difference','Status','Target source','Actual source'];rows=sortedRows(kind).map(row=>[row.id,row.name,window.dashboardTargets.scopeLabels[row.scope],model.targets.month,state.metric,row.target,row.actual,row.difference,row.status,row.sampleTarget?'Sample':'Saved',row.sampleActual?'Sample':row.actual===null?'Unavailable':'Financial Overview']);period={start:model.targets.month,end:model.targets.month};}
    if(!rows?.length)return;
    const csv='\uFEFF'+[headers,...rows].map(row=>row.map(value=>'"'+(typeof value==='number'?String(value):String(value??'').replace(/^[=+@-]/,match=>"'"+match)).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),link=document.createElement('a');link.href=url;link.download='Home-'+kind+'-'+period.start+'-to-'+period.end+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  $('homeFrom').value=state.filters.from;$('homeTo').value=state.filters.to;$('homeTargetMonth').value=state.targetMonth;
  $('homeCity').innerHTML=options([...new Set([...window.locationExplorerData.centres.map(row=>row[1]),...window.dashboardFinancialData.centers.map(row=>row.name)])].sort());$('homeCity').value='All';branchOptions();
  $('homePresets').innerHTML=presets.map(([key,label])=>'<button type="button" data-home-range="'+key+'" aria-pressed="'+(key==='latest')+'">'+label+'</button>').join('');
  document.querySelectorAll('[data-home-icon]').forEach(node=>node.innerHTML=icon(node.dataset.homeIcon));
  let chartFitQueued=false;
  function fitCharts(){
    if(chartFitQueued)return;chartFitQueued=true;
    requestAnimationFrame(()=>{chartFitQueued=false;const size=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dashboard-caption-size'))||12;
      document.querySelectorAll('.home-report-chart .report-chart-visual svg').forEach(svg=>{
        if(!svg.dataset.homeViewBox){svg.dataset.homeViewBox=svg.getAttribute('viewBox');const box=svg.viewBox.baseVal;svg.setAttribute('viewBox',[-90,box.y,box.width+90,box.height].join(' '));}
        const matrix=svg.getScreenCTM(),scale=matrix&&Math.hypot(matrix.a,matrix.b);if(scale)svg.querySelectorAll('text').forEach(text=>text.style.fontSize=size/scale+'px');
      });
    });
  }
  for(const chart of document.querySelectorAll('.home-report-chart'))new MutationObserver(fitCharts).observe(chart,{childList:true,subtree:true});
  window.addEventListener('resize',fitCharts);if(document.fonts?.ready)document.fonts.ready.then(fitCharts);
  $('homeFilters').addEventListener('submit',event=>{event.preventDefault();apply();});
  $('homeViewMode').addEventListener('change',pending);$('homeCity').addEventListener('change',()=>{branchOptions();pending();});for(const id of ['homeFrom','homeTo','homeBranch'])$(id).addEventListener('change',pending);
  $('homeReset').addEventListener('click',reset);
  $('homeTargetMonth').addEventListener('change',()=>{state.targetMonth=$('homeTargetMonth').value;state.targets.page=1;render();});$('homeTargetMetric').addEventListener('change',()=>{state.metric=$('homeTargetMetric').value;state.targets.page=1;render();});
  document.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button||button.disabled)return;
    const data=button.dataset;
    if(data.homeRange)setPreset(data.homeRange);
    if(Object.hasOwn(data,'homeLatest'))setPreset('latest');
    if(data.homeExport)download(data.homeExport);
    if(data.homePage){state[data.homePage].page=Number(data.page);data.homePage==='branches'?renderBranches():renderTargets();}
    if(data.homeSort){const value=state[data.homeSort],index=Number(data.index);value.asc=value.sort===index?!value.asc:index<2;value.sort=index;value.page=1;data.homeSort==='branches'?renderBranches():renderTargets();}
  });
  document.addEventListener('change',event=>{const kind=event.target.dataset.homeSize;if(kind){state[kind].size=Number(event.target.value);state[kind].page=1;kind==='branches'?renderBranches():renderTargets();}});
  $('homeOpenFormulas').addEventListener('click',()=>$('homeFormulas').showModal());
  $('homeFormulas').addEventListener('click',event=>{if(event.target!==$('homeFormulas'))return;const bounds=event.target.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)event.target.close();});
  window.addEventListener('dashboardtargetschange',render);window.addEventListener('storage',event=>{if([window.dashboardTargets.key,window.dashboardTargets.snapshotKey].includes(event.key))render();});
  window.homeDashboard={state,getModel:()=>model,apply,setPreset,reset,render,download,sortedRows};
  window.showModuleNotice=name=>{if($('moduleNotice'))$('moduleNotice').textContent=name+' is not connected yet.';};
  render();
})();
