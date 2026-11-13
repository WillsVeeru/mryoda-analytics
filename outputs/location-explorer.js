(() => {
  'use strict';
  const data=window.locationExplorerData,$=id=>document.getElementById(id),icon=window.dashboardIcon;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=v=>Number(v).toLocaleString('en-IN'),money=v=>'₹'+number(v),date=v=>new Date(v+'T00:00:00Z').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'});
  const definitions={
    centres:{title:'Centres',columns:['Centre','City','COCO/FOCO','Bills','Tests','Patients','Revenue'],types:['text','text','text','number','number','number','money'],metric:6},
    clients:{title:'Clients at this centre',columns:['Client ID','Client','Type','PRO','Bills','Tests','Patients','Revenue'],types:['number','text','text','text','number','number','number','money'],metric:7},
    categories:{title:'Test-category mix',columns:['Test category','Bills','Tests','Revenue'],types:['text','number','number','money'],metric:3},
    tests:{title:'Individual tests',columns:['Test','Volume','Revenue'],types:['text','number','money'],metric:2}
  };
  const states=Object.fromEntries(Object.keys(definitions).map(id=>[id,{page:1,size:10,sort:null,asc:true,search:'',chart:false}]));
  let centre=null,clientId=null,category=null;
  const level=()=>category?'tests':clientId!==null?'categories':centre?'clients':'centres';
  const clientKey=()=>centre+'::'+clientId;
  const currentCentre=()=>data.centres.find(r=>r[0]===centre),currentClient=()=>data.clients[centre]?.find(r=>r[0]===clientId);
  const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')&&Number.isFinite(+new Date(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
  const scope=()=>({valid:validDate($('homeFrom').value)&&validDate($('homeTo').value)&&$('homeFrom').value<=$('homeTo').value,full:$('homeFrom').value===data.from&&$('homeTo').value===data.to});
  const clientFilter=()=>$('locationType').value!=='All'||!!$('locationSearch').value.trim();
  function centresInScope(){return data.centres.filter(r=>($('locationCentre').value==='All'||r[0]===$('locationCentre').value)&&($('locationCity').value==='All'||r[1]===$('locationCity').value)&&($('locationModel').value==='All'||r[2]===$('locationModel').value));}
  function clientsInScope(name){const query=$('locationSearch').value.trim().toLowerCase();return(data.clients[name]||[]).filter(r=>($('locationType').value==='All'||r[2]===$('locationType').value)&&(!query||r.some(v=>String(v).toLowerCase().includes(query))));}
  function centreRows(){
    return centresInScope().map(r=>{
      if(!clientFilter())return [...r];
      const clients=clientsInScope(r[0]);return clients.length?[...r.slice(0,3),...[4,5,6,7].map(i=>clients.reduce((sum,c)=>sum+c[i],0))]:null;
    }).filter(Boolean);
  }
  function rowsFor(id=level()){
    if(!scope().valid||!scope().full)return [];
    let rows=id==='centres'?centreRows():id==='clients'?clientsInScope(centre):id==='categories'?(data.categories[clientKey()]||[]):(data.tests[clientKey()+'::'+category]||[]);
    const state=states[id],query=state.search.trim().toLowerCase();rows=rows.filter(r=>!query||r.some(v=>String(v??'').toLowerCase().includes(query))).map(r=>[...r]);
    if(state.sort!==null)rows.sort((a,b)=>{const x=a[state.sort],y=b[state.sort],order=typeof x==='number'&&typeof y==='number'?x-y:String(x??'').localeCompare(String(y??''),undefined,{numeric:true});return state.asc?order:-order;});
    return rows;
  }
  const format=(v,type)=>v===null||v===undefined?'—':type==='money'?money(v):type==='number'?number(v):esc(v);
  const arrow=()=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
  function breadcrumbs(){
    if(!centre)return '';
    const items=[['All centres','root'],[centre,clientId!==null?'centre':null]];
    if(clientId!==null)items.push([currentClient()[1],category?'client':null]);if(category)items.push([category,null]);
    return '<nav class="doctors-breadcrumb" aria-label="Location report breadcrumbs"><ol>'+items.map(([name,target],i)=>'<li>'+(i?arrow():'')+(target?'<button type="button" data-location-back="'+target+'">'+esc(name)+'</button>':'<span aria-current="page">'+esc(name)+'</span>')+'</li>').join('')+'</ol></nav>';
  }
  function breakdown(){
    if(!centre)return '';
    const name=category||currentClient()?.[1]||centre,title=name+' · '+(category?'Test-level':clientId!==null?'Category-level':'Client-level')+' breakdown';
    const label=category?'Category':clientId!==null?'Client':'Centre';
    const row=category?data.categories[clientKey()]?.find(r=>r[0]===category):clientId!==null?currentClient():currentCentre();
    const cards=category?[['Bills',row[1]],['Tests',row[2]],['Revenue',row[3]]]:clientId!==null?[['Bills',row[4]],['Tests',row[5]],['Revenue',row[7]]]:[['Bills',row[3]],['Tests',row[4]],['Revenue',row[6]]];
    return '<div class="doctors-breakdown-info"><h3>'+esc(title)+'</h3><p>'+label+' summary · Selected period: '+date(data.from)+' – '+date(data.to)+' · All '+label.toLowerCase()+' activity</p></div><dl class="doctors-context-summary">'+cards.map(([label,v],i)=>'<div><dt>'+label+'<span class="location-summary-icon" aria-hidden="true">'+icon(['Receipt','FlaskConical','Banknote'][i])+'</span></dt><dd>'+(i===2?money(v):number(v))+'</dd></div>').join('')+'</dl>';
  }
  function emptyMessage(){
    if(!scope().valid)return 'Select a valid date range.';
    if(!scope().full)return 'Choose Report period to view the available 6–12 Nov 2026 data.';
    if(level()==='clients'&&!data.clients[centre])return 'Client details for this centre are not available in the supplied report.';
    if(level()==='categories'&&!data.categories[clientKey()])return 'Category details for this client are not available in the supplied report.';
    if(level()==='tests'&&!data.tests[clientKey()+'::'+category])return 'Individual tests for this category are not available in the supplied report.';
    return 'No available records match your filters.';
  }
  function pager(id,count){
    const state=states[id],pages=Math.max(1,Math.ceil(count/state.size));state.page=Math.max(1,Math.min(state.page,pages));
    return '<div class="rev-foot"><div class="rev-page-left"><span role="status">Showing '+(count?(state.page-1)*state.size+1:0)+'–'+Math.min(count,state.page*state.size)+' of '+count+' available rows</span><label>Rows <select data-location-size="true" aria-label="Rows per page">'+[5,10,25,50,100].map(n=>'<option '+(state.size===n?'selected':'')+'>'+n+'</option>').join('')+'</select></label></div><div class="rev-page-nav">'+[['First page','«',1,state.page===1],['Previous page','‹',state.page-1,state.page===1],['Next page','›',state.page+1,state.page===pages],['Last page','»',pages,state.page===pages]].map(([name,text,page,disabled],i)=>(i===2?'<span>Page '+state.page+' of '+pages+'</span>':'')+'<button type="button" data-location-page="'+page+'" aria-label="'+name+'" '+(disabled?'disabled':'')+'>'+text+'</button>').join('')+'</div></div>';
  }
  function renderTable(){
    const id=level(),def=definitions[id],state=states[id],rows=rowsFor(),pagination=pager(id,rows.length),visible=rows.slice((state.page-1)*state.size,state.page*state.size);
    $('locationTableSearch').value=state.search;$('locationTableSearch').setAttribute('aria-label','Search '+def.title);
    $('locationReportNote').textContent=id==='centres'?'Select a centre to explore its clients, test categories and individual tests.':id==='clients'?'Select a client to view its test-category mix.':id==='categories'?'Select a category to view individual tests.':'Individual test volume and revenue for the selected category.';
    $('locationPeriod').textContent=scope().valid?'Selected period: '+date($('homeFrom').value)+' – '+date($('homeTo').value):'Choose valid dates';
    $('locationTable').innerHTML=breadcrumbs()+(scope().valid&&scope().full?breakdown():'')+'<div class="doctors-table-wrap"><table class="doctors-table location-table" aria-label="'+esc(def.title)+'"><thead><tr>'+def.columns.map((label,i)=>'<th aria-sort="'+(state.sort===i?(state.asc?'ascending':'descending'):'none')+'"><button data-location-sort="'+i+'">'+label+'<span aria-hidden="true">'+(state.sort===i?(state.asc?'↑':'↓'):'↕')+'</span></button></th>').join('')+'</tr></thead><tbody>'+visible.map(row=>'<tr>'+row.map((v,i)=>'<td>'+((id==='centres'&&i===0||id==='clients'&&i===1||id==='categories'&&i===0)?'<button type="button" class="doctor-link" data-location-open="'+esc(id==='clients'?row[0]:v)+'" aria-label="View '+esc(v)+' breakdown">'+esc(v)+arrow()+'</button>':format(v,def.types[i]))+'</td>').join('')+'</tr>').join('')+(!rows.length?'<tr><td class="doctors-empty" colspan="'+def.columns.length+'">'+emptyMessage()+'</td></tr>':'')+'</tbody></table></div>'+pagination;
    const chart=$('locationChart');chart.hidden=!state.chart;$('locationChartToggle').setAttribute('aria-expanded',String(state.chart));
    if(state.chart)window.dashboardReportCharts.render(chart,{key:'location-'+id,title:def.title,columns:def.columns,types:def.types,metric:def.metric,valueIndices:def.types.map((t,i)=>t==='number'||t==='money'?i:-1).filter(i=>i>=0&&def.columns[i]!=='Client ID'),rows,format:(v,t)=>t==='money'?money(v):number(v),close:'<button type="button" data-location-chart-close="true" aria-label="Close chart">&times;</button>'});
  }
  function renderSummary(){
    const available=scope().valid&&scope().full,noFilters=['locationCentre','locationCity','locationModel','locationType'].every(id=>$(id).value==='All')&&!$('locationSearch').value.trim();
    let revenue,caption;
    if(category){const row=data.categories[clientKey()].find(r=>r[0]===category);revenue=money(row[3]);caption='Selected category';}
    else if(clientId!==null){const row=currentClient();revenue=money(row[7]);caption='Selected client';}
    else if(centre){const row=centreRows().find(r=>r[0]===centre)||currentCentre();revenue=money(row[6]);caption=clientFilter()?'Matching available clients':'Selected centre';}
    else if(noFilters){revenue=data.summary.revenueLabel;caption='All centres · Source report';}
    else{const rows=centreRows(),total=i=>rows.reduce((sum,r)=>sum+r[i],0);revenue=money(total(6));caption=clientFilter()?'Matching available clients':'Matching available centres';}
    const kpiRows=centreRows(),total=i=>kpiRows.reduce((sum,row)=>sum+row[i],0);
    const values=[['Centres',noFilters?data.summary.centres:kpiRows.length,'MapPin'],['Tests',noFilters?data.summary.tests:total(4),'TestTube'],['Patients',noFilters?data.summary.patients:total(5),'Users']];
    const kpiCaption=noFilters?'All centres \u00b7 Selected period':'Current filters \u00b7 Selected period';
    $('locationRevenue').textContent=available?revenue:'—';$('locationScope').textContent=caption;
    $('locationSummary').innerHTML=values.map(([label,v,name])=>'<section class="revenue-kpi"><span class="doctors-kpi-icon restored-kpi-icon">'+icon(name)+'</span><h2>'+label+'</h2><strong>'+(available?(typeof v==='number'?number(v):esc(v)):'—')+'</strong><p>'+kpiCaption+'</p></section>').join('');
    $('locationMessage').textContent=!available?'The available report covers 6–12 Nov 2026. Select Report period to restore it.':clientFilter()?'Client filters use the available captured client rows.':'';
  }
  function refresh(){Object.values(states).forEach(s=>s.page=1);renderSummary();renderTable();}
  function exportCsv(){const id=level(),def=definitions[id],csv='\uFEFF'+[def.columns,...rowsFor()].map(row=>row.map(v=>'"'+String(v??'').replace(/^[=+@-]/,m=>"'"+m).replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),a=document.createElement('a');a.href=url;a.download='Location-Explorer-'+id+(clientId!==null?'-'+clientId:'')+'-'+$('homeFrom').value+'-to-'+$('homeTo').value+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $('homeFrom').value=data.from;$('homeTo').value=data.to;
  $('locationChartToggle').innerHTML=icon('ChartColumn')+'Chart';$('locationExport').innerHTML=icon('Download')+'Export CSV';
  for(const [id,values]of [['locationCentre',data.centres.map(r=>r[0])],['locationCity',data.centres.map(r=>r[1])],['locationModel',data.centres.map(r=>r[2])],['locationType',['B2B','PUP','Walk-In']]]){$(id).innerHTML='<option>All</option>'+[...new Set(values)].sort().map(v=>'<option>'+esc(v)+'</option>').join('');$(id).value='All';}
  $('locationReport').addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;const d=button.dataset,state=states[level()];
    if(d.locationOpen!==undefined){if(level()==='centres')centre=d.locationOpen;else if(level()==='clients')clientId=Number(d.locationOpen);else if(level()==='categories')category=d.locationOpen;states[level()].page=1;renderSummary();renderTable();}
    else if(d.locationBack){if(d.locationBack==='root')centre=null;if(d.locationBack==='root'||d.locationBack==='centre')clientId=null;category=null;renderSummary();renderTable();}
    else if(d.locationSort!==undefined){const index=Number(d.locationSort);state.asc=state.sort===index?!state.asc:true;state.sort=index;state.page=1;renderTable();}
    else if(d.locationPage){state.page=Number(d.locationPage);renderTable();}
    else if(d.locationChartClose){state.chart=false;renderTable();}
  });
  $('locationReport').addEventListener('change',event=>{if(event.target.dataset.locationSize){states[level()].size=Number(event.target.value);states[level()].page=1;renderTable();}});
  $('locationTableSearch').addEventListener('input',event=>{states[level()].search=event.target.value;states[level()].page=1;renderTable();});
  $('locationChartToggle').addEventListener('click',()=>{states[level()].chart=!states[level()].chart;renderTable();});$('locationExport').addEventListener('click',exportCsv);
  function clearPath(){centre=null;clientId=null;category=null;}
  for(const id of ['homeFrom','homeTo','locationCentre','locationCity','locationModel','locationType'])$(id).addEventListener('change',()=>{clearPath();refresh();});
  $('locationSearch').addEventListener('input',()=>{clearPath();refresh();});
  function reset(){clearPath();$('homeFrom').value=data.from;$('homeTo').value=data.to;$('locationSearch').value='';for(const id of ['locationCentre','locationCity','locationModel','locationType'])$(id).value='All';Object.values(states).forEach(s=>s.search='');refresh();}
  $('locationReset').addEventListener('click',reset);$('locationReportPeriod').addEventListener('click',reset);
  const dialog=$('locationFormulas');$('locationOpenFormulas').addEventListener('click',()=>dialog.showModal());$('locationCloseFormulas').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  window.showModuleNotice=name=>{$('moduleNotice').textContent=name+' is not connected yet.';};
  window.locationExplorerPage={states,scope,level,rowsFor,refresh,exportCsv};refresh();
})();
