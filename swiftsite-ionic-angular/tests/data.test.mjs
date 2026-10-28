import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/app/data.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } });
const data = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);

test('WhatsApp rejects placeholders and invalid numbers', () => {
  for (const value of ['503XXXXXXXX', '', '123', '00000000', '1234567890123456']) {
    assert.equal(data.whatsappUrl('Sillas', value), null);
  }
});

test('WhatsApp normalizes the number and encodes the service message', () => {
  const url = new URL(data.whatsappUrl('Baños & colchones', '+503 7000-0000'));
  assert.equal(url.hostname, 'wa.me');
  assert.equal(url.pathname, '/50370000000');
  assert.equal(url.searchParams.get('text'), 'Hola SwiftSite Clean 👋\nMe interesa cotizar: Baños & colchones');
  assert.match(new URL(data.whatsappUrl(undefined, '50370000000')).searchParams.get('text'), /servicio de limpieza/);
});

test('All photographs referenced by services and comparisons exist', () => {
  const photos = data.servicios.map(service => service.foto).filter(Boolean);
  for (const pair of data.comparaciones) photos.push(pair.antes, pair.despues);
  for (const photo of photos) {
    assert.ok(existsSync(new URL(`../src/${data.foto(photo)}`, import.meta.url)), photo);
  }
});

test('Photo URL encodes spaces and reserved characters', () => {
  assert.equal(data.foto('foto #1.webp'), 'assets/fotos/foto%20%231.webp');
});
