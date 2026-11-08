import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

async function cargar(ruta) {
  const source = readFileSync(new URL(ruta, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } });
  return import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);
}

const perfil = await cargar('../src/app/pages/account/perfil.ts');

test('iniciales: una o dos letras en mayúscula', () => {
  assert.equal(perfil.iniciales('Demian Bucaro'), 'DB');
  assert.equal(perfil.iniciales('  ana  '), 'A');
  assert.equal(perfil.iniciales('maría de los Ángeles pérez'), 'MP');
  assert.equal(perfil.iniciales(''), '?');
  assert.equal(perfil.iniciales(null), '?');
});

test('estadisticas: contratados no cuenta las cotizaciones', () => {
  const r = perfil.estadisticas([
    { estado: 'Cotizado' }, { estado: 'Confirmado' }, { estado: 'En proceso' },
    { estado: 'Finalizado' }, { estado: 'Finalizado' },
  ]);
  assert.deepEqual(r, { contratados: 4, finalizados: 2, enCurso: 2 });
  assert.deepEqual(perfil.estadisticas([]), { contratados: 0, finalizados: 0, enCurso: 0 });
  assert.deepEqual(perfil.estadisticas([{ estado: 'Cotizado' }]), { contratados: 0, finalizados: 0, enCurso: 0 });
});

test('direccionesUsadas: sin repetidas, la más reciente primero, ignora las anonimizadas', () => {
  const r = perfil.direccionesUsadas([
    { direccion: 'Col. Escalón, casa 5', fecha_creacion: '2026-10-01T10:00:00Z' },
    { direccion: '  col.  escalón, CASA 5 ', fecha_creacion: '2026-10-20T10:00:00Z' },
    { direccion: 'Santa Tecla, pasaje 2', fecha_creacion: '2026-10-10T10:00:00Z' },
    { direccion: 'Dirección eliminada por el titular', fecha_creacion: '2026-10-25T10:00:00Z' },
    { direccion: '   ', fecha_creacion: '2026-10-26T10:00:00Z' },
  ]);
  assert.deepEqual(r, ['col. escalón, CASA 5', 'Santa Tecla, pasaje 2']);
  assert.deepEqual(perfil.direccionesUsadas([]), []);
});

test('validarDatos: nombre obligatorio y teléfono opcional con formato', () => {
  assert.deepEqual(perfil.validarDatos('Ana', ''), {});
  assert.deepEqual(perfil.validarDatos('Ana', '7000-0000'), {});
  assert.deepEqual(perfil.validarDatos('Ana', '+503 7000 0000'), {});
  assert.ok(perfil.validarDatos('A', '').nombre);
  assert.ok(perfil.validarDatos('   ', '').nombre);
  assert.ok(perfil.validarDatos('Ana', 'abc').telefono);
  assert.ok(perfil.validarDatos('Ana', '123').telefono);
  assert.ok(perfil.validarDatos('x'.repeat(121), '').nombre);
});

test('evaluarClave: mismos requisitos que la API (8+, mayúscula, número)', () => {
  assert.equal(perfil.evaluarClave('').nivel, 0);
  assert.equal(perfil.evaluarClave('abc').valida, false);
  assert.equal(perfil.evaluarClave('abcdefgh').valida, false);
  assert.equal(perfil.evaluarClave('Abcdefgh').valida, false);
  assert.equal(perfil.evaluarClave('abcdefg1').valida, false);
  assert.equal(perfil.evaluarClave('Abcdefg1').valida, true);
  assert.equal(perfil.evaluarClave('Abcdefg1').nivel, 2);
  assert.equal(perfil.evaluarClave('Abcdefg1xyz!').nivel, 3);
  assert.equal(perfil.evaluarClave('abc').nivel, 1);
  assert.equal(perfil.evaluarClave('A1' + 'x'.repeat(71)).valida, false);
});

test('validarCambioClave: reúne todos los errores', () => {
  assert.deepEqual(perfil.validarCambioClave('Vieja123', 'Nueva1234', 'Nueva1234'), {});
  assert.ok(perfil.validarCambioClave('', 'Nueva1234', 'Nueva1234').actual);
  assert.ok(perfil.validarCambioClave('Vieja123', 'corta', 'corta').nueva);
  assert.ok(perfil.validarCambioClave('Vieja123', 'Vieja123', 'Vieja123').nueva);
  assert.ok(perfil.validarCambioClave('Vieja123', 'Nueva1234', 'Otra1234').confirmacion);
  assert.equal(perfil.hayErrores({}), false);
  assert.equal(perfil.hayErrores({ nueva: 'x' }), true);
});
