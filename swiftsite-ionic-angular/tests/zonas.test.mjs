import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/app/pages/quote/zonas.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } });
const Z = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);

const zona = (id_zona, nombre, recargo = '0.00') => ({ id_zona, nombre, recargo, activo: true });

test('Cada zona se separa en departamento y zona', () => {
  const a = Z.infoZona(zona(1, 'San Salvador Centro'));
  assert.equal(a.departamento, 'San Salvador');
  assert.equal(a.region, 'Centro');
  assert.ok(a.gratis);
  const b = Z.infoZona(zona(2, 'La Libertad Costa', '5.00'));
  assert.equal(b.departamento, 'La Libertad');
  assert.equal(b.region, 'Costa');
  assert.equal(b.gratis, false);
});

test('Una zona con otro formato (zona vieja) sigue describiéndose sin romper nada', () => {
  const i = Z.infoZona(zona(9, 'Isla del Espíritu Santo', '20.00'));
  assert.equal(i.departamento, 'Otras zonas');
  assert.equal(i.region, 'Isla del Espíritu Santo');
  assert.deepEqual(i.distritos, []);
});

test('Solo se ofrecen zonas de los 14 departamentos: las viejas no aparecen ni como "Otras zonas"', () => {
  const lista = [zona(1, 'La Libertad Sur'), zona(2, 'San Salvador Oeste'), zona(3, 'San Salvador Centro'), zona(4, 'San Salvador Norte'), zona(5, 'Soyapango'), zona(6, 'Apopa')];
  assert.deepEqual(Z.zonasVigentes(lista).map((x) => x.id_zona), [1, 2, 3, 4]);
  const g = Z.agruparPorDepartamento(lista);
  assert.deepEqual(g.map((d) => d.nombre), ['San Salvador', 'La Libertad']);
  assert.deepEqual(g[0].zonas.map((x) => x.region), ['Centro', 'Norte', 'Oeste']);
  assert.ok(!g.some((d) => d.nombre === 'Otras zonas'));
});

test('Soyapango, Mejicanos, Santa Tecla y Antiguo Cuscatlán se encuentran en su zona nueva', () => {
  const donde = (pueblo) => Object.entries(Z.DISTRITOS).find(([, d]) => d.includes(pueblo))?.[0];
  assert.equal(donde('Soyapango'), 'San Salvador Este');
  assert.equal(donde('Mejicanos'), 'San Salvador Centro');
  assert.equal(donde('Santa Tecla'), 'La Libertad Sur');
  assert.equal(donde('Antiguo Cuscatlán'), 'La Libertad Este');
  assert.equal(donde('Nuevo Cuscatlán'), 'La Libertad Este');
});

test('La zona muestra TODOS sus municipios, sin la palabra "Incluye" ni "y N más"', () => {
  assert.equal(Z.listaDistritos(Z.infoZona(zona(1, 'San Salvador Oeste'))), 'Apopa y Nejapa');
  assert.equal(Z.listaDistritos(Z.infoZona(zona(3, 'Santa Ana Centro'))), 'Santa Ana');
  const largo = Z.listaDistritos(Z.infoZona(zona(2, 'Chalatenango Sur')));
  assert.doesNotMatch(largo, /Incluye|más/);
  const d = Z.DISTRITOS['Chalatenango Sur'];
  assert.equal(largo, `${d.slice(0, -1).join(', ')} y ${d[d.length - 1]}`);
  assert.equal(Z.listaDistritos(Z.infoZona(zona(4, 'Otra cosa'))), '');
});

test('Son 44 zonas y ninguna repite un distrito dentro de su departamento', () => {
  assert.equal(Object.keys(Z.DISTRITOS).length, 44);
  for (const [nombre, d] of Object.entries(Z.DISTRITOS)) assert.equal(new Set(d).size, d.length, nombre);
});

test('Las zonas del seeder de Laravel coinciden con las que la app sabe describir', { skip: !existsSync(new URL('../../Api-Rest/database/seeders/ZonasCoberturaSeeder.php', import.meta.url)) }, () => {
  const php = readFileSync(new URL('../../Api-Rest/database/seeders/ZonasCoberturaSeeder.php', import.meta.url), 'utf8');
  const cuerpo = php.slice(php.indexOf('$niveles = ['), php.indexOf('$vigentes'));
  const nombres = [...cuerpo.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.equal(nombres.length, 44);
  assert.equal(new Set(nombres).size, 44);
  assert.deepEqual([...nombres].sort(), Object.keys(Z.DISTRITOS).sort());
  // Todas se separan bien en departamento y zona.
  for (const n of nombres) assert.notEqual(Z.infoZona(zona(1, n)).departamento, 'Otras zonas', n);
});

test('Si el panel desactiva todo un departamento, la API ya no lo entrega y la app no lo ofrece', () => {
  // La app pide /zonas?activo=1: lo desactivado nunca llega, y un departamento sin zonas activas no aparece.
  const activas = [zona(1, 'San Salvador Centro'), zona(2, 'San Salvador Norte'), zona(3, 'La Libertad Sur')]; // Morazán y La Libertad Costa apagadas
  const nombres = Z.agruparPorDepartamento(activas).map((d) => d.nombre);
  assert.deepEqual(nombres, ['San Salvador', 'La Libertad']);
  assert.ok(!nombres.includes('Morazán'));
  assert.deepEqual(Z.agruparPorDepartamento(activas)[1].zonas.map((x) => x.region), ['Sur']);
  assert.deepEqual(Z.agruparPorDepartamento([]), []);
});
