<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { errorMessage } from '../services/api'

const auth = useAuthStore()
const router = useRouter()
const correo = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await auth.login(correo.value, password.value)
    password.value = ''
    await router.replace('/')
  } catch (err) { error.value = errorMessage(err) }
  finally { loading.value = false }
}
</script>

<template>
  <main class="login">
    <form @submit.prevent="submit">
      <p>SWIFTSITE CLEAN</p>
      <h1>Administracion</h1>
      <label>Correo<input v-model="correo" type="email" autocomplete="username" required /></label>
      <label>Contrasena<input v-model="password" type="password" autocomplete="current-password" required /></label>
      <p v-if="error" role="alert" class="error">{{ error }}</p>
      <button :disabled="loading">{{ loading ? 'Conectando...' : 'Iniciar sesion' }}</button>
    </form>
  </main>
</template>
