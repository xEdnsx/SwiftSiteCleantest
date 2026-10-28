import assert from 'node:assert/strict';
const target = await (await fetch('http://127.0.0.1:9223/json/new?about:blank', {method:'PUT'})).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, {once:true}));
let id = 0;
const pending = new Map();
ws.onmessage = event => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const task = pending.get(message.id);
    pending.delete(message.id);
    if (task) message.error ? task.reject(Error(message.error.message)) : task.resolve(message.result);
  }
};
const send = (method, params={}) => new Promise((resolve,reject)=>{const current=++id;pending.set(current,{resolve,reject});ws.send(JSON.stringify({id:current,method,params}));});
const evaluate = async expression => {
  const result = await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails) throw Error(result.exceptionDetails.text);
  return result.result.value;
};
const delay = ms => new Promise(resolve=>setTimeout(resolve,ms));
const top = "(async()=>{const c=document.querySelector('app-home ion-content');return (await c.getScrollElement()).scrollTop})()";
try {
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'http://127.0.0.1:8100/#/inicio'});
  for(let i=0;i<100;i++) {
    if(await evaluate("!!document.querySelector('app-home ion-content')?.getScrollElement")) break;
    await delay(100);
  }
  await delay(1000);
  const geometry=await evaluate("(async()=>{const c=document.querySelector('app-home ion-content');const s=await c.getScrollElement();return {height:s.clientHeight,content:s.scrollHeight,outlets:document.querySelectorAll('ion-tabs ion-router-outlet').length}})()");
  assert.equal(geometry.outlets,1,'Only the Ionic-owned tabs router outlet');
  assert.ok(geometry.content>geometry.height,'Content overflows its constrained viewport');
  await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:150,y:500,deltaY:650,deltaX:0});
  await delay(500);
  assert.ok(await evaluate(top)>0,'Mouse wheel scrolls Inicio');
  console.log('PASS: desktop mouse wheel scroll');
  await evaluate("document.querySelector('app-home a[href=\"#servicios\"]').click()");
  await delay(500);
  const sectionOffset = await evaluate("(async()=>{const c=document.querySelector('app-home ion-content');const s=await c.getScrollElement();return document.querySelector('app-home #servicios').getBoundingClientRect().top-s.getBoundingClientRect().top})()");
  assert.ok(Math.abs(sectionOffset)<3,'Services navigation aligns the target section');
  console.log('PASS: section navigation');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await evaluate("document.querySelector('app-home ion-content').scrollToTop(0)");
  await delay(300);
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:160,y:650}]});
  for(const y of [600,550,500,450,400,350,300]) {
    await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:160,y}]});
    await delay(30);
  }
  await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await delay(500);
  assert.ok(await evaluate(top)>0,'Touch gesture scrolls Inicio');
  console.log('PASS: mobile touch scrolling');
  await evaluate("document.querySelector('app-home ion-content').scrollToBottom(0)");
  await delay(200);
  const bottom=await evaluate("(async()=>{const c=document.querySelector('app-home ion-content');const s=await c.getScrollElement();const footer=document.querySelector('app-home footer').getBoundingClientRect();const tabs=document.querySelector('ion-tab-bar').getBoundingClientRect();return {remaining:s.scrollHeight-s.clientHeight-s.scrollTop,footerBottom:footer.bottom,tabsTop:tabs.top}})()");
  assert.ok(bottom.remaining<2,'Can reach end of content');
  assert.ok(bottom.footerBottom<=bottom.tabsTop+2,'Footer is not hidden behind tabs');
  console.log('PASS: footer reachable above fixed tab bar');
} finally { await send('Browser.close').catch(()=>{}); ws.close(); }
