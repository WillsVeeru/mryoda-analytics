/* Demo allocations for the report sections in the supplied Revenue & Sales reference. */
(() => {
  'use strict';
  function allocate(total, weights) {
    total=Math.max(0,Math.round(total));
    const sum=weights.reduce((a,b)=>a+b,0);
    if (!sum || !total) return weights.map(()=>0);
    const parts=weights.map(weight=>total*weight/sum),result=parts.map(Math.floor);
    const order=parts.map((part,index)=>({index,remainder:part-result[index]})).sort((a,b)=>b.remainder-a.remainder);
    const left=total-result.reduce((a,b)=>a+b,0);
    for(let index=0;index<left;index++)result[order[index].index]++;
    return result;
  }
  const channels=[
    ['Lab accession (B2B sample intake)',6302072,11770,'Accession'],
    ['Front office (walk-in)',4077833,3644,'Front Office'],
    ['Phlebotomist / home collection',1420997,1340,'Phlebotomist'],
    ['Central booking desk (CD team)',899945,169,'Booking Desk'],
    ['Web self-booking',182395,44,'Web'],
    ['Management / admin',51314,40,'Administration'],
    ['Sales / account team',51058,174,'Sales'],
    ['Other staff',43251,78,'Operations']
  ];
  const panels=[
    ['FOLATE RECEPTOR AUTOANTIBODIES IGG (FRAT)',0,426869,58],
    ['AUTISM / NEUROPSYCHIATRIC PANEL',0,160304,14],
    ['YODAARA AUTISM DECODER PANEL',0,160000,3],
    ['DNA DECODER',0,44545,1],
    ['AUTISM / NEUROPSYCHIATRIC PANEL - ADVANCED',0,21097,4],
    ['DR AUTISM BASIC PANEL',0,19500,3],
    ['NIPT (NON INVASIVE PRENATAL TESTING)',1,139637,19],
    ['WHOLE EXOME SEQUENCING',1,121907,10],
    ['CHROMOSOMAL MICROARRAY (750K) BLOOD',1,52250,6],
    ['GUT MICROBIOME',1,41027,6],
    ['BRCA 1 & 2 GERMLINE',1,24000,2],
    ['WHOLE EXOME + CNV',1,23693,1],
    ['HLA FLOW CYTOMETRY T & B CELL CROSSMATCH',1,22800,3],
    ['KARYOTYPING (CHROMOSOMAL ANALYSIS) - PERIPHERAL BLOOD',1,20901,19],
    ['KARYOTYPING (CHROMOSOMAL ANALYSIS) - POC',1,16200,3]
  ];
  function build(daily, profiles=[]) {
    if(!profiles.length)profiles=[{client:'Unassigned demo client',centre:'Selected scope',referrer:'Unassigned'}];
    const totals={net:0,bills:0,patients:0,yodaara:0,genetics:0,routine:0,specialBills:0,geneticsBills:0};
    const months=new Map();
    daily.forEach(row=>{
      const genetics=Math.min(row[5],Math.round(row[5]*562670/12196550));
      const yodaBills=Math.min(row[1],Math.round(row[6]/(79997/5)));
      const geneticsBills=Math.min(row[1]-yodaBills,Math.round(genetics/(562670/83)));
      const values={net:row[8],bills:row[1],patients:row[2],yodaara:row[6],genetics,routine:row[5]-genetics,specialBills:yodaBills,geneticsBills};
      const key=row[0].slice(0,7);
      if(!months.has(key))months.set(key,{...Object.fromEntries(Object.keys(totals).map(key=>[key,0]))});
      const monthlyTotal=months.get(key);
      Object.keys(totals).forEach(field=>{totals[field]+=values[field];monthlyTotal[field]+=values[field]});
    });
    if(!totals.bills&&!totals.net)return {totals,segments:[],monthly:[],panels:[],bookers:[],booking:[],bookingMonthly:[],logins:channels.map(()=>[])};
    const segmentBills=[totals.bills-totals.specialBills-totals.geneticsBills,totals.specialBills,totals.geneticsBills];
    const segments=[['Routine',segmentBills[0],Math.round(segmentBills[0]*3.03),totals.routine,totals.net?totals.routine/totals.net*100:0],
      ['Yodaara / Autism / Decoder',segmentBills[1],Math.round(segmentBills[1]*1.05),totals.yodaara,totals.net?totals.yodaara/totals.net*100:0],
      ['Genetics & genomics',segmentBills[2],Math.round(segmentBills[2]*1.06),totals.genetics,totals.net?totals.genetics/totals.net*100:0]];
    const monthly=[...months].map(([month,total])=>[month,total.routine,total.yodaara,total.genetics,total.yodaara+total.genetics,total.specialBills+total.geneticsBills,total.net?(total.yodaara+total.genetics)/total.net*100:0]);
    const panelRows=[];
    for(let group=0;group<2;group++){
      const seeds=panels.filter(row=>row[1]===group);
      const bills=allocate(group?totals.geneticsBills:totals.specialBills,seeds.map(row=>row[3]));
      const amounts=allocate(group?totals.genetics:totals.yodaara,seeds.map((row,i)=>bills[i]?row[2]:0));
      seeds.forEach((row,i)=>panelRows.push([row[0],group?'Genetics & genomics':'Yodaara / Autism / Decoder',bills[i],bills[i],bills[i]?amounts[i]/bills[i]:0,amounts[i]]));
    }
    // Very small scopes can carry revenue with a rounded bill count of zero.
    // Keep the amount visible without inventing a fractional or extra bill.
    for(const [group,amount] of [[0,totals.yodaara],[1,totals.genetics]]){
      const selected=panelRows.filter(row=>row[1]===(group?'Genetics & genomics':'Yodaara / Autism / Decoder'));
      if(amount&&!selected.some(row=>row[5]))selected[0][5]=amount;
    }
    const bookers=[];
    for(const [group,amount,billCount] of [['Yodaara / Autism / Decoder',totals.yodaara,totals.specialBills],['Genetics & genomics',totals.genetics,totals.geneticsBills]]){
      const bills=allocate(billCount,profiles.map((_,i)=>profiles.length-i));
      const amounts=allocate(amount,profiles.map((_,i)=>bills[i]?(profiles.length-i):0));
      if(amount&&amounts.length&&!amounts.some(Boolean))amounts[0]=amount;
      profiles.forEach((profile,i)=>{if(bills[i]||amounts[i])bookers.push([profile.client,group,profile.centre,profile.referrer,bills[i],amounts[i]])});
    }
    const bookingAmounts=channels.map(()=>0),bookingBills=channels.map(()=>0),bookingMonthly=[];
    for(const [month,total] of months){
      const counts=allocate(total.bills,channels.map(row=>row[2]));
      const amounts=allocate(total.net,channels.map((row,index)=>counts[index]?row[1]:0));
      if(total.net&&!amounts.some(Boolean))amounts[0]=total.net;
      amounts.forEach((amount,index)=>bookingAmounts[index]+=amount);
      counts.forEach((count,index)=>bookingBills[index]+=count);
      bookingMonthly.push([month,...amounts,total.net]);
    }
    const booking=channels.map((row,i)=>[row[0],bookingBills[i],bookingAmounts[i],totals.net?bookingAmounts[i]/totals.net*100:0]);
    const logins=channels.map((channel,index)=>{
      const weights=Array.from({length:12},(_,i)=>12-i);
      const bills=allocate(bookingBills[index],weights),patients=allocate(bookingBills[index],weights),amounts=allocate(bookingAmounts[index],weights);
      return weights.map((_,i)=>['Demo '+channel[3]+' User '+String(i+1).padStart(2,'0'),channel[3],bills[i],patients[i],amounts[i]]);
    });
    return {totals,segments,monthly,panels:panelRows.sort((a,b)=>b[5]-a[5]),bookers:bookers.sort((a,b)=>b[5]-a[5]),booking,bookingMonthly,logins};
  }
  window.revenueReferenceModel={allocate,build,channels};
})();
