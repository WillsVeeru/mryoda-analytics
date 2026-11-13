const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('center-overview-financial.js','utf8');
function extract(name){const start=source.indexOf('function '+name+'(');assert(start>=0,name);let end=source.indexOf('\nfunction ',start+1);if(end<0)end=source.length;return source.slice(start,end).trim();}
const elements=new Map();function co(id){if(!elements.has(id))elements.set(id,{value:'all',innerHTML:'',textContent:'',children:[],setAttribute(k,v){this[k]=v;}});return elements.get(id);}
let renders=0,calls=[],download;
const context={Date,Intl,Map,Set,Number,console,co,centerEscape:String,centerNumber:String,centerMoney:v=>'₹'+v,dashboardIcon:()=>'',renderFinancialModule:()=>renders++,centerTotal:()=>({}),
 financialCostOverview:(a,b,current,previous)=>JSON.stringify({current,previous}),financialCostPivot:()=>'<pivot>',financialBranchExpenses:()=>'<branches>',financialCostPeriodComparison:()=>'<comparison>',
 financialPeriodCenters:period=>{calls.push(period);return[];},financialTableCellText:cell=>cell.textContent,
 downloadCenterInsightCSV:(name,rows,period)=>{download={name,rows,period};}};
vm.createContext(context);
vm.runInContext("let financialCostPeriod=1,financialCustomComparison=null,financialExpenseView='overview';",context);
for(const name of ['financialValidComparisonDate','financialPeriod','financialCustomComparisonControls','setFinancialCostPeriod','setFinancialCustomComparison','financialCostAnalysis','financialSortValue','financialSortCompare','sortFinancialTableGroups','mountFinancialSortHeaders','financialNetMargin','financialTotals','financialTablePageWindow','exportFinancialDataTable'])vm.runInContext(extract(name),context);
const evaluate=code=>vm.runInContext(code,context),json=value=>JSON.parse(JSON.stringify(value));
co('coFrom').value='2026-11-06';co('coTo').value='2026-11-12';
assert.deepEqual(json(context.financialPeriod(1)),{start:'2026-11-01',end:'2026-11-30'});
assert.deepEqual(json(context.financialPeriod(3,true)),{start:'2026-07-01',end:'2026-09-30'});
context.setFinancialCostPeriod('custom');assert.equal(evaluate('financialCostPeriod'),'custom');
assert.deepEqual(json(context.financialPeriod('custom')),{start:'2026-11-06',end:'2026-11-12'});
assert.deepEqual(json(context.financialPeriod('custom',true)),{start:'2026-10-30',end:'2026-11-05'});
let html=context.financialCostAnalysis();assert(html.includes('Custom Comparison'));assert.equal((html.match(/type="date"/g)||[]).length,4);assert(html.includes('2026-11-06'));
context.setFinancialCustomComparison('previousFrom','2025-10-01');context.setFinancialCustomComparison('previousTo','2025-10-31');
calls=[];html=context.financialCostAnalysis();assert.deepEqual(json(calls),[{start:'2026-11-06',end:'2026-11-12'},{start:'2025-10-01',end:'2025-10-31'}]);
context.setFinancialCustomComparison('currentFrom','2026-12-10');html=context.financialCostAnalysis();assert(html.includes('role="status"'));assert.equal((html.match(/type="date"/g)||[]).length,4);assert.equal(context.financialPeriod('custom'),null);
assert(!context.financialValidComparisonDate('2026-02-30'));assert(context.financialValidComparisonDate('2024-02-29'));
context.setFinancialCustomComparison('currentFrom','2026-11-06');context.setFinancialCostPeriod('12');assert.equal(evaluate('financialCostPeriod'),12);context.setFinancialCostPeriod('custom');assert.equal(context.financialPeriod('custom',true).start,'2025-10-01');
for(const view of ['overview','pivot','branch','comparison']){evaluate("financialExpenseView='"+view+"'");assert(context.financialCostAnalysis().includes('financialCustom-currentFrom'));}
for(const [text,value]of [['₹1,20,000',120000],['−₹20,000',-20000],['+₹20,000',20000],['₹-20,000',-20000],['-2.3%',-2.3],['₹1.34Cr',13400000],['₹6.68L',668000],['—',null]])assert.equal(context.financialSortValue(text),value);
assert(context.financialSortCompare('₹9,500','₹1,20,000','desc')>0);assert(context.financialSortCompare('₹-20,000','₹0','asc')<0);assert(context.financialSortCompare('—','₹0','asc')>0);assert(context.financialSortCompare('—','₹0','desc')>0);assert(context.financialSortCompare('Branch 2','Branch 10','asc')<0);
class Node{
 constructor(tag='',text=''){this.tag=tag;this._text=text;this.children=[];this.attrs={};this.listeners={};this.className='';this.parent=null;}
 get textContent(){return this._text+this.children.map(n=>n.textContent).join('');}get firstChild(){return this.children[0]||null;}
 appendChild(n){if(n.tag==='#fragment'){for(const child of [...n.children])this.appendChild(child);return n;}if(n.parent)n.parent.children.splice(n.parent.children.indexOf(n),1);n.parent=this;this.children.push(n);return n;}
 setAttribute(k,v){this.attrs[k]=v;}addEventListener(k,fn){this.listeners[k]=fn;}
 querySelector(selector){const cls=selector.slice(1);for(const n of this.children){if(n.className===cls)return n;const found=n.querySelector(selector);if(found)return found;}return null;}
}
context.document={createElement:tag=>new Node(tag),createDocumentFragment:()=>new Node('#fragment')};
const header=['Branch','Revenue'].map(text=>{const cell=new Node('th');cell.appendChild(new Node('#text',text));return cell;});
const body=new Node('tbody'),groups=Array.from({length:12},(_,i)=>{const row=new Node('tr');row.cells=[new Node('td','Branch '+i),new Node('td','₹'+(i*1000))];body.appendChild(row);const details=i===3?[new Node('tr','Branch 3 detail')]:[];details.forEach(n=>body.appendChild(n));return {row,details};});
const total=new Node('tr');total.cells=[new Node('td','Total'),new Node('td','₹66000')];
const table={tHead:{rows:[{cells:header}]},tBodies:[body],tFoot:{rows:[total]}};
const controller={table,groups,state:{page:2,size:5},module:'Cost Analysis',exportName:'test'};
controller.render=()=>{context.sortFinancialTableGroups(controller);const page=context.financialTablePageWindow(groups.length,controller.state.page,controller.state.size);groups.forEach((g,i)=>g.row.hidden=i<page.start||i>=page.end);};
context.mountFinancialSortHeaders(controller);header[1].querySelector('.financial-column-sort').listeners.click();assert.equal(controller.state.page,1);assert.equal(groups[0].row.cells[1].textContent,'₹11000');assert.equal(header[1].attrs['aria-sort'],'descending');assert.equal(groups.filter(g=>!g.row.hidden).length,5);
const branch3=groups.find(g=>g.details.length);assert.equal(body.children[body.children.indexOf(branch3.row)+1],branch3.details[0]);
header[1].querySelector('.financial-column-sort').listeners.click();assert.equal(groups[0].row.cells[1].textContent,'₹0');assert.equal(header[1].attrs['aria-sort'],'ascending');assert.equal(table.tFoot.rows[0],total);
context.exportFinancialDataTable(controller);assert.equal(download.rows.length,14);assert.equal(download.rows[1][1],'₹0');assert.equal(download.rows.at(-1)[0],'Total');assert.equal(download.period.start,'2026-11-06');
context.mountFinancialSortHeaders(controller);assert.equal(header[1].children.length,1);assert.equal(controller.state.sortColumn,1);
// Run the actual Branch-wise rendering and verify referral, margin and totals.
Object.assign(context,{window:{dispatchEvent(){}},Event:class{constructor(type){this.type=type;}},currentCenterRows:[]});
vm.runInContext(fs.readFileSync('dashboard-targets.js','utf8'),context);
for(const name of ['financialHeaderTypeMatches','captureFinancialPROActuals','financialPROTarget','financialPROTargetStatus','financialPROTargetTotals','financialClientDisplayType','financialBranchCounts','financialPath','financialDrillButton','financialTableArrow','renderFinancialReport'])vm.runInContext(extract(name),context);
const records=[{name:'A',type:'B2B',clientType:'Credit Client',clientKey:'CL1',proId:'P1',pro:'Demo PRO',tests:2,gross:1100,discount:100,net:1000,cost:100,referral:50}];
Object.assign(context,{financialViews:[['branch','Branch wise','Branch']],financialView:'branch',financialModule:'Overall Revenue',financialTrail:[],financialBranchPath:'client',financialGroupFields:{},financialLedger:()=>records,
 syncFinancialGlobalScope(){},syncFinancialHeaderClientOptions(){},syncFinancialSummaryMetrics(){},syncFinancialSummaryAlternative(){},enhanceFinancialTables(){},
 financialAmount:v=>v===null?'—':String(v),centerDateRange:()=>['2026-11-06'],financialReportGroups:rows=>[{name:'A',key:'A',records:rows,...context.financialTotals(rows)}],financialCells:(row,tag)=>row.map(v=>'<'+tag+'>'+v+'</'+tag+'>').join('')});
context.renderFinancialReport();assert(co('financialReportHead').innerHTML.includes('<th>Referral</th>'));assert(co('financialReportHead').innerHTML.includes('<th>Net Margin</th>'));assert(co('financialReportRows').innerHTML.includes('<td>50</td><td>850</td>'));assert(co('financialReportTotals').innerHTML.includes('<td>50</td><td>850</td>'));
assert(co('financialReportHead').innerHTML.includes('<th>Branch</th><th>Clients</th><th>Tests</th>'));assert(!co('financialReportHead').innerHTML.includes('<th>PROs</th>'));
assert(co('financialReportRows').innerHTML.includes('<td>1</td><td>2</td>'));assert(co('financialReportTotals').innerHTML.includes('<td>Total</td><td>1</td><td>2</td>'));
const counts=context.financialBranchCounts([{clientKey:'CL1',proId:'P1'},{clientKey:'CL1',proId:'P1'},{clientKey:'CL2',proId:'P2'},{clientKey:'walk-in',proId:'NO-PRO'},{clientKey:'walk-in',proId:'NO-PRO'},{clientKey:'CL3',proId:'P1'},{clientKey:'CL4',proId:null},{clientKey:'CL5',proId:'UNASSIGNED-PRO'}]);assert.deepEqual(json(counts),{clients:6,pros:2});assert.deepEqual(json(context.financialBranchCounts([])),{clients:0,pros:0});
records[0].cost=null;context.renderFinancialReport();assert(co('financialReportRows').innerHTML.includes('<td>50</td><td>—</td>'));
assert(co('financialReportHead').innerHTML.includes('<th>Net Revenue</th>'));assert(!co('financialReportHead').innerHTML.includes('<th>Net</th>'));
assert(!co('financialDrillControls').innerHTML.includes('Department directly'));assert(co('financialDrillControls').hidden);
context.financialBranchPath='department';assert.deepEqual(json(context.financialPath()),['branch','client','department','test']);context.financialBranchPath='client';
for(const [type,expected]of [['B2B','B2B'],['PUP','PUP'],['Walk-in','Walk-In'],['TPA','TPA'],['Corporate','Corporate']])assert.equal(context.financialClientDisplayType({type,clientType:'Credit Client'}),expected);
for(const terms of ['Rolling Advance','Cash & Carry','Credit Client'])assert.equal(context.financialClientDisplayType({type:'B2B',clientType:terms}),'B2B');
assert.equal(context.financialClientDisplayType({clientType:'TPA'}),'TPA');assert.equal(context.financialClientDisplayType({}),'—');
context.financialViews.push(['client','Client wise','Client']);context.financialView='client';context.renderFinancialReport();assert(co('financialReportHead').innerHTML.includes('<th>Tests</th>'));assert(co('financialReportRows').innerHTML.includes('<td>B2B</td>'));assert(!co('financialReportRows').innerHTML.includes('<td>Credit Client</td>'));context.financialView='branch';
context.financialViews.push(['department','Department wise','Department'],['pro','PRO wise','PRO']);context.financialView='department';records[0].cost=100;context.renderFinancialReport();
for(const label of ['Tests','Cost','Referral','Net Margin'])assert(co('financialReportHead').innerHTML.includes('<th>'+label+'</th>'));
assert(co('financialReportRows').innerHTML.includes('<td>100</td><td>50</td><td>850</td>'));
context.financialViews.push(['test','Test wise','Test']);context.financialView='test';context.renderFinancialReport();for(const label of ['Tests','Cost','Referral','Net Margin'])assert(co('financialReportHead').innerHTML.includes('<th>'+label+'</th>'));assert(co('financialReportRows').innerHTML.includes('<td>100</td><td>50</td><td>850</td>'));assert(co('financialReportTotals').innerHTML.includes('<td>100</td><td>50</td><td>850</td>'));
for(const type of ['B2B','PUP','Walk-In','TPA','Corporate'])assert(context.financialHeaderTypeMatches({type,clientType:'Rolling Advance'},type));
const targetStore=context.window.dashboardTargets,pro='HYDERABAD-PRO01';context.financialView='pro';context.financialReportGroups=rows=>[{name:'Akshay Reddy',key:pro,records:rows,...context.financialTotals(rows)}];context.renderFinancialReport();
for(const label of ['Tests','Cost','Shortfall / Excess','Difference'])assert(co('financialReportHead').innerHTML.includes('<th>'+label+'</th>'));for(const label of ['Target Shortfall','Target Excess','Status'])assert(!co('financialReportHead').innerHTML.includes('<th>'+label+'</th>'));assert(co('financialReportRows').innerHTML.includes('>Shortfall</span>'));assert(co('financialReportRows').innerHTML.includes('<td>100</td><td>50</td><td>850</td>'));assert(!co('financialDrillControls').innerHTML.includes('targets-alerts.html'));
targetStore.setMonthlyTarget(pro,'2026-11',3000);context.renderFinancialReport();assert(co('financialReportRows').innerHTML.includes('>Excess</span>'));assert(co('financialReportRows').innerHTML.includes('>+300</span>'));assert(co('financialReportTotals').innerHTML.includes('>+300</span>'));
targetStore.setMonthlyTarget(pro,'2026-11',null);context.renderFinancialReport();assert(co('financialReportRows').innerHTML.includes('No target'));
targetStore.setMonthlyTarget(pro,'2026-11',3000);targetStore.setMonthlyTarget('HYDERABAD-PRO02','2026-11',6000);
const targetTotals=context.financialPROTargetTotals([{key:pro,net:1000},{key:'HYDERABAD-PRO02',net:500},{key:'NO-PRO',net:999999}]);assert.equal(targetTotals.shortfall,900);assert.equal(targetTotals.excess,300);assert.equal(targetTotals.status,'Mixed');
assert.equal(targetTotals.difference,-600);
Object.assign(context,{financialOperatingExpenseBranches:rows=>rows,financialCostTooltip:()=>'',centerTotal:()=>({expenditure:1})});
vm.runInContext(extract('financialCostTrend'),context);calls=[];context.financialCostTrend({start:'2026-01-31',end:'2026-03-20'});
assert.deepEqual(json(calls),[{start:'2026-01-31',end:'2026-01-31'},{start:'2026-02-01',end:'2026-02-28'},{start:'2026-03-01',end:'2026-03-20'}]);
calls=[];context.financialCostTrend({start:'2026-11-06',end:'2026-11-12'});assert.equal(calls.length,7);assert.equal(calls.at(-1).end,'2026-11-12');
const page=fs.readFileSync('center-overview.html','utf8');assert(page.indexOf('financial-table-controls.css')<page.indexOf('href="dashboard-theme.css"'));
vm.runInContext(extract('financialToneClass'),context);assert.equal(context.financialToneClass('Shortfall / Excess'),'financial-tone-benchmark');assert.equal(context.financialToneClass('Difference'),'financial-tone-inflow');assert(co('financialReportRows').innerHTML.includes('financial-target-status pill'));assert(!co('financialReportRows').innerHTML.includes('financial-target-position'));
const theme=fs.readFileSync('dashboard-theme.css','utf8');for(const [state,color]of [['positive','#216b39'],['warning','#9a4248'],['neutral','#83958a']])assert(theme.includes('.financial-target-difference.'+state+'{color:'+color+'!important}'));
for(const name of ['financialChartData','renderFinancialTableChart','mountFinancialTableActions'])vm.runInContext(extract(name),context);
vm.runInContext(fs.readFileSync('dashboard-report-charts.js','utf8'),context);
Node.prototype.before=function(node){const parent=this.parent,index=parent.children.indexOf(this);if(node.parent)node.parent.children.splice(node.parent.children.indexOf(node),1);node.parent=parent;parent.children.splice(index,0,node);};
Node.prototype.insertAdjacentElement=function(where,node){assert.equal(where,'beforebegin');this.before(node);};Node.prototype.focus=function(){this.focused=true;};
const surface=new Node('section'),wrap=new Node('div');surface.appendChild(wrap);
context.mountFinancialTableActions(controller,wrap,{querySelector:()=>null},'Cost Analysis','Cost Analysis:branch:0',false);
assert.equal(surface.children[0].children[0],controller.chartButton);assert.equal(surface.children[0].children[1],controller.exportButton);assert.equal(surface.children[1],controller.chartHost);
controller.render=()=>context.renderFinancialTableChart(controller);controller.chartButton.listeners.click();assert(!controller.chartHost.hidden);assert(controller.chartHost.innerHTML.includes('Chart type'));assert.equal(context.financialChartData(controller).rows.length,12);assert.equal(context.financialChartData(controller).types[1],'money');assert(!context.financialChartData(controller).rows.some(r=>r[0]==='Total'));
controller.chartHost.listeners.click({target:{closest:()=>({})}});assert(controller.chartHost.hidden);assert(controller.chartButton.focused);
const pivotTools=new Node('div'),pivotExport=new Node('button');pivotTools.appendChild(pivotExport);const pivotWrap=new Node('div');surface.appendChild(pivotWrap);const pivot={table,groups,state:{},module:'Cost Analysis'};
context.mountFinancialTableActions(pivot,pivotWrap,{querySelector:()=>pivotExport},'Pivot','Cost Analysis:pivot:0',true);assert.equal(pivotTools.children[0],pivot.chartButton);assert.equal(pivotTools.children[1],pivotExport);assert.equal(pivot.exportButton,undefined);
const model=context.financialChartData({table:{tHead:{rows:[{cells:[new Node('th','Client'),new Node('th','Cost'),new Node('th','Action')]}]}},groups:[{row:{cells:[new Node('td','A'),new Node('td','—'),new Node('td','View')]}}]});assert.deepEqual(json(model.columns),['Client','Cost']);assert.equal(model.types[1],'money');assert.equal(model.rows[0][1],null);
for(const asset of ['dashboard-report-charts.css','dashboard-report-charts.js','dashboard-report-chart-tooltips.js','compact-chart-marks.js'])assert(page.includes(asset));
console.log('PASS: custom/current/previous calendar ranges, invalid and leap dates, all Cost views, sorting all rows before pagination, both directions, null/negative/money/text values, attached breakdowns, fixed totals, sorted CSV, and Branch Referral/Net Margin including missing CPT.');
console.log('PASS: Chart before Export, reusable chart controls, complete filtered rows without footer totals, close/focus handling, Pivot export preserved and missing costs left unavailable.');
