(() => {
  'use strict';
  const source=window.revenuePdfSource;
  const filterIds=['centre','clientType','client','moreCity','moreZone','moreCategory','moreDoctor','moreRep'];
  function dimensionFiltered(){
    return filterIds.some(id=>{
      const field=document.getElementById(id);if(!field)return false;
      const selected=window.testsMultiFilters?.[id];
      if(selected){const all=[...field.options].filter(option=>option.value!=='All').map(option=>option.value);return all.some(value=>!selected.has(value))||!selected.size;}
      return field.value!=='All';
    });
  }
  const previousRender=renderRevenuePage;
  renderRevenuePage=function(id){
    const result=previousRender.apply(this,arguments),state=window.revenuePdfSnapshotState;
    if(!state)return result;
    const table=document.querySelector('#table-'+id+' table');
    const coverage=state.coverage[id],partial=coverage&&coverage[0]<coverage[1];
    const total=table?.tFoot?.rows[0]?.cells[0];
    if(total)total.textContent=partial?'Subtotal':'Total';
    const card=document.getElementById('table-'+id).closest('.card');
    let note=card.querySelector('[data-pdf-table-note]');
    if(!note){note=document.createElement('p');note.className='revenue-reconciliation-note';note.dataset.pdfTableNote='true';document.getElementById('table-'+id).before(note);}
    const daily=id==='daily'||id==='discount';
    note.textContent=state.dimensionFiltered?'The PDF contains aggregate data for all centres and clients. Clear dimension filters to view the captured rows.'
      :!state.complete&&!daily?'This aggregate table is available only for the full PDF period, 5–11 Nov 2026. Daily attribution for other filters is not included in the PDF.'
      :'PDF snapshot · 5–11 Nov 2026. '+(partial?coverage[0]+' of '+coverage[1]+' rows are visible; hidden pages were not imported.':daily?'Showing captured dates within the selected range.':'All rows visible in this table were imported.');
    // Replace the earlier demo allocation note with the actual snapshot provenance.
    [...card.querySelectorAll('.revenue-reconciliation-note')].forEach(other=>{other.hidden=true;});
    if(!dataSets[id].length){const empty=table?.querySelector('tbody td[colspan]');if(empty)empty.textContent=state.dimensionFiltered?'No transaction-level dimension data is available in this PDF.':'No captured rows are available for this selection. Restore the PDF period to view the imported aggregate.';}
    return result;
  };
  const previousRefresh=refreshHome;
  refreshHome=function(){
    window.revenuePdfSnapshotState=null;
    const result=previousRefresh.apply(this,arguments);
    const from=document.getElementById('homeFrom').value,to=document.getElementById('homeTo').value;
    const state=source.select(from,to,dimensionFiltered());window.revenuePdfSnapshotState=state;
    dataSets=state.base;
    const sum=index=>dataSets.daily.reduce((total,row)=>total+row[index],0);
    const net=sum(8),routine=sum(5),specialty=sum(6),bills=sum(1);
    const values=[money(routine),money(specialty),(net?specialty/net*100:0).toFixed(2)+'%',money(net)];
    const notes=['Daily routine net · refunds included',state.complete?'77 orders · PDF reference':'Captured daily specialty revenue','Share of captured daily net revenue',number(bills)+' bills · captured daily rows'];
    [...document.getElementById('revenueSummary').children].forEach((card,index)=>{card.querySelector('strong').textContent=values[index];card.querySelector('p').textContent=notes[index];});
    definitions.forEach(([id])=>{renderRevenuePage(id);if(!document.getElementById('chart-'+id).hidden)drawRevenueChart(id);});
    window.refreshRevenueReferenceSections();
    const homeNote=document.querySelector('.revenue-content > .home-note');
    if(homeNote)homeNote.remove();
    return result;
  };
  function restore(){
    window.testsMultiFilters=Object.create(null);
    filterIds.forEach(id=>{const field=document.getElementById(id);if(field)field.value='All';});
    document.getElementById('homeFrom').value=source.sourceFrom;document.getElementById('homeTo').value=source.sourceTo;
    refreshHome();
  }
  restore();
})();
