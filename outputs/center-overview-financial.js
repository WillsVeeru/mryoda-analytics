/* Financial reports share the center workspace's location and period filters. */
const financialViews = [
  ['branch', 'Branch wise', 'Branch'],
  ['pro', 'PRO wise', 'PRO'],
  ['client', 'Client wise', 'Client'],
  ['department', 'Department wise', 'Department'],
  ['test', 'Test wise', 'Test']
];
let financialView = 'branch';
const financialSampleTests = {
  BIOCHEMISTRY: ['Glucose', 'Creatinine'],
  HAEMATOLOGY: ['Complete Blood Count', 'Hemoglobin'],
  'SEROLOGY / IMMUNOLOGY': ['CRP', 'Hepatitis B Surface Antigen'],
  MICROBIOLOGY: ['Urine Culture', 'Blood Culture']
};

function financialDoctorAssignment(row) {
  if (row.doctor) return {doctor:row.doctor, doctorSource:'source'};
  if (row.type === 'Walk-in') return {doctor:'Self / Walk-in', doctorSource:'demo'};
  const seed = [row.centerId,row.id,row.employeeId,row.category].join('|');
  const hash = [...seed].reduce((value,character) => (value * 31 + character.charCodeAt(0)) >>> 0, 0);
  return {doctor:['Demo Doctor A','Demo Doctor B','Demo Doctor C'][hash % 3], doctorSource:'demo'};
}

function financialTestRows(records) {
  const rows = [];
  for (const record of records) {
    const names = financialSampleTests[record.category];
    if (!names || record.tests < 2) {
      rows.push({ ...record, test: names?.[0] || record.category });
      continue;
    }
    const firstCount = Math.ceil(record.tests / 2);
    const firstRevenue = Math.round(record.net * firstCount / record.tests);
    rows.push({ ...record, test: names[0], tests: firstCount, net: firstRevenue });
    rows.push({ ...record, test: names[1], tests: record.tests - firstCount, net: record.net - firstRevenue });
  }
  return rows;
}


const financialModules = ['Overall Revenue', 'Cost Analysis', 'Profit & Loss', 'Live CPT', 'Inventory', 'Cash Flow Statement'];
const sampleCptRates = new Map(Object.values(financialSampleTests).flat().map((test, index) => [test.toLowerCase(), 65 + index * 20]));
let cptRates = sampleCptRates;
let cptUpload = '';
let financialModule = 'Overall Revenue';
let financialTrail = [];
let financialBranchPath = 'client';
let financialCostPeriod = 1;
const financialTablePageStates = new Map();
const financialTableControllers = new WeakMap();
let financialHeaderClientType = 'all';
let financialHeaderClient = 'all';
const financialMultiFilters = new Map();
const financialMultiFilterIds = new Set(['coCenter', 'coCity', 'coZone', 'financialHeaderClient',
  'financialCategory', 'financialDoctor', 'financialRep']);
function financialMultiMatches(id, value) {
  const selected = financialMultiFilters.get(id);
  return !selected || selected.has(value);
}
const financialOriginalLocationMatches = centerLocationMatches;
centerLocationMatches = function (center) {
  const zone = {hyderabad:'South', bengaluru:'South', chennai:'South', mumbai:'West', delhi:'North'}[center.id];
  return financialOriginalLocationMatches(center) && financialMultiMatches('coCenter', center.id) &&
    financialMultiMatches('coCity', center.name) && financialMultiMatches('coZone', zone);
};

function financialHeaderTypeMatches(row, type = financialHeaderClientType) {
  return type === 'all' || (type === 'B2B' ? row.type === 'B2B' : row.clientType === type);
}

function financialApplyHeaderFilters(records) {
  return records.filter(row => financialHeaderTypeMatches(row) &&
    (financialHeaderClient === 'all' || row.clientKey === financialHeaderClient) &&
    financialMultiMatches('financialHeaderClient', row.clientKey) &&
    financialMultiMatches('financialCategory', row.department) &&
    (financialMultiMatches('financialRep', row.proId) || financialMultiMatches('financialRep', row.representativeId)) &&
    financialMultiMatches('financialDoctor', row.doctor));
}

function financialScopedRecords(records) {
  const centerIds = new Set(currentCenterRows.map(row => row.id));
  return records.filter(row => centerIds.has(row.centerId));
}

function syncFinancialGlobalScope() {
  const scope = co('coWorkspaceChartScope');
  if (!scope) return;
  const label = scope.textContent.replace(/^Global filters\s*\u00b7\s*/, '');
  scope.textContent = 'Global filters \u00b7 ' + label;
  scope.setAttribute('role', 'status');
  scope.setAttribute('aria-live', 'polite');
}

const financialSummaryDesigns = {
  'Wide Banner': 'wide-banner',
  'Split View': 'split-view'
};

function setFinancialSummaryLayout(name) {
  const layout = financialSummaryDesigns[name];
  if (layout) document.body.dataset.financialSummaryLayout = layout;
}

function syncFinancialSummaryAlternative() {
  const hero = document.querySelector('.co-main > .co-hero');
  const kpis = co('coKpis');
  if (!hero || !kpis) return;
  const bannerTitle = hero.querySelector('h1');
  if (bannerTitle && bannerTitle.textContent !== 'Branch Overview') bannerTitle.textContent = 'Branch Overview';
  hero.classList.add('financial-wide-banner');
  kpis.classList.add('financial-wide-kpis');
  hero.dataset.designName = kpis.dataset.designName = 'Wide Banner';
  if (!document.body.dataset.financialSummaryLayout) setFinancialSummaryLayout('Split View');
  let layout = co('financialSummaryAlternative');
  if (!layout) {
    layout = document.createElement('section');
    layout.id = 'financialSummaryAlternative';
    layout.className = 'financial-summary-split';
    layout.dataset.designName = 'Split View';
    layout.setAttribute('aria-label', 'Financial Overview — Split View');
    kpis.insertAdjacentElement('afterend', layout);
  }
  const copies = [hero, kpis].map(source => {
    const copy = source.cloneNode(true);
    copy.classList.remove('financial-wide-banner', 'financial-wide-kpis');
    copy.dataset.designName = 'Split View';
    for (const node of [copy, ...copy.querySelectorAll('[id]')]) {
      if (node.id) node.id = 'financial-alt-' + node.id;
    }
    const title = copy.querySelector('h1');
    if (title) {
      const heading = document.createElement('h2');
      heading.textContent = title.textContent;
      title.replaceWith(heading);
    }
    return copy;
  });
  layout.replaceChildren(...copies);
}

function financialHeaderSelectField(id, label, options) {
  const field = document.createElement('label');
  field.className = 'co-field financial-header-only';
  const caption = document.createElement('span');
  caption.className = 'financial-header-label';
  caption.textContent = label;
  const select = document.createElement('select');
  select.id = id;
  for (const [value, text] of options) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    select.appendChild(option);
  }
  select.addEventListener('change', () => changeFinancialHeaderFilter(id, select.value));
  field.append(caption, select);
  return field;
}

function mountFinancialOverviewHeader() {
  if (co('financialHeaderClientType')) return;
  const header = document.querySelector('.co-main > .co-header');
  const dateRow = header?.querySelector('.co-date-row');
  const locationRow = header?.querySelector('.co-location-row');
  if (!dateRow || !locationRow) return;

  const dateArrow = document.createElement('span');
  dateArrow.className = 'financial-date-arrow financial-header-only';
  dateArrow.setAttribute('aria-hidden', 'true');
  dateArrow.textContent = '\u2192';
  dateRow.insertBefore(dateArrow, dateRow.children[1]);

  const centerField = co('coCenter').closest('label');
  const centerCaption = document.createElement('span');
  centerCaption.className = 'financial-header-label financial-header-only';
  centerCaption.textContent = 'Centre';
  centerField.insertBefore(centerCaption, co('coCenter'));

  const typeField = financialHeaderSelectField('financialHeaderClientType', 'Client Type', [
    ['all', 'All'], ['B2B', 'B2B'], ['Walk-In', 'Walk-In'], ['Credit Client', 'Credit Client'],
    ['Cash & Carry', 'Cash & Carry'], ['Rolling Advance', 'Rolling Advance']
  ]);
  const clientField = financialHeaderSelectField('financialHeaderClient', 'Client', [['all', 'All']]);
  locationRow.insertBefore(typeField, co('coMoreToggle'));
  locationRow.insertBefore(clientField, co('coMoreToggle'));

  const snapshot = document.createElement('span');
  snapshot.className = 'financial-header-snapshot financial-header-only';
  const snapshotDate = new Date(centerToday + 'T00:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
  });
  snapshot.textContent = 'Demo snapshot \u00b7 ' + snapshotDate;

  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'co-btn financial-header-reset financial-header-only';
  reset.setAttribute('aria-label', 'Reset Financial Overview filters');
  reset.innerHTML = dashboardIcon('RotateCcw');
  reset.addEventListener('click', resetFinancialOverviewFilters);
  locationRow.append(snapshot, reset);
  const more = co('coMoreFilters');
  for (const [id, label, options] of [
    ['financialCategory', 'Test Category', [['all', 'All'], ...Object.keys(financialSampleTests).map(name => [name, name])]],
    ['financialDoctor', 'Doctor', [['all', 'All']]],
    ['financialRep', 'PRO / Sales Rep', [['all', 'All']]]
  ]) more.appendChild(financialHeaderSelectField(id, label, options));
  co('financialDoctor').closest('label').title = 'Search and select doctors. Demo directory; live doctor data is not connected.';
}

function syncFinancialHeaderClientOptions(records) {
  const typeSelect = co('financialHeaderClientType');
  const clientSelect = co('financialHeaderClient');
  if (!typeSelect || !clientSelect) return;
  typeSelect.value = financialHeaderClientType;
  const clients = new Map();
  records.filter(row => financialHeaderTypeMatches(row)).forEach(row => clients.set(row.clientKey, row.name));
  const available = [...clients.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  if (financialHeaderClient !== 'all' && !clients.has(financialHeaderClient)) financialHeaderClient = 'all';
  clientSelect.replaceChildren();
  const all = document.createElement('option');
  all.value = 'all';
  all.textContent = 'All';
  clientSelect.appendChild(all);
  for (const [value, text] of available) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    clientSelect.appendChild(option);
  }
  clientSelect.value = financialHeaderClient;
  const doctorSelect = co('financialDoctor');
  if (doctorSelect) {
    const doctors = new Map();
    records.forEach(row => {
      if (row.doctor) doctors.set(row.doctor, (doctors.get(row.doctor) || 0) + row.tests);
    });
    const directory = [...doctors].sort(([a],[b]) => a.localeCompare(b));
    const signature = JSON.stringify(directory);
    doctorSelect.dataset.demoDirectory = String(records.some(row => row.doctorSource === 'demo'));
    if (doctorSelect.dataset.signature !== signature) {
      doctorSelect.replaceChildren(new Option('All','all'));
      for (const [name, count] of directory) {
        const option = new Option(name,name);
        option.dataset.testCount = String(count);
        doctorSelect.appendChild(option);
      }
      doctorSelect.dataset.signature = signature;
    }
    doctorSelect.disabled = !directory.length;
  }
  const repSelect = co('financialRep');
  if (repSelect) {
    const reps = new Map(records.flatMap(row => [[row.proId, row.pro], [row.representativeId, row.representative]]).filter(([id]) => id));
    const signature = JSON.stringify([...reps]);
    if (repSelect.dataset.signature !== signature) {
      repSelect.replaceChildren(new Option('All', 'all'));
      for (const [id, name] of reps) repSelect.appendChild(new Option(name, id));
      repSelect.dataset.signature = signature;
    }
  }
}

function changeFinancialHeaderFilter(id, value) {
  if (id === 'financialHeaderClientType') {
    financialHeaderClientType = value;
    financialHeaderClient = 'all';
    financialMultiFilters.delete('financialHeaderClient');
  } else if (id === 'financialHeaderClient') {
    financialHeaderClient = value;
  }
  financialTrail = [];
  renderFinancialReport();
}

function resetFinancialOverviewFilters() {
  financialMultiFilters.clear();
  financialHeaderClientType = 'all';
  financialHeaderClient = 'all';
  if (co('financialClientType')) co('financialClientType').value = 'all';
  resetCenterFilters();
}

const financialResetGlobalFilters = resetCenterFilters;
resetCenterFilters = function () {
  financialMultiFilters.clear();
  financialHeaderClientType = 'all';
  financialHeaderClient = 'all';
  centerSalesState.signature = '';
  return financialResetGlobalFilters.apply(this, arguments);
};

function financialLedger(applyHeaderFilters = true) {
  const allocations = new Map(financialScopedRecords(centerInsightState.records).map(row => [row.employeeId, row.discount]));
  const byEmployee = new Map();
  for (const row of financialTestRows(financialScopedRecords(centerSalesState.records))) {
    if (!byEmployee.has(row.employeeId)) byEmployee.set(row.employeeId, []);
    byEmployee.get(row.employeeId).push(row);
  }
  const ledger = [...byEmployee.values()].flatMap(rows => {
    const discounts = splitCenterActivity(allocations.get(rows[0].employeeId) || 0, rows.map(row => row.net));
    return rows.map((row, index) => {
      const rate = cptRates.get(row.test.toLowerCase());
      return {
        ...row,
        ...financialDoctorAssignment(row),
        department: row.category,
        name: row.type === 'Walk-in' ? 'Yoda Walk-In' : row.name,
        clientKey: row.type === 'Walk-in' ? 'walk-in' : row.id,
        clientType: row.type === 'Walk-in' ? 'Walk-In' : ({1:'Rolling Advance', 2:'Cash & Carry', 3:'Credit Client'}[row.index] || 'B2B'),
        discount: discounts[index],
        gross: row.net + discounts[index],
        cost: rate === undefined && row.tests ? null : (rate || 0) * row.tests,
        referral: row.type === 'Walk-in' ? Math.round(row.net * .05) : 0
      };
    });
  });
  return applyHeaderFilters ? financialApplyHeaderFilters(ledger) : ledger;
}

function financialTotals(records) {
  return records.reduce((sum, row) => ({
    tests: sum.tests + row.tests, gross: sum.gross + row.gross, discount: sum.discount + row.discount,
    net: sum.net + row.net, referral: sum.referral + row.referral,
    cost: sum.cost === null || row.cost === null ? null : sum.cost + row.cost
  }), { tests: 0, gross: 0, discount: 0, net: 0, referral: 0, cost: 0 });
}

function financialPath() {
  if (financialView === 'branch') return financialBranchPath === 'client' ? ['branch','client','department','test'] : ['branch','department','test'];
  if (financialView === 'pro') return ['pro','client','department','test'];
  return financialView === 'test' ? ['test'] : [financialView, ...(financialView === 'client' ? ['department','test'] : ['test'])];
}

const financialGroupFields = { branch: 'centerId', pro: 'proId', client: 'clientKey', department: 'department', test: 'test' };
function financialReportGroups(records, level) {
  const groups = new Map();
  for (const row of records) {
    const key = row[financialGroupFields[level]];
    if (!groups.has(key)) groups.set(key, {
      key,
      name: row[{branch:'center',pro:'pro',client:'name',department:'department',test:'test'}[level]],
      records: []
    });
    groups.get(key).records.push(row);
  }
  return [...groups.values()].map(group => ({ ...group, ...financialTotals(group.records) })).sort((a,b) => b.net - a.net);
}

const financialAmount = value => value === null ? '—' : centerMoney(value);
function financialToneClass(header) {
  const label = String(header || '').replace(/<[^>]*>/g, ' ').trim().toLowerCase();
  if (/net margin|margin|profit|available credit|net cash movement|net revenue|^net$/.test(label)) return 'financial-tone-result';
  if (/discount|referral/.test(label)) return 'financial-tone-deduction';
  if (/cost|expense|cash paid|consumption|stock used|outstanding/.test(label)) return 'financial-tone-cost';
  if (/gross|revenue|cash received|cash brought in/.test(label)) return 'financial-tone-inflow';
  if (/target|credit limit/.test(label)) return 'financial-tone-benchmark';
  return '';
}

function financialCells(row, tag, headers) {
  return row.map((value, index) => {
    const tone = financialToneClass(headers[index]);
    return '<' + tag + (tone ? ' class="' + tone + '"' : '') + '>' + value + '</' + tag + '>';
  }).join('');
}

function financialTable(headers, rows, total) {
  const cells = (row, tag) => financialCells(row, tag, headers);
  return '<div class="co-table-wrap"><table class="co-table co-financial-table"><thead><tr>' + cells(headers,'th') +
    '</tr></thead><tbody>' + (rows.map(row => '<tr>' + cells(row,'td') + '</tr>').join('') ||
    '<tr><td class="co-empty" colspan="' + headers.length + '">No records match this scope.</td></tr>') +
    '</tbody>' + (total ? '<tfoot><tr>' + cells(total,'td') + '</tr></tfoot>' : '') + '</table></div>';
}

function financialTableArrow() {
  return '<svg class="financial-action-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
}

function financialDrillButton(name, index, nextLevel) {
  const action = {client:'View clients', department:'View departments', test:'View tests'}[nextLevel] || 'View details';
  return '<button type="button" class="financial-drill-button" onclick="openFinancialGroup(' + index + ')" aria-controls="financialReportRows">' +
    '<span class="financial-drill-name">' + name + '</span>' +
    '<span class="financial-drill-action">' + action + financialTableArrow() + '</span></button>';
}

function renderFinancialReport() {
  syncFinancialGlobalScope();
  syncFinancialSummaryAlternative();
  syncFinancialHeaderClientOptions(financialLedger(false));
  co('financialRevenueModule').hidden = financialModule !== 'Overall Revenue';
  co('financialOtherModule').hidden = financialModule === 'Overall Revenue';
  [...co('financialModules').children].forEach(button => button.setAttribute('aria-pressed', String(button.textContent === financialModule)));
  if (financialModule !== 'Overall Revenue') {
    renderFinancialModule();
    return;
  }
  const path = financialPath();
  const level = path[financialTrail.length];
  const drillable = financialTrail.length < path.length - 1;
  const clientFilter = financialView === 'client' || (financialView === 'branch' && financialBranchPath === 'client' && financialTrail.length > 0);
  co('financialClientFilter').hidden = !clientFilter;
  const type = clientFilter ? co('financialClientType').value : 'all';
  const records = financialLedger().filter(row =>
    (type === 'all' || (type === 'B2B' ? row.type === 'B2B' : row.clientType === type)) &&
    financialTrail.every(step => row[financialGroupFields[step.level]] === step.key)
  );
  co('financialReportPanel').setAttribute('aria-labelledby', 'financial-tab-' + financialView);
  for (const [key] of financialViews) {
    const tab = co('financial-tab-' + key);
    tab.setAttribute('aria-selected', String(key === financialView));
    tab.tabIndex = key === financialView ? 0 : -1;
  }
  const rootLabel = {branch:'All branches', pro:'All PROs', client:'All clients', department:'All departments', test:'All tests'}[financialView];
  let controls = financialTrail.length ? '<button type="button" class="co-btn" onclick="financialBack()">Back</button>' +
    '<nav class="financial-breadcrumbs" aria-label="Financial report breadcrumbs"><ol><li>' +
    '<button type="button" data-financial-depth="0" onclick="navigateFinancialBreadcrumb(0)">' + rootLabel + '</button></li>' +
    financialTrail.map((step, index) => '<li><span aria-hidden="true">&#8250;</span>' +
      (index === financialTrail.length - 1 ?
        '<span class="financial-breadcrumb-current" aria-current="page" tabindex="-1" data-financial-depth="' + (index + 1) + '">' + centerEscape(step.name) + '</span>' :
        '<button type="button" data-financial-depth="' + (index + 1) + '" onclick="navigateFinancialBreadcrumb(' + (index + 1) + ')">' +
        centerEscape(step.name) + '</button>') + '</li>').join('') + '</ol></nav>' : '';
  if (financialView === 'branch') controls += '<label>Drill down by <select onchange="changeFinancialBranchPath(this.value)"><option value="client"' +
    (financialBranchPath === 'client' ? ' selected' : '') + '>Client then department</option><option value="department"' +
    (financialBranchPath === 'department' ? ' selected' : '') + '>Department directly</option></select></label>';
  co('financialDrillControls').innerHTML = controls;

  const proSummary = level === 'pro';
  const proDetail = financialView === 'pro' && !proSummary;
  const showCost = level === 'branch' || (level === 'test' && financialView !== 'department') || (level === 'client' && !proDetail);
  const showReferral = !proDetail && (proSummary || level === 'client' || financialView === 'client' && level === 'department' || financialView === 'department' && level === 'test');
  const showCount = level === 'branch' || level === 'test';
  const showMargin = level === 'branch' || showReferral;
  const marginLabel = showReferral ? 'Net Margin' : 'Margin';
  const clientNetMargin = financialView === 'client' && showReferral;
  const marginFormula = showReferral ? (clientNetMargin ? 'Net − Cost − Referral' : 'Net − Referral') : 'Net − Cost';
  const showCredit = level === 'client' && type === 'Credit Client';
  const headers = [financialViews.find(([key]) => key === level)[2]];
  if (level === 'client') headers.push('Type','PRO');
  if (showCount) headers.push('Tests');
  if (proSummary) headers.push('Target');
  headers.push('Gross','Discount','Net');
  if (showCost) headers.push('Cost');
  if (showReferral) headers.push('Referral');
  if (showMargin) headers.push(marginLabel);
  if (showCredit) headers.push('Credit Limit', 'Outstanding Amount', 'Available Credit', 'Credit Status', 'Review');
  const days = centerDateRange(co('coFrom').value, co('coTo').value)?.length || 0;
  function values(group, label, target, groupIndex = null) {
    const row = [label];
    if (level === 'client') {
      const types = new Set(group.records.map(record => record.clientType));
      const pros = new Set(group.records.map(record => record.pro));
      const assigned = new Set(group.records.map(record => record.proId));
      const proName = pros.size === 1 ? centerEscape([...pros][0]) : '—';
      const proLink = groupIndex !== null && financialView !== 'pro' && assigned.size === 1 &&
        [...assigned][0] && [...assigned][0] !== 'NO-PRO' ?
        '<button type="button" class="financial-pro-link" onclick="openFinancialClientPRO(' + groupIndex + ')" title="View this PRO in the PRO-wise report">' +
        proName + financialTableArrow() + '</button>' : proName;
      row.push(types.size === 1 ? centerEscape([...types][0]) : '—', proLink);
    }
    if (showCount) row.push(centerNumber(group.tests));
    if (proSummary) row.push(financialAmount(target));
    row.push(financialAmount(group.gross),financialAmount(group.discount),financialAmount(group.net));
    if (showCost) row.push(financialAmount(group.cost));
    if (showReferral) row.push(financialAmount(group.referral));
    if (showMargin) row.push(financialAmount(showReferral ? financialNetMargin(group, clientNetMargin) : (group.cost === null ? null : group.net - group.cost)));
    return row;
  }
  const groups = financialReportGroups(records, level);
  const targetFor = group => group.key === 'NO-PRO' ? null : 50000 * days;
  const cells = (row, tag) => financialCells(row, tag, headers);
  co('financialReportHead').innerHTML = '<tr>' + cells(headers,'th') + '</tr>';
  co('financialReportRows').innerHTML = groups.map((group, index) => {
    const name = centerEscape(group.name);
    const label = drillable ? financialDrillButton(name, index, path[financialTrail.length + 1]) : name;
    const row = values(group, label, targetFor(group), index);
    if (showCredit) {
      const credit = financialClientCredit(group);
      row.push(credit ? centerMoney(credit.limit) : '—', credit ? centerMoney(credit.outstanding) : '—',
        credit ? centerMoney(credit.available) : '—',
        credit ? '<span class="financial-credit-status ' + credit.tone + '">' + credit.status + '</span>' : 'Unavailable',
        credit && credit.tone !== 'healthy' ? '<button type="button" class="co-btn co-detail-view" onclick="reviewFinancialCredit(' + index + ')">Review Limit</button>' : '—');
    }
    return '<tr>' + cells(row, 'td') + '</tr>';
  }).join('') || '<tr><td class="co-empty" colspan="' + headers.length + '">No records match this scope.</td></tr>';
  co('financialReportTotals').innerHTML = '<tr>' + cells([...values({ ...financialTotals(records), records }, 'Total',
    groups.reduce((sum, group) => sum + (targetFor(group) || 0), 0)), ...(showCredit ? ['—', '—', '—', '—', ''] : [])], 'td') + '</tr>';
  co('financialReportNote').textContent = 'Sample LIS activity, targets and Walk-In referrals. Net = gross − discount. ' +
    (showCost ? 'CPT cost = tests × rate. ' : '') +
    (showMargin ? marginLabel + ' = ' + marginFormula + '. ' : '') +
    (clientFilter ? 'B2B includes Cash & Carry, Rolling Advance and Credit Client accounts.' : '') +
    (showCredit ? ' Sample credit balances are account snapshots. Near Limit starts at 80% usage.' : '') +
    ' Doctor assignments are illustrative until a live directory is connected.';
  financialVisibleGroups = groups;
  financialFormulaTotals = financialTotals(records);
  enhanceFinancialTables();
}

let financialVisibleGroups = [];
let financialFormulaTotals;
function openFinancialGroup(index) {
  const group = financialVisibleGroups[index];
  if (!group || financialTrail.length >= financialPath().length - 1) return;
  financialTrail.push({ key: group.key, name: group.name, level: financialPath()[financialTrail.length] });
  renderFinancialReport();
}
function financialBack() {
  financialTrail.pop();
  renderFinancialReport();
}
function openFinancialClientPRO(index) {
  const records = financialVisibleGroups[index]?.records || [];
  const ids = new Set(records.map(record => record.proId));
  const pro = records[0];
  if (!pro || ids.size !== 1 || !pro.proId || pro.proId === 'NO-PRO') return;
  financialView = 'pro';
  financialTrail = [{ level: 'pro', key: pro.proId, name: pro.pro }];
  renderFinancialReport();
  co('financial-tab-pro')?.focus();
}
function navigateFinancialBreadcrumb(depth) {
  if (!Number.isInteger(depth) || depth < 0 || depth > financialTrail.length) return;
  financialTrail = financialTrail.slice(0, depth);
  renderFinancialReport();
  const target = co('financialDrillControls').querySelector('[data-financial-depth="' + depth + '"]') || co('financial-tab-' + financialView);
  target?.focus();
}
function changeFinancialBranchPath(value) {
  financialBranchPath = value;
  financialTrail = financialTrail.slice(0, 1);
  renderFinancialReport();
}
function selectFinancialReport(key, focus = false) {
  financialView = key;
  financialTrail = [];
  renderFinancialReport();
  if (focus) co('financial-tab-' + key).focus();
}

function financialPeriod(months, previous = false) {
  const endDate = new Date(co('coTo').value + 'T00:00:00Z');
  if (Number.isNaN(+endDate)) return null;
  if (months === 'daily' || months === 'weekly') {
    const weekly = months === 'weekly';
    const days = weekly ? 7 : 1;
    const offset = weekly ? (endDate.getUTCDay() + 6) % 7 : 0;
    endDate.setUTCDate(endDate.getUTCDate() - offset - (previous ? days : 0));
    const start = endDate.toISOString().slice(0, 10);
    endDate.setUTCDate(endDate.getUTCDate() + days - 1);
    return { start, end: endDate.toISOString().slice(0, 10) };
  }
  const year = endDate.getUTCFullYear();
  const month = Math.floor(endDate.getUTCMonth() / months) * months - (previous ? months : 0);
  return {
    start: new Date(Date.UTC(year,month,1)).toISOString().slice(0,10),
    end: new Date(Date.UTC(year,month+months,0)).toISOString().slice(0,10)
  };
}
function financialPeriodCenters(period) {
  if (!period) return [];
  const selected = new Set(currentCenterRows.map(row => row.id));
  return (aggregateCenters(period.start, period.end) || []).filter(row => selected.has(row.id));
}
let financialExpenseView = 'overview';
let financialExpenseBranch = '';
let financialPivotRows = 'branch';
let financialPivotMeasure = 'amount';

function setFinancialPivot(field, value) {
  if (field === 'rows') financialPivotRows = value === 'category' ? 'category' : 'branch';
  if (field === 'measure') financialPivotMeasure = value === 'share' ? 'share' : 'amount';
  renderFinancialModule();
}

const financialExpenseCategories = [
  ['regularOperating', 'Regular Operating Expenses'],
  ['regularCapital', 'Regular Capital Expenses'],
  ['expansionOperating', 'Expansion Operating Expenses'],
  ['expansionCapital', 'Expansion Capital Expenses']
];

function financialCostPivotData(branches) {
  const categories = financialExpenseCategories;
  const allocations = branches.map(branch => financialBranchExpenseAllocation(branch));
  const totals = categories.map(([key]) => allocations.reduce((sum, row) => sum + row[key], 0));
  const grandTotal = allocations.reduce((sum, row) => sum + row.total, 0);
  if (financialPivotRows === 'category') return {
    headers: ['Expense category', ...branches.map(branch => branch.name), 'Total Spend'],
    rows: categories.map(([key,label], index) => [label, ...allocations.map(row => row[key]), totals[index]]),
    total: ['Total Spend', ...allocations.map(row => row.total), grandTotal]
  };
  return {
    headers: ['Branch', ...categories.map(([,label]) => label), 'Total Spend'],
    rows: branches.map((branch,index) => [branch.name, ...categories.map(([key]) => allocations[index][key]), allocations[index].total]),
    total: ['Total Spend', ...totals, grandTotal]
  };
}

function financialCostPivot(branches) {
  if (!branches.length) return '<p class="co-empty">No branches match the selected location filters.</p>';
  const data = financialCostPivotData(branches);
  const grandTotal = data.total[data.total.length - 1];
  const format = row => row.map((value, index) => index === 0 ? centerEscape(value) :
    financialPivotMeasure === 'share' ? (grandTotal ? (value / grandTotal * 100).toFixed(1) : '0.0') + '%' : centerMoney(value));
  return '<div class="cost-pivot-toolbar"><label>Rows<select onchange="setFinancialPivot(\'rows\',this.value)">' +
    '<option value="branch"' + (financialPivotRows === 'branch' ? ' selected' : '') + '>Branches</option>' +
    '<option value="category"' + (financialPivotRows === 'category' ? ' selected' : '') + '>Expense categories</option></select></label>' +
    '<label>Values<select onchange="setFinancialPivot(\'measure\',this.value)">' +
    '<option value="amount"' + (financialPivotMeasure === 'amount' ? ' selected' : '') + '>Amount (INR)</option>' +
    '<option value="share"' + (financialPivotMeasure === 'share' ? ' selected' : '') + '>% of total spend</option></select></label>' +
    '<button type="button" class="co-btn cost-export" onclick="exportFinancialCostPivot()">' + dashboardIcon('Download') + 'Export CSV</button></div>' +
    '<p class="co-sales-source-note">' + (financialPivotMeasure === 'share' ? 'Each cell is a share of all selected branch expenses. ' : '') +
    'Four-category demo allocations match the By Branch view. Salaries are included in Regular Operating Expenses.</p>' +
    financialTable(data.headers, data.rows.map(format), format(data.total));
}

function exportFinancialCostPivot() {
  const period = financialPeriod(financialCostPeriod);
  const branches = financialPeriodCenters(period);
  const data = financialCostPivotData(branches);
  const total = data.total[data.total.length - 1];
  const rows = [data.headers, ...data.rows, data.total];
  const output = financialPivotMeasure === 'share' ? rows.map((row, index) => index === 0 ? row :
    row.map((value, column) => column === 0 ? value : (total ? value / total * 100 : 0).toFixed(1) + '%')) : rows;
  downloadCenterInsightCSV('cost-pivot-' + financialPivotMeasure, output, period);
}

function financialCostTooltip(title, rows) {
  const data = {title, rows};
  return ' tabindex="0" data-cost-tooltip="' + centerEscape(JSON.stringify(data)) + '" aria-label="' +
    centerEscape(title + '. ' + rows.map(([label,value]) => label + ': ' + value).join('. ')) + '"';
}

function financialDonutSegment(label, amount, share, start, color) {
  if (share <= 0) return '';
  const point = angle => [120 + 98 * Math.sin(angle * Math.PI / 180), 120 - 98 * Math.cos(angle * Math.PI / 180)];
  const angle = share * 3.6;
  const [x,y] = point(start);
  let path = 'M' + x + ' ' + y;
  const pieces = Math.ceil(angle / 180);
  for (let i = 1; i <= pieces; i++) {
    const [endX,endY] = point(start + angle * i / pieces);
    path += ' A98 98 0 0 1 ' + endX + ' ' + endY;
  }
  return '<path class="cost-donut-segment" d="' + path + '" fill="none" stroke="' + color + '" stroke-width="27"' +
    financialCostTooltip(label, [['Amount',centerMoney(amount)],['Share',share.toFixed(1) + '%']]) +
    ' data-donut-label="' + centerEscape(label) + '" data-donut-share="' + share.toFixed(1) + '%"/>';
}

function financialOperatingExpenseBranches(branches) {
  return branches.map(branch => {
    const allocation = financialBranchExpenseAllocation(branch);
    return {...branch, salaries:allocation.salaries,
      expenditure:allocation.regularOperating + allocation.expansionOperating};
  });
}

function financialCostTrend(period) {
  const points = [];
  const start = new Date(period.start + 'T00:00:00Z');
  const end = new Date(period.end + 'T00:00:00Z');
  const monthly = financialCostPeriod > 1;
  for (let date = new Date(start); date <= end;) {
    const from = date.toISOString().slice(0, 10);
    const to = monthly ? new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).toISOString().slice(0, 10) : from;
    points.push({label: date.toLocaleDateString('en-GB', monthly ? {month:'short', year:'2-digit', timeZone:'UTC'} : {day:'numeric', month:'short', timeZone:'UTC'}),
      amount: centerTotal(financialOperatingExpenseBranches(financialPeriodCenters({start:from, end:to}))).expenditure});
    if (monthly) date.setUTCMonth(date.getUTCMonth() + 1);
    else date.setUTCDate(date.getUTCDate() + 1);
  }
  const max = Math.max(1, ...points.map(point => point.amount));
  const coords = points.map((point, index) => [40 + index * 520 / Math.max(1, points.length - 1), 150 - point.amount / max * 115]);
  const line = coords.map(([x,y]) => x + ',' + y).join(' ');
  return '<figure class="cost-chart cost-trend-card"><figcaption><span class="cost-chart-icon">' + dashboardIcon('ChartArea') + '</span><div><h4>Spending trend</h4><p>' + (monthly ? 'Monthly' : 'Daily') + ' operating expenses</p></div></figcaption>' +
    '<svg class="cost-trend" viewBox="0 0 600 200" role="group" aria-label="' + (monthly ? 'Monthly' : 'Daily') + ' spending trend">' +
    '<title>Operating expenses from ' + period.start + ' to ' + period.end + '</title>' +
    [35,92,150].map(y => '<path d="M40 ' + y + 'H560" stroke="#e9efeb" fill="none"/>').join('') +
    '<text x="40" y="20" fill="#809086" font-size="10">' + centerEscape(centerMoney(max)) + '</text>' +
    '<defs><linearGradient id="costTrendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8c63ce" stop-opacity=".22"/><stop offset="100%" stop-color="#8c63ce" stop-opacity=".02"/></linearGradient></defs>' +
    '<polygon points="40,150 ' + line + ' 560,150" fill="url(#costTrendFill)"/>' +
    '<polyline points="' + line + '" fill="none" stroke="#8762ba" stroke-width="2.8" stroke-linejoin="round"/>' +
    coords.map(([x,y], index) => '<circle cx="' + x + '" cy="' + y + '" r="3.5" fill="#8762ba" stroke="#fff" stroke-width="1.5"/>' +
      '<circle class="cost-trend-hit" cx="' + x + '" cy="' + y + '" r="9" fill="transparent"' +
      financialCostTooltip(points[index].label, [['Operating expenses',centerMoney(points[index].amount)]]) + '/>').join('') +
    [0,Math.floor((points.length-1)/2),points.length-1].filter((index,position,array) => array.indexOf(index) === position).map(index => '<text x="' + coords[index][0] + '" y="180" text-anchor="middle" fill="#809086" font-size="10">' + points[index].label + '</text>').join('') + '</svg></figure>';
}

function financialCostOverview(branches, previousBranches, current, previous) {
  if (!branches.length) return '<p class="co-empty">No branches match the selected location filters.</p>';
  branches = financialOperatingExpenseBranches(branches);
  previousBranches = financialOperatingExpenseBranches(previousBranches);
  const now = centerTotal(branches), before = centerTotal(previousBranches);
  const change = now.expenditure - before.expenditure;
  const pct = before.expenditure ? ((change / before.expenditure) * 100).toFixed(1) + '%' : null;
  const salaryShare = now.expenditure ? now.salaries / now.expenditure * 100 : 0;
  const cards = [
    ['Total operating expenses',centerMoney(now.expenditure),'Regular + expansion operating expenses'],
    ['Change vs previous period',(change > 0 ? '+' : change < 0 ? '−' : '') + centerMoney(Math.abs(change)),pct ? (change > 0 ? '+' : '') + pct + ' · operating expenses' : now.expenditure ? 'New operating spend; no previous baseline' : 'No operating spend in either period'],
    ['Salary share',salaryShare.toFixed(1) + '%',centerMoney(now.salaries) + ' ÷ operating expenses'],
    ['Average per branch',centerMoney(now.expenditure / branches.length),'Operating expenses ÷ ' + branches.length + ' selected branches']
  ];
  const max = Math.max(1, ...branches.map(branch => branch.expenditure), ...previousBranches.map(branch => branch.expenditure));
  const comparison = branches.slice().sort((a,b) => b.expenditure - a.expenditure).map(branch => {
    const prior = previousBranches.find(row => row.id === branch.id)?.expenditure || 0;
    return '<div class="cost-bar-row"><strong>' + centerEscape(branch.name) + '</strong>' +
      [[branch.expenditure,'current'],[prior,'previous']].map(([amount,tone]) => {
        const period = tone === 'current' ? current : previous;
        return '<div class="cost-bar-line"' + financialCostTooltip(branch.name, [
          ['Period',tone === 'current' ? 'Current period' : 'Previous period'],
          ['Dates',period.start + ' to ' + period.end],['Expenses',centerMoney(amount)]
        ]) + '><div class="cost-bar-track"><i class="' + tone + '" style="width:' + (amount / max * 100) + '%"></i></div><span>' + centerMoney(amount) + '</span></div>';
      }).join('') + '</div>';
  }).join('');
  const tones = ['rose', change > 0 ? 'amber' : change < 0 ? 'green' : 'neutral', 'blue', 'violet'];
  const icons = ['Receipt','RotateCcw','Users','MapPin'];
  return '<div class="cost-summary-grid">' + cards.map(([label,value,note],index) => '<article class="co-kpi cost-summary-card cost-tone-' + tones[index] + '"><div class="co-kpi-top"><span>' + label + '</span><span class="co-icon">' + dashboardIcon(icons[index]) + '</span></div><strong>' + value + '</strong><small>' + note + '</small></article>').join('') + '</div>' +
    '<div class="cost-chart-grid"><figure class="cost-chart cost-branch-chart"><figcaption><span class="cost-chart-icon">' + dashboardIcon('ChartBar') + '</span><div><h4>Operating expenses by branch</h4><p>Current vs previous period · excludes capital expenditure</p></div></figcaption>' +
    '<div class="cost-chart-key"><span><i></i>Current</span><span><i class="previous"></i>Previous</span></div>' + comparison + '</figure>' +
    '<figure class="cost-chart cost-mix-chart"><figcaption><span class="cost-chart-icon">' + dashboardIcon('ChartPie') + '</span><div><h4>Expense mix</h4><p>Composition of operating expenses</p></div></figcaption>' +
    '<div class="cost-mix-layout"><div class="cost-donut" data-default-share="' + salaryShare.toFixed(1) + '%">' +
    '<svg class="cost-donut-ring" viewBox="0 0 240 240" role="group" aria-label="Expense mix by category">' +
    financialDonutSegment('Employee salaries',now.salaries,salaryShare,0,'#5289ba') +
    financialDonutSegment('Other operating expenses',now.expenditure-now.salaries,now.expenditure ? 100-salaryShare : 0,salaryShare * 3.6,'#e4b568') +
    '</svg><span><b>' + salaryShare.toFixed(1) + '%</b><small>Salaries</small></span></div>' +
    '<div class="cost-mix-values"><p' + financialCostTooltip('Employee salaries', [['Amount',centerMoney(now.salaries)],['Share',salaryShare.toFixed(1) + '%']]) + '><i></i>Employee salaries<strong>' + centerMoney(now.salaries) + '</strong></p>' +
    '<p' + financialCostTooltip('Other operating expenses', [['Amount',centerMoney(now.expenditure-now.salaries)],['Share',(now.expenditure ? 100-salaryShare : 0).toFixed(1) + '%']]) + '><i class="previous"></i>Other operating expenses<strong>' + centerMoney(now.expenditure-now.salaries) + '</strong></p></div></div></figure></div>' +
    financialCostTrend(current) + '<p class="co-sales-source-note">Operating expenses include regular and expansion operating allocations, with salaries counted once. Both capital categories are excluded. Compared with ' + previous.start + ' to ' + previous.end + '. Pivot and By Branch show all four expense categories.</p>';
}

function selectFinancialExpenseView(view) {
  financialExpenseView = view;
  renderFinancialModule();
  co('financialOtherModule').querySelector('[data-cost-view="' + view + '"]')?.focus();
}

function selectFinancialExpenseBranch(id) {
  financialExpenseBranch = financialExpenseBranch === id ? '' : id;
  renderFinancialModule();
  co('financialExpenseToggle-' + id)?.focus();
}

const financialExpenseAllocationProfiles = {
    hyderabad: [0.62, 0.18, 0.08],
    bengaluru: [0.52, 0.16, 0.12],
    chennai: [0.73, 0.12, 0.06],
    mumbai: [0.58, 0.22, 0.07],
    delhi: [0.65, 0.10, 0.10]
};

function financialBranchExpenseAllocation(branch) {
  // Stable branch-specific demo mixes; distribute non-salary spend without changing totals.
  const [operatingShare, capitalShare, expansionShare] = financialExpenseAllocationProfiles[branch.id] || [0.65, 0.15, 0.08];
  const spend = Math.round(branch.expenditure);
  const salaries = Math.round(branch.salaries);
  const remaining = Math.max(0, spend - salaries);
  const regularRunning = Math.round(remaining * operatingShare);
  const regularCapital = Math.round(remaining * capitalShare);
  const expansionOperating = Math.round(remaining * expansionShare);
  const expansionCapital = remaining - regularRunning - regularCapital - expansionOperating;
  return { salaries, regularRunning, regularOperating: salaries + regularRunning,
    regularCapital, expansionOperating, expansionCapital, total: spend };
}

function financialBranchExpenses(branches, total) {
  const selected = branches.find(branch => branch.id === financialExpenseBranch);
  const allocations = new Map(branches.map(branch => [branch.id, financialBranchExpenseAllocation(branch)]));
  const totals = [...allocations.values()].reduce((sum, row) => {
    for (const key of Object.keys(sum)) sum[key] += row[key];
    return sum;
  }, {regularOperating:0, regularCapital:0, expansionOperating:0, expansionCapital:0, total:0});
  const amountColumns = row => ['regularOperating','regularCapital','expansionOperating','expansionCapital','total'].map(key => centerMoney(row[key]));
  const headers = ['Branch','Regular Operating Expenses','Regular Capital Expenses',
    'Expansion Operating Expenses','Expansion Capital Expenses','Total Spend','Action'];
  const rows = branches.map(branch => {
    const expanded = selected === branch;
    const allocation = allocations.get(branch.id);
    const action = '<button id="financialExpenseToggle-' + branch.id + '" type="button" class="cost-breakdown-toggle" aria-expanded="' + expanded +
      '" aria-controls="financialExpenseDetails-' + branch.id + '" onclick="selectFinancialExpenseBranch(\'' + branch.id + '\')">' +
      (expanded ? 'Hide breakdown' : 'View breakdown') +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>';
    return '<tr class="cost-branch-row' + (expanded ? ' is-expanded' : '') + '">' +
      financialCells([centerEscape(branch.name), ...amountColumns(allocation), action], 'td', headers) + '</tr>' +
      '<tr class="cost-breakdown-row"' + (expanded ? '' : ' hidden') + '><td colspan="' + headers.length + '">' +
      '<section class="cost-breakdown" id="financialExpenseDetails-' + branch.id + '" aria-labelledby="financialExpenseTitle-' + branch.id + '">' +
      '<div class="cost-breakdown-heading"><span>Expense breakdown</span><h4 id="financialExpenseTitle-' + branch.id + '">' +
      centerEscape(branch.name) + ' · All expenditure categories</h4></div>' +
      financialTable(['Expense type','Amount'], [
        ['Regular operating · Salaries',centerMoney(allocation.salaries)],
        ['Regular operating · Reagents, rent, utilities & maintenance',centerMoney(allocation.regularRunning)],
        ['Regular capital · Equipment & IT upgrades',centerMoney(allocation.regularCapital)],
        ['Expansion operating · Hiring, training & launch expenses',centerMoney(allocation.expansionOperating)],
        ['Expansion capital · Fit-out & new lab infrastructure',centerMoney(allocation.expansionCapital)]
      ], ['Total branch expenditure',centerMoney(allocation.total)]) + '</section></td></tr>';
  }).join('');
  return '<p class="co-sales-source-note">Illustrative demo allocation across four expense categories, with different mixes by branch. ' +
    'Salaries are included in regular operating expenses. Allocations retain each branch’s recorded total spend and remain stable on refresh.</p>' +
    '<div class="co-table-wrap"><table class="co-table co-financial-table cost-branch-table"><thead><tr>' +
    financialCells(headers,'th',headers) + '</tr></thead><tbody>' +
    (rows || '<tr><td class="co-empty" colspan="7">No branches match the selected location filters.</td></tr>') +
    '</tbody><tfoot><tr>' + financialCells(['All selected branches', ...amountColumns(totals), ''],'td',headers) +
    '</tr></tfoot></table></div>';
}

function financialExpenseVariance(current, previous) {
  const amount = current - previous;
  return {
    amount,
    percentage: previous === 0 ? (current === 0 ? 0 : null) : amount / previous * 100,
    status: previous === 0 && current > 0 ? 'New spend' : amount > 0 ? 'Increase' : amount < 0 ? 'Decrease' : 'No change',
    tone: amount > 0 ? 'increase' : amount < 0 ? 'decrease' : 'flat'
  };
}

function financialCostPeriodComparison(branches, previousBranches, current, previous) {
  const headers = ['Expense category', 'Current period<br><small>' + current.start + ' to ' + current.end + '</small>',
    'Previous period<br><small>' + previous.start + ' to ' + previous.end + '</small>', 'Change Amount', 'Change (%)', 'Trend'];
  if (!branches.length) return '<div class="cost-comparison-report">' + financialTable(headers, []) + '</div>';
  const allocations = branches.map(financialBranchExpenseAllocation);
  const priorAllocations = previousBranches.map(financialBranchExpenseAllocation);
  const sum = (items, key) => items.reduce((total, row) => total + row[key], 0);
  const signed = (value, format) => (value > 0 ? '+' : value < 0 ? '−' : '') + format(Math.abs(value));
  const cells = (label, amount, before) => {
    const variance = financialExpenseVariance(amount, before);
    const wrap = value => '<span class="cost-variance-value ' + variance.tone + '">' + value + '</span>';
    return [label, centerMoney(amount), centerMoney(before), wrap(signed(variance.amount, centerMoney)),
      wrap(variance.percentage === null ? 'New spend' : signed(variance.percentage, value => value.toFixed(1) + '%')),
      '<span class="cost-variance-status ' + variance.tone + '">' + variance.status + '</span>'];
  };
  return '<p class="co-sales-source-note">Four-category demo allocations match By Branch and Pivot. ' +
    'Change = current − previous; change % = change ÷ previous × 100. New spend means there is no previous-period baseline. ' +
    'An increase can reflect expansion or higher activity.</p>' +
    '<div class="cost-comparison-report">' +
    financialTable(headers, financialExpenseCategories.map(([key,label]) => cells(label, sum(allocations,key), sum(priorAllocations,key))),
      cells('Total Spend',sum(allocations,'total'),sum(priorAllocations,'total'))) + '</div>';
}

function financialCostAnalysis() {
  const current = financialPeriod(financialCostPeriod);
  const previous = financialPeriod(financialCostPeriod, true);
  if (!current || !previous) return '<p>Choose a reporting end date.</p>';
  const branches = financialPeriodCenters(current);
  const now = centerTotal(branches);
  const previousBranches = financialPeriodCenters(previous);
  const controls = '<div class="cost-analysis-toolbar"><div class="cost-analysis-heading">' +
    '<div class="cost-analysis-title"><span class="cost-analysis-mark">' + dashboardIcon('ChartColumn') + '</span>' +
    '<div><h3>Cost Analysis</h3><p>Explore branch expenditure and period performance.</p></div></div>' +
    '<label class="cost-period-field"><span>Comparison period</span><select id="financialCostPeriodSelect" onchange="setFinancialCostPeriod(this.value)">' +
    [[1,'Monthly'],[3,'Quarterly'],[6,'Half-yearly'],[12,'Yearly']].map(([value,label]) => '<option value="' + value + '"' +
      (value === financialCostPeriod ? ' selected' : '') + '>' + label + '</option>').join('') + '</select></label></div>' +
    '<div class="co-insight-tabs cost-view-switcher" role="group" aria-label="Cost analysis views">' +
    [['overview','Overview','ChartPie'], ['pivot','Pivot','Layers'], ['branch','By Branch','MapPin'], ['comparison','Period Comparison','ChartColumn']].map(([key,label,icon]) =>
      '<button type="button" data-cost-view="' + key + '" aria-pressed="' + (financialExpenseView === key) +
      '" onclick="selectFinancialExpenseView(\'' + key + '\')">' + dashboardIcon(icon) + '<span>' + label + '</span></button>').join('') + '</div></div>';
  const scopeNote = '<p class="co-sales-source-note">Period ' + current.start + ' to ' + current.end +
    ' · Centre, City and Sales Zone filters apply. Branch expenses are not allocated to individual clients, doctors or test categories.</p>';
  if (financialExpenseView === 'overview') return controls + scopeNote + financialCostOverview(branches, previousBranches, current, previous);
  if (financialExpenseView === 'pivot') return controls + scopeNote + financialCostPivot(branches);
  if (financialExpenseView === 'branch') {
    return controls + '<p class="co-sales-source-note">Period ' + current.start + ' to ' + current.end + '</p>' +
      financialBranchExpenses(branches, now);
  }
  return controls + scopeNote + financialCostPeriodComparison(branches, previousBranches, current, previous);
}
function setFinancialCostPeriod(value) {
  financialCostPeriod = [1, 3, 6, 12].includes(Number(value)) ? Number(value) : 1;
  renderFinancialModule();
}

function financialCashFlowBranch(branch, transfer = null) {
  const receipts = Math.round(branch.net * .87);
  const transferIn = transfer && branch.id === transfer.to ? transfer.amount : 0;
  const transferOut = transfer && branch.id === transfer.from ? transfer.amount : 0;
  const regularPayments = Math.round(branch.expenditure * .92);
  // Illustrative vendor/equipment settlement periods for two branches.
  const settlementRatio = {bengaluru:1.12, delhi:1.08}[branch.id] || 0;
  const payments = Math.max(regularPayments, Math.round(receipts * settlementRatio)) + transferOut;
  const fundingGap = Math.max(0, payments - receipts - transferIn);
  const treasuryFunding = Math.ceil(fundingGap / 1000) * 1000;
  return {name:branch.name, receipts, broughtIn:transferIn + treasuryFunding, payments};
}

function financialCashFlowRows() {
  const transfer = {date:'2026-11-06', from:'hyderabad', to:'bengaluru', amount:30000};
  const included = co('coFrom').value <= transfer.date && transfer.date <= co('coTo').value;
  return currentCenterRows.map(branch => financialCashFlowBranch(branch, included ? transfer : null));
}

let financialPnlCptTreatment = 'unconfirmed';
function setFinancialPnlCptTreatment(value) {
  financialPnlCptTreatment = ['included','additional'].includes(value) ? value : 'unconfirmed';
  renderFinancialModule();
}

function financialPnlModel(branches, ledger, treatment) {
  const revenue = centerTotal(branches);
  const activity = financialTotals(ledger);
  const expenses = branches.map(financialBranchExpenseAllocation);
  const sum = key => expenses.reduce((total,row) => total + row[key],0);
  const salaries = sum('salaries');
  const operating = sum('regularOperating') + sum('expansionOperating');
  const otherRecorded = operating - salaries;
  const direct = activity.cost;
  const contribution = direct === null ? null : revenue.net - direct - activity.referral;
  const consistent = direct !== null && (treatment === 'additional' || treatment === 'included' && direct <= otherRecorded);
  const other = !consistent ? null : otherRecorded - (treatment === 'included' ? direct : 0);
  return { ...revenue, salaries, operating, otherRecorded, direct, referral:activity.referral,
    contribution, other, profit:consistent ? contribution - salaries - other : null,
    capital:sum('regularCapital') + sum('expansionCapital'),
    reconciliation:treatment === 'unconfirmed' ? 'Confirm CPT expense treatment to calculate operating profit/loss.' :
      direct === null ? 'Some tests have no CPT rate. Upload complete rates before calculating operating profit/loss.' :
      !consistent ? 'CPT costs exceed recorded non-salary operating expenses. Reconcile the allocations before calculating profit/loss.' :
      'Calculated using the selected CPT treatment. Provisional demo figures require finance approval.' };
}

function financialProfitLoss() {
  const model = financialPnlModel(currentCenterRows, financialLedger(false), financialPnlCptTreatment);
  const amount = value => value === null ? '<span class="pnl-pending">Pending reconciliation</span>' :
    '<span class="pnl-amount' + (value < 0 ? ' is-loss' : '') + '">' + centerMoney(value) + '</span>';
  const rows = [
    ['Gross Revenue',amount(model.revenue),'Selected branch activity'],
    ['Less: Discounts',amount(model.discount),'Discounts deducted from gross revenue'],
    ['<strong>Net Revenue</strong>',amount(model.net),'Gross revenue − discounts'],
    ['Less: Direct Test Costs',model.direct === null ? '<span class="pnl-pending">Incomplete CPT rates</span>' : amount(model.direct),'Test count × uploaded or sample CPT rates'],
    ['Less: Referral Expenses',amount(model.referral),'Sample Walk-In referrals; portal integration pending'],
    ['<strong>Contribution</strong>',amount(model.contribution),'Net revenue − direct test costs − referrals'],
    ['Less: Employee Salaries',amount(model.salaries),'Included in recorded operating expenses'],
    ['Less: Other Operating Expenses',amount(model.other),financialPnlCptTreatment === 'included' ?
      'Recorded non-salary expenses less CPT costs already deducted above' : financialPnlCptTreatment === 'additional' ?
      'Recorded non-salary operating expenses; CPT treated as additional' : 'CPT overlap must be confirmed; rent/utilities/admin split is not available']
  ];
  return '<div class="pnl-heading"><div><h3>Profit &amp; Loss</h3><p>Provisional P&amp;L — subject to finance approval</p></div>' +
    '<span class="pnl-status">Provisional</span></div>' +
    '<p class="co-sales-source-note">' + co('coFrom').value + ' to ' + co('coTo').value +
    ' · Uses selected branches, City and Sales Zone. Client, doctor, PRO and test-category filters do not apply to branch expenses.</p>' +
    '<div class="pnl-treatment"><label><span>CPT expense treatment</span><select onchange="setFinancialPnlCptTreatment(this.value)">' +
    [['unconfirmed','Needs confirmation'],['included','Included in recorded expenses'],['additional','Additional to recorded expenses']].map(([value,label]) =>
      '<option value="' + value + '"' + (value === financialPnlCptTreatment ? ' selected' : '') + '>' + label + '</option>').join('') +
    '</select></label><p role="status">' + model.reconciliation + '</p></div>' +
    '<div class="pnl-statement">' + financialTable(['Line item','Amount','Basis'],currentCenterRows.length ? rows : [],
      currentCenterRows.length ? ['Operating Profit / Loss',amount(model.profit),'Contribution − salaries − other operating expenses'] : null) + '</div>' +
    '<div class="pnl-capital"><span>Capital expenditure · shown separately</span><strong>' + centerMoney(model.capital) + '</strong>' +
    '<p>Regular and expansion capital allocations are excluded from operating expenses. Depreciation, interest and taxes are not supplied; this is not a net-profit statement.</p></div>' +
    '<p class="co-sales-source-note">Demo expense allocations match By Branch. Salaries are not added twice. CPT treatment is a session-only calculation assumption, not an approved accounting mapping.</p>';
}

function renderFinancialModule() {
  document.dispatchEvent(new Event('financialchartsrefresh'));
  const total = centerTotal(currentCenterRows);
  let content;
  if (financialModule === 'Cost Analysis') {
    content = financialCostAnalysis();
  } else if (financialModule === 'Profit & Loss') {
    content = financialProfitLoss();
  } else if (financialModule === 'Live CPT') {
    content = '<h3>Live CPT</h3><label>Upload Excel workbook <input type="file" accept=".xlsx" onchange="uploadFinancialCpt(this.files[0])"></label>' +
      '<p class="co-sales-source-note">Use the first worksheet with Test and CPT columns. Rates apply for this session. Inventory and machine-run costing is planned.</p>' +
      '<p id="financialCptStatus" role="status">' + (cptUpload ? 'Rates loaded from ' + centerEscape(cptUpload) : 'Sample CPT rates active.') + '</p>' +
      financialTable(['Test','Cost per test'], [...cptRates].map(([test, rate]) => [centerEscape(test), '₹' + rate.toLocaleString('en-IN',{maximumFractionDigits:2})]));
  } else if (financialModule === 'Inventory') {
    const month = financialPeriod(1);
    const prior = financialPeriod(1,true);
    const monthRows = financialPeriodCenters(month);
    const priorRows = financialPeriodCenters(prior);
    const scoped = financialScopedRecords(centerSalesState.records);
    content = '<h3>Inventory</h3><p class="co-sales-source-note">Illustrative stock and consumption quantities. Live inventory requires the LIS API.</p>' +
      financialTable(['Branch','Tests','Consumption (units)','Stock used value','Net revenue'], currentCenterRows.map(row => {
        const tests = scoped.filter(record => record.centerId === row.id).reduce((sum,record) => sum + record.tests,0);
        return [centerEscape(row.name),centerNumber(tests),centerNumber(tests * 2),centerMoney(tests * 30),centerMoney(row.net)];
      })) + '<h3>Monthly Branch Stock Comparison</h3>' +
      financialTable(['Branch',month?.start.slice(0,7) || 'Current month',prior?.start.slice(0,7) || 'Previous month','Change (units)'], monthRows.map(row => {
        const current = Math.round(row.revenue / 130);
        const previous = Math.round((priorRows.find(other => other.id === row.id)?.revenue || 0) / 130);
        return [centerEscape(row.name),centerNumber(current),centerNumber(previous),centerNumber(current-previous)];
      }));
  } else {
    const branches = financialCashFlowRows();
    const totals = branches.reduce((sum, branch) => ({
      receipts: sum.receipts + branch.receipts,
      broughtIn: sum.broughtIn + branch.broughtIn,
      payments: sum.payments + branch.payments
    }), { receipts: 0, broughtIn: 0, payments: 0 });
    const cashValues = row => [
      centerMoney(row.receipts), centerMoney(row.broughtIn), centerMoney(row.payments),
      centerMoney(row.receipts + row.broughtIn - row.payments)
    ];
    content = '<h3>Cash Flow Statement</h3><p class="co-sales-source-note">Demo cash movements, including vendor/equipment settlements in Bengaluru and Delhi. ' +
      'When payments exceed receipts and incoming transfers, sample treasury funding covers the gap, rounded up to the next ₹1,000. ' +
      'Cash Brought In includes incoming transfers and treasury funding, not revenue. Net cash movement = cash received + cash brought in − cash paid. Live figures require Tally integration.</p>' +
      financialTable(['Branch', 'Cash Received', 'Cash Brought In', 'Cash Paid', 'Net Cash Movement'],
        branches.map(branch => [centerEscape(branch.name), ...cashValues(branch)]),
        ['Selected branches', ...cashValues(totals)]);
  }
  co('financialOtherModule').innerHTML = content;
  enhanceFinancialTables();
}

async function uploadFinancialCpt(file) {
  if (!file) return;
  co('financialCptStatus').textContent = 'Reading workbook…';
  try {
    const [header, ...rows] = await readFinancialCptSheet(file);
    const columns = (header || []).map(value => String(value || '').trim().toLowerCase());
    const testIndex = columns.findIndex(value => ['test','test name'].includes(value));
    const rateIndex = columns.findIndex(value => ['cpt','cpt rate','cost per test'].includes(value));
    if (testIndex < 0 || rateIndex < 0) throw Error('The first row needs Test and CPT columns.');
    const imported = new Map();
    for (const row of rows) {
      if (!row.some(value => String(value || '').trim())) continue;
      const test = String(row[testIndex] || '').trim().toLowerCase();
      const raw = String(row[rateIndex] ?? '').trim();
      const rate = Number(raw);
      if (!test || !raw || !Number.isFinite(rate) || rate < 0 || imported.has(test)) throw Error('Use unique test names and nonnegative numeric rates.');
      imported.set(test, rate);
    }
    if (!imported.size) throw Error('No CPT rates found.');
    cptRates = imported;
    cptUpload = file.name;
    renderFinancialReport();
  } catch (error) {
    const status = co('financialCptStatus');
    if (status) status.textContent = error.message + ' Existing rates are still active.';
  }
}

co('financialModules').innerHTML = financialModules.map((label,index) =>
  '<button type="button" onclick="selectFinancialModule(' + index + ')">' + label.replace('&','&amp;') + '</button>').join('');
function selectFinancialModule(index) {
  financialModule = financialModules[index];
  renderFinancialReport();
}
co('financialReportTabs').innerHTML = financialViews.map(([key,label]) =>
  '<button id="financial-tab-' + key + '" type="button" role="tab" aria-controls="financialReportPanel" onclick="selectFinancialReport(\'' + key + '\')">' + label + '</button>').join('');
co('financialClientType').addEventListener('change', () => {
  financialTrail = financialView === 'branch' ? financialTrail.slice(0,1) : [];
  renderFinancialReport();
});
enableCenterTabKeyboard(financialViews.map(([key]) => 'financial-tab-' + key), index => selectFinancialReport(financialViews[index][0], true));
mountFinancialOverviewHeader();
const renderCenterBeforeFinancialReport = renderCenterOverview;
renderCenterOverview = function () {
  const result = renderCenterBeforeFinancialReport.apply(this, arguments);
  financialTrail = [];
  renderFinancialReport();
  return result;
};
renderFinancialReport();

function financialNetMargin(row, includeCost) {
  if (includeCost && row.cost === null) return null;
  return row.net - row.referral - (includeCost ? row.cost : 0);
}

function financialFormulaSections() {
  const money = value => value === null || !Number.isFinite(value) ? 'Not available' : centerMoney(value);
  const percent = (value, total) => total ? (value / total * 100).toFixed(1) + '%' : 'No baseline';
  const ledger = financialLedger(false);
  const activity = financialModule === 'Overall Revenue' && financialFormulaTotals ? financialFormulaTotals : financialTotals(ledger);
  const global = centerTotal(currentCenterRows);
  const current = financialPeriod(financialCostPeriod), previous = financialPeriod(financialCostPeriod,true);
  const branches = financialPeriodCenters(current), priorBranches = financialPeriodCenters(previous);
  const allocations = branches.map(financialBranchExpenseAllocation), priorAllocations = priorBranches.map(financialBranchExpenseAllocation);
  const sum = (items,key) => items.reduce((total,row) => total + row[key],0);
  const spend = sum(allocations,'total'), priorSpend = sum(priorAllocations,'total');
  const operating = sum(allocations,'regularOperating') + sum(allocations,'expansionOperating');
  const priorOperating = sum(priorAllocations,'regularOperating') + sum(priorAllocations,'expansionOperating');
  const salaries = sum(allocations,'salaries');
  const pnl = financialPnlModel(currentCenterRows,ledger,financialPnlCptTreatment);
  const cash = financialCashFlowRows();
  const receipts = sum(cash,'receipts'), payments = sum(cash,'payments'), broughtIn = sum(cash,'broughtIn');
  const tests = financialScopedRecords(centerSalesState.records).reduce((total,row) => total + row.tests,0);
  const change = financialExpenseVariance(operating,priorOperating);
  const revenueScope = financialModule === 'Overall Revenue' ? 'Values use the current revenue table, its filters and drill-down.' : 'Values use selected branches and the global date range; not the hidden revenue drill-down.';
  const costScope = current && previous ? 'Current: ' + current.start + ' to ' + current.end + '; previous: ' + previous.start + ' to ' + previous.end + '. Centre, City and Sales Zone apply.' : 'Choose a valid reporting end date.';
  return [
    {key:'summary',title:'Banner & KPI Cards',scope:'Selected branches and global From–To dates. Salaries are already included in recorded expenditure.',rows:[
      ['Net Revenue','Gross revenue − discounts',money(global.net),'Banner and branch summary.'],
      ['Branch Balance','Net revenue − recorded total expenditure',money(global.net-global.expenditure),'Uses recorded spend, including the demo capital allocation; this is not operating profit.'],
      ['Total Expenditure','Sum of selected branch expenditure',money(global.expenditure),'Do not add salaries again.'],
      ['Employee Salaries','Sum of salaries across selected dates and branches',money(global.salaries),'Demo daily salary = monthly branch salary ÷ calendar days in that month.'],
      ['Total Employees','Sum of selected branch headcounts',centerNumber(global.employees),'Headcount as of To Date; do not multiply by days.']
    ]},
    {key:'Overall Revenue',title:'Revenue, Cost & Margins',scope:revenueScope,rows:[
      ['Gross Revenue','Net revenue + allocated discounts',money(activity.gross),'Source data is currently synthetic LIS activity.'],
      ['Net Revenue','Gross revenue − discounts',money(activity.net),'Same revenue basis across grouping views.'],
      ['CPT Test Cost','Sum(test count × matching CPT rate)',money(activity.cost),'Missing a rate for a test with activity makes aggregate cost unavailable.'],
      ['Branch Margin','Net revenue − CPT test cost',money(activity.cost === null ? null : activity.net-activity.cost),'Branch summary margin.'],
      ['Net Margin · referral basis','Net revenue − referrals',money(financialNetMargin(activity,false)),'PRO summary and department-to-test referral views. Target/referral/margin are hidden below the PRO summary.'],
      ['Client Net Margin','Net revenue − CPT cost − referrals',money(financialNetMargin(activity,true)),'Client-wise report, including its department breakdown. Branch-to-client currently uses the referral-only margin.'],
      ['Average Selling Test','Net revenue ÷ number of tests',money(activity.tests ? activity.net/activity.tests : null),'Unavailable when test count is zero.'],
      ['Walk-In Referral · demo','Round(Walk-In test-record net revenue × 5%), then sum',money(activity.referral),'Other clients currently have zero referral in the sample. Replace with Doctor Referral Portal data.'],
      ['PRO Target · demo','₹50,000 × inclusive selected days, per assigned PRO','Per PRO','Unassigned PRO has no target; summary total sums assigned PRO targets.'],
      ['Discount Allocation · demo','Distribute each employee’s discount in proportion to test-record net revenue','Proportional allocation','Integer allocation preserves the employee discount total.']
    ]},
    {key:'Cost Analysis',title:'Cost Analysis, Pivot & Period Changes',scope:costScope,rows:[
      ...financialExpenseCategories.map(([key,label]) => [label,'Sum of the same branch category allocations',money(sum(allocations,key)),'Used in By Branch, Pivot and Period Comparison.']),
      ['Total Spend','Regular operating + regular capital + expansion operating + expansion capital',money(spend),'Matches the sum of selected branch totals.'],
      ['Overview Operating Expenses','Regular operating + expansion operating',money(operating),'Excludes both capital categories. Overview cards and charts use this operating-only basis.'],
      ['Salary Share','Salaries ÷ operating expenses × 100',percent(salaries,operating),'Salaries count once within regular operating expenses. Zero denominator has no meaningful percentage.'],
      ['Other Operating Expenses · overview','Operating expenses − salaries',money(operating-salaries),'The donut splits operating spend into salaries and other operating expenses.'],
      ['Average per Branch','Operating expenses ÷ selected branch count',money(branches.length ? operating/branches.length : null),'Only branches in the active location scope are counted.'],
      ['Change Amount','Current amount − previous amount',money(change.amount),'Overview uses operating totals; Period Comparison applies this separately to all four categories and Total Spend.'],
      ['Change (%)','(Current − previous) ÷ previous × 100',change.percentage === null ? 'New spend' : change.percentage.toFixed(1) + '%','Previous = 0 and current > 0: New spend. Both zero: 0.0%. Positive: Increase; negative: Decrease; zero: No change.'],
      ['Total Spend Change','Current total spend − previous total spend',money(spend-priorSpend),'Different basis from the operating-only Overview change.'],
      ['Pivot Share (%)','Cell amount ÷ total spend of all selected branches × 100','Grand-total basis','Not a row-only or branch-only percentage. Footer percentages use totals; do not add rounded percentages.'],
      ['Comparison Period','Calendar period containing To Date; previous = preceding equal calendar period','Monthly / Quarterly / Half-yearly / Yearly','Full calendar periods; global From Date does not constrain Cost Analysis.'],
      ['Chart Trend','Sum of operating allocations for each date/month bucket','Daily or monthly points','Monthly selection shows daily points; longer selections show monthly points. Small rounding differences can arise from per-bucket allocations.'],
      ['Displayed Money','Round to nearest rupee; format using Indian digit grouping','₹','Allocation and display rounding can differ from unrounded source totals.']
    ]},
    {key:'allocations',title:'Demo Expense Allocation Rules',scope:'Stable illustrative allocation of existing branch spend. These percentages are not an approved accounting mapping.',rows:[
      ['Non-salary Pool','Max(0, round(branch expenditure) − round(branch salaries))','Per branch','Amounts are allocated from this pool; salaries are protected inside regular operating expenses.'],
      ['Regular Operating','Rounded salaries + round(pool × operating share)','Per branch','Includes salaries, running expenses and supplies.'],
      ['Regular Capital','Round(pool × capital share)','Per branch','Sample equipment and IT allocation.'],
      ['Expansion Operating','Round(pool × expansion-operating share)','Per branch','Sample hiring, training and launch allocation.'],
      ['Expansion Capital','Pool − allocated regular running − regular capital − expansion operating','Remainder','Remainder allocation keeps all four categories equal to branch total spend.'],
      ...Object.entries(financialExpenseAllocationProfiles).map(([id,shares]) => [
        centerDefinitions.find(branch => branch.id === id)?.name || id,
        'Pool shares: ' + shares.map(value => (value*100).toFixed(0) + '%').join(' / ') + ' / ' + ((1-shares.reduce((a,b)=>a+b,0))*100).toFixed(0) + '%',
        'Branch-specific','Order: regular running / regular capital / expansion operating / expansion capital. Salaries are added to regular running.'])
    ]},
    {key:'Profit & Loss',title:'Provisional Profit & Loss',scope:'Global dates and selected branches. CPT treatment: ' + financialPnlCptTreatment + '. ' + pnl.reconciliation,rows:[
      ['Net Revenue','Gross revenue − discounts',money(pnl.net),'Branch scope; client/PRO/test filters are not used to allocate branch expenses.'],
      ['Contribution','Net revenue − CPT costs − referral expenses',money(pnl.contribution),'Unavailable if CPT rates are incomplete.'],
      ['Recorded Operating Expenses','Regular operating + expansion operating',money(pnl.operating),'Demo allocation; excludes capital spend.'],
      ['Recorded Non-salary Expenses','Recorded operating expenses − salaries',money(pnl.otherRecorded),'May overlap CPT costs; confirm treatment before computing profit.'],
      ['Other Expenses · CPT included','Recorded non-salary expenses − CPT costs',financialPnlCptTreatment === 'included' ? money(pnl.other) : 'Not selected','Requires CPT cost ≤ recorded non-salary operating expenses.'],
      ['Other Expenses · CPT additional','Recorded non-salary operating expenses',financialPnlCptTreatment === 'additional' ? money(pnl.other) : 'Not selected','Direct CPT costs are deducted separately in contribution.'],
      ['Operating Profit / Loss','Contribution − salaries − other operating expenses',pnl.profit === null ? 'Pending reconciliation' : money(pnl.profit),'No result if treatment is unconfirmed, CPT rates are missing, or allocations conflict.'],
      ['Capital Spend · separate','Regular capital + expansion capital',money(pnl.capital),'Not deducted directly in this operating statement. Depreciation, interest, taxes and net profit are not modeled.']
    ]},
    {key:'Live CPT',title:'CPT Rates & Upload',scope:cptUpload ? 'Rates uploaded from ' + cptUpload : 'Sample rates are active.',rows:[
      ['Cost per Test','Use the matching uploaded Test → CPT rate',centerNumber(cptRates.size) + ' rates','First worksheet must contain Test and CPT columns; rates must be numeric and nonnegative, with unique test names.'],
      ['Sample CPT Rates','₹65 + (test index × ₹20)','Demo fallback','Zero-based sample test order; used only before an upload.'],
      ['Total Testing Cost','Sum(test count × matched rate)','See revenue / P&L','Uploaded rates replace the map for this session. Missing active tests produce unavailable cost, not a zero-cost assumption.'],
      ['Live CPT from Inventory / Machine Runs','Not implemented','Future integration','No live costing formula has been approved or connected.']
    ]},
    {key:'Inventory',title:'Inventory · Demo Estimates',scope:'Top table: global dates and location scope. Monthly comparison: calendar month of To Date versus the preceding month.',rows:[
      ['Test Count','Sum of scoped test activity',centerNumber(tests),'Current implementation uses location-scoped sales activity, not client/PRO/test-category filters.'],
      ['Consumption (units)','Test count × 2',centerNumber(tests*2),'Illustrative common units; not actual reagent consumption.'],
      ['Stock Used Value','Test count × ₹30',money(tests*30),'Demo value estimate; not taken from item-level inventory costs.'],
      ['Net Revenue','Sum of selected branch net revenue',money(global.net),'Uses the same dates as the top inventory table.'],
      ['Monthly Stock Estimate','Round(monthly branch gross revenue ÷ 130)','Per branch / calendar month','Proxy quantity, not actual opening, closing or issued stock.'],
      ['Monthly Change (units)','Current monthly estimate − previous monthly estimate','Per branch','Replace these estimates with LIS inventory movements for live reporting.']
    ]},
    {key:'Cash Flow Statement',title:'Cash Flow · Demo Movements',scope:'Global dates and selected branches. Treasury top-ups and vendor settlements are simulated, not actual bank transactions.',rows:[
      ['Cash Received','Round(branch net revenue × 87%)',money(receipts),'Per-branch rounding, then summed.'],
      ['Base Cash Payments','Round(branch recorded expenditure × 92%)','Per branch','Recorded expenditure basis, including the demo expense allocation.'],
      ['Vendor Settlement Floor','Bengaluru: round(receipts × 112%); Delhi: round(receipts × 108%)','Demo scenarios','Other branches have no settlement floor.'],
      ['Cash Paid','Max(base payments, settlement floor) + outgoing branch transfer',money(payments),'Includes the demo outgoing transfer only when its date is in the selected range.'],
      ['Incoming / Outgoing Transfer','₹30,000 Hyderabad → Bengaluru on 6 Nov 2026','Date-dependent demo','Each branch shows its own flow; internal transfers cancel in net movement when both branches are included.'],
      ['Funding Gap','Max(0, cash paid − receipts − incoming transfer)','Per branch','Do not generate funding automatically when live data is connected.'],
      ['Treasury Funding','Ceil(funding gap ÷ ₹1,000) × ₹1,000','Demo only','Rounds a positive gap up to the next ₹1,000.'],
      ['Cash Brought In','Incoming branch transfer + demo treasury funding',money(broughtIn),'Funding inflow, not revenue.'],
      ['Net Cash Movement','Cash received + cash brought in − cash paid',money(receipts+broughtIn-payments),'Sum of branch movements; this is not a closing balance without opening cash.']
    ]},
    {key:'credit',title:'Client Credit Review',scope:'Sample account snapshots, not period transactions. Credit columns currently appear only for the local Credit Client report filter.',rows:[
      ['Available Credit','Credit limit − outstanding amount','Per credit account','Negative available credit means the account exceeds its limit.'],
      ['Credit Usage (%)','Outstanding amount ÷ credit limit × 100','Per credit account','Demo credit limits are nonzero.'],
      ['Credit Status','< 80%: Within Limit; 80% to <100%: Near Limit; 100%: At Limit; >100%: Over Limit','Threshold rules','Warning starts at 80%; urgent starts at 100%. Payment history and overdue amounts are not connected.']
    ]}
  ];
}

function filterFinancialFormulas(query) {
  const search = query.trim().toLowerCase();
  let count = 0;
  co('financialDetailsMetrics').querySelectorAll('.financial-formula-section').forEach(section => {
    let matches = 0;
    section.querySelectorAll('tbody tr').forEach(row => {
      const match = !search || (section.dataset.formulaTitle + ' ' + row.textContent).toLowerCase().includes(search);
      row.hidden = !match;
      if (match) matches++;
    });
    section.hidden = !matches;
    section.open = search ? matches > 0 : section.dataset.defaultOpen === 'true';
    count += matches;
  });
  co('financialFormulaSearchStatus').textContent = count ? count + ' formulas' : 'No matching formulas';
}

function toggleFinancialFormulaSections(open) {
  co('financialDetailsMetrics').querySelectorAll('.financial-formula-section:not([hidden])').forEach(section => { section.open = open; });
}

function openFinancialDetails() {
  const sections = financialFormulaSections();
  sections.sort((a,b) => Number(b.key === financialModule) - Number(a.key === financialModule));
  co('financialDetailsTitle').textContent = 'Financial Formulas';
  co('financialDetailsScope').textContent = 'All modules · Selected dates ' + co('coFrom').value + ' to ' + co('coTo').value + ' · Active module: ' + financialModule;
  co('financialDetailsMetrics').innerHTML = '<div class="financial-formula-tools"><label><span class="co-sr-only">Search formulas</span>' +
    '<input type="search" placeholder="Search a metric, formula or module…" oninput="filterFinancialFormulas(this.value)" aria-controls="financialFormulaSections"></label>' +
    '<button class="co-btn" type="button" onclick="toggleFinancialFormulaSections(true)">Expand all</button>' +
    '<button class="co-btn" type="button" onclick="toggleFinancialFormulaSections(false)">Collapse all</button>' +
    '<span id="financialFormulaSearchStatus" role="status"></span></div><div id="financialFormulaSections">' +
    sections.map(section => {
      const open = section.key === financialModule || section.key === 'summary';
      return '<details class="financial-formula-section" data-formula-title="' + centerEscape(section.title) + '" data-default-open="' + open + '"' + (open ? ' open' : '') + '>' +
        '<summary>' + centerEscape(section.title) + '<span>' + section.rows.length + ' formulas</span></summary>' +
        '<p>' + centerEscape(section.scope) + '</p>' + financialTable(['Metric','Calculation','Current value','Notes'],
          section.rows.map(row => row.map(value => centerEscape(value)))) + '</details>';
    }).join('') + '</div>';
  co('financialDetailsSource').textContent = 'Values are a snapshot when this panel opens. Revenue, Cost Analysis and other modules can use different scopes, as stated above. Demo estimates are not live financial records. ' +
    (cptUpload ? 'Uploaded CPT workbook: ' + cptUpload + '.' : 'Sample CPT rates are active.');
  filterFinancialFormulas('');
  if (!co('financialDetails').open) co('financialDetails').showModal();
}

function financialClientCredit(group) {
  const balances = {
    hyderabad: [50000, 45000],
    bengaluru: [60000, 60000],
    chennai: [40000, 43000],
    mumbai: [75000, 36000],
    delhi: [50000, 40000]
  };
  const record = group.records[0];
  const balance = balances[record?.centerId];
  if (!balance || record.clientType !== 'Credit Client') return null;
  const [limit, outstanding] = balance;
  const usage = outstanding / limit;
  const status = usage > 1 ? 'Over Limit' : usage === 1 ? 'At Limit' : usage >= .8 ? 'Near Limit' : 'Within Limit';
  const tone = usage >= 1 ? 'urgent' : usage >= .8 ? 'warning' : 'healthy';
  return { limit, outstanding, available: limit - outstanding, usage, status, tone };
}

function reviewFinancialCredit(index) {
  const group = financialVisibleGroups[index];
  const credit = group && financialClientCredit(group);
  if (!credit) return;
  co('financialCreditTitle').textContent = group.name + ' · Credit Review';
  co('financialCreditDetails').innerHTML = financialTable(['Metric', 'Value'], [
    ['Credit limit', centerMoney(credit.limit)],
    ['Outstanding amount', centerMoney(credit.outstanding)],
    ['Available credit', centerMoney(credit.available)],
    ['Limit used', (credit.usage * 100).toLocaleString('en-IN', { maximumFractionDigits: 1 }) + '%'],
    ['Status', credit.status]
  ]);
  co('financialCreditDialog').showModal();
  enhanceFinancialTables(co('financialCreditDetails'), 'Credit Review');
}

/* Keep native select values and change handlers as the source of truth. */
function mountFinancialFieldDesign() {
  const main = document.querySelector('.co-main');
  const fields = new Map();
  let active = null;
  const labels = { coCenter: 'Centre', coCity: 'City', coZone: 'Sales Zone',
    financialHeaderClientType: 'Client Type', financialHeaderClient: 'Client',
    financialCategory: 'Test Category', financialDoctor: 'Doctor', financialRep: 'PRO / Sales Rep' };
  function close(restoreFocus = false) {
    if (!active) return;
    const prior = active;
    active = null;
    prior.panel.remove();
    prior.button.setAttribute('aria-expanded', 'false');
    if (restoreFocus) prior.button.focus();
  }
  function open(select, button, label) {
    if (active?.button === button) return close(true);
    close();
    const panel = document.createElement('div');
    panel.className = 'financial-select-panel';
    if (select.id === 'financialDoctor') panel.classList.add('financial-doctor-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', label);
    const heading = document.createElement('div');
    heading.className = 'financial-select-heading';
    heading.textContent = label + (select.id === 'financialDoctor' && select.dataset.demoDirectory === 'true' ? ' · Demo directory' : '');
    const list = document.createElement('div');
    list.className = 'financial-select-options';
    const multiple = financialMultiFilterIds.has(select.id);
    const options = Array.from(select.options).filter(option => !option.disabled && (!multiple || option.value !== 'all'));
    const selected = () => financialMultiFilters.get(select.id) || new Set(options.map(option => option.value));
    const footer = document.createElement('div');
    footer.className = 'financial-select-footer';
    let allButton;
    function applySelection(values) {
      financialMultiFilters.set(select.id, values.size === options.length ? null : values);
      select.value = 'all';
      if (select.id === 'financialHeaderClient') financialHeaderClient = 'all';
      financialTrail = [];
      if (['coCenter', 'coCity', 'coZone'].includes(select.id)) {
        centerSalesState.signature = '';
        renderCenterOverview();
      } else renderFinancialReport();
      sync();
      refreshSelection();
    }
    function refreshSelection() {
      const values = selected();
      list.querySelectorAll('input[type="checkbox"]').forEach(input => { input.checked = values.has(input.value); });
      if (allButton) allButton.textContent = (values.size === options.length ? 'Deselect all' : 'Select all') + ' (' + options.length + ')';
      footer.textContent = values.size + ' of ' + options.length + ' selected' +
        (select.id === 'financialDoctor' && select.dataset.demoDirectory === 'true' ? ' · Demo data' : '');
    }
    function draw(query = '') {
      list.replaceChildren();
      for (const option of options.filter(item => item.text.toLowerCase().includes(query.toLowerCase()))) {
        if (multiple) {
          const row = document.createElement('label');
          row.className = 'financial-check-option';
          const check = document.createElement('input');
          check.type = 'checkbox';
          check.value = option.value;
          check.checked = selected().has(option.value);
          check.addEventListener('change', () => {
            const values = new Set(selected());
            check.checked ? values.add(option.value) : values.delete(option.value);
            applySelection(values);
          });
          const text = document.createElement('span');
          text.textContent = option.text;
          row.append(check, text);
          if (select.id === 'financialDoctor' && option.dataset.testCount) {
            const count = document.createElement('small');
            count.className = 'financial-doctor-count';
            count.textContent = centerNumber(Number(option.dataset.testCount));
            count.title = 'Tests in the selected location and date scope';
            count.setAttribute('aria-label', count.textContent + ' tests');
            row.appendChild(count);
          }
          list.appendChild(row);
          continue;
        }
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'financial-select-option';
        item.textContent = option.text;
        item.setAttribute('aria-pressed', String(option.selected));
        item.addEventListener('click', () => {
          select.value = option.value;
          close(true);
          select.dispatchEvent(new Event('change', { bubbles: true }));
          sync();
        });
        list.appendChild(item);
      }
      if (!list.children.length) {
        const empty = document.createElement('p');
        empty.textContent = 'No matches found';
        list.appendChild(empty);
      }
    }
    panel.appendChild(heading);
    let search;
    if (multiple || (select.id !== 'financialHeaderClientType' && options.length > 6)) {
      search = document.createElement('input');
      search.type = 'search';
      search.className = 'financial-select-search';
      search.placeholder = select.id === 'financialDoctor' ? 'Search ' + options.length + ' doctors…' : 'Search options…';
      search.setAttribute('aria-label', 'Search ' + label);
      search.addEventListener('input', () => draw(search.value));
      panel.appendChild(search);
    }
    if (multiple) {
      allButton = document.createElement('button');
      allButton.type = 'button';
      allButton.className = 'financial-select-all';
      allButton.addEventListener('click', () => applySelection(selected().size === options.length ? new Set() : new Set(options.map(option => option.value))));
      panel.appendChild(allButton);
    }
    draw();
    panel.appendChild(list);
    if (multiple) { panel.appendChild(footer); refreshSelection(); }
    document.body.appendChild(panel);
    active = { panel, button };
    button.setAttribute('aria-expanded', 'true');
    const rect = button.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, select.id === 'financialDoctor' ? 320 : 250), innerWidth - 24);
    panel.style.width = width + 'px';
    panel.style.left = Math.max(12, Math.min(rect.left, innerWidth - width - 12)) + 'px';
    const below = innerHeight - rect.bottom - 20;
    const room = below >= 200 ? below : rect.top - 20;
    panel.style.maxHeight = Math.max(120, Math.min(360, room)) + 'px';
    if (below >= 200) panel.style.top = rect.bottom + 8 + 'px';
    else panel.style.bottom = Math.max(12, innerHeight - rect.top + 8) + 'px';
    (search || list.querySelector('[aria-pressed="true"]') || list.querySelector('button'))?.focus();
    panel.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); close(true); }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const items = Array.from(panel.querySelectorAll('input, button'));
        const index = items.indexOf(document.activeElement);
        const next = (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        event.preventDefault();
        items[next]?.focus();
      }
    });
  }
  function sync() {
    main.querySelectorAll('.co-header select, .co-financial-report select').forEach(select => {
      if (select.closest('.financial-table-footer')) return;
      if (!fields.has(select)) {
        const label = labels[select.id] || select.closest('label')?.firstChild?.textContent?.trim() || 'Select option';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'financial-select-trigger';
        button.dataset.fieldLabel = label;
        button.setAttribute('aria-haspopup', 'dialog');
        button.setAttribute('aria-expanded', 'false');
        select.classList.add('financial-native-select');
        select.insertAdjacentElement('afterend', button);
        button.addEventListener('click', event => { event.preventDefault(); open(select, button, label); });
        fields.set(select, { button, label });
      }
      const { button, label } = fields.get(select);
      const values = financialMultiFilters.get(select.id);
      const text = values ? values.size === 0 ? 'None' : values.size === 1 ?
        Array.from(select.options).find(option => values.has(option.value))?.text || '1 selected' : values.size + ' selected' :
        select.selectedOptions[0]?.text || 'All';
      if (button.textContent !== text) button.textContent = text;
      button.title = text;
      button.disabled = select.disabled;
      button.setAttribute('aria-label', label + ': ' + text);
    });
    for (const [select] of fields) if (!select.isConnected) fields.delete(select);
  }
  sync();
  new MutationObserver(sync).observe(main, { childList: true, subtree: true });
  main.addEventListener('change', sync);
  document.addEventListener('pointerdown', event => {
    if (active && !active.panel.contains(event.target) && !active.button.contains(event.target)) close();
  });
  document.addEventListener('focusin', event => {
    if (active && !active.panel.contains(event.target) && event.target !== active.button) close();
  });
  window.addEventListener('resize', () => close());
  window.addEventListener('hashchange', () => close());
  document.addEventListener('scroll', event => {
    if (active && !active.panel.contains(event.target)) close();
  }, true);
}

mountFinancialFieldDesign();

function mountFinancialChartTooltips() {
  const tooltip = document.createElement('div');
  tooltip.id = 'financialChartTooltip';
  tooltip.className = 'financial-chart-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  document.body.appendChild(tooltip);
  let target = null;
  let previousDescription = null;
  function hide() {
    tooltip.hidden = true;
    if (target) {
      target.classList.remove('is-tooltip-active');
      const donut = target.closest('.cost-donut');
      if (donut) {
        donut.querySelector('b').textContent = donut.dataset.defaultShare;
        donut.querySelector('small').textContent = 'Salaries';
      }
      if (previousDescription === null) target.removeAttribute('aria-describedby');
      else target.setAttribute('aria-describedby', previousDescription);
    }
    target = null;
  }
  function position(event) {
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const pointer = event && typeof event.clientX === 'number';
    const x = pointer ? event.clientX : rect.left + rect.width / 2;
    const y = pointer ? event.clientY : rect.bottom;
    const width = tooltip.offsetWidth, height = tooltip.offsetHeight;
    tooltip.style.left = Math.max(12, Math.min(x + 14, innerWidth - width - 12)) + 'px';
    tooltip.style.top = Math.max(12, y + height + 26 > innerHeight ? y - height - 14 : y + 14) + 'px';
  }
  function show(element, event) {
    if (target !== element) {
      hide();
      let data;
      try { data = JSON.parse(element.dataset.costTooltip); } catch { return; }
      tooltip.replaceChildren();
      const title = document.createElement('strong');
      title.textContent = data.title;
      tooltip.appendChild(title);
      for (const [label,value] of data.rows) {
        const row = document.createElement('div');
        const caption = document.createElement('span');
        const amount = document.createElement('b');
        caption.textContent = label;
        amount.textContent = value;
        row.append(caption, amount);
        tooltip.appendChild(row);
      }
      target = element;
      element.classList.add('is-tooltip-active');
      const donut = element.closest('.cost-donut');
      if (donut && element.dataset.donutLabel) {
        donut.querySelector('b').textContent = element.dataset.donutShare;
        donut.querySelector('small').textContent = element.dataset.donutLabel;
      }
      previousDescription = element.getAttribute('aria-describedby');
      element.setAttribute('aria-describedby', [previousDescription,tooltip.id].filter(Boolean).join(' '));
    }
    tooltip.hidden = false;
    position(event);
  }
  document.addEventListener('pointerover', event => {
    const element = event.target.closest?.('[data-cost-tooltip]');
    if (element) show(element, event);
  });
  document.addEventListener('pointermove', event => { if (target) position(event); });
  document.addEventListener('pointerout', event => {
    if (target && !target.contains(event.relatedTarget) && document.activeElement !== target) hide();
  });
  document.addEventListener('focusin', event => {
    const element = event.target.closest?.('[data-cost-tooltip]');
    if (element) show(element);
    else hide();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
  document.addEventListener('scroll', hide, true);
  window.addEventListener('resize', hide);
  window.addEventListener('hashchange', hide);
  document.addEventListener('financialchartsrefresh', hide);
}

mountFinancialChartTooltips();

function financialTableRowGroups(rows) {
  const groups = [];
  for (const row of rows) {
    if (row.classList.contains('cost-breakdown-row')) {
      if (groups.length) groups[groups.length - 1].details.push(row);
    } else if (!row.querySelector('.co-empty')) groups.push({row, details:[]});
  }
  return groups;
}

function financialTablePageWindow(count, page, size) {
  const pages = Math.max(1, Math.ceil(count / size));
  const current = Math.max(1, Math.min(page, pages));
  const start = (current - 1) * size;
  return {page:current, pages, start, end:Math.min(start + size, count)};
}

function financialTableCellText(cell) {
  const name = cell.querySelector('.financial-drill-name');
  if (name) return name.textContent.trim();
  const copy = cell.cloneNode(true);
  copy.querySelectorAll('svg').forEach(node => node.remove());
  copy.querySelectorAll('br').forEach(node => node.replaceWith(document.createTextNode(' ')));
  return copy.textContent.replace(/\s+/g, ' ').trim();
}

function exportFinancialDataTable(controller) {
  const table = controller.table;
  const header = Array.from(table.tHead?.rows[0]?.cells || []).map(financialTableCellText);
  const columns = header.map((label,index) => /^(Action|Review)$/i.test(label) ? -1 : index).filter(index => index >= 0);
  const values = row => columns.map(index => row.cells[index] ? financialTableCellText(row.cells[index]) : '');
  const rows = [columns.map(index => header[index]), ...controller.groups.map(group => values(group.row)),
    ...Array.from(table.tFoot?.rows || []).map(values)];
  if (controller.module === 'Profit & Loss') {
    const capital = co('financialOtherModule').querySelector('.pnl-capital');
    if (capital) rows.push(['Capital expenditure (shown separately)',capital.querySelector('strong').textContent,
      capital.querySelector('p').textContent]);
  }
  const range = controller.module === 'Cost Analysis' ? financialPeriod(financialCostPeriod) :
    {start:co('coFrom').value,end:co('coTo').value};
  downloadCenterInsightCSV(controller.exportName, rows, range);
}

function enhanceFinancialTables(root, contextTitle) {
  root = root || co(financialModule === 'Overall Revenue' ? 'financialRevenueModule' : 'financialOtherModule');
  if (!root) return;
  const filterScope = JSON.stringify([
    co('coFrom').value, co('coTo').value, co('coCenter').value, co('coCity').value, co('coZone').value,
    financialHeaderClientType, financialHeaderClient, financialView, financialTrail,
    financialCostPeriod, financialPivotRows, financialPivotMeasure, financialPnlCptTreatment, cptUpload,
    Array.from(financialMultiFilters, ([id,values]) => [id, values ? [...values].sort() : 'all'])
  ]);
  const tables = Array.from(root.querySelectorAll('table.co-financial-table'));
  tables.forEach((table, index) => {
    const detail = table.closest('.cost-breakdown');
    const key = [contextTitle || financialModule, financialModule === 'Cost Analysis' ? financialExpenseView : '',
      detail ? detail.id : index].join(':');
    let state = financialTablePageStates.get(key);
    if (!state) {
      state = {page:1, size:10, scope:filterScope};
      financialTablePageStates.set(key, state);
    } else if (state.scope !== filterScope) {
      state.page = 1;
      state.scope = filterScope;
    }
    let controller = financialTableControllers.get(table);
    if (!controller) {
      controller = {table, groups:[], state};
      financialTableControllers.set(table, controller);
      const wrap = table.closest('.co-table-wrap');
      const label = detail?.querySelector('h4')?.textContent || contextTitle ||
        (financialModule === 'Inventory' && index === 1 ? 'Monthly Branch Stock Comparison' : financialModule);
      table.setAttribute('aria-label', label);
      controller.module = contextTitle || financialModule;
      controller.exportName = 'financial-' + label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');

      // Pivot already owns a scope-aware CSV export; do not duplicate it.
      const hasPivotExport = financialModule === 'Cost Analysis' && financialExpenseView === 'pivot' && !contextTitle;
      if (!hasPivotExport) {
        const tools = document.createElement('div');
        tools.className = 'financial-table-actions';
        const exportButton = document.createElement('button');
        exportButton.type = 'button';
        exportButton.className = 'co-btn financial-table-export';
        exportButton.innerHTML = dashboardIcon('Download') + '<span>Export CSV</span>';
        exportButton.setAttribute('aria-label', 'Export all filtered rows: ' + label);
        exportButton.title = 'Export all filtered rows, including totals';
        exportButton.addEventListener('click', () => exportFinancialDataTable(controller));
        tools.appendChild(exportButton);
        wrap.insertAdjacentElement('beforebegin', tools);
        controller.exportButton = exportButton;
      }
      const footer = document.createElement('div');
      footer.className = 'financial-table-footer';
      const info = document.createElement('div');
      info.className = 'financial-table-range';
      const status = document.createElement('span');
      status.setAttribute('role','status');
      const totalNote = document.createElement('small');
      totalNote.textContent = table.tFoot ? 'Totals include all filtered rows' : '';
      info.append(status,totalNote);
      const controls = document.createElement('div');
      controls.className = 'financial-table-pagination';
      const sizeLabel = document.createElement('label');
      sizeLabel.appendChild(document.createTextNode('Rows'));
      const sizeSelect = document.createElement('select');
      sizeSelect.setAttribute('aria-label','Rows per page: ' + label);
      for (const size of [5,10,25,50]) sizeSelect.appendChild(new Option(String(size),String(size)));
      sizeSelect.addEventListener('change', () => {
        controller.state.size = Number(sizeSelect.value);
        controller.state.page = 1;
        controller.render();
      });
      sizeLabel.appendChild(sizeSelect);
      controls.appendChild(sizeLabel);
      const pageLabel = document.createElement('span');
      pageLabel.className = 'financial-table-page-label';
      controller.buttons = [];
      for (const [action,labelText,path] of [
        ['first','First page','M6 5v14m12-14-7 7 7 7'], ['previous','Previous page','m15 5-7 7 7 7'],
        ['next','Next page','m9 5 7 7-7 7'], ['last','Last page','M18 5v14M6 5l7 7-7 7']
      ]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'financial-table-page-button';
        button.setAttribute('aria-label', labelText + ': ' + label);
        button.title = labelText;
        button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + path + '"/></svg>';
        button.addEventListener('click', () => {
          const pageWindow = financialTablePageWindow(controller.groups.length, controller.state.page, controller.state.size);
          controller.state.page = action === 'first' ? 1 : action === 'last' ? pageWindow.pages :
            pageWindow.page + (action === 'next' ? 1 : -1);
          controller.render();
        });
        if (action === 'next') controls.appendChild(pageLabel);
        controls.appendChild(button);
        controller.buttons.push(button);
      }
      footer.append(info,controls);
      wrap.insertAdjacentElement('afterend',footer);
      controller.status = status;
      controller.pageLabel = pageLabel;
      controller.sizeSelect = sizeSelect;
      controller.render = () => {
        const page = financialTablePageWindow(controller.groups.length, controller.state.page, controller.state.size);
        controller.state.page = page.page;
        controller.groups.forEach((group, rowIndex) => {
          const visible = rowIndex >= page.start && rowIndex < page.end;
          group.row.hidden = !visible;
          const expanded = !!group.row.querySelector('[aria-expanded="true"]');
          group.details.forEach(row => { row.hidden = !visible || !expanded; });
        });
        controller.sizeSelect.value = String(controller.state.size);
        controller.status.textContent = controller.groups.length ?
          'Showing ' + (page.start+1) + '–' + page.end + ' of ' + controller.groups.length : '0 rows';
        controller.pageLabel.textContent = 'Page ' + page.page + ' of ' + page.pages;
        controller.buttons.forEach((button,index) => { button.disabled = index < 2 ? page.page === 1 : page.page === page.pages; });
        if (controller.exportButton) controller.exportButton.disabled = !controller.groups.length;
      };
    }
    controller.state = state;
    controller.groups = financialTableRowGroups(Array.from(table.tBodies).flatMap(body => Array.from(body.rows)));
    controller.render();
  });
}
