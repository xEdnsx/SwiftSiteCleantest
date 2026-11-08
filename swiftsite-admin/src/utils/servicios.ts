/**
 * Lógica pura del catálogo de servicios (sin Vue): íconos disponibles, textos opcionales
 * y la regla de cuándo un servicio aparece en la app. Se prueba con `npm test`.
 */

/**
 * Íconos que la app del cliente sabe dibujar (misma lista que ICONOS_SERVICIO en la app;
 * `tests/servicios.test.mjs` revisa que no se desalineen).
 */
export const ICONOS_SERVICIO = [
  { clave: 'servicio', etiqueta: 'General' },
  { clave: 'sillas', etiqueta: 'Sillas' },
  { clave: 'muebles', etiqueta: 'Muebles' },
  { clave: 'colchones', etiqueta: 'Colchones' },
  { clave: 'banos', etiqueta: 'Baños' },
  { clave: 'pisos', etiqueta: 'Pisos' },
  { clave: 'cisterna', etiqueta: 'Cisterna' },
  { clave: 'ventanas', etiqueta: 'Ventanas' },
  { clave: 'alfombras', etiqueta: 'Alfombras' },
  { clave: 'cocina', etiqueta: 'Cocina' },
  { clave: 'auto', etiqueta: 'Auto' },
  { clave: 'jardin', etiqueta: 'Jardín' },
  { clave: 'limpieza', etiqueta: 'Limpieza' },
] as const

export type ClaveIcono = (typeof ICONOS_SERVICIO)[number]['clave']

/** Texto recortado, o null si quedó vacío (así la app usa su texto genérico). */
export function textoONull(valor: unknown): string | null {
  const texto = String(valor ?? '').trim()
  return texto === '' ? null : texto
}

/** Tope de unidades por pedido: vacío = 99 por defecto; si no, entero entre 1 y 10000. */
export function validarCantidadMax(valor: unknown): { valor: number | null; error: string } {
  const texto = String(valor ?? '').trim()
  if (texto === '') return { valor: null, error: '' }
  const numero = Number(texto)
  if (!Number.isInteger(numero) || numero < 1 || numero > 10000) {
    return { valor: null, error: 'La cantidad máxima debe ser un número entero entre 1 y 10000 (o déjala vacía para usar 99).' }
  }
  return { valor: numero, error: '' }
}

interface CategoriaMin { id_categoria?: number; activo: boolean }
interface TarifaMin { id_categoria?: number; tipo_item?: string; activo: boolean }

const esExtra = (t: TarifaMin) => (t.tipo_item ?? '').trim().toLowerCase().startsWith('extra:')

/**
 * ¿Se muestra este servicio en la app? La app lo oculta si está oculto
 * o si no tiene ninguna tarifa visible que no sea un extra.
 */
export function estadoEnApp(categoria: CategoriaMin, tarifas: TarifaMin[]): { visible: boolean; motivo: string } {
  if (!categoria.activo) return { visible: false, motivo: 'Está oculta: no aparece en la app.' }
  const propias = tarifas.filter((t) => t.id_categoria === categoria.id_categoria && t.activo)
  if (propias.length === 0) return { visible: false, motivo: 'No tiene tarifas visibles: no aparece en la app.' }
  if (propias.every(esExtra)) return { visible: false, motivo: 'Solo tiene extras: agrega al menos una tarifa normal para que aparezca en la app.' }
  return { visible: true, motivo: '' }
}

// ---------------------------------------------------------------------------
// Autocompletar los textos de la cotización a partir del nombre del servicio.
// ---------------------------------------------------------------------------

export interface TextosCalculadora {
  icono: ClaveIcono
  pregunta_tipo: string
  pregunta_variante: string
  pregunta_cantidad: string
  unidad: string
  cantidad_max: number
  nota: string
}

interface ReglaSugerencia { nombre: string; descripcion: string; palabras: string[]; textos: TextosCalculadora }

/** Minúsculas y sin tildes, para comparar nombres sin importar cómo se escribieron. */
export function normalizarNombre(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

const REGLAS: ReglaSugerencia[] = [
  { nombre: 'Pisos', descripcion: 'Limpieza profunda de pisos de cerámica, porcelanato y baldosa.', palabras: ['piso', 'ceramica', 'porcelanato', 'baldosa'], textos: { icono: 'pisos', pregunta_tipo: '¿Qué tipo de piso es?', pregunta_variante: 'Material', pregunta_cantidad: '¿Cuántos metros cuadrados?', unidad: 'm²', cantidad_max: 500, nota: '' } },
  { nombre: 'Alfombras', descripcion: 'Limpieza de alfombras y tapetes: quita manchas, polvo y malos olores.', palabras: ['alfombra', 'tapete'], textos: { icono: 'alfombras', pregunta_tipo: '¿Qué tipo de alfombra es?', pregunta_variante: 'Tamaño', pregunta_cantidad: '¿Cuántos metros cuadrados?', unidad: 'm²', cantidad_max: 200, nota: '' } },
  { nombre: 'Cisternas', descripcion: 'Lavado y desinfección de cisternas, tanques y pilas de agua.', palabras: ['cisterna', 'tanque', 'pila'], textos: { icono: 'cisterna', pregunta_tipo: '¿Qué tipo de depósito es?', pregunta_variante: 'Capacidad', pregunta_cantidad: '¿Cuántos depósitos?', unidad: 'depósitos', cantidad_max: 10, nota: '' } },
  { nombre: 'Ventanas', descripcion: 'Limpieza de vidrios y ventanas por dentro y por fuera.', palabras: ['ventana', 'vidrio', 'cristal'], textos: { icono: 'ventanas', pregunta_tipo: '¿Qué tipo de ventana es?', pregunta_variante: 'Tamaño', pregunta_cantidad: '¿Cuántas ventanas?', unidad: 'ventanas', cantidad_max: 100, nota: '' } },
  { nombre: 'Cocina', descripcion: 'Desengrase de estufas, campanas y superficies de cocina.', palabras: ['cocina', 'campana', 'estufa'], textos: { icono: 'cocina', pregunta_tipo: '¿Qué quieres limpiar?', pregunta_variante: 'Tamaño', pregunta_cantidad: '¿Cuántos?', unidad: 'unidades', cantidad_max: 20, nota: '' } },
  { nombre: 'Autos', descripcion: 'Limpieza interior de autos, camionetas y motos.', palabras: ['auto', 'carro', 'vehiculo', 'camioneta', 'moto'], textos: { icono: 'auto', pregunta_tipo: '¿Qué tipo de vehículo es?', pregunta_variante: 'Tamaño', pregunta_cantidad: '¿Cuántos vehículos?', unidad: 'vehículos', cantidad_max: 10, nota: '' } },
  { nombre: 'Jardines', descripcion: 'Limpieza de jardines, patios y terrazas.', palabras: ['jardin', 'cesped', 'patio', 'terraza'], textos: { icono: 'jardin', pregunta_tipo: '¿Qué área es?', pregunta_variante: 'Tipo de superficie', pregunta_cantidad: '¿Cuántos metros cuadrados?', unidad: 'm²', cantidad_max: 1000, nota: '' } },
  { nombre: 'Colchones', descripcion: 'De individual a king, por ambos lados. Ayuda a reducir ácaros y manchas.', palabras: ['colchon'], textos: { icono: 'colchones', pregunta_tipo: '¿Qué tamaño de colchón es?', pregunta_variante: 'Material', pregunta_cantidad: '¿Cuántos colchones?', unidad: 'colchones', cantidad_max: 20, nota: '' } },
  { nombre: 'Sillas', descripcion: 'Sillas empresariales, de comedor y más.', palabras: ['silla', 'butaca', 'taburete'], textos: { icono: 'sillas', pregunta_tipo: '¿Qué tipo de silla es?', pregunta_variante: 'Material', pregunta_cantidad: '¿Cuántas sillas?', unidad: 'sillas', cantidad_max: 99, nota: '' } },
  { nombre: 'Muebles', descripcion: 'Juegos de sala, ottomans, butacas y tapicería de vehículos: cuero, tela y microfibra.', palabras: ['mueble', 'sofa', 'sala', 'tapiceria', 'ottoman'], textos: { icono: 'muebles', pregunta_tipo: '¿Qué mueble es?', pregunta_variante: 'Material', pregunta_cantidad: '¿Cuántos muebles?', unidad: 'muebles', cantidad_max: 50, nota: '' } },
  { nombre: 'Baños', descripcion: 'Desinfección y desincrustado de pisos, paredes, duchas y sanitarios.', palabras: ['bano', 'ducha', 'sanitario', 'inodoro'], textos: { icono: 'banos', pregunta_tipo: '¿Qué tipo de baño es?', pregunta_variante: 'Tamaño', pregunta_cantidad: '¿Cuántos baños?', unidad: 'baños', cantidad_max: 20, nota: '' } },
  { nombre: 'Limpieza general', descripcion: 'Limpieza completa de casas, apartamentos y oficinas.', palabras: ['limpieza'], textos: { icono: 'limpieza', pregunta_tipo: '¿Qué tipo de limpieza necesitas?', pregunta_variante: 'Tamaño', pregunta_cantidad: '¿Cuántos espacios?', unidad: 'espacios', cantidad_max: 20, nota: '' } },
]

/** Se usa cuando el nombre no se parece a nada conocido: textos neutros que sirven para cualquier servicio. */
const GENERICO: TextosCalculadora = {
  icono: 'servicio', pregunta_tipo: '¿Qué quieres limpiar?', pregunta_variante: 'Tipo',
  pregunta_cantidad: '¿Cuántos?', unidad: 'unidades', cantidad_max: 99, nota: '',
}

/**
 * Propone los textos de la cotización según el nombre ("Limpieza de pisos" → m²).
 * Devuelve `reconocido: false` cuando usó los textos neutros.
 */
export function sugerirTextos(nombre: string): { textos: TextosCalculadora; reconocido: boolean } {
  const palabras = normalizarNombre(nombre).split(/[^a-z0-9]+/).filter(Boolean)
  const regla = REGLAS.find((r) => r.palabras.some((clave) => palabras.some((p) => p === clave || p === `${clave}s` || p === `${clave}es`)))
  return regla ? { textos: { ...regla.textos }, reconocido: true } : { textos: { ...GENERICO }, reconocido: false }
}

export interface CamposTextos {
  icono: string
  pregunta_tipo: string
  pregunta_variante: string
  pregunta_cantidad: string
  unidad: string
  cantidad_max: string | number
  nota: string
}

/**
 * Qué campos se llenarían: SOLO los que están vacíos. Nunca pisa lo que la persona ya escribió.
 * La nota (aviso al cliente) no se sugiere: es información del negocio.
 */
export function camposAutocompletables(actual: CamposTextos, sugerencia: TextosCalculadora): Partial<CamposTextos> {
  const parche: Partial<CamposTextos> = {}
  const vacio = (v: unknown) => String(v ?? '').trim() === ''
  if (vacio(actual.icono)) parche.icono = sugerencia.icono
  if (vacio(actual.pregunta_tipo)) parche.pregunta_tipo = sugerencia.pregunta_tipo
  if (vacio(actual.pregunta_variante)) parche.pregunta_variante = sugerencia.pregunta_variante
  if (vacio(actual.pregunta_cantidad)) parche.pregunta_cantidad = sugerencia.pregunta_cantidad
  if (vacio(actual.unidad)) parche.unidad = sugerencia.unidad
  if (vacio(actual.cantidad_max)) parche.cantidad_max = sugerencia.cantidad_max
  return parche
}

// ---------------------------------------------------------------------------
// Plantillas: elegir un tipo de servicio y que el formulario se llene solo.
// ---------------------------------------------------------------------------

export interface PlantillaServicio {
  clave: ClaveIcono
  nombre: string
  descripcion: string
  textos: TextosCalculadora
}

/** Orden en que se ofrecen las plantillas en el formulario (los servicios de siempre primero). */
const ORDEN_PLANTILLAS: ClaveIcono[] = ['muebles', 'colchones', 'sillas', 'banos', 'pisos', 'alfombras', 'cisterna', 'ventanas', 'cocina', 'auto', 'jardin', 'limpieza']

export const PLANTILLAS: PlantillaServicio[] = ORDEN_PLANTILLAS.flatMap((clave) => {
  const regla = REGLAS.find((r) => r.textos.icono === clave)
  return regla ? [{ clave, nombre: regla.nombre, descripcion: regla.descripcion, textos: { ...regla.textos } }] : []
})

export const plantillaDe = (clave: string): PlantillaServicio | undefined => PLANTILLAS.find((p) => p.clave === clave)

/** Todo lo que llena una plantilla en el formulario de una categoría nueva. */
export function camposDePlantilla(p: PlantillaServicio) {
  return {
    nombre: p.nombre,
    descripcion: p.descripcion,
    icono: p.clave as string,
    pregunta_tipo: p.textos.pregunta_tipo,
    pregunta_variante: p.textos.pregunta_variante,
    pregunta_cantidad: p.textos.pregunta_cantidad,
    unidad: p.textos.unidad,
    cantidad_max: p.textos.cantidad_max as number | string,
    nota: p.textos.nota,
  }
}

/** ¿Ya existe una categoría que corresponde a esta plantilla (aunque se llame distinto, como «Servicio de baños»)? */
export function plantillaYaExiste(p: PlantillaServicio, nombresExistentes: string[]): boolean {
  return nombresExistentes.some((nombre) => {
    const n = normalizarNombre(nombre)
    if (n === normalizarNombre(p.nombre)) return true
    const { textos, reconocido } = sugerirTextos(nombre)
    return reconocido && textos.icono === p.clave
  })
}

/** Frase que cuenta qué va a preguntar la app con estos textos (para no obligar a abrir cada campo). */
export function resumenTextos(c: Pick<CamposTextos, 'pregunta_tipo' | 'pregunta_variante' | 'pregunta_cantidad' | 'unidad' | 'cantidad_max'>): string {
  const partes = [c.pregunta_tipo, c.pregunta_variante, c.pregunta_cantidad].map((t) => t.trim()).filter(Boolean)
  if (partes.length === 0) return 'La app usará textos generales.'
  const unidad = c.unidad.trim() ? ` (${c.unidad.trim()}${String(c.cantidad_max ?? '').trim() ? `, hasta ${String(c.cantidad_max).trim()}` : ''})` : ''
  return `La app preguntará: ${partes.map((t) => `«${t}»`).join(' → ')}${unidad}.`
}

// ---------- Etiquetas del precio según la categoría ----------
export interface EtiquetaPrecio {
  /** Texto de la etiqueta del campo («Precio por m²»). */
  etiqueta: string
  /** Unidad que se muestra junto al campo («USD / m²»). */
  unidad: string
  /** Pista gris del campo vacío. */
  placeholder: string
  /** Aclaración corta bajo el campo; vacía si no hace falta. */
  pista: string
  /** true = el campo empieza vacío (no se rellena solo con la referencia de lo que ya existe). */
  sinRelleno: boolean
}

const PRECIO_POR_ICONO: Record<string, EtiquetaPrecio> = {
  pisos: { etiqueta: 'Precio por m²', unidad: 'USD / m²', placeholder: '2.00', pista: 'Pista: en porcelanato o cerámica ronda $2.00 por m².', sinRelleno: true },
  alfombras: { etiqueta: 'Precio por m²', unidad: 'USD / m²', placeholder: '3.00', pista: 'Pista: en alfombras ronda $3.00 por m².', sinRelleno: true },
  colchones: { etiqueta: 'Precio por pieza', unidad: 'USD / pieza', placeholder: '0.00', pista: '', sinRelleno: false },
  muebles: { etiqueta: 'Precio por pieza', unidad: 'USD / pieza', placeholder: '0.00', pista: '', sinRelleno: false },
}

/**
 * Cómo se llama el precio de una categoría. Se reconoce por el ícono y, si no lo tiene,
 * por el nombre («Piso de cerámica» cuenta como Pisos). Devuelve null si no hay regla.
 */
export function precioDeCategoria(categoria?: { nombre?: string | null; icono?: string | null }): EtiquetaPrecio | null {
  return PRECIO_POR_ICONO[iconoDeCategoria(categoria)] ?? null
}

/** Ícono de una categoría: el suyo o, si no tiene, el que sugiere su nombre. Vacío si no se reconoce. */
export function iconoDeCategoria(categoria?: { nombre?: string | null; icono?: string | null }): string {
  if (!categoria) return ''
  if (categoria.icono) return categoria.icono
  const { textos, reconocido } = sugerirTextos(categoria.nombre ?? '')
  return reconocido ? textos.icono : ''
}
