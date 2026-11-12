const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const ids=new Map(),nodes=[];
class Element{
 constructor(id='',classes=''){this.id=id;this.dataset={};this.value='';this.checked=false;this.hidden=false;this.html='';this.textContent='';this.listeners={};this.attrs={};this.classes=new Set(classes.split(' '));this.classList={remove:c=>this.classes.delete(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};nodes.push(this);if(id)ids.set(id,this);}
 set innerHTML(html){this.html=html;for(const [,tag,attrs]of html.matchAll(/<([\w-]+)\b([^>]*)>/g)){const id=attrs.match(/\bid="([^"]*)"/)?.[1]||'',classes=attrs.match(/class="([^"]*)"/)?.[1]||'',e=id&&ids.has(id)?ids.get(id):new Element(id,classes);for(const [,key,value]of attrs.matchAll(/\bdata-([\w-]+)="([^"]*)"/g))e.dataset[key.replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]=value;e.tag=tag;}}
 get innerHTML(){return this.html;}setAttribute(k,v){this.attrs[k]=v;}addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}focus(){this.focused=true;}showModal(){this.open=true;}close(){this.open=false;}getBoundingClientRect(){return{left:10,top:10,right:100,bottom:100};}click(){if(this.tag==='a')context.download=this;}
}
function select(selector){if(selector.startsWith('.'))return nodes.filter(n=>n.classes.has(selector.slice(1)));const m=selector.match(/^\[data-([\w-]+)\]$/);return m?nodes.filter(n=>Object.hasOwn(n.dataset,m[1].replace(/-([a-z])/g,(_,x)=>x.toUpperCase()))):[];}
const html=fs.readFileSync('clients.html','utf8');for(const [,id]of html.matchAll(/\bid="([^"]+)"/g))new Element(id);
let payload;
const context={window:{dashboardIcon:()=>'<svg></svg>'},document:{getElementById:id=>ids.get(id),querySelectorAll:select,createElement:tag=>{const e=new Element();e.tag=tag;return e;}},console,Intl,Date,Blob,URL:{createObjectURL:blob=>{payload=blob;return 'blob:doctors';},revokeObjectURL(){}},setTimeout(){}};
vm.createContext(context);for(const file of ['clients-data.js','dashboard-report-charts.js','clients.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const api=context.window.clientsPage,data=context.window.clientsData;
const fire=(id,type,target)=>{for(const fn of ids.get(id).listeners[type]||[])fn({target});};
const click=dataset=>fire('clientsReports','click',{closest:()=>({dataset})});
assert(Object.isFrozen(data)&&Object.isFrozen(data.top));assert.equal(data.top.length,10);assert.equal(data.pup.length,10);assert.equal(data.newClients.length,1);assert.equal(data.dormant.length,10);
assert.equal(data.source.sha256,crypto.createHash('sha256').update(fs.readFileSync('C:/Users/VEERAIAH/Downloads/clients.pdf')).digest('hex'));
assert.equal(data.groups.reduce((sum,r)=>sum+r[1],0),461);assert.equal(data.groups.reduce((sum,r)=>sum+r[2],0),1901);assert.equal(data.groups.reduce((sum,r)=>sum+r[3],0),1895);
assert.equal(ids.get('clientsBannerValue').textContent,'₹14,68,490');
assert(data.dormant.every(row=>row[3]===null));assert.equal(data.categories[987].length,10);assert.equal(data.categoryCounts[987],16);
let capturedTests=0;
for(const [id,cats]of Object.entries(data.categories))for(const cat of cats){const tests=data.tests[id]?.[cat[0]];if(!tests)continue;capturedTests+=tests.length;assert.equal(tests.reduce((n,r)=>n+r[1],0),cat[2],id+' '+cat[0]+' volume');assert.equal(tests.reduce((n,r)=>n+r[2],0),cat[3],id+' '+cat[0]+' revenue');}
assert(capturedTests>300);assert(data.tests[987].BIOCHEMISTRY.some(row=>row[2]===-10100));assert(data.tests[3788].RADIOLOGY.some(row=>row[1]===0&&row[2]===0));
click({clientOpen:'client',name:'987'});assert.equal(api.key(),'categories');assert.equal(api.rowsFor('categories').length,10);assert(ids.get('clients-table-top').innerHTML.includes('aria-current="page">MR YODA'));
click({clientOpen:'category',name:'BIOCHEMISTRY'});assert.equal(api.key(),'tests');assert.equal(api.rowsFor('tests').length,56);assert(ids.get('clients-table-top').innerHTML.includes('Test-level breakdown'));assert.equal((ids.get('clients-table-top').innerHTML.match(/<table\b/g)||[]).length,1);
click({clientPage:'top',page:'2'});assert.equal(api.states.tests.page,2);
fire('clientsReports','input',{dataset:{clientSearch:'top'},value:'CORTISOL'});assert.equal(api.rowsFor('tests').length,1);assert.equal(api.rowsFor('tests')[0][2],-10100);
fire('clientsReports','input',{dataset:{clientSearch:'top'},value:''});api.exportCsv('top');const fullCsv=payload;assert(context.download.download.includes('Clients-tests-2026-11-12'));
click({clientChart:'top'});assert(!ids.get('clients-chart-top').hidden);assert(ids.get('clients-chart-top').innerHTML.includes('Chart type'));
click({clientBack:'client'});assert.equal(api.key(),'categories');click({clientBack:'root'});assert.equal(api.key(),'top');
ids.get('clientType').value='PUP';fire('clientType','change',{});assert.equal(api.rowsFor('top').length,1);assert.equal(ids.get('clientsBannerValue').textContent,'₹2,10,869');assert.equal(api.rowsFor('pup').length,10);
ids.get('clientSearch').value='VIPUL';fire('clientSearch','input',{});assert.equal(ids.get('clientsBannerValue').textContent,'₹30,000');assert.equal(api.rowsFor('pup').length,0);
fire('clientsReset','click',{});assert.equal(api.rowsFor('top').length,10);assert.equal(api.key(),'top');
ids.get('clientCity').value='Mumbai';fire('clientCity','change',{});assert.equal(api.rowsFor('top').length,1);assert.equal(ids.get('clientsBannerValue').textContent,'₹34,350');fire('clientsReset','click',{});
ids.get('clientPro').value='GANGADHAR RAO';fire('clientPro','change',{});assert.equal(api.rowsFor('top').length,3);assert.equal(ids.get('clientsBannerValue').textContent,'₹2,76,899');fire('clientsReset','click',{});
click({clientOpen:'client',name:'1199'});click({clientOpen:'category',name:'BIOCHEMISTRY'});assert.equal(api.rowsFor('tests').length,0);assert(ids.get('clients-table-top').innerHTML.includes('not available'));fire('clientsReset','click',{});
ids.get('homeFrom').value='2026-11-11';api.refresh();assert.equal(api.rowsFor('top').length,0);assert.equal(ids.get('clientsBannerValue').textContent,'—');fire('clientsReportPeriod','click',{});
fire('clientsShowAll','change',{checked:true});assert(ids.get('clientsTabs').hidden);assert(!ids.get('clients-report-dormant').hidden);assert.equal(ids.get('clientsViewLabel').textContent,'Show tabs');
fire('clientsOpenFormulas','click',{});assert(ids.get('clientsFormulas').open);fire('clientsCloseFormulas','click',{});assert(!ids.get('clientsFormulas').open);
for(const [,file]of html.matchAll(/(?:src|href)="([^"#]+)"/g))if(!file.includes('http'))assert(fs.existsSync(file),file);
assert.equal([...html.matchAll(/href="([^"?]+\.css)"/g)].at(-1)[1],'dashboard-theme.css');
assert(html.includes('class="reference-menu active" type="button" onclick="location.href=\'clients.html\'" aria-current="page"'));
for(const f of ['home.html','revenue-sales.html','specialty.html','tests-patients.html','center-overview.html','qc-dashboard.html','tat-operations.html','doctors.html'])assert(fs.readFileSync(f,'utf8').includes("location.href='clients.html'"),f);
(async()=>{const csv=await fullCsv.text();assert.equal(csv.split('\r\n').length,57);assert(csv.includes('CORTISOL - MORNING SAMPLE'));assert(csv.includes('-10100'));console.log('PASS: exact PDF fingerprint, '+capturedTests+' captured tests reconcile to category totals, source scopes, filters/KPIs, separate drilldowns, pagination, chart controls, complete CSV, formulas and sidebar links.');})();

click({clientOpen:'client',name:'987'});click({clientOpen:'category',name:'BIOCHEMISTRY'});const breakdownMarkup=ids.get('clients-table-top').innerHTML;assert(breakdownMarkup.indexOf('doctors-breadcrumb')<breakdownMarkup.indexOf('doctors-breakdown-info'));assert(breakdownMarkup.indexOf('doctors-breakdown-info')<breakdownMarkup.indexOf('doctors-context-summary'));assert.equal(ids.get('clients-heading-top').textContent,'Top clients');
