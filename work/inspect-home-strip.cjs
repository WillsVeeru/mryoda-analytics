const fs=require('fs');let h=fs.readFileSync('outputs/home.html','utf8');console.log(h.match(/<section class="application-title-strip">[\s\S]*?<\/section>/)?.[0]);
