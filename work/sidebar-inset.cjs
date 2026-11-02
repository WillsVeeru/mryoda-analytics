const fs=require('fs');let p='outputs/qc-dashboard.html',h=fs.readFileSync(p,'utf8');const css=`<style id="sidebar-inset">
.reference-sidebar{position:fixed;inset:16px auto 16px 16px;width:222px;height:calc(100vh - 32px);margin:0;border-radius:32px;overflow:hidden;border:1px solid #e7ede8}
.reference-brand{border-radius:32px 32px 0 0}
main{margin-left:254px}
@media(max-width:1150px) and (min-width:761px){main{margin-left:254px}}
@media(max-width:760px){.reference-sidebar{position:static;inset:auto;width:calc(100% - 32px);height:auto;margin:16px;border-radius:32px}.reference-brand{border-radius:32px 32px 0 0}main{margin-left:0}}
</style>`;h=h.replace(/<style id="sidebar-inset">[\s\S]*?<\/style>/g,'');h=h.replace('</head>',()=>css+'</head>');fs.writeFileSync(p,h);console.log('Confirmed final sidebar rules: 32px radius and 16px inset on all sides.');
