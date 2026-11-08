<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import AvisoToast from '../components/AvisoToast.vue'
import { useAviso } from '../composables/useAviso'
import { api, errorMessage } from '../services/api'
import { badgeReporte, numeroReporte } from '../utils/reportes'
import { badgeValoracion } from '../utils/valoraciones'
import { usePendientesStore } from '../stores/pendientes'
import {
  ESTADOS,
  anteriorEstado,
  badgePedido,
  coincide,
  enlaceWhatsapp,
  fechaLegible,
  numeroPedido,
  resumenPedido,
  siguienteEstado,
  textoLinea,
  usd,
  type EstadoPedido,
  type PedidoApi,
} from '../utils/pedidos'

const route = useRoute()
const pendientes = usePendientesStore()
const { mensaje, avisar } = useAviso()

const lista = ref<PedidoApi[]>([])
const cargando = ref(false)
const error = ref('')
const errorEstado = ref('')
const cambiando = ref(false)
const busqueda = ref('')
const filtro = ref<EstadoPedido | 'Todos'>('Todos')
const seleccionadoId = ref<number | null>(null)
/** Pedidos que llegaron mientras el panel estaba abierto y todavía no se han mirado. */
const recien = ref<Set<number>>(new Set())
let conocidos: Set<number> | null = null
let temporizador: ReturnType<typeof setInterval> | undefined

const visibles = computed(() =>
  lista.value.filter((p) => (filtro.value === 'Todos' || p.estado === filtro.value) && coincide(p, busqueda.value)),
)
const detalle = computed(() => lista.value.find((p) => p.id_pedido === seleccionadoId.value))
const conteo = computed(() => {
  const cuentas: Record<string, number> = { Todos: lista.value.length }
  for (const e of ESTADOS) cuentas[e] = lista.value.filter((p) => p.estado === e).length
  return cuentas
})
const siguiente = computed(() => (detalle.value ? siguienteEstado(detalle.value.estado) : null))
const anterior = computed(() => (detalle.value ? anteriorEstado(detalle.value.estado) : null))
const whatsapp = computed(() => enlaceWhatsapp(detalle.value?.usuario?.telefono))

async function cargar(silencioso = false) {
  if (!silencioso) {
    cargando.value = true
    error.value = ''
  }
  try {
    const { data } = await api.get<PedidoApi[]>('/admin/pedidos')
    // Después de la primera carga, lo que aparezca de más es un pedido que acaba de llegar.
    if (conocidos) {
      const nuevos = data.filter((p) => !conocidos!.has(p.id_pedido))
      if (nuevos.length) {
        nuevos.forEach((p) => recien.value.add(p.id_pedido))
        avisar(nuevos.length === 1 ? 'Llegó un pedido nuevo' : `Llegaron ${nuevos.length} pedidos nuevos`)
      }
    }
    conocidos = new Set(data.map((p) => p.id_pedido))
    lista.value = data
    if (!data.some((p) => p.id_pedido === seleccionadoId.value)) {
      // Si se llegó desde un reporte o una valoración (?ver=ID), se abre ese pedido.
      const verId = Number(route.query.ver)
      seleccionadoId.value = (data.find((p) => p.id_pedido === verId) ?? data[0])?.id_pedido ?? null
    }
    error.value = ''
  } catch (err) {
    // Si falla una actualización automática no se molesta a la persona; solo en cargas manuales.
    if (!silencioso) error.value = errorMessage(err)
  } finally {
    if (!silencioso) cargando.value = false
  }
}

function seleccionar(id: number) {
  seleccionadoId.value = id
  errorEstado.value = ''
  recien.value.delete(id)
}

async function cambiarEstado(nuevo: EstadoPedido) {
  const pedido = detalle.value
  if (!pedido || cambiando.value) return
  cambiando.value = true
  errorEstado.value = ''
  try {
    const { data } = await api.patch<PedidoApi>(`/admin/pedidos/${pedido.id_pedido}/estado`, { estado: nuevo })
    const i = lista.value.findIndex((p) => p.id_pedido === data.id_pedido)
    if (i >= 0) lista.value[i] = data
    avisar(`${numeroPedido(data.id_pedido)} · ${data.estado}`)
    void pendientes.refrescar()
  } catch (err) {
    errorEstado.value = errorMessage(err)
    void cargar(true)
  } finally {
    cambiando.value = false
  }
}

onMounted(() => {
  void cargar()
  // Los pedidos llegan desde la app del cliente: se revisa en silencio cada 20 s.
  temporizador = setInterval(() => {
    if (!document.hidden && !cambiando.value) void cargar(true)
  }, 20000)
})
onBeforeUnmount(() => clearInterval(temporizador))
</script>

<template>
  <section class="flex flex-col gap-6 max-w-7xl mx-auto">
    <AvisoToast :mensaje="mensaje" />

    <header class="flex items-start justify-between gap-4">
      <div>
        <h1 class="font-bricolage font-extrabold text-[40px] leading-none">Pedidos</h1>
        <p class="mt-2 text-gris">Revisa, confirma y cambia el estado de cada pedido.</p>
      </div>
      <button type="button" class="btn-secundario" :disabled="cargando" @click="cargar()">Actualizar</button>
    </header>

    <!-- Búsqueda y filtros -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="relative w-full max-w-[360px]">
        <label for="buscar-pedido" class="sr-only">Buscar por cliente, correo o número</label>
        <input id="buscar-pedido" v-model="busqueda" type="search" class="input-brutal !rounded-full pl-11" placeholder="Buscar por cliente o número" />
        <AppIcon name="search" :size="20" class="absolute left-4 top-1/2 -translate-y-1/2 text-gris" />
      </div>
      <button type="button" class="chip" :aria-pressed="filtro === 'Todos'" @click="filtro = 'Todos'">Todos · {{ conteo.Todos }}</button>
      <button v-for="e in ESTADOS" :key="e" type="button" class="chip" :aria-pressed="filtro === e" @click="filtro = e">
        {{ e }} · {{ conteo[e] }}
      </button>
    </div>

    <p v-if="error" role="alert" class="bg-red-100 border-2 border-red-500 text-red-700 p-4 rounded-2xl">
      {{ error }}
      <button type="button" class="underline font-semibold cursor-pointer" @click="cargar()">Reintentar</button>
    </p>
    <p v-if="cargando && !lista.length" class="text-center py-10 text-gris font-medium animate-pulse">Cargando pedidos...</p>
    <p
      v-else-if="!error && !lista.length"
      class="text-center py-10 text-gris border-2 border-dashed border-linea rounded-[24px]"
    >
      Todavía no hay pedidos. Cuando un cliente confirme uno en la app, aparecerá aquí.
    </p>

    <div v-else-if="!error" class="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-7 items-start">
      <!-- Lista -->
      <section class="card-brutal p-7 min-w-0">
        <div class="overflow-x-auto">
          <table class="tabla-brutal border-separate border-spacing-0">
            <thead>
              <tr><th>N.º</th><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Total</th><th>Estado</th></tr>
            </thead>
            <tbody>
              <tr
                v-for="p in visibles"
                :key="p.id_pedido"
                class="cursor-pointer"
                :class="{ 'fila-nueva': recien.has(p.id_pedido) }"
                :aria-selected="p.id_pedido === seleccionadoId"
                @click="seleccionar(p.id_pedido)"
              >
                <td>{{ numeroPedido(p.id_pedido) }}</td>
                <td class="font-semibold">{{ p.usuario?.nombre ?? 'Invitado' }}</td>
                <td class="text-gris">{{ resumenPedido(p.lineas) }}</td>
                <td class="whitespace-nowrap">{{ fechaLegible(p.fecha_servicio, p.franja_horaria) }}</td>
                <td>{{ usd(p.total) }}</td>
                <td><span :class="badgePedido[p.estado]">{{ p.estado }}</span></td>
              </tr>
              <tr v-if="!visibles.length">
                <td colspan="6" class="text-center text-gris py-8">Ningún pedido coincide con la búsqueda.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Detalle -->
      <section v-if="detalle" class="card-brutal p-7">
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-bricolage font-extrabold text-2xl">Pedido {{ numeroPedido(detalle.id_pedido) }}</h2>
          <span :class="badgePedido[detalle.estado]">{{ detalle.estado }}</span>
        </div>

        <div class="mt-4 text-sm leading-6">
          <p class="font-semibold text-base">{{ detalle.usuario?.nombre ?? 'Invitado' }}</p>
          <p class="text-gris">{{ [detalle.usuario?.telefono, detalle.usuario?.correo].filter(Boolean).join(' · ') }}</p>
          <p class="mt-2">{{ fechaLegible(detalle.fecha_servicio, detalle.franja_horaria) }}</p>
          <p class="text-gris">{{ detalle.zona?.nombre }} · {{ detalle.direccion }}</p>
        </div>

        <h3 class="mt-5 font-semibold">Servicios</h3>
        <ul class="mt-2 text-sm">
          <li v-for="l in detalle.lineas" :key="l.id_detalle" class="flex justify-between gap-3 py-1.5 border-b border-linea">
            <span>{{ textoLinea(l) }}</span><span class="whitespace-nowrap">{{ usd(l.subtotal) }}</span>
          </li>
          <li class="flex justify-between py-1.5 border-b border-linea">
            <span>Recargo por zona</span><span>{{ usd(detalle.recargo_zona) }}</span>
          </li>
        </ul>
        <p class="mt-3 flex items-baseline justify-between">
          <span class="font-semibold">Total</span>
          <span class="font-bricolage font-extrabold text-[32px] leading-none">{{ usd(detalle.total) }}</span>
        </p>

        <h3 class="mt-5 font-semibold">Estado del pedido</h3>
        <p v-if="errorEstado" role="alert" class="mt-2 bg-red-100 border-2 border-red-500 text-red-700 p-3 rounded-2xl text-sm">
          {{ errorEstado }}
        </p>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <button v-if="siguiente" type="button" class="btn-primario !min-h-[46px]" :disabled="cambiando" @click="cambiarEstado(siguiente)">
            {{ cambiando ? 'Guardando...' : `Pasar a ${siguiente}` }}
          </button>
          <p v-else class="text-sm font-semibold text-gota-profunda">Este pedido ya está finalizado.</p>
          <button
            v-if="anterior"
            type="button"
            class="text-sm underline font-semibold text-gris cursor-pointer disabled:opacity-50"
            :disabled="cambiando"
            @click="cambiarEstado(anterior)"
          >
            Volver a {{ anterior }}
          </button>
        </div>

        <template v-if="detalle.reportes?.length || detalle.valoracion">
          <h3 class="mt-5 font-semibold">Después del servicio</h3>
          <ul class="mt-2 flex flex-col gap-2 text-sm">
            <li v-for="r in detalle.reportes" :key="r.id_reporte" class="flex items-center justify-between gap-3">
              <RouterLink :to="{ path: '/reportes', query: { ver: r.id_reporte } }" class="underline font-semibold">
                Reporte {{ numeroReporte(r.id_reporte) }} · {{ r.motivo }}
              </RouterLink>
              <span :class="badgeReporte[r.estado]">{{ r.estado }}</span>
            </li>
            <li v-if="detalle.valoracion" class="flex items-center justify-between gap-3">
              <RouterLink :to="{ path: '/valoraciones', query: { ver: detalle.valoracion.id_valoracion } }" class="underline font-semibold">
                Valoración · {{ detalle.valoracion.estrellas }} de 5 estrellas
              </RouterLink>
              <span :class="badgeValoracion[detalle.valoracion.estado]">{{ detalle.valoracion.estado }}</span>
            </li>
          </ul>
        </template>

        <a
          v-if="whatsapp"
          :href="whatsapp"
          target="_blank"
          rel="noopener"
          class="btn-secundario !min-h-[46px] text-sm mt-5"
        >
          Escribir por WhatsApp
        </a>
      </section>
    </div>
  </section>
</template>
