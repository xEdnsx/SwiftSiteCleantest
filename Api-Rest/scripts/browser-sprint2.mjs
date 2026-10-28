// Browser flow verification using synthetic API responses; no real credentials or users.
import assert from 'node:assert/strict';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const tokens = new Map();
const user = role => ({ id_usuario: role === 'Administrador' ? 1 : 2, nombre: 'Prueba Sprint 2', correo: 'prueba@example.invalid', telefono: null, rol: { nombre_rol: role } });
let sequence = 0;

class Page {
  constructor(ws) {
    this.ws = ws;
    this.pending = new Map();
    this.errors = [];
    ws.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const entry = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (entry) message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result);
      }
      if (message.method === 'Runtime.exceptionThrown') this.errors.push(message.params.exceptionDetails.text);
      if (message.method === 'Fetch.requestPaused') this.respond(message.params).catch(error => this.errors.push(error.message));
    });
  }
  send(method, params = {}) {
    const id = ++sequence;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
  async wait(expression, name) {
    for (let i = 0; i < 120; i++) {
      if (await this.eval(expression)) return;
      await delay(100);
    }
    throw new Error('Timeout: ' + name);
  }
  async go(url) { await this.send('Page.navigate', { url }); }
  async fill(name, value) {
    await delay(600); // Ionic retains outgoing pages during its navigation animation.
    await this.eval(`(() => { const el = [...document.querySelectorAll(${JSON.stringify(name)})].find(el => el.getClientRects().length && !el.closest('.ion-page-hidden')); if (!el) throw Error('Missing visible input'); el.focus(); el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); })()`);
  }
  async submit() { await delay(100); await this.eval("(document.activeElement?.form || [...document.querySelectorAll('form')].filter(el => el.getClientRects().length && !el.closest('.ion-page-hidden')).at(-1)).requestSubmit()"); }
  async respond({ requestId, request }) {
    const path = new URL(request.url).pathname.replace('/api', '');
    const body = request.postData ? JSON.parse(request.postData) : {};
    const authorization = Object.entries(request.headers).find(([key]) => key.toLowerCase() === 'authorization')?.[1];
    const token = authorization?.replace('Bearer ', '');
    let status = 200;
    let data = {};
    if (request.method === 'OPTIONS') status = 204;
    else if (path === '/login' || path === '/register') {
      const role = body.correo?.startsWith('admin') ? 'Administrador' : 'Cliente';
      if (body.password !== 'valid-test-password') { status = 401; data = { message: 'Credenciales incorrectas.' }; }
      else if (path === '/login' && ((body.portal === 'administrador' && role !== 'Administrador') || (body.portal === 'cliente' && role !== 'Cliente'))) {
        status = 403; data = { message: 'Esta cuenta no tiene acceso a esta aplicacion.' };
      } else {
        const generated = `synthetic-${++sequence}`;
        tokens.set(generated, user(role));
        status = path === '/register' ? 201 : 200;
        data = { token: generated, usuario: user(role), token_type: 'Bearer' };
      }
    } else if (path === '/me' || path === '/user') {
      data = tokens.get(token);
      if (!data) { status = 401; data = { message: 'Unauthenticated.' }; }
    } else if (path === '/logout') { tokens.delete(token); status = 204; }
    else if (path === '/categorias') data = [{ id_categoria: 1, nombre: 'Sillas', activo: true }];
    else if (path === '/tarifas') data = [{ id_tarifa: 1, id_categoria: 1, tipo_item: 'Silla individual', precio_unitario: '12.35', material: 'Tela', activo: true }];
    else if (path === '/zonas') data = [{ id_zona: 1, nombre: 'Centro', recargo: '2.10', activo: true }];
    else if (path === '/cotizaciones/preliminar') data = { preliminar: true, subtotal: '37.05', recargo_zona: '2.10', total: '39.15' };
    else { status = 404; data = { message: 'Not found' }; }
    const origin = request.headers.Origin || request.headers.origin || new URL(request.url).origin;
    await this.send('Fetch.fulfillRequest', {
      requestId, responseCode: status,
      responseHeaders: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Access-Control-Allow-Origin', value: origin },
        { name: 'Access-Control-Allow-Headers', value: 'authorization,content-type,accept' },
        { name: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
      ],
      body: status === 204 ? '' : Buffer.from(JSON.stringify(data)).toString('base64'),
    });
  }
}

async function open() {
  const target = await (await fetch('http://127.0.0.1:9223/json/new?about:blank', { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  const page = new Page(ws);
  await page.send('Runtime.enable');
  await page.send('Page.enable');
  await page.send('Fetch.enable', { patterns: [{ urlPattern: 'http://127.0.0.1:8000/api/*' }] });
  return page;
}

function pass(name) { console.log('PASS browser: ' + name); }
const pages = [];
try {
  const vue = await open(); pages.push(vue);
  await vue.go('http://127.0.0.1:5173/dashboard');
  await vue.wait("location.pathname === '/login' && !!document.querySelector('input[type=email]')", 'Vue guest redirect');
  pass('Vue /dashboard redirects guests to login');
  await vue.fill('input[type=email]', 'admin@example.invalid');
  await vue.fill('input[type=password]', 'wrong');
  await vue.submit();
  await vue.wait("document.body.innerText.includes('Credenciales incorrectas')", 'wrong password');
  pass('Vue incorrect password denied');
  await vue.fill('input[type=email]', 'cliente@example.invalid');
  await vue.fill('input[type=password]', 'valid-test-password');
  await vue.submit();
  await vue.wait("document.body.innerText.includes('No tienes permisos')", 'Vue client denied');
  pass('Vue Cliente denied Back Office');
  await vue.fill('input[type=email]', 'admin@example.invalid');
  await vue.submit();
  await vue.wait("location.pathname === '/dashboard' && document.body.innerText.includes('Bienvenido')", 'Vue login');
  pass('Vue admin login and dashboard');
  await vue.send('Page.reload');
  await vue.wait("location.pathname === '/dashboard' && document.body.innerText.includes('Prueba Sprint 2')", 'Vue restore');
  pass('Vue reload validates session through /me');
  await vue.go('http://127.0.0.1:5173/catalogos');
  await vue.wait("!!document.querySelector('tbody tr')", 'Vue catalogs');
  pass('Vue catalog API rendering');
  await vue.go('http://127.0.0.1:5173/zonas');
  await vue.wait("document.querySelector('tbody')?.innerText.includes('Centro')", 'Vue zones');
  pass('Vue coverage navigation');
  await vue.eval("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Cerrar sesion')).click()");
  await vue.wait("location.pathname === '/login'", 'Vue logout');
  assert.equal(await vue.eval("sessionStorage.getItem('swiftsite.admin.token')"), null);
  pass('Vue logout clears session');

  const ionic = await open(); pages.push(ionic);
  await ionic.go('http://127.0.0.1:8101/#/inicio');
  await ionic.wait("!!document.querySelector('app-home') && !!document.querySelector('ion-tab-bar')", 'Ionic home');
  pass('Ionic home and four tabs render');
  await ionic.go('http://127.0.0.1:8101/#/perfil');
  await ionic.wait("location.hash.startsWith('#/login') && !!document.querySelector('input[name=correo]')", 'Ionic guard');
  pass('Ionic guest profile redirects to login');
  await ionic.go('http://127.0.0.1:8101/#/registro');
  await ionic.wait("!!document.querySelector('input[name=nombre]')", 'Ionic register');
  await ionic.fill('input[name=nombre]', 'Prueba');
  await ionic.fill('input[name=correo]', 'cliente@example.invalid');
  await ionic.fill('input[name=password]', 'valid-test-password');
  await ionic.fill('input[name=confirmacion]', 'valid-test-password');
  await ionic.submit();
  await ionic.wait("location.hash === '#/perfil' && document.body.innerText.includes('Prueba Sprint 2')", 'Ionic registration');
  pass('Ionic registration reaches protected profile');
  await ionic.send('Page.reload');
  await ionic.wait("location.hash === '#/perfil' && document.body.innerText.includes('Prueba Sprint 2')", 'Ionic restore');
  pass('Ionic reload validates session');
  await ionic.eval("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Cerrar sesion')).click()");
  await ionic.wait("location.hash === '#/inicio'", 'Ionic logout');
  assert.equal(await ionic.eval("sessionStorage.getItem('swiftsite.cliente.token')"), null);
  pass('Ionic logout clears token and returns to guest mode');
  await ionic.go('http://127.0.0.1:8101/#/cotizar');
  await ionic.wait("document.querySelectorAll('select[name=tarifa] option').length > 1", 'Ionic quote catalogs');
  await ionic.eval("(() => { for (const s of document.querySelectorAll('select')) { s.selectedIndex = 1; s.dispatchEvent(new Event('change',{bubbles:true})); } })()");
  await ionic.fill('input[name=cantidad]', '3');
  await ionic.submit();
  await ionic.wait("document.body.innerText.includes('39.15')", 'Ionic quote');
  pass('Ionic guest quote renders server result');
  await ionic.go('http://127.0.0.1:8101/#/login');
  await ionic.wait("!!document.querySelector('input[name=correo]')", 'Ionic login form');
  await ionic.fill('input[name=correo]', 'admin@example.invalid');
  await ionic.fill('input[name=password]', 'valid-test-password');
  await ionic.submit();
  await ionic.wait("document.body.innerText.includes('Esta cuenta no tiene acceso')", 'Ionic admin rejection');
  pass('Ionic rejects administrator credentials for client portal');
  await ionic.fill('input[name=correo]', 'cliente@example.invalid');
  await ionic.fill('input[name=password]', 'wrong');
  await ionic.submit();
  await ionic.wait("document.body.innerText.includes('Credenciales incorrectas')", 'Ionic wrong password');
  pass('Ionic incorrect password denied');
  await ionic.fill('input[name=password]', 'valid-test-password');
  await ionic.submit();
  await ionic.wait("location.hash === '#/perfil'", 'Ionic client login');
  pass('Ionic client login');
  await ionic.go('http://127.0.0.1:8101/#/pedidos');
  await ionic.wait("document.body.innerText.includes('Sprint 3')", 'Ionic orders placeholder');
  pass('Ionic protected orders placeholder is explicit');
  tokens.clear();
  await ionic.go('http://127.0.0.1:8101/#/perfil');
  await ionic.wait("location.hash.startsWith('#/login')", 'Ionic expired session');
  pass('Ionic invalid token clears session and redirects');
  for (const page of pages) assert.deepEqual(page.errors, [], 'No uncaught browser runtime exceptions');
  pass('No uncaught runtime exceptions');

  // These requests use the real backend from both browser origins, without mocks.
  for (const [page, origin] of [[vue, 'http://127.0.0.1:5173'], [ionic, 'http://127.0.0.1:8100']]) {
    await page.send('Fetch.disable');
    await page.go(origin);
    await page.wait(`location.origin === ${JSON.stringify(origin)} && document.readyState === 'complete'`, 'live origin');
    const result = await page.eval(`(async () => {
      const base = 'http://127.0.0.1:8000/api';
      const read = async path => { const response = await fetch(base + path, {headers:{Accept:'application/json'}}); if (!response.ok) throw Error('HTTP ' + response.status); return response.json(); };
      const [categories, tariffs, zones] = await Promise.all(['/categorias?activo=1','/tarifas?activo=1','/zonas?activo=1'].map(read));
      const tariff = tariffs.find(t => categories.some(c => c.id_categoria === t.id_categoria));
      if (!tariff || !zones[0]) return 'NO_ACTIVE_CATALOGS';
      const response = await fetch(base + '/cotizaciones/preliminar', {method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({id_zona:zones[0].id_zona,items:[{id_tarifa:tariff.id_tarifa,cantidad:1}]})});
      const quote = await response.json();
      return response.ok && quote.preliminar === true && typeof quote.total === 'string';
    })()`);
    assert.equal(result, true, 'Live catalogs and quote from ' + origin);
    pass('Live browser CORS, catalogs and quote -> Laravel -> MySQL from ' + origin);
  }
} finally {
  for (const page of pages) page.ws.close();
}
