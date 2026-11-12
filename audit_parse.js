const fs=require('fs');
const file=process.argv[2];
const data=JSON.parse(fs.readFileSync(file,'utf8'));
if(file.includes('dark')){
  const out={};
  for(const [module,rows] of Object.entries(data))out[module]=rows.filter(x=>x.bg!=='rgba(0, 0, 0, 0)').map(x=>({tag:x.tag,cls:x.cls,bg:x.bg,area:x.area,text:x.text}));
  console.log(JSON.stringify(out,null,2));
}else{
  console.log(JSON.stringify({errors:data.errors,modules:data.results.map(x=>({module:x.module,missingNavigation:!!x.missingNavigation,duplicateSelectedOptions:x.duplicateSelectedOptions,finalCss:x.finalCss,themeToggle:x.hasDarkThemeToggle,daniel:x.messengerDaniel}))},null,2));
}
