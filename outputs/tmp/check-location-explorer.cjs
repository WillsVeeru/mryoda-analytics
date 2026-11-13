const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const ids=new Map(),nodes=[];
class Element{
 constructor(id='',classes=''){this.id=id;this.dataset={};this.value='';this.checked=false;this.hidden=false;this.html='';this.textContent='';this.listeners={};this.attrs={};this.classes=new Set(classes.split(' '));this.classList={remove:c=>this.classes.delete(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};nodes.push(this);if(id)ids.set(id,this);}
 set innerHTML(html){this.html=html;for(const [,tag,attrs]of html.matchAll(/<([\w-]+)\b([^>]*)>/g)){const id=attrs.match(/\bid="([^"]*)"/)?.[1]||'',classes=attrs.match(/class="([^"]*)"/)?.[1]||'',e=id&&ids.has(id)?ids.get(id):new Element(id,classes);for(const [,key,value]of attrs.matchAll(/\bdata-([\w-]+)="([^"]*)"/g))e.dataset[key.replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]=value;e.tag=tag;}}
 get innerHTML(){return this.html;}setAttribute(k,v){this.attrs[k]=v;}addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}focus(){this.focused=true;}showModal(){this.open=true;}close(){this.open=false;}getBoundingClientRect(){return{left:10,top:10,right:100,bottom:100};}click(){if(this.tag==='a')context.download=this;}
}
function select(selector){if(selector.startsWith('.'))return nodes.filter(n=>n.classes.has(selector.slice(1)));const m=selector.match(/^\[data-([\w-]+)\]$/);return m?nodes.filter(n=>Object.hasOwn(n.dataset,m[1].replace(/-([a-z])/g,(_,x)=>x.toUpperCase()))):[];}
const html=fs.readFileSync('location-explorer.html','utf8');for(const [,id]of html.matchAll(/\bid="([^"]+)"/g))new Element(id);
let payload;
const context={window:{dashboardIcon:()=>'<svg></svg>'},document:{getElementById:id=>ids.get(id),querySelectorAll:select,createElement:tag=>{const e=new Element();e.tag=tag;return e;}},console,Intl,Date,Blob,URL:{createObjectURL:blob=>{payload=blob;return 'blob:doctors';},revokeObjectURL(){}},setTimeout(){}};
vm.createContext(context);for(const file of ['location-explorer-data.js','dashboard-report-charts.js','location-explorer.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const api=context.window.locationExplorerPage,data=context.window.locationExplorerData;
const fire=(id,type,target)=>{for(const fn of ids.get(id).listeners[type]||[])fn({target});};
const click=dataset=>fire('locationReport','click',{closest:()=>({dataset})});
assert(Object.isFrozen(data)&&Object.isFrozen(data.centres));assert.equal(data.centres.length,10);assert.equal(Object.keys(data.clients).length,4);
assert.equal(data.source.sha256,crypto.createHash('sha256').update(fs.readFileSync('C:/Users/VEERAIAH/Downloads/location explorer.pdf')).digest('hex'));
assert.equal(data.summary.centres,17);assert.equal(data.summary.tests,52958);assert.equal(data.summary.patients,17624);assert.equal(ids.get('locationRevenue').textContent,'₹1.34Cr');
assert.equal(api.level(),'centres');assert.equal(api.rowsFor().length,10);assert(html.includes('id="locationReportTitle">Centres</h2>'));
const initialKpis=ids.get('locationSummary').innerHTML;
assert(initialKpis.includes('<h2>Centres</h2>')&&initialKpis.includes('<h2>Tests</h2>')&&initialKpis.includes('<h2>Patients</h2>'));
let testCount=0;
for(const [key,rows]of Object.entries(data.tests)){const cut=key.lastIndexOf('::'),cat=data.categories[key.slice(0,cut)].find(r=>r[0]===key.slice(cut+2));assert.equal(rows.reduce((sum,r)=>sum+r[1],0),cat[2]);assert.equal(rows.reduce((sum,r)=>sum+r[2],0),cat[3]);testCount+=rows.length;}
assert.equal(testCount,101);
click({locationOpen:'YODA LIFELINE DIAGNOSTICS'});assert.equal(api.level(),'clients');assert.equal(api.rowsFor().length,10);assert.equal(data.clientCounts['YODA LIFELINE DIAGNOSTICS'],387);assert.equal(ids.get('locationRevenue').textContent,'₹44,22,922');
click({locationOpen:'865'});assert.equal(api.level(),'categories');assert.equal(api.rowsFor().length,1);assert.equal(data.clients['YODA LIFELINE DIAGNOSTICS'][0][5],90);assert.equal(api.rowsFor()[0][2],86);
click({locationOpen:'RADIOLOGY'});assert.equal(api.level(),'tests');assert.equal(api.rowsFor().length,25);assert.equal(ids.get('locationRevenue').textContent,'₹3,46,700');
let markup=ids.get('locationTable').innerHTML;assert.equal((markup.match(/<table\b/g)||[]).length,1);assert(markup.indexOf('doctors-breadcrumb')<markup.indexOf('doctors-breakdown-info'));assert(markup.includes('aria-current="page">RADIOLOGY'));
assert.equal(ids.get('locationSummary').innerHTML,initialKpis,'KPI cards stay fixed during all drilldown levels');
click({locationPage:'2'});assert.equal(api.states.tests.page,2);api.exportCsv();const fullCsv=payload;assert(context.download.download.includes('Location-Explorer-tests-865'));
fire('locationChartToggle','click',{});assert.equal(ids.get('locationChart').hidden,false);assert(ids.get('locationChart').innerHTML.includes('Chart type'));click({locationChartClose:'true'});assert(ids.get('locationChart').hidden);
fire('locationTableSearch','input',{value:'CT ABDOMEN PLAIN'});assert.equal(api.rowsFor().length,1);assert.equal(api.rowsFor()[0][1],0);fire('locationTableSearch','input',{value:''});
click({locationBack:'client'});assert.equal(api.level(),'categories');click({locationBack:'centre'});assert.equal(api.level(),'clients');click({locationBack:'root'});assert.equal(api.level(),'centres');
click({locationOpen:'YODA DIAGNOSTICS GUNTUR'});assert.equal(api.rowsFor().length,0);assert(ids.get('locationTable').innerHTML.includes('not available'));fire('locationReset','click',{});
ids.get('locationModel').value='FOCO';fire('locationModel','change',{});assert.equal(api.rowsFor().length,2);assert.equal(ids.get('locationRevenue').textContent,'₹28,33,409');fire('locationReset','click',{});
ids.get('locationCentre').value='MR YODA';fire('locationCentre','change',{});assert.equal(api.rowsFor().length,1);assert.equal(ids.get('locationRevenue').textContent,'₹26,42,504');fire('locationReset','click',{});
ids.get('locationCity').value='Hyderabad';fire('locationCity','change',{});assert.equal(api.rowsFor().length,4);assert.equal(ids.get('locationRevenue').textContent,'₹98,98,835');fire('locationReset','click',{});
ids.get('locationType').value='PUP';fire('locationType','change',{});assert.equal(api.rowsFor().length,1);assert.equal(ids.get('locationRevenue').textContent,'₹1,13,028');fire('locationReset','click',{});
ids.get('locationSearch').value='AVS';fire('locationSearch','input',{});assert.equal(api.rowsFor().length,2);assert.equal(ids.get('locationRevenue').textContent,'₹5,08,981');fire('locationReset','click',{});
click({locationOpen:'MR YODA'});click({locationOpen:'3552'});assert(api.rowsFor().some(row=>row[3]===-20000));click({locationOpen:'BIOCHEMISTRY'});assert.equal(api.rowsFor().length,0);assert(ids.get('locationTable').innerHTML.includes('not available'));fire('locationReset','click',{});
click({locationOpen:'YODA AGATSYA HOSPITAL'});click({locationOpen:'1199'});click({locationOpen:'BIOCHEMISTRY'});assert.equal(api.rowsFor().length,50);assert.equal(ids.get('locationRevenue').textContent,'₹4,06,770');click({locationSort:'1'});assert.equal(api.rowsFor()[0][1],1);fire('locationReset','click',{});
ids.get('homeFrom').value='2026-11-07';fire('homeFrom','change',{});assert.equal(api.rowsFor().length,0);assert.equal(ids.get('locationRevenue').textContent,'—');fire('locationReportPeriod','click',{});assert(api.scope().full);
ids.get('homeFrom').value='2026-11-13';api.refresh();assert.equal(api.scope().valid,false);fire('locationReset','click',{});
fire('locationOpenFormulas','click',{});assert(ids.get('locationFormulas').open);fire('locationCloseFormulas','click',{});assert(!ids.get('locationFormulas').open);
for(const [,file]of html.matchAll(/(?:src|href)="([^"#]+)"/g))if(!file.includes('http'))assert(fs.existsSync(file),file);
assert.equal([...html.matchAll(/href="([^"?]+\.css)"/g)].at(-1)[1],'dashboard-theme.css');
assert(html.includes('class="reference-menu active" type="button" onclick="location.href=\'location-explorer.html\'" aria-current="page"'));
for(const f of ['home.html','revenue-sales.html','specialty.html','tests-patients.html','center-overview.html','qc-dashboard.html','tat-operations.html','doctors.html','clients.html'])assert(fs.readFileSync(f,'utf8').includes("location.href='location-explorer.html'"),f);
(async()=>{const csv=await fullCsv.text();assert.equal(csv.split('\r\n').length,26);assert(csv.includes('CT ABDOMEN PLAIN'));console.log('PASS: exact PDF fingerprint, 101 tests reconcile to source categories, preserved level counts, four-level breadcrumbs, filters/KPIs, missing-detail states, pagination, CSV, charts, formulas and nine sidebar links.');})();
