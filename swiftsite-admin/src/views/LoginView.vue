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
  <main class="min-h-screen bg-noche flex items-center justify-center p-4 font-inter relative overflow-hidden">
    
    <!-- Decoración de fondo -->
    <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-aqua rounded-full blur-[150px] opacity-20 pointer-events-none"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gota rounded-full blur-[150px] opacity-20 pointer-events-none"></div>

    <!-- Tarjeta de Login -->
    <form @submit.prevent="submit" class="bg-white border-[2.5px] border-tinta rounded-[24px] p-8 md:p-10 w-full max-w-md shadow-brutal relative z-10">
      
      <div class="text-center mb-8">
        <p class="font-jakarta font-bold italic tracking-wider text-tinta/60 text-sm mb-2">SWIFTSITE CLEAN</p>
        <h1 class="font-bricolage font-bold text-3xl text-tinta">Bienvenida</h1>
        <p class="text-tinta/74 mt-2 text-sm">Entra con tu cuenta de administrador.</p>
      </div>

      <div class="flex flex-col gap-5">
        <label class="flex flex-col gap-1.5">
          <span class="font-medium text-sm text-tinta">Correo</span>
          <input 
            v-model="correo" 
            type="email" 
            autocomplete="username" 
            required 
            placeholder="admin@swiftsite.com"
            class="w-full bg-hueso border-2 border-tinta rounded-xl px-4 py-3 outline-none focus:border-gota focus:ring-1 focus:ring-gota transition-all"
          />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="font-medium text-sm text-tinta">Contraseña</span>
          <input 
            v-model="password" 
            type="password" 
            autocomplete="current-password" 
            required 
            placeholder="••••••••"
            class="w-full bg-hueso border-2 border-tinta rounded-xl px-4 py-3 outline-none focus:border-gota focus:ring-1 focus:ring-gota transition-all"
          />
        </label>

        <p v-if="error" role="alert" class="bg-red-100 border-2 border-red-500 text-red-700 p-3 rounded-xl text-sm font-medium">
          {{ error }}
        </p>

        <button 
          type="submit"
          :disabled="loading"
          class="btn-primario mt-2 w-full"
        >
          {{ loading ? 'Conectando...' : 'Entrar al panel' }}
        </button>
        
        <a href="#" class="text-center text-sm font-medium text-gota hover:text-gota-profunda transition-colors mt-2">
          ¿Olvidaste tu contraseña?
        </a>
      </div>
    </form>

  </main>
</template>