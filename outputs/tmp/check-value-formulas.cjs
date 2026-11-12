const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('dashboard-value-formulas.js','utf8');
const core={window:{},document:{body:null}};vm.runInNewContext(source,core);
const {calculate,numeric,matches}=core.window.dashboardValueFormulas;
const result=(labels,values,context={})=>calculate(labels,values,context);
assert.equal(numeric('₹1,23,456'),123456);assert.equal(numeric('−₹1,250'),-1250);assert.equal(numeric('3.2h'),null);assert.equal(numeric('Not Set'),null);
assert(matches('₹7,360',426869/58));assert(!matches('₹7,400',426869/58));
let r=result(['Gross','Discount','Net','Cost','Margin'],['₹10,000','₹500','₹9,500','₹3,000','₹6,500']);assert.equal(r.get(2).calculation,'₹10,000 − ₹500 = ₹9,500');assert(r.get(4));
r=result(['Gross','Discount','Refunds','Routine net','Specialty net','Final net'],['₹1,000','₹100','−₹50','₹650','₹200','₹850']);assert(r.has(3));assert(r.has(5));
assert(!result(['Gross','Discount','Net'],['₹1,000','₹100','₹850']).size);
assert(!result(['Gross','Discount','Final net'],['₹1,000','₹100','₹900']).size);
r=result(['Net','Cost','Referral','Net Margin'],['₹1,000','₹200','₹100','₹700'],{marginIncludesCost:true});assert.equal(r.get(3).formula,'Net − Cost − Referral');
r=result(['Net','Cost','Referral','Net Margin'],['₹1,000','₹200','₹100','₹900'],{marginIncludesCost:false});assert.equal(r.get(3).formula,'Net − Referral');
r=result(['Cash Received','Cash Brought In','Cash Paid','Net Cash Movement'],['₹1,000','₹250','₹1,100','₹150']);assert(r.get(3));
r=result(['Revenue','Tests','Avg / Test'],['₹1,000','4','₹250']);assert(r.get(2));
r=result(['Revenue','Tests','Avg / Test'],['₹0','0','₹0']);assert(r.get(2).note.includes('not performed'));
r=result(['Current period 2026-11-01','Previous period 2026-10-01','Change Amount','Change (%)'],['₹90','₹100','−₹10','−10.0%']);assert(r.has(2));assert(r.has(3));
r=result(['Current period','Previous period','Change Amount','Change (%)'],['₹0','₹0','₹0','0.0%']);assert(r.get(3).note.includes('division by zero'));
r=result(['Category','Workload Share','Tests'],['Biochemistry','25.0%','50'],{shareBasis:'tests',shareTotal:200});assert.equal(r.get(1).calculation,'50 ÷ 200 × 100 = 25.0%');
r=result(['Tests','Share'],['34224','85.3%'],{shareBasis:'tests',shareTotal:40145});assert(r.has(1));
r=result(['Tests','Within 24h','Actual total TAT'],['500','96.9%','3.2h']);assert.equal(r.size,0);
r=result(['Regular Operating Expenses','Regular Capital Expenses','Expansion Operating Expenses','Expansion Capital Expenses','Total Spend'],['₹100','₹200','₹300','₹400','₹1,000']);assert(r.has(4));
r=result(['Tests','Consumption (units)','Stock used value'],['10','20','₹300'],{inventoryDemo:true});assert(r.has(1));assert(r.has(2));
r=result(['Runs','Passed','Failed','Pass %','Failure %'],['100','95','5','95.0%','5.0%']);assert(r.has(3));assert(r.has(4));

// Exercise actual enhancement and delegated interactions, without a browser dependency.
class Element {
 constructor(text=''){this.textContent=text;this.dataset={};this.colSpan=1;this.attrs={};this.classes=new Set();this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x)};this.children=[];this.offsetWidth=350;this.offsetHeight=180;this.style={};this.isConnected=true;}
 setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k]??null;}removeAttribute(k){delete this.attrs[k];}hasAttribute(k){return Object.hasOwn(this.attrs,k);}
 append(n){this.children.push(n);n.parentElement=this;}replaceChildren(){this.children=[];}
 contains(n){return this===n||this.children.some(child=>child.contains(n));}
 querySelector(){return null;}closest(selector){if(selector==='td.dashboard-formula-value')return this.classes.has('dashboard-formula-value')?this:null;if(selector==='td')return this;return null;}
 getBoundingClientRect(){return {left:20,right:130,top:40,bottom:70};}
}
const labels=['Gross','Discount','Net'],head={cells:labels.map(x=>new Element(x))};
const row={cells:['₹1,000','₹100','₹900'].map(x=>new Element(x))};row.cells.forEach(cell=>cell.parentElement=row);
const table={tHead:{rows:[head],textContent:labels.join(' ')},tBodies:[{rows:[row]}],tFoot:null,closest:()=>null};
const events={},body=new Element();let notify;
const ui={window:{addEventListener(){}},document:{body,createElement:()=>new Element(),getElementById:()=>null,querySelectorAll:()=>[table],addEventListener:(event,fn)=>events[event]=fn},innerWidth:1000,innerHeight:800,MutationObserver:class{constructor(fn){notify=fn;}observe(){}},requestAnimationFrame:fn=>fn()};
vm.runInNewContext(source,ui);const cell=row.cells[2],tooltip=body.children[0];
assert(cell.classes.has('dashboard-formula-value'));assert.equal(cell.tabIndex,0);assert(!row.cells[0].classes.has('dashboard-formula-value'));
events.pointerover({target:cell});assert.equal(tooltip.hidden,false);assert.equal(cell.attrs['aria-describedby'],'dashboardValueFormula');assert(tooltip.children.some(n=>n.textContent==='₹1,000 − ₹100 = ₹900'));
events.keydown({key:'Escape',target:cell});assert.equal(tooltip.hidden,true);assert.equal(cell.getAttribute('aria-describedby'),null);
events.focusin({target:cell});assert.equal(tooltip.hidden,false);
let stopped=false;events.click({target:cell,stopPropagation(){stopped=true;}});assert(stopped);assert.equal(tooltip.hidden,false);
events.click({target:cell,stopPropagation(){}});assert.equal(tooltip.hidden,true);
events.keydown({key:'Enter',target:cell,preventDefault(){},stopPropagation(){}});assert.equal(tooltip.hidden,false);
row.cells[1].textContent='₹200';row.cells[2].textContent='₹800';notify([{target:body}]);events.focusin({target:cell});assert(tooltip.children.some(n=>n.textContent==='₹1,000 − ₹200 = ₹800'));
row.cells[2].textContent='Unavailable';notify([{target:body}]);assert(!cell.classes.has('dashboard-formula-value'));assert(!cell.dataset.formulaAddedTabindex);assert.equal(tooltip.hidden,true);
for(const file of ['home.html','revenue-sales.html','specialty.html','tests-patients.html','center-overview.html','qc-dashboard.html','tat-operations.html'])assert.equal((fs.readFileSync(file,'utf8').match(/src="dashboard-value-formulas.js"/g)||[]).length,1,file);
console.log('PASS: verified calculations, source rounding, missing inputs, zero baselines, both margin rules, seven page assets, hover/focus/tap/keyboard, filter rerenders and stale-value cleanup.');
