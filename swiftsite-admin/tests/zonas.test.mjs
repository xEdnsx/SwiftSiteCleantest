import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = readFileSync(new URL('../src/utils/zonas.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } })
const Z = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`)

test('Hay 14 departamentos y 44 zonas, y cada zona pertenece a un departamento de la lista', () => {
  assert.equal(Z.ORDEN_DEPARTAMENTOS.length, 14)
  assert.equal(Object.keys(Z.DISTRITOS).length, 44)
  for (const nombre of Object.keys(Z.DISTRITOS)) {
    assert.ok(Z.separarNombre(nombre), nombre)
  }
})

test('Cada departamento ofrece solo las regiones que existen en él', () => {
  assert.deepEqual(Z.regionesDe('San Salvador'), ['Centro', 'Norte', 'Sur', 'Este', 'Oeste'])
  assert.deepEqual(Z.regionesDe('Santa Ana'), ['Centro', 'Norte', 'Este', 'Oeste'])
  assert.deepEqual(Z.regionesDe('Inventado'), [])
  assert.ok(Z.regionesDe('La Libertad').includes('Costa'))
  assert.ok(!Z.regionesDe('San Salvador').includes('Costa'))
})

test('El nombre se arma con departamento y región, y se puede volver a separar', () => {
  assert.equal(Z.nombreZona('San Salvador', 'Centro'), 'San Salvador Centro')
  assert.equal(Z.nombreZona('', 'Centro'), '')
  assert.equal(Z.nombreZona('San Salvador', ''), '')
  assert.deepEqual(Z.separarNombre('San Salvador Centro'), { departamento: 'San Salvador', region: 'Centro' })
  assert.deepEqual(Z.separarNombre('  la libertad   COSTA '), { departamento: 'La Libertad', region: 'Costa' })
  assert.deepEqual(Z.separarNombre('Ahuachapan Norte'), { departamento: 'Ahuachapán', region: 'Norte' })
})

test('Un nombre que la app no reconocería no se puede separar', () => {
  assert.equal(Z.separarNombre('Zona Rosa'), null)
  assert.equal(Z.separarNombre('San Salvador Costa'), null)
  assert.equal(Z.separarNombre(''), null)
})

test('Los distritos de una zona se muestran como referencia', () => {
  assert.ok(Z.distritosDe('San Salvador', 'Centro').includes('Mejicanos'))
  assert.deepEqual(Z.distritosDe('San Salvador', 'Costa'), [])
})

test('Detecta si ya existe una zona con ese nombre, sin importar tildes ni mayúsculas', () => {
  assert.equal(Z.yaExiste('San Salvador Centro', ['La Paz Sur', 'san salvador centro']), true)
  assert.equal(Z.yaExiste('Ahuachapán Norte', ['Ahuachapan norte']), true)
  assert.equal(Z.yaExiste('San Salvador Sur', ['San Salvador Norte']), false)
  assert.equal(Z.yaExiste('', ['']), false)
})

// ---------- Vista por departamentos ----------
const zona = (id, nombre, recargo = '0.00', activo = true) => ({ id_zona: id, nombre, recargo, activo })
const todas = () => Z.ZONAS_ESPERADAS.map((n, i) => zona(i + 1, n, '5.00'))

test('La app espera 44 zonas, 14 departamentos, y cada zona sabe sus distritos', () => {
  assert.equal(Z.ZONAS_ESPERADAS.length, 44)
  assert.equal(Z.ORDEN_DEPARTAMENTOS.length, 14)
  assert.ok(Z.ZONAS_ESPERADAS.every((n) => (Z.DISTRITOS[n] ?? []).length > 0), 'zona sin distritos')
})

test('Con las 44 zonas no falta nada y cada departamento recibe las suyas en orden', () => {
  const g = Z.agruparPorDepartamento(todas())
  assert.deepEqual(g.faltan, [])
  assert.deepEqual(g.sinReconocer, [])
  assert.deepEqual(g.departamentos.map((d) => d.departamento), Z.ORDEN_DEPARTAMENTOS)
  assert.equal(g.departamentos.reduce((n, d) => n + d.zonas.length, 0), 44)
  const sansalvador = g.departamentos[0]
  assert.deepEqual(sansalvador.zonas.map((z) => z.region), ['Centro', 'Norte', 'Sur', 'Este', 'Oeste'])
  assert.ok(sansalvador.zonas[0].distritos.includes('Mejicanos'))
  assert.equal(sansalvador.estado, 'todas')
})

test('Red de seguridad: avisa qué zonas faltan y qué nombres la app no reconoce', () => {
  const g = Z.agruparPorDepartamento([zona(1, 'san salvador centro'), zona(2, 'Zona Rara'), zona(3, 'Ahuachapán Norte')])
  assert.equal(g.faltan.length, 42)
  assert.ok(!g.faltan.includes('San Salvador Centro') && !g.faltan.includes('Ahuachapán Norte'))
  assert.ok(g.faltan.includes('Ahuachapán Sur'))
  assert.deepEqual(g.sinReconocer.map((z) => z.nombre), ['Zona Rara'])
  assert.equal(Z.agruparPorDepartamento([]).faltan.length, 44)
})

test('El estado del departamento cuenta zonas activas y rango de recargos', () => {
  const zs = todas().map((z) => (z.nombre === 'San Salvador Sur' ? { ...z, activo: false, recargo: '12.00' } : z))
  const sv = Z.agruparPorDepartamento(zs).departamentos[0]
  assert.equal(sv.estado, 'algunas')
  assert.equal(sv.activas, 4)
  assert.deepEqual([sv.recargoMin, sv.recargoMax], [5, 12])
  assert.equal(Z.textoActivas(sv), '4 de 5 zonas activas')
  assert.equal(Z.textoRecargo(sv.recargoMin, sv.recargoMax), '$5.00 a $12.00')
  const apagado = Z.agruparPorDepartamento(todas().map((z) => (z.nombre.startsWith('Morazán') ? { ...z, activo: false } : z))).departamentos[12]
  assert.equal(apagado.estado, 'ninguna')
  assert.equal(Z.textoActivas(apagado), 'Sin zonas activas')
  assert.equal(Z.textoRecargo(5, 5), '$5.00')
})

test('Al reactivar un departamento solo se enumeran las zonas que hoy están apagadas', () => {
  const zs = todas().map((z) => (['San Salvador Sur', 'San Salvador Este'].includes(z.nombre) ? { ...z, activo: false } : z))
  const sv = Z.agruparPorDepartamento(zs).departamentos[0]
  assert.deepEqual(Z.zonasQueSeEnciendenAlReactivar(sv).map((z) => z.zona.nombre), ['San Salvador Sur', 'San Salvador Este'])
  assert.equal(Z.zonasQueSeApaganAlDesactivar(sv).length, 3)
})

test('El recargo escrito se valida: número con hasta 2 decimales, no negativo', () => {
  assert.equal(Z.recargoValido('5'), 5)
  assert.equal(Z.recargoValido(' 7,5 '), 7.5)
  assert.equal(Z.recargoValido('0'), 0)
  assert.equal(Z.recargoValido(12.25), 12.25)
  for (const malo of ['', '  ', '-1', 'abc', '1.234', '1e3', null, undefined]) assert.equal(Z.recargoValido(malo), null, String(malo))
})

test('Las zonas viejas con otro nombre no cuentan en el total y solo avisan mientras sigan activas', () => {
  const viejas = [zona(101, 'Soyapango'), zona(102, 'Mejicanos', '0.00', false)]
  const g = Z.agruparPorDepartamento([...todas(), ...viejas])
  assert.deepEqual(Z.conteoDeZonas(g), { activas: 44, total: 44 })
  assert.deepEqual(Z.sinReconocerActivas(g).map((z) => z.nombre), ['Soyapango'])
  const limpio = Z.agruparPorDepartamento([...todas(), ...viejas.map((z) => ({ ...z, activo: false }))])
  assert.deepEqual(Z.sinReconocerActivas(limpio), [])
  assert.deepEqual(Z.conteoDeZonas(limpio), { activas: 44, total: 44 })
})
