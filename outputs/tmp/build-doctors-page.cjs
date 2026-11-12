const fs=require('fs'),crypto=require('crypto');
const tat=fs.readFileSync('tat-operations.html','utf8');
let sidebar=tat.slice(tat.indexOf('<aside class="reference-sidebar"'),tat.indexOf('</aside>',tat.indexOf('<aside class="reference-sidebar"'))+8);
sidebar=sidebar.replace(/reference-menu active/g,'reference-menu').replace(/ aria-current="page"/g,'').replace(/onclick="showModuleNotice\('Doctors'\)"/g,'onclick="location.href=\'doctors.html\'" aria-current="page"');
sidebar=sidebar.replace(/class="reference-menu" type="button" onclick="location.href='doctors.html'"/,'class="reference-menu active" type="button" onclick="location.href=\'doctors.html\'"');
const styles=['tat-revenue-base.css','kpi-typography.css','wide-banner.css','financial-dashboard-theme.css','application-sidebar.css','application-chart-backgrounds.css','dashboard-financial-foundation.css','formula-popup-headers.css','doctors.css','dashboard-theme.css'];
const definitions=[
 ['Doctor revenue','Revenue reported for the named referrer and report period. The values are preserved as printed.'],
 ['Bills and patients','Source-reported counts. Bill counts can differ from patient counts. Category-level bill counts need not match the doctor-level count.'],
 ['Category mix','Bills, test volume and revenue attributed to the displayed doctor and category in the supplied report.'],
 ['Individual test volume','The test volume reported under the selected doctor and category. No test names or values are generated.'],
 ['New doctors','Doctors listed under New doctors this period, with the source first-bill date, bill count and revenue.'],
 ['Dormant doctors','Active in the prior 90 days, with zero activity in the report window. Prior bills and prior revenue refer to the earlier activity.'],
 ['Report row counts','The source report lists 1,930 top referrers, 1,931 new doctors and 8,900 dormant doctors. Only the visible first 10 rows of each report are available here.'],
 ['Filtered availability','Search, sorting and exports use the available source rows. Report totals are never reconstructed from unavailable pages.']
];
const html=`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mr. Yoda · Doctors</title><meta name="description" content="Doctor referrals, new doctors and dormant referrers, with category and individual-test breakdowns.">
${styles.map(file=>'<link rel="stylesheet" href="'+file+'">').join('\n')}
<script src="lucide-ui.js"></script></head><body class="doctors-page">
${sidebar}
<main><header class="home-header"><div class="analytics-date-row"><div class="analytics-date-range"><input type="date" id="homeFrom" aria-label="From date"><span aria-hidden="true">→</span><input type="date" id="homeTo" aria-label="To date"></div><div class="analytics-shortcuts" id="shortcuts"></div></div><div class="doctors-header-search"><label for="doctorSearch">Doctor / referrer</label><input type="search" id="doctorSearch" placeholder="Search available doctor names"><div class="analytics-meta"><span>6–12 Nov 2026</span><button type="button" id="doctorsReset" class="analytics-refresh" title="Reset to report period" aria-label="Reset filters">↻</button></div></div></header>
<div class="doctors-content"><section class="application-title-strip dashboard-wide-banner doctors-banner"><div><h1>Doctors</h1><p>Top referrers, new doctors this period, and dormant referrers active in the prior 90 days with zero activity in this window.</p><div class="dashboard-formula-actions"><button type="button" id="doctorsOpenFormulas">FORMULAS</button></div></div><aside class="wide-banner-summary" aria-label="Leading visible referrer"><div class="wide-banner-summary-heading"><span>Leading visible referrer · Revenue</span><span class="wide-banner-summary-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87"/></svg></span></div><div class="wide-banner-summary-value" id="doctorsBannerValue"></div><div class="wide-banner-summary-details"><span id="doctorsBannerName"></span><span id="doctorsBannerBills"></span></div></aside></section>
<div class="doctors-kpis" id="doctorsSummary" aria-label="Doctor report summary"></div><p class="doctors-message" id="doctorsMessage" role="status"></p><span id="doctorsPeriod" hidden></span>
<div class="doctors-layout-tools"><div class="doctors-tabs" id="doctorsTabs" role="tablist" aria-label="Doctor reports"></div><label class="doctors-view-switch"><span id="doctorsViewLabel">Show all tables</span><input type="checkbox" role="switch" id="doctorsShowAll" aria-labelledby="doctorsViewLabel"></label></div><div id="doctorsReports"></div></div></main>
<dialog class="dashboard-formula-dialog doctors-formulas" id="doctorsFormulas" aria-labelledby="doctorsFormulaTitle"><header class="dashboard-formula-heading"><div><span class="dashboard-formula-eyebrow">DOCTORS</span><h2 id="doctorsFormulaTitle">Doctors Formulas & Metric Definitions</h2><p id="doctorsFormulaPeriod"></p></div><button type="button" id="doctorsCloseFormulas" aria-label="Close formulas">×</button></header><div class="dashboard-formula-body">${definitions.map(([name,text])=>'<article><h3>'+name+'</h3><p>'+text+'</p></article>').join('')}</div></dialog>
<script src="doctors-data.js"></script><script src="doctors.js"></script><script src="application-sidebar.js"></script><script src="dashboard-financial-foundation.js"></script><script src="dashboard-value-formulas.js"></script></body></html>`;
fs.writeFileSync('doctors.html',html);
for(const file of ['home.html','revenue-sales.html','specialty.html','tests-patients.html','center-overview.html','qc-dashboard.html','tat-operations.html']){
 const original=fs.readFileSync(file,'utf8'),updated=original.replace(/onclick="showModuleNotice\('Doctors'\)"/g,'onclick="location.href=\'doctors.html\'"');
 if(updated!==original)fs.writeFileSync(file,updated);
 else if(!original.includes("location.href='doctors.html'"))throw Error('Doctors navigation not found in '+file);
}
const hash=crypto.createHash('sha256').update(fs.readFileSync('C:/Users/VEERAIAH/Downloads/doctors.pdf')).digest('hex');
const source=fs.readFileSync('doctors-data.js','utf8').replace("source:{file:'doctors.pdf',visibleRowsOnly:true}","source:{file:'doctors.pdf',sha256:'"+hash+"',visibleRowsOnly:true}");fs.writeFileSync('doctors-data.js',source);
console.log('Created Doctors page and connected all seven existing sidebar menus.');
