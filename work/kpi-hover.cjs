const fs=require('fs');const file='outputs/qc-dashboard.html';let html=fs.readFileSync(file,'utf8');const css=`
/* Subtle depth and motion for KPI cards. */
.kpi{position:relative;transition:transform .25s cubic-bezier(.2,.7,.3,1),box-shadow .25s ease,border-color .25s ease;box-shadow:0 2px 5px rgba(23,43,58,.025)}
@media(hover:hover) and (pointer:fine){.kpi:hover{transform:translateY(-5px);border-color:#b8d7cd;box-shadow:0 12px 26px -8px rgba(21,59,61,.18),0 4px 10px rgba(21,59,61,.05)}}
@media(prefers-reduced-motion:reduce){.kpi{transition:none}.kpi:hover{transform:none}}
`;html=html.replace('</head>','<style>'+css+'</style></head>');fs.writeFileSync(file,html);console.log('KPI hover styles added.');
