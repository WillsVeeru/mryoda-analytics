const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const storage=new Map(),localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
const create=()=>{const c={window:{dispatchEvent(){}},localStorage,Date,Event:class{constructor(type){this.type=type;}}};vm.runInNewContext(fs.readFileSync('dashboard-targets.js','utf8'),c);return c.window.dashboardTargets;};
const targets=create(),id='HYDERABAD-PRO01';assert.equal(targets.catalog.length,10);assert.equal(targets.getPeriodTarget(id,'2026-11-06','2026-11-12'),350000);
targets.setMonthlyTarget(id,'2026-11',3000);assert.equal(targets.getPeriodTarget(id,'2026-11-06','2026-11-12'),700);assert.equal(create().getPeriodTarget(id,'2026-11-06','2026-11-12'),700);
assert.equal(targets.assess(1000,700).status,'Above target');assert.equal(targets.assess(500,700).shortfall,200);assert.equal(targets.assess(700,700).status,'Target met');assert.equal(targets.assess(0,0).status,'Target met');assert.equal(targets.assess(null,700).status,'Actual unavailable');assert.equal(targets.assess(1000,null).status,'No target');
targets.setMonthlyTarget(id,'2024-02',2900);targets.setMonthlyTarget(id,'2024-03',3100);assert.equal(targets.getPeriodTarget(id,'2024-02-28','2024-03-01'),300);
targets.setMonthlyTarget(id,'2026-11',null);assert.equal(targets.getPeriodTarget(id,'2026-11-06','2026-11-12'),null);assert.equal(targets.getPeriodTarget('NO-PRO','2026-11-06','2026-11-12'),null);assert.equal(targets.getPeriodTarget(id,'2026-02-30','2026-03-01'),null);assert.throws(()=>targets.setMonthlyTarget(id,'2026-11',-1));assert.throws(()=>targets.setMonthlyTarget(id,'2026-13',100));
targets.captureActuals({from:'2026-11-06',to:'2026-11-12',centerIds:['hyderabad'],records:[{proId:id,net:1000},{proId:id,net:500},{proId:'NO-PRO',net:9999}],scope:'Test scope'});
assert.equal(create().getSnapshot().actuals[id],1500);assert.equal(create().getSnapshot().actuals['HYDERABAD-PRO02'],0);assert.equal(Object.keys(create().getSnapshot().actuals).length,2);
const source=fs.readFileSync('center-overview-sales.js','utf8'),c={centerSalesTeam:()=>({manager:{id:'M1',name:'Manager'},representatives:[{id:'R1',name:'Rep1'},{id:'R2',name:'Rep2'}]}),centerInsightZones:{hyderabad:'South'},centerDefinitions:[{id:'hyderabad',name:'Hyderabad'}],Map,Set};
vm.createContext(c);for(const name of ['splitCenterActivity','centerClientRoster','centerClientWeights','buildCenterSalesRecords']){const at=source.indexOf('function '+name+'('),end=source.indexOf('\nfunction ',at+1);vm.runInContext(source.slice(at,end),c);}
c.centerSalesCategories=[{name:'BIOCHEMISTRY',weight:45},{name:'HAEMATOLOGY',weight:25},{name:'SEROLOGY / IMMUNOLOGY',weight:20},{name:'MICROBIOLOGY',weight:10}];
const rows=c.buildCenterSalesRecords([{centerId:'hyderabad',employeeId:'EMP001',net:100000}],'2026-11-01');assert.equal(rows.reduce((sum,r)=>sum+r.net,0),100000);assert.deepEqual([...new Set(rows.map(r=>r.type))].sort(),['B2B','Corporate','PUP','TPA','Walk-in'].sort());
console.log('PASS: shared saved targets across pages, monthly proration/leap days, missing/zero targets, statuses, actual snapshots, five demo client types and preserved revenue totals.');
function fileStore(search,store=new Map()){
 const c={window:{dispatchEvent(){}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},Date,URLSearchParams,location:{protocol:'file:',search},Event:class{}};
 vm.runInNewContext(fs.readFileSync('dashboard-targets.js','utf8'),c);return c.window.dashboardTargets;
}
const financeStore=new Map(),finance=fileStore('',financeStore);finance.setMonthlyTarget(id,'2026-11',3000);finance.captureActuals({from:'2026-11-06',to:'2026-11-12',centerIds:['hyderabad'],records:[{proId:id,net:1000}],scope:'Selected filters'});
const outbound=new URL(finance.link('targets-alerts.html?from=2026-11-06&to=2026-11-12'),'file:///C:/demo/');const editor=fileStore(outbound.search);assert.equal(editor.getPeriodTarget(id,'2026-11-06','2026-11-12'),700);assert.equal(editor.getSnapshot().actuals[id],1000);
editor.setMonthlyTarget(id,'2026-11',6000);const back=new URL(editor.link('center-overview.html?targetFrom=2026-11-06&targetTo=2026-11-12#coWorkspaceCharts'),'file:///C:/demo/');assert.equal(back.hash,'#coWorkspaceCharts');assert.equal(fileStore(back.search,financeStore).getPeriodTarget(id,'2026-11-06','2026-11-12'),1400);
console.log('PASS: local-file preview links carry edited targets and actuals across separate page storage without changing HTTP links.');
