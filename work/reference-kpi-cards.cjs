const fs=require('fs');const css=`<style id="reference-kpi-cards">
/* Shared reference treatment for KPI summaries; source values remain unchanged. */
.kpis,.home-kpis,.revenue-kpis,.tp-summary{display:grid;gap:16px;align-items:stretch}
.kpis,.tp-summary{grid-template-columns:repeat(6,minmax(0,1fr))}
.home-kpis{grid-template-columns:repeat(7,minmax(0,1fr))}
.revenue-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}
.tp-summary{background:transparent;border:0;border-radius:0;padding:0;margin:20px 0}
.kpi,.home-kpi,.home-kpi.primary,.revenue-kpi,.tp-stat{position:relative;display:flex;flex-direction:column;min-width:0;min-height:142px;height:auto;grid-column:auto;grid-row:auto;padding:20px 19px;background:#fff!important;border:1px solid #e3eae7!important;border-radius:32px;box-shadow:0 3px 9px rgba(26,58,42,.035);color:#172b3a;overflow:hidden;transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease}
.tp-stat:nth-child(3),.tp-stat:nth-child(even),.tp-stat:last-child{border:1px solid #e3eae7!important}
.home-kpi.primary:after{display:none}
.kpi-label,.home-kpi .label,.home-kpi.primary .label,.revenue-kpi h2,.tp-stat>span,.tp-stat .tp-stat-top>span:first-child{font:500 13px Inter,Arial,sans-serif;line-height:1.45;letter-spacing:0;color:#84959d!important;text-transform:none;min-height:0;margin:0;white-space:normal}
.kpi-value,.home-kpi .metric,.home-kpi.primary .metric,.revenue-kpi strong,.tp-stat strong{font:700 28px Inter,Arial,sans-serif;line-height:1.25;letter-spacing:-.7px;margin:17px 0 11px;color:#172b3a!important;overflow-wrap:normal;white-space:nowrap}
.kpi .kpi-value.green{color:#278436!important}.kpi .kpi-value.red{color:#e46666!important}
.home-kpi:nth-child(6) .metric{color:#b17d24!important}.home-kpi:nth-child(7) .metric{color:#e46666!important}
.kpi-foot,.home-kpi p,.home-kpi.primary p,.revenue-kpi p,.tp-stat small{font:400 12px Inter,Arial,sans-serif;line-height:1.5;color:#97a4aa!important;margin-top:auto;margin-bottom:0}
.home-kpi .metric-icon{position:absolute;top:17px;right:17px;margin:0;width:25px;height:25px;border-radius:9px;background:#f0f6f2;color:#7c9986;font-size:13px}
.home-kpi .metric-icon svg{width:14px;height:14px}.home-kpi .label{padding-right:27px}
.tp-stat-top{min-height:20px;align-items:center;gap:8px}.tp-stat-icon{width:25px;height:25px;border-radius:9px;background:#f0f6f2;color:#7c9986}.tp-stat-icon .lucide-ui{width:14px;height:14px}
.revenue-kpi:last-child h2,.revenue-kpi:last-child p,.home-kpi.primary p b{color:inherit}
.summary-box,.summary-box:nth-child(2),.summary-box:nth-child(3){background:#fff;border:1px solid #e3eae7;border-radius:32px;box-shadow:0 3px 9px rgba(26,58,42,.035)}
@media(hover:hover) and (pointer:fine){.kpi:hover,.home-kpi:hover,.revenue-kpi:hover,.tp-stat:hover{transform:translateY(-3px);border-color:#bde2c8!important;box-shadow:0 7px 18px rgba(39,132,54,.09)}}
@media(max-width:1600px){.home-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(max-width:1250px){.kpis,.tp-summary{grid-template-columns:repeat(3,minmax(0,1fr))}.revenue-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:760px){.kpis,.home-kpis,.revenue-kpis,.tp-summary{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.kpi,.home-kpi,.home-kpi.primary,.revenue-kpi,.tp-stat{padding:19px 16px;min-height:142px;border-radius:28px}.kpi-value,.home-kpi .metric,.home-kpi.primary .metric,.revenue-kpi strong,.tp-stat strong{font-size:24px}.tp-stat .tp-stat-top{align-items:flex-start}.tp-stat-icon{width:23px;height:23px}.home-kpi.primary .metric{font-size:23px;letter-spacing:-.5px}}
@media(prefers-reduced-motion:reduce){.kpi,.home-kpi,.revenue-kpi,.tp-stat{transition:none}.kpi:hover,.home-kpi:hover,.revenue-kpi:hover,.tp-stat:hover{transform:none}}
</style>`;for(const name of ['home','qc-dashboard','revenue-sales','specialty','tests-patients']){let p='outputs/'+name+'.html',h=fs.readFileSync(p,'utf8');h=h.replace(/<style id="reference-kpi-cards">[\s\S]*?<\/style>/g,'');h=h.replace('</head>',()=>css+'</head>');fs.writeFileSync(p,h)}console.log('Reference KPI treatment applied across all five pages; values and status colors preserved.');
