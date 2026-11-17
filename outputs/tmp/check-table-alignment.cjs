const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('dashboard-financial-foundation.js','utf8');
let tables=[],observerCallback;
const classList={contains:()=>false,add(){}};
const document={body:{classList},getElementById:()=>null,querySelectorAll:selector=>selector==='main table,dialog table'?tables:[]};
const context={document,requestAnimationFrame:callback=>callback(),MutationObserver:class{constructor(callback){observerCallback=callback;}observe(){}},console};
vm.createContext(context);
function cell(text,tag='TD',colSpan=1,rowSpan=1){return{textContent:text,tagName:tag,colSpan,rowSpan,dataset:{},querySelector:()=>null};}
function table(headers,values,{footer,financial=false}={}){
 const table={tHead:{rows:[]},tFoot:footer?{}:null,rows:[],classList,parentElement:{matches:()=>true,classList},matches:()=>financial,closest:()=>null};
 const row=(cells,parent)=>{const result={cells,parentElement:parent,closest:selector=>selector==='table'?table:null};cells.forEach(c=>c.closest=selector=>selector==='table'?table:null);table.rows.push(result);return result;};
 for(const cells of headers)table.tHead.rows.push(row(cells,table.tHead));
 for(const cells of values)row(cells,{});
 if(footer)row(footer,table.tFoot);
 return table;
}
const fixture=(labels,values,options={})=>table([labels.map(label=>cell(label,'TH'))],values.map(row=>row.map(value=>cell(value))),options);
const body=table=>table.rows.filter(row=>row.parentElement!==table.tHead&&row.parentElement!==table.tFoot);
const aligns=row=>row.cells.map(cell=>cell.dataset.dashboardAlign);
const reports=[
 ['Home',['Date','Bills','Patients','Gross','Discount','Net revenue'],['2026-11-15','10','8','₹1,000','₹50','₹950'],['left','center','center','right','right','right']],
 ['Revenue & Sales',['Channel (by creating login)','Bills','Revenue','Share'],['Lab accession','11770','₹63,02,072','48.4%'],['left','center','right','center']],
 ['Specialty',['Panel','Orders','Avg ticket','Revenue'],['Yodaara','7','₹15,578','₹1,09,043'],['left','center','right','right']],
 ['Tests & Patients',['Test name','Department','Tests','Barcodes','Revenue'],['CBC','HAEMATOLOGY','86','71','₹3,400'],['left','left','center','center','right']],
 ['Financial Overview',['Branch','Clients','Tests','Gross','Cost','Referral','Net Margin'],['YODA','12','86','₹3,000','₹1,000','₹200','₹1,800'],['left','center','center','right','right','right','right']],
 ['Cost Analysis',['Expense category','Previous period','Current period','Variance amount','Variance %'],['Employee salaries','₹900','₹1,000','₹100','11.1%'],['left','right','right','right','center']],
 ['QC',['Test','Runs','Passed','Failed','Pass rate'],['CBC','100','96','4','96%'],['left','center','center','center','center']],
 ['TAT & Operations',['Category','Tests','Actual total TAT','Lab processing','Within 24h'],['BIOCHEMISTRY','26234','3.2h','1.4h','96.9%'],['left','center','center','center','center']],
 ['Doctors',['Doctor','Specialization','City','Bills','Patients','Revenue'],['Dr Rao','General','Hyderabad','10','8','₹3,000'],['left','left','left','center','center','right']],
 ['Clients',['Client ID','Client','Type','PRO','Bills','Patients','Revenue'],['3788','YODA','B2B','Rao','10','8','₹3,000'],['center','left','left','left','center','center','right']],
 ['Location Explorer',['Centre','City','COCO/FOCO','Bills','Tests','Patients','Revenue'],['YODA','Hyderabad','COCO','10','86','8','₹3,000'],['left','left','left','center','center','center','right']],
 ['Targets & Alerts',['Person','Scope','Previous month target','Current month target','Net revenue','Difference','Status'],['Rao','PRO','₹1,000','₹2,000','₹1,800','₹-200','Shortfall'],['left','left','right','right','right','right','left']],
 ['Mr Yoda B2C',['Booked via','Orders','Billed','Cancelled','Pending','Billed %'],['Web','10','8','1','1','80%'],['left','center','center','center','center','center']],
 ['Sales Team',['PRO','Designation','Panels','Bills','Patients','Revenue'],['PRO #150\nPRO ID: 150','Manager','2','10','8','₹3,000'],['left','left','center','center','center','right']]
];
for(const [name,labels,values,expected]of reports){
 const current=fixture(labels,[values],{financial:name==='Financial Overview',footer:labels.map((label,index)=>cell(index===0?'All filtered total':values[index]))});
 tables.push(current);current.expected=expected;current.reportName=name;
}
vm.runInContext(source,context);
for(const current of tables){
 assert.deepEqual(aligns(current.tHead.rows[0]),current.expected,current.reportName+' headings');
 assert.deepEqual(aligns(body(current)[0]),current.expected,current.reportName+' values');
 assert.deepEqual(aligns(current.rows.at(-1)),['left',...current.expected.slice(1)],current.reportName+' totals');
}
// Independent numeric first columns, negative money, absent values and monthly pivot amounts.
const cases=[
 [['Client ID','Client','Count','Revenue'],['3788','YODA','0','₹-200'],['center','left','center','right']],
 [['Name','Bills','Cost','Gross','Net Margin'],['YODA','—','—','0','—'],['left','center','right','right','right']],
 [['Expense category','2026-11','2026-10','Change (%)'],['Salaries','₹1,000','₹900','11.1%'],['left','right','right','center']],
 [['PRO','Shortfall/Excess','Difference'],['Rao','Shortfall','₹-200'],['left','center','right']],
 [['Name','Count','Cost %','Defined SLA (LIS)'],['YODA','0','53.7%','4h 10m'],['left','center','center','center']]
 ,[['Name','Margin','Cost'],['YODA','53.7%','₹100'],['left','center','right']]
];
for(const [labels,values,expected]of cases){const current=fixture(labels,[values]);tables=[current];observerCallback();assert.deepEqual(aligns(body(current)[0]),expected,labels.join(', '));}
// Group headers, rowspans and colspan detail rows retain their column mapping.
const group=table([
 [cell('Branch','TH',1,2),cell('Activity','TH',2),cell('Financial','TH',2)],
 [cell('Bills','TH'),cell('Tests','TH'),cell('Gross','TH'),cell('Net revenue','TH')]
],[[cell('YODA'),cell('10'),cell('86'),cell('₹100'),cell('₹90')],[cell('Standalone detail section','TD',5)]]);
tables=[group];observerCallback();
assert.deepEqual(aligns(group.tHead.rows[0]),['left','center','right']);
assert.deepEqual(aligns(group.tHead.rows[1]),['center','center','right','right']);
assert.deepEqual(aligns(body(group)[0]),['left','center','center','right','right']);
assert.equal(body(group)[0].cells[3].dataset.dashboardTone,'inflow');
assert.equal(body(group)[0].cells[4].dataset.dashboardTone,'result');
assert.equal(group.tHead.rows[1].cells[2].dataset.dashboardTone,'inflow');
assert.equal(group.tHead.rows[1].cells[3].dataset.dashboardTone,'result');
assert.equal(body(group)[1].cells[0].dataset.dashboardAlign,'left');
// Parent table must not apply its headers to a nested child table.
const parent=fixture(['Client','Bills','Revenue'],[['YODA','10','₹100']]);
const child=fixture(['Test','Tests','Revenue'],[['CBC','86','₹90']]);parent.rows.push(...child.rows);
tables=[parent,child];observerCallback();assert.deepEqual(aligns(body(child)[0]),['left','center','right']);
// A later filter or drilldown changes the same ambiguous columns without stale alignment.
const dynamic=fixture(['Name','November'],[['YODA','₹100']]);tables=[dynamic];observerCallback();
assert.equal(body(dynamic)[0].cells[1].dataset.dashboardAlign,'right');body(dynamic)[0].cells[1].textContent='42';observerCallback();
assert.equal(body(dynamic)[0].cells[1].dataset.dashboardAlign,'center');
dynamic.tHead.rows[0].cells[1].dataset.columnAlign='right';observerCallback();assert.equal(body(dynamic)[0].cells[1].dataset.dashboardAlign,'right');
const css=fs.readFileSync('dashboard-theme.css','utf8');
for(const value of ['left','center','right'])assert(css.includes('[data-dashboard-align="'+value+'"] { text-align:'+value+'!important; }'));
for(const file of fs.readdirSync('.').filter(file=>file.endsWith('.html')&&!file.includes('Copy'))){
 const html=fs.readFileSync(file,'utf8');assert(html.includes('src="dashboard-financial-foundation.js"'),file);assert(html.includes('href="dashboard-theme.css"'),file);
}
console.log('PASS: shared alignment across all 14 dashboard pages, financial/cost reports, headers/body/totals, IDs, zero and negative values, missing values, percentages/durations, grouped headers, spans, nested tables, filter/drilldown updates and explicit overrides.');
