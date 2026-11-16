const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const ids=new Map(),nodes=[];
class Element{
 constructor(id='',classes=''){this.id=id;this.dataset={};this.value='';this.checked=false;this.hidden=false;this.html='';this.textContent='';this.listeners={};this.attrs={};this.classes=new Set(classes.split(' '));this.classList={remove:c=>this.classes.delete(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};nodes.push(this);if(id)ids.set(id,this);}
 set innerHTML(html){this.html=html;for(const [,tag,attrs]of html.matchAll(/<([\w-]+)\b([^>]*)>/g)){const id=attrs.match(/\bid="([^"]*)"/)?.[1]||'',classes=attrs.match(/class="([^"]*)"/)?.[1]||'',e=id&&ids.has(id)?ids.get(id):new Element(id,classes);for(const [,key,value]of attrs.matchAll(/\bdata-([\w-]+)="([^"]*)"/g))e.dataset[key.replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]=value;e.tag=tag;}}
 get innerHTML(){return this.html;}setAttribute(k,v){this.attrs[k]=v;}addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}focus(){this.focused=true;}showModal(){this.open=true;}close(){this.open=false;}getBoundingClientRect(){return{left:10,top:10,right:100,bottom:100};}click(){if(this.tag==='a')context.download=this;}
}
function select(selector){if(selector.startsWith('.'))return nodes.filter(n=>n.classes.has(selector.slice(1)));const m=selector.match(/^\[data-([\w-]+)\]$/);return m?nodes.filter(n=>Object.hasOwn(n.dataset,m[1].replace(/-([a-z])/g,(_,x)=>x.toUpperCase()))):[];}
const html=fs.readFileSync('yoda-b2c.html','utf8');for(const [,id]of html.matchAll(/\bid="([^"]+)"/g))new Element(id);
let payload;
const context={window:{dashboardIcon:()=>'<svg></svg>'},document:{getElementById:id=>ids.get(id),querySelectorAll:select,createElement:tag=>{const e=new Element();e.tag=tag;return e;}},console,Intl,Date,Blob,URL:{createObjectURL:blob=>{payload=blob;return 'blob:doctors';},revokeObjectURL(){}},setTimeout(){}};
vm.createContext(context);for(const file of ['yoda-b2c-data.js','dashboard-report-charts.js','yoda-b2c.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const api=context.window.yodaB2CPage,data=context.window.yodaB2CData;
const fire=(id,type,target)=>{for(const fn of ids.get(id).listeners[type]||[])fn({target});};
const click=dataset=>fire('b2cReports','click',{closest:()=>({dataset})});
assert(Object.isFrozen(data)&&Object.isFrozen(data.booking[0]));
assert.equal(data.source.sha256,crypto.createHash('sha256').update(fs.readFileSync('C:/Users/VEERAIAH/Downloads/yodab2c.pdf')).digest('hex'));
assert.deepEqual(Array.from(api.definitions,def=>data[def.id].length),[7,4,9,0,7,10,2,6,10]);
assert.equal(api.definitions.length,9);assert.equal(api.groups.length,5);
for(const id of ['centre','clientType','client','moreCity','moreZone','moreCategory','moreDoctor','moreRep'])assert(new RegExp('<select[^>]*id="'+id+'"[^>]*disabled').test(html),'Unavailable source filter: '+id);
ids.get('homeMore').hidden=true;fire('moreHome','click',{});assert.equal(ids.get('homeMore').hidden,false);assert.equal(ids.get('moreHome').attrs['aria-expanded'],'true');fire('moreHome','click',{});assert.equal(ids.get('homeMore').hidden,true);
const NativeDate=Date;context.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:['2026-11-16T06:00:00Z']));}};
api.setRange('last30');assert.equal(ids.get('homeFrom').value,'2026-10-18');assert.equal(ids.get('homeTo').value,'2026-11-16');assert(api.scope().full);
api.setRange('today');assert.equal(ids.get('homeFrom').value,'2026-11-16');assert.equal(ids.get('homeTo').value,'2026-11-16');
api.setRange('yesterday');assert.equal(ids.get('homeFrom').value,'2026-11-15');assert.equal(ids.get('homeTo').value,'2026-11-15');
api.setRange('week');assert.equal(ids.get('homeFrom').value,'2026-11-10');
api.setRange('month');assert.equal(ids.get('homeFrom').value,'2026-11-01');
api.setRange('quarter');assert.equal(ids.get('homeFrom').value,'2026-10-01');
api.setRange('year');assert.equal(ids.get('homeFrom').value,'2026-01-01');
api.setRange('report');assert(api.scope().full);context.Date=NativeDate;
for(const id of ['booking','referral','leads']){assert.equal(data[id].reduce((n,r)=>n+r[1],0),3846);assert.equal(data[id].reduce((n,r)=>n+r[4],0),11965424);}
assert.equal(data.collection.reduce((n,r)=>n+r[1],0),722);
assert.equal(data.collection.reduce((n,r)=>n+r[2],0),2906465);
for(const row of data.collection){const booking=data.booking.find(r=>r[0]===row[0]);assert.equal(row[1]+row[3],booking[1]);assert.equal(row[2]+row[4],booking[4]);}
for(const row of data.conversion){assert.equal(row[1],row[2]+row[3]+row[4]);assert.equal(Math.round(row[2]/row[1]*1000)/10,row[5]);}
assert.equal(data.doctors.reduce((n,r)=>n+r[4],0),10931);
assert.equal(data.pros.reduce((n,r)=>n+r[4],0),4644158);assert(data.pros.reduce((n,r)=>n+r[4],0)<4983908);
assert.equal(ids.get('b2cRevenue').textContent,'₹1.2Cr');assert.equal(ids.get('b2cBills').textContent,'3,846 bills');
assert.equal((ids.get('b2cSummary').innerHTML.match(/<section/g)||[]).length,5);
const fixedKpis=ids.get('b2cSummary').innerHTML;
fire('b2cTabs','click',{closest:()=>({dataset:{tab:'referrers'}})});
assert.equal(ids.get('b2c-group-referrers').hidden,false);assert.equal(ids.get('b2c-group-overview').hidden,true);
assert.equal(ids.get('b2cSummary').innerHTML,fixedKpis);
fire('b2cShowAll','click',{});assert.equal(ids.get('b2cTabs').hidden,true);assert.equal(ids.get('b2cViewLabel').textContent,'Show tabs');
for(const [id]of api.groups)assert.equal(ids.get('b2c-group-'+id).hidden,false);
fire('b2cShowAll','click',{});assert.equal(ids.get('b2cViewLabel').textContent,'Show all tables');assert.equal(ids.get('b2cTabs').hidden,false);assert.equal(ids.get('b2c-group-referrers').hidden,false);
let prevented=false;for(const fn of ids.get('b2cTabs').listeners.keydown)fn({key:'End',preventDefault(){prevented=true;}});assert(prevented);assert(ids.get('b2c-tab-conversion').focused);
fire('b2cReports','change',{dataset:{size:'pros'},value:'5'});assert.equal(api.states.pros.size,5);
click({page:'pros',target:'2'});assert.equal(api.states.pros.page,2);
click({sort:'pros',column:'4'});assert.equal(api.states.pros.page,1);assert.equal(api.rowsFor('pros')[0][4],92999);
click({sort:'pros',column:'4'});assert.equal(api.rowsFor('pros')[0][4],1207513);
api.exportCsv('pros');const proExport=payload;assert(context.download.download.includes('Mr-Yoda-B2C-pros-2026-10-18-to-2026-11-16'));
click({chart:'pros'});assert.equal(ids.get('b2c-chart-pros').hidden,false);assert(ids.get('b2c-chart-pros').innerHTML.includes('Chart type'));
click({chart:'pros'});assert.equal(ids.get('b2c-chart-pros').hidden,true);assert(ids.get('b2c-chart-button-pros').focused);
fire('b2cReports','input',{dataset:{search:'booking'},value:'Mobile app'});assert.equal(api.rowsFor('booking').length,1);assert.equal(api.rowsFor('booking')[0][4],252101);assert.equal(ids.get('b2cSummary').innerHTML,fixedKpis);
assert(ids.get('b2c-table-campaigns').innerHTML.includes('No ad campaign data'));assert(ids.get('b2c-export-campaigns').disabled);
ids.get('homeFrom').value='2026-10-20';ids.get('homeTo').value='2026-10-23';api.refresh();assert.equal(api.rowsFor('daily').length,4);assert.equal(api.rowsFor('booking').length,0);assert.equal(ids.get('b2cRevenue').textContent,'—');assert(ids.get('b2c-table-booking').innerHTML.includes('Select Report period'));
ids.get('homeFrom').value='2026-10-31';ids.get('homeTo').value='2026-10-20';api.refresh();assert.equal(api.scope().valid,false);assert.equal(api.rowsFor('daily').length,0);
fire('b2cReset','click',{});assert.equal(api.rowsFor('booking').length,7);assert.equal(api.states.booking.search,'');assert.equal(ids.get('b2cRevenue').textContent,'₹1.2Cr');
fire('b2cOpenFormulas','click',{});assert(ids.get('b2cFormulas').open);fire('b2cCloseFormulas','click',{});assert(!ids.get('b2cFormulas').open);
vm.runInContext(fs.readFileSync('dashboard-value-formulas.js','utf8'),context);const formulas=context.window.dashboardValueFormulas;
assert(formulas.calculate(['Orders','Billed','Billed %'],['100','83','83.0%']).has(2));
assert(!formulas.calculate(['Orders','Billed','Billed %'],['0','0','83.0%']).has(2));
assert(formulas.calculate(['Bills','Revenue','Avg bill'],['3,548','₹1,15,77,691','₹3,263']).has(2));
assert(!formulas.calculate(['Bills','Revenue','Avg bill'],['3,548','₹1,15,77,691','₹7,000']).has(2));
assert(formulas.calculate(['Revenue','Share'],['₹49,83,908','41.7%'],api.formulaContext({})).has(1));
for(const [,file]of html.matchAll(/(?:src|href)="([^"#]+)"/g))if(!file.includes('http'))assert(fs.existsSync(file),file);
const css=[...html.matchAll(/href="([^"?]+\.css)"/g)].map(m=>m[1]);assert.equal(css.at(-1),'dashboard-theme.css');assert(css.indexOf('dashboard-financial-foundation.css')<css.indexOf('yoda-b2c.css'));
assert(html.includes('revenue-report-layout.css'));assert(html.includes('dashboard-report-chart-tooltips.js'));
assert(html.indexOf('src="yoda-b2c.js"')<html.indexOf('src="dashboard-financial-foundation.js"'));assert(html.indexOf('src="yoda-b2c.js"')<html.indexOf('src="dashboard-value-formulas.js"'));
assert(html.includes('class="reference-menu active" type="button" onclick="location.href=\'yoda-b2c.html\'" aria-current="page"'));
for(const f of ['home.html','revenue-sales.html','specialty.html','tests-patients.html','center-overview.html','qc-dashboard.html','tat-operations.html','doctors.html','clients.html','location-explorer.html','targets-alerts.html'])assert(fs.readFileSync(f,'utf8').includes("location.href='yoda-b2c.html'"),f);
const pageIds=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(pageIds).size,pageIds.length);
(async()=>{const csv=await proExport.text();assert.equal(csv.split('\r\n').length,11);assert(csv.includes('NAVEENNATH')&&csv.includes('GUMMADI RAKESH-KMM'));console.log('PASS: exact PDF fingerprint, all nine visible table datasets, reconciled bills/revenue and collection, preserved partial PRO/daily rows, five category tabs, show-all switch, stable KPIs, dates, search, sorting before pagination, complete filtered CSV, shared charts, verified formulas, theme assets and 11 sidebar links.');})();
