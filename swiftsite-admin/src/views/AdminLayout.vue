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
  try { await auth.logout(); await router.replace('/login') }
  catch (err) { error.value = errorMessage(err) }
  finally { busy.value = false }
}
</script>
<template>
  <main>
    <header><div><p>SWIFTSITE CLEAN · BACK OFFICE</p><h1>Administracion</h1><p>{{ auth.usuario?.nombre }}</p></div><button :disabled="busy" @click="logout">Cerrar sesion</button></header>
    <nav aria-label="Administracion">
      <RouterLink to="/dashboard">Dashboard</RouterLink><RouterLink to="/pedidos">Pedidos</RouterLink>
      <RouterLink to="/catalogos">Catalogo y tarifas</RouterLink><RouterLink to="/zonas">Zonas de cobertura</RouterLink><RouterLink to="/clientes">Clientes</RouterLink>
    </nav>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <RouterView :key="$route.path" />
  </main>
</template>
<style scoped>
nav a { color: #176451; padding: .75rem; border-radius: .5rem; text-decoration: none; }
nav a.router-link-active { background: #176451; color: white; }
</style>
