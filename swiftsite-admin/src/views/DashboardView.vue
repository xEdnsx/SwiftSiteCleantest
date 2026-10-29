<script setup lang="ts">
const pedidosHoy = 4
const porConfirmar = 3
const ingresosMes = 2340
const clientesNuevos = 12
</script>

<template>
  <section class="flex flex-col gap-8 max-w-7xl mx-auto">
    
    <!-- Encabezado -->
    <div>
      <h2 class="font-bricolage font-bold text-2xl text-tinta">Buen día</h2>
      <p class="text-tinta/74 font-inter">Jueves 15 de octubre · Esto es lo de hoy.</p>
    </div>

    <!-- Tarjetas KPI -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      
      <div class="bg-aqua border-[2.5px] border-tinta rounded-[20px] p-6 flex flex-col justify-between shadow-[4px_4px_0px_0px_#0B1F3A]">
        <p class="font-inter text-sm font-medium text-tinta/74">Pedidos de hoy</p>
        <p class="font-bricolage font-bold text-4xl mt-4 text-tinta">{{ pedidosHoy }}</p>
      </div>

      <div class="bg-white border-[2.5px] border-tinta rounded-[20px] p-6 flex flex-col justify-between">
        <p class="font-inter text-sm font-medium text-tinta/74">Por confirmar</p>
        <p class="font-bricolage font-bold text-4xl mt-4 text-tinta">{{ porConfirmar }}</p>
      </div>

      <div class="bg-white border-[2.5px] border-tinta rounded-[20px] p-6 flex flex-col justify-between">
        <p class="font-inter text-sm font-medium text-tinta/74">Ingresos del mes</p>
        <p class="font-bricolage font-bold text-4xl mt-4 text-tinta">${{ ingresosMes }}</p>
      </div>

      <div class="bg-white border-[2.5px] border-tinta rounded-[20px] p-6 flex flex-col justify-between">
        <p class="font-inter text-sm font-medium text-tinta/74">Clientes nuevos</p>
        <p class="font-bricolage font-bold text-4xl mt-4 text-tinta">{{ clientesNuevos }}</p>
      </div>

    </div>

    <!-- Sección inferior -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Tabla de Pedidos Recientes -->
      <div class="lg:col-span-2 bg-white border-[2.5px] border-tinta rounded-[20px] overflow-hidden flex flex-col">
        <div class="p-6 border-b-2 border-tinta flex justify-between items-center bg-hueso">
          <h3 class="font-bricolage font-bold text-lg">Pedidos recientes</h3>
          <RouterLink to="/pedidos" class="text-sm font-medium text-gota hover:text-gota-profunda">Ver todos</RouterLink>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left font-inter text-sm">
            <thead class="bg-white border-b-2 border-tinta text-tinta/74 font-semibold">
              <tr>
                <th class="p-4">N.º</th>
                <th class="p-4">Cliente</th>
                <th class="p-4">Servicio</th>
                <th class="p-4">Total</th>
                <th class="p-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-tinta/10 hover:bg-hueso transition-colors">
                <td class="p-4 font-medium">#0047</td>
                <td class="p-4">María Hernández</td>
                <td class="p-4">Sillas x6</td>
                <td class="p-4 font-medium">$48.00</td>
                <td class="p-4"><span class="badge-proceso">En proceso</span></td>
              </tr>
              <tr class="border-b border-tinta/10 hover:bg-hueso transition-colors">
                <td class="p-4 font-medium">#0045</td>
                <td class="p-4">Carlos Rivas</td>
                <td class="p-4">Colchón matrimonial</td>
                <td class="p-4 font-medium">$35.00</td>
                <td class="p-4"><span class="badge-confirmado">Confirmado</span></td>
              </tr>
              <tr class="hover:bg-hueso transition-colors">
                <td class="p-4 font-medium">#0042</td>
                <td class="p-4">Ana Martínez</td>
                <td class="p-4">Sofá 3 puestos x2, butaca</td>
                <td class="p-4 font-medium">$120.00</td>
                <td class="p-4"><span class="badge-cotizado">Cotizado</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Agenda del Día -->
      <div class="bg-white border-[2.5px] border-tinta rounded-[20px] flex flex-col">
        <div class="p-6 border-b-2 border-tinta bg-hueso">
          <h3 class="font-bricolage font-bold text-lg">Agenda de hoy</h3>
        </div>
        <div class="p-6 flex-1 flex flex-col gap-4">
          
          <div class="flex gap-4">
            <span class="font-bold text-sm w-12 pt-1">7:30</span>
            <div class="flex-1 bg-hueso border border-tinta/20 rounded-xl p-3">
              <p class="font-semibold text-sm">Luis Portillo</p>
              <p class="text-xs text-tinta/74">Baño completo · Nuevo Cuscatlán</p>
            </div>
          </div>

          <div class="flex gap-4">
            <span class="font-bold text-sm w-12 pt-1">10:00</span>
            <div class="flex-1 bg-aqua-suave border border-gota rounded-xl p-3">
              <p class="font-semibold text-sm text-gota-profunda">Carlos Rivas</p>
              <p class="text-xs text-gota/80">Colchón matrimonial · Por confirmar</p>
            </div>
          </div>

          <div class="flex gap-4">
            <span class="font-bold text-sm w-12 pt-1">1:00</span>
            <div class="flex-1 border-2 border-dashed border-tinta/20 rounded-xl p-3 flex items-center justify-center text-tinta/40 text-sm font-medium">
              Espacio libre
            </div>
          </div>

        </div>
      </div>

    </div>
  </section>
</template>