<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import AvisoToast from '../components/AvisoToast.vue'
import ElegirServicio from '../components/ElegirServicio.vue'
import { claveComparable, existenteDe, sugerenciasDe } from '../utils/sugerenciasTarifa'
import ZonasCobertura from '../components/ZonasCobertura.vue'
import IconoServicio from '../components/IconoServicio.vue'
import { useAviso } from '../composables/useAviso'
import { api, errorMessage } from '../services/api'
import { ICONOS_SERVICIO, camposAutocompletables, camposDePlantilla, estadoEnApp, precioDeCategoria, resumenTextos, sugerirTextos, textoONull, validarCantidadMax, type PlantillaServicio } from '../utils/servicios'

type Catalogo = 'categorias' | 'tarifas' | 'zonas'

interface Registro {
  id_categoria?: number
  id_tarifa?: number
  nombre?: string
  descripcion?: string | null
  tipo_item?: string
  material?: string | null
  precio_unitario?: string
  activo: boolean
  // Cómo se ve en la app (categorías)
  icono?: string | null
  pregunta_tipo?: string | null
  pregunta_variante?: string | null
  pregunta_cantidad?: string | null
  unidad?: string | null
  nota?: string | null
  cantidad_max?: number | null
  // Textos de la tarifa
  detalle?: string | null
}

const CONFIG: Record<Catalogo, { titulo: string; subtitulo: string; singular: string; columnas: string[] }> = {
  categorias: {
    titulo: 'Categorías',
    subtitulo: 'Los tipos de servicio que ofrece SwiftSite Clean.',
    singular: 'categoría',
    columnas: ['Nombre', 'Descripción'],
  },
  tarifas: {
    titulo: 'Tarifas y precios',
    subtitulo: 'Lo que ven los clientes cuando piden una cotización.',
    singular: 'tarifa',
    columnas: ['Artículo', 'Qué se limpia', 'Material / tamaño', 'Precio'],
  },
  zonas: {
    titulo: 'Zonas de cobertura',
    subtitulo: 'Dónde llegamos y cuánto se suma por la distancia.',
    singular: 'zona',
    columnas: [], // la pantalla de zonas es ZonasCobertura.vue
  },
}

// Valores especiales de los selects dependientes.
const NUEVO = '__nuevo__'
const SIN = '__sin__'

const selected = ref<Catalogo>(useRoute().path === '/zonas' ? 'zonas' : 'tarifas')
const rows = ref<Registro[]>([])
const categorias = ref<Registro[]>([])
// Solo se carga en la pestaña de categorías: sirve para avisar qué servicios no aparecen en la app.
const tarifasTodas = ref<Registro[] | null>(null)
const loading = ref(false)
const error = ref('')
const errorAccion = ref('')
const busqueda = ref('')
const recienId = ref<number | null>(null)
let requestId = 0

// Aviso breve que desaparece solo (el mismo de Pedidos y Clientes).
const { mensaje: exito, avisar } = useAviso()
const capital = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

// ---------- Formulario (crear / editar) ----------
const editandoId = ref<number | null>(null)
const guardando = ref(false)
const errorForm = ref('')
const confirmandoId = ref<number | null>(null)
const precioTocado = ref(false)
const panelAbierto = ref(false)
const formRef = ref<HTMLElement | null>(null)
const tablaRef = ref<HTMLElement | null>(null)
const form = reactive({
  nombre: '',
  // Zonas: el nombre se arma con estos dos
  descripcion: '',
  id_categoria: '' as number | '',
  servicioSel: '',
  servicioNuevo: '',
  materialSel: '',
  materialNuevo: '',
  precio: '',
  activo: true,
  // Categorías: cómo se muestra en la app
  icono: '',
  pregunta_tipo: '',
  pregunta_variante: '',
  pregunta_cantidad: '',
  unidad: '',
  nota: '',
  cantidad_max: '' as number | string,
  // Tarifas: textos opcionales
  detalle: '',
  descTarifa: '',
})

const config = computed(() => CONFIG[selected.value])
const modoEdicion = computed(() => editandoId.value !== null)

// ---------- Utilidades ----------
const norm = (texto?: string | null) => (texto ?? '').trim().toLowerCase()
const esExtra = (tipo?: string | null) => norm(tipo).startsWith('extra:')
const unicos = (lista: string[]) => [...new Set(lista)]

function idDe(row: Registro): number {
  const id = selected.value === 'categorias' ? row.id_categoria : row.id_tarifa
  return id ?? 0
}
function dinero(valor?: string | number): string {
  return valor == null ? '—' : `$${Number(valor).toFixed(2)}`
}
function nombreCategoria(id?: number | ''): string {
  return categorias.value.find((c) => c.id_categoria === id)?.nombre ?? '—'
}
function celdas(row: Registro): string[] {
  if (selected.value === 'categorias') return [row.nombre ?? '—', row.descripcion || '—']
  if (selected.value === 'tarifas') {
    return [row.tipo_item ?? '—', nombreCategoria(row.id_categoria), row.material || '—', dinero(row.precio_unitario)]
  }
  return []
}

// Para categorías: ¿la app la muestra? (null = no se pudo saber)
function estadoApp(row: Registro) {
  return tarifasTodas.value ? estadoEnApp(row, tarifasTodas.value) : null
}
const tieneTextos = computed(() =>
  [form.pregunta_tipo, form.pregunta_variante, form.pregunta_cantidad, form.unidad, form.nota, String(form.cantidad_max ?? '')].some((t) => t.trim() !== ''),
)

// ---------- Plantillas y textos de la cotización ----------
const textosAbiertos = ref(false)
/** Plantilla elegida al crear una categoría: la clave del ícono, 'otro' o '' si todavía no eligió. */
const plantillaElegida = ref('')
const nombresDeCategorias = computed(() => (selected.value === 'categorias' ? rows.value.map((r) => r.nombre ?? '') : []))
const resumenDeTextos = computed(() => resumenTextos({ ...form, cantidad_max: form.cantidad_max }))

function elegirPlantilla(p: PlantillaServicio) {
  Object.assign(form, camposDePlantilla(p))
  plantillaElegida.value = p.clave
  textosAbiertos.value = false
}
function elegirOtroServicio() {
  Object.assign(form, { nombre: '', descripcion: '', icono: '', pregunta_tipo: '', pregunta_variante: '', pregunta_cantidad: '', unidad: '', nota: '', cantidad_max: '' })
  plantillaElegida.value = 'otro'
  textosAbiertos.value = false
  void nextTick(() => document.getElementById('f-nombre')?.focus())
}

/** Llena los campos vacíos según el nombre ("Pisos" → m², ¿Cuántos metros cuadrados?). Nunca pisa lo ya escrito. */
function autocompletarTextos(automatico = false) {
  const nombre = form.nombre.trim()
  if (!nombre) {
    if (!automatico) avisar('Primero escribe el nombre del servicio')
    return
  }
  const { textos, reconocido } = sugerirTextos(nombre)
  const parche = camposAutocompletables(form, textos)
  if (Object.keys(parche).length === 0) {
    if (!automatico) avisar('Todos los campos ya tienen texto')
    return
  }
  Object.assign(form, parche)
  textosAbiertos.value = true
  avisar(reconocido ? 'Llené los textos según el nombre. Revísalos.' : 'No reconocí el servicio: puse textos generales. Ajústalos si quieres.')
}

/** Al terminar de escribir el nombre de una categoría NUEVA, se sugiere todo solo (si no se ha tocado nada). */
function alSalirDelNombre() {
  if (selected.value !== 'categorias' || modoEdicion.value || tieneTextos.value || form.icono) return
  autocompletarTextos(true)
}

// Lista visible: lo recién creado siempre va primero.
const visibles = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  const lista = q ? rows.value.filter((r) => celdas(r).some((t) => t.toLowerCase().includes(q))) : [...rows.value]
  if (recienId.value !== null) {
    const i = lista.findIndex((r) => idDe(r) === recienId.value)
    if (i > 0) {
      const [nuevo] = lista.splice(i, 1)
      if (nuevo) lista.unshift(nuevo)
    }
  }
  return lista
})

// ---------- Datos dependientes de la categoría (tarifas) ----------
const tarifasCat = computed(() =>
  selected.value === 'tarifas' && form.id_categoria !== ''
    ? rows.value.filter((r) => r.id_categoria === form.id_categoria)
    : [],
)
const serviciosCat = computed(() => unicos(tarifasCat.value.filter((r) => !esExtra(r.tipo_item)).map((r) => r.tipo_item ?? '')))
const extrasCat = computed(() => unicos(tarifasCat.value.filter((r) => esExtra(r.tipo_item)).map((r) => r.tipo_item ?? '')))
const materialesCat = computed(() =>
  unicos(tarifasCat.value.filter((r) => !esExtra(r.tipo_item) && r.material).map((r) => r.material ?? '')),
)

const tipoFinal = computed(() => (form.servicioSel === NUEVO ? form.servicioNuevo.trim() : form.servicioSel))
const esExtraSel = computed(() => esExtra(tipoFinal.value))
const materialFinal = computed(() => {
  if (esExtraSel.value || form.materialSel === '' || form.materialSel === SIN) return ''
  return form.materialSel === NUEVO ? form.materialNuevo.trim() : form.materialSel
})
// Variantes que este servicio ya tiene (para no repetirlas).
const materialesTomados = computed(
  () =>
    new Set(
      tarifasCat.value
        .filter((r) => norm(r.tipo_item) === norm(tipoFinal.value) && idDe(r) !== editandoId.value)
        .map((r) => norm(r.material)),
    ),
)

// Precio de referencia: lo típico de lo que ya existe.
const referencia = computed(() => {
  if (selected.value !== 'tarifas' || form.id_categoria === '') return null
  const conPrecio = tarifasCat.value.filter((r) => r.precio_unitario != null)
  const sinExtras = conPrecio.filter((r) => !esExtra(r.tipo_item))
  const categoria = nombreCategoria(form.id_categoria)
  let pool: Registro[]
  let etiqueta: string
  if (esExtraSel.value) {
    pool = conPrecio.filter((r) => esExtra(r.tipo_item))
    etiqueta = `extras de ${categoria}`
  } else if (form.servicioSel !== '' && form.servicioSel !== NUEVO) {
    pool = sinExtras.filter((r) => norm(r.tipo_item) === norm(form.servicioSel))
    etiqueta = form.servicioSel
  } else if (form.materialSel !== '' && form.materialSel !== SIN && form.materialSel !== NUEVO) {
    pool = sinExtras.filter((r) => norm(r.material) === norm(form.materialSel))
    etiqueta = `${categoria} · ${form.materialSel}`
  } else {
    pool = sinExtras.length ? sinExtras : conPrecio
    etiqueta = `lo típico en ${categoria}`
  }
  const precios = pool.map((r) => Number(r.precio_unitario)).sort((a, b) => a - b)
  if (!precios.length) return null
  const mitad = Math.floor(precios.length / 2)
  const mediana = precios.length % 2 ? precios[mitad]! : (precios[mitad - 1]! + precios[mitad]!) / 2
  return {
    etiqueta,
    tipico: Math.round(mediana * 2) / 2,
    min: precios[0]!,
    max: precios[precios.length - 1]!,
  }
})

// Preguntas, ejemplos y opciones a la medida de la categoría y del artículo elegidos.
const contexto = computed(() => {
  const clave = norm(nombreCategoria(form.id_categoria))
  const ejemplosArticulo = serviciosCat.value.slice(0, 3).join(', ')
  const ejemplosVariante = materialesCat.value.slice(0, 3).join(', ')
  const elegido = form.servicioSel !== '' && form.servicioSel !== NUEVO ? form.servicioSel : ''
  const propias = unicos(
    tarifasCat.value
      .filter((r) => elegido !== '' && norm(r.tipo_item) === norm(elegido) && r.material)
      .map((r) => r.material ?? ''),
  )
  const faltan = materialesCat.value.filter((m) => !propias.includes(m))

  let pregunta = '¿Cuál es el artículo?'
  let agregarA = 'otro material o tamaño'
  let preguntaVariante = '¿De qué material o tamaño?'
  let porQue = 'Es lo que cambia el precio.'
  let opcionNueva = '＋ Agregar otro…'
  let ejemploNuevo = 'Escribe el nombre'
  let sinEjemplos = false

  if (clave.includes('baño')) {
    pregunta = '¿Qué tipo de baño?'
    agregarA = 'otro tamaño'
    preguntaVariante = '¿De qué tamaño es el baño?'
    porQue = 'El precio cambia según el tamaño del baño.'
    opcionNueva = '＋ Agregar otro tamaño…'
    ejemploNuevo = 'Ej. Extra grande'
  } else if (clave.includes('colch')) {
    pregunta = '¿Qué colchón?'
    agregarA = ''
    preguntaVariante = '¿Cambia el precio según el material?'
    porQue = 'En colchones el precio depende de la medida, que ya va en el artículo. Normalmente elige «No aplica».'
    opcionNueva = '＋ Agregar otra variante…'
    ejemploNuevo = 'Ej. Ortopédico'
    sinEjemplos = true
  } else if (clave.includes('mueble')) {
    pregunta = '¿Qué mueble?'
    agregarA = 'otro material'
    preguntaVariante = '¿De qué material es?'
    porQue = 'El precio cambia según el material.'
    opcionNueva = '＋ Agregar otro material…'
    ejemploNuevo = 'Ej. Terciopelo'
  } else if (clave.includes('silla')) {
    pregunta = '¿Qué tipo de silla?'
    agregarA = 'otro material'
    preguntaVariante = '¿De qué material es?'
    porQue = 'El precio cambia según el material.'
    opcionNueva = '＋ Agregar otro material…'
    ejemploNuevo = 'Ej. Piel sintética'
  }

  let ayudaArticulo = 'Primero elige qué se va a limpiar.'
  if (form.id_categoria !== '') {
    const ej = ejemplosArticulo ? `Ej.: ${ejemplosArticulo}. ` : ''
    const accion = agregarA
      ? `Elige uno de la lista para agregarle ${agregarA}, o agrega uno nuevo.`
      : 'Elige uno de la lista para cambiarlo, o agrega una medida nueva como artículo nuevo.'
    ayudaArticulo = ej + accion
  }

  let ayudaVariante = porQue
  if (!sinEjemplos) {
    if (elegido && propias.length) {
      ayudaVariante += ` «${elegido}» ya tiene: ${propias.join(', ')}.`
      if (faltan.length) ayudaVariante += ` Te falta: ${faltan.join(', ')}.`
    } else if (ejemplosVariante) {
      ayudaVariante += ` Ej.: ${ejemplosVariante}.`
    }
  }

  return { pregunta, preguntaVariante, ayudaArticulo, ayudaVariante, opcionNueva, ejemploNuevo }
})

// ---------- Sugerencias a un toque, según la categoría ----------
const categoriaActual = computed(() => categorias.value.find((c) => c.id_categoria === form.id_categoria))
const sugerenciasCat = computed(() => sugerenciasDe(categoriaActual.value))

/** Artículos sugeridos; los que ya existen se marcan y al tocarlos se elige el que ya está. */
const chipsArticulo = computed(() =>
  modoEdicion.value || selected.value !== 'tarifas'
    ? []
    : (sugerenciasCat.value?.articulos ?? []).map((texto) => {
        const existente = existenteDe(texto, serviciosCat.value)
        const actual = existente ?? texto
        const elegido = existente
          ? norm(form.servicioSel) === norm(existente)
          : form.servicioSel === NUEVO && claveComparable(form.servicioNuevo) === claveComparable(texto)
        return { texto, existente, elegido, actual }
      }),
)
function usarArticulo(c: { texto: string; existente?: string }) {
  if (c.existente) form.servicioSel = c.existente
  else {
    form.servicioSel = NUEVO
    form.servicioNuevo = c.texto
  }
  alCambiarServicio()
}

/** Materiales o tamaños sugeridos para el artículo elegido; los que ya tiene ese artículo no se pueden repetir. */
const chipsMaterial = computed(() => {
  if (modoEdicion.value || selected.value !== 'tarifas' || form.servicioSel === '' || esExtraSel.value) return []
  const tomados = new Set(
    tarifasCat.value
      .filter((r) => norm(r.tipo_item) === norm(tipoFinal.value) && idDe(r) !== editandoId.value)
      .map((r) => claveComparable(r.material ?? '')),
  )
  return (sugerenciasCat.value?.materiales ?? []).map((texto) => {
    const existente = existenteDe(texto, materialesCat.value)
    const elegido = existente
      ? form.materialSel === existente
      : form.materialSel === NUEVO && claveComparable(form.materialNuevo) === claveComparable(texto)
    return { texto, existente, elegido, tomado: tomados.has(claveComparable(texto)) }
  })
})
function usarMaterial(c: { texto: string; existente?: string }) {
  if (c.existente) form.materialSel = c.existente
  else {
    form.materialSel = NUEVO
    form.materialNuevo = c.texto
  }
}

// Etiqueta, unidad y pista del precio según la categoría (null = texto general).
const etiquetaPrecio = computed(() =>
  esExtraSel.value ? null : precioDeCategoria(categorias.value.find((c) => c.id_categoria === form.id_categoria)),
)

// Rellena el precio con la referencia mientras la persona no lo haya tocado
// (en las categorías que se cobran por m² el campo empieza vacío y solo muestra la pista).
watch(
  () => referencia.value?.tipico,
  (tipico) => {
    if (tipico != null && !precioTocado.value && !modoEdicion.value && !etiquetaPrecio.value?.sinRelleno) form.precio = tipico.toFixed(2)
  },
)

// Cómo lo verá el cliente, para que quede claro qué se está creando.
const vistaPrevia = computed(() => {
  if (selected.value !== 'tarifas' || form.id_categoria === '' || !tipoFinal.value) return ''
  if (!esExtraSel.value && form.materialSel === '') return ''
  if (!esDinero(form.precio)) return ''
  const nombre = `${tipoFinal.value}${materialFinal.value ? ` · ${materialFinal.value}` : ''}`
  return `${nombreCategoria(form.id_categoria)} › ${nombre} — ${dinero(redondear(form.precio))}`
})

function alCambiarCategoria() {
  form.servicioSel = ''
  form.servicioNuevo = ''
  form.materialSel = ''
  form.materialNuevo = ''
  if (!modoEdicion.value) {
    form.precio = ''
    precioTocado.value = false
  }
}
function alCambiarServicio() {
  form.materialSel = ''
  form.materialNuevo = ''
  if (form.servicioSel !== NUEVO) {
    const propias = tarifasCat.value.filter((r) => norm(r.tipo_item) === norm(form.servicioSel))
    if (propias.length && propias.every((r) => !r.material)) form.materialSel = SIN
    if (!modoEdicion.value) form.descTarifa = propias.map((r) => (r.descripcion ?? '').trim()).find(Boolean) ?? ''
  }
  if (!materialesCat.value.length) form.materialSel = SIN
}
function usarReferencia() {
  if (referencia.value) form.precio = referencia.value.tipico.toFixed(2)
  precioTocado.value = false
}

// ---------- Lectura ----------
async function load(catalogo: Catalogo = selected.value) {
  const cambia = catalogo !== selected.value
  selected.value = catalogo
  const current = ++requestId
  loading.value = true
  error.value = ''
  if (cambia) {
    rows.value = []
    busqueda.value = ''
    exito.value = ''
    errorAccion.value = ''
    recienId.value = null
    cerrarPanel()
  }
  if (catalogo === 'zonas') {
    loading.value = false // ZonasCobertura carga sus propios datos
    return
  }
  try {
    const pedidos: Promise<Registro[]>[] = [api.get<Registro[]>(`/${catalogo}`).then((r) => r.data)]
    if (catalogo !== 'categorias') pedidos.push(api.get<Registro[]>('/categorias').then((r) => r.data))
    else pedidos.push(api.get<Registro[]>('/tarifas').then((r) => r.data).catch(() => []))
    const [principal, cats] = await Promise.all(pedidos)
    if (current !== requestId) return
    rows.value = principal ?? []
    tarifasTodas.value = catalogo === 'categorias' ? (cats ?? []) : null
    categorias.value = catalogo === 'categorias' ? (principal ?? []) : (cats ?? [])
  } catch (err) {
    if (current === requestId) error.value = errorMessage(err)
  } finally {
    if (current === requestId) loading.value = false
  }
}

// ---------- Formulario ----------
function nuevo() {
  editandoId.value = null
  plantillaElegida.value = ''
  errorForm.value = ''
  precioTocado.value = false
  textosAbiertos.value = false
  Object.assign(form, {
    nombre: '', descripcion: '', id_categoria: '', servicioSel: '', servicioNuevo: '',
    materialSel: '', materialNuevo: '', precio: '', activo: true,
    icono: '', pregunta_tipo: '', pregunta_variante: '', pregunta_cantidad: '', unidad: '', nota: '', cantidad_max: '',
    detalle: '', descTarifa: '',
  })
}

function enfocarPrimerCampo() {
  void nextTick(() => formRef.value?.querySelector<HTMLElement>('select, input')?.focus())
}
function abrirNuevo() {
  nuevo()
  panelAbierto.value = true
  enfocarPrimerCampo()
}
function cerrarPanel() {
  panelAbierto.value = false
  nuevo()
}
function alTeclear(evento: KeyboardEvent) {
  if (evento.key === 'Escape' && panelAbierto.value) cerrarPanel()
}

function editar(row: Registro) {
  exito.value = ''
  errorForm.value = ''
  confirmandoId.value = null
  editandoId.value = idDe(row)
  precioTocado.value = true
  Object.assign(form, {
    nombre: row.nombre ?? '',
    descripcion: row.descripcion ?? '',
    id_categoria: row.id_categoria ?? '',
    servicioSel: row.tipo_item ?? '',
    servicioNuevo: '',
    materialSel: row.material ? row.material : SIN,
    materialNuevo: '',
    precio: row.precio_unitario ?? '',
    activo: row.activo,
    icono: row.icono ?? '',
    pregunta_tipo: row.pregunta_tipo ?? '',
    pregunta_variante: row.pregunta_variante ?? '',
    pregunta_cantidad: row.pregunta_cantidad ?? '',
    unidad: row.unidad ?? '',
    nota: row.nota ?? '',
    cantidad_max: row.cantidad_max ?? '',
    detalle: row.detalle ?? '',
    descTarifa: c_descTarifa(row),
  })
  panelAbierto.value = true
  enfocarPrimerCampo()
}

// En las tarifas la descripción ("qué incluye") se guarda en la fila; en las categorías la descripción es otra cosa.
const c_descTarifa = (row: Registro) => (selected.value === 'tarifas' ? (row.descripcion ?? '') : '')

// Un <input type="number"> con v-model entrega un número (no texto) al escribir en él.
function esDinero(valor: string | number): boolean {
  const texto = String(valor ?? '').trim()
  return texto !== '' && Number.isFinite(Number(texto)) && Number(texto) >= 0
}
function redondear(valor: string | number): number {
  return Math.round(Number(valor) * 100) / 100
}

function validar(): string {
  const c = selected.value
  if (c === 'categorias') {
    if (!form.nombre.trim()) return 'Escribe el nombre de la categoría.'
    const max = validarCantidadMax(form.cantidad_max)
    if (max.error) return max.error
  }
  if (c === 'tarifas') {
    if (!form.id_categoria) return 'Elige qué se va a limpiar.'
    if (!tipoFinal.value) return form.servicioSel === NUEVO ? 'Escribe el nombre del artículo nuevo.' : 'Elige el artículo.'
    if (!esExtraSel.value) {
      if (form.materialSel === '') return 'Elige el material o tamaño, o «No aplica» si tiene un solo precio.'
      if (form.materialSel === NUEVO && !form.materialNuevo.trim()) return 'Escribe el material o tamaño nuevo.'
    }
    if (!esDinero(form.precio)) return 'El precio debe ser un número mayor o igual a 0.'
    if (materialesTomados.value.has(norm(materialFinal.value))) {
      const que = materialFinal.value ? `${tipoFinal.value} · ${materialFinal.value}` : tipoFinal.value
      return `Ya existe «${que}» en ${nombreCategoria(form.id_categoria)}. Edítala desde la tabla.`
    }
  }
  return ''
}

function payload(): Record<string, unknown> {
  if (selected.value === 'categorias') {
    return {
      nombre: form.nombre.trim(),
      descripcion: textoONull(form.descripcion),
      icono: textoONull(form.icono),
      pregunta_tipo: textoONull(form.pregunta_tipo),
      pregunta_variante: textoONull(form.pregunta_variante),
      pregunta_cantidad: textoONull(form.pregunta_cantidad),
      unidad: textoONull(form.unidad),
      nota: textoONull(form.nota),
      cantidad_max: validarCantidadMax(form.cantidad_max).valor,
      activo: form.activo,
    }
  }
  return {
    id_categoria: form.id_categoria,
    tipo_item: tipoFinal.value,
    material: materialFinal.value || null,
    precio_unitario: redondear(form.precio),
    detalle: esExtraSel.value ? null : textoONull(form.detalle),
    descripcion: esExtraSel.value ? null : textoONull(form.descTarifa),
    activo: form.activo,
  }
}

// ---------- Escritura ----------
/** "Qué incluye" describe al artículo, no a una variante: se deja igual en todas las variantes. */
async function sincronizarDescripcion(idGuardado: number) {
  if (selected.value !== 'tarifas' || esExtraSel.value) return
  const nueva = textoONull(form.descTarifa)
  const hermanas = rows.value.filter(
    (r) =>
      r.id_categoria === form.id_categoria &&
      norm(r.tipo_item) === norm(tipoFinal.value) &&
      idDe(r) !== idGuardado &&
      (textoONull(r.descripcion) ?? null) !== nueva,
  )
  await Promise.all(hermanas.map((r) => api.put(`/tarifas/${idDe(r)}`, { descripcion: nueva })))
}

async function guardar() {
  exito.value = ''
  errorAccion.value = ''
  try {
    errorForm.value = validar()
  } catch {
    errorForm.value = 'Revisa los datos del formulario e inténtalo de nuevo.'
  }
  if (errorForm.value) return
  guardando.value = true
  const base = `/${selected.value}`
  const creando = editandoId.value === null
  try {
    if (creando) {
      const { data } = await api.post<Registro>(base, payload())
      await sincronizarDescripcion(idDe(data))
      cerrarPanel()
      busqueda.value = ''
      await load()
      recienId.value = idDe(data)
      avisar(`${capital(config.value.singular)} creada`)
      await nextTick()
      tablaRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      const idEditado = editandoId.value as number
      await api.put(`${base}/${idEditado}`, payload())
      await sincronizarDescripcion(idEditado)
      cerrarPanel()
      await load()
      recienId.value = idEditado
      avisar('Cambios guardados')
      await nextTick()
      tablaRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  } catch (err) {
    errorForm.value = errorMessage(err)
  } finally {
    guardando.value = false
  }
}

async function alternarActivo(row: Registro) {
  exito.value = ''
  errorAccion.value = ''
  recienId.value = null
  try {
    await api.put(`/${selected.value}/${idDe(row)}`, { activo: !row.activo })
    avisar(row.activo ? 'Ahora está oculta' : 'Ahora es visible')
    await load()
  } catch (err) {
    errorAccion.value = errorMessage(err)
  }
}

async function eliminar(row: Registro) {
  exito.value = ''
  errorAccion.value = ''
  recienId.value = null
  try {
    await api.delete(`/${selected.value}/${idDe(row)}`)
    confirmandoId.value = null
    if (editandoId.value === idDe(row)) cerrarPanel()
    avisar(`${capital(config.value.singular)} eliminada`)
    await load()
  } catch (err) {
    confirmandoId.value = null
    errorAccion.value = errorMessage(err)
  }
}

onMounted(() => {
  void load()
  window.addEventListener('keydown', alTeclear)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', alTeclear)
})
</script>

<template>
  <section class="flex flex-col gap-6 max-w-7xl mx-auto">
    <!-- Encabezado -->
    <header class="flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div>
        <h1 class="font-bricolage font-extrabold text-[40px] leading-none">{{ config.titulo }}</h1>
        <p class="mt-2 text-gris">{{ config.subtitulo }}</p>
      </div>
      <button v-if="selected !== 'zonas'" type="button" class="btn-primario" @click="abrirNuevo">
        + Nueva {{ config.singular }}
      </button>
    </header>

    <!-- Selector de catálogo -->
    <nav class="flex flex-wrap gap-3" aria-label="Catálogos">
      <button
        v-for="(cfg, catalogo) in CONFIG"
        :key="catalogo"
        type="button"
        class="chip"
        :aria-pressed="selected === catalogo"
        @click="load(catalogo)"
      >
        {{ cfg.titulo }}
      </button>
    </nav>

    <!-- Mensajes -->
    <AvisoToast :mensaje="exito" />
    <p v-if="errorAccion" role="alert" class="bg-red-100 border-2 border-red-500 text-red-700 p-4 rounded-2xl">
      {{ errorAccion }}
    </p>
    <p v-if="error" role="alert" class="bg-red-100 border-2 border-red-500 text-red-700 p-4 rounded-2xl">
      {{ error }}
    </p>

    <!-- Zonas: su propia pantalla (departamentos → zonas → distritos) -->
    <ZonasCobertura v-if="selected === 'zonas'" />

    <div v-else>
      <!-- Tabla -->
      <section ref="tablaRef" class="card-brutal p-7 flex flex-col gap-5 scroll-mt-6">
        <div class="relative w-full max-w-[420px]">
          <label for="buscar-catalogo" class="sr-only">Buscar</label>
          <input id="buscar-catalogo" v-model="busqueda" type="search" class="input-brutal !rounded-full pl-11" placeholder="Buscar" />
          <AppIcon name="search" :size="20" class="absolute left-4 top-1/2 -translate-y-1/2 text-gris" />
        </div>

        <p v-if="loading && !rows.length" class="text-center py-10 text-gris font-medium animate-pulse">Cargando información...</p>
        <p v-else-if="!error && !visibles.length" class="text-center py-10 text-gris border-2 border-dashed border-linea rounded-[24px]">
          {{ busqueda ? 'Nada coincide con tu búsqueda.' : 'Todavía no hay registros aquí. Crea el primero con el formulario.' }}
        </p>

        <div v-else-if="!error" class="overflow-x-auto">
          <table class="tabla-brutal border-separate border-spacing-0">
            <thead>
              <tr>
                <th v-for="col in config.columnas" :key="col">{{ col }}</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in visibles"
                :key="idDe(row)"
                :class="{ 'fila-nueva': idDe(row) === recienId }"
                :aria-selected="idDe(row) === editandoId"
              >
                <td v-for="(celda, i) in celdas(row)" :key="i" :class="i === 0 ? 'font-semibold' : 'text-gris'">
                  <span v-if="selected === 'categorias' && i === 0" class="inline-flex items-center gap-2 text-tinta">
                    <IconoServicio :nombre="row.icono" :size="22" />{{ celda }}
                  </span>
                  <template v-else>{{ celda }}</template>
                </td>
                <td>
                  <span :class="row.activo ? 'badge-confirmado' : 'badge-cotizado'">{{ row.activo ? 'Visible' : 'Oculta' }}</span>
                  <p v-if="selected === 'categorias' && row.activo && estadoApp(row) && !estadoApp(row)!.visible" class="mt-1.5 max-w-[220px] text-xs font-semibold text-red-700">
                    {{ estadoApp(row)!.motivo }}
                  </p>
                </td>
                <td>
                  <div v-if="confirmandoId === idDe(row)" class="flex items-center gap-2 text-sm">
                    <span class="font-semibold">¿Eliminar?</span>
                    <button type="button" class="chip !py-1" @click="eliminar(row)">Sí</button>
                    <button type="button" class="chip !py-1" @click="confirmandoId = null">No</button>
                  </div>
                  <div v-else class="flex items-center gap-3">
                    <button type="button" :aria-label="`Editar ${celdas(row)[0]}`" class="cursor-pointer" @click="editar(row)">
                      <AppIcon name="edit" :size="20" />
                    </button>
                    <button type="button" class="chip !py-1 !px-3" @click="alternarActivo(row)">
                      {{ row.activo ? 'Ocultar' : 'Mostrar' }}
                    </button>
                    <button type="button" :aria-label="`Eliminar ${celdas(row)[0]}`" class="cursor-pointer" @click="confirmandoId = idDe(row)">
                      <AppIcon name="trash" :size="20" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Panel lateral: crear / editar -->
      <Transition name="panel">
        <div
          v-if="panelAbierto"
          class="fixed inset-0 z-40 flex justify-end"
          role="dialog"
          aria-modal="true"
          :aria-label="modoEdicion ? `Editar ${config.singular}` : `Nueva ${config.singular}`"
        >
          <div class="absolute inset-0 bg-tinta/40" @click="cerrarPanel" />
          <form
            ref="formRef"
            class="panel-lateral relative flex h-full w-full max-w-[440px] flex-col gap-4 overflow-y-auto border-l-2 border-tinta bg-white p-7"
            novalidate
            @submit.prevent="guardar"
          >
        <div class="flex items-start justify-between gap-4">
          <h2 class="font-bricolage font-extrabold text-2xl">
            {{ modoEdicion ? `Editar ${config.singular}` : `Nueva ${config.singular}` }}
          </h2>
          <button type="button" aria-label="Cerrar" class="cursor-pointer rounded-full p-1.5 hover:bg-aqua-suave" @click="cerrarPanel">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <!-- Categorías -->
        <template v-if="selected === 'categorias'">
          <ElegirServicio
            v-if="!modoEdicion"
            :elegida="plantillaElegida"
            :existentes="nombresDeCategorias"
            @elegir="elegirPlantilla"
            @otro="elegirOtroServicio"
          />
          <div>
            <label class="label-brutal" for="f-nombre">Nombre</label>
            <input id="f-nombre" v-model="form.nombre" class="input-brutal" type="text" maxlength="80" placeholder="Ej. Muebles" @blur="alSalirDelNombre" />
          </div>
          <div>
            <label class="label-brutal" for="f-desc">Descripción (opcional)</label>
            <textarea id="f-desc" v-model="form.descripcion" class="input-brutal" rows="3" maxlength="300" placeholder="Ej. Pisos de cerámica y porcelanato." />
            <p class="mt-1 text-xs text-gris">Es el texto que se ve en la tarjeta del servicio en el Inicio de la app.</p>
          </div>

          <div>
            <span class="label-brutal" id="f-icono-label">Ícono en la app</span>
            <div class="mt-1 grid grid-cols-5 gap-2" role="radiogroup" aria-labelledby="f-icono-label">
              <button
                v-for="i in ICONOS_SERVICIO"
                :key="i.clave"
                type="button"
                role="radio"
                :aria-checked="form.icono === i.clave"
                :title="i.etiqueta"
                :aria-label="i.etiqueta"
                class="grid aspect-square cursor-pointer place-items-center rounded-xl border-2"
                :class="form.icono === i.clave ? 'border-tinta bg-aqua-suave' : 'border-linea hover:border-tinta'"
                @click="form.icono = i.clave"
              >
                <IconoServicio :nombre="i.clave" :size="26" />
              </button>
            </div>
            <p class="mt-1 text-xs text-gris">Si no eliges ninguno, la app usa el ícono general.</p>
          </div>

          <details class="rounded-2xl border-2 border-linea p-4" :open="textosAbiertos || (modoEdicion && tieneTextos)">
            <summary class="cursor-pointer font-semibold">
              Textos de la cotización
              <span class="block text-sm font-normal text-gris">{{ tieneTextos ? resumenDeTextos : 'Opcional: si los dejas vacíos, la app usa textos generales.' }}</span>
            </summary>
            <div class="mt-3 flex flex-col gap-3">
              <p class="text-xs text-gris">Es lo que lee el cliente cuando pide una cotización de este servicio. Si dejas un campo vacío, la app usa un texto general.</p>
              <button type="button" class="btn-secundario !min-h-[44px]" @click="autocompletarTextos()">
                ✨ Autocompletar según el nombre
              </button>
              <p class="-mt-1 text-xs text-gris">Solo llena los campos vacíos; no cambia lo que ya escribiste.</p>
              <div>
                <label class="label-brutal" for="f-ptipo">Pregunta para elegir el artículo</label>
                <input id="f-ptipo" v-model="form.pregunta_tipo" class="input-brutal" type="text" maxlength="80" placeholder="Ej. ¿Qué piso es?" />
              </div>
              <div>
                <label class="label-brutal" for="f-pvar">Nombre de la segunda elección</label>
                <input id="f-pvar" v-model="form.pregunta_variante" class="input-brutal" type="text" maxlength="80" placeholder="Ej. Material, Tamaño o Acabado" />
              </div>
              <div>
                <label class="label-brutal" for="f-pcant">Pregunta de cantidad</label>
                <input id="f-pcant" v-model="form.pregunta_cantidad" class="input-brutal" type="text" maxlength="80" placeholder="Ej. ¿Cuántos metros cuadrados?" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label-brutal" for="f-unidad">Unidad</label>
                  <input id="f-unidad" v-model="form.unidad" class="input-brutal" type="text" maxlength="40" placeholder="Ej. m², sillas" />
                </div>
                <div>
                  <label class="label-brutal" for="f-max">Máximo por pedido</label>
                  <input id="f-max" v-model="form.cantidad_max" class="input-brutal" type="number" min="1" max="10000" step="1" inputmode="numeric" placeholder="99" />
                </div>
              </div>
              <div>
                <label class="label-brutal" for="f-nota">Aviso para el cliente</label>
                <textarea id="f-nota" v-model="form.nota" class="input-brutal" rows="2" maxlength="300" placeholder="Ej. Incluye zócalos." />
              </div>
            </div>
          </details>

          <p class="rounded-2xl bg-aqua-suave px-4 py-3 text-xs text-gris">
            Para que el servicio aparezca en la app, agrégale al menos una tarifa en la pestaña «Tarifas y precios».
          </p>
        </template>

        <!-- Tarifas: pasos guiados por categoría -->
        <template v-else-if="selected === 'tarifas'">
          <div>
            <label class="label-brutal" for="f-cat">1. ¿Qué se va a limpiar?</label>
            <p class="-mt-1 mb-1.5 text-xs text-gris">{{ categorias.map((c) => c.nombre).join(', ') }}.</p>
            <select id="f-cat" v-model="form.id_categoria" class="input-brutal" @change="alCambiarCategoria">
              <option value="" disabled>Elige una opción</option>
              <option v-for="c in categorias" :key="c.id_categoria" :value="c.id_categoria">{{ c.nombre }}</option>
            </select>
          </div>

          <div>
            <label class="label-brutal" for="f-serv">2. {{ contexto.pregunta }}</label>
            <p class="-mt-1 mb-1.5 text-xs text-gris">{{ contexto.ayudaArticulo }}</p>
            <select
              id="f-serv"
              v-model="form.servicioSel"
              class="input-brutal"
              :disabled="form.id_categoria === ''"
              @change="alCambiarServicio"
            >
              <option value="" disabled>{{ form.id_categoria === '' ? 'Primero elige qué se limpia' : 'Elige uno' }}</option>
              <optgroup v-if="serviciosCat.length" label="Ya existen">
                <option v-for="s in serviciosCat" :key="s" :value="s">{{ s }}</option>
              </optgroup>
              <optgroup v-if="extrasCat.length" label="Extras (se suman al total)">
                <option v-for="s in extrasCat" :key="s" :value="s">{{ s }}</option>
              </optgroup>
              <option :value="NUEVO">＋ Agregar uno nuevo…</option>
            </select>
            <input
              v-if="form.servicioSel === NUEVO"
              v-model="form.servicioNuevo"
              class="input-brutal mt-2"
              type="text"
              maxlength="100"
              :placeholder="sugerenciasCat?.ejemploArticulo ?? 'Nombre del artículo'"
              aria-label="Nombre del artículo nuevo"
            />
            <div v-if="chipsArticulo.length" class="mt-2">
              <p class="mb-1.5 text-xs text-gris">Toca uno para usarlo. Con ✓ ya lo tienes: se elige para agregarle otro material o tamaño.</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="c in chipsArticulo"
                  :key="c.texto"
                  type="button"
                  class="chip"
                  :aria-pressed="c.elegido"
                  :title="c.existente ? 'Ya existe' : undefined"
                  @click="usarArticulo(c)"
                >
                  {{ c.existente ? '✓ ' : '' }}{{ c.texto }}
                </button>
              </div>
            </div>
            <p v-if="form.servicioSel === NUEVO" class="mt-1 text-xs text-gris">
              Si es un extra (algo que se suma al servicio), empieza con «Extra:», por ejemplo «Extra: antiácaros».
            </p>
          </div>

          <div v-if="form.servicioSel !== '' && !esExtraSel">
            <label class="label-brutal" for="f-mat">3. {{ contexto.preguntaVariante }}</label>
            <p class="-mt-1 mb-1.5 text-xs text-gris">{{ contexto.ayudaVariante }}</p>
            <select id="f-mat" v-model="form.materialSel" class="input-brutal">
              <option value="" disabled>Elige una opción</option>
              <option :value="SIN">No aplica (precio único)</option>
              <option
                v-for="m in materialesCat"
                :key="m"
                :value="m"
                :disabled="materialesTomados.has(norm(m))"
              >
                {{ m }}{{ materialesTomados.has(norm(m)) ? ' · ya existe' : '' }}
              </option>
              <option :value="NUEVO">{{ contexto.opcionNueva }}</option>
            </select>
            <input
              v-if="form.materialSel === NUEVO"
              v-model="form.materialNuevo"
              class="input-brutal mt-2"
              type="text"
              maxlength="80"
              :placeholder="sugerenciasCat?.ejemploMaterial ?? contexto.ejemploNuevo"
              aria-label="Nombre de la variante nueva"
            />
            <div v-if="chipsMaterial.length" class="mt-2">
              <p class="mb-1.5 text-xs text-gris">Opciones habituales. Toca una para usarla.</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="c in chipsMaterial"
                  :key="c.texto"
                  type="button"
                  class="chip disabled:cursor-not-allowed disabled:opacity-45"
                  :aria-pressed="c.elegido"
                  :disabled="c.tomado"
                  @click="usarMaterial(c)"
                >
                  {{ c.texto }}{{ c.tomado ? ' · ya existe' : '' }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="form.servicioSel !== ''">
            <label class="label-brutal" for="f-precio">
              {{ esExtraSel ? '3.' : '4.' }} {{ etiquetaPrecio ? etiquetaPrecio.etiqueta : '¿Cuánto cuesta? (USD)' }}
            </label>
            <div class="flex items-center gap-3">
              <input
                id="f-precio"
                v-model="form.precio"
                class="input-brutal"
                type="number"
                min="0"
                step="0.01"
                inputmode="decimal"
                :placeholder="etiquetaPrecio?.placeholder ?? '0.00'"
                :aria-describedby="etiquetaPrecio ? 'f-precio-unidad' : undefined"
                @input="precioTocado = true"
              />
              <span v-if="etiquetaPrecio" id="f-precio-unidad" class="shrink-0 font-semibold text-gris">{{ etiquetaPrecio.unidad }}</span>
            </div>
            <p v-if="etiquetaPrecio?.pista" class="mt-1.5 text-xs text-gris">{{ etiquetaPrecio.pista }}</p>
            <p v-if="referencia" class="mt-1.5 text-xs text-gris">
              Referencia ({{ referencia.etiqueta }}): típico <strong class="text-tinta">{{ dinero(referencia.tipico) }}</strong>,
              de {{ dinero(referencia.min) }} a {{ dinero(referencia.max) }}.
              <button
                v-if="Number(form.precio) !== referencia.tipico"
                type="button"
                class="underline font-semibold text-gota cursor-pointer"
                @click="usarReferencia"
              >
                Usar {{ dinero(referencia.tipico) }}
              </button>
            </p>
          </div>

          <template v-if="!esExtraSel">
            <div>
              <label class="label-brutal" for="f-detalle">Detalle corto (opcional)</label>
              <input id="f-detalle" v-model="form.detalle" class="input-brutal" type="text" maxlength="80" :placeholder="sugerenciasCat?.detalle ?? 'Ej. Hasta 4 m²'" />
              <p class="mt-1 text-xs text-gris">Aparece pequeño debajo de esta opción en la cotización.</p>
            </div>
            <div>
              <label class="label-brutal" for="f-incluye">Qué incluye (opcional)</label>
              <textarea id="f-incluye" v-model="form.descTarifa" class="input-brutal" rows="2" maxlength="200" :placeholder="sugerenciasCat?.incluye ?? 'Ej. Qué se limpia y qué queda fuera.'" />
              <p class="mt-1 text-xs text-gris">Describe el artículo y se muestra igual en todos sus materiales o tamaños.</p>
            </div>
          </template>
        </template>

        <div v-if="vistaPrevia" class="rounded-2xl bg-aqua-suave px-4 py-3">
          <p class="text-xs text-gris">Así lo verá el cliente</p>
          <p class="mt-0.5 text-sm font-semibold">{{ vistaPrevia }}</p>
        </div>

        <label class="flex items-center gap-3 font-medium cursor-pointer">
          <input v-model="form.activo" type="checkbox" class="size-5 accent-[#1E5BD8]" />
          Visible para los clientes
        </label>

        <p v-if="errorForm" role="alert" class="bg-red-100 border-2 border-red-500 text-red-700 p-3 rounded-2xl text-sm">
          {{ errorForm }}
        </p>

        <div class="flex gap-3 pt-1">
          <button type="submit" class="btn-primario !min-h-[46px]" :disabled="guardando">
            {{ guardando ? 'Guardando...' : modoEdicion ? 'Guardar cambios' : `Crear ${config.singular}` }}
          </button>
          <button type="button" class="btn-secundario !min-h-[46px]" @click="cerrarPanel">Cancelar</button>
        </div>
          </form>
        </div>
      </Transition>
    </div>
  </section>
</template>

<style scoped>
/* Panel lateral */
.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.2s ease;
}
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
}
.panel-enter-active .panel-lateral,
.panel-leave-active .panel-lateral {
  transition: transform 0.25s ease;
}
.panel-enter-from .panel-lateral,
.panel-leave-to .panel-lateral {
  transform: translateX(100%);
}

@media (prefers-reduced-motion: reduce) {
  .panel-enter-active,
  .panel-leave-active,
  .panel-enter-active .panel-lateral,
  .panel-leave-active .panel-lateral {
    transition: none;
  }
}
</style>
