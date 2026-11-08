<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import AvisoToast from '../components/AvisoToast.vue'
import { useAviso } from '../composables/useAviso'
import { api, errorMessage } from '../services/api'
import { usePendientesStore } from '../stores/pendientes'
import { enlaceWhatsapp, fechaLegible, numeroPedido, resumenPedido, usd } from '../utils/pedidos'
import {
  ESTADOS_REPORTE,
  MAX_RESPUESTA,
  badgeReporte,
  coincide,
  conteoPorEstado,
  estaAbierto,
  fechaCorta,
  hayCambios,
  numeroReporte,
  sugerenciaDe,
  validarCambio,
  type EstadoReporte,
  type ReporteApi,
} from '../utils/reportes'

const route = useRoute()
const pendientes = usePendientesStore()
const { mensaje, avisar } = useAviso()

const lista = ref<ReporteApi[]>([])
const cargando = ref(false)
const error = ref('')
const errorGuardar = ref('')
const guardando = ref(false)
const busqueda = ref('')
const filtro = ref<EstadoReporte | 'Todos'>('Todos')
const seleccionadoId = ref<number | null>(null)
/** Lo que se está escribiendo en el panel de detalle (aún sin guardar). */
const estadoNuevo = ref<EstadoReporte>('Recibido')
const respuestaNueva = ref('')
let temporizador: ReturnType<typeof setInterval> | undefined

const visibles = computed(() =>
  lista.value.filter((r) => (filtro.value === 'Todos' || r.estado === filtro.value) && coincide(r, busqueda.value)),
)
const conteo = computed(() => conteoPorEstado(lista.value))
const detalle = computed(() => lista.value.find((r) => r.id_reporte === seleccionadoId.value))
const problema = computed(() => (detalle.value ? validarCambio(estadoNuevo.value, respuestaNueva.value) : ''))
const cambiado = computed(() => !!detalle.value && hayCambios(detalle.value, estadoNuevo.value, respuestaNueva.value))
const whatsapp = computed(() => enlaceWhatsapp(detalle.value?.usuario?.telefono))
const puedeGuardar = computed(() => cambiado.value && !problema.value && !guardando.value)

/** Carga el formulario del panel con lo que ya está guardado del reporte elegido. */
function llenarFormulario() {
  estadoNuevo.value = detalle.value?.estado ?? 'Recibido'
  respuestaNueva.value = detalle.value?.respuesta ?? ''
  errorGuardar.value = ''
}

function seleccionar(id: number) {
  if (id === seleccionadoId.value) return
  seleccionadoId.value = id
  llenarFormulario()
}

async function cargar(silencioso = false) {
  if (!silencioso) {
    cargando.value = true
    error.value = ''
  }
  try {
    const { data } = await api.get<ReporteApi[]>('/admin/reportes')
    // Si no hay nada escrito sin guardar, el formulario se pone al día con lo que dice el servidor.
    const sinEscribir = !cambiado.value
    lista.value = data
    if (sinEscribir && data.some((r) => r.id_reporte === seleccionadoId.value)) llenarFormulario()
    const verId = Number(route.query.ver)
    if (seleccionadoId.value === null || !data.some((r) => r.id_reporte === seleccionadoId.value)) {
      const porLink = Number.isFinite(verId) && verId > 0 ? data.find((r) => r.id_reporte === verId) : undefined
      seleccionadoId.value = (porLink ?? data[0])?.id_reporte ?? null
      llenarFormulario()
    }
    error.value = ''
  } catch (err) {
    // Una actualización automática que falla no molesta; solo se avisa en cargas manuales.
    if (!silencioso) error.value = errorMessage(err)
  } finally {
    if (!silencioso) cargando.value = false
  }
}

async function guardar() {
  const reporte = detalle.value
  if (!reporte || !puedeGuardar.value) return
  guardando.value = true
  errorGuardar.value = ''
  try {
    const { data } = await api.patch<ReporteApi>(`/admin/reportes/${reporte.id_reporte}`, {
      estado: estadoNuevo.value,
      respuesta: respuestaNueva.value.trim(),
    })
    const i = lista.value.findIndex((r) => r.id_reporte === data.id_reporte)
    if (i >= 0) lista.value[i] = data
    llenarFormulario()
    avisar(`${numeroReporte(data.id_reporte)} · ${data.estado}`)
    void pendientes.refrescar()
  } catch (err) {
    errorGuardar.value = errorMessage(err)
  } finally {
    guardando.value = false
  }
}

function usarSugerencia() {
  if (detalle.value) respuestaNueva.value = sugerenciaDe(detalle.value.motivo)
}

// Si llega otro enlace ?ver=… estando en la pantalla, se salta a ese reporte.
watch(() => route.query.ver, (ver) => {
  const id = Number(ver)
  if (id && lista.value.some((r) => r.id_reporte === id)) {
    filtro.value = 'Todos'
    busqueda.value = ''
    seleccionar(id)
  }
})

onMounted(() => {
  void cargar()
  // Los reportes llegan desde la app del cliente: se revisa en silencio cada 30 s (sin pisar lo que se escribe).
  temporizador = setInterval(() => {
    if (!document.hidden && !guardando.value) void cargar(true)
  }, 30000)
})
onBeforeUnmount(() => clearInterval(temporizador))
</script>

<template>
  <section class="flex flex-col gap-6 max-w-7xl mx-auto">
    <AvisoToast :mensaje="mensaje" />

    <header class="flex items-start justify-between gap-4">
      <div>
        <h1 class="font-bricolage font-extrabold text-[40px] leading-none">Reportes</h1>
        <p class="mt-2 text-gris">Problemas que los clientes cuentan desde la app. Respóndeles y ciérralos aquí.</p>
      </div>
      <button type="button" class="btn-secundario" :disabled="cargando" @click="cargar()">Actualizar</button>
    </header>

    <div class="flex flex-wrap items-center gap-3">
      <div class="relative w-full max-w-[360px]">
        <label for="buscar-reporte" class="sr-only">Buscar por cliente, correo, R-0001 o #0001</label>
        <input id="buscar-reporte" v-model="busqueda" type="search" class="input-brutal !rounded-full pl-11" placeholder="Buscar por cliente, R-0001 o #0001" />
        <AppIcon name="search" :size="20" class="absolute left-4 top-1/2 -translate-y-1/2 text-gris" />
      </div>
      <button type="button" class="chip" :aria-pressed="filtro === 'Todos'" @click="filtro = 'Todos'">Todos · {{ conteo.Todos }}</button>
      <button v-for="e in ESTADOS_REPORTE" :key="e" type="button" class="chip" :aria-pressed="filtro === e" @click="filtro = e">
        {{ e }} · {{ conteo[e] }}
      </button>
    </div>

    <p v-if="error" role="alert" class="bg-red-100 border-2 border-red-500 text-red-700 p-4 rounded-2xl">
      {{ error }}
      <button type="button" class="underline font-semibold cursor-pointer" @click="cargar()">Reintentar</button>
    </p>
    <p v-if="cargando && !lista.length" class="text-center py-10 text-gris font-medium animate-pulse">Cargando reportes...</p>
    <p
      v-else-if="!error && !lista.length"
      class="text-center py-10 text-gris border-2 border-dashed border-linea rounded-[24px]"
    >
      Todavía no hay reportes. Cuando un cliente cuente un problema desde Mis pedidos, aparecerá aquí.
    </p>

    <div v-else-if="!error" class="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-7 items-start">
      <!-- Lista -->
      <section class="card-brutal p-7 min-w-0">
        <div class="overflow-x-auto">
          <table class="tabla-brutal border-separate border-spacing-0">
            <thead>
              <tr><th>N.º</th><th>Cliente</th><th>Motivo</th><th>Pedido</th><th>Enviado</th><th>Estado</th></tr>
            </thead>
            <tbody>
              <tr
                v-for="r in visibles"
                :key="r.id_reporte"
                class="cursor-pointer"
                :aria-selected="r.id_reporte === seleccionadoId"
                @click="seleccionar(r.id_reporte)"
              >
                <td class="whitespace-nowrap">{{ numeroReporte(r.id_reporte) }}</td>
                <td class="font-semibold">{{ r.usuario?.nombre ?? 'Cuenta eliminada' }}</td>
                <td class="text-gris">{{ r.motivo }}</td>
                <td class="whitespace-nowrap">{{ numeroPedido(r.id_pedido) }}</td>
                <td class="whitespace-nowrap text-gris">{{ fechaCorta(r.fecha_creacion) }}</td>
                <td class="whitespace-nowrap"><span :class="badgeReporte[r.estado]">{{ r.estado }}</span></td>
              </tr>
              <tr v-if="!visibles.length">
                <td colspan="6" class="text-center text-gris py-8">Ningún reporte coincide con la búsqueda.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Detalle -->
      <section v-if="detalle" class="card-brutal p-7">
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-bricolage font-extrabold text-2xl">Reporte {{ numeroReporte(detalle.id_reporte) }}</h2>
          <span :class="badgeReporte[detalle.estado]">{{ detalle.estado }}</span>
        </div>

        <div class="mt-4 text-sm leading-6">
          <p class="font-semibold text-base">{{ detalle.usuario?.nombre ?? 'Cuenta eliminada' }}</p>
          <p class="text-gris">{{ [detalle.usuario?.telefono, detalle.usuario?.correo].filter(Boolean).join(' · ') }}</p>
          <p class="text-gris">Enviado el {{ fechaCorta(detalle.fecha_creacion) }}</p>
        </div>

        <h3 class="mt-5 font-semibold">{{ detalle.motivo }}</h3>
        <p class="mt-1 text-sm leading-6 whitespace-pre-line break-words">{{ detalle.descripcion }}</p>

        <div v-if="detalle.pedido" class="mt-5 rounded-2xl border-2 border-linea p-4 text-sm leading-6">
          <p class="flex items-center justify-between gap-3">
            <span class="font-semibold">Pedido {{ numeroPedido(detalle.pedido.id_pedido) }} · {{ detalle.pedido.estado }}</span>
            <span class="whitespace-nowrap">{{ usd(detalle.pedido.total) }}</span>
          </p>
          <p class="text-gris">{{ resumenPedido(detalle.pedido.lineas) }}</p>
          <p class="text-gris">{{ fechaLegible(detalle.pedido.fecha_servicio, detalle.pedido.franja_horaria) }}</p>
          <p class="text-gris">{{ detalle.pedido.zona?.nombre }} · {{ detalle.pedido.direccion }}</p>
          <RouterLink :to="{ path: '/pedidos', query: { ver: detalle.pedido.id_pedido } }" class="mt-2 inline-block font-semibold underline">
            Abrir el pedido
          </RouterLink>
        </div>

        <!-- Reporte resuelto: solo lectura -->
        <template v-if="!estaAbierto(detalle.estado)">
          <h3 class="mt-6 font-semibold">Respuesta enviada al cliente</h3>
          <p class="mt-2 rounded-2xl bg-aqua-suave px-4 py-3 text-sm leading-6 whitespace-pre-line break-words">{{ detalle.respuesta }}</p>
          <p class="mt-2 text-sm text-gris">Resuelto el {{ fechaCorta(detalle.fecha_actualizacion || detalle.fecha_creacion) }} · ya no se puede editar. Si el problema vuelve, el cliente puede enviar otro reporte desde la app.</p>
          <a v-if="whatsapp" :href="whatsapp" target="_blank" rel="noopener" class="btn-secundario !min-h-[46px] text-sm mt-4">Escribir por WhatsApp</a>
        </template>

        <!-- Reporte abierto: se responde y se cambia el estado -->
        <template v-else>
          <h3 class="mt-6 font-semibold">Tu respuesta</h3>
          <fieldset class="mt-2">
            <legend class="sr-only">Estado del reporte</legend>
            <div class="flex flex-wrap gap-2">
              <button v-for="e in ESTADOS_REPORTE" :key="e" type="button" class="chip" :aria-pressed="estadoNuevo === e" @click="estadoNuevo = e">
                {{ e }}
              </button>
            </div>
          </fieldset>

          <label for="respuesta-reporte" class="label-brutal mt-4 block">Mensaje para el cliente (lo verá en la app)</label>
          <textarea
            id="respuesta-reporte"
            v-model="respuestaNueva"
            class="input-brutal mt-1.5 min-h-[120px] resize-y"
            :maxlength="MAX_RESPUESTA"
            placeholder="Cuéntale qué vamos a hacer para resolverlo."
          />
          <div class="mt-1.5 flex items-center justify-between gap-3 text-sm text-gris">
            <button type="button" class="underline font-semibold cursor-pointer" @click="usarSugerencia">Usar una respuesta de ejemplo</button>
            <span>{{ respuestaNueva.length }}/{{ MAX_RESPUESTA }}</span>
          </div>

          <p v-if="problema && cambiado" role="alert" class="mt-3 bg-red-100 border-2 border-red-500 text-red-700 p-3 rounded-2xl text-sm">
            {{ problema }}
          </p>
          <p v-if="errorGuardar" role="alert" class="mt-3 bg-red-100 border-2 border-red-500 text-red-700 p-3 rounded-2xl text-sm">
            {{ errorGuardar }}
          </p>

          <div class="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" class="btn-primario !min-h-[46px]" :disabled="!puedeGuardar" @click="guardar">
              {{ guardando ? 'Guardando...' : estadoNuevo === 'Resuelto' ? 'Resolver y enviar' : 'Guardar respuesta' }}
            </button>
            <a v-if="whatsapp" :href="whatsapp" target="_blank" rel="noopener" class="btn-secundario !min-h-[46px] text-sm">Escribir por WhatsApp</a>
          </div>
          <p v-if="estadoNuevo === 'Resuelto'" class="mt-3 text-sm text-gris">Al resolverlo ya no podrás editar este reporte.</p>
        </template>
      </section>
    </div>
  </section>
</template>
