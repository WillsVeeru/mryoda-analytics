(() => {
  'use strict';
  const formatter = new Intl.DateTimeFormat('en-GB', {day:'numeric', month:'short', year:'numeric', timeZone:'UTC'});
  function formatDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return '';
    const date = new Date(value + 'T00:00:00Z');
    return Number.isNaN(+date) ? '' : formatter.format(date);
  }
  function range(start, end) {
    const first = formatDate(start), last = formatDate(end);
    return first && last && start <= end ? first + (start === end ? '' : ' – ' + last) : '';
  }
  function selectedRange() {
    for (const [start, end] of [['homeFrom','homeTo'],['coFrom','coTo'],['date','endDate']]) {
      const from = document.getElementById(start), to = document.getElementById(end);
      if (from && to) return range(from.value, to.value);
    }
    return '';
  }
  function headingFor(table) {
    for (let node = table; node && !node.matches('main, body, dialog'); node = node.parentElement) {
      for (let previous = node.previousElementSibling; previous; previous = previous.previousElementSibling) {
        if (previous.matches('h2,h3,h4')) return previous;
        // A preceding report has its own date label; never borrow its heading.
        if (previous.querySelector('table')) continue;
        const headings = previous.querySelectorAll('h2,h3,h4');
        if (headings.length) return headings[headings.length - 1];
      }
    }
    return null;
  }
  function tablePeriod(table, heading) {
    const text = heading?.textContent || '';
    const moduleTable = table.closest('#financialOtherModule');
    if (moduleTable && typeof financialModule !== 'undefined') {
      if (financialModule === 'Live CPT') return 'Reference rates · not filtered by date';
      if (financialModule === 'Cost Analysis' && typeof financialPeriod === 'function') {
        const now = financialPeriod(financialCostPeriod), before = financialPeriod(financialCostPeriod, true);
        return now && before ? 'Current: ' + range(now.start, now.end) + ' · Previous: ' + range(before.start, before.end) : 'Choose a valid reporting date';
      }
      if (financialModule === 'Inventory' && /monthly branch stock/i.test(text) && typeof financialPeriod === 'function') {
        const now = financialPeriod(1), before = financialPeriod(1, true);
        return now && before ? 'Current: ' + range(now.start, now.end) + ' · Previous: ' + range(before.start, before.end) : 'Choose a valid reporting date';
      }
    }
    return 'Selected period: ' + (selectedRange() || 'Choose a valid date range');
  }
  function update() {
    const usedHeadings = new Set();
    document.querySelectorAll('main table, dialog table').forEach(table => {
      if (table.closest('#financialFormulaSections, .dashboard-formula-dialog, .select-popover, [data-table-date-managed]')) return;
      const heading = headingFor(table);
      if (heading && usedHeadings.has(heading)) return;
      if (heading) usedHeadings.add(heading);
      let label;
      if (heading) {
        const parent = heading.parentElement;
        if (parent.matches('.rev-heading, .specialty-head, .tp-table-header, .section-heading, .co-section-heading')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'application-table-title-block';
          heading.before(wrapper);
          wrapper.append(heading);
        }
        label = heading.nextElementSibling;
        if (!label?.matches('.application-table-period, .financial-table-period')) {
          label = document.createElement('p');
          label.className = 'application-table-period';
          heading.after(label);
        }
      } else {
        const anchor = table.closest('.co-table-wrap, .table-scroll, .rev-scroll, .specialty-scroll') || table;
        label = anchor.previousElementSibling;
        if (!label?.matches('.application-table-period')) {
          label = document.createElement('p');
          label.className = 'application-table-period';
          anchor.before(label);
        }
      }
      const text = tablePeriod(table, heading);
      if (label.textContent !== text) label.textContent = text;
    });
  }
  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; update(); });
  }
  // Attribute changes are deliberately excluded so styling cannot trigger a loop.
  new MutationObserver(schedule).observe(document.body, {childList:true, subtree:true, characterData:true});
  document.addEventListener('change', schedule);
  document.addEventListener('financialchartsrefresh', schedule);
  update();
})();
