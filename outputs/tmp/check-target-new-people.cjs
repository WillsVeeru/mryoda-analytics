const fs=require('fs');
const original=fs.readFileSync('tmp/check-target-history.cjs','utf8');
let setup=original.slice(0,original.indexOf('assert.equal(reference.length,18);'));
const initial="vm.createContext(context);for(const file of ['targets-people.js','dashboard-targets.js','dashboard-report-charts.js','targets-alerts.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});";
setup=setup.replace(initial,"vm.createContext(context);for(const file of ['targets-people.js','dashboard-targets.js','dashboard-report-charts.js','targets-alerts-sample.js','targets-alerts.js']){vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});if(file==='targets-people.js')context.window.targetReferencePeople=Object.freeze([...context.window.targetReferencePeople,...['accountManager','salesRep'].map(scope=>Object.freeze({id:'NEW-'+scope,name:'New '+scope,scope,branch:'Not provided',source:'reference',sourceId:null}))]);}");
const verify=String.raw`
const newPeople=[['pro',reference[0].id],['accountManager','NEW-accountManager'],['salesRep','NEW-salesRep']];
const chooseMetric=value=>{ids.get('targetMetric').value=value;fire('targetMetric','change',{});allScopes();};
for(const selectedMetric of ['revenue','tests']){
 chooseMetric(selectedMetric);
 for(const [scope,id]of newPeople){
  const person=data.people.find(row=>row.scope===scope&&row.id===id);
  assert.equal(context.window.targetsAlertsSample.target(person,'2026-11',selectedMetric),null);
  assert.equal(context.window.targetsAlertsSample.actual(person,'2026-11',16,30,selectedMetric),null);
  assert.equal(get(id,scope).previousTarget,null);assert.equal(get(id,scope).previousActual,null);assert.equal(get(id,scope).previousStatus,'—');
  const beforeSnapshot=JSON.stringify(data.getSnapshot());
  assert(save(scope,id,selectedMetric==='tests'?'20':'1000'));
  const row=get(id,scope);assert.equal(row.target,selectedMetric==='tests'?20:1000);assert.equal(row.actual,null);assert.equal(row.difference,null);assert.equal(row.achievement,null);assert.equal(row.status,'Awaiting activity');assert.equal(row.tone,'neutral');assert(!row.hasSample);assert.equal(row.previousTarget,null);assert.equal(row.previousActual,null);assert.equal(row.previousDifference,null);assert.equal(row.previousStatus,'—');
  assert.equal(JSON.stringify(data.getSnapshot()),beforeSnapshot,'Saving must preserve the actual-data snapshot');
  ids.get('targetSearch').value=person.name;fire('targetSearch','input',{});assert.equal(api.rows().length,1);
  const markup=ids.get('targetsTable').innerHTML;assert(markup.includes('Awaiting activity'));assert(markup.includes('>—<'));assert(!markup.includes('targets-sample-badge'));
  assert.equal(cardValue('Behind pace'),0);assert.equal(cardValue('Ahead of pace'),0);api.render();assert.equal(get(id,scope).actual,null);
  fire('targetsChartToggle','click',{});assert(ids.get('targetsChart').innerHTML.includes('No chart values match'));fire('targetsChart','click',{closest:()=>({})});
  assert(save(scope,id,'0'));assert.equal(get(id,scope).target,0);assert.equal(get(id,scope).actual,null);assert.equal(get(id,scope).status,'Awaiting activity');
  allScopes();
 }
}
// A matched source can supply genuine zero activity for new people in all three scopes.
saved.set(data.snapshotKey,JSON.stringify({from:'2026-11-01',to:'2026-11-16',actuals:{[reference[0].id]:0},testActuals:{[reference[0].id]:0},scopeActuals:{accountManager:{'NEW-accountManager':0},salesRep:{'NEW-salesRep':0}},scopeTestActuals:{accountManager:{'NEW-accountManager':0},salesRep:{'NEW-salesRep':0}},scope:'Confirmed zero activity'}));
for(const selectedMetric of ['revenue','tests']){
 chooseMetric(selectedMetric);
 for(const [scope,id]of newPeople){assert(save(scope,id,'100'));assert.equal(get(id,scope).actual,0);assert.equal(get(id,scope).difference,-100);assert.equal(get(id,scope).status,'Shortfall');assert(save(scope,id,'0'));assert.equal(get(id,scope).status,'Target met');assert.equal(get(id,scope).achievement,100);}
}
// Existing assigned users keep current actuals and displayed historical values on every save.
const existing=[['pro','HYDERABAD-PRO01'],['accountManager','HYDERABAD-SR01'],['salesRep','HYDERABAD-SR01']];
data.captureActuals({from:'2026-11-01',to:'2026-11-16',centerIds:['hyderabad'],records:[{proId:'HYDERABAD-PRO01',accountManagerId:'HYDERABAD-SR01',representativeId:'HYDERABAD-SR01',net:1000,tests:10}],scope:'Existing activity'});
for(const selectedMetric of ['revenue','tests']){
 chooseMetric(selectedMetric);
 for(const [scope,id]of existing){allScopes();const row=get(id,scope),history=[row.previousTarget,row.previousActual,row.previousDifference,row.previousStatus],before=JSON.stringify(data.getSnapshot());assert(save(scope,id,selectedMetric==='tests'?'12':'1500'));const updated=get(id,scope);assert.equal(updated.actual,selectedMetric==='tests'?10:1000);assert.equal(updated.difference,selectedMetric==='tests'?-2:-500);assert.equal(updated.status,'Shortfall');assert.deepEqual([updated.previousTarget,updated.previousActual,updated.previousDifference,updated.previousStatus],history);assert.equal(JSON.stringify(data.getSnapshot()),before);}
}
chooseMetric('revenue');assert(save('pro',reference[0].id,'1000'));api.exportCsv();const blob=payload;
return (async()=>{const csv=await blob.text(),parse=line=>[...line.matchAll(/"((?:[^"]|"")*)"/g)].map(match=>match[1]),lines=csv.split('\r\n'),header=parse(lines[0]),row=lines.map(parse).find(row=>row[1]===reference[0].id);assert.equal(row[header.indexOf('Actual net revenue')],'');assert.equal(row[header.indexOf('Difference')],'');assert.equal(row[header.indexOf('Status')],'Awaiting activity');assert.equal(row[header.indexOf('Actual revenue source')],'Unavailable');assert.equal(row[header.indexOf('Previous net revenue')],'');console.log('PASS: new PRO/manager/sales rep targets show Awaiting activity with no generated actuals or history; both metrics, saved zero versus confirmed zero activity, neutral status and KPI alerts, omitted unknown chart points, empty CSV inputs with clear status, and preserved existing actuals/history after saving.');})();
`;
new Function('require',setup+verify)(require).catch(error=>{console.error(error);process.exitCode=1;});
