<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, errorMessage } from '../services/api'
interface Admin {id_usuario:number;nombre:string;correo:string}
const admins=ref<Admin[]>([]), busy=ref(false), error=ref(''), message=ref('')
const form=ref({nombre:'',correo:'',telefono:'',password:'',password_confirmation:''})
async function load(){const {data}=await api.get<Admin[]>('/admin/administradores');admins.value=data}
onMounted(async()=>{try{await load()}catch(e){error.value=errorMessage(e)}})
async function create(){
 if(busy.value)return
 busy.value=true;error.value='';message.value=''
 try{const {data}=await api.post<Admin>('/admin/administradores',form.value);admins.value.push(data);form.value={nombre:'',correo:'',telefono:'',password:'',password_confirmation:''};message.value='Administrador creado. Ya puede iniciar sesión en el panel.'}
 catch(e){error.value=errorMessage(e)}finally{busy.value=false}
}
</script>
<template>
<section class="max-w-3xl mx-auto"><h1 class="text-3xl font-bold">Administradores</h1>
<p class="my-4">Solo el Administrador Principal puede crear cuentas administrativas. Comparte la contraseña inicial por un canal privado.</p>
<form @submit.prevent="create" class="card-brutal p-6 flex flex-col gap-4">
<label>Nombre<input class="input-brutal" v-model="form.nombre" required maxlength="120" autocomplete="name"></label>
<label>Correo<input class="input-brutal" v-model="form.correo" type="email" required maxlength="150" autocomplete="off"></label>
<label>Teléfono (opcional)<input class="input-brutal" v-model="form.telefono" maxlength="25" type="tel"></label>
<label>Contraseña inicial<input class="input-brutal" v-model="form.password" type="password" minlength="8" maxlength="72" required autocomplete="new-password"></label>
<label>Confirmar contraseña<input class="input-brutal" v-model="form.password_confirmation" type="password" minlength="8" maxlength="72" required autocomplete="new-password"></label>
<button :disabled="busy" class="btn-primario">{{busy?'Creando...':'Crear administrador'}}</button>
</form>
<p v-if="error" role="alert" class="my-4 text-red-700">{{error}}</p><p v-if="message" role="status" class="my-4">{{message}}</p>
<h2 class="text-xl font-bold mt-8">Cuentas administrativas</h2>
<ul><li v-for="admin in admins" :key="admin.id_usuario" class="border-b py-4"><strong>{{admin.nombre}}</strong> — {{admin.correo}} <span v-if="admin.id_usuario===1">(Principal)</span></li></ul>
</section>
</template>
