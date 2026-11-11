(() => {
  'use strict';
  // Header meanings drive styling only; values, sorting and exports remain untouched.
  function columnTone(label) {
    const text = label.toLowerCase().replace(/\s+/g, ' ').trim();
    if (/discount/.test(text)) return 'deduction';
    if (/refund|expense|cost/.test(text)) return 'cost';
    if (/contribution|share|target|baseline|yodaara|genetics|specialty/.test(text)) return 'benchmark';
    if (/\bnet\b|realised/.test(text)) return 'result';
    if (/gross|revenue|amount|sales|ticket/.test(text)) return 'inflow';
    return '';
  }
  function applyTableColors() {
    document.querySelectorAll('.rev-scroll table, .specialty-scroll table').forEach(table => {
      const header = table.tHead?.rows[table.tHead.rows.length - 1];
      if (!header) return;
      const tones = [...header.cells].map(cell => columnTone(cell.textContent));
      [...table.rows].forEach(row => {
        let column = 0;
        [...row.cells].forEach(cell => {
          const tone = cell.colSpan === 1 ? tones[column] : '';
          if (tone) cell.dataset.financialTone = tone;
          else delete cell.dataset.financialTone;
          column += cell.colSpan;
        });
      });
    });
  }
  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; applyTableColors(); });
  });
  const main = document.querySelector('main');
  if (main) observer.observe(main, {childList:true, subtree:true, characterData:true});
  applyTableColors();
})();
