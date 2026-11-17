/* Shared existing finance/expense model for Financial Overview and Home. No UI or storage writes. */
(()=>{
'use strict';
const centerDefinitions=[{id:'hyderabad',name:'Hyderabad',employees:48,dailyRevenue:182974,salaryMonthly:1680000},{id:'bengaluru',name:'Bengaluru',employees:36,dailyRevenue:142600,salaryMonthly:1420000},{id:'chennai',name:'Chennai',employees:31,dailyRevenue:119500,salaryMonthly:1116000},{id:'mumbai',name:'Mumbai',employees:42,dailyRevenue:169800,salaryMonthly:1764000},{id:'delhi',name:'Delhi',employees:29,dailyRevenue:106400,salaryMonthly:1102000}];
function centerDateRange(from,to){let start=new Date(from+'T00:00:00Z'),end=new Date(to+'T00:00:00Z');if(!from||!to||!Number.isFinite(+start)||!Number.isFinite(+end)||start>end)return null;let list=[];for(let day=start;day<=end;day=new Date(+day+86400000)){list.push(day.toISOString().slice(0,10));if(list.length>3660)return null}return list}
function centerDailyRecord(center,date){let day=new Date(date+'T00:00:00Z'),seed=Number(date.replaceAll('-','')),variation=.86+(seed%19)/60,revenue=Math.round(center.dailyRevenue*variation),discount=Math.round(revenue*(.08+(seed%5)*.012)),days=new Date(Date.UTC(day.getUTCFullYear(),day.getUTCMonth()+1,0)).getUTCDate(),salaries=center.salaryMonthly/days,otherExpenses=Math.round(revenue*.28);return {revenue,discount,net:revenue-discount,salaries,expenditure:otherExpenses+salaries}}
function aggregateCenters(from,to,id='all'){let dates=centerDateRange(from,to);if(!dates)return null;return centerDefinitions.filter(center=>id==='all'||center.id===id).map(center=>{let total={id:center.id,name:center.name,revenue:0,discount:0,net:0,expenditure:0,employees:center.employees,salaries:0};dates.forEach(date=>{let row=centerDailyRecord(center,date);for(let key of ['revenue','discount','net','expenditure','salaries'])total[key]+=row[key]});return total})}
const financialExpenseAllocationProfiles = {
    hyderabad: [0.62, 0.18, 0.08],
    bengaluru: [0.52, 0.16, 0.12],
    chennai: [0.73, 0.12, 0.06],
    mumbai: [0.58, 0.22, 0.07],
    delhi: [0.65, 0.10, 0.10]
};
function financialBranchExpenseAllocation(branch) {
  // Stable branch-specific demo mixes; distribute non-salary spend without changing totals.
  const [operatingShare, capitalShare, expansionShare] = financialExpenseAllocationProfiles[branch.id] || [0.65, 0.15, 0.08];
  const spend = Math.round(branch.expenditure);
  const salaries = Math.round(branch.salaries);
  const remaining = Math.max(0, spend - salaries);
  const regularRunning = Math.round(remaining * operatingShare);
  const regularCapital = Math.round(remaining * capitalShare);
  const expansionOperating = Math.round(remaining * expansionShare);
  const expansionCapital = remaining - regularRunning - regularCapital - expansionOperating;
  return { salaries, regularRunning, regularOperating: salaries + regularRunning,
    regularCapital, expansionOperating, expansionCapital, total: spend };
}

for(const center of centerDefinitions)Object.freeze(center);Object.freeze(centerDefinitions);for(const profile of Object.values(financialExpenseAllocationProfiles))Object.freeze(profile);Object.freeze(financialExpenseAllocationProfiles);
window.dashboardFinancialData=Object.freeze({centers:centerDefinitions,dateRange:centerDateRange,dailyRecord:centerDailyRecord,aggregate:aggregateCenters,expenseProfiles:financialExpenseAllocationProfiles,expenseAllocation:financialBranchExpenseAllocation});
})();
