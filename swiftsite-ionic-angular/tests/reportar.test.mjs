import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/app/pages/reportar/reportar.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } });
const R = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);

test('Los motivos son los mismos que acepta la API', () => {
  assert.deepEqual([...R.MOTIVOS], ['Limpieza incompleta', 'Daño en mi pertenencia', 'Llegaron tarde', 'Cobro incorrecto', 'Trato del personal', 'Otro']);
  const php = readFileSync(new URL('../../Api-Rest/app/Models/Reporte.php', import.meta.url), 'utf8');
  for (const motivo of R.MOTIVOS) assert.ok(php.includes(`'${motivo}'`), motivo);
});

test('El número de reporte lleva ceros a la izquierda', () => {
  assert.equal(R.numeroReporte(1), 'R-0001');
  assert.equal(R.numeroReporte(42), 'R-0042');
  assert.equal(R.numeroReporte(12345), 'R-12345');
});

test('El formulario pide primero el motivo y luego una descripción de al menos 10 letras', () => {
  assert.deepEqual(R.estadoFormulario(null, 'Quedó sucio el piso'), { valido: false, falta: 'Elige qué pasó.' });
  assert.equal(R.estadoFormulario('Otro', 'corto').valido, false);
  assert.match(R.estadoFormulario('Otro', 'corto').falta, /mínimo 10/);
  assert.deepEqual(R.estadoFormulario('Otro', 'Quedó sucio el piso'), { valido: true, falta: '' });
});

test('Los espacios sobrantes no cuentan para el mínimo ni para el máximo', () => {
  assert.equal(R.estadoFormulario('Otro', '   hola   ').valido, false);
  assert.equal(R.estadoFormulario('Otro', ' ' + 'a'.repeat(500) + ' ').valido, true);
  const excede = R.estadoFormulario('Otro', 'a'.repeat(501));
  assert.equal(excede.valido, false);
  assert.match(excede.falta, /Máximo 500/);
});

test('limpiarDescripcion recorta y compacta saltos de línea', () => {
  assert.equal(R.limpiarDescripcion('  Hola\r\n\r\n\r\n\r\nmundo  '), 'Hola\n\nmundo');
});

test('El contacto junta teléfono y correo, y tolera que falte uno', () => {
  assert.equal(R.contactoDe('7777-0000', 'ana@correo.com'), '7777-0000 y ana@correo.com');
  assert.equal(R.contactoDe(null, 'ana@correo.com'), 'ana@correo.com');
  assert.equal(R.contactoDe('  ', undefined), '');
});

test('Si el pedido es de un solo tipo de servicio, las preguntas hablan de esa cosa', () => {
  const silla = R.cosaDelPedido([{ tipo_item: 'Silla · asiento y respaldo' }, { tipo_item: 'Silla · asiento y respaldo' }]);
  assert.deepEqual(silla, { texto: 'tu silla', especifica: true });
  assert.equal(R.nombreCorto('Sofá 2 plazas'), 'sofá 2 plazas');
  assert.equal(R.nombreCorto(null), '');
  assert.equal(R.preguntaGuia('Limpieza incompleta', silla), '¿Qué parte de tu silla quedó sin limpiar?');
  assert.match(R.preguntaGuia('Daño en mi pertenencia', silla), /¿Le pasó algo a tu silla/);
  assert.equal(R.ejemploDe('Limpieza incompleta', silla), 'Ej. Quedó una mancha en tu silla.');
  assert.equal(R.ejemploDe('Daño en mi pertenencia', silla), 'Ej. Tu silla quedó con un rasguño.');
});

test('Si el pedido mezcla servicios, se habla de "tu pedido" sin inventar nada', () => {
  const mixto = R.cosaDelPedido([{ tipo_item: 'Silla · asiento' }, { tipo_item: 'Tapicería de vehículo' }]);
  assert.deepEqual(mixto, { texto: 'tu pedido', especifica: false });
  assert.deepEqual(R.cosaDelPedido([]), { texto: 'tu pedido', especifica: false });
  assert.equal(R.preguntaGuia('Limpieza incompleta', mixto), '¿Qué quedó sin limpiar o mal limpiado?');
  assert.equal(R.preguntaGuia('Otro', mixto), 'Cuéntanos qué pasó con tu pedido.');
  assert.equal(R.preguntaGuia(null, mixto), '');
  assert.equal(R.ejemploDe(null, mixto), 'Escribe aquí los detalles.');
});

test('Todos los motivos tienen pregunta guía y texto de ejemplo', () => {
  const cosa = { texto: 'tu pedido', especifica: false };
  for (const m of R.MOTIVOS) {
    assert.ok(R.preguntaGuia(m, cosa).length > 10, m);
    assert.ok(R.ejemploDe(m, cosa).length > 10, m);
  }
});

test('Un reporte abierto del mismo pedido impide enviar otro; uno resuelto, no', () => {
  const r = (id_reporte, id_pedido, estado) => ({ id_reporte, id_pedido, estado, motivo: 'Otro', descripcion: 'x', respuesta: null, fecha_creacion: '2026-11-08T18:00:00Z' });
  assert.equal(R.reporteAbierto([r(1, 4, 'Recibido')], 4)?.id_reporte, 1);
  assert.equal(R.reporteAbierto([r(1, 4, 'En revisión')], 4)?.id_reporte, 1);
  assert.equal(R.reporteAbierto([r(1, 4, 'Resuelto')], 4), null);
  assert.equal(R.reporteAbierto([r(1, 5, 'Recibido')], 4), null);
  assert.equal(R.reporteAbierto([], 4), null);
  assert.equal(R.reporteAbierto([r(1, 4, 'Resuelto'), r(2, 4, 'Recibido')], 4)?.id_reporte, 2);
});

test('La fecha corta sale como "8 nov" y tolera textos raros', () => {
  assert.equal(R.fechaCorta('2026-11-08T18:00:00Z'), '8 nov');
  assert.equal(R.fechaCorta('no es fecha'), '');
});

test('Se encuentra el último reporte resuelto del pedido para mostrar la respuesta', () => {
  const r = (id, pedido, estado) => ({ id_reporte: id, id_pedido: pedido, estado, motivo: 'Otro', descripcion: 'x', respuesta: estado === 'Resuelto' ? 'Listo' : null, fecha_creacion: '2026-11-08T10:00:00Z' });
  assert.equal(R.reporteResuelto([r(1, 4, 'Resuelto'), r(3, 4, 'Resuelto'), r(2, 4, 'Recibido')], 4)?.id_reporte, 3);
  assert.equal(R.reporteResuelto([r(1, 4, 'Recibido')], 4), null);
  assert.equal(R.reporteResuelto([r(1, 5, 'Resuelto')], 4), null);
  assert.equal(R.reporteResuelto([], 4), null);
});

test('El enlace de Mis pedidos cambia si el pedido ya tiene un reporte', () => {
  assert.equal(R.textoEnlaceReporte(undefined), 'Reportar problema');
  assert.equal(R.textoEnlaceReporte([]), 'Reportar problema');
  assert.equal(R.textoEnlaceReporte([{ id_reporte: 1, estado: 'Resuelto' }]), 'Mi reporte: Resuelto');
  assert.equal(R.textoEnlaceReporte([{ id_reporte: 1, estado: 'Resuelto' }, { id_reporte: 2, estado: 'En revisión' }]), 'Mi reporte: En revisión');
});
