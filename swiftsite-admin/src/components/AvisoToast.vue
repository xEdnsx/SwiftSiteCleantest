<script setup lang="ts">
import AppIcon from './AppIcon.vue'

defineProps<{ mensaje: string }>()
</script>

<template>
  <Transition name="aviso">
    <div v-if="mensaje" class="pointer-events-none fixed inset-x-0 top-6 z-50 flex justify-center">
      <p role="status" class="flex items-center gap-2 rounded-full bg-tinta px-5 py-3 text-sm font-semibold text-white shadow-lg">
        <AppIcon name="check" :size="18" class="text-aqua" />
        {{ mensaje }}
      </p>
    </div>
  </Transition>
</template>

<style scoped>
.aviso-enter-active,
.aviso-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.aviso-enter-from,
.aviso-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
@media (prefers-reduced-motion: reduce) {
  .aviso-enter-active,
  .aviso-leave-active {
    transition: none;
  }
}
</style>
