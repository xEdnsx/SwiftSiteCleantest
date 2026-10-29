<script setup lang="ts">
import { agendaHoy, badgePedido, pedidos, usd } from '../data/muestras'

// TODO: reemplazar por datos reales de la API cuando existan los endpoints.
const pedidosHoy = 4
const porConfirmar = 3
const ingresosMes = 2340
const clientesNuevos = 12

const recientes = pedidos.slice(0, 5)
const colorAgenda = { aqua: 'border-aqua', gota: 'border-gota', sol: 'border-sol' } as const
</script>

<template>
  <section class="flex flex-col gap-7 max-w-7xl mx-auto">
    <!-- Encabezado -->
    <header class="flex items-start justify-between gap-4">
      <div>
        <h1 class="font-bricolage font-extrabold text-[40px] leading-none">Buen día</h1>
        <p class="mt-2 text-gris">Jueves 15 de octubre · Esto es lo de hoy.</p>
      </div>
      <RouterLink to="/pedidos" class="btn-primario !min-h-[52px]">+ Nuevo pedido</RouterLink>
    </header>

    <!-- Tarjetas KPI -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      <div class="card-brutal p-6">
        <p class="text-gris">Pedidos de hoy</p>
        <p class="font-bricolage font-extrabold text-[40px] leading-none mt-2">{{ pedidosHoy }}</p>
      </div>
      <div class="card-brutal p-6">
        <p class="text-gris">Por confirmar</p>
        <p class="font-bricolage font-extrabold text-[40px] leading-none mt-2">{{ porConfirmar }}</p>
      </div>
      <div class="rounded-[24px] border-2 border-tinta bg-tinta p-6 text-white">
        <p class="text-menu">Ingresos del mes</p>
        <p class="font-bricolage font-extrabold text-[40px] leading-none mt-2 text-cielo">${{ ingresosMes.toLocaleString('en-US') }}</p>
      </div>
      <div class="card-brutal p-6">
        <p class="text-gris">Clientes nuevos</p>
        <p class="font-bricolage font-extrabold text-[40px] leading-none mt-2">{{ clientesNuevos }}</p>
      </div>
    </div>

    <!-- Pedidos recientes + agenda -->
    <div class="grid grid-cols-1 xl:grid-cols-[1fr_348px] gap-7 items-start">
      <section class="card-brutal p-7">
        <div class="flex items-baseline justify-between mb-5">
          <h2 class="font-bricolage font-extrabold text-2xl">Pedidos recientes</h2>
          <RouterLink to="/pedidos" class="text-sm font-medium text-gota underline">Ver todos</RouterLink>
        </div>
        <div class="overflow-x-auto">
          <table class="tabla-brutal">
            <thead>
              <tr><th>N.º</th><th>Cliente</th><th>Servicio</th><th>Total</th><th>Estado</th></tr>
            </thead>
            <tbody>
              <tr v-for="p in recientes" :key="p.numero">
                <td>{{ p.numero }}</td>
                <td class="font-semibold">{{ p.cliente }}</td>
                <td>{{ p.servicio }}</td>
                <td>{{ usd(p.total) }}</td>
                <td><span :class="badgePedido[p.estado]">{{ p.estado }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="card-brutal p-7">
        <h2 class="font-bricolage font-extrabold text-2xl mb-5">Agenda de hoy</h2>
        <ul class="flex flex-col gap-3.5">
          <li v-for="cita in agendaHoy" :key="cita.hora" class="flex gap-4">
            <span class="w-12 shrink-0 font-bricolage font-extrabold text-lg pt-2">{{ cita.hora }}</span>
            <div class="flex-1 bg-hueso rounded-xl border-l-4 px-3.5 py-2.5" :class="colorAgenda[cita.color]">
              <p class="font-semibold">{{ cita.cliente }}</p>
              <p class="text-sm text-gris">{{ cita.detalle }}</p>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
