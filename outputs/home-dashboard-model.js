/* Home reads report sources and labelled target previews without writing activity or targets. */
(()=>{
  'use strict';
  const day=86400000;
  const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&Number.isFinite(+new Date(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
  const validRange=range=>!!range&&validDate(range.start)&&validDate(range.end)&&range.start<=range.end&&(new Date(range.end)-new Date(range.start))/day<3660;
  const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  function preset(key,end=today()){
    const finish=new Date(end+'T00:00:00Z'),start=new Date(finish);
    if(key==='yesterday'){start.setUTCDate(start.getUTCDate()-1);finish.setUTCDate(finish.getUTCDate()-1);}
    if(key==='week')start.setUTCDate(start.getUTCDate()-6);
    if(key==='last30')start.setUTCDate(start.getUTCDate()-29);
    if(key==='month')start.setUTCDate(1);
    if(key==='quarter'){start.setUTCDate(1);start.setUTCMonth(Math.floor(start.getUTCMonth()/3)*3);}
    if(key==='year'){start.setUTCDate(1);start.setUTCMonth(0);}
    return{start:start.toISOString().slice(0,10),end:finish.toISOString().slice(0,10)};
  }
  function prior(range){
    const length=(new Date(range.end)-new Date(range.start))/day+1,end=new Date(new Date(range.start)-day);
    return{start:new Date(+end-(length-1)*day).toISOString().slice(0,10),end:end.toISOString().slice(0,10)};
  }
  function revenue(range,filtered){
    const source=window.revenuePdfSource,rows=validRange(range)&&!filtered?source.select(range.start,range.end,false).base.daily:[];
    const available=validRange(range)&&!filtered&&rows.length===(new Date(range.end)-new Date(range.start))/day+1;
    const totals=available?rows.reduce((sum,row)=>{for(const [field,index]of [['bills',1],['patients',2],['gross',3],['discount',4],['refunds',7],['net',8]])sum[field]+=row[index];return sum;},{bills:0,patients:0,gross:0,discount:0,refunds:0,net:0}):null;
    return{available,range,rows:available?rows.map(row=>[...row]):[],totals};
  }
  function targets(month,metric,city,branch,currentDay){
    const source=window.dashboardTargets;
    if(!source.validMonth(month))return{available:false,month,rows:[],from:null,to:null};
    const days=source.daysInMonth(month),elapsed=month<currentDay.slice(0,7)?days:month===currentDay.slice(0,7)?Number(currentDay.slice(8)):0;
    const from=month+'-01',to=month+'-'+String(elapsed||1).padStart(2,'0');
    const available=branch==='All';
    const sample=window.targetsAlertsSample;
    const rows=available?source.people.filter(person=>city==='All'||person.branch===city).map(person=>{
      const savedTarget=source.savedTarget(person.scope,person.id,month,metric),target=savedTarget??sample?.target(person,month,metric)??null;
      const capturedActual=elapsed?source.actualFor(person.scope,person.id,from,to,metric):null;
      const previewActual=elapsed?sample?.actual(person,month,elapsed,days,metric)??null:null;
      const actual=capturedActual??previewActual,sampleTarget=savedTarget===null&&target!==null,sampleActual=capturedActual===null&&actual!==null;
      const difference=actual===null||target===null?null:actual-target;
      const status=!elapsed?'Not started':actual===null?'Awaiting activity':difference<0?'Shortfall':difference>0?'Excess':'Target met';
      return{...person,target,actual,difference,status,sampleTarget,sampleActual,hasSample:sampleTarget||sampleActual};
    }).filter(person=>person.target!==null).sort((a,b)=>a.name.localeCompare(b.name)):[];
    return{available,month,metric,from,to,elapsed,rows};
  }
  function build(request={}){
    const source=window.revenuePdfSource,locations=window.locationExplorerData,ops=window.tatOperationsData,finance=window.dashboardFinancialData;
    const latest=request.mode!=='selected',city=request.city||'All',branch=request.branch||'All',filtered=city!=='All'||branch!=='All';
    const selected={start:request.from,end:request.to},revenueRange=latest?{start:source.sourceFrom,end:source.sourceTo}:selected;
    const locationRange=latest?{start:locations.from,end:locations.to}:selected,opsRange=latest?{start:ops.from,end:ops.to}:selected;
    const business=revenue(revenueRange,filtered),baseline=validRange(revenueRange)?revenue(prior(revenueRange),filtered):null;
    const locationAvailable=validRange(locationRange)&&locationRange.start===locations.from&&locationRange.end===locations.to;
    const branchRows=locationAvailable?locations.centres.filter(row=>(city==='All'||row[1]===city)&&(branch==='All'||row[0]===branch)).map(row=>[...row]):[];
    const attributed=city==='All'&&branch==='All'||branchRows.length>0;
    const testCount=locationAvailable&&attributed?(filtered?branchRows.reduce((sum,row)=>sum+row[4],0):locations.summary.tests):null;
    const costRows=validRange(revenueRange)&&branch==='All'?(finance.aggregate(revenueRange.start,revenueRange.end)||[]).filter(row=>city==='All'||row.name===city):[];
    const costs=costRows.length?costRows.map(row=>finance.expenseAllocation(row)).reduce((sum,row)=>({operating:sum.operating+row.regularOperating+row.expansionOperating,regularOperating:sum.regularOperating+row.regularOperating,expansionOperating:sum.expansionOperating+row.expansionOperating,capital:sum.capital+row.regularCapital+row.expansionCapital,total:sum.total+row.total}),{operating:0,regularOperating:0,expansionOperating:0,capital:0,total:0}):null;
    const operationAvailable=!filtered&&validRange(opsRange)&&opsRange.start===ops.from&&opsRange.end===ops.to;
    const status=name=>ops.statuses.find(row=>row[0]===name)?.[1]??null;
    const operations=[['Samples received',ops.flow.find(row=>row[0]==='Sample received')?.[1]??null,'number','FlaskConical'],['Pending results',status('Pending result'),'number','ClipboardList'],['Awaiting approval',status('Awaiting approval'),'number','CircleCheck'],['Rejections',status('Rejected'),'number','CircleX'],['Re-runs',status('Re-run'),'number','RotateCcw'],['Average total TAT',ops.summary.total,'hours','CalendarDays']].map(([label,value,type,icon])=>({label,value:operationAvailable?value:null,type,icon}));
    const paymentAvailable=business.available&&revenueRange.start===source.sourceFrom&&revenueRange.end===source.sourceTo;
    const currentDay=request.today||today(),month=request.targetMonth||currentDay.slice(0,7),metric=request.metric==='tests'?'tests':'revenue';
    return{latest,valid:latest||validRange(selected),city,branch,filtered,revenue:business,baseline:baseline?.available?baseline:null,
      payment:{available:paymentAvailable,range:revenueRange,rows:paymentAvailable?source.base.payment.map(row=>[...row]):[]},
      tests:{value:testCount,range:locationRange,filtered},finance:{available:!!costs,range:revenueRange,totals:costs},
      branches:{available:locationAvailable&&attributed,range:locationRange,rows:branchRows},operations:{available:operationAvailable,range:opsRange,items:operations},
      targets:targets(month,metric,city,branch,currentDay)};
  }
  window.homeDashboardModel=Object.freeze({today,preset,validDate,validRange,prior,revenue,build});
})();
