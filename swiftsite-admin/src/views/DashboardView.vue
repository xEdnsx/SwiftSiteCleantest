<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { api, errorMessage } from '../services/api'
import { usePendientesStore } from '../stores/pendientes'
import {
  badgePedido,
  colorAgenda,
  fechaISO,
  fechaLargaEs,
  minutosDeFranja,
  numeroPedido,
  resumenPedido,
  saludoPorHora,
  usd,
  usdMiles,
  type PedidoApi,
} from '../utils/pedidos'

interface Resumen {
  fecha: string
  pedidos_hoy: number
  por_confirmar: number
  ingresos_mes: string
  clientes: number
  recientes: PedidoApi[]
  agenda_hoy: PedidoApi[]
}

const pendientes = usePendientesStore()
/** Cosas que esperan al equipo; los enlaces llevan directo a cada pantalla. */
const atencion = computed(() => [
  { texto: 'Pedidos por confirmar', n: pendientes.datos.pedidos_por_confirmar, to: '/pedidos' },
  { texto: 'Reportes abiertos', n: pendientes.datos.reportes_abiertos, to: '/reportes' },
  { texto: 'Valoraciones por revisar', n: pendientes.datos.valoraciones_pendientes, to: '/valoraciones' },
])

const resumen = ref<Resumen | null>(null)
const cargando = ref(true)
const error = ref('')
const ahora = ref(new Date())
let temporizador: ReturnType<typeof setInterval> | undefined

const bordeAgenda = { aqua: 'border-aqua', gota: 'border-gota', sol: 'border-sol' } as const

const saludo = computed(() => saludoPorHora(ahora.value.getHours()))
const fechaTexto = computed(() => fechaLargaEs(ahora.value))
const agenda = computed(() =>
  [...(resumen.value?.agenda_hoy ?? [])].sort(
    (a, b) => minutosDeFranja(a.franja_horaria) - minutosDeFranja(b.franja_horaria) || a.id_pedido - b.id_pedido,
  ),
)

async function cargar(silencioso = false) {
  if (!silencioso) {
    cargando.value = true
    error.value = ''
  }
  ahora.value = new Date()
  try {
    // "Hoy" lo decide el navegador (hora local); el servidor trabaja en UTC.
    const { data } = await api.get<Resumen>('/admin/resumen', { params: { fecha: fechaISO(ahora.value) } })
    resumen.value = data
    error.value = ''
  } catch (err) {
    // Una actualización automática que falla no molesta; solo se avisa en cargas manuales.
    if (!silencioso) error.value = errorMessage(err)
  } finally {
    if (!silencioso) cargando.value = false
  }
}

onMounted(() => {
  void cargar()
  temporizador = setInterval(() => {
    if (!document.hidden) void cargar(true)
  }, 30000)
})
onBeforeUnmount(() => clearInterval(temporizador))
</script>

<template>
  <section class="flex flex-col gap-7 max-w-7xl mx-auto">
    <!-- Encabezado -->
    <header class="flex items-start justify-between gap-4">
      <div>
        <h1 class="font-bricolage font-extrabold text-[40px] leading-none">{{ saludo }}</h1>
        <p class="mt-2 text-gris">{{ fechaTexto }} · Esto es lo de hoy.</p>
      </div>
      <RouterLink to="/pedidos" class="btn-primario !min-h-[52px]">Ver pedidos</RouterLink>
    </header>

    <p v-if="cargando && !resumen" class="py-10 text-center text-gris">Cargando el resumen…</p>

    <div v-else-if="error && !resumen" class="card-brutal flex flex-col items-center gap-3 p-8 text-center">
      <p role="alert" class="font-semibold">{{ error }}</p>
      <button type="button" class="btn-secundario !min-h-[44px]" @click="cargar()">Reintentar</button>
    </div>

    <template v-else-if="resumen">
      <!-- Tarjetas KPI -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div class="card-brutal p-6">
          <p class="text-gris">Pedidos de hoy</p>
          <p class="font-bricolage font-extrabold text-[40px] leading-none mt-2">{{ resumen.pedidos_hoy }}</p>
        </div>
        <div class="card-brutal p-6">
          <p class="text-gris">Por confirmar</p>
          <p class="font-bricolage font-extrabold text-[40px] leading-none mt-2">{{ resumen.por_confirmar }}</p>
        </div>
        <div class="rounded-[24px] border-2 border-tinta bg-tinta p-6 text-white">
          <p class="text-menu">Ingresos del mes</p>
          <p class="font-bricolage font-extrabold text-[40px] leading-none mt-2 text-cielo">{{ usdMiles(resumen.ingresos_mes) }}</p>
          <p class="mt-2 text-xs text-menu">Servicios finalizados este mes</p>
        </div>
        <div class="card-brutal p-6">
          <p class="text-gris">Clientes registrados</p>
          <p class="font-bricolage font-extrabold text-[40px] leading-none mt-2">{{ resumen.clientes }}</p>
        </div>
      </div>

      <!-- Pendientes del equipo -->
      <section aria-labelledby="atencion-titulo" class="card-brutal p-6">
        <h2 id="atencion-titulo" class="font-bricolage font-extrabold text-2xl mb-4">Necesita tu atención</h2>
        <ul class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <li v-for="a in atencion" :key="a.to">
            <RouterLink
              :to="a.to"
              class="flex items-center justify-between gap-3 rounded-2xl border-2 px-5 py-4 transition-colors hover:bg-aqua-suave"
              :class="a.n > 0 ? 'border-tinta bg-sol/30' : 'border-linea'"
            >
              <span class="font-semibold">{{ a.texto }}</span>
              <span class="font-bricolage font-extrabold text-3xl leading-none" :class="a.n === 0 && 'text-gris'">{{ a.n }}</span>
            </RouterLink>
          </li>
        </ul>
      </section>

      <!-- Pedidos recientes + agenda -->
      <div class="grid grid-cols-1 xl:grid-cols-[1fr_348px] gap-7 items-start">
        <section class="card-brutal p-7">
          <div class="flex items-baseline justify-between mb-5">
            <h2 class="font-bricolage font-extrabold text-2xl">Pedidos recientes</h2>
            <RouterLink to="/pedidos" class="text-sm font-medium text-gota underline">Ver todos</RouterLink>
          </div>
          <div class="overflow-x-auto">
            <table class="tabla-brutal">
              <thead>
                <tr><th>N.º</th><th>Cliente</th><th>Servicio</th><th>Total</th><th>Estado</th></tr>
              </thead>
              <tbody>
                <tr v-for="p in resumen.recientes" :key="p.id_pedido">
                  <td>{{ numeroPedido(p.id_pedido) }}</td>
                  <td class="font-semibold">{{ p.usuario?.nombre ?? 'Sin cliente' }}</td>
                  <td>{{ resumenPedido(p.lineas) }}</td>
                  <td>{{ usd(p.total) }}</td>
                  <td><span :class="badgePedido[p.estado]">{{ p.estado }}</span></td>
                </tr>
                <tr v-if="!resumen.recientes.length">
                  <td colspan="5" class="py-8 text-center text-gris">Todavía no hay pedidos. Aparecerán aquí cuando un cliente cotice desde la app.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="card-brutal p-7">
          <h2 class="font-bricolage font-extrabold text-2xl mb-5">Agenda de hoy</h2>
          <p v-if="!agenda.length" class="rounded-xl bg-aqua-suave px-4 py-3 text-sm text-gris">No hay servicios programados para hoy.</p>
          <ul v-else class="flex flex-col gap-3.5">
            <li v-for="cita in agenda" :key="cita.id_pedido" class="flex gap-4">
              <span class="w-16 shrink-0 pt-2 font-bricolage text-sm font-extrabold leading-tight">{{ cita.franja_horaria }}</span>
              <div class="flex-1 bg-hueso rounded-xl border-l-4 px-3.5 py-2.5" :class="bordeAgenda[colorAgenda(cita.estado)]">
                <p class="font-semibold">{{ cita.usuario?.nombre ?? 'Sin cliente' }}</p>
                <p class="text-sm text-gris">{{ resumenPedido(cita.lineas) }}<template v-if="cita.zona"> · {{ cita.zona.nombre }}</template></p>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </section>
</template>
