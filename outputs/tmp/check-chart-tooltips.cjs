const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const events={},windowEvents={},elements=[];
class Element{
 constructor(){this.style={};this.attrs={};this.children=[];this.offsetWidth=220;this.offsetHeight=100;this.isConnected=true;elements.push(this);}
 append(...children){this.children.push(...children);}appendChild(child){this.append(child);}setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k];}removeAttribute(k){delete this.attrs[k];}
 getBoundingClientRect(){return{right:300,top:120};}contains(){return false;}
}
const doc={createElement:()=>new Element(),body:new Element(),addEventListener:(key,fn)=>events[key]=fn};
vm.runInNewContext(fs.readFileSync('dashboard-report-chart-tooltips.js','utf8'),{document:doc,window:{addEventListener:(key,fn)=>windowEvents[key]=fn},innerWidth:1000,innerHeight:700});
const tip=doc.body.children[0],mark=new Element(),svg=new Element();svg.setAttribute('data-chart-metric','Tests');mark.setAttribute('fill','#8b4ac4');
let title={textContent:'Biochemistry: 26,234',remove(){title=null;}};
mark.querySelector=()=>title;mark.closest=selector=>selector==='svg'?svg:mark;
events.pointerover({target:mark,clientX:990,clientY:690});assert.equal(tip.hidden,false);assert.equal(tip.children[0].textContent,'Biochemistry');assert.equal(tip.children[1].children[1].textContent,'26,234');assert.equal(tip.children[1].children[1].style.color,'#8b4ac4');assert.equal(title,null);assert.equal(mark.getAttribute('aria-describedby'),tip.id);assert.equal(tip.style.left,'768px');
events.keydown({key:'Escape'});assert(tip.hidden);assert.equal(mark.getAttribute('aria-describedby'),undefined);
events.focusin({target:mark});assert.equal(tip.hidden,false);assert.equal(tip.style.left,'316px');
events.scroll();assert(tip.hidden);events.pointerover({target:mark,clientX:20,clientY:20});events.pointerout({target:mark,relatedTarget:null});assert(tip.hidden);
console.log('PASS: styled chart tooltip on hover and focus, native-title suppression, matching value colour, viewport positioning and dismissal.');
