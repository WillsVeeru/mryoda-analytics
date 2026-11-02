const fs=require('fs');const css=`<style id="compact-chart-tab-spacing">
.chart-tabs,.revenue-chart-toolbar .chart-tabs,.specialty-type-tabs,.tp-chart-types,.branch-chart-controls #branchChartTypes,#types-category{column-gap:4px;row-gap:8px}
.revenue-chart-toolbar,.specialty-chart-controls,.branch-chart-controls{column-gap:8px;row-gap:10px}
.revenue-chart-toolbar>.chart-tabs,.specialty-chart-controls>.specialty-type-tabs,.branch-chart-controls>#branchChartTypes{padding-right:8px}
#types-category .category-chart-fields{margin-left:4px;padding-left:8px;gap:8px}
@media(max-width:1100px){.revenue-chart-toolbar>.chart-tabs,.specialty-chart-controls>.specialty-type-tabs,.branch-chart-controls>#branchChartTypes{padding-right:0;padding-bottom:8px}#types-category .category-chart-fields{margin-left:0;padding-left:0;padding-top:8px}}
</style>`;for(const p of ['outputs/home.html','outputs/qc-dashboard.html','outputs/revenue-sales.html','outputs/specialty.html','outputs/tests-patients.html']){let h=fs.readFileSync(p,'utf8');h=h.replace(/<style id="compact-chart-tab-spacing">[\s\S]*?<\/style>/g,'');h=h.replace('</head>',()=>css+'</head>');fs.writeFileSync(p,h)}console.log('Applied 4px chart-tab gaps and 8px spacing between chart controls.');
