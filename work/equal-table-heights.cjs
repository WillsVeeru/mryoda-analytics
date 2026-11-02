const fs=require('fs');const p='outputs/home.html';let h=fs.readFileSync(p,'utf8');h=h.replace(/<style id="equal-table-heights">[\s\S]*?<\/style>/g,'');h=h.replace('</head>',()=>`<style id="equal-table-heights">
.home-tables{align-items:stretch}
.home-tables>.home-table{height:640px;display:flex;flex-direction:column}
.home-table>.table-scroll{flex:1 1 auto;min-height:0;max-height:none;overflow:auto}
.home-table>.home-chart{flex:0 0 230px;height:230px;min-height:0}
.home-table>.table-tools{flex:0 0 auto;margin-top:14px}
.home-table>.table-scroll[hidden],.home-table>.home-chart[hidden]{display:none}
@media(max-width:760px){.home-tables>.home-table{height:600px}}
</style></head>`);fs.writeFileSync(p,h);console.log('Both table cards use equal height with internally scrolling rows.');
