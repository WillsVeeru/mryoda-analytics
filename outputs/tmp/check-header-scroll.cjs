const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('application-header-scroll.js','utf8');
function setup(present=true){
 const classes=new Set(),events={},headerEvents={},frames=[],options={};let focused=false,expanded=false;
 const header={offsetHeight:140,classList:{add:name=>classes.add(name),remove:name=>classes.delete(name)},contains:()=>focused,querySelector:()=>expanded?{}:null,addEventListener:(event,callback)=>headerEvents[event]=callback};
 const root={scrollHeight:6000,clientHeight:900},window={scrollY:0,addEventListener:(event,callback,opts)=>{events[event]=callback;options[event]=opts;}};
 const document={scrollingElement:root,querySelector:selector=>{assert.equal(selector,'main > header');return present?header:null;},activeElement:{}};
 vm.runInNewContext(source,{document,window,requestAnimationFrame:callback=>frames.push(callback)});
 const flush=()=>{while(frames.length)frames.shift()();};
 return{header,root,window,events,options,classes,frames,flush,hidden:()=>classes.has('dashboard-header-hidden'),scroll:value=>{window.scrollY=value;events.scroll();flush();},focus:value=>{focused=value;if(value)headerEvents.focusin();},expand:value=>expanded=value};
}
const ui=setup();assert(ui.classes.has('dashboard-scroll-header'));assert(!ui.hidden());assert.equal(ui.options.scroll.passive,true);
ui.scroll(100);assert(!ui.hidden(),'Keep the header visible near the top');
ui.scroll(180);assert(ui.hidden(),'Hide after meaningful downward page scroll');
ui.scroll(174);assert(ui.hidden(),'Ignore a small upward movement');
ui.scroll(170);assert(!ui.hidden(),'Reveal on upward scroll');
ui.scroll(172);assert(!ui.hidden());ui.scroll(190);assert(ui.hidden());
ui.focus(true);assert(!ui.hidden(),'Keyboard focus reveals filters');ui.scroll(350);assert(!ui.hidden(),'Do not interrupt a focused filter');
ui.focus(false);ui.scroll(380);assert(ui.hidden());ui.expand(true);ui.scroll(410);assert(!ui.hidden(),'Expanded filters remain visible');
ui.expand(false);ui.scroll(440);assert(ui.hidden());ui.events.resize();assert(!ui.hidden(),'Reflow reveals the header safely');
ui.scroll(500);assert(ui.hidden());ui.events.pageshow();assert(!ui.hidden(),'Restored pages start with accessible filters');
ui.scroll(600);assert(ui.hidden());ui.scroll(-20);assert(!ui.hidden(),'Top overscroll remains visible');
ui.scroll(9000);assert(ui.hidden());ui.scroll(8500);assert(ui.hidden(),'Bottom bounce is not an upward page scroll');ui.scroll(5090);assert(!ui.hidden());
ui.scroll(5040);ui.window.scrollY=5060;ui.events.scroll();ui.window.scrollY=5070;ui.events.scroll();assert.equal(ui.frames.length,1,'Throttle consecutive scroll events to one animation frame');ui.flush();assert(ui.hidden());
ui.root.scrollHeight=700;ui.scroll(500);assert(!ui.hidden(),'Short pages and filtered reports keep the header visible');
assert.equal(ui.header.inert,undefined,'Keyboard navigation must still reach hidden header controls');
const absent=setup(false);assert.equal(absent.classes.size,0);assert.equal(Object.keys(absent.events).length,0,'Do not add a global header to a page without one');
const css=fs.readFileSync('dashboard-theme.css','utf8');
assert(css.includes('position:sticky!important'));assert(css.includes('header.dashboard-scroll-header.dashboard-header-hidden'));
assert(css.includes('header.dashboard-scroll-header { transition:none; }'));assert(css.includes('position:static!important;transform:none!important;pointer-events:auto'));
const pages=fs.readdirSync('.').filter(file=>file.endsWith('.html')&&!file.includes('Copy'));assert.equal(pages.length,14);
for(const file of pages){
 const html=fs.readFileSync(file,'utf8'),nav=html.match(/<nav[^>]*>[\s\S]*?<\/nav>/)[0];
 const items=[...nav.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(([,attrs,content])=>({attrs,label:content.replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim()}));
 for(const label of ['Quality Control','Center Overview']){
  const item=items.find(item=>item.label===label);assert(item,file+': preserved '+label);assert(item.attrs.includes(' hidden data-sidebar-hidden="true"'),file+': hidden '+label);assert(item.attrs.includes('onclick='),file+': retained destination');
 }
 const finance=items.find(item=>item.label==='Financial Overview');assert(finance&&!finance.attrs.includes(' hidden'),file+': Financial Overview remains available');
 assert.equal((html.match(/src="application-header-scroll.js"/g)||[]).length,1,file+': single shared scroll asset');
 assert(html.indexOf('src="application-sidebar.js"')<html.indexOf('src="application-header-scroll.js"'));
}
assert(fs.existsSync('qc-dashboard.html'));assert(fs.existsSync('center-overview.html'));
assert(fs.readFileSync('application-sidebar.css','utf8').includes('.reference-menu[data-sidebar-hidden="true"]{display:none!important}'));
console.log('PASS: retained/hidden QC and Center Overview entries on 14 pages; Financial Overview preserved; downward hide/upward reveal, jitter thresholds, top/bottom bounce, passive RAF throttling, focused/expanded filters, keyboard access, responsive restoration, reduced motion, print, and pages without a header.');
