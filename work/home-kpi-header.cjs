const fs=require('fs');const p='outputs/home.html';let h=fs.readFileSync(p,'utf8');const field=h.match(/<label>CENTRE <select id="centre"[\s\S]*?<\/select><\/label>/);if(!field)throw Error('Centre field not found');h=h.replace(field[0],'');h=h.replace('<div class="home-filters second-row">',()=>'<div class="home-filters second-row">'+field[0]);h=h.replace(/<style id="home-kpi-colors">[\s\S]*?<\/style>/g,'');h=h.replace('</head>',()=>`<style id="home-kpi-colors">
.home-kpi:nth-child(2) .metric{color:#278436}
.home-kpi:nth-child(3) .metric{color:#2563a6}
.home-kpi:nth-child(4) .metric{color:#7255ad}
.home-kpi:nth-child(5) .metric{color:#128278}
.home-kpi:nth-child(6) .metric{color:#a86e16}
.home-kpi:nth-child(7) .metric{color:#ce485c}
.home-kpi.primary .metric{color:#fff}
</style></head>`);fs.writeFileSync(p,h);const row=h.indexOf('<div class="home-filters second-row">');if(h.indexOf('id="centre"')<row)throw Error('Centre did not move');console.log('Centre moved to second header row; KPI number colors applied.');
