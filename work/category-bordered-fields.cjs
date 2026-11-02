const fs=require('fs');const p='outputs/tests-patients.html';let h=fs.readFileSync(p,'utf8');const css=`<style id="category-bordered-fields">
#types-category .category-chart-fields{display:inline-flex;align-items:center;gap:8px;margin-left:5px}
#types-category .category-chart-fields label{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:400;color:#7b91a5;white-space:nowrap}
#types-category .category-chart-fields select{appearance:none;-webkit-appearance:none;display:inline-block;box-sizing:border-box;height:32px;min-height:32px;width:auto;min-width:88px;border:1px solid #cbd8e7;border-radius:9px;background-color:#fff;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23465f7b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 9px center;background-size:12px;padding:0 28px 0 11px;margin:0;color:#375575;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:400;line-height:normal;box-shadow:none;outline-offset:2px}
#types-category .category-chart-fields label:nth-child(2) select{min-width:100px}
#types-category .category-chart-fields label:last-child select{min-width:58px}
#types-category .category-chart-fields select:hover{border-color:#92adc5}
#types-category .category-chart-fields select:focus-visible{outline:2px solid #35B34A;border-color:#35B34A}
@media(max-width:760px){#types-category .category-chart-fields{margin-left:0;gap:8px;flex-wrap:wrap}}
</style>`;h=h.replace(/<style id="category-bordered-fields">[\s\S]*?<\/style>/g,'');h=h.replace('</head>',()=>css+'</head>');fs.writeFileSync(p,h);console.log('Category, Value and Top now have visible borders, white fill and compact rounded fields matching reference.');
