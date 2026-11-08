<script setup lang="ts">
/**
 * Interruptor accesible para activar o desactivar. `estado` puede ser «mixto» cuando solo
 * una parte de un grupo está activa (por ejemplo, un departamento con algunas zonas apagadas).
 */
defineProps<{ estado: 'si' | 'no' | 'mixto'; etiqueta: string; deshabilitado?: boolean }>()
defineEmits<{ cambiar: [] }>()
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="estado === 'si' ? 'true' : estado === 'no' ? 'false' : 'mixed'"
    :aria-label="etiqueta"
    :title="etiqueta"
    :disabled="deshabilitado"
    class="relative h-[30px] w-[54px] shrink-0 cursor-pointer rounded-full border-2 border-tinta transition-colors disabled:cursor-not-allowed disabled:opacity-50"
    :class="estado === 'si' ? 'bg-aqua' : estado === 'mixto' ? 'bg-aqua-suave' : 'bg-white'"
    @click="$emit('cambiar')"
  >
    <span
      class="absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full border-2 border-tinta bg-white transition-all"
      :class="estado === 'si' ? 'left-[27px]' : estado === 'mixto' ? 'left-[15px]' : 'left-[3px]'"
    />
  </button>
</template>
