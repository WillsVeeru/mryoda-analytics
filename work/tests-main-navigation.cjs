const fs=require('fs');const p='outputs/tests-patients.html';let h=fs.readFileSync(p,'utf8'),found=false;h=h.replace(/<script>([\s\S]*?)<\/script>/g,(full,code)=>{if(code.trimStart().startsWith('/* Tests & Patients: chart overview collapses')){found=true;return '<script>'+fs.readFileSync('work/header-tests-main-nav.js','utf8')+'</script>'}return full});if(!found)throw Error('Existing Tests layout adapter missing');const css=`<style id="tests-main-navigation-layout">
.tests-main-navigation{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:nowrap;width:100%;margin:22px 0 18px;padding-bottom:14px;border-bottom:1px solid #e7eee9}
.tests-main-navigation #reportTabs{display:flex;align-items:center;flex:1 1 auto;min-width:0;flex-wrap:nowrap;gap:8px;margin:0;padding:0;border:0;overflow-x:auto;scrollbar-width:thin}
.tests-main-navigation #reportTabs button{white-space:nowrap;flex-shrink:0}
.tests-main-navigation .app-table-chart-actions{flex:0 0 auto;margin-left:auto;gap:8px}
#reportInlineChart .tp-chart-types{display:flex;align-items:center;flex-wrap:wrap}
#reportInlineChart .tp-chart-types>button{display:inline-flex!important}
#reportInlineChart[hidden]{display:none!important}
@media(max-width:760px){.tests-main-navigation{gap:10px}.tests-main-navigation .app-table-chart-actions>button{padding:8px 11px;min-height:36px;font-size:12px}.tests-main-navigation #reportTabs{gap:4px}}
</style>`;h=h.replace('</head>',()=>css+'</head>');fs.writeFileSync(p,h);fs.writeFileSync('work/tests-patients-syntax.js',[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n'));console.log('Main tabs aligned left with Chart/Export right; chart-type controls are inside the collapsed chart panel.');
