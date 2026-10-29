<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { badgeValoracion, valoraciones, type EstadoValoracion } from '../data/muestras'

// Pantalla visual con datos de ejemplo (ver data/muestras.ts). Aún no usa la API.
const filtros = ['Todas', 'Pendientes', 'Publicadas', 'Ocultas'] as const
type Filtro = (typeof filtros)[number]
const mapa: Record<Exclude<Filtro, 'Todas'>, EstadoValoracion> = { Pendientes: 'Pendiente', Publicadas: 'Publicada', Ocultas: 'Oculta' }

const lista = ref(valoraciones.map((v) => ({ ...v })))
const filtro = ref<Filtro>('Todas')

const visibles = computed(() => {
  const f = filtro.value
  return f === 'Todas' ? lista.value : lista.value.filter((v) => v.estado === mapa[f])
})
const porAprobar = computed(() => lista.value.filter((v) => v.estado === 'Pendiente').length)
const promedio = computed(() => (lista.value.reduce((a, v) => a + v.estrellas, 0) / (lista.value.length || 1)).toFixed(1))

function cambiar(id: number, estado: EstadoValoracion) {
  const v = lista.value.find((x) => x.id === id)
  if (v) v.estado = estado
}
function eliminar(id: number) {
  lista.value = lista.value.filter((v) => v.id !== id)
}
</script>

<template>
  <section class="flex flex-col gap-6 max-w-7xl mx-auto">
    <header>
      <h1 class="font-bricolage font-extrabold text-[40px] leading-none">Valoraciones</h1>
      <p class="mt-2 text-gris">Lo que opinan los clientes. Solo se publican las que apruebas.</p>
    </header>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl">
      <div class="card-brutal p-6">
        <p class="text-gris">Promedio</p>
        <p class="font-bricolage font-extrabold text-[40px] leading-none mt-2 flex items-center gap-2">
          {{ promedio }} <AppIcon name="star" :size="28" filled class="text-sol" />
        </p>
      </div>
      <div class="card-brutal p-6">
        <p class="text-gris">Valoraciones</p>
        <p class="font-bricolage font-extrabold text-[40px] leading-none mt-2">{{ lista.length }}</p>
      </div>
      <div class="card-brutal p-6">
        <p class="text-gris">Por aprobar</p>
        <p class="font-bricolage font-extrabold text-[40px] leading-none mt-2">{{ porAprobar }}</p>
      </div>
    </div>

    <div class="flex flex-wrap gap-3">
      <button v-for="f in filtros" :key="f" type="button" class="chip" :aria-pressed="filtro === f" @click="filtro = f">{{ f }}</button>
    </div>

    <section class="card-brutal p-7">
      <div class="overflow-x-auto">
        <table class="tabla-brutal">
          <thead>
            <tr><th>Cliente</th><th>Servicio</th><th>Estrellas</th><th>Comentario</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            <tr v-for="v in visibles" :key="v.id">
              <td class="font-semibold">{{ v.cliente }}</td>
              <td>{{ v.servicio }}</td>
              <td>
                <span class="flex gap-0.5 text-sol" :aria-label="`${v.estrellas} de 5 estrellas`">
                  <AppIcon v-for="n in 5" :key="n" name="star" :size="18" :filled="n <= v.estrellas" :class="n <= v.estrellas ? 'text-sol' : 'text-linea'" />
                </span>
              </td>
              <td class="max-w-[260px]">{{ v.comentario }}</td>
              <td><span :class="badgeValoracion[v.estado]">{{ v.estado }}</span></td>
              <td>
                <div class="flex gap-3">
                  <button type="button" aria-label="Publicar" class="cursor-pointer" @click="cambiar(v.id, 'Publicada')"><AppIcon name="check" :size="20" /></button>
                  <button type="button" aria-label="Ocultar" class="cursor-pointer" @click="cambiar(v.id, 'Oculta')"><AppIcon name="eyeOff" :size="20" /></button>
                  <button type="button" aria-label="Eliminar" class="cursor-pointer" @click="eliminar(v.id)"><AppIcon name="trash" :size="20" /></button>
                </div>
              </td>
            </tr>
            <tr v-if="!visibles.length"><td colspan="6" class="text-center text-gris py-8">No hay valoraciones en este filtro.</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>
