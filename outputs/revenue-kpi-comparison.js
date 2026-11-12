(() => {
  'use strict';
  const day = 86400000;
  const parse = value => {
    const date = new Date(value + 'T00:00:00Z');
    return /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(+date) && date.toISOString().slice(0,10) === value ? date : null;
  };
  const iso = date => date.toISOString().slice(0,10);
  function shiftMonth(value, months) {
    const date = parse(value), target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
    const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(date.getUTCDate(), last));
    return iso(target);
  }
  function range(from, to, mode, customFrom, customTo) {
    const start = parse(from), end = parse(to);
    if (!start || !end || start > end) return null;
    if (mode === 'custom') return parse(customFrom) && parse(customTo) && customFrom <= customTo ? [customFrom, customTo] : null;
    if (mode === 'month' || mode === 'year') return [shiftMonth(from, mode === 'month' ? -1 : -12), shiftMonth(to, mode === 'month' ? -1 : -12)];
    const duration = +end - +start + day;
    return [iso(new Date(+start - duration)), iso(new Date(+start - day))];
  }
  function metrics(rows) {
    const total = index => rows.reduce((sum, row) => sum + Number(row[index] || 0), 0);
    const net = total(8), specialty = total(6);
    return [total(5), specialty, net ? specialty / net * 100 : 0, net];
  }
  function covered(rows, from, to) {
    const start = parse(from), end = parse(to);
    if (!start || !end || start > end) return false;
    const dates = new Set(rows.map(row => row[0]));
    for (let date = +start; date <= +end; date += day) if (!dates.has(iso(new Date(date)))) return false;
    return true;
  }
  function delta(current, previous, share) {
    const amount = current - previous, sign = amount > 0 ? '+' : amount < 0 ? '−' : '';
    const amountText = share ? sign + Math.abs(amount).toFixed(2) + ' pp' : sign + '₹' + Math.round(Math.abs(amount)).toLocaleString('en-IN');
    const percent = previous === 0 ? current === 0 ? '0.0%' : 'N/A (zero baseline)' : (amount > 0 ? '+' : amount < 0 ? '−' : '') + Math.abs(amount / previous * 100).toFixed(1) + '%';
    return { text: amountText + ' · ' + percent, tone: amount > 0 ? 'up' : amount < 0 ? 'down' : 'flat' };
  }
  window.revenueKpiComparison = { range, metrics, covered, delta };
  const summary = document.getElementById('revenueSummary'), source = window.revenuePdfSource;
  if (!summary || !source) return;
  const controls = document.createElement('section');
  controls.className = 'revenue-comparison-controls';
  controls.setAttribute('aria-label', 'KPI period comparison');
  controls.innerHTML = '<label for="revenueCompareMode">Compare KPIs with</label><select id="revenueCompareMode"><option value="previous">Previous period</option><option value="month">Same dates last month</option><option value="year">Same dates last year</option><option value="custom">Custom period</option><option value="none">No comparison</option></select><div class="revenue-comparison-custom" hidden><label>From <input type="date" id="revenueCompareFrom"></label><label>To <input type="date" id="revenueCompareTo"></label></div><span class="revenue-comparison-context" role="status"></span>';
  summary.before(controls);
  const mode = controls.querySelector('select'), custom = controls.querySelector('.revenue-comparison-custom');
  const fromInput = controls.querySelector('#revenueCompareFrom'), toInput = controls.querySelector('#revenueCompareTo');
  const context = controls.querySelector('[role="status"]');
  const format = value => parse(value).toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric', timeZone:'UTC'});
  function render() {
    document.querySelectorAll('[data-revenue-comparison]').forEach(node => node.remove());
    custom.hidden = mode.value !== 'custom';
    if (mode.value === 'none') { context.textContent = ''; return; }
    const from = document.getElementById('homeFrom').value, to = document.getElementById('homeTo').value;
    const comparison = range(from, to, mode.value, fromInput.value, toInput.value);
    context.textContent = comparison ? 'Against ' + format(comparison[0]) + ' – ' + format(comparison[1]) : 'Select a valid comparison date range.';
    const filtered = !!window.revenuePdfSnapshotState?.dimensionFiltered;
    const currentRows = source.select(from, to, filtered).base.daily;
    const previousRows = comparison ? source.select(...comparison, filtered).base.daily : [];
    const available = comparison && !filtered && covered(currentRows, from, to) && covered(previousRows, ...comparison);
    const current = metrics(currentRows), previous = metrics(previousRows);
    const cards = [...summary.children];
    cards.forEach((card, index) => {
      if (index > 3) return;
      const change = available ? delta(current[index], previous[index], index === 2) : {text:'Comparison unavailable', tone:'unavailable'};
      const node = document.createElement('div');
      node.dataset.revenueComparison = '';
      node.className = 'revenue-kpi-change';
      node.dataset.change = change.tone;
      node.textContent = change.text;
      node.title = available ? 'Current minus comparison period; percentage uses the absolute comparison baseline.' + (index === 2 ? ' pp means percentage points.' : '') : 'Complete daily data for both periods and the same selected filters is required.';
      card.append(node);
      if (index === 3) {
        const panel = document.querySelector('.wide-banner-summary');
        if (panel) panel.append(node.cloneNode(true));
      }
    });
  }
  const initial = range(document.getElementById('homeFrom').value, document.getElementById('homeTo').value, 'previous');
  if (initial) [fromInput.value, toInput.value] = initial;
  controls.addEventListener('change', render);
  const previousRefresh = refreshHome;
  refreshHome = function () { const result = previousRefresh.apply(this, arguments); render(); return result; };
  render();
})();
