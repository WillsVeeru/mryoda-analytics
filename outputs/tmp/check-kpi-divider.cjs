const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
class Node{
 constructor(tag,classes='',text=''){this.tag=tag;this.textContent=text;this.classes=new Set(classes.split(' ').filter(Boolean));this.children=[];this.dataset={};this.attrs={};this.classList={add:name=>this.classes.add(name),remove:name=>this.classes.delete(name)};}
 append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node);}return this;}
 get previousElementSibling(){const list=this.parentElement?.children||[];return list[list.indexOf(this)-1]||null;}
 matches(selector){return selector.split(',').some(part=>{
  let test=part.trim();const excludes=[...test.matchAll(/:not\(([^)]+)\)/g)].map(match=>match[1]);if(excludes.some(value=>this.matches(value)))return false;test=test.replace(/:not\([^)]+\)/g,'');
  if(test.startsWith('.'))return this.classes.has(test.slice(1));
  if(test==='[data-kpi-note]')return Object.hasOwn(this.attrs,'data-kpi-note');
  return test===this.tag;
 });}
 querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
 querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
 closest(selector){for(let node=this;node;node=node.parentElement)if(node.matches(selector))return node;return null;}
}
const dates=fs.readFileSync('application-table-dates.js','utf8'),foundation=fs.readFileSync('dashboard-financial-foundation.js','utf8');
const headingFor=vm.runInNewContext('('+dates.slice(dates.indexOf('function headingFor('),dates.indexOf('  function tablePeriod('))+')');
const main=new Node('main'),reportTitle=new Node('h3','','Financial report'),summary=new Node('section','financial-section-summary'),summaryHead=new Node('div','financial-section-summary-heading'),summaryTitle=new Node('h4','','All Branches Summary'),grid=new Node('div','financial-section-summary-grid'),wrap=new Node('div','co-table-wrap'),table=new Node('table');
summaryHead.append(summaryTitle);summary.append(summaryHead,grid);main.append(reportTitle,summary,wrap);wrap.append(table);
const cards=[];
for(const label of ['Net Revenue','Cost','Net Margin']){
 const card=new Node('section','revenue-kpi financial-section-summary-card'),title=new Node('h2','',label),date=new Node('p','application-table-period dashboard-financial-kpi-note','Selected period: 17 Nov 2026'),value=new Node('strong','','₹2,85,796'),note=new Node('p','','All filtered rows'),icon=new Node('span','restored-kpi-icon');
 note.attrs['data-kpi-note']='';card.append(icon,title,date,value,note);grid.append(card);cards.push({card,title,date,value,note});
}
assert.equal(headingFor(table),summaryTitle,'Table period must attach to the section heading, not the last KPI title');
summary.children.splice(0,1);assert.equal(headingFor(table),reportTitle,'Skip metric-card headings when looking for a report heading');summary.children.unshift(summaryHead);
const context={document:{querySelectorAll:()=>cards.map(row=>row.card)}};
const fn=foundation.slice(foundation.indexOf('function enhanceKpis('),foundation.indexOf('  function tableColumnAlignment('));
vm.runInNewContext(fn+';enhanceKpis();',context);
for(const {date,value,note}of cards){assert(!date.classes.has('dashboard-financial-kpi-note'));assert(note.classes.has('dashboard-financial-kpi-note'));assert.equal(value.textContent,'₹2,85,796');}
// Legacy cards without explicit footer metadata still ignore a date caption.
delete cards[0].note.attrs['data-kpi-note'];vm.runInNewContext('enhanceKpis();',context);assert(cards[0].note.classes.has('dashboard-financial-kpi-note'));assert(!cards[0].date.classes.has('dashboard-financial-kpi-note'));
assert(dates.includes('.financial-section-summary-heading'));
assert(fs.readFileSync('dashboard-financial-foundation.css','utf8').includes('margin-top:auto; margin-bottom:0; padding-top:12px; border-top:1px solid #edf1ee'));
assert(fs.readFileSync('center-overview-financial.js','utf8').includes('<p data-kpi-note>'));
console.log('PASS: table dates stay with the section heading, explicit and legacy KPI footers get the bottom divider, stale date-caption footer styling is removed, and displayed amounts are preserved.');
