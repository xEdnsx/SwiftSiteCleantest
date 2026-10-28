import axios from 'axios'

export const tokenKey = 'swiftsite.admin.token'
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  timeout: 15000,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(tokenKey)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(undefined, (error) => {
  if (error.response?.status === 401) {
    sessionStorage.removeItem(tokenKey)
    window.dispatchEvent(new Event('swiftsite:unauthorized'))
  }
  return Promise.reject(error)
})

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const errors = error.response?.data?.errors as Record<string, string[]> | undefined
    if (errors) return Object.values(errors).flat().join(' ')
    if (error.response?.status === 429) return 'Demasiados intentos. Espera un minuto.'
    if (error.response?.status === 403) return 'No tienes permisos de administrador.'
    return error.response?.data?.message || 'No se pudo conectar con la API.'
  }
  return error instanceof Error ? error.message : 'Ocurrio un error inesperado.'
}
