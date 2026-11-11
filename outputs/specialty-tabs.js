(() => {
  'use strict';
  const previous=renderSpecialTabs;
  renderSpecialTabs=function(){
    const result=previous.apply(this,arguments);
    for(const [id,label] of [['panelTabs','Specialty panel views'],['peopleTabs','Specialty people views']]){
      const tabs=document.getElementById(id);if(!tabs)continue;
      tabs.setAttribute('role','group');tabs.setAttribute('aria-label',label);
      [...tabs.querySelectorAll('button')].forEach((button,index)=>{
        button.setAttribute('aria-pressed',String(button.classList.contains('active')));
        if(id==='peopleTabs'&&!button.querySelector('svg')&&typeof dashboardIcon==='function')button.insertAdjacentHTML('afterbegin',dashboardIcon(index===0?'Stethoscope':'Users'));
      });
    }
    return result;
  };
  renderSpecialTabs();
})();
