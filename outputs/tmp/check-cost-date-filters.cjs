const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('center-overview-financial.js','utf8');
function extract(name){const at=source.indexOf('function '+name+'(');assert(at>=0,name);const end=source.indexOf('\nfunction ',at+1);return source.slice(at,end<0?source.length:end);}
const fields=new Map(),co=id=>{if(!fields.has(id))fields.set(id,{value:'',textContent:'',querySelector:()=>null});return fields.get(id);};
co('coFrom').value='2026-11-06';co('coTo').value='2026-11-12';
let calls=[],download,tables=[],overview,reportRenders=0;
const ctx={window:{},Date,Intl,Map,Set,Number,Array,JSON,co,centerEscape:String,centerMoney:value=>'₹'+value,dashboardIcon:()=>'<svg></svg>',currentCenterRows:[{id:'hyderabad'}],financialTableControllers:new WeakMap(),
 document:{querySelectorAll:()=>[]},renderFinancialModule(){},renderCenterOverview:()=>reportRenders++,
 aggregateCenters:(from,to)=>{calls.push({start:from,end:to});const days=Math.round((new Date(to)-new Date(from))/86400000)+1;return[{id:'hyderabad',name:'Hyderabad',expenditure:days*1000,salaries:days*300},{id:'delhi',name:'Delhi',expenditure:days*2000,salaries:days*600}];},
 centerTotal:rows=>rows.reduce((sum,row)=>({expenditure:sum.expenditure+row.expenditure,salaries:sum.salaries+row.salaries}),{expenditure:0,salaries:0}),
 financialCostOverview:(branches,prior,current,previous)=>{overview={branches,prior,current,previous};return ctx.financialCostSummaryCards(branches,prior)+'<overview>';},financialBranchExpenses:branches=>JSON.stringify(branches),
 financialTable:(headers,rows,total)=>{tables.push({headers,rows,total});return '<table></table>';},
 downloadCenterInsightCSV:(name,rows,period)=>download={name,rows,period},
 financialExpenseAllocationProfiles:{hyderabad:[.62,.18,.08]},financialExpenseCategories:[['regularOperating','Regular Operating Expenses'],['regularCapital','Regular Capital Expenses'],['expansionOperating','Expansion Operating Expenses'],['expansionCapital','Expansion Capital Expenses']]
};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('dashboard-financial-data.js','utf8'),ctx);vm.runInContext("let financialCostPeriod=1,financialCustomComparison=null,financialCostCalendarPeriods={},financialCostReportSelection=null,financialExpenseView='overview',financialCostComparisonSummary=null,financialPivotRows='branch',financialPivotMeasure='amount';",ctx);
const functions=['financialValidComparisonDate','financialPeriod','financialPeriodCenters','financialCostReportPeriod','financialPreviousRange','financialCostCalendarState','financialCostComparisonPeriod','financialCostActivePeriod','applyFinancialCostReportDates','financialCostReportToday','financialCostReportState','financialCostReportDraftPeriod','financialCostReportRangeLabel','updateFinancialCostReportPreview','refreshFinancialCostReportControls','setFinancialCostReportPeriodType','setFinancialCostReportPeriodField','financialCostReportControls','financialCostComparisonControls','setFinancialCostCalendarPeriod','financialCustomComparisonControls','setFinancialCustomComparison','setFinancialCostPeriod','financialCostSummaryTotals','financialCostSummaryCards','financialCostAnalysis','financialCostPivotData','financialCostPivot','exportFinancialCostPivot','financialBranchExpenseAllocation','financialExpenseVariance','financialCostPeriodComparison','financialOperatingExpenseBranches','financialCostTooltip','financialCostTrend'];
for(const name of functions)vm.runInContext(extract(name),ctx);
const evaluate=code=>vm.runInContext(code,ctx),plain=value=>JSON.parse(JSON.stringify(value)),view=value=>evaluate("financialExpenseView='"+value+"'");
const report={start:'2026-11-06',end:'2026-11-12'},prior={start:'2026-10-30',end:'2026-11-05'};
assert.deepEqual(plain(ctx.financialCostReportPeriod()),report);assert.deepEqual(plain(ctx.financialPreviousRange(report)),prior);
ctx.financialCostAnalysis();assert.deepEqual(plain(overview.current),report);assert.deepEqual(plain(overview.previous),prior);
assert.equal(overview.branches.length,1,'Keep the selected branch scope');
view('comparison');ctx.setFinancialCostPeriod('3');let html=ctx.financialCostAnalysis();
for(const name of ['currentYear','currentSlot','previousYear','previousSlot'])assert(html.includes('id="financialCost-'+name+'"'));
assert(html.includes('Q1 · Jan–Mar'));assert(html.includes('Current period quarter'));assert(!html.includes('financialCostReportType'));
ctx.setFinancialCostCalendarPeriod('currentYear','2024');ctx.setFinancialCostCalendarPeriod('currentSlot','1');ctx.setFinancialCostCalendarPeriod('previousYear','2023');ctx.setFinancialCostCalendarPeriod('previousSlot','4');
const quarter={start:'2024-01-01',end:'2024-03-31'},oldQuarter={start:'2023-10-01',end:'2023-12-31'};
assert.deepEqual(plain(ctx.financialCostActivePeriod()),quarter);assert.deepEqual(plain(ctx.financialCostActivePeriod(true)),oldQuarter);
calls=[];tables=[];ctx.financialCostAnalysis();assert.deepEqual(plain(calls),[quarter,oldQuarter]);assert.equal(tables[0].rows.length,4);
assert(tables[0].headers[2].startsWith('Compare with'));assert.equal(tables[0].total[1],'₹91000');assert.equal(tables[0].total[2],'₹92000');
assert(tables[0].total[3].includes('1000'));assert(tables[0].total[5].includes('Decrease'));
let sharedCards;
for(const selected of ['pivot','branch','overview']){
 view(selected);calls=[];html=ctx.financialCostAnalysis();
 assert(html.includes('financialCostReportType'));assert(!html.includes('financialCostPeriodSelect'));assert(!html.includes('financialCustom-currentFrom'));
 assert.deepEqual(plain(ctx.financialCostActivePeriod()),report);assert.deepEqual(plain(calls),[report,prior]);
 const cards=html.match(/<div class="cost-summary-grid"[^>]*>[\s\S]*?<\/article><\/div>/)?.[0];assert(cards);assert.equal((cards.match(/<article /g)||[]).length,4);if(sharedCards)assert.equal(cards,sharedCards);else sharedCards=cards;
 assert.equal(evaluate('financialCostComparisonSummary'),null,'Report views must not show comparison-only summary cards');
}
view('pivot');calls=[];ctx.exportFinancialCostPivot();assert.deepEqual(plain(download.period),report);assert.equal(download.rows.at(-1).at(-1),7000);assert.deepEqual(plain(calls),[report]);
// Invalid comparison dates cannot block reporting views or change their report range.
ctx.setFinancialCostPeriod('custom');ctx.setFinancialCustomComparison('currentFrom','2026-12-10');ctx.setFinancialCustomComparison('currentTo','2026-11-01');
html=ctx.financialCostAnalysis();assert(html.includes('<table>'));assert(!html.includes('co-custom-comparison-error'));
view('comparison');html=ctx.financialCostAnalysis();assert(html.includes('co-custom-comparison-error'));assert.equal((html.match(/type="date"/g)||[]).length,4);
ctx.setFinancialCustomComparison('currentFrom','2026-02-01');ctx.setFinancialCustomComparison('currentTo','2026-02-28');ctx.setFinancialCustomComparison('previousFrom','2024-02-01');ctx.setFinancialCustomComparison('previousTo','2024-02-29');
assert.deepEqual(plain(ctx.financialCostActivePeriod(true)),{start:'2024-02-01',end:'2024-02-29'});
ctx.setFinancialCostReportPeriodType('custom');co('financialCostReportFrom').value='2026-12-10';co('financialCostReportTo').value='2026-11-01';assert.equal(ctx.applyFinancialCostReportDates(),false);assert.equal(co('coFrom').value,report.start);assert.equal(reportRenders,0);
co('financialCostReportFrom').value='2026-11-17';co('financialCostReportTo').value='2026-11-17';assert(ctx.applyFinancialCostReportDates());assert.equal(reportRenders,1);
view('pivot');assert.deepEqual(plain(ctx.financialCostActivePeriod()),{start:'2026-11-17',end:'2026-11-17'});
view('comparison');assert.deepEqual(plain(ctx.financialCostActivePeriod()),{start:'2026-02-01',end:'2026-02-28'},'Applying report dates must not change selected comparison dates');
ctx.setFinancialCostPeriod('3');assert.deepEqual(plain(ctx.financialCostActivePeriod()),quarter,'Quarter selections persist separately from report dates');
ctx.setFinancialCostPeriod('1');ctx.setFinancialCostCalendarPeriod('currentYear','2024');ctx.setFinancialCostCalendarPeriod('currentSlot','2');assert.deepEqual(plain(ctx.financialCostActivePeriod()),{start:'2024-02-01',end:'2024-02-29'});
ctx.setFinancialCostPeriod('6');ctx.setFinancialCostCalendarPeriod('currentYear','2025');ctx.setFinancialCostCalendarPeriod('currentSlot','2');assert.deepEqual(plain(ctx.financialCostActivePeriod()),{start:'2025-07-01',end:'2025-12-31'});
ctx.setFinancialCostPeriod('12');ctx.setFinancialCostCalendarPeriod('currentYear','2024');assert.deepEqual(plain(ctx.financialCostActivePeriod()),{start:'2024-01-01',end:'2024-12-31'});assert(!ctx.financialCostComparisonControls().includes('id="financialCost-currentSlot"'));
assert.deepEqual(plain(ctx.financialPreviousRange({start:'2024-03-01',end:'2024-03-01'})),{start:'2024-02-29',end:'2024-02-29'});
assert.deepEqual(plain(ctx.financialPeriod(1)),{start:'2026-11-01',end:'2026-11-30'},'Inventory calendar periods retain their existing behavior');
const trend=ctx.financialCostTrend(report);assert(trend.includes('Daily operating expenses'),'Trend granularity follows report length, not comparison type');
const dates=fs.readFileSync('application-table-dates.js','utf8'),rangeCode=dates.slice(dates.indexOf('function tablePeriod('),dates.indexOf('  function update('));
const captions={financialModule:'Cost Analysis',financialExpenseView:'pivot',financialCostActivePeriod:previous=>previous?prior:report,range:(start,end)=>start+' to '+end,selectedRange:()=>''};vm.runInNewContext(rangeCode,captions);const table={closest:()=>true};
assert.equal(captions.tablePeriod(table,null),'Report dates: 2026-11-06 to 2026-11-12');captions.financialExpenseView='comparison';assert(captions.tablePeriod(table,null).includes('Compare with: 2026-10-30 to 2026-11-05'));
const formulas={window:{},document:{body:null}};vm.runInNewContext(fs.readFileSync('dashboard-value-formulas.js','utf8'),formulas);const hints=formulas.window.dashboardValueFormulas.calculate(['Current period','Compare with','Change Amount','Change (%)'],['₹200','₹100','₹100','100.0%']);assert(hints.has(2)&&hints.has(3));
console.log('PASS: report-date controls and global synchronization; independent comparison-only controls; explicit year/quarter, month, half-year and year periods; all four expense categories; exact Pivot/By Branch ranges and CSV; comparison totals/variance; invalid-date isolation; persistent selections; equal-length baselines; leap dates; matching captions/formulas; unchanged Inventory periods.');
