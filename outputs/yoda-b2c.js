(() => {
  'use strict';
  const data=window.yodaB2CData,$=id=>document.getElementById(id),icon=window.dashboardIcon;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=value=>Number(value).toLocaleString('en-IN'),money=value=>'₹'+number(value);
  const date=value=>new Date(value+'T00:00:00Z').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'});
  const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&Number.isFinite(+new Date(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
  const groups=[['overview','Overview','ChartPie'],['acquisition','Acquisition','TrendingUp'],['collection','Collection','House'],['referrers','Referrers','Users'],['conversion','Conversion & Trends','Activity']];
  const revenueColumns=['Bills','Patients','Tests','Revenue','Avg bill','Share'],revenueTypes=['number','number','number','money','money','percent'];
  const definitions=[
    {id:'booking',group:'overview',title:'Revenue by booking channel',columns:['Booked via',...revenueColumns],types:['text',...revenueTypes],metric:4},
    {id:'referral',group:'overview',title:'Revenue by referral source',columns:['Referred by',...revenueColumns],types:['text',...revenueTypes],metric:4},
    {id:'leads',group:'acquisition',title:'Revenue by lead source',columns:['Lead platform',...revenueColumns],types:['text',...revenueTypes],metric:4},
    {id:'campaigns',group:'acquisition',title:'Revenue by ad campaign',columns:['Campaign',...revenueColumns],types:['text',...revenueTypes],metric:4},
    {id:'collection',group:'collection',title:'Home collection vs centre visit',columns:['Booked via','Home bills','Home revenue','Centre bills','Centre revenue'],types:['text','number','money','number','money'],metric:2,wide:true},
    {id:'pros',group:'referrers',title:'PROs driving Mr Yoda B2C',columns:['PRO',...revenueColumns],types:['text',...revenueTypes],metric:4},
    {id:'doctors',group:'referrers',title:'Referring doctors (no PRO)',columns:['Doctor',...revenueColumns],types:['text',...revenueTypes],metric:4},
    {id:'conversion',group:'conversion',title:'Booking conversion',columns:['Booked via','Orders','Billed','Cancelled','Pending','Billed %'],types:['text','number','number','number','number','percent'],metric:2,wide:true},
    {id:'daily',group:'conversion',title:'Daily revenue by source',columns:['Date','Bills','Revenue','Home','Centre','PRO','Doctor','Self / direct'],types:['date','number','money','money','money','money','money','money'],metric:2,wide:true}
  ];
  const states=Object.fromEntries(definitions.map(def=>[def.id,{page:1,size:10,sort:null,asc:true,search:'',chart:false}]));
  let active='overview',all=false,selectedRange='report';
  function scope(){const from=$('homeFrom').value,to=$('homeTo').value;return{from,to,valid:validDate(from)&&validDate(to)&&from<=to,full:from===data.from&&to===data.to};}
  function rowsFor(id){
    const selected=scope(),state=states[id];
    if(!selected.valid)return [];
    let rows=(id==='daily'?data.daily.filter(row=>row[0]>=selected.from&&row[0]<=selected.to):selected.full?data[id]:[]).filter(row=>!state.search||row.some(value=>String(value).toLowerCase().includes(state.search.toLowerCase()))).map(row=>[...row]);
    if(state.sort!==null)rows.sort((a,b)=>{const x=a[state.sort],y=b[state.sort];return(typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y),undefined,{numeric:true}))*(state.asc?1:-1);});
    return rows;
  }
  function format(value,type){return type==='money'?money(value):type==='percent'?value.toFixed(1)+'%':type==='number'?number(value):type==='date'?date(value):esc(value);}
  function emptyMessage(id){if(!scope().valid)return 'Select a valid date range.';if(id!=='daily'&&!scope().full)return 'Select Report period to view this summary.';return states[id].search?'No records match your search.':id==='campaigns'?'No ad campaign data for the selected period.':'No available records for the selected dates.';}
  function pagination(def,total){
    const state=states[def.id],pages=Math.max(1,Math.ceil(total/state.size));state.page=Math.max(1,Math.min(state.page,pages));
    return '<div class="rev-foot"><div class="rev-page-left"><span role="status">'+(total?'Showing '+((state.page-1)*state.size+1)+'–'+Math.min(state.page*state.size,total)+' of '+total+' rows':'0 rows')+'</span><label>Rows <select data-size="'+def.id+'" aria-label="Rows per page: '+esc(def.title)+'">'+[5,10,25,50].map(size=>'<option '+(size===state.size?'selected':'')+'>'+size+'</option>').join('')+'</select></label></div><div class="rev-page-nav">'+[['First page','«',1,state.page===1],['Previous page','‹',state.page-1,state.page===1]].map(([label,symbol,page,disabled])=>'<button type="button" data-page="'+def.id+'" data-target="'+page+'" aria-label="'+label+'" '+(disabled?'disabled':'')+'>'+symbol+'</button>').join('')+'<span>Page '+state.page+' of '+pages+'</span>'+[['Next page','›',state.page+1,state.page===pages],['Last page','»',pages,state.page===pages]].map(([label,symbol,page,disabled])=>'<button type="button" data-page="'+def.id+'" data-target="'+page+'" aria-label="'+label+'" '+(disabled?'disabled':'')+'>'+symbol+'</button>').join('')+'</div></div>';
  }
  function renderTable(def){
    const rows=rowsFor(def.id),state=states[def.id],pager=pagination(def,rows.length),visible=rows.slice((state.page-1)*state.size,state.page*state.size);
    $('b2c-table-'+def.id).innerHTML='<div class="doctors-table-wrap"><table class="doctors-table" data-b2c-report="'+def.id+'" aria-label="'+esc(def.title)+'"><thead><tr>'+def.columns.map((label,i)=>'<th aria-sort="'+(state.sort===i?(state.asc?'ascending':'descending'):'none')+'"><button type="button" data-sort="'+def.id+'" data-column="'+i+'" aria-label="Sort '+esc(label)+' '+(state.sort===i&&state.asc?'high to low':'low to high')+'">'+label+'<span aria-hidden="true">'+(state.sort===i?(state.asc?'↑':'↓'):'↕')+'</span></button></th>').join('')+'</tr></thead><tbody>'+visible.map(row=>'<tr>'+row.map((value,i)=>'<td>'+format(value,def.types[i])+'</td>').join('')+'</tr>').join('')+(!rows.length?'<tr><td class="doctors-empty" colspan="'+def.columns.length+'">'+emptyMessage(def.id)+'</td></tr>':'')+'</tbody></table></div>'+pager;
    const chart=$('b2c-chart-'+def.id);chart.hidden=!state.chart;
    $('b2c-chart-button-'+def.id).setAttribute('aria-expanded',String(state.chart));
    $('b2c-export-'+def.id).disabled=!rows.length;
    if(state.chart)window.dashboardReportCharts.render(chart,{key:'b2c-'+def.id,title:def.title,columns:def.columns,types:def.types,metric:def.metric,rows,format,close:'<button type="button" data-chart="'+def.id+'" aria-label="Close chart">&times;</button>'});
  }
  function renderSummary(){
    const selected=scope(),available=selected.valid&&selected.full,s=data.summary;
    $('b2cRevenue').textContent=available?s.revenueLabel:'—';
    $('b2cBills').textContent=available?number(s.bills)+' bills':'Select Report period';
    const cards=[['Home collection',s.homeRevenueLabel,number(s.homeBills)+' bills','House'],['PRO-sourced',s.proRevenueLabel,'Orders carrying a PRO','Users'],['Doctor-referred',s.doctorRevenueLabel,'Real referrer, no PRO','Stethoscope'],['Booked online',s.onlineRevenueLabel,'Mobile app + website','Smartphone'],['Bills with an order',s.matchedPercent.toFixed(1)+'%','Matched to a Mr Yoda order','ClipboardList']];
    $('b2cSummary').innerHTML=cards.map(([label,value,note,name])=>'<section class="revenue-kpi"><span class="doctors-kpi-icon restored-kpi-icon">'+icon(name)+'</span><h2>'+label+'</h2><strong>'+(available?value:'—')+'</strong><p>'+note+'</p></section>').join('');
    const period=selected.valid?'Selected period: '+date(selected.from)+' – '+date(selected.to):'Choose a valid date range';
    document.querySelectorAll('.b2c-period').forEach(node=>node.textContent=period);
    $('b2cMessage').textContent=!selected.valid?'Select a valid date range.':!selected.full?'Summary values require the complete report period. Daily revenue uses the available dates within your selection.':'';
    document.querySelectorAll('[data-b2c-range]').forEach(button=>button.classList.toggle('active',button.dataset.b2cRange===selectedRange));
  }
  function syncLayout(){
    $('b2cTabs').hidden=all;$('b2cAllTitle').hidden=!all;
    $('b2cViewLabel').textContent=all?'Show tabs':'Show all tables';$('b2cShowAll').setAttribute('aria-checked',String(all));$('b2cShowAll').setAttribute('aria-label',all?'Show tabs':'Show all tables');
    groups.forEach(([id])=>{const panel=$('b2c-group-'+id),tab=$('b2c-tab-'+id),selected=id===active;panel.hidden=!all&&!selected;panel.setAttribute('role',all?'region':'tabpanel');panel.setAttribute('aria-labelledby',all?'b2c-title-'+id:tab.id);tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;$('b2c-title-'+id).hidden=!all;});
  }
  function refresh(){Object.values(states).forEach(state=>state.page=1);renderSummary();definitions.forEach(renderTable);syncLayout();}
  function exportCsv(id){
    const def=definitions.find(item=>item.id===id),csv='\uFEFF'+[def.columns,...rowsFor(id)].map(row=>row.map(value=>'"'+String(value??'').replace(/^[=+@-]/,match=>"'"+match).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),link=document.createElement('a');link.href=url;link.download='Mr-Yoda-B2C-'+id+'-'+scope().from+'-to-'+scope().to+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  $('homeFrom').value=data.from;$('homeTo').value=data.to;
  $('b2cTabs').innerHTML=groups.map(([id,label,name])=>'<button type="button" id="b2c-tab-'+id+'" role="tab" data-tab="'+id+'" aria-controls="b2c-group-'+id+'">'+icon(name)+'<span>'+label+'</span></button>').join('');
  $('b2cReports').innerHTML=groups.map(([id,label])=>'<div class="b2c-report-group" id="b2c-group-'+id+'"><h2 class="b2c-group-title" id="b2c-title-'+id+'">'+label+'</h2>'+definitions.filter(def=>def.group===id).map(def=>'<section class="card doctors-report '+(def.wide?'b2c-wide':'')+'" id="b2c-report-'+def.id+'" aria-labelledby="b2c-heading-'+def.id+'"><div class="doctors-report-head"><div><h2 id="b2c-heading-'+def.id+'">'+def.title+'</h2><p class="doctors-period b2c-period"></p></div><div class="doctors-actions"><input type="search" data-search="'+def.id+'" aria-label="Search '+esc(def.title)+'" placeholder="Search records"><button type="button" id="b2c-chart-button-'+def.id+'" data-chart="'+def.id+'" aria-expanded="false" aria-controls="b2c-chart-'+def.id+'">'+icon('ChartColumn')+'Chart</button><button type="button" id="b2c-export-'+def.id+'" data-export="'+def.id+'">'+icon('Download')+'Export CSV</button></div></div><div class="doctors-chart rev-chart" id="b2c-chart-'+def.id+'" hidden></div><div id="b2c-table-'+def.id+'"></div></section>').join('')+'</div>').join('');
  $('b2cReports').addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button||button.disabled)return;const d=button.dataset,id=d.sort||d.page||d.chart||d.export;if(!id)return;
    const state=states[id],def=definitions.find(item=>item.id===id);
    if(d.sort){const column=Number(d.column);state.asc=state.sort===column?!state.asc:true;state.sort=column;state.page=1;renderTable(def);}
    else if(d.page){state.page=Number(d.target);renderTable(def);}
    else if(d.chart){state.chart=!state.chart;renderTable(def);if(!state.chart)$('b2c-chart-button-'+id).focus();}
    else exportCsv(id);
  });
  $('b2cReports').addEventListener('input',event=>{const id=event.target.dataset.search;if(!id)return;states[id].search=event.target.value.trim();states[id].page=1;renderTable(definitions.find(def=>def.id===id));});
  $('b2cReports').addEventListener('change',event=>{const id=event.target.dataset.size;if(!id)return;states[id].size=Number(event.target.value);states[id].page=1;renderTable(definitions.find(def=>def.id===id));});
  $('b2cTabs').addEventListener('click',event=>{const button=event.target.closest('[data-tab]');if(button){active=button.dataset.tab;syncLayout();}});
  $('b2cTabs').addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const index=groups.findIndex(group=>group[0]===active),next=event.key==='Home'?0:event.key==='End'?groups.length-1:(index+(event.key==='ArrowRight'?1:-1)+groups.length)%groups.length;active=groups[next][0];syncLayout();$('b2c-tab-'+active).focus();});
  $('b2cShowAll').addEventListener('click',()=>{all=!all;syncLayout();});
  ['homeFrom','homeTo'].forEach(id=>$(id).addEventListener('change',()=>{selectedRange=null;refresh();}));
  function reset(){all=false;active='overview';selectedRange='report';$('homeFrom').value=data.from;$('homeTo').value=data.to;Object.values(states).forEach(state=>{state.search='';state.sort=null;state.asc=true;state.chart=false;});document.querySelectorAll('[data-search]').forEach(node=>node.value='');$('homeMore').hidden=true;$('moreHome').setAttribute('aria-expanded','false');refresh();}
  $('b2cReset').addEventListener('click',reset);
  $('moreHome').addEventListener('click',()=>{const panel=$('homeMore');panel.hidden=!panel.hidden;$('moreHome').setAttribute('aria-expanded',String(!panel.hidden));});
  const ranges=[['today','Today'],['yesterday','Yesterday'],['week','Last 7 days'],['month','Month to date'],['last30','Last 30 days'],['quarter','Quarter to date'],['year','Year to date'],['report','Report period']];
  $('shortcuts').innerHTML=ranges.map(([id,label])=>'<button type="button" class="quick" data-b2c-range="'+id+'"'+(id==='report'?' id="b2cReportPeriod"':'')+'>'+label+'</button>').join('');
  function setRange(id){
    selectedRange=id;
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),end=new Date(today+'T00:00:00Z'),start=new Date(end);
    if(id==='yesterday'){start.setUTCDate(start.getUTCDate()-1);end.setUTCDate(end.getUTCDate()-1);}
    if(id==='week')start.setUTCDate(start.getUTCDate()-6);
    if(id==='last30')start.setUTCDate(start.getUTCDate()-29);
    if(id==='month')start.setUTCDate(1);
    if(id==='quarter'){start.setUTCDate(1);start.setUTCMonth(Math.floor(start.getUTCMonth()/3)*3);}
    if(id==='year'){start.setUTCDate(1);start.setUTCMonth(0);}
    $('homeFrom').value=id==='report'?data.from:start.toISOString().slice(0,10);$('homeTo').value=id==='report'?data.to:end.toISOString().slice(0,10);refresh();
  }
  $('shortcuts').addEventListener('click',event=>{const button=event.target.closest('[data-b2c-range]');if(button)setRange(button.dataset.b2cRange);});
  $('b2cOpenFormulas').addEventListener('click',()=>$('b2cFormulas').showModal());$('b2cCloseFormulas').addEventListener('click',()=>$('b2cFormulas').close());
  $('b2cFormulas').addEventListener('click',event=>{if(event.target===$('b2cFormulas')){const box=event.target.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)event.target.close();}});
  window.refreshHome=refresh;window.showModuleNotice=name=>{$('moduleNotice').textContent=name+' is not connected yet.';};
  window.yodaB2CPage={definitions,states,groups,rowsFor,scope,refresh,exportCsv,setRange,formulaContext:table=>({shareTotal:data.booking.reduce((sum,row)=>sum+row[4],0),shareBasis:'revenue',shareLabel:'Revenue in this row ÷ Total B2C revenue × 100'})};
  refresh();
})();
