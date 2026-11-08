import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const opciones = { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }
const enUrl = (js) => `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8')

const serviciosUrl = enUrl(ts.transpileModule(leer('../src/utils/servicios.ts'), opciones).outputText)
const sugerenciasJs = ts.transpileModule(leer('../src/utils/sugerenciasTarifa.ts'), opciones).outputText.replace("'./servicios'", `'${serviciosUrl}'`)
const T = await import(enUrl(sugerenciasJs))
const S = await import(serviciosUrl)

test('Pisos sugiere sus artículos, tráfico y textos de ejemplo propios', () => {
  const p = T.sugerenciasDe({ nombre: 'Pisos', icono: 'pisos' })
  assert.deepEqual(p.articulos, ['Piso de Cerámica', 'Piso de Porcelanato', 'Piso de Madera / Laminado', 'Piso de Cemento Pulido'])
  assert.deepEqual(p.materiales, ['Tránsito Residencial', 'Tránsito Alto', 'Interiores', 'Exteriores / Terrazas'])
  assert.equal(p.detalle, 'Ej. Tarifa válida para áreas despejadas.')
  assert.equal(p.incluye, 'Ej. Incluye lavado profundo con máquina rotativa, remoción de suciedad en juntas y zócalos.')
  assert.doesNotMatch(`${p.detalle} ${p.incluye} ${p.ejemploArticulo} ${p.ejemploMaterial}`, /colch|90 ×/i)
})

test('Colchones vuelve a las medidas en centímetros y no sugiere materiales; Muebles sugiere sus piezas', () => {
  const c = T.sugerenciasDe({ nombre: 'Colchones', icono: 'colchones' })
  assert.deepEqual(c.articulos, ['Colchón Individual', 'Colchón Matrimonial', 'Colchón Queen', 'Colchón King'])
  assert.deepEqual(c.materiales, [])
  assert.match(c.detalle, /90 × 190 cm/)
  const m = T.sugerenciasDe({ nombre: 'Muebles', icono: 'muebles' })
  assert.deepEqual(m.articulos, ['Sofá 2 plazas', 'Sofá 3 plazas', 'Butaca', 'Seccional'])
  assert.ok(m.materiales.includes('Tela') && m.materiales.includes('Cuero'))
})

test('Se reconoce por el nombre cuando la categoría no tiene ícono; sin regla no hay sugerencias', () => {
  assert.equal(T.sugerenciasDe({ nombre: 'Piso de cerámica', icono: null }).articulos[0], 'Piso de Cerámica')
  assert.equal(T.sugerenciasDe({ nombre: 'Algo raro' }), null)
  assert.equal(T.sugerenciasDe(undefined), null)
})

test('Hay sugerencias completas y dentro de los límites del formulario para todas las categorías con ícono', () => {
  for (const { clave } of S.ICONOS_SERVICIO) {
    if (clave === 'servicio') continue
    const s = T.sugerenciasDe({ nombre: clave, icono: clave })
    assert.ok(s, `falta ${clave}`)
    assert.ok(s.articulos.length >= 3, clave)
    for (const a of s.articulos) assert.ok(a.length > 0 && a.length <= 100, `${clave}: ${a}`) // límite del campo: 100
    for (const m of s.materiales) assert.ok(m.length > 0 && m.length <= 80, `${clave}: ${m}`) // límite: 80
    assert.ok(s.detalle.length <= 85 && s.incluye.length <= 205, clave)
    assert.equal(new Set(s.articulos.map(T.claveComparable)).size, s.articulos.length, `${clave}: repetidos`)
  }
})

test('La comparación ignora mayúsculas, tildes, «de» y puntos medios', () => {
  assert.equal(T.claveComparable('Sofá de 2 plazas'), T.claveComparable('sofa 2 plazas'))
  assert.equal(T.claveComparable('Silla · solo asiento'), T.claveComparable('Silla solo asiento'))
  assert.equal(T.existenteDe('Colchón Queen', ['Colchón queen', 'Colchón king']), 'Colchón queen')
  assert.equal(T.existenteDe('Sofá 2 plazas', ['Sofá de 2 plazas']), 'Sofá de 2 plazas')
  assert.equal(T.existenteDe('Seccional', ['Butaca']), undefined)
  assert.notEqual(T.claveComparable('Sofá 2 plazas'), T.claveComparable('Sofá 3 plazas'))
})
