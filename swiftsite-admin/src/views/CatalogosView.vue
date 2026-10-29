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
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 class="font-bricolage font-bold text-2xl text-tinta">
          {{ selected === 'zonas' ? 'Zonas de cobertura' : 'Catálogo y tarifas' }}
        </h2>
        <p class="text-tinta/74 text-sm mt-1">Lo que ven los clientes cuando cotizan.</p>
      </div>
      <button class="btn-primario !min-h-[44px] !py-2 text-sm" @click="load()">Actualizar datos</button>
    </div>

    <!-- Tabs de Navegación -->
    <nav class="flex gap-2 overflow-x-auto pb-2" aria-label="Catalogos">
      <button 
        v-for="catalogo in (['categorias', 'tarifas', 'zonas'] as const)" 
        :key="catalogo" 
        @click="load(catalogo)"
        class="px-6 py-2 rounded-full font-medium capitalize transition-all border-2"
        :class="selected === catalogo ? 'bg-tinta text-white border-tinta shadow-[2px_2px_0px_0px_#00E5FF]' : 'bg-white text-tinta border-tinta/20 hover:border-tinta'"
      >
        {{ catalogo }}
      </button>
    </nav>

    <!-- Mensajes de Estado -->
    <p v-if="error" role="alert" class="bg-red-100 border-2 border-red-500 text-red-700 p-4 rounded-xl">
      {{ error }}
    </p>
    <div v-if="loading" class="text-center py-10 text-tinta/60 font-medium animate-pulse">
      Cargando información...
    </div>
    <div v-else-if="!error && !rows.length" class="text-center py-10 text-tinta/60 border-2 border-dashed border-tinta/20 rounded-[20px]">
      No hay registros en esta categoría.
    </div>

    <!-- Tabla de Datos -->
    <div v-else-if="!error" class="bg-white border-[2.5px] border-tinta rounded-[20px] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left font-inter text-sm">
          <thead class="bg-hueso border-b-2 border-tinta text-tinta font-semibold">
            <tr>
              <th class="p-4">Nombre</th>
              <th class="p-4">Descripción / Material</th>
              <th class="p-4">Importe</th>
              <th class="p-4">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="row in rows" 
              :key="row.id_tarifa ?? row.id_zona ?? row.id_categoria"
              class="border-b border-tinta/10 hover:bg-hueso transition-colors last:border-0"
            >
              <td class="p-4 font-medium">{{ row.nombre ?? row.tipo_item }}</td>
              <td class="p-4 text-tinta/74">{{ row.descripcion ?? row.material ?? '—' }}</td>
              <td class="p-4 font-medium text-gota">{{ row.precio_unitario ?? row.recargo ?? '—' }}</td>
              <td class="p-4">
                <span :class="row.activo ? 'badge-confirmado' : 'badge-finalizado'">
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