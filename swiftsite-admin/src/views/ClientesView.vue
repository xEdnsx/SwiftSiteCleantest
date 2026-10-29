<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { clientes, type ClienteMuestra } from '../data/muestras'

// Pantalla visual con datos de ejemplo (ver data/muestras.ts). Aún no usa la API.
const lista = ref<ClienteMuestra[]>(clientes.map((c) => ({ ...c })))
const busqueda = ref('')
const seleccionadoId = ref<number>(lista.value[1]?.id ?? 0)
const form = reactive({ nombre: '', telefono: '', correo: '', zona: '' })

function cargarForm(id: number) {
  const c = lista.value.find((x) => x.id === id)
  if (c) Object.assign(form, { nombre: c.nombre, telefono: c.telefono, correo: c.correo, zona: c.zona })
}
cargarForm(seleccionadoId.value)

function seleccionar(id: number) {
  seleccionadoId.value = id
  cargarForm(id)
}
function guardar() {
  const c = lista.value.find((x) => x.id === seleccionadoId.value)
  if (c) Object.assign(c, form)
}
function eliminar(id: number) {
  lista.value = lista.value.filter((c) => c.id !== id)
  if (seleccionadoId.value === id && lista.value[0]) seleccionar(lista.value[0].id)
}

const visibles = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return lista.value.filter((c) => !q || [c.nombre, c.correo, c.telefono].some((v) => v.toLowerCase().includes(q)))
})
</script>

<template>
  <section class="flex flex-col gap-6 max-w-7xl mx-auto">
    <header class="flex items-start justify-between gap-4">
      <div>
        <h1 class="font-bricolage font-extrabold text-[40px] leading-none">Clientes</h1>
        <p class="mt-2 text-gris">Agrega, edita o elimina clientes.</p>
      </div>
      <button type="button" class="btn-primario">+ Nuevo cliente</button>
    </header>

    <div class="relative w-full max-w-[420px]">
      <label for="buscar-cliente" class="sr-only">Buscar por nombre, correo o teléfono</label>
      <input id="buscar-cliente" v-model="busqueda" type="search" class="input-brutal !rounded-full pl-11" placeholder="Buscar por nombre, correo o teléfono" />
      <AppIcon name="search" :size="20" class="absolute left-4 top-1/2 -translate-y-1/2 text-gris" />
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-7 items-start">
      <section class="card-brutal p-7">
        <div class="overflow-x-auto">
          <table class="tabla-brutal">
            <thead>
              <tr><th>Nombre</th><th>Contacto</th><th>Zona</th><th>Pedidos</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              <tr v-for="c in visibles" :key="c.id" :aria-selected="c.id === seleccionadoId">
                <td class="font-semibold">{{ c.nombre }}</td>
                <td>{{ c.telefono }}<br /><span class="text-gris">{{ c.correo }}</span></td>
                <td>{{ c.zona }}</td>
                <td>{{ c.pedidos }}</td>
                <td>
                  <div class="flex gap-3">
                    <button type="button" :aria-label="`Editar ${c.nombre}`" class="cursor-pointer" @click="seleccionar(c.id)"><AppIcon name="edit" :size="20" /></button>
                    <button type="button" :aria-label="`Eliminar ${c.nombre}`" class="cursor-pointer" @click="eliminar(c.id)"><AppIcon name="trash" :size="20" /></button>
                  </div>
                </td>
              </tr>
              <tr v-if="!visibles.length"><td colspan="5" class="text-center text-gris py-8">No hay clientes que coincidan.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <form class="card-brutal p-7 flex flex-col gap-4" @submit.prevent="guardar">
        <h2 class="font-bricolage font-extrabold text-2xl">Editar cliente</h2>
        <div><label class="label-brutal" for="cli-nombre">Nombre</label><input id="cli-nombre" v-model="form.nombre" class="input-brutal" type="text" /></div>
        <div><label class="label-brutal" for="cli-tel">Teléfono</label><input id="cli-tel" v-model="form.telefono" class="input-brutal" type="text" /></div>
        <div><label class="label-brutal" for="cli-correo">Correo</label><input id="cli-correo" v-model="form.correo" class="input-brutal" type="email" /></div>
        <div><label class="label-brutal" for="cli-zona">Zona</label><input id="cli-zona" v-model="form.zona" class="input-brutal" type="text" /></div>
        <div class="flex gap-3 pt-1">
          <button type="submit" class="btn-primario !min-h-[46px]">Guardar</button>
          <button type="button" class="btn-secundario !min-h-[46px]" @click="cargarForm(seleccionadoId)">Cancelar</button>
        </div>
      </form>
    </div>
  </section>
</template>
