const fs=require('fs');const file='outputs/qc-dashboard.html';let h=fs.readFileSync(file,'utf8');h=h.replace('<div class="tabs"><button','<button class="back" onclick="exportCSV()" title="Download QC records matching the current filters">Export CSV ↓</button><div class="tabs"><button');const js=`
function exportCSV(){
let dates=selectedDates();if(!dates){$('rangeError').textContent='Select a valid date range before exporting.';return}
let {bs,ds}=scope(),records=currentRecords.filter(r=>matches(r,bs,ds));
const correction={'Reagent-related':'Replace reagent lot','Calibration deviation':'Recalibrate assay','Instrument variation':'Check instrument','Procedural error':'Repeat QC run'};
const prevention={'Reagent-related':'Verify new lots','Calibration deviation':'Review calibration schedule','Instrument variation':'Schedule maintenance','Procedural error':'Procedure refresher'};
const rows=[['Date','Branch','Department','Assay','Patient samples (illustrative association)','QC result','Root cause','Corrective action','Preventive action','Action status'],...records.map(r=>[r.date,r.branch,r.dept,r.assay,r.samples,r.result,r.cause,correction[r.cause]||'',prevention[r.cause]||'',r.status])];
const cell=value=>'"'+String(value??'').replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"';
const csv='\\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\\r\\n');
const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));let link=document.createElement('a');link.href=url;link.download='IT-DOES-QC-demo-'+dates.start+'-to-'+dates.end+'.csv';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
$('exportStatus').textContent=records.length?fmt(records.length)+' matching demo QC records exported.':'No matching records. Exported CSV contains column headings only.';
}
`;h=h.replace('</body>', '<div id="exportStatus" role="status" aria-live="polite" style="margin-left:16px;padding:10px;color:#397461;font-size:12px"></div></body>');h=h.replace('</body>', '<script>'+js+'</script></body>');fs.writeFileSync(file,h);fs.writeFileSync('work/dashboard-check.js',[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n'));
