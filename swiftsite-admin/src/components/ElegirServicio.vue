<script setup lang="ts">
import IconoServicio from './IconoServicio.vue'
import { PLANTILLAS, plantillaYaExiste, type PlantillaServicio } from '../utils/servicios'

/**
 * Paso inicial del formulario de una categoría nueva: se toca el tipo de servicio y el formulario se llena solo.
 * «Otro servicio» deja todo en blanco para escribirlo a mano.
 */
const props = defineProps<{
  /** Plantilla elegida: la clave del ícono, 'otro' o '' si todavía no se eligió. */
  elegida: string
  /** Nombres de las categorías que ya existen, para marcar las que ya están creadas. */
  existentes: string[]
}>()
const emit = defineEmits<{ elegir: [plantilla: PlantillaServicio]; otro: [] }>()

const yaExiste = (p: PlantillaServicio) => plantillaYaExiste(p, props.existentes)
</script>

<template>
  <div>
    <span id="elegir-servicio" class="label-brutal">¿Qué servicio vas a agregar?</span>
    <p class="mt-0.5 text-xs text-gris">Toca uno y el formulario se llena solo. Después puedes cambiar lo que quieras.</p>
    <div class="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="elegir-servicio">
      <button
        v-for="p in PLANTILLAS"
        :key="p.clave"
        type="button"
        role="radio"
        :aria-checked="elegida === p.clave"
        :disabled="yaExiste(p)"
        class="flex min-h-[78px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 px-1 py-2 text-center text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45"
        :class="elegida === p.clave ? 'border-tinta bg-aqua-suave' : 'border-linea hover:border-tinta'"
        @click="emit('elegir', p)"
      >
        <IconoServicio :nombre="p.clave" :size="26" />
        <span>{{ p.nombre }}</span>
        <span v-if="yaExiste(p)" class="text-[11px] font-normal text-gris">Ya existe</span>
      </button>
      <button
        type="button"
        role="radio"
        :aria-checked="elegida === 'otro'"
        class="flex min-h-[78px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-1 py-2 text-center text-sm font-semibold transition-colors"
        :class="elegida === 'otro' ? 'border-tinta bg-aqua-suave' : 'border-linea hover:border-tinta'"
        @click="emit('otro')"
      >
        <span class="text-xl leading-none" aria-hidden="true">＋</span>
        <span>Otro servicio</span>
      </button>
    </div>
  </div>
</template>
