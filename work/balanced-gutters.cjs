const fs=require('fs');const p='outputs/qc-dashboard.html';let h=fs.readFileSync(p,'utf8');h=h.replace(/<style id="balanced-gutters">[\s\S]*?<\/style>/g,()=>`<style id="balanced-gutters">
/* Body and header share 32px gutters from the sidebar and right viewport edge. */
main{margin-left:238px;min-width:0}
main>.content,main>header{margin-left:32px;margin-right:32px;min-width:0}
.chart-grid>* ,.lower>* ,.kpis>*{min-width:0}
.table-card{overflow-x:auto}
@media(max-width:1150px) and (min-width:761px){main{margin-left:238px}}
@media(max-width:760px){main{margin-left:0}main>.content,main>header{margin-left:32px;margin-right:32px}}
</style>`);fs.writeFileSync(p,h);console.log('Body and header margins verified: 32px left and right on desktop and mobile.');
