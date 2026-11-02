const fs=require('fs');let qc=fs.readFileSync('work/header-qc.js','utf8');qc=qc.replace("panel.hidden=true;branchChartType='Bar';", "panel.hidden=true;card.insertBefore(panel,table);branchChartType='Bar';");fs.writeFileSync('work/header-qc.js',qc);
const style=`<style id="table-chart-header-layout">
.app-table-chart-header{display:flex;align-items:center;justify-content:space-between;gap:12px 20px;flex-wrap:wrap;width:100%;margin:12px 0 16px;padding:0}
.app-table-chart-header .app-table-chart-tabs{display:inline-flex;align-items:center;gap:4px;flex-wrap:wrap;margin:0;padding:0;border:0;background:transparent}
.app-table-chart-header .app-table-chart-tabs button{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:8px 11px;border:0;border-radius:22px;background:transparent;color:#859990;font:400 12px Inter,Arial,sans-serif;cursor:pointer;white-space:nowrap}
.app-table-chart-header .app-table-chart-tabs button[aria-pressed="true"]{background:#e7f5eb;color:#278436;font-weight:600}
.app-table-chart-header .app-table-chart-tabs button:hover{background:#f1f8f3;color:#278436}
.app-table-chart-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-left:auto;flex-shrink:0}
.app-table-chart-actions>button{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:8px 14px;border:1px solid #d7e5db;border-radius:22px;background:white;color:#278436;font:500 13px Inter,Arial,sans-serif;cursor:pointer;white-space:nowrap}
.app-table-chart-actions>button[aria-expanded="true"]{background:#e7f5eb;border-color:#a9d5b5}
.app-table-chart-actions>button:hover{background:#f1f8f3}
.app-table-chart-header button:focus-visible{outline:2px solid #35B34A;outline-offset:2px}
.app-replaced-chart-tabs,.rev-actions[hidden],.tp-charts[hidden],.tp-context[hidden],.table-tools button[hidden],button[hidden]{display:none!important}
.app-inline-chart[hidden],#reportInlineChart[hidden],#branchChartView[hidden],.home-chart[hidden]{display:none!important}
.app-inline-chart{width:100%;box-sizing:border-box;background:#f6fbf7;border:1px solid #e4eee6;border-radius:22px;padding:18px;margin:0 0 18px;overflow:auto}
.app-inline-chart>svg{display:block;width:100%;height:auto;min-width:650px}
.app-inline-types{margin:0 0 14px!important}.app-inline-types>button{display:none!important}.app-inline-types .category-chart-fields{margin:0!important;padding-left:0!important;border-left:0!important}
#reportInlineChart .tp-chart{max-height:none;overflow:auto}
.home-table>.home-chart.app-inline-chart{height:auto;flex:0 0 auto;min-height:0}
.home-table>.home-chart.app-inline-chart:not([hidden]){max-height:420px}
.table-card>#app-table-header-qc-branches{padding-left:24px;padding-right:24px}
#branchChartView{margin-top:0}#branchChartView .branch-chart-controls{padding-top:12px}
@media(max-width:760px){.app-table-chart-header{gap:10px}.app-table-chart-actions{margin-left:auto}.app-table-chart-header .app-table-chart-tabs{gap:2px}.app-table-chart-header .app-table-chart-tabs button{padding:7px 9px}.app-inline-chart{padding:12px}}
</style>`;
for(const [name,adapter] of [['home','home'],['qc-dashboard','qc'],['revenue-sales','revenue'],['specialty','specialty'],['tests-patients','tests']]){let p='outputs/'+name+'.html',h=fs.readFileSync(p,'utf8');if(name==='qc-dashboard')h=h.replace(/<style id="hide-branch-chart">[\s\S]*?<\/style>/g,'');h=h.replace('</head>',()=>'<script src="table-chart-ui.js"></script>'+style+'</head>');h=h.replace('</html>',()=>'<script>'+fs.readFileSync('work/header-'+adapter+'.js','utf8')+'</script></html>');fs.writeFileSync(p,h);fs.writeFileSync('work/'+name+'-syntax.js',[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n'))}
console.log('Shared left-tabs/right-actions headers installed across Home, QC, Revenue & Sales, Specialty and Tests & Patients.');
