const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('center-overview-financial.js','utf8');
function extract(name){const start=source.indexOf('function '+name+'('),end=source.indexOf('\nfunction ',start+1);assert(start>=0,name);return source.slice(start,end<0?source.length:end);}
class FixedDate extends Date{constructor(...args){super(...(args.length?args:['2026-11-17T06:00:00Z']));}static now(){return +new FixedDate();}}
const elements=new Map(),co=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',hidden:false});return elements.get(id);};
co('coFrom').value='2026-11-17';co('coTo').value='2026-11-17';
let html='',fieldRenders=0,globalRenders=0;
const ctx={Date:FixedDate,Intl,Number,Array,JSON,co,centerEscape:String,document:{querySelectorAll:()=>[]},
 renderFinancialModule(){fieldRenders++;render();},renderCenterOverview(){globalRenders++;render();}};
vm.createContext(ctx);
vm.runInContext("let financialCostReportSelection=null,financialExpenseView='overview',financialCostPeriod=3,financialCustomComparison=null,financialCostCalendarPeriods={3:{currentYear:2025,currentSlot:1,previousYear:2024,previousSlot:1}};",ctx);
for(const name of ['financialValidComparisonDate','financialPeriod','financialCostReportPeriod','financialPreviousRange','financialCostCalendarState','financialCostComparisonPeriod','financialCostActivePeriod','financialCostReportToday','financialCostReportState','financialCostReportDraftPeriod','financialCostReportRangeLabel','updateFinancialCostReportPreview','refreshFinancialCostReportControls','setFinancialCostReportPeriodType','setFinancialCostReportPeriodField','applyFinancialCostReportDates','financialCostReportControls'])vm.runInContext(extract(name),ctx);
const plain=value=>JSON.parse(JSON.stringify(value));
function render(){html=ctx.financialCostReportControls();for(const match of html.matchAll(/<input[^>]*id="([^"]+)"[^>]*value="([^"]*)"/g))co(match[1]).value=match[2];co('financialCostReportRange').textContent=html.match(/<output[^>]*>([^<]+)<\/output>/)?.[1];co('financialCostReportPending').hidden=/id="financialCostReportPending" hidden/.test(html);}
function field(name,value){if(name==='customFrom')co('financialCostReportFrom').value=value;if(name==='customTo')co('financialCostReportTo').value=value;ctx.setFinancialCostReportPeriodField(name,value);}
const current=()=>plain(ctx.financialCostReportPeriod()),draft=()=>plain(ctx.financialCostReportDraftPeriod());
const compareBefore=plain(ctx.financialCostComparisonPeriod());
render();assert.equal(ctx.financialCostReportToday(),'2026-11-17');assert.equal(ctx.financialCostReportState().type,'custom');
assert.deepEqual(draft(),{start:'2026-11-17',end:'2026-11-17'});assert.equal(co('financialCostReportPending').hidden,true);assert.equal(globalRenders,0);
assert.equal(co('financialCostReportFrom').value,'2026-11-17');assert.equal(co('financialCostReportTo').value,'2026-11-17');
assert.deepEqual(current(),{start:'2026-11-17',end:'2026-11-17'},'The default Custom dates range is Today');
assert(!html.includes('id="financialCostReportYear"'));assert(!html.includes('id="financialCostReportMonth"'));
ctx.setFinancialCostReportPeriodType('monthly');assert.deepEqual(draft(),{start:'2026-11-01',end:'2026-11-30'});assert.equal(co('financialCostReportPending').hidden,false);
assert(html.includes('id="financialCostReportYear"'));assert(html.includes('id="financialCostReportMonth"'));assert(!html.includes('id="financialCostReportFrom"'));
field('year',2024);field('month',2);assert.deepEqual(draft(),{start:'2024-02-01',end:'2024-02-29'});assert(co('financialCostReportRange').textContent.includes('29 Feb 2024'));assert.equal(globalRenders,0);
assert(ctx.applyFinancialCostReportDates());assert.deepEqual(current(),draft());assert.equal(globalRenders,1);assert.equal(co('financialCostReportPending').hidden,true);
ctx.setFinancialCostReportPeriodType('quarterly');field('year',2026);field('quarter',3);assert.deepEqual(draft(),{start:'2026-07-01',end:'2026-09-30'});
assert(html.includes('id="financialCostReportQuarter"'));assert(!html.includes('id="financialCostReportMonth"'));assert(html.includes('Q3 \u00b7 Jul\u2013Sep'));assert.equal(co('financialCostReportPending').hidden,false);
assert.equal(current().start,'2024-02-01');assert(ctx.applyFinancialCostReportDates());assert.deepEqual(current(),{start:'2026-07-01',end:'2026-09-30'});
for(const view of ['overview','pivot','branch']){vm.runInContext("financialExpenseView='"+view+"'",ctx);assert.deepEqual(plain(ctx.financialCostActivePeriod()),current());render();assert.equal(ctx.financialCostReportState().type,'quarterly');}
assert.deepEqual(plain(ctx.financialCostComparisonPeriod()),compareBefore,'Report selections do not alter independent comparison periods');
vm.runInContext("financialExpenseView='comparison'",ctx);assert.deepEqual(plain(ctx.financialCostActivePeriod()),compareBefore);vm.runInContext("financialExpenseView='overview'",ctx);
ctx.setFinancialCostReportPeriodType('half-yearly');field('year',2024);field('half',1);assert.deepEqual(draft(),{start:'2024-01-01',end:'2024-06-30'});assert(html.includes('id="financialCostReportHalf"'));assert(!html.includes('id="financialCostReportQuarter"'));field('half',2);assert.deepEqual(draft(),{start:'2024-07-01',end:'2024-12-31'});
ctx.setFinancialCostReportPeriodType('yearly');assert.deepEqual(draft(),{start:'2024-01-01',end:'2024-12-31'});assert(html.includes('id="financialCostReportYear"'));for(const id of ['Month','Quarter','Half','From','To'])assert(!html.includes('id="financialCostReport'+id+'"'));
ctx.setFinancialCostReportPeriodType('custom');assert.equal(co('financialCostReportFrom').value,'2024-01-01');assert.equal(co('financialCostReportTo').value,'2024-12-31');assert(!html.includes('id="financialCostReportYear"'));
const beforeCustom=current(),renderCount=fieldRenders,applyCount=globalRenders;field('customFrom','2024-02-29');field('customTo','2024-02-28');assert.equal(fieldRenders,renderCount,'Date edits update the preview without replacing the focused input');assert.equal(ctx.financialCostReportDraftPeriod(),null);assert(!ctx.applyFinancialCostReportDates());assert.equal(globalRenders,applyCount);assert.deepEqual(current(),beforeCustom);assert(co('financialCostReportError').textContent.includes('From must be on or before To'));
field('customFrom','2024-02-30');field('customTo','2024-03-01');assert(!ctx.applyFinancialCostReportDates());field('customFrom','2024-02-29');assert.equal(co('financialCostReportError').textContent,'');assert(ctx.applyFinancialCostReportDates());assert.deepEqual(current(),{start:'2024-02-29',end:'2024-03-01'});
for(const [start,end,type,expected] of [['2025-10-01','2025-12-31','quarterly',4],['2025-04-01','2025-04-30','monthly',4],['2025-01-01','2025-06-30','half-yearly',1],['2025-01-01','2025-12-31','yearly',null],['2026-11-10','2026-11-10','custom',null]]){
 co('coFrom').value=start;co('coTo').value=end;render();assert.equal(ctx.financialCostReportState().type,type);assert.deepEqual(draft(),current());assert.equal(co('financialCostReportPending').hidden,true);
 if(type==='quarterly')assert.equal(ctx.financialCostReportState().quarter,expected);if(type==='monthly')assert.equal(ctx.financialCostReportState().month,expected);if(type==='half-yearly')assert.equal(ctx.financialCostReportState().half,expected);
}
ctx.setFinancialCostReportPeriodType('monthly');field('year',1900);field('month',2);assert.equal(draft().end,'1900-02-28');field('year',2000);assert.equal(draft().end,'2000-02-29');field('year',10000);field('month',13);field('unknown',1);assert.equal(ctx.financialCostReportState().year,2000);assert.equal(ctx.financialCostReportState().month,2);
ctx.setFinancialCostReportPeriodType('unknown');assert.equal(ctx.financialCostReportState().type,'monthly');assert.deepEqual(plain(ctx.financialCostComparisonPeriod()),compareBefore);
let localRenders=0,focusCount=0;
const controls={set outerHTML(value){localRenders++;render();}};
co('financialCostReportType').closest=()=>controls;
co('financialCostReportYear').nextElementSibling={classList:{contains:value=>value==='financial-select-trigger'},focus(){focusCount++;}};
ctx.requestAnimationFrame=callback=>callback();
const beforeLocal={fieldRenders,globalRenders,range:current()};
field('year',2001);assert.equal(localRenders,1);assert.equal(focusCount,1);assert.equal(fieldRenders,beforeLocal.fieldRenders);assert.equal(globalRenders,beforeLocal.globalRenders);assert.deepEqual(current(),beforeLocal.range,'Draft selector changes replace only controls, leaving the report and global dates untouched');
vm.runInContext('financialCostReportSelection=null',ctx);render();
assert.equal(ctx.financialCostReportState().type,'custom');assert.deepEqual(draft(),{start:'2026-11-17',end:'2026-11-17'});assert.deepEqual(current(),beforeLocal.range,'Initializing Today must not silently replace an existing global filter');assert.equal(co('financialCostReportPending').hidden,false);
for(const view of ['overview','pivot','branch']){vm.runInContext("financialExpenseView='"+view+"'",ctx);render();assert.equal(co('financialCostReportFrom').value,'2026-11-17');assert.equal(co('financialCostReportTo').value,'2026-11-17');}
console.log('PASS: Custom dates defaults to Today; all five report types and conditional fields; leap and century dates; explicit Apply/global synchronization; shared report scope; independent comparison periods; external date synchronization; custom input focus preservation and validation; pending status.');
