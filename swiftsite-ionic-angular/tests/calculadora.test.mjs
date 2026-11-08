import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/app/pages/quote/calculadora.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } });
const C = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);

// Catálogo de ejemplo con la misma forma que devuelve la API (ids desordenados a propósito).
let id = 0;
const t = (id_categoria, tipo_item, material, precio, activo = true, extra = {}) => ({ id_tarifa: ++id, id_categoria, tipo_item, material, precio_unitario: precio.toFixed(2), activo, detalle: null, descripcion: null, ...extra });
const TARIFAS = [
  t(2, 'Sofá de 3 plazas', 'Microfibra', 49.5), t(2, 'Sofá de 3 plazas', 'Tela', 45), t(2, 'Sofá de 3 plazas', 'Cuero', 58.5),
  t(2, 'Butaca', 'Tela', 30), t(2, 'Sofá de 2 plazas', 'Tela', 35),
  t(1, 'Silla · solo asiento', 'Tela', 5), t(1, 'Silla · asiento y respaldo', 'Tela', 7.5), t(1, 'Silla · asiento y respaldo', 'Cuero', 10),
  t(3, 'Colchón individual', null, 25, true, { detalle: '90 × 190 cm' }), t(3, 'Colchón matrimonial', null, 35, true, { detalle: '135 × 190 cm' }),
  t(3, 'Colchón queen', null, 40, true, { detalle: '150 × 200 cm' }), t(3, 'Colchón king', null, 45, true, { detalle: '180 × 200 cm' }),
  t(3, 'Extra: antiácaros', null, 5), t(3, 'Extra: manchas difíciles', null, 5),
  t(4, 'Baño completo', 'Pequeño', 35, true, { detalle: 'hasta 4 m²', descripcion: 'Incluye inodoro, lavamanos, ducha o tina, piso y paredes.' }),
  t(4, 'Baño completo', 'Mediano', 40, true, { detalle: '4 a 6 m²' }), t(4, 'Baño completo', 'Grande', 50, true, { detalle: 'más de 6 m²' }), t(4, 'Extra: quitar sarro', null, 8),
  t(4, 'Limpieza de baño', null, 30, false),
];
const porNombre = (n, m = null) => TARIFAS.find((x) => x.tipo_item === n && x.material === m);
const cat = (id_categoria, nombre, extra = {}) => ({ id_categoria, nombre, activo: true, ...extra });

test('Los extras no aparecen como tipos y las tarifas inactivas se ignoran', () => {
  const e = C.estructura(4, TARIFAS);
  assert.deepEqual(e.tipos.map((x) => x.nombre), ['Baño completo']);
  assert.deepEqual(e.extras.map((x) => x.tipo_item), ['Extra: quitar sarro']);
});

test('Las variantes salen de la más barata a la más cara aunque lleguen desordenadas', () => {
  const e = C.estructura(2, TARIFAS);
  const sofa3 = e.tipos.find((x) => x.nombre === 'Sofá de 3 plazas');
  assert.deepEqual(sofa3.variantes.map((v) => v.material), ['Tela', 'Microfibra', 'Cuero']);
  assert.equal(sofa3.desde, 45);
  assert.deepEqual(e.tipos.map((x) => x.nombre), ['Sofá de 3 plazas', 'Butaca', 'Sofá de 2 plazas']);
});

test('Colchones: 4 medidas con su detalle en centímetros (el detalle viene de la tarifa)', () => {
  const e = C.estructura(3, TARIFAS);
  assert.deepEqual(e.tipos.map((x) => x.etiqueta), ['Colchón individual', 'Colchón matrimonial', 'Colchón queen', 'Colchón king']);
  assert.equal(e.tipos[2].subtitulo, '150 × 200 cm');
  assert.deepEqual(e.extras.map((x) => C.nombreExtra(x)), ['antiácaros', 'manchas difíciles']);
});

test('Sillas: se muestra lo que va después del " · " del nombre de la tarifa', () => {
  const e = C.estructura(1, TARIFAS);
  assert.deepEqual(e.tipos.map((x) => x.etiqueta), ['Solo asiento', 'Asiento y respaldo']);
});

test('Precios: unitario incluye extras e importe multiplica por la cantidad', () => {
  const silla = { id_categoria: 1, categoria: 'Sillas', icono: 'sillas', tarifa: porNombre('Silla · asiento y respaldo', 'Cuero'), extras: [], cantidad: 6 };
  const colchon = { id_categoria: 3, categoria: 'Colchones', icono: 'colchones', tarifa: porNombre('Colchón queen'), extras: [porNombre('Extra: antiácaros')], cantidad: 1 };
  assert.equal(C.importe(silla), 60);
  assert.equal(C.unitario(colchon), 45);
  assert.equal(C.subtotalLocal([silla, colchon]), 105);
});

test('itemsApi suma los extras por unidad y fusiona tarifas repetidas (la API exige id_tarifa distintos)', () => {
  const queen = porNombre('Colchón queen');
  const antiacaros = porNombre('Extra: antiácaros');
  const lineas = [
    { id_categoria: 3, categoria: 'Colchones', icono: null, tarifa: queen, extras: [antiacaros], cantidad: 2 },
    { id_categoria: 3, categoria: 'Colchones', icono: null, tarifa: queen, extras: [], cantidad: 1 },
  ];
  const items = C.itemsApi(lineas);
  assert.equal(new Set(items.map((i) => i.id_tarifa)).size, items.length);
  assert.deepEqual(items.find((i) => i.id_tarifa === queen.id_tarifa), { id_tarifa: queen.id_tarifa, cantidad: 3 });
  assert.deepEqual(items.find((i) => i.id_tarifa === antiacaros.id_tarifa), { id_tarifa: antiacaros.id_tarifa, cantidad: 2 });
});

test('El texto de cada línea es legible', () => {
  const l = { id_categoria: 3, categoria: 'Colchones', icono: null, tarifa: porNombre('Colchón queen'), extras: [porNombre('Extra: antiácaros')], cantidad: 1 };
  assert.equal(C.detalleLinea(l), '1 × $40.00 + antiácaros $5.00');
  const s = { id_categoria: 1, categoria: 'Sillas', icono: null, tarifa: porNombre('Silla · asiento y respaldo', 'Cuero'), extras: [], cantidad: 6 };
  assert.equal(C.detalleLinea(s), 'Cuero · 6 × $10.00');
});

test('reconciliar actualiza precios y descarta tarifas que ya no existen', () => {
  const queen = porNombre('Colchón queen');
  const king = porNombre('Colchón king');
  const lineas = [
    { id_categoria: 3, categoria: 'Colchones', icono: null, tarifa: queen, extras: [], cantidad: 1 },
    { id_categoria: 3, categoria: 'Colchones', icono: null, tarifa: king, extras: [], cantidad: 1 },
  ];
  const nuevo = TARIFAS.filter((x) => x.id_tarifa !== king.id_tarifa).map((x) => (x.id_tarifa === queen.id_tarifa ? { ...x, precio_unitario: '42.00' } : x));
  const r = C.reconciliar(lineas, nuevo);
  assert.equal(r.length, 1);
  assert.equal(C.unitario(r[0]), 42);
});

test('La cantidad respeta el tope de cada servicio', () => {
  assert.equal(C.acotarCantidad(300, 500), 300);
  assert.equal(C.acotarCantidad(800, 500), 500);
  assert.equal(C.acotarCantidad(-1, 500), 1);
});

test('La cantidad siempre queda entre 1 y 99', () => {
  assert.equal(C.acotarCantidad(0), 1);
  assert.equal(C.acotarCantidad(-5), 1);
  assert.equal(C.acotarCantidad(500), 99);
  assert.equal(C.acotarCantidad(Number.NaN), 1);
  assert.equal(C.acotarCantidad(6), 6);
});

test('configDe toma todo de la categoría: ícono, preguntas, unidad, nota y tope', () => {
  const pisos = cat(9, 'Limpieza de pisos', {
    icono: 'pisos', pregunta_tipo: '¿Qué piso es?', pregunta_variante: 'Acabado', pregunta_cantidad: '¿Cuántos metros cuadrados?',
    unidad: 'm²', nota: 'Incluye zócalos.', cantidad_max: 500,
  });
  assert.deepEqual(C.configDe(pisos), {
    icono: 'pisos', preguntaTipo: '¿Qué piso es?', preguntaVariante: 'Acabado', preguntaCantidad: '¿Cuántos metros cuadrados?',
    etiquetaCantidad: 'm²', nota: 'Incluye zócalos.', cantidadMax: 500,
  });
});

test('Una categoría nueva sin textos usa valores genéricos y el ícono por defecto', () => {
  const g = C.configDe(cat(9, 'Alfombras'));
  assert.equal(g.icono, 'servicio');
  assert.equal(g.preguntaTipo, '¿Qué necesitas?');
  assert.equal(g.preguntaCantidad, '¿Cuántos?');
  assert.equal(g.etiquetaCantidad, 'Unidades');
  assert.equal(g.nota, '');
  assert.equal(g.cantidadMax, 99);
});

test('Íconos: los conocidos se respetan y cualquier otro cae al genérico', () => {
  assert.equal(C.iconoValido('banos'), 'banos');
  assert.equal(C.iconoValido(' Cisterna '), 'cisterna');
  assert.equal(C.iconoValido('no-existe'), 'servicio');
  assert.equal(C.iconoValido(null), 'servicio');
  assert.equal(new Set(C.ICONOS_SERVICIO).size, C.ICONOS_SERVICIO.length);
});

test('El tope de cantidad inválido o fuera de rango se corrige', () => {
  assert.equal(C.configDe(cat(1, 'X', { cantidad_max: 0 })).cantidadMax, 99);
  assert.equal(C.configDe(cat(1, 'X', { cantidad_max: -3 })).cantidadMax, 99);
  assert.equal(C.configDe(cat(1, 'X', { cantidad_max: 99999 })).cantidadMax, 10000);
  assert.equal(C.configDe(cat(1, 'X', { cantidad_max: null })).cantidadMax, 99);
});

test('Pocas opciones se muestran como tarjetas y muchas como botones', () => {
  assert.equal(C.estiloDeTipos(2), 'tarjetas');
  assert.equal(C.estiloDeTipos(4), 'tarjetas');
  assert.equal(C.estiloDeTipos(5), 'chips');
});

test('Descripción y detalle de cada opción vienen de la base de datos, no del código', () => {
  const e = C.estructura(4, TARIFAS);
  assert.match(e.tipos[0].descripcion, /ducha o tina/);
  assert.deepEqual(e.tipos[0].variantes.map((v) => v.detalle), ['hasta 4 m²', '4 a 6 m²', 'más de 6 m²']);
  assert.equal(e.tipos[0].subtitulo, '', 'con varias variantes el detalle va en cada variante, no en el tipo');
  // Un servicio nuevo con sus textos aparece completo sin tocar el código.
  const nuevo = [t(20, 'Piso de cerámica', 'Brillante', 1.5, true, { detalle: 'por m²', descripcion: 'Incluye zócalos.' })];
  const n = C.estructura(20, nuevo);
  assert.equal(n.tipos[0].subtitulo, 'por m²');
  assert.equal(n.tipos[0].descripcion, 'Incluye zócalos.');
});

test('dinero siempre muestra el signo $ y dos decimales', () => {
  assert.equal(C.dinero('90.00'), '$90.00');
  assert.equal(C.dinero(7.5), '$7.50');
});

test('El título de cada línea usa el nombre completo del servicio', () => {
  const l = { id_categoria: 3, categoria: 'Colchones', icono: null, tarifa: porNombre('Colchón queen'), extras: [], cantidad: 1 };
  assert.equal(C.tituloLinea(l), 'Colchón queen');
});
