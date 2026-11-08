<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AvisoToast from './AvisoToast.vue'
import AppIcon from './AppIcon.vue'
import InterruptorZona from './InterruptorZona.vue'
import { useAviso } from '../composables/useAviso'
import { api, errorMessage } from '../services/api'
import {
  ZONAS_ESPERADAS,
  agruparPorDepartamento,
  conteoDeZonas,
  recargoValido,
  sinReconocerActivas,
  textoActivas,
  textoRecargo,
  zonasQueSeApaganAlDesactivar,
  zonasQueSeEnciendenAlReactivar,
  type ResumenDepartamento,
  type ZonaApi,
} from '../utils/zonas'

/**
 * Zonas de cobertura: departamentos → zonas → distritos.
 * Las zonas ya vienen del seeder (no se crean ni se borran aquí): solo se activan, se desactivan o se cambia su recargo.
 * Desactivar bloquea cotizaciones nuevas; los pedidos que ya existen siguen su curso.
 */
const route = useRoute()
const router = useRouter()
const { mensaje, avisar } = useAviso()

const lista = ref<ZonaApi[]>([])
const cargando = ref(false)
const error = ref('')
const errorAccion = ref('')
const trabajando = ref(false)

const grupos = computed(() => agruparPorDepartamento(lista.value))
const conteo = computed(() => conteoDeZonas(grupos.value))
const viejasActivas = computed(() => sinReconocerActivas(grupos.value))

/** Departamento abierto: vive en la dirección (?depto=…) para que «Atrás» del navegador funcione. */
const abierto = computed(() => {
  const nombre = route.query.depto
  return typeof nombre === 'string' ? (grupos.value.departamentos.find((d) => d.departamento === nombre) ?? null) : null
})
function abrir(d: ResumenDepartamento) {
  if (!d.zonas.length) return
  cerrarEdicion()
  confirmando.value = ''
  void router.push({ query: { depto: d.departamento } })
}
function volver() {
  cerrarEdicion()
  confirmando.value = ''
  void router.push({ query: {} })
}

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    lista.value = (await api.get<ZonaApi[]>('/zonas')).data
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    cargando.value = false
  }
}
onMounted(cargar)

function reemplazar(zona: ZonaApi) {
  lista.value = lista.value.map((z) => (z.id_zona === zona.id_zona ? { ...z, ...zona } : z))
}

// ---------- Activar y desactivar ----------
async function cambiarZona(zona: ZonaApi, activo: boolean) {
  if (trabajando.value) return
  trabajando.value = true
  errorAccion.value = ''
  try {
    const { data } = await api.put<ZonaApi>(`/zonas/${zona.id_zona}`, { activo })
    reemplazar(data)
    avisar(`${zona.nombre}: ${activo ? 'activada' : 'desactivada'}`)
  } catch (err) {
    errorAccion.value = errorMessage(err)
  } finally {
    trabajando.value = false
  }
}

/** Departamento al que se le está pidiendo confirmar la reactivación ('' = ninguno). */
const confirmando = ref('')

async function aplicarADepartamento(d: ResumenDepartamento, activo: boolean) {
  if (trabajando.value) return
  const objetivo = (activo ? zonasQueSeEnciendenAlReactivar(d) : zonasQueSeApaganAlDesactivar(d)).map((z) => z.zona)
  if (!objetivo.length) return
  trabajando.value = true
  errorAccion.value = ''
  confirmando.value = ''
  const resultados = await Promise.allSettled(objetivo.map((z) => api.put<ZonaApi>(`/zonas/${z.id_zona}`, { activo })))
  let fallidas = 0
  resultados.forEach((r) => {
    if (r.status === 'fulfilled') reemplazar(r.value.data)
    else fallidas++
  })
  trabajando.value = false
  const hechas = objetivo.length - fallidas
  if (hechas) avisar(`${d.departamento}: ${hechas} ${hechas === 1 ? 'zona' : 'zonas'} ${activo ? 'activadas' : 'desactivadas'}`)
  if (fallidas) {
    errorAccion.value = `No se pudieron cambiar ${fallidas} ${fallidas === 1 ? 'zona' : 'zonas'} de ${d.departamento}. Revisa la conexión e inténtalo de nuevo.`
    await cargar()
  }
}

/** El interruptor del departamento: si está todo activo se apaga; si no, se pide confirmar antes de encender. */
function alternarDepartamento(d: ResumenDepartamento) {
  errorAccion.value = ''
  if (d.estado === 'todas') void aplicarADepartamento(d, false)
  else confirmando.value = confirmando.value === d.departamento ? '' : d.departamento
}

const estadoInterruptor = (d: ResumenDepartamento) => (d.estado === 'todas' ? 'si' : d.estado === 'ninguna' ? 'no' : 'mixto')
const nombresApagadas = (d: ResumenDepartamento) => zonasQueSeEnciendenAlReactivar(d).map((z) => z.zona.nombre)

// ---------- Distritos (solo lectura) ----------
const distritosAbiertos = ref<number[]>([])
function alternarDistritos(id: number) {
  distritosAbiertos.value = distritosAbiertos.value.includes(id) ? distritosAbiertos.value.filter((i) => i !== id) : [...distritosAbiertos.value, id]
}

// ---------- Recargo ----------
const editandoId = ref<number | null>(null)
const recargoTexto = ref('')
const errorRecargo = ref('')
function editarRecargo(z: ZonaApi) {
  editandoId.value = z.id_zona
  recargoTexto.value = Number(z.recargo).toFixed(2)
  errorRecargo.value = ''
}
function cerrarEdicion() {
  editandoId.value = null
  errorRecargo.value = ''
}
async function guardarRecargo(z: ZonaApi) {
  const valor = recargoValido(recargoTexto.value)
  if (valor === null) {
    errorRecargo.value = 'Escribe un número de 0 en adelante, con hasta dos decimales.'
    return
  }
  if (trabajando.value) return
  trabajando.value = true
  try {
    const { data } = await api.put<ZonaApi>(`/zonas/${z.id_zona}`, { recargo: valor })
    reemplazar(data)
    avisar(`${z.nombre}: recargo de $${valor.toFixed(2)}`)
    cerrarEdicion()
  } catch (err) {
    errorRecargo.value = errorMessage(err)
  } finally {
    trabajando.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <AvisoToast :mensaje="mensaje" />

    <p class="text-sm text-gris">
      Desactivar una zona solo bloquea las cotizaciones nuevas: los pedidos que ya existen siguen su curso con normalidad.
    </p>

    <p v-if="cargando && !lista.length" class="text-gris" role="status">Cargando zonas…</p>
    <div v-else-if="error" class="card-brutal flex flex-wrap items-center justify-between gap-3 p-5" role="alert">
      <p class="font-semibold">{{ error }}</p>
      <button type="button" class="btn-secundario" @click="cargar">Reintentar</button>
    </div>

    <template v-else>
      <!-- Red de seguridad -->
      <div v-if="grupos.faltan.length" class="rounded-2xl border-2 border-sol bg-sol/15 p-4 text-sm" role="alert">
        <p class="font-semibold">Faltan {{ grupos.faltan.length }} de las {{ ZONAS_ESPERADAS.length }} zonas en esta base de datos.</p>
        <p class="mt-1 text-gris">
          {{ grupos.faltan.length > 6 ? grupos.faltan.slice(0, 6).join(', ') + '…' : grupos.faltan.join(', ') }}
        </p>
        <p class="mt-1">
          Desde <code class="font-semibold">Api-Rest</code> ejecuta
          <code class="font-semibold">php artisan db:seed --class=ZonasCoberturaSeeder</code> para crearlas; no hace falta borrar nada.
        </p>
      </div>
      <div v-if="viejasActivas.length" class="rounded-2xl border-2 border-sol bg-sol/15 p-4 text-sm" role="alert">
        <p class="font-semibold">Hay {{ viejasActivas.length }} {{ viejasActivas.length === 1 ? 'zona activa' : 'zonas activas' }} con un nombre que la app no reconoce: {{ viejasActivas.map((z) => z.nombre).join(', ') }}.</p>
        <p class="mt-1 text-gris">La app solo ofrece zonas con el formato «Departamento Región», así que los clientes no las ven. Para quitar este aviso desactívalas en la base de datos o corre el seeder.</p>
      </div>

      <p v-if="errorAccion" class="rounded-2xl border-2 border-tinta bg-white px-4 py-3 text-sm font-semibold" role="alert">{{ errorAccion }}</p>

      <!-- Nivel 1: departamentos -->
      <template v-if="!abierto">
        <p class="text-sm font-semibold" aria-live="polite">{{ conteo.activas }} de {{ conteo.total }} zonas activas en los 14 departamentos</p>

        <ul class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <li v-for="d in grupos.departamentos" :key="d.departamento" class="card-brutal flex flex-col gap-3 p-5">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="font-bricolage text-xl font-extrabold leading-tight">{{ d.departamento }}</h2>
                <p class="mt-0.5 text-sm" :class="d.estado === 'ninguna' && d.zonas.length ? 'font-semibold text-tinta' : 'text-gris'">{{ textoActivas(d) }}</p>
                <p v-if="d.zonas.length" class="text-sm text-gris">Recargo {{ textoRecargo(d.recargoMin, d.recargoMax) }}</p>
              </div>
              <InterruptorZona
                v-if="d.zonas.length"
                :estado="estadoInterruptor(d)"
                :etiqueta="d.estado === 'todas' ? `Desactivar todo ${d.departamento}` : `Reactivar ${d.departamento}`"
                :deshabilitado="trabajando"
                @cambiar="alternarDepartamento(d)"
              />
            </div>

            <!-- Confirmación antes de encender zonas -->
            <div v-if="confirmando === d.departamento" class="rounded-2xl bg-aqua-suave p-3 text-sm" role="alertdialog" :aria-label="`Reactivar ${d.departamento}`">
              <p class="font-semibold">
                Se {{ nombresApagadas(d).length === 1 ? 'encenderá 1 zona' : `encenderán ${nombresApagadas(d).length} zonas` }}:
              </p>
              <p class="mt-1">{{ nombresApagadas(d).join(', ') }}.</p>
              <p class="mt-1 text-gris">Si alguna estaba apagada a propósito, mejor ábrela y enciende solo las que necesites.</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <button type="button" class="btn-primario !min-h-[42px] !px-4 text-sm" :disabled="trabajando" @click="aplicarADepartamento(d, true)">Sí, reactivar</button>
                <button type="button" class="btn-secundario !min-h-[42px] !px-4 text-sm" @click="confirmando = ''">Cancelar</button>
              </div>
            </div>

            <button v-if="d.zonas.length" type="button" class="btn-secundario !min-h-[42px] mt-auto text-sm" @click="abrir(d)">
              Ver zonas ({{ d.zonas.length }})
            </button>
            <p v-else class="mt-auto text-sm text-gris">Aún no hay zonas de este departamento.</p>
          </li>
        </ul>
      </template>

      <!-- Nivel 2: zonas del departamento -->
      <template v-else>
        <nav class="flex flex-wrap items-center gap-2 text-sm" aria-label="Dónde estás">
          <button type="button" class="font-semibold underline cursor-pointer" @click="volver">Zonas</button>
          <span aria-hidden="true">›</span>
          <span class="font-semibold" aria-current="page">{{ abierto.departamento }}</span>
        </nav>

        <div class="card-brutal flex flex-col gap-4 p-5">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="font-bricolage text-2xl font-extrabold leading-tight">{{ abierto.departamento }}</h2>
              <p class="mt-0.5 text-sm text-gris">{{ textoActivas(abierto) }} · Recargo {{ textoRecargo(abierto.recargoMin, abierto.recargoMax) }}</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                v-if="abierto.activas > 0"
                type="button"
                class="btn-secundario !min-h-[42px] !px-4 text-sm"
                :disabled="trabajando"
                @click="aplicarADepartamento(abierto, false)"
              >
                Desactivar todas
              </button>
              <button
                v-if="abierto.activas < abierto.zonas.length"
                type="button"
                class="btn-secundario !min-h-[42px] !px-4 text-sm"
                :disabled="trabajando"
                @click="confirmando = confirmando === abierto.departamento ? '' : abierto.departamento"
              >
                Reactivar las apagadas
              </button>
            </div>
          </div>

          <div v-if="confirmando === abierto.departamento" class="rounded-2xl bg-aqua-suave p-3 text-sm" role="alertdialog" :aria-label="`Reactivar ${abierto.departamento}`">
            <p class="font-semibold">
              Se {{ nombresApagadas(abierto).length === 1 ? 'encenderá 1 zona' : `encenderán ${nombresApagadas(abierto).length} zonas` }}:
              {{ nombresApagadas(abierto).join(', ') }}.
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button type="button" class="btn-primario !min-h-[42px] !px-4 text-sm" :disabled="trabajando" @click="aplicarADepartamento(abierto, true)">Sí, reactivar</button>
              <button type="button" class="btn-secundario !min-h-[42px] !px-4 text-sm" @click="confirmando = ''">Cancelar</button>
            </div>
          </div>

          <ul class="divide-y divide-linea">
            <li v-for="z in abierto.zonas" :key="z.zona.id_zona" class="py-4 first:pt-0 last:pb-0">
              <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div class="min-w-[200px] flex-1">
                  <p class="font-semibold" :class="z.zona.activo ? '' : 'text-gris line-through'">{{ z.zona.nombre }}</p>
                  <button
                    type="button"
                    class="mt-0.5 cursor-pointer text-sm text-gris underline"
                    :aria-expanded="distritosAbiertos.includes(z.zona.id_zona)"
                    @click="alternarDistritos(z.zona.id_zona)"
                  >
                    {{ distritosAbiertos.includes(z.zona.id_zona) ? 'Ocultar' : 'Ver' }} distritos ({{ z.distritos.length }})
                  </button>
                </div>

                <div class="flex min-w-[210px] items-center gap-2">
                  <template v-if="editandoId === z.zona.id_zona">
                    <label class="sr-only" :for="`recargo-${z.zona.id_zona}`">Recargo de {{ z.zona.nombre }} (USD)</label>
                    <span aria-hidden="true">$</span>
                    <input
                      :id="`recargo-${z.zona.id_zona}`"
                      v-model="recargoTexto"
                      class="input-brutal !w-24 !px-3 !py-2"
                      type="text"
                      inputmode="decimal"
                      @keydown.enter.prevent="guardarRecargo(z.zona)"
                      @keydown.esc="cerrarEdicion"
                    />
                    <button type="button" class="btn-primario !min-h-[40px] !px-4 text-sm" :disabled="trabajando" @click="guardarRecargo(z.zona)">Guardar</button>
                    <button type="button" class="btn-secundario !min-h-[40px] !px-4 text-sm" @click="cerrarEdicion">Cancelar</button>
                  </template>
                  <template v-else>
                    <span class="text-gris">Recargo</span>
                    <strong>${{ Number(z.zona.recargo).toFixed(2) }}</strong>
                    <button type="button" class="cursor-pointer rounded-full p-2 hover:bg-aqua-suave" :aria-label="`Cambiar el recargo de ${z.zona.nombre}`" @click="editarRecargo(z.zona)">
                      <AppIcon name="edit" :size="18" />
                    </button>
                  </template>
                </div>

                <div class="flex items-center gap-2">
                  <span class="w-[78px] text-right text-sm" :class="z.zona.activo ? 'font-semibold' : 'text-gris'">{{ z.zona.activo ? 'Activa' : 'Desactivada' }}</span>
                  <InterruptorZona
                    :estado="z.zona.activo ? 'si' : 'no'"
                    :etiqueta="`${z.zona.activo ? 'Desactivar' : 'Activar'} ${z.zona.nombre}`"
                    :deshabilitado="trabajando"
                    @cambiar="cambiarZona(z.zona, !z.zona.activo)"
                  />
                </div>
              </div>

              <p v-if="editandoId === z.zona.id_zona && errorRecargo" class="mt-2 text-sm font-semibold" role="alert">{{ errorRecargo }}</p>
              <p v-if="distritosAbiertos.includes(z.zona.id_zona)" class="mt-2 rounded-2xl bg-hueso px-4 py-3 text-sm">
                <span class="font-semibold">Distritos que cubre (solo referencia): </span>{{ z.distritos.join(', ') }}.
              </p>
            </li>
          </ul>
        </div>
      </template>
    </template>
  </div>
</template>
