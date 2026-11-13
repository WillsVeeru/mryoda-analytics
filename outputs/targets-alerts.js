(() => {
  'use strict';
  const data=window.dashboardTargets,$=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=v=>Number(v).toLocaleString('en-IN'),money=v=>v===null?'—':'₹'+number(v);
  const params=new URLSearchParams(location.search),snapshot=data.getSnapshot(),today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  $('targetFrom').value=params.get('from')||snapshot?.from||today;$('targetTo').value=params.get('to')||snapshot?.to||today;$('targetMonth').value=$('targetTo').value.slice(0,7);
  $('targetBranch').innerHTML='<option>All</option>'+[...new Set(data.catalog.map(p=>p.branch))].map(branch=>'<option>'+branch+'</option>').join('');$('targetBranch').value='All';
  $('targetsExport').innerHTML=window.dashboardIcon('Download')+'Export CSV';
  let page=1,size=10,sortColumn=0,ascending=true;
  function rows(){
    const from=$('targetFrom').value,to=$('targetTo').value,month=$('targetMonth').value,snapshot=data.getSnapshot(),same=snapshot&&snapshot.from===from&&snapshot.to===to,query=$('targetSearch').value.trim().toLowerCase();
    return data.catalog.filter(p=>($('targetBranch').value==='All'||p.branch===$('targetBranch').value)&&(!query||[p.name,p.id,p.branch].some(v=>v.toLowerCase().includes(query)))).map(p=>{
      const actual=same&&Object.hasOwn(snapshot.actuals,p.id)?snapshot.actuals[p.id]:null,target=data.getPeriodTarget(p.id,from,to),result=data.assess(actual,target);
      return{...p,monthly:data.monthly(p.id,month),target,actual,...result};
    }).sort((a,b)=>{const fields=['name','branch','monthly','target','actual','shortfall','excess','status'],x=a[fields[sortColumn]],y=b[fields[sortColumn]];if(x===null||y===null)return x===y?0:x===null?1:-1;const order=typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y),undefined,{numeric:true});return ascending?order:-order;});
  }
  function render(){
    const all=rows(),from=$('targetFrom').value,to=$('targetTo').value,month=$('targetMonth').value,valid=data.validDate(from)&&data.validDate(to)&&from<=to&&data.validMonth(month),pages=Math.max(1,Math.ceil(all.length/size));page=Math.min(pages,Math.max(1,page));
    const visible=all.slice((page-1)*size,page*size),complete=all.length&&all.every(r=>r.actual!==null),sum=field=>all.reduce((n,r)=>n+(r[field]||0),0);
    $('targetsRevenue').textContent=complete?money(sum('actual')):'—';$('targetsScope').textContent='Selected period: '+from+' – '+to;
    $('targetsKpis').innerHTML=[['Below target','warning'],['Above target','positive'],['Target met','positive']].map(([status])=>'<section class="revenue-kpi"><h2>'+status+'</h2><strong>'+number(all.filter(r=>r.status===status).length)+'</strong><p>'+all.filter(r=>r.actual!==null).length+' PROs with matching actuals</p></section>').join('');
    $('targetsNote').textContent=!valid?'Choose valid dates and a target month.':complete?'Actuals match the latest Financial Overview selection snapshot. Targets cover the full PRO period.':'Load this period in Financial Overview to refresh actuals and target alerts.';
    const snapshot=data.getSnapshot();$('targetsActualScope').textContent=complete?(snapshot.scope+' · '+snapshot.from+' to '+snapshot.to):'Actuals remain unavailable when the snapshot dates or branch scope do not match.';
    $('targetsFinanceLink').href=data.link('center-overview.html?targetFrom='+encodeURIComponent(from)+'&targetTo='+encodeURIComponent(to)+'#coWorkspaceCharts');
    const labels=['PRO','Branch','Monthly Target · '+(data.validMonth(month)?month:'Choose month'),'Period Target','Net Revenue','Target Shortfall','Target Excess','Status','Action'];
    $('targetsTable').innerHTML='<div class="doctors-table-wrap"><table class="doctors-table"><thead><tr>'+labels.map((label,i)=>'<th '+(i<8?'aria-sort="'+(sortColumn===i?(ascending?'ascending':'descending'):'none')+'"':'')+'>'+(i<8?'<button type="button" data-target-sort="'+i+'">'+esc(label)+' <span aria-hidden="true">'+(sortColumn===i?(ascending?'↑':'↓'):'↕')+'</span></button>':label)+'</th>').join('')+'</tr></thead><tbody>'+visible.map(row=>'<tr><td>'+esc(row.name)+'<small class="targets-pro-id">'+row.id+'</small></td><td>'+row.branch+'</td><td><input type="number" min="0" step="1" id="target-edit-'+row.id+'" value="'+(row.monthly??'')+'" aria-label="Monthly target for '+esc(row.name)+'" placeholder="No target" '+(!valid?'disabled':'')+'></td><td>'+money(row.target)+'</td><td>'+money(row.actual)+'</td><td>'+money(row.shortfall)+'</td><td>'+money(row.excess)+'</td><td><span class="financial-target-status '+row.tone+'">'+row.status+'</span></td><td><button type="button" class="co-btn" data-target-save="'+row.id+'" '+(!valid?'disabled':'')+'>Save</button></td></tr>').join('')+(!all.length?'<tr><td colspan="9" class="doctors-empty">No PROs match your filters.</td></tr>':'')+'</tbody></table></div>';
    $('targetsCount').textContent='Showing '+(all.length?(page-1)*size+1:0)+'–'+Math.min(page*size,all.length)+' of '+all.length+' PROs';$('targetsPage').textContent='Page '+page+' of '+pages;$('targetsPrev').disabled=page===1;$('targetsNext').disabled=page===pages;
    document.querySelectorAll('[data-target-save]').forEach(button=>button.addEventListener('click',()=>{
      const input=$('target-edit-'+button.dataset.targetSave),raw=input.value.trim(),amount=raw===''?null:Number(raw);
      if(!input.checkValidity()||amount!==null&&(!Number.isFinite(amount)||amount<0)){input.reportValidity();return;}
      const saved=data.setMonthlyTarget(button.dataset.targetSave,month,amount);$('targetsSaveStatus').textContent=saved?'Monthly target saved. Financial Overview uses the updated target.':'Target updated for this page; browser storage is unavailable.';render();
    }));
  }
  $('targetsTable').addEventListener('click',event=>{const button=event.target.closest('[data-target-sort]');if(button){const index=Number(button.dataset.targetSort);ascending=sortColumn===index?!ascending:true;sortColumn=index;page=1;render();}});
  for(const id of ['targetFrom','targetTo','targetMonth','targetBranch'])$(id).addEventListener('change',()=>{if(id==='targetTo'&&data.validDate($('targetTo').value))$('targetMonth').value=$('targetTo').value.slice(0,7);page=1;render();});$('targetSearch').addEventListener('input',()=>{page=1;render();});
  $('targetsPrev').addEventListener('click',()=>{page--;render();});$('targetsNext').addEventListener('click',()=>{page++;render();});$('targetsSize').addEventListener('change',event=>{size=Number(event.target.value);page=1;render();});
  $('targetsExport').addEventListener('click',()=>{
    const header=['PRO ID','PRO','Branch','Target month','Monthly target','Period target','Net revenue','Target shortfall','Target excess','Status'],csv='\uFEFF'+[header,...rows().map(r=>[r.id,r.name,r.branch,$('targetMonth').value,r.monthly,r.target,r.actual,r.shortfall,r.excess,r.status])].map(row=>row.map(v=>'"'+String(v??'').replace(/^[=+@-]/,m=>"'"+m).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),a=document.createElement('a');a.href=url;a.download='PRO-targets-'+$('targetFrom').value+'-to-'+$('targetTo').value+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  window.addEventListener('storage',event=>{if(event.key===data.key||event.key===data.snapshotKey)render();});
  const dialog=$('targetsFormulas');$('targetsOpenFormulas').addEventListener('click',()=>dialog.showModal());$('targetsCloseFormulas').addEventListener('click',()=>dialog.close());
  window.showModuleNotice=name=>{$('moduleNotice').textContent=name+' is not connected yet.';};window.targetsAlertsPage={rows,render};render();
})();
