const fs=require('fs');
const file=process.argv[2], patterns=process.argv.slice(3), s=fs.readFileSync(file,'utf8');
for(const p of patterns){const first=s.indexOf(p),i=s.lastIndexOf(p); console.log(`\nPATTERN ${p} FIRST ${first} LAST ${i}\n${i>=0?s.slice(Math.max(0,i-1800),i+5000):''}`)}
