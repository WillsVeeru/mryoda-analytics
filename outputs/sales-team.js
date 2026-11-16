(() => {
  'use strict';
  const data=window.salesTeamData,$=id=>document.getElementById(id),icon=window.dashboardIcon;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=value=>Number(value).toLocaleString('en-IN'),money=value=>'₹'+number(value);
  const date=value=>new Date(value+'T00:00:00Z').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'});
  const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&Number.isFinite(+new Date(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
  const groups=[['performance','PRO Performance','Users'],['tiers','Client Tiers','Layers'],['managers','Account Managers','BriefcaseBusiness'],['reps','Sales Reps','TrendingUp'],['hierarchy','Hierarchy','Network']];
  const definitions=[
    {id:'performance',group:'performance',title:'PRO performance detail',columns:['PRO','Designation','Panels','Bills','Patients','Revenue'],types:['text','text','number','number','number','money'],metric:5,expand:'pro'},
    {id:'tiers',group:'tiers',scope:'tiers',title:'Client tiers by PRO',columns:['PRO','Clients','Tier 1','Tier 2','Tier 3','No business','Moved up','Moved down','Revenue'],types:['text','number','number','number','number','number','number','number','money'],metric:8,expand:'tierPro'},
    {id:'allClients',group:'tiers',scope:'tiers',title:'All clients · Tier comparison',columns:['Client','Type','PRO','Tier','Revenue','Previous tier','Previous revenue','Movement','Bills'],types:['text','text','text','badge','money','badge','money','badge','number'],metric:4},
    {id:'managers',group:'managers',title:'Revenue by sales manager (panel assignment)',columns:['Sales manager','Active panels','Bills','Patients','Revenue'],types:['text','number','number','number','money'],metric:4},
    {id:'unassigned',group:'managers',title:'Clients without an account manager',columns:[],types:[],metric:null},
    {id:'reps',group:'reps',title:'Sales rep detail',columns:['Sales rep','Role','Reports to','Panels','Bills','Patients','Revenue'],types:['text','text','text','number','number','number','money'],metric:6},
    {id:'hierarchy',group:'hierarchy',scope:'directory',title:'Sales team hierarchy',columns:['Name','Designation','Reports to','Manager designation'],types:['text','text','text','text'],metric:null}
  ];
  const states=new Map(),contexts=new Map();
  let active='performance',all=false,selectedRange='report',selectedPro=null,selectedClient=null,selectedTierPro=null,tierFilter='All';
  const dom=(prefix,key)=>prefix+encodeURIComponent(key);
  function stateFor(key){if(!states.has(key))states.set(key,{page:1,size:10,sort:null,direction:'desc',search:'',chart:false});return states.get(key);}
  function scope(){const from=$('homeFrom').value,to=$('homeTo').value;return{from,to,valid:validDate(from)&&validDate(to)&&from<=to,full:from===data.from&&to===data.to};}
  function periodFor(def){
    if(def.scope==='tiers'){const month=$('salesTierMonth').value;if(!validDate(month+'-01'))return null;const prior=new Date(month+'-01T00:00:00Z');prior.setUTCMonth(prior.getUTCMonth()-1);return{start:month+'-01',end:new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).toISOString().slice(0,10),previousLabel:prior.toLocaleDateString('en-GB',{month:'short',year:'numeric',timeZone:'UTC'})};}
    if(def.scope==='directory')return{start:data.from,end:data.to};
    const selected=scope();return selected.valid?{start:selected.from,end:selected.to}:null;
  }
  function available(def){return def.scope==='directory'||def.scope==='tiers'?def.scope==='directory'||$('salesTierMonth').value===data.tierMonth:scope().valid&&scope().full;}
  function selectRows(key){
    const context=contexts.get(key);if(!context)return [];
    const state=stateFor(key),query=state.search.trim().toLowerCase();
    const rows=context.raw.filter(row=>!query||row.some(value=>String(value??'').toLowerCase().includes(query))).map(row=>[...row]);
    if(state.sort!==null)rows.sort((a,b)=>{const x=a[state.sort],y=b[state.sort];if(x===null||x===undefined||x===''||y===null||y===undefined||y==='')return x===y?0:x===null||x===undefined||x===''?1:-1;const order=typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y),undefined,{numeric:true});return state.direction==='desc'?-order:order;});
    return rows;
  }
  function badge(value){const tone=/^(up|new|tier 1)$/i.test(value)?'positive':/^down$/i.test(value)?'negative':/^tier 2$/i.test(value)?'warning':'neutral';return '<span class="sales-badge '+tone+'">'+esc(value)+'</span>';}
  function format(value,type){return value===null||value===undefined||value===''?'—':type==='money'?money(value):type==='number'?number(value):type==='badge'?badge(value):esc(value);}
  const proId=name=>/^PRO #(\d+)$/.exec(String(name??''))?.[1]||null;
  const alignment=type=>type==='money'?'right':['number','id','badge'].includes(type)?'center':'left';
  function totalFor(def,rows){
    if(!rows.length)return null;
    const additive=def.columns.map((label,index)=>index>0&&/^(?:revenue|previous revenue|bills|tests)$/i.test(label)?index:-1).filter(index=>index>=0);
    if(!additive.length)return null;
    const labelIndex=def.id==='clients'?1:0;
    return def.columns.map((_,index)=>index===labelIndex?'All filtered total':additive.includes(index)?rows.reduce((sum,row)=>sum+row[index],0):null);
  }
  function pagination(key,total){
    const state=stateFor(key),pages=Math.max(1,Math.ceil(total/state.size));state.page=Math.max(1,Math.min(state.page,pages));
    const buttons=(items)=>items.map(([label,symbol,page,disabled])=>'<button type="button" data-sales-page="'+esc(key)+'" data-target="'+page+'" aria-label="'+label+'" '+(disabled?'disabled':'')+'>'+symbol+'</button>').join('');
    return '<div class="rev-foot"><div class="rev-page-left"><span role="status">'+(total?'Showing '+((state.page-1)*state.size+1)+'–'+Math.min(total,state.page*state.size)+' of '+total+' rows':'0 rows')+'</span><label>Rows <select data-sales-size="'+esc(key)+'" aria-label="Rows per page: '+esc(contexts.get(key).def.title)+'">'+[5,10,25,50].map(size=>'<option '+(size===state.size?'selected':'')+'>'+size+'</option>').join('')+'</select></label></div><div class="rev-page-nav">'+buttons([['First page','«',1,state.page===1],['Previous page','‹',state.page-1,state.page===1]])+'<span>Page '+state.page+' of '+pages+'</span>'+buttons([['Next page','›',state.page+1,state.page===pages],['Last page','»',pages,state.page===pages]])+'</div></div>';
  }
  function emptyMessage(def){if(!available(def))return def.scope==='tiers'?'Select the report month to view this comparison.':'Select Report period to view this report.';if(def.id==='unassigned')return 'No clients without an account manager for the selected period.';if(def.missing)return def.missing;return 'No available records match this selection.';}
  function tierFilters(){return '<div class="revenue-report-tabs sales-tier-filters" role="group" aria-label="Client tier filters">'+['All','Tier 1','Tier 2','Tier 3','No business','Moved down'].map(label=>'<button type="button" data-sales-tier="'+label+'" aria-pressed="'+(tierFilter===label)+'">'+label+'</button>').join('')+'</div>';}
  function clientView(pro,report){
    const def={id:'clients',title:'Clients · '+pro,columns:['Client ID','Client','Type','Bills','Tests','Patients','Revenue'],types:['id','text','text','number','number','number','money'],metric:6,expand:'client',pro,missing:'Client details are not available for this PRO.'};
    return view('clients:'+pro,def,data.clients[pro]||[],report);
  }
  function categoryView(pro,client,report){
    const def={id:'categories',title:client[1]+' · Test-category mix',columns:['Test category','Tests','Revenue'],types:['text','number','money'],metric:2,pro,missing:'A test-category breakdown is not available for this client.'};
    return view('categories:'+pro+'::'+client[0],def,data.categories[pro+'::'+client[0]]||[],report);
  }
  function tierClientView(pro,report){
    const def={id:'tierClients',scope:'tiers',title:'Client tiers · '+pro,columns:['Client','Type','Tier','Revenue','Previous tier','Previous revenue','Movement','Bills'],types:['text','text','badge','money','badge','money','badge','number'],metric:3,pro,missing:'Client-tier details are not available for this PRO.'};
    return view('tierClients:'+pro,def,data.tierClients[pro]||[],report);
  }
  function view(key,def,raw,report){
    contexts.set(key,{def,raw:available(def)?raw:[],report});
    const state=stateFor(key),rows=selectRows(key),pager=pagination(key,rows.length),period=periodFor(def);
    const caption=def.scope==='directory'?'Directory as of '+date(data.to):period?(def.scope==='tiers'?'Comparison period: ':'Selected period: ')+date(period.start)+' – '+date(period.end)+(def.scope==='tiers'?' · Previous month: '+period.previousLabel:''):'Choose a valid date range';
    const tools='<div class="doctors-actions"><input id="'+dom('sales-search-',key)+'" type="search" value="'+esc(state.search)+'" data-sales-search="'+esc(key)+'" placeholder="Search records" aria-label="Search '+esc(def.title)+'">'+(def.metric!==null?'<button id="'+dom('sales-chart-button-',key)+'" type="button" data-sales-chart="'+esc(key)+'" aria-expanded="'+state.chart+'" aria-controls="'+dom('sales-chart-',key)+'" '+(!rows.length?'disabled':'')+'>'+icon('ChartColumn')+'Chart</button>':'')+'<button type="button" data-sales-export="'+esc(key)+'" '+(!rows.length?'disabled':'')+'>'+icon('Download')+'Export CSV</button></div>';
    const head='<div class="doctors-report-head"><div><h2 tabindex="-1" id="'+dom('sales-heading-',key)+'">'+esc(def.title)+'</h2><p class="doctors-period">'+caption+'</p></div>'+tools+'</div>';
    const chart='<div class="doctors-chart rev-chart" id="'+dom('sales-chart-',key)+'" '+(!state.chart?'hidden':'')+'></div>';
    if(!def.columns.length)return '<section class="sales-empty-report">'+head+'<p class="sales-empty">'+emptyMessage(def)+'</p></section>';
    const displayedColumns=def.columns.map((_,index)=>index).filter(index=>def.id!=='clients'||index!==0);
    const body=rows.slice((state.page-1)*state.size,state.page*state.size).map(row=>{
      const nameIndex=def.expand==='client'?1:0;
      const cells=displayedColumns.map(index=>{
        const value=row[index],link=(def.expand&&index===nameIndex)?'<button type="button" class="sales-drill-link" data-sales-open="'+def.expand+'" data-key="'+esc(key)+'" data-value="'+esc(def.expand==='client'?row[0]:value)+'" aria-label="View '+esc(def.expand==='client'?row[1]:value)+' '+(def.expand==='client'?'test categories':'clients')+'">'+icon('ChevronRight')+'<span>'+format(value,def.types[index])+'</span></button>':format(value,def.types[index]);
        const identity=def.columns[index]==='PRO'?'<small class="sales-pro-id">PRO ID: '+esc(proId(value)||'—')+'</small>':'';
        return '<td data-sales-align="'+alignment(def.types[index])+'">'+link+identity+(def.id==='clients'&&index===1?'<small class="sales-client-id">Client ID: '+esc(row[0])+'</small>':'')+'</td>';
      }).join('');
      return '<tr>'+cells+'</tr>';
    }).join('');
    const total=totalFor(def,rows);
    const table='<div class="doctors-table-wrap"><table class="doctors-table sales-table" data-sales-kind="'+def.id+'" data-sales-context="'+esc(key)+'" aria-label="'+esc(def.title)+'"><thead><tr>'+displayedColumns.map(index=>{const label=def.columns[index];return '<th data-sales-align="'+alignment(def.types[index])+'" aria-sort="'+(state.sort===index?(state.direction==='asc'?'ascending':'descending'):'none')+'"><button type="button" id="'+dom('sales-sort-',key+':'+index)+'" data-sales-sort="'+esc(key)+'" data-column="'+index+'">'+esc(label)+'<span aria-hidden="true">'+(state.sort===index?(state.direction==='asc'?'↑':'↓'):'↕')+'</span></button></th>';}).join('')+'</tr></thead><tbody>'+body+(!rows.length?'<tr><td class="doctors-empty" colspan="'+displayedColumns.length+'">'+emptyMessage(def)+'</td></tr>':'')+'</tbody>'+(total?'<tfoot><tr>'+displayedColumns.map(index=>{const value=total[index];return '<td data-sales-align="'+alignment(def.types[index])+'">'+(value==='All filtered total'?value:value===null?'—':format(value,def.types[index]))+'</td>';}).join('')+'</tr></tfoot>':'')+'</table></div>';
    return '<section class="sales-report-content">'+head+(def.id==='allClients'?tierFilters():'')+chart+table+pager+'</section>';
  }
  function rootRows(def){
    let rows=data[def.id];
    if(def.id==='allClients'&&tierFilter!=='All')rows=rows.filter(row=>tierFilter==='Moved down'?row[7]==='Down':row[3]===tierFilter);
    return rows;
  }
  function breadcrumbs(report,pro,client){
    const items=[{label:'All PROs',back:'root'},{label:pro,back:client?'clients':null}];
    if(client)items.push({label:client[1],back:null});
    return '<nav class="doctors-breadcrumb sales-breadcrumb" aria-label="'+(report==='tiers'?'Client-tier':'PRO performance')+' breadcrumbs"><ol>'+items.map((item,index)=>'<li>'+(index?icon('ChevronRight'):'')+(item.back?'<button type="button" data-sales-back="'+item.back+'" data-report="'+report+'">'+esc(item.label)+'</button>':'<span aria-current="page" tabindex="-1">'+esc(item.label)+'</span>')+'</li>').join('')+'</ol></nav>';
  }
  function renderReport(id){
    const def=definitions.find(item=>item.id===id);
    for(const [key,context]of contexts)if(context.report===id)contexts.delete(key);
    let content;
    if(id==='performance'&&selectedPro){
      const client=selectedClient?(data.clients[selectedPro]||[]).find(row=>selectedClient===selectedPro+'::'+row[0]):null;
      content='<div class="sales-section-title"><h2>'+esc(def.title)+'</h2></div>'+breadcrumbs(id,selectedPro,client)+(client?categoryView(selectedPro,client,id):clientView(selectedPro,id));
    }else if(id==='tiers'&&selectedTierPro){
      content='<div class="sales-section-title"><h2>'+esc(def.title)+'</h2></div>'+breadcrumbs(id,selectedTierPro,null)+tierClientView(selectedTierPro,id);
    }else content=view(id,def,rootRows(def),id);
    $('sales-report-'+id).innerHTML=content;
    for(const [key,context]of contexts)if(context.report===id&&stateFor(key).chart&&context.def.metric!==null){const rows=selectRows(key),state=stateFor(key),chart=$(''+dom('sales-chart-',key));if(!chart)continue;window.dashboardReportCharts.render(chart,{key:'sales-'+key,title:context.def.title,columns:context.def.columns,types:context.def.types.map(type=>type==='badge'?'text':type),metric:context.def.metric,valueIndices:context.def.types.map((type,index)=>type==='money'||type==='number'?index:-1).filter(index=>index>=0),rows,format:(value,type)=>type==='money'?money(value):number(value),close:'<button type="button" data-sales-chart="'+esc(key)+'" aria-label="Close chart">&times;</button>'});}
  }
  function renderSummary(){
    const selected=scope(),full=selected.valid&&selected.full,total=data.managers.reduce((sum,row)=>sum+row[4],0);
    $('salesRevenue').textContent=full?money(total):'—';$('salesScope').textContent=full?'Revenue by panel-assigned sales manager':'Select Report period';
    $('salesSummary').innerHTML=[['Reported PRO groups',data.source.reportedRows.performance,'Users'],['Sales reps in report',data.reps.length,'BriefcaseBusiness'],['Unassigned revenue',data.managers.find(row=>row[0]==='Unassigned')[4],'Receipt']].map(([label,value,name],index)=>'<section class="revenue-kpi"><span class="doctors-kpi-icon restored-kpi-icon">'+icon(name)+'</span><h2>'+label+'</h2><strong>'+(full?(index===2?money(value):number(value)):'—')+'</strong><p>'+(selected.valid?date(selected.from)+' – '+date(selected.to):'Choose valid dates')+'</p></section>').join('');
    $('salesMessage').textContent=!selected.valid?'Choose a valid date range.':!selected.full?'Daily reports require the supplied report period. Client tiers use their own month selection.':'';
    document.querySelectorAll('[data-sales-range]').forEach(button=>button.classList.toggle('active',button.dataset.salesRange===selectedRange));
  }
  function syncLayout(){
    $('salesTabs').hidden=all;$('salesAllTitle').hidden=!all;$('salesViewLabel').textContent=all?'Show tabs':'Show all tables';$('salesShowAll').setAttribute('aria-checked',String(all));$('salesShowAll').setAttribute('aria-label',all?'Show tabs':'Show all tables');
    groups.forEach(([id])=>{const selected=id===active,panel=$('sales-group-'+id),tab=$('sales-tab-'+id);panel.hidden=!all&&!selected;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;panel.setAttribute('role',all?'region':'tabpanel');panel.setAttribute('aria-labelledby',all?'sales-title-'+id:tab.id);$('sales-title-'+id).hidden=!all;});
  }
  function refresh(){for(const state of states.values())state.page=1;renderSummary();definitions.forEach(def=>renderReport(def.id));syncLayout();}
  function exportCsv(key){
    const context=contexts.get(key);if(!context)return;const rows=selectRows(key),total=totalFor(context.def,rows),period=periodFor(context.def);
    const proIndex=context.def.columns.indexOf('PRO'),hasPro=proIndex>=0,scopedPro=context.def.pro;
    const columns=hasPro?context.def.columns.flatMap((label,index)=>index===proIndex?['PRO ID',label]:[label]):scopedPro?[...context.def.columns,'PRO ID','PRO']:context.def.columns;
    const exportRow=(row,isTotal=false)=>hasPro?row.flatMap((value,index)=>index===proIndex?[isTotal?'':proId(value),value]:[value]):scopedPro?[...row,isTotal?'':proId(scopedPro),isTotal?'':scopedPro]:row;
    const csv='\uFEFF'+[columns,...rows.map(row=>exportRow(row)),...(total?[exportRow(total,true)]:[])].map(row=>row.map(value=>'"'+(typeof value==='number'?String(value):String(value??'').replace(/^[=+@-]/,match=>"'"+match)).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),link=document.createElement('a');link.href=url;link.download='Sales-Team-'+context.def.id+'-'+(period?period.start+'-to-'+period.end:'selected-period')+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  $('homeFrom').value=data.from;$('homeTo').value=data.to;$('salesTierMonth').value=data.tierMonth;
  $('salesTabs').innerHTML=groups.map(([id,label,name])=>'<button type="button" id="sales-tab-'+id+'" data-sales-tab="'+id+'" role="tab" aria-controls="sales-group-'+id+'">'+icon(name)+'<span>'+label+'</span></button>').join('');
  $('salesReports').innerHTML=groups.map(([id,label])=>'<div class="sales-report-group" id="sales-group-'+id+'"><h2 class="sales-group-title" id="sales-title-'+id+'">'+label+'</h2>'+(id==='tiers'?'<div class="card sales-tier-period"><label>Comparison month <input type="month" id="salesTierMonthControl" value="'+data.tierMonth+'" aria-label="Client-tier comparison month"></label><button type="button" class="co-btn" id="salesRestoreMonth">Report month</button></div>':'')+definitions.filter(def=>def.group===id).map(def=>'<section class="card doctors-report" id="sales-report-'+def.id+'"></section>').join('')+'</div>').join('');
  $('salesReports').addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button||button.disabled)return;const d=button.dataset;
    if(d.salesBack){
      if(d.report==='performance'){if(d.salesBack==='root')selectedPro=null;selectedClient=null;}else if(d.report==='tiers')selectedTierPro=null;
      renderReport(d.report);
      const key=d.report==='performance'&&selectedPro?'clients:'+selectedPro:d.report;
      $(dom('sales-heading-',key))?.focus();return;
    }
    if(d.salesTier){tierFilter=d.salesTier;stateFor('allClients').page=1;renderReport('allClients');return;}
    if(button.id==='salesRestoreMonth'){$('salesTierMonth').value=data.tierMonth;$('salesTierMonthControl').value=data.tierMonth;refresh();return;}
    const key=d.salesSort||d.salesPage||d.salesChart||d.salesExport||d.key,context=contexts.get(key);if(!context)return;const state=stateFor(key);
    if(d.salesOpen){
      if(d.salesOpen==='pro'){selectedPro=d.value;selectedClient=null;}else if(d.salesOpen==='tierPro')selectedTierPro=d.value;else selectedClient=context.def.pro+'::'+d.value;
      renderReport(context.report);
      const nextKey=d.salesOpen==='pro'?'clients:'+selectedPro:d.salesOpen==='tierPro'?'tierClients:'+selectedTierPro:'categories:'+selectedClient;
      $(dom('sales-heading-',nextKey))?.focus();
    }
    else if(d.salesSort){const column=Number(d.column);state.direction=state.sort===column?(state.direction==='desc'?'asc':'desc'):context.def.types[column]==='number'||context.def.types[column]==='money'||context.def.types[column]==='id'?'desc':'asc';state.sort=column;state.page=1;renderReport(context.report);$(dom('sales-sort-',key+':'+column))?.focus();}
    else if(d.salesPage){state.page=Number(d.target);renderReport(context.report);}
    else if(d.salesChart){state.chart=!state.chart;renderReport(context.report);if(!state.chart)$(dom('sales-chart-button-',key))?.focus();}
    else exportCsv(key);
  });
  $('salesReports').addEventListener('input',event=>{const key=event.target.dataset.salesSearch,context=contexts.get(key);if(!context)return;const start=event.target.selectionStart,end=event.target.selectionEnd;stateFor(key).search=event.target.value;stateFor(key).page=1;renderReport(context.report);const input=$(dom('sales-search-',key));input?.focus();if(typeof start==='number')input?.setSelectionRange?.(start,end);});
  $('salesReports').addEventListener('change',event=>{if(event.target.id==='salesTierMonthControl'){$('salesTierMonth').value=event.target.value;for(const state of states.values())state.page=1;renderReport('tiers');renderReport('allClients');return;}const key=event.target.dataset.salesSize,context=contexts.get(key);if(context){stateFor(key).size=Number(event.target.value);stateFor(key).page=1;renderReport(context.report);}});
  $('salesTabs').addEventListener('click',event=>{const button=event.target.closest('[data-sales-tab]');if(button){active=button.dataset.salesTab;syncLayout();}});
  $('salesTabs').addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const index=groups.findIndex(group=>group[0]===active),next=event.key==='Home'?0:event.key==='End'?groups.length-1:(index+(event.key==='ArrowRight'?1:-1)+groups.length)%groups.length;active=groups[next][0];syncLayout();$('sales-tab-'+active).focus();});
  $('salesShowAll').addEventListener('click',()=>{all=!all;syncLayout();});
  ['homeFrom','homeTo'].forEach(id=>$(id).addEventListener('change',()=>{selectedRange=null;refresh();}));
  $('moreHome').addEventListener('click',()=>{const panel=$('homeMore');panel.hidden=!panel.hidden;$('moreHome').setAttribute('aria-expanded',String(!panel.hidden));});
  function reset(){selectedPro=null;selectedClient=null;selectedTierPro=null;tierFilter='All';all=false;active='performance';selectedRange='report';states.clear();$('homeFrom').value=data.from;$('homeTo').value=data.to;$('salesTierMonth').value=data.tierMonth;$('salesTierMonthControl').value=data.tierMonth;$('homeMore').hidden=true;$('moreHome').setAttribute('aria-expanded','false');refresh();}
  $('salesReset').addEventListener('click',reset);
  $('shortcuts').innerHTML=[['today','Today'],['yesterday','Yesterday'],['week','Last 7 days'],['month','Month to date'],['last30','Last 30 days'],['quarter','Quarter to date'],['year','Year to date'],['report','Report period']].map(([id,label])=>'<button type="button" class="quick" data-sales-range="'+id+'">'+label+'</button>').join('');
  function setRange(id){selectedRange=id;const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),end=new Date(today+'T00:00:00Z'),start=new Date(end);if(id==='yesterday'){start.setUTCDate(start.getUTCDate()-1);end.setUTCDate(end.getUTCDate()-1);}if(id==='week')start.setUTCDate(start.getUTCDate()-6);if(id==='last30')start.setUTCDate(start.getUTCDate()-29);if(id==='month')start.setUTCDate(1);if(id==='quarter'){start.setUTCDate(1);start.setUTCMonth(Math.floor(start.getUTCMonth()/3)*3);}if(id==='year'){start.setUTCDate(1);start.setUTCMonth(0);}$('homeFrom').value=id==='report'?data.from:start.toISOString().slice(0,10);$('homeTo').value=id==='report'?data.to:end.toISOString().slice(0,10);refresh();}
  $('shortcuts').addEventListener('click',event=>{const button=event.target.closest('[data-sales-range]');if(button)setRange(button.dataset.salesRange);});
  $('salesOpenFormulas').addEventListener('click',()=>$('salesFormulas').showModal());$('salesCloseFormulas').addEventListener('click',()=>$('salesFormulas').close());
  window.showModuleNotice=name=>{$('moduleNotice').textContent=name+' is not connected yet.';};window.refreshHome=refresh;
  window.salesTeamPage={definitions,groups,states,contexts,stateFor,rowsFor:selectRows,formulaRowsFor:key=>{const context=contexts.get(key);return selectRows(key).map(row=>context?.def.id==='clients'?row.slice(1):row);},scope,periodFor,refresh,exportCsv,setRange,totalFor};refresh();
})();
