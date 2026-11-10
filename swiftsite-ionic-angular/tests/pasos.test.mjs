import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8');
const compiled = ts.transpileModule(leer('../src/app/pages/quote/pasos.ts'), { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } });
const P = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);

test('El pedido tiene cuatro pasos, en orden y sin repetirse', () => {
  assert.deepEqual([...P.PASOS_PEDIDO], ['Elige', 'Zona y total', 'Agenda', 'Resumen']);
  assert.equal(new Set(P.PASOS_PEDIDO).size, P.PASOS_PEDIDO.length);
});

test('«Tu pedido» continúa la numeración de «Cotizar»: Agenda es el paso 3 y Resumen el 4', () => {
  assert.equal(P.PASOS_EN_COTIZAR, 2);
  assert.equal(P.numeroDePaso(1), 3);
  assert.equal(P.numeroDePaso(2), 4);
  assert.equal(P.PASOS_PEDIDO[P.numeroDePaso(1) - 1], 'Agenda');
  assert.equal(P.PASOS_PEDIDO[P.numeroDePaso(2) - 1], 'Resumen');
});

test('Las dos pantallas usan la misma lista de pasos (no cada una la suya)', () => {
  assert.match(leer('../src/app/pages/quote/quote.page.ts'), /readonly pasos = PASOS_PEDIDO/);
  assert.match(leer('../src/app/pages/cotizar/cotizar.page.ts'), /readonly pasosPedido = PASOS_PEDIDO/);
  assert.doesNotMatch(leer('../src/app/pages/cotizar/cotizar.page.html'), /de \{\{ totalPasos \}\}/);
});
