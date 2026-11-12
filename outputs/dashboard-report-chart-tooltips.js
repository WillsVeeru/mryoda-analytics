/* Shared chart hover details for Doctors and TAT & Operations. */
(() => {
  'use strict';
  const tooltip=document.createElement('div');
  tooltip.className='report-chart-tooltip';tooltip.id='dashboard-report-chart-tooltip';
  tooltip.setAttribute('role','tooltip');tooltip.hidden=true;
  const heading=document.createElement('strong'),line=document.createElement('div'),label=document.createElement('span'),value=document.createElement('b');
  line.append(label,value);tooltip.append(heading,line);document.body.appendChild(tooltip);
  let active=null;
  function hide(){if(active)active.removeAttribute('aria-describedby');active=null;tooltip.hidden=true;}
  function position(x,y){
    tooltip.style.left=Math.max(12,Math.min(x+16,innerWidth-tooltip.offsetWidth-12))+'px';
    tooltip.style.top=Math.max(12,Math.min(y+16,innerHeight-tooltip.offsetHeight-12))+'px';
  }
  function show(event,keyboard){
    const mark=event.target.closest('.report-chart-visual svg [tabindex]');if(!mark)return;
    if(active===mark)return;
    const title=mark.querySelector('title'),text=title?.textContent||mark.getAttribute('data-chart-title');if(!text)return;
    hide();mark.setAttribute('data-chart-title',text);mark.setAttribute('aria-label',text);title?.remove();
    const split=text.lastIndexOf(': ');heading.textContent=split<0?text:text.slice(0,split);value.textContent=split<0?'':text.slice(split+2);
    label.textContent=mark.closest('svg').getAttribute('data-chart-metric')||'Value';
    value.style.color=mark.getAttribute('fill')||'#35B34A';
    active=mark;mark.setAttribute('aria-describedby',tooltip.id);tooltip.hidden=false;
    const rect=mark.getBoundingClientRect();position(keyboard?rect.right:event.clientX,keyboard?rect.top:event.clientY);
  }
  document.addEventListener('pointerover',event=>show(event,false));
  document.addEventListener('focusin',event=>show(event,true));
  document.addEventListener('pointermove',event=>{if(!active)return;if(!active.isConnected){hide();return;}position(event.clientX,event.clientY);});
  document.addEventListener('pointerout',event=>{if(active&&event.target===active&&!active.contains(event.relatedTarget))hide();});
  document.addEventListener('focusout',event=>{if(event.target===active)hide();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')hide();});
  document.addEventListener('click',hide);
  document.addEventListener('scroll',hide,true);
  window.addEventListener('resize',hide);
})();
