(() => {
  'use strict';
  const tabs=document.getElementById('reportTabs');if(!tabs)return;
  const icons={category:'Layers',test:'FlaskConical',package:'Package',date:'CalendarDays'};
  function enhance(){
    if(typeof dashboardIcon!=='function')return;
    tabs.querySelectorAll('button[data-report-tab]').forEach(button=>{
      const name=icons[button.dataset.reportTab];if(!name)return;
      if(button.querySelector('svg')?.getAttribute('data-test-report-icon')===name)return;
      button.querySelectorAll('svg').forEach(icon=>icon.remove());
      button.insertAdjacentHTML('afterbegin',dashboardIcon(name));
      button.querySelector('svg')?.setAttribute('data-test-report-icon',name);
    });
  }
  new MutationObserver(enhance).observe(tabs,{childList:true,subtree:true});
  enhance();
})();
