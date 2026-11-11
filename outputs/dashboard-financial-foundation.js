(() => {
  'use strict';
  function tone(label){
    const text=label.toLowerCase();
    if(/discount|pending/.test(text))return 'deduction';
    if(/refund|expense|cost|failed|failure/.test(text))return 'cost';
    if(/contribution|share|target|baseline|yodaara|genetics|specialty/.test(text))return 'benchmark';
    if(/\bnet\b|realised|balance|passed|pass %|pass rate/.test(text))return 'result';
    if(/gross|revenue|amount|sales|ticket/.test(text))return 'inflow';
    return '';
  }
  function enhanceKpis(){
    document.querySelectorAll('main .kpi,main .home-kpi,main .revenue-kpi,main .tp-stat').forEach(card=>{
      card.classList.add('dashboard-financial-kpi');
      const label=card.querySelector('.kpi-label,.label,h2,.tp-stat-top > span:first-child')||card.querySelector(':scope > span');
      const value=card.querySelector('.kpi-value,.metric,strong');
      const note=card.querySelector('.kpi-foot,p,small');
      const icon=card.querySelector('.restored-kpi-icon,.metric-icon,.tp-stat-icon');
      if(label){label.classList.add('dashboard-financial-kpi-label');const text=label.textContent.toLowerCase();card.dataset.dashboardKpiTone=/failed|failure/.test(text)?'negative':/balance|passed|pass rate/.test(text)?'positive':'neutral';}
      value?.classList.add('dashboard-financial-kpi-value');note?.classList.add('dashboard-financial-kpi-note');icon?.classList.add('dashboard-financial-kpi-icon');
    });
  }
  function enhanceTables(){
    document.querySelectorAll('main table,dialog table').forEach(table=>{
      // Financial Overview already supplies the reference theme and its semantic colours.
      if(table.matches('.co-financial-table')||table.closest('.dashboard-formula-dialog,#financialFormulaSections'))return;
      table.classList.add('dashboard-financial-table');
      let surface=table.parentElement;
      if(!surface.matches('.table-scroll,.rev-scroll,.specialty-scroll,.tp-table-scroll,.co-table-wrap,.dashboard-table-surface')){
        surface=document.createElement('div');table.before(surface);surface.append(table);
      }
      surface.classList.add('dashboard-table-surface');
      const header=table.tHead?.rows[table.tHead.rows.length-1];if(!header)return;
      const labels=[...header.cells].map(cell=>cell.textContent.trim());
      for(const row of table.rows){
        let column=0;
        for(const cell of row.cells){
          const label=labels[column]||'',single=cell.colSpan===1;
          const semantic=single?tone(label):'';
          if(semantic)cell.dataset.dashboardTone=semantic;else delete cell.dataset.dashboardTone;
          const numeric=column>0&&/bills|patients|tests|volume|count|samples|runs|passed|failed|pending|%|share|amount|revenue|gross|net|cost|spend|discount|refund|ticket/i.test(label)&&!/name|detail|category|panel|reason|source|mode|login|designation|terms|channel/i.test(label);
          if(single&&numeric)cell.dataset.dashboardNumeric='true';else delete cell.dataset.dashboardNumeric;
          column+=cell.colSpan;
        }
      }
    });
  }
  function enhance(){enhanceKpis();enhanceTables();}
  let queued=false;
  new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance();});}).observe(document.body,{childList:true,subtree:true,characterData:true});
  enhance();
})();
