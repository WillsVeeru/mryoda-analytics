/* Contextual explanations for verifiable table calculations. Never infer missing inputs. */
(() => {
  'use strict';
  const normal = value => String(value || '').toLowerCase().replace(/[↑↓↕]/g,'').replace(/\s+/g,' ').trim();
  function numeric(value) {
    const text=String(value??'').trim().replace(/−/g,'-').replace(/,/g,'').replace(/₹/g,'').replace(/^\+/,'');
    if(!/^-?\d+(?:\.\d+)?\s*%?$/.test(text))return null;
    return Number(text.replace('%',''));
  }
  const money=value=>'₹'+Number(value).toLocaleString('en-IN',{maximumFractionDigits:2});
  const count=value=>Number(value).toLocaleString('en-IN',{maximumFractionDigits:2});
  function precision(value) { return String(value).replace(/,/g,'').match(/\.(\d+)/)?.[1].length||0; }
  function matches(value,expected) {
    const number=numeric(value);
    return number!==null&&Number.isFinite(expected)&&Math.abs(number-expected)<=.500001*Math.pow(10,-precision(value));
  }
  function calculate(labels,texts,context={}) {
    const keys=labels.map(normal),values=texts.map(numeric),output=new Map();
    const find=pattern=>keys.findIndex(key=>pattern.test(key));
    const item=pattern=>{const i=find(pattern);return i<0?null:values[i];};
    const add=(pattern,title,formula,input,expected,note='')=>{
      const index=find(pattern);
      if(index>=0&&matches(texts[index],expected))output.set(index,{title,formula,calculation:input+' = '+texts[index].trim(),note});
    };
    const all=(...items)=>items.every(value=>value!==null&&Number.isFinite(value));
    const gross=item(/^gross(?: revenue)?$/),discount=item(/^discount(?: amount)?$/),refund=item(/^refunds?$/),net=item(/^net(?: revenue)?$/);
    if(all(gross,discount)){
      add(/^net(?: revenue)?$/,'Net revenue','Gross revenue − Discounts',money(gross)+' − '+money(discount),gross-discount);
      if(refund!==null)add(/^final net$/,'Final net revenue','Gross − Discounts + Signed refunds',money(gross)+' − '+money(discount)+' + ('+money(refund)+')',gross-discount+refund);
      if(gross!==0)add(/^discount\s*(?:%|\(%\))$/,'Discount percentage','Discounts ÷ Gross revenue × 100',money(discount)+' ÷ '+money(gross)+' × 100',discount/gross*100,'Rounded to the precision shown in the table.');
    }
    const final=item(/^final net$/),special=item(/^specialty net$/);
    if(all(final,special))add(/^routine net$/,'Routine net revenue','Final net − Specialty net',money(final)+' − '+money(special),final-special);
    const cost=item(/^cost$/),referral=item(/^referral$/);
    if(all(net,cost))add(/^margin$/,'Margin','Net revenue − Cost',money(net)+' − '+money(cost),net-cost);
    if(all(net,referral)){
      const includeCost=!!context.marginIncludesCost;
      if(!includeCost||cost!==null)add(/^net margin$/,'Net margin',includeCost?'Net − Cost − Referral':'Net − Referral',money(net)+(includeCost?' − '+money(cost):'')+' − '+money(referral),net-referral-(includeCost?cost:0));
    }
    const limit=item(/^credit limit$/),outstanding=item(/^outstanding(?: amount)?$/);
    if(all(limit,outstanding))add(/^available credit$/,'Available credit','Credit limit − Outstanding amount',money(limit)+' − '+money(outstanding),limit-outstanding);
    const received=item(/^cash received$/),brought=item(/^cash brought in$/),paid=item(/^cash paid$/);
    if(all(received,brought,paid))add(/^net cash movement$/,'Net cash movement','Cash received + Cash brought in − Cash paid',money(received)+' + '+money(brought)+' − '+money(paid),received+brought-paid);
    const revenue=item(/^(?:net )?revenue$/),volume=item(/^(?:tests|volume|orders|bills|specialty orders)$/);
    if(all(revenue,volume))add(/^(?:avg\s*\/\s*test|avg ticket|average ticket|average per test)$/,'Average value','Revenue ÷ '+labels[find(/^(?:tests|volume|orders|bills|specialty orders)$/)]+(volume?'':'; zero records display 0'),volume?money(revenue)+' ÷ '+count(volume):'Record count is 0; display 0',volume?revenue/volume:0,volume?'Rounded to the precision shown.':'Division by zero is not performed.');
    const current=item(/^current period/),previous=item(/^previous period/);
    if(all(current,previous)){
      const change=current-previous;
      add(/^(?:change|variance) amount$/,'Change amount','Current period − Previous period',money(current)+' − '+money(previous),change);
      if(previous!==0)add(/^(?:change|variance)\s*(?:%|\(%\))$/,'Change percentage','(Current − Previous) ÷ Previous × 100','('+money(current)+' − '+money(previous)+') ÷ '+money(previous)+' × 100',change/previous*100);
      else if(current===0)add(/^(?:change|variance)\s*(?:%|\(%\))$/,'Change percentage','Both periods are zero','(0 − 0); both periods are zero',0,'No change; division by zero is not performed.');
    }
    if(find(/^change \(units\)$/)>=0&&all(values[1],values[2]))add(/^change \(units\)$/,'Stock change','Current month stock − Previous month stock',count(values[1])+' − '+count(values[2]),values[1]-values[2]);
    const yoda=item(/^yodaara$/),genetics=item(/^genetics$/),routine=item(/^routine$/),specialTotal=item(/^specialty total$/);
    if(all(yoda,genetics))add(/^specialty total$/,'Specialty total','Yodaara revenue + Genetics revenue',money(yoda)+' + '+money(genetics),yoda+genetics);
    if(all(routine,specialTotal)&&routine+specialTotal!==0)add(/^specialty share(?: \(%\))?$/,'Specialty share','Specialty total ÷ (Routine + Specialty total) × 100',money(specialTotal)+' ÷ ('+money(routine)+' + '+money(specialTotal)+') × 100',specialTotal/(routine+specialTotal)*100);
    if(context.shareTotal>0){
      const numerator=context.shareBasis==='tests'?item(/^tests$/):context.shareBasis==='orders'?item(/^orders$/):context.shareBasis==='count'?item(/^count$/):revenue;
      const format=context.shareBasis==='tests'||context.shareBasis==='orders'||context.shareBasis==='count'?count:money;
      if(numerator!==null)add(/^(?:workload share|share(?: \(%\)| %)?|% of registered)$/,'Share percentage',context.shareLabel||'Group value ÷ Total in the same scope × 100',format(numerator)+' ÷ '+format(context.shareTotal)+' × 100',numerator/context.shareTotal*100,'Uses the full applicable report scope, including rows on other pages.');
    }
    const runs=item(/^(?:qc )?runs$/),passed=item(/^passed$/),failed=item(/^failed$/);
    if(all(runs,passed)&&runs!==0)add(/^pass\s*%$/,'Pass rate','Passed runs ÷ Total runs × 100',count(passed)+' ÷ '+count(runs)+' × 100',passed/runs*100);
    if(all(runs,failed)&&runs!==0)add(/^failure\s*%$/,'Failure rate','Failed runs ÷ Total runs × 100',count(failed)+' ÷ '+count(runs)+' × 100',failed/runs*100);
    const expenseColumns=keys.map((key,index)=>/^(?:regular|expansion) (?:operating|capital) expenses$/.test(key)?index:-1).filter(index=>index>=0);
    if(expenseColumns.length===4&&expenseColumns.every(index=>values[index]!==null))add(/^total spend$/,'Total spend','Regular operating + Regular capital + Expansion operating + Expansion capital',expenseColumns.map(index=>money(values[index])).join(' + '),expenseColumns.reduce((sum,index)=>sum+values[index],0));
    if(!expenseColumns.length){
      const totalIndex=find(/^(?:total spend|total)$/),parts=values.filter((value,index)=>index>0&&index!==totalIndex);
      if(totalIndex>=0&&parts.length&&parts.every(value=>value!==null)){
        const format=texts[totalIndex].includes('₹')?money:count;
        add(/^(?:total spend|total)$/,'Row total','Sum of the component values in this row',parts.map(format).join(' + '),parts.reduce((a,b)=>a+b,0));
      }
    }
    if(context.inventoryDemo&&volume!==null){
      add(/^consumption \(units\)$/,'Inventory consumption','Tests × 2 demo units per test',count(volume)+' × 2',volume*2,'Illustrative inventory model.');
      add(/^stock used value$/,'Stock used value','Tests × ₹30 demo stock value per test',count(volume)+' × ₹30',volume*30,'Illustrative inventory model.');
    }
    return output;
  }
  const api={numeric,matches,calculate};
  window.dashboardValueFormulas=api;
  if(!document.body)return;
  const tooltip=document.createElement('div');tooltip.id='dashboardValueFormula';tooltip.className='dashboard-value-tooltip';tooltip.setAttribute('role','tooltip');tooltip.hidden=true;document.body.append(tooltip);
  const metadata=new WeakMap();let decorated=new Set(),active=null,scheduled=false,pinned=false;
  function contextFor(table){
    const context={};
    const referenceId=table.closest('[id^="reference-section-"]')?.id?.replace('reference-section-','');
    const baseId=table.closest('[id^="table-"]')?.id?.replace('table-','');
    const specialtyId=table.closest('[id^="special-"]')?.id?.replace('special-','');
    if(referenceId&&window.revenuePdfSnapshotState?.references[referenceId])context.fullRows=window.revenuePdfSnapshotState.references[referenceId];
    else if(baseId&&typeof dataSets!=='undefined'&&Array.isArray(dataSets[baseId]))context.fullRows=dataSets[baseId];
    else if(specialtyId&&typeof specialData!=='undefined'&&specialData[specialtyId])context.fullRows=specialData[specialtyId].rows;
    const note=document.getElementById('financialReportNote')?.textContent||'';
    context.marginIncludesCost=/Net Margin\s*=\s*Net\s*[−-]\s*Cost/i.test(note);
    context.inventoryDemo=table.closest('#financialOtherModule')&&typeof financialModule!=='undefined'&&financialModule==='Inventory';
    if(table.closest('#tat-report-distribution')&&window.tatOperationsData){context.shareBasis='tests';context.shareTotal=window.tatOperationsData.distribution.reduce((n,row)=>n+row[1],0);context.shareLabel='Tests in bucket ÷ All eligible completed tests × 100';}
    if(table.closest('#tat-report-flow')&&window.tatOperationsData){context.shareBasis='count';context.shareTotal=window.tatOperationsData.flow[0][1];context.shareLabel='Stage count ÷ Registered count × 100';}
    if(table.tHead?.textContent.includes('Workload Share')&&typeof filteredRecords!=='undefined'){context.shareBasis='tests';context.shareTotal=filteredRecords.length;context.shareLabel='Category tests ÷ All filtered tests × 100';}
    if(table.closest('#reference-section-booking')&&window.revenuePdfSnapshotState){context.shareTotal=window.revenuePdfSnapshotState.references.booking.reduce((n,row)=>n+row[2],0);context.shareLabel='Channel revenue ÷ All channel revenue × 100';}
    if(table.closest('#reference-section-segments')&&window.revenuePdfSnapshotState){context.shareTotal=window.revenuePdfSnapshotState.references.segments.reduce((n,row)=>n+row[3],0);context.shareLabel='Segment revenue ÷ All segment revenue × 100';}
    if(table.closest('main')&&document.getElementById('specialSummary')&&typeof filteredOrders!=='undefined'){
      const labels=[...table.tHead?.rows[0]?.cells||[]].map(cell=>normal(cell.textContent));
      if(table.closest('#special-referral')){context.shareBasis='orders';context.shareTotal=filteredOrders.length;context.shareLabel='Group orders ÷ All filtered specialty orders × 100';}
      else if(labels.some(label=>/^net revenue$/.test(label))){context.shareBasis='revenue';context.shareTotal=filteredOrders.reduce((sum,order)=>sum+order.amount,0);context.shareLabel='Group net revenue ÷ All filtered specialty revenue × 100';}
    }
    return context;
  }
  function hide(){
    if(active){const described=(active.getAttribute('aria-describedby')||'').split(/\s+/).filter(id=>id&&id!==tooltip.id).join(' ');if(described)active.setAttribute('aria-describedby',described);else active.removeAttribute('aria-describedby');}
    tooltip.hidden=true;active=null;pinned=false;
  }
  function position(){
    if(!active)return;
    const box=active.getBoundingClientRect(),width=tooltip.offsetWidth,height=tooltip.offsetHeight;
    tooltip.style.left=Math.max(12,Math.min(box.left,innerWidth-width-12))+'px';
    tooltip.style.top=Math.max(12,box.bottom+height+12>innerHeight?box.top-height-8:box.bottom+8)+'px';
  }
  function show(cell,pin=false){
    const value=metadata.get(cell);if(!value)return;
    hide();active=cell;pinned=pin;
    tooltip.replaceChildren();
    for(const [className,text] of [['title',value.title],['label','Formula'],['formula',value.formula],['label','Calculation'],['calculation',value.calculation],['note',value.note]]){
      if(!text)continue;const node=document.createElement('div');node.className='dashboard-value-tooltip-'+className;node.textContent=text;tooltip.append(node);
    }
    const old=cell.getAttribute('aria-describedby')||'';cell.setAttribute('aria-describedby',(old+' '+tooltip.id).trim());tooltip.hidden=false;position();
  }
  function scan(){
    if(active)hide();
    const next=new Set();
    function mark(cell,value){
      if(cell.colSpan!==1||cell.querySelector('button,a,input,select'))return;
      metadata.set(cell,value);next.add(cell);cell.classList.add('dashboard-formula-value');
      if(!cell.hasAttribute('tabindex')){cell.tabIndex=0;cell.dataset.formulaAddedTabindex='true';}
    }
    document.querySelectorAll('main table').forEach(table=>{
      if(table.closest('.dashboard-formula-dialog')||!table.tHead?.rows.length)return;
      const labels=[...table.tHead.rows[table.tHead.rows.length-1].cells].map(cell=>cell.textContent.replace(/\s+/g,' ').trim());
      const context=contextFor(table);
      for(const section of [...table.tBodies,table.tFoot].filter(Boolean))for(const row of section.rows){
        const cells=[...row.cells];if(cells.length!==labels.length||cells.some(cell=>cell.colSpan!==1))continue;
        for(const [index,value]of calculate(labels,cells.map(cell=>cell.textContent),context))mark(cells[index],value);
      }
      // Verified footer totals use the actual displayed operands, never a guessed hidden page.
      const bodyRows=[...table.tBodies].flatMap(body=>[...body.rows]).filter(row=>row.cells.length===labels.length&&[...row.cells].every(cell=>cell.colSpan===1));
      for(const row of table.tFoot?.rows||[])for(let index=1;index<row.cells.length;index++){
        const cell=row.cells[index],parts=context.fullRows?context.fullRows.map(row=>typeof row[index]==='number'?row[index]:numeric(row[index])):bodyRows.map(row=>numeric(row.cells[index].textContent));
        if(next.has(cell)||/%|share|avg|average|within|rate|change|margin/i.test(labels[index])||!parts.length||parts.some(value=>value===null))continue;
        const sum=parts.reduce((a,b)=>a+b,0);
        if(matches(cell.textContent,sum)){
          const format=cell.textContent.includes('₹')?money:count;
          const operands=parts.length>8?parts.slice(0,4).map(format).concat(format(parts.slice(4).reduce((a,b)=>a+b,0))+' (remaining '+(parts.length-4)+' rows)'):parts.map(format);
          mark(cell,{title:labels[index]+' total',formula:'Sum of the '+(context.fullRows?'filtered':'displayed')+' '+labels[index]+' values',calculation:operands.join(' + ')+' = '+cell.textContent.trim(),note:context.fullRows?'Includes all available filtered rows, across pages.':'Includes the rows currently displayed in this table.'});
        }
      }
      // P&L is a vertical statement: use its named line items as inputs.
      if(table.closest('.pnl-statement')){
        const rows=[...table.tBodies].flatMap(body=>[...body.rows]);
        const named=new Map(rows.map(row=>[normal(row.cells[0]?.textContent),row.cells[1]]));
        const val=name=>numeric(named.get(name)?.textContent);
        const pnl=(name,formula,operands,expected)=>{const cell=named.get(name);if(cell&&operands.every(value=>value!==null)&&matches(cell.textContent,expected))mark(cell,{title:cell.parentElement.cells[0].textContent,formula,calculation:operands.map(money).join(' − ')+' = '+cell.textContent.trim(),note:''});};
        const gross=val('gross revenue'),discount=val('less: discounts'),net=val('net revenue'),direct=val('less: direct test costs'),referral=val('less: referral expenses');
        pnl('net revenue','Gross revenue − Discounts',[gross,discount],gross-discount);
        pnl('contribution','Net revenue − Direct test costs − Referrals',[net,direct,referral],net-direct-referral);
        const contribution=val('contribution'),salaries=val('less: employee salaries'),other=val('less: other operating expenses');
        const profit=table.tFoot?.rows[0]?.cells[1];
        if(profit&&[contribution,salaries,other].every(value=>value!==null)&&matches(profit.textContent,contribution-salaries-other))mark(profit,{title:'Operating profit / loss',formula:'Contribution − Salaries − Other operating expenses',calculation:money(contribution)+' − '+money(salaries)+' − '+money(other)+' = '+profit.textContent.trim(),note:'Uses the selected CPT expense treatment.'});
      }
    });
    for(const cell of decorated)if(!next.has(cell)){cell.classList.remove('dashboard-formula-value');metadata.delete(cell);if(cell.dataset.formulaAddedTabindex){cell.removeAttribute('tabindex');delete cell.dataset.formulaAddedTabindex;}}
    decorated=next;
  }
  function target(event){const cell=event.target.closest?.('td.dashboard-formula-value');return cell&&metadata.has(cell)?cell:null;}
  document.addEventListener('pointerover',event=>{const cell=target(event);if(cell&&!pinned&&cell!==active)show(cell);});
  document.addEventListener('pointerout',event=>{if(!pinned&&active&&event.target.closest?.('td')===active&&!active.contains(event.relatedTarget))hide();});
  document.addEventListener('focusin',event=>{const cell=target(event);if(cell)show(cell);});
  document.addEventListener('focusout',event=>{if(active===event.target)hide();});
  document.addEventListener('click',event=>{const cell=target(event);if(cell){event.stopPropagation();if(active===cell&&pinned)hide();else show(cell,true);}else hide();},true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){hide();return;}const cell=target(event);if(cell&&(event.key==='Enter'||event.key===' ')){event.preventDefault();event.stopPropagation();show(cell,true);}},true);
  document.addEventListener('scroll',hide,true);window.addEventListener('resize',hide);
  new MutationObserver(records=>{
    if(records.every(record=>tooltip.contains(record.target)))return;
    if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;scan();});
  }).observe(document.body,{subtree:true,childList:true,characterData:true});
  api.scan=scan;scan();
})();
