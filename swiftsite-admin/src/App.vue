<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
const router = useRouter()
function unauthorized() { auth.clear(); void router.replace('/login') }
onMounted(() => window.addEventListener('swiftsite:unauthorized', unauthorized))
onUnmounted(() => window.removeEventListener('swiftsite:unauthorized', unauthorized))
</script>

<template><RouterView /></template>
