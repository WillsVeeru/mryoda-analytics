const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const ids=new Map(),nodes=[];
class Element{
 constructor(id='',classes=''){this.id=id;this.dataset={};this.value='';this.checked=false;this.hidden=false;this.html='';this.textContent='';this.listeners={};this.attrs={};this.classes=new Set(classes.split(' '));this.classList={remove:c=>this.classes.delete(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};nodes.push(this);if(id)ids.set(id,this);}
 set innerHTML(html){this.html=html;for(const [,tag,attrs]of html.matchAll(/<([\w-]+)\b([^>]*)>/g)){const id=attrs.match(/\bid="([^"]*)"/)?.[1]||'',classes=attrs.match(/class="([^"]*)"/)?.[1]||'',e=id&&ids.has(id)?ids.get(id):new Element(id,classes);for(const [,key,value]of attrs.matchAll(/\bdata-([\w-]+)="([^"]*)"/g))e.dataset[key.replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]=value;e.tag=tag;}}
 get innerHTML(){return this.html;}setAttribute(k,v){this.attrs[k]=v;}addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}focus(){this.focused=true;}showModal(){this.open=true;}close(){this.open=false;}getBoundingClientRect(){return{left:10,top:10,right:100,bottom:100};}click(){if(this.tag==='a')context.download=this;}
}
function select(selector){if(selector.startsWith('.'))return nodes.filter(n=>n.classes.has(selector.slice(1)));const m=selector.match(/^\[data-([\w-]+)\]$/);return m?nodes.filter(n=>Object.hasOwn(n.dataset,m[1].replace(/-([a-z])/g,(_,x)=>x.toUpperCase()))):[];}
const html=fs.readFileSync('targets-alerts.html','utf8');for(const [,id]of html.matchAll(/\bid="([^"]+)"/g))new Element(id);
let payload;
const context={window:{dashboardIcon:()=>'<svg></svg>'},document:{getElementById:id=>ids.get(id),querySelectorAll:select,createElement:tag=>{const e=new Element();e.tag=tag;return e;}},console,Intl,Date,Blob,URL:{createObjectURL:blob=>{payload=blob;return 'blob:doctors';},revokeObjectURL(){}},setTimeout(){}};
const saved=new Map();Object.assign(context,{URLSearchParams,location:{search:'?from=2026-11-06&to=2026-11-12'},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},Event:class{constructor(type){this.type=type;}}});context.window.addEventListener=()=>{};context.window.dispatchEvent=()=>{};Element.prototype.checkValidity=function(){return this.value===''||Number(this.value)>=0;};Element.prototype.reportValidity=function(){};vm.createContext(context);for(const file of ['dashboard-targets.js','targets-alerts.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const api=context.window.targetsAlertsPage,data=context.window.dashboardTargets;
const fire=(id,type,target)=>{for(const fn of ids.get(id).listeners[type]||[])fn({target});};
const click=dataset=>fire('targetsTable','click',{closest:()=>({dataset})});
assert.equal(api.rows().length,10);assert(api.rows().every(r=>r.actual===null));
const pro='HYDERABAD-PRO01';data.captureActuals({from:'2026-11-06',to:'2026-11-12',centerIds:['hyderabad'],records:[{proId:pro,net:1000},{proId:'HYDERABAD-PRO02',net:500}],scope:'Financial Overview · test filters'});
ids.get('targetBranch').value='Hyderabad';fire('targetBranch','change',{});assert.equal(api.rows().length,2);assert.equal(ids.get('targetsRevenue').textContent,'₹1,500');assert(api.rows().every(r=>r.status==='Below target'));
ids.get('target-edit-'+pro).value='3000';const save=nodes.filter(n=>n.dataset.targetSave===pro).at(-1);for(const fn of [...save.listeners.click])fn({target:save});assert.equal(data.getPeriodTarget(pro,'2026-11-06','2026-11-12'),700);assert(api.rows().some(r=>r.id===pro&&r.status==='Above target'&&r.excess===300));assert(ids.get('targetsSaveStatus').textContent.includes('saved'));
click({targetSort:'4'});assert.equal(api.rows()[0].actual,500);click({targetSort:'4'});assert.equal(api.rows()[0].actual,1000);
fire('targetsExport','click',{});const csv=payload;assert(context.download.download.includes('PRO-targets-2026-11-06'));
assert(ids.get('targetsFinanceLink').href.includes('targetFrom=2026-11-06'));assert(ids.get('targetsFinanceLink').href.includes('#coWorkspaceCharts'));
ids.get('targetSearch').value='Akshay';fire('targetSearch','input',{});assert.equal(api.rows().length,1);ids.get('targetSearch').value='';fire('targetSearch','input',{});
ids.get('targetFrom').value='2026-11-07';fire('targetFrom','change',{});assert(api.rows().every(r=>r.actual===null));assert.equal(ids.get('targetsRevenue').textContent,'—');assert(ids.get('targetsNote').textContent.includes('refresh actuals'));
fire('targetsOpenFormulas','click',{});assert(ids.get('targetsFormulas').open);fire('targetsCloseFormulas','click',{});assert(!ids.get('targetsFormulas').open);
for(const [,file]of html.matchAll(/(?:src|href)="([^"#]+)"/g))if(!file.includes('http'))assert(fs.existsSync(file.split('#')[0]),file);
assert.equal([...html.matchAll(/href="([^"?]+\.css)"/g)].at(-1)[1],'dashboard-theme.css');
assert(html.includes('class="reference-menu active" type="button" onclick="location.href=\'targets-alerts.html\'" aria-current="page"'));
for(const f of ['home.html','revenue-sales.html','specialty.html','tests-patients.html','center-overview.html','qc-dashboard.html','tat-operations.html','doctors.html','clients.html','location-explorer.html'])assert(fs.readFileSync(f,'utf8').includes("location.href='targets-alerts.html'"));
(async()=>{const text=await csv.text();assert.equal(text.split('\r\n').length,3);assert(text.includes('Above target'));assert(text.includes('Below target'));console.log('PASS: target editor saves shared targets, scoped actuals, live status/excess updates, sorting, filtering, CSV, refresh link, missing-snapshot handling, formulas and ten sidebar links.');})();
