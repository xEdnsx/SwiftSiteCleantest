<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { usePendientesStore } from '../stores/pendientes'
import { errorMessage } from '../services/api'
import AppIcon, { type IconName } from '../components/AppIcon.vue'
import BrandMark from '../components/BrandMark.vue'

const auth = useAuthStore()
const pendientes = usePendientesStore()
const router = useRouter()
const route = useRoute()
const error = ref('')
const busy = ref(false)

/** Menú lateral. `match` agrupa rutas que deben marcar el mismo ítem como activo. */
const menu: { label: string; to: string; icon: IconName; match: string[]; globo?: () => number }[] = [
  { label: 'Inicio', to: '/dashboard', icon: 'home', match: ['/dashboard'] },
  { label: 'Pedidos', to: '/pedidos', icon: 'orders', match: ['/pedidos'], globo: () => pendientes.datos.pedidos_por_confirmar },
  { label: 'Catálogo', to: '/catalogos', icon: 'catalog', match: ['/catalogos', '/zonas'] },
  { label: 'Clientes', to: '/clientes', icon: 'customers', match: ['/clientes'] },
  { label: 'Reportes', to: '/reportes', icon: 'flag', match: ['/reportes'], globo: () => pendientes.datos.reportes_abiertos },
  { label: 'Valoraciones', to: '/valoraciones', icon: 'star', match: ['/valoraciones'], globo: () => pendientes.datos.valoraciones_pendientes },
]
const isActive = (match: string[]) => match.includes(route.path)

onMounted(() => pendientes.iniciar())
onBeforeUnmount(() => pendientes.detener())

async function logout() {
  busy.value = true
  try {
    await auth.logout()
    await router.replace('/login')
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="flex h-screen bg-hueso font-inter text-tinta overflow-hidden">
    <!-- Menú lateral -->
    <aside class="w-68 bg-tinta hidden md:flex flex-col shrink-0 px-4 py-7">
      <div class="flex items-center gap-2.5 pl-2.5">
        <BrandMark :size="30" />
        <span class="font-jakarta font-bold text-[19px] text-white">SwiftSite Clean</span>
      </div>

      <nav class="mt-9 flex flex-col gap-1.5" aria-label="Panel">
        <RouterLink
          v-for="item in menu"
          :key="item.to"
          :to="item.to"
          class="h-12 flex items-center gap-3.5 px-4 rounded-[14px] text-[17px] transition-colors"
          :class="isActive(item.match) ? 'bg-gota text-white font-semibold' : 'text-menu font-medium hover:bg-white/10'"
        >
          <AppIcon :name="item.icon" :size="22" />
          {{ item.label }}
          <span
            v-if="item.globo && item.globo() > 0"
            class="ml-auto min-w-6 h-6 px-1.5 rounded-full bg-sol text-tinta text-sm font-bold grid place-items-center"
            :aria-label="`${item.globo()} pendientes`"
          >{{ item.globo() }}</span>
        </RouterLink>
        <RouterLink v-if="auth.usuario?.id_usuario === 1 && auth.usuario?.rol.nombre_rol === 'Administrador'" to="/administradores" class="h-12 flex items-center gap-3.5 px-4 rounded-[14px] text-[17px] transition-colors" :class="isActive(['/administradores']) ? 'bg-gota text-white font-semibold' : 'text-menu font-medium hover:bg-white/10'">
          <AppIcon name="shield" :size="22" />
          Administradores
        </RouterLink>
      </nav>

      <div class="mt-auto">
        <p class="px-4 pb-2 text-sm text-menu/70 truncate">Hola, {{ auth.usuario?.nombre || 'Admin' }}</p>
        <button
          type="button"
          class="h-11 w-full flex items-center gap-3.5 px-4 text-[17px] text-menu hover:text-white transition-colors disabled:opacity-60 cursor-pointer"
          :disabled="busy"
          @click="logout"
        >
          <AppIcon name="logout" :size="22" />
          Cerrar sesión
        </button>
      </div>
    </aside>

    <!-- Contenido -->
    <main class="flex-1 min-w-0 h-full overflow-y-auto px-6 py-8 md:px-10 md:py-10">
      <p v-if="error" class="bg-red-100 border-2 border-red-500 text-red-700 p-4 rounded-2xl mb-6" role="alert">
        {{ error }}
      </p>
      <RouterLink v-if="auth.usuario?.id_usuario === 1 && auth.usuario?.rol.nombre_rol === 'Administrador'" to="/administradores" class="md:hidden block mb-4 underline">Administradores</RouterLink>
      <RouterView :key="$route.path" />
    </main>
  </div>
</template>
