const fs=require('fs');let h=fs.readFileSync('outputs/home.html','utf8');console.log(h.match(/<section class="comparison-section">[\s\S]*?<\/section>/)?.[0]);
