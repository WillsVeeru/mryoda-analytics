(() => {
  'use strict';
  const groupNames=window.revenueReferenceModel.channels.map(row=>row[0].replace(' (B2B sample intake)','').replace(' (walk-in)','').replace(' (CD team)',''));
  const definitions=[
    {id:'segments',title:'Specialty vs Routine Revenue',headers:['Segment','Bills','Tests','Revenue','Share (%)'],money:[3],percent:[4],note:'Routine excludes both specialty groups here. The Routine Net KPI includes genetics and excludes Yodaara. Groups are demo allocations, not an LIS specialty flag.'},
    {id:'monthly',title:'Specialty Share by Month',headers:['Month','Routine','Yodaara','Genetics','Specialty total','Specialty bills','Specialty share (%)'],money:[1,2,3,4],percent:[6],note:'Selected dates only, grouped by month. Specialty total = Yodaara + Genetics; share uses the same month’s total revenue.'},
    {id:'panels',title:'Specialty Panels',headers:['Panel / Test','Group','Bills','Patients','Average ticket','Revenue'],money:[4,5],average:[4,5,2],note:'Panels visible in the PDF reference, with illustrative allocations reconciled to the filtered specialty groups. Average ticket = revenue ÷ bills.'},
    {id:'bookers',title:'Who Books Specialty Panels',headers:['Client','Group','Centre','Referrer','Bills','Revenue'],money:[5],note:'Illustrative client × centre × specialty-group combinations. Demo referrers are not live doctor or acquisition records.'},
    {id:'booking',title:'Booking Channel',headers:['Channel (by creating login)','Bills','Revenue','Share (%)'],money:[2],percent:[3],note:'Proxy attribution based on who registered the booking. This is not a verified acquisition source. Expand a channel to inspect its demo LIS logins.'},
    {id:'bookingMonthly',title:'Booking Channel by Month',headers:['Month',...groupNames,'Total'],money:[1,2,3,4,5,6,7,8,9],note:'Selected dates only. Monthly channel allocations reconcile to the filtered daily revenue report.'}
  ];
  const states=new Map();
  let data,expanded=null;
  const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const formatter=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
  const monthFormatter=new Intl.DateTimeFormat('en-GB',{month:'short',year:'numeric',timeZone:'UTC'});
  function dateRange(){
    const from=document.getElementById('homeFrom').value,to=document.getElementById('homeTo').value;
    if(!from||!to||from>to)return 'Selected period: Choose a valid date range';
    return 'Selected period: '+formatter.format(new Date(from+'T00:00:00Z'))+(from===to?'':' – '+formatter.format(new Date(to+'T00:00:00Z')));
  }
  function stateFor(id){
    if(!states.has(id))states.set(id,{page:1,size:id.startsWith('login-')?5:10,sort:null,direction:1,chart:false,metric:null});
    return states.get(id);
  }
  function format(value,index,definition){
    if(definition.money?.includes(index))return money(value);
    if(definition.percent?.includes(index))return Number(value).toFixed(1)+'%';
    if(index===0&&/^\d{4}-\d{2}$/.test(String(value)))return monthFormatter.format(new Date(value+'-01T00:00:00Z'));
    return typeof value==='number'?number(value):String(value);
  }
  function orderedRows(rows,state){
    const result=rows.map((row,index)=>({row,index}));
    if(state.sort!==null)result.sort((a,b)=>{
      const x=a.row[state.sort],y=b.row[state.sort];
      return state.direction*(typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y)));
    });
    return result;
  }
  function totalCells(rows,definition){
    return definition.headers.map((_,index)=>{
      if(!index){
        const source=window.revenuePdfSnapshotState;
        const coverage=source?.coverage[definition.id];
        return source?(coverage&&coverage[0]<coverage[1]?'Subtotal':'Total'):'Filtered total';
      }
      if(definition.average?.[0]===index){const amount=rows.reduce((a,r)=>a+r[definition.average[1]],0),count=rows.reduce((a,r)=>a+r[definition.average[2]],0);return count?amount/count:0;}
      if(definition.id==='monthly'&&index===6){const special=rows.reduce((a,r)=>a+r[4],0),all=rows.reduce((a,r)=>a+r[1]+r[4],0);return all?special/all*100:0;}
      if(rows.some(row=>typeof row[index]==='number')||definition.money?.includes(index)||definition.percent?.includes(index)||/bills|patients|tests/i.test(definition.headers[index]))return rows.reduce((a,row)=>a+(Number(row[index])||0),0);
      return '—';
    });
  }
  function buttons(id,state,total){
    const pages=Math.max(1,Math.ceil(total/state.size));
    const source=window.revenuePdfSnapshotState,coverage=source?.coverage[id];
    const coverageText=' rows';
    return '<div class="rev-page-left"><span role="status">Showing '+(total?(state.page-1)*state.size+1:0)+'–'+Math.min(state.page*state.size,total)+' of '+total+coverageText+'</span><label>Rows <select data-reference-size="'+id+'" aria-label="Rows per page">'+[5,10,25,50].map(size=>'<option'+(size===state.size?' selected':'')+'>'+size+'</option>').join('')+'</select></label></div><div class="rev-page-nav">'+[['first','«','First'],['previous','‹','Previous'],['next','›','Next'],['last','»','Last']].map(([action,label,name],index)=>(index===2?'<span>Page '+state.page+' of '+pages+'</span>':'')+'<button type="button" data-reference-page="'+id+'" data-action="'+action+'" aria-label="'+name+' page" '+((index<2?state.page===1:state.page===pages)?'disabled':'')+'>'+label+'</button>').join('')+'</div>';
  }
  function tableMarkup(rows,definition,state,booking=false){
    const ordered=orderedRows(rows,state),pages=Math.max(1,Math.ceil(rows.length/state.size));
    state.page=Math.min(state.page,pages);
    const view=ordered.slice((state.page-1)*state.size,state.page*state.size);
    return '<div class="rev-scroll"><table><thead><tr>'+definition.headers.map((header,index)=>'<th scope="col" aria-sort="'+(state.sort===index?(state.direction===1?'ascending':'descending'):'none')+'"><button type="button" class="reference-sort" data-reference-sort="'+definition.id+'" data-column="'+index+'">'+esc(header)+'<span aria-hidden="true">'+(state.sort===index?(state.direction===1?'↑':'↓'):'↕')+'</span></button></th>').join('')+'</tr></thead><tbody>'+(view.length?view.map(({row,index})=>'<tr>'+row.map((value,column)=>'<td>'+(booking&&column===0?'<button type="button" class="reference-channel-link" data-reference-expand="'+index+'" aria-expanded="'+(expanded===index)+'" aria-controls="reference-logins-'+index+'"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="'+(expanded===index?'m6 9 6 6 6-6':'m9 6 6 6-6 6')+'"/></svg>'+esc(value)+'</button>':esc(format(value,column,definition)))+'</td>').join('')+'</tr>'+(booking&&expanded===index?'<tr class="reference-login-row"><td colspan="'+definition.headers.length+'"><section class="reference-login-panel" id="reference-logins-'+index+'"><div class="rev-heading"><div><h3>'+esc(row[0])+' · LIS Logins</h3><p class="application-table-period">'+esc(dateRange())+'</p></div><button type="button" data-reference-export="login-'+index+'">Export CSV</button></div><div id="reference-login-table-'+index+'"></div></section></td></tr>':'')).join(''):'<tr><td colspan="'+definition.headers.length+'">No records match the selected dates and filters.</td></tr>')+'</tbody><tfoot><tr>'+totalCells(rows,definition).map((value,index)=>'<td>'+esc(index?format(value,index,definition):value)+'</td>').join('')+'</tr></tfoot></table></div><div class="rev-foot">'+buttons(definition.id,state,rows.length)+'</div>';
  }
  function loginDefinition(index){return {id:'login-'+index,headers:['LIS login','Designation','Bills','Patients','Revenue'],money:[4]};}
  function renderBookingReport(card,rows,state){
    state.page=Math.min(state.page,Math.max(1,Math.ceil(rows.length/state.size)));
    const master=orderedRows(rows,state).slice((state.page-1)*state.size,state.page*state.size);
    if(!master.length)expanded=null;
    else if(!master.some(item=>item.index===expanded))expanded=master[0].index;
    const selected=expanded===null?null:rows[expanded];
    const userRows=expanded===null?[]:data.logins[expanded]||[];
    const loginId='login-'+expanded,loginState=stateFor(loginId);
    loginState.page=Math.min(loginState.page,Math.max(1,Math.ceil(userRows.length/loginState.size)));
    const users=orderedRows(userRows,loginState).slice((loginState.page-1)*loginState.size,loginState.page*loginState.size);
    const heading=(label,index,id,sortState)=>'<th scope="col" aria-sort="'+(sortState.sort===index?(sortState.direction===1?'ascending':'descending'):'none')+'"><button type="button" class="reference-sort" data-reference-sort="'+id+'" data-column="'+index+'">'+label+'<span aria-hidden="true">'+(sortState.sort===index?(sortState.direction===1?'↑':'↓'):'↕')+'</span></button></th>';
    const arrow='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
    let html='<div class="booking-master-detail"><section class="booking-master-panel" aria-labelledby="booking-channel-list-title"><div class="booking-panel-heading"><h4 id="booking-channel-list-title">Booking channel</h4><div class="booking-panel-tools"><span>Select a row for details</span><button type="button" class="booking-detail-export" data-reference-export="booking" aria-label="Export all booking channel summary rows" title="Export channel, bills, revenue and share"'+(!rows.length?' disabled':'')+'>Export CSV</button></div></div><div class="rev-scroll"><table><thead><tr>'+heading('Channel (by creating login)',0,'booking',state)+heading('Bills',1,'booking',state)+heading('Revenue',2,'booking',state)+heading('Share',3,'booking',state)+'</tr></thead><tbody>';
    html+=master.length?master.map(({row,index})=>'<tr data-reference-expand="'+index+'" tabindex="0"'+(expanded===index?' class="booking-channel-selected" aria-current="true"':'')+' aria-label="View user breakdown for '+esc(row[0])+'"><td><button type="button" tabindex="-1" class="booking-channel-action" data-reference-expand="'+index+'" aria-controls="booking-channel-detail">'+esc(row[0])+arrow+'</button></td><td>'+esc(number(row[1]))+'</td><td>'+esc(money(row[2]))+'</td><td>'+esc(Number(row[3]).toFixed(1)+'%')+'</td></tr>').join(''):'<tr><td colspan="4">No channels are available for this selection.</td></tr>';
    html+='</tbody></table></div><div class="rev-foot booking-pagination">'+buttons('booking',state,rows.length)+'</div></section><section class="booking-detail-panel" id="booking-channel-detail" aria-labelledby="booking-channel-detail-title"><div class="booking-panel-heading"><h4 id="booking-channel-detail-title">'+(selected?'Breakdown: '+esc(selected[0]):'User breakdown')+'</h4>'+(selected?'<button type="button" class="booking-detail-export" data-reference-export="'+loginId+'"'+(!userRows.length?' disabled':'')+'>Export CSV</button>':'')+'</div><div class="rev-scroll"><table><thead><tr>'+heading('LIS login',0,loginId,loginState)+heading('Designation',1,loginId,loginState)+heading('Bills',2,loginId,loginState)+heading('Patients',3,loginId,loginState)+heading('Revenue',4,loginId,loginState)+'</tr></thead><tbody>';
    html+=users.length?users.map(({row})=>'<tr><td>'+esc(row[0])+'</td><td>'+esc(row[1])+'</td><td>'+esc(number(row[2]))+'</td><td>'+esc(number(row[3]))+'</td><td>'+esc(money(row[4]))+'</td></tr>').join(''):'<tr><td colspan="5">'+(selected?'User-level details for this channel are not visible in the supplied PDF.':'Select a booking channel to see its users.')+'</td></tr>';
    html+='</tbody></table></div>';
    if(selected)html+='<div class="rev-foot booking-pagination">'+buttons(loginId,loginState,userRows.length)+'</div>';
    html+='</section></div>';
    card.querySelector('[data-reference-table]').innerHTML=html;
  }
  function drawChart(definition,rows,state,host){
    if(!state.chart){host.hidden=true;return;}
    host.hidden=false;
    const metrics=definition.headers.map((label,index)=>({label,index})).filter(({index})=>index>0&&rows.some(row=>typeof row[index]==='number'));
    if(!metrics.some(metric=>metric.index===state.metric))state.metric=definition.money?.[definition.money.length-1]??metrics[0]?.index;
    if(!metrics.length){host.textContent='No chart data for this selection.';return;}
    const values=[...rows].sort((a,b)=>b[state.metric]-a[state.metric]).slice(0,10),max=Math.max(1,...values.map(row=>Math.abs(row[state.metric])));
    host.innerHTML='<div class="reference-chart-toolbar"><label>Metric <select data-reference-metric="'+definition.id+'">'+metrics.map(metric=>'<option value="'+metric.index+'"'+(metric.index===state.metric?' selected':'')+'>'+esc(metric.label)+'</option>').join('')+'</select></label><span>Top '+values.length+' · Hover for values</span></div><div class="reference-chart-bars">'+(values.length?values.map(row=>'<div class="reference-chart-row" title="'+esc(row[0]+': '+format(row[state.metric],state.metric,definition))+'"><span>'+esc(format(row[0],0,definition))+'</span><div><i style="width:'+Math.max(0,row[state.metric]/max*100)+'%"></i></div><b>'+esc(format(row[state.metric],state.metric,definition))+'</b></div>').join(''):'<p>No data for the selected filters.</p>')+'</div>';
  }
  function render(id){
    if(id.startsWith('login-')){
      if(document.getElementById('booking-channel-detail')){render('booking');return;}
      const index=Number(id.slice(6)),host=document.getElementById('reference-login-table-'+index);
      if(host){
        host.innerHTML=tableMarkup(data.logins[index],loginDefinition(index),stateFor(id));
        if(window.revenuePdfSnapshotState){
          const note=document.createElement('p');note.className='revenue-reconciliation-note';
          note.textContent=index===0?'10 login rows are visible in the PDF out of 56. The subtotal covers the imported rows only.':'This channel’s login details are collapsed in the PDF. No login rows were available to import.';
          host.prepend(note);
        }
      }
      return;
    }
    const definition=definitions.find(item=>item.id===id),state=stateFor(id),rows=data[id];
    const card=document.getElementById('reference-section-'+id);
    card.querySelector('.application-table-period').textContent=dateRange();
    card.querySelector('.revenue-reconciliation-note').hidden=true;
    const source=window.revenuePdfSnapshotState;
    if(source){
      const coverage=source.coverage[id];
      const limits=coverage&&coverage[0]<coverage[1]?' '+coverage[0]+' of '+coverage[1]+' rows are visible; hidden pages are not included.':'';
      card.querySelector('.revenue-reconciliation-note').textContent=source.complete?'PDF snapshot · 5–11 Nov 2026. Values preserved as printed.'+limits+(id==='segments'?' Bills can overlap between segments; revenue is split at line level.':'')+(id==='booking'?' Creating-login proxy; not verified acquisition attribution.':''):'This table is available only for the complete PDF period, 5–11 Nov 2026, with all dimension filters cleared. The PDF contains aggregated rows, not transaction-level records.';
    }
    if(id==='booking')renderBookingReport(card,rows,state);
    else card.querySelector('[data-reference-table]').innerHTML=tableMarkup(rows,definition,state);
    drawChart(definition,rows,state,card.querySelector('[data-reference-chart]'));
  }
  function exportCSV(id){
    const nested=id.startsWith('login-'),definition=nested?loginDefinition(Number(id.slice(6))):definitions.find(item=>item.id===id);
    const rows=nested?data.logins[Number(id.slice(6))]:data[id];
    const csvCell=value=>{const text=String(value??'');return '"'+(/^[=+@-]/.test(text)?"'":'')+text.replace(/"/g,'""')+'"'};
    const csv=[definition.headers,...orderedRows(rows,stateFor(id)).map(item=>item.row),totalCells(rows,definition)].map(row=>row.map(csvCell).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');
    link.href=url;link.download='revenue-'+id+'-'+document.getElementById('homeFrom').value+'-'+document.getElementById('homeTo').value+'.csv';
    document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const container=document.getElementById('revenueSections'),payment=document.getElementById('table-payment').closest('.card');
  const groups=[['specialty','Specialty vs routine','Yodaara / Decoder / FRAAT'],['booking','Booking channel','by creating login']].map(([id,title,subtitle])=>{
    const section=document.createElement('section');section.className='reference-report-group full';section.setAttribute('aria-labelledby','reference-group-'+id);
    section.innerHTML='<h2 class="reference-group-heading" id="reference-group-'+id+'">'+esc(title)+' <span>· '+esc(subtitle)+'</span></h2>';
    container.insertBefore(section,payment);return section;
  });
  definitions.forEach((definition,index)=>{
    const card=document.createElement('section');
    card.id='reference-section-'+definition.id;card.className='card revenue-section full revenue-reference-section';card.dataset.tableDateManaged='true';
    card.innerHTML='<div class="rev-heading"><div><h3>'+esc(definition.title)+(definition.id==='booking'?' <span class="reference-proxy-tag">Proxy</span>':'')+'</h3><p class="application-table-period"></p></div><div class="rev-actions"><button type="button" data-reference-chart-toggle="'+definition.id+'" aria-expanded="false">Chart</button><button type="button" data-reference-export="'+definition.id+'">Export CSV</button></div></div><p class="revenue-reconciliation-note">'+esc(definition.note)+'</p><div class="rev-chart" data-reference-chart hidden></div><div data-reference-table></div>';
    if(definition.id==='booking')card.querySelector('[data-reference-export="booking"]')?.remove();
    groups[index<4?0:1].append(card);
  });
  container.addEventListener('click',event=>{
    const channel=event.target.closest('[data-reference-expand]');
    if(channel){expanded=Number(channel.dataset.referenceExpand);render('booking');return;}
    const button=event.target.closest('button');if(!button)return;
    const dataset=button.dataset;
    if(dataset.bookingDetailView!==undefined){const index=Number(dataset.bookingDetailView),state=stateFor('login-'+index);state.size=state.size<data.logins[index].length?data.logins[index].length:5;render('booking');return;}
    if(dataset.referenceExport){exportCSV(dataset.referenceExport);return;}
    const id=dataset.referenceSort||dataset.referencePage||dataset.referenceChartToggle;
    if(!id)return;
    const state=stateFor(id);
    if(dataset.referenceSort){const index=Number(dataset.column);state.direction=state.sort===index?-state.direction:1;state.sort=index;state.page=1;}
    if(dataset.referencePage){const total=id.startsWith('login-')?data.logins[Number(id.slice(6))].length:data[id].length,pages=Math.max(1,Math.ceil(total/state.size));state.page=dataset.action==='first'?1:dataset.action==='last'?pages:Math.max(1,Math.min(pages,state.page+(dataset.action==='next'?1:-1)));}
    if(dataset.referenceChartToggle){state.chart=!state.chart;button.setAttribute('aria-expanded',String(state.chart));}
    render(id);
  });
  container.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    const channel=event.target.closest('tr[data-reference-expand]');if(!channel)return;
    event.preventDefault();expanded=Number(channel.dataset.referenceExpand);render('booking');
    document.querySelector('tr[data-reference-expand="'+expanded+'"]')?.focus({preventScroll:true});
  });
  container.addEventListener('change',event=>{
    const select=event.target.closest('select');if(!select)return;
    const id=select.dataset.referenceSize||select.dataset.referenceMetric;if(!id)return;
    const state=stateFor(id);
    if(select.dataset.referenceSize){state.size=Number(select.value);state.page=1;}else state.metric=Number(select.value);
    render(id);
  });
  function refresh(){
    const profiles=[];
    for(const [centre,zone] of Object.entries({Hyderabad:'South',Bengaluru:'South',Chennai:'South',Mumbai:'West',Delhi:'North'})){
      if(!analyticsFilterMatches('centre',centre)||!analyticsFilterMatches('moreCity',centre)||!analyticsFilterMatches('moreZone',zone))continue;
      for(const client of ['Client A','Client B'])if(analyticsFilterMatches('client',client))profiles.push({client,centre,referrer:document.getElementById('moreDoctor')?.value==='All'?'Demo referral / Self':document.getElementById('moreDoctor')?.value||'Demo referral / Self'});
    }
    data=window.revenuePdfSnapshotState?.references||window.revenueReferenceModel.build(dataSets.daily||[],profiles);
    expanded=null;states.forEach(state=>state.page=1);definitions.forEach(definition=>render(definition.id));
  }
  const previousRefresh=refreshHome;
  refreshHome=function(){const result=previousRefresh.apply(this,arguments);refresh();return result;};
  window.refreshRevenueReferenceSections=refresh;
  refresh();
})();
