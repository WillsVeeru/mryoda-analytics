const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const ids=new Map(),nodes=[];
class Element{
 constructor(id='',classes=''){this.id=id;this.dataset={};this.value='';this.checked=false;this.hidden=false;this.html='';this.textContent='';this.listeners={};this.attrs={};this.classes=new Set(classes.split(' '));this.classList={remove:c=>this.classes.delete(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};nodes.push(this);if(id)ids.set(id,this);}
 set innerHTML(html){this.html=html;const tags=/<([\w-]+)\b([^>]*)>/g;for(const [,tag,attrs]of html.matchAll(tags)){const id=attrs.match(/\bid="([^"]*)"/)?.[1]||'',cl=attrs.match(/class="([^"]*)"/)?.[1]||'';const e=id&&ids.has(id)?ids.get(id):new Element(id,cl);for(const [,k,v]of attrs.matchAll(/\bdata-([\w-]+)="([^"]*)"/g))e.dataset[k.replace(/-([a-z])/g,(_,s)=>s.toUpperCase())]=v;e.tag=tag;e.attrsText=attrs;}if(this.id==='tatCentre'||this.id==='tatCategory')this.value='All';}
 get innerHTML(){return this.html;}
 setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(k,f){(this.listeners[k]??=[]).push(f);}
 querySelectorAll(selector){if(this.id==='tatTabs'&&selector==='button')return nodes.filter(n=>n.dataset.tab);return select(selector);}
 querySelector(selector){if(selector==='[data-chart]')return nodes.find(n=>n.dataset.chart===this.id.replace('tat-report-',''));return select(selector)[0];}
 focus(){this.focused=true;}
 click(){if(this.tag==='a')context.download=this;}
 showModal(){this.open=true;}close(){this.open=false;}
 getBoundingClientRect(){return {left:10,top:10,right:100,bottom:100};}
}
function select(selector){if(selector.startsWith('.'))return nodes.filter(n=>n.classes.has(selector.slice(1)));const m=selector.match(/^\[data-([\w-]+)\]$/);if(m){const key=m[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase());return nodes.filter(n=>Object.hasOwn(n.dataset,key));}return [];}
const html=fs.readFileSync('tat-operations.html','utf8');
for(const [,id]of html.matchAll(/\bid="([^"]+)"/g))new Element(id);
let payload;
const context={window:{dashboardIcon:()=>'<svg></svg>'},document:{getElementById:id=>ids.get(id),querySelectorAll:select,createElement:tag=>{const n=new Element();n.tag=tag;return n;}},console,Intl,Date,Blob,URL:{createObjectURL:blob=>{payload=blob;return 'blob:test';},revokeObjectURL(){}},setTimeout:()=>{}};
vm.createContext(context);
for(const file of ['tat-operations-data.js','dashboard-report-charts.js','tat-operations.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const api=context.window.tatOperations,data=context.window.tatOperationsData;
assert.equal(api.definitions.length,8);assert.equal(data.tests.length,25);assert(data.biochemistry.length>120);
assert.equal(data.rejections.reduce((n,row)=>n+row[1],0),234);
assert.equal(data.distribution.reduce((n,row)=>n+row[1],0),40145);
assert.equal(data.summary.total,5.5);assert.equal(ids.get('tatTotal').innerHTML,'5.5<small>hrs</small>');
assert.equal(api.rowsFor('categories').length,10);assert.equal(api.rowsFor('tests').length,25);
for(const def of api.definitions){assert(ids.get('tat-table-'+def.id).innerHTML.includes('<table'));assert(!ids.get('tat-table-'+def.id).innerHTML.includes('NaN'));assert(!ids.get('tat-table-'+def.id).innerHTML.includes('undefined'));}
assert.equal(ids.get('tat-group-overview').hidden,false);assert.equal(ids.get('tat-group-samples').hidden,true);
const fire=(id,event,target)=>{for(const fn of ids.get(id).listeners[event]||[])fn({target});};
fire('tatShowAll','change',{checked:true});assert.equal(ids.get('tatTabs').hidden,true);assert.equal(ids.get('tat-group-quality').hidden,false);assert.equal(ids.get('tatViewLabel').textContent,'Show tabs');
fire('tatShowAll','change',{checked:false});assert.equal(ids.get('tatTabs').hidden,false);assert.equal(ids.get('tat-group-quality').hidden,true);
function click(dataset){fire('tatReports','click',{closest:()=>({dataset})});}
click({category:'BIOCHEMISTRY'});assert(ids.get('tat-table-categories').innerHTML.includes('Biochemistry'));assert(ids.get('tat-table-categories').innerHTML.includes('SERUM PROLACTIN')===false);
assert.equal((ids.get('tat-table-categories').innerHTML.match(/<table\b/g)||[]).length,1);
assert(!ids.get('tat-table-categories').innerHTML.includes('tat-detail-cell'));
assert(ids.get('tat-table-categories').innerHTML.includes('<span aria-current="page">BIOCHEMISTRY</span>'));
click({page:'detail',target:'2'});assert(ids.get('tat-table-categories').innerHTML.includes('SERUM PROLACTIN'));
click({category:'MICROBIOLOGY'});assert(ids.get('tat-table-categories').innerHTML.includes('not available in the supplied report'));
click({categoryHome:'true'});assert(!ids.get('tat-table-categories').innerHTML.includes('id="tat-category-details"'));assert.equal(api.rowsFor('categories').length,10);
click({chart:'categories'});assert.equal(ids.get('tat-chart-categories').hidden,false);assert(ids.get('tat-chart-categories').innerHTML.includes('<title>'));
click({sort:'categories',column:'2'});assert.equal(api.rowsFor('categories')[0][0],'SEROLOGY');click({sort:'categories',column:'2'});assert.equal(api.rowsFor('categories')[0][0],'MICROBIOLOGY');
ids.get('tatCategory').value='HAEMATOLOGY';api.refresh();assert.equal(api.rowsFor('categories').length,1);assert.equal(api.rowsFor('tests').length,3);assert.equal(ids.get('tatTotal').innerHTML,'5.5<small>hrs</small>');
ids.get('tatCategory').value='All';ids.get('tatBelow90').checked=true;api.refresh();assert.equal(api.rowsFor('tests').length,1);assert.equal(api.rowsFor('tests')[0][0],'BLOOD GROUP ABO & RH Typing');ids.get('tatBelow90').checked=false;
ids.get('tatCentre').value='MR YODA';api.refresh();assert.equal(api.rowsFor('pending').length,1);assert.equal(api.rowsFor('pending')[0][1],1290);
ids.get('homeFrom').value='2026-11-10';api.refresh();assert.equal(api.rowsFor('processing').length,3);assert.equal(api.rowsFor('rejections').reduce((n,r)=>n+r[1],0),52);assert.equal(api.rowsFor('flow').length,0);assert(ids.get('tatTotal').innerHTML.includes('Unavailable'));assert(ids.get('tat-table-distribution').innerHTML.includes('6–12 Nov'));
ids.get('homeFrom').value='2026-11-13';api.refresh();assert.equal(api.rowsFor('processing').length,0);assert(ids.get('tatPeriodMessage').textContent.includes('valid'));
fire('tatReset','click',{});assert.equal(api.rowsFor('processing').length,7);assert.equal(api.rowsFor('pending').length,10);
api.states.tests.size=5;api.states.tests.page=2;api.exportCsv('tests');assert.equal(context.download.download,'TAT-Operations-tests-2026-11-06-to-2026-11-12.csv');
fire('tatOpenFormulas','click',{});assert.equal(ids.get('tatFormulas').open,true);fire('tatCloseFormulas','click',{});assert.equal(ids.get('tatFormulas').open,false);
(async()=>{const csv=await payload.text();assert.equal(csv.split('\r\n').length,26);assert(csv.includes('THYROID PROFILE'));console.log('PASS: 8 report tables, source totals, tab/all modes, category drilldown and pagination, sorting, charts, scoped filters, partial/invalid dates, reset, full filtered CSV export and formula dialog.');})();
const allIds=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(allIds).size,allIds.length);
for(const [,file]of html.matchAll(/(?:href|src)="([^"#]+)"/g))if(!file.includes('http'))assert(fs.existsSync(file),file);
for(const file of ['home.html','revenue-sales.html','specialty.html','tests-patients.html','center-overview.html','qc-dashboard.html'])assert(fs.readFileSync(file,'utf8').includes("location.href='tat-operations.html'"));
console.log('PASS: unique static IDs, all local assets, and navigation from six existing pages.');
