<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api, errorMessage } from '../services/api'

type Catalogo = 'categorias' | 'tarifas' | 'zonas'
interface Registro {
  id_categoria?: number
  id_tarifa?: number
  id_zona?: number
  nombre?: string
  tipo_item?: string
  descripcion?: string
  material?: string
  precio_unitario?: string
  recargo?: string
  activo: boolean
}
const selected = ref<Catalogo>(useRoute().path === '/zonas' ? 'zonas' : 'categorias')
const rows = ref<Registro[]>([])
const loading = ref(false)
const error = ref('')
let requestId = 0

async function load(catalogo: Catalogo = selected.value) {
  selected.value = catalogo
  const current = ++requestId
  loading.value = true
  error.value = ''
  rows.value = []
  try {
    const { data } = await api.get<Registro[]>(`/${catalogo}`)
    if (current === requestId) rows.value = data
  } catch (err) { if (current === requestId) error.value = errorMessage(err) }
  finally { if (current === requestId) loading.value = false }
}

onMounted(() => load())
</script>

<template>
  <section class="flex flex-col gap-6 max-w-7xl mx-auto">
    <!-- Encabezado -->
    <header class="flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div>
        <h1 class="font-bricolage font-extrabold text-[40px] leading-none">
          {{ selected === 'zonas' ? 'Zonas de cobertura' : 'Catálogo y precios' }}
        </h1>
        <p class="mt-2 text-gris">Lo que ven los clientes cuando cotizan.</p>
      </div>
      <button type="button" class="btn-primario" :disabled="loading" @click="load()">Actualizar datos</button>
    </header>

    <!-- Selector de catálogo -->
    <nav class="flex flex-wrap gap-3" aria-label="Catalogos">
      <button
        v-for="catalogo in (['categorias', 'tarifas', 'zonas'] as const)"
        :key="catalogo"
        type="button"
        class="chip capitalize"
        :aria-pressed="selected === catalogo"
        @click="load(catalogo)"
      >
        {{ catalogo }}
      </button>
    </nav>

    <!-- Estados -->
    <p v-if="error" role="alert" class="bg-red-100 border-2 border-red-500 text-red-700 p-4 rounded-2xl">
      {{ error }}
    </p>
    <p v-if="loading" class="text-center py-10 text-gris font-medium animate-pulse">Cargando información...</p>
    <p v-else-if="!error && !rows.length" class="text-center py-10 text-gris border-2 border-dashed border-linea rounded-[24px]">
      No hay registros en esta categoría.
    </p>

    <!-- Tabla -->
    <div v-else-if="!error" class="card-brutal p-7">
      <h2 class="font-bricolage font-extrabold text-2xl mb-5 capitalize">{{ selected }}</h2>
      <div class="overflow-x-auto">
        <table class="tabla-brutal">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción / Material</th>
              <th>Importe</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id_tarifa ?? row.id_zona ?? row.id_categoria">
              <td class="font-semibold">{{ row.nombre ?? row.tipo_item }}</td>
              <td class="text-gris">{{ row.descripcion ?? row.material ?? '—' }}</td>
              <td class="font-semibold">{{ row.precio_unitario ?? row.recargo ?? '—' }}</td>
              <td>
                <span :class="row.activo ? 'badge-confirmado' : 'badge-cotizado'">
                  {{ row.activo ? 'Activo' : 'Oculto' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
