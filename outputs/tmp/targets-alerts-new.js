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
  $('targetsExport').innerHTML=icon('Download')+'Export CSV';$('targetsChartToggle').innerHTML=icon('ChartColumn')+'Chart';
  let page=1,size=10,sortColumn=0,ascending=true,chart=false;
  const fields=['name','scope','previousTarget','target','actual','difference','status'];
  function period(){
    const month=$('targetPeriodYear').value+'-'+$('targetPeriodMonth').value;
    if(!data.validMonth(month))return{month,valid:false,elapsed:0,days:0,from:'',to:''};
    const days=data.daysInMonth(month),elapsed=month<today.slice(0,7)?days:month===today.slice(0,7)?Number(today.slice(8)):0;
    const prior=new Date(month+'-01T00:00:00Z');prior.setUTCMonth(prior.getUTCMonth()-1);
    return{month,previousMonth:prior.toISOString().slice(0,7),previousLabel:prior.toLocaleDateString('en-GB',{month:'short',year:'numeric',timeZone:'UTC'}),valid:true,days,elapsed,from:month+'-01',to:month+'-'+String(elapsed||1).padStart(2,'0'),label:new Date(month+'-01T00:00:00Z').toLocaleDateString('en-GB',{month:'short',year:'numeric',timeZone:'UTC'})};
  }
  function rows(){
    const selected=period();if(!selected.valid)return [];
    const query=$('targetSearch').value.trim().toLowerCase(),scope=$('targetFilterScope').value,branch=$('targetBranch').value;
    return data.people.filter(person=>(scope==='all'||person.scope===scope)&&(branch==='All'||person.branch===branch)&&(!query||[person.name,person.id,person.branch,data.scopeLabels[person.scope]].some(value=>String(value).toLowerCase().includes(query)))).map(person=>{
      const target=data.savedTarget(person.scope,person.id,selected.month),previousTarget=data.savedTarget(person.scope,person.id,selected.previousMonth);
      const actual=selected.elapsed?data.actualFor(person.scope,person.id,selected.from,selected.to):null;
      const expected=target===null?null:Math.round(target*selected.elapsed/selected.days),gap=actual===null||target===null?null:actual-expected,difference=actual===null||target===null?null:actual-target;
      const status=target===null?'No target set':!selected.elapsed?'Not started':actual===null?'Actuals unavailable':difference<0?'Shortfall':difference>0?'Excess':'Target met';
      const paceStatus=target===null?'No target set':!selected.elapsed?'Not started':actual===null?'Actuals unavailable':gap<0?'Behind pace':gap>0?'Ahead of pace':'On pace';
      return{...person,target,previousTarget,expected,actual,gap,difference,paceStatus,achievement:actual===null||target===null?null:target?actual/target*100:actual===0?100:null,status,tone:difference===null?'neutral':difference<0?'warning':'positive'};
    }).sort((a,b)=>{
      const x=a[fields[sortColumn]],y=b[fields[sortColumn]];if(x===null||y===null)return x===y?0:x===null?1:-1;
      const order=typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y),undefined,{numeric:true});return ascending?order:-order;
    });
  }
  function loadEditorValue(){const selected=period(),value=data.savedTarget($('targetScope').value,$('targetPerson').value,selected.month),person=data.people.find(person=>person.scope===$('targetScope').value&&person.id===$('targetPerson').value);$('targetValue').value=value===null?'':String(value);$('targetPersonHelp').textContent=person?.source==='reference'?'Source PRO ID not supplied. Targets can be saved; actuals await ID mapping.':person?'Sample dashboard ID: '+person.id:'';}
  function populatePeople(keep=false){
    const selected=keep?$('targetPerson').value:'';
    const scoped=data.people.filter(person=>person.scope===$('targetScope').value),reference=scoped.filter(person=>person.source==='reference'),existing=scoped.filter(person=>person.source!=='reference');
    const options=people=>people.map(person=>'<option value="'+esc(person.id)+'">'+esc(person.name)+(person.designation?' · '+esc(person.designation):person.source==='reference'?'':' · '+esc(person.id))+'</option>').join('');
    $('targetPerson').innerHTML='<option value="">Select a person…</option>'+(reference.length?'<optgroup label="Provided PRO directory">'+options(reference)+'</optgroup>':'')+'<optgroup label="Existing dashboard people (demo)">'+options(existing)+'</optgroup>';
    $('targetPerson').value=selected;loadEditorValue();
  }
  const signed=value=>value===null?'—':(value>0?'+':'')+money(value);
  function renderChart(all){
    $('targetsChart').hidden=!chart;$('targetsChartToggle').setAttribute('aria-expanded',String(chart));
    if(chart)window.dashboardReportCharts.render($('targetsChart'),{key:'targets-'+period().month,title:'Targets vs actuals',columns:['Person','Previous month target','Current month target','Expected to date','Net revenue'],types:['text','money','money','money','money'],metric:2,rows:all.map(row=>[row.name+' · '+data.scopeLabels[row.scope],row.previousTarget,row.target,row.expected,row.actual]),format:(value,type)=>type==='money'?money(value):number(value),close:'<button type="button" data-target-chart-close="true" aria-label="Close chart">&times;</button>'});
  }
  function render(){
    const selected=period(),all=rows(),pages=Math.max(1,Math.ceil(all.length/size));page=Math.min(pages,Math.max(1,page));
    $('targetMonth').value=selected.month;$('targetFrom').value=selected.from;$('targetTo').value=selected.to;
    $('targetsPeriodTitle').textContent=selected.valid?selected.label:'Choose a valid period';
    $('targetsScope').textContent=selected.valid?selected.elapsed+' of '+selected.days+' calendar days elapsed':'Choose a valid month and year';
    $('targetsKpis').innerHTML=[['Behind pace',all.filter(row=>row.paceStatus==='Behind pace').length,'TriangleAlert','negative'],['Ahead of pace',all.filter(row=>row.paceStatus==='Ahead of pace').length,'TrendingUp','positive'],['Targets set',all.filter(row=>row.target!==null).length,'CircleCheck','neutral']].map(([label,value,name,tone])=>'<section class="revenue-kpi targets-alert-card" data-alert-tone="'+tone+'"><span class="targets-alert-icon restored-kpi-icon">'+icon(name)+'</span><h2>'+label+'</h2><strong>'+number(value)+'</strong><p>'+ (label==='Targets set'?'Saved for the selected month':'Compared with expected revenue to date')+'</p></section>').join('');
    $('targetsReportTitle').textContent='Targets vs actuals'+(selected.valid?' · '+selected.label:'');
    $('targetsActualScope').textContent=selected.valid?'Actuals period: '+selected.from+' – '+selected.to+' · '+selected.elapsed+' / '+selected.days+' calendar days':'';
    const matchingSnapshot=data.getSnapshot();
    if(all.some(row=>row.actual!==null)&&matchingSnapshot?.scope)$('targetsActualScope').textContent+=' · '+matchingSnapshot.scope;
    if(selected.valid&&selected.elapsed>0&&selected.elapsed<selected.days)$('targetsActualScope').textContent+=' · Monthly Shortfall / Excess is provisional until month-end.';
    const savedRows=all.filter(row=>row.target!==null),missing=savedRows.some(row=>row.actual===null);
    $('targetsNote').textContent=!selected.valid?'Choose a valid month and year.':savedRows.some(person=>person.source==='reference'&&!person.sourceId)?'Reference people need their source IDs mapped before actuals can be matched.':missing?'Refresh actuals in Financial Overview for the selected dates.':!savedRows.length?'No targets set for '+selected.label+'. Set one above.':'';
    $('targetsFinanceLink').href=data.link('center-overview.html?targetFrom='+encodeURIComponent(selected.from)+'&targetTo='+encodeURIComponent(selected.to)+'#coWorkspaceCharts');
    $('targetsExport').disabled=!all.length;$('targetsChartToggle').disabled=!all.some(row=>row.target!==null||row.previousTarget!==null||row.actual!==null);
    const labels=['Person','Scope','Previous target · '+(selected.previousLabel||'Previous month'),'Current target · '+(selected.label||'Selected month'),'Actual net revenue','Difference','Status','Action'];
    $('targetsTable').innerHTML='<div class="doctors-table-wrap"><table class="doctors-table" aria-label="Targets versus actuals"><thead><tr>'+labels.map((label,index)=>'<th '+(index<7?'aria-sort="'+(sortColumn===index?(ascending?'ascending':'descending'):'none')+'"':'')+'>'+(index<7?'<button type="button" data-target-sort="'+index+'">'+label+'<span aria-hidden="true">'+(sortColumn===index?(ascending?'↑':'↓'):'↕')+'</span></button>':label)+'</th>').join('')+'</tr></thead><tbody>'+all.slice((page-1)*size,page*size).map(row=>'<tr><td>'+esc(row.name)+'<small class="targets-pro-id">'+(row.source==='reference'?esc(row.designation||'Source ID not supplied'):'Sample ID: '+esc(row.id))+'</small></td><td>'+data.scopeLabels[row.scope]+'</td><td>'+money(row.previousTarget)+'</td><td>'+money(row.target)+'</td><td>'+money(row.actual)+'</td><td><span class="targets-difference '+(row.difference===null?'neutral':row.difference<0?'negative':'positive')+'">'+signed(row.difference)+'</span></td><td><span class="financial-target-status '+row.tone+'">'+row.status+'</span></td><td><button type="button" class="co-btn" data-target-edit="'+esc(row.id)+'" data-scope="'+row.scope+'">'+icon('Pencil')+'Edit</button></td></tr>').join('')+(!all.length?'<tr><td colspan="8" class="doctors-empty">'+(!selected.valid?'Choose a valid period.':'No people match these filters.')+'</td></tr>':'')+'</tbody></table></div>';
    $('targetsCount').textContent='Showing '+(all.length?(page-1)*size+1:0)+'–'+Math.min(page*size,all.length)+' of '+all.length+' people';$('targetsPage').textContent='Page '+page+' of '+pages;
    $('targetsFirst').disabled=$('targetsPrev').disabled=page===1;$('targetsNext').disabled=$('targetsLast').disabled=page===pages;
    renderChart(all);
  }
  function saveTarget(){
    const selected=period(),scope=$('targetScope').value,person=$('targetPerson').value,raw=$('targetValue').value.trim(),amount=raw===''?null:Number(raw);
    if(!selected.valid||!data.people.some(value=>value.scope===scope&&value.id===person)||amount===null||!Number.isSafeInteger(amount)||amount<0){$('targetsSaveStatus').textContent='Select a person and enter a valid whole-rupee target, zero or higher.';return false;}
    const saved=data.setScopedTarget(scope,person,selected.month,amount);
    $('targetFilterScope').value=scope;$('targetBranch').value='All';$('targetSearch').value='';page=1;
    $('targetsSaveStatus').textContent=saved?'Target saved in this browser.'+(scope==='pro'&&data.catalog.some(person=>person.id===$('targetPerson').value)?' Financial Overview uses the same PRO target.':''):'Target updated for this session; browser storage is unavailable.';render();return true;
  }
  $('targetsEditor').addEventListener('submit',event=>{event.preventDefault();saveTarget();});
  $('targetScope').addEventListener('change',()=>{populatePeople();$('targetsSaveStatus').textContent='';});$('targetPerson').addEventListener('change',loadEditorValue);
  ['targetPeriodMonth','targetPeriodYear'].forEach(id=>$(id).addEventListener('change',()=>{page=1;loadEditorValue();$('targetsSaveStatus').textContent='';render();}));
  ['targetFilterScope','targetBranch'].forEach(id=>$(id).addEventListener('change',()=>{page=1;render();}));$('targetSearch').addEventListener('input',()=>{page=1;render();});
  $('targetsTable').addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.targetSort!==undefined){const index=Number(button.dataset.targetSort);ascending=sortColumn===index?!ascending:true;sortColumn=index;page=1;render();}
    else if(button.dataset.targetEdit){$('targetScope').value=button.dataset.scope;populatePeople();$('targetPerson').value=button.dataset.targetEdit;loadEditorValue();$('targetValue').focus();$('targetsSaveStatus').textContent='Editing this person’s monthly revenue target.';}
  });
  for(const [id,action]of [['targetsFirst','first'],['targetsPrev','previous'],['targetsNext','next'],['targetsLast','last']])$(id).addEventListener('click',()=>{page=action==='first'?1:action==='last'?Math.max(1,Math.ceil(rows().length/size)):page+(action==='next'?1:-1);render();});
  $('targetsSize').addEventListener('change',event=>{size=Number(event.target.value);page=1;render();});
  $('targetsChartToggle').addEventListener('click',()=>{chart=!chart;renderChart(rows());});$('targetsChart').addEventListener('click',event=>{if(event.target.closest('[data-target-chart-close]')){chart=false;renderChart(rows());$('targetsChartToggle').focus();}});
  function exportCsv(){
    const selected=period(),header=['Person ID','Local target key','Person','Scope','Branch','Target month','Metric','Previous month','Previous month target','Current month target','Actual net revenue','Difference','Status','Expected to date','Gap to pace','Pace status','Achievement %','Comparison basis'];
    const csv='\uFEFF'+[header,...rows().map(row=>[row.source==='reference'?row.sourceId:row.id,row.id,row.name,data.scopeLabels[row.scope],row.branch,selected.month,'Revenue (INR)',selected.previousMonth,row.previousTarget,row.target,row.actual,row.difference,row.status,row.expected,row.gap,row.paceStatus,row.achievement,!selected.elapsed?'Month not started':selected.elapsed<selected.days?'Provisional / month in progress':'Complete month'])].map(row=>row.map(value=>'"'+(typeof value==='number'?String(value):String(value??'').replace(/^[=+@-]/,match=>"'"+match)).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),link=document.createElement('a');link.href=url;link.download='Targets-and-Alerts-'+selected.month+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  $('targetsExport').addEventListener('click',exportCsv);
  window.addEventListener('storage',event=>{if(event.key===data.key||event.key===data.snapshotKey){loadEditorValue();render();}});
  const dialog=$('targetsFormulas');$('targetsOpenFormulas').addEventListener('click',()=>dialog.showModal());$('targetsCloseFormulas').addEventListener('click',()=>dialog.close());
  window.showModuleNotice=name=>{$('moduleNotice').textContent=name+' is not connected yet.';};
  window.targetsAlertsPage={rows,render,period,saveTarget,exportCsv,populatePeople};populatePeople();render();
})();
