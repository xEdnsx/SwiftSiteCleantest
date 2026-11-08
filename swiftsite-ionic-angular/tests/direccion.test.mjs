import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/app/pages/cotizar/direccion.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } });
const D = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);

test('Direcciones reales y completas se aceptan', () => {
  for (const d of [
    'Col. Escalón, 87 Av. Norte, pasaje 3, casa #12, frente a Súper Selectos',
    'Residencial Altavista, polígono 4, casa 12, Ilopango',
    'Colonia Miramonte, calle Los Pinos #15, cerca de la iglesia',
    '  Col.   Jardines   de   la   Hacienda, pasaje 2, casa 8  ',
  ]) assert.equal(D.estadoDireccion(d).valida, true, d);
});

test('Textos demasiado cortos o vagos se rechazan', () => {
  for (const d of ['', '   ', 'casa', 'mi casa', 'Soyapango', 'Col. Escalón', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'Col. Jardines, casa 5']) {
    assert.equal(D.estadoDireccion(d).valida, false, JSON.stringify(d));
  }
});

test('Los espacios de más no cuentan como texto', () => {
  assert.equal(D.normalizarDireccion('  a   b \n c  '), 'a b c');
  assert.equal(D.estadoDireccion('a'.repeat(10) + ' '.repeat(40) + 'b').valida, false);
  assert.equal(D.contarPalabras('  uno   dos  '), 2);
  assert.equal(D.contarPalabras(''), 0);
});

test('Cada estado tiene un mensaje que explica qué escribir', () => {
  assert.match(D.estadoDireccion('').mensaje, /número de casa/);
  assert.match(D.estadoDireccion('casa').mensaje, /falta/i);
  assert.match(D.estadoDireccion('Col. Escalón, 87 Av. Norte, casa 12').mensaje, /Perfecto/);
});
