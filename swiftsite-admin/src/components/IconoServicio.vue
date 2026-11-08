<script setup lang="ts">
/**
 * Íconos de los servicios (mismos trazos que dibuja la app del cliente).
 * Uso: <IconoServicio nombre="pisos" :size="26" />
 */
import type { ClaveIcono } from '../utils/servicios'

const trazos: Record<ClaveIcono, string> = {
  servicio: '<path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8z"/>',
  sillas: '<path d="M7 3h10v8H7zM9.5 6h5M6 11h12v3H6zM8 14v7M16 14v7"/>',
  muebles: '<path d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3"/><path d="M3 12a2 2 0 0 1 4 0v3h10v-3a2 2 0 0 1 4 0v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/>',
  colchones: '<path d="M2 18V6M2 14h20v4M22 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="2"/>',
  banos: '<path d="M3 13h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM6 13V7a2.5 2.5 0 0 1 5 0"/>',
  pisos: '<path d="M3 20 8 8h8l5 12z"/><path d="M5.5 14h13M7 10.5h10M12 8v12"/>',
  cisterna: '<path d="M5 8c0-1.7 3.1-3 7-3s7 1.3 7 3v9c0 1.7-3.1 3-7 3s-7-1.3-7-3z"/><path d="M5 8c0 1.7 3.1 3 7 3s7-1.3 7-3M5 13c0 1.7 3.1 3 7 3s7-1.3 7-3"/>',
  ventanas: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M12 3v18M4 12h16"/>',
  alfombras: '<rect x="3" y="7" width="18" height="10" rx="1"/><path d="M6 7V5M10 7V5M14 7V5M18 7V5M6 17v2M10 17v2M14 17v2M18 17v2M7 12h10"/>',
  cocina: '<path d="M5 10h14v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM3 10h18"/><path d="M8 6c0-1 1-1.5 1-2.5M12 6c0-1 1-1.5 1-2.5M16 6c0-1 1-1.5 1-2.5"/>',
  auto: '<path d="M4 15v-3l2-5h12l2 5v3zM7 12h10"/><path d="M4 15v3h3v-3M17 15v3h3v-3"/>',
  jardin: '<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19l8-8"/>',
  limpieza: '<path d="M9 10h6v11H9zM10 10V7h4v3M12 4h4M14 7l2-3"/>',
}

const props = withDefaults(defineProps<{ nombre?: string | null; size?: number }>(), { nombre: 'servicio', size: 24 })

/** Un ícono desconocido se dibuja como el genérico, igual que en la app. */
const dibujo = (): string => trazos[(props.nombre ?? '') as ClaveIcono] ?? trazos.servicio
</script>

<template>
  <svg
    :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="dibujo()"
  />
</template>
