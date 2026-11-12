/* Demonstration extension. Original PDF records remain unchanged in doctors-data.js. */
(() => {
  'use strict';
  const original=window.doctorsData;
  const data=JSON.parse(JSON.stringify(original));
  const cities=['Hyderabad','Bengaluru','Chennai','Mumbai','Delhi'];
  const specialties=['General Medicine','Cardiology','Orthopaedics','Gynaecology','Neurology'];
  // Fixed arithmetic keeps sample values stable when filters or pagination change.
  for(let i=1;i<=20;i++){
    const bills=12+(i*17%67),patients=bills-(i%4),revenue=54000-i*1700+(i%3)*125;
    const name='DEMO REFERRER '+String(i).padStart(2,'0');
    data.top.push([name,specialties[(i-1)%5],cities[(i-1)%5],bills,patients,revenue]);
    data.newDoctors.push([name,'2026-11-'+String(6+i%7).padStart(2,'0'),bills,revenue]);
    data.dormant.push(['DEMO DORMANT REFERRER '+String(i).padStart(2,'0'),18+i*3,225000-i*7500]);
  }
  const templates=[
    ['BIOCHEMISTRY',['Blood glucose','Lipid profile','Liver function tests','Kidney function tests']],
    ['HAEMATOLOGY',['Complete blood count','ESR','Peripheral smear','Reticulocyte count']],
    ['RADIOLOGY',['USG whole abdomen','X-ray chest PA','CT brain plain','MRI brain plain']]
  ];
  const split=(total,weights)=>{let used=0;return weights.map((weight,index)=>{const value=index===weights.length-1?total-used:Math.floor(total*weight);used+=value;return value;});};
  data.sampleDoctors=[];
  for(const [index,row] of data.top.entries()){
    if(data.categories[row[0]])continue;
    const bills=split(row[3],[.46,.32,.22]),revenues=split(row[5],[.25,.20,.55]);
    data.sampleDoctors.push(row[0]);data.tests[row[0]]={};
    data.categories[row[0]]=templates.map(([category,names],i)=>{
      const volume=bills[i]+Math.max(1,Math.floor(bills[i]*(i===2?.35:1.25)))+index%3;
      const volumes=split(volume,[.4,.3,.2,.1]),amounts=split(revenues[i],[.36,.27,.22,.15]);
      data.tests[row[0]][category]=names.map((name,j)=>[name,volumes[j],amounts[j]]);
      return [category,bills[i],volume,revenues[i]];
    });
  }
  data.source={...data.source,sampleExtension:true};
  data.sourceReportCounts=data.reportCounts;
  data.reportCounts={top:data.top.length,newDoctors:data.newDoctors.length,dormant:data.dormant.length};
  const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
  window.doctorsData=freeze(data);
})();
