<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { errorMessage } from '../services/api'
import BrandMark from '../components/BrandMark.vue'

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
  <main class="min-h-screen flex font-inter bg-hueso">
    <!-- Panel de marca (solo escritorio) -->
    <section class="hidden lg:block relative w-[52%] max-w-[670px] shrink-0 bg-noche overflow-hidden text-white">
      <div class="absolute -top-20 left-[429px] size-80 rounded-full bg-noche-1"></div>
      <div class="absolute -left-14 top-[540px] size-90 rounded-full bg-noche-2"></div>

      <div class="absolute left-16 top-14 flex items-center gap-2.5">
        <BrandMark :size="40" />
        <span class="font-jakarta font-bold text-2xl tracking-tight">SwiftSite Clean</span>
      </div>

      <div class="absolute left-16 top-[326px] w-[540px]">
        <h1 class="font-bricolage font-extrabold text-[56px] leading-[58px]">
          Todo tu negocio, <span class="text-cielo">en un solo lugar.</span>
        </h1>
        <p class="mt-4 text-[19px] leading-[27px] text-[#D8E6F6] max-w-[430px]">
          Pedidos, clientes, precios y agenda. Para que no se te pierda ninguna limpieza.
        </p>
      </div>

      <p class="absolute left-16 bottom-11 text-base text-[#D8E6F6]">Panel de administración</p>
    </section>

    <!-- Formulario -->
    <section class="flex-1 flex items-center justify-center p-6">
      <form @submit.prevent="submit" class="card-brutal shadow-brutal w-full max-w-[440px] p-8 md:p-10">
        <div class="flex items-center gap-2 mb-6 lg:hidden">
          <BrandMark :size="32" />
          <span class="font-jakarta font-bold text-lg">SwiftSite Clean</span>
        </div>

        <h2 class="font-bricolage font-extrabold text-[34px] leading-tight">Bienvenida</h2>
        <p class="mt-1 text-gris">Entra con tu cuenta de administrador.</p>

        <div class="mt-7 flex flex-col gap-5">
          <div>
            <label class="label-brutal" for="admin-correo">Correo</label>
            <input
              id="admin-correo" v-model="correo" class="input-brutal" type="email"
              autocomplete="username" required placeholder="admin@swiftsite.com"
            />
          </div>

          <div>
            <label class="label-brutal" for="admin-clave">Contraseña</label>
            <input
              id="admin-clave" v-model="password" class="input-brutal" type="password"
              autocomplete="current-password" required placeholder="••••••••"
            />
          </div>

          <p v-if="error" role="alert" class="bg-red-100 border-2 border-red-500 text-red-700 p-3 rounded-2xl text-sm font-medium">
            {{ error }}
          </p>

          <button type="submit" :disabled="loading" class="btn-primario w-full">
            {{ loading ? 'Conectando...' : 'Entrar al panel' }}
          </button>

          <a href="#" class="text-center text-sm font-medium text-gota hover:text-gota-profunda transition-colors">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </form>
    </section>
  </main>
</template>
