<script setup lang="ts">
/** Logo de SwiftSite Clean (las dos gotas). */
withDefaults(defineProps<{ size?: number }>(), { size: 30 })
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 36 36" fill="none" aria-hidden="true">
    <path d="M13 3C13 3 2.5 14.5 2.5 22a10.5 10.5 0 0 0 21 0C23.5 14.5 13 3 13 3Z" fill="#00E5FF" stroke="#0B1F3A" stroke-width="2.4" stroke-linejoin="round" />
    <path d="M26.5 17.5S20 24 20 28.2a6.5 6.5 0 0 0 13 0c0-4.2-6.5-10.7-6.5-10.7Z" fill="#1E5BD8" stroke="#0B1F3A" stroke-width="2.4" stroke-linejoin="round" />
  </svg>
</template>
