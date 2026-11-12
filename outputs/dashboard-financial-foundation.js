(() => {
  'use strict';
  const testsPage=!!document.getElementById('tpSummary');
  const referrersPage=document.body.classList.contains('doctors-page');
  if(testsPage)document.body.classList.add('tests-patients-page');
  function testsHeaderTone(label){
    if(/revenue/i.test(label))return 'inflow';
    if(/share/i.test(label))return 'benchmark';
    if(/avg/i.test(label))return 'deduction';
    if(/barcodes/i.test(label))return 'inflow';
    if(/bills/i.test(label))return 'result';
    return 'neutral';
  }
  function referrerHeaderTone(label){
    if(/revenue/i.test(label))return 'inflow';
    if(/patients/i.test(label))return 'benchmark';
    if(/bills|active clients/i.test(label))return 'result';
    if(/tests|volume/i.test(label))return 'deduction';
    return 'neutral';
  }
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
      if(testsPage)for(const row of table.tHead.rows)for(const cell of row.cells)cell.dataset.dashboardHeaderTone=testsHeaderTone(cell.textContent);
      if(referrersPage)for(const row of table.tHead.rows)for(const cell of row.cells)cell.dataset.dashboardHeaderTone=referrerHeaderTone(cell.textContent);
      const columnTones=[...header.cells].map(cell=>cell.dataset.dashboardHeaderTone||cell.dataset.tatHeaderTone||'');
      for(const row of table.rows){
        let column=0;
        for(const cell of row.cells){
          const label=labels[column]||'',single=cell.colSpan===1;
          const columnTone=single?columnTones[column]:'';
          if(columnTone)cell.dataset.dashboardColumnTone=columnTone;else delete cell.dataset.dashboardColumnTone;
          if(referrersPage&&columnTone==='inflow'&&/^[-−]/.test(cell.textContent.trim().replace(/[₹,\s]/g,'')))cell.dataset.dashboardNegative='true';else delete cell.dataset.dashboardNegative;
          const semantic=single?tone(label):'';
          if(semantic)cell.dataset.dashboardTone=semantic;else delete cell.dataset.dashboardTone;
          const numeric=column>0&&/bills|patients|tests|volume|count|samples|runs|passed|failed|pending|%|share|amount|revenue|gross|net|cost|spend|discount|refund|ticket/i.test(label)&&!/name|detail|category|panel|reason|source|mode|login|designation|terms|channel/i.test(label);
          if(single&&numeric)cell.dataset.dashboardNumeric='true';else delete cell.dataset.dashboardNumeric;
          column+=cell.colSpan;
        }
      }
    });
  }
  function enhancePagination(){
    const icons={first:'M6 5v14m12-14-7 7 7 7',previous:'m15 5-7 7 7 7',next:'m9 5 7 7-7 7',last:'M18 5v14M6 5l7 7-7 7'};
    const labels={first:'First page',previous:'Previous page',next:'Next page',last:'Last page'};
    document.querySelectorAll('.rev-page-nav button,.specialty-foot > div:last-child button,.tp-pagination > div:last-child button,.tat-page > div:last-child button,.financial-table-page-button,.co-detail-pagination button').forEach(button=>{
      if(button.dataset.dashboardPageIcon||button.querySelector('svg'))return;
      const text=button.textContent.trim(),label=(button.getAttribute('aria-label')||button.title||'').toLowerCase();
      const action=/first/.test(label)||text==='«'?'first':/previous|prev/.test(label)||text==='‹'?'previous':/next/.test(label)||text==='›'?'next':/last/.test(label)||text==='»'?'last':null;
      if(!action)return;
      button.dataset.dashboardPageIcon=action;
      if(!button.hasAttribute('aria-label'))button.setAttribute('aria-label',labels[action]);
      if(!button.title)button.title=labels[action];
      button.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+icons[action]+'"/></svg>';
    });
  }
  function enhance(){enhanceKpis();enhanceTables();enhancePagination();}
  let queued=false;
  new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance();});}).observe(document.body,{childList:true,subtree:true,characterData:true});
  enhance();
})();
