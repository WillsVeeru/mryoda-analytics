/* Only the visible entries in the supplied PRO dropdown are transcribed here.
   REF-PRO keys are fixed local target keys, never LIS/PRO identifiers.
   Keep each key with its person when reordering or extending this list. */
window.targetReferencePeople=Object.freeze([
  ['001','A MOHAN RAO - WARANGAL','AREA SALES MANAGER-BD'],
  ['002','ABHIMANYU KUMAR','Dy Zonal Sales Manager-BD'],
  ['003','ABHISHEK MOTIRAM JAGTAP (MH)','REGIONAL SALES MANAGER'],
  ['004','ALLA BOSE SRINIVAS','CHIEF BUSINESS OFFICER-BD'],
  ['005','ANAND KARUKU','Asst Manager - Business Development'],
  ['006','ANDE RAJU-KARIMNAGAR','SR EXECUTIVE-BD'],
  ['007','ANISH JOSEPH AUGUSTINE-KERALA','REGIONAL SALES MANAGER-BD'],
  ['008','Anupam Singh Tomer-Kanpur','TERRITORY SALES MANAGER-BD'],
  ['009','ARJUN',''],
  ['010','ASHISH MISHRA-UP & UTTARAKHAND','REGIONAL SALES MANAGER-BD'],
  ['011','ASHISH PANDEY-LUCKNOW','Dy Zonal Sales Manager-BD'],
  ['012','ASHWINI MISHRA-DELHI','SR ASM-BD'],
  ['013','B VENKATA SATYA PRASAD','ASSISTANT GENERAL MANAGER-BD'],
  ['014','B.S.Sachin','Manager - Corporate Sales'],
  ['015','Bammidi Srinivas',''],
  ['016','Batthula Ravi Teja','Business development executive'],
  ['017','BHUVANESH PANDEY','GENERAL MANAGER-BD'],
  ['018','Ch Lakshmi Kanth','BUSINESS DEVELOPMENT EXECUTIVE']
].map(([key,name,designation])=>Object.freeze({id:'REF-PRO-'+key,sourceId:null,name,designation,scope:'pro',centerId:null,branch:'Not provided',source:'reference'})));
