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
  <main>
    <h2>{{ selected === 'zonas' ? 'Zonas de cobertura' : 'Catalogo y tarifas' }}</h2>
    <nav aria-label="Catalogos">
      <button v-for="catalogo in (['categorias', 'tarifas', 'zonas'] as const)" :key="catalogo" :aria-pressed="selected === catalogo" @click="load(catalogo)">{{ catalogo }}</button>
      <button :disabled="loading" @click="load()">Actualizar</button>
    </nav>
    <p v-if="error" role="alert" class="error">{{ error }}</p>
    <p v-if="loading" role="status">Cargando...</p>
    <p v-else-if="!error && !rows.length">No hay registros.</p>
    <div v-else-if="!error" class="table-wrap"><table>
      <thead><tr><th>Nombre</th><th>Descripcion / material</th><th>Importe</th><th>Estado</th></tr></thead>
      <tbody><tr v-for="row in rows" :key="row.id_tarifa ?? row.id_zona ?? row.id_categoria">
        <td>{{ row.nombre ?? row.tipo_item }}</td><td>{{ row.descripcion ?? row.material ?? '—' }}</td>
        <td>{{ row.precio_unitario ?? row.recargo ?? '—' }}</td><td>{{ row.activo ? 'Activo' : 'Inactivo' }}</td>
      </tr></tbody>
    </table></div>
  </main>
</template>
