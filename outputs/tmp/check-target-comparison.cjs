const fs=require('fs');
const original=fs.readFileSync('tmp/check-target-history.cjs','utf8');
const setup=original.slice(0,original.indexOf('assert.equal(reference.length,18);')).replace("'dashboard-report-charts.js','targets-alerts.js'","'dashboard-report-charts.js','targets-alerts-sample.js','targets-alerts.js'");
const verify=String.raw`
let markup=ids.get('targetsTable').innerHTML;
assert(markup.includes('Previous Month · Oct 2026'));assert(markup.includes('Current Month · Nov 2026'));
assert(markup.indexOf('Current Month · Nov 2026')<markup.indexOf('Previous Month · Oct 2026'));
assert.equal((markup.match(/rowspan="2"/g)||[]).length,3);
assert.equal((markup.match(/colspan="4"/g)||[]).length,2);
assert.equal((markup.match(/data-formula-column=/g)||[]).length,11);
for(const row of markup.match(/<tbody>([\s\S]*?)<\/tbody>/)[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g))assert.equal((row[1].match(/<td>/g)||[]).length,11);
const labels=['Person','Scope','Current target','Current net revenue','Current difference','Current status','Previous target','Previous net revenue','Previous difference','Previous status','Action'];
for(const [index,label]of labels.entries())assert(markup.includes('data-formula-column="'+index+'" data-dashboard-label="'+label+'"'));
// Run the actual shared enhancer against the grouped comparison table markup.
const classes={add(){},contains:value=>value==='doctors-page'};
const themed={tHead:{rows:[]},tFoot:null,rows:[],classList:classes,parentElement:{matches:()=>true,classList:classes},matches:()=>false,closest:()=>null};
const parseRows=(html,parent)=>[...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(match=>{
 const row={parentElement:parent,closest:()=>themed,cells:[]};
 row.cells=[...match[1].matchAll(/<(th|td)\b([^>]*)>([\s\S]*?)<\/\1>/g)].map(([,tag,attrs,content])=>{
  const cell={tagName:tag.toUpperCase(),colSpan:Number(attrs.match(/colspan="(\d+)"/)?.[1]||1),rowSpan:Number(attrs.match(/rowspan="(\d+)"/)?.[1]||1),textContent:content.replace(/<[^>]*>/g,' '),dataset:{}};
  for(const [,key,value]of attrs.matchAll(/data-([\w-]+)="([^"]*)"/g))cell.dataset[key.replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase())]=value;
  return cell;
 });themed.rows.push(row);return row;
});
themed.tHead.rows=parseRows(markup.match(/<thead>([\s\S]*?)<\/thead>/)[1],themed.tHead);
const body=parseRows(markup.match(/<tbody>([\s\S]*?)<\/tbody>/)[1],{});
vm.runInNewContext(fs.readFileSync('dashboard-financial-foundation.js','utf8'),{document:{body:{classList:classes},getElementById:()=>null,querySelectorAll:selector=>selector==='main table,dialog table'?[themed]:[]},MutationObserver:class{observe(){}},requestAnimationFrame:callback=>callback()});
const tones=['neutral','neutral','benchmark','result','inflow','benchmark','benchmark','result','inflow','benchmark','neutral'];
for(const row of body)assert.deepEqual(row.cells.map(cell=>cell.dataset.dashboardColumnTone),tones);
for(const row of themed.tHead.rows)for(const cell of row.cells)if(cell.dataset.formulaColumn!==undefined)assert.equal(cell.dataset.dashboardHeaderTone,tones[Number(cell.dataset.formulaColumn)]);
assert.deepEqual(body[0].cells.map(cell=>cell.dataset.dashboardAlign),['left','left','right','right','right','left','right','right','right','left','left']);
const sharedTheme=fs.readFileSync('dashboard-theme.css','utf8');
assert(sharedTheme.includes('.targets-difference.negative{color:#9a4248!important}'));
assert(sharedTheme.includes('.financial-target-status.warning{color:#8a5a00!important;background:#fff3df!important}'));
const fields=['name','scope','target','actual','difference','status','previousTarget','previousActual','previousDifference','previousStatus'];
for(let index=1;index<fields.length;index++){
 click({targetSort:String(index)});
 const values=api.rows().map(row=>row[fields[index]]).filter(value=>value!==null);
 for(let i=1;i<values.length;i++)assert(typeof values[i]==='number'?values[i]>=values[i-1]:String(values[i]).localeCompare(String(values[i-1]),undefined,{numeric:true})>=0,fields[index]+' ascending');
 click({targetSort:String(index)});
 const descending=api.rows().map(row=>row[fields[index]]).filter(value=>value!==null);
 for(let i=1;i<descending.length;i++)assert(typeof descending[i]==='number'?descending[i]<=descending[i-1]:String(descending[i]).localeCompare(String(descending[i-1]),undefined,{numeric:true})<=0,fields[index]+' descending');
}
const pro='HYDERABAD-PRO01',currentActual=get(pro).actual;
data.captureActuals({from:'2026-10-01',to:'2026-10-31',centerIds:['hyderabad'],records:[{proId:pro,net:456789}],scope:'October actuals'});api.render();
assert.equal(get(pro).previousActual,456789);assert(!get(pro).samplePreviousActual);assert(get(pro).sampleActual);assert.equal(get(pro).actual,currentActual);
data.setScopedTarget('pro',pro,'2026-10',0);api.render();assert.equal(get(pro).previousTarget,0);assert.equal(get(pro).previousDifference,456789);assert.equal(get(pro).previousStatus,'Excess');
assert(ids.get('targetsActualScope').textContent.includes('Previous actuals: 2026-10-01 – 2026-10-31'));assert(!ids.get('targetsActualScope').textContent.includes('October actuals'));
api.exportCsv();const blob=payload;
choosePeriod('2026','10');allScopes();assert.equal(get(pro).actual,456789);assert.equal(get(pro).status,'Excess');
choosePeriod('2024','03');allScopes();assert.equal(api.period().previousDays,29);assert.equal(api.period().previousTo,'2024-02-29');
choosePeriod('2027','01');allScopes();assert.equal(api.period().previousMonth,'2026-12');assert(api.rows().filter(row=>row.source==='demo').every(row=>row.previousActual===0&&row.previousDifference===null&&row.previousStatus==='Not started'));
choosePeriod('2026','11');ids.get('targetSearch').value='DOES NOT EXIST';fire('targetSearch','input',{});assert(ids.get('targetsTable').innerHTML.includes('colspan="11"'));
const css=fs.readFileSync('targets-alerts.css','utf8');assert(css.includes('.targets-person-column{width:320px}'));assert(css.includes('table-layout:fixed'));assert(css.includes('position:sticky;left:0'));assert(css.includes('data-target-period="previous"'));assert(css.includes('data-target-period="current"'));
return (async()=>{const csv=await blob.text(),lines=csv.split('\r\n'),parse=line=>[...line.matchAll(/"((?:[^"]|"")*)"/g)].map(match=>match[1].replace(/""/g,'"')),header=parse(lines[0]),row=lines.map(parse).find(row=>row[0]===pro);assert.equal(lines.length,49);assert.equal(row.length,header.length);assert.equal(row[header.indexOf('Previous net revenue')],'456789');assert.equal(row[header.indexOf('Previous difference')],'456789');assert.equal(row[header.indexOf('Previous status')],'Excess');assert.equal(row[header.indexOf('Previous actual revenue source')],'Financial Overview');assert.equal(row[header.indexOf('Previous actuals to')],'2026-10-31');console.log('PASS: two complete month groups, 11 correctly mapped columns, wider sticky names, all 10 sortable columns in both directions, previous-month actuals and zero targets, source precedence, correct date scopes, leap and future periods, empty state, matching CSV and source labels.');})();
`;
new Function('require',setup+verify)(require).catch(error=>{console.error(error);process.exitCode=1;});
