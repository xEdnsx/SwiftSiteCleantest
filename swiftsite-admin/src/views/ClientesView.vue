<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import AvisoToast from '../components/AvisoToast.vue'
import { useAviso } from '../composables/useAviso'
import { api, errorMessage } from '../services/api'
import {
  coincideCliente,
  cuerpoCliente,
  haceTiempo,
  iniciales,
  resumenActividad,
  validarCliente,
  avisoDeAcceso,
  type ClienteApi,
  type FormCliente,
  type PerfilCliente,
} from '../utils/clientes'
import {
  badgePedido,
  enlaceWhatsapp,
  fechaLegible,
  numeroPedido,
  resumenPedido,
  usd,
  usdMiles,
} from '../utils/pedidos'

const { mensaje: aviso, avisar } = useAviso()

// ---------- Lista ----------
const lista = ref<ClienteApi[]>([])
const cargando = ref(true)
const error = ref('')
const busqueda = ref('')
const recienId = ref<number | null>(null)
const errorAccion = ref('')
const confirmandoId = ref<number | null>(null)
let temporizadorReciente: ReturnType<typeof setTimeout> | undefined

const visibles = computed(() => lista.value.filter((c) => coincideCliente(c, busqueda.value)))

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const { data } = await api.get<ClienteApi[]>('/admin/clientes')
    lista.value = data
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    cargando.value = false
  }
}

/** Sube el cliente al principio de la lista y lo resalta unos segundos. */
function destacar(cliente: ClienteApi) {
  lista.value = [cliente, ...lista.value.filter((c) => c.id_usuario !== cliente.id_usuario)]
  busqueda.value = ''
  recienId.value = cliente.id_usuario
  clearTimeout(temporizadorReciente)
  temporizadorReciente = setTimeout(() => (recienId.value = null), 4500)
}

// ---------- Crear / editar ----------
const panelAbierto = ref(false)
const editandoId = ref<number | null>(null)
const form = reactive<FormCliente>({ nombre: '', telefono: '', correo: '' })
const errorForm = ref('')
const guardando = ref(false)
const formRef = ref<HTMLFormElement | null>(null)
const modoEdicion = computed(() => editandoId.value !== null)
/** Si el cliente que se edita ya tiene cuenta en la app. */
const editandoConCuenta = ref(false)
const avisoAcceso = computed(() => avisoDeAcceso(form, editandoConCuenta.value))

function limpiarForm() {
  editandoId.value = null
  editandoConCuenta.value = false
  errorForm.value = ''
  Object.assign(form, { nombre: '', telefono: '', correo: '' })
}
function enfocarPrimerCampo() {
  void nextTick(() => formRef.value?.querySelector<HTMLElement>('input')?.focus())
}
function abrirNuevo() {
  limpiarForm()
  panelAbierto.value = true
  enfocarPrimerCampo()
}
function abrirEdicion(cliente: ClienteApi) {
  limpiarForm()
  editandoId.value = cliente.id_usuario
  Object.assign(form, { nombre: cliente.nombre, telefono: cliente.telefono ?? '', correo: cliente.correo ?? '' })
  editandoConCuenta.value = cliente.tiene_acceso
  panelAbierto.value = true
  enfocarPrimerCampo()
}
function cerrarPanel() {
  panelAbierto.value = false
  limpiarForm()
}

async function guardar() {
  errorForm.value = validarCliente(form)
  if (errorForm.value || guardando.value) return
  guardando.value = true
  try {
    const cuerpo = cuerpoCliente(form)
    const { data } = editandoId.value === null
      ? await api.post<ClienteApi>('/admin/clientes', cuerpo)
      : await api.patch<ClienteApi>(`/admin/clientes/${editandoId.value}`, cuerpo)
    const nuevo = editandoId.value === null
    destacar(data)
    if (perfil.value?.id_usuario === data.id_usuario) Object.assign(perfil.value, data)
    cerrarPanel()
    avisar(nuevo ? 'Cliente agregado' : 'Cambios guardados')
  } catch (err) {
    errorForm.value = errorMessage(err)
  } finally {
    guardando.value = false
  }
}

// ---------- Eliminar ----------
function pedirEliminar(cliente: ClienteApi) {
  errorAccion.value = ''
  if (cliente.pedidos_count > 0) {
    errorAccion.value = `${cliente.nombre} tiene ${cliente.pedidos_count} ${cliente.pedidos_count === 1 ? 'pedido' : 'pedidos'}: no se puede eliminar para conservar su historial.`
    return
  }
  confirmandoId.value = cliente.id_usuario
}
async function eliminar(cliente: ClienteApi) {
  confirmandoId.value = null
  errorAccion.value = ''
  try {
    await api.delete(`/admin/clientes/${cliente.id_usuario}`)
    lista.value = lista.value.filter((c) => c.id_usuario !== cliente.id_usuario)
    if (perfil.value?.id_usuario === cliente.id_usuario) cerrarPerfil()
    avisar('Cliente eliminado')
  } catch (err) {
    errorAccion.value = errorMessage(err)
  }
}

// ---------- Perfil ----------
const perfilAbierto = ref(false)
const perfil = ref<PerfilCliente | null>(null)
const cargandoPerfil = ref(false)
const errorPerfil = ref('')
let perfilRequest = 0

const whatsapp = computed(() => enlaceWhatsapp(perfil.value?.telefono))

async function abrirPerfil(cliente: ClienteApi) {
  const actual = ++perfilRequest
  perfilAbierto.value = true
  perfil.value = null
  errorPerfil.value = ''
  cargandoPerfil.value = true
  try {
    const { data } = await api.get<PerfilCliente>(`/admin/clientes/${cliente.id_usuario}`)
    if (actual === perfilRequest) perfil.value = data
  } catch (err) {
    if (actual === perfilRequest) errorPerfil.value = errorMessage(err)
  } finally {
    if (actual === perfilRequest) cargandoPerfil.value = false
  }
}
function cerrarPerfil() {
  perfilRequest++
  perfilAbierto.value = false
  perfil.value = null
}

function alTeclear(evento: KeyboardEvent) {
  if (evento.key !== 'Escape') return
  if (panelAbierto.value) cerrarPanel()
  else if (perfilAbierto.value) cerrarPerfil()
}

onMounted(() => {
  window.addEventListener('keydown', alTeclear)
  void cargar()
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', alTeclear)
  clearTimeout(temporizadorReciente)
})
</script>

<template>
  <section class="flex flex-col gap-6 max-w-7xl mx-auto">
    <header class="flex items-start justify-between gap-4">
      <div>
        <h1 class="font-bricolage font-extrabold text-[40px] leading-none">Clientes</h1>
        <p class="mt-2 text-gris">Consulta su historial, agrega clientes nuevos o corrige sus datos.</p>
      </div>
      <button type="button" class="btn-primario" @click="abrirNuevo">+ Nuevo cliente</button>
    </header>

    <div class="relative w-full max-w-[420px]">
      <label for="buscar-cliente" class="sr-only">Buscar por nombre, correo o teléfono</label>
      <input id="buscar-cliente" v-model="busqueda" type="search" class="input-brutal !rounded-full pl-11" placeholder="Buscar por nombre, correo o teléfono" />
      <AppIcon name="search" :size="20" class="absolute left-4 top-1/2 -translate-y-1/2 text-gris" />
    </div>

    <p v-if="errorAccion" role="alert" class="rounded-xl border-2 border-tinta bg-sol/40 px-4 py-3 text-sm font-semibold">{{ errorAccion }}</p>

    <section class="card-brutal p-7">
      <p v-if="cargando" class="py-8 text-center text-gris">Cargando clientes…</p>
      <div v-else-if="error" class="flex flex-col items-center gap-3 py-8 text-center">
        <p role="alert" class="font-semibold">{{ error }}</p>
        <button type="button" class="btn-secundario !min-h-[44px]" @click="cargar">Reintentar</button>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="tabla-brutal border-separate border-spacing-0">
          <thead>
            <tr><th>Cliente</th><th>Contacto</th><th>Pedidos</th><th>Total gastado</th><th>Último pedido</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            <tr v-for="c in visibles" :key="c.id_usuario" :class="{ 'fila-nueva': c.id_usuario === recienId }" :aria-selected="c.id_usuario === perfil?.id_usuario">
              <td>
                <button type="button" class="flex cursor-pointer items-center gap-3 text-left" :aria-label="`Ver perfil de ${c.nombre}`" @click="abrirPerfil(c)">
                  <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-tinta bg-aqua-suave text-sm font-bold" aria-hidden="true">{{ iniciales(c.nombre) }}</span>
                  <span class="font-semibold underline-offset-4 hover:underline">{{ c.nombre }}</span>
                </button>
              </td>
              <td>
                {{ c.telefono || 'Sin teléfono' }}<br />
                <span class="text-gris">{{ c.correo || 'Sin correo' }}</span>
              </td>
              <td>{{ c.pedidos_count }}</td>
              <td>{{ usdMiles(c.total_gastado) }}</td>
              <td class="text-gris">{{ haceTiempo(c.ultimo_pedido) }}</td>
              <td>
                <div v-if="confirmandoId === c.id_usuario" class="flex items-center gap-2 text-sm">
                  <span class="font-semibold">¿Eliminar?</span>
                  <button type="button" class="chip !py-1" @click="eliminar(c)">Sí</button>
                  <button type="button" class="chip !py-1" @click="confirmandoId = null">No</button>
                </div>
                <div v-else class="flex items-center gap-3">
                  <button type="button" class="chip !py-1 !px-3" @click="abrirPerfil(c)">Ver perfil</button>
                  <button type="button" :aria-label="`Editar ${c.nombre}`" class="cursor-pointer" @click="abrirEdicion(c)"><AppIcon name="edit" :size="20" /></button>
                  <button
                    type="button"
                    :aria-label="`Eliminar ${c.nombre}`"
                    :title="c.pedidos_count ? 'Tiene pedidos: no se puede eliminar' : 'Eliminar'"
                    :class="['cursor-pointer', c.pedidos_count ? 'opacity-40' : '']"
                    @click="pedirEliminar(c)"
                  ><AppIcon name="trash" :size="20" /></button>
                </div>
              </td>
            </tr>
            <tr v-if="!visibles.length">
              <td colspan="6" class="py-8 text-center text-gris">
                {{ lista.length ? 'Ningún cliente coincide con la búsqueda.' : 'Aún no hay clientes. Agrega el primero con «+ Nuevo cliente».' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Panel lateral: crear / editar -->
    <Transition name="panel">
      <div v-if="panelAbierto" class="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" :aria-label="modoEdicion ? 'Editar cliente' : 'Nuevo cliente'">
        <div class="absolute inset-0 bg-tinta/40" @click="cerrarPanel" />
        <form ref="formRef" class="panel-lateral relative flex h-full w-full max-w-[440px] flex-col gap-4 overflow-y-auto border-l-2 border-tinta bg-white p-7" novalidate @submit.prevent="guardar">
          <div class="flex items-start justify-between gap-4">
            <h2 class="font-bricolage font-extrabold text-2xl">{{ modoEdicion ? 'Editar cliente' : 'Nuevo cliente' }}</h2>
            <button type="button" aria-label="Cerrar" class="cursor-pointer rounded-full p-1.5 hover:bg-aqua-suave" @click="cerrarPanel">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>

          <div>
            <label class="label-brutal" for="cli-nombre">Nombre completo</label>
            <input id="cli-nombre" v-model="form.nombre" class="input-brutal" type="text" maxlength="120" placeholder="Ej. María Hernández" autocomplete="off" />
          </div>
          <div>
            <label class="label-brutal" for="cli-tel">Teléfono</label>
            <input id="cli-tel" v-model="form.telefono" class="input-brutal" type="tel" maxlength="25" placeholder="Ej. 7000-1111" autocomplete="off" />
            <p class="mt-1 text-xs text-gris">Con este número podrás escribirle por WhatsApp desde Pedidos.</p>
          </div>
          <div>
            <label class="label-brutal" for="cli-correo">Correo <span class="font-normal text-gris">(si lo tienes)</span></label>
            <input id="cli-correo" v-model="form.correo" class="input-brutal" type="email" maxlength="150" placeholder="Ej. maria@correo.com" autocomplete="off" />
            <p class="mt-1 text-xs text-gris">No es obligatorio, pero hace falta al menos un teléfono o un correo.</p>
          </div>

          <p v-if="avisoAcceso" class="rounded-xl bg-aqua-suave px-4 py-3 text-sm text-gris" aria-live="polite">{{ avisoAcceso }}</p>
          <p v-else class="rounded-xl bg-aqua-suave px-4 py-3 text-sm text-gris">
            La dirección no se pide aquí: el cliente la escribe en cada cotización desde la app.
          </p>

          <p v-if="errorForm" role="alert" class="rounded-xl border-2 border-tinta bg-sol/40 px-4 py-3 text-sm font-semibold">{{ errorForm }}</p>

          <div class="mt-auto flex gap-3 pt-2">
            <button type="submit" class="btn-primario !min-h-[46px]" :disabled="guardando">{{ guardando ? 'Guardando…' : modoEdicion ? 'Guardar cambios' : 'Agregar cliente' }}</button>
            <button type="button" class="btn-secundario !min-h-[46px]" @click="cerrarPanel">Cancelar</button>
          </div>
        </form>
      </div>
    </Transition>

    <!-- Panel lateral: perfil del cliente -->
    <Transition name="panel">
      <div v-if="perfilAbierto" class="fixed inset-0 z-30 flex justify-end" role="dialog" aria-modal="true" aria-label="Perfil del cliente">
        <div class="absolute inset-0 bg-tinta/40" @click="cerrarPerfil" />
        <aside class="panel-lateral relative flex h-full w-full max-w-[520px] flex-col gap-5 overflow-y-auto border-l-2 border-tinta bg-white p-7">
          <div class="flex items-start justify-between gap-4">
            <h2 class="font-bricolage font-extrabold text-2xl">Perfil del cliente</h2>
            <button type="button" aria-label="Cerrar" class="cursor-pointer rounded-full p-1.5 hover:bg-aqua-suave" @click="cerrarPerfil">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>

          <p v-if="cargandoPerfil" class="py-6 text-center text-gris">Cargando perfil…</p>
          <p v-else-if="errorPerfil" role="alert" class="rounded-xl border-2 border-tinta bg-sol/40 px-4 py-3 text-sm font-semibold">{{ errorPerfil }}</p>

          <template v-else-if="perfil">
            <div class="flex items-center gap-4">
              <span class="grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 border-tinta bg-aqua-suave text-xl font-bold" aria-hidden="true">{{ iniciales(perfil.nombre) }}</span>
              <div class="min-w-0">
                <p class="truncate font-bricolage text-xl font-extrabold">{{ perfil.nombre }}</p>
                <p class="truncate text-sm text-gris">{{ perfil.correo || 'Sin correo' }}</p>
                <p class="text-sm text-gris">{{ perfil.telefono || 'Sin teléfono' }}</p>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3 text-center">
              <div class="rounded-xl border-2 border-tinta p-3"><p class="font-bricolage text-2xl font-extrabold">{{ perfil.pedidos_count }}</p><p class="text-xs text-gris">Pedidos</p></div>
              <div class="rounded-xl border-2 border-tinta p-3"><p class="font-bricolage text-2xl font-extrabold">{{ perfil.servicios_finalizados }}</p><p class="text-xs text-gris">Servicios terminados</p></div>
              <div class="rounded-xl border-2 border-tinta p-3"><p class="font-bricolage text-2xl font-extrabold">{{ usdMiles(perfil.total_gastado) }}</p><p class="text-xs text-gris">Total gastado</p></div>
            </div>

            <p class="text-sm text-gris">
              {{ resumenActividad(perfil) }}
              <span v-if="!perfil.tiene_acceso"> · Aún no tiene cuenta en la app.</span>
            </p>

            <div class="flex flex-wrap gap-3">
              <a v-if="whatsapp" :href="whatsapp" target="_blank" rel="noopener noreferrer" class="btn-primario !min-h-[44px]">Escribir por WhatsApp</a>
              <button type="button" class="btn-secundario !min-h-[44px]" @click="abrirEdicion(perfil)">Editar datos</button>
            </div>

            <section aria-labelledby="historial">
              <h3 id="historial" class="mb-3 font-bricolage text-lg font-extrabold">Historial de pedidos</h3>
              <p v-if="!perfil.pedidos.length" class="rounded-xl bg-aqua-suave px-4 py-3 text-sm text-gris">Todavía no tiene pedidos.</p>
              <ul v-else class="flex flex-col gap-3">
                <li v-for="p in perfil.pedidos" :key="p.id_pedido" class="rounded-xl border-2 border-tinta p-4">
                  <div class="flex items-center justify-between gap-3">
                    <span class="font-semibold">{{ numeroPedido(p.id_pedido) }}</span>
                    <span :class="badgePedido[p.estado]">{{ p.estado }}</span>
                  </div>
                  <p class="mt-1 text-sm">{{ resumenPedido(p.lineas) }}</p>
                  <div class="mt-1 flex items-center justify-between gap-3 text-sm text-gris">
                    <span>{{ fechaLegible(p.fecha_servicio, p.franja_horaria) }}<template v-if="p.zona"> · {{ p.zona.nombre }}</template></span>
                    <span class="font-semibold text-tinta">{{ usd(p.total) }}</span>
                  </div>
                </li>
              </ul>
            </section>
          </template>
        </aside>
      </div>
    </Transition>

    <AvisoToast :mensaje="aviso" />
  </section>
</template>

<style scoped>
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
