const { chromium } = require('playwright');
const base = process.env.IMF_QA_BASE, user = process.env.IMF_QA_USER, password = process.env.IMF_QA_PASSWORD;
async function main(){
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1900,height:950}});
  await page.goto(`${base}/index.html?access=1&v=copy-clear-10`,{waitUntil:'networkidle'});
  await page.fill('#lu',user);await page.fill('#lp',password);await page.click('#loginBtn');await page.waitForSelector('#appShell');
  const modules=[['sales','Ventas'],['messengers','Mensajeros'],['fleet','Flotilla'],['requests','Solicitud de vehículo']];
  const output={};
  for(const [key,label] of modules){
    await page.getByText(label,{exact:true}).first().click();await page.waitForTimeout(1000);
    output[key]=await page.evaluate(()=>[...document.querySelectorAll('main *,#content *')].map(el=>{
      if(el.closest('.sidebar'))return null;const r=el.getBoundingClientRect();if(r.width*r.height<5000||r.width<80||r.height<30)return null;
      const c=getComputedStyle(el).backgroundColor,m=c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);if(!m)return null;const lum=.2126*+m[1]+.7152*+m[2]+.0722*+m[3];if(lum>90)return null;
      return {tag:el.tagName.toLowerCase(),cls:el.className||'',bg:c,area:Math.round(r.width*r.height),text:(el.innerText||'').trim().slice(0,90)};
    }).filter(Boolean).sort((a,b)=>b.area-a.area).slice(0,25));
  }
  console.log(JSON.stringify(output,null,2));await browser.close();
}
main().catch(e=>{console.error(e);process.exit(1)});
