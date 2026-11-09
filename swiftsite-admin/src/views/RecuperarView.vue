<script setup lang="ts">
import { computed, ref } from 'vue'
import { api, errorMessage } from '../services/api'
import AppIcon from '../components/AppIcon.vue'
import BrandMark from '../components/BrandMark.vue'
const correo=ref(''), token=ref(''), password=ref(''), confirmation=ref(''), message=ref(''), error=ref(''), busy=ref(false), sent=ref(false), done=ref(false)
/** Solo presentación: en qué paso del formulario está la persona. */
const paso = computed(() => (sent.value ? 2 : 1))
async function send(reset=false) {
 if(busy.value) return
 busy.value=true; error.value=''; message.value=''
 try {
 const {data}=await api.post(reset?'/reset-password':'/forgot-password',reset?{correo:correo.value,token:token.value.trim(),password:password.value,password_confirmation:confirmation.value}:{correo:correo.value})
 message.value=data.message; sent.value=true
 if(reset){done.value=true;token.value=password.value=confirmation.value=''}
 }catch(e){error.value=errorMessage(e)}finally{busy.value=false}
}
</script>

<template>
  <main class="min-h-screen flex font-inter bg-hueso">
    <!-- Panel de marca (solo escritorio), igual que el login -->
    <section class="hidden lg:block relative w-[52%] max-w-[670px] shrink-0 bg-noche overflow-hidden text-white">
      <div class="absolute -top-20 left-[429px] size-80 rounded-full bg-noche-1"></div>
      <div class="absolute -left-14 top-[540px] size-90 rounded-full bg-noche-2"></div>

      <div class="absolute left-16 top-14 flex items-center gap-2.5">
        <BrandMark :size="40" />
        <span class="font-jakarta font-bold text-2xl tracking-tight">SwiftSite Clean</span>
      </div>

      <div class="absolute left-16 top-[326px] w-[540px]">
        <h1 class="font-bricolage font-extrabold text-[56px] leading-[58px]">
          Recupera tu acceso <span class="text-cielo">en dos pasos.</span>
        </h1>
        <p class="mt-4 text-[19px] leading-[27px] text-[#D8E6F6] max-w-[430px]">
          Te enviamos un código a tu correo. Con él eliges una contraseña nueva y listo.
        </p>
      </div>

      <p class="absolute left-16 bottom-11 text-base text-[#D8E6F6]">Panel de administración</p>
    </section>

    <!-- Formulario -->
    <section class="flex-1 flex items-center justify-center p-6">
      <div class="card-brutal shadow-brutal w-full max-w-[440px] p-8 md:p-10">
        <div class="flex items-center gap-2 mb-6 lg:hidden">
          <BrandMark :size="32" />
          <span class="font-jakarta font-bold text-lg">SwiftSite Clean</span>
        </div>

        <!-- Listo -->
        <div v-if="done" role="status">
          <span class="grid size-14 place-items-center rounded-full border-2 border-tinta bg-aqua shadow-brutal-sm">
            <AppIcon name="check" :size="28" />
          </span>
          <h2 class="mt-5 font-bricolage font-extrabold text-[30px] leading-tight">Contraseña actualizada</h2>
          <p class="mt-2 text-gris">Ya puedes entrar al panel con tu contraseña nueva.</p>
          <RouterLink to="/login" class="btn-primario w-full mt-7">Ir a iniciar sesión</RouterLink>
        </div>

        <!-- Pasos -->
        <template v-else>
          <h2 class="font-bricolage font-extrabold text-[30px] leading-tight">Recupera tu contraseña</h2>
          <p class="mt-1 text-gris">
            {{ sent ? 'Escribe el código que te enviamos y elige una contraseña nueva.' : 'Escribe el correo de tu cuenta y te enviamos un código. Caduca en 30 minutos.' }}
          </p>

          <ol class="mt-6 flex items-center gap-3" aria-label="Progreso">
            <li class="flex items-center gap-2" :aria-current="paso === 1 ? 'step' : undefined">
              <span class="grid size-7 place-items-center rounded-full border-2 border-tinta text-sm font-bold" :class="paso > 1 ? 'bg-tinta text-white' : 'bg-aqua'">
                <AppIcon v-if="paso > 1" name="check" :size="14" />
                <template v-else>1</template>
              </span>
              <span class="text-sm font-semibold whitespace-nowrap">Tu correo</span>
            </li>
            <li class="h-0.5 flex-1 bg-tinta/20" aria-hidden="true"></li>
            <li class="flex items-center gap-2" :class="paso === 2 ? '' : 'text-gris'" :aria-current="paso === 2 ? 'step' : undefined">
              <span class="grid size-7 place-items-center rounded-full border-2 text-sm font-bold" :class="paso === 2 ? 'border-tinta bg-aqua' : 'border-linea bg-white'">2</span>
              <span class="text-sm font-semibold whitespace-nowrap">Nueva contraseña</span>
            </li>
          </ol>

          <form @submit.prevent="send(sent)" class="mt-6 flex flex-col gap-5">
            <div>
              <label class="label-brutal" for="rec-correo">Correo</label>
              <input id="rec-correo" v-model="correo" class="input-brutal" type="email" autocomplete="username" required maxlength="150" placeholder="admin@swiftsite.com">
            </div>

            <template v-if="sent">
              <div>
                <label class="label-brutal" for="rec-codigo">Código del correo</label>
                <input id="rec-codigo" v-model="token" class="input-brutal" required maxlength="256" autocomplete="one-time-code" spellcheck="false" autocapitalize="off" placeholder="Pega aquí el código">
              </div>
              <div>
                <label class="label-brutal" for="rec-clave">Nueva contraseña</label>
                <input id="rec-clave" v-model="password" class="input-brutal" type="password" minlength="8" maxlength="72" required autocomplete="new-password" placeholder="Mínimo 8 caracteres">
              </div>
              <div>
                <label class="label-brutal" for="rec-confirmar">Confirmar contraseña</label>
                <input id="rec-confirmar" v-model="confirmation" class="input-brutal" type="password" minlength="8" maxlength="72" required autocomplete="new-password" placeholder="Repite la contraseña">
              </div>
            </template>

            <p v-if="message" role="status" class="flex items-start gap-2 bg-aqua-suave border-2 border-tinta p-3 rounded-2xl text-sm font-medium">
              <AppIcon name="check" :size="18" class="mt-0.5 shrink-0" />
              <span>{{ message }}</span>
            </p>
            <p v-if="error" role="alert" class="bg-red-100 border-2 border-red-500 text-red-700 p-3 rounded-2xl text-sm font-medium">
              {{ error }}
            </p>

            <button type="submit" class="btn-primario w-full" :disabled="busy">
              {{ busy ? 'Procesando...' : sent ? 'Guardar contraseña' : 'Enviar código' }}
            </button>

            <button v-if="sent" type="button" class="btn-secundario w-full -mt-1" :disabled="busy || !correo" @click="send(false)">Reenviar código</button>
          </form>

          <RouterLink to="/login" class="mt-6 block text-center text-sm font-medium text-gota hover:text-gota-profunda transition-colors">
            Volver al inicio de sesión
          </RouterLink>
        </template>
      </div>
    </section>
  </main>
</template>
