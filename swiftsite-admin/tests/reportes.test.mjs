import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const cargar = async (ruta) => {
  const source = readFileSync(new URL(ruta, import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } })
  return import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`)
}
const R = await cargar('../src/utils/reportes.ts')
const V = await cargar('../src/utils/valoraciones.ts')

const reporte = (id_reporte, estado, extra = {}) => ({
  id_reporte, id_pedido: 4, motivo: 'Limpieza incompleta', descripcion: 'x', estado, respuesta: null,
  fecha_creacion: '2026-11-08T18:00:00Z', fecha_actualizacion: null,
  usuario: { id_usuario: 2, nombre: 'Mónica Rivas', correo: 'monica@correo.com', telefono: '7064-2714' }, pedido: null, ...extra,
})

test('El número de reporte lleva ceros y los estados abiertos se distinguen del resuelto', () => {
  assert.equal(R.numeroReporte(7), 'R-0007')
  assert.equal(R.estaAbierto('Recibido'), true)
  assert.equal(R.estaAbierto('En revisión'), true)
  assert.equal(R.estaAbierto('Resuelto'), false)
})

test('La búsqueda entiende R-0001, #0004, nombre, correo y motivo, sin tildes ni mayúsculas', () => {
  const r = reporte(1, 'Recibido')
  assert.ok(R.coincide(r, ''))
  assert.ok(R.coincide(r, 'R-0001'))
  assert.ok(R.coincide(r, 'r1'))
  assert.ok(!R.coincide(r, 'R-0002'))
  assert.ok(R.coincide(r, '#0004'))
  assert.ok(!R.coincide(r, '#0005'))
  assert.ok(R.coincide(r, 'monica'))
  assert.ok(R.coincide(r, 'MÓNICA RIVAS'))
  assert.ok(R.coincide(r, 'correo.com'))
  assert.ok(R.coincide(r, 'limpieza'))
  assert.ok(!R.coincide(r, 'carlos'))
})

test('El conteo por estado suma el total', () => {
  const c = R.conteoPorEstado([reporte(1, 'Recibido'), reporte(2, 'Recibido'), reporte(3, 'Resuelto')])
  assert.deepEqual(c, { Todos: 3, Recibido: 2, 'En revisión': 0, Resuelto: 1 })
})

test('Para resolver hace falta una respuesta, y la respuesta no pasa de 500 letras', () => {
  assert.match(R.validarCambio('Resuelto', '   '), /Escribe una respuesta/)
  assert.equal(R.validarCambio('Resuelto', 'Ya lo arreglamos.'), '')
  assert.equal(R.validarCambio('En revisión', ''), '')
  assert.match(R.validarCambio('En revisión', 'a'.repeat(501)), /500/)
})

test('Solo se puede guardar si algo cambió', () => {
  const r = reporte(1, 'Recibido', { respuesta: 'Hola' })
  assert.equal(R.hayCambios(r, 'Recibido', 'Hola'), false)
  assert.equal(R.hayCambios(r, 'Recibido', '  Hola  '), false)
  assert.equal(R.hayCambios(r, 'En revisión', 'Hola'), true)
  assert.equal(R.hayCambios(r, 'Recibido', 'Hola, ya lo vemos'), true)
  assert.equal(R.hayCambios(reporte(2, 'Recibido'), 'Recibido', ''), false)
})

test('Cada motivo tiene una sugerencia de respuesta y los desconocidos también', () => {
  for (const m of ['Limpieza incompleta', 'Daño en mi pertenencia', 'Llegaron tarde', 'Cobro incorrecto', 'Trato del personal', 'Otro']) {
    assert.ok(R.sugerenciaDe(m).length > 20, m)
    assert.ok(R.sugerenciaDe(m).length <= R.MAX_RESPUESTA, m)
  }
})

test('El promedio de valoraciones sale con un decimal y "—" si no hay ninguna', () => {
  assert.equal(V.promedio([]), '—')
  assert.equal(V.promedio([{ estrellas: 5 }, { estrellas: 4 }]), '4.5')
  assert.equal(V.promedio([{ estrellas: 5 }, { estrellas: 5 }, { estrellas: 4 }]), '4.7')
})

test('La moderación ofrece solo los pasos que tienen sentido', () => {
  assert.deepEqual(V.accionesDe('Pendiente'), ['Publicada', 'Oculta'])
  assert.deepEqual(V.accionesDe('Publicada'), ['Oculta'])
  assert.deepEqual(V.accionesDe('Oculta'), ['Publicada'])
  assert.equal(V.verboDe('Publicada'), 'Mostrar en la app')
  assert.equal(V.verboDe('Oculta'), 'Ocultar de la app')
  assert.deepEqual(V.etiquetaEstado, { Pendiente: 'Por revisar', Publicada: 'En la app', Oculta: 'Oculta' })
})

test('La app muestra como máximo 5 opiniones: se avisa cuándo ya no hay lugar', () => {
  const v = (estado) => ({ estado })
  assert.equal(V.MAXIMO_EN_APP, 5)
  assert.equal(V.hayLugarEnLaApp([]), true)
  assert.equal(V.hayLugarEnLaApp([...Array(4).fill(v('Publicada')), v('Oculta'), v('Pendiente')]), true)
  assert.equal(V.hayLugarEnLaApp(Array(5).fill(v('Publicada'))), false)
})

test('El nombre que ve el público se abrevia como en la API', () => {
  assert.equal(V.nombreAbreviado('Ana Martínez'), 'Ana M.')
  assert.equal(V.nombreAbreviado('  ana   maría Martínez López '), 'Ana M.')
  assert.equal(V.nombreAbreviado('Luis'), 'Luis')
  assert.equal(V.nombreAbreviado(null), 'Cliente')
  assert.equal(V.nombreAbreviado('   '), 'Cliente')
  assert.equal(V.nombreAbreviado('Álvaro ñandú'), 'Álvaro Ñ.')
})

test('Los aspectos son "lo que gustó" con 3 o más estrellas y "a mejorar" con 1 o 2', () => {
  assert.equal(V.gustoConEstrellas(3), true)
  assert.equal(V.gustoConEstrellas(2), false)
  assert.equal(V.etiquetaAspectos(5), 'Le gustó')
  assert.equal(V.etiquetaAspectos(1), 'Falló')
  // Con 1 o 2 estrellas "Buen trato" y "Precio justo" se leen como problema: "Trato" y "Precio".
  assert.equal(V.etiquetaAspecto('Buen trato', 1), 'Trato')
  assert.equal(V.etiquetaAspecto('Precio justo', 2), 'Precio')
  assert.equal(V.etiquetaAspecto('Limpieza', 1), 'Limpieza')
  assert.equal(V.etiquetaAspecto('Buen trato', 3), 'Buen trato')
  assert.equal(V.etiquetaAspecto('Precio justo', 5), 'Precio justo')
})

test('El conteo de valoraciones por estado', () => {
  const v = (id, estado) => ({ id_valoracion: id, estado, estrellas: 5 })
  assert.deepEqual(V.conteoPorEstado([v(1, 'Pendiente'), v(2, 'Publicada'), v(3, 'Publicada')]), { Todas: 3, Pendiente: 1, Publicada: 2, Oculta: 0 })
})

test('La fecha corta sale en hora de El Salvador y tolera valores vacíos o inválidos', () => {
  assert.equal(R.fechaCorta(null), '')
  assert.equal(R.fechaCorta('no es fecha'), '')
  const t = R.fechaCorta('2026-11-08T18:30:00Z')
  assert.match(t, /8/)
  assert.match(t, /nov/i)
})
