const fs=require('fs');let h=fs.readFileSync('outputs/home.html','utf8');let i=h.indexOf("let data=[['TOTAL GROSS'");console.log(h.slice(i,i+1600));
