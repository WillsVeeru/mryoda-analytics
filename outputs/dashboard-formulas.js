(() => {
  'use strict';
  const specialty = !!document.getElementById('specialSummary');
  const tests = !!document.getElementById('tpSummary');
  const banner = document.querySelector('.dashboard-summary-split, .dashboard-wide-banner');
  if (!banner) return;
  const common = [
    ['Revenue summary', 'Consolidated realised revenue', 'Routine net revenue + Specialty net revenue', 'Keep routine and specialty activity separate before combining them.'],
    ['Revenue summary', 'Specialty contribution (%)', 'Specialty net revenue ÷ Consolidated realised revenue × 100', 'Displays 0% when consolidated revenue is zero.'],
    ['Report totals', 'Orders / bills', 'Count of distinct order / bill IDs in the selected scope', 'Count each booking once, even if it contains several tests.'],
    ['Report totals', 'Patients', 'Count of distinct patient IDs in the selected scope', 'Patient counts follow the IDs supplied by the source system.'],
    ['Report totals', 'Grouped revenue', 'Sum of revenue for records matching the group and selected filters', 'Applies to channel, panel, package, doctor, staff and date breakdowns.'],
    ['Chart metrics', 'Average ticket', 'Revenue ÷ Number of orders / bills', 'Displays zero when the order / bill count is zero.'],
    ['Chart metrics', 'Revenue share (%)', 'Group revenue ÷ Total revenue in the same scope × 100', 'Use the same revenue basis and filters for both amounts.']
  ];
  const revenue = [
    ['Revenue summary', 'Routine net revenue (clean)', 'Sum of daily routine net revenue, excluding Yodaara bookings', 'KPI cards and breakdown totals use the full filtered daily report, including all pages. Routine net already includes refunds and genetics revenue. The segment report separates genetics from this amount.'],
    ['Revenue summary', 'Specialty revenue', 'Sum of net revenue from specialty bookings', 'Specialty bookings must not also be counted as routine revenue.'],
    ['Daily revenue', 'Gross revenue', 'Sum of charges before discounts and refunds', 'Gross is the starting value before deductions.'],
    ['Daily revenue', 'Discount amount', 'Sum of discounts applied to bookings', 'A discount is a reduction in the billed amount.'],
    ['Daily revenue', 'Net before refunds', 'Gross revenue − Discounts', 'Use this basis when the source net amount excludes refunds.'],
    ['Daily revenue', 'Final net after refunds', 'Gross − Discounts + Signed refunds = Routine net + Specialty net', 'Refunds are stored as negative numbers and already included in routine net. Do not deduct them again.'],
    ['Discount reports', 'Discount (%)', 'Total discount ÷ Total gross revenue × 100', 'Use the ratio of totals, rather than averaging row percentages. Zero gross displays 0%.'],
    ['Discount reports', 'Discounts by approver', 'Sum of discounts grouped by approving user', 'Based on the discount approval log.'],
    ['Collections', 'Payment mode collections', 'Sum of receipts grouped by payment mode', 'Collections and billed revenue can differ because of credit, settlement timing and refunds.'],
    ['Collections', 'Cash / credit sales', 'Sum of billed revenue grouped by payment terms', 'Payment terms describe sales classification; payment mode describes how money was collected.'],
    ['Specialty breakdown', 'Routine segment', 'Routine Net KPI − Genetics & genomics revenue', 'The three segment rows are disjoint and add up to consolidated realised revenue.'],
    ['Specialty breakdown', 'Genetics demo allocation', 'Daily routine net × 562670 ÷ 12196550, rounded per day', 'Reference proportions provide illustrative genetics amounts until test-level classification is connected.'],
    ['Specialty breakdown', 'Monthly specialty share (%)', '(Yodaara revenue + Genetics revenue) ÷ Consolidated revenue for the month × 100', 'Only dates within the selected range are included; partial months remain partial.'],
    ['Booking attribution', 'Booking channel share (%)', 'Channel revenue ÷ Total filtered revenue × 100', 'This proxy uses creating-login categories, not verified marketing acquisition. Demo login details reconcile to their parent channel.'],
    ['Booking attribution', 'Monthly booking channel revenue', 'Sum of channel allocations within each selected month', 'Monthly amounts reconcile to channel totals and the daily report.'],
    ['Specialty breakdown', 'Panel average ticket', 'Panel revenue ÷ Panel bills', 'The total average is total revenue ÷ total bills, rather than a sum or average of displayed row averages.']
  ];
  const special = [
    ['Revenue summary', 'Specialty revenue', 'Sum of filtered specialty order amounts', 'The demo currently uses the amount recorded on each specialty order.'],
    ['Revenue summary', 'Routine baseline comparison', 'Sum of routine net revenue for the same dates and selected scope', 'The current baseline is illustrative, scaled using matching specialty demo orders.'],
    ['Panel reports', 'Canonical panel revenue', 'Sum of order amounts grouped by canonical panel', 'Each specialty order belongs to one canonical panel.'],
    ['Panel reports', 'Component test allocation', 'Attributed component amount from the parent panel', 'Demo allocation: FRAAT / autism uses the parent amount; Vitamin D and AFP each use half the DNA Decoder amount. These views overlap and must not be added to panel revenue.'],
    ['Referral reports', 'Referral order share (%)', 'Orders from the referral source ÷ All filtered specialty orders × 100', 'This report measures order share, rather than revenue share. Zero orders displays 0%.'],
    ['People reports', 'Doctor revenue', 'Sum of specialty order amounts grouped by doctor', 'The current doctor report excludes orders marked Self.'],
    ['People reports', 'Staff revenue', 'Sum of specialty order amounts grouped by booking staff', 'Uses the same selected dates and filters.'],
    ['Daily reports', 'Daily specialty net', 'Sum of specialty order amounts for the date', 'Daily order count is the number of specialty bookings for that date.']
  ];
  const testFormulas = [
    ['Summary metrics', 'Total Bills', 'Count of distinct bill IDs in the filtered test records', 'The banner uses the same filtered records as the KPI cards and tables. Count each bill once, even when it contains multiple tests.'],
    ['Summary metrics', 'Total Tests', 'Number of filtered test records', 'The current demo stores one test per record with quantity 1.'],
    ['Summary metrics', 'Unique Patients', 'Count of distinct patient IDs in the filtered records', 'The demo creates visit-specific patient IDs; cross-visit identity requires the live source.'],
    ['Summary metrics', 'Revisits', 'Count of distinct patient IDs marked Revisit', 'A patient with multiple matching test records is counted once.'],
    ['Summary metrics', 'New Visits', 'Unique Patients − Revisits', 'Uses the same date range, header filters, search and chart selections.'],
    ['Summary metrics', 'VIP Bills', 'Not modeled in the current demo; displayed as 0', 'No VIP flag is present in the sample records. Live VIP counts require source data.'],
    ['Report metrics', 'Grouped test volume', 'Sum of test quantities for the category, test, package or date', 'Every current demo record has quantity 1, so the grouped volume matches the number of records.'],
    ['Report metrics', 'Workload Share (%)', 'Category test volume ÷ Total filtered test records × 100', 'Displays zero when no records match the filters.'],
    ['Report metrics', 'Revenue', 'Sum of recorded amounts in the filtered group', 'Uses each test record’s amount, not an independently seeded summary.'],
    ['Report metrics', 'Average per Test', 'Grouped revenue ÷ Grouped test volume', 'Displays zero when test volume is zero.'],
    ['Report metrics', 'Package volume and revenue', 'Grouped test quantity and recorded amount for each package', 'Individual test bookings are excluded from the package report, so its subtotal can be lower than all tests.'],
    ['Report metrics', 'Daily Bills', 'Count of distinct bill IDs within each date', 'Uses the filtered records for the selected date.'],
    ['Report metrics', 'Daily Barcodes', 'Demo proxy: count of distinct bill IDs within each date', 'Dedicated barcode IDs are not stored in the sample records.']
  ];
  const formulas = tests ? testFormulas : [...common, ...(specialty ? special : revenue)];
  const toolbar = document.createElement('div');
  toolbar.className = 'dashboard-formula-actions';
  const open = document.createElement('button');
  open.type = 'button';
  open.textContent = 'FORMULAS';
  open.setAttribute('aria-haspopup', 'dialog');
  toolbar.append(open);
  const titleBlock = banner.querySelector('.dashboard-wide-banner > div') || banner.querySelector(':scope > div');
  if (titleBlock) titleBlock.append(toolbar);
  const dialog = document.createElement('dialog');
  dialog.className = 'dashboard-formula-dialog';
  dialog.setAttribute('aria-labelledby', 'dashboardFormulaTitle');
  dialog.innerHTML = '<header class="dashboard-formula-heading"><div><span class="dashboard-formula-eyebrow"></span><h2 id="dashboardFormulaTitle">Financial Formulas</h2><p></p></div><button type="button" aria-label="Close formulas">×</button></header><div class="dashboard-formula-body"><p class="dashboard-formula-notice">Metric definitions and calculation notes.</p><input type="search" aria-label="Search formulas" placeholder="Search metrics or formulas…"><div class="dashboard-formula-count" role="status"></div><div class="dashboard-formula-list"></div></div>';
  document.body.append(dialog);
  dialog.querySelector('#dashboardFormulaTitle').textContent = tests ? 'Tests & Patients Formulas' : specialty ? 'Specialty Formulas' : 'Revenue & Sales Formulas';
  const pageName = tests ? 'Tests & Patients' : specialty ? 'Specialty' : 'Revenue & Sales';
  dialog.querySelector('.dashboard-formula-eyebrow').textContent = pageName;
  function syncHeader(){
    const from=document.getElementById('homeFrom')?.value,to=document.getElementById('homeTo')?.value;
    const dateFormat=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
    const valid=from&&to&&from<=to&&!Number.isNaN(Date.parse(from+'T00:00:00Z'))&&!Number.isNaN(Date.parse(to+'T00:00:00Z'));
    const period=valid?'Selected '+(from===to?'date: ':'dates: ')+dateFormat.format(new Date(from+'T00:00:00Z'))+(from===to?'':' – '+dateFormat.format(new Date(to+'T00:00:00Z'))):'Choose a valid reporting period';
    dialog.querySelector('.dashboard-formula-heading p').textContent=period+' · Metric definitions and calculation rules';
  }
  syncHeader();
  dialog.querySelector('.dashboard-formula-notice').textContent = tests
    ? 'KPI cards, the banner and reports use the same filtered test records. Chart selections and search are included. VIP and barcode limitations are documented below.' : specialty
    ? 'Demo data: specialty KPI cards and reports use the same filtered orders. Routine baseline and component allocations are illustrative. Doctor revenue excludes Self orders; component views overlap with panel revenue.'
    : 'Demo data: KPI cards and full-report totals use the filtered daily report. Channel, payment-term and discount-approver breakdowns are demo allocations. Collections and top-package subtotals have different scopes and are labelled separately. Live values require source integration.';
  const list = dialog.querySelector('.dashboard-formula-list');
  const search = dialog.querySelector('input');
  function render() {
    const query = search.value.trim().toLowerCase();
    const sourceFormulas = !tests && !specialty && window.revenuePdfSource ? formulas
      .filter(row => row[1] !== 'Genetics demo allocation')
      .map(row => row[0] === 'Booking attribution' ? [row[0],row[1],row[2],'Imported creating-login proxy values are preserved as printed. Only visible PDF rows are available; collapsed or paginated details are not reconstructed.'] : row) : formulas;
    const matches = sourceFormulas.filter(row => row.join(' ').toLowerCase().includes(query));
    list.replaceChildren();
    let currentGroup = '';
    matches.forEach(([group, title, calculation, note]) => {
      if (currentGroup !== group) {
        const heading = document.createElement('h3');
        heading.textContent = group;
        list.append(heading);
        currentGroup = group;
      }
      const article = document.createElement('article');
      for (const [tag, text] of [['h4', title], ['div', calculation], ['p', note]]) {
        const child = document.createElement(tag);
        child.textContent = text;
        article.append(child);
      }
      list.append(article);
    });
    dialog.querySelector('[role="status"]').textContent = matches.length ? matches.length + ' formulas' : 'No matching formulas';
  }
  open.addEventListener('click', () => {
    syncHeader();
    if(!tests && !specialty && window.revenuePdfSource) dialog.querySelector('.dashboard-formula-notice')?.remove();
    search.value = ''; render(); dialog.showModal(); search.focus();
  });
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  search.addEventListener('input', render);
})();
