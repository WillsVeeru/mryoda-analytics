(() => {
  'use strict';
  const previousRender = renderSpecial;
  renderSpecial = function (id) {
    const result = previousRender.apply(this,arguments);
    const {headers,rows} = specialData[id];
    const host = document.getElementById('special-'+id);
    const table = host.querySelector('table');
    if (!table || !rows.length) return result;
    const footer = table.createTFoot();
    footer.replaceChildren();
    const totalRow = footer.insertRow();
    headers.forEach((header,index) => {
      const cell = totalRow.insertCell();
      if (!index) {
        cell.textContent = id==='people' && peopleTab==='doctors' ? 'Referred orders subtotal'
          : id==='panels' && panelTab==='components' ? 'Component allocations subtotal' : 'Filtered total';
      } else if (/share/i.test(header)) {
        cell.textContent = filteredOrders.length ? '100.0%' : '0.0%';
      } else if (rows.some(row=>typeof row[index]==='number')) {
        const sum=rows.reduce((total,row)=>total+(Number(row[index])||0),0);
        cell.textContent=/revenue|net/i.test(header)?money(sum):number(sum);
      } else cell.textContent='—';
    });
    if (id==='people' && peopleTab==='doctors') {
      const note=document.createElement('p');
      note.className='revenue-reconciliation-note';
      note.textContent='Referred orders only. Self / Walk-in bookings are excluded, so this subtotal can be lower than total specialty revenue.';
      table.parentElement.before(note);
    }
    return result;
  };
  ['panels','referral','people','daily'].forEach(id=>renderSpecial(id));
})();
