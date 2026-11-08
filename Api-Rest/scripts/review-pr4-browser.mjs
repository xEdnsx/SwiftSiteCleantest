// End-to-end checks against the isolated PR4 API/database/SMTP fixture environment.
// No mocked API responses. Never prints passwords, tokens or message bodies.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const fixture = JSON.parse(readFileSync(new URL('../.github-prep/pr4/fixture.json', import.meta.url)));
const claimEmail = `browser-claim-${Date.now()}@example.invalid`;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let serial = 0;
class Page {
  constructor(ws) {
    this.ws=ws; this.pending=new Map(); this.errors=[]; this.responses=[];
    ws.onmessage=event=>{
      const m=JSON.parse(event.data);
      if(m.id){const p=this.pending.get(m.id);this.pending.delete(m.id);if(p)m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}
      if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails.text);
      if(m.method==='Network.responseReceived'&&m.params.response.url.includes(':8000/api/'))this.responses.push({path:new URL(m.params.response.url).pathname,status:m.params.response.status});
    };
  }
  send(method,params={}){const id=++serial;return new Promise((resolve,reject)=>{this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}));});}
  async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;}
  async wait(expression,label){for(let i=0;i<150;i++){if(await this.eval(expression))return;await sleep(100);}throw Error('Timeout: '+label);}
  async go(url){await this.send('Page.navigate',{url});await sleep(700);}
  async fill(selector,value){await sleep(400);await this.eval(`(()=>{const el=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.getClientRects().length&&!e.closest('.ion-page-hidden'));if(!el)throw Error('Visible input missing');el.focus();el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));})()`);}
  async submit(){await sleep(100);await this.eval("(document.activeElement?.form||[...document.forms].filter(e=>e.getClientRects().length&&!e.closest('.ion-page-hidden')).at(-1)).requestSubmit()");}
  async request(path){for(let i=0;i<100;i++){if(this.responses.some(r=>r.path===path&&r.status===200))return;await sleep(100);}throw Error('Missing successful API request '+path);}
}
async function open(){
  const t=await(await fetch('http://127.0.0.1:9223/json/new?about:blank',{method:'PUT'})).json();
  const ws=new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  const p=new Page(ws);await p.send('Page.enable');await p.send('Runtime.enable');await p.send('Network.enable');return p;
}
function pass(label){console.log('PASS browser '+label);}
const pages=[];
try{
  const admin=await open();pages.push(admin);
  await admin.go('http://127.0.0.1:5173/dashboard');
  await admin.wait("location.pathname==='/login'&&!!document.querySelector('#admin-correo')",'admin guard');pass('admin guest guard');
  await admin.fill('#admin-correo','browser-admin@example.invalid');await admin.fill('#admin-clave','Incorrect-password');await admin.submit();
  await admin.wait("document.body.innerText.includes('Credenciales incorrectas')",'invalid credentials');pass('incorrect password');
  await admin.fill('#admin-correo','browser-client@example.invalid');await admin.fill('#admin-clave','Synthetic-PR4-2026');await admin.submit();
  await admin.wait("document.body.innerText.includes('No tienes permisos')",'client rejected');pass('client denied Back Office');
  await admin.fill('#admin-correo','browser-admin@example.invalid');await admin.submit();
  await admin.wait("location.pathname==='/dashboard'",'admin login');await admin.request('/api/admin/resumen');pass('admin dashboard uses real API');
  for(const [route,endpoint] of [['clientes','clientes'],['pedidos','pedidos'],['catalogos',null],['zonas',null],['reportes','reportes'],['valoraciones','valoraciones']]){
    await admin.go('http://127.0.0.1:5173/'+route);
    await admin.wait(`location.pathname==='/${route}'&&!!document.querySelector('main')`,route);
    if(endpoint)await admin.request('/api/admin/'+endpoint);else await admin.request('/api/'+(route==='zonas'?'zonas':'categorias'));
    pass('admin '+route+' real endpoint');
    if(route==='clientes'){
      await admin.wait("!![...document.querySelectorAll('button[aria-label]')].find(b=>b.getAttribute('aria-label').includes('Ver perfil de Browser client'))",'client row');
      await admin.eval("[...document.querySelectorAll('button[aria-label]')].find(b=>b.getAttribute('aria-label').includes('Ver perfil de Browser client')).click()");
      await admin.wait("!!document.querySelector('[role=dialog]')||document.body.innerText.includes('Historial de pedidos')",'client detail');
      pass('individual client profile');
    }
  }
  await admin.send('Page.reload');await admin.request('/api/me');pass('admin session restored');
  assert.equal(await admin.eval(`(async()=>{const r=await fetch('http://127.0.0.1:8000/api/admin/clientes',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json',Authorization:'Bearer '+sessionStorage.getItem('swiftsite.admin.token')},body:JSON.stringify({nombre:'Cliente de activacion',correo:${JSON.stringify(claimEmail)}})});return r.status})()`),201);
  const ionic=await open();pages.push(ionic);
  await ionic.go('http://127.0.0.1:8101/#/inicio');await ionic.wait("!!document.querySelector('app-home')",'home');
  await ionic.request('/api/categorias');await ionic.request('/api/valoraciones-publicas');pass('Ionic home catalogs and moderated reviews');
  await ionic.go('http://127.0.0.1:8101/#/cotizar');await ionic.wait("document.querySelectorAll('app-quote button.cat').length>0",'quote categories');pass('quote categories from API');
  await ionic.eval("document.querySelector('app-quote button.cat').click()");
  await ionic.wait("document.querySelectorAll('app-quote [role=radio]').length>0",'materials and sizes');pass('material/size selection');
  await ionic.eval("[...document.querySelectorAll('app-quote button')].find(b=>b.textContent.includes('Agregar a mi lista')).click()");
  await ionic.wait("!!document.querySelector('app-quote .result .total strong')",'server quote result');await ionic.request('/api/cotizaciones/preliminar');pass('UI quote and department/zone list use server prices');
  for(const route of ['terminos','privacidad']){await ionic.go('http://127.0.0.1:8101/#/'+route);await ionic.wait("document.querySelectorAll('app-legal section').length>3",route);pass('Ionic '+route);}
  await ionic.go('http://127.0.0.1:8101/#/perfil');await ionic.wait("location.hash.startsWith('#/login')",'client guard');pass('Ionic guest guard');
  await ionic.fill('input[name=correo]','browser-client@example.invalid');await ionic.fill('input[name=password]','Synthetic-PR4-2026');await ionic.submit();
  await ionic.wait("location.hash==='#/perfil'",'client login');await ionic.request('/api/mis-reportes');await ionic.request('/api/mis-valoraciones');pass('client profile uses reports and ratings endpoints');
  await ionic.wait("!!document.querySelector('app-account button[role=switch]')",'theme switch');
  const dark=await ionic.eval("document.documentElement.classList.contains('oscuro')");
  await ionic.eval("document.querySelector('app-account button[role=switch]').click()");
  assert.notEqual(await ionic.eval("document.documentElement.classList.contains('oscuro')"),dark);pass('dark mode switch');
  await ionic.go('http://127.0.0.1:8101/#/cotizar/pedido');
  await ionic.wait("!!document.querySelector('app-cotizar textarea#direccion')",'schedule form');
  await ionic.fill('app-cotizar textarea#direccion','Colonia Prueba, calle principal, casa 123, frente al parque');
  await ionic.eval("[...document.querySelectorAll('app-cotizar button')].find(b=>b.textContent.includes('Ver resumen')).click()");
  await ionic.wait("!![...document.querySelectorAll('app-cotizar button')].find(b=>b.textContent.includes('Confirmar pedido')&&!b.disabled)",'order summary');
  await ionic.eval("[...document.querySelectorAll('app-cotizar button')].find(b=>b.textContent.includes('Confirmar pedido')).click()");
  await ionic.wait("location.hash==='#/pedidos'",'order created');
  assert.ok(ionic.responses.some(r=>r.path==='/api/pedidos'&&r.status===201));pass('order created from Ionic UI and persisted');
  await ionic.go('http://127.0.0.1:8101/#/pedidos');await ionic.request('/api/mis-pedidos');await ionic.wait("!!document.querySelector('app-pedidos')",'orders');pass('active orders and history');
  for(const [route,tag] of [['reportar','app-reportar'],['valorar','app-valorar']]){
    const orderId=fixture.orders[route==='reportar'?1:2];
    await ionic.go('http://127.0.0.1:8101/#/'+route+'/'+orderId);
    await ionic.wait(`!!document.querySelector('${tag}')`,route);await ionic.request('/api/mis-pedidos/'+orderId);pass('Ionic '+route+' own completed order');
    await ionic.wait(`!!document.querySelector('${tag} button[role=radio]')`,'feedback form');
    await ionic.eval(`document.querySelector('${tag} button[role=radio]').click()`);
    await ionic.fill(route==='reportar'?'app-reportar textarea':'app-valorar textarea','Comentario ficticio de la prueba de integracion.');
    await ionic.eval(`document.querySelector('${tag} button.btn-primary').click()`);
    await ionic.wait(`!!document.querySelector('${tag} h1.exito')`,'feedback persisted');pass('Ionic '+route+' form persisted through API');
  }
  // A new page/tab gets an independent sessionStorage; this tests activation without an existing session.
  const claim=await open();pages.push(claim);
  await claim.go('http://127.0.0.1:8101/#/registro');await claim.wait("!!document.querySelector('input[name=nombre]')",'claim form');
  for(const [name,value] of [['nombre','Cliente verificado'],['correo',claimEmail],['password','Synthetic-PR4-2026'],['confirmacion','Synthetic-PR4-2026']])await claim.fill(`input[name=${name}]`,value);
  await claim.eval("document.querySelector('input[name=acepta_terminos]').click()");await claim.submit();
  await claim.wait("!!document.querySelector('textarea[name=claim_token]')",'email activation prompt');
  assert.equal(await claim.eval("sessionStorage.getItem('swiftsite.cliente.token')"),null);pass('pending claim grants no access');
  const mail=await(await fetch('http://127.0.0.1:1026')).json();assert.ok(mail.codigo.length>80,'SMTP delivered activation code');
  await claim.fill('textarea[name=claim_token]',mail.codigo);await claim.submit();
  await claim.wait("location.hash==='#/perfil'",'verified claim');pass('real SMTP test mailbox -> activation -> authenticated profile');
  for(const p of pages)assert.deepEqual(p.errors,[],'No uncaught runtime exceptions');pass('no uncaught browser exceptions');
}finally{for(const p of pages)p.ws.close();}
