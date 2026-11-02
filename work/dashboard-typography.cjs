const fs=require('fs');const files=['outputs/home.html','outputs/qc-dashboard.html','outputs/revenue-sales.html','outputs/specialty.html'];const css=`<style id="dashboard-typography">
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
:root{--dashboard-font:'Inter',Arial,sans-serif}
body,input,select,button,table,dialog{font-family:var(--dashboard-font)}
body{font-size:14px;font-weight:400}
main h1,.home-content h1,.revenue-content h1,.specialty-title{font-family:var(--dashboard-font);font-size:24px;font-weight:600;letter-spacing:-.5px;line-height:1.35}
h2,.panel h2,.section-heading h2,.home-table h2,.rev-heading h2,.specialty-card h2{font-family:var(--dashboard-font);font-size:18px;font-weight:600;line-height:1.4}
.kpi-value,.metric,.home-kpi .metric,.home-kpi.primary .metric,.revenue-kpi strong{font-family:var(--dashboard-font);font-size:32px;font-weight:700;line-height:1.25;letter-spacing:-.6px}
.kpi-label,.home-kpi .label,.home-kpi.primary .label,.revenue-kpi h2{font-family:var(--dashboard-font);font-size:13px;font-weight:500;letter-spacing:0;line-height:1.5;white-space:normal}
th,.home-table th,.rev-scroll th,.specialty-scroll th{font-family:var(--dashboard-font);font-size:13px;font-weight:600;letter-spacing:0;line-height:1.5}
td,.home-table td,.rev-scroll td,.specialty-scroll td{font-family:var(--dashboard-font);font-size:14px;font-weight:400;line-height:1.6}
.reference-sidebar .reference-menu,.reference-sidebar .reference-menu span{font-family:var(--dashboard-font);font-size:14px;font-weight:500;line-height:1.4}
button,select,input,.back,.export-cta,.branch-link,.select-trigger,.toolbar button,.more-panel button,.home-header button,.rev-actions button,.home-filters select,.specialty-tabs button,.rev-page-size,.specialty-foot select,.chart-tabs button,.revenue-chart-toolbar select,.specialty-chart-controls button,.specialty-chart-controls select,dialog .back,.pretty-select-list li{font-family:var(--dashboard-font);font-size:14px;font-weight:500;line-height:1.4}
.reference-sidebar .reference-menu{padding-top:11px;padding-bottom:11px}
p,.sub,.kpi-foot,.home-kpi p,.revenue-kpi p,.home-kpi.primary p,.breadcrumb,.field,.home-filters label,.home-data,.summary-copy,.summary-right,.action-note,.action-num span,.legend,.cause,.home-note,.specialty-scroll td small,.test-detail,.mapped-test,.rev-foot,.rev-page-left span,.rev-page-nav span,.specialty-foot,.rev-chart-caption,.filter-summary,.last-updated,footer,.table-tools,.home-table .table-tools button{font-family:var(--dashboard-font);font-size:12px;font-weight:400;line-height:1.6}
.home-kpi .label{min-height:40px}.home-kpi{min-height:172px}.home-kpi.primary{min-height:360px}.revenue-kpi h2{min-height:40px}
.specialty-tag,.referral-pill,.booking-mode-pill,.canonical-empty-badge{font-family:var(--dashboard-font);font-size:12px;font-weight:500;line-height:1.5}
svg text{font-family:var(--dashboard-font)}
.close,.branch-chart-close,.rev-close{font-size:24px;font-weight:400}
.branch-tooltip{font-family:var(--dashboard-font);font-size:13px}.branch-tooltip strong{font-size:14px;font-weight:600}
.summary-copy strong,.action-num strong{font-family:var(--dashboard-font);font-weight:700}
@media(max-width:760px){.home-kpi.primary .metric,.revenue-kpi strong,.kpi-value,.home-kpi .metric{font-size:28px}.home-kpi.primary{min-height:260px}.home-kpi .label{min-height:40px}}
</style>`;for(const p of files){let h=fs.readFileSync(p,'utf8');h=h.replace(/<style id="dashboard-typography">[\s\S]*?<\/style>/g,'');h=h.replace('</head>',()=>css+'</head>');h=h.replace('style="margin-top:9px;font-size:11px;color:#718479"','style="margin-top:9px;color:#718479"');fs.writeFileSync(p,h)}console.log('Inter typography applied consistently to Home, QC, Revenue & Sales and Specialty.');
