import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/app/pages/home/opiniones.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } });
const O = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);

const op = (id, estrellas = 5, extra = {}) => ({ id_valoracion: id, estrellas, aspectos: ['Limpieza'], comentario: 'Quedó como nuevo.', nombre: 'Ana M.', fecha: '2026-11-08T18:30:00Z', ...extra });

test('El Inicio muestra como máximo 5 opiniones, igual que la API', () => {
  assert.equal(O.MAXIMO_OPINIONES, 5);
  const api = readFileSync(new URL('../../Api-Rest/app/Models/Valoracion.php', import.meta.url), 'utf8');
  assert.match(api, /MAXIMO_EN_APP\s*=\s*5/);
  assert.equal(O.opinionesParaMostrar(Array.from({ length: 8 }, (_, i) => op(i + 1))).length, 5);
});

test('Sin opiniones (o con la respuesta vacía) no hay nada que mostrar', () => {
  assert.deepEqual(O.opinionesParaMostrar([]), []);
  assert.deepEqual(O.opinionesParaMostrar(null), []);
  assert.deepEqual(O.opinionesParaMostrar(undefined), []);
});

test('Se descartan las que no se pueden dibujar y se limpian los textos', () => {
  const r = O.opinionesParaMostrar([op(1, 0), op(2, 6), op(3, 2.5), op(4, 4, { comentario: '   ' }), op(5, 3, { nombre: '  ' }), op(6, 5, { comentario: '  Muy bien  ' })]);
  assert.deepEqual(r.map((o) => o.id_valoracion), [4, 5, 6]);
  assert.equal(r[0].comentario, null);
  assert.equal(r[1].nombre, 'Cliente');
  assert.equal(r[2].comentario, 'Muy bien');
});

test('La fecha sale como mes y año en español, y vacía si no sirve', () => {
  assert.match(O.mesYAnio('2026-11-08T18:30:00Z'), /nov/i);
  assert.match(O.mesYAnio('2026-11-08T18:30:00Z'), /2026/);
  assert.equal(O.mesYAnio(null), '');
  assert.equal(O.mesYAnio('no es fecha'), '');
});

test('La pantalla de valorar no explica la publicación: eso va en los Términos y el Aviso de privacidad', () => {
  const html = readFileSync(new URL('../src/app/pages/valorar/valorar.page.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /inicial de tu apellido|nunca mostramos|en el Inicio/i);
  const legal = readFileSync(new URL('../src/app/pages/legal/legal.ts', import.meta.url), 'utf8');
  assert.match(legal, /Tus valoraciones y opiniones/);
  assert.match(legal, /inicial de tu apellido/);
});

test('En el Inicio, los aspectos de 1 o 2 estrellas se muestran como "A mejorar", no como elogio', () => {
  assert.equal(O.gustoConEstrellas(3), true);
  assert.equal(O.gustoConEstrellas(2), false);
  const html = readFileSync(new URL('../src/app/pages/home/home.page.html', import.meta.url), 'utf8');
  assert.match(html, /A mejorar: .*etiquetaAspecto\(a, o\.estrellas\)/);
  assert.equal(O.etiquetaAspecto('Buen trato', 1), 'Trato');
  assert.equal(O.etiquetaAspecto('Precio justo', 2), 'Precio');
  assert.equal(O.etiquetaAspecto('Precio justo', 4), 'Precio justo');
});
