const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const ids=new Map(),nodes=[];
class Element{
 constructor(id='',classes=''){this.id=id;this.dataset={};this.value='';this.checked=false;this.hidden=false;this.html='';this.textContent='';this.listeners={};this.attrs={};this.classes=new Set(classes.split(' '));this.classList={remove:c=>this.classes.delete(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};nodes.push(this);if(id)ids.set(id,this);}
 set innerHTML(html){this.html=html;for(const [,tag,attrs]of html.matchAll(/<([\w-]+)\b([^>]*)>/g)){const id=attrs.match(/\bid="([^"]*)"/)?.[1]||'',classes=attrs.match(/class="([^"]*)"/)?.[1]||'',e=id&&ids.has(id)?ids.get(id):new Element(id,classes);for(const [,key,value]of attrs.matchAll(/\bdata-([\w-]+)="([^"]*)"/g))e.dataset[key.replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]=value;e.tag=tag;}}
 get innerHTML(){return this.html;}setAttribute(k,v){this.attrs[k]=v;}addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}focus(){this.focused=true;}showModal(){this.open=true;}close(){this.open=false;}getBoundingClientRect(){return{left:10,top:10,right:100,bottom:100};}click(){if(this.tag==='a')context.download=this;}
}
function select(selector){if(selector.startsWith('.'))return nodes.filter(n=>n.classes.has(selector.slice(1)));const m=selector.match(/^\[data-([\w-]+)\]$/);return m?nodes.filter(n=>Object.hasOwn(n.dataset,m[1].replace(/-([a-z])/g,(_,x)=>x.toUpperCase()))):[];}
const html=fs.readFileSync('sales-team.html','utf8');for(const [,id]of html.matchAll(/\bid="([^"]+)"/g))new Element(id);
let payload;
const context={window:{dashboardIcon:()=>'<svg></svg>'},document:{getElementById:id=>ids.get(id),querySelectorAll:select,createElement:tag=>{const e=new Element();e.tag=tag;return e;}},console,Intl,Date,Blob,URL:{createObjectURL:blob=>{payload=blob;return 'blob:doctors';},revokeObjectURL(){}},setTimeout(){}};
vm.createContext(context);for(const file of ['sales-team-data.js','dashboard-report-charts.js','sales-team.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const api=context.window.salesTeamPage,data=context.window.salesTeamData;
const fire=(id,type,target)=>{for(const fn of ids.get(id).listeners[type]||[])fn({target});};
const click=dataset=>fire('salesReports','click',{closest:()=>({dataset})});
const count=key=>api.rowsFor(key).length;
assert(Object.isFrozen(data)&&Object.isFrozen(data.categories));
assert.equal(data.source.sha256,crypto.createHash('sha256').update(fs.readFileSync('C:/Users/VEERAIAH/Downloads/sales.pdf')).digest('hex'));
assert.equal(api.definitions.length,7);assert.equal(api.groups.length,5);assert.equal(data.performance.length,10);assert.equal(data.tiers.length,10);assert.equal(data.allClients.length,10);assert.equal(data.source.reportedRows.performance,50);assert.equal(data.source.reportedRows.tiers,60);assert.equal(data.source.reportedRows.allClients,1544);
assert.equal(Object.values(data.clients).reduce((n,rows)=>n+rows.length,0),39);assert.equal(Object.keys(data.categories).length,15);assert.equal(Object.values(data.categories).reduce((n,rows)=>n+rows.length,0),70);assert.equal(Object.values(data.tierClients).reduce((n,rows)=>n+rows.length,0),43);
assert.equal(data.managers.length,9);assert.equal(data.reps.length,4);assert.equal(data.hierarchy.length,10);assert.equal(data.unassigned.length,0);
assert.equal(data.managers.reduce((n,row)=>n+row[4],0),1416897);assert.equal(data.performance.reduce((n,row)=>n+row[5],0),880550);assert.equal(ids.get('salesRevenue').textContent,'₹14,16,897');assert.equal((ids.get('salesSummary').innerHTML.match(/<section/g)||[]).length,3);
for(const [key,rows]of Object.entries(data.categories)){const cut=key.lastIndexOf('::'),client=data.clients[key.slice(0,cut)].find(row=>row[0]===Number(key.slice(cut+2)));assert.equal(rows.reduce((n,row)=>n+row[2],0),client[6],key);if(key!=='NAVEENNATH::987')assert.equal(rows.reduce((n,row)=>n+row[1],0),client[4],key);}
assert.equal(data.categories['NAVEENNATH::987'].reduce((n,row)=>n+row[1],0),78);assert.equal(data.clients.NAVEENNATH[0][4],131);assert.equal(data.tiers.find(row=>row[0]==='Unassigned (no PRO)')[1],18);assert.equal(data.reportedTierClients['Unassigned (no PRO)'],19);
assert.equal(data.tierClients.SANDEEP.find(row=>row[0]==='M/S S.S.M.N.J MEDICALS')[4],'Tier 3');assert.equal(data.tierClients.SANDEEP.find(row=>row[0]==='M/S S.S.M.N.J MEDICALS')[5],83320);
assert.equal(count('performance'),10);assert(!ids.get('sales-report-performance').innerHTML.includes('Clients · GANGADHAR RAO'));
const performanceMarkup=ids.get('sales-report-performance').innerHTML;
assert(performanceMarkup.includes('class="sales-pro-id">PRO ID: 150</small>'));
assert(performanceMarkup.includes('class="sales-pro-id">PRO ID: —</small>'));
for(const def of api.definitions){
 if(!def.columns.length)continue;
 const markup=ids.get('sales-report-'+def.id).innerHTML;
 const header=[...markup.match(/<thead>([\s\S]*?)<\/thead>/)[1].matchAll(/<th data-sales-align="([^"]+)"/g)].map(match=>match[1]);
 assert.deepEqual(header,Array.from(def.types,type=>type==='money'?'right':['number','id','badge'].includes(type)?'center':'left'),def.id);
 const firstRow=markup.match(/<tbody><tr>([\s\S]*?)<\/tr>/)?.[1];
 if(api.rowsFor(def.id).length)assert.deepEqual([...firstRow.matchAll(/<td data-sales-align="([^"]+)"/g)].map(match=>match[1]),header,def.id+' body');
}
click({salesOpen:'pro',key:'performance',value:'GANGADHAR RAO'});assert.equal(count('clients:GANGADHAR RAO'),10);assert(ids.get('sales-report-performance').innerHTML.includes('aria-current="page"'));assert.equal((ids.get('sales-report-performance').innerHTML.match(/<table /g)||[]).length,1);assert(!api.contexts.has('performance'));
const clientMarkup=ids.get('sales-report-performance').innerHTML,clientHeader=clientMarkup.match(/<thead>([\s\S]*?)<\/thead>/)[1];
assert.equal((clientHeader.match(/<th /g)||[]).length,6);assert(!clientHeader.includes('Client ID'));assert(clientMarkup.includes('class="sales-client-id">Client ID: 3788</small>'));
assert.equal(api.formulaRowsFor('clients:GANGADHAR RAO')[0].length,6);assert.equal(api.formulaRowsFor('clients:GANGADHAR RAO')[0][0],'YODA WELLNESS BEGUMPET');
fire('salesReports','input',{dataset:{salesSearch:'clients:GANGADHAR RAO'},value:'3788'});assert.equal(count('clients:GANGADHAR RAO'),1);assert.equal(api.rowsFor('clients:GANGADHAR RAO')[0][0],3788);
fire('salesReports','input',{dataset:{salesSearch:'clients:GANGADHAR RAO'},value:'wellness begumpet'});assert.equal(count('clients:GANGADHAR RAO'),1);
fire('salesReports','input',{dataset:{salesSearch:'clients:GANGADHAR RAO'},value:''});api.exportCsv('clients:GANGADHAR RAO');const clientCsv=payload;
click({salesOpen:'client',key:'clients:GANGADHAR RAO',value:'3788'});assert.equal(count('categories:GANGADHAR RAO::3788'),13);assert(ids.get('sales-report-performance').innerHTML.includes('YODA WELLNESS BEGUMPET · Category-level breakdown'));
let drillMarkup=ids.get('sales-report-performance').innerHTML;
assert.equal((drillMarkup.match(/<table /g)||[]).length,1);assert(!drillMarkup.includes('<td colspan='));assert(!drillMarkup.match(/<tbody>([\s\S]*?)<\/tbody>/)[1].includes('aria-expanded='));
assert(drillMarkup.includes('data-sales-back="root"'));assert(drillMarkup.includes('data-sales-back="clients"'));assert(drillMarkup.includes('aria-current="page" tabindex="-1">YODA WELLNESS BEGUMPET</span>'));
assert(drillMarkup.includes('sales-breadcrumb dashboard-report-breadcrumb'));
assert(drillMarkup.includes('doctors-breakdown-info dashboard-summary-info'));
assert(drillMarkup.indexOf('sales-section-title')<drillMarkup.indexOf('dashboard-report-breadcrumb'));assert(drillMarkup.indexOf('dashboard-report-breadcrumb')<drillMarkup.indexOf('dashboard-summary-info'));
assert(drillMarkup.includes('Client summary · Selected period:'));assert(drillMarkup.includes('Test counts and revenue by category for the selected client.'));
assert(!api.contexts.has('performance'));assert(!api.contexts.has('clients:GANGADHAR RAO'));
assert(ids.get('sales-heading-'+encodeURIComponent('categories:GANGADHAR RAO::3788')).focused);
const categoryKey='categories:GANGADHAR RAO::3788';click({salesPage:categoryKey,target:'2'});assert.equal(api.stateFor(categoryKey).page,2);api.exportCsv(categoryKey);const categoryCsv=payload;
click({salesSort:categoryKey,column:'2'});assert.equal(api.stateFor(categoryKey).page,1);assert.equal(api.rowsFor(categoryKey)[0][2],72050);click({salesSort:categoryKey,column:'2'});assert.equal(api.rowsFor(categoryKey)[0][2],0);
click({salesChart:categoryKey});assert.equal(ids.get('sales-chart-'+encodeURIComponent(categoryKey)).hidden,false);assert(ids.get('sales-chart-'+encodeURIComponent(categoryKey)).innerHTML.includes('Chart type'));click({salesChart:categoryKey});assert(ids.get('sales-chart-button-'+encodeURIComponent(categoryKey)).focused);
fire('salesReports','input',{dataset:{salesSearch:categoryKey},value:'BIOCHEMISTRY'});assert.equal(count(categoryKey),1);assert.equal(api.totalFor(api.contexts.get(categoryKey).def,api.rowsFor(categoryKey))[2],25205);fire('salesReports','input',{dataset:{salesSearch:categoryKey},value:''});
for(const [pro,clients]of Object.entries(data.clients)){
  click({salesBack:'root',report:'performance'});click({salesOpen:'pro',key:'performance',value:pro});
  const key='clients:'+pro;assert.equal(count(key),clients.length);
  for(const client of clients){const expected=data.categories[pro+'::'+client[0]];if(!expected)continue;click({salesBack:'clients',report:'performance'});click({salesOpen:'client',key,value:String(client[0])});assert.equal(count('categories:'+pro+'::'+client[0]),expected.length);}
}
click({salesBack:'root',report:'performance'});click({salesOpen:'pro',key:'performance',value:'PRO #150'});assert.equal(count('clients:PRO #150'),0);assert(ids.get('sales-report-performance').innerHTML.includes('Client details are not available for this PRO'));
fire('salesTabs','click',{closest:()=>({dataset:{salesTab:'tiers'}})});assert.equal(ids.get('sales-group-tiers').hidden,false);assert.equal(ids.get('sales-group-performance').hidden,true);
for(const [pro,rows]of Object.entries(data.tierClients)){click({salesBack:'root',report:'tiers'});click({salesOpen:'tierPro',key:'tiers',value:pro});assert.equal(count('tierClients:'+pro),rows.length);}
click({salesTier:'Tier 2'});assert.equal(count('allClients'),0);click({salesTier:'Tier 1'});assert.equal(count('allClients'),10);click({salesTier:'All'});assert.equal(count('allClients'),10);
fire('salesShowAll','click',{});assert.equal(ids.get('salesTabs').hidden,true);assert.equal(ids.get('salesViewLabel').textContent,'Show tabs');for(const [id]of api.groups)assert.equal(ids.get('sales-group-'+id).hidden,false);fire('salesShowAll','click',{});assert.equal(ids.get('salesTabs').hidden,false);assert.equal(ids.get('salesViewLabel').textContent,'Show all tables');
let prevented=false;for(const fn of ids.get('salesTabs').listeners.keydown)fn({key:'End',preventDefault(){prevented=true;}});assert(prevented);assert(ids.get('sales-tab-hierarchy').focused);
fire('salesReports','input',{dataset:{salesSearch:'managers'},value:'Unassigned'});assert.equal(count('managers'),1);assert.equal(api.totalFor(api.contexts.get('managers').def,api.rowsFor('managers'))[4],659039);fire('salesReports','input',{dataset:{salesSearch:'managers'},value:''});
click({salesBack:'root',report:'performance'});fire('salesReports','change',{dataset:{salesSize:'performance'},value:'5'});click({salesPage:'performance',target:'2'});assert.equal(api.stateFor('performance').page,2);api.exportCsv('performance');const performanceCsv=payload;assert(context.download.download.includes('2026-11-15-to-2026-11-15'));
api.exportCsv('allClients');assert(context.download.download.includes('2026-10-01-to-2026-10-31'));
const totals=api.totalFor(api.definitions.find(def=>def.id==='managers'),data.managers);assert.equal(totals[1],null,'Do not sum distinct panel counts');assert.equal(totals[3],null,'Do not sum distinct patients');assert.equal(totals[4],1416897);
ids.get('salesTierMonthControl').value='2026-11';fire('salesReports','change',{id:'salesTierMonthControl',value:'2026-11',dataset:{}});assert.equal(count('tierClients:SANDEEP'),0);assert(ids.get('sales-report-tiers').innerHTML.includes('Previous month: Oct 2026'));
fire('salesReports','click',{closest:()=>({id:'salesRestoreMonth',dataset:{}})});click({salesBack:'root',report:'tiers'});assert.equal(count('tiers'),10);
ids.get('homeFrom').value='2026-11-16';ids.get('homeTo').value='2026-11-16';api.refresh();assert.equal(count('performance'),0);assert.equal(count('tiers'),10);assert.equal(count('hierarchy'),10);assert.equal(ids.get('salesRevenue').textContent,'—');
ids.get('homeFrom').value='2026-11-17';ids.get('homeTo').value='2026-11-16';api.refresh();assert.equal(api.scope().valid,false);assert.equal(count('performance'),0);assert.equal(count('hierarchy'),10);
fire('salesReset','click',{});assert.equal(count('performance'),10);assert.equal(ids.get('salesRevenue').textContent,'₹14,16,897');assert.equal(api.stateFor('performance').size,10);assert.equal(count('allClients'),10);
fire('salesOpenFormulas','click',{});assert(ids.get('salesFormulas').open);fire('salesCloseFormulas','click',{});assert(!ids.get('salesFormulas').open);
api.setRange('report');assert(api.scope().full);assert.equal(count('performance'),10);
for(const [,file]of html.matchAll(/(?:src|href)="([^"#]+)"/g))if(!file.includes('http'))assert(fs.existsSync(file),file);
const styles=[...html.matchAll(/href="([^"?]+\.css)"/g)].map(match=>match[1]);assert.equal(styles.at(-1),'dashboard-theme.css');assert(styles.indexOf('dashboard-financial-foundation.css')<styles.indexOf('sales-team.css'));assert(html.includes('revenue-report-layout.css'));assert(html.includes('dashboard-report-chart-tooltips.js'));
assert(html.includes('class="reference-menu active" type="button" onclick="location.href=\'sales-team.html\'" aria-current="page"'));const staticIds=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);assert.equal(new Set(staticIds).size,staticIds.length);
for(const file of ['home.html','revenue-sales.html','specialty.html','tests-patients.html','center-overview.html','qc-dashboard.html','tat-operations.html','doctors.html','clients.html','location-explorer.html','targets-alerts.html','yoda-b2c.html'])assert(fs.readFileSync(file,'utf8').includes("location.href='sales-team.html'"),file);
(async()=>{const category=await categoryCsv.text(),performance=await performanceCsv.text();assert.equal(category.split('\r\n').length,15);assert.equal(performance.split('\r\n').length,12);assert(performance.includes('"PRO ID","PRO","Designation"'));assert(performance.includes('"150","PRO #150"'));assert(performance.includes('"","GANGADHAR RAO"'));assert(category.includes('"Test category","Tests","Revenue","PRO ID","PRO"'));const csv=await clientCsv.text();assert(csv.includes('"Client ID","Client","Type"'));assert(csv.includes('"3788","YODA WELLNESS BEGUMPET"'));assert(csv.includes('"","All filtered total"'));assert(csv.includes('"PRO ID","PRO"'));console.log('PASS: exact Sales PDF fingerprint, seven reports, 39 client rows, 15 category tables/70 category rows, 43 tier-client rows, preserved discrepancies and zero values, five tabs/show-all, breadcrumb drilldown, combined client display, verified PRO IDs, count/name/currency alignment, ID/name search, separate CSV ID/name columns and PRO context, projected formula inputs, sort/pagination/charts, independent periods and theme assets.');})();
