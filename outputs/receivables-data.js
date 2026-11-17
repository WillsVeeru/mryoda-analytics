/* Screenshot figures are preserved. Missing attribution/detail is an explicit sample allocation. */
(()=>{
  'use strict';
  const from='2026-11-11',to='2026-11-17';
  const ageing=[['0–30 days',439,439,40339142],['31–60 days',314,314,36285558],['61–90 days',248,248,30166628],['90+ days',1087,5450,188395041]];
  const daily=[['2026-11-11',605697,722542],['2026-11-12',828339,217199],['2026-11-13',658404,554868],['2026-11-14',767097,154765],['2026-11-15',588937,735100],['2026-11-16',796266,464488],['2026-11-17',598660,506478]].map(row=>[...row,row[1]+row[2]]);
  const managers=[['AM-01','Vamshi Reddy',2000000],['AM-02','Rohan Hegde',2400000],['AM-03','Harini Ravi',3600000],['AM-04','Aditi Shah',4000000],['AM-05','Tanya Kapoor',4500000]].map(([id,name,monthlyTarget])=>({id,name,monthlyTarget}));
  const branches=['YODA LIFELINE DIAGNOSTICS','YODA WELLNESS BEGUMPET','YODA DIAGNOSTICS GUNTUR','YODA DIAGNOSTICS VIZAG','YODA DIAGNOSTICS TIRUPATI'];
  const types=['B2B','PUP','TPA','Corporate'];
  const names=['Wellness Care Diagnostics','City Health Laboratory','Life Care Medical Centre','Sunrise Diagnostics','Medicare Wellness Clinic','Prime Health Services','Apollo Community Clinic','Spectrum Diagnostics','Care Plus Laboratory','Unity Medical Centre'];
  // Integer allocation conserves every printed rupee and count. These are not source invoice identities.
  function allocate(total,weights){const sum=weights.reduce((a,b)=>a+b,0);if(!sum)return weights.map(()=>0);let used=0;return weights.map((weight,index)=>{const next=index===weights.length-1?total-used:Math.floor(total*weight/sum);used+=next;return next;});}
  const clients=[],invoices=[];let sequence=0;
  ageing.forEach(([bucket,panelCount,invoiceCount,outstanding],bucketIndex)=>{
    const start=clients.length;
    for(let i=0;i<panelCount;i++){const index=clients.length;clients.push({id:'DEMO-CL-'+String(index+1).padStart(4,'0'),name:index<names.length?names[index]:'Sample Diagnostics '+String(index+1).padStart(4,'0'),managerId:managers[index%5].id,branch:branches[index%5],type:types[index%4],bucket:bucketIndex});}
    const amounts=allocate(outstanding,Array.from({length:invoiceCount},(_,i)=>8+i%7));
    amounts.forEach((balance,i)=>{
      const age=[7+i%24,31+i%30,61+i%30,91+i%300][bucketIndex],date=new Date(to+'T00:00:00Z');date.setUTCDate(date.getUTCDate()-age);const due=new Date(date);due.setUTCDate(due.getUTCDate()+30);
      const cash=i%5===0?0:Math.round(balance*(.18+(i%4)*.08)),tds=Math.round((balance+cash)*.012),writeOff=i%29===0?100:0;
      invoices.push({id:'DEMO-INV-'+String(++sequence).padStart(5,'0'),clientId:clients[start+i%panelCount].id,date:date.toISOString().slice(0,10),due:due.toISOString().slice(0,10),age,bucket:bucketIndex,invoiced:balance+cash+tds+writeOff,cash,tds,writeOff,outstanding:balance,status:cash?'Part paid':'Unpaid'});
    });
  });
  // Settled examples are additional sample invoices; the printed OPEN counts remain unchanged.
  clients.filter((_,i)=>i%4===0).forEach((client,i)=>{const invoiced=1200+(i%11)*500,tds=Math.round(invoiced*.02);invoices.push({id:'DEMO-INV-'+String(++sequence).padStart(5,'0'),clientId:client.id,date:'2026-10-10',due:'2026-11-09',age:38,bucket:null,invoiced,cash:invoiced-tds,tds,writeOff:0,outstanding:0,status:'Settled'});});
  const balances=new Map(clients.map(client=>[client.id,0]));invoices.forEach(row=>balances.set(row.clientId,balances.get(row.clientId)+row.outstanding));
  const payments=daily.map(([date,patient,b2b])=>({date,patientByBranch:allocate(patient,branches.map(()=>1)),clientPayments:allocate(b2b,clients.map(client=>balances.get(client.id)))}));
  // Captured-period receipts must fit inside each sample client's cumulative cash received.
  clients.forEach((client,index)=>{const own=invoices.filter(row=>row.clientId===client.id),captured=payments.reduce((sum,row)=>sum+row.clientPayments[index],0),received=own.reduce((sum,row)=>sum+row.cash,0);if(captured>received){const invoice=own.find(row=>row.outstanding>0),extra=captured-received;invoice.cash+=extra;invoice.invoiced+=extra;invoice.status='Part paid';}});
  const deepFreeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(deepFreeze);Object.freeze(value);}return value;};
  window.receivablesData=deepFreeze({from,to,ageing,daily,managers,branches,types,clients,invoices,payments});
})();
