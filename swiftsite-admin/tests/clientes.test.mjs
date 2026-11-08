import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = readFileSync(new URL('../src/utils/clientes.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } })
const C = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`)

const cliente = (extra = {}) => ({
  id_usuario: 1, nombre: 'María Hernández', telefono: '7000-1111', correo: 'maria@correo.com', tiene_acceso: false,
  pedidos_count: 0, servicios_finalizados: 0, total_gastado: '0.00', ultimo_pedido: null, ...extra,
})

test('Validación: acepta un cliente correcto y explica el primer problema', () => {
  assert.equal(C.validarCliente({ nombre: 'Ana Pérez', telefono: '+503 7000-1111', correo: 'ana@correo.com' }), '')
  assert.equal(C.validarCliente({ nombre: 'Ana Pérez', telefono: '', correo: 'ana@correo.com' }), '')
  assert.match(C.validarCliente({ nombre: ' ', telefono: '', correo: 'ana@correo.com' }), /nombre/i)
  assert.match(C.validarCliente({ nombre: 'Ana', telefono: '7000-1111', correo: 'ana@' }), /correo/i)
  assert.match(C.validarCliente({ nombre: 'Ana', telefono: 'abc', correo: 'ana@correo.com' }), /teléfono/i)
  assert.match(C.validarCliente({ nombre: 'Ana', telefono: '123', correo: 'ana@correo.com' }), /teléfono/i)
})

test('El correo es opcional si hay teléfono, y al revés; sin ninguno no se puede crear', () => {
  assert.equal(C.validarCliente({ nombre: 'Rosa Menjívar', telefono: '7000-1111', correo: '' }), '')
  assert.equal(C.validarCliente({ nombre: 'Rosa Menjívar', telefono: '', correo: 'rosa@correo.com' }), '')
  assert.match(C.validarCliente({ nombre: 'Rosa Menjívar', telefono: '  ', correo: '  ' }), /al menos un teléfono o un correo/)
})

test('El aviso explica qué pasa con su cuenta según los datos que se tengan', () => {
  assert.equal(C.avisoDeAcceso({ nombre: 'Ana', telefono: '', correo: '' }), '')
  assert.match(C.avisoDeAcceso({ nombre: 'Ana', telefono: '7000-1111', correo: '' }), /Sin correo no podrá entrar/)
  assert.match(C.avisoDeAcceso({ nombre: 'Ana', telefono: '', correo: 'ana@correo.com' }), /mismo correo/)
  assert.match(C.avisoDeAcceso({ nombre: 'Ana', telefono: '7000-1111', correo: 'ana@correo.com' }, true), /ya tiene cuenta/)
})

test('Cuerpo de la API: recorta, pasa el correo a minúsculas y manda null si no hay teléfono', () => {
  assert.deepEqual(C.cuerpoCliente({ nombre: '  Ana Pérez ', telefono: '  ', correo: ' Ana@Correo.COM ' }), {
    nombre: 'Ana Pérez', telefono: null, correo: 'ana@correo.com',
  })
})

test('Cuerpo de la API: sin correo se manda null para poder quitarlo', () => {
  assert.deepEqual(C.cuerpoCliente({ nombre: 'Rosa', telefono: '7000-1111', correo: '  ' }), { nombre: 'Rosa', telefono: '7000-1111', correo: null })
})

test('Iniciales', () => {
  assert.equal(C.iniciales('María Hernández'), 'MH')
  assert.equal(C.iniciales('  luis  '), 'L')
  assert.equal(C.iniciales('Ana María de la Cruz'), 'AC')
  assert.equal(C.iniciales(''), '?')
})

test('haceTiempo: hoy, ayer, días y fecha larga', () => {
  const ahora = new Date(2026, 10, 5, 15, 0)
  assert.equal(C.haceTiempo(null, ahora), '—')
  assert.equal(C.haceTiempo('basura', ahora), '—')
  assert.equal(C.haceTiempo(new Date(2026, 10, 5, 8, 0).toISOString(), ahora), 'Hoy')
  assert.equal(C.haceTiempo(new Date(2026, 10, 4, 23, 0).toISOString(), ahora), 'Ayer')
  assert.equal(C.haceTiempo(new Date(2026, 10, 2, 10, 0).toISOString(), ahora), 'Hace 3 días')
  assert.equal(C.haceTiempo(new Date(2026, 8, 12, 10, 0).toISOString(), ahora), '12 sep 2026')
})

test('Búsqueda: nombre sin tildes, correo y teléfono sin guiones', () => {
  const c = cliente()
  assert.ok(C.coincideCliente(c, ''))
  assert.ok(C.coincideCliente(c, 'maria'))
  assert.ok(C.coincideCliente(c, 'HERNANDEZ'))
  assert.ok(C.coincideCliente(c, '@correo'))
  assert.ok(C.coincideCliente(c, '70001111'))
  assert.ok(C.coincideCliente(c, '7000-1'))
  assert.ok(!C.coincideCliente(c, 'luis'))
  assert.ok(!C.coincideCliente(cliente({ telefono: null }), '7000'))
  // Un cliente sin correo no rompe la búsqueda.
  assert.ok(C.coincideCliente(cliente({ correo: null }), 'maria'))
  assert.ok(!C.coincideCliente(cliente({ correo: null }), '@correo'))
})

test('Resumen de actividad concuerda en singular y plural', () => {
  assert.equal(C.resumenActividad({ pedidos_count: 0, servicios_finalizados: 0 }), 'Aún no ha hecho pedidos.')
  assert.equal(C.resumenActividad({ pedidos_count: 1, servicios_finalizados: 1 }), '1 pedido · 1 servicio terminado')
  assert.equal(C.resumenActividad({ pedidos_count: 3, servicios_finalizados: 2 }), '3 pedidos · 2 servicios terminados')
})
