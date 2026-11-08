import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/app/pages/pedidos/pedidos.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } });
const P = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);

const linea = (tipo, cantidad = 1, material = null) => ({ id_detalle: 1, id_tarifa: 1, tipo_item: tipo, material, cantidad, precio_unitario: '10.00', subtotal: '10.00' });
const hoy = new Date(2026, 10, 5); // 5 nov 2026

test('El número de pedido se muestra con ceros a la izquierda', () => {
  assert.equal(P.numeroPedido(7), '#0007');
  assert.equal(P.numeroPedido(42), '#0042');
  assert.equal(P.numeroPedido(12345), '#12345');
});

test('El progreso sigue el orden de los estados y solo "Finalizado" sale de activos', () => {
  assert.deepEqual(['Cotizado', 'Confirmado', 'En proceso', 'Finalizado'].map(P.progresoDe), [1, 2, 3, 4]);
  assert.equal(P.esActivo('Cotizado'), true);
  assert.equal(P.esActivo('En proceso'), true);
  assert.equal(P.esActivo('Finalizado'), false);
});

test('La fecha local se arma sin correrse de día', () => {
  assert.equal(P.fechaISO(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  assert.equal(P.fechaISO(new Date(2026, 10, 30, 0, 1)), '2026-11-30');
});

test('Las horas de la pantalla se guardan con a. m. / p. m.', () => {
  assert.equal(P.franjaDe('7:30'), '7:30 a. m.');
  assert.equal(P.franjaDe('12:30'), '12:30 p. m.');
  assert.equal(P.franjaDe('2:00'), '2:00 p. m.');
  assert.equal(P.franjaDe('raro'), 'raro');
});

test('La fecha legible usa Hoy, Mañana o día y mes', () => {
  assert.equal(P.fechaLegible('2026-11-05', '10:00 a. m.', hoy), 'Hoy · 10:00 a. m.');
  assert.equal(P.fechaLegible('2026-11-06', '8:00 a. m.', hoy), 'Mañana · 8:00 a. m.');
  assert.equal(P.fechaLegible('2026-11-14', '2:00 p. m.', hoy), 'Sáb 14 nov · 2:00 p. m.');
  assert.equal(P.fechaLegible('basura', '2:00 p. m.', hoy), '2:00 p. m.');
});

test('El título resume las líneas del pedido', () => {
  assert.equal(P.tituloPedido([]), 'Pedido');
  assert.equal(P.tituloPedido([linea('Baño completo', 1, 'Mediano')]), 'Baño completo (mediano)');
  assert.equal(P.tituloPedido([linea('Sofá 2 plazas', 2, 'Cuero'), linea('Butaca')]), 'Sofá 2 plazas (cuero) ×2 y Butaca');
  assert.equal(P.tituloPedido([linea('A'), linea('B'), linea('C'), linea('D'), linea('E')]), 'A, B y 3 más');
  assert.equal(P.tituloPedido([{ ...linea(null) }]), 'Servicio');
});

test('Un pedido de la API se convierte a lo que muestra la pantalla', () => {
  const vista = P.aVista({
    id_pedido: 42, estado: 'Confirmado', fecha_servicio: '2026-11-06', franja_horaria: '10:00 a. m.', fecha_creacion: '2026-11-05T12:00:00+00:00',
    direccion: 'Col. Escalón', subtotal: '91.00', recargo_zona: '3.00', total: '94.00',
    zona: { id_zona: 1, nombre: 'San Salvador Centro' }, lineas: [linea('Sofá 2 plazas', 2, 'Cuero')],
  }, hoy);
  assert.deepEqual(vista, {
    id: '#0042', estado: 'Confirmado', titulo: 'Sofá 2 plazas (cuero) ×2', fecha: 'Mañana · 10:00 a. m.',
    zona: 'San Salvador Centro', total: 94, progreso: 2,
  });
});
