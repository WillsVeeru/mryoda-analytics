(() => {
  'use strict';
  const selectors=['[role="tablist"]','.revenue-report-tabs','.specialty-tabs','.chart-tabs','.co-tabs','.co-insight-tabs','.cost-view-switcher'];
  function iconFor(text){
    const label=text.toLowerCase().trim();
    if(/overview|overall/.test(label))return 'ChartPie';
    if(/pivot|canonical/.test(label))return 'Layers';
    if(/branch|centre|center|location|zone/.test(label))return 'MapPin';
    if(/period comparison|column/.test(label))return 'ChartColumn';
    if(/bar/.test(label))return 'ChartBar';
    if(/pie|cost/.test(label))return 'ChartPie';
    if(/line|trend|profit/.test(label))return 'ChartLine';
    if(/doctor/.test(label))return 'Stethoscope';
    if(/staff|people|workforce|client|pro\b/.test(label))return 'Users';
    if(/package|inventory/.test(label))return 'Package';
    if(/special|component|test|cpt/.test(label))return 'FlaskConical';
    if(/department|category|categories/.test(label))return 'Layers';
    if(/cash/.test(label))return 'Banknote';
    if(/revenue|sales|area/.test(label))return 'ChartColumn';
    if(/order|register/.test(label))return 'ClipboardList';
    return 'CalendarDays';
  }
  function enhance(){
    document.querySelectorAll(selectors.join(',')).forEach(tabs=>{
      tabs.classList.add('dashboard-segmented-tabs');
      for(const button of tabs.querySelectorAll(':scope > button')){
        if(button.querySelector('svg')||typeof dashboardIcon!=='function')continue;
        button.insertAdjacentHTML('afterbegin',dashboardIcon(iconFor(button.textContent)));
      }
    });
  }
  let queued=false;
  new MutationObserver(()=>{
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;enhance();});
  }).observe(document.body,{childList:true,subtree:true});
  enhance();
})();
