import { onBeforeUnmount, ref } from 'vue'

/** Aviso corto que desaparece solo (ver AvisoToast.vue para mostrarlo). */
export function useAviso(duracionMs = 3500) {
  const mensaje = ref('')
  let temporizador: ReturnType<typeof setTimeout> | undefined

  function avisar(texto: string) {
    mensaje.value = texto
    clearTimeout(temporizador)
    temporizador = setTimeout(() => {
      mensaje.value = ''
    }, duracionMs)
  }
  onBeforeUnmount(() => clearTimeout(temporizador))

  return { mensaje, avisar }
}
