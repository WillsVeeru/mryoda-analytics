const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const ids=new Map(),nodes=[];
class Element{
 constructor(id='',classes=''){this.id=id;this.dataset={};this.value='';this.checked=false;this.hidden=false;this.html='';this.textContent='';this.listeners={};this.attrs={};this.classes=new Set(classes.split(' '));this.classList={remove:c=>this.classes.delete(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};nodes.push(this);if(id)ids.set(id,this);}
 set innerHTML(html){this.html=html;for(const [,tag,attrs]of html.matchAll(/<([\w-]+)\b([^>]*)>/g)){const id=attrs.match(/\bid="([^"]*)"/)?.[1]||'',classes=attrs.match(/class="([^"]*)"/)?.[1]||'',e=id&&ids.has(id)?ids.get(id):new Element(id,classes);for(const [,key,value]of attrs.matchAll(/\bdata-([\w-]+)="([^"]*)"/g))e.dataset[key.replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]=value;e.tag=tag;}}
 get innerHTML(){return this.html;}setAttribute(k,v){this.attrs[k]=v;}addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}focus(){this.focused=true;}showModal(){this.open=true;}close(){this.open=false;}getBoundingClientRect(){return{left:10,top:10,right:100,bottom:100};}click(){if(this.tag==='a')context.download=this;}
}
function select(selector){if(selector.startsWith('.'))return nodes.filter(n=>n.classes.has(selector.slice(1)));const m=selector.match(/^\[data-([\w-]+)\]$/);return m?nodes.filter(n=>Object.hasOwn(n.dataset,m[1].replace(/-([a-z])/g,(_,x)=>x.toUpperCase()))):[];}
const html=fs.readFileSync('doctors.html','utf8');for(const [,id]of html.matchAll(/\bid="([^"]+)"/g))new Element(id);
let payload;
const context={window:{dashboardIcon:()=>'<svg></svg>'},document:{getElementById:id=>ids.get(id),querySelectorAll:select,createElement:tag=>{const e=new Element();e.tag=tag;return e;}},console,Intl,Date,Blob,URL:{createObjectURL:blob=>{payload=blob;return 'blob:doctors';},revokeObjectURL(){}},setTimeout(){}};
vm.createContext(context);for(const file of ['doctors-data.js','doctors.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const api=context.window.doctorsPage,data=context.window.doctorsData;
const fire=(id,type,target)=>{for(const fn of ids.get(id).listeners[type]||[])fn({target});};
const click=dataset=>fire('doctorsReports','click',{closest:()=>({dataset})});
assert(Object.isFrozen(data)&&Object.isFrozen(data.top));assert.equal(data.top.length,10);assert.equal(data.newDoctors.length,10);assert.equal(data.dormant.length,10);assert.equal(data.source.sha256,crypto.createHash('sha256').update(fs.readFileSync('C:/Users/VEERAIAH/Downloads/doctors.pdf')).digest('hex'));
assert.deepEqual(JSON.parse(JSON.stringify(data.reportCounts)),{top:1930,newDoctors:1931,dormant:8900});
const tests=data.tests['WELLNESS BEGUMPET'].RADIOLOGY;assert.equal(tests.length,55);assert.equal(tests.reduce((n,r)=>n+r[1],0),263);assert.equal(tests.reduce((n,r)=>n+r[2],0),1130270);assert.equal(tests.at(-1)[1],0);assert.equal(tests.at(-1)[2],0);
assert.equal(ids.get('doctorsBannerValue').textContent,'₹11,30,270');assert.equal(ids.get('doctors-report-top').hidden,false);assert.equal(ids.get('doctors-report-newDoctors').hidden,true);assert(!ids.get('doctors-table-top').innerHTML.includes('doctors-breadcrumb'));
for(const id of ['top','newDoctors','dormant']){const markup=ids.get('doctors-table-'+id).innerHTML;assert(markup.includes('<table'));assert(!markup.includes('NaN'));assert(!markup.includes('undefined'));}
click({doctorsOpen:'doctor',name:'WELLNESS BEGUMPET'});assert.equal(api.topKey(),'categories');assert.equal(api.rowsFor('categories').length,1);assert.equal(api.rowsFor('categories')[0][1],193);assert.equal(data.top[0][3],195);
click({doctorsOpen:'category',name:'RADIOLOGY'});assert.equal(api.topKey(),'tests');assert.equal(api.rowsFor('tests').length,55);assert.equal((ids.get('doctors-table-top').innerHTML.match(/<table\b/g)||[]).length,1);assert(ids.get('doctors-table-top').innerHTML.includes('<span aria-current="page">RADIOLOGY</span>'));
click({doctorsPage:'top',page:'2'});assert.equal(api.states.tests.page,2);assert(ids.get('doctors-table-top').innerHTML.includes('MRI CERVICAL SPINE'));
fire('doctorsReports','input',{dataset:{doctorsSearch:'top'},value:'CT BRAIN PLAIN'});assert.equal(api.rowsFor('tests').length,1);assert.equal(api.rowsFor('tests')[0][2],69600);assert.equal(api.states.tests.page,1);
fire('doctorsReports','input',{dataset:{doctorsSearch:'top'},value:''});api.states.tests.page=3;api.exportCsv('top');const fullCsv=payload;assert(context.download.download.includes('Doctors-tests-2026-11-06-to-2026-11-12'));
click({doctorsSort:'top',column:'1'});assert.equal(api.rowsFor('tests')[0][1],0);
click({doctorsChart:'top'});assert.equal(ids.get('doctors-chart-top').hidden,false);assert(ids.get('doctors-chart-top').innerHTML.includes('<title>'));
click({doctorsBack:'doctor'});assert.equal(api.topKey(),'categories');click({doctorsBack:'root'});assert.equal(api.topKey(),'top');
click({doctorsOpen:'doctor',name:'WELLNESS AVS HOSPITAL'});assert.equal(api.rowsFor('categories').length,0);assert(ids.get('doctors-table-top').innerHTML.includes('does not show the category breakdown'));click({doctorsBack:'root'});
fire('doctorsShowAll','change',{checked:true});assert.equal(ids.get('doctorsTabs').hidden,true);assert.equal(ids.get('doctorsViewLabel').textContent,'Show tabs');assert.equal(ids.get('doctors-report-dormant').hidden,false);fire('doctorsShowAll','change',{checked:false});assert.equal(ids.get('doctorsTabs').hidden,false);
ids.get('doctorSearch').value='DINESH';fire('doctorSearch','input',{});assert.equal(api.rowsFor('top').length,1);assert.equal(api.rowsFor('newDoctors').length,1);assert.equal(api.rowsFor('dormant').length,0);
ids.get('homeFrom').value='2026-11-10';api.refresh();assert.equal(api.rowsFor('top').length,0);assert.equal(ids.get('doctorsBannerValue').textContent,'—');assert(ids.get('doctors-table-top').innerHTML.includes('6–12 Nov'));
ids.get('homeFrom').value='2026-11-13';api.refresh();assert.equal(api.scope().valid,false);assert(ids.get('doctorsMessage').textContent.includes('valid'));
fire('doctorsReset','click',{});assert.equal(api.scope().full,true);assert.equal(api.rowsFor('top').length,10);assert.equal(api.topKey(),'top');
fire('doctorsOpenFormulas','click',{});assert.equal(ids.get('doctorsFormulas').open,true);fire('doctorsCloseFormulas','click',{});assert.equal(ids.get('doctorsFormulas').open,false);
const staticIds=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(staticIds).size,staticIds.length);
for(const [,file]of html.matchAll(/(?:src|href)="([^"#]+)"/g))if(!file.includes('http'))assert(fs.existsSync(file),file);
const styles=[...html.matchAll(/href="([^"?]+\.css)"/g)].map(m=>m[1]);assert.equal(styles.at(-1),'dashboard-theme.css');
for(const file of ['home.html','revenue-sales.html','specialty.html','tests-patients.html','center-overview.html','qc-dashboard.html','tat-operations.html'])assert(fs.readFileSync(file,'utf8').includes("location.href='doctors.html'"));
(async()=>{const csv=await fullCsv.text();assert.equal(csv.split('\r\n').length,56);assert(csv.includes('MRI WHOLE SPINE (SCREENING)'));assert(csv.endsWith('"0","0"'));console.log('PASS: exact PDF fingerprint and records, 55 tests reconciling to 263/1130270, preserved bill counts, blank fields, breadcrumbs, pagination, search, sorting, chart, full CSV export, dates, tabs/all switch, formula dialog, assets and seven sidebar links.');})();
