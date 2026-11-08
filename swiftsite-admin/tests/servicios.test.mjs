import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import ts from 'typescript'

const source = readFileSync(new URL('../src/utils/servicios.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } })
const S = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`)

test('Textos opcionales: vacío o solo espacios se guarda como null', () => {
  assert.equal(S.textoONull('  '), null)
  assert.equal(S.textoONull(undefined), null)
  assert.equal(S.textoONull(null), null)
  assert.equal(S.textoONull('  ¿Qué piso es? '), '¿Qué piso es?')
})

test('Cantidad máxima: vacío usa el valor por defecto; si no, entero entre 1 y 10000', () => {
  assert.deepEqual(S.validarCantidadMax(''), { valor: null, error: '' })
  assert.deepEqual(S.validarCantidadMax(null), { valor: null, error: '' })
  assert.deepEqual(S.validarCantidadMax(500), { valor: 500, error: '' }) // un <input type="number"> entrega número
  assert.deepEqual(S.validarCantidadMax('250'), { valor: 250, error: '' })
  for (const malo of [0, -1, 10001, 2.5, 'abc']) assert.notEqual(S.validarCantidadMax(malo).error, '', String(malo))
})

test('Un servicio aparece en la app solo si está visible y tiene tarifas visibles normales', () => {
  const tarifas = [
    { id_categoria: 1, tipo_item: 'Silla', activo: true },
    { id_categoria: 2, tipo_item: 'Baño completo', activo: false },
    { id_categoria: 3, tipo_item: 'Extra: sarro', activo: true },
  ]
  assert.deepEqual(S.estadoEnApp({ id_categoria: 1, activo: true }, tarifas), { visible: true, motivo: '' })
  assert.match(S.estadoEnApp({ id_categoria: 1, activo: false }, tarifas).motivo, /oculta/i)
  assert.match(S.estadoEnApp({ id_categoria: 2, activo: true }, tarifas).motivo, /no tiene tarifas visibles/i)
  assert.match(S.estadoEnApp({ id_categoria: 3, activo: true }, tarifas).motivo, /solo tiene extras/i)
  assert.equal(S.estadoEnApp({ id_categoria: 9, activo: true }, tarifas).visible, false)
})

test('Los íconos del panel coinciden con los que dibuja la app', () => {
  const ruta = new URL('../../swiftsite-ionic-angular/src/app/pages/quote/calculadora.ts', import.meta.url)
  if (!existsSync(ruta)) return // el panel puede vivir en un repositorio aparte
  const bloque = /ICONOS_SERVICIO = \[([\s\S]*?)\]/.exec(readFileSync(ruta, 'utf8'))?.[1] ?? ''
  const app = [...bloque.matchAll(/'([a-z]+)'/g)].map((m) => m[1]).sort()
  const panel = S.ICONOS_SERVICIO.map((i) => i.clave).sort()
  assert.deepEqual(panel, app)
  assert.equal(new Set(panel).size, panel.length)
})

// ---------- Autocompletar textos de la calculadora ----------
test('sugerirTextos reconoce el servicio por el nombre (con tildes, plurales y mayúsculas)', () => {
  const casos = [
    ['Limpieza de pisos', 'pisos', 'm²'],
    ['LAVADO DE CISTERNAS', 'cisterna', 'depósitos'],
    ['Alfombras', 'alfombras', 'm²'],
    ['Ventanas y vidrios', 'ventanas', 'ventanas'],
    ['Baños', 'banos', 'baños'],
    ['Colchones', 'colchones', 'colchones'],
    ['Jardín', 'jardin', 'm²'],
    ['Lavado de carro', 'auto', 'vehículos'],
  ]
  for (const [nombre, icono, unidad] of casos) {
    const r = S.sugerirTextos(nombre)
    assert.equal(r.reconocido, true, nombre)
    assert.equal(r.textos.icono, icono, nombre)
    assert.equal(r.textos.unidad, unidad, nombre)
  }
})

test('sugerirTextos usa textos neutros si no reconoce el nombre', () => {
  const r = S.sugerirTextos('Servicio especial XYZ')
  assert.equal(r.reconocido, false)
  assert.equal(r.textos.icono, 'servicio')
  assert.equal(r.textos.unidad, 'unidades')
})

test('toda sugerencia usa un ícono que existe y un máximo válido', () => {
  const claves = S.ICONOS_SERVICIO.map((i) => i.clave)
  for (const nombre of ['piso', 'alfombra', 'cisterna', 'ventana', 'cocina', 'auto', 'jardin', 'colchon', 'silla', 'mueble', 'bano', 'zzz']) {
    const { textos } = S.sugerirTextos(nombre)
    assert.ok(claves.includes(textos.icono), nombre)
    assert.equal(S.validarCantidadMax(textos.cantidad_max).error, '', nombre)
    for (const campo of ['pregunta_tipo', 'pregunta_variante', 'pregunta_cantidad', 'unidad']) assert.ok(textos[campo].length > 0 && textos[campo].length <= 80, `${nombre}.${campo}`)
  }
})

test('camposAutocompletables llena solo lo vacío y nunca pisa lo escrito', () => {
  const sug = S.sugerirTextos('Pisos').textos
  const vacio = { icono: '', pregunta_tipo: '', pregunta_variante: '', pregunta_cantidad: '', unidad: '', cantidad_max: '', nota: '' }
  const todo = S.camposAutocompletables(vacio, sug)
  assert.deepEqual(Object.keys(todo).sort(), ['cantidad_max', 'icono', 'pregunta_cantidad', 'pregunta_tipo', 'pregunta_variante', 'unidad'])
  assert.equal('nota' in todo, false)
  const parcial = S.camposAutocompletables({ ...vacio, unidad: 'baldosas', cantidad_max: 7 }, sug)
  assert.equal('unidad' in parcial, false)
  assert.equal('cantidad_max' in parcial, false)
  assert.equal(parcial.pregunta_tipo, sug.pregunta_tipo)
})

// ---------- Plantillas de servicio ----------
test('Hay una plantilla para cada servicio que se ofrece, cada una con su ícono y textos completos', () => {
  assert.deepEqual(S.PLANTILLAS.map((p) => p.nombre), ['Muebles', 'Colchones', 'Sillas', 'Baños', 'Pisos', 'Alfombras', 'Cisternas', 'Ventanas', 'Cocina', 'Autos', 'Jardines', 'Limpieza general'])
  const claves = S.ICONOS_SERVICIO.map((i) => i.clave)
  for (const p of S.PLANTILLAS) {
    assert.ok(claves.includes(p.clave), `${p.nombre}: ícono ${p.clave}`)
    assert.ok(p.descripcion.length > 10 && p.descripcion.length <= 300, p.nombre)
    assert.ok(p.nombre.length <= 80, p.nombre)
    for (const campo of ['pregunta_tipo', 'pregunta_variante', 'pregunta_cantidad', 'unidad']) assert.ok(p.textos[campo].length > 0 && p.textos[campo].length <= 80, `${p.nombre}.${campo}`)
    assert.ok(Number.isInteger(p.textos.cantidad_max) && p.textos.cantidad_max >= 1 && p.textos.cantidad_max <= 10000, p.nombre)
  }
})

test('Elegir una plantilla llena nombre, descripción, ícono y textos', () => {
  const c = S.camposDePlantilla(S.plantillaDe('pisos'))
  assert.equal(c.nombre, 'Pisos')
  assert.equal(c.icono, 'pisos')
  assert.equal(c.unidad, 'm²')
  assert.match(c.pregunta_cantidad, /metros cuadrados/)
  assert.equal(c.cantidad_max, 500)
  assert.equal(S.plantillaDe('inexistente'), undefined)
})

test('El nombre de cada plantilla se reconoce a sí mismo (así el autocompletado por nombre y las plantillas no se contradicen)', () => {
  for (const p of S.PLANTILLAS) {
    const { textos, reconocido } = S.sugerirTextos(p.nombre)
    assert.ok(reconocido, p.nombre)
    assert.equal(textos.icono, p.clave, p.nombre)
  }
})

test('Las plantillas de servicios que ya existen se marcan, aunque se llamen distinto', () => {
  const pisos = S.plantillaDe('pisos')
  const banos = S.plantillaDe('banos')
  assert.equal(S.plantillaYaExiste(pisos, ['Baños', 'Colchones']), false)
  assert.equal(S.plantillaYaExiste(banos, ['Baños']), true)
  assert.equal(S.plantillaYaExiste(banos, ['banos']), true)
  assert.equal(S.plantillaYaExiste(banos, ['Servicio de baños sociales']), true)
  assert.equal(S.plantillaYaExiste(S.plantillaDe('limpieza'), ['Limpieza general']), true)
})

test('El resumen cuenta qué va a preguntar la app', () => {
  const c = S.camposDePlantilla(S.plantillaDe('pisos'))
  assert.equal(S.resumenTextos(c), 'La app preguntará: «¿Qué tipo de piso es?» → «Material» → «¿Cuántos metros cuadrados?» (m², hasta 500).')
  assert.equal(S.resumenTextos({ pregunta_tipo: '', pregunta_variante: '', pregunta_cantidad: '', unidad: '', cantidad_max: '' }), 'La app usará textos generales.')
  assert.match(S.resumenTextos({ pregunta_tipo: '¿Qué es?', pregunta_variante: '', pregunta_cantidad: '', unidad: 'sillas', cantidad_max: '' }), /\(sillas\)\.$/)
})

// ---------- Etiquetas del precio ----------
test('Pisos y Alfombras se cobran por m², con su pista de precio', () => {
  const pisos = S.precioDeCategoria({ nombre: 'Pisos', icono: 'pisos' })
  assert.deepEqual([pisos.etiqueta, pisos.unidad, pisos.placeholder, pisos.sinRelleno], ['Precio por m²', 'USD / m²', '2.00', true])
  const alfombras = S.precioDeCategoria({ nombre: 'Alfombras', icono: 'alfombras' })
  assert.deepEqual([alfombras.etiqueta, alfombras.unidad, alfombras.placeholder, alfombras.sinRelleno], ['Precio por m²', 'USD / m²', '3.00', true])
})

test('Colchones y Muebles se cobran por pieza', () => {
  for (const [nombre, icono] of [['Colchones', 'colchones'], ['Muebles', 'muebles']]) {
    const e = S.precioDeCategoria({ nombre, icono })
    assert.deepEqual([e.etiqueta, e.unidad], ['Precio por pieza', 'USD / pieza'], nombre)
  }
})

test('Si la categoría no tiene ícono se reconoce por el nombre; sin regla, texto general', () => {
  assert.equal(S.precioDeCategoria({ nombre: 'Piso de cerámica', icono: null }).placeholder, '2.00')
  assert.equal(S.precioDeCategoria({ nombre: 'Tapetes' }).placeholder, '3.00')
  assert.equal(S.precioDeCategoria({ nombre: 'Baños', icono: 'banos' }), null)
  assert.equal(S.precioDeCategoria({ nombre: 'Algo raro' }), null)
  assert.equal(S.precioDeCategoria(undefined), null)
})

test('La plantilla de Alfombras pregunta por m², igual que su precio', () => {
  const c = S.camposDePlantilla(S.plantillaDe('alfombras'))
  assert.equal(c.unidad, 'm²')
  assert.match(c.pregunta_cantidad, /metros cuadrados/)
})
