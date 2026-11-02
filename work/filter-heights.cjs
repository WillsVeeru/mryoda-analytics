const fs=require('fs');for(const p of ['outputs/home.html','outputs/qc-dashboard.html']){let h=fs.readFileSync(p,'utf8');h=h.replace(/<style id="consistent-filter-heights">[\s\S]*?<\/style>/g,'');const css=`<style id="consistent-filter-heights">
:root{--filter-control-height:40px}
.toolbar input,.toolbar select,.more-panel input,.more-panel select,dialog select,dialog input,.home-header input,.home-header select,.home-filters select,.home-more select{height:var(--filter-control-height);min-height:var(--filter-control-height);box-sizing:border-box;margin-top:0;margin-bottom:0;padding-top:0;padding-bottom:0;line-height:normal;font-size:12px;vertical-align:middle}
.toolbar button,.more-panel button,.home-header button,dialog .back{height:var(--filter-control-height);min-height:var(--filter-control-height);box-sizing:border-box;padding-top:0;padding-bottom:0;display:inline-flex;align-items:center;justify-content:center;line-height:1.2;font-size:12px}
.filters,.home-filters,.home-more,.more-panel{align-items:center}
.filters .field,.more-panel .field,dialog .field,.home-header label{min-height:var(--filter-control-height);display:inline-flex;align-items:center;gap:9px;line-height:1.3}
.home-filters.second-row{margin-top:12px}
.home-header .quick{padding-left:12px;padding-right:12px}
.home-header{height:auto}
</style>`;h=h.replace('</head>',()=>css+'</head>');fs.writeFileSync(p,h);if(!h.includes('--filter-control-height:40px'))throw Error('Missing control styles');}console.log('Consistent 40px filter controls applied to both dashboards and QC popup.');
