import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/app/core/tema.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } });
const tema = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);

test('resolverTema: respeta lo guardado y, si no hay nada, sigue al sistema', () => {
  assert.equal(tema.resolverTema('oscuro', false), 'oscuro');
  assert.equal(tema.resolverTema('claro', true), 'claro');
  assert.equal(tema.resolverTema(null, true), 'oscuro');
  assert.equal(tema.resolverTema(undefined, false), 'claro');
  assert.equal(tema.resolverTema('azul', true), 'oscuro'); // valor inválido guardado: se ignora
});

test('colorBarra: un color por tema', () => {
  assert.equal(tema.colorBarra('oscuro'), '#071428');
  assert.equal(tema.colorBarra('claro'), '#F2F8FC');
});

test('los tokens de color de la hoja de estilos existen en claro y en oscuro', () => {
  const css = readFileSync(new URL('../src/global.scss', import.meta.url), 'utf8');
  const bloque = (inicio) => { const i = css.indexOf(inicio); return css.slice(i, css.indexOf('}', i)); };
  const claro = bloque('--c-ink: #0B1F3A'), oscuro = bloque(':root.oscuro {');
  const vars = (b) => [...b.matchAll(/--c-[a-z-]+/g)].map(m => m[0]);
  const delOscuro = new Set(vars(oscuro));
  for (const v of new Set(vars(claro))) assert.ok(delOscuro.has(v), `Falta ${v} en el tema oscuro`);
  // y todo token que usan los componentes (styles/_ssc.scss) está definido
  const ssc = readFileSync(new URL('../src/styles/_ssc.scss', import.meta.url), 'utf8');
  for (const m of ssc.matchAll(/var\((--c-[a-z-]+)\)/g)) assert.ok(vars(claro).includes(m[1]), `Token sin definir: ${m[1]}`);
});
