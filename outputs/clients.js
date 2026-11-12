(() => {
  'use strict';
  const data=window.clientsData,$=id=>document.getElementById(id),icon=window.dashboardIcon;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=v=>Number(v).toLocaleString('en-IN'),money=v=>'₹'+number(v),date=v=>new Date(v+'T00:00:00Z').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'});
  const definitions={
    top:{title:'Top clients',columns:['Client ID','Client','Type','PRO','City','Bills','Patients','Revenue'],types:['number','text','text','text','text','number','number','money'],metric:7},
    groups:{title:'Revenue by client group',columns:['Group','Active clients','Bills','Patients','Revenue'],types:['text','number','number','number','money'],metric:4},
    pup:{title:'PUP test-type (department) breakdown',columns:['Test category','Bills','Tests','Revenue'],types:['text','number','number','money'],metric:3},
    newClients:{title:'New clients onboarded',columns:['Client ID','Client','Onboarded','Sales manager','Bills since','Revenue since'],types:['number','text','date','text','number','money'],metric:5},
    dormant:{title:'Dormant clients',columns:['Client ID','Client','Sales manager','Prior bills'],types:['number','text','text','number'],metric:3},
    categories:{title:'Test-category mix',columns:['Test category','Bills','Tests','Revenue'],types:['text','number','number','money'],metric:3},
    tests:{title:'Individual tests',columns:['Test','Volume','Revenue'],types:['text','number','money'],metric:2}
  };
  const reports=[['top','Top Clients','ClipboardList'],['groups','Client Groups','Users'],['pup','PUP Breakdown','FlaskConical'],['newClients','New Clients','UserPlus'],['dormant','Dormant Clients','CalendarClock']];
  const states=Object.fromEntries(Object.keys(definitions).map(id=>[id,{page:1,size:10,sort:null,asc:true,search:'',chart:false}]));
  let active='top',showAll=false,clientId=null,category=null;
  const key=()=>category?'tests':clientId?'categories':'top';
  const scope=()=>({valid:!!$('homeFrom').value&&!!$('homeTo').value&&$('homeFrom').value<=$('homeTo').value,full:$('homeFrom').value===data.from&&$('homeTo').value===data.to});
  const currentClient=()=>data.top.find(row=>row[0]===clientId);
  function filterTop(){
    const query=$('clientSearch').value.trim().toLowerCase(),type=$('clientType').value,city=$('clientCity').value,pro=$('clientPro').value;
    return data.top.filter(row=>(type==='All'||row[2]===type)&&(city==='All'||row[4]===city)&&(pro==='All'||row[3]===pro)&&(!query||row.some(v=>String(v).toLowerCase().includes(query))));
  }
  function groupsForScope(){
    const specific=$('clientSearch').value.trim()||$('clientCity').value!=='All'||$('clientPro').value!=='All',type=$('clientType').value;
    return specific?['B2B','Walk-In','PUP'].map(group=>{const members=filterTop().filter(r=>r[2]===group);return[group,members.length,...[5,6,7].map(i=>members.reduce((sum,r)=>sum+r[i],0))];}).filter(r=>r[1]):data.groups.filter(r=>type==='All'||r[0]===type);
  }
  function rowsFor(id){
    if(!scope().valid||!scope().full)return [];
    let rows;
    const specific=$('clientSearch').value.trim()||$('clientCity').value!=='All'||$('clientPro').value!=='All',type=$('clientType').value;
    if(id==='top')rows=filterTop();
    else if(id==='categories'||id==='tests')rows=filterTop().some(row=>row[0]===clientId)?id==='categories'?(data.categories[clientId]||[]):(data.tests[clientId]?.[category]||[]):[];
    else if(id==='groups'){
      rows=groupsForScope();
    }else if(id==='pup')rows=!specific&&(type==='All'||type==='PUP')?data.pup:[];
    else{
      const query=$('clientSearch').value.trim().toLowerCase();
      rows=type==='All'&&$('clientCity').value==='All'&&$('clientPro').value==='All'?data[id].filter(row=>!query||row.some(v=>String(v??'').toLowerCase().includes(query))):[];
    }
    const state=states[id],query=state.search.toLowerCase().trim();rows=rows.filter(row=>!query||row.some(v=>String(v??'').toLowerCase().includes(query))).map(row=>[...row]);
    if(state.sort!==null)rows.sort((a,b)=>{const x=a[state.sort],y=b[state.sort],order=x==null?(y==null?0:1):y==null?-1:typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y),undefined,{numeric:true});return state.asc?order:-order;});
    return rows;
  }
  const format=(value,type)=>value===null?'—':type==='money'?money(value):type==='number'?number(value):type==='date'?date(value):esc(value);
  const arrow=()=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
  function breadcrumb(){return !clientId?'':'<nav class="doctors-breadcrumb" aria-label="Client report breadcrumbs"><ol><li><button data-client-back="root">All clients</button></li><li>'+arrow()+(category?'<button data-client-back="client">'+esc(currentClient()[1])+'</button>':'<span aria-current="page">'+esc(currentClient()[1])+'</span>')+'</li>'+(category?'<li>'+arrow()+'<span aria-current="page">'+esc(category)+'</span></li>':'')+'</ol></nav>';}
  function summary(){
    if(!clientId||!scope().full||!filterTop().some(r=>r[0]===clientId))return '';
    const row=category?data.categories[clientId].find(r=>r[0]===category):currentClient();
    const cards=category?[['Category bills',row[1]],['Category tests',row[2]],['Category revenue',row[3]]]:[['Client bills',row[5]],['Patients',row[6]],['Client revenue',row[7]]];
    return '<dl class="doctors-context-summary">'+cards.map(([label,v],i)=>'<div><dt>'+label+'</dt><dd>'+(i===2?money(v):number(v))+'</dd></div>').join('')+'</dl>';
  }
  function breakdownInfo(){
    if(!clientId)return '';
    const title=category?category+' · Test-level breakdown':currentClient()[1]+' · Category-level breakdown';
    return '<div class="doctors-breakdown-info"><h3>'+esc(title)+'</h3><p>'+(category?'Category':'Client')+' summary · '+esc($('clients-period-top').textContent)+' · All '+(category?'category':'client')+' activity</p><p class="doctors-note">'+esc($('clients-note-top').textContent)+'</p></div>';
  }
  function pager(report,id,count){
    const state=states[id],pages=Math.max(1,Math.ceil(count/state.size));state.page=Math.max(1,Math.min(state.page,pages));
    return '<div class="rev-foot"><div class="rev-page-left"><span role="status">Showing '+(count?(state.page-1)*state.size+1:0)+'–'+Math.min(state.page*state.size,count)+' of '+count+' available rows</span><label>Rows <select data-client-size="'+report+'" aria-label="Rows per page">'+[5,10,25,50,100].map(n=>'<option '+(n===state.size?'selected':'')+'>'+n+'</option>').join('')+'</select></label></div><div class="rev-page-nav">'+[['First page','«',1,state.page===1],['Previous page','‹',state.page-1,state.page===1],['Next page','›',state.page+1,state.page===pages],['Last page','»',pages,state.page===pages]].map(([name,label,n,disabled],i)=>(i===2?'<span>Page '+state.page+' of '+pages+'</span>':'')+'<button type="button" data-client-page="'+report+'" data-page="'+n+'" aria-label="'+name+'" '+(disabled?'disabled':'')+'>'+label+'</button>').join('')+'</div></div>';
  }
  function empty(id){return !scope().valid?'Select a valid date range.':!scope().full?'Choose Report period to view 12 Nov 2026.':id==='tests'&&!data.tests[clientId]?.[category]?'Test details for this category are not available in the supplied report.':'No available records match the selected filters.';}
  function renderReport(report){
    const id=report==='top'?key():report,def=definitions[id],state=states[id],rows=rowsFor(id),pagination=pager(report,id,rows.length);
    $('clients-heading-'+report).textContent=report==='top'?'Top clients':def.title;
    $('clients-period-'+report).textContent='Selected period: '+($('homeFrom').value?date($('homeFrom').value):'—')+' – '+($('homeTo').value?date($('homeTo').value):'—');
    $('clients-search-'+report).value=state.search;
    $('clients-note-'+report).textContent=id==='top'?'Select a client to explore categories and individual tests.':id==='categories'?'Select a category to view its available tests.':id==='dormant'?'Billed in the prior 90 days, with none in the selected period. Prior bill values are not fully visible in the source.':id==='groups'?'Client-group totals for the selected scope.':id==='newClients'?'Onboarding date, assigned sales manager and activity since onboarding.':'';
    $('clients-note-'+report).hidden=report==='top'&&!!clientId;
    const visible=rows.slice((state.page-1)*state.size,state.page*state.size);
    $('clients-table-'+report).innerHTML=(report==='top'?breadcrumb()+breakdownInfo()+summary():'')+'<div class="doctors-table-wrap"><table class="doctors-table" aria-label="'+esc(def.title)+'"><thead><tr>'+def.columns.map((label,i)=>'<th aria-sort="'+(state.sort===i?(state.asc?'ascending':'descending'):'none')+'"><button data-client-sort="'+report+'" data-column="'+i+'">'+label+'<span aria-hidden="true">'+(state.sort===i?(state.asc?'↑':'↓'):'↕')+'</span></button></th>').join('')+'</tr></thead><tbody>'+visible.map(row=>'<tr>'+row.map((v,i)=>'<td>'+((id==='top'&&i===1||id==='categories'&&i===0)?'<button type="button" class="doctor-link" data-client-open="'+(id==='top'?'client':'category')+'" data-name="'+esc(id==='top'?row[0]:v)+'" aria-label="View '+esc(v)+' breakdown">'+esc(v)+arrow()+'</button>':format(v,def.types[i]))+'</td>').join('')+'</tr>').join('')+(!rows.length?'<tr><td class="doctors-empty" colspan="'+def.columns.length+'">'+empty(id)+'</td></tr>':'')+'</tbody></table></div>'+pagination;
    const host=$('clients-chart-'+report);host.hidden=!state.chart;
    $('clients-chart-button-'+report).setAttribute('aria-expanded',String(state.chart));
    if(state.chart)window.dashboardReportCharts.render(host,{key:'clients-'+id,title:def.title,columns:def.columns,types:def.types,metric:def.metric,valueIndices:def.types.map((t,i)=>t==='number'||t==='money'?i:-1).filter(i=>i>=0&&!(def.columns[i]==='Client ID')),rows,format:(v,type)=>type==='money'?money(v):number(v),close:'<button type="button" data-client-chart="'+report+'" aria-label="Close chart">&times;</button>'});
  }
  function renderSummary(){
    const available=scope().valid&&scope().full,groups=available?groupsForScope():[],specific=$('clientSearch').value.trim()||$('clientCity').value!=='All'||$('clientPro').value!=='All';
    const total=i=>groups.reduce((sum,row)=>sum+row[i],0),title=specific?'Matching available':'Selected scope';
    $('clientsBannerValue').textContent=available?money(total(4)):'—';$('clientsBannerNote').textContent=title+' · '+(available?number(total(1)):0)+' active clients';
    const cards=[['Active clients',total(1),'Users'],['Bills',total(2),'Receipt'],['Patients',total(3),'Users']];
    $('clientsSummary').innerHTML=cards.map(([label,v,name])=>'<section class="revenue-kpi"><span class="doctors-kpi-icon restored-kpi-icon">'+icon(name)+'</span><h2>'+label+'</h2><strong>'+(available?number(v):'—')+'</strong><p>'+title+' · '+date(data.from)+'</p></section>').join('');
    $('clientsMessage').textContent=!available?'The available report covers 12 Nov 2026. Select Report period to restore it.':specific?'Client summaries use the available matching client rows.':'';
  }
  function sync(){
    $('clientsTabs').hidden=showAll;$('clientsViewLabel').textContent=showAll?'Show tabs':'Show all tables';
    reports.forEach(([id])=>{const tab=$('clients-tab-'+id),panel=$('clients-report-'+id);tab.setAttribute('aria-selected',String(active===id));tab.tabIndex=active===id?0:-1;panel.hidden=!showAll&&active!==id;panel.setAttribute('role',showAll?'region':'tabpanel');});
  }
  function refresh(){Object.values(states).forEach(s=>s.page=1);renderSummary();reports.forEach(([id])=>renderReport(id));sync();}
  function exportCsv(report){
    const id=report==='top'?key():report,def=definitions[id],csv='\uFEFF'+[def.columns,...rowsFor(id)].map(row=>row.map(v=>'"'+String(v??'').replace(/^[=+@-]/,m=>"'"+m).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),a=document.createElement('a');a.href=url;a.download='Clients-'+id+'-'+$('homeFrom').value+'-to-'+$('homeTo').value+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  $('homeFrom').value=data.from;$('homeTo').value=data.to;
  for(const [id,index]of [['clientType',2],['clientCity',4],['clientPro',3]]){$(id).innerHTML='<option>All</option>'+[...new Set(data.top.map(r=>r[index]))].sort().map(v=>'<option>'+esc(v)+'</option>').join('');$(id).value='All';}
  $('clientsTabs').innerHTML=reports.map(([id,label,name])=>'<button type="button" role="tab" id="clients-tab-'+id+'" data-client-tab="'+id+'" aria-controls="clients-report-'+id+'">'+icon(name)+label+'</button>').join('');
  $('clientsReports').innerHTML=reports.map(([id])=>'<section class="card doctors-report" id="clients-report-'+id+'" role="tabpanel" aria-labelledby="clients-tab-'+id+'"><div class="doctors-report-head"><div><h2 id="clients-heading-'+id+'"></h2><p class="doctors-period" id="clients-period-'+id+'"></p></div><div class="doctors-actions"><input type="search" placeholder="Search records" id="clients-search-'+id+'" data-client-search="'+id+'" aria-label="Search '+definitions[id].title+'"><button type="button" data-client-chart="'+id+'" id="clients-chart-button-'+id+'" aria-expanded="false" aria-controls="clients-chart-'+id+'">'+icon('ChartColumn')+'Chart</button><button type="button" data-client-export="'+id+'">'+icon('Download')+'Export CSV</button></div></div><p class="doctors-note" id="clients-note-'+id+'"></p><div class="doctors-chart rev-chart" id="clients-chart-'+id+'" hidden></div><div id="clients-table-'+id+'"></div></section>').join('');
  $('clientsReports').addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;const d=button.dataset,report=d.clientSort||d.clientPage||d.clientChart,id=report==='top'?key():report,state=states[id];
    if(d.clientOpen){if(d.clientOpen==='client'){clientId=Number(d.name);category=null;}else category=d.name;states[key()].page=1;renderReport('top');}
    else if(d.clientBack){category=null;if(d.clientBack==='root')clientId=null;renderReport('top');}
    else if(d.clientSort){const col=Number(d.column);state.asc=state.sort===col?!state.asc:true;state.sort=col;state.page=1;renderReport(report);}
    else if(d.clientPage){state.page=Number(d.page);renderReport(report);}
    else if(d.clientChart){state.chart=!state.chart;renderReport(report);}
    else if(d.clientExport)exportCsv(d.clientExport);
  });
  $('clientsReports').addEventListener('input',event=>{const report=event.target.dataset.clientSearch;if(!report)return;const id=report==='top'?key():report;states[id].search=event.target.value;states[id].page=1;renderReport(report);});
  $('clientsReports').addEventListener('change',event=>{const report=event.target.dataset.clientSize;if(!report)return;states[report==='top'?key():report].size=Number(event.target.value);renderReport(report);});
  $('clientsTabs').addEventListener('click',event=>{const tab=event.target.closest('[data-client-tab]');if(tab){active=tab.dataset.clientTab;sync();}});
  $('clientsTabs').addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const i=reports.findIndex(r=>r[0]===active),next=event.key==='Home'?0:event.key==='End'?reports.length-1:(i+(event.key==='ArrowRight'?1:-1)+reports.length)%reports.length;active=reports[next][0];sync();$('clients-tab-'+active).focus();});
  $('clientsShowAll').addEventListener('change',event=>{showAll=event.target.checked;sync();});
  for(const id of ['homeFrom','homeTo','clientType','clientCity','clientPro'])$(id).addEventListener('change',()=>{clientId=category=null;refresh();});
  $('clientSearch').addEventListener('input',()=>{clientId=category=null;refresh();});
  function reset(){clientId=category=null;$('homeFrom').value=data.from;$('homeTo').value=data.to;$('clientSearch').value='';for(const id of ['clientType','clientCity','clientPro'])$(id).value='All';Object.values(states).forEach(s=>s.search='');refresh();}
  $('clientsReset').addEventListener('click',reset);$('clientsReportPeriod').addEventListener('click',reset);
  const dialog=$('clientsFormulas');$('clientsOpenFormulas').addEventListener('click',()=>dialog.showModal());$('clientsCloseFormulas').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  window.showModuleNotice=name=>{$('moduleNotice').textContent=name+' is not connected yet.';};
  window.clientsPage={states,rowsFor,scope,refresh,exportCsv,key};refresh();
})();
