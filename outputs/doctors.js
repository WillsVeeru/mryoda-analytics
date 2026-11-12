(() => {
  'use strict';

  const data=window.doctorsData,$=id=>document.getElementById(id),icon=name=>window.dashboardIcon(name);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const number=value=>Number(value).toLocaleString('en-IN'),money=value=>'₹'+number(value);
  const date=value=>new Date(value+'T00:00:00Z').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'});
  const valid=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&Number.isFinite(+new Date(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
  const definitions={
    top:{title:'Top referring doctors',columns:['Doctor','Specialization','City','Bills','Patients','Revenue'],types:['text','text','text','number','number','money'],metric:5},
    newDoctors:{title:'New doctors this period',columns:['Doctor','First bill','Bills','Revenue'],types:['text','date','number','money'],metric:3},
    dormant:{title:'Dormant doctors (active prior 90d, zero this window)',columns:['Doctor','Prior bills','Prior revenue'],types:['text','number','money'],metric:2},
    categories:{title:'Test-category mix',columns:['Test category','Bills','Tests','Revenue'],types:['text','number','number','money'],metric:3},
    tests:{title:'Individual tests',columns:['Test','Volume','Revenue'],types:['text','number','money'],metric:2}
  };
  const states=Object.fromEntries(Object.keys(definitions).map(id=>[id,{page:1,size:10,sort:null,asc:true,search:'',chart:false}]));
  const groups=[['top','Top Referrers','Users'],['newDoctors','New Doctors','UserPlus'],['dormant','Dormant Doctors','CalendarClock']];
  let active='top',showAll=false,selectedDoctor=null,selectedCategory=null;
  function scope(){const from=$('homeFrom').value,to=$('homeTo').value;return{from,to,valid:valid(from)&&valid(to)&&from<=to,full:from===data.from&&to===data.to};}
  const topKey=()=>selectedCategory?'tests':selectedDoctor?'categories':'top';
  function rowsFor(id){
    const selected=scope();if(!selected.valid||!selected.full)return [];
    let rows=id==='categories'?(data.categories[selectedDoctor]||[]):id==='tests'?(data.tests[selectedDoctor]?.[selectedCategory]||[]):data[id];
    const doctorQuery=$('doctorSearch').value.trim().toLowerCase(),query=states[id].search.trim().toLowerCase();
    rows=rows.filter(row=>(!doctorQuery||(id==='categories'||id==='tests'?selectedDoctor:row[0]).toLowerCase().includes(doctorQuery))&&(!query||row.some(value=>String(value??'').toLowerCase().includes(query)))).map(row=>[...row]);
    const state=states[id];if(state.sort!==null)rows.sort((a,b)=>{const x=a[state.sort],y=b[state.sort],order=x==null?(y==null?0:1):y==null?-1:typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y),undefined,{numeric:true});return state.asc?order:-order;});
    return rows;
  }
  function format(value,type){if(value===null||value===undefined)return '—';return type==='money'?money(value):type==='number'?number(value):type==='date'?date(value):esc(value);}
  const arrow=()=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
  function breadcrumbs(){
    if(!selectedDoctor)return '';
    return '<nav class="doctors-breadcrumb" aria-label="Doctor report breadcrumbs"><ol><li><button data-doctors-back="root">All doctors</button></li><li>'+arrow()+(selectedCategory?'<button data-doctors-back="doctor">'+esc(selectedDoctor)+'</button>':'<span aria-current="page">'+esc(selectedDoctor)+'</span>')+'</li>'+(selectedCategory?'<li>'+arrow()+'<span aria-current="page">'+esc(selectedCategory)+'</span></li>':'')+'</ol></nav>';
  }
  function contextSummary(){
    if(!selectedDoctor||!scope().valid||!scope().full)return '';
    const row=selectedCategory?data.categories[selectedDoctor]?.find(row=>row[0]===selectedCategory):data.top.find(row=>row[0]===selectedDoctor);
    if(!row)return '';
    const values=selectedCategory?[['Category bills',number(row[1])],['Category tests',number(row[2])],['Category revenue',money(row[3])]]:[['Doctor bills',number(row[3])],['Patients',number(row[4])],['Doctor revenue',money(row[5])]];
    return '<dl class="doctors-context-summary">'+values.map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+value+'</dd></div>').join('')+'</dl>';
  }
  function breakdownInfo(){
    if(!selectedDoctor)return '';
    const title=selectedCategory?selectedCategory.toLowerCase().replace(/\b\w/g,char=>char.toUpperCase())+' · Test-level breakdown':selectedDoctor+' · Category-level breakdown';
    return '<div class="doctors-breakdown-info"><h3>'+esc(title)+'</h3><p>'+(selectedCategory?'Category':'Doctor')+' summary · Selected period: '+esc($('doctorsPeriod').textContent)+' · All '+(selectedCategory?'category':'doctor')+' activity</p><p class="doctors-note">'+esc($('doctors-note-top').textContent)+'</p></div>';
  }
  function pagination(report,id,total){
    const state=states[id],pages=Math.max(1,Math.ceil(total/state.size));state.page=Math.max(1,Math.min(state.page,pages));
    const first=total?(state.page-1)*state.size+1:0,last=Math.min(state.page*state.size,total);
    return '<div class="rev-foot"><div class="rev-page-left"><span role="status">Showing '+first+'–'+last+' of '+number(total)+' available rows</span><label>Rows <select data-doctors-size="'+report+'" aria-label="Rows per page for '+esc(definitions[id].title)+'">'+[5,10,25,50,100].map(size=>'<option '+(size===state.size?'selected':'')+'>'+size+'</option>').join('')+'</select></label></div><div class="rev-page-nav">'+[['first','«',1],['previous','‹',state.page-1]].map(([action,label,page])=>'<button data-doctors-page="'+report+'" data-page="'+page+'" aria-label="'+(action==='first'?'First page':'Previous page')+'" '+(state.page===1?'disabled':'')+'>'+label+'</button>').join('')+'<span>Page '+state.page+' of '+pages+'</span>'+[['next','›',state.page+1],['last','»',pages]].map(([action,label,page])=>'<button data-doctors-page="'+report+'" data-page="'+page+'" aria-label="'+(action==='next'?'Next page':'Last page')+'" '+(state.page===pages?'disabled':'')+'>'+label+'</button>').join('')+'</div></div>';
  }
  function emptyMessage(id){
    if(!scope().valid)return 'Select a valid date range.';
    if(!scope().full)return 'These report values are available for 6–12 Nov 2026. Select Report period to view them.';
    if(id==='categories'&&!data.categories[selectedDoctor])return 'The supplied report does not show the category breakdown for this doctor.';
    if(id==='tests'&&!data.tests[selectedDoctor]?.[selectedCategory])return 'The supplied report does not show the tests for this category.';
    return 'No available records match your search.';
  }
  function renderChart(report,id,rows){
    const host=$('doctors-chart-'+report),state=states[id],def=definitions[id];host.hidden=!state.chart;
    $('doctors-chart-button-'+report).setAttribute('aria-expanded',String(state.chart));
    if(!state.chart)return;
    window.dashboardReportCharts.render(host,{key:'doctors-'+id,title:def.title,columns:def.columns,types:def.types,metric:def.metric,rows,format:(value,type)=>type==='money'?money(value):number(Math.round(value*100)/100),close:'<button type="button" data-doctors-chart="'+report+'" aria-label="Close chart">&times;</button>'});
  }
  function renderReport(report){
    const id=report==='top'?topKey():report,def=definitions[id],state=states[id],rows=rowsFor(id),pager=pagination(report,id,rows.length),visible=rows.slice((state.page-1)*state.size,state.page*state.size);
    $('doctors-heading-'+report).textContent=report==='top'?'Top referring doctors':def.title;
    const search=$('doctors-search-'+report);if(search.value!==state.search)search.value=state.search;
    search.setAttribute('aria-label','Search '+def.title);
    $('doctors-note-'+report).textContent=id==='top'?'Select a doctor to view the available test-category mix and individual tests.':id==='categories'?'Select a category to view its individual tests.':id==='tests'?'Test volumes and revenue follow the selected doctor and category.':report==='dormant'?'Active in the prior 90 days, with zero activity in the selected report window.':'';
    if(report==='top') $('doctors-report-period-top').textContent='Selected period: '+$('doctorsPeriod').textContent;
    $('doctors-note-'+report).hidden=report==='top'&&!!selectedDoctor;
    if(data.source.sampleExtension) $('doctors-note-'+report).textContent += (id==='categories'||id==='tests') ? (data.sampleDoctors.includes(selectedDoctor)?' Sample breakdown; values reconcile to the selected doctor.':' Original report breakdown.') : ' Includes 20 clearly named demo referrers.';
    $('doctors-table-'+report).innerHTML=(report==='top'?breadcrumbs()+breakdownInfo()+contextSummary():'')+'<div class="doctors-table-wrap"><table class="doctors-table" aria-label="'+esc(def.title)+'"><thead><tr>'+def.columns.map((label,index)=>'<th aria-sort="'+(state.sort===index?(state.asc?'ascending':'descending'):'none')+'"><button data-doctors-sort="'+report+'" data-column="'+index+'">'+label+'<span aria-hidden="true">'+(state.sort===index?(state.asc?'↑':'↓'):'↕')+'</span></button></th>').join('')+'</tr></thead><tbody>'+visible.map(row=>'<tr>'+row.map((value,index)=>'<td>'+(index===0&&(id==='top'||id==='categories')?'<button type="button" class="doctor-link" data-doctors-open="'+(id==='top'?'doctor':'category')+'" data-name="'+esc(value)+'" aria-label="View '+esc(value)+' '+(id==='top'?'categories':'tests')+'">'+esc(value)+arrow()+'</button>':format(value,def.types[index]))+'</td>').join('')+'</tr>').join('')+(!rows.length?'<tr><td class="doctors-empty" colspan="'+def.columns.length+'">'+emptyMessage(id)+'</td></tr>':'')+'</tbody></table></div>'+pager;
    renderChart(report,id,rows);
  }
  function renderSummary(){
    const selected=scope(),available=selected.valid&&selected.full,query=$('doctorSearch').value.trim();
    const leading=data.top[0];
    $('doctorsBannerValue').textContent=available&&!query?money(leading[5]):'—';
    $('doctorsBannerName').textContent=available&&!query?leading[0]:'Choose the report period and clear search';
    $('doctorsBannerBills').textContent=available&&!query?number(leading[3])+' bills · '+number(leading[4])+' patients':'';
    $('doctorsPeriod').textContent=selected.valid?date(selected.from)+' – '+date(selected.to):'Choose a valid date range';
    $('doctorsSummary').innerHTML=groups.map(([id,label,name])=>'<section class="revenue-kpi"><span class="doctors-kpi-icon restored-kpi-icon">'+icon(name)+'</span><h2>'+(query?'Matching available '+label.toLowerCase():label+' available')+'</h2><strong>'+(available?number(query?rowsFor(id).length:data.reportCounts[id]):'—')+'</strong><p>'+(query?'Available records matching the doctor search':'Original + sample records · '+date(data.from)+' – '+date(data.to))+'</p></section>').join('');
    $('doctorsMessage').textContent=!selected.valid?'Select a valid date range.':!selected.full?'The available report covers 6–12 Nov 2026. Other periods have no source records.':'Demo preview: original values retained; additional referrers and missing breakdowns use sample data.';
    document.querySelectorAll('.doctors-period').forEach(node=>node.textContent='Selected period: '+$('doctorsPeriod').textContent);
    $('doctorsFormulaPeriod').textContent=$('doctorsPeriod').textContent;
  }
  function syncLayout(){
    $('doctorsTabs').hidden=showAll;$('doctorsViewLabel').textContent=showAll?'Show tabs':'Show all tables';
    groups.forEach(([id])=>{const tab=$('doctors-tab-'+id),panel=$('doctors-report-'+id);tab.setAttribute('aria-selected',String(active===id));tab.tabIndex=active===id?0:-1;panel.hidden=!showAll&&active!==id;panel.setAttribute('role',showAll?'region':'tabpanel');});
  }
  function refresh(){Object.values(states).forEach(state=>state.page=1);renderSummary();groups.forEach(([id])=>renderReport(id));syncLayout();}
  function exportCsv(report){
    const id=report==='top'?topKey():report,def=definitions[id],csv='\uFEFF'+[def.columns,...rowsFor(id)].map(row=>row.map(value=>'"'+String(value??'').replace(/^[=+@-]/,m=>"'"+m).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),link=document.createElement('a');link.href=url;link.download='Doctors-'+(data.source.sampleExtension?'demo-':'')+id+'-'+scope().from+'-to-'+scope().to+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  $('homeFrom').value=data.from;$('homeTo').value=data.to;
  $('doctorsTabs').innerHTML=groups.map(([id,label,name])=>'<button type="button" role="tab" id="doctors-tab-'+id+'" data-doctors-tab="'+id+'" aria-controls="doctors-report-'+id+'">'+icon(name)+label+'</button>').join('');
  $('doctorsReports').innerHTML=groups.map(([id])=>'<section class="card doctors-report" id="doctors-report-'+id+'" role="tabpanel" aria-labelledby="doctors-tab-'+id+'"><div class="doctors-report-head"><div><h2 id="doctors-heading-'+id+'"></h2><p class="doctors-period" id="doctors-report-period-'+id+'"></p></div><div class="doctors-actions"><input type="search" placeholder="Search records" id="doctors-search-'+id+'" data-doctors-search="'+id+'"><button type="button" data-doctors-chart="'+id+'" id="doctors-chart-button-'+id+'" aria-expanded="false" aria-controls="doctors-chart-'+id+'">'+icon('ChartColumn')+'Chart</button><button type="button" data-doctors-export="'+id+'">'+icon('Download')+'Export CSV</button></div></div><p class="doctors-note" id="doctors-note-'+id+'"></p><div class="doctors-chart rev-chart" id="doctors-chart-'+id+'" hidden></div><div id="doctors-table-'+id+'"></div></section>').join('');
  $('doctorsReports').addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;const d=button.dataset;
    if(d.doctorsOpen){if(d.doctorsOpen==='doctor'){selectedDoctor=d.name;selectedCategory=null;}else selectedCategory=d.name;states[topKey()].page=1;renderReport('top');}
    else if(d.doctorsBack){selectedCategory=null;if(d.doctorsBack==='root')selectedDoctor=null;renderReport('top');}
    else if(d.doctorsSort){const id=d.doctorsSort==='top'?topKey():d.doctorsSort,state=states[id],column=Number(d.column);state.asc=state.sort===column?!state.asc:true;state.sort=column;state.page=1;renderReport(d.doctorsSort);}
    else if(d.doctorsPage){states[d.doctorsPage==='top'?topKey():d.doctorsPage].page=Number(d.page);renderReport(d.doctorsPage);}
    else if(d.doctorsChart){states[d.doctorsChart==='top'?topKey():d.doctorsChart].chart=!states[d.doctorsChart==='top'?topKey():d.doctorsChart].chart;renderReport(d.doctorsChart);}
    else if(d.doctorsExport)exportCsv(d.doctorsExport);
  });
  $('doctorsReports').addEventListener('input',event=>{const report=event.target.dataset.doctorsSearch;if(!report)return;const state=states[report==='top'?topKey():report];state.search=event.target.value;state.page=1;renderReport(report);});
  $('doctorsReports').addEventListener('change',event=>{const report=event.target.dataset.doctorsSize;if(!report)return;const state=states[report==='top'?topKey():report];state.size=Number(event.target.value);state.page=1;renderReport(report);});
  $('doctorsTabs').addEventListener('click',event=>{const tab=event.target.closest('[data-doctors-tab]');if(tab){active=tab.dataset.doctorsTab;syncLayout();}});
  $('doctorsTabs').addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const index=groups.findIndex(group=>group[0]===active),next=event.key==='Home'?0:event.key==='End'?groups.length-1:(index+(event.key==='ArrowRight'?1:-1)+groups.length)%groups.length;active=groups[next][0];syncLayout();$('doctors-tab-'+active).focus();});
  $('doctorsShowAll').addEventListener('change',event=>{showAll=event.target.checked;syncLayout();});
  $('doctorSearch').addEventListener('input',()=>{selectedDoctor=selectedCategory=null;refresh();});
  ['homeFrom','homeTo'].forEach(id=>$(id).addEventListener('change',refresh));
  $('doctorsReset').addEventListener('click',()=>{selectedDoctor=selectedCategory=null;$('doctorSearch').value='';$('homeFrom').value=data.from;$('homeTo').value=data.to;Object.values(states).forEach(state=>state.search='');refresh();});
  const shortcuts=['Today','Yesterday','Last 7 days','Month to date','Last 30 days','Report period'];
  $('shortcuts').innerHTML=shortcuts.map((label,index)=>'<button type="button" class="quick '+(index===5?'active':'')+'" data-doctors-range="'+index+'">'+label+'</button>').join('');
  $('shortcuts').addEventListener('click',event=>{const button=event.target.closest('[data-doctors-range]');if(!button)return;const index=Number(button.dataset.doctorsRange),today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),end=new Date(today+'T00:00:00Z'),start=new Date(end);if(index===1){start.setUTCDate(start.getUTCDate()-1);end.setUTCDate(end.getUTCDate()-1);}if(index===2)start.setUTCDate(start.getUTCDate()-6);if(index===3)start.setUTCDate(1);if(index===4)start.setUTCDate(start.getUTCDate()-29);$('homeFrom').value=index===5?data.from:start.toISOString().slice(0,10);$('homeTo').value=index===5?data.to:end.toISOString().slice(0,10);refresh();document.querySelectorAll('[data-doctors-range]').forEach(node=>node.classList.toggle('active',node===button));});
  const dialog=$('doctorsFormulas');$('doctorsOpenFormulas').addEventListener('click',()=>dialog.showModal());$('doctorsCloseFormulas').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();});
  window.showModuleNotice=name=>{$('moduleNotice').textContent=name+' is not connected yet.';};
  window.doctorsPage={states,scope,rowsFor,refresh,exportCsv,topKey};refresh();
})();
