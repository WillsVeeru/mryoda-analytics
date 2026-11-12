(() => {
  'use strict';
  const container=document.getElementById('revenueSections');
  if(!container)return;
  const groups=[
    {id:'overview',label:'Overview',tables:[['daily','Daily revenue'],['channel','Revenue by channel'],['terms','Credit vs cash'],['payment','Payment mode mix']]},
    {id:'speciality',label:'Specialty',tables:[['segments','Specialty vs routine'],['monthly','Specialty share by month'],['panels','Top specialty panels'],['bookers','Who books specialty panels']]},
    {id:'booking',label:'Booking',tables:[['booking','Booking channel'],['bookingMonthly','Booking channel by month']]},
    {id:'packages',label:'Packages & Discounts',tables:[['package','Revenue by package'],['discount','Daily discount'],['approver','Discounts by approver']]}
  ];
  const storageKey='mryoda-revenue-report-layout';
  let mode='tabs',active='overview';
  try{const saved=JSON.parse(sessionStorage.getItem(storageKey)||'null');if(saved){mode=saved.mode==='all'?'all':'tabs';if(groups.some(group=>group.id===saved.active))active=saved.active;}}catch{}
  const toolbar=document.createElement('div');toolbar.className='revenue-report-toolbar full';
  const tablist=document.createElement('div');tablist.className='revenue-report-tabs';tablist.setAttribute('role','tablist');tablist.setAttribute('aria-label','Revenue & Sales reports');
  const allTitle=document.createElement('div');allTitle.className='revenue-report-all-title';allTitle.textContent='All tables';
  const controls=document.createElement('div');controls.className='revenue-report-view-controls';
  const status=document.createElement('span');status.className='revenue-report-view-status';status.setAttribute('role','status');
  const toggle=document.createElement('button');toggle.type='button';toggle.className='revenue-report-view-switch';toggle.setAttribute('role','switch');toggle.setAttribute('aria-label','Show all tables');
  const switchLabel=document.createElement('span');switchLabel.textContent='Show all tables';
  const track=document.createElement('span');track.className='revenue-report-switch-track';track.setAttribute('aria-hidden','true');
  toggle.append(switchLabel,track);controls.append(status,toggle);toolbar.append(tablist,allTitle,controls);container.prepend(toolbar);
  const panels=new Map(),tabs=new Map();
  const tabIcons={overview:'ChartPie',speciality:'FlaskConical',booking:'ClipboardList',packages:'Package'};
  groups.forEach(group=>{
    const tab=document.createElement('button');tab.type='button';tab.id='revenue-report-tab-'+group.id;tab.textContent=group.label;tab.setAttribute('role','tab');tab.setAttribute('aria-controls','revenue-report-panel-'+group.id);tablist.append(tab);tabs.set(group.id,tab);
    if(typeof window.dashboardIcon==='function')tab.innerHTML=window.dashboardIcon(tabIcons[group.id])+'<span>'+group.label+'</span>';
    const panel=document.createElement('section');panel.id='revenue-report-panel-'+group.id;panel.className='revenue-report-panel full';
    const heading=document.createElement('h2');heading.className='revenue-report-group-title';heading.id='revenue-report-group-'+group.id;heading.textContent=group.label;panel.append(heading);
    group.tables.forEach(([id,title])=>{
      const card=document.getElementById('reference-section-'+id)||document.getElementById('table-'+id)?.closest('.card');
      if(!card)return;
      const titleNode=card.querySelector('.rev-heading h2, .rev-heading h3');
      if(titleNode){
        titleNode.textContent=title;
        if(id==='booking'){
          const badge=document.createElement('span');badge.className='reference-proxy-tag';badge.textContent='Proxy';titleNode.append(' ',badge);
        }
      }
      panel.append(card);
    });
    if(group.id==='overview'){
      const comparison=document.createElement('div');comparison.className='revenue-overview-columns';
      const left=document.createElement('div');left.className='revenue-overview-left';
      const right=document.createElement('div');right.className='revenue-overview-right';
      for(const id of ['channel','terms']){
        const card=document.getElementById('table-'+id)?.closest('.card');if(card)left.append(card);
      }
      const payment=document.getElementById('table-payment')?.closest('.card');if(payment)right.append(payment);
      comparison.append(left,right);panel.append(comparison);
    }
    container.append(panel);panels.set(group.id,{panel,heading});
    tab.addEventListener('click',()=>{active=group.id;mode='tabs';update();});
  });
  // Retain the actual table nodes so filters, exports, charts and expanded rows keep working.
  container.querySelectorAll('.reference-report-group').forEach(group=>group.remove());
  function update(){
    const all=mode==='all';
    tablist.hidden=all;allTitle.hidden=!all;
    switchLabel.textContent=all?'Show tabs':'Show all tables';
    toggle.setAttribute('aria-label',all?'Show tabs':'Show all tables');
    toggle.setAttribute('aria-checked',String(all));
    toggle.title=all?'Switch back to tabs':'Show every report in one page';
    status.textContent=all?'13 tables':groups.find(group=>group.id===active).tables.length+' tables';
    groups.forEach(group=>{
      const selected=!all&&active===group.id,tab=tabs.get(group.id),{panel,heading}=panels.get(group.id);
      tab.setAttribute('aria-selected',String(selected));tab.tabIndex=group.id===active?0:-1;
      panel.hidden=!all&&!selected;heading.hidden=!all;
      panel.setAttribute('role',all?'region':'tabpanel');
      panel.setAttribute('aria-labelledby',all?heading.id:tab.id);
    });
    try{sessionStorage.setItem(storageKey,JSON.stringify({mode,active}));}catch{}
    window.dispatchEvent(new Event('resize'));
  }
  toggle.addEventListener('click',()=>{mode=mode==='all'?'tabs':'all';update();});
  tablist.addEventListener('keydown',event=>{
    const index=groups.findIndex(group=>group.id===active);
    let next=index;
    if(event.key==='ArrowRight')next=(index+1)%groups.length;
    else if(event.key==='ArrowLeft')next=(index+groups.length-1)%groups.length;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=groups.length-1;
    else return;
    event.preventDefault();active=groups[next].id;mode='tabs';update();tabs.get(active).focus();
  });
  update();
})();
