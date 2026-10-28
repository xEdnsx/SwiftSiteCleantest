import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api, tokenKey } from '../services/api'

interface Usuario {
  id_usuario: number
  nombre: string
  correo: string
  rol: { nombre_rol: string }
}

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref<Usuario | null>(null)

  function clear() {
    sessionStorage.removeItem(tokenKey)
    usuario.value = null
  }

  function requireAdmin(user: Usuario) {
    if (user.rol?.nombre_rol !== 'Administrador') {
      throw new Error('Esta cuenta no tiene el rol Administrador.')
    }
    usuario.value = user
  }

  async function login(correo: string, password: string) {
    clear()
    const { data } = await api.post('/login', { correo, password, portal: 'administrador', device_name: 'swiftsite-admin' })
    sessionStorage.setItem(tokenKey, data.token)
    try {
      requireAdmin(data.usuario)
    } catch (error) {
      try { await api.post('/logout') } finally { clear() }
      throw error
    }
  }

  async function restore() {
    if (!sessionStorage.getItem(tokenKey)) { usuario.value = null; return }
    try {
      const { data } = await api.get<Usuario>('/me')
      requireAdmin(data)
    } catch (error) {
      clear()
      throw error
    }
  }

  async function logout() {
    await api.post('/logout')
    clear()
  }

  return { usuario, clear, login, restore, logout }
})
