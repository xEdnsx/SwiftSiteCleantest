import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = readFileSync(new URL('../src/utils/pedidos.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } })
const P = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`)

const linea = (tipo, cantidad = 1, material = null) => ({ id_detalle: 1, id_tarifa: 1, tipo_item: tipo, material, cantidad, precio_unitario: '10.00', subtotal: '10.00' })
const pedido = (extra = {}) => ({
  id_pedido: 42, estado: 'Cotizado', fecha_servicio: '2026-11-06', franja_horaria: '10:00 a. m.', fecha_creacion: '2026-11-05T12:00:00+00:00',
  direccion: 'Col. Escalón', subtotal: '91.00', recargo_zona: '3.00', total: '94.00', zona: { id_zona: 1, nombre: 'San Salvador Centro' },
  usuario: { id_usuario: 7, nombre: 'María Hernández', correo: 'maria@correo.com', telefono: '7000-1111' }, lineas: [linea('Sofá 2 plazas', 2, 'Cuero')], ...extra,
})
const hoy = new Date(2026, 10, 5)

test('El flujo de estados avanza y retrocede un paso', () => {
  assert.equal(P.siguienteEstado('Cotizado'), 'Confirmado')
  assert.equal(P.siguienteEstado('En proceso'), 'Finalizado')
  assert.equal(P.siguienteEstado('Finalizado'), null)
  assert.equal(P.anteriorEstado('Cotizado'), null)
  assert.equal(P.anteriorEstado('Finalizado'), 'En proceso')
})

test('Número, dinero y fecha se muestran como en los mockups', () => {
  assert.equal(P.numeroPedido(42), '#0042')
  assert.equal(P.usd('94'), '$94.00')
  assert.equal(P.usd('0.5'), '$0.50')
  assert.equal(P.fechaLegible('2026-11-05', '8:00 a. m.', hoy), 'Hoy · 8:00 a. m.')
  assert.equal(P.fechaLegible('2026-11-06', '8:00 a. m.', hoy), 'Mañana · 8:00 a. m.')
  assert.equal(P.fechaLegible('2026-11-14', '2:00 p. m.', hoy), 'Sáb 14 nov · 2:00 p. m.')
})

test('Las líneas se resumen para la tabla y se detallan en el panel', () => {
  assert.equal(P.textoLinea(linea('Sofá 2 plazas', 2, 'Cuero')), '2 × Sofá 2 plazas · Cuero')
  assert.equal(P.textoLinea(linea('Butaca')), '1 × Butaca')
  assert.equal(P.resumenPedido([]), '—')
  assert.equal(P.resumenPedido([linea('Sofá', 2), linea('Butaca')]), 'Sofá ×2, Butaca')
  assert.equal(P.resumenPedido([linea('A'), linea('B'), linea('C'), linea('D')]), 'A, B y 2 más')
})

test('El enlace de WhatsApp solo se genera con teléfonos salvadoreños válidos', () => {
  assert.equal(P.enlaceWhatsapp('7000-1111'), 'https://wa.me/50370001111')
  assert.equal(P.enlaceWhatsapp('+503 7000 1111'), 'https://wa.me/50370001111')
  assert.equal(P.enlaceWhatsapp('123'), null)
  assert.equal(P.enlaceWhatsapp(null), null)
  assert.equal(P.enlaceWhatsapp(''), null)
})

test('La búsqueda encuentra por número, nombre o correo sin importar tildes', () => {
  const p = pedido()
  for (const q of ['', '42', '#0042', '#42', 'maría', 'maria', 'HERNANDEZ', 'correo.com']) assert.equal(P.coincide(p, q), true, q)
  for (const q of ['43', '#0043', 'carlos']) assert.equal(P.coincide(p, q), false, q)
  assert.equal(P.coincide(pedido({ usuario: null }), 'maria'), false)
  assert.equal(P.coincide(pedido({ usuario: null }), '#0042'), true)
})

test('El Inicio ordena la agenda por hora y saluda según la hora del día', () => {
  assert.equal(P.minutosDeFranja('7:30 a. m.'), 450)
  assert.equal(P.minutosDeFranja('10:00 a. m.'), 600)
  assert.equal(P.minutosDeFranja('12:30 p. m.'), 750)
  assert.equal(P.minutosDeFranja('2:00 p. m.'), 840)
  assert.equal(P.minutosDeFranja('12:00 a. m.'), 0)
  assert.equal(P.minutosDeFranja('raro'), 1440)
  const orden = ['2:00 p. m.', '7:30 a. m.', '12:30 p. m.', '10:00 a. m.'].sort((a, b) => P.minutosDeFranja(a) - P.minutosDeFranja(b))
  assert.deepEqual(orden, ['7:30 a. m.', '10:00 a. m.', '12:30 p. m.', '2:00 p. m.'])
  assert.deepEqual([6, 11, 12, 18, 19, 23].map(P.saludoPorHora), ['Buen día', 'Buen día', 'Buenas tardes', 'Buenas tardes', 'Buenas noches', 'Buenas noches'])
  assert.equal(P.fechaLargaEs(new Date(2026, 10, 5)), 'Jueves 5 de noviembre')
  assert.equal(P.usdMiles('2340'), '$2,340.00')
  assert.equal(P.usdMiles(0), '$0.00')
  assert.deepEqual(['Cotizado', 'Confirmado', 'En proceso', 'Finalizado'].map(P.colorAgenda), ['sol', 'gota', 'gota', 'aqua'])
})
