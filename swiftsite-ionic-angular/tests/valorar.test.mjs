import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/app/pages/valorar/valorar.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } });
const V = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);

test('Los aspectos son los mismos que acepta la API', () => {
  assert.deepEqual([...V.ASPECTOS], ['Puntualidad', 'Limpieza', 'Buen trato', 'Precio justo']);
  const php = readFileSync(new URL('../../Api-Rest/app/Models/Valoracion.php', import.meta.url), 'utf8');
  for (const aspecto of V.ASPECTOS) assert.ok(php.includes(`'${aspecto}'`), aspecto);
});

test('Sin estrellas no se puede enviar; con 1 a 5 sí', () => {
  assert.equal(V.estadoFormulario(0, '').valido, false);
  assert.match(V.estadoFormulario(0, '').falta, /estrellas/);
  assert.equal(V.estadoFormulario(6, '').valido, false);
  assert.equal(V.estadoFormulario(2.5, '').valido, false);
  for (const n of [1, 2, 3, 4, 5]) assert.equal(V.estadoFormulario(n, '').valido, true);
});

test('El comentario es opcional y no pasa de 500 letras', () => {
  assert.equal(V.estadoFormulario(5, '').valido, true);
  assert.equal(V.estadoFormulario(5, 'a'.repeat(500)).valido, true);
  const largo = V.estadoFormulario(5, 'a'.repeat(501));
  assert.equal(largo.valido, false);
  assert.match(largo.falta, /500/);
  // Los espacios de los extremos no cuentan.
  assert.equal(V.estadoFormulario(5, `  ${'a'.repeat(500)}  `).valido, true);
});

test('Limpia espacios y saltos de línea repetidos', () => {
  assert.equal(V.limpiarComentario('  hola  \r\n\r\n\r\n\r\nmundo '), 'hola  \n\nmundo');
});

test('Arma lo que se envía: aspectos en orden fijo y comentario vacío como null', () => {
  const datos = V.armarValoracion(41, 4, new Set(['Precio justo', 'Puntualidad', 'Inventado']), '   ');
  assert.deepEqual(datos, { id_pedido: 41, estrellas: 4, aspectos: ['Puntualidad', 'Precio justo'], comentario: null });
  assert.equal(V.armarValoracion(1, 5, new Set(), ' Excelente ').comentario, 'Excelente');
  assert.deepEqual(V.armarValoracion(1, 5, new Set(), '').aspectos, []);
});

test('El cliente no ve en qué estado quedó su valoración (revisión, publicada u oculta)', () => {
  assert.equal(V.estadoParaCliente, undefined);
  for (const ruta of ['valorar/valorar.page.html', 'pedidos/pedidos.page.html']) {
    const html = readFileSync(new URL(`../src/app/pages/${ruta}`, import.meta.url), 'utf8');
    assert.doesNotMatch(html, /estadoParaCliente|estadoValoracion|\.estado|revisa cada opinión|antes de publicarla|Publicada|En revisión/i, ruta);
  }
});

test('Hay una etiqueta para cada cantidad de estrellas', () => {
  assert.equal(V.ETIQUETAS_ESTRELLAS.length, 6);
  assert.equal(V.ETIQUETAS_ESTRELLAS[5], 'Excelente');
});

test('La pregunta de los aspectos cambia según las estrellas: gustó con 3 o más, mejorar con 1 o 2', () => {
  for (const n of [3, 4, 5]) { assert.equal(V.gustoConEstrellas(n), true); assert.equal(V.textosAspectos(n).pregunta, '¿Qué te gustó?'); assert.equal(V.textosAspectos(n).resumen, 'Te gustó'); }
  for (const n of [1, 2]) { assert.equal(V.gustoConEstrellas(n), false); assert.equal(V.textosAspectos(n).pregunta, '¿En qué fallamos?'); assert.equal(V.textosAspectos(n).resumen, 'Fallamos en'); }
  assert.notEqual(V.textosAspectos(5).ejemplo, V.textosAspectos(1).ejemplo);
});

test('Al cruzar de "gustó" a "mejorar" se limpian los aspectos marcados, y la pregunta solo sale con estrellas', () => {
  const ts_ = readFileSync(new URL('../src/app/pages/valorar/valorar.page.ts', import.meta.url), 'utf8');
  assert.match(ts_, /gustoConEstrellas\(this\.estrellas\) !== gustoConEstrellas\(n\)\) this\.elegidos = new Set/);
  const html = readFileSync(new URL('../src/app/pages/valorar/valorar.page.html', import.meta.url), 'utf8');
  assert.match(html, /\*ngIf="estrellas">\s*<div class="lbl"[^>]*>\{\{ textos\.pregunta \}\}/);
});

test('Con 1 o 2 estrellas "Buen trato" y "Precio justo" se leen como "Trato" y "Precio"; con 3 o más quedan igual', () => {
  for (const n of [1, 2]) {
    assert.deepEqual(V.ASPECTOS.map((a) => V.etiquetaAspecto(a, n)), ['Puntualidad', 'Limpieza', 'Trato', 'Precio']);
  }
  for (const n of [3, 4, 5]) {
    assert.deepEqual(V.ASPECTOS.map((a) => V.etiquetaAspecto(a, n)), ['Puntualidad', 'Limpieza', 'Buen trato', 'Precio justo']);
  }
  // Lo que se envía a la API sigue siendo el nombre original.
  assert.deepEqual(V.armarValoracion(1, 1, new Set(['Buen trato', 'Precio justo']), '').aspectos, ['Buen trato', 'Precio justo']);
});
