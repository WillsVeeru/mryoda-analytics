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
  function tableColumnAlignment(label,values,explicit){
    if(['left','center','right'].includes(explicit))return explicit;
    const heading=label.toLowerCase().replace(/[↕↑↓▴▾]/g,'').replace(/\s+/g,' ').trim();
    const samples=values.map(value=>value.trim()).filter(value=>value&&!/^[—–-]+$/.test(value));
    const numeric=value=>/^[+−-]?[\d,.]+(?:\s*%|\s*[kml])?$/i.test(value);
    // Percentages and durations remain numeric even when their labels mention cost or revenue.
    if(/%|\b(?:percent|percentage|share|contribution|achievement|attainment|tat|sla|hours?|hrs?|minutes?|mins?|lab processing)\b|\bwithin\s+\d/i.test(heading))return 'center';
    if(/^(?:#|s\.?\s*no\.?|serial(?: number)?|rank|(?:pro|client|doctor|patient|employee|test) id)$/.test(heading))return 'center';
    if(/^(?:name|person|pro|doctor|client|branch|cent[er]+|city|state|test|panel|package|department|category|speciali[sz]ation|designation|type|role|status|movement|action|review|reason|stage|bucket|group|mode|channel|source|campaign|lead platform|booked via|referred by|sales rep|sales manager|account manager|reports to|manager designation|coco\/foco)$/.test(heading)||/\b(?:name|category|login|payment mode|booking channel|referral source|client type)\b/.test(heading))return 'left';
    if(samples.some(value=>/[₹$€£]|\bINR\b/.test(value)))return 'right';
    if(samples.length&&samples.every(value=>/^[+−-]?[\d,.]+\s*(?:%|h|hrs?|hours?|m|mins?|minutes?|s|sec(?:onds?)?)(?:\b|$)/i.test(value)))return 'center';
    if(/\b(?:date|month|period|onboarded|first bill)\b/.test(heading)&&!/\b(?:target|revenue|amount|cost|spend)\b/.test(heading))return 'left';
    if(/shortfall|excess/.test(heading)&&samples.some(value=>!numeric(value)))return 'center';
    if(/\b(?:revenue|gross|net|amount|discount|expense|expenses|expenditure|cost|spend|salary|salaries|balance|cash|paid|margin|target|shortfall|excess|difference|cpt|price|ticket|realised|realized)\b/.test(heading))return 'right';
    if(samples.length&&samples.every(value=>numeric(value)||/^[+−-]?[\d,.]+\s*(?:h|hrs?|hours?|m|mins?|minutes?|s|sec(?:onds?)?)\b/i.test(value)))return 'center';
    if(/\b(?:bills?|patients?|tests|volume|count|samples?|runs?|panels|clients|doctors|centres|centers|receipts|orders|registered|received|batched|transferred|billed|cancelled|pending|rejections?|passed|failed|active|moved up|moved down|no business|units)\b/.test(heading))return 'center';
    return 'left';
  }
  function alignTable(table){
    if(table.closest('.dashboard-formula-dialog,#financialFormulaSections'))return;
    // Map spanning headers to their actual columns; never borrow rows from a nested table.
    const grid=[],records=[],labels=[],explicit=[],headers=[];
    [...table.rows].filter(row=>row.closest('table')===table).forEach((row,rowIndex)=>{
      grid[rowIndex]??=[];
      let column=0;
      for(const cell of row.cells){
        while(grid[rowIndex][column])column++;
        const width=cell.colSpan||1,height=cell.rowSpan===0?table.rows.length-rowIndex:cell.rowSpan||1;
        records.push({cell,row,column,width,header:row.parentElement===table.tHead||cell.tagName==='TH'});
        for(let y=rowIndex;y<rowIndex+height;y++){
          grid[y]??=[];for(let x=column;x<column+width;x++)grid[y][x]=cell;
        }
        if(row.parentElement===table.tHead||!table.tHead&&cell.tagName==='TH')for(let x=column;x<column+width;x++){
          labels[x]=cell.dataset.dashboardLabel||cell.textContent.trim();explicit[x]=cell.dataset.salesAlign||cell.dataset.columnAlign;headers[x]=cell;
        }
        column+=width;
      }
    });
    const samples=labels.map(()=>[]);
    for(const {cell,row,column,width,header}of records)if(!header&&width===1&&row.parentElement!==table.tFoot&&(samples[column]?.length||0)<32){
      (samples[column]??=[]).push(cell.textContent);
    }
    const alignments=labels.map((label,index)=>tableColumnAlignment(label,samples[index]||[],explicit[index]));
    for(const {cell,row,column,width,header}of records){
      let align=width===1?alignments[column]||'left':'left';
      if(header&&width>1){const children=alignments.slice(column,column+width);if(children.length&&children.every(value=>value===children[0]))align=children[0];}
      if(row.parentElement===table.tFoot&&/\btotal\b|\bsummary\b/i.test(cell.textContent)&&!/[₹$€£]/.test(cell.textContent))align='left';
      cell.dataset.dashboardAlign=align;
    }
    return{labels,headers,records};
  }
  function enhanceTables(){
    document.querySelectorAll('main table,dialog table').forEach(table=>{
      const structure=alignTable(table);
      // Financial Overview already supplies the reference theme and its semantic colours.
      if(table.matches('.co-financial-table')||table.closest('.dashboard-formula-dialog,#financialFormulaSections'))return;
      table.classList.add('dashboard-financial-table');
      let surface=table.parentElement;
      if(!surface.matches('.table-scroll,.rev-scroll,.specialty-scroll,.tp-table-scroll,.co-table-wrap,.targets-comparison-wrap,.dashboard-table-surface')){
        surface=document.createElement('div');table.before(surface);surface.append(table);
      }
      surface.classList.add('dashboard-table-surface');
      const header=table.tHead?.rows[table.tHead.rows.length-1];if(!header)return;
      const headers=structure?.headers||[...header.cells],labels=structure?.labels||headers.map(cell=>cell.textContent.trim());
      if(testsPage)for(const row of table.tHead.rows)for(const cell of row.cells)cell.dataset.dashboardHeaderTone=cell.dataset.columnTone||testsHeaderTone(cell.textContent);
      if(referrersPage)for(const row of table.tHead.rows)for(const cell of row.cells)cell.dataset.dashboardHeaderTone=cell.dataset.columnTone||referrerHeaderTone(cell.textContent);
      const columnTones=headers.map(cell=>cell.dataset.dashboardHeaderTone||cell.dataset.tatHeaderTone||'');
      for(const {cell,column,width} of structure.records){
          const label=labels[column]||'',single=width===1;
          const columnTone=single?columnTones[column]:'';
          if(columnTone)cell.dataset.dashboardColumnTone=columnTone;else delete cell.dataset.dashboardColumnTone;
          if(referrersPage&&columnTone==='inflow'&&/^[-−]/.test(cell.textContent.trim().replace(/[₹,\s]/g,'')))cell.dataset.dashboardNegative='true';else delete cell.dataset.dashboardNegative;
          const semantic=single?tone(label):'';
          if(semantic)cell.dataset.dashboardTone=semantic;else delete cell.dataset.dashboardTone;
          const numeric=column>0&&/bills|patients|tests|volume|count|samples|runs|passed|failed|pending|%|share|amount|revenue|gross|net|cost|spend|discount|refund|ticket/i.test(label)&&!/name|detail|category|panel|reason|source|mode|login|designation|terms|channel/i.test(label);
          if(single&&numeric)cell.dataset.dashboardNumeric='true';else delete cell.dataset.dashboardNumeric;
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
