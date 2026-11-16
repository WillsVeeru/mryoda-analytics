(() => {
  'use strict';
  const data=window.dashboardTargets,$=id=>document.getElementById(id),icon=window.dashboardIcon;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=value=>Number(value).toLocaleString('en-IN'),money=value=>value===null?'—':'₹'+number(value);
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const params=new URLSearchParams(location.search),initial=params.get('to')||data.getSnapshot()?.to||today;
  const initialMonth=data.validDate(initial)?initial.slice(0,7):today.slice(0,7);
  const months=Array.from({length:12},(_,index)=>({value:String(index+1).padStart(2,'0'),label:new Date(Date.UTC(2026,index,1)).toLocaleDateString('en-GB',{month:'short',timeZone:'UTC'})}));
  $('targetPeriodMonth').innerHTML=months.map(month=>'<option value="'+month.value+'">'+month.label+'</option>').join('');
  const initialYear=Number(initialMonth.slice(0,4)),thisYear=Number(today.slice(0,4));
  const years=Array.from({length:Math.max(initialYear,thisYear)+3-Math.min(initialYear,thisYear)+2},(_,index)=>Math.min(initialYear,thisYear)-2+index);
  $('targetPeriodYear').innerHTML=years.map(year=>'<option>'+year+'</option>').join('');
  $('targetPeriodMonth').value=initialMonth.slice(5);$('targetPeriodYear').value=initialMonth.slice(0,4);
  $('targetScope').innerHTML=Object.entries(data.scopeLabels).map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join('');$('targetScope').value='pro';
  $('targetFilterScope').innerHTML='<option value="all">All scopes</option>'+Object.entries(data.scopeLabels).map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join('');$('targetFilterScope').value='all';
  $('targetBranch').innerHTML='<option>All</option>'+[...new Set(data.people.map(person=>person.branch))].map(branch=>'<option>'+esc(branch)+'</option>').join('');$('targetBranch').value='All';
  $('targetMetric').value='revenue';
  $('targetReportMetric').value='revenue';
  const metric=()=>$('targetMetric').value;
  const isCount=()=>metric()==='tests';
  const amount=value=>value===null?'—':isCount()?number(value):money(value);
  $('targetsExport').innerHTML=icon('Download')+'Export CSV';$('targetsChartToggle').innerHTML=icon('ChartColumn')+'Chart';
  let page=1,size=10,sortColumn=0,ascending=true,chart=false;
  const fields=['name','scope','target','actual','difference','status','previousTarget','previousActual','previousDifference','previousStatus'];
  const tableLabels=()=>['Person','Scope','Current target',isCount()?'Current tests':'Current net revenue','Current difference','Current status','Previous target',isCount()?'Previous tests':'Previous net revenue','Previous difference','Previous status','Action'];
  function monthlyResult(target,actual,elapsed){
    const difference=!elapsed||actual===null||target===null?null:actual-target;
    return{difference,status:target===null?'No target set':!elapsed?'Not started':actual===null?'Awaiting activity':difference<0?'Shortfall':difference>0?'Excess':'Target met',tone:difference===null?'neutral':difference<0?'warning':'positive'};
  }
  function period(){
    const month=$('targetPeriodYear').value+'-'+$('targetPeriodMonth').value;
    if(!data.validMonth(month))return{month,valid:false,elapsed:0,days:0,from:'',to:''};
    const days=data.daysInMonth(month),elapsed=month<today.slice(0,7)?days:month===today.slice(0,7)?Number(today.slice(8)):0;
    const prior=new Date(month+'-01T00:00:00Z');prior.setUTCMonth(prior.getUTCMonth()-1);
    const previousMonth=prior.toISOString().slice(0,7),previousDays=data.daysInMonth(previousMonth),previousElapsed=previousMonth<today.slice(0,7)?previousDays:previousMonth===today.slice(0,7)?Number(today.slice(8)):0;
    return{month,previousMonth,previousDays,previousElapsed,previousFrom:previousMonth+'-01',previousTo:previousMonth+'-'+String(previousElapsed||1).padStart(2,'0'),previousLabel:prior.toLocaleDateString('en-GB',{month:'short',year:'numeric',timeZone:'UTC'}),valid:true,days,elapsed,from:month+'-01',to:month+'-'+String(elapsed||1).padStart(2,'0'),label:new Date(month+'-01T00:00:00Z').toLocaleDateString('en-GB',{month:'short',year:'numeric',timeZone:'UTC'})};
  }
  function rows(){
    const selected=period();if(!selected.valid)return [];
    const query=$('targetSearch').value.trim().toLowerCase(),scope=$('targetFilterScope').value,branch=$('targetBranch').value;
    return data.people.filter(person=>(scope==='all'||person.scope===scope)&&(branch==='All'||person.branch===branch)&&(!query||[person.name,person.id,person.branch,data.scopeLabels[person.scope]].some(value=>String(value).toLowerCase().includes(query)))).map(person=>{
      const sample=window.targetsAlertsSample,savedTarget=data.savedTarget(person.scope,person.id,selected.month,metric()),savedPrevious=data.savedTarget(person.scope,person.id,selected.previousMonth,metric());
      const capturedActual=selected.elapsed?data.actualFor(person.scope,person.id,selected.from,selected.to,metric()):null;
      const target=savedTarget??sample?.target(person,selected.month,metric())??null,previousTarget=savedPrevious??sample?.target(person,selected.previousMonth,metric())??null;
      const actual=capturedActual??(sample?sample.actual(person,selected.month,selected.elapsed,selected.days,metric()):null);
      const capturedPrevious=selected.previousElapsed?data.actualFor(person.scope,person.id,selected.previousFrom,selected.previousTo,metric()):null;
      const previousActual=capturedPrevious??(sample?sample.actual(person,selected.previousMonth,selected.previousElapsed,selected.previousDays,metric()):null);
      const samplePreviousActual=!!sample&&capturedPrevious===null&&previousActual!==null&&selected.previousElapsed>0,previous=monthlyResult(previousTarget,previousActual,selected.previousElapsed);
      if(previousTarget===null&&previousActual===null)previous.status='—';
      const sampleTarget=!!sample&&savedTarget===null&&target!==null,samplePrevious=!!sample&&savedPrevious===null&&previousTarget!==null,sampleActual=!!sample&&capturedActual===null&&actual!==null&&selected.elapsed>0;
      const expected=target===null?null:Math.round(target*selected.elapsed/selected.days),gap=actual===null||target===null?null:actual-expected,difference=!selected.elapsed||actual===null||target===null?null:actual-target;
      const status=monthlyResult(target,actual,selected.elapsed).status;
      const paceStatus=target===null?'No target set':!selected.elapsed?'Not started':actual===null?'Awaiting activity':gap<0?'Behind pace':gap>0?'Ahead of pace':'On pace';
      return{...person,metric:metric(),target,previousTarget,previousActual,previousDifference:previous.difference,previousStatus:previous.status,previousTone:previous.tone,expected,actual,gap,difference,paceStatus,sampleTarget,samplePrevious,sampleActual,samplePreviousActual,hasSample:sampleTarget||samplePrevious||sampleActual||samplePreviousActual,achievement:actual===null||target===null?null:target?actual/target*100:actual===0?100:null,status,tone:difference===null?'neutral':difference<0?'warning':'positive'};
    }).sort((a,b)=>{
      const x=a[fields[sortColumn]],y=b[fields[sortColumn]];if(x===null||y===null)return x===y?0:x===null?1:-1;
      const order=typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y),undefined,{numeric:true});return ascending?order:-order;
    });
  }
  function loadEditorValue(){const selected=period(),saved=data.savedTarget($('targetScope').value,$('targetPerson').value,selected.month,metric()),person=data.people.find(person=>person.scope===$('targetScope').value&&person.id===$('targetPerson').value),value=saved??(person?window.targetsAlertsSample?.target(person,selected.month,metric()):null)??null;$('targetValue').value=value===null?'':String(value);$('targetPersonHelp').textContent=person&&saved===null&&value!==null&&window.targetsAlertsSample?'Sample target shown. Save to use this value.':person?.source==='reference'?'Activity will appear when it is available for this person.':person?.source==='demo'?'Sample dashboard ID: '+person.id:person?'Activity will appear when it is available for this person.':'';}
  function populatePeople(keep=false){
    const selected=keep?$('targetPerson').value:'';
    const scoped=data.people.filter(person=>person.scope===$('targetScope').value),reference=scoped.filter(person=>person.source!=='demo'),existing=scoped.filter(person=>person.source==='demo');
    const options=people=>people.map(person=>'<option value="'+esc(person.id)+'">'+esc(person.name)+(person.designation?' · '+esc(person.designation):person.source==='reference'?'':' · '+esc(person.id))+'</option>').join('');
    $('targetPerson').innerHTML='<option value="">Select a person…</option>'+(reference.length?'<optgroup label="People directory">'+options(reference)+'</optgroup>':'')+'<optgroup label="Existing dashboard people (demo)">'+options(existing)+'</optgroup>';
    $('targetPerson').value=selected;loadEditorValue();
  }
  const signed=value=>value===null?'—':(value>0?'+':'')+amount(value);
  function renderChart(all){
    $('targetsChart').hidden=!chart;$('targetsChartToggle').setAttribute('aria-expanded',String(chart));
    if(chart)window.dashboardReportCharts.render($('targetsChart'),{key:'targets-'+metric()+'-'+period().month,title:'Targets vs actuals · '+data.metricLabels[metric()]+' · '+period().label+' / '+period().previousLabel,columns:['Person','Current month target',isCount()?'Current tests':'Current net revenue','Previous month target',isCount()?'Previous tests':'Previous net revenue','Expected to date'],types:['text',...Array(5).fill(isCount()?'number':'money')],metric:2,rows:all.map(row=>[row.name+' · '+data.scopeLabels[row.scope],row.target,row.actual,row.previousTarget,row.previousActual,row.expected]),format:(value,type)=>type==='money'?money(value):number(value),close:'<button type="button" data-target-chart-close="true" aria-label="Close chart">&times;</button>'});
  }
  function render(){
    const selected=period(),all=rows(),pages=Math.max(1,Math.ceil(all.length/size));page=Math.min(pages,Math.max(1,page));
    $('targetMonth').value=selected.month;$('targetFrom').value=selected.from;$('targetTo').value=selected.to;
    $('targetsPeriodTitle').textContent=selected.valid?selected.label:'Choose a valid period';
    $('targetsScope').textContent=selected.valid?selected.elapsed+' of '+selected.days+' calendar days elapsed':'Choose a valid month and year';
    $('targetsKpis').innerHTML=[['Behind pace',all.filter(row=>row.paceStatus==='Behind pace').length,'TriangleAlert','negative'],['Ahead of pace',all.filter(row=>row.paceStatus==='Ahead of pace').length,'TrendingUp','positive'],['Targets set',all.filter(row=>row.target!==null).length,'CircleCheck','neutral']].map(([label,value,name,tone])=>'<section class="revenue-kpi targets-alert-card" data-alert-tone="'+tone+'"><span class="targets-alert-icon restored-kpi-icon">'+icon(name)+'</span><h2>'+label+'</h2><strong>'+number(value)+'</strong><p>'+ (label==='Targets set'?(all.some(row=>row.sampleTarget)?'Includes sample targets for the selected month':'Saved for the selected month'):isCount()?'Compared with expected test count to date':'Compared with expected revenue to date')+'</p></section>').join('');
    $('targetsReportTitle').textContent='Targets vs actuals'+(selected.valid?' · '+selected.label:'')+' · '+data.metricLabels[metric()];
    $('targetValue').placeholder=isCount()?'e.g. 2500':'e.g. 1200000';$('targetValue').setAttribute('aria-label',isCount()?'Monthly test count target':'Monthly target value in rupees');
    $('targetsActualScope').textContent=selected.valid?'Current actuals: '+selected.from+' – '+selected.to+' ('+selected.elapsed+' / '+selected.days+' days) · Previous actuals: '+selected.previousFrom+' – '+selected.previousTo:'';
    const matchingSnapshot=data.getSnapshot();
    if(all.some(row=>row.actual!==null&&!row.sampleActual)&&matchingSnapshot?.scope&&matchingSnapshot.from===selected.from&&matchingSnapshot.to===selected.to)$('targetsActualScope').textContent+=' · '+matchingSnapshot.scope;
    if(selected.valid&&selected.elapsed>0&&selected.elapsed<selected.days)$('targetsActualScope').textContent+=' · Monthly Shortfall / Excess is provisional until month-end.';
    const savedRows=all.filter(row=>row.target!==null),missing=savedRows.some(row=>row.actual===null);
    $('targetsNote').textContent=!selected.valid?'Choose a valid month and year.':missing?'People without activity data show — and Awaiting activity. Existing actuals and history are preserved.':!savedRows.length?'No targets set for '+selected.label+'. Set one above.':'';
    if(selected.valid&&all.some(row=>row.hasSample))$('targetsNote').textContent='Sample data is shown only for the existing demo team. Saved targets and available actuals take priority.';
    if(selected.valid&&missing&&all.some(row=>row.hasSample))$('targetsNote').textContent+=' People without activity data show — and Awaiting activity.';
    $('targetsFinanceLink').href=data.link('center-overview.html?targetFrom='+encodeURIComponent(selected.from)+'&targetTo='+encodeURIComponent(selected.to)+'#coWorkspaceCharts');
    $('targetsExport').disabled=!all.length;$('targetsChartToggle').disabled=!all.some(row=>row.target!==null||row.previousTarget!==null||row.actual!==null);
    const heading=(index,label,rowspan=false)=>{
      const tone=index>=2&&index<10?['benchmark','result','inflow','benchmark'][(index-2)%4]:'neutral';
      return '<th scope="col" data-formula-column="'+index+'" data-dashboard-label="'+tableLabels()[index]+'" data-column-tone="'+tone+'" '+(isCount()&&index>=2&&index<10&&(index-2)%4<3?'data-column-align="center" ':'')+(rowspan?'rowspan="2" ':'')+(index<10?'aria-sort="'+(sortColumn===index?(ascending?'ascending':'descending'):'none')+'"':'')+'>'+(index<10?'<button type="button" data-target-sort="'+index+'" aria-label="Sort '+esc(tableLabels()[index])+'">'+label+'<span aria-hidden="true">'+(sortColumn===index?(ascending?'↑':'↓'):'↕')+'</span></button>':label)+'</th>';
    };
    const differenceCell=value=>'<td><span class="targets-difference '+(value===null?'neutral':value<0?'negative':'positive')+'">'+signed(value)+'</span></td>';
    const statusCell=(status,tone)=>status==='—'?'<td>—</td>':'<td><span class="financial-target-status '+tone+'">'+status+'</span></td>';
    const tableHead='<thead><tr>'+heading(0,'Person',true)+heading(1,'Scope',true)+'<th colspan="4" scope="colgroup" class="targets-period-group" data-target-period="current">Current Month · '+esc(selected.label||'Selected month')+'</th><th colspan="4" scope="colgroup" class="targets-period-group" data-target-period="previous">Previous Month · '+esc(selected.previousLabel||'Previous month')+'</th>'+heading(10,'Action',true)+'</tr><tr>'+[2,3,4,5,6,7,8,9].map(index=>heading(index,['Target',isCount()?'Tests':'Net Revenue','Difference','Status'][(index-2)%4])).join('')+'</tr></thead>';
    const body=all.slice((page-1)*size,page*size).map(row=>'<tr><td><span class="targets-person-name">'+esc(row.name)+'</span><small class="targets-pro-id">'+(row.designation?esc(row.designation):row.source==='demo'?'Sample ID: '+esc(row.id):'')+'</small>'+(row.hasSample?'<span class="targets-sample-badge">Sample values</span>':'')+'</td><td>'+data.scopeLabels[row.scope]+'</td><td>'+amount(row.target)+'</td><td>'+amount(row.actual)+'</td>'+differenceCell(row.difference)+statusCell(row.status,row.tone)+'<td>'+amount(row.previousTarget)+'</td><td>'+amount(row.previousActual)+'</td>'+differenceCell(row.previousDifference)+statusCell(row.previousStatus,row.previousTone)+'<td><button type="button" class="co-btn" data-target-edit="'+esc(row.id)+'" data-scope="'+row.scope+'">'+icon('Pencil')+'Edit</button></td></tr>').join('');
    $('targetsTable').innerHTML='<div class="doctors-table-wrap targets-comparison-wrap" tabindex="0" role="region" aria-label="Current and previous month target comparison"><table class="doctors-table targets-comparison-table" aria-label="Targets versus actuals"><colgroup><col class="targets-person-column"><col class="targets-scope-column">'+Array.from({length:2},()=>'<col class="targets-money-column"><col class="targets-money-column"><col class="targets-money-column"><col class="targets-status-column">').join('')+'<col class="targets-action-column"></colgroup>'+tableHead+'<tbody>'+body+(!all.length?'<tr><td colspan="11" class="doctors-empty">'+(!selected.valid?'Choose a valid period.':'No people match these filters.')+'</td></tr>':'')+'</tbody></table></div>';
    $('targetsCount').textContent='Showing '+(all.length?(page-1)*size+1:0)+'–'+Math.min(page*size,all.length)+' of '+all.length+' people';$('targetsPage').textContent='Page '+page+' of '+pages;
    $('targetsFirst').disabled=$('targetsPrev').disabled=page===1;$('targetsNext').disabled=$('targetsLast').disabled=page===pages;
    renderChart(all);
  }
  function saveTarget(){
    const selected=period(),scope=$('targetScope').value,person=$('targetPerson').value,raw=$('targetValue').value.trim(),amount=raw===''?null:Number(raw);
    if(!data.validMetric(metric())||!selected.valid||!data.people.some(value=>value.scope===scope&&value.id===person)||amount===null||!Number.isSafeInteger(amount)||amount<0){$('targetsSaveStatus').textContent=isCount()?'Select a person and enter a valid whole-number test target, zero or higher.':'Select a person and enter a valid whole-rupee target, zero or higher.';return false;}
    const saved=data.setScopedTarget(scope,person,selected.month,amount,metric());
    $('targetFilterScope').value=scope;$('targetBranch').value='All';$('targetSearch').value='';page=1;
    $('targetsSaveStatus').textContent=saved?'Target saved in this browser.'+(metric()==='revenue'&&scope==='pro'&&data.catalog.some(person=>person.id===$('targetPerson').value)?' Financial Overview uses the same PRO target.':''):'Target updated for this session; browser storage is unavailable.';render();if(rows().find(row=>row.scope===scope&&row.id===person)?.status==='Awaiting activity')$('targetsSaveStatus').textContent+=' Awaiting activity; actuals and difference remain —.';return true;
  }
  function changeMetric(value){if(!data.validMetric(value))return;$('targetMetric').value=value;$('targetReportMetric').value=value;page=1;loadEditorValue();$('targetsSaveStatus').textContent='';render();}
  $('targetMetric').addEventListener('change',()=>changeMetric($('targetMetric').value));
  $('targetReportMetric').addEventListener('change',()=>changeMetric($('targetReportMetric').value));
  $('targetsEditor').addEventListener('submit',event=>{event.preventDefault();saveTarget();});
  $('targetScope').addEventListener('change',()=>{populatePeople();$('targetsSaveStatus').textContent='';});$('targetPerson').addEventListener('change',loadEditorValue);
  ['targetPeriodMonth','targetPeriodYear'].forEach(id=>$(id).addEventListener('change',()=>{page=1;loadEditorValue();$('targetsSaveStatus').textContent='';render();}));
  ['targetFilterScope','targetBranch'].forEach(id=>$(id).addEventListener('change',()=>{page=1;render();}));$('targetSearch').addEventListener('input',()=>{page=1;render();});
  $('targetsTable').addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.targetSort!==undefined){const index=Number(button.dataset.targetSort);ascending=sortColumn===index?!ascending:true;sortColumn=index;page=1;render();}
    else if(button.dataset.targetEdit){$('targetScope').value=button.dataset.scope;populatePeople();$('targetPerson').value=button.dataset.targetEdit;loadEditorValue();$('targetValue').focus();$('targetsSaveStatus').textContent=isCount()?'Editing this person’s monthly test count target.':'Editing this person’s monthly revenue target.';}
  });
  for(const [id,action]of [['targetsFirst','first'],['targetsPrev','previous'],['targetsNext','next'],['targetsLast','last']])$(id).addEventListener('click',()=>{page=action==='first'?1:action==='last'?Math.max(1,Math.ceil(rows().length/size)):page+(action==='next'?1:-1);render();});
  $('targetsSize').addEventListener('change',event=>{size=Number(event.target.value);page=1;render();});
  $('targetsChartToggle').addEventListener('click',()=>{chart=!chart;renderChart(rows());});$('targetsChart').addEventListener('click',event=>{if(event.target.closest('[data-target-chart-close]')){chart=false;renderChart(rows());$('targetsChartToggle').focus();}});
  function exportCsv(){
    const selected=period(),header=['Person ID','Local target key','Person','Scope','Branch','Target month','Metric','Current month target',isCount()?'Actual test count':'Actual net revenue','Difference','Status','Previous month','Previous month target',isCount()?'Previous test count':'Previous net revenue','Previous difference','Previous status','Expected to date','Gap to pace','Pace status','Achievement %','Comparison basis','Current target source',isCount()?'Actual test count source':'Actual revenue source','Previous target source',isCount()?'Previous actual test count source':'Previous actual revenue source','Current actuals from','Current actuals to','Previous actuals from','Previous actuals to'];
    const csv='\uFEFF'+[header,...rows().map(row=>[row.source==='reference'?row.sourceId:row.id,row.id,row.name,data.scopeLabels[row.scope],row.branch,selected.month,isCount()?'Test count':'Revenue (INR)',row.target,row.actual,row.difference,row.status,selected.previousMonth,row.previousTarget,row.previousActual,row.previousDifference,row.previousStatus,row.expected,row.gap,row.paceStatus,row.achievement,!selected.elapsed?'Month not started':selected.elapsed<selected.days?'Provisional / month in progress':'Complete month',row.sampleTarget?'Sample':row.target===null?'Unavailable':'Saved',!selected.elapsed?'Month not started':row.sampleActual?'Sample':row.actual===null?'Unavailable':'Financial Overview',row.samplePrevious?'Sample':row.previousTarget===null?'Unavailable':'Saved',!selected.previousElapsed?'Month not started':row.samplePreviousActual?'Sample':row.previousActual===null?'Unavailable':'Financial Overview',selected.from,selected.to,selected.previousFrom,selected.previousTo])].map(row=>row.map(value=>'"'+(typeof value==='number'?String(value):String(value??'').replace(/^[=+@-]/,match=>"'"+match)).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),link=document.createElement('a');link.href=url;link.download='Targets-and-Alerts-'+selected.month+(isCount()?'-tests':'')+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  $('targetsExport').addEventListener('click',exportCsv);
  window.addEventListener('storage',event=>{if(event.key===data.key||event.key===data.snapshotKey){loadEditorValue();render();}});
  const dialog=$('targetsFormulas');$('targetsOpenFormulas').addEventListener('click',()=>dialog.showModal());$('targetsCloseFormulas').addEventListener('click',()=>dialog.close());
  window.showModuleNotice=name=>{$('moduleNotice').textContent=name+' is not connected yet.';};
  window.targetsAlertsPage={rows,render,period,metric,saveTarget,exportCsv,populatePeople};populatePeople();render();
})();
