/* Show the global header on upward page scroll, without changing report/filter state. */
(() => {
  'use strict';
  const header=document.querySelector('main > header');
  if(!header)return;
  header.classList.add('dashboard-scroll-header');
  const root=document.scrollingElement||document.documentElement;
  const position=()=>Math.max(0,Math.min(window.scrollY||0,Math.max(0,root.scrollHeight-root.clientHeight)));
  let last=position(),direction=0,distance=0,queued=false;
  const pinned=()=>header.contains(document.activeElement)||!!header.querySelector('[aria-expanded="true"]');
  const show=()=>header.classList.remove('dashboard-header-hidden');
  function update(){
    queued=false;
    const current=position(),delta=current-last;last=current;
    if(current<=24||pinned()){show();direction=0;distance=0;return;}
    if(!delta)return;
    const next=delta>0?1:-1;
    if(next!==direction){direction=next;distance=0;}
    distance+=Math.abs(delta);
    if(next<0&&distance>=8){show();distance=0;}
    else if(next>0&&current>header.offsetHeight+24&&distance>=16){header.classList.add('dashboard-header-hidden');distance=0;}
  }
  window.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update);}},{passive:true});
  header.addEventListener('focusin',()=>{show();last=position();direction=0;distance=0;});
  window.addEventListener('resize',()=>{show();last=position();direction=0;distance=0;},{passive:true});
  window.addEventListener('pageshow',()=>{show();last=position();direction=0;distance=0;});
})();
