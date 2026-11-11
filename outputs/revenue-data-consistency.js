(() => {
  'use strict';
  // The filtered daily report is the source for summaries and demo allocations.
  function allocate(total, weights) {
    const sum = weights.reduce((value, weight) => value + weight, 0);
    if (!sum || !total) return weights.map(() => 0);
    const parts = weights.map(weight => total * weight / sum);
    const result = parts.map(Math.floor);
    const order = parts.map((value,index) => ({index,remainder:value-result[index]})).sort((a,b) => b.remainder-a.remainder);
    for (let index=0, left=total-result.reduce((a,b)=>a+b,0); index<left; index++) result[order[index].index]++;
    return result;
  }
  function reconcile() {
    const daily = dataSets.daily || [];
    const total = {bills:0,patients:0,gross:0,discount:0,routine:0,specialty:0,refunds:0,net:0};
    daily.forEach(row => {
      // Refunds are signed and already included in the routine net figure.
      row[8] = row[3] - row[4] + row[7];
      row[5] = row[8] - row[6];
      ['bills','patients','gross','discount','routine','specialty','refunds','net'].forEach((key,index) => total[key] += row[index+1]);
    });
    const splitRows = (rows, columns) => {
      const output = rows.map(row => [...row]);
      columns.forEach(([index,value]) => {
        const parts = allocate(value,rows.map(row => Number(row[index]) || 0));
        output.forEach((row,i) => row[index] = parts[i]);
      });
      return output;
    };
    const channelSeeds = [['B2B',11558,11444,8157671],['Walk-In',882,878,2621750],['PUP',4737,4734,2193682],['Corporate',1,1,50]];
    dataSets.channel = daily.length ? splitRows(channelSeeds,[[1,total.bills],[2,total.patients],[3,total.net]]) : [];
    if(dataSets.channel.length){
      const amounts=allocate(total.net,channelSeeds.map((row,index)=>dataSets.channel[index][1]?row[3]:0));
      const patients=allocate(total.patients,dataSets.channel.map(row=>row[1]));
      dataSets.channel.forEach((row,index)=>{row[2]=patients[index];row[3]=amounts[index]});
    }
    dataSets.terms = splitRows(dataSets.terms || [],[[1,total.net]]);
    dataSets.discount = daily.map(row => [row[0],row[3],row[4],(row[3] ? row[4]/row[3]*100 : 0).toFixed(2)+'%']);
    dataSets.approver = splitRows(dataSets.approver || [],[[2,total.discount]]);
    // These reports are intentional subsets, scaled from the same filtered total.
    const ratio = total.net / 1305252;
    const packages = [
      ['YODA SAMRAKSHA (MALE)',2,2,15998],['HEALTH FIT PACKAGE-GNT',14,14,13986],
      ['VIRAL SEROLOGY',10,10,13500],['YODA SAMRAKSHA PLUS (MALE)',1,1,9999],
      ['YODA DNA DECODER METABOLIC PROFILE - MALE',1,1,9698],['YODA SAMRAKSHA (FEMALE)',1,1,7999],
      ['DECODE HYDERABAD 2026 - CITY FULL BODY',3,3,5997],['VIDAL HEALTH EXECUTIVE FEMALE PACK2',1,1,4500],
      ['TOTAL VITAMIN & NUTRITION PANEL',2,2,3998],['JAISWAL AROGYAM PACKAGE',4,4,3600]
    ];
    dataSets.package = daily.length ? packages.map(([name,bills,patients,value]) => [name,Math.round(bills*ratio),Math.round(patients*ratio),Math.round(value*ratio)]) : [];
    const paymentSeeds = [['Mobile Wallet',2707,1973227],['Online Payment',1395,936118],['Cash',998,636455],['Credit Card',109,426369],['Debit Card',6,12200],['NEFT',13,2060],['AdvSettlement',12,1140]];
    dataSets.payment = daily.length ? splitRows(paymentSeeds,[[1,Math.round(429*ratio)],[2,Math.round(425648*ratio)]]) : [];
    const specialtyOrders = Math.min(total.bills,Math.round(total.specialty / (79997/5)));
    const summary = document.getElementById('revenueSummary');
    const values = [money(total.routine),money(total.specialty),(total.net?total.specialty/total.net*100:0).toFixed(2)+'%',money(total.net)];
    const notes = [number(total.bills-specialtyOrders)+' bills · Routine revenue',number(specialtyOrders)+' orders · High-ticket panels','Share of realised revenue',number(total.bills)+' total orders billed'];
    [...summary.children].forEach((card,index) => {
      card.querySelector('strong').textContent = values[index];
      card.querySelector('p').textContent = notes[index];
    });
    definitions.forEach(([id]) => {
      renderRevenuePage(id);
      if (!document.getElementById('chart-'+id).hidden) drawRevenueChart(id);
    });
  }
  const previousRefresh = refreshHome;
  const previousRenderPage = renderRevenuePage;
  renderRevenuePage = function (id) {
    const result = previousRenderPage.apply(this,arguments);
    const rows = dataSets[id] || [];
    const headers = definitions.find(definition=>definition[0]===id)[2];
    const table = document.querySelector('#table-'+id+' table');
    if (!table || !rows.length) return result;
    const footer = table.createTFoot();
    footer.replaceChildren();
    const row = footer.insertRow();
    headers.forEach((header,index) => {
      const cell = row.insertCell();
      if (index === 0) { cell.textContent = id==='package'?'Top packages subtotal':id==='payment'?'Collections total':'Filtered total'; return; }
      if (/discount %/i.test(header)) {
        const gross=rows.reduce((sum,item)=>sum+item[1],0),discount=rows.reduce((sum,item)=>sum+item[2],0);
        cell.textContent=(gross?discount/gross*100:0).toFixed(2)+'%';
      } else if (rows.some(item=>typeof item[index]==='number')) {
        const total=rows.reduce((sum,item)=>sum+(Number(item[index])||0),0);
        cell.textContent=/revenue|gross|discount$|net|refund|amount/i.test(header)?money(total):number(total);
      } else cell.textContent='—';
    });
    return result;
  };
  refreshHome = function () { const result=previousRefresh.apply(this,arguments); reconcile(); return result; };
  function addReportNotes() {
    const notes = {
      channel:'Allocated demo breakdown; totals match the daily report for the selected filters.',
      terms:'Billed revenue by payment terms; totals match the daily report.',
      payment:'Receipts collected only. Credit sales and settlement timing mean collections can differ from billed revenue.',
      package:'Top packages only; excludes other packages and individual tests. This subtotal is part of total revenue.',
      approver:'Allocated demo approval amounts; discount totals match the daily discount report.'
    };
    Object.entries(notes).forEach(([id,text]) => {
      const note=document.createElement('p'); note.className='revenue-reconciliation-note'; note.textContent=text;
      document.getElementById('table-'+id).before(note);
    });
  }
  addReportNotes();
  reconcile();
})();
