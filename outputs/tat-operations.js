(() => {
  'use strict';

  const data = window.tatOperationsData;
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const icon = name => window.dashboardIcon(name);
  const number = value => Number(value).toLocaleString('en-IN');
  const date = value => new Date(value + 'T00:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(+new Date(value+'T00:00:00Z')) && new Date(value+'T00:00:00Z').toISOString().slice(0,10) === value;
  const definitions = [
    {id:'distribution',title:'TAT distribution (collection → approval)',group:'overview',columns:['Bucket','Tests','Share'],types:['text','number','percent1'],metric:1,note:'Collection to approval, grouped by elapsed hours.'},
    {id:'categories',title:'TAT by test category',group:'overview',columns:['Category','Tests','Actual total TAT','Lab processing','Within 24h'],types:['text','number','hours','hours','percent'],metric:2,note:'Select a category to view its available test-level breakdown.'},
    {id:'tests',title:'Per-test turnaround (actual)',group:'overview',columns:['Test','Department','Tests','Actual total TAT','Lab processing','Max (hrs)','Within 24h','Within 48h','Defined SLA (LIS)'],types:['text','text','number','hours','hours','number','percent','percent','text'],metric:3,note:'Actual TAT from collection → approval per test (≥5 tests in range). Defined LIS SLA is shown exactly as recorded; it is not used for breach calculations.'},
    {id:'flow',title:'Sample flow',group:'samples',columns:['Stage','Count','% of registered'],types:['text','number','percent'],metric:1,note:'Stage counts are separate milestones, rather than additive groups.'},
    {id:'pending',title:'Genuinely pending by centre (no result entered)',group:'samples',columns:['Centre','Unresulted tests'],types:['text','number'],metric:1,note:'Tests with no result entered.'},
    {id:'processing',title:'Daily sample processing',group:'samples',columns:['Date','Received','Batched','Transferred','Total'],types:['date','number','number','number','number'],metric:1,note:'Activity counts are preserved independently; received, batched and transferred can overlap.'},
    {id:'rejections',title:'Daily rejections',group:'quality',columns:['Date','Rejections'],types:['date','number'],metric:1},
    {id:'reasons',title:'Top rejection reasons',group:'quality',columns:['Reason','Count'],types:['text','number'],metric:1}
  ];
  const groups = [['overview','Overview','CalendarClock'],['samples','Sample Flow','Layers'],['quality','Rejections','CircleX']];
  const states = Object.fromEntries(definitions.map(def => [def.id,{page:1,size:def.id==='tests'?25:10,sort:null,ascending:true,search:'',chart:false}]));
  const detailState = {page:1,size:10,sort:null,ascending:true};
  let active = 'overview', all = false, expanded = null;
  function scope() {
    const from = $('homeFrom').value, to = $('homeTo').value;
    return {from,to,valid:validDate(from)&&validDate(to)&&from<=to,full:from===data.from&&to===data.to};
  }
  function rowsFor(id) {
    const selected = scope();
    if (!selected.valid) return [];
    let rows;
    if (id==='processing'||id==='rejections') rows=data[id].filter(row=>row[0]>=selected.from&&row[0]<=selected.to);
    else rows=selected.full?data[id].slice():[];
    const category=$('tatCategory').value, centre=$('tatCentre').value;
    if(id==='categories'&&category!=='All') rows=rows.filter(row=>row[0]===category);
    if(id==='tests') {
      if(category!=='All') rows=rows.filter(row=>row[1]===category);
      const search=$('tatTestSearch').value.trim().toLowerCase();
      if(search)rows=rows.filter(row=>row[0].toLowerCase().includes(search));
      if($('tatBelow90').checked)rows=rows.filter(row=>row[6]<90);
    }
    if(id==='pending'&&centre!=='All')rows=rows.filter(row=>row[0]===centre);
    const state=states[id],query=state.search.trim().toLowerCase();
    if(query&&!(id==='categories'&&expanded))rows=rows.filter(row=>row.some(value=>String(value??'').toLowerCase().includes(query)));
    if(state.sort!==null) rows.sort((a,b)=>{
      const x=a[state.sort],y=b[state.sort];
      const order=x==null?(y==null?0:1):y==null?-1:typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y),undefined,{numeric:true});
      return state.ascending?order:-order;
    });
    return rows;
  }
  function formatted(value,type) {
    if(value==null)return '—';
    if(type==='hours')return value.toFixed(1)+'h';
    if(type==='maxHours')return number(value)+'h';
    if(type==='percent1')return value.toFixed(1)+'%';
    if(type==='percent')return number(value)+'%';
    if(type==='date')return date(value);
    return typeof value==='number'?number(value):escape(value);
  }
  function headerTone(label,id) {
    if (/rejections/i.test(label) || id==='reasons'&&label==='Count') return 'cost';
    if (/within|^total$/i.test(label)) return 'result';
    if (/max|defined sla|transferred/i.test(label)) return 'deduction';
    if (/lab processing|batched|share|% of registered/i.test(label)) return 'benchmark';
    if (/actual total tat|received|^count$/i.test(label)) return 'inflow';
    return 'neutral';
  }
  function tone(value,type,id,index) {
    if(type==='hours')return 'time';
    if(type==='percent'&&(id==='tests'||id==='categories'))return value>=90?'good':value>=75?'warn':'bad';
    if(id==='rejections'||id==='reasons')return index?'bad':'';
    return '';
  }
  function pager(id,state,total) {
    const pages=Math.max(1,Math.ceil(total/state.size));state.page=Math.min(Math.max(1,state.page),pages);
    const first=total?(state.page-1)*state.size+1:0,last=Math.min(state.page*state.size,total);
    return '<div class="tat-page"><div><span>Showing '+first+'–'+last+' of '+number(total)+' rows</span><label>Rows <select aria-label="Rows per page for '+id+'" data-size="'+id+'">'+[5,10,25,50,100].map(size=>'<option '+(state.size===size?'selected':'')+'>'+size+'</option>').join('')+'</select></label></div><div>'+[['first','«',1,'First page'],['previous','‹',state.page-1,'Previous page']].map(([key,label,target,title])=>'<button data-page="'+id+'" data-target="'+target+'" aria-label="'+title+'" '+(state.page===1?'disabled':'')+'>'+label+'</button>').join('')+'<span>Page '+state.page+' of '+pages+'</span>'+[['next','›',state.page+1,'Next page'],['last','»',pages,'Last page']].map(([key,label,target,title])=>'<button data-page="'+id+'" data-target="'+target+'" aria-label="'+title+'" '+(state.page===pages?'disabled':'')+'>'+label+'</button>').join('')+'</div></div>';
  }
  const detailColumns=['Test','Tests','Actual total TAT','Lab processing','Max (hrs)','Within 24h','Defined SLA'];
  const detailTypes=['text','number','hours','hours','maxHours','percent','text'];
  function detailRows() {
    if(!scope().valid||!scope().full)return [];
    let rows=expanded==='BIOCHEMISTRY'?data.biochemistry.slice():data.tests.filter(row=>row[1]===expanded).map(row=>[row[0],row[2],row[3],row[4],row[5],row[6],row[8]]);
    const query=states.categories.search.trim().toLowerCase();
    if(query)rows=rows.filter(row=>row.some(value=>String(value??'').toLowerCase().includes(query)));
    if(detailState.sort!==null)rows.sort((a,b)=>{const x=a[detailState.sort],y=b[detailState.sort],order=typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y),undefined,{numeric:true});return detailState.ascending?order:-order;});
    return rows;
  }
  function detailMarkup(category) {
    const rows=detailRows(),pagination=pager('detail',detailState,rows.length);
    const visible=rows.slice((detailState.page-1)*detailState.size,detailState.page*detailState.size);
    const summaryRow=scope().valid&&scope().full?data.categories.find(row=>row[0]===category):null;
    const summary=summaryRow?'<div class="tat-category-summary"><p>Category summary · Selected period · All category activity</p><dl>'+[
      ['Tests',number(summaryRow[1])],['Average total TAT',formatted(summaryRow[2],'hours')],
      ['Average lab processing',formatted(summaryRow[3],'hours')],['Within 24h',formatted(summaryRow[4],'percent')]
    ].map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+value+'</dd></div>').join('')+'</dl></div>':'';
    const empty=!scope().valid||!scope().full?emptyMessage('categories'):!data.tests.some(row=>row[1]===category)&&category!=='BIOCHEMISTRY'?'Test-level detail for this category is not available in the supplied report.':'No available records match the selected filters.';
    return '<section class="tat-category-detail-view" id="tat-category-details" aria-label="'+escape(category)+' test-level turnaround"><div class="tat-detail-head"><h3>'+escape(category==='BIOCHEMISTRY'?'Biochemistry':category)+' · Test-level breakdown</h3></div>'+summary+'<div class="tat-table-wrap"><table class="tat-table" aria-label="'+escape(category)+' tests"><thead><tr>'+detailColumns.map((c,index)=>'<th data-tat-header-tone="'+headerTone(c,'detail')+'" aria-sort="'+(detailState.sort===index?(detailState.ascending?'ascending':'descending'):'none')+'"><button data-sort="detail" data-column="'+index+'">'+c+' <span aria-hidden="true">'+(detailState.sort===index?(detailState.ascending?'↑':'↓'):'↕')+'</span></button></th>').join('')+'</tr></thead><tbody>'+visible.map(row=>'<tr>'+row.map((value,index)=>'<td data-tat-tone="'+tone(value,detailTypes[index],'tests',index)+'">'+formatted(value,detailTypes[index])+'</td>').join('')+'</tr>').join('')+(!rows.length?'<tr><td class="tat-empty" colspan="'+detailColumns.length+'">'+empty+'</td></tr>':'')+'</tbody></table></div>'+pagination+'</section>';
  }
  function emptyMessage(id) {
    const selected=scope();
    if(!selected.valid)return 'Select a valid date range.';
    if(!selected.full&&!['processing','rejections'].includes(id))return 'This summary is available for 6–12 Nov 2026. Choose that period to view it.';
    return 'No available records match the selected filters.';
  }
  function categoryBreadcrumb(visible) {
    if(!expanded)return '';
    const current=expanded||($('tatCategory').value!=='All'?$('tatCategory').value:null);
    return '<nav class="tat-category-breadcrumb" aria-label="Test category breadcrumb"><ol><li>'+(current?'<button type="button" data-category-home="true">All categories</button>':'<span aria-current="page">All categories</span>')+'</li>'+(current?'<li class="tat-breadcrumb-separator" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m9 5 7 7-7 7"/></svg></li><li><span aria-current="page">'+escape(current)+'</span></li>':'')+'</ol></nav>';
  }
  function renderTable(def) {
    const {id}=def,state=states[id],rows=rowsFor(id),pagination=pager(id,state,rows.length);
    const visible=rows.slice((state.page-1)*state.size,state.page*state.size);
    if(id==='categories'&&expanded){
      $('tat-table-'+id).innerHTML=categoryBreadcrumb(visible)+detailMarkup(expanded);
      const chart=$('tat-chart-'+id);chart.hidden=!state.chart;
      if(state.chart)renderChart({...def,title:expanded+' test-level turnaround',columns:detailColumns,types:detailTypes},detailRows());
      return;
    }
    $('tat-table-'+id).innerHTML=(id==='categories'?categoryBreadcrumb(visible):'')+'<div class="tat-table-wrap"><table class="tat-table" aria-label="'+escape(def.title)+'"><thead><tr>'+def.columns.map((column,index)=>'<th data-tat-header-tone="'+headerTone(column,id)+'" aria-sort="'+(state.sort===index?(state.ascending?'ascending':'descending'):'none')+'"><button data-sort="'+id+'" data-column="'+index+'">'+column+'<span aria-hidden="true">'+(state.sort===index?(state.ascending?'↑':'↓'):'↕')+'</span></button></th>').join('')+'</tr></thead><tbody>'+visible.map(row=>{
      return '<tr>'+row.map((value,index)=>'<td data-tat-tone="'+tone(value,def.types[index],id,index)+'">'+(id==='categories'&&index===0?'<button class="tat-category-action" data-category="'+escape(value)+'" aria-label="View '+escape(value)+' tests"><svg class="lucide-ui" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg><span>'+escape(value)+'</span></button>':formatted(value,def.types[index]))+'</td>').join('')+'</tr>';
    }).join('')+(!rows.length?'<tr><td colspan="'+def.columns.length+'" class="tat-empty">'+emptyMessage(id)+'</td></tr>':'')+'</tbody></table></div>'+pagination;
    const chart=$('tat-chart-'+id);chart.hidden=!state.chart;
    if(state.chart)renderChart(def,rows);
  }
  function renderChart(def,rows) {
    window.dashboardReportCharts.render($('tat-chart-'+def.id),{key:'tat-'+def.id+(def.id==='categories'&&expanded?'-detail':''),title:def.title,columns:def.columns,types:def.types,metric:def.metric,rows,format:formatted,close:'<button class="tat-chart-close" data-chart="'+def.id+'" aria-label="Close chart">&times;</button>'});
  }
  function exportCsv(id) {
    if(id==='categories'&&expanded)id='detail';
    const def=definitions.find(item=>item.id===id),headers=id==='detail'?detailColumns:def.columns;
    const rows=id==='detail'?detailRows():rowsFor(id);
    const csv='\uFEFF'+[headers,...rows].map(row=>row.map(value=>'"'+String(value??'').replace(/^[=+@-]/,match=>"'"+match).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),link=document.createElement('a');
    link.href=url;link.download='TAT-Operations-'+id+'-'+scope().from+'-to-'+scope().to+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function renderSummary() {
    const selected=scope(),available=selected.valid&&selected.full,s=data.summary;
    $('tatTotal').innerHTML=available?s.total.toFixed(1)+'<small>hrs</small>':'<small>Unavailable for selected dates</small>';
    $('tatSummaryPeriod').textContent=selected.valid?date(selected.from)+' – '+date(selected.to):'Choose a valid reporting period';
    const cards=[['Transit & receive',s.transit,'Collection → Lab receive (incl. transit)','Package'],['Lab testing',s.testing,'Receive → Result entry','TestTube'],['Doctor approval',s.approval,'Result → Approval','CircleCheck'],['Operations quality',null,'Urgent · Re-runs · Holds','Activity']];
    $('tatSummary').innerHTML=cards.map(([label,value,note,name],index)=>'<section class="revenue-kpi"><span class="tat-kpi-icon restored-kpi-icon">'+icon(name)+'</span><h2>'+label+'</h2>'+(index===3?'<strong class="tat-quality-value">'+(available?'<span>'+s.urgent+'<span class="tat-unit">urgent</span></span><span>'+s.reruns+'<span class="tat-unit">re-runs</span></span><span>'+s.holds+'<span class="tat-unit">holds</span></span>':'—')+'</strong>':'<strong>'+(available?value.toFixed(1)+'<span class="tat-unit">hrs</span>':'—')+'</strong>')+'<p>'+note+'</p></section>').join('');
    $('tatStatusGrid').innerHTML=available?data.statuses.map(([label,value])=>'<div class="tat-status"><strong>'+number(value)+'</strong><span>'+label+'</span></div>').join(''):'';
    $('tatPeriodMessage').textContent=!selected.valid?'Select a valid date range.':!selected.full?'Daily activity follows your dates. Aggregate turnaround and flow summaries require the complete 6–12 Nov 2026 report period.':'';
    document.querySelectorAll('.tat-period').forEach(node=>node.textContent=selected.valid?'Selected period: '+date(selected.from)+' – '+date(selected.to):'Choose a valid date range');
    $('tatFormulaPeriod').textContent=$('tatSummaryPeriod').textContent;
  }
  function syncLayout() {
    document.querySelectorAll('[data-tat-group]').forEach(node=>node.hidden=!all&&node.dataset.tatGroup!==active);
    $('tatTabs').hidden=all;
    $('tatViewLabel').textContent=all?'Show tabs':'Show all tables';
    document.querySelectorAll('.tat-group-title').forEach(node=>node.hidden=!all);
    $('tatTabs').querySelectorAll('button').forEach(button=>{const selected=button.dataset.tab===active;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
  }
  function refresh() {
    if(expanded&&$('tatCategory').value!=='All'&&$('tatCategory').value!==expanded)expanded=null;
    Object.values(states).forEach(state=>state.page=1);detailState.page=1;
    renderSummary();definitions.forEach(renderTable);syncLayout();
  }
  window.refreshHome=refresh;
  window.showModuleNotice=name=>{$('moduleNotice').textContent=name+' is not connected yet.';};
  $('tatCentre').innerHTML='<option>All</option>'+data.pending.map(row=>'<option>'+row[0]+'</option>').join('');
  $('tatCategory').innerHTML='<option>All</option>'+data.categories.map(row=>'<option>'+row[0]+'</option>').join('');
  $('homeFrom').value=data.from;$('homeTo').value=data.to;
  $('tatTabs').innerHTML=groups.map(([id,label,name])=>'<button id="tat-tab-'+id+'" type="button" role="tab" aria-controls="tat-group-'+id+'" data-tab="'+id+'">'+icon(name)+label+'</button>').join('');
  $('tatReports').innerHTML=groups.map(([id,label])=>'<div id="tat-group-'+id+'" class="tat-report-view" data-tat-group="'+id+'" role="tabpanel" aria-labelledby="tat-tab-'+id+'"><h2 class="tat-group-title">'+label+'</h2>'+definitions.filter(def=>def.group===id).map(def=>'<section class="tat-report" id="tat-report-'+def.id+'"><div class="tat-report-head"><div><h2>'+def.title+'</h2><p class="tat-period"></p></div><div class="tat-actions"><input type="search" class="tat-report-search" placeholder="Search records" aria-label="Search '+def.title+'" data-search="'+def.id+'"><button data-chart="'+def.id+'" aria-expanded="false" aria-controls="tat-chart-'+def.id+'">'+icon('ChartColumn')+'Chart</button><button data-export="'+def.id+'">'+icon('Download')+'Export CSV</button></div></div>'+(def.note?'<p class="tat-period" data-static-note>'+def.note+'</p>':'')+'<div class="tat-chart rev-chart" id="tat-chart-'+def.id+'" hidden></div><div id="tat-table-'+def.id+'"></div>'+(def.id==='flow'?'<div id="tatStatusGrid" class="tat-status-grid"></div>':'')+'</section>').join('')+'</div>').join('');
  // Keep explanatory notes separate from date captions.
  document.querySelectorAll('[data-static-note]').forEach(node=>node.classList.remove('tat-period'));
  $('tatReports').addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.categoryHome){expanded=null;detailState.page=1;$('tatCategory').value='All';states.categories.search='';const search=$('tat-report-categories').querySelector('[data-search="categories"]');if(search)search.value='';refresh();}
    else if(button.dataset.sort){const id=button.dataset.sort,state=id==='detail'?detailState:states[id],column=Number(button.dataset.column);state.ascending=state.sort===column?!state.ascending:true;state.sort=column;state.page=1;renderTable(definitions.find(def=>def.id===(id==='detail'?'categories':id)));}
    else if(button.dataset.page){const id=button.dataset.page,state=id==='detail'?detailState:states[id];state.page=Number(button.dataset.target);renderTable(definitions.find(def=>def.id===(id==='detail'?'categories':id)));}
    else if(button.dataset.chart){const id=button.dataset.chart;states[id].chart=!states[id].chart;renderTable(definitions.find(def=>def.id===id));$('tat-report-'+id).querySelector('[data-chart]').setAttribute('aria-expanded',String(states[id].chart));}
    else if(button.dataset.export)exportCsv(button.dataset.export);
    else if(button.dataset.category){expanded=button.dataset.category;detailState.page=1;detailState.sort=null;states.categories.search='';const search=$('tat-report-categories').querySelector('[data-search="categories"]');if(search)search.value='';renderTable(definitions.find(def=>def.id==='categories'));}
  });
  $('tatReports').addEventListener('input',event=>{const id=event.target.dataset.search;if(id){states[id].search=event.target.value;states[id].page=1;if(id==='categories')detailState.page=1;renderTable(definitions.find(def=>def.id===id));}});
  $('tatReports').addEventListener('change',event=>{const id=event.target.dataset.size;if(id){const state=id==='detail'?detailState:states[id];state.size=Number(event.target.value);state.page=1;renderTable(definitions.find(def=>def.id===(id==='detail'?'categories':id)));}});
  $('tatTabs').addEventListener('click',event=>{const button=event.target.closest('[data-tab]');if(button){active=button.dataset.tab;syncLayout();}});
  $('tatTabs').addEventListener('keydown',event=>{
    const keys=['ArrowLeft','ArrowRight','Home','End'];if(!keys.includes(event.key))return;
    event.preventDefault();let index=groups.findIndex(group=>group[0]===active);
    index=event.key==='Home'?0:event.key==='End'?groups.length-1:(index+(event.key==='ArrowRight'?1:-1)+groups.length)%groups.length;
    active=groups[index][0];syncLayout();$('tat-tab-'+active).focus();
  });
  $('tatShowAll').addEventListener('change',event=>{all=event.target.checked;syncLayout();});
  ['homeFrom','homeTo','tatCentre','tatCategory','tatBelow90'].forEach(id=>$(id).addEventListener('change',refresh));
  $('tatTestSearch').addEventListener('input',refresh);
  $('tatMoreToggle').addEventListener('click',()=>{const panel=$('tatMore');panel.hidden=!panel.hidden;$('tatMoreToggle').setAttribute('aria-expanded',String(!panel.hidden));});
  $('tatReset').addEventListener('click',()=>{expanded=null;$('homeFrom').value=data.from;$('homeTo').value=data.to;$('tatCentre').value='All';$('tatCategory').value='All';$('tatTestSearch').value='';$('tatBelow90').checked=false;Object.values(states).forEach(state=>state.search='');document.querySelectorAll('[data-search]').forEach(node=>node.value='');refresh();});
  const shortcuts=['Today','Yesterday','Last 7 days','Month to date','Last 30 days','Report period'];
  $('shortcuts').innerHTML=shortcuts.map((label,index)=>'<button class="quick '+(index===5?'active':'')+'" data-range="'+index+'">'+label+'</button>').join('');
  $('shortcuts').addEventListener('click',event=>{
    const button=event.target.closest('[data-range]');if(!button)return;
    const index=Number(button.dataset.range),today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const end=new Date(today+'T00:00:00Z'),start=new Date(end);
    if(index===1){start.setUTCDate(start.getUTCDate()-1);end.setUTCDate(end.getUTCDate()-1);}
    if(index===2)start.setUTCDate(start.getUTCDate()-6);
    if(index===3)start.setUTCDate(1);
    if(index===4)start.setUTCDate(start.getUTCDate()-29);
    $('homeFrom').value=index===5?data.from:start.toISOString().slice(0,10);$('homeTo').value=index===5?data.to:end.toISOString().slice(0,10);
    refresh();document.querySelectorAll('[data-range]').forEach(node=>node.classList.toggle('active',node===button));
  });
  ['homeFrom','homeTo'].forEach(id=>$(id).addEventListener('change',()=>document.querySelectorAll('[data-range]').forEach(node=>node.classList.remove('active'))));
  const formulaDialog=$('tatFormulas');
  $('tatOpenFormulas').addEventListener('click',()=>formulaDialog.showModal());
  $('tatCloseFormulas').addEventListener('click',()=>formulaDialog.close());
  formulaDialog.addEventListener('click',event=>{if(event.target===formulaDialog){const box=formulaDialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)formulaDialog.close();}});
  // Expose the same selection pipeline for integration and reconciliation checks.
  window.tatOperations={definitions,states,rowsFor,scope,refresh,exportCsv};
  refresh();
})();
