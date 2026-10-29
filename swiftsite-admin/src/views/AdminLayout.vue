<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { errorMessage } from '../services/api'

const auth = useAuthStore()
const router = useRouter()
const error = ref('')
const busy = ref(false)

async function logout() {
  busy.value = true
  try { 
    await auth.logout(); 
    await router.replace('/login') 
  }
  catch (err) { error.value = errorMessage(err) }
  finally { busy.value = false }
}
</script>

<template>
  <div class="flex h-screen bg-hueso font-inter text-tinta overflow-hidden">
    
    <!-- SIDEBAR (Menú Lateral) -->
    <aside class="w-64 bg-tinta flex flex-col justify-between p-6 shrink-0 hidden md:flex">
      <div>
        <!-- Logo / Marca -->
        <div class="mb-10 flex items-center gap-3">
          <div class="w-10 h-10 bg-aqua rounded-xl border-2 border-white flex items-center justify-center shrink-0">
            <!-- Icono de gota simulado -->
            <svg class="w-6 h-6 text-tinta" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" /></svg>
          </div>
          <span class="font-jakarta font-bold text-white text-xl tracking-wide italic">SwiftSite</span>
        </div>

        <!-- Navegación -->
        <nav class="flex flex-col gap-2">
          <RouterLink to="/dashboard" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-white/70 hover:bg-white/10 hover:text-white [&.router-link-active]:bg-white/10 [&.router-link-active]:text-white [&.router-link-active]:border-l-4 [&.router-link-active]:border-aqua">
            <span>Inicio</span>
          </RouterLink>
          <RouterLink to="/pedidos" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-white/70 hover:bg-white/10 hover:text-white [&.router-link-active]:bg-white/10 [&.router-link-active]:text-white [&.router-link-active]:border-l-4 [&.router-link-active]:border-aqua">
            <span>Pedidos</span>
          </RouterLink>
          <RouterLink to="/catalogos" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-white/70 hover:bg-white/10 hover:text-white [&.router-link-active]:bg-white/10 [&.router-link-active]:text-white [&.router-link-active]:border-l-4 [&.router-link-active]:border-aqua">
            <span>Catálogo</span>
          </RouterLink>
          <RouterLink to="/zonas" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-white/70 hover:bg-white/10 hover:text-white [&.router-link-active]:bg-white/10 [&.router-link-active]:text-white [&.router-link-active]:border-l-4 [&.router-link-active]:border-aqua">
            <span>Zonas</span>
          </RouterLink>
          <RouterLink to="/clientes" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-white/70 hover:bg-white/10 hover:text-white [&.router-link-active]:bg-white/10 [&.router-link-active]:text-white [&.router-link-active]:border-l-4 [&.router-link-active]:border-aqua">
            <span>Clientes</span>
          </RouterLink>
        </nav>
      </div>

      <!-- Footer Sidebar -->
      <div>
        <button 
          @click="logout" 
          :disabled="busy"
          class="w-full text-left px-4 py-3 text-sm font-medium text-white/50 hover:text-white transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>

    <!-- CONTENIDO PRINCIPAL -->
    <main class="flex-1 flex flex-col h-full overflow-hidden">
      <!-- Topbar -->
      <header class="bg-white border-b-[2.5px] border-tinta px-8 py-4 flex justify-between items-center shrink-0">
        <h2 class="font-bricolage font-bold text-xl">Panel de administración</h2>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-tinta/74">Hola, {{ auth.usuario?.nombre || 'Admin' }}</span>
          <div class="w-10 h-10 bg-aqua-suave border-2 border-tinta rounded-full flex items-center justify-center font-bold">
            A
          </div>
        </div>
      </header>

      <!-- Área de Scroll (Vistas) -->
      <div class="flex-1 overflow-y-auto p-4 md:p-8">
        <p v-if="error" class="bg-red-100 border-2 border-red-500 text-red-700 p-4 rounded-xl mb-6" role="alert">
          {{ error }}
        </p>
        <!-- Aquí se renderizan las vistas (Dashboard, Catálogo, etc.) -->
        <RouterView :key="$route.path" />
      </div>
    </main>

  </div>
</template>