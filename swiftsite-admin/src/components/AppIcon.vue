<script setup lang="ts">
/**
 * Iconos de línea del panel (mismo trazo que los mockups).
 * Uso: <AppIcon name="home" :size="22" />
 */
const icons = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  orders: '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>',
  catalog: '<path d="m12 3 9 4.5-9 4.5L3 7.5z"/><path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5"/>',
  customers: '<circle cx="9" cy="8" r="3.5"/><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1M16 4.5a3.5 3.5 0 0 1 0 7M22 21v-1a6 6 0 0 0-4-5.6"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  eyeOff: '<path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A9.8 9.8 0 0 1 12 5c5 0 9 4.5 10 7a12 12 0 0 1-2.6 3.7M6.6 6.6A12 12 0 0 0 2 12c1 2.5 5 7 10 7a9.7 9.7 0 0 0 4.2-1"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
} as const

export type IconName = keyof typeof icons

withDefaults(defineProps<{ name: IconName; size?: number; filled?: boolean }>(), { size: 22, filled: false })
</script>

<template>
  <svg
    :width="size" :height="size" viewBox="0 0 24 24"
    :fill="filled ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
    v-html="icons[name]"
  />
</template>
