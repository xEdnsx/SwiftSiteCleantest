import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = readFileSync(new URL('../src/utils/errores.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } })
const E = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`)

test('Una columna que falta se explica como migración pendiente, sin mostrar la consulta SQL', () => {
  const crudo = "SQLSTATE[42S22]: Column not found: 1054 Unknown column 'icono' in 'field list' (Connection: mysql, Host: 127.0.0.1)"
  const texto = E.mensajeLegible(crudo)
  assert.match(texto, /php artisan migrate/)
  assert.doesNotMatch(texto, /SQLSTATE|127\.0\.0\.1|icono/)
})

test('Otros errores de base de datos no filtran detalles internos', () => {
  const texto = E.mensajeLegible('SQLSTATE[HY000] [2002] Connection refused')
  assert.match(texto, /MySQL/)
  assert.doesNotMatch(texto, /SQLSTATE/)
})

test('Los mensajes normales de validación pasan sin cambios', () => {
  assert.equal(E.mensajeLegible('Ya existe una categoría con ese nombre.'), 'Ya existe una categoría con ese nombre.')
  assert.equal(E.mensajeLegible(undefined), '')
  assert.equal(E.mensajeLegible(42), '')
})
