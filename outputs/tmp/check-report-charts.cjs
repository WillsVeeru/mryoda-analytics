const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync('dashboard-report-charts.js','utf8'),context);
const api=context.window.dashboardReportCharts;
const host={innerHTML:'',querySelector(){return{focus(){}};}};
const config={key:'test',title:'Activity',columns:['Category','Tests','TAT','Revenue'],types:['text','number','hours','money'],metric:1,rows:[['A',5,2,100],['B',8,4,250],['A',3,6,200]],format:v=>String(v),close:''};
api.render(host,config);assert(host.innerHTML.includes('Chart Category'));assert(host.innerHTML.includes('Chart Value'));assert(host.innerHTML.includes('Chart Top'));
assert.equal(api.series(config,api.states.get('test')).find(r=>r.label==='A').value,8);
for(const type of ['Bar','Column','Pie','Line','Area']){
 host.onclick({target:{closest:()=>({dataset:{reportChartType:type}})},stopPropagation(){}});
 assert(host.innerHTML.includes('aria-pressed="true">'+type));assert(host.innerHTML.includes('<svg'));assert(!/NaN|undefined|Infinity/.test(host.innerHTML));
}
host.onchange({target:{dataset:{reportChartSelect:'value'},value:'2'},stopPropagation(){}});
assert.equal(api.series(config,api.states.get('test')).find(r=>r.label==='A').value,4);assert(host.innerHTML.includes('Average of available row values'));
config.rows=Array.from({length:25},(_,i)=>['Category '+i,i+1,1,100]);api.render(host,config);assert.equal(api.series(config,api.states.get('test')).length,10);
host.onchange({target:{dataset:{reportChartSelect:'top'},value:'All'},stopPropagation(){}});assert.equal(api.series(config,api.states.get('test')).length,25);
config.rows=[];api.render(host,config);assert(host.innerHTML.includes('No chart values'));
config.rows=[['Adjustment',1,1,-10100],['Revenue',2,1,3600]];const state=api.states.get('test');state.type='Bar';state.value=3;state.top='All';api.render(host,config);assert(host.innerHTML.includes('Adjustment: -10100'));assert([...host.innerHTML.matchAll(/<rect tabindex="0"[^>]*width="([^"]+)/g)].every(m=>Number(m[1])>0));
state.type='Column';api.render(host,config);assert([...host.innerHTML.matchAll(/<rect tabindex="0"[^>]*height="([^"]+)/g)].every(m=>Number(m[1])>0));assert(!/NaN|undefined|Infinity/.test(host.innerHTML));
state.type='Pie';api.render(host,config);assert(host.innerHTML.includes('positive values only'));
console.log('PASS: all five chart types, metric changes, aggregation, Top limits, state persistence and empty data.');
