import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/app/pages/legal/legal.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } });
const legal = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);

test('la versión legal coincide con la de la API (config/legal.php)', () => {
  const ruta = new URL('../../Api-Rest/config/legal.php', import.meta.url);
  assert.ok(existsSync(ruta), 'No se encontró Api-Rest/config/legal.php');
  const php = readFileSync(ruta, 'utf8');
  assert.ok(php.includes(`'${legal.LEGAL_VERSION}'`), `La API debe usar la versión ${legal.LEGAL_VERSION} por defecto`);
});

test('ambos documentos tienen secciones con título y contenido', () => {
  for (const tipo of ['terminos', 'privacidad']) {
    const secciones = legal.secciones(tipo);
    assert.ok(secciones.length >= 8, tipo);
    for (const s of secciones) {
      assert.ok(s.titulo.length > 3);
      assert.ok(s.parrafos.length > 0 || (s.lista?.length ?? 0) > 0);
    }
  }
});

test('el aviso de privacidad cubre lo que exige informar', () => {
  const texto = JSON.stringify(legal.secciones('privacidad')).toLowerCase();
  for (const clave of ['responsable', 'usamos', 'consentimiento', 'acceso', 'rectificación', 'cancelación', 'oposición', 'portabilidad', 'conservamos', 'menores', 'brecha']) {
    assert.ok(texto.includes(clave), `Falta mencionar: ${clave}`);
  }
});

test('los datos pendientes del negocio se marcan de forma visible', () => {
  assert.match(legal.dato(null, 'domicilio'), /\[Completar: domicilio\]/);
  assert.match(legal.dato('  ', 'domicilio'), /\[Completar/);
  assert.equal(legal.dato('Calle 1', 'domicilio'), 'Calle 1');
  assert.equal(legal.datosPendientes({ responsable: 'X', domicilio: 'Y', correo: 'z@z.com', telefono: '7000' }).length, 0);
  assert.equal(legal.datosPendientes({ responsable: null, domicilio: 'Y', correo: null, telefono: '7000' }).length, 2);
});

test('con los datos completos no queda ningún marcador en los textos', () => {
  const completo = { responsable: 'Mi Negocio S.A. de C.V.', domicilio: 'San Salvador', correo: 'datos@negocio.com', telefono: '7000-0000' };
  for (const tipo of ['terminos', 'privacidad']) {
    assert.ok(!JSON.stringify(legal.secciones(tipo, completo)).includes('[Completar'));
  }
});

test('los términos y el aviso de privacidad cubren las valoraciones que se muestran en la app', () => {
  const terminos = JSON.stringify(legal.secciones('terminos')).toLowerCase();
  for (const clave of ['valoraciones', 'decidimos cuáles mostramos', 'inicio de la aplicación', 'inicial de tu apellido', 'nunca mostramos tu correo']) {
    assert.ok(terminos.includes(clave), `Los términos no mencionan: ${clave}`);
  }
  const privacidad = JSON.stringify(legal.secciones('privacidad')).toLowerCase();
  for (const clave of ['tus valoraciones', 'públicas', 'inicial de tu apellido']) {
    assert.ok(privacidad.includes(clave), `El aviso de privacidad no menciona: ${clave}`);
  }
});

test('los títulos de los términos siguen numerados sin saltos', () => {
  legal.secciones('terminos').forEach((s, i) => assert.ok(s.titulo.startsWith(`${i + 1}. `), s.titulo));
  legal.secciones('privacidad').forEach((s, i) => assert.ok(s.titulo.startsWith(`${i + 1}. `), s.titulo));
});
