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

<style>
* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; color: #17332e; background: #f2f7f5; }
main { max-width: 1100px; margin: 0 auto; padding: 2rem; }
header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
h1 { margin: .5rem 0; }
nav { display: flex; flex-wrap: wrap; gap: .75rem; margin: 2rem 0; }
button { cursor: pointer; padding: .75rem 1rem; border: 1px solid #176451; border-radius: .5rem; background: white; color: #176451; font: inherit; }
button[aria-pressed=true], form button { background: #176451; color: white; }
button:disabled { opacity: .6; cursor: wait; }
.login { display: grid; min-height: 100vh; place-items: center; }
form { width: 100%; max-width: 420px; background: white; border-radius: 1rem; padding: 2rem; }
label { display: block; margin: 1.25rem 0; }
input { display: block; width: 100%; padding: .75rem; margin-top: .5rem; border: 1px solid #9cb5ad; border-radius: .4rem; font: inherit; }
.error { color: #a12222; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; background: white; }
th, td { text-align: left; padding: 1rem; border-bottom: 1px solid #dce7e1; }
</style>
