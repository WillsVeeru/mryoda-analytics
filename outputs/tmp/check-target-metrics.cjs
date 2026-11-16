const fs=require('fs');
const original=fs.readFileSync('tmp/check-target-history.cjs','utf8');
const setup=original.slice(0,original.indexOf('assert.equal(reference.length,18);')).replace("'dashboard-report-charts.js','targets-alerts.js'","'dashboard-report-charts.js','targets-alerts-sample.js','targets-alerts.js'");
const verify=String.raw`
const selectMetric=(value,report=false)=>{ids.get(report?'targetReportMetric':'targetMetric').value=value;fire(report?'targetReportMetric':'targetMetric','change',{});};
const person=data.people.find(row=>row.id==='BENGALURU-PRO01'),originalRevenue=get(person.id).actual;
assert(save('pro',person.id,'900000'));assert.equal(get(person.id).actual,originalRevenue);assert.equal(get(person.id).difference,originalRevenue-900000);
selectMetric('tests');assert.equal(api.metric(),'tests');assert.equal(ids.get('targetReportMetric').value,'tests');assert(ids.get('targetsReportTitle').textContent.includes('Test count'));
assert.equal(api.rows().length,28);assert(api.rows().filter(row=>row.source==='demo').every(row=>row.metric==='tests'&&Number.isSafeInteger(row.actual)&&row.actual>=0));
assert(!ids.get('targetsTable').innerHTML.includes('₹'));assert(ids.get('targetsTable').innerHTML.includes('Current tests'));assert(ids.get('targetsTable').innerHTML.includes('data-column-align="center"'));assert.equal(ids.get('targetValue').attrs['aria-label'],'Monthly test count target');
const sampleTests=get(person.id).actual;assert(save('pro',person.id,'500'));assert.equal(get(person.id).actual,sampleTests);assert.equal(get(person.id).target,500);assert.equal(data.savedTarget('pro',person.id,'2026-11'),900000);assert.equal(data.savedTarget('pro',person.id,'2026-11','tests'),500);
selectMetric('revenue',true);assert.equal(ids.get('targetMetric').value,'revenue');assert.equal(get(person.id).target,900000);assert.equal(get(person.id).actual,originalRevenue);assert(ids.get('targetsTable').innerHTML.includes('₹'));
selectMetric('tests');const pro='HYDERABAD-PRO01',other='HYDERABAD-PRO02',rep='HYDERABAD-SR01';
data.captureActuals({from:'2026-11-01',to:'2026-11-16',centerIds:['hyderabad'],records:[{proId:pro,accountManagerId:rep,representativeId:rep,net:10000,tests:12},{proId:pro,accountManagerId:rep,representativeId:rep,net:5000,tests:8}],scope:'Metric test activity'});
const snapshot=JSON.stringify(data.getSnapshot());
for(const [scope,id,target,difference,status]of [['pro',pro,'50',-30,'Shortfall'],['accountManager',rep,'10',10,'Excess'],['salesRep',rep,'20',0,'Target met']]){
 assert(save(scope,id,target));const row=get(id,scope);assert.equal(row.actual,20);assert.equal(row.difference,difference);assert.equal(row.status,status);assert(!row.sampleActual);assert.equal(data.actualFor(scope,id,'2026-11-01','2026-11-16'),15000);assert.equal(JSON.stringify(data.getSnapshot()),snapshot);
}
assert(save('pro',other,'0'));assert.equal(get(other).actual,0);assert.equal(get(other).target,0);assert.equal(get(other).status,'Target met');assert(!get(other).sampleActual);
for(const value of ['1.5','-1','']){ids.get('targetValue').value=value;assert.equal(api.saveTarget(),false);}
allScopes();assert.equal(api.rows().length,48);assert.equal(data.savedTargets('2026-11','tests').length,5);
api.exportCsv();const blob=payload;assert(context.download.download.endsWith('-tests.csv'));
fire('targetsChartToggle','click',{});assert(ids.get('targetsChart').innerHTML.includes('Current tests'));fire('targetsChart','click',{closest:()=>({})});
data.setScopedTarget('pro',pro,'2026-10',600,'tests');
data.captureActuals({from:'2026-10-01',to:'2026-10-31',centerIds:['hyderabad'],records:[{proId:pro,tests:400,net:180000}],scope:'Previous test activity'});api.render();
assert.equal(get(pro).previousTarget,600);assert.equal(get(pro).previousActual,400);assert.equal(get(pro).previousDifference,-200);assert.equal(get(pro).previousStatus,'Shortfall');
context.location.protocol='file:';const link=data.link('center-overview.html#coWorkspaceCharts'),imported={window:{dispatchEvent(){}},location:{protocol:'file:',search:link.slice(link.indexOf('?'),link.indexOf('#'))},localStorage:{getItem:()=>null,setItem(){}},URLSearchParams,Date,Event:class{}};
vm.createContext(imported);for(const file of ['targets-people.js','dashboard-targets.js'])vm.runInContext(fs.readFileSync(file,'utf8'),imported);
assert.equal(imported.window.dashboardTargets.savedTarget('pro',pro,'2026-10','tests'),600);assert.equal(imported.window.dashboardTargets.savedTarget('pro',person.id,'2026-11'),900000);assert.equal(imported.window.dashboardTargets.actualFor('pro',pro,'2026-10-01','2026-10-31','tests'),400);
data.captureActuals({from:'2026-11-01',to:'2026-11-16',centerIds:['hyderabad'],records:[{proId:pro,net:1,tests:12},{proId:pro,net:2},{proId:other,net:0,tests:0}],scope:'Incomplete test inputs'});
assert.equal(data.actualFor('pro',pro,'2026-11-01','2026-11-16','tests'),null);assert.equal(data.actualFor('pro',other,'2026-11-01','2026-11-16','tests'),0);assert.equal(data.actualFor('pro',pro,'2026-11-01','2026-11-16'),3);
assert.throws(()=>data.setScopedTarget('pro',pro,'2026-11',1,'unknown'));assert.equal(data.actualFor('pro',pro,'2026-11-01','2026-11-16','unknown'),null);
const formulas={window:{},document:{body:null}};vm.runInNewContext(fs.readFileSync('dashboard-value-formulas.js','utf8'),formulas);const hints=formulas.window.dashboardValueFormulas.calculate(['Current target','Current tests','Current difference','Current status'],['50','20','-30','Shortfall']);assert.equal(hints.get(2).formula,'Current month Test Count − Target');assert(!hints.get(2).calculation.includes('₹'));assert.equal(hints.get(3).title,'Current month status');
return (async()=>{const csv=await blob.text();assert(csv.includes('"Test count"'));assert(csv.includes('"Actual test count"'));assert(csv.includes('"Actual test count source"'));assert(!csv.includes('₹'));assert.equal(csv.split('\r\n').length,49);console.log('PASS: Revenue/Test count selectors, independent targets and monthly history for all three roles, correct units and alignment, preserved actuals after saving, zero versus missing test inputs, matching statuses/pacing/charts/formulas/CSV, validated local-file transfer and unchanged legacy revenue integration.');})();
`;
new Function('require',setup+verify)(require).catch(error=>{console.error(error);process.exitCode=1;});
