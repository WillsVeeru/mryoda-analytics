/* Transcribed from the visible rows of yodab2c.pdf. No hidden pagination rows are inferred. */
(() => {
  const data = {
    from:'2026-10-18',to:'2026-11-16',
    summary:{revenueLabel:'₹1.2Cr',bills:3846,homeRevenueLabel:'₹29.06L',homeBills:722,proRevenueLabel:'₹49.84L',doctorRevenueLabel:'₹10.93K',onlineRevenueLabel:'₹3.07L',matchedPercent:96.2},
    source:{file:'yodab2c.pdf',sha256:'60e3b54e433cae606c2f23e7d5831faac5e15d1d6e05143863b5c01ded1f90a6',pages:1,reportedRows:{pros:25,daily:30}},
    booking:[
      ['Admin desk / call centre',3548,3548,21690,11577691,3263,96.8],
      ['Mobile app',95,95,1112,252101,2654,2.1],
      ['No Mr Yoda order',146,146,404,58301,399,0.5],
      ['Website (mobile)',23,23,293,40518,1762,0.3],
      ['Website (desktop)',8,8,49,14302,1788,0.1],
      ['Unknown',17,17,110,13351,785,0.1],
      ['Doctor portal / Connect app',9,9,53,9160,1018,0.1]
    ],
    referral:[
      ['Self / direct',2404,2404,17519,6912284,2875,57.8],
      ['PRO',1293,1293,5749,4983908,3855,41.7],
      ['No Mr Yoda order',146,146,404,58301,399,0.5],
      ['Doctor',3,3,39,10931,3644,0.1]
    ],
    leads:[
      ['Not recorded',3513,3513,21494,10969042,3122,91.7],
      ['9135353535',81,81,912,359354,4436,3.0],
      ['Others',15,15,129,260996,17400,2.2],
      ['040-35353535',41,41,388,125809,3069,1.1],
      ['WhatsApp',28,28,282,73073,2610,0.6],
      ['No Mr Yoda order',146,146,404,58301,399,0.5],
      ['Google',8,8,12,57499,7187,0.5],
      ['Instagram',2,2,9,35248,17624,0.3],
      ['Walk in',12,12,81,26102,2175,0.2]
    ],
    campaigns:[],
    collection:[
      ['Admin desk / call centre',602,2677118,2946,8900573],
      ['Doctor portal / Connect app',2,0,7,9160],
      ['Mobile app',83,185073,12,67028],
      ['No Mr Yoda order',0,0,146,58301],
      ['Unknown',14,12352,3,999],
      ['Website (desktop)',3,6750,5,7552],
      ['Website (mobile)',18,25172,5,15346]
    ],
    pros:[
      ['NAVEENNATH',141,141,908,1207513,8564,10.1],
      ['GANGADHAR RAO',375,375,1101,1140931,3042,9.5],
      ['ARJUN',121,121,436,405838,3354,3.4],
      ['SAI CHANDRA KAMASALI',92,92,247,381087,4142,3.2],
      ['K SHIVA KUMAR',147,147,462,371946,2530,3.1],
      ['VIJAYASHANKAR',89,89,555,326774,3672,2.7],
      ['Khushbu Verma',18,18,114,313758,17431,2.6],
      ['SHRIKANTH GOUD',84,84,356,301118,3585,2.5],
      ['MR YODA',7,7,127,102194,14599,0.9],
      ['GUMMADI RAKESH-KMM',3,3,19,92999,31000,0.8]
    ],
    doctors:[['Doctor (name not recorded)',2,2,38,7731,3866,0.1],['I Nirmala Reddy',1,1,1,3200,3200,0.0]],
    conversion:[
      ['Admin desk / call centre',3680,3496,120,64,95.0],
      ['Mobile app',100,83,16,1,83.0],
      ['Website (mobile)',23,20,3,0,87.0],
      ['Unknown',17,12,5,0,70.6],
      ['Website (desktop)',11,6,5,0,54.5],
      ['Doctor portal / Connect app',9,8,1,0,88.9]
    ],
    daily:[
      ['2026-10-18',90,235742,38312,197430,90007,0,145735],
      ['2026-10-19',139,340275,66878,273397,176777,0,157998],
      ['2026-10-20',57,348939,223778,125161,265722,0,83217],
      ['2026-10-21',130,436796,130670,306126,146516,0,290280],
      ['2026-10-22',150,467087,205759,261328,232164,0,234923],
      ['2026-10-23',145,728704,169621,559083,211700,3200,513804],
      ['2026-10-24',170,459969,143663,316306,181594,0,278375],
      ['2026-10-25',102,216940,43797,173143,62195,0,154745],
      ['2026-10-26',164,540404,113209,427195,343624,0,174780],
      ['2026-10-27',160,426874,71443,355431,213162,1999,211713]
    ]
  };
  function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
  window.yodaB2CData=freeze(data);
})();
