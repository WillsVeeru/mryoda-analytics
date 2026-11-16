const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('center-overview-financial.js','utf8');
function extract(name){const start=source.indexOf('function '+name+'('),end=source.indexOf('\nfunction ',start+1);assert(start>=0,name);return source.slice(start,end<0?source.length:end);}
let download;
const context={centerEscape:value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),co:id=>({value:id==='coFrom'?'2026-11-01':'2026-11-16'}),downloadCenterInsightCSV:(name,rows,period)=>download={name,rows,period}};
vm.createContext(context);for(const name of ['financialEntityIdMarkup','financialReportMatches','financialTableCellText','exportFinancialDataTable'])vm.runInContext(extract(name),context);
assert(context.financialEntityIdMarkup('pro','HYDERABAD-PRO01').includes('Sample PRO ID: HYDERABAD-PRO01'));
assert(context.financialEntityIdMarkup('client','HYDERABAD-CL01').includes('Sample Client ID: HYDERABAD-CL01'));
assert(!context.financialEntityIdMarkup('client','12345').includes('Sample'));
for(const id of ['NO-PRO','walk-in','UNASSIGNED-PRO',null])assert.equal(context.financialEntityIdMarkup('pro',id),'');
assert(context.financialEntityIdMarkup('client','ID-"<&').includes('ID-&quot;&lt;&amp;'));
const record={pro:'Akshay Reddy',proId:'HYDERABAD-PRO01',name:'Hyderabad Wellness Clinic',clientKey:'HYDERABAD-CL01',id:'HYDERABAD-CL01',branchName:'MR YODA',branchId:'hyd-branch-1',city:'Hyderabad',department:'BIOCHEMISTRY',test:'Glucose'};
for(const query of ['akshay','hyderabad-pro01','REDDY'])assert(context.financialReportMatches(record,'pro',query));
for(const query of ['Wellness','hyderabad-cl01','HYDERABAD-PRO01'])assert(context.financialReportMatches(record,'client',query));
assert(!context.financialReportMatches(record,'pro','OTHER-PRO'));assert(context.financialReportMatches(record,'client',''));assert(context.financialReportMatches(record,'branch','MR YODA'));
function cell(text,kind,id){return{textContent:text,querySelector(selector){if(selector==='.financial-entity-name'&&kind)return{textContent:text};if(kind&&selector==='[data-financial-id="'+kind+'"]')return{getAttribute:()=>id};return null;},cloneNode(){return{textContent:text,querySelectorAll:()=>[]};}};}
const row={cells:[cell('Hyderabad Wellness Clinic','client','HYDERABAD-CL01'),cell('Akshay Reddy','pro','HYDERABAD-PRO01'),cell('₹1,000')]};
const footer={cells:[cell('All filtered total'),cell(''),cell('₹1,000')]};
const table={tHead:{rows:[{cells:['Client','PRO','Net Revenue'].map(text=>cell(text))}]},tFoot:{rows:[footer]}};
context.exportFinancialDataTable({table,groups:[{row}],module:'Overall Revenue',exportName:'clients'});
assert.deepEqual(JSON.parse(JSON.stringify(download.rows[0])),['Client','Client ID','PRO','PRO ID','Net Revenue']);
assert.deepEqual(JSON.parse(JSON.stringify(download.rows[1])),['Hyderabad Wellness Clinic','HYDERABAD-CL01','Akshay Reddy','HYDERABAD-PRO01','₹1,000']);
assert.deepEqual(JSON.parse(JSON.stringify(download.rows[2])),['All filtered total','','','','₹1,000']);
assert.equal(context.financialTableCellText(row.cells[0]),'Hyderabad Wellness Clinic','Charts and sorting use name only');
console.log('PASS: sample-labelled and escaped source IDs, pooled/unassigned IDs omitted, case-insensitive name/ID search, separate Client ID and PRO ID CSV fields, blank footer IDs and clean chart labels.');
