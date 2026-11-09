<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, errorMessage } from '../services/api'
import AppIcon from '../components/AppIcon.vue'
import { iniciales } from '../utils/clientes'
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
  <section class="flex flex-col gap-6 max-w-6xl mx-auto">
    <header>
      <h1 class="font-bricolage font-extrabold text-[40px] leading-none">Administradores</h1>
      <p class="mt-2 text-gris">Quién puede entrar al panel. Solo el Administrador Principal crea cuentas nuevas.</p>
    </header>

    <div class="grid items-start gap-6 lg:grid-cols-[1fr_420px]">
      <!-- Cuentas existentes -->
      <section class="card-brutal p-7">
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-bricolage font-extrabold text-2xl">Cuentas con acceso</h2>
          <span v-if="admins.length" class="badge-cotizado">{{ admins.length }} {{ admins.length === 1 ? 'cuenta' : 'cuentas' }}</span>
        </div>

        <ul class="mt-5 flex flex-col divide-y divide-linea">
          <li v-for="admin in admins" :key="admin.id_usuario" class="flex items-center gap-3.5 py-3.5 first:pt-0 last:pb-0">
            <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-tinta bg-aqua-suave text-sm font-bold" aria-hidden="true">{{ iniciales(admin.nombre) }}</span>
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold">{{ admin.nombre }}</p>
              <p class="truncate text-sm text-gris">{{ admin.correo }}</p>
            </div>
            <span v-if="admin.id_usuario === 1" class="badge-proceso shrink-0">Principal</span>
          </li>
        </ul>
      </section>

      <!-- Crear administrador -->
      <form @submit.prevent="create" class="card-brutal flex flex-col gap-4 p-7">
        <div>
          <h2 class="font-bricolage font-extrabold text-2xl">Crear administrador</h2>
          <p class="mt-1 text-sm text-gris">Esta persona podrá entrar al panel con el correo y la contraseña que pongas aquí.</p>
        </div>

        <div>
          <label class="label-brutal" for="adm-nombre">Nombre completo</label>
          <input id="adm-nombre" class="input-brutal" v-model="form.nombre" required maxlength="120" autocomplete="name" placeholder="Ej. Ana Martínez">
        </div>
        <div>
          <label class="label-brutal" for="adm-correo">Correo</label>
          <input id="adm-correo" class="input-brutal" v-model="form.correo" type="email" required maxlength="150" autocomplete="off" placeholder="ana@correo.com">
          <p class="mt-1 text-xs text-gris">Aquí le llegará el código si olvida su contraseña.</p>
        </div>
        <div>
          <label class="label-brutal" for="adm-tel">Teléfono <span class="font-normal text-gris">(opcional)</span></label>
          <input id="adm-tel" class="input-brutal" v-model="form.telefono" maxlength="25" type="tel" autocomplete="off" placeholder="Ej. 7000-1111">
        </div>
        <div>
          <label class="label-brutal" for="adm-clave">Contraseña inicial</label>
          <input id="adm-clave" class="input-brutal" v-model="form.password" type="password" minlength="8" maxlength="72" required autocomplete="new-password" placeholder="Mínimo 8 caracteres">
          <p class="mt-1 text-xs text-gris">Compártela por un canal privado.</p>
        </div>
        <div>
          <label class="label-brutal" for="adm-confirmar">Confirmar contraseña</label>
          <input id="adm-confirmar" class="input-brutal" v-model="form.password_confirmation" type="password" minlength="8" maxlength="72" required autocomplete="new-password" placeholder="Repite la contraseña">
        </div>

        <p v-if="error" role="alert" class="bg-red-100 border-2 border-red-500 text-red-700 p-3 rounded-2xl text-sm font-medium">{{ error }}</p>
        <p v-if="message" role="status" class="flex items-start gap-2 bg-aqua-suave border-2 border-tinta p-3 rounded-2xl text-sm font-medium">
          <AppIcon name="check" :size="18" class="mt-0.5 shrink-0" />
          <span>{{ message }}</span>
        </p>

        <button :disabled="busy" class="btn-primario w-full">{{ busy ? 'Creando...' : 'Crear administrador' }}</button>
      </form>
    </div>
  </section>
</template>
