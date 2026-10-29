<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <section class="max-w-3xl mx-auto mt-10">
    <div class="bg-white border-[2.5px] border-tinta rounded-[24px] p-10 text-center shadow-brutal flex flex-col items-center gap-4">
      
      <div class="w-16 h-16 bg-aqua-suave rounded-full flex items-center justify-center border-2 border-gota mb-2">
        <svg class="w-8 h-8 text-gota" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
      </div>

      <h2 class="font-bricolage font-bold text-3xl text-tinta">{{ title }}</h2>
      <p class="text-tinta/74 text-lg max-w-md">
        Estructura de navegación preparada. La gestión completa de <strong class="text-tinta">{{ title.toLowerCase() }}</strong> corresponde al Sprint 4 y aún no está implementada en este entorno.
      </p>
      
      <RouterLink to="/dashboard" class="btn-primario mt-6">
        Volver al Dashboard
      </RouterLink>
    </div>
  </section>
</template>