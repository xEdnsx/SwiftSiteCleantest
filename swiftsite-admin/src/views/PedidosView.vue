<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { badgePedido, pedidos, usd, type EstadoPedido } from '../data/muestras'

// Pantalla visual con datos de ejemplo (ver data/muestras.ts). Aún no usa la API.
const estados: EstadoPedido[] = ['Cotizado', 'Confirmado', 'En proceso', 'Finalizado']

const lista = ref(pedidos.map((p) => ({ ...p })))
const busqueda = ref('')
const filtro = ref<EstadoPedido | 'Todos'>('Todos')
const seleccionado = ref(lista.value[2]?.numero ?? '')
const nuevoEstado = ref<EstadoPedido>('En proceso')

const visibles = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return lista.value.filter(
    (p) => (filtro.value === 'Todos' || p.estado === filtro.value)
      && (!q || p.cliente.toLowerCase().includes(q) || p.numero.toLowerCase().includes(q)),
  )
})
const detalle = computed(() => lista.value.find((p) => p.numero === seleccionado.value))

function seleccionar(numero: string) {
  seleccionado.value = numero
  const p = lista.value.find((x) => x.numero === numero)
  if (p) nuevoEstado.value = p.estado
}
function guardarEstado() {
  if (detalle.value) detalle.value.estado = nuevoEstado.value
}
const whatsapp = computed(() => `https://wa.me/503${(detalle.value?.telefono ?? '').replace(/\D/g, '')}`)
</script>

<template>
  <section class="flex flex-col gap-6 max-w-7xl mx-auto">
    <header class="flex items-start justify-between gap-4">
      <div>
        <h1 class="font-bricolage font-extrabold text-[40px] leading-none">Pedidos</h1>
        <p class="mt-2 text-gris">Revisa, confirma y cambia el estado de cada pedido.</p>
      </div>
      <button type="button" class="btn-primario">+ Nuevo pedido</button>
    </header>

    <!-- Búsqueda y filtros -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="relative w-full max-w-[360px]">
        <label for="buscar-pedido" class="sr-only">Buscar por cliente o número</label>
        <input id="buscar-pedido" v-model="busqueda" type="search" class="input-brutal !rounded-full pl-11" placeholder="Buscar por cliente o número" />
        <AppIcon name="search" :size="20" class="absolute left-4 top-1/2 -translate-y-1/2 text-gris" />
      </div>
      <button type="button" class="chip" :aria-pressed="filtro === 'Todos'" @click="filtro = 'Todos'">Todos</button>
      <button v-for="e in estados" :key="e" type="button" class="chip" :aria-pressed="filtro === e" @click="filtro = e">{{ e }}</button>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-7 items-start">
      <!-- Lista -->
      <section class="card-brutal p-7">
        <div class="overflow-x-auto">
          <table class="tabla-brutal">
            <thead>
              <tr><th>N.º</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th></tr>
            </thead>
            <tbody>
              <tr
                v-for="p in visibles" :key="p.numero" class="cursor-pointer"
                :aria-selected="p.numero === seleccionado" @click="seleccionar(p.numero)"
              >
                <td>{{ p.numero }}</td>
                <td class="font-semibold">{{ p.cliente }}</td>
                <td class="whitespace-nowrap">{{ p.fecha }}</td>
                <td>{{ usd(p.total) }}</td>
                <td><span :class="badgePedido[p.estado]">{{ p.estado }}</span></td>
              </tr>
              <tr v-if="!visibles.length"><td colspan="5" class="text-center text-gris py-8">Ningún pedido coincide con la búsqueda.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Detalle -->
      <section v-if="detalle" class="card-brutal p-7">
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-bricolage font-extrabold text-2xl">Pedido {{ detalle.numero }}</h2>
          <span :class="badgePedido[detalle.estado]">{{ detalle.estado }}</span>
        </div>

        <div class="mt-4 text-sm leading-6">
          <p class="font-semibold text-base">{{ detalle.cliente }}</p>
          <p class="text-gris">{{ detalle.telefono }} · {{ detalle.correo }}</p>
          <p class="text-gris">{{ detalle.direccion }}</p>
        </div>

        <h3 class="mt-5 font-semibold">Servicios</h3>
        <ul class="mt-2 text-sm">
          <li v-for="l in detalle.lineas" :key="l.detalle" class="flex justify-between py-1.5 border-b border-linea">
            <span>{{ l.detalle }}</span><span>{{ usd(l.importe) }}</span>
          </li>
          <li class="flex justify-between py-1.5 border-b border-linea">
            <span>Recargo por zona</span><span>{{ usd(detalle.recargo) }}</span>
          </li>
        </ul>
        <p class="mt-3 flex items-baseline justify-between">
          <span class="font-semibold">Total</span>
          <span class="font-bricolage font-extrabold text-[32px] leading-none">{{ usd(detalle.total) }}</span>
        </p>

        <h3 class="mt-5 font-semibold">Cambiar estado</h3>
        <div class="mt-2 flex flex-wrap gap-2">
          <button v-for="e in estados" :key="e" type="button" class="chip" :aria-pressed="nuevoEstado === e" @click="nuevoEstado = e">{{ e }}</button>
        </div>

        <div class="mt-5 flex flex-wrap gap-3">
          <button type="button" class="btn-primario !min-h-[46px]" @click="guardarEstado">Guardar cambio</button>
          <a :href="whatsapp" target="_blank" rel="noopener" class="btn-secundario !min-h-[46px] text-sm">Escribir por WhatsApp</a>
        </div>
      </section>
    </div>
  </section>
</template>
