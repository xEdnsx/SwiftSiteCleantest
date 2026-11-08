import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '../services/api'

export interface Pendientes {
  pedidos_por_confirmar: number
  reportes_abiertos: number
  valoraciones_pendientes: number
}

const VACIO: Pendientes = { pedidos_por_confirmar: 0, reportes_abiertos: 0, valoraciones_pendientes: 0 }

/**
 * Cuántas cosas esperan al equipo (pedidos por confirmar, reportes abiertos, valoraciones por revisar).
 * Lo usan el menú lateral (globos) y el inicio. Se refresca cada 30 s mientras el panel está abierto.
 */
export const usePendientesStore = defineStore('pendientes', () => {
  const datos = ref<Pendientes>({ ...VACIO })
  const cargado = ref(false)
  let temporizador: ReturnType<typeof setInterval> | undefined

  const total = computed(() => datos.value.pedidos_por_confirmar + datos.value.reportes_abiertos + datos.value.valoraciones_pendientes)

  async function refrescar() {
    try {
      const { data } = await api.get<Pendientes>('/admin/pendientes')
      datos.value = { ...VACIO, ...data }
      cargado.value = true
    } catch {
      // Un fallo de red no debe molestar: se conserva el último número conocido.
    }
  }

  function iniciar() {
    if (temporizador) return
    void refrescar()
    temporizador = setInterval(() => { if (!document.hidden) void refrescar() }, 30000)
  }

  function detener() {
    clearInterval(temporizador)
    temporizador = undefined
    datos.value = { ...VACIO }
    cargado.value = false
  }

  return { datos, cargado, total, refrescar, iniciar, detener }
})
