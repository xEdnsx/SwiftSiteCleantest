<script setup lang="ts">
import { ref } from 'vue'
import { api, errorMessage } from '../services/api'
const correo=ref(''), token=ref(''), password=ref(''), confirmation=ref(''), message=ref(''), error=ref(''), busy=ref(false), sent=ref(false), done=ref(false)
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
<main class="min-h-screen bg-hueso flex items-center justify-center p-6"><section class="card-brutal w-full max-w-lg p-8">
<h1 class="text-3xl font-bold mb-4">Recuperar contraseña</h1>
<p class="mb-4">Recibe un código en tu correo para recuperar el acceso. Caduca en 30 minutos.</p>
<form v-if="!done" @submit.prevent="send(sent)" class="flex flex-col gap-4">
<label>Correo<input v-model="correo" class="input-brutal" type="email" autocomplete="username" required maxlength="150"></label>
<template v-if="sent">
<label>Código del correo<input v-model="token" class="input-brutal" required maxlength="256" autocomplete="one-time-code"></label>
<label>Nueva contraseña<input v-model="password" class="input-brutal" type="password" minlength="8" maxlength="72" required autocomplete="new-password"></label>
<label>Confirmar contraseña<input v-model="confirmation" class="input-brutal" type="password" minlength="8" maxlength="72" required autocomplete="new-password"></label>
</template>
<button class="btn-primario" :disabled="busy">{{busy?'Procesando...':sent?'Guardar contraseña':'Enviar código'}}</button>
<button v-if="sent" type="button" :disabled="busy || !correo" @click="send(false)">Reenviar código</button>
</form>
<p v-if="message" role="status" class="my-4">{{message}}</p><p v-if="error" role="alert" class="my-4 text-red-700">{{error}}</p>
<RouterLink to="/login" class="block mt-5 underline">Volver al inicio de sesión</RouterLink>
</section></main>
</template>
