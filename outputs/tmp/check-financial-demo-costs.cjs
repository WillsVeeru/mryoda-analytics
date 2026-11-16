const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('center-overview-financial.js','utf8');
const tests=source.match(/const financialSampleTests = (\{[\s\S]*?\n\});/)[0];
const rates=source.split('\n').find(line=>line.startsWith('const sampleCptRates ='));
const context={Map};vm.createContext(context);vm.runInContext(tests+'\n'+rates+'\nglobalThis.defaults=sampleCptRates;',context);
const names=Array.from(context.defaults.keys()),rows=[...names.slice(0,6),names[0],names[1],...names.slice(6)].map((test,index)=>({test,tests:100,net:4400,employeeId:'EMP'+index,centerId:'hyderabad',type:'B2B',id:'CLIENT'+index,category:'BIOCHEMISTRY'}));
Object.assign(context,{cptRates:context.defaults,centerInsightState:{records:rows.map(row=>({employeeId:row.employeeId,discount:0}))},centerSalesState:{records:rows},financialScopedRecords:rows=>rows,financialTestRows:rows=>rows,financialDoctorAssignment:()=>({}),financialBranchAssignment:()=>({}),financialApplyHeaderFilters:rows=>rows,splitCenterActivity:(discount,weights)=>weights.map(()=>0)});
const at=source.indexOf('function financialLedger('),end=source.indexOf('\nfunction ',at+1);vm.runInContext(source.slice(at,end),context);
let ledger=context.financialLedger();assert.equal(ledger.filter(row=>row.net-row.cost-row.referral>0).length,8);assert.equal(ledger.filter(row=>row.net-row.cost-row.referral<0).length,2);
for(const row of ledger){assert.equal(row.cost,row.tests*context.defaults.get(row.test));assert.equal(row.net,4400);assert.equal(row.gross,4400);}
context.cptRates=new Map([[names[0],123.45]]);ledger=context.financialLedger();assert.equal(ledger[0].cost,12345,'Uploaded rate used exactly, even when it produces a loss');assert.equal(ledger[1].cost,null,'Missing imported rate stays unavailable');
console.log('PASS: representative ten-row demo has eight profit/two loss rows using reduced sample CPT rates; cost = tests × rate; revenue unchanged; imported and missing CPT rates preserved.');
