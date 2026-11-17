(()=>{
  'use strict';
  const data=window.receivablesData,day=86400000;
  const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&Number.isFinite(+new Date(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
  const total=rows=>rows.reduce((sum,row)=>{for(const key of ['invoiced','cash','tds','writeOff','outstanding'])sum[key]+=row[key];return sum;},{invoiced:0,cash:0,tds:0,writeOff:0,outstanding:0});
  function build(filters={}){
    const from=filters.from||data.from,to=filters.to||data.to,branch=filters.branch||'All',type=filters.type||'All',clientId=filters.client||'All';
    const valid=validDate(from)&&validDate(to)&&from<=to&&(new Date(to)-new Date(from))/day<3660,snapshotAvailable=valid&&to===data.to;
    const clients=data.clients.filter(row=>(branch==='All'||row.branch===branch)&&(type==='All'||row.type===type)&&(clientId==='All'||row.id===clientId)),clientSet=new Set(clients.map(row=>row.id));
    const ledger=snapshotAvailable?data.invoices.filter(row=>clientSet.has(row.clientId)):[],open=ledger.filter(row=>row.outstanding>0),totals=total(ledger);
    const payments=valid?data.payments.filter(row=>row.date>=from&&row.date<=to):[];
    const collectionComplete=valid&&from>=data.from&&to<=data.to;
    const byClient=new Map(clients.map(row=>[row.id,0]));
    const collections=collectionComplete?payments.map(row=>{let b2b=0;data.clients.forEach((client,index)=>{if(clientSet.has(client.id)){b2b+=row.clientPayments[index];byClient.set(client.id,byClient.get(client.id)+row.clientPayments[index]);}});const patient=(type==='All'||type==='Walk-In')&&clientId==='All'?row.patientByBranch.reduce((sum,value,index)=>sum+(branch==='All'||data.branches[index]===branch?value:0),0):0;return[row.date,patient,b2b,patient+b2b];}):[];
    const panels=clients.map(client=>{const invoices=ledger.filter(row=>row.clientId===client.id);return{...client,...total(invoices),invoices:invoices.length,open:invoices.filter(row=>row.outstanding>0).length,settled:invoices.filter(row=>row.outstanding===0).length,collected:collectionComplete?byClient.get(client.id):null};}).filter(row=>snapshotAvailable&&row.invoices);
    const fullBalances=new Map();data.invoices.forEach(row=>fullBalances.set(row.clientId,(fullBalances.get(row.clientId)||0)+row.outstanding));
    const managers=snapshotAvailable?data.managers.map(manager=>{
      const own=panels.filter(row=>row.managerId===manager.id),weight=own.reduce((sum,row)=>sum+row.outstanding,0),fullWeight=data.clients.filter(row=>row.managerId===manager.id).reduce((sum,row)=>sum+fullBalances.get(row.id),0);
      const collected=collectionComplete?own.reduce((sum,row)=>sum+row.collected,0):null;
      const target=collectionComplete?Math.round(manager.monthlyTarget*collections.length/30*weight/fullWeight):null,difference=collected===null||target===null?null:collected-target;
      return{...manager,panels:own.length,open:own.reduce((sum,row)=>sum+row.open,0),outstanding:weight,collected,target,difference,status:difference===null?'Unavailable':difference<0?'Shortfall':difference>0?'Excess':'Target met'};
    }).filter(row=>row.panels):[];
    const ageing=snapshotAvailable?data.ageing.map(([label],index)=>{const rows=open.filter(row=>row.bucket===index);return[label,new Set(rows.map(row=>row.clientId)).size,rows.length,rows.reduce((sum,row)=>sum+row.outstanding,0)];}):[];
    const collectionTotals=collectionComplete?collections.reduce((sum,row)=>sum.map((value,index)=>value+row[index+1]),[0,0,0]):null;
    return{valid,from,to,branch,type,clientId,snapshotAvailable,collectionComplete,clients,ledger,panels,managers,ageing,collections,collectionTotals,totals,open:open.length,over90:open.filter(row=>row.age>90).reduce((sum,row)=>sum+row.outstanding,0),filtered:branch!=='All'||type!=='All'||clientId!=='All'};
  }
  window.receivablesModel=Object.freeze({build,validDate,total});
})();
