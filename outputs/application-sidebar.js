(() => {
  'use strict';
  const sidebar=document.querySelector('.reference-sidebar');
  const brand=sidebar?.querySelector('.reference-brand');
  // Financial Overview already mounts the same controls before this shared asset.
  if(!sidebar||!brand||document.getElementById('centerSidebarControls'))return;
  const body=document.body,storageKey='centerSidebarState';
  if(!sidebar.id)sidebar.id='dashboardSidebar';
  const controls=document.createElement('div');controls.id='centerSidebarControls';controls.className='center-sidebar-controls';
  const compact=document.createElement('button');compact.id='centerSidebarCompact';compact.type='button';compact.className='center-sidebar-action';compact.setAttribute('aria-controls',sidebar.id);
  const close=document.createElement('button');close.id='centerSidebarClose';close.type='button';close.className='center-sidebar-action';close.textContent='×';close.title='Close sidebar';close.setAttribute('aria-label','Close sidebar');close.setAttribute('aria-controls',sidebar.id);
  controls.append(compact,close);brand.append(controls);
  const open=document.createElement('button');open.id='centerSidebarOpen';open.type='button';open.className='center-sidebar-open';open.textContent='☰  Open sidebar';open.title='Open sidebar';open.setAttribute('aria-label','Open sidebar');open.setAttribute('aria-controls',sidebar.id);body.append(open);
  sidebar.querySelectorAll('.reference-menu').forEach(item=>{
    const label=item.textContent.trim();
    if(!item.hasAttribute('title'))item.title=label;
    if(!item.hasAttribute('aria-label'))item.setAttribute('aria-label',label);
  });
  const mobile=()=>window.matchMedia('(max-width:800px)').matches;
  function store(){try{sessionStorage.setItem(storageKey,body.classList.contains('sidebar-closed')?'closed':body.classList.contains('sidebar-compact')?'compact':'expanded');}catch{}}
  function sync(){
    const collapsed=body.classList.contains('sidebar-compact'),closed=body.classList.contains('sidebar-closed'),drawerOpen=body.classList.contains('sidebar-mobile-open');
    const visible=!closed&&(!mobile()||drawerOpen);
    compact.textContent=collapsed?'›':'‹';compact.title=collapsed?'Expand sidebar':'Collapse sidebar';compact.setAttribute('aria-label',compact.title);compact.setAttribute('aria-expanded',String(!collapsed));
    open.hidden=visible;open.setAttribute('aria-expanded',String(visible));
    sidebar.inert=!visible;sidebar.setAttribute('aria-hidden',String(!visible));
  }
  function resizeCharts(){window.dispatchEvent(new Event('resize'));}
  compact.addEventListener('click',()=>{
    body.classList.remove('sidebar-closed','sidebar-mobile-open');body.classList.toggle('sidebar-compact');store();sync();resizeCharts();
    if(mobile())open.focus();
  });
  function hide(){body.classList.add('sidebar-closed');body.classList.remove('sidebar-mobile-open');store();sync();resizeCharts();open.focus();}
  close.addEventListener('click',hide);
  open.addEventListener('click',()=>{
    body.classList.remove('sidebar-closed','sidebar-compact');if(mobile())body.classList.add('sidebar-mobile-open');store();sync();resizeCharts();compact.focus();
  });
  let saved='expanded';try{saved=sessionStorage.getItem(storageKey)||saved;}catch{}
  body.classList.toggle('sidebar-compact',saved==='compact');body.classList.toggle('sidebar-closed',saved==='closed');
  window.addEventListener('resize',sync);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&body.classList.contains('sidebar-mobile-open'))hide();});
  sync();
})();
