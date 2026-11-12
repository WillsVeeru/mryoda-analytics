(() => {
  'use strict';
  const palette=['#35B34A','#2da6d9','#8b4ac4','#efa124','#36aca0','#d57698'];
  const states=new Map();
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function color(label){let hash=0;for(const c of String(label))hash=(hash*31+c.charCodeAt(0))>>>0;return palette[hash%palette.length];}
  function series(config,state){
    const groups=new Map(),type=config.types[state.value],average=/hours|percent/i.test(type);
    for(const row of config.rows){const value=row[state.value];if(value===null||value===''||!Number.isFinite(Number(value)))continue;const label=String(row[state.category]??'Unspecified'),entry=groups.get(label)||{label,value:0,count:0};entry.value+=Number(value);entry.count++;groups.set(label,entry);}
    let rows=[...groups.values()].map(row=>({...row,value:average?row.value/row.count:row.value})).sort((a,b)=>b.value-a.value||a.label.localeCompare(b.label));
    if(state.top!=='All')rows=rows.slice(0,Number(state.top));
    return rows;
  }
  function svg(config,state,rows){
    if(!rows.length)return '<p class="report-chart-empty">No chart values match the selected filters.</p>';
    const format=v=>config.format(v,config.types[state.value]),title=row=>'<title>'+esc(row.label)+': '+esc(format(row.value))+'</title>',label=row=>esc(row.label.length>28?row.label.slice(0,25)+'…':row.label);
    const max=Math.max(1,...rows.map(r=>r.value)),width=['Column','Line','Area'].includes(state.type)?Math.max(960,rows.length*85+140):960;
    const min=Math.min(0,...rows.map(r=>r.value)),range=max-min,zeroX=265-min/range*540,zeroY=325+min/range*265;
    let content='',height=420;
    if(state.type==='Bar'){
      height=Math.max(110,rows.length*25+30);
      content=rows.map((row,i)=>'<text x="250" y="'+(i*25+26)+'" text-anchor="end">'+label(row)+'</text><rect tabindex="0" x="'+(zeroX+Math.min(0,row.value)/range*540)+'" y="'+(i*25+14)+'" width="'+Math.abs(row.value)/range*540+'" height="14" rx="4" fill="'+color(row.label)+'">'+title(row)+'</rect><text x="'+(zeroX+10+Math.max(0,row.value)/range*540)+'" y="'+(i*25+26)+'">'+esc(format(row.value))+'</text>').join('');
      if(min<0)content+='<line x1="'+zeroX+'" x2="'+zeroX+'" y1="8" y2="'+height+'" stroke="#9aafa0"/>';
    }else if(state.type==='Pie'){
      const total=rows.reduce((sum,r)=>sum+Math.max(0,r.value),0);let angle=-Math.PI/2;
      height=Math.max(420,rows.length*27+35);
      content=rows.map((row,i)=>{const fraction=total?Math.max(0,row.value)/total:0,next=angle+fraction*Math.PI*2,x=210+145*Math.cos(angle),y=195+145*Math.sin(angle),xx=210+145*Math.cos(next),yy=195+145*Math.sin(next);let mark='';if(fraction===1)mark='<path tabindex="0" d="M65 195 A145 145 0 1 0 355 195 A145 145 0 1 0 65 195 Z" fill="'+color(row.label)+'">'+title(row)+'</path>';else if(fraction>0)mark='<path tabindex="0" d="M210 195 L'+x+' '+y+' A145 145 0 '+(fraction>.5?1:0)+' 1 '+xx+' '+yy+' Z" fill="'+color(row.label)+'" stroke="#fff">'+title(row)+'</path>';angle=next;return mark+'<rect x="395" y="'+(i*27+25)+'" width="10" height="10" rx="3" fill="'+color(row.label)+'"/><text x="417" y="'+(i*27+35)+'">'+label(row)+' · '+esc(format(row.value))+' ('+(fraction*100).toFixed(1)+'%)</text>';}).join('');
      if(!total)content='<text x="30" y="40">No positive values for a pie chart.</text>';
    }else{
      const step=(width-140)/rows.length,points=rows.map((row,i)=>[80+step*(i+.5),325-(row.value-min)/range*265]);
      for(let i=0;i<=4;i++){const y=325-i*265/4;content+='<line x1="65" x2="'+(width-35)+'" y1="'+y+'" y2="'+y+'" stroke="#e1ebe5"/><text x="58" y="'+(y+4)+'" text-anchor="end">'+esc(format(min+range*i/4))+'</text>';}
      if(state.type==='Area')content+='<polygon points="'+points[0][0]+','+zeroY+' '+points.map(p=>p.join(',')).join(' ')+' '+points.at(-1)[0]+','+zeroY+'" fill="#35B34A" fill-opacity=".13"/>';
      if(state.type==='Line'||state.type==='Area')content+='<polyline points="'+points.map(p=>p.join(',')).join(' ')+'" fill="none" stroke="#36aca0" stroke-width="2.5"/>';
      content+=rows.map((row,i)=>{const [x,y]=points[i],w=Math.min(24,step*.65);return (state.type==='Column'?'<rect tabindex="0" x="'+(x-w/2)+'" y="'+Math.min(y,zeroY)+'" width="'+w+'" height="'+Math.abs(zeroY-y)+'" rx="5" fill="'+color(row.label)+'">'+title(row)+'</rect>':'<circle tabindex="0" cx="'+x+'" cy="'+y+'" r="3.5" fill="'+color(row.label)+'">'+title(row)+'</circle>')+'<text x="'+x+'" y="345" transform="rotate(28 '+x+' 345)">'+label(row)+'</text>';}).join('');
      height=460;
    }
    return '<svg data-chart-metric="'+esc(config.columns[state.value])+'" data-mark-orientation="'+state.type+'" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="'+esc(config.title+' · '+state.type+' · '+config.columns[state.value])+'">'+content+'</svg>';
  }
  function render(host,config){
    const categories=config.types.map((type,i)=>type==='text'||type==='date'?i:-1).filter(i=>i>=0),values=config.types.map((type,i)=>type!=='text'&&type!=='date'?i:-1).filter(i=>i>=0&&(!config.valueIndices||config.valueIndices.includes(i)));
    const state=states.get(config.key)||{type:'Bar',category:config.category??categories[0],value:config.metric,top:'10'};
    if(!categories.includes(state.category))state.category=categories[0];if(!values.includes(state.value))state.value=values[0];states.set(config.key,state);
    const select=(key,label,options)=>'<label>'+label+' <select data-report-chart-select="'+key+'" aria-label="Chart '+label+'">'+options.map(([value,text])=>'<option value="'+value+'" '+(String(state[key])===String(value)?'selected':'')+'>'+esc(text)+'</option>').join('')+'</select></label>';
    host.innerHTML=config.close+'<div class="report-chart-toolbar"><div class="report-chart-types" role="group" aria-label="Chart type">'+['Bar','Column','Pie','Line','Area'].map(type=>'<button type="button" data-report-chart-type="'+type+'" aria-pressed="'+(state.type===type)+'">'+type+'</button>').join('')+'</div>'+select('category','Category',categories.map(i=>[i,config.columns[i]]))+select('value','Value',values.map(i=>[i,config.columns[i]]))+select('top','Top',[['5','5'],['10','10'],['20','20'],['All','All']])+'</div><p class="report-chart-caption">'+esc(config.columns[state.value]+' by '+config.columns[state.category])+' · '+(/hours|percent/i.test(config.types[state.value])?'Average of available row values':'Total values')+' · '+(state.top==='All'?'All categories':'Top '+state.top)+(state.type==='Pie'&&series(config,state).some(row=>row.value<0)?' ? Pie proportions use positive values only':'')+'</p><div class="report-chart-visual">'+svg(config,state,series(config,state))+'</div>';
    host.onclick=event=>{const type=event.target.closest('[data-report-chart-type]');if(!type)return;event.stopPropagation();state.type=type.dataset.reportChartType;render(host,config);host.querySelector('[data-report-chart-type="'+state.type+'"]').focus();};
    host.onchange=event=>{const key=event.target.dataset.reportChartSelect;if(!key)return;event.stopPropagation();state[key]=key==='top'?event.target.value:Number(event.target.value);render(host,config);host.querySelector('[data-report-chart-select="'+key+'"]').focus();};
  }
  window.dashboardReportCharts={render,series,states};
})();
