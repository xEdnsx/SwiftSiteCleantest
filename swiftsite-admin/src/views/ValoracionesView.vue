<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import AvisoToast from '../components/AvisoToast.vue'
import { useAviso } from '../composables/useAviso'
import { api, errorMessage } from '../services/api'
import { usePendientesStore } from '../stores/pendientes'
import { fechaLegible, numeroPedido, resumenPedido } from '../utils/pedidos'
import { fechaCorta } from '../utils/reportes'
import {
  ESTADOS_VALORACION,
  accionesDe,
  MAXIMO_EN_APP,
  badgeValoracion,
  conteoPorEstado,
  etiquetaAspecto,
  etiquetaAspectos,
  etiquetaEstado,
  gustoConEstrellas,
  hayLugarEnLaApp,
  nombreAbreviado,
  promedio,
  verboDe,
  type EstadoValoracion,
  type ValoracionApi,
} from '../utils/valoraciones'

const route = useRoute()
const pendientes = usePendientesStore()
const { mensaje, avisar } = useAviso()

const lista = ref<ValoracionApi[]>([])
const cargando = ref(false)
const error = ref('')
const errorAccion = ref('')
const trabajando = ref(false)
const confirmandoBorrado = ref(false)
const filtro = ref<EstadoValoracion | 'Todas'>('Todas')
const seleccionadaId = ref<number | null>(null)
let temporizador: ReturnType<typeof setInterval> | undefined

const visibles = computed(() => lista.value.filter((v) => filtro.value === 'Todas' || v.estado === filtro.value))
const conteo = computed(() => conteoPorEstado(lista.value))
const detalle = computed(() => lista.value.find((v) => v.id_valoracion === seleccionadaId.value))
const hayLugar = computed(() => hayLugarEnLaApp(lista.value))

function seleccionar(id: number) {
  if (id === seleccionadaId.value) return
  seleccionadaId.value = id
  errorAccion.value = ''
  confirmandoBorrado.value = false
}

async function cargar(silencioso = false) {
  if (!silencioso) {
    cargando.value = true
    error.value = ''
  }
  try {
    const { data } = await api.get<ValoracionApi[]>('/admin/valoraciones')
    lista.value = data
    if (!data.some((v) => v.id_valoracion === seleccionadaId.value)) {
      const verId = Number(route.query.ver)
      seleccionadaId.value = (data.find((v) => v.id_valoracion === verId) ?? data[0])?.id_valoracion ?? null
      confirmandoBorrado.value = false
    }
    error.value = ''
  } catch (err) {
    if (!silencioso) error.value = errorMessage(err)
  } finally {
    if (!silencioso) cargando.value = false
  }
}

async function cambiar(destino: EstadoValoracion) {
  const v = detalle.value
  if (!v || trabajando.value) return
  trabajando.value = true
  errorAccion.value = ''
  try {
    const { data } = await api.patch<ValoracionApi>(`/admin/valoraciones/${v.id_valoracion}`, { estado: destino })
    const i = lista.value.findIndex((x) => x.id_valoracion === data.id_valoracion)
    if (i >= 0) lista.value[i] = data
    avisar(destino === 'Publicada' ? 'Ahora se muestra en la app' : destino === 'Oculta' ? 'Ya no se muestra en la app' : 'Valoración por revisar')
    void pendientes.refrescar()
  } catch (err) {
    errorAccion.value = errorMessage(err)
  } finally {
    trabajando.value = false
  }
}

async function eliminar() {
  const v = detalle.value
  if (!v || trabajando.value) return
  trabajando.value = true
  errorAccion.value = ''
  try {
    await api.delete(`/admin/valoraciones/${v.id_valoracion}`)
    lista.value = lista.value.filter((x) => x.id_valoracion !== v.id_valoracion)
    seleccionadaId.value = (visibles.value[0] ?? lista.value[0])?.id_valoracion ?? null
    confirmandoBorrado.value = false
    avisar('Valoración eliminada')
    void pendientes.refrescar()
  } catch (err) {
    errorAccion.value = errorMessage(err)
  } finally {
    trabajando.value = false
  }
}

watch(() => route.query.ver, (ver) => {
  const id = Number(ver)
  if (id && lista.value.some((v) => v.id_valoracion === id)) {
    filtro.value = 'Todas'
    seleccionar(id)
  }
})

onMounted(() => {
  void cargar()
  temporizador = setInterval(() => {
    if (!document.hidden && !trabajando.value) void cargar(true)
  }, 30000)
})
onBeforeUnmount(() => clearInterval(temporizador))
</script>

<template>
  <section class="flex flex-col gap-6 max-w-7xl mx-auto">
    <AvisoToast :mensaje="mensaje" />

    <header class="flex items-start justify-between gap-4">
      <div>
        <h1 class="font-bricolage font-extrabold text-[40px] leading-none">Valoraciones</h1>
        <p class="mt-2 text-gris">Aquí ves todas las opiniones, buenas o malas. Tú eliges cuáles se muestran en el Inicio de la app (hasta {{ MAXIMO_EN_APP }}).</p>
      </div>
      <button type="button" class="btn-secundario" :disabled="cargando" @click="cargar()">Actualizar</button>
    </header>

    <div class="grid grid-cols-1 sm:grid-cols-4 gap-5 max-w-4xl">
      <div class="card-brutal p-6">
        <p class="text-gris">Promedio</p>
        <p class="font-bricolage font-extrabold text-[40px] leading-none mt-2 flex items-center gap-2">
          {{ promedio(lista) }} <AppIcon name="star" :size="28" filled class="text-sol" />
        </p>
      </div>
      <div class="card-brutal p-6">
        <p class="text-gris">Valoraciones</p>
        <p class="font-bricolage font-extrabold text-[40px] leading-none mt-2">{{ conteo.Todas }}</p>
      </div>
      <div class="card-brutal p-6">
        <p class="text-gris">Por revisar</p>
        <p class="font-bricolage font-extrabold text-[40px] leading-none mt-2">{{ conteo.Pendiente }}</p>
      </div>
      <div class="card-brutal p-6">
        <p class="text-gris">En la app</p>
        <p class="font-bricolage font-extrabold text-[40px] leading-none mt-2">{{ conteo.Publicada }}<span class="text-xl text-gris"> de {{ MAXIMO_EN_APP }}</span></p>
      </div>
    </div>

    <div class="flex flex-wrap gap-3">
      <button type="button" class="chip" :aria-pressed="filtro === 'Todas'" @click="filtro = 'Todas'">Todas · {{ conteo.Todas }}</button>
      <button v-for="e in ESTADOS_VALORACION" :key="e" type="button" class="chip" :aria-pressed="filtro === e" @click="filtro = e">
        {{ e === 'Pendiente' ? 'Por revisar' : e === 'Publicada' ? 'En la app' : 'Ocultas' }} · {{ conteo[e] }}
      </button>
    </div>

    <p v-if="error" role="alert" class="bg-red-100 border-2 border-red-500 text-red-700 p-4 rounded-2xl">
      {{ error }}
      <button type="button" class="underline font-semibold cursor-pointer" @click="cargar()">Reintentar</button>
    </p>
    <p v-if="cargando && !lista.length" class="text-center py-10 text-gris font-medium animate-pulse">Cargando valoraciones...</p>
    <p
      v-else-if="!error && !lista.length"
      class="text-center py-10 text-gris border-2 border-dashed border-linea rounded-[24px]"
    >
      Todavía no hay valoraciones. Cuando un cliente califique un pedido finalizado, aparecerá aquí para que decidas si se muestra en la app.
    </p>

    <div v-else-if="!error" class="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-7 items-start">
      <section class="card-brutal p-7 min-w-0">
        <div class="overflow-x-auto">
          <table class="tabla-brutal border-separate border-spacing-0">
            <thead>
              <tr><th>Cliente</th><th>Pedido</th><th>Estrellas</th><th>Comentario</th><th>Estado</th></tr>
            </thead>
            <tbody>
              <tr
                v-for="v in visibles"
                :key="v.id_valoracion"
                class="cursor-pointer"
                :aria-selected="v.id_valoracion === seleccionadaId"
                @click="seleccionar(v.id_valoracion)"
              >
                <td class="font-semibold">{{ v.usuario?.nombre ?? 'Cuenta eliminada' }}</td>
                <td class="whitespace-nowrap">{{ numeroPedido(v.id_pedido) }}</td>
                <td>
                  <span class="flex gap-0.5" role="img" :aria-label="`${v.estrellas} de 5 estrellas`">
                    <AppIcon v-for="n in 5" :key="n" name="star" :size="18" :filled="n <= v.estrellas" :class="n <= v.estrellas ? 'text-sol' : 'text-linea'" />
                  </span>
                </td>
                <td class="max-w-[150px] truncate text-gris">{{ v.comentario || 'Sin comentario' }}</td>
                <td class="whitespace-nowrap"><span :class="badgeValoracion[v.estado]">{{ etiquetaEstado[v.estado] }}</span></td>
              </tr>
              <tr v-if="!visibles.length">
                <td colspan="5" class="text-center text-gris py-8">No hay valoraciones en este filtro.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="detalle" class="card-brutal p-7">
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-bricolage font-extrabold text-2xl">Valoración</h2>
          <span :class="badgeValoracion[detalle.estado]">{{ etiquetaEstado[detalle.estado] }}</span>
        </div>

        <p class="mt-4 font-semibold">{{ detalle.usuario?.nombre ?? 'Cuenta eliminada' }}</p>
        <p class="text-sm text-gris">{{ detalle.usuario?.correo }}</p>
        <p class="text-sm text-gris">Enviada el {{ fechaCorta(detalle.fecha_creacion) }}</p>

        <span class="mt-3 flex gap-1" role="img" :aria-label="`${detalle.estrellas} de 5 estrellas`">
          <AppIcon v-for="n in 5" :key="n" name="star" :size="26" :filled="n <= detalle.estrellas" :class="n <= detalle.estrellas ? 'text-sol' : 'text-linea'" />
        </span>

        <div v-if="detalle.aspectos.length" class="mt-3">
          <p class="text-xs font-semibold text-gris">{{ etiquetaAspectos(detalle.estrellas) }}</p>
          <ul class="mt-1 flex flex-wrap gap-2">
            <li v-for="a in detalle.aspectos" :key="a" :class="gustoConEstrellas(detalle.estrellas) ? 'badge-confirmado' : 'badge-pendiente'">{{ etiquetaAspecto(a, detalle.estrellas) }}</li>
          </ul>
        </div>
        <p class="mt-3 text-sm leading-6 whitespace-pre-line break-words">{{ detalle.comentario || 'El cliente no dejó comentario.' }}</p>

        <div v-if="detalle.pedido" class="mt-5 rounded-2xl border-2 border-linea p-4 text-sm leading-6">
          <p class="font-semibold">Pedido {{ numeroPedido(detalle.pedido.id_pedido) }}</p>
          <p class="text-gris">{{ resumenPedido(detalle.pedido.lineas) }}</p>
          <p class="text-gris">{{ fechaLegible(detalle.pedido.fecha_servicio, detalle.pedido.franja_horaria) }}</p>
          <RouterLink :to="{ path: '/pedidos', query: { ver: detalle.pedido.id_pedido } }" class="mt-2 inline-block font-semibold underline">Abrir el pedido</RouterLink>
        </div>

        <p v-if="detalle.estado === 'Publicada'" class="mt-4 rounded-2xl bg-aqua-suave px-4 py-3 text-sm">
          Así se ve en la app: <strong>{{ nombreAbreviado(detalle.usuario?.nombre) }}</strong>, sin correo ni teléfono.
        </p>
        <p v-else-if="!hayLugar" class="mt-4 rounded-2xl bg-sol/15 px-4 py-3 text-sm font-semibold">
          Ya hay {{ MAXIMO_EN_APP }} opiniones en la app. Oculta una para poder mostrar esta.
        </p>

        <p v-if="errorAccion" role="alert" class="mt-4 bg-red-100 border-2 border-red-500 text-red-700 p-3 rounded-2xl text-sm">{{ errorAccion }}</p>

        <div class="mt-5 flex flex-wrap items-center gap-3">
          <button
            v-for="(destino, i) in accionesDe(detalle.estado)"
            :key="destino"
            type="button"
            :class="i === 0 ? 'btn-primario !min-h-[46px]' : 'btn-secundario !min-h-[46px]'"
            :disabled="trabajando || (destino === 'Publicada' && !hayLugar)"
            @click="cambiar(destino)"
          >
            {{ verboDe(destino) }}
          </button>
        </div>

        <div class="mt-5 border-t-2 border-linea pt-4">
          <button v-if="!confirmandoBorrado" type="button" class="flex items-center gap-2 text-sm font-semibold text-gris underline cursor-pointer" @click="confirmandoBorrado = true">
            <AppIcon name="trash" :size="18" /> Eliminar valoración
          </button>
          <div v-else class="flex flex-wrap items-center gap-3 text-sm">
            <span class="font-semibold">Se borra para siempre. ¿Eliminar?</span>
            <button type="button" class="btn-primario !min-h-[40px] !bg-red-600" :disabled="trabajando" @click="eliminar">Sí, eliminar</button>
            <button type="button" class="underline font-semibold cursor-pointer" @click="confirmandoBorrado = false">Cancelar</button>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>
