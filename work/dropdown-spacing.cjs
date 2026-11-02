const fs=require('fs');const files=['outputs/qc-dashboard.html','outputs/home.html'];for(const p of files){let h=fs.readFileSync(p,'utf8');h=h.replace(/<style id="dropdown-chevron-spacing">[\s\S]*?<\/style>/g,'');const css=`<style id="dropdown-chevron-spacing">
/* Reserve space for the chevron and keep it 16px from the field edge. */
select,.home-filters select{appearance:none;-webkit-appearance:none;padding-right:44px;padding-left:14px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236b8174' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 16px center;background-size:14px 14px}
select:disabled{opacity:.6}
@media(forced-colors:active){select,.home-filters select{appearance:auto;background-image:none;padding-right:16px}}
</style>`;h=h.replace('</head>',()=>css+'</head>');fs.writeFileSync(p,h)}console.log('Dropdowns updated on Home and Quality Control: 16px after chevron with reserved text spacing.');
