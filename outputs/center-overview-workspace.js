/* One administration workspace: three areas, one report selector, one active reporting period. */
const centerWorkspaceRoutes={performance:{title:'Center Performance',reports:[{key:'centers',label:'Centers',panel:'coPanel-overview',help:'Compare center finances. Expand a center to see departments, then employees.'},{key:'departments',label:'Departments & Workforce',panel:'coPanel-departments',help:'These are employee departments. Expand a department to compare its centers; billed test categories appear in Client & Test Details.'},{key:'zones',label:'Zones',panel:'coPanel-zones',help:'Compare geographic performance. View Centers opens the selected zone in the center report.'}]},revenue:{title:'Revenue & Clients',reports:[{key:'people',label:'Revenue by Person',panel:'coSalesPanel-contributions',help:'Every revenue grouping reconciles to the same center net revenue.'},{key:'clients',label:'Client & Test Details',panel:'coSalesPanel-clients',help:'PRO means the business source. Open a PRO, then a client, to see billed test categories. The account manager is the sales representative responsible for the client.'},{key:'monthly',label:'Monthly Client Health',panel:'coSalesPanel-tiers',help:'Compare this month with the previous month. The month selector above controls the entire view, including KPIs and charts.'}]},team:{title:'Team & Assignments',reports:[{key:'accounts',label:'Unassigned Clients',panel:'coSalesPanel-unassigned',help:'Review institutional clients who need an account manager. Their revenue is already included in center totals; walk-in clients are excluded.'},{key:'hierarchy',label:'Sales Reporting Structure',panel:'coSalesPanel-hierarchy',help:'See who reports to whom: Sales Director → Sales Manager → Sales Representative → PRO.'},{key:'leadership',label:'Center Leadership',panel:'coWorkspace-leadership',help:'See the center head, medical head and center workforce. View opens the full center profile.'}]}};
const centerWorkspaceState={area:'performance',reports:{performance:'centers',revenue:'people',team:'accounts'},monthly:false,savedDates:null};
function currentCenterWorkspaceReport(){return centerWorkspaceRoutes[centerWorkspaceState.area].reports.find(report=>report.key===centerWorkspaceState.reports[centerWorkspaceState.area])}
function centerWorkspaceDateLabel(value){if(!value)return '—';return new Date(value+'T00:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'})}
function centerWorkspaceScopeText(){let dates=centerDateRange(co('coFrom').value,co('coTo').value),center=co('coCenter').value==='all'?'All Centers ('+currentCenterRows.length+')':centerDefinitions.find(item=>item.id===co('coCenter').value)?.name||'Center',city=co('coCity').value,zone=co('coZone').value,location=[center,city!=='all'?city:null,zone!=='all'?zone+' Zone':null].filter(Boolean).join(' · '),period=centerWorkspaceState.monthly?(co('coTierMonth').value?new Date(co('coTierMonth').value+'-01T00:00:00Z').toLocaleDateString('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}):'Choose a month'):dates?centerWorkspaceDateLabel(dates.start)+(dates.end===dates.start?'':' – '+centerWorkspaceDateLabel(dates.end)):'Choose valid dates';return {location,period}}
function syncCenterWorkspace(){let state=centerWorkspaceState,definition=centerWorkspaceRoutes[state.area],report=currentCenterWorkspaceReport();Object.keys(centerWorkspaceRoutes).forEach(area=>{co('coWorkspaceTab-'+area).setAttribute('aria-selected',String(area===state.area));co('coWorkspaceTab-'+area).tabIndex=area===state.area?0:-1;centerWorkspaceRoutes[area].reports.forEach(item=>co(item.panel).hidden=item.panel!==report.panel)});co('coWorkspacePanels').setAttribute('aria-labelledby','coWorkspaceTab-'+state.area);if(co('coWorkspaceReport').dataset.area!==state.area){co('coWorkspaceReport').innerHTML=definition.reports.map(item=>'<option value="'+item.key+'">'+item.label+'</option>').join('');co('coWorkspaceReport').dataset.area=state.area}co('coWorkspaceReport').value=report.key;co('coWorkspaceBreadcrumb').textContent=definition.title+' › '+report.label;let people=state.area==='revenue'&&report.key==='people',help=report.help;if(people){let grouping=centerInsightState.owner==='employee'?'Center Employees: activity credited to center staff. Employees with no attributed activity show ₹0.':centerInsightState.owner==='manager'?'Sales Managers: revenue grouped by account ownership. Unassigned revenue highlights accounts without a manager.':'Sales Representatives: revenue grouped by the representative responsible for each account.';help=grouping+' Every grouping reconciles to the same center net revenue.'}co('coWorkspaceHelp').textContent=help;co('coWorkspaceGrouping').hidden=co('coWorkspaceOwnerSearch').hidden=!people;co('coWorkspaceOwnerType').value=centerInsightState.owner;document.querySelector('.co-date-row').hidden=state.monthly;co('coWorkspaceMonthHeader').hidden=!state.monthly;let scope=centerWorkspaceScopeText();co('coWorkspaceScope').innerHTML='<span><b>Scope</b> '+centerEscape(scope.location)+'</span><span><b>'+(state.monthly?'Month':'Period')+'</b> '+centerEscape(scope.period)+'</span>';co('coWorkspaceChartScope').textContent=scope.location+' · '+scope.period;let unassigned=centerUnassignedClients().length;co('coWorkspaceAttention').hidden=!unassigned;co('coWorkspaceAttention').textContent=unassigned;co('coWorkspaceAttention').setAttribute('aria-label',unassigned+' unassigned clients');centerInsightState.view=state.area==='performance'?(report.key==='centers'?'overview':report.key):'owners';centerSalesState.report=state.area==='revenue'?({people:'contributions',clients:'clients',monthly:'tiers'}[report.key]):state.area==='team'?(report.key==='accounts'?'unassigned':'hierarchy'):'contributions'}
function selectCenterWorkspace(area,reportKey,focus=false){let state=centerWorkspaceState;if(!centerWorkspaceRoutes[area])return;let report=reportKey||state.reports[area],definition=centerWorkspaceRoutes[area].reports.find(item=>item.key===report);if(!definition)return;let wasMonthly=state.monthly,nextMonthly=area==='revenue'&&report==='monthly',changedDates=false;state.area=area;state.reports[area]=report;if(nextMonthly&&!wasMonthly)state.savedDates={from:co('coFrom').value,to:co('coTo').value};state.monthly=nextMonthly;if(nextMonthly){let bounds=centerMonthBounds(co('coTierMonth').value||co('coTo').value.slice(0,7));if(bounds){co('coTierMonth').value=bounds.start.slice(0,7);changedDates=co('coFrom').value!==bounds.start||co('coTo').value!==bounds.end;co('coFrom').value=bounds.start;co('coTo').value=bounds.end}}else if(wasMonthly&&state.savedDates){changedDates=co('coFrom').value!==state.savedDates.from||co('coTo').value!==state.savedDates.to;co('coFrom').value=state.savedDates.from;co('coTo').value=state.savedDates.to;state.savedDates=null}syncCenterWorkspace();if(changedDates)renderCenterOverview();else if(nextMonthly)renderCenterTiers();if(focus)co('coWorkspaceTab-'+area).focus()}
function selectCenterWorkspaceReport(key){selectCenterWorkspace(centerWorkspaceState.area,key)}
function showCenterWorkspaceCharts(){co('coWorkspaceCharts').scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})}
// Existing drill-down links now arrive at the correct administration report.
switchCenterInsight=function(view,focus=false){if(view==='overview')selectCenterWorkspace('performance','centers',focus);else if(view==='departments'||view==='zones')selectCenterWorkspace('performance',view,focus);else if(view==='owners')selectCenterWorkspace('revenue','people',focus)};
setCenterSalesReport=function(report,focus=false){let routes={contributions:['revenue','people'],clients:['revenue','clients'],tiers:['revenue','monthly'],unassigned:['team','accounts'],hierarchy:['team','hierarchy']};if(routes[report])selectCenterWorkspace(...routes[report],focus)};
const centerWorkspaceOwnerType=setCenterOwnerType;setCenterOwnerType=function(type,focus=false){let result=centerWorkspaceOwnerType(type,focus);syncCenterWorkspace();return result};
const centerWorkspaceTierRender=renderCenterTiers;renderCenterTiers=function(){let result=centerWorkspaceTierRender.apply(this,arguments),bounds=centerMonthBounds(co('coTierMonth').value);co('coTierPeriodNote').textContent=bounds?'Reporting month '+co('coTierMonth').value+' · Compared with '+bounds.previous+' · Center and location filters apply.':'Choose a valid reporting month.';return result};
const centerWorkspaceMonthChange=changeCenterTierMonth;changeCenterTierMonth=function(value){co('coTierMonth').value=value;let result=centerWorkspaceMonthChange(value);if(centerWorkspaceState.monthly){let bounds=centerMonthBounds(value);if(bounds){co('coFrom').value=bounds.start;co('coTo').value=bounds.end;renderCenterOverview()}else syncCenterWorkspace()}return result};
const centerWorkspaceOriginalRender=renderCenterOverview;renderCenterOverview=function(){if(centerWorkspaceState.monthly){let bounds=centerMonthBounds(co('coTierMonth').value);if(bounds){co('coFrom').value=bounds.start;co('coTo').value=bounds.end}}let result=centerWorkspaceOriginalRender.apply(this,arguments);syncCenterWorkspace();return result};
const centerWorkspaceReset=resetCenterFilters;resetCenterFilters=function(){if(!centerWorkspaceState.monthly)return centerWorkspaceReset();co('coCenter').value=co('coCity').value=co('coZone').value='all';co('coTierMonth').value=centerToday.slice(0,7);centerSalesState.tierManual=false;changeCenterTierMonth(co('coTierMonth').value)};
function mountCenterWorkspace(){let target=co('coWorkspacePanels'),leadership=document.querySelector('.co-leadership-section'),leadershipPanel=document.createElement('div');leadershipPanel.id='coWorkspace-leadership';leadershipPanel.appendChild(leadership);target.appendChild(leadershipPanel);Object.values(centerWorkspaceRoutes).forEach(area=>area.reports.forEach(report=>{let panel=co(report.panel);target.appendChild(panel);panel.setAttribute('role','region');panel.removeAttribute('aria-labelledby');panel.setAttribute('aria-label',report.label)}));let comparison=co('coComparison').closest('section'),charts=document.querySelector('.co-charts');co('coWorkspaceCharts').append(comparison,charts);let monthLabel=co('coTierMonth').closest('label'),header=document.querySelector('.co-header'),monthHeader=document.createElement('div');monthHeader.id='coWorkspaceMonthHeader';monthHeader.className='co-workspace-month-header';monthHeader.hidden=true;monthHeader.appendChild(monthLabel);let hint=document.createElement('span');hint.textContent='Monthly report · KPIs, charts and client tiers use this month.';monthHeader.appendChild(hint);header.insertBefore(monthHeader,document.querySelector('.co-location-row'));co('coWorkspaceOwnerSearch').appendChild(co('coOwnerSearch'));let note=document.querySelector('.co-attribution-note p');if(note)note.textContent='Sample attribution. Every grouping shows the same center net revenue; sales staff are shared resources and are excluded from center headcount.';document.querySelectorAll('[data-workspace-icon]').forEach(node=>node.innerHTML=dashboardIcon(node.dataset.workspaceIcon));centerHierarchyState.expanded.clear();centerHierarchyState.departments.clear();centerSalesState.proExpanded.clear();centerSalesState.clientExpanded.clear();renderCenterHierarchy();renderCenterPROs();centerWorkspaceOwnerType('manager');enableCenterTabKeyboard(['performance','revenue','team'].map(area=>'coWorkspaceTab-'+area),index=>selectCenterWorkspace(['performance','revenue','team'][index],null,true));syncCenterWorkspace()}
mountCenterWorkspace();

function centerSidebarStoredState() {
  try { return sessionStorage.getItem('centerSidebarState') || 'expanded'; }
  catch { return 'expanded'; }
}

function storeCenterSidebarState(state) {
  try { sessionStorage.setItem('centerSidebarState', state); }
  catch { /* Storage is optional; the controls still work for this page view. */ }
}

function syncCenterSidebarControls() {
  const compact = document.body.classList.contains('sidebar-compact');
  const closed = document.body.classList.contains('sidebar-closed');
  const compactButton = co('centerSidebarCompact');
  const openButton = co('centerSidebarOpen');
  if (compactButton) {
    compactButton.textContent = compact ? '\u203a' : '\u2039';
    compactButton.setAttribute('aria-expanded', String(!compact));
    compactButton.setAttribute('aria-label', compact ? 'Expand sidebar' : 'Collapse sidebar');
    compactButton.title = compact ? 'Expand sidebar' : 'Collapse sidebar';
  }
  if (openButton) {
    const mobile = window.matchMedia('(max-width: 800px)').matches;
    const mobileOpen = document.body.classList.contains('sidebar-mobile-open');
    openButton.hidden = !(closed || (mobile && !mobileOpen));
    openButton.setAttribute('aria-expanded', String(!closed));
  }
}

function toggleCenterSidebarCompact() {
  document.body.classList.remove('sidebar-closed', 'sidebar-mobile-open');
  document.body.classList.toggle('sidebar-compact');
  storeCenterSidebarState(document.body.classList.contains('sidebar-compact') ? 'compact' : 'expanded');
  syncCenterSidebarControls();
}

function closeCenterSidebar() {
  document.body.classList.add('sidebar-closed');
  document.body.classList.remove('sidebar-mobile-open');
  storeCenterSidebarState('closed');
  syncCenterSidebarControls();
  co('centerSidebarOpen')?.focus();
}

function openCenterSidebar() {
  document.body.classList.remove('sidebar-closed', 'sidebar-compact');
  if (window.matchMedia('(max-width: 800px)').matches) document.body.classList.add('sidebar-mobile-open');
  storeCenterSidebarState(document.body.classList.contains('sidebar-compact') ? 'compact' : 'expanded');
  syncCenterSidebarControls();
  co('centerSidebarCompact')?.focus();
}

function mountCenterSidebarControls() {
  const sidebar = document.querySelector('.reference-sidebar');
  const brand = sidebar?.querySelector('.reference-brand');
  if (!sidebar || !brand || co('centerSidebarControls')) return;

  const controls = document.createElement('div');
  controls.id = 'centerSidebarControls';
  controls.className = 'center-sidebar-controls';

  const compact = document.createElement('button');
  compact.id = 'centerSidebarCompact';
  compact.type = 'button';
  compact.className = 'center-sidebar-action';
  compact.addEventListener('click', toggleCenterSidebarCompact);

  const close = document.createElement('button');
  close.id = 'centerSidebarClose';
  close.type = 'button';
  close.className = 'center-sidebar-action';
  close.textContent = '\u00d7';
  close.setAttribute('aria-label', 'Close sidebar');
  close.title = 'Close sidebar';
  close.addEventListener('click', closeCenterSidebar);
  controls.append(compact, close);
  brand.appendChild(controls);

  const open = document.createElement('button');
  open.id = 'centerSidebarOpen';
  open.type = 'button';
  open.className = 'center-sidebar-open';
  open.textContent = '\u2630  Open sidebar';
  open.setAttribute('aria-label', 'Open sidebar');
  open.title = 'Open sidebar';
  open.addEventListener('click', openCenterSidebar);
  document.body.appendChild(open);

  const stored = centerSidebarStoredState();
  document.body.classList.toggle('sidebar-compact', stored === 'compact');
  document.body.classList.toggle('sidebar-closed', stored === 'closed');
  syncCenterSidebarControls();

  window.addEventListener('resize', syncCenterSidebarControls);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.classList.contains('sidebar-mobile-open')) closeCenterSidebar();
  });
}

mountCenterSidebarControls();

// Client review: keep menu items visible; restore their original actions after approval.
const financialSidebarOriginalLinks = new Map();
function setFinancialSidebarDemoMode(enabled) {
  document.body.classList.toggle('financial-sidebar-demo', enabled);
  document.querySelectorAll('.reference-sidebar .reference-menu').forEach(item => {
    if (item.id === 'financialOverviewNav') return;
    if (!financialSidebarOriginalLinks.has(item)) {
      financialSidebarOriginalLinks.set(item, {
        onclick:item.getAttribute('onclick'), href:item.getAttribute('href'),
        disabled:item.disabled, ariaDisabled:item.getAttribute('aria-disabled'), title:item.getAttribute('title')
      });
    }
    const original = financialSidebarOriginalLinks.get(item);
    if (enabled) {
      item.removeAttribute('onclick');
      item.removeAttribute('href');
      item.disabled = true;
      item.setAttribute('aria-disabled', 'true');
      item.setAttribute('title', 'Temporarily unavailable during Financial Overview review');
      item.classList.remove('active');
    } else {
      for (const [attribute,value] of [['onclick',original.onclick],['href',original.href],['aria-disabled',original.ariaDisabled],['title',original.title]]) {
        if (value === null) item.removeAttribute(attribute);
        else item.setAttribute(attribute,value);
      }
      item.disabled = original.disabled;
    }
  });
  if (enabled && location.hash !== '#coWorkspaceCharts') history.replaceState(null, '', '#coWorkspaceCharts');
  if (typeof highlightFinancialOverview === 'function') highlightFinancialOverview();
}

setFinancialSidebarDemoMode(false);

function mountFinancialBranchComparison() {
  const chart = co('coComparison');
  const card = chart?.closest('section');
  if (!card || co('financialBranchComparison')) return;
  const section = document.createElement('details');
  section.id = 'financialBranchComparison';
  section.className = 'financial-comparison-section';
  const summary = document.createElement('summary');
  summary.innerHTML = '<span class="financial-comparison-icon">' + dashboardIcon('ChartColumn') + '</span>' +
    '<span class="financial-comparison-caption"><strong>Branch Financial Comparison</strong>' +
    '<small>Compare net revenue, total expenditure and branch balance</small></span>' +
    '<span class="financial-comparison-action"><span class="comparison-closed">Show chart</span>' +
    '<span class="comparison-open">Hide chart</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></span>';
  card.insertAdjacentElement('beforebegin', section);
  section.append(summary, card);
  const sync = () => { section.open = location.hash !== '#coWorkspaceCharts'; };
  sync();
  window.addEventListener('hashchange', sync);
}

mountFinancialBranchComparison();
