(() => {
  'use strict';
  const banner = document.querySelector('.application-title-strip, .tp-hero');
  if (!banner) return;
  const source = document.querySelector('#homeKPIs, #revenueSummary, #specialSummary, #tpSummary');
  if (!source) return;
  banner.classList.add('dashboard-wide-banner');
  const existing = banner.querySelector('.home-strip-revenue');
  const panel = existing || document.createElement('aside');
  panel.className = 'wide-banner-summary';
  panel.setAttribute('aria-label', 'Selected scope summary');
  panel.innerHTML = '<div class="wide-banner-summary-heading"><span data-banner-label></span><span class="wide-banner-summary-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h1m10 0h1"/></svg></span></div><div class="wide-banner-summary-value" data-banner-value></div><div class="wide-banner-summary-details"><span data-banner-detail="0"></span><span data-banner-detail="1"></span></div>';
  if (!existing) banner.append(panel);
  if (banner.dataset.summaryLayout === 'split-view') {
    const split = document.createElement('section');
    split.className = 'dashboard-summary-split';
    split.setAttribute('aria-label', 'Split View summary');
    banner.before(split);
    split.append(banner, source);
    const note = document.createElement('p');
    note.className = 'split-summary-note';
    note.textContent = 'Sample data · Live integration pending';
    banner.querySelector(':scope > div').append(note);
  }
  const set = (selector, value) => {
    const node = panel.querySelector(selector);
    if (node.textContent !== value) node.textContent = value;
  };
  const money = value => '₹' + Math.round(value).toLocaleString('en-IN');
  const numeric = value => Number(value.replace(/[^\d.-]/g, '')) || 0;
  function sync() {
    const values = [...source.querySelectorAll(':scope > section > strong, :scope > .tp-stat > strong')].map(node => node.textContent.trim());
    let label, value, details;
    if (source.id === 'homeKPIs') {
      const totals = [0, 0, 0];
      document.querySelectorAll('#revenueTable tbody tr').forEach(row => {
        if (row.cells.length !== 6) return;
        totals.forEach((_, index) => totals[index] += numeric(row.cells[index + 3].textContent));
      });
      label = 'Net Revenue'; value = money(totals[2]);
      details = ['Gross: ' + money(totals[0]), 'Discount: ' + money(totals[1])];
    } else if (source.id === 'revenueSummary') {
      label = 'Consolidated Realised Revenue'; value = values[3] || '₹0';
      details = ['Routine: ' + (values[0] || '₹0'), 'Specialty: ' + (values[1] || '₹0')];
    } else if (source.id === 'specialSummary') {
      label = 'Consolidated Realised Revenue'; value = values[3] || '₹0';
      details = ['Routine: ' + (values[1] || '₹0'), 'Specialty: ' + (values[0] || '₹0')];
    } else {
      label = 'Total Bills'; value = values[0] || '0';
      details = ['Patients: ' + (values[2] || '0'), 'Tests: ' + (values[1] || '0')];
    }
    set('[data-banner-label]', label);
    set('[data-banner-value]', value);
    details.forEach((detail, index) => set('[data-banner-detail="' + index + '"]', detail));
  }
  const observer = new MutationObserver(sync);
  observer.observe(source, { childList: true, subtree: true, characterData: true });
  const revenueTable = document.getElementById('revenueTable');
  if (source.id === 'homeKPIs' && revenueTable) observer.observe(revenueTable, { childList: true, subtree: true, characterData: true });
  sync();
})();
